import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const LOGIN_DELAY_MS = 500;
const MAX_ATTEMPTS_PER_MINUTE = 5;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const { allowed } = rateLimit(`login:${ip}`, MAX_ATTEMPTS_PER_MINUTE, 60_000);

  if (!allowed) {
    return Response.json({ error: "Muitas tentativas. Tente novamente em 1 minuto." }, { status: 429 });
  }

  const { email, password } = await request.json();

  // Mensagem e status idênticos para "e-mail não existe" e "senha errada" —
  // nunca diferenciar os dois casos, para não permitir enumeração de contas.
  if (!email || !password) {
    await delay(LOGIN_DELAY_MS);
    return Response.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Delay fixo tanto no sucesso quanto na falha, para que o tempo de resposta
  // não vaze informação sobre qual etapa da validação falhou.
  await delay(LOGIN_DELAY_MS);

  if (error) {
    return Response.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  return Response.json({ success: true });
}
