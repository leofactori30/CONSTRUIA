"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Document = {
  id: string;
  name: string;
  category: string | null;
  tema: string | null;
  is_public: boolean;
  is_active: boolean;
  tenant_id: string | null;
  [key: string]: unknown;
};
type UploadedDoc = { name: string; size: number; status: "processando" | "pronto" };

const NAV_ITEMS = [
  { id: "chat", icon: "💬", label: "Chat", path: "/app/chat" },
  { id: "documentos", icon: "📁", label: "Documentos", path: "/app/documentos" },
  { id: "tokens", icon: "🔢", label: "Tokens", path: "/app/tokens" },
];

const TEMA_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#a855f7"];

function groupByTema(docs: Document[]) {
  const groups = new Map<string, Document[]>();
  for (const doc of docs) {
    const tema = doc.tema || "Outros";
    if (!groups.has(tema)) groups.set(tema, []);
    groups.get(tema)!.push(doc);
  }
  return Array.from(groups.entries()).map(([tema, items], i) => ({
    tema,
    color: TEMA_COLORS[i % TEMA_COLORS.length],
    docs: items,
  }));
}

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
function Sidebar({ user, active, onLogout }: { user: User | null; active: string; onLogout: () => void }) {
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
          const isActive = item.id === active;
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
                background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                color: isActive ? "#a5b4fc" : "#9ca3af",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentosPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [publicDocs, setPublicDocs] = useState<Document[]>([]);
  const [internalDocs, setInternalDocs] = useState<Document[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.push("/login");
        return;
      }
      setUser(data.session.user);

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.session.user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
      setCheckingSession(false);

      try {
        const res = await fetch("/api/documents", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          setDocsError(json.error || "Erro ao carregar documentos.");
        } else {
          setPublicDocs(json.public_docs || []);
          setInternalDocs(json.internal_docs || []);
        }
      } catch {
        setDocsError("Erro ao carregar documentos.");
      } finally {
        setLoadingDocs(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(f => f.type === "application/pdf");
    if (pdfs.length === 0) return;

    const newDocs: UploadedDoc[] = pdfs.map(f => ({ name: f.name, size: f.size, status: "processando" }));
    setUploadedDocs(prev => [...newDocs, ...prev]);

    newDocs.forEach(doc => {
      setTimeout(() => {
        setUploadedDocs(prev => prev.map(d => (d.name === doc.name && d.size === doc.size ? { ...d, status: "pronto" } : d)));
      }, 1500);
    });
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
      <Sidebar user={user} active="documentos" onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto", background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <h1 style={{ color: "#ffffff", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Documentos</h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 32px" }}>
            Normas técnicas públicas disponíveis para consulta e documentos internos da sua empresa.
          </p>

          {loadingDocs && (
            <p style={{ color: "#6b7280", fontSize: 13 }}>Carregando documentos...</p>
          )}

          {docsError && !loadingDocs && (
            <p style={{ color: "#f87171", fontSize: 13 }}>{docsError}</p>
          )}

          {!loadingDocs && !docsError && groupByTema(publicDocs).map(section => (
            <div key={section.tema} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>📚</span>
                <h2 style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, margin: 0 }}>{section.tema}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {section.docs.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid #1e293b",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 14 }}>{doc.name}</span>
                      {doc.category && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: section.color,
                          background: `${section.color}20`, borderRadius: 999, padding: "2px 8px",
                        }}>
                          {doc.category}
                        </span>
                      )}
                    </div>
                    <span style={{ color: "#6b7280", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      🔓 Público
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loadingDocs && !docsError && publicDocs.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 32 }}>Nenhum documento público disponível.</p>
          )}

          {!loadingDocs && !docsError && internalDocs.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <h2 style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, margin: 0 }}>Documentos internos</h2>
              </div>
              {groupByTema(internalDocs).map(section => (
                <div key={section.tema} style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>{section.tema}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                    {section.docs.map(doc => (
                      <div
                        key={doc.id}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid #1e293b",
                          borderRadius: 14,
                          padding: 16,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 14 }}>{doc.name}</span>
                          {doc.category && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: section.color,
                              background: `${section.color}20`, borderRadius: 999, padding: "2px 8px",
                            }}>
                              {doc.category}
                            </span>
                          )}
                        </div>
                        <span style={{ color: "#6b7280", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                          🔒 Interno
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>📤</span>
              <h2 style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, margin: 0 }}>Enviar documento interno</h2>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#6366f1" : "#374151"}`,
                borderRadius: 16,
                padding: "32px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                onChange={e => handleFiles(e.target.files)}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <p style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                Arraste um PDF aqui ou clique para selecionar
              </p>
              <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>
                Documentos internos ficam disponíveis apenas para a sua empresa
              </p>
            </div>

            {uploadedDocs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                {uploadedDocs.map((doc, i) => (
                  <div
                    key={`${doc.name}-${i}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: "12px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                      <span style={{ fontSize: 16 }}>📄</span>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {doc.name}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>{formatBytes(doc.size)}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px", flexShrink: 0,
                      color: doc.status === "pronto" ? "#10b981" : "#f59e0b",
                      background: doc.status === "pronto" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    }}>
                      {doc.status === "pronto" ? "✓ Pronto" : "⏳ Processando..."}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
