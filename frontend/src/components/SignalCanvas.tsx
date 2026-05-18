"use client";

import { useEffect, useRef, useState } from 'react';

interface SignalCanvasProps {
  stimulus: any;
}

export default function SignalCanvas({ stimulus }: SignalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dataPoints: number[] = [];
    const maxPoints = 500;
    
    // Base signal properties
    let baseFreq = 0.05;
    let baseAmp = 20;
    let noiseLevel = 2;
    
    // Physics variables
    let time = 0;
    let currentY = 0;
    let targetY = 0;

    const render = () => {
      // Resize canvas to container
      const parent = canvas.parentElement;
      if (parent) {
          if (canvas.width !== parent.clientWidth) canvas.width = parent.clientWidth;
          if (canvas.height !== parent.clientHeight) canvas.height = parent.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Apply stimulus effects
      let currentFreq = baseFreq;
      let currentAmp = baseAmp;
      let currentNoise = noiseLevel;
      
      let transientSpike = 0;

      if (stimulus) {
        if (stimulus.category === 'Pharmacological') {
            if (stimulus.type === 'Stimulant') {
                currentFreq *= 2.5;
                currentAmp *= 0.8;
                currentNoise *= 1.5;
            } else if (stimulus.type === 'Depressant') {
                currentFreq *= 0.3;
                currentAmp *= 1.5;
                currentNoise *= 0.5;
            } else if (stimulus.type === 'Psychedelic') {
                currentFreq *= 1.2;
                currentAmp *= 1.2;
                currentNoise *= 4.0;
            }
        } else if (stimulus.category === 'Cognitive') {
            currentFreq *= 1.8;
            currentAmp *= 0.6;
        } else if (stimulus.category === 'Neuromodulatory') {
            if (stimulus.type === 'TMS') {
                // Rhythmic driving
                currentAmp *= 1.5;
                currentFreq = 0.2; // 10Hz alpha/beta locking
                currentNoise *= 0.2;
            } else if (stimulus.type === 'tDCS') {
                currentAmp *= 1.2;
                currentFreq *= 1.1;
            }
        } else if (stimulus.category === 'Sensory') {
            // Transient spikes roughly every second if active
            if (Math.random() > 0.95) {
                transientSpike = (Math.random() > 0.5 ? 1 : -1) * (baseAmp * 3);
            }
        }
      }

      time += currentFreq;

      // Generate new point
      // Mix of fundamental frequency, some harmonics, and noise
      let newPoint = Math.sin(time) * currentAmp;
      newPoint += Math.sin(time * 2.5) * (currentAmp * 0.3); // Beta harmonic
      newPoint += (Math.random() - 0.5) * currentNoise; // Chaos/Entropy
      newPoint += transientSpike;

      // Smooth interpolation for realism, unless it's a spike
      if (Math.abs(transientSpike) > 0) {
          currentY = newPoint;
      } else {
          currentY += (newPoint - currentY) * 0.2;
      }

      dataPoints.push(currentY);
      if (dataPoints.length > maxPoints) {
        dataPoints.shift();
      }

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < height; i += 40) {
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
      }
      for (let i = 0; i < width; i += 40) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
      }
      ctx.stroke();

      // Draw Baseline
      ctx.strokeStyle = '#475569'; // slate-600
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Draw Signal
      ctx.beginPath();
      const sliceWidth = width / maxPoints;
      
      for (let i = 0; i < dataPoints.length; i++) {
        const x = i * sliceWidth;
        const y = centerY - dataPoints[i];
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Dynamic color based on chaos/arousal
      let r = 99;  // indigo-500
      let g = 102;
      let b = 241;
      
      if (currentNoise > baseNoiseLevel() * 2) {
          r = 244; // rose-500
          g = 63;
          b = 94;
      } else if (currentFreq > baseFreq * 1.5) {
          r = 56;  // sky-400
          g = 189;
          b = 248;
      } else if (currentFreq < baseFreq * 0.5) {
          r = 167; // purple-400 (babelForge)
          g = 139;
          b = 250;
      }

      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw leading point glow
      if (dataPoints.length > 0) {
          const lastX = (dataPoints.length - 1) * sliceWidth;
          const lastY = centerY - dataPoints[dataPoints.length - 1];
          ctx.beginPath();
          ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(lastX, lastY, 8, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
          ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const baseNoiseLevel = () => noiseLevel;

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [stimulus]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}