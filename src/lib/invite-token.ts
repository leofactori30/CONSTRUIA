import { randomUUID, createHmac } from "crypto";
import { safeCompare } from "@/lib/crypto";

// Token de convite = uuid + timestamp assinados com HMAC-SHA256, usando a
// service role key como segredo (já é um valor server-only de alta entropia,
// então evitamos exigir mais uma variável de ambiente nova). O formato é
// "uuid.timestamp.assinatura" — a assinatura garante que o token não foi
// forjado/adulterado; expiração e uso continuam sendo controlados pelas
// colunas `expires_at`/`used` da tabela invite_tokens, não pelo timestamp
// embutido no token.
function signingSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  return secret;
}

export function generateInviteToken(): string {
  const uuid = randomUUID();
  const timestamp = Date.now().toString();
  const payload = `${uuid}.${timestamp}`;
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyInviteTokenSignature(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [uuid, timestamp, signature] = parts;
  const payload = `${uuid}.${timestamp}`;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("hex");

  return safeCompare(signature, expected);
}
