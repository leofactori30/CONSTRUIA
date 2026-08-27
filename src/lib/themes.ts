export const THEME_LABELS: Record<string, { label: string; icon: string }> = {
  seguranca: { label: "Segurança", icon: "🦺" },
  meio_ambiente: { label: "Meio Ambiente", icon: "🌿" },
  projetos: { label: "Projetos de Engenharia", icon: "📐" },
  bim: { label: "BIM / Tecnologia", icon: "💻" },
  geral: { label: "Consulta Geral", icon: "🔍" },
};

export function themeLabel(tema: string | null | undefined) {
  if (!tema) return { label: "Outros", icon: "❓" };
  return THEME_LABELS[tema] ?? { label: tema, icon: "❓" };
}
