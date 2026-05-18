"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function NeuroCanvas() {
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

  return (
    <div className="w-full h-full bg-[#030008] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 80, 200], fov: 50 }}>
        <fogExp2 attach="fog" color="#030008" density={0.001} />
        <ambientLight color={0x150830} />
        <pointLight color={0x8b5cf6} intensity={2} position={[50, 100, 100]} distance={500} />
        
        <OrbitControls enableDamping autoRotate autoRotateSpeed={0.5} />
        
        <group>
          {nodes.map((node) => (
            <BrainNode key={node.id} data={node} />
          ))}
        </group>
      </Canvas>
    </div>
  );
}

function BrainNode({ data }: { data: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const dist = data.position.length();
    const wave = Math.sin(dist * 0.05 - time * 3);
    
    // Basic oscillation logic
    meshRef.current.position.y = data.position.y + wave * 2;
    meshRef.current.scale.setScalar(3 + wave * 0.2);
    
    // Type casting the material
    const material = meshRef.current.material as THREE.MeshPhongMaterial;
    if (material) {
        material.emissiveIntensity = 0.4 + wave * 0.3;
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