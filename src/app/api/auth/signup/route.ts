import { supabaseAdmin } from "@/lib/supabase/server";
import { PLAN_TOKEN_LIMITS } from "@/lib/stripe";

export async function POST(request: Request) {
  const { email, password, full_name, plan } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, plan },
  });

  if (error || !data.user) {
    // Mensagem sempre genérica — nunca confirmar se o e-mail já está
    // cadastrado (evita enumeração de contas), independente da causa real.
    return Response.json({ error: "Não foi possível criar a conta. Verifique os dados." }, { status: 400 });
  }

  // Assinante self-service vira admin do próprio tenant (workspace de uma
  // pessoa só) — mesmo modelo multi-tenant usado no provisionamento manual
  // via super-admin, só que criado automaticamente aqui.
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({
      name: full_name || email,
      plan: plan || "professional",
      token_limit: PLAN_TOKEN_LIMITS[plan] ?? PLAN_TOKEN_LIMITS.professional,
      status: "active",
    })
    .select("id")
    .single();

  if (tenantError || !tenant) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    return Response.json({ error: "Não foi possível criar a conta. Verifique os dados." }, { status: 500 });
  }

  const { error: profileError } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id: data.user.id,
        tenant_id: tenant.id,
        email,
        full_name: full_name || null,
        role: "admin",
        status: "active",
      },
      { onConflict: "id" }
    );

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    return Response.json({ error: "Não foi possível criar a conta. Verifique os dados." }, { status: 500 });
  }

  return Response.json({ user: data.user });
}
