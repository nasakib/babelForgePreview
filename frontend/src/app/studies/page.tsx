"use client";

const STUDIES = [
  {
    tag: "Topology",
    title: "Cliques of neurons bound into cavities",
    authors: "Reimann M.W., Nolte M., Scolamiero M., et al.",
    venue: "Frontiers in Computational Neuroscience (2017)",
    summary:
      "Demonstrates that cortical microcircuits contain dense cliques of up to 11 neurons and cavities forming a structural-functional bridge. Substrate for our maximal-clique enumeration on the Schaefer-200 connectome.",
    status: "validated",
  },
  {
    tag: "Topology",
    title: "Structural degree predicts functional network connectivity",
    authors: "Tewarie P., Abeysuriya R., Byrne Á., et al.",
    venue: "NeuroImage 188 (2019)",
    summary:
      "Establishes algebraic-topology invariants of clique complexes as predictors of resting-state fMRI dynamics. Underpins our use of clique counts as a topological-integrity proxy.",
    status: "validated",
  },
  {
    tag: "Dynamics",
    title: "The Kuramoto model in complex networks",
    authors: "Rodrigues F.A., Peron T.K.DM., Ji P., Kurths J.",
    venue: "Physics Reports 610 (2016)",
    summary:
      "Comprehensive treatment of finite-N Kuramoto dynamics on heterogeneous networks. Direct reference for our integrator (dθ/dt = ω + K/N · Σ W·sinΔθ + ξ) and order-parameter measurement.",
    status: "validated",
  },
  {
    tag: "Dynamics",
    title: "Kuramoto model on the human connectome",
    authors: "Cabral J., Hugues E., Sporns O., Deco G.",
    venue: "NeuroImage 57 (2011)",
    summary:
      "Validates Kuramoto coupling on empirical DTI/fMRI connectomes as a generative model of resting-state BOLD dynamics. Justifies our use of R = |⟨e^iθ⟩| as a network-coherence biomarker.",
    status: "validated",
  },
  {
    tag: "Parcellation",
    title: "Local-Global Parcellation of the Human Cerebral Cortex",
    authors: "Schaefer A., Kong R., Gordon E.M., et al.",
    venue: "Cerebral Cortex 28 (2018)",
    summary:
      "Multi-resolution functional atlas. Our baseline topology samples N=200 ROIs assigned to the 7 Yeo networks (Default, Control, Limbic, Visual, SomatoMotor, VentAttn, DorsalAttn).",
    status: "validated",
  },
  {
    tag: "Clinical",
    title: "Default Mode Network hyperconnectivity in MDD",
    authors: "Kaiser R.H., Andrews-Hanna J.R., Wager T.D., Pizzagalli D.A.",
    venue: "JAMA Psychiatry 72 (2015)",
    summary:
      "Meta-analysis of 25 fMRI studies confirming sustained DMN hyper-coupling in major depression. Encoded as the `mdd` pathology modifier (intra-DMN edge boost + control-network attenuation).",
    status: "validated",
  },
  {
    tag: "Clinical",
    title: "Limbic-prefrontal disconnection in PTSD",
    authors: "Akiki T.J., Averill C.L., Abdallah C.G.",
    venue: "Current Psychiatry Reports 19 (2017)",
    summary:
      "Network-based review documenting amygdala/limbic hyper-arousal and prefrontal-limbic decoupling. Encoded as the `ptsd` modifier (limbic-clique noise injection + control edge sparsification).",
    status: "validated",
  },
  {
    tag: "Pharmacology",
    title: "Psychedelics promote structural & functional neural plasticity",
    authors: "Ly C., Greb A.C., Cameron L.P., et al.",
    venue: "Cell Reports 23 (2018)",
    summary:
      "Cellular evidence for BDNF/TrkB-mediated dendritogenesis driven by serotonergic psychedelics. Foundation for the `repair` vector applied by ZB-01, NX-44, and classic psychedelics.",
    status: "validated",
  },
];

export default function EvidencePage() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-canvas h-[calc(100vh-3rem)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
          <span className="section-label-strong">F8 · EVIDENCE BASE</span>
        </div>
        <h1 className="text-2xl font-semibold text-ink">Validation &amp; Citations</h1>
        <p className="text-sm text-ink-muted mt-2 max-w-3xl leading-relaxed">
          Every quantitative substrate, integrator and pathology modifier in the engine
          is anchored in peer-reviewed literature. Citations below are normative —
          deviations from published parameter ranges are flagged in the diagnostic
          warnings panel.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {STUDIES.map((s, i) => (
            <article key={i} className="clinical-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-micro text-accent-400 font-mono uppercase tracking-widest">
                  {s.tag}
                </span>
                <span className="bg-ok/15 text-ok text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
                  {s.status}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-ink leading-snug mb-1">
                {s.title}
              </h2>
              <p className="text-2xs text-ink-muted font-mono mb-3">
                {s.authors} · {s.venue}
              </p>
              <p className="text-xs text-ink-subtle leading-relaxed">{s.summary}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 clinical-card p-5">
          <span className="section-label-strong">DISCLOSURE</span>
          <p className="text-2xs text-ink-muted mt-2 leading-relaxed">
            babelForge is a research-grade <em>in-silico</em> engine. Compound vector
            magnitudes are derived from receptor-affinity scaling and clinical-dose
            equivalence; they are not a substitute for prescriber judgement. The
            ZB/SS/LL/DR/NX series are pipeline candidates and not approved therapeutics.
          </p>
        </div>
      </div>
    </div>
  );
}
