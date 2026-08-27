import { supabaseAdmin } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// Único mecanismo de acesso ao painel de super-admin: o e-mail autenticado
// deve bater com SUPER_ADMIN_EMAIL. Isto é deliberadamente separado do role
// "admin" da tabela `users` (que é por tenant) — nenhum admin de empresa
// cliente deve enxergar dados de outras empresas.
export async function getSuperAdminUser(request: Request): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const superEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superEmail) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user || !user.email) return null;

  if (user.email.toLowerCase() !== superEmail.toLowerCase()) return null;

  return user;
}
