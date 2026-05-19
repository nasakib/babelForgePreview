"use client";

import Link from "next/link";

/**
 * Explorer-mode landing surface — referenced by
 * MODE_DESCRIPTORS.explorer.landing in `lib/ux/mode.ts`. Anonymous, no
 * auth required. Plain language only — assumes zero clinical or
 * mathematical background. Use this surface to onboard novice users.
 */
export default function WelcomePage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-void">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-ink-muted">
            babelforge / welcome
          </div>
          <h1 className="text-4xl font-bold text-ink">
            Make sense of how the brain works — and how interventions change it.
          </h1>
          <p className="text-base text-ink-subtle leading-relaxed">
            BabelForge is a research-grade visualizer. You can explore it freely,
            without an account. Nothing you do here is stored on a server.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Watch brain rhythms",
              body: "Pick a stimulus and see how the five canonical EEG bands — delta, theta, alpha, beta, gamma — change in real time.",
              href: "/signal-analyzer",
              cta: "Open Signal Analyzer",
            },
            {
              title: "Spectra without the calculus",
              body: "The Fourier visualizer shows what frequencies are present in EEG, network coherence, BOLD, and pharmacology, side by side.",
              href: "/fourier",
              cta: "Open Fourier",
            },
            {
              title: "Stack interventions",
              body: "Build a regimen of compounds, then see the predicted integrity, dominant frequency, and risk score update live.",
              href: "/stack-simulator",
              cta: "Open Stack Builder",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="block p-5 rounded-clinical border border-line bg-surface-50 hover:bg-surface-0 transition-colors"
            >
              <h2 className="text-lg font-bold text-ink mb-2">{card.title}</h2>
              <p className="text-sm text-ink-subtle leading-snug mb-3">{card.body}</p>
              <div className="text-xs font-semibold text-accent-300">{card.cta} →</div>
            </Link>
          ))}
        </section>

        <section className="p-5 rounded-clinical border border-warn-500/40 bg-warn-500/5">
          <h3 className="text-sm font-bold text-warn-200 mb-2 uppercase tracking-widest">
            Not medical advice
          </h3>
          <p className="text-xs text-ink-subtle leading-relaxed">
            BabelForge is a teaching and research tool. The signals you see are
            synthesized for visualization; the compound effects shown are
            literature priors, not patient-specific predictions. Always consult a
            licensed clinician for any medical or pharmacological decision.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold text-ink uppercase tracking-widest">
            Where to next
          </h3>
          <ul className="text-sm text-ink-subtle space-y-1.5 list-disc pl-5">
            <li>
              Press <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface-100 font-mono text-[11px]">⌘K</kbd>{" "}
              (or <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface-100 font-mono text-[11px]">Ctrl K</kbd>) anywhere to jump between modules.
            </li>
            <li>
              Function keys <span className="font-mono">F1–F10</span> map to the
              left rail in order.
            </li>
            <li>
              The Console (<span className="font-mono">F1</span>) shows the
              current integrity score and active stack.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
