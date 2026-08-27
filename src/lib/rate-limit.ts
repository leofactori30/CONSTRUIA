// Rate limiter em memória, reutilizável por qualquer rota. Escopo por processo:
// não é compartilhado entre múltiplas instâncias/regiões em produção serverless,
// mas cobre o caso de um único servidor Node de forma simples e sem dependências.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Extrai o IP do cliente a partir dos headers de proxy padrão (Vercel/edge
// proxies definem x-forwarded-for; sem proxy, cai num bucket único "unknown").
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
