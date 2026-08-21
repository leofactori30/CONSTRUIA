"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

const NAV_ITEMS = [
  { id: "chat", icon: "💬", label: "Chat", path: "/app/chat" },
  { id: "documentos", icon: "📁", label: "Documentos", path: "/app/documentos" },
  { id: "tokens", icon: "🔢", label: "Tokens", path: "/app/tokens" },
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
function Sidebar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
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
          const active = item.id === "chat";
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
                background: active ? "rgba(99,102,241,0.15)" : "transparent",
                color: active ? "#a5b4fc" : "#9ca3af",
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

export default function ChatPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Sou a IA da Constru.IA. Pergunte sobre NRs, ABNTs ou normas internas da sua empresa." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
        return;
      }
      setUser(data.session.user);
      setAccessToken(data.session.access_token);
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

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
        body: JSON.stringify({ messages: nextMessages, session_id: sessionId }),
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
      <Sidebar user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)" }}>
        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div
                key={i}
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
                    background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#1e293b",
                    border: m.role === "assistant" ? "1px solid #334155" : "none",
                  }}>
                    {m.role === "user" ? (user?.email?.charAt(0).toUpperCase() ?? "U") : "🤖"}
                  </div>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 16,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: m.role === "user" ? "#ffffff" : "#e5e7eb",
                    background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "rgba(255,255,255,0.04)",
                    border: m.role === "assistant" ? "1px solid #1e293b" : "none",
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
                    fontSize: 13, background: "#1e293b", border: "1px solid #334155",
                  }}>
                    🤖
                  </div>
                  <div style={{
                    padding: "12px 16px", borderRadius: 16, fontSize: 14,
                    color: "#6b7280", background: "rgba(255,255,255,0.04)", border: "1px solid #1e293b",
                  }}>
                    Digitando...
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid #1e293b", padding: "20px 24px", background: "#0f172a" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {error && (
              <div style={{ background: "rgba(127,29,29,0.4)", border: "1px solid #991b1b", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                <span style={{ color: "#f87171", fontSize: 13 }}>⚠️ {error}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
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
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 14,
                  padding: "12px 16px",
                  color: "#ffffff",
                  fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  maxHeight: 160,
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                style={{
                  padding: "12px 20px",
                  borderRadius: 14,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#ffffff",
                  cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                  background: sending || !input.trim() ? "#374151" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                  boxShadow: sending || !input.trim() ? "none" : "0 4px 24px #6366f140",
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
