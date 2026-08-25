"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── PLANOS ───────────────────────────────────────────────────
const PLANS = [
  {
    id: "student", icon: "🎓", name: "Estudante",
    price: 26.91, orig: 29.90, discount: "10% OFF",
    tokens: "80.000 tokens/mês", color: "#6366f1", highlight: false,
  },
  {
    id: "professional", icon: "👤", name: "Profissional",
    price: 29.90, orig: null, discount: null,
    tokens: "150.000 tokens/mês", color: "#f59e0b", highlight: true,
  },
  {
    id: "enterprise", icon: "🏢", name: "Empresas",
    price: null, orig: null, discount: null,
    tokens: "500.000+ tokens/mês", color: "#10b981", highlight: false,
  },
];

const STEPS = ["Dados pessoais", "Escolha de plano", "Confirmação"];

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
  label, type = "text", value, onChange, placeholder, error,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
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
          border: `1px solid ${error ? "#ef4444" : "#374151"}`,
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

// ─── STEP INDICATOR ───────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                background: active || done ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#1f2937",
                color: active || done ? "#ffffff" : "#6b7280",
                border: active ? "2px solid #a5b4fc" : "none",
              }}>
                {done ? "✓" : n}
              </div>
              <span style={{ fontSize: 11, color: active ? "#e5e7eb" : "#6b7280", marginTop: 6, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "#4f46e5" : "#1f2937", margin: "0 8px", marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // dados pessoais
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // plano
  const [planId, setPlanId] = useState("professional");
  const selectedPlan = PLANS.find(p => p.id === planId)!;

  const formatCpf = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const validateStep1 = () => {
    if (!name || !email || !cpf || !password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return false;
    }
    if (cpf.replace(/\D/g, "").length !== 11) {
      setError("CPF inválido.");
      return false;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return false;
    }
    return true;
  };

  const goNext = () => {
    setError("");
    if (step === 1 && !validateStep1()) return;
    setStep(s => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setError("");
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError("");

    if (planId === "enterprise") {
      setError("Para o plano Empresas, fale com nosso time de vendas em vendas@construia.com.br.");
      return;
    }

    setLoading(true);

    const signupRes = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: name, plan: planId }),
    });
    const signupResult = await signupRes.json();

    if (!signupRes.ok) {
      setError(signupResult.error ?? "Não foi possível criar sua conta.");
      setLoading(false);
      return;
    }

    const checkoutRes = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, email, full_name: name, cpf }),
    });
    const checkoutResult = await checkoutRes.json();

    if (!checkoutRes.ok || !checkoutResult.url) {
      setError(checkoutResult.error ?? "Não foi possível iniciar o pagamento.");
      setLoading(false);
      return;
    }

    window.location.href = checkoutResult.url;
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
          <StepIndicator step={step} />

          {step === 1 && (
            <>
              <h2 style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Crie sua conta</h2>
              <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>Comece com seus dados pessoais</p>

              <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
              <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@empresa.com.br" />
              <Field label="CPF" value={cpf} onChange={v => setCpf(formatCpf(v))} placeholder="000.000.000-00" />
              <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              <Field label="Confirmar senha" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Escolha seu plano</h2>
              <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>Você pode mudar de plano quando quiser</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {PLANS.map(plan => {
                  const selected = plan.id === planId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setPlanId(plan.id)}
                      style={{
                        cursor: "pointer",
                        borderRadius: 14,
                        border: `2px solid ${selected ? plan.color : "#1f2937"}`,
                        background: selected ? `${plan.color}15` : "rgba(255,255,255,0.02)",
                        padding: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 26 }}>{plan.icon}</span>
                        <div>
                          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 15 }}>
                            {plan.name}
                            {plan.discount && (
                              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#ffffff", background: "#10b981", borderRadius: 999, padding: "2px 8px" }}>
                                {plan.discount}
                              </span>
                            )}
                          </div>
                          <div style={{ color: plan.color, fontSize: 12, marginTop: 2 }}>{plan.tokens}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {plan.price ? (
                          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>
                            R$ {plan.price.toFixed(2).replace(".", ",")}<span style={{ color: "#6b7280", fontSize: 11, fontWeight: 400 }}>/mês</span>
                          </div>
                        ) : (
                          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 13 }}>Sob consulta</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Confirme seus dados</h2>
              <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>Revise as informações antes de criar sua conta</p>

              <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <SummaryRow label="Nome" value={name} />
                <SummaryRow label="E-mail" value={email} />
                <SummaryRow label="CPF" value={cpf} />
                <SummaryRow
                  label="Plano"
                  value={`${selectedPlan.icon} ${selectedPlan.name}${selectedPlan.price ? ` — R$ ${selectedPlan.price.toFixed(2).replace(".", ",")}/mês` : " — sob consulta"}`}
                  last
                />
              </div>
            </>
          )}

          {error && (
            <div style={{ background: "rgba(127,29,29,0.4)", border: "1px solid #991b1b", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
              <span style={{ color: "#f87171", fontSize: 14 }}>⚠️ {error}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {step > 1 && (
              <button
                onClick={goBack}
                disabled={loading}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 600, fontSize: 14,
                  background: "transparent", color: "#9ca3af", border: "1px solid #374151",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={goNext}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 12, fontWeight: 600, fontSize: 14,
                  color: "#ffffff", border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                  boxShadow: "0 4px 24px #6366f140",
                }}
              >
                Continuar →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 12, fontWeight: 600, fontSize: 14,
                  color: "#ffffff", border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: loading ? "#374151" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  boxShadow: loading ? "none" : "0 4px 24px #6366f140",
                }}
              >
                {loading ? "Criando conta..." : "Criar conta →"}
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span style={{ color: "#6b7280", fontSize: 14 }}>
            Já tem conta?{" "}
            <button
              onClick={() => router.push("/login")}
              style={{ background: "none", border: "none", color: "#818cf8", fontWeight: 500, fontSize: 14, cursor: "pointer", padding: 0 }}
            >
              Entrar
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 16,
      padding: "10px 0",
      borderBottom: last ? "none" : "1px solid #1f2937",
    }}>
      <span style={{ color: "#6b7280", fontSize: 13 }}>{label}</span>
      <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}
