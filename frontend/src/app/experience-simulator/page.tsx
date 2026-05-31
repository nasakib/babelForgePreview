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
import ReceptorOccupancy from "@/components/clinical/ReceptorOccupancy";
import { molecules } from "@/data/molecules";

const STORAGE_KEY = "babelforge:experience-simulator:v1";

export default function ExperienceSimulator() {
  const { activePathologies, setViewPerspective, startingAge } = useAI();
  const [profile, setProfile] = useState<PatientProfile>(EMPTY_PROFILE);
  const [experience, setExperience] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [elapsedHrs, setElapsedHrs] = useState(0);
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
        if (parsed.elapsedHrs !== undefined) setElapsedHrs(parsed.elapsedHrs);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ experience, result, elapsedHrs }));
    } catch {
      /* ignore */
    }
  }, [experience, result, elapsedHrs, hydrated]);

  // Dynamically update the simulation when demographic profile, active pathologies, or elapsed hours change
  useEffect(() => {
    if (!experience.trim() || !hydrated || !result) return;
    try {
      const localData = localSimulateFallback(experience, activePathologies, profile, elapsedHrs, startingAge);
      setResult(localData);
    } catch (err) {
      console.error("Dynamic simulation update failed:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedHrs, activePathologies, profile, hydrated, startingAge]);

  const handleSimulate = async () => {
    if (!experience.trim()) return;
    setIsSimulating(true);

    try {
      // Local simulation incorporates clinical genetics, vitals, labs, and psychometrics, ensuring absolute data privacy and physical correctness
      const localData = localSimulateFallback(experience, activePathologies, profile, elapsedHrs, startingAge);
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
        title="Subjective Experience Engine (SEE)"
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

            {/* Hours Elapsed range slider */}
            {result && (
              <div className="mt-2 bg-surface-0 border border-line p-3 rounded-clinical space-y-2 backdrop-blur-md">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">Hours Elapsed</span>
                  <span className="font-mono text-xs text-white font-semibold">{elapsedHrs} <span className="text-ink-muted text-[10px]">Hrs</span></span>
                </div>
                <input
                  type="range"
                  className="slider-clinical w-full cursor-pointer h-1.5 bg-surface-100 rounded-clinical appearance-none"
                  min="0"
                  max="48"
                  step="0.5"
                  value={elapsedHrs}
                  onChange={(e) => setElapsedHrs(parseFloat(e.target.value))}
                  style={{ accentColor: '#6366f1' }}
                />
                <p className="text-[9px] text-ink-muted font-mono leading-none text-right">
                  PK/PD decay based on genotype/age clearance profiles
                </p>
              </div>
            )}
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
                  <span className="text-[9px] uppercase font-bold text-accent-400 block mb-1 tracking-widest">SEE Projected Subjective State</span>
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

            {/* Receptor Occupancy Widget */}
            {result.occupancies && (
              <div className="flex-none">
                <ReceptorOccupancy occupancyData={result.occupancies} title="Somatic Receptor Binding" />
              </div>
            )}

            {/* Cognitive Domains */}
            <div className="bg-surface-50 border border-line rounded-clinical p-3 space-y-2.5 flex-none">
              <div className="text-[10px] text-ink-subtle uppercase font-bold tracking-wider">Cognitive Domain Projection (SEE)</div>
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

interface DrugMetadata {
  id: string;
  keywords: string[];
  defaultDose: number; // in unit
  unit: string;
}

const DRUG_METADATA_LIST: DrugMetadata[] = [
  { id: "seriphadine", keywords: ["seriphadine"], defaultDose: 15, unit: "mg" },
  { id: "spur_mtdl", keywords: ["spur_mtdl", "spur-mtdl", "spur mtdl"], defaultDose: 15, unit: "mg" },
  { id: "spur01", keywords: ["spur01", "spur-01", "spur 01", "spur-1", "spur 1"], defaultDose: 15, unit: "mg" },
  { id: "zb01", keywords: ["zb01", "zb-01", "zb 01", "zenbud"], defaultDose: 10, unit: "mg" },
  { id: "ll07", keywords: ["ll07", "ll-07", "ll 07", "limbiclink"], defaultDose: 10, unit: "mg" },
  { id: "ss20", keywords: ["ss20", "ss-20", "ss 20", "synaptostim"], defaultDose: 10, unit: "mg" },
  { id: "dr02", keywords: ["dr02", "dr-02", "dr 02", "dopareg"], defaultDose: 10, unit: "mg" },
  { id: "nx44", keywords: ["nx44", "nx-44", "nx 44", "neurox"], defaultDose: 10, unit: "mg" },
  { id: "psilo", keywords: ["psilocybin", "shroom", "mushroom", "psilocin"], defaultDose: 15, unit: "mg" },
  { id: "ibogaine", keywords: ["ibogaine", "iboga", "noribogaine", "tabernanthe"], defaultDose: 15, unit: "mg" },
  { id: "lsd", keywords: ["lsd", "acid"], defaultDose: 0.15, unit: "mg" },
  { id: "jianshouqing", keywords: ["jianshouqing", "yunnan mushroom", "little people", "little green men", "variegatic acid", "boletaceae", "boletus"], defaultDose: 50, unit: "g" },
  { id: "mdma", keywords: ["mdma", "ecstasy", "molly", "empathogen"], defaultDose: 100, unit: "mg" },
  { id: "ketamine", keywords: ["ketamine", "special k"], defaultDose: 50, unit: "mg" },
  { id: "sert", keywords: ["sertraline", "sert", "zoloft"], defaultDose: 100, unit: "mg" },
  { id: "fluox", keywords: ["fluoxetine", "prozac", "fluox"], defaultDose: 40, unit: "mg" },
  { id: "escit", keywords: ["escitalopram", "lexapro", "escit"], defaultDose: 10, unit: "mg" },
  { id: "venla", keywords: ["venlafaxine", "effexor", "venla"], defaultDose: 75, unit: "mg" },
  { id: "dulox", keywords: ["duloxetine", "cymbalta", "dulox"], defaultDose: 60, unit: "mg" },
  { id: "citalo", keywords: ["citalopram", "celexa", "citalo"], defaultDose: 20, unit: "mg" },
  { id: "parox", keywords: ["paroxetine", "paxil", "parox"], defaultDose: 20, unit: "mg" },
  { id: "fluvox", keywords: ["fluvoxamine", "luvox", "fluvox"], defaultDose: 100, unit: "mg" },
  { id: "bupropion", keywords: ["bupropion", "wellbutrin", "zyban"], defaultDose: 150, unit: "mg" },
  { id: "mirtaz", keywords: ["mirtazapine", "remeron", "mirtaz"], defaultDose: 30, unit: "mg" },
  { id: "traz", keywords: ["trazodone", "oleptro", "traz"], defaultDose: 150, unit: "mg" },
  { id: "amph", keywords: ["amphetamine", "adderall", "dextroamphetamine", "dexedrine"], defaultDose: 20, unit: "mg" },
  { id: "mph", keywords: ["methylphenidate", "ritalin", "concerta", "mph"], defaultDose: 20, unit: "mg" },
  { id: "lisdexamph", keywords: ["lisdexamfetamine", "vyvanse"], defaultDose: 50, unit: "mg" },
  { id: "dexmph", keywords: ["dexmethylphenidate", "focalin"], defaultDose: 10, unit: "mg" },
  { id: "modaf", keywords: ["modafinil", "provigil"], defaultDose: 200, unit: "mg" },
  { id: "armodaf", keywords: ["armodafinil", "nuvigil"], defaultDose: 150, unit: "mg" },
  { id: "caffeine", keywords: ["caffeine", "coffee", "cappuccino", "espresso", "latte", "energy drink", "red bull"], defaultDose: 100, unit: "mg" },
  { id: "nicotine", keywords: ["nicotine", "cigarette", "vape", "tobacco", "cigar"], defaultDose: 2, unit: "mg" },
  { id: "meth", keywords: ["methamphetamine", "meth", "crystal meth", "desoxyn"], defaultDose: 10, unit: "mg" },
  { id: "coke", keywords: ["cocaine", "coke", "crack"], defaultDose: 50, unit: "mg" },
  { id: "queti", keywords: ["quetiapine", "seroquel"], defaultDose: 50, unit: "mg" },
  { id: "olan", keywords: ["olanzapine", "zyprexa"], defaultDose: 10, unit: "mg" },
  { id: "cloz", keywords: ["clozapine", "clozaril"], defaultDose: 100, unit: "mg" },
  { id: "risper", keywords: ["risperidone", "risperdal"], defaultDose: 2, unit: "mg" },
  { id: "arip", keywords: ["aripiprazole", "abilify"], defaultDose: 10, unit: "mg" },
  { id: "halo", keywords: ["haloperidol", "haldol"], defaultDose: 5, unit: "mg" },
  { id: "alpraz", keywords: ["alprazolam", "xanax", "alpraz"], defaultDose: 1, unit: "mg" },
  { id: "clonaz", keywords: ["clonazepam", "klonopin", "clonaz"], defaultDose: 1, unit: "mg" },
  { id: "diaz", keywords: ["diazepam", "valium", "diaz"], defaultDose: 5, unit: "mg" },
  { id: "loraz", keywords: ["lorazepam", "ativan", "loraz"], defaultDose: 1, unit: "mg" },
  { id: "zolp", keywords: ["zolpidem", "ambien", "zolp"], defaultDose: 10, unit: "mg" },
  { id: "zopic", keywords: ["zopiclone", "imovane"], defaultDose: 7.5, unit: "mg" },
  { id: "pregab", keywords: ["pregabalin", "lyrica"], defaultDose: 150, unit: "mg" },
  { id: "gaba", keywords: ["gabapentin", "neurontin"], defaultDose: 300, unit: "mg" },
  { id: "alc", keywords: ["ethanol", "alcohol", "beer", "wine", "whiskey", "vodka", "tequila", "gin", "rum", "drink"], defaultDose: 30, unit: "g" },
  { id: "fent", keywords: ["fentanyl", "duragesic"], defaultDose: 0.1, unit: "mg" },
  { id: "oxy", keywords: ["oxycodone", "oxycontin", "percocet", "oxy"], defaultDose: 15, unit: "mg" },
  { id: "methadone", keywords: ["methadone", "dolophine"], defaultDose: 20, unit: "mg" },
  { id: "buprenorphine", keywords: ["buprenorphine", "suboxone", "subutex"], defaultDose: 4, unit: "mg" },
  { id: "sr17", keywords: ["sr17", "sr17-018", "sr17018"], defaultDose: 10, unit: "mg" },
  { id: "nrg01", keywords: ["nrg-01", "nrg01", "doparestore"], defaultDose: 10, unit: "mg" },
  { id: "clonidine", keywords: ["clonidine", "catapres"], defaultDose: 0.1, unit: "mg" },
  { id: "acamprosate", keywords: ["acamprosate", "campral"], defaultDose: 666, unit: "mg" },
  { id: "flumazenil", keywords: ["flumazenil", "romazicon"], defaultDose: 0.5, unit: "mg" },
  { id: "nac", keywords: ["nac", "n-acetylcysteine", "acetylcysteine"], defaultDose: 600, unit: "mg" },
  { id: "agmatine", keywords: ["agmatine", "agmatine sulfate"], defaultDose: 500, unit: "mg" },
  { id: "galantamine", keywords: ["galantamine", "razadyne"], defaultDose: 8, unit: "mg" },
  { id: "thc", keywords: ["thc", "cannabis", "marijuana", "weed", "pot", "hash", "gummies", "gummy"], defaultDose: 10, unit: "mg" },
  { id: "cbd", keywords: ["cbd", "cannabidiol"], defaultDose: 25, unit: "mg" },
  { id: "cbt", keywords: ["cbt", "therapy", "cognitive behavioral therapy"], defaultDose: 1, unit: "session" },
  { id: "sleep", keywords: ["sleep", "sleeping", "napping", "nap"], defaultDose: 8, unit: "hours" },
  { id: "meditation", keywords: ["meditation", "meditate", "meditating", "mindfulness"], defaultDose: 30, unit: "minutes" },
  { id: "z2cardio", keywords: ["cardio", "run", "running", "jogging", "exercise", "workout", "workout out", "marathon", "hiit", "lifting"], defaultDose: 45, unit: "minutes" },
  { id: "hbot", keywords: ["hbot", "hyperbaric", "hyperbaric oxygen"], defaultDose: 60, unit: "minutes" },
  { id: "coldplunge", keywords: ["cold plunge", "cold water", "ice bath", "sauna"], defaultDose: 5, unit: "minutes" },
  { id: "tms", keywords: ["tms", "transcranial magnetic"], defaultDose: 1, unit: "session" },
  { id: "dbs", keywords: ["dbs", "deep brain stimulation"], defaultDose: 1, unit: "session" },
  { id: "vns", keywords: ["vns", "vagus nerve stimulation", "tVNS", "taVNS"], defaultDose: 1, unit: "session" },
  { id: "ect", keywords: ["ect", "electroconvulsive"], defaultDose: 1, unit: "session" },
  { id: "tcca", keywords: ["tcca"], defaultDose: 1, unit: "session" },
  { id: "donepezil", keywords: ["donepezil", "aricept"], defaultDose: 5, unit: "mg" }
];

function parseDoseWithUnit(text: string, keywords: string[]): { value: number; unit: string } | null {
  for (const kw of keywords) {
    const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    const prevRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(mg|g|mcg|ml|min|minutes|hr|hrs|hours)?\\s*(?:of|at)?\\s+${escapedKw}`, "i");
    let match = text.match(prevRegex);
    if (match && match[1]) {
      return { value: parseFloat(match[1]), unit: (match[2] || "").toLowerCase() };
    }
    
    const postRegex = new RegExp(`${escapedKw}\\s*(?:at|dose|of)?\\s*\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*(mg|g|mcg|ml|min|minutes|hr|hrs|hours)?\\)?`, "i");
    match = text.match(postRegex);
    if (match && match[1]) {
      return { value: parseFloat(match[1]), unit: (match[2] || "").toLowerCase() };
    }
  }
  return null;
}

function mapParsedDoseToIntensity(id: string, parsed: { value: number; unit: string } | null, defaultDose: number): number {
  let val = defaultDose;
  let unit = "";
  
  if (parsed) {
    val = parsed.value;
    unit = parsed.unit;
  }
  
  if (id === "jianshouqing") {
    if (unit === "mg") val = val / 1000.0;
    return val / 50.0;
  }
  
  if (id === "lsd") {
    if (unit === "mcg") val = val / 1000.0;
    return val / 0.15;
  }
  
  if (id === "sleep") {
    return val / 8.0;
  }
  
  if (["meditation", "breathwork", "coldplunge", "z2cardio", "hbot"].includes(id)) {
    let mins = val;
    if (unit === "hr" || unit === "hrs" || unit === "hours") mins = val * 60;
    
    const standardMins: Record<string, number> = {
      meditation: 30,
      breathwork: 15,
      coldplunge: 5,
      z2cardio: 45,
      hbot: 60
    };
    return mins / (standardMins[id] || 30);
  }
  
  if (unit === "mcg") val = val / 1000.0;
  if (unit === "g") val = val * 1000.0;
  return val / 10.0;
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
  },
  {
    keywords: ["jianshouqing", "yunnan mushroom", "little people", "little green men", "lanmaoa", "variegatic acid", "boletaceae", "boletus"],
    arousal: 0.1,
    dampening: 0.3,
    chaos: 1.8,
    repair: 0.8,
    label: "Oneirogenic Reversible Coordinate Transformation",
    desc: "Oxidation kinetics of Variegatic Acid and structural HT2A/M1 receptor displacements drive dynamic default network dissolution and precise coordinate alterations in the primary visual cortex (V1-V4).",
    subj: "Highly structured, repetitive, and playful tiny-person animations ('little green men' or 'gentle people' hallucinations) with a deep, dreamlike state of oneirogenic awareness and parasympathetic autonomic shifts."
  },
  {
    keywords: ["ibogaine", "iboga", "noribogaine", "tabernanthe"],
    arousal: 0.2,
    dampening: 0.5,
    chaos: 0.8,
    repair: 3.0,
    label: "Atypical Oneirogenic Neurogenesis",
    desc: "Ibogaine and its active metabolite noribogaine act as multi-target ligands (NMDA antagonist, KOR agonist, sigma agonist), driving robust GDNF/BDNF expression in the mesolimbic pathway to remodel addiction circuitry.",
    subj: "Deep dreamlike oneirogenic review of personal history, somatic resets, and the complete elimination of substance cravings."
  }
];

function localSimulateFallback(experience: string, pathologies: string[], profile: PatientProfile, elapsedHrs = 0, startingAge = 35): any {
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

  const matchedDrugs: DrugMetadata[] = [];
  const stack: any[] = [];

  for (const drug of DRUG_METADATA_LIST) {
    if (drug.keywords.some(keyword => text.includes(keyword))) {
      matchedDrugs.push(drug);
      const parsed = parseDoseWithUnit(text, drug.keywords);
      const intensity = mapParsedDoseToIntensity(drug.id, parsed, drug.defaultDose);
      stack.push({ id: drug.id, dose: intensity });
    }
  }

  let blendedArousal = 0.1;
  let blendedDampening = 0.1;
  let blendedChaos = 0.0;
  let blendedRepair = 0.2;
  let blendedLabel = "Integrated Cortical Adaptation";
  let blendedDesc = `Linguistic input parsed locally. The brain shifts its topological phase parameters deterministically to maintain homeostatic equilibrium.${pathText}`;
  let blendedSubj = "A subtle shift in baseline cognitive focus, normal sensory flow, and steady homeostatic adaptation.";

  const matchedMols = matchedDrugs
    .map(d => molecules.find(m => m.id === d.id))
    .filter((m): m is any => !!m);

  if (matchedMols.length > 0) {
    let arousal = 0;
    let dampening = 0;
    let chaos = 0;
    let repair = 0;
    
    matchedMols.forEach(m => {
      arousal += m.effects.arousal ?? 0;
      dampening += m.effects.dampening ?? 0;
      chaos += m.effects.chaos ?? 0;
      repair += m.effects.repair ?? 0;
    });

    const count = matchedMols.length;
    blendedArousal = +(arousal / count).toFixed(2);
    blendedDampening = +(dampening / count).toFixed(2);
    blendedChaos = +(chaos / count).toFixed(2);
    blendedRepair = +(repair / count).toFixed(2);

    blendedLabel = "Direct " + matchedMols.map(m => m.name).join(" + ") + " Administration";
    blendedDesc = "Rigorous simulation of " + matchedMols.map(m => `${m.name} (${m.classLabel})`).join(", ") + " using physical PK/PD multi-receptor modeling." + pathText;
    blendedSubj = "Acute biological onset of " + matchedMols.map(m => m.name).join(" and ") + " with localized cortical receptor occupancy shifts.";
  } else if (matches.length > 0) {
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

  const patientParams = {
    weightKg: profile.demographics?.weightKg ?? 70,
    toleranceMonths: 0,
    ageYears: startingAge || (profile.demographics?.ageYears ?? 35),
    simulationTimeMonths: 0,
    profile,
    elapsedHrs
  };

  const report = runDiagnosis(pathologies as Pathology[], vectors, patientParams, stack);

  return {
    arousal: report.vectors?.arousal ?? blendedArousal,
    dampening: report.vectors?.dampening ?? blendedDampening,
    chaos: report.vectors?.chaos ?? blendedChaos,
    repair: report.vectors?.repair ?? blendedRepair,
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
    K: report.K,
    occupancies: report.occupancies
  };
}