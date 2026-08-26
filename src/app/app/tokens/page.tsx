"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { PLAN_TOKEN_LIMITS } from "@/lib/stripe";

const NAV_ITEMS = [
  { id: "chat", icon: "💬", label: "Chat", path: "/app/chat" },
  { id: "documentos", icon: "📁", label: "Documentos", path: "/app/documentos" },
  { id: "tokens", icon: "🔢", label: "Tokens", path: "/app/tokens" },
];

const PLAN_INFO: Record<string, { name: string; icon: string; price: number | null; color: string }> = {
  student: { name: "Estudante", icon: "🎓", price: 26.91, color: "var(--primary)" },
  professional: { name: "Profissional", icon: "👤", price: 29.90, color: "var(--warning)" },
  enterprise: { name: "Empresas", icon: "🏢", price: null, color: "var(--success)" },
};

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
function Sidebar({ user, active, onLogout }: { user: User | null; active: string; onLogout: () => void }) {
  const router = useRouter();
  const name = user?.user_metadata?.full_name || user?.email || "Usuário";

  return (
    <div style={{
      width: 260,
      minWidth: 260,
      height: "100vh",
      background: "var(--surface-2)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)" }}>
        <Logo size="md" />
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={isActive ? "" : "btn-ghost"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: isActive ? "var(--primary-light)" : "transparent",
                color: isActive ? "var(--primary-dark)" : "var(--text-2)",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                textAlign: "left",
                cursor: "pointer",
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
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ffffff", fontSize: 13, fontWeight: 700, flexShrink: 0,
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
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-2)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div
      className="hover-lift fade-in"
      style={{
        flex: 1, minWidth: 200,
        background: `linear-gradient(160deg, ${color}0f, var(--surface) 55%)`,
        border: "1px solid var(--border)", borderRadius: 18, padding: 22,
        boxShadow: "0 2px 10px rgba(13,45,107,0.04)",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${color}1f`, fontSize: 18, marginBottom: 16,
      }}>
        {icon}
      </div>
      <div style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ color: "var(--text)", fontSize: 24, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function TokensPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
        return;
      }
      setUser(data.session.user);
      setCheckingSession(false);
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (checkingSession) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-2)",
        color: "var(--text-2)",
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
      }}>
        Carregando...
      </div>
    );
  }

  const planId: string = user?.user_metadata?.plan || "professional";
  const plan = PLAN_INFO[planId] ?? PLAN_INFO.professional;
  const limit = PLAN_TOKEN_LIMITS[planId] ?? PLAN_TOKEN_LIMITS.professional;

  // Nota: sem uma tabela de uso ainda, o consumo abaixo é demonstrativo.
  const used = Math.round(limit * 0.58);
  const remaining = limit - used;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const costEstimate = plan.price ? (used / limit) * plan.price : null;

  const barColor = pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--warning)" : "var(--success)";

  const now = new Date();
  const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const renewalLabel = renewalDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--surface)" }}>
      <Sidebar user={user} active="tokens" onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto", background: "var(--surface-2)" }}>
        <div className="fade-in" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <h1 style={{ color: "var(--text)", fontSize: 25, fontWeight: 800, margin: "0 0 4px" }}>Tokens</h1>
          <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 28px" }}>
            Acompanhe o consumo de tokens do seu plano neste mês.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <StatCard icon="⚡" label="Tokens usados este mês" value={used.toLocaleString("pt-BR")} color="var(--primary)" />
            <StatCard icon="🔋" label="Tokens restantes" value={remaining.toLocaleString("pt-BR")} sub={`de ${limit.toLocaleString("pt-BR")} no plano`} color="var(--success)" />
            <StatCard
              icon="💰"
              label="Custo estimado"
              value={costEstimate !== null ? `R$ ${costEstimate.toFixed(2).replace(".", ",")}` : "Sob consulta"}
              sub={costEstimate !== null ? "proporcional ao consumo atual" : undefined}
              color="var(--warning)"
            />
          </div>

          <div
            className="fade-in"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 26, marginBottom: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <span style={{ color: "var(--text)", fontSize: 14.5, fontWeight: 700 }}>Consumo do mês</span>
              <span style={{ color: barColor, fontSize: 15, fontWeight: 800 }}>{pct}%</span>
            </div>
            <div style={{ width: "100%", height: 12, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}>
              <div
                className="progress-fill"
                style={{
                  width: `${pct}%`, height: "100%", borderRadius: 999,
                  background: `linear-gradient(90deg, ${barColor}, ${barColor}, var(--primary-light), ${barColor})`,
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ color: "var(--text-2)", fontSize: 12 }}>{used.toLocaleString("pt-BR")} tokens</span>
              <span style={{ color: "var(--text-2)", fontSize: 12 }}>{limit.toLocaleString("pt-BR")} tokens</span>
            </div>
          </div>

          <div
            className="fade-in"
            style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
              boxShadow: "0 2px 10px rgba(13,45,107,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${plan.color}1f`, fontSize: 22,
              }}>
                {plan.icon}
              </div>
              <div>
                <div style={{ color: "var(--text)", fontSize: 16, fontWeight: 700 }}>Plano {plan.name}</div>
                <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 2 }}>
                  {plan.price ? `R$ ${plan.price.toFixed(2).replace(".", ",")}/mês` : "Sob consulta"} · Renova em {renewalLabel}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/signup")}
              className="btn-ghost"
              style={{
                padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border)",
                background: "transparent", color: "var(--primary-dark)", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              Alterar plano
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
