"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Prominent privacy banner shown at the top of the patient pages.
 * Communicates that the preview is NOT HIPAA-compliant and lists the
 * de-identification rules the clinician is being asked to follow.
 */
export default function HipaaNotice({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { session } = useAuth();
  const isGuest = session?.user?.isGuest;

  if (isGuest) {
    return (
      <div
        role="region"
        aria-label="HIPAA guest notice"
        className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 rounded-clinical p-3 lg:p-4 text-xs leading-relaxed"
      >
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-none text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold uppercase tracking-widest text-[11px] text-emerald-300">
                Guest Simulator active — Zero Liability Sandbox
              </span>
              <button
                onClick={() => setOpen((o) => !o)}
                className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/85 hover:text-emerald-300 underline"
              >
                {open ? "Hide Details" : "Show Details"}
              </button>
            </div>
            {open && (
              <div className="mt-2 space-y-2 text-emerald-400/90 font-mono text-[11px]">
                <p>
                  You are logged in under **Guest Mode**. All patient profiles, Connectome simulation data, and phase dynamics in this session are 100% synthetic and simulated. No real Protected Health Information (PHI) is processed or cached, completely eliminating compliance liability.
                </p>
                <p className="text-[10px] uppercase tracking-widest text-emerald-500/70">
                  ⚡ Unlimited Simulator access activated.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="HIPAA privacy notice"
      className="border border-warn/40 bg-warn/10 text-warn rounded-clinical p-3 lg:p-4 text-xs leading-relaxed"
    >
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold uppercase tracking-widest text-[11px]">
              Research preview — not HIPAA-compliant
            </span>
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-[10px] font-mono uppercase tracking-widest text-warn/80 hover:text-warn underline"
            >
              {open ? "Hide" : "Details"}
            </button>
          </div>
          {open && (
            <div className="mt-2 space-y-2 text-warn/90">
              <p>
                Records are stored only in this browser&apos;s local storage. They are
                <strong> not encrypted at rest</strong>, not auditable, and never
                transmitted to the babelForge backend. Do <strong>not</strong> enter
                real PHI in this build.
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Use an <strong>internal MRN</strong> surrogate, never the real medical record number.</li>
                <li>Enter <strong>initials only</strong> — no full name.</li>
                <li>Use an <strong>age range</strong> rather than date of birth.</li>
                <li>Use a <strong>region (ZIP3, city, country)</strong> rather than full address.</li>
                <li>Free-text notes should avoid quotes and direct identifiers.</li>
              </ul>
              <p className="text-[10px] font-mono uppercase tracking-widest text-warn/70">
                Roadmap: encrypted backend store, BAA-covered hosting, audit log, row-level access control.
              </p>
              <div className="pt-2 border-t border-warn/20 text-[10px] leading-normal text-warn/80">
                ⚠️ <strong>USER LIABILITY AGREEMENT:</strong> By inputs or registry, the operator acknowledges that babelForge provides no server-side HIPAA-guaranteed hosting or local at-rest encryption in this build. The practitioner/operator assumes 100% full and sole liability for ensuring all cached patient records comply with de-identification limits.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
