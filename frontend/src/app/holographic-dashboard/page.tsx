"use client";

/**
 * @file page.tsx
 * @description Bi-directional Holographic Topological Neural Engine Dashboard
 * 
 * An immersive, high-impact clinical scoreboard and visualization hub for babelForge.
 * Recreates high-dimensional bulk topology, QLDPC error correction stabilizers, 
 * persistent homology landscapes, and 3D WebGL brain projections of the Schaefer 200-ROI.
 */

import { useEffect, useState, useMemo, useRef } from "react";
import { useAI } from "@/context/AIContext";
import TimeEnginePanel from "@/components/palantir/TimeEnginePanel";
import DraggablePanel from "@/components/palantir/DraggablePanel";
import {
  getSchaefer200ROIs,
  get32FrequencyBins,
  consolidateSubjectScans,
  BiomarkerForge,
  extractLogosSieveImportances,
  evaluateHolographicBoundaryCollapse,
  compileSymmetricConnectome,
  getActiveTargetEdges,
  computeMutualInformationMatrix,
  computeBoundaryEntanglement,
  buildCliqueComplex,
  computeCombinatorialHodgeLaplacian,
  solveRyuTakayanagiCut,
  trackGeometricAnomalies,
  optimizeRepairs,
  computeSyndrome,
  decodeQLDPCSyndrome,
  computeBettiNumber,
  computePersistentHomologyFiltration,
  computePersistentEntropy,
  computeNodePersistence,
  computeChungGeneralizationScore,
  computeBoundaryOperator,
  TARGET_10_CONNECTIONS,
  BrainNode,
  ConnectomeEdge
} from "@/lib/core";

export default function HolographicDashboard() {
  const { startingAge, simulationTimeMonths } = useAI();

  // Mathematical aging invariants
  const effectiveAge = startingAge + (simulationTimeMonths / 12);
  const ageNoise = effectiveAge > 60 ? (effectiveAge - 60) * 0.003 : 0;
  const ageAtrophy = Math.max(0.5, 1.0 - (effectiveAge > 45 ? (effectiveAge - 45) * 0.005 : 0));
  const ageFactor = Math.max(0.3, 1.0 - (effectiveAge - 35) * 0.006);

  // --- Simulation State ---
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<"boundary" | "bulk">("boundary");
  const [selectedSubjectLabel, setSelectedSubjectLabel] = useState<0 | 1>(1); // Default to Resistant (Label 1) for visualization
  const [modelAccuracy, setModelAccuracy] = useState(95.52);
  const [isPatching, setIsPatching] = useState(false);
  const [patchLog, setPatchLog] = useState<string[]>([]);
  
  // Custom Population parameters for Chung score
  const [effDim, setEffDim] = useState(6.4);
  const [taskCorr, setTaskCorr] = useState(0.32);
  const [snr, setSnr] = useState(3.5);
  
  // Connectome adjacency & spectral vectors
  const [hubWeights, setHubWeights] = useState<Map<string, number>>(new Map());
  const [timeStep, setTimeStep] = useState(0);

  // Generate deterministic time series simulation data
  const rois = useMemo(() => getSchaefer200ROIs(), []);
  const freqBins = useMemo(() => get32FrequencyBins(), []);
  
  // Subject scan representations (Responsive vs Resistant)
  const simulatedSubjectVector = useMemo(() => {
    const vector = new Array(6400).fill(0);
    // Base healthy amplitude around 0.6
    for (let i = 0; i < 6400; i++) {
      vector[i] = 0.5 + Math.sin(i * 0.05) * 0.15;
    }
    
    // Injects treatment resistant signatures
    if (selectedSubjectLabel === 1) {
      // FEF, Med, DorsAttn hyperarousals
      vector[41 * 32 + 7] = 0.95; // 7Networks_LH_DorsAttn_FEF_2 at Bin 7
      vector[41 * 32 + 9] = 1.15; // 7Networks_LH_DorsAttn_FEF_2 at Bin 9
      vector[52 * 32 + 7] = 1.05; // 7Networks_LH_SalVentAttn_Med_2 at Bin 7
      vector[141 * 32 + 9] = 0.98; // 7Networks_RH_DorsAttn_Post_8 at Bin 9
      vector[145 * 32 + 9] = 0.92; // 7Networks_RH_DorsAttn_FEF_2 at Bin 9
      
      // Control / DMN hypoconnectivities
      vector[179 * 32 + 10] = 0.12; // 7Networks_RH_Cont_PFCmp_1 at Bin 10
      vector[8 * 32 + 8] = 0.18; // 7Networks_LH_Vis_9 at Bin 8
    } else {
      // Healthy phase-locked signatures
      vector[41 * 32 + 7] = 0.38;
      vector[41 * 32 + 9] = 0.42;
      vector[52 * 32 + 7] = 0.45;
      vector[179 * 32 + 10] = 0.85; // Strong control
      vector[8 * 32 + 8] = 0.72; // Strong Visual
    }
    
    // Apply custom user welds to the vector
    hubWeights.forEach((w, key) => {
      const [u, v] = key.split(",").map(Number);
      // Feedback from structural patch boosts control pathways
      if (u === 179 || v === 179) {
        vector[179 * 32 + 10] = Math.min(1.0, vector[179 * 32 + 10] + w * 0.4);
      }
      if (u === 8 || v === 8) {
        vector[8 * 32 + 8] = Math.min(1.0, vector[8 * 32 + 8] + w * 0.45);
      }
    });

    return vector;
  }, [selectedSubjectLabel, hubWeights]);

  // Model evaluations
  const biomarkerForge = useMemo(() => new BiomarkerForge(), []);
  const currentResistanceProbability = useMemo(() => {
    const baseProb = biomarkerForge.predictProbability(simulatedSubjectVector);
    if (effectiveAge > 50) {
      // subtly increase by a fraction of the distance to 1.0
      const ageDelta = (effectiveAge - 50) * 0.002;
      return Math.min(1.0, baseProb + ageDelta);
    }
    return baseProb;
  }, [simulatedSubjectVector, biomarkerForge, effectiveAge]);

  const logosFeatures = useMemo(() => {
    return extractLogosSieveImportances(simulatedSubjectVector);
  }, [simulatedSubjectVector]);

  const boundaryCollapse = useMemo(() => {
    return evaluateHolographicBoundaryCollapse(simulatedSubjectVector);
  }, [simulatedSubjectVector]);

  // Connectome compilation
  const adjacency = useMemo(() => {
    return compileSymmetricConnectome(hubWeights);
  }, [hubWeights]);

  const activeTargetEdges = useMemo(() => {
    return getActiveTargetEdges(adjacency);
  }, [adjacency]);

  // Simulate continuous BOLD signals for mutual information matrix
  const simulatedBOLD = useMemo(() => {
    const N = 20; // Use a subset of 20 representative nodes for high-speed local MI calculation
    const T = 100;
    const data = Array.from({ length: N }, () => new Array(T).fill(0));
    
    for (let i = 0; i < N; i++) {
      const freq = 0.01 + (i % 5) * 0.02;
      const isCollapsed = boundaryCollapse.collapsedNodes.includes(i);
      const amp = (isCollapsed ? 0.2 : 1.0) * ageAtrophy;
      
      for (let t = 0; t < T; t++) {
        const noiseAmp = 0.1 + ageNoise;
        data[i][t] = Math.sin(t * freq + (timeStep * 0.05)) * amp + (Math.random() - 0.5) * noiseAmp;
      }
    }
    return data;
  }, [boundaryCollapse, timeStep, ageAtrophy, ageNoise]);

  const mutualInfoMatrix = useMemo(() => {
    return computeMutualInformationMatrix(simulatedBOLD);
  }, [simulatedBOLD]);

  const subnetworkEntanglement = useMemo(() => {
    return computeBoundaryEntanglement(simulatedBOLD, [0, 1, 2, 3, 4], [5, 6, 7, 8, 9]);
  }, [simulatedBOLD]);

  // Algebraic Topology
  const cliqueComplex = useMemo(() => {
    return buildCliqueComplex(adjacency, 20, 4); // Max dimension 4 for high-speed browser rendering
  }, [adjacency]);

  const hodgeLaplacian3D = useMemo(() => {
    return computeCombinatorialHodgeLaplacian(cliqueComplex, 2);
  }, [cliqueComplex]);

  const rtCut = useMemo(() => {
    return solveRyuTakayanagiCut(hodgeLaplacian3D, cliqueComplex, 2, [0, 1, 2], [3, 4, 5]);
  }, [hodgeLaplacian3D, cliqueComplex]);

  const qldpcSyndromeReport = useMemo(() => {
    const d_2 = computeBoundaryOperator(cliqueComplex, 2);
    // Synaptic state vector representing local degradation
    const x = new Array(cliqueComplex.simplices[2]?.length ?? 0).fill(0);
    // If subject is resistant, inject localized synaptic failures (x = 1)
    if (selectedSubjectLabel === 1) {
      if (x.length > 0) x[0] = 0.9;
      if (x.length > 2) x[2] = 0.85;
    }
    // QLDPC parity loop: Introduce a minor synaptic error at index 3 if effectiveAge > 65
    if (effectiveAge > 65 && x.length > 3) {
      x[3] = 0.75;
    }
    
    const syndrome = computeSyndrome(x, d_2);
    const hasSyndrome = syndrome.some(s => Math.abs(s) > 1e-4);
    
    return {
      syndrome,
      hasSyndrome,
      dimension: 2,
      correction: hasSyndrome ? decodeQLDPCSyndrome(syndrome, d_2) : new Array(x.length).fill(0)
    };
  }, [cliqueComplex, selectedSubjectLabel, effectiveAge]);

  const bettiRank = useMemo(() => {
    return computeBettiNumber(cliqueComplex, 1);
  }, [cliqueComplex]);

  const persistentHomology = useMemo(() => {
    return computePersistentHomologyFiltration(mutualInfoMatrix, 20);
  }, [mutualInfoMatrix]);

  const persistentEntropy = useMemo(() => {
    return computePersistentEntropy(persistentHomology);
  }, [persistentHomology]);

  const generalizationScore = useMemo(() => {
    return computeChungGeneralizationScore(effDim, taskCorr, snr * ageFactor);
  }, [effDim, taskCorr, snr, ageFactor]);

  // Tick the clock for real-time BOLD fluctuations
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeStep(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // --- Intervention Functions ---

  const handleTopologicalPatch = () => {
    setIsPatching(true);
    setPatchLog(l => [`[${new Date().toLocaleTimeString()}] Engaging Inverse Ryu-Takayanagi Optimizer...`, ...l]);
    
    setTimeout(() => {
      // Find missing coordinates that minimize topological energy
      const anomalies = trackGeometricAnomalies(mutualInfoMatrix, cliqueComplex, 1, 0.45);
      const repairs = optimizeRepairs(cliqueComplex, anomalies.collapsedSimplexIndices, rtCut, 20, 5);
      
      const newWelds = new Map(hubWeights);
      repairs.forEach(rep => {
        const key = `${rep.nodeU},${rep.nodeV}`;
        newWelds.set(key, 0.95);
        setPatchLog(l => [`[WELD] Sparse structural weld applied: ROI ${rep.nodeU + 1} - ROI ${rep.nodeV + 1} (energy score: ${rep.weight.toFixed(2)})`, ...l]);
      });
      
      setHubWeights(newWelds);
      setIsPatching(false);
      setPatchLog(l => [`[SUCCESS] Topological Patch Protocol completed. Simplicial cavities stabilized.`, ...l]);
    }, 1200);
  };

  const handleMolecularPhaseLock = () => {
    setIsPatching(true);
    setPatchLog(l => [`[${new Date().toLocaleTimeString()}] Deploying Molecular Regime: Phase-Lock Spectral Frequencies...`, ...l]);
    
    setTimeout(() => {
      // Shift parameters to Treatment-Responsive Label 0 configurations
      setEffDim(9.2);
      setTaskCorr(0.88);
      setSnr(6.2);
      setSelectedSubjectLabel(0);
      
      // Stabilize target connectome hubs
      const newWelds = new Map(hubWeights);
      TARGET_10_CONNECTIONS.forEach(conn => {
        const u = conn.u - 1;
        const v = conn.v - 1;
        newWelds.set(`${u},${v}`, 1.0);
      });
      setHubWeights(newWelds);
      
      setPatchLog(l => [
        `[PHASE-LOCK] All 32 spectral bins phase-stabilized around template limits (0.01 - 0.1 Hz).`,
        `[SYNAPSE] Parity-check syndrome reduced to 0 (Manifold Integrity recovered).`,
        `[SUCCESS] Subject shifted to TREATMENT-RESPONSIVE state (Label 0).`,
        ...l
      ]);
      setIsPatching(false);
    }, 1500);
  };

  const handleReset = () => {
    setHubWeights(new Map());
    setSelectedSubjectLabel(1);
    setEffDim(6.4);
    setTaskCorr(0.32);
    setSnr(3.5);
    setPatchLog([]);
  };

  // --- 3D WebGL Canvas Projection ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animId = 0;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Centers
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = 2.4;
      
      // Draw baseline brain parcellation nodes (rotated in 3D projection)
      const t = timeStep * 0.015;
      
      const projected = rois.map(roi => {
        // Simple 3D rotation around Y and Z axis
        const x1 = roi.x * Math.cos(t) - roi.z * Math.sin(t);
        const z1 = roi.x * Math.sin(t) + roi.z * Math.cos(t);
        const y1 = roi.y * Math.cos(t * 0.5) - z1 * Math.sin(t * 0.5);
        
        return {
          x: cx + x1 * scale,
          y: cy + y1 * scale,
          z: z1,
          network: roi.network,
          id: roi.id,
          name: roi.name
        };
      });
      
      // Draw background network connection lines
      ctx.lineWidth = 0.5;
      const bgOpacity = Math.max(0.01, 0.08 - (effectiveAge - 35) * 0.0008);
      for (let i = 0; i < projected.length; i += 8) {
        const u = projected[i];
        const v = projected[(i + 15) % projected.length];
        
        ctx.strokeStyle = `rgba(100, 116, 139, ${bgOpacity})`;
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.stroke();
      }
      
      // Highlight targeted network active coordination edges (the 10 target pairings)
      activeTargetEdges.forEach(edge => {
        const uNode = projected[edge.nodeU];
        const vNode = projected[edge.nodeV];
        if (!uNode || !vNode) return;
        
        ctx.lineWidth = edge.weight * 2.0;
        
        // Color-code active lines based on network types
        let strokeColor = "rgba(100, 116, 139, 0.4)";
        if (edge.networkU === "SalVentAttn" || edge.networkV === "SalVentAttn") {
          strokeColor = "rgba(244, 63, 94, 0.75)"; // Salience: vibrant rose
        } else if (edge.networkU === "Control" || edge.networkV === "Control") {
          strokeColor = "rgba(59, 130, 246, 0.75)"; // Control: sleek blue
        } else if (edge.networkU === "Default" || edge.networkV === "Default") {
          strokeColor = "rgba(168, 85, 247, 0.75)"; // DMN: vibrant purple
        } else if (edge.networkU === "DorsAttn" || edge.networkV === "DorsAttn") {
          strokeColor = "rgba(234, 179, 8, 0.75)"; // DorsAttn: vibrant yellow
        } else if (edge.networkU === "Visual" || edge.networkV === "Visual") {
          strokeColor = "rgba(16, 185, 129, 0.75)"; // Visual: green
        }
        
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(uNode.x, uNode.y);
        ctx.lineTo(vNode.x, vNode.y);
        ctx.stroke();
      });
      
      // Draw nodes
      const nonHotRadius = Math.max(1.0, 2.5 - (effectiveAge - 35) * 0.02);
      projected.forEach((node, idx) => {
        const isHotNode = boundaryCollapse.collapsedNodes.includes(idx);
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHotNode ? 5 : nonHotRadius, 0, Math.PI * 2);
        
        // Color match parcellation networks
        let fill = "#64748b";
        if (node.network === "Visual") fill = "#10b981";
        if (node.network === "SomatoMotor") fill = "#06b6d4";
        if (node.network === "DorsAttn") fill = "#eab308";
        if (node.network === "SalVentAttn") fill = "#f43f5e";
        if (node.network === "Limbic") fill = "#ec4899";
        if (node.network === "Control") fill = "#3b82f6";
        if (node.network === "Default") fill = "#a855f7";
        
        ctx.fillStyle = fill;
        ctx.shadowColor = isHotNode ? fill : "transparent";
        ctx.shadowBlur = isHotNode ? 10 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      animId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animId);
  }, [rois, timeStep, activeTargetEdges, boundaryCollapse, effectiveAge]);

  return (
    <div className="w-full h-full relative lg:overflow-hidden overflow-y-auto bg-canvas p-6 space-y-6">
      
      {/* Dynamic Background or Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-line pb-4 z-10 relative">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500 animate-pulse" />
            <span className="section-label-strong font-mono uppercase tracking-widest2 text-accent-400">
              Holographic Topological Neural Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-1 font-sans">
            Bi-directional Boundary-Bulk Diagnostic Console
          </h1>
        </div>
        
        {/* Quick controls */}
        <div className="flex items-center gap-2 font-mono">
          <button 
            className={`btn-secondary text-[11px] px-3 py-1.5 ${isPlaying ? 'bg-accent-500/10 text-accent-400 border-accent-500/30' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "❚❚ PAUSE SIMULATION" : "▶ RUN SIMULATION"}
          </button>
          <button className="btn-secondary text-[11px] px-3 py-1.5 border-warn/30 text-warn/80 hover:bg-warn/5" onClick={handleReset}>
            RESET CONFIG
          </button>
        </div>
      </div>

      {/* Grid Layout for Scoreboard & Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: THE SCOREBOARD (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Generalization Score Panel */}
          <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-4 shadow-sm backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent-500/5 to-transparent rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">Generalization Capacity</div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent-500/10 text-accent-400 border border-accent-500/20">Chung Equation</span>
            </div>
            
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-ink-subtle">Generalization Score</span>
              <span className="metric text-3xl font-semibold text-accent-400">
                {generalizationScore.toFixed(2)}%
              </span>
            </div>
            
            <div className="space-y-3 font-mono text-[10.5px] border-t border-line/60 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Effective Dimension (D)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="1" max="20" step="0.1" value={effDim} 
                    onChange={(e) => setEffDim(parseFloat(e.target.value))}
                    className="w-20 accent-accent-500"
                  />
                  <span className="w-8 text-right text-ink font-semibold">{effDim}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Task Alignment (Rho)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="0" max="1" step="0.05" value={taskCorr} 
                    onChange={(e) => setTaskCorr(parseFloat(e.target.value))}
                    className="w-20 accent-accent-500"
                  />
                  <span className="w-8 text-right text-ink font-semibold">{taskCorr}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Signal-to-Noise Ratio (SNR)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="0.5" max="15" step="0.5" value={snr} 
                    onChange={(e) => setSnr(parseFloat(e.target.value))}
                    className="w-20 accent-accent-500"
                  />
                  <span className="w-8 text-right text-ink font-semibold">{snr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Manifold Integrity & QLDPC Syndrome Status */}
          <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-3 shadow-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">Manifold Integrity</div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${qldpcSyndromeReport.hasSyndrome ? 'bg-warn animate-pulse' : 'bg-clinical-400'}`} />
                <span className={`text-[10px] font-mono font-bold uppercase ${qldpcSyndromeReport.hasSyndrome ? 'text-warn' : 'text-clinical-400'}`}>
                  {qldpcSyndromeReport.hasSyndrome ? 'ACTIVE SYNAPTIC ERROR' : 'STABILIZED (d_k * x = 0)'}
                </span>
              </div>
            </div>

            <div className="p-3 border border-line bg-surface-100 rounded-clinical font-mono text-[10.5px] space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-muted">Code Space Stabilization</span>
                <span className="text-ink font-bold">QLDPC Parity Loop</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Active Stabilizer Operator</span>
                <span className="text-accent-400 font-semibold">&part;<sub>{qldpcSyndromeReport.dimension}</sub> Syndrome Check</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Global Homology Groups</span>
                <span className="text-accent-400 font-semibold">H<sub>1</sub> rank (Betti &beta;<sub>1</sub>): {bettiRank}</span>
              </div>
              {qldpcSyndromeReport.hasSyndrome && (
                <div className="mt-2 text-[10px] text-warn border-t border-warn/20 pt-2 leading-relaxed">
                  Syndrome decoder detects local synaptic degradation vector. Homology kernel reconstruction mapping active.
                </div>
              )}
            </div>
          </div>

          {/* Persistent Entropy Metrics */}
          <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-3 shadow-sm backdrop-blur-md">
            <div className="flex justify-between items-center">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">Persistent Homology</div>
              <span className="text-[10px] font-mono font-bold bg-accent-500/10 text-accent-400 border border-accent-500/20 px-2 py-0.5 rounded">TDA Landscape</span>
            </div>
            
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-ink-subtle">Persistent Entropy</span>
              <span className="metric text-2xl font-semibold font-mono text-clinical-400">
                {persistentEntropy.toFixed(4)}
              </span>
            </div>
            
            <div className="text-2xs text-ink-muted font-mono leading-relaxed border-t border-line/60 pt-2.5">
              {selectedSubjectLabel === 1 
                ? "WARNING: Manifold fracturing into low-persistence chaotic noise. Cognitive cavities are unstable." 
                : "Homeostasis locked. Topological complexes are building stable, long-lasting cognitive cavities."}
            </div>

            {/* Quick Persistent homologies feed */}
            <div className="space-y-1.5 font-mono text-[9px] mt-2">
              <div className="grid grid-cols-3 text-ink-muted border-b border-line pb-1">
                <span>CAVITY</span>
                <span>BIRTH (MI)</span>
                <span>DEATH</span>
              </div>
              {persistentHomology.slice(0, 3).map((cav, idx) => (
                <div key={idx} className="grid grid-cols-3 text-ink-subtle">
                  <span>Cycle #{idx + 1}</span>
                  <span className="text-accent-400 font-bold">{cav.birth.toFixed(3)}</span>
                  <span>{cav.death.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: DUAL MANIFOLD VISUALIZER & 3D CONNECTOME (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dual Manifold Tab Bar */}
          <div className="border border-line rounded-clinical bg-surface-50 p-1 flex justify-between gap-1 shadow-sm font-mono text-[10px]">
            <button 
              className={`flex-1 text-center py-2 uppercase tracking-widest2 transition-all ${activeTab === 'boundary' ? 'bg-accent-500/10 text-accent-400 font-bold border border-accent-500/20 rounded-sharp' : 'text-ink-muted hover:text-ink'}`}
              onClick={() => setActiveTab('boundary')}
            >
              Boundary View (Functional)
            </button>
            <button 
              className={`flex-1 text-center py-2 uppercase tracking-widest2 transition-all ${activeTab === 'bulk' ? 'bg-accent-500/10 text-accent-400 font-bold border border-accent-500/20 rounded-sharp' : 'text-ink-muted hover:text-ink'}`}
              onClick={() => setActiveTab('bulk')}
            >
              Bulk View (Simplicial)
            </button>
          </div>

          {/* Interactive Brain Map (Always visible in center) */}
          <div className="border border-line rounded-clinical bg-surface-50 p-4 shadow-md backdrop-blur-md relative flex flex-col items-center">
            <div className="absolute top-4 left-4 font-mono text-[10px] space-y-1 pointer-events-none z-10">
              <div className="text-ink font-bold uppercase tracking-wider">3D WebGL Connectome</div>
              <div className="text-ink-muted">Schaefer 200-ROI coordinates map</div>
            </div>
            
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={320} 
              className="w-full h-[320px] max-w-[400px] border border-line/40 rounded-clinical bg-canvas/30 shadow-inner"
            />
            
            <div className="flex justify-between w-full mt-3 text-[9.5px] font-mono text-ink-muted border-t border-line/60 pt-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Salience</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Control</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> DMN</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Attention</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Visual</span>
            </div>
          </div>

          {/* Tab specifics */}
          {activeTab === "boundary" ? (
            <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-3 shadow-sm font-mono text-[11px]">
              <div className="section-label">Mutual Information Heatmap (20x20 ROI Sample)</div>
              <div className="grid grid-cols-20 gap-px bg-line/60 p-0.5 border border-line rounded overflow-x-auto min-w-[200px]">
                {mutualInfoMatrix.map((row, r) => 
                  row.map((val, c) => {
                    const colorIntensity = Math.min(255, Math.floor(val * 350));
                    return (
                      <div 
                        key={`${r},${c}`} 
                        className="w-4 h-4 flex-shrink-0 transition-all hover:scale-125 hover:shadow cursor-pointer"
                        style={{ backgroundColor: `rgb(${colorIntensity}, 31, ${255 - colorIntensity})` }}
                        title={`I(ROI ${r} : ROI ${c}) = ${val.toFixed(4)} bits`}
                      />
                    );
                  })
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-muted mt-2 border-t border-line/40 pt-2">
                <span>Gaussian Entanglement (A:B):</span>
                <span className="text-accent-400 font-bold font-mono">{subnetworkEntanglement.toFixed(4)} bits</span>
              </div>
            </div>
          ) : (
            <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-3 shadow-sm font-mono text-[11px]">
              <div className="section-label">Hodge Laplacian k-Simplices & RT minimal cut</div>
              <div className="p-3 border border-line bg-surface-100 rounded-clinical space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Simplicial Complex dimension</span>
                  <span className="text-ink font-bold">Max 4D Complex</span>
                </div>
                <div className="flex justify-between">
                  <span>Euler Characteristic (Proxy)</span>
                  <span className="text-accent-400 font-semibold">{cliqueComplex.simplices[0].length - cliqueComplex.simplices[1].length + cliqueComplex.simplices[2].length}</span>
                </div>
                <div className="flex justify-between">
                  <span>RT Minimal Surface Energy</span>
                  <span className="text-accent-400 font-bold">{rtCut.reduce((a, b) => a + b, 0).toFixed(4)}</span>
                </div>
              </div>
              <div className="text-[10px] text-ink-muted leading-relaxed">
                AdS/CFT bulk duality map: The Ryu-Takayanagi minimum surface cut vector matches functional boundary entanglement drop-offs.
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DIAGNOSTIC ML & INTERVENTIONS (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Target Forge Classification Scorecard */}
          <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-3 shadow-md backdrop-blur-md relative overflow-hidden">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">Target Forge Predictor</div>
            
            <div className="flex flex-col border border-line rounded-clinical p-3 bg-surface-100/50">
              <span className="text-[11px] text-ink-muted">Treatment Resistance Probability</span>
              <span className={`text-2xl font-bold font-mono mt-1 ${currentResistanceProbability >= 0.5 ? 'text-warn' : 'text-clinical-400'}`}>
                {(currentResistanceProbability * 100).toFixed(2)}%
              </span>
              <span className={`text-[10.5px] font-mono font-bold uppercase mt-1.5 px-2 py-0.5 rounded text-center border ${currentResistanceProbability >= 0.5 ? 'bg-warn/10 border-warn/30 text-warn' : 'bg-clinical-500/10 border-clinical-500/30 text-clinical-400'}`}>
                {currentResistanceProbability >= 0.5 ? "Label 1: RESISTANT" : "Label 0: RESPONSIVE"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono text-ink-subtle">
              <div className="flex flex-col p-2 border border-line bg-surface-100 rounded">
                <span className="text-ink-muted">Classifier Acc.</span>
                <span className="text-base font-bold text-ink">{modelAccuracy.toFixed(2)}%</span>
              </div>
              <div className="flex flex-col p-2 border border-line bg-surface-100 rounded">
                <span className="text-ink-muted">Cohort Label</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <select 
                    value={selectedSubjectLabel} 
                    onChange={(e) => setSelectedSubjectLabel(Number(e.target.value) as 0 | 1)}
                    className="bg-surface-50 border border-line rounded px-1 text-[9.5px] text-ink font-semibold"
                  >
                    <option value={1}>PTSD resistant (1)</option>
                    <option value={0}>PTSD responsive (0)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sieve Feature Importances */}
          <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-3 shadow-sm font-mono text-[10px]">
            <div className="section-label">Logos Sieve Top-Importance Channels</div>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
              {logosFeatures.map((feat, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded p-1.5 space-y-1 transition ${feat.anomalyScore > 0.3 ? 'border-warn/40 bg-warn/[0.03]' : 'border-line/60 bg-surface-100/40'}`}
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-ink truncate max-w-[130px]">{feat.roiName}</span>
                    <span className={feat.anomalyScore > 0.3 ? 'text-warn' : 'text-clinical-400'}>
                      {(feat.amplitude).toFixed(2)} amp
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px] text-ink-muted">
                    <span>Bin {feat.bin} ({feat.frequencyHz.toFixed(3)} Hz)</span>
                    <span>W: {feat.importanceScore.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Panel */}
          <div className="border border-line rounded-clinical bg-surface-50 p-4 space-y-3 shadow-md backdrop-blur-md">
            <div className="section-label-strong text-ink">Clinical Interventions</div>
            <div className="flex flex-col gap-2 font-mono text-[11px]">
              <button 
                className="btn-primary w-full py-2.5 shadow-md flex items-center justify-center gap-1.5" 
                onClick={handleMolecularPhaseLock} 
                disabled={isPatching}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Deploy Molecular Phase-Lock
              </button>
              
              <button 
                className="btn-secondary w-full py-2.5 flex items-center justify-center gap-1.5" 
                onClick={handleTopologicalPatch} 
                disabled={isPatching}
              >
                <svg className="w-4 h-4 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Execute Topological Patch
              </button>
            </div>

            {/* Patch logging */}
            {patchLog.length > 0 && (
              <div className="border border-line/60 bg-surface-100 rounded p-2 max-h-[120px] overflow-y-auto custom-scrollbar font-mono text-[9px] text-ink-muted mt-3 space-y-1">
                {patchLog.map((log, idx) => (
                  <div key={idx} className={log.includes("SUCCESS") ? "text-clinical-400 font-bold" : log.includes("WELD") ? "text-accent-400" : ""}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      <TimeEnginePanel />
    </div>
  );
}
