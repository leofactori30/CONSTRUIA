import { supabaseAdmin } from "@/lib/supabase/server";
import { getSuperAdminUser } from "@/lib/super-admin";

const INPUT_PRICE_PER_1K = 0.018;
const OUTPUT_PRICE_PER_1K = 0.09;

// Lista todos os tenants com métricas agregadas. O join equivalente ao SQL do
// briefing (users + token_usage) é feito em memória, porque `token_usage` só
// tem `user_id` hoje — não tem `tenant_id` nem `cost_brl` próprios em nenhum
// outro lugar do código, então o custo é recalculado com a mesma fórmula
// usada no restante do app (R$0,018/1k input + R$0,09/1k output).
export async function GET(request: Request) {
  const superAdmin = await getSuperAdminUser(request);
  if (!superAdmin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { data: tenants, error: tenantsError } = await supabaseAdmin
    .from("tenants")
    .select("id, name, cnpj, plan, token_limit, logo_url, status, created_at")
    .order("created_at", { ascending: false });

  if (tenantsError || !tenants) {
    return Response.json({ error: tenantsError?.message ?? "Erro ao buscar tenants." }, { status: 500 });
  }

  const { data: users } = await supabaseAdmin.from("users").select("id, tenant_id");

  const tenantIdByUser = new Map<string, string>();
  const userCountByTenant = new Map<string, number>();
  (users ?? []).forEach(u => {
    if (!u.tenant_id) return;
    tenantIdByUser.set(u.id, u.tenant_id);
    userCountByTenant.set(u.tenant_id, (userCountByTenant.get(u.tenant_id) || 0) + 1);
  });

  const allUserIds = Array.from(tenantIdByUser.keys());
  type TokenRow = { user_id: string; input_tokens: number; output_tokens: number };
  let tokenRows: TokenRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("token_usage")
      .select("user_id, input_tokens, output_tokens")
      .in("user_id", allUserIds.length ? allUserIds : ["__none__"]);
    if (!error && data) tokenRows = data as TokenRow[];
  } catch {
    tokenRows = [];
  }

  const tokensByTenant = new Map<string, { input: number; output: number }>();
  tokenRows.forEach(r => {
    const tenantId = tenantIdByUser.get(r.user_id);
    if (!tenantId) return;
    const entry = tokensByTenant.get(tenantId) || { input: 0, output: 0 };
    entry.input += r.input_tokens || 0;
    entry.output += r.output_tokens || 0;
    tokensByTenant.set(tenantId, entry);
  });

  const result = tenants.map(t => {
    const usage = tokensByTenant.get(t.id) || { input: 0, output: 0 };
    const tokens_used = usage.input + usage.output;
    const cost_brl = (usage.input / 1000) * INPUT_PRICE_PER_1K + (usage.output / 1000) * OUTPUT_PRICE_PER_1K;
    return {
      ...t,
      user_count: userCountByTenant.get(t.id) || 0,
      tokens_used,
      cost_brl,
    };
  });

  return Response.json({ tenants: result });
}

// Suspende ou reativa um tenant.
export async function PATCH(request: Request) {
  const superAdmin = await getSuperAdminUser(request);
  if (!superAdmin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { tenant_id, action } = await request.json();

  if (!tenant_id || !["suspend", "reactivate"].includes(action)) {
    return Response.json({ error: "Informe tenant_id e action (suspend/reactivate)." }, { status: 400 });
  }

  const newStatus = action === "suspend" ? "suspended" : "active";

  const { error } = await supabaseAdmin.from("tenants").update({ status: newStatus }).eq("id", tenant_id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, status: newStatus });
}
