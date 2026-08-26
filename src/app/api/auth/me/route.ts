import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return Response.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id, email, role, tenant_id, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return Response.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  return Response.json(profile);
}
