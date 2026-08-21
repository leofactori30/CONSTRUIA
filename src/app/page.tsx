"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── PLANOS ───────────────────────────────────────────────────
const PLANS = [
  {
    id: "student", icon: "🎓", name: "Estudante",
    price: 26.91, orig: 29.90, discount: "10% OFF",
    tokens: "80.000 tokens/mês", color: "#6366f1", highlight: false,
    features: ["Acesso às NRs e base pública", "Chat com IA ilimitado", "Suporte por e-mail", "Comprovante estudantil obrigatório"],
    cta: "Assinar como Estudante",
  },
  {
    id: "professional", icon: "👤", name: "Profissional",
    price: 29.90, orig: null, discount: null,
    tokens: "150.000 tokens/mês", color: "#f59e0b", highlight: true,
    features: ["Acesso às NRs e base pública", "Chat com IA ilimitado", "1 documento interno incluído", "Suporte prioritário"],
    cta: "Assinar Agora",
  },
  {
    id: "enterprise", icon: "🏢", name: "Empresas",
    price: null, orig: null, discount: null,
    tokens: "500.000+ tokens/mês", color: "#10b981", highlight: false,
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

// ─── FAQ ITEM ─────────────────────────────────────────────────
function FaqItem({ f }: { f: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-5 text-left">
        <span className="text-gray-900 font-semibold text-sm">{f.q}</span>
        <span className="text-indigo-500 text-xl ml-4 flex-shrink-0 transition-transform" style={{ transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      {open && <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">{f.a}</div>}
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
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8">
            {[["funcionalidades", "Funcionalidades"], ["planos", "Planos"], ["faq", "FAQ"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-gray-600 hover:text-gray-900 text-sm transition-colors">{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/login")} className="text-gray-600 hover:text-gray-900 text-sm border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg transition-all hidden md:block">
              Entrar
            </button>
            <button onClick={() => scrollTo("planos")} className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
              Assinar
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-16"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20" style={{ background: "#6366f1", filter: "blur(120px)" }} />
        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-800 bg-indigo-950/60 text-indigo-300 text-sm mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Plataforma disponível • Acesso imediato
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Consulte Normas Técnicas<br />
            <span style={{ background: "linear-gradient(135deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              com Inteligência Artificial
            </span>
          </h1>
          <p className="text-gray-300 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            NRs, ABNTs, manuais do governo e normas internas da sua empresa — tudo respondido em segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollTo("planos")} className="px-8 py-4 rounded-2xl text-white font-bold text-lg hover:scale-105 transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 32px #6366f150" }}>
              Começar agora — R$ 29,90/mês →
            </button>
            <button onClick={() => router.push("/login")} className="px-8 py-4 rounded-2xl text-white font-bold text-lg border border-gray-700 hover:border-gray-500 transition-all">
              Entrar na plataforma
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-6">Sem fidelidade • Cancele quando quiser • Estudantes têm 10% de desconto</p>
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-lg mx-auto">
            {[["13+", "NRs indexadas"], ["3s", "Tempo médio de resposta"], ["100%", "Fontes oficiais"]].map(([v, l]) => (
              <div key={l}><div className="text-3xl font-black text-white">{v}</div><div className="text-gray-500 text-xs mt-1">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Como funciona</h2>
            <p className="text-gray-500 text-lg">Em 3 passos simples você já está consultando normas com IA</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", icon: "💳", title: "Escolha seu plano", desc: "Selecione o plano ideal — Estudante, Profissional ou Empresarial. Assine em minutos." },
              { n: "02", icon: "🔑", title: "Acesse a plataforma", desc: "Faça login e acesse seu ambiente com a base de normas ativa imediatamente." },
              { n: "03", icon: "💬", title: "Consulte com IA",    desc: "Pergunte em linguagem natural e receba respostas com citação da norma de referência." },
            ].map(s => (
              <div key={s.n} className="relative text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">{s.n}</div>
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all">
                  <div className="text-5xl mb-4">{s.icon}</div>
                  <h3 className="text-gray-900 font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Tudo que você precisa</h2>
            <p className="text-gray-500 text-lg">Ferramentas pensadas para quem trabalha com construção civil e arquitetura</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="text-gray-900 font-bold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-24" style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Planos e preços</h2>
            <p className="text-gray-400 text-lg">Cada plano inclui uma cota mensal de tokens correlacionada com a API do Claude</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PLANS.map(plan => (
              <div key={plan.id} className="relative rounded-2xl border transition-all duration-300 hover:scale-105"
                style={{ background: plan.highlight ? `${plan.color}15` : "rgba(255,255,255,0.03)", borderColor: plan.highlight ? plan.color : "#1e293b", boxShadow: plan.highlight ? `0 8px 40px ${plan.color}30` : "none" }}>
                {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: plan.color }}>⭐ Mais popular</div>}
                {plan.discount  && <div className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-green-500">{plan.discount}</div>}
                <div className="p-8">
                  <div className="text-4xl mb-3">{plan.icon}</div>
                  <h3 className="text-white font-black text-xl mb-1">{plan.name}</h3>
                  {plan.price ? (
                    <div className="mb-4">
                      {plan.orig && <div className="text-gray-600 text-sm line-through">R$ {plan.orig.toFixed(2).replace(".", ",")}/mês</div>}
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-white">R$ {plan.price.toFixed(2).replace(".", ",")}</span>
                        <span className="text-gray-400 text-sm mb-1">/mês</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 text-2xl font-black text-white">Sob consulta</div>
                  )}
                  <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl border" style={{ borderColor: `${plan.color}50`, background: `${plan.color}10` }}>
                    <span className="text-lg">🔢</span>
                    <span className="text-sm font-medium" style={{ color: plan.color }}>{plan.tokens}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                        <span style={{ color: plan.color }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => plan.enterprise ? window.open("https://wa.me/5511999999999", "_blank") : router.push("/signup")}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                    style={{ background: plan.highlight || plan.enterprise ? plan.color : `${plan.color}30`, border: plan.highlight || plan.enterprise ? "none" : `1px solid ${plan.color}` }}>
                    {plan.enterprise ? "💬 " : ""}{plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Perguntas frequentes</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f, i) => <FaqItem key={i} f={f} />)}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24" style={{ background: "linear-gradient(135deg,#1e1b4b,#0f172a)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">Pronto para consultar normas com IA?</h2>
          <p className="text-gray-400 text-lg mb-10">Junte-se a engenheiros e arquitetos que já economizam horas de pesquisa toda semana.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollTo("planos")} className="px-8 py-4 rounded-2xl text-white font-bold text-lg hover:scale-105 transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 8px 32px #6366f150" }}>
              Assinar agora →
            </button>
            <button onClick={() => router.push("/login")} className="px-8 py-4 rounded-2xl text-white font-bold text-lg border border-gray-700 hover:border-gray-500 transition-all">
              Entrar na plataforma
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-gray-200" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-gray-500 text-xs">© 2026 Constru.IA — Todos os direitos reservados</p>
          <div className="flex gap-6">
            {["Termos de Uso", "Privacidade", "Contato"].map(l => (
              <button key={l} className="text-gray-400 hover:text-gray-600 text-xs transition-colors">{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
