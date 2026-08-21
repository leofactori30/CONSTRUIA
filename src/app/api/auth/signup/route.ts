import { supabaseAdmin } from "@/lib/supabase/server";

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

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ user: data.user });
}
