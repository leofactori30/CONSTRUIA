import { supabaseAdmin } from "@/lib/supabase/server";
import { createAndSendInvite } from "@/lib/invite";

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

// Convite de colega para o próprio tenant — usa o mesmo sistema de
// invite_tokens do painel de super-admin. O usuário só é criado (Auth +
// public.users) quando o convite é aceito em /api/super-admin/accept-invite,
// não no momento do envio.
export async function POST(request: Request) {
  const admin = await getInvitingAdmin(request);
  if (!admin) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { email, role } = await request.json();

  if (!email || !["user", "admin"].includes(role)) {
    return Response.json({ error: "E-mail e role (user/admin) são obrigatórios." }, { status: 400 });
  }

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("name")
    .eq("id", admin.tenant_id)
    .single();

  const inviteResult = await createAndSendInvite({
    tenantId: admin.tenant_id,
    tenantName: tenant?.name ?? "sua empresa",
    email,
    role,
  });

  if ("error" in inviteResult) {
    return Response.json({ error: inviteResult.error }, { status: 500 });
  }

  if (inviteResult.emailError) {
    return Response.json({ error: "Convite criado, mas houve falha ao enviar o e-mail." }, { status: 502 });
  }

  return Response.json({ success: true });
}
