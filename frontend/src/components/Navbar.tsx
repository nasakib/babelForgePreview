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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState('');
  const pathname = usePathname();
  const isActive = (p: string) => p === '/' ? pathname === '/' : pathname.startsWith(p);

  useEffect(() => {
    const upd = () => {
      const d = new Date();
      setClock(d.toISOString().substring(11, 19) + 'Z');
    };
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <nav className="h-12 border-b border-line bg-surface-0/95 backdrop-blur flex items-center justify-between px-4 shrink-0 z-50 relative">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg className="w-5 h-5 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-[13px] tracking-tight text-ink">babelForge</span>
              <span className="text-[10px] font-mono text-ink-muted tracking-widest2 uppercase">Engine</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
            <span className="status-dot ok mr-1.5" /> Operational
            <span className="px-2">·</span>
            <span>v2.1.0-clinical</span>
            <span className="px-2">·</span>
            <span className="text-ink-subtle">{clock || '--:--:--Z'}</span>
          </div>
        </div>

        {/* Primary nav */}
        <div className="hidden xl:flex items-center gap-0">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-widest2 transition-colors border-r border-line/60 last:border-r-0 ${
                isActive(item.href)
                  ? 'text-accent-400'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {isActive(item.href) && (
                <span className="absolute -bottom-px left-0 right-0 h-px bg-accent-500" />
              )}
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => setMethodOpen(true)}
            className="ml-2 px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-widest2 text-ink-muted hover:text-ink border-l border-line/60"
          >
            Methodology
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label="Toggle menu"
          className="xl:hidden text-ink-subtle p-1.5"
          onClick={() => setMobileOpen((s) => !s)}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="xl:hidden absolute top-12 left-0 right-0 bg-surface-0 border-b border-line z-40 shadow-xl">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-5 py-3 border-b border-line/50 text-xs font-mono uppercase tracking-widest2 ${
                  isActive(item.href) ? 'text-accent-400 bg-accent-500/5' : 'text-ink-subtle'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => { setMethodOpen(true); setMobileOpen(false); }}
              className="block w-full text-left px-5 py-3 text-xs font-mono uppercase tracking-widest2 text-ink-subtle"
            >
              Methodology
            </button>
          </div>
        )}
      </nav>

      {methodOpen && <MethodologyModal onClose={() => setMethodOpen(false)} />}
    </>
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