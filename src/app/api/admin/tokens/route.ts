import { supabaseAdmin } from "@/lib/supabase/server";

async function getAdminProfile(request: Request) {
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

// Adiciona tokens manualmente a um usuário do tenant, gravando um ajuste em token_usage.
export async function POST(request: Request) {
  const admin = await getAdminProfile(request);
  if (!admin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { user_id, amount } = await request.json();

  if (!user_id || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Informe user_id e uma quantidade de tokens positiva." }, { status: 400 });
  }

  const { data: targetUser, error: targetError } = await supabaseAdmin
    .from("users")
    .select("id, tenant_id")
    .eq("id", user_id)
    .single();

  if (targetError || !targetUser || targetUser.tenant_id !== admin.tenant_id) {
    return Response.json({ error: "Usuário não encontrado nesta empresa." }, { status: 404 });
  }

  // Crédito manual: gravado como consumo negativo, reduzindo o total computado
  // no mês corrente e liberando mais margem dentro do limite do plano.
  const now = new Date();
  const { error: insertError } = await supabaseAdmin.from("token_usage").insert({
    user_id,
    input_tokens: -amount,
    output_tokens: 0,
    created_at: now.toISOString(),
    period_year: now.getFullYear(),
    period_month: now.getMonth() + 1,
  });

  if (insertError) {
    return Response.json({ error: `Não foi possível registrar o ajuste: ${insertError.message}` }, { status: 500 });
  }

  return Response.json({ success: true });
}
