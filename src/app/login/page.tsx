"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div style={{ marginBottom: 16 }}>
      <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 12,
          padding: "12px 16px",
          color: "#ffffff",
          fontSize: 14,
          outline: "none",
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      fontFamily: "'Inter', sans-serif",
      background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
      boxSizing: "border-box",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <button
          onClick={() => router.push("/")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#6b7280", fontSize: 14, marginBottom: 24, cursor: "pointer", padding: 0 }}
        >
          ← Voltar ao início
        </button>

        <div style={{ marginBottom: 24 }}>
          <Logo size="md" />
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 20, padding: 32 }}>
          <h2 style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Bem-vindo de volta</h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>Acesse sua conta para continuar</p>

          <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@empresa.com.br" onEnter={handleLogin} />
          <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" onEnter={handleLogin} />

          {error && (
            <div style={{ background: "rgba(127,29,29,0.4)", border: "1px solid #991b1b", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <span style={{ color: "#f87171", fontSize: 14 }}>⚠️ {error}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              color: "#ffffff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#374151" : "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: loading ? "none" : "0 4px 24px #6366f140",
            }}
          >
            {loading ? "Verificando..." : "Entrar →"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            Não tem conta?{" "}
            <button
              onClick={() => router.push("/signup")}
              style={{ background: "none", border: "none", color: "#818cf8", fontWeight: 500, fontSize: 14, cursor: "pointer", padding: 0 }}
            >
              Criar conta grátis
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
