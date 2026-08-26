"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type TenantUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  status: "active" | "pending";
};

const NAV_ITEMS = [
  { id: "chat", icon: "💬", label: "Chat", path: "/app/chat" },
  { id: "documentos", icon: "📁", label: "Documentos", path: "/app/documentos" },
  { id: "tokens", icon: "🔢", label: "Tokens", path: "/app/tokens" },
  { id: "admin", icon: "🛠️", label: "Admin", path: "/app/admin" },
];

// ─── LOGO ─────────────────────────────────────────────────────
function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fs = size === "sm" ? 18 : size === "lg" ? 32 : 24;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: fs, color: "#0d2d6b", lineHeight: 1 }}>Constru</span>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: fs, color: "#2d7dd2", lineHeight: 1 }}>.IA</span>
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
      background: "#0f172a",
      borderRight: "1px solid #1e293b",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #1e293b" }}>
        <Logo size="md" />
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                color: isActive ? "#a5b4fc" : "#9ca3af",
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

      <div style={{ padding: 16, borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ffffff", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #374151",
            background: "transparent",
            color: "#9ca3af",
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

function StatusBadge({ status }: { status: "active" | "pending" }) {
  const active = status === "active";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px",
      color: active ? "#10b981" : "#f59e0b",
      background: active ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
    }}>
      {active ? "● Ativo" : "○ Pendente"}
    </span>
  );
}

function RoleBadge({ role }: { role: "user" | "admin" }) {
  const isAdminRole = role === "admin";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px",
      color: isAdminRole ? "#a5b4fc" : "#9ca3af",
      background: isAdminRole ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)",
    }}>
      {isAdminRole ? "Admin" : "Usuário"}
    </span>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const loadUsers = useCallback(async (tenant: string) => {
    setLoadingUsers(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name, role, status")
      .eq("tenant_id", tenant)
      .order("email");

    setUsers((data as TenantUser[]) ?? []);
    setLoadingUsers(false);
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

      setTenantId(profile.tenant_id);
      setAuthorized(true);
      setCheckingSession(false);
      loadUsers(profile.tenant_id);
    });
  }, [router, loadUsers]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleInvite = async () => {
    setInviteError("");
    setInviteSuccess("");

    if (!inviteEmail) {
      setInviteError("Informe um e-mail.");
      return;
    }

    setInviting(true);

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const result = await res.json();

    if (!res.ok) {
      setInviteError(result.error ?? "Não foi possível enviar o convite.");
      setInviting(false);
      return;
    }

    setInviteSuccess(`Convite enviado para ${inviteEmail}.`);
    setInviteEmail("");
    setInviteRole("user");
    setInviting(false);

    if (tenantId) loadUsers(tenantId);
  };

  if (checkingSession || !authorized) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
        color: "#9ca3af",
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#0f172a" }}>
      <Sidebar user={user} active="admin" onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto", background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <h1 style={{ color: "#ffffff", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Administração</h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 32px" }}>
            Gerencie os usuários da sua empresa e envie convites de acesso.
          </p>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 16, padding: 24, marginBottom: 32 }}>
            <h2 style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Convidar usuário</h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 2, minWidth: 220 }}>
                <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>E-mail</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colaborador@empresa.com.br"
                  style={{
                    width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 12,
                    padding: "12px 16px", color: "#ffffff", fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as "user" | "admin")}
                  style={{
                    width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 12,
                    padding: "12px 16px", color: "#ffffff", fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={handleInvite}
                disabled={inviting}
                style={{
                  padding: "12px 20px", borderRadius: 12, border: "none", fontWeight: 600, fontSize: 14,
                  color: "#ffffff", cursor: inviting ? "not-allowed" : "pointer",
                  background: inviting ? "#374151" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  boxShadow: inviting ? "none" : "0 4px 24px #6366f140",
                  flexShrink: 0,
                }}
              >
                {inviting ? "Enviando..." : "Convidar"}
              </button>
            </div>

            {inviteError && (
              <div style={{ background: "rgba(127,29,29,0.4)", border: "1px solid #991b1b", borderRadius: 12, padding: "10px 14px", marginTop: 16 }}>
                <span style={{ color: "#f87171", fontSize: 13 }}>⚠️ {inviteError}</span>
              </div>
            )}
            {inviteSuccess && (
              <div style={{ background: "rgba(6,78,59,0.4)", border: "1px solid #065f46", borderRadius: 12, padding: "10px 14px", marginTop: 16 }}>
                <span style={{ color: "#34d399", fontSize: 13 }}>✓ {inviteSuccess}</span>
              </div>
            )}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>Usuários da empresa</h2>

            {loadingUsers ? (
              <p style={{ color: "#6b7280", fontSize: 13 }}>Carregando usuários...</p>
            ) : users.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 13 }}>Nenhum usuário encontrado.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {users.map(u => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: "12px 16px",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ color: "#e5e7eb", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.full_name || u.email}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{u.email}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <RoleBadge role={u.role} />
                      <StatusBadge status={u.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
