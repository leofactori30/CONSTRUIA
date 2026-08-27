"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tenant = {
  id: string;
  name: string;
  cnpj: string | null;
  plan: string;
  token_limit: number;
  logo_url: string | null;
  status: "active" | "suspended";
  created_at: string;
  user_count: number;
  tokens_used: number;
  cost_brl: number;
};

const PLAN_INFO: Record<string, { label: string; color: string }> = {
  professional: { label: "Profissional", color: "var(--warning)" },
  enterprise: { label: "Empresas", color: "var(--success)" },
};

const BAR_COLORS = ["var(--primary)", "var(--warning)", "var(--success)", "#a855f7", "#ec4899", "#06b6d4"];

function formatNumber(n: number) {
  return n.toLocaleString("pt-BR");
}
function formatMoney(n: number) {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
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

// ─── GRÁFICO DE CONSUMO GERAL (SVG puro) ──────────────────────
function TenantsBarChart({ tenants }: { tenants: Tenant[] }) {
  if (tenants.length === 0) {
    return <p style={{ color: "var(--text-2)", fontSize: 13 }}>Nenhum tenant cadastrado ainda.</p>;
  }

  const barW = 34;
  const gap = 24;
  const chartH = 180;
  const paddingTop = 16;
  const max = Math.max(1, ...tenants.map(t => t.tokens_used));
  const width = tenants.length * (barW + gap);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(width, 320)} height={chartH + 46} role="img" aria-label="Consumo de tokens por tenant">
        <line x1={0} y1={chartH + paddingTop} x2={Math.max(width, 320)} y2={chartH + paddingTop} stroke="var(--border)" strokeWidth={1} />
        {tenants.map((t, i) => {
          const x = i * (barW + gap);
          const h = (t.tokens_used / max) * chartH;
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <g key={t.id}>
              <rect x={x} y={paddingTop + (chartH - h)} width={barW} height={h} fill={color} rx={4}>
                <title>{`${t.name}: ${formatNumber(t.tokens_used)} tokens`}</title>
              </rect>
              <text
                x={x + barW / 2} y={chartH + paddingTop + 16} textAnchor="middle" fontSize={10} fill="var(--text-3)"
              >
                {t.name.length > 8 ? `${t.name.slice(0, 8)}…` : t.name}
              </text>
            </g>
          );
        })}
      </svg>
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
          width: "100%", maxWidth: 440, background: "var(--surface)", borderRadius: 20, padding: 28,
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 6 }}>{children}</label>;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantsError, setTenantsError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [inviteModalTenant, setInviteModalTenant] = useState<Tenant | null>(null);

  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState("");

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [plan, setPlan] = useState<"professional" | "enterprise">("professional");
  const [tokenLimit, setTokenLimit] = useState("150000");
  const [logoUrl, setLogoUrl] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  const loadTenants = useCallback(async (token: string) => {
    setLoadingTenants(true);
    setTenantsError("");
    try {
      const res = await fetch("/api/super-admin/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setTenantsError(json.error || "Erro ao carregar tenants.");
      } else {
        setTenants(json.tenants || []);
      }
    } catch {
      setTenantsError("Erro de conexão ao carregar tenants.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push("/login");
        return;
      }
      setAccessToken(data.session.access_token);

      const res = await fetch("/api/super-admin/tenants", {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (res.status === 403) {
        router.push("/app/chat");
        return;
      }

      const json = await res.json();
      setTenants(json.tenants || []);
      setLoadingTenants(false);
      setAuthorized(true);
      setCheckingSession(false);
    });
  }, [router]);

  const totals = useMemo(() => {
    return tenants.reduce(
      (acc, t) => ({
        users: acc.users + t.user_count,
        tokens: acc.tokens + t.tokens_used,
        cost: acc.cost + t.cost_brl,
      }),
      { users: 0, tokens: 0, cost: 0 }
    );
  }, [tenants]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const resetCreateForm = () => {
    setName(""); setCnpj(""); setAdminEmail(""); setPlan("professional");
    setTokenLimit("150000"); setLogoUrl(""); setCreateError(""); setCreatedInviteUrl("");
  };

  const handleCreateTenant = async () => {
    setCreateError("");
    if (!name || !adminEmail) {
      setCreateError("Nome da empresa e e-mail do admin são obrigatórios.");
      return;
    }
    setCreateLoading(true);
    const res = await fetch("/api/super-admin/create-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name, cnpj, admin_email: adminEmail, plan,
        token_limit: Number(tokenLimit) || 150_000,
        logo_url: logoUrl,
      }),
    });
    const result = await res.json();
    setCreateLoading(false);
    if (!res.ok) {
      setCreateError(result.error || "Não foi possível criar o tenant.");
      return;
    }
    setCreatedInviteUrl(result.invite_url);
    loadTenants(accessToken);
  };

  const handleGenerateInvite = async () => {
    setInviteError("");
    if (!inviteModalTenant || !inviteEmail) {
      setInviteError("Informe um e-mail.");
      return;
    }
    setInviteLoading(true);
    const res = await fetch("/api/super-admin/invite-link", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ tenant_id: inviteModalTenant.id, email: inviteEmail, role: "admin" }),
    });
    const result = await res.json();
    setInviteLoading(false);
    if (!res.ok) {
      setInviteError(result.error || "Não foi possível gerar o convite.");
      return;
    }
    setInviteUrl(result.invite_url);
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const action = tenant.status === "suspended" ? "reactivate" : "suspend";
    const confirmMsg = action === "suspend"
      ? `Suspender o tenant "${tenant.name}"? Os usuários dessa empresa perderão acesso.`
      : `Reativar o tenant "${tenant.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    const res = await fetch("/api/super-admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ tenant_id: tenant.id, action }),
    });
    if (res.ok) loadTenants(accessToken);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2)", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Logo size="md" />
            <span style={{
              fontSize: 12, fontWeight: 700, color: "var(--primary-dark)", background: "var(--primary-light)",
              padding: "6px 14px", borderRadius: 999,
            }}>
              Painel Super-Admin
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
              style={{ padding: "10px 18px", borderRadius: 12, border: "none", color: "#ffffff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              ➕ Novo tenant
            </button>
            <button
              onClick={handleLogout}
              className="btn-ghost"
              style={{ padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              🚪 Sair
            </button>
          </div>
        </div>

        {tenantsError && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
            <span style={{ color: "var(--danger)", fontSize: 13.5 }}>⚠️ {tenantsError}</span>
          </div>
        )}

        {/* MÉTRICAS GERAIS */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          <div className="hover-lift fade-in" style={{ flex: 1, minWidth: 180, background: "linear-gradient(160deg, rgba(45,125,210,0.06), var(--surface) 55%)", border: "1px solid var(--border)", borderRadius: 18, padding: 20 }}>
            <div style={{ color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>Tenants</div>
            <div style={{ color: "var(--text)", fontSize: 21, fontWeight: 800 }}>{formatNumber(tenants.length)}</div>
          </div>
          <div className="hover-lift fade-in" style={{ flex: 1, minWidth: 180, background: "linear-gradient(160deg, rgba(16,185,129,0.06), var(--surface) 55%)", border: "1px solid var(--border)", borderRadius: 18, padding: 20 }}>
            <div style={{ color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>Usuários totais</div>
            <div style={{ color: "var(--text)", fontSize: 21, fontWeight: 800 }}>{formatNumber(totals.users)}</div>
          </div>
          <div className="hover-lift fade-in" style={{ flex: 1, minWidth: 180, background: "linear-gradient(160deg, rgba(245,158,11,0.06), var(--surface) 55%)", border: "1px solid var(--border)", borderRadius: 18, padding: 20 }}>
            <div style={{ color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>Tokens consumidos</div>
            <div style={{ color: "var(--text)", fontSize: 21, fontWeight: 800 }}>{formatNumber(totals.tokens)}</div>
          </div>
          <div className="hover-lift fade-in" style={{ flex: 1, minWidth: 180, background: "linear-gradient(160deg, rgba(239,68,68,0.06), var(--surface) 55%)", border: "1px solid var(--border)", borderRadius: 18, padding: 20 }}>
            <div style={{ color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>Custo total</div>
            <div style={{ color: "var(--text)", fontSize: 21, fontWeight: 800 }}>{formatMoney(totals.cost)}</div>
          </div>
        </div>

        {/* GRÁFICO */}
        <div className="fade-in" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)" }}>
          <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Consumo geral por tenant</h2>
          {loadingTenants ? <p style={{ color: "var(--text-2)", fontSize: 13 }}>Carregando...</p> : <TenantsBarChart tenants={tenants} />}
        </div>

        {/* TABELA DE TENANTS */}
        <div className="fade-in" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 24, boxShadow: "0 2px 10px rgba(13,45,107,0.04)" }}>
          <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>Tenants</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nome", "CNPJ", "Plano", "Usuários", "Tokens", "Status", "Ações"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0 10px 10px 0", color: "var(--text-2)", fontWeight: 600, fontSize: 11.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => {
                  const planInfo = PLAN_INFO[t.plan] || { label: t.plan, color: "var(--text-2)" };
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 10px 10px 0" }}>
                        <div style={{ color: "var(--text)", fontWeight: 600 }}>{t.name}</div>
                        <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>desde {formatDate(t.created_at)}</div>
                      </td>
                      <td style={{ padding: "10px", color: "var(--text-2)", whiteSpace: "nowrap" }}>{t.cnpj || "—"}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: planInfo.color, background: `${planInfo.color}1a`, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>
                          {planInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px", color: "var(--text)" }}>{formatNumber(t.user_count)}</td>
                      <td style={{ padding: "10px", color: "var(--text)", whiteSpace: "nowrap" }}>
                        {formatNumber(t.tokens_used)} <span style={{ color: "var(--text-3)" }}>/ {formatNumber(t.token_limit)}</span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap",
                          color: t.status === "active" ? "var(--success)" : "var(--danger)",
                          background: t.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        }}>
                          {t.status === "active" ? "● Ativo" : "○ Suspenso"}
                        </span>
                      </td>
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => { setInviteModalTenant(t); setInviteEmail(""); setInviteError(""); setInviteUrl(""); }}
                            className="btn-ghost"
                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                          >
                            🔗 Convite
                          </button>
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className="btn-ghost"
                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                          >
                            {t.status === "suspended" ? "▶ Reativar" : "⏸ Suspender"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tenants.length === 0 && !loadingTenants && (
                  <tr><td colSpan={7} style={{ padding: "16px 0", color: "var(--text-2)" }}>Nenhum tenant cadastrado ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: CRIAR TENANT */}
      {showCreate && (
        <Modal title="Novo tenant" onClose={() => { setShowCreate(false); resetCreateForm(); }}>
          {createdInviteUrl ? (
            <div>
              <p style={{ color: "var(--success)", fontSize: 13.5, marginBottom: 12 }}>✓ Tenant criado e convite enviado.</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                <input
                  readOnly
                  value={createdInviteUrl}
                  className="field-underline"
                  style={{ flex: 1, padding: "10px 2px", color: "var(--text)", fontSize: 12.5, boxSizing: "border-box" }}
                />
                <button
                  onClick={() => copyToClipboard(createdInviteUrl)}
                  className="btn-ghost"
                  style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Copiar
                </button>
              </div>
              <button
                onClick={() => { setShowCreate(false); resetCreateForm(); }}
                className="btn-primary"
                style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              <FieldLabel>Nome da empresa</FieldLabel>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Construtora Exemplo Ltda" className="field-underline" style={{ width: "100%", padding: "10px 2px", marginBottom: 16, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />

              <FieldLabel>CNPJ</FieldLabel>
              <input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="field-underline" style={{ width: "100%", padding: "10px 2px", marginBottom: 16, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />

              <FieldLabel>E-mail do admin responsável</FieldLabel>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@empresa.com.br" className="field-underline" style={{ width: "100%", padding: "10px 2px", marginBottom: 16, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />

              <FieldLabel>Plano</FieldLabel>
              <select value={plan} onChange={e => setPlan(e.target.value as "professional" | "enterprise")} className="field-underline" style={{ width: "100%", padding: "10px 2px", marginBottom: 16, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }}>
                <option value="professional">Profissional</option>
                <option value="enterprise">Empresas</option>
              </select>

              <FieldLabel>Limite de tokens mensal</FieldLabel>
              <input type="number" value={tokenLimit} onChange={e => setTokenLimit(e.target.value)} placeholder="150000" className="field-underline" style={{ width: "100%", padding: "10px 2px", marginBottom: 16, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />

              <FieldLabel>Logo URL (opcional)</FieldLabel>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="field-underline" style={{ width: "100%", padding: "10px 2px", marginBottom: 18, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />

              {createError && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>⚠️ {createError}</p>}

              <button
                onClick={handleCreateTenant}
                disabled={createLoading}
                className="btn-primary"
                style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: createLoading ? "not-allowed" : "pointer" }}
              >
                {createLoading ? "Criando..." : "Criar tenant e enviar convite"}
              </button>
            </>
          )}
        </Modal>
      )}

      {/* MODAL: GERAR LINK DE CONVITE */}
      {inviteModalTenant && (
        <Modal title={`Convite para ${inviteModalTenant.name}`} onClose={() => setInviteModalTenant(null)}>
          {inviteUrl ? (
            <div>
              <p style={{ color: "var(--success)", fontSize: 13.5, marginBottom: 12 }}>✓ Convite gerado.</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                <input readOnly value={inviteUrl} className="field-underline" style={{ flex: 1, padding: "10px 2px", color: "var(--text)", fontSize: 12.5, boxSizing: "border-box" }} />
                <button onClick={() => copyToClipboard(inviteUrl)} className="btn-ghost" style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Copiar
                </button>
              </div>
              <button onClick={() => setInviteModalTenant(null)} className="btn-primary" style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Fechar
              </button>
            </div>
          ) : (
            <>
              <FieldLabel>E-mail do convidado</FieldLabel>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="admin@empresa.com.br" className="field-underline" style={{ width: "100%", padding: "10px 2px", marginBottom: 18, color: "var(--text)", fontSize: 14, boxSizing: "border-box" }} />

              {inviteError && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>⚠️ {inviteError}</p>}

              <button
                onClick={handleGenerateInvite}
                disabled={inviteLoading}
                className="btn-primary"
                style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", color: "#ffffff", fontWeight: 700, fontSize: 14, cursor: inviteLoading ? "not-allowed" : "pointer" }}
              >
                {inviteLoading ? "Gerando..." : "Gerar link de convite"}
              </button>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
