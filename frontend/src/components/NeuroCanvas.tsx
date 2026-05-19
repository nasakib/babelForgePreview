"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useAI } from "@/context/AIContext";
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
    setIntegrityScore,
    selectedNodeId,
    setSelectedNodeId,
    targetedOperations,
    setTargetedOperations,
  } = useAI();
  const [simTime, setSimTime] = useState(0);
  const [liveR, setLiveR] = useState(0);

  // Single source of truth: props override AIContext. Defaulting to the
  // context means a bare <NeuroCanvas /> mount anywhere in the app stays
  // synchronized with the user's active pathologies and stack.
  const activeStack = useMemo(() => stackProp ?? ctxStack ?? [], [stackProp, ctxStack]);
  const pathologies = useMemo(() => (pathProp ?? (ctxPathologies as Pathology[])) ?? [], [pathProp, ctxPathologies]);
  const vectors = useMemo<PharmaVectors>(
    () => vectorsProp ?? computeStackVectors(activeStack),
    [vectorsProp, activeStack],
  );

  const topo = useMemo<ComposedTopology>(
    () => topology ?? composeTopology(pathologies, targetedOperations),
    [topology, pathologies, targetedOperations]
  );

  const selectedNode = selectedNodeId !== null ? topo.nodes[selectedNodeId] : null;

  useEffect(() => {
    const timer = setInterval(() => setSimTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOperation = (type: 'ablate' | 'stimulate' | 'inhibit') => {
    if (selectedNodeId === null) return;
    setTargetedOperations([...targetedOperations, { nodeId: selectedNodeId, type }]);
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
    <div className="absolute inset-0 bg-canvas overflow-hidden">
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
          onCoherence={(R) => {
            setLiveR(R);
            if (onCoherence) {
              onCoherence(R);
            } else {
              // No external listener — drive the global integrity score so
              // the chrome, AI assistant, and wisdom ranker all reflect the
              // brain's live coherence.
              setIntegrityScore(Math.round(R * 100));
            }
          }}
        />
      </Canvas>

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2 z-10">
        <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest2 text-ink drop-shadow-md bg-surface-0/60 p-2 rounded backdrop-blur-sm border border-line">
          <span className="status-dot ok shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" /> 
          Real-time Kuramoto · view: {viewPerspective}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest2 text-accent-400 bg-surface-0/60 p-2 rounded backdrop-blur-sm border border-line">
          T+ {Math.floor(simTime / 60).toString().padStart(2, '0')}:{(simTime % 60).toString().padStart(2, '0')} (SIMULATED DURATION)
        </div>
        
        {/* Dynamic Node Info Panel */}
        {selectedNode && (
          <div className="mt-2 w-64 bg-surface-0/90 backdrop-blur-xl border border-accent-500/50 p-3 rounded-clinical shadow-2xl pointer-events-auto animate-fade-in-up">
            <div className="flex justify-between items-center mb-2 border-b border-line pb-1">
              <span className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Node {selectedNode.id}</span>
              <button className="text-ink-subtle hover:text-white" onClick={() => setSelectedNodeId(null)}>✕</button>
            </div>
            <div className="flex flex-col gap-1.5 text-[10px] font-mono tracking-widest2 text-ink">
              <div className="flex justify-between"><span className="text-ink-muted">Region</span> <span style={{ color: REGION_COLOR[selectedNode.region as keyof typeof REGION_COLOR] }}>{selectedNode.region}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Hubness</span> <span>{selectedNode.hubness.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">ω (Intrinsic)</span> <span>{selectedNode.omega.toFixed(2)}Hz</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Coords</span> <span>{selectedNode.x.toFixed(0)}, {selectedNode.y.toFixed(0)}, {selectedNode.z.toFixed(0)}</span></div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-line">
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
      
      <div className="absolute top-4 right-4 pointer-events-none flex flex-col items-end gap-2 z-10">
        <div className="flex flex-col items-end gap-1 text-[11px] font-mono uppercase tracking-widest2 text-ink drop-shadow-md bg-surface-0/60 p-2 rounded backdrop-blur-sm border border-line">
          <div>nodes: {topo.N}</div>
          <div>edges +{topo.edgeStats.added} / −{topo.edgeStats.removed}</div>
          <div>cliques {topo.cliques.length}</div>
          <div className="text-accent-400">R(t): {liveR.toFixed(3)}</div>
          <div>stack: {activeStack.length}</div>
        </div>
        {pathologies.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1 max-w-[280px] text-[9px] font-mono uppercase tracking-widest2">
            {pathologies.map((p) => {
              const meta = (PATHOLOGY_META as any)[p];
              return (
                <span
                  key={p}
                  className="px-1.5 py-0.5 rounded border border-crit/40 bg-crit/10 text-crit"
                  title={meta?.subjective ?? p}
                >
                  {meta?.label ?? p}
                </span>
              );
            })}
          </div>
        )}
        <div className={`text-[10px] font-mono uppercase font-bold tracking-widest2 p-2 rounded backdrop-blur-sm border ${prognosis.includes('CRITICAL') || prognosis.includes('RISK') ? 'bg-crit/10 text-crit border-crit/30' : prognosis.includes('STABILIZATION') || prognosis.includes('HEALTHY') ? 'bg-ok/10 text-ok border-ok/30' : 'bg-warn/10 text-warn border-warn/30'}`}>
          PROGNOSIS: {prognosis}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-4 text-[11px] font-mono uppercase tracking-widest2 text-ink bg-surface-0/95 p-4 rounded-clinical backdrop-blur-xl border border-line-strong pointer-events-auto shadow-2xl z-20">
        <div className="w-full text-ink-subtle mb-2 border-b border-line-strong pb-2 font-bold tracking-widest">Anatomical Region Legend & Color Coding</div>
        {(Object.keys(REGION_COLOR) as (keyof typeof REGION_COLOR)[]).map((r) => (
          <span key={r} className="inline-flex items-center gap-2 hover:brightness-125 transition-all cursor-default font-semibold text-ink">
            <span className="w-4 h-4 rounded shadow-[0_0_8px_currentColor]" style={{ background: REGION_COLOR[r], color: REGION_COLOR[r] }} />
            {r}
          </span>
        ))}
      </div>
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
  onCoherence,
}: {
  topo: ComposedTopology;
  vectors: NonNullable<NeuroCanvasProps["vectors"]>;
  viewPerspective: string;
  activeStack: any[];
  onCoherence?: (R: number) => void;
}) {
  const { selectedNodeId, setSelectedNodeId } = useAI();
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
    for (let i = 0; i < topo.edges.length; i += stride) out.push(topo.edges[i]);
    return out;
  }, [topo]);

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
      const phase = kuramoto.theta[i];
      const amp = 0.5 + 0.5 * Math.cos(phase);
      // Per-node scaling combines hubness, phase amplitude, and pharma vectors
      const hub = 1 + Math.min(2.5, topo.nodes[i].hubness * 0.08);
      const pharmScale = 1 + vectors.repair * 0.15 - vectors.dampening * 0.25;
      const scale = 1.4 * hub * (0.7 + amp * 0.9) * Math.max(0.3, pharmScale);

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
      if (viewPerspective === "physics") {
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
        if (targeted) tmpColor.current.multiplyScalar(0.8 + amp * 0.4 + hub * 0.2);
      } else {
        // Region colors for anatomy/topology
        tmpColor.current.set(baseHex).multiplyScalar(0.6 + 0.4 * amp + hub * 0.15);
      }
      inst.setColorAt(i, tmpColor.current);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

    // Edge opacity pulses with global coherence
    if (lineMatRef.current) {
      const baseOp = viewPerspective === "physics" ? 0.08 : 0.15;
      lineMatRef.current.opacity = baseOp + kuramoto.R * 0.25;
    }
  });

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
            setSelectedNodeId(e.instanceId);
          }
        }}
        onPointerMissed={(e) => {
          if (e.type === 'click') {
            setSelectedNodeId(null);
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
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
