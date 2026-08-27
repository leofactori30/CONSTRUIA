import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyInviteTokenSignature } from "@/lib/invite-token";

export async function POST(request: Request) {
  const { token, full_name, password } = await request.json();

  if (!token || !full_name || !password) {
    return Response.json({ error: "Dados incompletos." }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  if (!verifyInviteTokenSignature(token)) {
    return Response.json({ error: "Convite inválido ou já utilizado." }, { status: 400 });
  }

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("invite_tokens")
    .select("id, tenant_id, email, role, used, expires_at")
    .eq("token", token)
    .single();

  if (inviteError || !invite || invite.used) {
    return Response.json({ error: "Convite inválido ou já utilizado." }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return Response.json({ error: "Convite expirado." }, { status: 400 });
  }

  const { data: created, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createAuthError || !created.user) {
    return Response.json({ error: createAuthError?.message ?? "Não foi possível criar o usuário." }, { status: 400 });
  }

  const { error: profileError } = await supabaseAdmin.from("users").insert({
    id: created.user.id,
    tenant_id: invite.tenant_id,
    email: invite.email,
    full_name,
    role: invite.role || "admin",
    status: "active",
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const { error: markUsedError } = await supabaseAdmin
    .from("invite_tokens")
    .update({ used: true })
    .eq("id", invite.id);

  if (markUsedError) {
    // Usuário já foi criado com sucesso; não é motivo para falhar a resposta,
    // mas registramos para investigação (o token pode ser reutilizável até isso ser corrigido).
    console.error("Falha ao marcar invite_tokens.used:", markUsedError.message);
  }

  return Response.json({ success: true, email: invite.email });
}
