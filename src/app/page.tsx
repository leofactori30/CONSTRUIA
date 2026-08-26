"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";

// ─── PLANOS ───────────────────────────────────────────────────
const PLANS = [
  {
    id: "student", icon: "🎓", name: "Estudante",
    price: 26.91, orig: 29.90, discount: "10% OFF",
    tokens: "80.000 tokens/mês", color: "var(--primary)", highlight: false,
    features: ["Acesso às NRs e base pública", "Chat com IA ilimitado", "Suporte por e-mail", "Comprovante estudantil obrigatório"],
    cta: "Assinar como Estudante",
  },
  {
    id: "professional", icon: "👤", name: "Profissional",
    price: 29.90, orig: null, discount: null,
    tokens: "150.000 tokens/mês", color: "var(--warning)", highlight: true,
    features: ["Acesso às NRs e base pública", "Chat com IA ilimitado", "1 documento interno incluído", "Suporte prioritário"],
    cta: "Assinar Agora",
  },
  {
    id: "enterprise", icon: "🏢", name: "Empresas",
    price: null, orig: null, discount: null,
    tokens: "500.000+ tokens/mês", color: "var(--success)", highlight: false,
    features: ["Tudo do Profissional", "Múltiplos usuários", "Documentos ilimitados", "Atendimento personalizado"],
    cta: "Falar com Consultor", enterprise: true,
  },
];

const FEATURES = [
  { icon: "📋", title: "Base de Normas Públicas",   desc: "NRs, manuais do governo e legislações federais atualizadas." },
  { icon: "🤖", title: "IA Especializada",           desc: "Respostas baseadas exclusivamente nos documentos técnicos." },
  { icon: "🔒", title: "Ambiente Isolado",           desc: "Cada empresa tem seu próprio espaço seguro e privado." },
  { icon: "📎", title: "Citação Automática",         desc: "A IA indica sempre a norma e o artigo de referência." },
  { icon: "⚡", title: "Resposta em Segundos",       desc: "Sem folhear PDFs. A resposta técnica que você precisa." },
  { icon: "📁", title: "Documentos Internos",        desc: "Carregue normas da sua empresa e consulte junto com as públicas." },
];

const FAQS = [
  { q: "Como funciona o desconto estudantil?",  a: "Após escolher o plano Estudante, você fará upload da sua declaração de matrícula. Nossa equipe valida em até 24h." },
  { q: "Posso cancelar quando quiser?",          a: "Sim! Sem fidelidade. Cancele a qualquer momento pelo painel, sem multas." },
  { q: "Meus documentos internos ficam seguros?",a: "Totalmente. Cada empresa tem ambiente isolado. Seus documentos nunca são compartilhados." },
  { q: "Quais normas estão na base pública?",    a: "Todas as NRs do Ministério do Trabalho, Manuais SEAP, resoluções CONAMA e guias BIM." },
  { q: "O plano empresarial é diferente?",       a: "Sim. É customizável com múltiplos usuários e suporte dedicado. Entre em contato para uma proposta." },
];

const STEPS = [
  { n: "01", icon: "💳", title: "Escolha seu plano", desc: "Selecione o plano ideal — Estudante, Profissional ou Empresarial. Assine em minutos." },
  { n: "02", icon: "🔑", title: "Acesse a plataforma", desc: "Faça login e acesse seu ambiente com a base de normas ativa imediatamente." },
  { n: "03", icon: "💬", title: "Consulte com IA",    desc: "Pergunte em linguagem natural e receba respostas com citação da norma de referência." },
];

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

// ─── FAQ ITEM ─────────────────────────────────────────────────
function FaqItem({ f }: { f: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="hover-lift"
      style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", background: "var(--surface)" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", textAlign: "left", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14.5 }}>{f.q}</span>
        <span
          style={{
            color: "var(--primary)", fontSize: 20, marginLeft: 16, flexShrink: 0,
            transition: "transform 0.25s ease", transform: open ? "rotate(45deg)" : "none",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="faq-content" style={{ padding: "0 24px 20px", color: "var(--text-2)", fontSize: 14, lineHeight: 1.6 }}>
          {f.a}
        </div>
      )}
    </div>
  );
}

// ─── LANDING PAGE ──────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--surface)" }}>

      {/* NAV */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          boxShadow: scrolled ? "0 4px 20px rgba(13,45,107,0.08)" : "none",
          transition: "box-shadow 0.3s ease",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size="md" />
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["funcionalidades", "Funcionalidades"], ["planos", "Planos"], ["faq", "FAQ"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="link-underline"
                style={{ color: "var(--text-2)", fontSize: 14, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => router.push("/login")}
              className="btn-ghost"
              style={{
                color: "var(--text-2)", fontSize: 14, border: "1px solid var(--border)",
                padding: "9px 18px", borderRadius: 10, background: "none", cursor: "pointer",
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => scrollTo("planos")}
              className="btn-primary"
              style={{ padding: "10px 20px", borderRadius: 10, color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              Assinar
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: "relative", overflow: "hidden", minHeight: "100vh",
          display: "flex", alignItems: "center", paddingTop: 64,
          background: "linear-gradient(180deg, #ffffff 0%, var(--primary-light) 100%)",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.5,
            backgroundImage: "linear-gradient(rgba(45,125,210,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(45,125,210,0.08) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          style={{
            position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)",
            width: 480, height: 480, borderRadius: "50%", background: "var(--primary)", opacity: 0.12, filter: "blur(120px)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 1120, margin: "0 auto", padding: "128px 24px", textAlign: "center" }}>
          <Reveal>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999,
                border: "1px solid var(--border)", background: "var(--surface)", color: "var(--primary-dark)", fontSize: 13.5, marginBottom: 32,
                boxShadow: "0 2px 10px rgba(13,45,107,0.06)",
              }}
            >
              <span className="live-dot" style={{ width: 8, height: 8, background: "var(--success)", borderRadius: "50%" }} />
              Plataforma disponível • Acesso imediato
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.4rem)", fontWeight: 800, color: "var(--text)", margin: "0 0 24px", lineHeight: 1.1 }}>
              Consulte Normas Técnicas<br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}
              >
                com Inteligência Artificial
              </span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p style={{ color: "var(--text-2)", fontSize: 19, maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.6 }}>
              NRs, ABNTs, manuais do governo e normas internas da sua empresa — tudo respondido em segundos.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              <button
                onClick={() => scrollTo("planos")}
                className="btn-primary"
                style={{
                  padding: "16px 32px", borderRadius: 14, color: "#ffffff", fontWeight: 700, fontSize: 16.5,
                  border: "none", cursor: "pointer", boxShadow: "0 10px 30px rgba(45,125,210,0.28)",
                }}
              >
                Começar agora — R$ 29,90/mês →
              </button>
              <button
                onClick={() => router.push("/login")}
                className="btn-ghost"
                style={{
                  padding: "16px 32px", borderRadius: 14, color: "var(--text)", fontWeight: 700, fontSize: 16.5,
                  border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
                }}
              >
                Entrar na plataforma
              </button>
            </div>
          </Reveal>
          <Reveal delay={260}>
            <p style={{ color: "var(--text-3)", fontSize: 13.5, marginTop: 24 }}>
              Sem fidelidade • Cancele quando quiser • Estudantes têm 10% de desconto
            </p>
          </Reveal>
          <Reveal delay={320}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, marginTop: 80, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
              {[["13+", "NRs indexadas"], ["3s", "Tempo médio de resposta"], ["100%", "Fontes oficiais"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary-dark)" }}>{v}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section style={{ padding: "96px 24px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>Como funciona</h2>
              <p style={{ color: "var(--text-2)", fontSize: 17 }}>Em 3 passos simples você já está consultando normas com IA</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div style={{ position: "relative", textAlign: "center" }}>
                  <div
                    style={{
                      position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                      fontSize: 12, fontWeight: 800, color: "var(--primary)", background: "var(--primary-light)",
                      padding: "4px 12px", borderRadius: 999, border: "1px solid var(--border)",
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="hover-lift"
                    style={{ background: "var(--surface-2)", borderRadius: 20, padding: 36, border: "1px solid var(--border)" }}
                  >
                    <div style={{ fontSize: 44, marginBottom: 16 }}>{s.icon}</div>
                    <h3 style={{ color: "var(--text)", fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>{s.title}</h3>
                    <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" style={{ padding: "96px 24px", background: "var(--surface-2)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>Tudo que você precisa</h2>
              <p style={{ color: "var(--text-2)", fontSize: 17 }}>Ferramentas pensadas para quem trabalha com construção civil e arquitetura</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100}>
                <div
                  className="hover-lift"
                  style={{ background: "var(--surface)", borderRadius: 20, padding: 28, border: "1px solid var(--border)" }}
                >
                  <div
                    style={{
                      width: 52, height: 52, borderRadius: 14, background: "var(--primary-light)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>{f.title}</h3>
                  <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" style={{ padding: "96px 24px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", margin: "0 0 12px" }}>Planos e preços</h2>
              <p style={{ color: "var(--text-2)", fontSize: 17 }}>Cada plano inclui uma cota mensal de tokens correlacionada com a API do Claude</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28, alignItems: "start" }}>
            {PLANS.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 100}>
                <div
                  className="hover-lift"
                  style={{
                    position: "relative", borderRadius: 24,
                    border: plan.highlight ? `2px solid ${plan.color}` : "1px solid var(--border)",
                    background: plan.highlight ? `linear-gradient(180deg, ${plan.color}12, var(--surface) 60%)` : "var(--surface)",
                    boxShadow: plan.highlight ? `0 16px 40px rgba(245,158,11,0.16)` : "0 2px 12px rgba(13,45,107,0.04)",
                  }}
                >
                  {plan.highlight && (
                    <div
                      style={{
                        position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                        padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, color: "#ffffff", background: plan.color,
                        boxShadow: `0 4px 14px ${plan.color}55`,
                      }}
                    >
                      ⭐ Mais popular
                    </div>
                  )}
                  {plan.discount && (
                    <div
                      style={{
                        position: "absolute", top: -14, right: 20,
                        padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#ffffff", background: "var(--success)",
                      }}
                    >
                      {plan.discount}
                    </div>
                  )}
                  <div style={{ padding: 32 }}>
                    <div style={{ fontSize: 36, marginBottom: 14 }}>{plan.icon}</div>
                    <h3 style={{ color: "var(--text)", fontWeight: 800, fontSize: 20, margin: "0 0 4px" }}>{plan.name}</h3>
                    {plan.price ? (
                      <div style={{ marginBottom: 20 }}>
                        {plan.orig && (
                          <div style={{ color: "var(--text-3)", fontSize: 13, textDecoration: "line-through" }}>
                            R$ {plan.orig.toFixed(2).replace(".", ",")}/mês
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ fontSize: 36, fontWeight: 800, color: "var(--text)" }}>R$ {plan.price.toFixed(2).replace(".", ",")}</span>
                          <span style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 6 }}>/mês</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 20, fontSize: 24, fontWeight: 800, color: "var(--text)" }}>Sob consulta</div>
                    )}
                    <div
                      style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "10px 14px",
                        borderRadius: 12, border: `1px solid ${plan.color}40`, background: `${plan.color}0d`,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🔢</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: plan.color }}>{plan.tokens}</span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, color: "var(--text-2)" }}>
                          <span style={{ color: plan.color, fontWeight: 700 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => plan.enterprise ? window.open("https://wa.me/5511999999999", "_blank") : router.push("/signup")}
                      className="hover-scale"
                      style={{
                        width: "100%", padding: "14px 0", borderRadius: 12, fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                        color: plan.highlight || plan.enterprise ? "#ffffff" : plan.color,
                        background: plan.highlight || plan.enterprise ? plan.color : `${plan.color}12`,
                        border: plan.highlight || plan.enterprise ? "none" : `1px solid ${plan.color}`,
                      }}
                    >
                      {plan.enterprise ? "💬 " : ""}{plan.cta}
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "96px 24px", background: "var(--surface-2)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: "var(--text)", margin: 0 }}>Perguntas frequentes</h2>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <FaqItem f={f} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "96px 24px", background: "linear-gradient(135deg, var(--primary-dark), var(--primary))" }}>
        <Reveal>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#ffffff", margin: "0 0 12px" }}>Pronto para consultar normas com IA?</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, marginBottom: 40 }}>
              Junte-se a engenheiros e arquitetos que já economizam horas de pesquisa toda semana.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              <button
                onClick={() => scrollTo("planos")}
                className="hover-scale"
                style={{
                  padding: "16px 32px", borderRadius: 14, color: "var(--primary-dark)", fontWeight: 700, fontSize: 16.5,
                  border: "none", cursor: "pointer", background: "#ffffff", boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                }}
              >
                Assinar agora →
              </button>
              <button
                onClick={() => router.push("/login")}
                className="hover-scale"
                style={{
                  padding: "16px 32px", borderRadius: 14, color: "#ffffff", fontWeight: 700, fontSize: 16.5,
                  border: "1px solid rgba(255,255,255,0.4)", background: "transparent", cursor: "pointer",
                }}
              >
                Entrar na plataforma
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px 24px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Logo size="sm" />
          <p style={{ color: "var(--text-3)", fontSize: 12.5, margin: 0 }}>© 2026 Constru.IA — Todos os direitos reservados</p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Termos de Uso", "Privacidade", "Contato"].map(l => (
              <button
                key={l}
                className="link-underline"
                style={{ color: "var(--text-3)", fontSize: 12.5, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
