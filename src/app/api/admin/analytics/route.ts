import { supabaseAdmin } from "@/lib/supabase/server";
import { PLAN_TOKEN_LIMITS } from "@/lib/stripe";
import { themeLabel } from "@/lib/themes";

const INPUT_PRICE_PER_1K = 0.018;
const OUTPUT_PRICE_PER_1K = 0.09;
const MRR_PER_USER = 29.90;

type Period = "today" | "7d" | "30d" | "90d";

function periodToSince(period: Period): Date {
  const now = new Date();
  const start = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  start.setDate(start.getDate() - days);
  return start;
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

async function getAdminProfile(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, role, tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return profile as { id: string; role: string; tenant_id: string };
}

export async function GET(request: Request) {
  const admin = await getAdminProfile(request);
  if (!admin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const url = new URL(request.url);
  const periodParam = (url.searchParams.get("period") as Period) || "30d";
  const period: Period = ["today", "7d", "30d", "90d"].includes(periodParam) ? periodParam : "30d";
  const since = periodToSince(period);

  // ─── Usuários do tenant ──────────────────────────────────
  const { data: tenantUsers, error: usersError } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, role, status")
    .eq("tenant_id", admin.tenant_id);

  if (usersError || !tenantUsers) {
    return Response.json({ error: "Erro ao buscar usuários do tenant." }, { status: 500 });
  }

  const userIds = tenantUsers.map(u => u.id);

  // Plano de cada usuário vive no user_metadata do Supabase Auth, não na tabela `users`.
  const plansByUser = new Map<string, string>();
  await Promise.all(
    tenantUsers.map(async u => {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(u.id);
        plansByUser.set(u.id, data.user?.user_metadata?.plan || "professional");
      } catch {
        plansByUser.set(u.id, "professional");
      }
    })
  );

  // ─── Consumo de tokens (tabela token_usage) ──────────────
  // Tabela ainda não é escrita por nenhum fluxo do app hoje; se ela não existir
  // ou a query falhar, degradamos para "sem dados" em vez de derrubar a rota.
  type TokenRow = { user_id: string; input_tokens: number; output_tokens: number; created_at: string; period_year?: number; period_month?: number };
  let tokenRows: TokenRow[] = [];
  let tokenRowsAllTime: TokenRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("token_usage")
      .select("user_id, input_tokens, output_tokens, created_at, period_year, period_month")
      .in("user_id", userIds.length ? userIds : ["__none__"])
      .gte("created_at", since.toISOString());
    if (!error && data) tokenRows = data as TokenRow[];
  } catch {
    tokenRows = [];
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  try {
    const { data, error } = await supabaseAdmin
      .from("token_usage")
      .select("user_id, input_tokens, output_tokens, created_at, period_year, period_month")
      .in("user_id", userIds.length ? userIds : ["__none__"])
      .gte("created_at", monthStart);
    if (!error && data) tokenRowsAllTime = data as TokenRow[];
  } catch {
    tokenRowsAllTime = [];
  }

  // ─── Mensagens (tabela chat_messages) ─────────────────────
  type MessageRow = { user_id: string; tema: string | null; role?: string; created_at: string };
  let messageRows: MessageRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("user_id, tema, role, created_at")
      .in("user_id", userIds.length ? userIds : ["__none__"])
      .gte("created_at", since.toISOString());
    if (!error && data) messageRows = data as MessageRow[];
  } catch {
    messageRows = [];
  }

  // ─── Métricas principais ──────────────────────────────────
  const totalUsers = tenantUsers.length;

  const activeUserIds = new Set<string>();
  tokenRows.forEach(r => activeUserIds.add(r.user_id));
  messageRows.forEach(r => activeUserIds.add(r.user_id));

  const totalInputTokens = tokenRows.reduce((sum, r) => sum + (r.input_tokens || 0), 0);
  const totalOutputTokens = tokenRows.reduce((sum, r) => sum + (r.output_tokens || 0), 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const totalCost = (totalInputTokens / 1000) * INPUT_PRICE_PER_1K + (totalOutputTokens / 1000) * OUTPUT_PRICE_PER_1K;

  const userMessages = messageRows.filter(r => !r.role || r.role === "user");
  const totalMessages = userMessages.length;

  const mrrEstimate = totalUsers * MRR_PER_USER;

  // ─── Série diária para o gráfico de barras ────────────────
  const dailyMap = new Map<string, { input: number; output: number }>();
  tokenRows.forEach(r => {
    const key = dayKey(r.created_at);
    const entry = dailyMap.get(key) || { input: 0, output: 0 };
    entry.input += r.input_tokens || 0;
    entry.output += r.output_tokens || 0;
    dailyMap.set(key, entry);
  });
  const dailySeries = Array.from(dailyMap.entries())
    .map(([date, v]) => ({ date, input_tokens: v.input, output_tokens: v.output }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ─── Contagem por tema ─────────────────────────────────────
  const temaCountMap = new Map<string, number>();
  messageRows.forEach(r => {
    const key = r.tema || "outros";
    temaCountMap.set(key, (temaCountMap.get(key) || 0) + 1);
  });
  const temaCounts = Array.from(temaCountMap.entries())
    .map(([tema, count]) => ({ tema, ...themeLabel(tema), count }))
    .sort((a, b) => b.count - a.count);

  // ─── Tabela de usuários (consumo do mês corrente) ─────────
  const usersTable = tenantUsers.map(u => {
    const plan = plansByUser.get(u.id) || "professional";
    const limit = PLAN_TOKEN_LIMITS[plan] ?? PLAN_TOKEN_LIMITS.professional;

    const rows = tokenRowsAllTime.filter(r => r.user_id === u.id);
    const input = rows.reduce((s, r) => s + (r.input_tokens || 0), 0);
    const output = rows.reduce((s, r) => s + (r.output_tokens || 0), 0);
    const used = input + output;
    const cost = (input / 1000) * INPUT_PRICE_PER_1K + (output / 1000) * OUTPUT_PRICE_PER_1K;
    const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;

    const lastMsg = messageRows
      .filter(r => r.user_id === u.id)
      .map(r => r.created_at)
      .sort()
      .at(-1);
    const lastUsage = rows.map(r => r.created_at).sort().at(-1);
    const lastActivity = [lastMsg, lastUsage].filter(Boolean).sort().at(-1) ?? null;

    return {
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
      role: u.role,
      status: u.status,
      plan,
      tokens_used: used,
      cost,
      pct_of_limit: pct,
      last_activity: lastActivity,
    };
  });

  // ─── Alertas ────────────────────────────────────────────────
  const over80 = usersTable.filter(u => u.pct_of_limit >= 80 && u.pct_of_limit < 100);
  const overLimit = usersTable.filter(u => u.pct_of_limit >= 100);

  return Response.json({
    period,
    metrics: {
      total_users: totalUsers,
      active_users: activeUserIds.size,
      total_tokens: totalTokens,
      total_cost: totalCost,
      total_messages: totalMessages,
      mrr_estimate: mrrEstimate,
    },
    daily_series: dailySeries,
    tema_counts: temaCounts,
    users_table: usersTable,
    alerts: {
      over_80_percent: over80,
      over_limit: overLimit,
      recent_errors: [] as { message: string; created_at: string }[],
    },
  });
}
