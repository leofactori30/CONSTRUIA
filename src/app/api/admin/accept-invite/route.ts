import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { token, full_name, password } = await request.json();

  if (!token || !full_name || !password) {
    return Response.json({ error: "Dados incompletos." }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const { data: invitedUser, error: lookupError } = await supabaseAdmin
    .from("users")
    .select("id, email, status, invite_expires_at")
    .eq("invite_token", token)
    .single();

  if (lookupError || !invitedUser || invitedUser.status !== "pending") {
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
