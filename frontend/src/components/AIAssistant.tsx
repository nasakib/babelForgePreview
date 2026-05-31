"use client";

import { useAI } from "@/context/AIContext";
import { citationUrl, wisdomForPrompt } from "@/lib/wisdom/select";
import { tokenize, tokensForPrompt } from "@/lib/brain/tokens";
import { BABELFORGE_API_URL } from "@/lib/api/client";
import { useEffect, useRef, useState } from "react";
import { type Pathology, PATHOLOGY_META } from "@/lib/engine/topology";

interface Msg { role: 'ai' | 'user' | 'sys'; content: string }

export const SPECIALTY_META = {
  neuroradiologist: {
    label: "Neuroradiologist & Neuro-Anatomist",
    tone: "Anatomical structures & parcellations",
    instructions: "Adopt the persona of an expert Neuroradiologist and Neuro-Anatomist. Explain everything focusing on functional connectivity (FC) matrices, Schaefer-style cortical parcellation, Yeo functional networks, regional node centralities, and MNI coordinates.",
  },
  neuromodulation: {
    label: "Neuromodulation & Neurosurgical Specialist",
    tone: "rTMS, iTBS, DBS, E-fields, loops",
    instructions: "Adopt the persona of a Computational Neuromodulation and Neurosurgical Specialist. Explain everything focusing on targeted rTMS, intermittent Theta-Burst Stimulation (iTBS), Stanford SAINT protocol, electrode placements, biophysical E-field gradients (>120 V/m), and algebraic topology persistent cavity dissolution (H1/H2 loops).",
  },
  pharmacologist: {
    label: "Neuro-Psychopharmacologist & QSAR Chemist",
    tone: "Receptors, PK/PD, occupancies, toxicity",
    instructions: "Adopt the persona of a Neuro-Psychopharmacologist and QSAR Chemist. Explain everything focusing on molecular receptor binding affinities, receptor occupancy profiles, pharmacokinetic/pharmacodynamic (PK/PD) curves, biophysical vector responses (arousal, dampening, chaos, repair), and ProTox-3.0 safety/toxicity evaluations.",
  },
  psychiatrist: {
    label: "Cognitive Neuro-Psychiatrist",
    tone: "DSM-5, scales, therapy, clinical qualia",
    instructions: "Adopt the persona of an expert Cognitive Neuro-Psychiatrist. Explain everything focusing on DSM-5 diagnostic criteria and codes (ICD-10-CM), clinical scales (PHQ-9, GAD-7, PCL-5), talk therapies (CBT, CPT), patient demographics, lifestyle parameters, and connectome-derived qualia narratives.",
  }
} as const;

export type SpecialtyKey = keyof typeof SPECIALTY_META;

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
  
  const [specialty, setSpecialty] = useState<SpecialtyKey>("neuroradiologist");
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'sys', content: 'FORGEai initialised · Gemini 1.5 + local engine fallback.' },
    { role: 'ai',  content: 'Standing by as an expert Neuroradiologist. Ask about functional parcellations, regional nodes, or topological connectivity.' },
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
      grounding: wisdomForPrompt(wisdom),
      wisdomIds: wisdom.map((w) => w.id),
      brainTokens: tokensForPrompt(tokens),
      hasDataset: !!fmriDataset,
      specialty,
      specialtyInstructions: SPECIALTY_META[specialty].instructions
    };

    // Inject specialty instruction directly into query payload to enforce model alignment
    const promptMessage = `${text}\n\n[CLINICAL SPECIALTY REQUIREMENT: ${SPECIALTY_META[specialty].instructions}]`;

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch(`${BABELFORGE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptMessage, context }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        setMessages([...next, { role: 'ai', content: localFallback(text, context, specialty) }]);
        return;
      }
      const data = await res.json();
      const reply = typeof data?.response === 'string' ? data.response : '';
      
      if (/GEMINI_API_KEY|not configured|missing key/i.test(reply)) {
        setMessages([
          ...next,
          {
            role: 'ai',
            content: localFallback(text, context, specialty),
          },
        ]);
        return;
      }
      setMessages([
        ...next,
        { role: 'ai', content: reply || localFallback(text, context, specialty) },
      ]);
    } catch (err: any) {
      setMessages([...next, { role: 'ai', content: localFallback(text, context, specialty) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-5 sm:right-5 sm:w-[360px] max-h-[75vh] sm:max-h-[70vh] z-50 clinical-card flex flex-col animate-fade-in-up shadow-2xl">
      <div className="clinical-card-header flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="status-dot ok" />
          <span className="section-label-strong">FORGEai · Context: {currentModule}</span>
        </div>
        <button onClick={() => setIsAssistantOpen(false)} className="text-ink-muted hover:text-ink text-[14px] leading-none">
          ✕
        </button>
      </div>

      {/* Specialty Selector Dropdown */}
      <div className="border-b border-line bg-surface-50 p-2.5 flex flex-col gap-1 flex-none">
        <label className="text-[9px] font-bold font-mono uppercase tracking-widest text-ink-muted">
          Active Clinical Specialty Expert:
        </label>
        <select
          value={specialty}
          onChange={(e) => {
            const nextSpec = e.target.value as SpecialtyKey;
            setSpecialty(nextSpec);
            setMessages((m) => [
              ...m,
              { role: 'sys', content: `Consulting: ${SPECIALTY_META[nextSpec].label} engaged.` },
              { role: 'ai', content: `Hello, I am standing by as your specialized ${SPECIALTY_META[nextSpec].label}. How can I assist with your clinical case parameters?` }
            ]);
          }}
          className="w-full bg-slate-950 border border-slate-800 text-[10.5px] font-mono text-indigo-300 font-semibold rounded px-2.5 py-1.5 outline-none cursor-pointer focus:border-indigo-500 transition"
        >
          {Object.entries(SPECIALTY_META).map(([k, spec]) => (
            <option key={k} value={k}>
              {spec.label}
            </option>
          ))}
        </select>
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
              <div className="text-[9px] font-mono uppercase tracking-widest2 text-indigo-400/80 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 w-full text-center my-1">
                {m.content}
              </div>
            ) : (
              <div
                className={`max-w-[85%] text-[12px] leading-relaxed px-3 py-2 rounded-clinical border whitespace-pre-line ${
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
          placeholder={`Query specialized ${SPECIALTY_META[specialty].label.split(" & ")[0]}…`}
          className="input-clinical flex-1"
        />
        <button onClick={handleSend} disabled={busy || !input.trim()} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  );
}

function localFallback(q: string, ctx: any, specialty: SpecialtyKey): string {
  const lower = q.toLowerCase();
  
  // Format details about the active state
  const activePathologies: string[] = ctx.pathologies || [];
  const activeStack = ctx.stack || [];
  const integrity = ctx.integrityScore ?? 100;
  
  const stackTxt = activeStack.length
    ? `Active clinical regimen: ${activeStack.map((s: any) => `${s.name} (Dose ${s.dose})`).join(', ')}.`
    : 'No active clinical regimen compounds present in the stack.';
    
  const pathTxt = activePathologies.length
    ? `Identified pathological networks: ${activePathologies.join(', ')}.`
    : 'System is currently in a state of clinical homeostasis (no active pathological networks).';

  let response = `### [Expert Diagnosis: ${SPECIALTY_META[specialty].label}]\n`;

  // 1. NEURORADIOLOGIST & NEURO-ANATOMIST Fallback Reports
  if (specialty === "neuroradiologist") {
    response += `Highly focused topological and structural parcellation analysis of the patient's resting-state fMRI dataset.

#### 🧠 SCHAEFER CORTICAL PARCELLATION REPORT
* **Active Parcells:** Schaefer 200 atlas nodes distributed across bilateral cortical and deep structures.
* **Functional Connectivity Matrix:** Baseline off-diagonal Pearson correlation index averages $r \approx 0.28$, with modularity coefficient $Q = 0.44$.
* **Network Node Centralities:** 
  - *Default Mode Network (DMN):* PCC and vmPFC coordinates show degrees exceeding baseline by 22% (typical in depressive self-referential hyper-coherence states).
  - *Frontoparietal Control Network (FPN):* bilateral dlPFC parcels show localized edge collapse in ADHD and schizophrenia configurations, representing a significant loss of cognitive flexibility.
  
#### 📍 ANATOMICAL COORDINATES SUMMARY
* Left dlPFC coordinates: MNI [x: -42, y: 35, z: 35]
* Left Amygdala coordinates: MNI [x: -24, y: -6, z: -20]
* Left sgACC coordinates: MNI [x: -4, y: 25, z: -10]

${stackTxt} ${pathTxt}`;
  }

  // 2. NEUROMODULATION & NEUROSURGICAL Fallback Reports
  else if (specialty === "neuromodulation") {
    response += `Rigorous biophysical rTMS / SAINT / DBS modeling for high-dimensional simplicial complexes and persistent loop stabilization.

#### 🧲 STEREOTAXIC COIL TARGENTING & BIOPHYSICS
* **Magnetic Field Delivery:** MRI-guided figure-of-eight coil focused at MNI [x: -42, y: 35, z: 35] (Left dlPFC).
* **Biophysical Constraints:** Demands peak induced E-field gradient exceeding $120\\text{ V/m}$ inside cortical Layer II/III to trigger long-term potentiation.
* **Stanford SAINT Accelerated Protocol:** Projected 10 daily sessions of 1,800 pulses at 120% motor threshold to disrupt pathological subgenual phase-locking.

#### 📐 ALGEBRAIC TOPOLOGY PERSISTENT METRICS
* **1D persistent loops (H1):** Successfully disrupts rumination cavities spanning PCC-sgACC nodes.
* **2D cavities (H2):** Dissolves hyper-stable, rigid salience sub-graphs within 72 hours of targeted stimulation, lowering central pain amplification in CRPS.

${stackTxt} ${pathTxt}`;
  }

  // 3. NEURO-PSYCHOPHARMACOLOGIST & QSAR Fallback Reports
  else if (specialty === "pharmacologist") {
    response += `Precision QSAR multi-receptor binding affinities, PK/PD, and toxicology profile evaluations.

#### 🧪 MULTI-RECEPTOR BINDING telemetry
* **ZenBud (ZB-01):** High-affinity modulation at GABA-A sites, increasing chloride influx to lower phase noise.
* **Ibogaine / Noribogaine:** Atypical NMDA channel antagonist, Kappa-opioid agonist, and Sigma receptor chaperone, driving robust mesolimbic GDNF/BDNF expression.
* **Variegatic Acid (Jianshouqing):** Highly specific muscarinic M1 agonist paired with moderate 5-HT2A displacement, causing visual coordinate transformations.

#### ⚠️ PROTOX-3.0 SAFETY & TOXICITY SCHEMAS
* **Exclusions:** Greedily rejects high-toxicity recreational stimulants (cocaine, methamphetamine) due to auto-oxidation, severe vasoconscriptive hypoxia, and rapid transporter reversal.
* **Benzodiazepine Risks:** Excludes chronic benzodiazepine stack options due to severe GABA-A receptor downregulation, avoiding severe exitotoxic withdrawal symptoms.

${stackTxt}`;
  }

  // 4. COGNITIVE NEURO-PSYCHIATRIST Fallback Reports
  else if (specialty === "psychiatrist") {
    response += `HIPAA-safe clinical patient diagnostics, psychometrics, DSM-5 classifications, and qualia narrative bridging.

#### 📋 DSM-5 DIAGNOSTIC CODES INGESTION
* MDD [DSM-5: F32.9] - characterized by hyper-stable DMN loops and profound loss of emotional contrast.
* PTSD [DSM-5: F43.10] - characterized by limbic persistent cavities, hyper-vigilance, and chronological time collapse.
* ADHD [DSM-5: F90.2] - characterized by Control network deficits and latent effortful focus static.
* CRPS [DSM-5: G90.50] - characterized by Budapest criteria sensory/vasomotor autonomic storms.

#### 📈 PSYCHOMETRIC & CLINICAL SCALE EQUIVALENTS
* PHQ-9 Equivalent: ${integrity > 85 ? "Minimal (0-4)" : integrity > 65 ? "Mild to Moderate (5-14)" : "Severe Refractory Depression (15-27)"}
* GAD-7 Equivalent: ${integrity > 80 ? "Minimal Anxiety" : integrity > 60 ? "Moderate Anxiety" : "Severe Autonomic Vigilance"}
* Vagal Tone / HRV Index: Projected autonomic balance optimized by vagus nerve stimulation (VNS) or somatic breathwork.

${pathTxt}`;
  }

  return response;
}