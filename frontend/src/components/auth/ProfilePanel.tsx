"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { useWindowContext } from "@/context/WindowContext";
import DraggablePanel from "@/components/palantir/DraggablePanel";
import { PLAN_FEATURES, CAPABILITIES, Role } from "@/lib/auth/types";

export default function ProfilePanel() {
  const { session, updateSession } = useAuth();
  const { patients } = usePatient();
  const { updateWindow, windows } = useWindowContext();

  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Synchronize state when session loads/updates
  useEffect(() => {
    if (session) {
      setName(session.user.name);
      setOrgName(session.org.name);
    }
  }, [session]);

  if (!session) return null;

  const user = session.user;
  const org = session.org;
  const plan = org.plan;
  const planLimits = PLAN_FEATURES[plan];
  
  const currentCount = patients.length;
  const limitCount = planLimits.maxPatients;
  const pct = limitCount === Infinity ? 0 : Math.min(100, (currentCount / limitCount) * 100);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !orgName.trim()) return;
    setSubmitting(true);
    try {
      await updateSession({
        name: name.trim(),
        orgName: orgName.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpgrade = () => {
    setUpgradeSubmitted(true);
    setTimeout(() => setUpgradeSubmitted(false), 5000);
  };

  // Human-readable capability descriptions
  const capabilityLabels: Record<keyof typeof CAPABILITIES, string> = {
    "patient.read": "Read Patient cohort rosters & metadata",
    "patient.write": "Write / Modify Patient clinical records",
    "patient.export": "Export Patient datasets (JSON Blobs)",
    "patient.purge": "Hard-purge local databases",
    "billing.manage": "Manage subscription billing structures",
    "org.invite": "Invite clinical team practitioners",
    "sim.run": "Solve Kuramoto oscillator simulations",
  };

  const roleNameMap: Record<Role, string> = {
    owner: "Clinic Owner & Admin",
    clinician: "Precision Clinician",
    researcher: "Neuroscience Researcher",
    viewer: "Regulatory Auditor",
  };

  return (
    <DraggablePanel
      id="console-profile-panel"
      title="Clinician Workspace Settings"
      subtitle="Security & Identity Control"
      defaultPosition={{ x: 100, y: 100 }}
      defaultSize={{ width: 450, height: 620 }}
      onClose={() => updateWindow("console-profile-panel", { minimized: true })}
    >
      <div className="p-5 flex flex-col gap-6 text-xs text-slate-300 font-sans">
        {/* Clinician Overview Card */}
        <div className="relative rounded-clinical p-4 bg-slate-950/60 border border-slate-800/80 flex items-center gap-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg tracking-wider border border-accent-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] select-none font-mono">
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{user.name}</h3>
            <p className="text-[10px] font-mono text-slate-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-full bg-accent-500/10 border border-accent-500/30 text-[9px] font-mono uppercase tracking-widest text-accent-400">
                {roleNameMap[user.role]}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-mono uppercase tracking-widest text-cyan-400">
                {plan} plan
              </span>
            </div>
          </div>
        </div>

        {/* Profile Update Form */}
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>Clinician Profile details</span>
            {saveSuccess && (
              <span className="text-emerald-400 lowercase tracking-normal flex items-center gap-1 font-sans animate-fade-in">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                synced with registry
              </span>
            )}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Practitioner Name</label>
              <input
                type="text"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                className="input-clinical w-full text-white bg-slate-950/40 border border-slate-800/80 focus:border-accent-500 text-xs px-2.5 py-1.5"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Clinic / Organization</label>
              <input
                type="text"
                value={orgName}
                required
                onChange={(e) => setOrgName(e.target.value)}
                className="input-clinical w-full text-white bg-slate-950/40 border border-slate-800/80 focus:border-accent-500 text-xs px-2.5 py-1.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !orgName.trim()}
            className="btn-primary py-2 bg-slate-800/60 hover:bg-slate-700/80 border-slate-700/80 text-white font-mono uppercase tracking-widest text-[9px] transition-colors disabled:opacity-40"
          >
            {submitting ? "Synchronising..." : "Apply Workspace Changes"}
          </button>
        </form>

        {/* Telemetry / Plan Limit progress */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>Workspace Telemetry & Quota</span>
            {org.baaSigned ? (
              <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> BAA SIGNED
              </span>
            ) : (
              <span className="text-[9px] text-rose-400 font-mono tracking-widest uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> NO BAA ON FILE
              </span>
            )}
          </h4>

          <div className="p-3.5 rounded-clinical bg-slate-950/40 border border-slate-800/60 space-y-3 font-mono text-[10px]">
            <div className="flex justify-between items-baseline text-slate-400">
              <span>Patient Cohort Utilization</span>
              <span className="text-white font-bold">
                {currentCount} / {limitCount === Infinity ? "∞" : limitCount}
              </span>
            </div>
            
            <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-accent-500 to-cyan-400"
                }`}
                style={{ width: `${limitCount === Infinity ? 10 : pct}%` }}
              />
            </div>

            <div className="text-[9px] leading-relaxed text-slate-500 pt-1 font-sans">
              * Local browser sandbox storage limits are subject to HIPAA de-identification guidelines. Registering full clinical data requires a signed Business Associate Agreement (BAA).
            </div>

            {plan === "preview" && (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgradeSubmitted}
                className={`w-full py-2 border rounded font-mono uppercase tracking-widest text-[9px] transition-all ${
                  upgradeSubmitted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                }`}
              >
                {upgradeSubmitted ? "✓ Upgrade Request Queued" : "Upgrade to Clinical Enterprise"}
              </button>
            )}

            {upgradeSubmitted && (
              <div className="p-2.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-[9px] text-emerald-400 leading-relaxed font-sans animate-fade-in-up">
                💼 <strong>Workspace Upgrade Dispatched:</strong> A request to upgrade <em>{org.name}</em> to Clinical Enterprise has been queued for Substr8 BioResearch auditing. Ref ID: <span className="font-mono">FORGE-REQ-{(Math.random() * 10000).toFixed(0)}</span>.
              </div>
            )}
          </div>
        </div>

        {/* Security Capability Matrix */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5">
            Security Capability Matrix
          </h4>

          <div className="flex flex-col border border-slate-800/80 rounded-clinical overflow-hidden divide-y divide-slate-800/50 bg-slate-950/20 font-mono text-[10px]">
            {Object.keys(CAPABILITIES).map((capKey) => {
              const hasAccess = CAPABILITIES[capKey as keyof typeof CAPABILITIES].includes(user.role);
              return (
                <div key={capKey} className="flex items-center justify-between p-2.5 hover:bg-slate-900/30 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-white tracking-wide text-[10px]">{capKey}</span>
                    <span className="text-[9px] text-slate-500 font-sans">{capabilityLabels[capKey as keyof typeof CAPABILITIES]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider ${
                      hasAccess
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {hasAccess ? "Authorized" : "Gated"}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      hasAccess
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                        : "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}
