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

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const { data: publicDocs, error: publicError } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("tema", { ascending: true })
    .order("name", { ascending: true });

  if (publicError) {
    return Response.json({ error: "Erro ao buscar documentos públicos." }, { status: 500 });
  }

  const { data: internalDocs, error: internalError } = profile?.tenant_id
    ? await supabaseAdmin
        .from("documents")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("is_active", true)
        .order("tema", { ascending: true })
        .order("name", { ascending: true })
    : { data: [], error: null };

  if (internalError) {
    return Response.json({ error: "Erro ao buscar documentos internos." }, { status: 500 });
  }

  return Response.json({
    public_docs: publicDocs ?? [],
    internal_docs: internalDocs ?? [],
  });
}
