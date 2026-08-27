import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateInviteToken } from "@/lib/invite-token";

const resend = new Resend(process.env.RESEND_API_KEY);
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Lógica de convite compartilhada entre o super-admin (criando o admin
// fundador de um tenant novo ou re-convidando para um tenant existente) e o
// admin de tenant (convidando colegas para a própria empresa) — um único
// sistema de token em invite_tokens para os dois casos.
export async function createAndSendInvite({
  tenantId,
  tenantName,
  email,
  role,
}: {
  tenantId: string;
  tenantName: string;
  email: string;
  role: "admin" | "user";
}): Promise<{ inviteUrl: string; emailError?: true } | { error: string }> {
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  const { error: insertError } = await supabaseAdmin.from("invite_tokens").insert({
    tenant_id: tenantId,
    email,
    role,
    token,
    expires_at: expiresAt,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/aceitar-convite?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Você foi convidado para a ${tenantName} na Constru.IA`,
      html: `
        <p>Você foi convidado para acessar a Constru.IA como parte de <strong>${tenantName}</strong>.</p>
        <p><a href="${inviteUrl}">Clique aqui para definir sua senha e acessar sua conta</a>.</p>
        <p>Este link expira em 7 dias.</p>
      `,
    });
  } catch {
    return { inviteUrl, emailError: true };
  }

  return { inviteUrl };
}
