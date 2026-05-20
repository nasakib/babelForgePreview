"use client";

import { useEffect, useState } from "react";

export default function MobileDisclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        const isMobile = window.innerWidth < 1024;
        const dismissed = window.sessionStorage.getItem("babelforge:mobile-disclaimer-dismissed");
        if (isMobile && !dismissed) {
          setShow(true);
        } else {
          setShow(false);
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("babelforge:mobile-disclaimer-dismissed", "true");
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[999] px-4 animate-fade-in-down pointer-events-none">
      <div className="max-w-xl mx-auto bg-surface-0/90 backdrop-blur-xl border border-accent-500/30 rounded-clinical shadow-2xl p-4 flex items-start gap-4 pointer-events-auto">
        <div className="p-2 bg-accent-500/10 border border-accent-500/30 rounded-lg text-accent-400 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Desktop Optimization Notice
          </h3>
          <p className="text-xs text-ink-subtle mt-1 leading-relaxed">
            babelForge is a high-density clinical neuroscience suite designed for desktop displays (1280px or wider). 
            Some interactive 3D simulations and multi-panel dashboards are compacted here. A larger screen is recommended for full analytical fidelity.
          </p>
          <div className="mt-3">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
            >
              Acknowledge & Proceed
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-ink-muted hover:text-ink transition-colors p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
