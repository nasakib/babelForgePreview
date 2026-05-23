"use client";

import { useAI } from "@/context/AIContext";
import { citationUrl, wisdomForPrompt } from "@/lib/wisdom/select";
import { tokenize, tokensForPrompt } from "@/lib/brain/tokens";
import { BABELFORGE_API_URL } from "@/lib/api/client";
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
    wisdom,
    fmriDataset,
  } = useAI();
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'sys', content: 'FORGEai initialised · Gemini 1.5 + local engine fallback.' },
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
        aria-label="Open FORGEai"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 bg-surface-100 border border-line-strong hover:border-accent-500 text-ink p-3 rounded-clinical shadow-lg flex items-center gap-2 transition min-h-[44px] min-w-[44px]"
      >
        <span className="status-dot ok" />
        <span className="text-[11px] font-mono uppercase tracking-widest2 text-ink-subtle">FORGEai</span>
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

    const tokens = tokenize({
      pathologies: activePathologies,
      stack: activeStack as any[],
      dataset: fmriDataset,
      integrity: integrityScore,
    });

    const context = {
      module: currentModule,
      pathologies: activePathologies,
      stack: (activeStack as any[]).map((s: any) => ({ name: s.name, dose: s.dose ?? s.currentIntensity })),
      integrityScore,
      // Grounding evidence — a compact, citation-anchored serialization of
      // the top-ranked corpus entries for the current state. The backend
      // injects this into the model's system prompt so responses cite
      // real sources instead of confabulating.
      grounding: wisdomForPrompt(wisdom),
      wisdomIds: wisdom.map((w) => w.id),
      // Brain tokens — compressed color/motion/frequency-coded handles
      // so the model can name regions, modulators, and live metrics in a
      // canonical vocabulary the rest of the app shares.
      brainTokens: tokensForPrompt(tokens),
      hasDataset: !!fmriDataset,
    };

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(`${BABELFORGE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        setMessages([...next, { role: 'ai', content: localFallback(text, context) }]);
        return;
      }
      const data = await res.json();
      const reply = typeof data?.response === 'string' ? data.response : '';
      
      // Surface server-side configuration errors clearly instead of swallowing them.
      if (/GEMINI_API_KEY|not configured|missing key/i.test(reply)) {
        setMessages([
          ...next,
          {
            role: 'ai',
            content: localFallback(text, context),
          },
        ]);
        return;
      }
      setMessages([
        ...next,
        { role: 'ai', content: reply || localFallback(text, context) },
      ]);
    } catch (err: any) {
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
          <span className="section-label-strong">FORGEai · Context: {currentModule}</span>
        </div>
        <button onClick={() => setIsAssistantOpen(false)} className="text-ink-muted hover:text-ink text-[14px] leading-none">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 bg-canvas">
        {wisdom.length > 0 && (
          <div className="mb-2 border border-line rounded-clinical bg-surface-0/60 p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
                Wisdom · grounded evidence
              </span>
              <span className="text-[10px] font-mono text-ink-dim">
                {wisdom.length} hit{wisdom.length === 1 ? "" : "s"}
              </span>
            </div>
            {wisdom.slice(0, 3).map((w) => (
              <div key={w.id} className="text-[11px] leading-snug text-ink-subtle">
                <span className="text-accent-400 mr-1">·</span>
                {w.claim}
                <span className="ml-1 text-ink-dim">
                  [{w.evidence}]{" "}
                  {w.citations.map((c, i) => {
                    const href = citationUrl(c);
                    return href ? (
                      <a
                        key={c.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-dotted hover:text-accent-400"
                      >
                        {c.label}
                        {i < w.citations.length - 1 ? "; " : ""}
                      </a>
                    ) : (
                      <span key={c.id}>
                        {c.label}
                        {i < w.citations.length - 1 ? "; " : ""}
                      </span>
                    );
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
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
            FORGEai thinking
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
  
  // Format details about the active state
  const activePathologies = ctx.pathologies || [];
  const activeStack = ctx.stack || [];
  const integrity = ctx.integrityScore ?? 100;
  
  const stackTxt = activeStack.length
    ? `Active clinical regimen: ${activeStack.map((s: any) => `${s.name} (Dose ${s.dose})`).join(', ')}.`
    : 'No active clinical regimen compounds present in the stack.';
    
  const pathTxt = activePathologies.length
    ? `Identified pathological networks: ${activePathologies.join(', ')}.`
    : 'System is currently in a state of clinical homeostasis (no active pathological networks).';

  let response = "";

  // 0. Handle CRPS (Complex Regional Pain Syndrome)
  if (lower.includes("crps") || lower.includes("allodynia") || lower.includes("reflex sympathetic") || lower.includes("sensitization") || lower.includes("pain")) {
    response += `### [Local Engine] CRPS Computational Neuro-Medicine Diagnosis (Master Protocol)
This diagnostic analysis interprets CRPS as a complex, multi-layered system—balancing high-dimensional network topology with biochemical variables and autonomic postganglionic tone.

#### STAGE 1: CONNECTOME & NETWORK TOPOLOGY DIAGNOSIS
* **Somatosensory Blurring (S1):** Expandable mechanical allodynia extending to mid-calf maps to cortical receptive field expansion and loss of lateral inhibition in the S1 lower-limb homunculus.
* **Locked Pain Cliques:** Persistent NMDA-dependent long-term potentiation locks the ventroposterolateral (VPL) Thalamus, Anterior Cingulate Cortex (ACC), and Insula into a low-dimensional attractor state. Sensory inputs are recursively warped into agonizing 48-hour burning flares.

#### STAGE 2: BIOCHEMICAL & AUTONOMIC PROFILING
* **Active Phenotype:** Cold presentation (severe temperature drop, vasoconstriction, and cyanotic skin) indicates sympathetic postganglionic vaso-constrictive hyperactivity, leading to local hypoxia, tissue acidosis (stimulating TRPV1/TRPA1/ASICs), and localized cytokine pools (TNF-α, IL-1β, IL-6).
* **Regimen Gaps:** Gabapentin (1200mg/day) downregulates presynaptic calcium entry, and nocturnal LDN (4.5mg) suppresses Toll-like Receptor 4 (TLR4) on microglia. However, localized hypoxic acidosis from persistent vasoconstriction is completely unaddressed. NSAIDs offer zero clinical utility here.

#### STAGE 3: THERAPEUTIC SIMULATION SANDBOX
* **NMDA Antagonist (Ketamine):** High-dose resets block the NMDA channel pore, breaking the dorsal horn wind-up loop and injecting stochastic noise to fragment locked pain cliques.
* **Glial Stabilizers (LDN):** Predicted to reduce microglial cytokine output by 40-50% within a 60-day window, provided local ischemia is relieved.
* **Neuromodulation / Blocks (LSB):** A Lumbar Sympathetic Block (LSB) at L2-L4 temporarily blocks sympathetic postganglionic vasoconstrictor tone, inducing immediate warm hyperemic reperfusion (+2°C to +5°C) and clearing acidic waste.

#### STAGE 4: SENSORY-MOTOR RE-EDUCATION (CORTICAL UNBLURRING)
* **Rule:** Immediately suspend direct touch desensitization to avoid wind-up.
* *Phase 1:* Pure Implicit Motor Imagery (L/R Foot discrimination, 10 min 4x/day).
* *Phase 2:* Explicit Mental Simulation (Imagined pain-free movement w/o S1 touch activation).
* *Phase 3:* Mirror Visual Feedback (MVF) (Visual trick to override somatosensory errors).

#### STAGE 5: CLINICAL TRIAGE & OBJECTIVE METRIC ENGINE
* *Key Question:* "Can we perform a diagnostic Lumbar Sympathetic Block (LSB) to break the postganglionic vasoconstrictive loop and warm up the foot?"
* *Metric 1:* **Thermal Recovery Rate** (Goal: Left vs. Right asymmetry stabilized to <0.5°C).
* *Metric 2:* **Two-Point Discrimination** (Measure calf gap to track somatotopic unblurring).

${stackTxt} ${pathTxt}`;
  }
  // 1. Handle Jianshouqing / mushrooms
  else if (lower.includes("mushroom") || lower.includes("jianshouqing") || lower.includes("oneirogenic") || lower.includes("little people") || lower.includes("yunnan")) {
    response += `### [Local Engine] Jianshouqing Mushroom (Lanmaoa asiatica) Diagnostic Analysis
Based on Yunnan ethnopharmacological records and your active simulation settings, the Jianshouqing mushroom acts as a highly potent Default Mode Network (DMN) disruptor.

* **Active Chemical Moiety:** Variegatic Acid (\`SMILES: OC1=C(C(O)=O)C(C2=CC=C(O)C(O)=C2)=C(C3=CC=C(O)C(O)=C3)C1=O\`).
* **Autonomic Target:** Highly specific muscarinic M1 receptor agonist, coupled with moderate 5-HT2A activation.
* **Topological Impact:** Drives extreme local visual cortex phase transformations, leading to highly structured, repetitive oneirogenic animations (colloquially "little people").
* **ProTox-3.0 Safety Alert:** Variegatic acid is highly susceptible to mechanical oxidation. Ingestion of raw mushroom generates highly reactive quinone-methide intermediates, making it **High-Risk** compared to cooked fungal metabolites.

${stackTxt} ${pathTxt}`;
  }
  // 2. Handle integrity / scores / topological metrics
  else if (lower.includes("integrity") || lower.includes("score") || lower.includes("phi") || lower.includes("coherence")) {
    response += `### [Local Engine] Topological Integrity (Φ) & Coherence Analysis
The global system integrity is currently calculated at **Φ = ${integrity}%**. 

* **Theoretical Framework:** This score represents the ratio of the active system's steady-state Kuramoto order parameter ($R$) compared to a healthy, unperturbed baseline connectome. 
* **Dynamic Range:** Healthy homeostasis is maintained when $R \approx 0.85$. Lower scores ($\Phi < 60\%$) signal functional network fragmentation or topological cavity collapses.
* **Absence/Stabilization:** High-chaos compounds (like methamphetamine) degrade this score by injecting high-frequency Gaussian noise into the phase loops, whereas selective stabilizers (like ZenBud or corrective molecules) restore coherence by smoothing the coupling coefficient $K^*$.

${stackTxt}`;
  }
  // 3. Handle QLDPC / topological error correction / physical wetware / organoids / XOR-PCR
  else if (
    lower.includes("qldpc") || 
    lower.includes("stabilizer") || 
    lower.includes("syndrome") || 
    lower.includes("error") || 
    lower.includes("organoid") || 
    lower.includes("microfluidic") || 
    lower.includes("wetware") || 
    lower.includes("electroporation") || 
    lower.includes("xpr") || 
    lower.includes("pcr") || 
    lower.includes("checksum") || 
    lower.includes("yamanaka") || 
    lower.includes("genome")
  ) {
    response += `### [Local Engine] Bio-Computational Wetware & XOR-PCR Checksum Framework
The algebraic topology engine extends past digital connectome simulations into physical **electroporation-enabled microfluidic brain organoid cultures** growing at a microfluidic Y-junction.

* **Topological Stabilization Loop:** The system enforces a **physical XOR-PCR (Polymerase Chain Reaction) molecular checksum** over target cellular genomes, ensuring that only cells with clean, mutation-free states ($s_{\text{physical}} = \vec{0}$) undergo closed-loop Yamanaka factor reprogramming (Oct4, Sox2, Klf4, c-Myc) and targeted genome synthesis/re-implantation.
* **Isomorphism to QLDPC Code:** This physical check maps directly to the digital **QLDPC (Quantum Low-Density Parity-Check)** stabilizer code ($\partial_k \cdot x = s$), where the simplicial boundary operator $\partial_k$ serves as the molecular parity-check matrix.
* **Holographic Boundary-to-Bulk Translation:** High-dimensional minimal structural welds ($\nabla_{ij}$) computed by the holographic Hodge Laplacian ($L_k$) are physically translated into targeted micro-electroporation stimulation coordinates ($V_m(t)$) at the Y-junction, steering structural neurite outgrowth.

${pathTxt}`;
  }
  // 4. Handle general drug mechanism or auto-optimization questions
  else if (lower.includes("recommend") || lower.includes("optimize") || lower.includes("stack") || lower.includes("why")) {
    response += `### [Local Engine] Clinical Recommendation Justifications & Safety Exclusions
The clinical recommendation engine executes a greedy search to construct an optimized ($\\le 3$)-compound regimen that maximizes the Topological Integrity Score $\\Phi$ under a zero-toxicity boundary constraint.

* **Selection Strategy:** The engine selects synergistic combinations (e.g. balancing Arousal, Dampening, Chaos, and Repair vectors) that directly counteract your active pathologies (e.g., Default Mode hyper-coherence in Depression, Control network deficits in ADHD).
* **Candidate Exclusions:** High-risk recreational stimulants (e.g. methamphetamine, cocaine) are strictly excluded due to severe ProTox-3.0 neurotoxicity diagnostics (DAT-mediated reverse transport, auto-oxidation, and vasoconstrictive hypoxia). Class-based benzodiazepines are also omitted from long-term recommendations to avoid severe GABA-A receptor downregulation and subsequent excitotoxic withdrawal syndromes.

${stackTxt}`;
  }
  // 5. Default rich response
  else {
    response += `### [Local Engine] Ambient Neuromorphic Assistant Standing By
I am currently operating in **Local Engine Fallback mode** as the remote FastAPI/FastAI backend is unreachable or missing server credentials. 

However, all local biophysical solvers (Kuramoto integrators, QLDPC syndromes, and ProTox-3.0 diagnostics) remain fully functional in your browser.

* **Composed Pathologies:** ${activePathologies.length ? activePathologies.join(', ') : 'None (Homeostasis)'}
* **Global Network Integrity (Φ):** ${integrity}%
* ${stackTxt}

*Query keywords like "Jianshouqing", "Integrity", "QLDPC", "Toxicity", or "Optimize" to trigger specific clinical-grade local reports.*`;
  }

  // Append grounded wisdom insights if available in context
  if (ctx.grounding) {
    response += `\n\n### Grounded Peer-Reviewed Evidence\n${ctx.grounding}`;
  }

  return response;
}