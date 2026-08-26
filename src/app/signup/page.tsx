"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── PLANOS ───────────────────────────────────────────────────
const PLANS = [
  {
    id: "student", icon: "🎓", name: "Estudante",
    price: 26.91, orig: 29.90, discount: "10% OFF",
    tokens: "80.000 tokens/mês", color: "var(--primary)",
  },
  {
    id: "professional", icon: "👤", name: "Profissional",
    price: 29.90, orig: null, discount: null,
    tokens: "150.000 tokens/mês", color: "var(--warning)",
  },
  {
    id: "enterprise", icon: "🏢", name: "Empresas",
    price: null, orig: null, discount: null,
    tokens: "500.000+ tokens/mês", color: "var(--success)",
  },
];

const STEPS = ["Dados pessoais", "Escolha de plano", "Confirmação"];

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
    <div style={{ marginBottom: 20 }}>
      <label style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 8 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-underline"
        style={{
          width: "100%",
          padding: "10px 2px",
          color: "var(--text)",
          fontSize: 14.5,
          fontFamily: "'Inter', sans-serif",
          boxSizing: "border-box",
          borderBottomColor: error ? "var(--danger)" : undefined,
        }}
      />
    </div>
  );
}

// ─── STEP INDICATOR ───────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: active || done ? "linear-gradient(135deg, var(--primary-dark), var(--primary))" : "var(--surface-3)",
                  color: active || done ? "#ffffff" : "var(--text-3)",
                  border: active ? "2px solid var(--primary-light)" : "none",
                  boxShadow: active ? "0 0 0 4px var(--primary-light)" : "none",
                  transition: "background 0.35s ease, box-shadow 0.35s ease, color 0.35s ease",
                }}
              >
                {done ? "✓" : n}
              </div>
              <span style={{ fontSize: 11, color: active ? "var(--text)" : "var(--text-3)", marginTop: 6, whiteSpace: "nowrap", fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1, height: 3, borderRadius: 999, margin: "0 8px", marginBottom: 18,
                  background: "var(--surface-3)", overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%", width: done ? "100%" : "0%",
                    background: "linear-gradient(90deg, var(--primary-dark), var(--primary))",
                    transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
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
            Crie sua conta e<br />comece agora mesmo.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.6, maxWidth: 360, margin: 0 }}>
            Escolha um plano, confirme seus dados e tenha acesso imediato à base de normas técnicas com IA.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 40 }}>
            {["Chat com IA ilimitado", "Base pública de NRs e ABNTs", "Cancele quando quiser"].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>{item}
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
        <div style={{ width: "100%", maxWidth: 480 }}>
          <button
            onClick={() => router.push("/")}
            className="link-underline"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-2)", fontSize: 14, marginBottom: 24, cursor: "pointer", padding: 0 }}
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
            <StepIndicator step={step} />

            {step === 1 && (
              <div className="fade-in" key="step1">
                <h2 style={{ color: "var(--text)", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Crie sua conta</h2>
                <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 24px" }}>Comece com seus dados pessoais</p>

                <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
                <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@empresa.com.br" />
                <Field label="CPF" value={cpf} onChange={v => setCpf(formatCpf(v))} placeholder="000.000.000-00" />
                <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                <Field label="Confirmar senha" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
              </div>
            )}

            {step === 2 && (
              <div className="fade-in" key="step2">
                <h2 style={{ color: "var(--text)", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Escolha seu plano</h2>
                <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 24px" }}>Você pode mudar de plano quando quiser</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {PLANS.map(plan => {
                    const selected = plan.id === planId;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setPlanId(plan.id)}
                        className="plan-select"
                        style={{
                          cursor: "pointer",
                          borderRadius: 14,
                          border: `2px solid ${selected ? plan.color : "var(--border)"}`,
                          background: selected ? `${plan.color}12` : "var(--surface)",
                          boxShadow: selected ? `0 6px 20px rgba(45,125,210,0.14)` : "none",
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
                            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>
                              {plan.name}
                              {plan.discount && (
                                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#ffffff", background: "var(--success)", borderRadius: 999, padding: "2px 8px" }}>
                                  {plan.discount}
                                </span>
                              )}
                            </div>
                            <div style={{ color: plan.color, fontSize: 12, marginTop: 2, fontWeight: 600 }}>{plan.tokens}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {plan.price ? (
                            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16 }}>
                              R$ {plan.price.toFixed(2).replace(".", ",")}<span style={{ color: "var(--text-2)", fontSize: 11, fontWeight: 400 }}>/mês</span>
                            </div>
                          ) : (
                            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>Sob consulta</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="fade-in" key="step3">
                <h2 style={{ color: "var(--text)", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Confirme seus dados</h2>
                <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 24px" }}>Revise as informações antes de criar sua conta</p>

                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                  <SummaryRow label="Nome" value={name} />
                  <SummaryRow label="E-mail" value={email} />
                  <SummaryRow label="CPF" value={cpf} />
                  <SummaryRow
                    label="Plano"
                    value={`${selectedPlan.icon} ${selectedPlan.name}${selectedPlan.price ? ` — R$ ${selectedPlan.price.toFixed(2).replace(".", ",")}/mês` : " — sob consulta"}`}
                    last
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
                <span style={{ color: "var(--danger)", fontSize: 13.5 }}>⚠️ {error}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {step > 1 && (
                <button
                  onClick={goBack}
                  disabled={loading}
                  className="btn-ghost"
                  style={{
                    flex: 1, padding: "13px 0", borderRadius: 12, fontWeight: 600, fontSize: 14,
                    background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Voltar
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={goNext}
                  className="btn-primary"
                  style={{
                    flex: 2, padding: "13px 0", borderRadius: 12, fontWeight: 700, fontSize: 14.5,
                    color: "#ffffff", border: "none", cursor: "pointer",
                  }}
                >
                  Continuar →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={loading ? "" : "btn-primary"}
                  style={{
                    flex: 2, padding: "13px 0", borderRadius: 12, fontWeight: 700, fontSize: 14.5,
                    color: "#ffffff", border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: loading ? "var(--text-3)" : undefined,
                  }}
                >
                  {loading ? "Criando conta..." : "Criar conta →"}
                </button>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ color: "var(--text-2)", fontSize: 14 }}>
              Já tem conta?{" "}
              <button
                onClick={() => router.push("/login")}
                className="link-underline"
                style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 }}
              >
                Entrar
              </button>
            </span>
          </div>
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
      borderBottom: last ? "none" : "1px solid var(--border)",
    }}>
      <span style={{ color: "var(--text-2)", fontSize: 13 }}>{label}</span>
      <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}
