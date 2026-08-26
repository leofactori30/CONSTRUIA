"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── INPUT ────────────────────────────────────────────────────
function Field({
  label, type = "text", value, onChange, placeholder, onEnter,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onEnter?: () => void;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 8 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className="field-underline"
        style={{
          width: "100%",
          padding: "10px 2px",
          color: "var(--text)",
          fontSize: 14.5,
          fontFamily: "'Inter', sans-serif",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message || "E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/app/chat");
  };

  return (
    <div className="auth-split" style={{ fontFamily: "'Inter', sans-serif", background: "var(--surface-2)" }}>
      {/* LEFT PANEL */}
      <div
        className="auth-left"
        style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(150deg, var(--primary-dark) 0%, #123a82 60%, var(--primary) 130%)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 48, boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.5,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.06) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 24, color: "#ffffff", lineHeight: 1 }}>Constru</span>
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 24, color: "var(--primary-light)", lineHeight: 1 }}>.IA</span>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <h1 style={{ color: "#ffffff", fontSize: 32, fontWeight: 800, lineHeight: 1.25, margin: "0 0 16px" }}>
            Normas técnicas,<br />respondidas em segundos.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.6, maxWidth: 360, margin: 0 }}>
            NRs, ABNTs, CONAMA e documentos internos da sua empresa — tudo em um só lugar, com citação da fonte.
          </p>
          <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
            {[["13+", "NRs indexadas"], ["3s", "Resposta média"], ["100%", "Fontes oficiais"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: "#ffffff", fontSize: 22, fontWeight: 800 }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11.5, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", color: "rgba(255,255,255,0.5)", fontSize: 12.5 }}>
          © 2026 Constru.IA
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <button
            onClick={() => router.push("/")}
            className="link-underline"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-2)", fontSize: 14, marginBottom: 28, cursor: "pointer", padding: 0 }}
          >
            ← Voltar ao início
          </button>

          <div
            className="fade-in"
            style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 36,
              boxShadow: "0 24px 60px rgba(13,45,107,0.10)",
            }}
          >
            <h2 style={{ color: "var(--text)", fontSize: 23, fontWeight: 800, margin: "0 0 4px" }}>Bem-vindo de volta</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 28px" }}>Acesse sua conta para continuar</p>

            <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@empresa.com.br" onEnter={handleLogin} />
            <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" onEnter={handleLogin} />

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
                <span style={{ color: "var(--danger)", fontSize: 13.5 }}>⚠️ {error}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className={loading ? "" : "btn-primary"}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14.5,
                color: "#ffffff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "var(--text-3)" : undefined,
              }}
            >
              {loading ? "Verificando..." : "Entrar →"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ color: "var(--text-2)", fontSize: 14 }}>
              Não tem conta?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="link-underline"
                style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 }}
              >
                Criar conta grátis
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
