"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const TEMA_COLORS = ["var(--primary)", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#a855f7"];

function temaColor(tema: string, allTemas: string[]) {
  const i = allTemas.indexOf(tema);
  return TEMA_COLORS[i % TEMA_COLORS.length];
}

function groupByTema(docs: Document[], allTemas: string[]) {
  const groups = new Map<string, Document[]>();
  for (const doc of docs) {
    const tema = doc.tema || "Outros";
    if (!groups.has(tema)) groups.set(tema, []);
    groups.get(tema)!.push(doc);
  }
  return Array.from(groups.entries()).map(([tema, items]) => ({
    tema,
    color: temaColor(tema, allTemas),
    docs: items,
  }));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
function Sidebar({ user, active, onLogout }: { user: User | null; active: string; onLogout: () => void }) {
  const router = useRouter();
  const name = user?.user_metadata?.full_name || user?.email || "Usuário";

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
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={isActive ? "" : "btn-ghost"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: isActive ? "var(--primary-light)" : "transparent",
                color: isActive ? "var(--primary-dark)" : "var(--text-2)",
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

// ─── DOCUMENT CARD ────────────────────────────────────────────
function DocCard({ doc, color, internal }: { doc: Document; color: string; internal?: boolean }) {
  return (
    <div
      className="hover-lift"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 2px 8px rgba(13,45,107,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: `${color}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
        }}>
          📄
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{doc.name}</div>
          {doc.category && (
            <span style={{
              display: "inline-block", marginTop: 6, fontSize: 10.5, fontWeight: 700, color,
              background: `${color}1a`, borderRadius: 999, padding: "2px 9px",
            }}>
              {doc.category}
            </span>
          )}
        </div>
      </div>
      <span style={{ color: "var(--text-3)", fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}>
        {internal ? "🔒 Interno" : "🔓 Público"}
      </span>
    </div>
  );
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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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

  const allTemas = useMemo(() => {
    const set = new Set<string>();
    [...publicDocs, ...internalDocs].forEach(d => set.add(d.tema || "Outros"));
    return Array.from(set);
  }, [publicDocs, internalDocs]);

  const filteredPublic = activeFilter ? publicDocs.filter(d => (d.tema || "Outros") === activeFilter) : publicDocs;
  const filteredInternal = activeFilter ? internalDocs.filter(d => (d.tema || "Outros") === activeFilter) : internalDocs;

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
        background: "var(--surface-2)",
        color: "var(--text-2)",
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--surface)" }}>
      <Sidebar user={user} active="documentos" onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto", background: "var(--surface-2)" }}>
        <div className="fade-in" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
          <h1 style={{ color: "var(--text)", fontSize: 25, fontWeight: 800, margin: "0 0 4px" }}>Documentos</h1>
          <p style={{ color: "var(--text-2)", fontSize: 14, margin: "0 0 24px" }}>
            Normas técnicas públicas disponíveis para consulta e documentos internos da sua empresa.
          </p>

          {loadingDocs && (
            <p style={{ color: "var(--text-2)", fontSize: 13 }}>Carregando documentos...</p>
          )}

          {docsError && !loadingDocs && (
            <p style={{ color: "var(--danger)", fontSize: 13 }}>{docsError}</p>
          )}

          {!loadingDocs && !docsError && allTemas.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              <button
                onClick={() => setActiveFilter(null)}
                className="pill-btn"
                style={{
                  padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${activeFilter === null ? "var(--primary)" : "var(--border)"}`,
                  background: activeFilter === null ? "var(--primary-light)" : "var(--surface)",
                  color: activeFilter === null ? "var(--primary-dark)" : "var(--text-2)",
                }}
              >
                Todos
              </button>
              {allTemas.map(tema => {
                const color = temaColor(tema, allTemas);
                const selected = activeFilter === tema;
                return (
                  <button
                    key={tema}
                    onClick={() => setActiveFilter(tema)}
                    className="pill-btn"
                    style={{
                      padding: "7px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${selected ? color : "var(--border)"}`,
                      background: selected ? `${color}1a` : "var(--surface)",
                      color: selected ? color : "var(--text-2)",
                    }}
                  >
                    {tema}
                  </button>
                );
              })}
            </div>
          )}

          {!loadingDocs && !docsError && groupByTema(filteredPublic, allTemas).map(section => (
            <div key={section.tema} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>📚</span>
                <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 700, margin: 0 }}>{section.tema}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {section.docs.map(doc => (
                  <DocCard key={doc.id} doc={doc} color={section.color} />
                ))}
              </div>
            </div>
          ))}

          {!loadingDocs && !docsError && filteredPublic.length === 0 && (
            <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 32 }}>Nenhum documento público disponível.</p>
          )}

          {!loadingDocs && !docsError && filteredInternal.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 700, margin: 0 }}>Documentos internos</h2>
              </div>
              {groupByTema(filteredInternal, allTemas).map(section => (
                <div key={section.tema} style={{ marginBottom: 20 }}>
                  <h3 style={{ color: "var(--text-2)", fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>{section.tema}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                    {section.docs.map(doc => (
                      <DocCard key={doc.id} doc={doc} color={section.color} internal />
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
              <h2 style={{ color: "var(--text)", fontSize: 16, fontWeight: 700, margin: 0 }}>Enviar documento interno</h2>
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
              className={`dropzone${dragOver ? " drag-over" : ""}`}
              style={{
                border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 18,
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "var(--primary-light)" : "var(--surface)",
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
              <div style={{ fontSize: 30, marginBottom: 10 }}>📄</div>
              <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                Arraste um PDF aqui ou clique para selecionar
              </p>
              <p style={{ color: "var(--text-2)", fontSize: 12, margin: 0 }}>
                Documentos internos ficam disponíveis apenas para a sua empresa
              </p>
            </div>

            {uploadedDocs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                {uploadedDocs.map((doc, i) => (
                  <div
                    key={`${doc.name}-${i}`}
                    className="fade-in"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                      <span style={{ fontSize: 16 }}>📄</span>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ color: "var(--text)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {doc.name}
                        </div>
                        <div style={{ color: "var(--text-3)", fontSize: 11 }}>{formatBytes(doc.size)}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px", flexShrink: 0,
                      color: doc.status === "pronto" ? "var(--success)" : "var(--warning)",
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
