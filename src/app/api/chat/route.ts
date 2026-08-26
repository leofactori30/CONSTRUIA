import Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL, MAX_TOKENS } from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabase/server";

const BASE_SYSTEM_PROMPT = `Você é um assistente técnico especializado em engenharia e arquitetura no Brasil. Responde exclusivamente com base em normas técnicas oficiais: NRs (Normas Regulamentadoras do Ministério do Trabalho), NBRs (ABNT), diretrizes BIM e resoluções do CONAMA.

Sempre cite a fonte da informação (norma, número e, quando possível, o item ou artigo de referência). Se a pergunta não puder ser respondida com base nessas normas, diga isso claramente em vez de inventar uma resposta.`;

type DocumentSummary = { name: string; category: string | null; tema: string | null };

function formatDocuments(docs: DocumentSummary[]) {
  return docs
    .map(d => `- ${d.name}${d.category ? ` [${d.category}]` : ""}${d.tema ? ` — ${d.tema}` : ""}`)
    .join("\n");
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return Response.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
  }

  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Mensagens inválidas." }, { status: 400 });
  }

  const { data: publicDocs } = await supabaseAdmin
    .from("documents")
    .select("name, category, tema")
    .eq("is_public", true)
    .eq("is_active", true);

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const { data: tenantDocs } = profile?.tenant_id
    ? await supabaseAdmin
        .from("documents")
        .select("name, category, tema")
        .eq("tenant_id", profile.tenant_id)
        .eq("is_active", true)
    : { data: [] as DocumentSummary[] | null };

  let documentsSection = "";
  if (publicDocs?.length) {
    documentsSection += `\n\nDocumentos públicos disponíveis na base de conhecimento:\n${formatDocuments(publicDocs)}`;
  }
  if (tenantDocs?.length) {
    documentsSection += `\n\nDocumentos internos desta empresa disponíveis na base de conhecimento:\n${formatDocuments(tenantDocs)}`;
  }

  const systemPrompt = `${BASE_SYSTEM_PROMPT}${documentsSection}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages.map((m: { role: "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n");

    return Response.json({
      content,
      usage: response.usage,
    });
  } catch (err) {
    const isBalanceError =
      err instanceof Anthropic.APIError &&
      /credit balance|insufficient|billing/i.test(err.message);

    if (!isBalanceError) {
      throw err;
    }

    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
    const question = lastUserMessage?.content ?? "";

    return Response.json({
      content: `⚠️ Modo demo — sem saldo disponível na API da Anthropic no momento.\n\nVocê perguntou: "${question}"\n\nEm produção, esta resposta traria a norma técnica aplicável (NR, NBR, BIM ou CONAMA) com a citação da fonte. Esta é uma simulação apenas para fins de teste da interface.`,
      usage: { input_tokens: 0, output_tokens: 0, demo: true },
    });
  }
}
