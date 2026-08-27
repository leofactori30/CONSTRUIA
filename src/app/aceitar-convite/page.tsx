"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

// ─── INPUT ────────────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, disabled,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 8 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="field-underline"
        style={{
          width: "100%",
          padding: "10px 2px",
          color: disabled ? "var(--text-3)" : "var(--text)",
          fontSize: 14.5,
          fontFamily: "'Inter', sans-serif",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function AceitarConviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    fetch(`/api/super-admin/validate-invite?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(result => {
        setValid(!!result.valid);
        setTenantName(result.tenant_name || "");
        setEmail(result.email || "");
      })
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async () => {
    setError("");

    if (!fullName || !password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/super-admin/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, full_name: fullName, password }),
    });
    const result = await res.json();

    if (!res.ok) {
      setError(result.error ?? "Não foi possível aceitar o convite.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: result.email,
      password,
    });

    if (signInError) {
      router.push("/login");
      return;
    }

    router.push("/app/chat");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      fontFamily: "'Inter', sans-serif",
      background: "var(--surface-2)",
      boxSizing: "border-box",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
          <Logo size="md" />
        </div>

        <div
          className="fade-in"
          style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 36,
            boxShadow: "0 24px 60px rgba(13,45,107,0.10)",
          }}
        >
          {checking ? (
            <p style={{ color: "var(--text-2)", fontSize: 14, textAlign: "center", margin: 0 }}>Verificando convite...</p>
          ) : !valid ? (
            <>
              <h2 style={{ color: "var(--text)", fontSize: 22, fontWeight: 800, margin: "0 0 12px", textAlign: "center" }}>
                Convite inválido
              </h2>
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px" }}>
                <span style={{ color: "var(--danger)", fontSize: 13.5 }}>
                  ⚠️ Este link de convite é inválido, já foi utilizado ou expirou.
                </span>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ color: "var(--text)", fontSize: 22, fontWeight: 800, margin: "0 0 4px", textAlign: "center" }}>
                Complete seu cadastro
              </h2>
              <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 24px", textAlign: "center" }}>
                Você foi convidado para <strong style={{ color: "var(--text)" }}>{tenantName}</strong> na Constru.IA
              </p>

              <Field label="E-mail" value={email} disabled />
              <Field label="Nome completo" value={fullName} onChange={setFullName} placeholder="Seu nome" />
              <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              <Field label="Confirmar senha" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />

              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
                  <span style={{ color: "var(--danger)", fontSize: 13.5 }}>⚠️ {error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={loading ? "" : "btn-primary"}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, fontWeight: 700, fontSize: 14.5,
                  color: "#ffffff", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? "var(--text-3)" : undefined,
                }}
              >
                {loading ? "Criando acesso..." : "Aceitar convite →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={
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
    }>
      <AceitarConviteForm />
    </Suspense>
  );
}
