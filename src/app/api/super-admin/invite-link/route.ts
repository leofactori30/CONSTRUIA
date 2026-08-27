import { supabaseAdmin } from "@/lib/supabase/server";
import { getSuperAdminUser } from "@/lib/super-admin";
import { createAndSendInvite } from "@/lib/invite";

// Gera (e envia) um novo link de convite para um tenant já existente —
// usado pelo botão "Gerar link de convite" no painel de super-admin.
export async function POST(request: Request) {
  const superAdmin = await getSuperAdminUser(request);
  if (!superAdmin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { tenant_id, email, role } = await request.json();

  if (!tenant_id || !email) {
    return Response.json({ error: "Informe tenant_id e email." }, { status: 400 });
  }

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .select("id, name")
    .eq("id", tenant_id)
    .single();

  if (tenantError || !tenant) {
    return Response.json({ error: "Tenant não encontrado." }, { status: 404 });
  }

  const inviteResult = await createAndSendInvite({
    tenantId: tenant.id,
    tenantName: tenant.name,
    email,
    role: role === "user" ? "user" : "admin",
  });

  if ("error" in inviteResult) {
    return Response.json({ error: inviteResult.error }, { status: 500 });
  }

  return Response.json({
    invite_url: inviteResult.inviteUrl,
    email_warning: inviteResult.emailError ? "Convite criado, mas o e-mail não pôde ser enviado. Copie o link manualmente." : undefined,
  });
}
