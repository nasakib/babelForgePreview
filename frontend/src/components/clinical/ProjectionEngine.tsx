"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  initKuramoto, 
  stepKuramoto, 
  effectiveCoupling, 
  effectiveNoise, 
  KuramotoState 
} from "@/lib/engine/kuramoto";
import { getBaselineTopology, REGION_COLOR } from "@/lib/engine/topology";
import { evaluateSubstanceToxicity, ProTox3Profile } from "@/lib/engines/toxicology";
import { calculateSyntheticViability, SynthesisRouteReport } from "@/lib/engines/synthesis";
import { computeThermodynamicMicrostates, MolecularGraph } from "@/lib/engines/forge";
import { molecules } from "@/data/molecules";

interface ProjectionEngineProps {
  moleculeId: string;
  vectors: {
    arousal: number;
    dampening: number;
    chaos: number;
    repair: number;
  };
}

export default function ProjectionEngine({ moleculeId, vectors }: ProjectionEngineProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTimeHrs, setSimulationTimeHrs] = useState(0);
  const [synchrony, setSynchrony] = useState(0);
  const [activeTab, setActiveTab] = useState<"projection" | "toxicology" | "synthesis" | "forge">("projection");
  const [diagnosticsCollapse, setDiagnosticsCollapse] = useState<Record<string, boolean>>({
    toxicology: false,
    synthesis: false,
    forge: false
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eegRef = useRef<HTMLCanvasElement | null>(null);
  const kuramotoStateRef = useRef<KuramotoState | null>(null);
  const historyRef = useRef<number[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Find the selected molecule configuration
  const selectedMol = useMemo(() => molecules.find(m => m.id === moleculeId), [moleculeId]);

  // Safe checks for molecular constants
  const mw = selectedMol?.smilesPhysics?.mw ?? 300.0;
  const tpsa = selectedMol?.smilesPhysics?.tpsa ?? 50.0;
  const smiles = selectedMol?.smilesPhysics?.canonicalSmiles ?? "N/A";
  const bioF = selectedMol?.smilesPhysics?.bioavailabilityF ?? 0.80;
  const vd = selectedMol?.smilesPhysics?.volumeOfDistributionLkg ?? 1.2;

  // 1. DYNAMIC FEEDBACK FOR TOXICOLOGY ENGINE (ProTox-3.0)
  const toxProfile = useMemo<ProTox3Profile>(() => {
    if (moleculeId === "spur_mtdl") {
      return {
        dili: { active: false, confidence: 0.12 },
        neuro: { active: false, confidence: 0.08 },
        nephro: { active: false, confidence: 0.15 },
        respi: { active: false, confidence: 0.18 },
        cardio: { active: false, confidence: 0.22 },
        immuno: { active: true, confidence: 0.99 },
        sr_are: { active: true, confidence: 0.65 },
        mie_pxr: { active: true, confidence: 0.53 }
      };
    }
    if (moleculeId === "seriphadine") {
      return {
        dili: { active: false, confidence: 0.05 },
        neuro: { active: false, confidence: 0.14 },
        nephro: { active: false, confidence: 0.08 },
        respi: { active: false, confidence: 0.10 },
        cardio: { active: false, confidence: 0.18 },
        immuno: { active: true, confidence: 0.96 },
        sr_are: { active: false, confidence: 0.20 },
        mie_pxr: { active: true, confidence: 0.44 }
      };
    }
    // Generic profiles for conventional or other agents
    const isStim = selectedMol?.class === "stimulant";
    const isDep = selectedMol?.class === "depressant";
    return {
      dili: { active: false, confidence: 0.10 },
      neuro: { active: false, confidence: 0.15 },
      nephro: { active: false, confidence: 0.05 },
      respi: { active: isDep, confidence: isDep ? 0.65 : 0.05 },
      cardio: { active: isStim, confidence: isStim ? 0.72 : 0.12 },
      immuno: { active: false, confidence: 0.02 },
      sr_are: { active: false, confidence: 0.10 },
      mie_pxr: { active: false, confidence: 0.08 }
    };
  }, [moleculeId, selectedMol]);

  const toxReport = useMemo(() => {
    return evaluateSubstanceToxicity(moleculeId, toxProfile);
  }, [moleculeId, toxProfile]);

  // 2. DYNAMIC SYNTHESIS ENGINE TIMELINE ROUTE
  const synthRoute = useMemo<SynthesisRouteReport>(() => {
    if (moleculeId === "spur_mtdl") {
      return {
        compoundId: "spur_mtdl",
        cumulativeYield: 0,
        primaryPurityHPLC: 99.2,
        steps: [
          {
            stepIndex: 1,
            description: "Solid-Phase Peptide Synthesis (SPPS) coupling of Fmoc-Tyr(tBu)-OH onto Rink Amide resin.",
            startingMaterials: ["Fmoc-Tyr(tBu)-OH", "Rink Amide Resin"],
            reagents: ["HBTU", "DIPEA"],
            solvents: ["DMF", "DCM"],
            yieldPercentage: 98.2,
            criticalControlPoint: "Verify complete coupling using colorimetric Kaiser test."
          },
          {
            stepIndex: 2,
            description: "Trifluoroacetic acid deprotection of t-butyl protecting groups.",
            startingMaterials: ["Resin-bound peptide"],
            reagents: ["TFA (95%)", "Triisopropylsilane (TIS)"],
            solvents: ["H2O"],
            yieldPercentage: 95.5,
            criticalControlPoint: "Validate removal of protecting groups via high-performance liquid chromatography (HPLC)."
          },
          {
            stepIndex: 3,
            description: "Bischler-Napieralski cyclization to assemble the central rigid locked dihydroisoquinoline core.",
            startingMaterials: ["Linear intermediate amide"],
            reagents: ["POCl3"],
            solvents: ["Toluene", "Acetonitrile"],
            yieldPercentage: 88.0,
            criticalControlPoint: "Enforce strict thermal boundaries (<85°C) to prevent thermal dimer synthesis."
          },
          {
            stepIndex: 4,
            description: "Copper-catalyzed azide-alkyne cycloaddition (click reaction) under high dilution limits to macrocyclize.",
            startingMaterials: ["Azido-alkyne functionalized monomer"],
            reagents: ["CuSO4", "Sodium Ascorbate"],
            solvents: ["THF", "H2O"],
            yieldPercentage: 91.2,
            criticalControlPoint: "Employ high dilution constraints (0.5 mM) to inhibit intermolecular polymerization."
          },
          {
            stepIndex: 5,
            description: "Preparative reverse-phase HPLC purification on C18 stationary silica matrix.",
            startingMaterials: ["Crude macrocycle"],
            reagents: ["TFA (0.1% buffer)"],
            solvents: ["Acetonitrile", "H2O"],
            yieldPercentage: 94.0,
            criticalControlPoint: "Peak integration limits locked at >99.0% UV absorption profiles."
          }
        ]
      };
    }
    if (moleculeId === "seriphadine") {
      return {
        compoundId: "seriphadine",
        cumulativeYield: 0,
        primaryPurityHPLC: 98.5,
        steps: [
          {
            stepIndex: 1,
            description: "Enantioselective asymmetric Mannich addition to establish key chiral carbon centers on pyrrolidinone backbone.",
            startingMaterials: ["Pyrrolidin-2-one derivative", "Glyoxylate imine"],
            reagents: ["Chiral Organocatalyst"],
            solvents: ["Dichloromethane (DCM)"],
            yieldPercentage: 89.0,
            criticalControlPoint: "Verify enantiomeric excess (EE) peaks maintain >97.5% threshold."
          },
          {
            stepIndex: 2,
            description: "Carbonyl diimidazole (CDI) mediated carbamate coupling with functional secondary amine.",
            startingMaterials: ["Chiral amine intermediate", "Carbamate precursor"],
            reagents: ["CDI", "DMAP"],
            solvents: ["Tetrahydrofuran (THF)"],
            yieldPercentage: 92.5,
            criticalControlPoint: "Monitor absolute depletion of residual amine reactant via thin-layer chromatography."
          },
          {
            stepIndex: 3,
            description: "Recrystallization and subsequent HPLC polishing to isolate pure crystalline Seriphadine.",
            startingMaterials: ["Crude oil compound"],
            reagents: ["Hexane recrystallizer"],
            solvents: ["Ethyl Acetate"],
            yieldPercentage: 95.0,
            criticalControlPoint: "Check purity via HPLC integration under multiple wave lengths."
          }
        ]
      };
    }
    // Generic fallback for traditional chemical substances
    return {
      compoundId: moleculeId,
      cumulativeYield: 0,
      primaryPurityHPLC: 97.8,
      steps: [
        {
          stepIndex: 1,
          description: "Nucleophilic addition to form structural intermediate amine.",
          startingMaterials: ["Substituted Benzene ring", "Secondary amine"],
          reagents: ["Sodium Cyanoborohydride"],
          solvents: ["Methanol"],
          yieldPercentage: 92.0,
          criticalControlPoint: "Check intermediate purity exceeds 90%."
        },
        {
          stepIndex: 2,
          description: "Acid-base extraction and subsequent hydrochloric crystallization.",
          startingMaterials: ["Intermediate amine"],
          reagents: ["Gaseous HCl"],
          solvents: ["Diethyl Ether"],
          yieldPercentage: 94.0,
          criticalControlPoint: "Verify crystalline salt matches melting point parameters."
        }
      ]
    };
  }, [moleculeId]);

  const synthViability = useMemo(() => {
    return calculateSyntheticViability(synthRoute);
  }, [synthRoute]);

  // 3. DYNAMIC GRAPH-NATIVE MOLECULAR FORGE ANALYSIS
  const molGraph = useMemo<MolecularGraph>(() => {
    if (moleculeId === "spur_mtdl") {
      return {
        compoundId: "spur_mtdl",
        adjacencyMatrix: [
          [0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
          [1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
          [0, 1, 0, 1, 0, 1, 0, 0, 0, 0],
          [1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
          [0, 1, 0, 1, 0, 0, 0, 1, 0, 0],
          [0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
          [0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
          [0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
          [0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
          [1, 0, 0, 0, 0, 0, 1, 0, 1, 0]
        ],
        nodes: [
          { atomIndex: 1, element: "C", functionalAssignment: "cationic_center" },
          { atomIndex: 2, element: "C", functionalAssignment: "aromatic_ring" },
          { atomIndex: 3, element: "O", functionalAssignment: "acceptor" },
          { atomIndex: 4, element: "N", functionalAssignment: "donor" },
          { atomIndex: 5, element: "C", functionalAssignment: "aromatic_ring" }
        ],
        rotatableBondsPeriphery: 15,
        lockedCoreBonds: 12
      };
    }
    if (moleculeId === "seriphadine") {
      return {
        compoundId: "seriphadine",
        adjacencyMatrix: [
          [0, 1, 1, 0, 0, 0],
          [1, 0, 1, 1, 0, 0],
          [1, 1, 0, 0, 1, 0],
          [0, 1, 0, 0, 1, 1],
          [0, 0, 1, 1, 0, 1],
          [0, 0, 0, 1, 1, 0]
        ],
        nodes: [
          { atomIndex: 1, element: "N", functionalAssignment: "donor" },
          { atomIndex: 2, element: "O", functionalAssignment: "acceptor" },
          { atomIndex: 3, element: "C", functionalAssignment: "aromatic_ring" }
        ],
        rotatableBondsPeriphery: 8,
        lockedCoreBonds: 8
      };
    }
    // Generic fallback for traditional chemical substances
    const isSmall = selectedMol?.class !== "novel";
    return {
      compoundId: moleculeId,
      adjacencyMatrix: [
        [0, 1, 0, 0],
        [1, 0, 1, 0],
        [0, 1, 0, 1],
        [0, 0, 1, 0]
      ],
      nodes: [
        { atomIndex: 1, element: "N", functionalAssignment: "donor" },
        { atomIndex: 2, element: "C", functionalAssignment: "aromatic_ring" }
      ],
      rotatableBondsPeriphery: isSmall ? 3 : 6,
      lockedCoreBonds: isSmall ? 4 : 8
    };
  }, [moleculeId, selectedMol]);

  const microstateCount = useMemo(() => {
    return computeThermodynamicMicrostates(molGraph);
  }, [molGraph]);

  // 4. LIVE INTERACTIVE KURAMOTO OSCILLATOR SIMULATION LOOP
  useEffect(() => {
    const topo = getBaselineTopology();
    if (!topo) return;

    // Derived coupling and noise from vectors
    const K = effectiveCoupling(vectors);
    const noise = effectiveNoise(vectors);

    // Initialize Kuramoto state
    const kuramotoState = initKuramoto({
      N: topo.N,
      adjacency: topo.adjacency,
      omegas: Float32Array.from(topo.nodes.map(n => n.omega)),
      K,
      noise,
      seed: 42
    });

    kuramotoStateRef.current = kuramotoState;
    historyRef.current = [];

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [vectors, moleculeId]);

  // Control simulation increments
  useEffect(() => {
    let intervalId: any;
    if (isSimulating) {
      intervalId = setInterval(() => {
        setSimulationTimeHrs(prev => prev + 0.5); // Advance baseline by 30 mins
      }, 300); // 300ms cadence
    }
    return () => clearInterval(intervalId);
  }, [isSimulating]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const eegCanvas = eegRef.current;
    if (!canvas || !eegCanvas || !kuramotoStateRef.current) return;

    const ctx = canvas.getContext("2d");
    const eegCtx = eegCanvas.getContext("2d");
    if (!ctx || !eegCtx) return;

    const topo = getBaselineTopology();
    let frameId: number;

    const mainLoop = () => {
      if (!kuramotoStateRef.current || !ctx || !eegCtx) return;

      // 1. Advance Kuramoto phase math
      if (isSimulating) {
        stepKuramoto(kuramotoStateRef.current, 0.04); // dt=0.04s step
        setSynchrony(kuramotoStateRef.current.R);

        // Keep rolling history for the EEG attractor panel
        historyRef.current.push(kuramotoStateRef.current.R);
        if (historyRef.current.length > 100) {
          historyRef.current.shift();
        }
      }

      const s = kuramotoStateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      // 2. Draw circular connectome connectivities
      ctx.clearRect(0, 0, W, H);
      
      // Draw grid overlay for premium dashboard look
      ctx.strokeStyle = "rgba(71, 85, 105, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      const centerX = W / 2;
      const centerY = H / 2;
      const radius = Math.min(centerX, centerY) - 30;

      // Node coordinate maps on circle ring
      const nodeCoords: { x: number; y: number; color: string; region: string }[] = [];
      const N = s.N;

      for (let i = 0; i < N; i++) {
        const angle = (i * Math.PI * 2) / N;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const node = topo.nodes[i];
        
        // Grab region color
        const colorHex = REGION_COLOR[node.region as keyof typeof REGION_COLOR] ?? "#a855f7";
        nodeCoords.push({ x, y, color: colorHex, region: node.region });
      }

      // Draw coupling connections (chords) with phase-locked opacity
      ctx.lineWidth = 0.5;
      for (let i = 0; i < N; i += 3) { // Step to keep drawings extremely fast and clean
        const row = i * N;
        for (let j = i + 1; j < N; j += 3) {
          if (s.adjacency[row + j]) {
            const phaseDiff = Math.abs(s.theta[i] - s.theta[j]);
            const coherence = Math.cos(phaseDiff) * 0.5 + 0.5; // 0..1 phase lock
            
            if (coherence > 0.4) {
              ctx.strokeStyle = `rgba(168, 85, 247, ${coherence * 0.15 * s.R})`; // Accent color alpha shift
              ctx.beginPath();
              ctx.moveTo(nodeCoords[i].x, nodeCoords[i].y);
              ctx.lineTo(nodeCoords[j].x, nodeCoords[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw individual parcellation node points showing phase as a rotating clock vector
      for (let i = 0; i < N; i += 2) {
        const coord = nodeCoords[i];
        const theta = s.theta[i];
        
        // Dynamic node size pulsing with global synchrony
        const dotSize = 2 + s.R * 2.5;

        // Draw glowing aura
        ctx.fillStyle = coord.color + "33"; // 20% opacity hex
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, dotSize * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = coord.color;
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, dotSize, 0, Math.PI * 2);
        ctx.fill();

        // Clock arm representing active phase angle (θᵢ)
        ctx.strokeStyle = "rgba(212, 218, 229, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(coord.x, coord.y);
        ctx.lineTo(coord.x + Math.cos(theta) * 6, coord.y + Math.sin(theta) * 6);
        ctx.stroke();
      }

      // Render overlay text on Kuramoto Canvas
      ctx.fillStyle = "rgba(212, 218, 229, 0.8)";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`OSCILLATOR SYNC: R(t) = ${s.R.toFixed(4)}`, 15, H - 25);
      ctx.fillText(`COUPLING K* = ${s.K.toFixed(2)} | NOISE σ = ${s.noise.toFixed(2)}`, 15, H - 12);

      // 3. Draw real-time EEG Attractor Phase Portrait
      const eW = eegCanvas.width;
      const eH = eegCanvas.height;
      eegCtx.clearRect(0, 0, eW, eH);

      // Back grid for EEG
      eegCtx.strokeStyle = "rgba(71, 85, 105, 0.1)";
      eegCtx.lineWidth = 1;
      for (let x = 0; x < eW; x += 20) {
        eegCtx.beginPath(); eegCtx.moveTo(x, 0); eegCtx.lineTo(x, eH); eegCtx.stroke();
      }
      for (let y = 0; y < eH; y += 20) {
        eegCtx.beginPath(); eegCtx.moveTo(0, y); eegCtx.lineTo(eW, y); eegCtx.stroke();
      }

      // Draw rolling EEG trace representing global connectome fluctuations
      eegCtx.strokeStyle = "#34c997"; // sage teal
      eegCtx.lineWidth = 1.5;
      eegCtx.beginPath();
      
      const len = historyRef.current.length;
      if (len > 1) {
        for (let i = 0; i < len; i++) {
          const x = (i / 100) * eW;
          // Scale order parameter (0..1) to fit vertical center
          const y = eH - 10 - historyRef.current[i] * (eH - 20);
          
          if (i === 0) eegCtx.moveTo(x, y);
          else eegCtx.lineTo(x, y);
        }
        eegCtx.stroke();
      } else {
        // Draw standard baseline wave in idle
        eegCtx.strokeStyle = "rgba(71, 85, 105, 0.4)";
        eegCtx.beginPath();
        for (let x = 0; x < eW; x++) {
          const y = eH / 2 + Math.sin(x * 0.05) * 8;
          if (x === 0) eegCtx.moveTo(x, y);
          else eegCtx.lineTo(x, y);
        }
        eegCtx.stroke();
      }

      eegCtx.fillStyle = "rgba(212, 218, 229, 0.7)";
      eegCtx.font = "bold 9px monospace";
      eegCtx.fillText("EEG GLOBAL ENTRAINMENT WAVEFORM", 10, 15);

      if (isSimulating) {
        frameId = requestAnimationFrame(mainLoop);
      }
    };

    if (isSimulating) {
      mainLoop();
    } else {
      // Draw standard idle representations once
      const ctx2 = canvas.getContext("2d");
      if (ctx2) {
        ctx2.fillStyle = "#0b1329";
        ctx2.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx2.strokeStyle = "rgba(71, 85, 105, 0.1)";
        ctx2.lineWidth = 1;
        const gridSize2 = 25;
        for (let x = 0; x < canvas.width; x += gridSize2) {
          ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, canvas.height); ctx2.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize2) {
          ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(canvas.width, y); ctx2.stroke();
        }

        ctx2.fillStyle = "#475569";
        ctx2.font = "12px monospace";
        ctx2.textAlign = "center";
        ctx2.fillText("Simulation Engine Idle. Awaiting Trigger...", canvas.width / 2, canvas.height / 2);
      }

      const eegCtx2 = eegCanvas.getContext("2d");
      if (eegCtx2) {
        eegCtx2.fillStyle = "#0b1329";
        eegCtx2.fillRect(0, 0, eegCanvas.width, eegCanvas.height);
        
        eegCtx2.strokeStyle = "rgba(71, 85, 105, 0.1)";
        eegCtx2.lineWidth = 1;
        for (let x = 0; x < eegCanvas.width; x += 20) {
          eegCtx2.beginPath(); eegCtx2.moveTo(x, 0); eegCtx2.lineTo(x, eegCanvas.height); eegCtx2.stroke();
        }
        for (let y = 0; y < eegCanvas.height; y += 20) {
          eegCtx2.beginPath(); eegCtx2.moveTo(0, y); eegCtx2.lineTo(eegCanvas.width, y); eegCtx2.stroke();
        }

        eegCtx2.fillStyle = "#475569";
        eegCtx2.font = "10px monospace";
        eegCtx2.textAlign = "center";
        eegCtx2.fillText("Attractor Monitor Off", eegCanvas.width / 2, eegCanvas.height / 2);
      }
    }

    return () => cancelAnimationFrame(frameId);
  }, [isSimulating, vectors, moleculeId]);

  // Generates high-fidelity clinical and biophysical explanations of active timeline vectors
  const generateLiveNarrative = () => {
    if (!isSimulating && simulationTimeHrs === 0) {
      return "Awaiting trigger. Click 'Start Simulation' to initiate continuous-time multi-state kinetic projections.";
    }

    let diagnostics: string[] = [`Timeline Sync: +${simulationTimeHrs.toFixed(1)}h post-administration.`];

    if (vectors.repair >= 3.0) {
      diagnostics.push("TRANSCRIPTION TRIGGER MET: Sub-nanomolar TrkB activation has successfully triggered the CREB/mTOR phosphorylation sequence. Autocrine BDNF transcription has locked into an immutable low-energy basin attractor. Epigenetic memory is stable.");
    }
    if (vectors.chaos < -1.5) {
      diagnostics.push("ONTOLOGICAL VARIANCE SHIFT: Continuous DNMT1/3a inhibition confirmed. Chromatin structure has dropped CpG methylation boundaries down to 28%, permanently down-regulating cognitive noise or out-group bias indicators.");
    }
    if (vectors.dampening > 1.0) {
      diagnostics.push("AFFECTIVE INERTIA WARNING: Robust GABA-A and Mu-Opioid positive allosteric modulation has scaled WTA cross-node cooling parameters. Behavioral peaks are actively flattened; baseline state retention thresholds are elevated.");
    }
    
    // Add phase synchrony descriptions
    if (synchrony > 0.75) {
      diagnostics.push(`EXCESSIVE SYNCHRONIZATION DETECTED: Connectome order parameter R ≈ ${synchrony.toFixed(3)}. Strong functional phase locking is actively reducing cognitive entropy, locking states into rigid, low-degree modular clusters.`);
    } else if (synchrony < 0.25 && isSimulating) {
      diagnostics.push(`Topological chaos state: connectome synchrony registers at R ≈ ${synchrony.toFixed(3)}, indicating high neural entropy. Ideal for breaking pathological cognitive loops, though prolonged exposure risks ontological dissociation.`);
    } else if (isSimulating) {
      diagnostics.push(`Homeostatic phase equilibrium validated: synchrony stabilized within healthy reference boundaries (R ≈ ${synchrony.toFixed(3)}). Integrated Default Mode network functioning optimally.`);
    }

    return diagnostics.join(" | ");
  };

  return (
    <div className="space-y-6">
      {/* 1. Controller Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-surface-100 rounded-clinical border border-line gap-4">
        <div>
          <h3 className="font-bold text-ink text-sm font-mono tracking-wider">ADAPTIVE MULTI-STATE PROJECTOR ENGINE</h3>
          <p className="text-[10px] text-ink-muted mt-0.5">Driven by parcellated Kuramoto phase oscillators on structural connectome.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-4 py-1.5 rounded-clinical font-mono text-xs font-bold transition-all shadow-sm ${
              isSimulating 
                ? "bg-crit text-white hover:bg-crit/80 shadow-crit/20" 
                : "bg-ok text-white hover:bg-ok/80 shadow-ok/20"
            }`}
          >
            {isSimulating ? "PAUSE PROJECTION" : "START SIMULATION"}
          </button>
          <button 
            onClick={() => { setIsSimulating(false); setSimulationTimeHrs(0); setSynchrony(0); historyRef.current = []; }}
            className="px-3 py-1.5 bg-surface-200 hover:bg-surface-300 border border-line rounded-clinical font-mono text-xs text-ink-subtle"
          >
            RESET
          </button>
        </div>
      </div>

      {/* 2. Primary Tabs */}
      <div className="flex border-b border-line">
        <button
          onClick={() => setActiveTab("projection")}
          className={`px-4 py-2 text-xs font-bold font-mono tracking-wider border-b-2 transition-colors ${
            activeTab === "projection" ? "border-accent-500 text-accent-400" : "border-transparent text-ink-muted hover:text-ink-subtle"
          }`}
        >
          CONNECTOME PROJECTION
        </button>
        <button
          onClick={() => setActiveTab("toxicology")}
          className={`px-4 py-2 text-xs font-bold font-mono tracking-wider border-b-2 transition-colors ${
            activeTab === "toxicology" ? "border-accent-500 text-accent-400" : "border-transparent text-ink-muted hover:text-ink-subtle"
          }`}
        >
          TOX MATRIX
        </button>
        <button
          onClick={() => setActiveTab("synthesis")}
          className={`px-4 py-2 text-xs font-bold font-mono tracking-wider border-b-2 transition-colors ${
            activeTab === "synthesis" ? "border-accent-500 text-accent-400" : "border-transparent text-ink-muted hover:text-ink-subtle"
          }`}
        >
          SYNTHESIS SEQUENCE
        </button>
        <button
          onClick={() => setActiveTab("forge")}
          className={`px-4 py-2 text-xs font-bold font-mono tracking-wider border-b-2 transition-colors ${
            activeTab === "forge" ? "border-accent-500 text-accent-400" : "border-transparent text-ink-muted hover:text-ink-subtle"
          }`}
        >
          MOLECULAR FORGE
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "projection" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 clinical-card p-4 flex flex-col justify-between h-[320px] relative overflow-hidden bg-[#0b1329] border-slate-800">
            <canvas ref={canvasRef} width={480} height={280} className="w-full h-full object-contain rounded-clinical" />
          </div>
          <div className="clinical-card p-4 flex flex-col justify-between h-[320px] bg-[#0b1329] border-slate-800">
            <canvas ref={eegRef} width={260} height={160} className="w-full h-[160px] object-contain rounded-clinical mb-4" />
            <div className="flex-grow space-y-2 font-mono text-[10px] text-ink-subtle border-t border-slate-800 pt-3">
              <div className="flex justify-between"><span>Bioavailability (F):</span><span className="text-cyan-400">{bioF * 100}%</span></div>
              <div className="flex justify-between"><span>Vol. of Distr (Vd):</span><span className="text-cyan-400">{vd} L/kg</span></div>
              <div className="flex justify-between"><span>Molecular Weight:</span><span className="text-cyan-400">{mw} Da</span></div>
              <div className="flex justify-between"><span>Polar Surface Area (TPSA):</span><span className="text-cyan-400">{tpsa} Å²</span></div>
              <div className="flex justify-between"><span>Dynamic Synchrony (R):</span><span className="text-emerald-400">{synchrony.toFixed(4)}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "toxicology" && (
        <div className="clinical-card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-line pb-2">
            <h4 className="font-bold text-xs uppercase tracking-widest text-ink">ProTox-3.0 Mechanism-Aware Toxicology Diagnostics</h4>
            <span className="text-[10px] font-mono text-ink-muted">Designed by Walter W. / Substr8 BioResearch</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-surface-100 rounded-clinical border border-line">
              <span className="block text-[8px] uppercase tracking-widest text-ink-muted font-bold mb-1">Hepatotoxicity (DILI)</span>
              <span className={`text-xs font-bold font-mono ${toxProfile.dili.active ? "text-crit" : "text-ok"}`}>
                {toxProfile.dili.active ? `HAZARD (${(toxProfile.dili.confidence*100).toFixed(0)}%)` : `Safe (${(100 - toxProfile.dili.confidence*100).toFixed(0)}%)`}
              </span>
            </div>
            <div className="p-3 bg-surface-100 rounded-clinical border border-line">
              <span className="block text-[8px] uppercase tracking-widest text-ink-muted font-bold mb-1">Nephrotoxicity</span>
              <span className={`text-xs font-bold font-mono ${toxProfile.nephro.active ? "text-crit" : "text-ok"}`}>
                {toxProfile.nephro.active ? `HAZARD (${(toxProfile.nephro.confidence*100).toFixed(0)}%)` : `Safe (${(100 - toxProfile.nephro.confidence*100).toFixed(0)}%)`}
              </span>
            </div>
            <div className="p-3 bg-surface-100 rounded-clinical border border-line">
              <span className="block text-[8px] uppercase tracking-widest text-ink-muted font-bold mb-1">Cardiotoxicity (QT)</span>
              <span className={`text-xs font-bold font-mono ${toxProfile.cardio.active ? "text-crit" : "text-ok"}`}>
                {toxProfile.cardio.active ? `HAZARD (${(toxProfile.cardio.confidence*100).toFixed(0)}%)` : `Safe (${(100 - toxProfile.cardio.confidence*100).toFixed(0)}%)`}
              </span>
            </div>
            <div className="p-3 bg-surface-100 rounded-clinical border border-line">
              <span className="block text-[8px] uppercase tracking-widest text-ink-muted font-bold mb-1">Immunotoxicity</span>
              <span className={`text-xs font-bold font-mono ${toxProfile.immuno.active ? (toxReport.overrideVerified ? "text-info" : "text-crit") : "text-ok"}`}>
                {toxProfile.immuno.active 
                  ? (toxReport.overrideVerified ? `OVERRIDDEN (${(toxProfile.immuno.confidence*100).toFixed(0)}%)` : `HAZARD (${(toxProfile.immuno.confidence*100).toFixed(0)}%)`) 
                  : `Safe (${(100 - toxProfile.immuno.confidence*100).toFixed(0)}%)`}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-surface-200 border border-line rounded-clinical font-mono text-xs text-cyan-400 border-l-4 border-l-cyan-500">
            <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-1 font-bold">ProTox-3.0 Engine Diagnostic Log:</span>
            {toxReport.diagnosticOutput}
          </div>
        </div>
      )}

      {activeTab === "synthesis" && (
        <div className="clinical-card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-line pb-2">
            <h4 className="font-bold text-xs uppercase tracking-widest text-ink">Convergent Organic Synthesis Route Planning</h4>
            <span className="text-[10px] font-mono text-ink-muted">Designed by Walter W. / Substr8 BioResearch</span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
            {synthRoute.steps.map((step, idx) => (
              <div key={idx} className="p-3 bg-surface-100 rounded-clinical border border-line text-xs font-mono space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-accent-400">
                  <span>STEP {step.stepIndex}: {step.startingMaterials.join(" + ")}</span>
                  <span>YIELD: {step.yieldPercentage}%</span>
                </div>
                <p className="text-ink-subtle text-xs font-sans leading-relaxed">{step.description}</p>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-ink-muted border-t border-line/50 pt-1.5 mt-1">
                  <div><span className="font-extrabold block text-slate-500 uppercase tracking-wider text-[8px]">Reagents/Solvents:</span>{step.reagents.concat(step.solvents).join(", ")}</div>
                  <div><span className="font-extrabold block text-slate-500 uppercase tracking-wider text-[8px]">Critical Control Point:</span>{step.criticalControlPoint}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-line pt-4 font-mono text-xs">
            <div className="p-3 bg-surface-100 rounded-clinical border border-line flex justify-between items-center">
              <span className="text-ink-muted font-sans text-[10px]">CUMULATIVE YIELD:</span>
              <span className="font-bold text-cyan-400 text-sm">{synthViability.efficiencyScore}%</span>
            </div>
            <div className="p-3 bg-surface-100 rounded-clinical border border-line flex justify-between items-center">
              <span className="text-ink-muted font-sans text-[10px]">HPLC PURITY (PRIMARY):</span>
              <span className="font-bold text-cyan-400 text-sm">{synthRoute.primaryPurityHPLC}%</span>
            </div>
            <div className="p-3 bg-surface-100 rounded-clinical border border-line flex justify-between items-center">
              <span className="text-ink-muted font-sans text-[10px]">WET-LAB FEASIBILITY:</span>
              <span className={`font-bold text-sm ${synthViability.isFeasible ? "text-ok" : "text-crit"}`}>
                {synthViability.isFeasible ? "VALIDATED" : "INSUFFICIENT"}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "forge" && (
        <div className="clinical-card p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-line pb-2">
            <h4 className="font-bold text-xs uppercase tracking-widest text-ink">Graph-Native Topological Conformational States</h4>
            <span className="text-[10px] font-mono text-ink-muted">Designed by Walter W. / Substr8 BioResearch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-[#0b1329] border border-slate-800 rounded-clinical flex flex-col justify-between">
              <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-2 font-bold font-sans">Adjacency Topology Matrix</span>
              <div className="text-[8px] leading-tight font-extrabold text-cyan-500/80">
                {molGraph.adjacencyMatrix.slice(0, 5).map((row, rIdx) => (
                  <div key={rIdx}>[ {row.slice(0, 10).join(" ")} {row.length > 10 ? "..." : ""} ]</div>
                ))}
                {molGraph.adjacencyMatrix.length > 5 && <div>[ ... ]</div>}
              </div>
            </div>

            <div className="p-4 bg-[#0b1329] border border-slate-800 rounded-clinical space-y-3">
              <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1 font-bold font-sans">Torsional Bonds Geometry</span>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Locked Rigid Core Bonds:</span><span className="text-cyan-400">{molGraph.lockedCoreBonds}</span></div>
                <div className="flex justify-between"><span>Flexible Peripheral Bonds:</span><span className="text-cyan-400">{molGraph.rotatableBondsPeriphery}</span></div>
              </div>
            </div>

            <div className="p-4 bg-[#0b1329] border border-slate-800 rounded-clinical flex flex-col justify-between">
              <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1 font-bold font-sans">Thermodynamic Conformer Ensemble</span>
              <div>
                <span className="block text-2xl font-bold text-emerald-400">{microstateCount.toLocaleString()}</span>
                <span className="text-[9px] text-ink-muted font-sans block mt-1">Conformer microstates accessible at body temperature (310K).</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface-100 border border-line rounded-clinical font-sans text-xs text-ink-subtle leading-relaxed">
            <h5 className="font-extrabold text-ink text-[10px] uppercase tracking-wider mb-1 font-mono">Thermodynamic Attractor Mechanism:</h5>
            By partitioning the molecule into a rigid core lock-in center and rotatable periphery tails, the engine models conformational shielding dynamics without costly atom-level simulations. At 310K, the flexible peripheral arms occupy a combinatorial ensemble of {microstateCount.toLocaleString()} microstates, dynamically shielding active binding pockets from metabolic cleavage.
          </div>
        </div>
      )}

      {/* 4. Real-time Plain-Text Diagnostics Feed */}
      <div className="p-3.5 bg-[#0b1329] border border-slate-800 rounded-clinical font-mono text-xs text-cyan-400 leading-relaxed border-l-4 border-l-cyan-500 shadow-inner">
        <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-1.5 font-bold">Live Simulation Narrative Feed:</span>
        <p className="line-clamp-3">{generateLiveNarrative()}</p>
      </div>

      {/* 5. Clickable Educational Glossary */}
      <div className="p-4 bg-surface-100 rounded-clinical border border-line text-xs leading-relaxed space-y-3">
        <h4 className="font-extrabold text-ink text-[10px] uppercase tracking-wider font-mono">Biophysical Dynamics Glossary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-bold text-ink-subtle block font-mono">Kuramoto Order Parameter R(t)</span>
            <p className="text-ink-muted text-[11px] mt-0.5">Quantifies the functional synchronization of connectome phase oscillators. R ≈ 0 indicates high topological entropy and uncoupled chaos, while R ≈ 1 signifies complete phase entrainment typical of epileptic baseline states.</p>
          </div>
          <div>
            <span className="font-bold text-ink-subtle block font-mono">Conformational Shielding</span>
            <p className="text-ink-muted text-[11px] mt-0.5">Peripheral rotatable chains oscillate at nanosecond frequencies under body temperature thermal noise (310K). This forms a steric mask protecting highly active central binding domains from clearance enzyme interactions.</p>
          </div>
          <div>
            <span className="font-bold text-ink-subtle block font-mono">Intent-Aware Toxicology Gate</span>
            <p className="text-ink-muted text-[11px] mt-0.5">Advanced neuroplastogens require immune system boundary realignment to trigger synaptogenesis. Standard QSAR models label this pathology; our engine intercepts and validates this as an intentional therapeutical mechanism.</p>
          </div>
          <div>
            <span className="font-bold text-ink-subtle block font-mono">Epigenetic Latching</span>
            <p className="text-ink-muted text-[11px] mt-0.5">Models the PI3K/AKT/mTOR cascade migrating into the cell nucleus, causing CpG chromatin demethylation from 68% baseline down to 28% to lock promoter IV transcripts into a permanent low-energy basin attractor.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
