"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useAI } from "@/context/AIContext";
import DraggablePanel from "@/components/palantir/DraggablePanel";
import {
  composeTopology,
  REGION_COLOR,
  PATHOLOGY_META,
  type ComposedTopology,
  type Pathology,
} from "@/lib/engine/topology";
import {
  initKuramoto,
  stepKuramoto,
  effectiveCoupling,
  effectiveNoise,
} from "@/lib/engine/kuramoto";
import { computeStackVectors, type PharmaVectors } from "@/lib/engine/stackVectors";

interface NeuroCanvasProps {
  /** Overrides AIContext.activeStack when provided. */
  activeStack?: any[];
  /** Overrides derived stack vectors when provided. */
  vectors?: PharmaVectors;
  /** Overrides AIContext.activePathologies when provided. */
  pathologies?: Pathology[];
  /** Optional precomputed topology (avoids recomputation across siblings). */
  topology?: ComposedTopology;
  /**
   * Push live R(t) up to the parent (e.g. dashboard live integrity gauge).
   * If omitted, NeuroCanvas drives the global integrityScore directly so
   * the brain becomes the canonical source of the live coherence metric.
   */
  onCoherence?: (R: number) => void;
}

export default function NeuroCanvas({
  activeStack: stackProp,
  vectors: vectorsProp,
  pathologies: pathProp,
  topology,
  onCoherence,
}: NeuroCanvasProps) {
  const {
    viewPerspective,
    activeStack: ctxStack,
    activePathologies: ctxPathologies,
    integrityScore,
    setIntegrityScore,
    selectedNodeIds,
    setSelectedNodeIds,
    targetedOperations,
    setTargetedOperations,
    simulationTimeMonths,
  } = useAI();
  const [simTime, setSimTime] = useState(0);
  const [liveR, setLiveR] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    Cortical: true,
    Subcortical: true,
    Deep: true
  });

  // Single source of truth: props override AIContext. Defaulting to the
  // context means a bare <NeuroCanvas /> mount anywhere in the app stays
  // synchronized with the user's active pathologies and stack.
  const activeStack = useMemo(() => stackProp ?? ctxStack ?? [], [stackProp, ctxStack]);
  const pathologies = useMemo(() => (pathProp ?? (ctxPathologies as Pathology[])) ?? [], [pathProp, ctxPathologies]);
  const vectors = useMemo<PharmaVectors>(
    () => vectorsProp ?? computeStackVectors(activeStack),
    [vectorsProp, activeStack],
  );
  const activeCompoundId = useMemo(() => {
    return activeStack && activeStack.length > 0 ? activeStack[0].id : null;
  }, [activeStack]);

  const topo = useMemo<ComposedTopology>(
    () => topology ?? composeTopology(pathologies, targetedOperations, simulationTimeMonths, vectors),
    [topology, pathologies, targetedOperations, simulationTimeMonths, vectors]
  );

  // Precalculate labels: [FirstLetterRegion][NodeID][FirstLetterNearestNodeRegion]
  const nodeLabels = useMemo(() => {
    return topo.nodes.map((n, i) => {
      let nearestDist = Infinity;
      let nearestIdx = -1;
      for (let j = 0; j < topo.N; j++) {
        if (i !== j && topo.adjacency[i * topo.N + j]) {
          const nj = topo.nodes[j];
          const dist = (n.x - nj.x) ** 2 + (n.y - nj.y) ** 2 + (n.z - nj.z) ** 2;
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = j;
          }
        }
      }
      const r1 = n.region.charAt(0).toUpperCase();
      const r2 = nearestIdx >= 0 ? topo.nodes[nearestIdx].region.charAt(0).toUpperCase() : 'X';
      
      // Node strength visual mapping (hubness logic)
      const hubness = n.hubness;
      let strengthColor = "#64748b"; // dim gray (weak)
      if (hubness > 15) strengthColor = "#ffffff"; // intense white
      else if (hubness > 8) strengthColor = "#c084fc"; // bright purple
      else if (hubness > 4) strengthColor = "#94a3b8"; // lighter gray
      
      return {
        r1,
        idStr: String(n.id),
        r2,
        strengthColor,
        full: `${r1}${n.id}${r2}`
      };
    });
  }, [topo]);

  const selectedNodes = selectedNodeIds.map(id => topo.nodes[id]);

  useEffect(() => {
    const timer = setInterval(() => setSimTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOperation = (type: 'ablate' | 'stimulate' | 'inhibit') => {
    if (selectedNodeIds.length === 0) return;
    const newOps = selectedNodeIds.map(nodeId => ({ nodeId, type }));
    setTargetedOperations([...targetedOperations, ...newOps]);
  };

  const prognosis = useMemo(() => {
    if (vectors.chaos > 1.5 && vectors.repair < 0.5) return "CRITICAL DEGRADATION EXPECTED (High Chaos)";
    if (vectors.repair > 1.0) return "STABILIZATION TRAJECTORY (High Repair)";
    if (vectors.arousal > 1.5) return "HYPERAROUSAL RISK (Potential Manic Shift)";
    if (vectors.dampening > 1.5) return "APATHY / BLUNTING RISK (Excessive Dampening)";
    if (pathologies.length > 0) return "PATHOLOGICAL MAINTENANCE (Intervention Required)";
    return "MAINTAINING HEALTHY BASELINE";
  }, [vectors, pathologies]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[100] bg-canvas' : 'absolute inset-0 bg-canvas'} overflow-hidden transition-all duration-500`}>
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <Canvas camera={{ position: [0, 60, 220], fov: 45 }} dpr={[1, 2]}>
        <fogExp2 attach="fog" color="#03050b" density={0.0015} />
        <ambientLight intensity={0.35} color={0x4d6e9a} />
        <pointLight intensity={1.4} position={[80, 100, 120]} distance={600} color={0x6aa6ff} />
        <pointLight intensity={0.7} position={[-100, -40, -80]} distance={500} color={0x06b6d4} />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          autoRotate
          autoRotateSpeed={0.4}
          minDistance={120}
          maxDistance={420}
          enablePan={true}
          panSpeed={2}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.PAN
          }}
        />

        <BrainScene
          topo={topo}
          vectors={vectors}
          viewPerspective={viewPerspective}
          activeStack={activeStack}
          nodeLabels={nodeLabels}
          activeLayers={activeLayers}
          onCoherence={(R) => {
            setLiveR((prev) => {
              const p = prev.toFixed(3);
              const n = R.toFixed(3);
              return p === n ? prev : R;
            });
            if (onCoherence) {
              onCoherence(R);
            } else {
              const nextScore = Math.round(R * 100);
              if (nextScore !== integrityScore) {
                setIntegrityScore(nextScore);
              }
            }
          }}
        />
      </Canvas>

      <DraggablePanel
        id="layer-controls"
        title="View Controls"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth / 2 - 150 : 200, y: 20 }}
        defaultSize={{ width: 300, height: 100 }}
      >
        <div className="p-4 flex flex-wrap items-center gap-2">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 border border-line rounded text-[10px] font-mono text-ink transition-colors">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Isolate'}
          </button>
          <span className="w-px h-6 bg-line mx-1" />
          {["Cortical", "Subcortical", "Deep"].map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
              className={`px-3 py-1.5 border rounded text-[10px] font-mono transition-colors ${activeLayers[layer] ? 'bg-accent-500/20 border-accent-500/50 text-accent-400' : 'bg-surface-50 border-line text-ink-muted'}`}
            >
              {layer}
            </button>
          ))}
        </div>
      </DraggablePanel>

      <DraggablePanel
        id="realtime-kuramoto"
        title="Kuramoto Diagnostics"
        defaultPosition={{ x: 20, y: 20 }}
        defaultSize={{ width: 300, height: selectedNodes.length > 0 ? 500 : 120 }}
      >
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest2 text-ink">
            <span className="status-dot ok shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" /> 
            view: {viewPerspective}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest2 text-accent-400">
            T+ {Math.floor(simTime / 60).toString().padStart(2, '0')}:{(simTime % 60).toString().padStart(2, '0')} (SIMULATED)
          </div>
          
          {selectedNodes.length > 0 && (
            <div className="mt-2 animate-fade-in-up">
              <div className="flex justify-between items-center mb-2 border-b border-line pb-1">
                <span className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Isolated Assemblies ({selectedNodes.length})</span>
                <button className="text-ink-subtle hover:text-white" onClick={() => setSelectedNodeIds([])}>✕</button>
              </div>
              
              <div className="flex flex-col gap-1.5 text-[10px] font-mono tracking-widest2 text-ink mb-3">
                <div className="flex justify-between"><span className="text-ink-muted">Avg Hubness</span> <span>{(selectedNodes.reduce((a, b) => a + b.hubness, 0) / selectedNodes.length).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Avg ω (Intrinsic)</span> <span>{(selectedNodes.reduce((a, b) => a + b.omega, 0) / selectedNodes.length).toFixed(2)}Hz</span></div>
                <div className="flex justify-between items-start">
                  <span className="text-ink-muted mt-0.5">Regions</span> 
                  <div className="flex flex-col items-end">
                    {Array.from(new Set(selectedNodes.map(n => n.region))).map(r => (
                      <span key={r} style={{ color: REGION_COLOR[r as keyof typeof REGION_COLOR] }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Show active targeted operations on selected nodes */}
              {targetedOperations.filter(op => selectedNodeIds.includes(op.nodeId)).length > 0 && (
                <div className="mb-3 pt-2 border-t border-line">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] uppercase font-bold text-accent-400 tracking-widest">Active Operations</span>
                    <button onClick={() => setTargetedOperations(targetedOperations.filter(op => !selectedNodeIds.includes(op.nodeId)))} className="text-[9px] font-mono text-ink-subtle hover:text-crit transition-colors">Clear</button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {targetedOperations.filter(op => selectedNodeIds.includes(op.nodeId)).map((op, idx) => (
                      <div key={idx} className="flex justify-between text-[9px] font-mono text-ink-subtle">
                        <span>Node {op.nodeId}</span>
                        <span className={op.type === 'ablate' ? 'text-crit' : op.type === 'stimulate' ? 'text-ok' : 'text-warn'}>
                          {op.type.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3 pt-2 border-t border-line">
                <div className="text-[9px] uppercase font-bold text-accent-400 tracking-widest mb-1.5">Micro-Phenomenological Projection</div>
                <p className="text-xs text-ink-subtle leading-relaxed italic">
                  {Array.from(new Set(selectedNodes.map(n => n.region))).map(r => {
                    if (r === 'Default') return "Perturbing self-referential processing, autobiographical memory, and mind-wandering matrices.";
                    if (r === 'Limbic') return "Modulating affective valence, fear-conditioning, and emotional salience detection.";
                    if (r === 'Control') return "Shifting executive function, goal-directed task switching, and working memory buffers.";
                  if (r === 'SomatoMotor') return "Altering sensorimotor integration and action-execution pathways.";
                  if (r === 'Visual') return "Adjusting bottom-up sensory integration and visual processing density.";
                  if (r === 'VentAttn') return "Recalibrating bottom-up attention reorienting and external salience networks.";
                  return "";
                }).join(" ")}
              </p>
            </div>
            
            <div className="pt-2 border-t border-line">
              <div className="text-[9px] uppercase font-bold text-ink-muted tracking-widest mb-1.5">Targeted Operations</div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => handleOperation('stimulate')} className="w-full text-left px-2 py-1.5 bg-surface-50 hover:bg-surface-100 border border-line rounded text-[9px] font-mono text-ink transition-colors flex justify-between">
                  <span>Stimulate (TMS)</span> <span className="text-ok">+ω</span>
                </button>
                <button onClick={() => handleOperation('inhibit')} className="w-full text-left px-2 py-1.5 bg-surface-50 hover:bg-surface-100 border border-line rounded text-[9px] font-mono text-ink transition-colors flex justify-between">
                  <span>Inhibit (DBS)</span> <span className="text-warn">-ω</span>
                </button>
                <button onClick={() => handleOperation('ablate')} className="w-full text-left px-2 py-1.5 bg-crit/10 hover:bg-crit/20 border border-crit/30 rounded text-[9px] font-mono text-crit transition-colors flex justify-between">
                  <span>Ablate (TCCA)</span> <span>Sever Edges</span>
                </button>
              </div>
            </div>
            </div>
          )}
        </div>
      </DraggablePanel>
      
      <DraggablePanel
        id="network-topography"
        title="Network Topography"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth - 320 : 800, y: 20 }}
        defaultSize={{ width: 280, height: pathologies.length > 0 ? 220 : 160 }}
      >
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col items-end gap-1 text-[11px] font-mono uppercase tracking-widest2 text-ink drop-shadow-md bg-surface-0/60 p-2 rounded backdrop-blur-sm border border-line">
            <div className="w-full flex justify-between"><span>nodes:</span> <span>{topo.N}</span></div>
            <div className="w-full flex justify-between"><span>edges:</span> <span>+{topo.edgeStats.added} / −{topo.edgeStats.removed}</span></div>
            <div className="w-full flex justify-between"><span>cliques:</span> <span>{topo.cliques.length}</span></div>
            <div className="w-full flex justify-between text-accent-400"><span>R(t):</span> <span>{liveR.toFixed(3)}</span></div>
            <div className="w-full flex justify-between"><span>stack:</span> <span>{activeStack.length}</span></div>
          </div>
          {pathologies.length > 0 && (
            <div className="flex flex-wrap gap-1 text-[9px] font-mono uppercase tracking-widest2 w-full mt-1">
              {pathologies.map((p) => {
                const meta = (PATHOLOGY_META as any)[p];
                return (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 rounded border border-crit/40 bg-crit/10 text-crit w-full text-right"
                    title={meta?.subjective ?? p}
                  >
                    {meta?.label ?? p}
                  </span>
                );
              })}
            </div>
          )}
          <div className={`text-[10px] font-mono uppercase font-bold tracking-widest2 p-2 rounded backdrop-blur-sm border text-center ${prognosis.includes('CRITICAL') || prognosis.includes('RISK') ? 'bg-crit/10 text-crit border-crit/30' : prognosis.includes('STABILIZATION') || prognosis.includes('HEALTHY') ? 'bg-ok/10 text-ok border-ok/30' : 'bg-warn/10 text-warn border-warn/30'}`}>
            {prognosis}
          </div>
        </div>
      </DraggablePanel>

      <DraggablePanel
        id="region-legend"
        title="Anatomical Region Legend"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth / 2 - 250 : 200, y: typeof window !== "undefined" ? window.innerHeight - 150 : 800 }}
        defaultSize={{ width: 500, height: 100 }}
      >
        <div className="p-4 flex flex-wrap gap-4 text-[11px] font-mono uppercase tracking-widest2 text-ink">
          {(Object.keys(REGION_COLOR) as (keyof typeof REGION_COLOR)[]).map((r) => (
            <span key={r} className="inline-flex items-center gap-2 hover:brightness-125 transition-all cursor-default font-semibold text-ink">
              <span className="w-3 h-3 rounded shadow-[0_0_8px_currentColor]" style={{ background: REGION_COLOR[r], color: REGION_COLOR[r] }} />
              {r}
            </span>
          ))}
        </div>
      </DraggablePanel>

      <DraggablePanel
        id="movements-legend"
        title="3D Canvas Navigation"
        subtitle="OrbitControls mapping"
        defaultPosition={{ x: 20, y: typeof window !== "undefined" ? window.innerHeight - 280 : 600 }}
        defaultSize={{ width: 340, height: 195 }}
      >
        <div className="p-4 flex flex-col gap-2.5 text-[11px] font-mono text-ink-subtle">
          <div className="flex justify-between items-center border-b border-line pb-1.5">
            <span className="text-accent-400 font-bold uppercase tracking-widest">Rotate Brain</span>
            <span className="text-ink font-semibold">Left-Click + Drag <span className="text-ink-muted text-[10px]">(or 1-finger drag)</span></span>
          </div>
          <div className="flex justify-between items-center border-b border-line pb-1.5">
            <span className="text-accent-400 font-bold uppercase tracking-widest">Pan Camera</span>
            <span className="text-ink font-semibold">Right-Click + Drag <span className="text-ink-muted text-[10px]">(or 2-finger drag)</span></span>
          </div>
          <div className="flex justify-between items-center border-b border-line pb-1.5">
            <span className="text-accent-400 font-bold uppercase tracking-widest">Zoom In/Out</span>
            <span className="text-ink font-semibold">Scroll Wheel <span className="text-ink-muted text-[10px]">(or pinch)</span></span>
          </div>
          <div className="flex justify-between items-center pb-0.5">
            <span className="text-accent-400 font-bold uppercase tracking-widest">Isolate Node</span>
            <span className="text-ink font-semibold">Left-Click Node <span className="text-ink-muted text-[10px]">(tap node)</span></span>
          </div>
        </div>
      </DraggablePanel>

      <DraggablePanel
        id="biophysical-animation"
        title="Biophysical Animation Engine"
        subtitle="Real-time multi-resolution biophysical animation loops"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth - 520 : 800, y: typeof window !== "undefined" ? window.innerHeight - 300 : 600 }}
        defaultSize={{ width: 500, height: 260 }}
      >
        <div className="p-2 bg-[#0b1329] rounded shadow-inner">
          <BiophysicalAnimationCanvas vectors={vectors} activeCompoundId={activeCompoundId} />
        </div>
      </DraggablePanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brain Hull Outline
// ---------------------------------------------------------------------------
function BrainHull() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const a = 50, b = 40, c = 60; // Slightly larger than nodes
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      pos[i * 3] = a * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = b * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = c * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.8} color="#8a94a6" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Scene with Kuramoto integrator
// ---------------------------------------------------------------------------
function BrainScene({
  topo,
  vectors,
  viewPerspective,
  activeStack,
  nodeLabels,
  activeLayers,
  onCoherence,
}: {
  topo: ComposedTopology;
  vectors: NonNullable<NeuroCanvasProps["vectors"]>;
  viewPerspective: string;
  activeStack: any[];
  nodeLabels: { r1: string; idStr: string; r2: string; strengthColor: string; full: string }[];
  activeLayers: Record<string, boolean>;
  onCoherence?: (R: number) => void;
}) {
  const { selectedNodeIds, setSelectedNodeIds } = useAI();
  // Pre-build node positions, colors, edge geometry
  const positions = useMemo(() => {
    const arr = new Float32Array(topo.N * 3);
    for (let i = 0; i < topo.N; i++) {
      const n = topo.nodes[i];
      arr[i * 3] = n.x;
      arr[i * 3 + 1] = n.y;
      arr[i * 3 + 2] = n.z;
    }
    return arr;
  }, [topo]);

  const colors = useMemo(() => {
    const arr = new Float32Array(topo.N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < topo.N; i++) {
      c.set(REGION_COLOR[topo.nodes[i].region]);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [topo]);

  // Sample edges to keep render budget reasonable (cap ~1200)
  const sampledEdges = useMemo(() => {
    const max = 1200;
    const stride = Math.max(1, Math.floor(topo.edges.length / max));
    const out: [number, number][] = [];
    for (let i = 0; i < topo.edges.length; i += stride) {
      const e = topo.edges[i];
      const nu = topo.nodes[e[0]];
      const nv = topo.nodes[e[1]];
      if (activeLayers[nu.layer] && activeLayers[nv.layer]) {
        out.push(e);
      }
    }
    return out;
  }, [topo, activeLayers]);

  const edgeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(sampledEdges.length * 6);
    const colArr = new Float32Array(sampledEdges.length * 6);
    const c1 = new THREE.Color();
    const c2 = new THREE.Color();

    sampledEdges.forEach(([u, v], i) => {
      const nu = topo.nodes[u];
      const nv = topo.nodes[v];

      arr[i * 6] = nu.x;
      arr[i * 6 + 1] = nu.y;
      arr[i * 6 + 2] = nu.z;
      arr[i * 6 + 3] = nv.x;
      arr[i * 6 + 4] = nv.y;
      arr[i * 6 + 5] = nv.z;

      // Color edges based on region
      c1.set(REGION_COLOR[nu.region as keyof typeof REGION_COLOR] || "#ffffff");
      c2.set(REGION_COLOR[nv.region as keyof typeof REGION_COLOR] || "#ffffff");

      colArr[i * 6] = c1.r;
      colArr[i * 6 + 1] = c1.g;
      colArr[i * 6 + 2] = c1.b;
      colArr[i * 6 + 3] = c2.r;
      colArr[i * 6 + 4] = c2.g;
      colArr[i * 6 + 5] = c2.b;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
    return geo;
  }, [sampledEdges, topo]);

  // Kuramoto integrator (mutated each frame)
  const kuramoto = useMemo(() => {
    return initKuramoto({
      N: topo.N,
      adjacency: topo.adjacency,
      omegas: Float32Array.from(topo.nodes.map((n) => n.omega)),
      K: 1.0,
      noise: 0.06,
      seed: 21,
    });
    // re-init when topology changes
  }, [topo]);

  // Update K & noise when vectors change
  useEffect(() => {
    kuramoto.K = effectiveCoupling(vectors);
    kuramoto.noise = effectiveNoise(vectors);
  }, [vectors, vectors.arousal, vectors.dampening, vectors.chaos, vectors.repair, kuramoto]);

  // Refs to point-cloud-like instanced spheres (we use InstancedMesh)
  const instRef = useRef<THREE.InstancedMesh>(null);
  const tmpObj = useRef(new THREE.Object3D());
  const tmpColor = useRef(new THREE.Color());
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);

  // Push coherence to parent on a throttle
  const coherenceFrame = useRef(0);

  useFrame((_, dt) => {
    try {
      // Sub-step Kuramoto for numerical stability with large adjacency
    const steps = 1;
    const sdt = Math.min(0.05, dt) / steps;
    for (let s = 0; s < steps; s++) stepKuramoto(kuramoto, sdt);

    if (onCoherence) {
      coherenceFrame.current++;
      if (coherenceFrame.current % 12 === 0) onCoherence(kuramoto.R);
    }

    // Render instanced spheres
    const inst = instRef.current;
    if (!inst) return;
    const N = topo.N;
    for (let i = 0; i < N; i++) {
      const nodeLayer = topo.nodes[i].layer;
      const isActiveLayer = activeLayers[nodeLayer];

      const phase = kuramoto.theta[i];
      const amp = 0.5 + 0.5 * Math.cos(phase);
      // Per-node scaling combines hubness, phase amplitude, and pharma vectors
      const hub = 1 + Math.min(2.5, topo.nodes[i].hubness * 0.08);
      const pharmScale = 1 + vectors.repair * 0.15 - vectors.dampening * 0.25;
      const scale = isActiveLayer ? 1.4 * hub * (0.7 + amp * 0.9) * Math.max(0.3, pharmScale) : 0;

      // Pharma chaos jitter
      const jit = vectors.chaos > 0 ? vectors.chaos * 0.6 : 0;
      tmpObj.current.position.set(
        topo.nodes[i].x + (Math.random() - 0.5) * jit,
        topo.nodes[i].y + (Math.random() - 0.5) * jit,
        topo.nodes[i].z + (Math.random() - 0.5) * jit
      );
      tmpObj.current.scale.setScalar(scale);
      tmpObj.current.updateMatrix();
      inst.setMatrixAt(i, tmpObj.current.matrix);

      // Color: region base, with phase/pharma adjustments
      let baseHex = REGION_COLOR[topo.nodes[i].region as keyof typeof REGION_COLOR] || "#ffffff";
      
      const isSelected = selectedNodeIds.includes(i);
      const isFiltering = selectedNodeIds.length > 0;
      
      if (isFiltering && !isSelected) {
        tmpColor.current.set("#0f172a"); // Very dark, nearly invisible
        tmpColor.current.multiplyScalar(0.4);
      } else if (isFiltering && isSelected) {
        tmpColor.current.set(baseHex).multiplyScalar(1.5 + 0.5 * amp); // Highlight brightly
      } else if (viewPerspective === "physics") {
        // Pure phase chromatic for physics
        tmpColor.current.setHSL((phase / (Math.PI * 2) + 1) % 1, 0.85, 0.5 + 0.3 * amp);
      } else if (viewPerspective === "pharma") {
        // Highlight nodes whose region is targeted by the stack vectors
        const cls = topo.nodes[i].region;
        const targeted =
          (vectors.arousal > 0.3 && (cls === "Control" || cls === "SomatoMotor")) ||
          (vectors.dampening > 0.3 && (cls === "Default" || cls === "Limbic")) ||
          (vectors.repair > 0.3);
        tmpColor.current.set(targeted ? baseHex : "#2a3441");
        if (targeted) tmpColor.current.multiplyScalar(0.85 + 0.15 * amp + hub * 0.1);
      } else {
        // Region colors for anatomy/topology - true to legend with very subtle pulse
        tmpColor.current.set(baseHex).multiplyScalar(0.85 + 0.15 * amp + hub * 0.05);
      }
      
      if (!isActiveLayer) tmpColor.current.set("#000000"); // Make it completely dark if not hiding scale entirely
      inst.setColorAt(i, tmpColor.current);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

    // Edge opacity pulses with global coherence
    if (lineMatRef.current) {
      const baseOp = viewPerspective === "physics" ? 0.15 : 0.35;
      lineMatRef.current.opacity = baseOp + (isNaN(kuramoto.R) ? 0 : kuramoto.R * 0.25);
    }
    } catch(e) {
      console.error(e);
    }
  });

  const toggleSelection = (id: number) => {
    if (selectedNodeIds.includes(id)) {
      setSelectedNodeIds(selectedNodeIds.filter(x => x !== id));
    } else {
      setSelectedNodeIds([...selectedNodeIds, id]);
    }
  };

  return (
    <group>
      <BrainHull />
      <instancedMesh
        ref={instRef}
        args={[undefined, undefined, topo.N]}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            toggleSelection(e.instanceId);
          }
        }}
        onPointerMissed={(e) => {
          if (e.type === 'click') {
            setSelectedNodeIds([]);
          }
        }}
      >
        <instancedBufferAttribute attach="instanceColor" args={[new Float32Array(topo.N * 3), 3]} />
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={new THREE.Color("#05070d")}
          roughness={0.4}
          metalness={0.1}
          toneMapped={false}
        />
      </instancedMesh>

      <lineSegments geometry={edgeGeo} renderOrder={-1}>
        <lineBasicMaterial
          ref={lineMatRef}
          vertexColors
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </lineSegments>

      {/* Render Naming Convention Tags on Nodes */}
      {viewPerspective !== "anatomy" && nodeLabels.map((label, i) => {
        const isSelected = selectedNodeIds.includes(i);
        if (!isSelected) return null;

        return (
          <Html
            key={`lbl-${i}`}
            position={[topo.nodes[i].x, topo.nodes[i].y + 1.8, topo.nodes[i].z]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-[10px] font-mono font-bold text-white drop-shadow-md whitespace-nowrap">
              {`${label.r1}${label.idStr}${label.r2}`}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2D Biophysical Animation Canvas
// ---------------------------------------------------------------------------
function BiophysicalAnimationCanvas({ vectors, activeCompoundId }: { vectors: PharmaVectors; activeCompoundId: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frame = 0;

    const render = () => {
      frame++;
      
      // Clear with dark premium slate backdrop
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, 0, 500, 200);

      // Add a subtle grid overlay for a high-tech dashboard look
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < 500; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 200); ctx.stroke();
      }
      for (let y = 0; y < 200; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(500, y); ctx.stroke();
      }

      // Macro Scale: Conformer Microstate Ensemble Distribution (Renders top-left quadrant)
      const isSpur = activeCompoundId === 'spur01';
      if (activeCompoundId) {
        ctx.strokeStyle = isSpur ? '#22d3ee' : '#475569'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(60, 60, 15, 0, Math.PI * 2); ctx.stroke(); // Fixed Rigid Core
        const peripheralArms = isSpur ? 16 : 8;
        for (let i = 0; i < peripheralArms; i++) {
          const angle = (i * (Math.PI * 2) / peripheralArms) + Math.sin(frame * 0.08 + i) * 0.25;
          const extension = (isSpur ? 25 : 20) + Math.cos(frame * 0.15 + i) * (isSpur ? 6 : 4);
          ctx.beginPath(); ctx.moveTo(60, 60);
          ctx.lineTo(60 + Math.cos(angle) * extension, 60 + Math.sin(angle) * extension);
          ctx.stroke(); // Dynamic conformation space rotation shielding enzyme sites
        }
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace';
        ctx.fillText(isSpur ? "MACRO: Torsional Ensemble Diversity" : "MACRO: Core-Periphery Conformation", 15, 110);
      } else {
        ctx.fillStyle = '#475569'; ctx.font = '9px monospace';
        ctx.fillText("MACRO: No Active Ligand Core", 15, 60);
      }

      // Micro Scale: Synaptic Channel Gating & Receptor Selection (Renders center quadrant)
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(160, 15); ctx.lineTo(160, 150); ctx.stroke(); // Pre-synaptic membrane
      ctx.beginPath(); ctx.moveTo(230, 15); ctx.lineTo(230, 150); ctx.stroke(); // Post-synaptic membrane

      const travelVelocity = 1.5 + vectors.arousal * 2;
      const transmitterCount = Math.floor(4 + vectors.arousal * 8);
      ctx.fillStyle = '#c084fc';
      for (let i = 0; i < transmitterCount; i++) {
        const x = 160 + ((frame * travelVelocity + i * 30) % 70);
        const y = 30 + (i * 15) % 100;
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); // Vestibular particle clearing
      }

      if (vectors.repair > 2.0) {
        ctx.fillStyle = '#34d399'; ctx.fillRect(227, 45, 6, 18); // Wide agonist docking configuration
        ctx.fillStyle = '#34d399'; ctx.font = '9px monospace';
        ctx.fillText("MICRO: TrkB Receptor Dimerized", 145, 170);
      } else {
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace';
        ctx.fillText("MICRO: Synaptic Gating", 145, 170);
      }

      // Intracellular Scale: Transcriptional Remodeling Helix (Renders right-side cell nucleus)
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(380, 80, 30, 0, Math.PI * 2); ctx.stroke(); // Nuclear membrane interface

      if (vectors.repair >= 3.0) {
        // Animate phosphorylation cascade migration passing through nuclear gates
        const trajectoryFactor = (frame * 0.04) % 1;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(320 + (380 - 320) * trajectoryFactor, 80 + Math.sin(frame * 0.1) * 8, 3.5, 0, Math.PI * 2); ctx.fill();

        // Draw active double-helix expression tracking locked genetic latch structures
        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 365; k < 395; k++) {
          const doubleHelixY = 80 + Math.sin(k * 0.6 + frame * 0.12) * 10;
          k === 365 ? ctx.moveTo(k, doubleHelixY) : ctx.lineTo(k, doubleHelixY);
        }
        ctx.stroke();
        ctx.fillStyle = '#10b981'; ctx.font = '9px monospace';
        ctx.fillText("INTRA: Promoter IV Demethylating", 325, 130);
      } else {
        ctx.fillStyle = '#64748b'; ctx.font = '9px monospace';
        ctx.fillText("INTRA: Chromatin Muted", 325, 130);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [vectors, activeCompoundId]);

  return (
    <canvas 
      ref={canvasRef} 
      width={500} 
      height={200} 
      className="w-full bg-[#0b1329] border border-slate-800 rounded shadow-inner" 
    />
  );
}
