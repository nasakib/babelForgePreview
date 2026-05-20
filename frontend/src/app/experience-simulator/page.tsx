"use client";

import { useState, useEffect } from "react";
import { useAI } from "@/context/AIContext";
import dynamic from "next/dynamic";
const NeuroCanvas = dynamic(() => import("@/components/NeuroCanvas"), { ssr: false });
import { babelforgeApi } from "@/lib/api/client";
import PanelHeader from "@/components/palantir/PanelHeader";
import DraggablePanel from "@/components/palantir/DraggablePanel";

const STORAGE_KEY = "babelforge:experience-simulator:v1";

export default function ExperienceSimulator() {
  const { activePathologies, setViewPerspective } = useAI();
  const [experience, setExperience] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
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
      const data = await babelforgeApi.simulate(experience, { pathologies: activePathologies });
      if (data && (data.error || /GEMINI_API_KEY|not configured|missing key/i.test(data?.desc || '') || /GEMINI_API_KEY|not configured|missing key/i.test(data?.label || ''))) {
        throw new Error("Backend API key missing");
      }
      setResult(data);
      setViewPerspective("pharma"); // Switch to effect view
    } catch (err) {
      console.error("Simulation API failed, using local high-fidelity fallback:", err);
      const localData = localSimulateFallback(experience, activePathologies);
      setResult(localData);
      setViewPerspective("pharma"); // Switch to effect view
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

      {/* Left Sidebar: Simulator Input */}
      <DraggablePanel
        id="experience-simulator"
        title="Subjective Reaction Engine"
        subtitle="LLM-Physics Bridge"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 400, height: 600 }}
      >
        <div className="p-4 flex flex-col gap-4 border-b border-line flex-none">
          <p className="text-xs text-ink-subtle leading-relaxed">
            Describe a subjective experience, intervention, or state in natural language. The engine will parse your description and map it onto the brain&apos;s topological physics engine in real-time.
          </p>
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full h-32 bg-surface-50 border border-line-strong rounded-clinical p-3 text-sm text-ink font-sans resize-none focus:outline-none focus:border-accent-500 custom-scrollbar"
              placeholder="e.g., 'I just ran a marathon and then sat in a sauna for 20 minutes', or 'I took 2mg of alprazolam during a panic attack...'"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
            <button
              onClick={handleSimulate}
              disabled={isSimulating || !experience.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
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

        <div className="p-4 flex-grow overflow-y-auto">
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
                  <h4 className="text-lg font-bold text-ink mb-1">{result.label}</h4>
                  <p className="text-xs text-ink-subtle leading-relaxed">{result.desc}</p>
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
              </div>
            )
          ) : (
            <div className="text-[10px] text-ink-muted font-mono">Awaiting linguistic input.</div>
          )}
        </div>
      </DraggablePanel>
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

function localSimulateFallback(experience: string, pathologies: string[]): any {
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

  if (matches.length === 0) {
    return {
      arousal: 0.1,
      dampening: 0.1,
      chaos: 0.0,
      repair: 0.2,
      label: "Integrated Cortical Adaptation",
      desc: `Linguistic input parsed locally. The brain shifts its topological phase parameters deterministically to maintain homeostatic equilibrium.${pathText}`,
      subj: "A subtle shift in baseline cognitive focus, normal sensory flow, and steady homeostatic adaptation."
    };
  }

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
  const blendedArousal = +(arousal / count).toFixed(2);
  const blendedDampening = +(dampening / count).toFixed(2);
  const blendedChaos = +(chaos / count).toFixed(2);
  const blendedRepair = +(repair / count).toFixed(2);

  const blendedLabel = labels.slice(0, 2).join(" + ") + (labels.length > 2 ? "..." : "");
  const blendedDesc = descs.join(" ") + pathText;
  const blendedSubj = "A hybrid state: " + subjs.map(s => s.replace("A hybrid state: ", "")).join(" Combined with ");

  return {
    arousal: blendedArousal,
    dampening: blendedDampening,
    chaos: blendedChaos,
    repair: blendedRepair,
    label: blendedLabel,
    desc: blendedDesc,
    subj: blendedSubj
  };
}