"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  label, type = "text", value, onChange, placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
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

function AceitarConviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!token) {
      setError("Link de convite inválido.");
      return;
    }
    if (!fullName || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/accept-invite", {
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
      background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
      boxSizing: "border-box",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
          <Logo size="md" />
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 20, padding: 32 }}>
          <h2 style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, margin: "0 0 4px", textAlign: "center" }}>
            Complete seu cadastro
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px", textAlign: "center" }}>
            Defina seu nome e uma senha para acessar a Constru.IA
          </p>

          {!token && (
            <div style={{ background: "rgba(127,29,29,0.4)", border: "1px solid #991b1b", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <span style={{ color: "#f87171", fontSize: 14 }}>⚠️ Link de convite inválido ou incompleto.</span>
            </div>
          )}

          <Field label="Nome completo" value={fullName} onChange={setFullName} placeholder="Seu nome" />
          <Field label="Nova senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

          {error && (
            <div style={{ background: "rgba(127,29,29,0.4)", border: "1px solid #991b1b", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <span style={{ color: "#f87171", fontSize: 14 }}>⚠️ {error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !token}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              color: "#ffffff",
              border: "none",
              cursor: loading || !token ? "not-allowed" : "pointer",
              background: loading || !token ? "#374151" : "linear-gradient(135deg,#6366f1,#4f46e5)",
              boxShadow: loading || !token ? "none" : "0 4px 24px #6366f140",
            }}
          >
            {loading ? "Criando acesso..." : "Aceitar convite →"}
          </button>
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
        background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",
        color: "#9ca3af",
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
