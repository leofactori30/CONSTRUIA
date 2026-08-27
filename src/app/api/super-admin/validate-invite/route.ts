import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyInviteTokenSignature } from "@/lib/invite-token";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token || !verifyInviteTokenSignature(token)) {
    return Response.json({ valid: false });
  }

  const { data: invite, error } = await supabaseAdmin
    .from("invite_tokens")
    .select("tenant_id, email, used, expires_at")
    .eq("token", token)
    .single();

  if (error || !invite || invite.used) {
    return Response.json({ valid: false });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return Response.json({ valid: false });
  }

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("name")
    .eq("id", invite.tenant_id)
    .single();

  return Response.json({
    valid: true,
    tenant_name: tenant?.name ?? "",
    email: invite.email,
  });
}
