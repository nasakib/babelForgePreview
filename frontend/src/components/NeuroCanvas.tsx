"use client";

import React, { useEffect, useRef } from 'react';

export interface PharmaVectors {
  arousal: number;
  dampening: number;
  chaos: number;
  repair: number;
}

interface NeuroCanvasProps {
  vectors: PharmaVectors;
  activeCompoundId?: string;
  isSimulating: boolean;
}

export const NeuroCanvas: React.FC<NeuroCanvasProps> = ({ vectors, activeCompoundId, isSimulating }) => {
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
      
      // Responsive canvas resizing
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear with dark premium slate backdrop
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, 0, width, height);

      // Add a subtle grid overlay for a high-tech dashboard look
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // ----------------------------------------------------------------------
      // 1. MACRO-SCALE: CONFORMATIONAL SHIELDING (Top-Left / Left Region)
      // ----------------------------------------------------------------------
      ctx.save();
      const macroX = 85;
      const macroY = 90;
      
      // Glowing core circle
      const gradient = ctx.createRadialGradient(macroX, macroY, 5, macroX, macroY, 25);
      gradient.addColorStop(0, '#00f2fe');
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.4)');
      gradient.addColorStop(1, 'rgba(11, 19, 41, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(macroX, macroY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Outer rigid core
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(macroX, macroY, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Animate rotatable bonds / peripheral substituents interconverting on a nanosecond scale
      const armCount = activeCompoundId === 'spur_mtdl' ? 12 : (activeCompoundId === 'seriphadine' ? 8 : 6);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
      ctx.lineWidth = 1.5;
      
      for (let i = 0; i < armCount; i++) {
        // Torsional well transitions at 310K represented by rapid oscillaion equations
        const angle = (i * (Math.PI * 2) / armCount) + Math.sin(frame * 0.08 + i) * 0.25;
        const length = 32 + Math.cos(frame * 0.15 + i) * 6;
        const targetX = macroX + Math.cos(angle) * length;
        const targetY = macroY + Math.sin(angle) * length;

        // Line representing bond
        ctx.beginPath();
        ctx.moveTo(macroX, macroY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Terminal functional group particle representation
        ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText("MACRO: Nanosecond Masking", 20, 155);
      
      // Dynamic shielding efficiency text
      const shieldingP = activeCompoundId === 'spur_mtdl' ? '98.5%' : (activeCompoundId === 'seriphadine' ? '88.2%' : '45.0%');
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(`Shielding Ratio: ${shieldingP}`, 20, 170);
      ctx.restore();

      // ----------------------------------------------------------------------
      // 2. MICRO-SCALE: SYNAPTIC RECEPTOR GATING (Center Membrane Region)
      // ----------------------------------------------------------------------
      ctx.save();
      const midX = 250;
      
      // Synaptic cleft outline
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = 4;
      // Pre-synaptic membrane line
      ctx.beginPath(); ctx.moveTo(midX - 35, 20); ctx.lineTo(midX - 35, 180); ctx.stroke();
      // Post-synaptic membrane line
      ctx.beginPath(); ctx.moveTo(midX + 35, 20); ctx.lineTo(midX + 35, 180); ctx.stroke();

      // Neurotransmitter / Vesicle discharge scaled by vectors.arousal
      const particleVelocity = 1.2 + Math.max(0, vectors.arousal) * 2.2;
      const count = Math.floor(6 + Math.max(0, vectors.arousal) * 12);
      ctx.fillStyle = '#a78bfa';
      
      for (let i = 0; i < count; i++) {
        const progress = (frame * particleVelocity + i * 28) % 70;
        const x = (midX - 35) + progress;
        const y = 35 + (i * 16) % 130;
        
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Halo glowing effect around active transmitters
        ctx.fillStyle = 'rgba(167, 139, 250, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a78bfa';
      }

      // Animate GABA-A allosteric channel opening / widening under dampening
      if (vectors.dampening > 1.0) {
        ctx.fillStyle = '#34d399';
        // Post-synaptic channel gate
        ctx.fillRect(midX + 31, 55, 8, 22);
        
        // Animate influx of yellow Chloride ions (Cl-) causing hyperpolarization
        const ionCount = 5;
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < ionCount; i++) {
          const ionX = midX + 35 + ((frame * 2 + i * 30) % 50);
          const ionY = 66 + Math.sin(frame * 0.15 + i) * 4;
          ctx.beginPath(); ctx.arc(ionX, ionY, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.font = '7px sans-serif';
          ctx.fillText("Cl-", ionX - 4, ionY - 4);
        }
        
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 9px monospace';
        ctx.fillText("MICRO: GABA-A Cleft Widened", 160, 195);
      } else if (activeCompoundId === 'ketamine' || activeCompoundId === 'memantine') {
        // NMDA Channel blocker visualization
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(midX + 31, 80);
        ctx.lineTo(midX + 39, 90);
        ctx.stroke();
        
        // Lodge indicator blocker
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(midX + 31, 82, 8, 8);
        
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 9px monospace';
        ctx.fillText("MICRO: NMDA Channel Blocked", 160, 195);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText("MICRO: Synaptic Gating", 175, 195);
      }

      // Render chaotic axonal tracing paths under high chaos
      if (vectors.chaos > 1.0) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX + 35, 120);
        ctx.bezierCurveTo(midX + 60, 100 + Math.sin(frame * 0.15) * 18, midX + 85, 140 + Math.cos(frame * 0.15) * 18, midX + 110, 120);
        ctx.stroke();
        
        // Pulse signal particle
        const sigX = midX + 35 + ((frame * 2.5) % 75);
        const sigY = 120 + Math.sin(frame * 0.15) * 8;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath(); ctx.arc(sigX, sigY, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // ----------------------------------------------------------------------
      // 3. INTRA-CELLULAR TRANSCRIPTIONAL LATCHING (Right Side Nucleus Node)
      // ----------------------------------------------------------------------
      ctx.save();
      const nucX = 415;
      const nucY = 90;
      
      // Nuclear boundary dashed line
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(nucX, nucY, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      if (vectors.repair > 1.5) {
        // Animate CREB cascade pathway migrating into the nucleus
        const migrationProgress = (frame * 0.03) % 1;
        const startX = nucX - 60;
        const startY = nucY + 10;
        const targetX = startX + (nucX - startX) * migrationProgress;
        const targetY = startY + (nucY - startY) * migrationProgress + Math.sin(frame * 0.1) * 8;
        
        // Phosphorylation signal dot
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing aura
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
        ctx.fill();

        // If repair is high, draw the locked double helix promoter epigenetic demethylation latch
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Spiral 1
        for (let j = nucX - 22; j < nucX + 22; j++) {
          const helixY = nucY + Math.sin(j * 0.4 + frame * 0.08) * 10;
          j === nucX - 22 ? ctx.moveTo(j, helixY) : ctx.lineTo(j, helixY);
        }
        ctx.stroke();
        
        // Spiral 2 (anti-phase)
        ctx.strokeStyle = '#059669';
        ctx.beginPath();
        for (let j = nucX - 22; j < nucX + 22; j++) {
          const helixY = nucY - Math.sin(j * 0.4 + frame * 0.08) * 10;
          j === nucX - 22 ? ctx.moveTo(j, helixY) : ctx.lineTo(j, helixY);
        }
        ctx.stroke();

        // Cross-bridges
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1;
        for (let j = nucX - 18; j < nucX + 18; j += 6) {
          const y1 = nucY + Math.sin(j * 0.4 + frame * 0.08) * 10;
          const y2 = nucY - Math.sin(j * 0.4 + frame * 0.08) * 10;
          ctx.beginPath();
          ctx.moveTo(j, y1);
          ctx.lineTo(j, y2);
          ctx.stroke();
        }

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px monospace';
        ctx.fillText("INTRA: Promoter IV Latched", 335, 155);
        ctx.fillText("CpG Demethylation: 28%", 335, 170);
      } else {
        // Epigenetic helix is muted / grey
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let j = nucX - 18; j < nucX + 18; j++) {
          const helixY = nucY + Math.sin(j * 0.4) * 6;
          j === nucX - 18 ? ctx.moveTo(j, helixY) : ctx.lineTo(j, helixY);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText("INTRA: Chromatin Muted", 345, 155);
      }
      ctx.restore();

      // Keep stepping loop
      if (isSimulating) {
        animationId = requestAnimationFrame(render);
      }
    };

    if (isSimulating) {
      render();
    } else {
      // Draw idle state
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid in idle as well
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      ctx.fillStyle = '#475569';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("Simulation Engine Idle. Awaiting Trigger...", canvas.width / 2, canvas.height / 2);
    }

    return () => cancelAnimationFrame(animationId);
  }, [vectors, activeCompoundId, isSimulating]);

  return (
    <canvas 
      ref={canvasRef} 
      width={500} 
      height={220} 
      className="w-full bg-[#0b1329] border border-slate-800 rounded-clinical mt-4 shadow-inner" 
    />
  );
};
