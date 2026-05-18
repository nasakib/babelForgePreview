"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useAI } from "@/context/AIContext";

export default function NeuroCanvas({ activeStack = [], vectors = { arousal: 0, dampening: 0, chaos: 0, repair: 0 } }: any) {
  const aiContext = useAI();
  const viewPerspective = aiContext?.viewPerspective || 'topology';
  
  // Generate baseline nodes identically to the legacy init3D()
  const numNodes = 120;
  const a = 40, b = 30, c = 50;
  
  const nodes = useMemo(() => {
    const tempNodes = [];
    for (let i = 0; i < numNodes; i++) {
      let x, y, z;
      while (true) {
        x = (Math.random() - 0.5) * 2 * a;
        y = (Math.random() - 0.5) * 2 * b;
        z = (Math.random() - 0.5) * 2 * c;
        if ((x / a) ** 2 + (y / b) ** 2 + (z / c) ** 2 <= 1 && Math.abs(x) > 3) break;
      }

      let baseColor = 0x8b5cf6; // Default (Purple)
      let regionStr = 'Default';
      if (z < -20) { baseColor = 0xf43f5e; regionStr = 'Visual'; }
      else if (y > 15 && z >= -20 && z <= 20) { baseColor = 0x10b981; regionStr = 'SomatoMotor'; }
      else if (y < 0 && z >= -20 && z <= 20) { baseColor = 0xf59e0b; regionStr = 'Limbic'; }
      else if (z > 20) { baseColor = 0x818cf8; regionStr = 'Control'; }

      tempNodes.push({
        id: i,
        position: new THREE.Vector3(x, y, z),
        baseColor,
        region: regionStr,
        hubness: 0
      });
    }
    return tempNodes;
  }, []);

  const edges = useMemo(() => {
    const tempEdges: THREE.Vector3[][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].position.distanceTo(nodes[j].position) < 15 && Math.random() > 0.3) {
          tempEdges.push([nodes[i].position, nodes[j].position]);
        }
      }
    }
    return tempEdges;
  }, [nodes]);

  const activeTargetRegions = useMemo(() => {
    const regions = new Set<string>();
    activeStack.forEach((mol: any) => {
        if (mol.currentIntensity > 0) {
            if (mol.class === 'stimulant') { regions.add('Control'); regions.add('SomatoMotor'); }
            else if (mol.class === 'depressant' || mol.id === 'keta') { regions.add('Default'); regions.add('Limbic'); }
            else if (mol.class === 'ssri') { regions.add('Default'); regions.add('Limbic'); }
            else if (mol.id === 'zb01' || mol.id === 'nx44') { regions.add('Control'); regions.add('SomatoMotor'); regions.add('Limbic'); regions.add('Default'); regions.add('Visual'); }
            else if (mol.id === 'ss20') regions.add('Control');
            else if (mol.id === 'dr02') regions.add('SomatoMotor');
            else regions.add('Default');
        }
    });
    return regions;
  }, [activeStack]);

  const totalDose = activeStack.reduce((sum: number, m: any) => sum + m.currentIntensity, 0) / 2;

  return (
    <div className="w-full h-full bg-[#030008] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 80, 200], fov: 50 }}>
        <fogExp2 attach="fog" color="#030008" density={0.001} />
        <ambientLight color={0x150830} />
        <pointLight color={0x8b5cf6} intensity={2} position={[50, 100, 100]} distance={500} />
        
        <OrbitControls enableDamping autoRotate autoRotateSpeed={0.5} />
        
        <group>
          {viewPerspective === 'anatomy' && <LiveBrainShell vectors={vectors} a={a} b={b} c={c} />}
          
          {(viewPerspective === 'topology' || viewPerspective === 'physics') && (
            <NetworkEdges edges={edges} viewPerspective={viewPerspective} vectors={vectors} />
          )}

          {nodes.map((node) => (
            <BrainNode 
              key={node.id} 
              data={node} 
              vectors={vectors} 
              isTargeted={activeTargetRegions.has(node.region)} 
              totalDose={totalDose} 
              viewPerspective={viewPerspective}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}

function LiveBrainShell({ vectors, a, b, c }: { vectors: any, a: number, b: number, c: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particlesCount = 4000;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = (a + 5) * Math.sin(phi) * Math.cos(theta);
      const y = (b + 5) * Math.sin(phi) * Math.sin(theta);
      const z = (c + 5) * Math.cos(phi);
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, [a, b, c]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    pointsRef.current.rotation.y = Math.sin(time * 0.1) * 0.1;
    
    // Apply babelForge capabilities: structural warping based on chaos/repair
    if (vectors.chaos > 0) {
      pointsRef.current.position.x = (Math.random() - 0.5) * vectors.chaos * 2;
      pointsRef.current.position.y = (Math.random() - 0.5) * vectors.chaos * 2;
    } else {
      pointsRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.1);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particlesCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.6} 
        color={vectors.repair > 0.5 ? 0xfcd34d : 0x818cf8} 
        transparent 
        opacity={0.15} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </points>
  );
}

function NetworkEdges({ edges, viewPerspective, vectors }: { edges: THREE.Vector3[][], viewPerspective: string, vectors: any }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  
  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(edges.length * 6);
    edges.forEach((edge, i) => {
      positions[i * 6] = edge[0].x;
      positions[i * 6 + 1] = edge[0].y;
      positions[i * 6 + 2] = edge[0].z;
      positions[i * 6 + 3] = edge[1].x;
      positions[i * 6 + 4] = edge[1].y;
      positions[i * 6 + 5] = edge[1].z;
    });
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [edges]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const time = clock.getElapsedTime();
    
    // Kuramoto phase-locking visualizer for Physics mode
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    if (viewPerspective === 'physics') {
       mat.opacity = 0.1 + (Math.sin(time * 2 + vectors.arousal) * 0.1) + (vectors.repair * 0.2);
       if (vectors.chaos > 0.5) mat.color.setHex(0xef4444);
       else mat.color.setHex(0x38bdf8);
    } else {
       mat.opacity = 0.15;
       mat.color.setHex(0x6366f1);
    }
  });

  return (
    <lineSegments ref={lineRef} geometry={lineGeo}>
      <lineBasicMaterial color={0x6366f1} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

function BrainNode({ data, vectors, isTargeted, totalDose, viewPerspective }: { data: any, vectors: any, isTargeted: boolean, totalDose: number, viewPerspective: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const dist = data.position.length();
    
    // Phase dynamics
    const phaseOffset = (data.position.x + data.position.y) * 0.05;
    // Synchronized wave for Physics mode, chaotic for high chaos
    const waveFreq = viewPerspective === 'physics' ? (2 + vectors.arousal) : 3;
    const wave = Math.sin(dist * 0.05 - time * waveFreq + (vectors.chaos > 0 ? Math.random() : phaseOffset));
    
    let jitter = 0;
    if (vectors.chaos > 0) jitter = vectors.chaos * 2.5; 
    if (totalDose > 2.5) jitter += 2.0;

    if (jitter > 0) {
        meshRef.current.position.x = data.position.x + (Math.random() - 0.5) * jitter;
        meshRef.current.position.y = data.position.y + (Math.random() - 0.5) * jitter;
        meshRef.current.position.z = data.position.z + (Math.random() - 0.5) * jitter;
    } else {
        meshRef.current.position.lerp(data.position, 0.1);
    }
    
    const material = meshRef.current.material as THREE.MeshPhongMaterial;
    if (material) {
        let targetColor = new THREE.Color(data.baseColor);
        let baseSize = 3;
        let emissiveInt = 0.3;
        
        // Mode-specific visuals
        if (viewPerspective === 'pharma') {
            if (isTargeted) {
                targetColor.setHex(0xe11d48); // Glowing Rose
                baseSize = 5 + wave * 1.5;
                emissiveInt = 1.0 + wave * 0.5;
                material.opacity = 1.0;
            } else {
                targetColor.setHex(0x1e293b); // Dimmed slate
                baseSize = 1.5;
                emissiveInt = 0.1;
                material.opacity = 0.2;
            }
        } else if (viewPerspective === 'anatomy') {
            baseSize = 1.5 + wave * 0.2;
            emissiveInt = 0.5;
            material.opacity = 0.5;
        } else if (viewPerspective === 'physics') {
            baseSize = 2.5 + Math.max(0, wave * 2);
            targetColor.setHSL((time * 0.1 + phaseOffset) % 1, 0.8, 0.5); // Chromatic shifting based on phase
            emissiveInt = 0.8 + wave * 0.5;
            material.opacity = 0.9;
        } else {
            // Topology (Default)
            const scaleBase = Math.max(0.1, 1.0 + vectors.arousal * 0.2 - vectors.dampening * 0.4 + vectors.repair * 0.3);
            baseSize = Math.max(0.1, scaleBase * 3 + wave * 0.2);
            
            if (isTargeted) targetColor.setHex(0xe11d48);
            else if (vectors.repair > 0.5 && vectors.chaos <= 0) targetColor.setHex(0xfcd34d);
            else if (vectors.dampening > 1.0) targetColor.setHex(0x475569);
            else if (vectors.chaos > 0.5 || vectors.arousal > 2.0) targetColor.setHex(0xef4444);

            if (isTargeted) {
                emissiveInt = 0.8 + wave * 0.4;
            } else {
                if (vectors.repair > 0) emissiveInt = 0.6;
                if (vectors.dampening > 1) emissiveInt = 0.1;
                if (vectors.chaos > 1) emissiveInt = 1.5;
            }
            material.opacity = 0.9;
        }

        meshRef.current.scale.setScalar(baseSize);
        material.color.lerp(targetColor, 0.1);
        material.emissiveIntensity = emissiveInt;
    }
  });

  return (
    <mesh ref={meshRef} position={data.position}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshPhongMaterial 
        color={data.baseColor} 
        emissive={data.baseColor} 
        transparent 
        opacity={0.9} 
        shininess={100} 
      />
    </mesh>
  );
}