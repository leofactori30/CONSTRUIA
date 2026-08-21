"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fs = size === "sm" ? 18 : size === "lg" ? 32 : 24;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: fs, color: "#0d2d6b", lineHeight: 1 }}>Constru</span>
      <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: fs, color: "#2d7dd2", lineHeight: 1 }}>.IA</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/app/chat");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)", fontFamily: "'Inter',sans-serif" }}>

      {/* Painel esquerdo */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: "linear-gradient(160deg,#1e1b4b,#0f172a)" }}>
        <Logo size="md" />
        <div>
          <div className="text-5xl font-black text-white mb-4 leading-tight">Consulta técnica<br />com IA especializada</div>
          <p className="text-indigo-300 text-lg mb-10">NBRs, NRs e normas internas da sua empresa — tudo com inteligência artificial.</p>
          <div className="space-y-4">
            {[
              { icon: "🏗️", text: "Respostas baseadas exclusivamente nos seus documentos" },
              { icon: "🔒", text: "Ambiente isolado por empresa — total privacidade" },
              { icon: "⚡", text: "Citação automática da norma de referência" },
            ].map(f => (
              <div key={f.text} className="flex items-start gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-indigo-200 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-900 text-xs">© 2026 Constru.IA SaaS</p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-8 transition-colors">
            ← Voltar ao início
          </button>
          <div className="lg:hidden mb-8"><Logo size="md" /></div>

          <h2 className="text-white text-2xl font-bold mb-1">Bem-vindo de volta</h2>
          <p className="text-gray-500 text-sm mb-8">Acesse sua conta para continuar</p>

          <div className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block font-medium">E-mail corporativo</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="voce@empresa.com.br"
                className="w-full bg-gray-900 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none transition-colors"
                style={{ borderColor: error ? "#ef4444" : "#374151" }}
              />
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 text-xs font-medium">Senha</label>
                <button className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">Esqueci a senha</button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none pr-12 transition-colors"
                  style={{ borderColor: error ? "#ef4444" : "#374151" }}
                />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-lg">
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3">
                <span className="text-red-400 text-sm">⚠️ {error}</span>
              </div>
            )}

            {/* Botão */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200"
              style={{
                background: loading ? "#374151" : "linear-gradient(135deg,#6366f1,#4f46e5)",
                boxShadow: loading ? "none" : "0 4px 24px #6366f140",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verificando..." : "Entrar →"}
            </button>
          </div>

          {/* Criar conta */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Não tem conta?{" "}
              <button onClick={() => router.push("/signup")} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Criar conta grátis
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}