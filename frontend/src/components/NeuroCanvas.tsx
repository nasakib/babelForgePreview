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
    [topology, pathologies]
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
          onCoherence={onCoherence}
        />
      </Canvas>

      {/* HUD overlay */}
      <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest2 text-ink drop-shadow-md">
        <span className="status-dot ok shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Real-time Kuramoto · N={topo.N} · view: {viewPerspective}
      </div>
      <div className="absolute top-4 right-4 pointer-events-none flex flex-col items-end gap-1 text-[11px] font-mono uppercase tracking-widest2 text-ink drop-shadow-md">
        <div>edges +{topo.edgeStats.added} / −{topo.edgeStats.removed}</div>
        <div>cliques {topo.cliques.length}</div>
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
        if (targeted) tmpColor.current.multiplyScalar(0.8 + amp * 0.4);
      } else {
        // Region colors for anatomy/topology
        tmpColor.current.set(baseHex).multiplyScalar(0.6 + 0.4 * amp);
      }
      inst.setColorAt(i, tmpColor.current);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;

    // Edge opacity pulses with global coherence
    if (lineMatRef.current) {
      const baseOp = viewPerspective === "physics" ? 0.15 : 0.35;
      lineMatRef.current.opacity = baseOp + kuramoto.R * 0.5;
    }
  });

  return (
    <group>
      <BrainHull />
      <instancedMesh
        ref={instRef}
        args={[undefined, undefined, topo.N]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial
          vertexColors
          emissive={new THREE.Color("#ffffff")}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.8}
          toneMapped={false}
        />
      </instancedMesh>

      <lineSegments geometry={edgeGeo} renderOrder={-1}>
        <lineBasicMaterial
          ref={lineMatRef}
          vertexColors
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
