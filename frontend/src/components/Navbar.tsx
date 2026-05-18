"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS: { href: string; label: string; code: string }[] = [
  { href: '/',                  label: 'Console',         code: 'F1' },
  { href: '/stack-simulator',   label: 'Stack Builder',   code: 'F2' },
  { href: '/compounds',         label: 'Compound Library',code: 'F3' },
  { href: '/signal-analyzer',   label: 'Signal Analyzer', code: 'F4' },
  { href: '/fmri-analysis',     label: 'fMRI Ingest',     code: 'F5' },
  { href: '/11d-projection',    label: '11D Topology',    code: 'F6' },
  { href: '/pharma-projection', label: 'Pharma Projection',code: 'F7'},
  { href: '/studies',           label: 'Validation',      code: 'F8' },
];

export default function Navbar() {
  const [methodOpen, setMethodOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState('');
  const [uptime, setUptime] = useState(0);
  const pathname = usePathname();
  const isActive = (p: string) => p === '/' ? pathname === '/' : pathname.startsWith(p);

  useEffect(() => {
    const start = Date.now();
    const upd = () => {
      const d = new Date();
      setClock(d.toISOString().substring(11, 19) + 'Z');
      setUptime(Math.floor((Date.now() - start) / 1000));
    };
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <nav className="flex flex-col border-b border-line bg-surface-0 z-50 relative shadow-md font-mono">
        {/* Top Telemetry Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-surface-100 border-b border-line text-[9px] text-ink-muted tracking-widest2 uppercase">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="status-dot ok animate-pulse" /> SYSTEM ONLINE</span>
            <span className="hidden sm:inline">UPTIME {Math.floor(uptime/60).toString().padStart(2, '0')}:{(uptime%60).toString().padStart(2, '0')}</span>
            <span className="hidden md:inline">FREQ: 120Hz</span>
            <span className="hidden lg:inline text-accent-500">SYNC: PHASE-LOCKED</span>
          </div>
          <div className="flex items-center gap-4 flex-1 justify-center max-w-[400px] opacity-40 hidden xl:flex">
             {/* Fake EEG sparkline */}
             <svg width="100%" height="12" viewBox="0 0 100 12" preserveAspectRatio="none">
               <path d="M0 6 L10 6 L12 2 L14 10 L16 6 L30 6 L32 1 L34 11 L36 6 L50 6 L52 3 L54 9 L56 6 L80 6 L82 0 L84 12 L86 6 L100 6" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-[slideLeft_2s_linear_infinite]" />
             </svg>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-ink-subtle">{clock || '--:--:--Z'}</span>
            <span className="hidden sm:inline">BABELFORGE ENGINE V2.1</span>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="h-12 flex items-center justify-between px-4 bg-surface-0/95 backdrop-blur">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group hover:opacity-80 transition-opacity">
              <svg className="w-6 h-6 text-accent-500 drop-shadow-[0_0_8px_rgba(31,109,255,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold font-sans text-[16px] tracking-tight text-ink">babelForge</span>
              </div>
            </Link>
          </div>

          {/* Primary nav */}
          <div className="hidden xl:flex items-center gap-0 h-full">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative h-full flex items-center px-3 text-[10px] uppercase tracking-widest2 transition-colors border-r border-line/60 last:border-r-0 ${
                  isActive(item.href)
                    ? 'text-accent-400 bg-accent-500/5 font-bold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-50'
                }`}
              >
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-500 shadow-[0_0_8px_rgba(31,109,255,0.8)]" />
                )}
                {item.label}
              </Link>
            ))}
            <div className="flex items-center ml-2 border-l border-line/60 pl-2 gap-2">
              <button
                onClick={() => setTutorialOpen(true)}
                className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 border border-line-strong rounded-clinical text-[10px] uppercase tracking-widest2 text-ink transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="text-accent-400">?</span> Guide
              </button>
              <button
                onClick={() => setMethodOpen(true)}
                className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 border border-line-strong rounded-clinical text-[10px] uppercase tracking-widest2 text-ink transition-colors shadow-sm"
              >
                Methodology
              </button>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            aria-label="Toggle menu"
            className="xl:hidden text-ink-subtle p-1.5"
            onClick={() => setMobileOpen((s) => !s)}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="xl:hidden absolute top-full mt-[1px] left-0 right-0 bg-surface-0 border-b border-line z-40 shadow-2xl">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-5 py-4 border-b border-line/50 text-[12px] uppercase tracking-widest2 ${
                    isActive(item.href) ? 'text-accent-400 bg-accent-500/10 font-bold border-l-4 border-l-accent-500' : 'text-ink-subtle'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="p-4 flex flex-col gap-2 bg-surface-50">
                <button
                  onClick={() => { setTutorialOpen(true); setMobileOpen(false); }}
                  className="w-full text-center px-5 py-3 text-xs font-bold uppercase tracking-widest2 text-ink bg-surface-200 rounded-clinical border border-line-strong"
                >
                  Quick Start Guide
                </button>
                <button
                  onClick={() => { setMethodOpen(true); setMobileOpen(false); }}
                  className="w-full text-center px-5 py-3 text-xs uppercase tracking-widest2 text-ink-muted border border-line-strong rounded-clinical"
                >
                  Methodology
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {methodOpen && <MethodologyModal onClose={() => setMethodOpen(false)} />}
      {tutorialOpen && <TutorialModal onClose={() => setTutorialOpen(false)} />}
    </>
  );
}

function TutorialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Welcome to babelForge",
      content: "babelForge is a precision neuroscience engine. It models the human brain as an interconnected web of oscillators (using Kuramoto phase dynamics) to simulate the effects of psychiatric disorders and multi-drug regimens."
    },
    {
      title: "Step 1: The Patient State",
      content: "Start on the 'Console' tab. Select one or more 'Patient State Modifiers' (like Depression or PTSD). Watch as the engine mathematically deforms the baseline topological network—adding hyperconnectivity or severing critical pathways based on real fMRI research."
    },
    {
      title: "Step 2: Polypharmacy Stacking",
      content: "Navigate to the 'Stack Builder'. Here, you can combine precision compounds and conventional drugs. Adjust the dosage and tolerance sliders. The engine computes 4 vectors (Arousal, Dampening, Chaos, Repair) to determine how the regimen interacts with the active pathology."
    },
    {
      title: "Step 3: Visualizing the Physics",
      content: "Observe the 3D 'NeuroCanvas'. White nodes represent brain regions, and color-coded edges represent functional connections. Switch views between 'Physics', 'Topology', and 'Pharma' to see how the Kuramoto wave synchronization is mathematically altered by your stack."
    },
    {
      title: "Step 4: AI & Auto-Optimization",
      content: "Use the 'babelAI' chat bubble in the bottom right for instant clinical context and explanations. Alternatively, click 'Auto-Optimize' in the console to have the engine automatically discover the mathematically ideal pharmacological stack to reverse the current pathology."
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up" onClick={onClose}>
      <div className="clinical-card w-full max-w-2xl overflow-hidden shadow-2xl border border-accent-500/30 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="clinical-card-header bg-accent-500/10 border-b border-accent-500/30 p-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-400 shadow-[0_0_10px_rgba(77,141,255,0.8)] animate-pulse" />
            <span className="text-sm font-bold text-accent-200 uppercase tracking-widest2">Quick Start Tutorial</span>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-white font-bold px-2 py-1">✕</button>
        </div>
        <div className="p-6 sm:p-10 flex-1 bg-surface-0 min-h-[250px] flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-ink mb-4">{steps[step].title}</h2>
          <p className="text-sm sm:text-base text-ink-subtle leading-relaxed drop-shadow-sm">{steps[step].content}</p>
        </div>
        <div className="p-4 bg-surface-50 border-t border-line-strong flex justify-between items-center">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-accent-500 w-4' : 'bg-line-strong'}`} />
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="px-4 py-2 bg-surface-100 hover:bg-surface-200 border border-line disabled:opacity-30 rounded-clinical text-xs font-mono uppercase font-bold text-ink transition-colors">Back</button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="px-4 py-2 bg-accent-600 hover:bg-accent-500 border border-accent-400 rounded-clinical text-xs font-mono uppercase font-bold text-white transition-colors shadow-[0_0_15px_rgba(31,109,255,0.4)]">Next</button>
            ) : (
              <button onClick={onClose} className="px-4 py-2 bg-ok hover:brightness-110 border border-emerald-400 rounded-clinical text-xs font-mono uppercase font-bold text-white transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]">Get Started</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodologyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="clinical-card w-full max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="clinical-card-header">
          <div className="flex items-center gap-2">
            <span className="status-dot ok" />
            <span className="section-label-strong">Methodology & Validity</span>
          </div>
          <button onClick={onClose} className="btn-ghost text-ink-muted hover:text-ink">Close ✕</button>
        </div>
        <div className="p-5 space-y-4 text-[13px] text-ink-subtle leading-relaxed">
          <Section title="01 · Substrate">
            <p>
              babelForge operates on a Schaefer-200 functional parcellation of cortex
              with seven canonical resting-state networks (Default, Control, Limbic,
              Visual, SomatoMotor, VentralAttn, DorsalAttn). Anatomical positions are
              embedded in a 48×38×58 ellipsoidal cortical envelope. Structural
              backbone uses k-nearest-neighbor proximity (k=3) plus 60 high-dimensional
              cliques up to dimension 11, after Reimann et al. (2017).
            </p>
          </Section>
          <Section title="02 · Dynamics">
            <p>
              Each parcel is a Kuramoto phase oscillator with intrinsic frequency
              ω<sub>i</sub> ∼ 𝒩(0, 0.4) rad/s, coupled by the structural matrix W:
            </p>
            <pre className="bg-canvas border border-line rounded p-3 font-mono text-[11px] text-ink overflow-x-auto">
{`dθᵢ/dt = ωᵢ + (K/N) Σⱼ Wᵢⱼ sin(θⱼ − θᵢ) + ξᵢ(t)`}
            </pre>
            <p>
              The complex order parameter R·e<sup>iΨ</sup> = (1/N)Σ e<sup>iθⱼ</sup>
              quantifies global coherence and serves as the anchor for the
              Topological Integrity Score Φ = round(100 · R / R<sub>baseline</sub>).
            </p>
          </Section>
          <Section title="03 · Pathology Composition">
            <p>
              Each pathological state is an algebraic mutation of W: collapse of cliques
              biased toward the affected network (edges removed) plus pathological
              hyperconnectivity (cliques added). Effects compose additively, so
              comorbidities yield emergent topology.
            </p>
          </Section>
          <Section title="04 · Pharmacology">
            <p>
              Compounds are projected onto a four-axis effect basis
              {' '}(arousal, dampening, chaos, repair). These scale the coupling
              K, the noise σ, and per-region frequency shifts. Doses adjusted by
              patient weight and tolerance.
            </p>
          </Section>
          <Section title="05 · Limits">
            <p>
              babelForge is a research instrument. It models hypotheses, not patients.
              Compound effect vectors are derived from published receptor profiles and
              are not a substitute for clinical judgment.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="section-label-strong mb-1.5">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}