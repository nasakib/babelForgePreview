"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  integrateRetrovirus,
  findLoops,
  calculateLoopEntropy,
  calculateMutagenesisRisk,
  stepConformationalKinetics,
  generateTopologicalEmbedding,
  logSimulationRun,
  type BioNode,
  type BioEdge,
  type BioTopology,
  type RetroviralSimParams,
  type ConformationalSimParams,
  type EnvironmentState,
  type SimulationRun
} from "@/lib/engines/biology";
import { mulberry32 } from "@/lib/engine/rng";

export default function BioMonitorPage() {
  // ---------------------------------------------------------------------------
  // 1. Simulation States
  // ---------------------------------------------------------------------------
  const [viralParams, setViralParams] = useState<RetroviralSimParams>({
    dosage: 2.0,
    mutationRate: 0.15,
    clearanceVelocity: 0.2,
    insertionBias: "random"
  });

  const [conformationalParams, setConformationalParams] = useState<ConformationalSimParams>({
    affinity: 2.0,
    pHThreshold: 6.5,
    baselineDensity: 0.25,
    couplingMultiplier: 4.0
  });

  const [environment, setEnvironment] = useState<EnvironmentState>({
    pH: 7.2,
    cliqueDensity: 0.2,
    temperature: 37.0
  });

  // ---------------------------------------------------------------------------
  // 2. Generate Base Topology (deterministic seed)
  // ---------------------------------------------------------------------------
  const baseTopology = useMemo<BioTopology>(() => {
    const SEED = 8822;
    const rng = mulberry32(SEED);
    const numNodes = 75; // Sized for optimized client-side layout & loop traversal
    const nodes: BioNode[] = [];
    const edges: BioEdge[] = [];

    const a = 40, b = 30, c = 45; // Ellipsoidal layout bounds
    
    for (let i = 0; i < numNodes; i++) {
      let x = 0, y = 0, z = 0;
      while (true) {
        x = (rng() - 0.5) * 2 * a;
        y = (rng() - 0.5) * 2 * b;
        z = (rng() - 0.5) * 2 * c;
        if ((x/a)**2 + (y/b)**2 + (z/c)**2 <= 1.0) break;
      }

      const layer = Math.sqrt(x*x + y*y + z*z) < 18 ? "Deep" : (Math.sqrt(x*x + y*y + z*z) < 28 ? "Subcortical" : "Cortical");
      const regions = ["Default", "Control", "Limbic", "Visual", "SomatoMotor", "VentAttn"];
      const region = regions[Math.floor(rng() * regions.length)];

      nodes.push({
        id: i,
        name: `Host_Cell_${i}`,
        type: "host",
        x: +x.toFixed(2),
        y: +y.toFixed(2),
        z: +z.toFixed(2),
        region,
        layer,
        conformation: "A",
        localPH: 7.2,
        mutationScore: 0.0
      });
    }

    // Connect KNN backbone (K=2)
    for (let i = 0; i < numNodes; i++) {
      const distances = nodes
        .map((n, j) => ({
          j,
          d: (n.x - nodes[i].x)**2 + (n.y - nodes[i].y)**2 + (n.z - nodes[i].z)**2
        }))
        .filter(e => e.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2);

      distances.forEach(({ j }) => {
        // Ensure no duplicate connections
        const exists = edges.some(e => (e.source === i && e.target === j) || (e.source === j && e.target === i));
        if (!exists) {
          edges.push({
            source: i,
            target: j,
            weight: 1.0,
            type: "structural"
          });
        }
      });
    }

    const adjacency = new Float32Array(numNodes * numNodes);
    edges.forEach(e => {
      adjacency[e.source * numNodes + e.target] = 1.0;
      adjacency[e.target * numNodes + e.source] = 1.0;
    });

    return { nodes, edges, adjacency, N: numNodes };
  }, []);

  // Compute baseline loops once
  const baselineLoops = useMemo(() => {
    return findLoops(baseTopology.nodes, baseTopology.edges, 4);
  }, [baseTopology]);

  // ---------------------------------------------------------------------------
  // 3. Compute Real-time Active Biology State
  // ---------------------------------------------------------------------------
  const activeTopology = useMemo<BioTopology>(() => {
    // 1. Retro-viral insertion deforming structure
    const { nodes, edges } = integrateRetrovirus(
      baseTopology.nodes,
      baseTopology.edges,
      viralParams,
      1212
    );

    // 2. Local environment phase shift
    const baseTopo: BioTopology = {
      nodes,
      edges,
      adjacency: new Float32Array(nodes.length * nodes.length),
      N: nodes.length
    };

    return stepConformationalKinetics(baseTopo, environment, conformationalParams);
  }, [baseTopology, viralParams, environment, conformationalParams]);

  // Metrics calculations (throttled/cached via useMemo)
  const stats = useMemo(() => {
    const N = activeTopology.N;
    const currentLoops = findLoops(activeTopology.nodes, activeTopology.edges, 4);
    const loopEntropy = calculateLoopEntropy(activeTopology.nodes, currentLoops);
    const mutagenesisRisk = calculateMutagenesisRisk(currentLoops, baselineLoops.length, loopEntropy);

    const bCount = activeTopology.nodes.filter(n => n.conformation === "B").length;
    const stateBPercentage = N > 0 ? +((bCount / N) * 100).toFixed(1) : 0;

    const graphDensity = N > 0 ? +((activeTopology.edges.length / (N * (N - 1) / 2)) * 100).toFixed(2) : 0;
    
    let sumWeight = 0;
    activeTopology.edges.forEach(e => sumWeight += e.weight);
    const averageWeight = activeTopology.edges.length > 0 ? +(sumWeight / activeTopology.edges.length).toFixed(2) : 1.0;

    // Coherence R(t) phase lock approximation
    const coherence = +(Math.sin(stateBPercentage * 0.01 * Math.PI / 2) * 0.4 + 0.5 + (1.0 - mutagenesisRisk / 200.0) * 0.1).toFixed(3);

    return {
      activeLoopsCount: currentLoops.length,
      loopEntropy,
      mutagenesisRisk,
      stateBPercentage,
      graphDensity,
      averageWeight,
      coherence
    };
  }, [activeTopology, baselineLoops]);

  // ---------------------------------------------------------------------------
  // 4. 3D SVG Orthographic Interactive Renderer States
  // ---------------------------------------------------------------------------
  const [rotX, setRotX] = useState<number>(0.4); // rotation in radians
  const [rotY, setRotY] = useState<number>(-0.6);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  // Auto-rotate tick
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setRotY(r => r + 0.004);
    }, 16);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Drag handlers for manual rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setAutoRotate(false);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotY(r => r + dx * 0.007);
    setRotX(r => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, r + dy * 0.007)));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    dragStart.current = null;
  };

  // Perform 3D Rotations and Orthographic Projection
  const projectedNodes = useMemo(() => {
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    const cy = Math.cos(rotY), sy = Math.sin(rotY);

    return activeTopology.nodes.map(n => {
      // 1. Rotate Y axis (longitude)
      let x1 = n.x * cy - n.z * sy;
      let z1 = n.x * sy + n.z * cy;

      // 2. Rotate X axis (latitude)
      let y2 = n.y * cx - z1 * sx;
      let z2 = n.y * sx + z1 * cx;

      // Apply perspective scale based on z2 depth
      const depthScale = (z2 + 80) / 160.0; // 0..1 range
      const scale = 0.75 + depthScale * 0.5;

      return {
        ...n,
        projX: x1 * 4.5 + 300, // Projected viewport coordinates
        projY: y2 * 4.5 + 240,
        scale,
        depth: z2
      };
    }).sort((a, b) => a.depth - b.depth); // Sort by depth for correct 3D overlapping
  }, [activeTopology.nodes, rotX, rotY]);

  // ---------------------------------------------------------------------------
  // 5. Simulation Run Vault logging implementation
  // ---------------------------------------------------------------------------
  const [vaultRuns, setVaultRuns] = useState<SimulationRun[]>([]);
  const [committing, setCommitting] = useState<boolean>(false);
  const [latestReceipt, setLatestReceipt] = useState<SimulationRun | null>(null);

  const commitSimulation = async () => {
    setCommitting(true);
    try {
      const vector = generateTopologicalEmbedding(activeTopology, stats, environment);
      
      const record = await logSimulationRun(
        viralParams,
        conformationalParams,
        environment,
        {
          loopEntropy: stats.loopEntropy,
          mutagenesisRisk: stats.mutagenesisRisk,
          stateBPercentage: stats.stateBPercentage,
          graphDensity: stats.graphDensity,
          averageWeight: stats.averageWeight,
          coherence: stats.coherence
        },
        vector
      );

      setVaultRuns(prev => [record, ...prev]);
      setLatestReceipt(record);
    } catch (err) {
      console.error("Error committing simulation:", err);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden xl:h-[calc(100vh-3rem)] bg-canvas">
      
      {/* 1. LEFT SIDEBAR: Simulation parameters */}
      <aside className="w-full xl:w-[350px] shrink-0 border-b xl:border-b-0 xl:border-r border-line bg-surface-0/60 backdrop-blur flex flex-col overflow-y-auto custom-scrollbar">
        <div className="clinical-card-header flex items-center justify-between border-b border-line p-4">
          <div className="flex flex-col">
            <span className="section-label-strong text-accent-400">BIOLOGICAL ST-GNN</span>
            <span className="text-[9px] font-mono text-ink-muted mt-0.5">LENTIVIRAL & CONFORMATIONAL KINETICS</span>
          </div>
        </div>

        {/* Retroviral Params Card */}
        <div className="p-4 border-b border-line space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot crit shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-ink">Retroviral Vector Parameters</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">Viral Dosage</span>
                <span className="text-crit font-bold">{viralParams.dosage.toFixed(1)} MOI</span>
              </div>
              <input
                type="range" min="0" max="6" step="0.5"
                value={viralParams.dosage}
                onChange={e => setViralParams(prev => ({ ...prev, dosage: parseFloat(e.target.value) }))}
                className="w-full accent-red-500"
              />
              <span className="text-[9px] text-ink-muted leading-tight block mt-0.5">Determines the number of active node-splitting and insertion operations.</span>
            </div>

            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">Insertional Mutation Rate</span>
                <span className="text-crit font-bold">{(viralParams.mutationRate * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0.05" max="0.6" step="0.05"
                value={viralParams.mutationRate}
                onChange={e => setViralParams(prev => ({ ...prev, mutationRate: parseFloat(e.target.value) }))}
                className="w-full accent-red-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">Cellular Clearance Velocity</span>
                <span className="text-ok font-bold">{(viralParams.clearanceVelocity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range" min="0" max="0.8" step="0.05"
                value={viralParams.clearanceVelocity}
                onChange={e => setViralParams(prev => ({ ...prev, clearanceVelocity: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <span className="text-2xs font-mono text-ink-muted block mb-1">Insertion Preference Bias</span>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[9px]">
                {(["random", "hubness", "deep_layers"] as const).map(bias => (
                  <button
                    key={bias}
                    onClick={() => setViralParams(prev => ({ ...prev, insertionBias: bias }))}
                    className={`py-1.5 rounded-sm border uppercase text-center transition-all ${
                      viralParams.insertionBias === bias
                        ? "border-crit/80 bg-crit/15 text-red-200"
                        : "border-line bg-surface-50 text-ink-muted hover:border-line-strong"
                    }`}
                  >
                    {bias.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Factors Card */}
        <div className="p-4 border-b border-line space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot ok shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-ink">Microenvironmental Factors</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">Extracellular pH Level</span>
                <span className={`font-bold ${environment.pH < conformationalParams.pHThreshold ? "text-warn" : "text-ok"}`}>
                  pH {environment.pH.toFixed(1)}
                </span>
              </div>
              <input
                type="range" min="5.0" max="8.2" step="0.1"
                value={environment.pH}
                onChange={e => setEnvironment(prev => ({ ...prev, pH: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[9px] text-ink-muted leading-tight block mt-0.5">Acidic shifts below pH {conformationalParams.pHThreshold.toFixed(1)} trigger conformational gate states.</span>
            </div>

            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">Target Clique Density</span>
                <span className="text-cyan-400 font-bold">{environment.cliqueDensity.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.05" max="0.45" step="0.02"
                value={environment.cliqueDensity}
                onChange={e => setEnvironment(prev => ({ ...prev, cliqueDensity: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">Target Cluster Temperature</span>
                <span className="text-ink font-bold">{environment.temperature.toFixed(1)} °C</span>
              </div>
              <input
                type="range" min="35.0" max="41.0" step="0.2"
                value={environment.temperature}
                onChange={e => setEnvironment(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Conformational Settings */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot info shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-ink">Conformational Logic Specs</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">Binding Hook Affinity</span>
                <span className="text-accent-400 font-bold">Kd {conformationalParams.affinity.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.5" max="4.0" step="0.1"
                value={conformationalParams.affinity}
                onChange={e => setConformationalParams(prev => ({ ...prev, affinity: parseFloat(e.target.value) }))}
                className="w-full accent-accent-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-2xs font-mono mb-1">
                <span className="text-ink-muted">State B Coupling Multiplier</span>
                <span className="text-accent-400 font-bold">{conformationalParams.couplingMultiplier.toFixed(1)}x weight</span>
              </div>
              <input
                type="range" min="1.5" max="8.0" step="0.5"
                value={conformationalParams.couplingMultiplier}
                onChange={e => setConformationalParams(prev => ({ ...prev, couplingMultiplier: parseFloat(e.target.value) }))}
                className="w-full accent-accent-500"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CENTER: 3D auto-rotating graph canvas */}
      <main className="flex-1 relative min-h-[450px] bg-void flex flex-col justify-between">
        {/* Header HUD overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
            <span className="text-[9px] uppercase tracking-widest font-mono text-cyan-400">BIOLOGICAL MONITOR v39</span>
          </div>
          <h1 className="text-base font-bold text-ink drop-shadow-md mt-1">
            Cellular Connectome Topography & Kinetics
          </h1>
        </div>

        {/* 3D SVG Network Viewport */}
        <div 
          className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.6)_0%,rgba(2,6,23,0.95)_100%)] pointer-events-none" />
          <div className="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none" />

          {/* Interactive SVG Canvas */}
          <svg 
            viewBox="0 0 600 480"
            className="w-full max-w-[640px] h-auto drop-shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-shadow duration-300"
          >
            {/* Draw active structural and viral edges */}
            {activeTopology.edges.map((e, idx) => {
              const src = projectedNodes.find(n => n.id === e.source);
              const dest = projectedNodes.find(n => n.id === e.target);
              if (!src || !dest) return null;

              // Base edge styling
              let color = "rgba(44, 53, 72, 0.4)";
              let strokeWidth = 0.5 + e.weight * 0.25;
              let isGlow = false;

              if (e.type === "viral_insertion") {
                color = "rgba(16, 185, 129, 0.75)";
                strokeWidth = 1.8;
                isGlow = true;
              } else if (e.weight > 2.5) {
                color = "rgba(168, 85, 247, 0.8)";
                strokeWidth = 2.4;
                isGlow = true;
              }

              return (
                <g key={`edge-${idx}`}>
                  {isGlow && (
                    <line
                      x1={src.projX} y1={src.projY}
                      x2={dest.projX} y2={dest.projY}
                      stroke={color}
                      strokeWidth={strokeWidth * 3.5}
                      strokeOpacity={0.15}
                      strokeLinecap="round"
                    />
                  )}
                  <line
                    x1={src.projX} y1={src.projY}
                    x2={dest.projX} y2={dest.projY}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeOpacity={0.65}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* Draw nodes with layered coordinate depth ordering */}
            {projectedNodes.map(n => {
              let fill = "#cbd5e1"; // Base host node
              let stroke = "#475569";
              let size = 4 * n.scale;
              let isGlow = false;
              let glowColor = "rgba(255,255,255,0.8)";

              if (n.type === "viral_vector") {
                fill = "#10b981"; // Vibrant Emerald green
                stroke = "#059669";
                size = 5.5 * n.scale;
                isGlow = true;
                glowColor = "rgba(16, 185, 129, 0.8)";
              } else if (n.type === "mutated_site") {
                fill = "#ef4444"; // Vibrant red
                stroke = "#dc2626";
                size = 5.0 * n.scale;
                isGlow = true;
                glowColor = "rgba(239, 68, 68, 0.7)";
              } else if (n.conformation === "B") {
                fill = "#a855f7"; // Glowing bright purple
                stroke = "#7c3aed";
                size = 6.0 * n.scale;
                isGlow = true;
                glowColor = "rgba(168, 85, 247, 0.95)";
              }

              return (
                <g key={`node-${n.id}`}>
                  {isGlow && (
                    <circle
                      cx={n.projX} cy={n.projY}
                      r={size * 2.2}
                      fill={glowColor}
                      opacity={0.25}
                      className="animate-pulse"
                    />
                  )}
                  {n.conformation === "B" && (
                    <circle
                      cx={n.projX} cy={n.projY}
                      r={size * 3.8}
                      fill="none"
                      stroke={glowColor}
                      strokeWidth={0.8}
                      opacity={0.3}
                      strokeDasharray="1 3"
                    />
                  )}
                  <circle
                    cx={n.projX} cy={n.projY}
                    r={size}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={0.75}
                  />
                </g>
              );
            })}
          </svg>

          {/* Screen controls HUD */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-auto flex items-center gap-2 bg-slate-900/60 p-2 rounded backdrop-blur border border-slate-800">
            <button 
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-mono transition-colors rounded ${
                autoRotate ? "bg-accent-500/20 text-accent-400 border border-accent-500/30" : "bg-slate-800 text-ink-muted border border-slate-700"
              }`}
            >
              {autoRotate ? "Auto-Rotate ON" : "Auto-Rotate PAUSED"}
            </button>
            <button 
              onClick={() => { setRotX(0.4); setRotY(-0.6); }}
              className="px-2.5 py-1 text-[9px] uppercase tracking-widest font-mono bg-slate-800 hover:bg-slate-700 text-ink rounded border border-slate-700 transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Simulation database commit vault section (Interactive panel) */}
        <section className="w-full p-4 border-t border-line bg-surface-0/60 backdrop-blur z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-accent-400 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                SIMULATION DATA LAKE GATEWAY
              </h2>
              <p className="text-[10px] text-ink-muted mt-0.5 leading-relaxed max-w-xl">
                Commit simulated connectome state vectors directly into the decentralized cloud. Logs high-dimensional 128-D topological embedding maps in Pinecone and catalogs parameters in Firestore.
              </p>
            </div>
            
            <button
              onClick={commitSimulation}
              disabled={committing}
              className={`shrink-0 px-5 py-2.5 rounded-clinical text-xs font-mono uppercase font-bold tracking-widest shadow-lg flex items-center gap-2.5 border transition-all ${
                committing
                  ? "bg-accent-900/10 border-accent-500/20 text-accent-400 cursor-not-allowed"
                  : "bg-accent-600 border-accent-400 hover:bg-accent-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.45)] hover:shadow-[0_0_20px_rgba(147,51,234,0.6)]"
              }`}
            >
              {committing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-accent-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  COMMITTING MATRIX...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                  COMMIT SIMULATION TO DATA LAKE
                </>
              )}
            </button>
          </div>

          {/* Latest API Receipt */}
          {latestReceipt && (
            <div className="mt-3 p-3 bg-void/70 border border-accent-500/30 rounded-clinical animate-fade-in-up font-mono text-[9px] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-accent-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                  GCP Firestore Registry Telemetry
                </div>
                <div className="text-ink-subtle mt-1.5 space-y-1">
                  <div><span className="text-ink-muted">Transaction ID:</span> {latestReceipt.id}</div>
                  <div><span className="text-ink-muted">Collection Target:</span> `/simulations/{latestReceipt.firestoreDocId}`</div>
                  <div><span className="text-ink-muted">Clearance Coherence:</span> {latestReceipt.metrics.coherence}</div>
                </div>
              </div>
              <div>
                <div className="text-purple-400 font-bold uppercase tracking-widest">
                  Pinecone Vector DB Embedding Telemetry
                </div>
                <div className="text-ink-subtle mt-1.5 space-y-1">
                  <div><span className="text-ink-muted">Vector ID:</span> {latestReceipt.pineconeVectorId}</div>
                  <div><span className="text-ink-muted">Dimensions:</span> 128 FLOATS [Dense Coordinate Barycenters]</div>
                  <div className="truncate text-purple-300">
                    <span className="text-ink-muted">Embedding Snapshot:</span> 
                    {` [${generateTopologicalEmbedding(activeTopology, stats, environment).slice(0, 4).map(v => v.toFixed(4)).join(", ")} ... ${generateTopologicalEmbedding(activeTopology, stats, environment).slice(-2).map(v => v.toFixed(4)).join(", ")}]`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Past simulation run log table */}
          {vaultRuns.length > 0 && (
            <div className="mt-3 overflow-x-auto border border-line rounded-clinical bg-surface-50">
              <table className="w-full text-left font-mono text-[9px] border-collapse">
                <thead>
                  <tr className="bg-surface-100 border-b border-line text-ink-muted font-bold uppercase tracking-widest">
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">Simulation Run ID</th>
                    <th className="p-2">Viral dosage</th>
                    <th className="p-2">Environment pH</th>
                    <th className="p-2">mutagenesis risk</th>
                    <th className="p-2">Conform. State B</th>
                    <th className="p-2">Pinecone ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink-subtle">
                  {vaultRuns.slice(0, 4).map((run, i) => (
                    <tr key={i} className="hover:bg-surface-0 transition-colors">
                      <td className="p-2 truncate max-w-[120px]">{run.timestamp.replace("T", " ").substring(0, 19)}</td>
                      <td className="p-2 font-bold text-ink">{run.id}</td>
                      <td className="p-2 text-crit font-bold">{run.parameters.viral.dosage.toFixed(1)} MOI</td>
                      <td className="p-2 text-cyan-400 font-bold">pH {run.parameters.environment.pH.toFixed(1)}</td>
                      <td className="p-2 font-bold text-red-400">{run.metrics.mutagenesisRisk.toFixed(1)}%</td>
                      <td className="p-2 text-purple-400 font-bold">{run.metrics.stateBPercentage.toFixed(1)}%</td>
                      <td className="p-2 text-ink-muted">{run.pineconeVectorId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* 3. RIGHT SIDEBAR: S-T Graph Neural Network Stats & Telemetry */}
      <aside className="w-full xl:w-[320px] shrink-0 border-t xl:border-t-0 xl:border-l border-line bg-surface-0/60 backdrop-blur flex flex-col overflow-y-auto custom-scrollbar">
        <div className="clinical-card-header border-b border-line p-4">
          <span className="section-label-strong text-accent-400">TELEMETRY & HUD</span>
        </div>

        {/* ST-GNN Stats */}
        <div className="p-4 border-b border-line space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-widest font-mono text-ink flex justify-between">
            <span>S-T GNN Metrics</span>
            <span className="text-accent-400">active state</span>
          </div>

          <div className="space-y-3 font-mono">
            <div className="p-3 border border-line bg-surface-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-ink-muted">TOTAL ACTIVE NODES</span>
                <span className="text-[10px] text-ink-subtle">Host + Viral Vectors</span>
              </div>
              <span className="metric text-base text-ink font-bold">{activeTopology.N}</span>
            </div>

            <div className="p-3 border border-line bg-surface-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-ink-muted">TOTAL CONNECTIONS</span>
                <span className="text-[10px] text-ink-subtle">Edges</span>
              </div>
              <span className="metric text-base text-ink font-bold">{activeTopology.edges.length}</span>
            </div>

            <div className="p-3 border border-line bg-surface-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-ink-muted">LOOP GRAPH ENTROPY</span>
                <span className="text-[10px] text-ink-subtle">Shannon entropy</span>
              </div>
              <span className="metric text-base text-cyan-400 font-bold">{stats.loopEntropy.toFixed(3)} bits</span>
            </div>

            <div className="p-3 border border-line bg-surface-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-ink-muted">HOMEOSTATIC LOOPS</span>
                <span className="text-[10px] text-ink-subtle">Active / Baseline</span>
              </div>
              <span className="metric text-base text-ink font-bold">
                {stats.activeLoopsCount} <span className="text-2xs text-ink-muted">/ {baselineLoops.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Risk Assessment Panel */}
        <div className="p-4 border-b border-line space-y-3.5">
          <div className="text-[10px] font-bold uppercase tracking-widest font-mono text-ink">
            Oncological Risk Index
          </div>

          <div className="p-4 border border-line bg-surface-50 rounded-clinical flex flex-col justify-center">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[9px] font-mono text-ink-muted uppercase">Mutagenesis Disruption</span>
              <span className={`metric text-2xl font-bold font-mono ${
                stats.mutagenesisRisk > 60 ? "text-crit" : (stats.mutagenesisRisk > 30 ? "text-warn" : "text-ok")
              }`}>
                {stats.mutagenesisRisk.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden mb-2">
              <div 
                className={`h-full transition-all duration-300 ${
                  stats.mutagenesisRisk > 60 ? "bg-crit" : (stats.mutagenesisRisk > 30 ? "bg-warn" : "bg-ok")
                }`} 
                style={{ width: `${stats.mutagenesisRisk}%` }} 
              />
            </div>
            
            <p className="text-[10px] text-ink-subtle leading-normal mt-1 italic">
              {stats.mutagenesisRisk > 65
                ? "WARNING: Massive disruption of baseline feedback loops. High risk of tumor-suppressor gene functional blockades."
                : (stats.mutagenesisRisk > 30
                  ? "NOTICE: Mild edge rearrangement. Active genomic inserts causing localized cycle mutations."
                  : "SAFE: Homeostatic loops fully intact. Retroviral insertions are within safe tolerances.")}
            </p>
          </div>
        </div>

        {/* Conformational Shift HUD */}
        <div className="p-4 space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-widest font-mono text-ink flex justify-between">
            <span>Conformational Kinetics</span>
            <span className="text-purple-400">phase gating</span>
          </div>

          <div className="space-y-3 font-mono text-2xs text-ink-subtle">
            <div className="flex justify-between">
              <span className="text-ink-muted">LOGIC GATE STATUS:</span>
              <span className={`font-bold ${environment.pH < conformationalParams.pHThreshold && environment.cliqueDensity > conformationalParams.baselineDensity ? "text-purple-400" : "text-ink-muted"}`}>
                {environment.pH < conformationalParams.pHThreshold && environment.cliqueDensity > conformationalParams.baselineDensity ? "GATE ENGAGED" : "GATE COMPROMISED"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-muted">STATE B OCCUPANCY RATE:</span>
              <span className="text-purple-400 font-bold text-xs">{stats.stateBPercentage.toFixed(1)}%</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-muted">COHERENCE COUPLING R(t):</span>
              <span className="text-cyan-400 font-bold text-xs">{stats.coherence.toFixed(3)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-muted">AVG CONNECTIVE WEIGHT:</span>
              <span className="text-ink font-bold text-xs">{stats.averageWeight.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
