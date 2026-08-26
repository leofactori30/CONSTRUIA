import { randomBytes, randomUUID } from "crypto";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function getInvitingAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return profile as { role: string; tenant_id: string };
}

export async function POST(request: Request) {
  const admin = await getInvitingAdmin(request);
  if (!admin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { email, role } = await request.json();

  if (!email || !["user", "admin"].includes(role)) {
    return Response.json({ error: "E-mail e role (user/admin) são obrigatórios." }, { status: 400 });
  }

  const tempPassword = randomBytes(16).toString("hex");

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role, tenant_id: admin.tenant_id },
  });

  if (createError || !created.user) {
    return Response.json({ error: createError?.message ?? "Não foi possível criar o usuário." }, { status: 400 });
  }

  const inviteToken = randomUUID();
  const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    id: created.user.id,
    tenant_id: admin.tenant_id,
    email,
    role,
    status: "pending",
    invite_token: inviteToken,
    invite_expires_at: inviteExpiresAt,
  });

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/aceitar-convite?token=${inviteToken}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Você foi convidado para a Constru.IA",
      html: `
        <p>Você foi convidado para acessar a Constru.IA.</p>
        <p><a href="${inviteUrl}">Clique aqui para definir sua senha e acessar sua conta</a>.</p>
        <p>Este link expira em 7 dias.</p>
      `,
    });
  } catch {
    return Response.json({ error: "Usuário criado, mas houve falha ao enviar o e-mail de convite." }, { status: 502 });
  }

  return Response.json({ success: true });
}
