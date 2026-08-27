import { supabaseAdmin } from "@/lib/supabase/server";
import { safeCompare } from "@/lib/crypto";

export async function POST(request: Request) {
  const { token, full_name, password } = await request.json();

  if (!token || !full_name || !password) {
    return Response.json({ error: "Dados incompletos." }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  // O token nunca é usado como filtro de igualdade na query: uma cláusula
  // WHERE por igualdade permitiria uma consulta indexada que expõe o
  // formato do valor buscado. Em vez disso, buscamos os convites pendentes
  // candidatos e comparamos o token em memória com safeCompare (tempo
  // constante), evitando qualquer comparação direta de string sensível.
  const { data: pendingInvites, error: lookupError } = await supabaseAdmin
    .from("users")
    .select("id, email, status, invite_token, invite_expires_at")
    .eq("status", "pending")
    .not("invite_token", "is", null);

  const invitedUser = lookupError
    ? null
    : pendingInvites?.find(u => typeof u.invite_token === "string" && safeCompare(u.invite_token, token));

  if (!invitedUser) {
    return Response.json({ error: "Convite inválido ou já utilizado." }, { status: 400 });
  }

  if (invitedUser.invite_expires_at && new Date(invitedUser.invite_expires_at) < new Date()) {
    return Response.json({ error: "Convite expirado." }, { status: 400 });
  }

  const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(invitedUser.id, {
    password,
    user_metadata: { full_name },
  });

  if (updateAuthError) {
    return Response.json({ error: updateAuthError.message }, { status: 400 });
  }

  const { error: updateProfileError } = await supabaseAdmin
    .from("users")
    .update({ full_name, status: "active", invite_token: null, invite_expires_at: null })
    .eq("id", invitedUser.id);

  if (updateProfileError) {
    return Response.json({ error: updateProfileError.message }, { status: 500 });
  }

  return Response.json({ success: true, email: invitedUser.email });
}
