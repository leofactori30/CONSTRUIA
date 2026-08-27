"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Period = "today" | "7d" | "30d" | "90d";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "pending" | "suspended";
  plan: string;
  tokens_used: number;
  cost: number;
  pct_of_limit: number;
  last_activity: string | null;
};

type TemaCount = { tema: string; label: string; icon: string; count: number };

type Analytics = {
  period: Period;
  metrics: {
    total_users: number;
    active_users: number;
    total_tokens: number;
    total_cost: number;
    total_messages: number;
    mrr_estimate: number;
  };
  daily_series: { date: string; input_tokens: number; output_tokens: number }[];
  tema_counts: TemaCount[];
  users_table: UserRow[];
  alerts: {
    over_80_percent: UserRow[];
    over_limit: UserRow[];
    recent_errors: { message: string; created_at: string }[];
  };
};

const NAV_ITEMS = [
  { id: "chat", icon: "💬", label: "Chat", path: "/app/chat" },
  { id: "documentos", icon: "📁", label: "Documentos", path: "/app/documentos" },
  { id: "tokens", icon: "🔢", label: "Tokens", path: "/app/tokens" },
  { id: "admin", icon: "🛠️", label: "Admin", path: "/app/admin" },
];

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
];

const PLAN_INFO: Record<string, { label: string; color: string }> = {
  student: { label: "Estudante", color: "var(--primary)" },
  professional: { label: "Profissional", color: "var(--warning)" },
  enterprise: { label: "Empresas", color: "var(--success)" },
};

const PIE_COLORS = ["var(--primary)", "var(--warning)", "var(--success)", "#a855f7", "#ec4899", "#06b6d4"];

function formatNumber(n: number) {
  return n.toLocaleString("pt-BR");
}
function formatMoney(n: number) {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}
function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDayLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── LOGO ─────────────────────────────────────────────────────
function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fs = size === "sm" ? 18 : size === "lg" ? 32 : 24;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: fs, color: "var(--primary-dark)", lineHeight: 1 }}>Constru</span>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: fs, color: "var(--primary)", lineHeight: 1 }}>.IA</span>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const router = useRouter();
  const name = user?.user_metadata?.full_name || user?.email || "Usuário";

  return (
    <div style={{
      width: 260, minWidth: 260, height: "100vh", background: "var(--surface-2)",
      borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", boxSizing: "border-box",
    }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)" }}>
        <Logo size="md" />
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const active = item.id === "admin";
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={active ? "" : "btn-ghost"}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none",
                background: active ? "var(--primary-light)" : "transparent",
                color: active ? "var(--primary-dark)" : "var(--text-2)",
                fontSize: 14, fontWeight: active ? 600 : 500, textAlign: "left", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="btn-ghost"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-2)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </div>
  );
}

// ─── METRIC CARD ──────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div
      className="hover-lift fade-in"
      style={{
        flex: 1, minWidth: 200,
        background: `linear-gradient(160deg, ${color}0f, var(--surface) 55%)`,
        border: "1px solid var(--border)", borderRadius: 18, padding: 20,
        boxShadow: "0 2px 10px rgba(13,45,107,0.04)",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${color}1f`, fontSize: 17, marginBottom: 14,
      }}>
        {icon}
      </div>
      <div style={{ color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: "var(--text)", fontSize: 21, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── GRÁFICO DE BARRAS (SVG puro) ─────────────────────────────
function TokenBarChart({ data }: { data: { date: string; input_tokens: number; output_tokens: number }[] }) {
  if (data.length === 0) {
    return <p style={{ color: "var(--text-2)", fontSize: 13 }}>Sem dados de consumo neste período.</p>;
  }

  const barW = 14;
  const gap = 22;
  const groupW = barW * 2 + 4;
  const chartH = 200;
  const paddingTop = 16;
  const max = Math.max(1, ...data.map(d => Math.max(d.input_tokens, d.output_tokens)));
  const width = data.length * (groupW + gap);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(width, 320)} height={chartH + 40} role="img" aria-label="Consumo de tokens por dia">
        <line x1={0} y1={chartH + paddingTop} x2={Math.max(width, 320)} y2={chartH + paddingTop} stroke="var(--border)" strokeWidth={1} />
        {data.map((d, i) => {
          const x = i * (groupW + gap);
          const inputH = (d.input_tokens / max) * chartH;
          const outputH = (d.output_tokens / max) * chartH;
          return (
            <g key={d.date}>
              <rect
                x={x} y={paddingTop + (chartH - inputH)} width={barW} height={inputH}
                fill="var(--primary)" rx={3}
              >
                <title>{`${formatDayLabel(d.date)} · input: ${formatNumber(d.input_tokens)}`}</title>
              </rect>
              <rect
                x={x + barW + 4} y={paddingTop + (chartH - outputH)} width={barW} height={outputH}
                fill="var(--primary-dark)" rx={3}
              >
                <title>{`${formatDayLabel(d.date)} · output: ${formatNumber(d.output_tokens)}`}</title>
              </rect>
              <text
                x={x + groupW / 2} y={chartH + paddingTop + 16} textAnchor="middle" fontSize={10} fill="var(--text-3)"
              >
                {formatDayLabel(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── GRÁFICO DE PIZZA (SVG puro) ──────────────────────────────
function TemaPieChart({ data }: { data: TemaCount[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return <p style={{ color: "var(--text-2)", fontSize: 13 }}>Sem mensagens registradas neste período.</p>;
  }

  const cx = 70, cy = 70, r = 62;
  let cumulative = 0;

  const slices = data.map((d, i) => {
    const fraction = d.count / total;
    const startAngle = cumulative * 2 * Math.PI;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI;

    const x1 = cx + r * Math.sin(startAngle);
    const y1 = cy - r * Math.cos(startAngle);
    const x2 = cx + r * Math.sin(endAngle);
    const y2 = cy - r * Math.cos(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const path = fraction >= 0.999
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { path, color: PIE_COLORS[i % PIE_COLORS.length], ...d, pct: Math.round(fraction * 100) };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
      <svg width={140} height={140} viewBox="0 0 140 140" role="img" aria-label="Distribuição de mensagens por tema">
        {slices.map(s => (
          <path key={s.tema} d={s.path} fill={s.color}>
            <title>{`${s.label}: ${s.count} (${s.pct}%)`}</title>
          </path>
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map(s => (
          <div key={s.tema} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: "var(--text)" }}>{s.icon} {s.label}</span>
            <span style={{ color: "var(--text-2)" }}>{s.count} · {s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODAL ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(13,45,107,0.35)", zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          width: "100%", maxWidth: 420, background: "var(--surface)", borderRadius: 20, padding: 28,
          boxShadow: "0 30px 70px rgba(13,45,107,0.25)", border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ color: "var(--text)", fontSize: 17, fontWeight: 800, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [period, setPeriod] = useState<Period>("30d");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  const [sortKey, setSortKey] = useState<"name" | "plan" | "tokens_used" | "cost" | "pct_of_limit" | "last_activity">("tokens_used");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [activeModal, setActiveModal] = useState<"tokens" | "suspend" | "invite" | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [tokensUserId, setTokensUserId] = useState("");
  const [tokensAmount, setTokensAmount] = useState("");

  const [suspendUserId, setSuspendUserId] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");

  const loadAnalytics = useCallback(async (token: string, p: Period) => {
    setLoadingAnalytics(true);
    setAnalyticsError("");
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setAnalyticsError(json.error || "Erro ao carregar métricas.");
      } else {
        setAnalytics(json as Analytics);
      }
    } catch {
      setAnalyticsError("Erro de conexão ao carregar métricas.");
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push("/login");
        return;
      }
      setUser(data.session.user);
      setAccessToken(data.session.access_token);

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const profile = await res.json();

      if (!res.ok || profile?.role !== "admin") {
        router.push("/app/chat");
        return;
      }

      setAuthorized(true);
      setCheckingSession(false);
      loadAnalytics(data.session.access_token, period);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, loadAnalytics]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (accessToken) loadAnalytics(accessToken, p);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sortedUsers = useMemo(() => {
    if (!analytics) return [];
    const rows = [...analytics.users_table];
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "plan") cmp = a.plan.localeCompare(b.plan);
      else if (sortKey === "last_activity") cmp = (a.last_activity || "").localeCompare(b.last_activity || "");
      else cmp = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [analytics, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleExportCsv = () => {
    if (!analytics) return;
    const lines: string[] = [];
    lines.push("Métrica,Valor");
    lines.push(`Total de usuários,${analytics.metrics.total_users}`);
    lines.push(`Usuários ativos no período,${analytics.metrics.active_users}`);
    lines.push(`Total de tokens consumidos,${analytics.metrics.total_tokens}`);
    lines.push(`Custo total,${analytics.metrics.total_cost.toFixed(2)}`);
    lines.push(`Total de mensagens,${analytics.metrics.total_messages}`);
    lines.push(`MRR estimado,${analytics.metrics.mrr_estimate.toFixed(2)}`);
    lines.push("");
    lines.push("Nome,E-mail,Plano,Tokens usados (mês),Custo (R$),% do limite,Última atividade");
    sortedUsers.forEach(u => {
      lines.push([
        `"${u.name.replace(/"/g, '""')}"`,
        u.email,
        PLAN_INFO[u.plan]?.label || u.plan,
        u.tokens_used,
        u.cost.toFixed(2),
        u.pct_of_limit,
        u.last_activity || "",
      ].join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `constru-ia-relatorio-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActionError("");
    setActionSuccess("");
    setTokensUserId("");
    setTokensAmount("");
    setSuspendUserId("");
    setInviteEmail("");
    setInviteRole("user");
  };

  const handleAddTokens = async () => {
    setActionError("");
    const amount = Number(tokensAmount);
    if (!tokensUserId || !amount || amount <= 0) {
      setActionError("Selecione um usuário e informe uma quantidade válida.");
      return;
    }
    setActionLoading(true);
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ user_id: tokensUserId, amount }),
    });
    const result = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionError(result.error || "Não foi possível adicionar os tokens.");
      return;
    }
    setActionSuccess("Tokens adicionados com sucesso.");
    loadAnalytics(accessToken, period);
  };

  const handleToggleSuspend = async () => {
    setActionError("");
    const target = analytics?.users_table.find(u => u.id === suspendUserId);
    if (!target) {
      setActionError("Selecione um usuário.");
      return;
    }
    const action = target.status === "suspended" ? "reactivate" : "suspend";
    setActionLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ user_id: suspendUserId, action }),
    });
    const result = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionError(result.error || "Não foi possível atualizar o usuário.");
      return;
    }
    setActionSuccess(action === "suspend" ? "Usuário suspenso." : "Usuário reativado.");
    loadAnalytics(accessToken, period);
  };

  const handleInvite = async () => {
    setActionError("");
    if (!inviteEmail) {
      setActionError("Informe um e-mail.");
      return;
    }
    setActionLoading(true);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const result = await res.json();
    setActionLoading(false);
    if (!res.ok) {
      setActionError(result.error || "Não foi possível enviar o convite.");
      return;
    }
    setActionSuccess(`Convite enviado para ${inviteEmail}.`);
    setInviteEmail("");
    loadAnalytics(accessToken, period);
  };

  if (checkingSession || !authorized) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--surface-2)", color: "var(--text-2)", fontFamily: "'Inter', sans-serif", fontSize: 14,
      }}>
        Carregando...
      </div>
    );
  }

  const m = analytics?.metrics;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--surface)" }}>
      <Sidebar user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto", background: "var(--surface-2)" }}>
        <div className="fade-in" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 60px" }}>

          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Logo size="md" />
              <span style={{
                fontSize: 12, fontWeight: 700, color: "var(--primary-dark)", background: "var(--primary-light)",
                padding: "6px 14px", borderRadius: 999,
              }}>
                Painel Administrativo
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 4 }}>
                {PERIODS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePeriodChange(p.id)}
                    className="pill-btn"
                    style={{
                      padding: "7px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "none",
                      background: period === p.id ? "var(--primary-light)" : "transparent",
                      color: period === p.id ? "var(--primary-dark)" : "var(--text-2)",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExportCsv}
                disabled={!analytics}
                className="btn-primary"
                style={{
                  padding: "10px 18px", borderRadius: 12, border: "none", color: "#ffffff", fontSize: 13, fontWeight: 700,
                  cursor: analytics ? "pointer" : "not-allowed", opacity: analytics ? 1 : 0.6,
                }}
              >
                ⬇ Exportar CSV
              </button>
            </div>
          </div>

          {analyticsError && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <span style={{ color: "var(--danger)", fontSize: 13.5 }}>⚠️ {analyticsError}</span>
            </div>
          )}

          {loadingAnalytics && !analytics && (
            <p style={{ color: "var(--text-2)", fontSize: 13 }}>Carregando métricas...</p>
          )}

          {m && (
            <>
              {/* MÉTRICAS PRINCIPAIS */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
                <MetricCard icon="👥" label="Usuários cadastrados" value={formatNumber(m.total_users)} color="var(--primary)" />
                <MetricCard icon="✅" label="Ativos no período" value={formatNumber(m.active_users)} color="var(--success)" />
                <MetricCard icon="⚡" label="Tokens consumidos" value={formatNumber(m.total_tokens)} color="var(--warning)" />
                <MetricCard icon="💰" label="Custo no período" value={formatMoney(m.total_cost)} color="var(--danger)" />
                <MetricCard icon="💬" label="Mensagens enviadas" value={formatNumber(m.total_messages)} color="#a855f7" />
                <MetricCard icon="📈" label="MRR estimado" value={formatMoney(m.mrr_estimate)} color="#06b6d4" />
              </div>

              {/* GRÁFICO DE CONSUMO */}
              <div
                className="fade-in"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: 0 }}>Consumo de tokens por dia</h2>
                  <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--text-2)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--primary)" }} /> Input
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--primary-dark)" }} /> Output
                    </span>
                  </div>
                </div>
                <TokenBarChart data={analytics!.daily_series} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: 24, marginBottom: 24 }}>
                {/* TABELA DE USUÁRIOS */}
                <div
                  className="fade-in"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)", overflow: "hidden" }}
                >
                  <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Usuários</h2>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          {([
                            ["name", "Nome"], ["plan", "Plano"], ["tokens_used", "Tokens (mês)"],
                            ["cost", "Custo"], ["pct_of_limit", "% limite"], ["last_activity", "Última atividade"],
                          ] as [typeof sortKey, string][]).map(([key, label]) => (
                            <th
                              key={key}
                              onClick={() => toggleSort(key)}
                              style={{ textAlign: "left", padding: "0 10px 10px 0", color: "var(--text-2)", fontWeight: 600, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 0.3 }}
                            >
                              {label} {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.map(u => {
                          const plan = PLAN_INFO[u.plan] || { label: u.plan, color: "var(--text-2)" };
                          const barColor = u.pct_of_limit >= 100 ? "var(--danger)" : u.pct_of_limit >= 80 ? "var(--warning)" : "var(--success)";
                          return (
                            <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ padding: "10px 10px 10px 0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{u.name}</span>
                                  {u.status !== "active" && (
                                    <span style={{
                                      fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
                                      color: u.status === "suspended" ? "var(--danger)" : "var(--warning)",
                                      background: u.status === "suspended" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.12)",
                                    }}>
                                      {u.status === "suspended" ? "Suspenso" : "Pendente"}
                                    </span>
                                  )}
                                </div>
                                <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{u.email}</div>
                              </td>
                              <td style={{ padding: "10px" }}>
                                <span style={{
                                  fontSize: 10.5, fontWeight: 700, color: plan.color, background: `${plan.color}1a`,
                                  borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap",
                                }}>
                                  {plan.label}
                                </span>
                              </td>
                              <td style={{ padding: "10px", color: "var(--text)", whiteSpace: "nowrap" }}>{formatNumber(u.tokens_used)}</td>
                              <td style={{ padding: "10px", color: "var(--text)", whiteSpace: "nowrap" }}>{formatMoney(u.cost)}</td>
                              <td style={{ padding: "10px", minWidth: 90 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden", minWidth: 40 }}>
                                    <div className="progress-fill" style={{ width: `${Math.min(100, u.pct_of_limit)}%`, height: "100%", background: barColor }} />
                                  </div>
                                  <span style={{ color: barColor, fontWeight: 700, fontSize: 11.5 }}>{u.pct_of_limit}%</span>
                                </div>
                              </td>
                              <td style={{ padding: "10px", color: "var(--text-2)", whiteSpace: "nowrap" }}>{formatDate(u.last_activity)}</td>
                            </tr>
                          );
                        })}
                        {sortedUsers.length === 0 && (
                          <tr><td colSpan={6} style={{ padding: "16px 0", color: "var(--text-2)" }}>Nenhum usuário encontrado.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TOP TEMAS */}
                <div
                  className="fade-in"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)" }}
                >
                  <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Temas mais consultados</h2>
                  <TemaPieChart data={analytics!.tema_counts} />
                </div>
              </div>

              {/* ALERTAS */}
              <div
                className="fade-in"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)" }}
              >
                <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Alertas do sistema</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  <AlertList
                    title="Acima de 80% do limite"
                    icon="⚠️"
                    color="var(--warning)"
                    items={analytics!.alerts.over_80_percent.map(u => `${u.name} — ${u.pct_of_limit}%`)}
                    empty="Nenhum usuário acima de 80%."
                  />
                  <AlertList
                    title="Acima do limite do plano"
                    icon="🚫"
                    color="var(--danger)"
                    items={analytics!.alerts.over_limit.map(u => `${u.name} — ${u.pct_of_limit}%`)}
                    empty="Nenhum usuário estourou o limite."
                  />
                  <AlertList
                    title="Erros recentes da API"
                    icon="🐞"
                    color="var(--text-2)"
                    items={analytics!.alerts.recent_errors.map(e => e.message)}
                    empty="Sem log de erros configurado ainda."
                  />
                </div>
              </div>
            </>
          )}

          {/* AÇÕES ADMINISTRATIVAS */}
          <div
            className="fade-in"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)" }}
          >
            <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Ações administrativas</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setActiveModal("tokens")} className="btn-primary" style={{ padding: "12px 20px", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                ➕ Adicionar tokens
              </button>
              <button onClick={() => setActiveModal("suspend")} className="btn-ghost" style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                ⏸ Suspender / reativar usuário
              </button>
              <button onClick={() => setActiveModal("invite")} className="btn-ghost" style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                ✉️ Convidar novo usuário
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADICIONAR TOKENS */}
      {activeModal === "tokens" && (
        <Modal title="Adicionar tokens" onClose={closeModal}>
          <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>Usuário</label>
          <select
            value={tokensUserId}
            onChange={e => setTokensUserId(e.target.value)}
            className="field-underline"
            style={{ width: "100%", padding: "10px 2px", marginBottom: 18, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}
          >
            <option value="">Selecione...</option>
            {analytics?.users_table.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>

          <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>Quantidade de tokens</label>
          <input
            type="number"
            min={1}
            value={tokensAmount}
            onChange={e => setTokensAmount(e.target.value)}
            placeholder="ex: 10000"
            className="field-underline"
            style={{ width: "100%", padding: "10px 2px", marginBottom: 18, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}
          />

          {actionError && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>⚠️ {actionError}</p>}
          {actionSuccess && <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 12 }}>✓ {actionSuccess}</p>}

          <button
            onClick={handleAddTokens}
            disabled={actionLoading}
            className="btn-primary"
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: actionLoading ? "not-allowed" : "pointer" }}
          >
            {actionLoading ? "Adicionando..." : "Adicionar"}
          </button>
        </Modal>
      )}

      {/* MODAL: SUSPENDER / REATIVAR */}
      {activeModal === "suspend" && (
        <Modal title="Suspender / reativar usuário" onClose={closeModal}>
          <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>Usuário</label>
          <select
            value={suspendUserId}
            onChange={e => setSuspendUserId(e.target.value)}
            className="field-underline"
            style={{ width: "100%", padding: "10px 2px", marginBottom: 18, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}
          >
            <option value="">Selecione...</option>
            {analytics?.users_table.filter(u => u.status !== "pending").map(u => (
              <option key={u.id} value={u.id}>{u.name} — {u.status === "suspended" ? "suspenso" : "ativo"}</option>
            ))}
          </select>

          {actionError && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>⚠️ {actionError}</p>}
          {actionSuccess && <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 12 }}>✓ {actionSuccess}</p>}

          <button
            onClick={handleToggleSuspend}
            disabled={actionLoading || !suspendUserId}
            className="btn-primary"
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: actionLoading ? "not-allowed" : "pointer" }}
          >
            {actionLoading ? "Atualizando..." : "Confirmar"}
          </button>
        </Modal>
      )}

      {/* MODAL: CONVIDAR */}
      {activeModal === "invite" && (
        <Modal title="Convidar novo usuário" onClose={closeModal}>
          <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>E-mail</label>
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colaborador@empresa.com.br"
            className="field-underline"
            style={{ width: "100%", padding: "10px 2px", marginBottom: 18, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}
          />

          <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>Role</label>
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as "user" | "admin")}
            className="field-underline"
            style={{ width: "100%", padding: "10px 2px", marginBottom: 18, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}
          >
            <option value="user">Usuário</option>
            <option value="admin">Admin</option>
          </select>

          {actionError && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>⚠️ {actionError}</p>}
          {actionSuccess && <p style={{ color: "var(--success)", fontSize: 13, marginBottom: 12 }}>✓ {actionSuccess}</p>}

          <button
            onClick={handleInvite}
            disabled={actionLoading}
            className="btn-primary"
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: actionLoading ? "not-allowed" : "pointer" }}
          >
            {actionLoading ? "Enviando..." : "Enviar convite"}
          </button>
        </Modal>
      )}
    </div>
  );
}

function AlertList({ title, icon, color, items, empty }: { title: string; icon: string; color: string; items: string[]; empty: string }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--surface-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span>{icon}</span>
        <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13.5 }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "var(--text-3)", fontSize: 12.5, margin: 0 }}>{empty}</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item, i) => (
            <li key={i} style={{ fontSize: 12.5, color }}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
