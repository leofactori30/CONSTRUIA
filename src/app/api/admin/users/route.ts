import { supabaseAdmin } from "@/lib/supabase/server";

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

// Suspende ou reativa um usuário do tenant (alterna entre "active" e "suspended").
export async function PATCH(request: Request) {
  const admin = await getAdminProfile(request);
  if (!admin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { user_id, action } = await request.json();

  if (!user_id || !["suspend", "reactivate"].includes(action)) {
    return Response.json({ error: "Informe user_id e action (suspend/reactivate)." }, { status: 400 });
  }

  if (user_id === admin.id) {
    return Response.json({ error: "Você não pode suspender a própria conta." }, { status: 400 });
  }

  const { data: targetUser, error: targetError } = await supabaseAdmin
    .from("users")
    .select("id, tenant_id, status")
    .eq("id", user_id)
    .single();

  if (targetError || !targetUser || targetUser.tenant_id !== admin.tenant_id) {
    return Response.json({ error: "Usuário não encontrado nesta empresa." }, { status: 404 });
  }

  if (targetUser.status === "pending") {
    return Response.json({ error: "Usuário ainda não aceitou o convite." }, { status: 400 });
  }

  const newStatus = action === "suspend" ? "suspended" : "active";

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ status: newStatus })
    .eq("id", user_id);

  if (updateError) {
    return Response.json({ error: `Não foi possível atualizar o status: ${updateError.message}` }, { status: 500 });
  }

  return Response.json({ success: true, status: newStatus });
}
