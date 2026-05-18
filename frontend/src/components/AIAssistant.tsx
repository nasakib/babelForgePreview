"use client";

import { useAI } from "@/context/AIContext";
import { useEffect, useRef, useState } from "react";

interface Msg { role: 'ai' | 'user' | 'sys'; content: string }

export default function AIAssistant() {
  const {
    isAssistantOpen,
    setIsAssistantOpen,
    currentModule,
    activePathologies,
    activeStack,
    integrityScore,
  } = useAI();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'sys', content: 'babelAI initialised · Gemini 1.5 + local engine fallback.' },
    { role: 'ai',  content: 'Standing by. Ask about the active topology, regimen, or any compound mechanism.' },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isAssistantOpen]);

  if (!isAssistantOpen) {
    return (
      <button
        onClick={() => setIsAssistantOpen(true)}
        aria-label="Open babelAI"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 bg-surface-100 border border-line-strong hover:border-accent-500 text-ink p-3 rounded-clinical shadow-lg flex items-center gap-2 transition min-h-[44px] min-w-[44px]"
      >
        <span className="status-dot ok" />
        <span className="text-[11px] font-mono uppercase tracking-widest2 text-ink-subtle">babelAI</span>
        <svg className="w-3.5 h-3.5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    );
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    const context = {
      module: currentModule,
      pathologies: activePathologies,
      stack: (activeStack as any[]).map((s: any) => ({ name: s.name, dose: s.dose ?? s.currentIntensity })),
      integrityScore,
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://babelforge-backend-6zvkkshyoq-uc.a.run.app";
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const data = await res.json();
      setMessages([...next, { role: 'ai', content: data.response ?? localFallback(text, context) }]);
    } catch {
      setMessages([...next, { role: 'ai', content: localFallback(text, context) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-5 sm:right-5 sm:w-[360px] max-h-[75vh] sm:max-h-[70vh] z-50 clinical-card flex flex-col animate-fade-in-up shadow-2xl">
      <div className="clinical-card-header">
        <div className="flex items-center gap-2">
          <span className="status-dot ok" />
          <span className="section-label-strong">babelAI · Context: {currentModule}</span>
        </div>
        <button onClick={() => setIsAssistantOpen(false)} className="text-ink-muted hover:text-ink text-[14px] leading-none">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 bg-canvas">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {m.role === 'sys' ? (
              <div className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">{m.content}</div>
            ) : (
              <div
                className={`max-w-[85%] text-[12px] leading-relaxed px-3 py-2 rounded-clinical border ${
                  m.role === 'user'
                    ? 'bg-accent-500/10 border-accent-500/40 text-ink'
                    : 'bg-surface-50 border-line text-ink-subtle'
                }`}
              >
                {m.content}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted live-caret">
            babelAI thinking
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-2 flex gap-2 bg-surface-0">
        <input
          type="text"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Query the engine…"
          className="input-clinical flex-1"
        />
        <button onClick={handleSend} disabled={busy || !input.trim()} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  );
}

function localFallback(q: string, ctx: any): string {
  const lower = q.toLowerCase();
  const stackTxt = ctx.stack?.length
    ? `Current regimen: ${ctx.stack.map((s: any) => `${s.name}@${s.dose}`).join(', ')}.`
    : 'No active regimen.';
  const pathTxt = ctx.pathologies?.length
    ? `Active states: ${ctx.pathologies.join(', ')}.`
    : 'No pathological state composed.';
  if (lower.includes('integrity') || lower.includes('score'))
    return `Topological integrity Φ = ${ctx.integrityScore}%. This is the ratio of the steady-state Kuramoto order parameter R to a healthy baseline. ${stackTxt}`;
  if (lower.includes('kuramoto') || lower.includes('phase'))
    return `The Kuramoto integrator on the Schaefer-200 connectome is evolving in real time. Coupling K* is derived from the active stack's repair/chaos vectors; noise σ scales with chaos. ${pathTxt}`;
  if (lower.includes('explain') || lower.includes('what'))
    return `babelForge composes pathological topology additively over a healthy connectome, then evolves a Kuramoto phase system on the composed graph. Drugs perturb coupling and noise. ${pathTxt} ${stackTxt}`;
  return `Local fallback (backend unreachable). ${pathTxt} ${stackTxt} Try the "Calculate Now" or "Auto-Optimize" buttons in the Console.`;
}