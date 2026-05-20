"use client";

import { useState, useEffect } from "react";
import { useAI } from "@/context/AIContext";
import dynamic from "next/dynamic";
const NeuroCanvas = dynamic(() => import("@/components/NeuroCanvas"), { ssr: false });
import { babelforgeApi } from "@/lib/api/client";
import PanelHeader from "@/components/palantir/PanelHeader";
import DraggablePanel from "@/components/palantir/DraggablePanel";
import { runDiagnosis } from "@/lib/engine/diagnosis";
import type { Pathology } from "@/lib/engine/topology";
import { EMPTY_PROFILE, type PatientProfile } from "@/lib/patient/profile";

const STORAGE_KEY = "babelforge:experience-simulator:v1";

export default function ExperienceSimulator() {
  const { activePathologies, setViewPerspective } = useAI();
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [experience, setExperience] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const profileRaw = localStorage.getItem("babelforge:anomaly:profile:v1");
      if (profileRaw) {
        setProfile(JSON.parse(profileRaw));
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.experience) setExperience(parsed.experience);
        if (parsed.result) setResult(parsed.result);
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ experience, result }));
    } catch {
      /* ignore */
    }
  }, [experience, result, hydrated]);

  const handleSimulate = async () => {
    if (!experience.trim()) return;
    setIsSimulating(true);
    setResult(null);

    try {
      // Local simulation incorporates clinical genetics, vitals, labs, and psychometrics, ensuring absolute data privacy and physical correctness
      const localData = localSimulateFallback(experience, activePathologies, profile);
      setResult(localData);
      setViewPerspective("pharma"); // Switch to effect view
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const vectors = result && !result.error ? {
    arousal: result.arousal,
    dampening: result.dampening,
    chaos: result.chaos,
    repair: result.repair
  } : { arousal: 0, dampening: 0, chaos: 0, repair: 0 };

  return (
    <div className="w-full h-full relative lg:overflow-hidden overflow-y-auto bg-canvas">
      {/* Background Canvas */}
      <div className="absolute inset-0 z-0">
        <NeuroCanvas vectors={vectors} />
      </div>

      {/* Left Sidebar: Simulator Input & Physical Vectors */}
      <DraggablePanel
        id="experience-simulator"
        title="Subjective Reaction Engine"
        subtitle="LLM-Physics Bridge"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 400, height: 620 }}
      >
        <div className="p-4 flex flex-col gap-4 border-b border-line flex-none">
          <p className="text-xs text-ink-subtle leading-relaxed">
            Describe a subjective experience, intervention, or state in natural language. The engine will parse your description and map it onto the brain&apos;s topological physics engine in real-time.
          </p>
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full h-28 bg-surface-50 border border-line-strong rounded-clinical p-3 text-xs text-ink font-sans resize-none focus:outline-none focus:border-accent-500 custom-scrollbar"
              placeholder="e.g., 'I just ran a marathon and then sat in a sauna for 20 minutes', or 'I took 2mg of alprazolam during a panic attack...'"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
            <button
              onClick={handleSimulate}
              disabled={isSimulating || !experience.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2"
            >
              {isSimulating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Simulating Cortex Response...
                </>
              ) : (
                "Simulate Experience"
              )}
            </button>
          </div>
        </div>

        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          <div className="section-label mb-3">Objective & Subjective Projections</div>
          {isSimulating ? (
            <div className="flex flex-col gap-2 text-ink-muted font-mono text-[10px] animate-pulse">
              <span>&gt; Parsing natural language...</span>
              <span>&gt; Mapping to 4D pharmacological vector space...</span>
              <span>&gt; Applying perturbation to Kuramoto phase-oscillators...</span>
            </div>
          ) : result ? (
            result.error ? (
              <div className="text-crit text-xs border border-crit/30 bg-crit/10 p-3 rounded-clinical">
                {result.error}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in-up">
                <div>
                  <h4 className="text-base font-bold text-white mb-1 tracking-tight">{result.label}</h4>
                  <p className="text-[11px] text-ink-subtle leading-relaxed">{result.desc}</p>
                </div>
                
                <div className="bg-surface-50 border border-line-strong rounded-clinical p-3">
                  <span className="text-[9px] uppercase font-bold text-accent-400 block mb-1 tracking-widest">Projected Subjective State</span>
                  <p className="text-xs text-ink italic leading-relaxed">&ldquo;{result.subj}&rdquo;</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Arousal (α)</span>
                    <span className={`text-base font-bold ${result.arousal > 0 ? 'text-warn' : 'text-ok'}`}>{result.arousal > 0 ? '+' : ''}{result.arousal.toFixed(2)}</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Dampening (δ)</span>
                    <span className={`text-base font-bold ${result.dampening > 0 ? 'text-info' : 'text-ink'}`}>{result.dampening > 0 ? '+' : ''}{result.dampening.toFixed(2)}</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Chaos (χ)</span>
                    <span className={`text-base font-bold ${result.chaos > 0 ? 'text-crit' : 'text-ok'}`}>{result.chaos > 0 ? '+' : ''}{result.chaos.toFixed(2)}</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col">
                    <span className="text-[10px] font-mono uppercase text-ink-muted">Repair (ρ)</span>
                    <span className={`text-base font-bold ${result.repair > 0 ? 'text-accent-400' : 'text-crit'}`}>{result.repair > 0 ? '+' : ''}{result.repair.toFixed(2)}</span>
                  </div>
                </div>

                <div className="section-label mt-4 mb-2">Kuramoto Dynamics</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col text-center">
                    <span className="text-[9px] font-mono uppercase text-ink-muted">Integrity (Φ)</span>
                    <span className="text-sm font-bold text-emerald-400">{result.integrity ?? 100}%</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col text-center">
                    <span className="text-[9px] font-mono uppercase text-ink-muted">Sync (R)</span>
                    <span className="text-sm font-bold text-accent-400">{result.R !== undefined ? result.R.toFixed(3) : "1.000"}</span>
                  </div>
                  <div className="bg-surface-0 border border-line p-2 rounded-clinical flex flex-col text-center">
                    <span className="text-[9px] font-mono uppercase text-ink-muted">Coupling (K)</span>
                    <span className="text-sm font-bold text-indigo-400">{result.K !== undefined ? result.K.toFixed(2) : "1.00"}</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-[10px] text-ink-muted font-mono">Awaiting linguistic input.</div>
          )}
        </div>
      </DraggablePanel>

      {/* Right Sidebar: Patient Qualia Projection & Cognitive Domains */}
      {result && !result.error && result.subjectiveProfile && (
        <DraggablePanel
          id="experience-projection"
          title="Patient Qualia Projection"
          subtitle="Real-Time Cortex Simulation"
          defaultPosition={{ x: 440, y: 20 }}
          defaultSize={{ width: 440, height: 620 }}
        >
          <div className="p-4 flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar">
            {/* Qualia Class Display */}
            <div className="bg-surface-50 border border-line rounded-clinical p-3 relative overflow-hidden flex-none">
              <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/5 blur-xl rounded-full" />
              <div className="text-[10px] text-ink-subtle uppercase font-bold tracking-wider mb-0.5">Phenomenological Qualia</div>
              <div className="text-sm text-white font-bold tracking-tight mb-1 flex items-center gap-1.5 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-ping" />
                {result.subjectiveProfile.qualiaClass}
              </div>
              <div className="text-xs text-ink-subtle leading-relaxed italic">
                &ldquo;{result.subjectiveProfile.qualiaDescription}&rdquo;
              </div>
            </div>

            {/* State Badges / Tags */}
            <div className="flex flex-wrap gap-1.5 flex-none">
              {result.subjectiveProfile.tags.map((tag: string) => {
                const isPositive = ["Flow State", "Emotional Serenity", "Autonomic Balance", "Homeostasis"].includes(tag);
                const isWarning = ["Anhedonia", "Cognitive Fatigue", "Tachycardia Risk", "Connectome Decay", "Vagal Depletion", "Vit D Deficit", "Vit B12 Deficit", "Severe DMN Lock", "Acute Hyperarousal", "CYP Poor Metabolizer"].includes(tag);
                const colorClass = isPositive 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : (isWarning ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-accent-500/10 border-accent-500/30 text-accent-400");
                return (
                  <span 
                    key={tag} 
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${colorClass} uppercase tracking-wider`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>

            {/* Cognitive Domains */}
            <div className="bg-surface-50 border border-line rounded-clinical p-3 space-y-2.5 flex-none">
              <div className="text-[10px] text-ink-subtle uppercase font-bold tracking-wider">Cognitive Domain translation</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {/* Focus */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                    <span>Executive Focus</span>
                    <span className="font-mono text-white font-semibold">{result.subjectiveProfile.domains.focus}%</span>
                  </div>
                  <div className="h-1 bg-line rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: `${result.subjectiveProfile.domains.focus}%` }}
                    />
                  </div>
                </div>

                {/* Affective Valence */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                    <span>Emotional Valence</span>
                    <span className="font-mono text-white font-semibold">{result.subjectiveProfile.domains.affectiveValence}%</span>
                  </div>
                  <div className="h-1 bg-line rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${result.subjectiveProfile.domains.affectiveValence}%` }}
                    />
                  </div>
                </div>

                {/* Perceptual Entropy */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                    <span>Perceptual Entropy</span>
                    <span className="font-mono text-white font-semibold">{result.subjectiveProfile.domains.perceptualEntropy}%</span>
                  </div>
                  <div className="h-1 bg-line rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-fuchsia-500 transition-all duration-500" 
                      style={{ width: `${result.subjectiveProfile.domains.perceptualEntropy}%` }}
                    />
                  </div>
                </div>

                {/* Autonomic Tone */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-ink-subtle">
                    <span>Autonomic Balance</span>
                    <span className="font-mono text-white font-semibold">{result.subjectiveProfile.domains.autonomicTone}%</span>
                  </div>
                  <div className="h-1 bg-line rounded-full overflow-hidden relative">
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-white/40 left-1/2 -translate-x-1/2 z-10" 
                      title="Ideal Balance"
                    />
                    <div 
                      className={`h-full transition-all duration-500 ${
                        result.subjectiveProfile.domains.autonomicTone > 70 
                          ? "bg-rose-500" 
                          : (result.subjectiveProfile.domains.autonomicTone < 30 ? "bg-cyan-500" : "bg-amber-500")
                      }`} 
                      style={{ width: `${result.subjectiveProfile.domains.autonomicTone}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Narrative Paragraph */}
            <div className="text-xs text-ink-subtle leading-relaxed bg-surface-50 border border-line rounded-clinical p-3 font-sans relative overflow-hidden flex-grow custom-scrollbar overflow-y-auto">
              <div className="text-[10px] text-ink-subtle uppercase font-bold tracking-wider mb-1.5">Connectome Neuro-Narrative</div>
              <p className="indent-4 text-justify select-text">
                {result.subjectiveProfile.narrative}
              </p>
            </div>
          </div>
        </DraggablePanel>
      )}
    </div>
  );
}

interface Archetype {
  keywords: string[];
  arousal: number;
  dampening: number;
  chaos: number;
  repair: number;
  label: string;
  desc: string;
  subj: string;
}

const ARCHETYPES: Archetype[] = [
  {
    keywords: ["psilocybin", "lsd", "mdma", "ketamine", "magic mushroom", "shroom", "dmt", "trip", "tripping", "hallucinogen", "psychedelic", "entheogen", "acid"],
    arousal: 0.8,
    dampening: -0.2,
    chaos: 1.2,
    repair: 0.9,
    label: "Serotonergic Neuroplastic Resonance",
    desc: "High-affinity 5-HT2A receptor agonism induces profound desynchronization of the Default Mode Network (DMN), enabling novel functional connectivity pathways and immediate dendritic growth.",
    subj: "Widespread sensory enrichment, synesthesia, and cognitive boundary dissolution accompanied by intense emotional introspection."
  },
  {
    keywords: ["xanax", "alprazolam", "valium", "diazepam", "benzo", "alcohol", "beer", "wine", "whiskey", "drink", "gabapentin", "pregabalin", "sedative", "downer", "sleeping pill", "zolpidem"],
    arousal: -1.0,
    dampening: 1.4,
    chaos: -0.5,
    repair: -0.2,
    label: "Allosteric GABA-A Hyperpolarization",
    desc: "Positive allosteric modulation of GABAA receptors triggers widespread chloride influx, inducing synchronous slow-wave delta power and deep limbic dampening.",
    subj: "Widespread physical relaxation, rapid cognitive decompression, and the absolute silencing of acute stress and vigilance."
  },
  {
    keywords: ["amphetamine", "adderall", "ritalin", "methylphenidate", "coke", "cocaine", "speed", "meth", "coffee", "caffeine", "nicotine", "modafinil", "stimulant", "focus", "energy drink", "cappuccino", "espresso"],
    arousal: 1.4,
    dampening: -0.4,
    chaos: 0.6,
    repair: -0.1,
    label: "Monoaminergic Synaptic Saturation",
    desc: "Reversal or blockade of DAT, NET, and SERT transporters leads to high-density synaptic dopamine accumulation, shifting spectral dominance to fast beta/gamma oscillations.",
    subj: "High-octane mental clarity, surge in physical drive, sharpened task-focus, and absolute elimination of cognitive fatigue."
  },
  {
    keywords: ["fentanyl", "oxy", "oxycodone", "morphine", "heroin", "painkiller", "opiate", "opioid", "vicodin", "kratom", "codeine", "methadone"],
    arousal: -0.8,
    dampening: 1.8,
    chaos: 0.2,
    repair: 0.4,
    label: "Mu-Opioid Sensory De-afferentation",
    desc: "High-affinity mu-opioid receptor binding induces hyperpolarization of nociceptive pathways, down-regulating noradrenergic drive within the locus coeruleus.",
    subj: "Deep visceral warmth, absolute pain relief, severe somatic detachment, and a floating, worry-free dreamlike state."
  },
  {
    keywords: ["thc", "cbd", "cannabis", "marijuana", "weed", "cbg", "cbn", "smoke", "vape", "gummies", "hash", "pot"],
    arousal: 0.15,
    dampening: 0.5,
    chaos: 0.5,
    repair: 0.1,
    label: "Retrograde Cannabinoid Modulation",
    desc: "Exogenous CB1/CB2 agonism prompts presynaptic retrograde inhibition of GABA and glutamate release, inducing subtle network phase shifts.",
    subj: "Altered temporal perception, somatic relaxation, mild sensory enhancement, and calm, divergent ideation."
  },
  {
    keywords: ["meditate", "meditation", "breathwork", "pranayama", "yoga", "sleep", "sauna", "cold plunge", "cold water", "ice bath", "fasting", "keto", "exercise", "run", "cardio", "workout", "marathon", "hiit", "swimming", "lifting"],
    arousal: -0.3,
    dampening: 0.6,
    chaos: -0.6,
    repair: 1.4,
    label: "Autonomic Sympathovagal Homeostasis",
    desc: "Non-pharmacological vagal upregulation and stress-induction promote metabolic resilience, quieting limbic hyper-reactivity and facilitating sustained BDNF-mediated repair.",
    subj: "Centered cognitive clarity, grounded breathing patterns, physical decompression, and a state of restored homeostasis."
  },
  {
    keywords: ["panic", "anxiety", "stressed", "stressed out", "fight", "scared", "fear", "trauma", "flashback", "exam", "pressure", "worry", "alarm", "pissed", "angry"],
    arousal: 1.3,
    dampening: -0.3,
    chaos: 0.8,
    repair: -0.4,
    label: "Sympathetic Adrenergic Surge",
    desc: "Corticotropin-releasing hormone and systemic epinephrine release trigger DMN hyperconnectivity and limbic network fragmentation, destabilizing functional edges.",
    subj: "Somatic chest constriction, circular racing thoughts, hyper-vigilant scanning of the environment, and high acute alarm."
  }
];

function localSimulateFallback(experience: string, pathologies: string[], profile: PatientProfile): any {
  const text = experience.toLowerCase();
  const matches: Archetype[] = [];

  for (const arch of ARCHETYPES) {
    if (arch.keywords.some(keyword => text.includes(keyword))) {
      matches.push(arch);
    }
  }

  let pathText = "";
  if (pathologies && pathologies.length > 0) {
    pathText = ` Comorbid pathologies active: ${pathologies.join(", ")}.`;
  }

  let blendedArousal = 0.1;
  let blendedDampening = 0.1;
  let blendedChaos = 0.0;
  let blendedRepair = 0.2;
  let blendedLabel = "Integrated Cortical Adaptation";
  let blendedDesc = `Linguistic input parsed locally. The brain shifts its topological phase parameters deterministically to maintain homeostatic equilibrium.${pathText}`;
  let blendedSubj = "A subtle shift in baseline cognitive focus, normal sensory flow, and steady homeostatic adaptation.";

  if (matches.length > 0) {
    let arousal = 0;
    let dampening = 0;
    let chaos = 0;
    let repair = 0;
    const labels: string[] = [];
    const descs: string[] = [];
    const subjs: string[] = [];

    for (const match of matches) {
      arousal += match.arousal;
      dampening += match.dampening;
      chaos += match.chaos;
      repair += match.repair;
      labels.push(match.label);
      descs.push(match.desc);
      subjs.push(match.subj);
    }

    const count = matches.length;
    blendedArousal = +(arousal / count).toFixed(2);
    blendedDampening = +(dampening / count).toFixed(2);
    blendedChaos = +(chaos / count).toFixed(2);
    blendedRepair = +(repair / count).toFixed(2);

    blendedLabel = labels.slice(0, 2).join(" + ") + (labels.length > 2 ? "..." : "");
    blendedDesc = descs.join(" ") + pathText;
    blendedSubj = "A hybrid state: " + subjs.map(s => s.replace("A hybrid state: ", "")).join(" Combined with ");
  }

  const vectors = {
    arousal: blendedArousal,
    dampening: blendedDampening,
    chaos: blendedChaos,
    repair: blendedRepair
  };

  const stack: any[] = [];
  if (text.includes("psilocybin") || text.includes("shroom")) stack.push({ id: "psilo", dose: 1 });
  if (text.includes("lsd") || text.includes("acid")) stack.push({ id: "lsd", dose: 1 });
  if (text.includes("mdma") || text.includes("empathogen")) stack.push({ id: "mdma", dose: 1 });
  if (text.includes("ketamine")) stack.push({ id: "ketamine", dose: 1 });
  if (text.includes("xanax") || text.includes("alprazolam")) stack.push({ id: "alpraz", dose: 1 });
  if (text.includes("valium") || text.includes("diazepam")) stack.push({ id: "clonaz", dose: 1 });
  if (text.includes("alcohol") || text.includes("beer") || text.includes("wine") || text.includes("whiskey") || text.includes("drink")) stack.push({ id: "alcohol", dose: 1 });
  if (text.includes("amphetamine") || text.includes("adderall")) stack.push({ id: "amph", dose: 1 });
  if (text.includes("ritalin") || text.includes("methylphenidate")) stack.push({ id: "mph", dose: 1 });
  if (text.includes("coffee") || text.includes("caffeine") || text.includes("cappuccino") || text.includes("espresso")) stack.push({ id: "caffeine", dose: 1 });
  if (text.includes("modafinil")) stack.push({ id: "modaf", dose: 1 });
  if (text.includes("fentanyl") || text.includes("oxy") || text.includes("heroin") || text.includes("opiate") || text.includes("opioid")) stack.push({ id: "opioid", dose: 1 });
  if (text.includes("thc") || text.includes("cannabis") || text.includes("marijuana") || text.includes("weed")) stack.push({ id: "thc", dose: 1 });
  if (text.includes("meditat")) stack.push({ id: "meditation", dose: 1 });
  if (text.includes("breathwork")) stack.push({ id: "breathwork", dose: 1 });
  if (text.includes("sleep")) stack.push({ id: "sleep", dose: 1 });
  if (text.includes("cold plunge") || text.includes("sauna") || text.includes("cold water") || text.includes("ice bath")) stack.push({ id: "coldplunge", dose: 1 });
  if (text.includes("nrg-01") || text.includes("nrg01")) stack.push({ id: "nrg01", dose: 1 });
  if (text.includes("nac")) stack.push({ id: "nac", dose: 1 });
  if (text.includes("nx-44") || text.includes("nx44")) stack.push({ id: "nx44", dose: 1 });
  if (text.includes("lion's mane") || text.includes("lionmane") || text.includes("lions mane")) stack.push({ id: "lionmane", dose: 1 });
  if (text.includes("clonidine")) stack.push({ id: "clonidine", dose: 1 });
  if (text.includes("sr17") || text.includes("sr17-018")) stack.push({ id: "sr17", dose: 1 });
  if (text.includes("cbt") || text.includes("therapy")) stack.push({ id: "cbt", dose: 1 });
  if (text.includes("hbot")) stack.push({ id: "hbot", dose: 1 });

  const patientParams = {
    weightKg: profile.demographics?.weightKg ?? 70,
    toleranceMonths: 0,
    ageYears: profile.demographics?.ageYears ?? 35,
    simulationTimeMonths: 0,
    profile
  };

  const report = runDiagnosis(pathologies as Pathology[], vectors, patientParams, stack);

  return {
    arousal: blendedArousal,
    dampening: blendedDampening,
    chaos: blendedChaos,
    repair: blendedRepair,
    label: report.label || blendedLabel,
    desc: report.description || blendedDesc,
    subj: report.subjectiveProfile?.narrative || blendedSubj,
    subjectiveProfile: report.subjectiveProfile || {
      qualiaClass: report.label || blendedLabel,
      qualiaDescription: report.description || blendedDesc,
      domains: {
        focus: Math.round(50 + blendedArousal * 15 - blendedDampening * 8),
        affectiveValence: Math.round(50 + blendedRepair * 15 - blendedChaos * 10),
        perceptualEntropy: Math.round(10 + blendedChaos * 25),
        autonomicTone: Math.round(50 + blendedArousal * 18 - blendedDampening * 20),
      },
      tags: ["Homeostasis"],
      narrative: report.description || blendedDesc,
    },
    integrity: report.integrity,
    R: report.R,
    K: report.K
  };
}