"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function NeuroCanvas({ activeStack = [], vectors = { arousal: 0, dampening: 0, chaos: 0, repair: 0 } }: any) {
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

  return (
    <div className="w-full h-full bg-[#030008] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 80, 200], fov: 50 }}>
        <fogExp2 attach="fog" color="#030008" density={0.001} />
        <ambientLight color={0x150830} />
        <pointLight color={0x8b5cf6} intensity={2} position={[50, 100, 100]} distance={500} />
        
        <OrbitControls enableDamping autoRotate autoRotateSpeed={0.5} />
        
        <group>
          {nodes.map((node) => (
            <BrainNode key={node.id} data={node} vectors={vectors} isTargeted={activeTargetRegions.has(node.region)} totalDose={activeStack.reduce((sum: number, m: any) => sum + m.currentIntensity, 0) / 2} />
          ))}
        </group>
      </Canvas>
    </div>
  );
}

function BrainNode({ data, vectors, isTargeted, totalDose }: { data: any, vectors: any, isTargeted: boolean, totalDose: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const dist = data.position.length();
    const wave = Math.sin(dist * 0.05 - time * 3);
    
    // Physics Logic Translated from Legacy engine
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
    
    const scaleBase = Math.max(0.1, 1.0 + vectors.arousal * 0.2 - vectors.dampening * 0.4 + vectors.repair * 0.3);
    meshRef.current.scale.setScalar(Math.max(0.1, scaleBase * 3 + wave * 0.2));

    const material = meshRef.current.material as THREE.MeshPhongMaterial;
    if (material) {
        let targetColor = new THREE.Color(data.baseColor);
        if (isTargeted) {
            targetColor.setHex(0xe11d48); // Rose
        } else if (vectors.repair > 0.5 && vectors.chaos <= 0) {
            targetColor.setHex(0xfcd34d); // Gold
        } else if (vectors.dampening > 1.0) {
            targetColor.setHex(0x475569); // Slate
        } else if (vectors.chaos > 0.5 || vectors.arousal > 2.0) {
            targetColor.setHex(0xef4444); // Red
        }

        material.color.lerp(targetColor, 0.1);

        let emissiveInt = 0.3;
        if (isTargeted) {
            emissiveInt = 0.8 + wave * 0.4;
        } else {
            if (vectors.repair > 0) emissiveInt = 0.6;
            if (vectors.dampening > 1) emissiveInt = 0.1;
            if (vectors.chaos > 1) emissiveInt = 1.5;
        }
        material.emissiveIntensity = emissiveInt + (!isTargeted ? wave * 0.2 : 0);
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