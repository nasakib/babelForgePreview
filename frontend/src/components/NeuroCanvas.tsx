"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useAI } from "@/context/AIContext";
import {
  composeTopology,
  REGION_COLOR,
  type ComposedTopology,
  type Pathology,
} from "@/lib/engine/topology";
import {
  initKuramoto,
  stepKuramoto,
  effectiveCoupling,
  effectiveNoise,
} from "@/lib/engine/kuramoto";

interface NeuroCanvasProps {
  activeStack?: any[];
  vectors?: { arousal: number; dampening: number; chaos: number; repair: number };
  pathologies?: Pathology[];
  /** Optional precomputed topology (avoids recomputation across siblings). */
  topology?: ComposedTopology;
  /** Push live R(t) up to the parent (e.g. dashboard live integrity gauge). */
  onCoherence?: (R: number) => void;
}

export default function NeuroCanvas({
  activeStack = [],
  vectors = { arousal: 0, dampening: 0, chaos: 0, repair: 0 },
  pathologies = [],
  topology,
  onCoherence,
}: NeuroCanvasProps) {
  const { viewPerspective } = useAI();

  const topo = useMemo<ComposedTopology>(
    () => topology ?? composeTopology(pathologies),
    [topology, pathologies.join("|")]
  );

  return (
    <div className="w-full h-full bg-canvas overflow-hidden relative">
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
        />

        <BrainScene
          topo={topo}
          vectors={vectors}
          viewPerspective={viewPerspective}
          activeStack={activeStack}
          onCoherence={onCoherence}
        />
      </Canvas>

      {/* HUD overlay */}
      <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
        <span className="status-dot ok" /> Real-time Kuramoto Â· N={topo.N} Â· view: {viewPerspective}
      </div>
      <div className="absolute top-3 right-3 pointer-events-none flex flex-col items-end gap-1 text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
        <div>edges +{topo.edgeStats.added} / âˆ’{topo.edgeStats.removed}</div>
        <div>cliques {topo.cliques.length}</div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 text-[9.5px] font-mono uppercase tracking-widest2 text-ink-muted pointer-events-none">
        {(Object.keys(REGION_COLOR) as (keyof typeof REGION_COLOR)[]).map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: REGION_COLOR[r] }} />
            {r}
          </span>
        ))}
      </div>
    </div>
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
    sampledEdges.forEach(([u, v], i) => {
      arr[i * 6] = topo.nodes[u].x;
      arr[i * 6 + 1] = topo.nodes[u].y;
      arr[i * 6 + 2] = topo.nodes[u].z;
      arr[i * 6 + 3] = topo.nodes[v].x;
      arr[i * 6 + 4] = topo.nodes[v].y;
      arr[i * 6 + 5] = topo.nodes[v].z;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
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
  }, [vectors.arousal, vectors.dampening, vectors.chaos, vectors.repair, kuramoto]);

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

      // Color: region tint mixed with phase-driven warm/cool shift
      let baseHex = REGION_COLOR[topo.nodes[i].region];
      if (viewPerspective === "physics") {
        // Pure phase chromatic
        tmpColor.current.setHSL((phase / (Math.PI * 2) + 1) % 1, 0.75, 0.4 + 0.25 * amp);
      } else if (viewPerspective === "pharma") {
        // Highlight nodes whose region is targeted by the stack vectors
        const cls = topo.nodes[i].region;
        const targeted =
          (vectors.arousal > 0.3 && (cls === "Control" || cls === "SomatoMotor")) ||
          (vectors.dampening > 0.3 && (cls === "Default" || cls === "Limbic")) ||
          (vectors.repair > 0.3);
        tmpColor.current.set(targeted ? "#1f6dff" : "#1b2230");
        if (targeted) tmpColor.current.multiplyScalar(0.6 + amp * 0.8);
      } else if (viewPerspective === "anatomy") {
        tmpColor.current.set(baseHex).multiplyScalar(0.5 + 0.4 * amp);
      } else {
        // topology
        tmpColor.current.set(baseHex).multiplyScalar(0.55 + 0.55 * amp);
      }
      inst.setColorAt(i, tmpColor.current);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

    // Edge opacity pulses with global coherence
    if (lineMatRef.current) {
      const baseOp = viewPerspective === "physics" ? 0.05 : 0.08;
      lineMatRef.current.opacity = baseOp + kuramoto.R * 0.35;
      lineMatRef.current.color.set(viewPerspective === "physics" ? "#1f6dff" : "#4d8dff");
    }
  });

  return (
    <group>
      <instancedMesh
        ref={instRef}
        args={[undefined, undefined, topo.N]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial
          vertexColors
          emissive={new THREE.Color("#0a0d14")}
          roughness={0.4}
          metalness={0.05}
          toneMapped={false}
        />
      </instancedMesh>

      <lineSegments geometry={edgeGeo} renderOrder={-1}>
        <lineBasicMaterial
          ref={lineMatRef}
          color="#4d8dff"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
