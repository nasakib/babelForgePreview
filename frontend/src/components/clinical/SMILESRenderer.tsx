"use client";

import React, { useEffect, useRef, useState } from "react";

interface SMILESRendererProps {
  smiles: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function SMILESRenderer({
  smiles,
  width = 256,
  height = 256,
  className = "",
}: SMILESRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current || !smiles) return;

    let isMounted = true;

    // Dynamically import smiles-drawer to prevent SSR document errors
    import("smiles-drawer").then((SmilesDrawer) => {
      if (!isMounted) return;

      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Clear canvas before drawing
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
        }

        // Initialize Drawer with optimized high-contrast styling for dark theme
        const drawer = new SmilesDrawer.Drawer({
          width,
          height,
          bondThickness: 2.0,
          bondLength: 16,
          fontSizeLarge: 11,
          fontSizeSmall: 8,
          compactDrawing: false,
          drawReaction: false,
        });

        // Parse and render the SMILES string
        SmilesDrawer.parse(
          smiles,
          (tree: any) => {
            if (!isMounted || !canvas) return;
            // Draw to the canvas using 'dark' theme for dark UI integration
            drawer.draw(tree, canvas, "dark", false);
            setError(null);
          },
          (err: any) => {
            console.error("SMILES parsing error:", err);
            if (isMounted) {
              setError("Invalid SMILES structure");
            }
          }
        );
      } catch (e) {
        console.error("Failed to render SMILES:", e);
        if (isMounted) {
          setError("Failed to render");
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isClient, smiles, width, height]);

  if (!isClient) {
    return <div className={`w-full h-full bg-surface-100 animate-pulse rounded-clinical ${className}`} />;
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center text-[10px] text-ink-muted border border-dashed border-line rounded-clinical p-2 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`max-w-full max-h-full object-contain ${className}`}
      style={{ backgroundColor: "transparent" }}
    />
  );
}
