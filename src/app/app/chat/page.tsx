"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

type Theme = {
  id: string;
  icon: string;
  label: string;
  description: string;
  greeting: string;
  questions: string[];
};

const NAV_ITEMS = [
  { id: "chat", icon: "💬", label: "Chat", path: "/app/chat" },
  { id: "documentos", icon: "📁", label: "Documentos", path: "/app/documentos" },
  { id: "tokens", icon: "🔢", label: "Tokens", path: "/app/tokens" },
];

const THEMES: Theme[] = [
  {
    id: "seguranca",
    icon: "🦺",
    label: "Segurança",
    description: "NRs, EPIs, acidentes de trabalho",
    greeting: "Olá! Sou a IA da Constru.IA focada em Segurança do Trabalho. Pergunte sobre NRs, EPIs, PCMSO ou acidentes de trabalho.",
    questions: ["O que exige a NR-18?", "Quando é obrigatório PCMSO?"],
  },
  {
    id: "meio_ambiente",
    icon: "🌿",
    label: "Meio Ambiente",
    description: "CONAMA, licenciamento, resíduos",
    greeting: "Olá! Sou a IA da Constru.IA focada em Meio Ambiente. Pergunte sobre resoluções CONAMA, licenciamento ou gestão de resíduos.",
    questions: ["O que diz a CONAMA 307?", "Como licenciar uma obra?"],
  },
  {
    id: "projetos",
    icon: "📐",
    label: "Projetos de Engenharia",
    description: "licitações, SINAPI, urbanismo",
    greeting: "Olá! Sou a IA da Constru.IA focada em Projetos de Engenharia. Pergunte sobre licitações, SINAPI ou legislação de urbanismo.",
    questions: ["Como usar o SINAPI?", "O que exige a Lei 14.133?"],
  },
  {
    id: "bim",
    icon: "💻",
    label: "BIM / Tecnologia",
    description: "modelagem, IFC, decretos BIM",
    greeting: "Olá! Sou a IA da Constru.IA focada em BIM. Pergunte sobre modelagem, formato IFC ou decretos BIM.",
    questions: ["O que é o Decreto BIM BR?", "Como montar um BEP?"],
  },
  {
    id: "geral",
    icon: "🔍",
    label: "Consulta Geral",
    description: "todos os documentos",
    greeting: "Olá! Sou a IA da Constru.IA. Pergunte sobre NRs, ABNTs, CONAMA, BIM ou normas internas da sua empresa.",
    questions: ["O que exige a NR-18?", "O que diz a CONAMA 307?", "Como usar o SINAPI?", "O que é o Decreto BIM BR?"],
  },
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

// ─── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ user, isAdmin, onLogout }: { user: User | null; isAdmin: boolean; onLogout: () => void }) {
  const router = useRouter();
  const name = user?.user_metadata?.full_name || user?.email || "Usuário";
  const navItems = isAdmin
    ? [...NAV_ITEMS, { id: "admin", icon: "🛠️", label: "Admin", path: "/app/admin" }]
    : NAV_ITEMS;

  return (
    <div style={{
      width: 260,
      minWidth: 260,
      height: "100vh",
      background: "var(--surface-2)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)" }}>
        <Logo size="md" />
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map(item => {
          const active = item.id === "chat";
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={active ? "" : "btn-ghost"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: active ? "var(--primary-light)" : "transparent",
                color: active ? "var(--primary-dark)" : "var(--text-2)",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
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

      <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ffffff", fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="btn-ghost"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-2)",
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

export default function ChatPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());

  const [theme, setTheme] = useState<Theme | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

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

      setIsAdmin(res.ok && profile?.role === "admin");
      setCheckingSession(false);
    });
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSelectTheme = (selected: Theme) => {
    setTheme(selected);
    setMessages([{ role: "assistant", content: selected.greeting }]);
    setInput("");
    setError("");
    setSessionId(crypto.randomUUID());
  };

  const handleChangeTheme = () => {
    setTheme(null);
    setMessages([]);
    setInput("");
    setError("");
  };

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending || !theme) return;

    setError("");
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages: nextMessages, session_id: sessionId, tema: theme.id }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result?.error || "Não foi possível obter uma resposta.");
        setSending(false);
        return;
      }

      const reply = result.content ?? result.message ?? result.reply ?? "";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  if (checkingSession) {
    return (
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
    );
  }

  if (!theme) {
    return (
      <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--surface)" }}>
        <Sidebar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

        <div style={{ flex: 1, overflowY: "auto", background: "var(--surface)" }}>
          <div className="fade-in" style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px" }}>
            <h1 style={{ color: "var(--text)", fontSize: 26, fontWeight: 800, margin: "0 0 6px", textAlign: "center" }}>
              Sobre o que você quer conversar?
            </h1>
            <p style={{ color: "var(--text-2)", fontSize: 14.5, margin: "0 0 36px", textAlign: "center" }}>
              Escolha um tema para focar a conversa nas normas relacionadas.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t)}
                  className="hover-lift"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 10,
                    textAlign: "left",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    padding: 22,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: "0 2px 10px rgba(13,45,107,0.04)",
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: "var(--primary-light)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                  }}>
                    {t.icon}
                  </div>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15.5 }}>{t.label}</span>
                  <span style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5 }}>{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--surface)" }}>
      <Sidebar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", background: "var(--surface-2)" }}>
        {/* Header do tema */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)",
        }}>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: "var(--primary-dark)", fontSize: 13.5, fontWeight: 700,
              background: "var(--primary-light)", padding: "7px 14px", borderRadius: 999,
            }}
          >
            {theme.icon} {theme.label}
          </span>
          <button
            onClick={handleChangeTheme}
            className="btn-ghost"
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-2)",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Trocar tema
          </button>
        </div>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className="fade-in"
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{ display: "flex", gap: 10, maxWidth: "80%", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#ffffff",
                    background: m.role === "user" ? "linear-gradient(135deg, var(--primary-dark), var(--primary))" : "var(--primary-light)",
                    border: m.role === "assistant" ? "1px solid var(--border)" : "none",
                  }}>
                    {m.role === "user" ? (user?.email?.charAt(0).toUpperCase() ?? "U") : "🤖"}
                  </div>
                  <div style={{
                    padding: "12px 18px",
                    borderRadius: 20,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: m.role === "user" ? "#ffffff" : "var(--text)",
                    background: m.role === "user" ? "linear-gradient(135deg, var(--primary-dark), var(--primary))" : "var(--surface)",
                    border: m.role === "assistant" ? "1px solid var(--border)" : "none",
                    boxShadow: m.role === "assistant" ? "0 2px 8px rgba(13,45,107,0.04)" : "0 4px 14px rgba(45,125,210,0.25)",
                    whiteSpace: "pre-wrap",
                  }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, background: "var(--primary-light)", border: "1px solid var(--border)",
                  }}>
                    🤖
                  </div>
                  <div style={{
                    padding: "12px 18px", borderRadius: 20, fontSize: 14,
                    color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)",
                  }}>
                    Digitando...
                  </div>
                </div>
              </div>
            )}

            {messages.length === 1 && theme.questions.length > 0 && !sending && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {theme.questions.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="pill-btn"
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--primary-dark)",
                      fontSize: 12.5,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: "20px 24px 28px", background: "var(--surface-2)" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                <span style={{ color: "var(--danger)", fontSize: 13 }}>⚠️ {error}</span>
              </div>
            )}
            <div
              style={{
                display: "flex", gap: 10, alignItems: "flex-end",
                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20,
                padding: 10, boxShadow: "0 8px 28px rgba(13,45,107,0.08)",
              }}
            >
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Pergunte sobre uma norma técnica..."
                rows={1}
                style={{
                  flex: 1,
                  resize: "none",
                  background: "transparent",
                  border: "none",
                  borderRadius: 14,
                  padding: "10px 12px",
                  color: "var(--text)",
                  fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  maxHeight: 160,
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                className={sending || !input.trim() ? "" : "btn-primary"}
                style={{
                  padding: "12px 22px",
                  borderRadius: 14,
                  border: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#ffffff",
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                  background: sending || !input.trim() ? "var(--text-3)" : undefined,
                  flexShrink: 0,
                }}
              >
                Enviar →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
