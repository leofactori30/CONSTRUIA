// SQL para rodar no Supabase (SQL editor) antes de usar esta rota:
//
// CREATE TABLE IF NOT EXISTS tenants (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   name TEXT NOT NULL,
//   slug TEXT UNIQUE NOT NULL,
//   cnpj TEXT,
//   plan TEXT NOT NULL DEFAULT 'professional',
//   token_limit INTEGER NOT NULL DEFAULT 150000,
//   logo_url TEXT,
//   status TEXT NOT NULL DEFAULT 'active',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS invite_tokens (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   tenant_id UUID REFERENCES tenants(id),
//   email TEXT NOT NULL,
//   role TEXT DEFAULT 'admin',
//   token TEXT UNIQUE NOT NULL,
//   used BOOLEAN DEFAULT FALSE,
//   expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// Opcional, recomendado: se `users.tenant_id` ainda não referencia `tenants`,
// considere adicionar a FK depois de popular `tenants` com os tenants já
// existentes (todo tenant_id hoje solto em `users` precisa de uma linha
// correspondente em `tenants` antes de criar a constraint).

import { supabaseAdmin } from "@/lib/supabase/server";
import { getSuperAdminUser } from "@/lib/super-admin";
import { createAndSendInvite } from "@/lib/invite";

export async function POST(request: Request) {
  const superAdmin = await getSuperAdminUser(request);
  if (!superAdmin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { name, cnpj, admin_email, plan, token_limit, logo_url } = await request.json();

  if (!name || !admin_email || !["professional", "enterprise"].includes(plan)) {
    return Response.json({ error: "Nome, e-mail do admin e plano (professional/enterprise) são obrigatórios." }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]/g, "-") // substitui especiais por -
    .replace(/-+/g, "-") // remove hífens duplos
    .replace(/^-|-$/g, "") // remove hífens nas bordas
    + "-" + Date.now(); // garante unicidade

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      name,
      slug,
      cnpj: cnpj || null,
      plan,
      token_limit: Number.isFinite(token_limit) && token_limit > 0 ? token_limit : 150_000,
      logo_url: logo_url || null,
      status: "active",
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    return Response.json({ error: tenantError?.message ?? "Não foi possível criar o tenant." }, { status: 500 });
  }

  const inviteResult = await createAndSendInvite({
    tenantId: tenant.id,
    tenantName: name,
    email: admin_email,
    role: "admin",
  });

  if ("error" in inviteResult) {
    return Response.json({ error: `Tenant criado, mas o convite falhou: ${inviteResult.error}` }, { status: 502 });
  }

  return Response.json({
    tenant_id: tenant.id,
    invite_url: inviteResult.inviteUrl,
    email_warning: inviteResult.emailError ? "Tenant e convite criados, mas o e-mail não pôde ser enviado. Copie o link manualmente." : undefined,
  });
}
