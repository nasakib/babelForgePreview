"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { useWindowContext } from "@/context/WindowContext";
import DraggablePanel from "@/components/palantir/DraggablePanel";
import { authClient } from "@/lib/auth/client";
import { PLAN_FEATURES, CAPABILITIES, Role, User } from "@/lib/auth/types";

type ProfileTab = "profile" | "staff" | "capabilities";

export default function ProfilePanel() {
  const { session, updateSession, allows } = useAuth();
  const { patients } = usePatient();
  const { updateWindow } = useWindowContext();

  const [profileTab, setProfileTab] = useState<ProfileTab>("profile");

  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Staff creation form states
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<Role>("clinician");
  const [staffList, setStaffList] = useState<User[]>([]);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState(false);

  // Dynamic staff invites state
  const [activeStaffInvites, setActiveStaffInvites] = useState<any[]>([]);

  useEffect(() => {
    if (session) {
      setActiveStaffInvites(authClient.listOrgInvites(session.org.id).filter((inv: any) => inv.role === "clinician" || inv.role === "researcher"));
    }
  }, [session]);

  const handleGenerateStaffInvite = (role: "clinician" | "researcher") => {
    if (!session) return;
    authClient.generateOrgInvite(session.org.id, role);
    setActiveStaffInvites(authClient.listOrgInvites(session.org.id).filter((inv: any) => inv.role === "clinician" || inv.role === "researcher"));
  };

  // Payment Gateway states (B2B Procurement Invoicing)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<typeof plan | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentLogs, setPaymentLogs] = useState<string[]>([]);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState("");

  // Synchronize state when session loads/updates
  useEffect(() => {
    if (session) {
      setName(session.user.name);
      setOrgName(session.org.name);
      // Load current workspace staff roster
      setStaffList(authClient.listStaff(session.org.id));
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

  const canManageStaff = allows("staff.write");
  const canManageOrg = allows("org.manage");

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

  const handleBaaToggle = async () => {
    if (!canManageOrg) return;
    try {
      await updateSession({
        baaSigned: !org.baaSigned,
      });
    } catch (err) {
      console.error("BAA update failed:", err);
    }
  };

  const handlePlanChange = async (nextPlan: typeof plan) => {
    if (!canManageOrg) return;
    if (nextPlan === "preview") {
      try {
        await updateSession({
          plan: nextPlan,
        });
      } catch (err) {
        console.error("Plan update failed:", err);
      }
    } else {
      setPendingPlan(nextPlan);
      setPoNumber("PO-" + org.name.replace(/\s+/g, "-").toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000));
      setBillingEmail(user.email);
      setBillingAddress("");
      setPaymentError("");
      setPaymentSuccess(false);
      setIsProcessingPayment(false);
      setPaymentLogs([]);
      setGeneratedInvoiceId("");
      setShowPaymentModal(true);
    }
  };

  const executePaymentMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPlan) return;
    setPaymentError("");
    
    if (!poNumber.trim()) {
      setPaymentError("VALIDATION ERROR: Purchase Order (PO) Number cannot be blank. Enter 'PENDING' if PO is in process.");
      return;
    }

    if (!billingEmail.trim()) {
      setPaymentError("VALIDATION ERROR: Billing Department Email is required.");
      return;
    }

    if (!billingAddress.trim()) {
      setPaymentError("VALIDATION ERROR: Billing Mailing Address is required for paper invoice routing.");
      return;
    }

    setIsProcessingPayment(true);
    
    const logs = [
      "Contacting B2B billing ledger registry...",
      "Validating Yamanaka Simulator licensing allocations...",
      "Generating institutional BAA compliance token...",
      "Registering cashier's check Net-30 payment agreement terms...",
      "Generating unique Invoice ID...",
      "B2B procurement invoice successfully registered under PENDING status!"
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setPaymentLogs(prev => [...prev, logs[i]]);
    }

    try {
      const invId = "INV-BF-2026-" + Math.floor(100000 + Math.random() * 900000);
      setGeneratedInvoiceId(invId);
      
      // Auto-upgrade session plan immediately while cashier's check is processing!
      await updateSession({
        plan: pendingPlan,
      });
      setPaymentSuccess(true);
    } catch (err: any) {
      setPaymentError(err.message || "Failed to upgrade license tier.");
      setIsProcessingPayment(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError("");
    setStaffSuccess(false);

    if (!staffName.trim() || !staffEmail.trim()) {
      setStaffError("Name and Security Email are required.");
      return;
    }

    try {
      await authClient.createStaffUser(org.id, {
        name: staffName.trim(),
        email: staffEmail.trim(),
        role: staffRole,
      });
      setStaffSuccess(true);
      setStaffName("");
      setStaffEmail("");
      setStaffRole("clinician");
      
      // Refresh list
      setStaffList(authClient.listStaff(org.id));
      setTimeout(() => setStaffSuccess(false), 3000);
    } catch (err: any) {
      setStaffError(err.message || "Failed to provision practitioner.");
    }
  };

  // Human-readable capability descriptions
  const capabilityLabels: Record<keyof typeof CAPABILITIES, string> = {
    "patient.read": "Read Patient cohort rosters & metadata",
    "patient.write": "Write / Modify Patient clinical records",
    "patient.export": "Export Patient datasets (JSON Blobs)",
    "patient.purge": "Hard-purge local databases",
    "billing.manage": "Manage subscription billing structures",
    "org.invite": "Invite clinical team practitioners",
    "org.manage": "Sign legal Business Associate Agreements",
    "staff.write": "Directly provision / add clinical staff",
    "staff.read": "Audit organization clinician rosters",
    "patient.self": "View & monitor own personal chart telemetry",
    "novice.lite": "Access simplified educational Sandbox views",
    "sim.run": "Solve Kuramoto oscillator simulations",
  };

  const roleNameMap: Record<Role, string> = {
    owner: "Clinic Owner & Admin",
    clinician: "Precision Clinician",
    researcher: "Neuroscience Researcher",
    viewer: "Regulatory Auditor",
    patient: "Patient Portal Access",
    novice: "Novice Portal Access",
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
      <div className="flex-1 flex flex-col overflow-hidden text-xs text-slate-300 font-sans h-full relative">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-[9px] font-mono uppercase tracking-widest text-center cursor-pointer select-none">
          <button
            type="button"
            onClick={() => setProfileTab("profile")}
            className={`flex-1 py-3 border-b-2 transition-all ${
              profileTab === "profile"
                ? "border-accent-500 text-white font-bold bg-accent-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            👤 Profile & Quota
          </button>
          
          {user.role === "owner" && (
            <button
              type="button"
              onClick={() => setProfileTab("staff")}
              className={`flex-1 py-3 border-b-2 transition-all ${
                profileTab === "staff"
                  ? "border-accent-500 text-white font-bold bg-accent-500/5"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              💼 Staff & Roster
            </button>
          )}

          <button
            type="button"
            onClick={() => setProfileTab("capabilities")}
            className={`flex-1 py-3 border-b-2 transition-all ${
              profileTab === "capabilities"
                ? "border-accent-500 text-white font-bold bg-accent-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            🛡️ Capabilities
          </button>
        </div>

        {/* Tab Body contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">

          {/* TAB 1: PROFILE & QUOTA */}
          {profileTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Practitioner Card */}
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

              {/* Profile Details Form */}
              <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Clinician Profile details</span>
                  {saveSuccess && (
                    <span className="text-emerald-400 lowercase tracking-normal flex items-center gap-1 font-sans animate-fade-in">
                      ✓ synced with registry
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

              {/* Quotas & Licensing */}
              {user.role === "novice" ? (
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5">
                    Novice Sandbox Preview
                  </h4>
                  <div className="p-4 rounded-clinical bg-cyan-950/20 border border-cyan-800/40 text-cyan-400 font-mono space-y-2 text-[10px] leading-relaxed uppercase">
                    <span className="font-bold text-white block">● Active Sandbox Workspace:</span>
                    🔓 Unlimited simulation trials enabled in Sandbox mode.<br />
                    🔒 Clinical features, HIPAA BAA registration, and staff roster provisioning are disabled.<br />
                    <span className="text-slate-500 text-[8.5px] font-sans normal-case block mt-2">
                      To explore medical rosters or full-scale multi-tenant networks, sign out and register with an institutional invite code.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Licensing, Quotas & BAA Controls</span>
                    {org.baaSigned ? (
                      <span className="text-[8px] text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1">
                        ● BAA ACTIVE
                      </span>
                    ) : (
                      <span className="text-[8px] text-rose-400 font-mono tracking-widest uppercase flex items-center gap-1 animate-pulse">
                        ● PHI RESTRICTED
                      </span>
                    )}
                  </h4>

                  <div className="p-4 rounded-clinical bg-slate-950/40 border border-slate-800/60 space-y-4">
                    {/* Utilization metrics */}
                    <div className="space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between items-baseline text-slate-400">
                        <span>Workspace Roster Space</span>
                        <span className="text-white font-bold">
                          {currentCount} / {limitCount === Infinity ? "∞" : limitCount} Patients
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
                    </div>

                    {/* Administrative licensing selectors (Owner only) */}
                    {canManageOrg ? (
                      <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-3">
                        
                        {/* Subscription tier */}
                        <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                          <label className="text-[9px] uppercase tracking-wider text-slate-400">Workspace License Tier</label>
                          <select
                            value={plan}
                            onChange={(e) => handlePlanChange(e.target.value as typeof plan)}
                            className="bg-slate-950 border border-slate-800/80 text-white rounded px-2 py-1 outline-none text-[10px] w-full"
                          >
                            <option value="preview">Research Preview (Max 5 patients)</option>
                            <option value="clinical">Standard Clinical (Max 250 patients)</option>
                            <option value="enterprise">Clinical Enterprise (Unlimited patients)</option>
                          </select>
                        </div>

                        {/* BAA execution */}
                        <label className="flex items-center gap-2.5 p-2.5 rounded bg-slate-950/40 border border-slate-800/60 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={org.baaSigned}
                            onChange={handleBaaToggle}
                            className="w-3.5 h-3.5 accent-accent-500 rounded border-slate-800"
                          />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-white">Sign Business Associate Agreement (BAA)</span>
                            <span className="text-[8px] text-slate-500 font-mono">Unlocks secure regulatory PHI patient intake controls.</span>
                          </div>
                        </label>

                      </div>
                    ) : (
                      <div className="text-[9px] font-mono text-slate-500 text-center leading-normal">
                        * License tier changes and HIPAA legal BAA execution require organization Owner administrative credentials.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: STAFF & ROSTER */}
          {profileTab === "staff" && user.role === "owner" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Add practitioner form */}
              {canManageStaff && (
                <form onSubmit={handleAddStaff} className="flex flex-col gap-3 p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-clinical">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Provision New Clinic Practitioner</span>
                    {staffSuccess && (
                      <span className="text-emerald-400 lowercase tracking-normal flex items-center gap-1 font-sans animate-fade-in">
                        ✓ clinician added successfully
                      </span>
                    )}
                  </h4>

                  {staffError && (
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-mono text-rose-400 uppercase">
                      ⚠️ ERROR: {staffError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono uppercase text-slate-500">Name</label>
                      <input
                        type="text"
                        value={staffName}
                        required
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Dr. John Carver"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 px-2 py-1"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono uppercase text-slate-500">Security Email</label>
                      <input
                        type="email"
                        value={staffEmail}
                        required
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="j.carver@unsc.gov"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 px-2 py-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-[9px] uppercase text-slate-500">Staff Role</span>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as Role)}
                        className="bg-slate-950 border border-slate-800/80 text-white rounded px-2.5 py-1 outline-none text-[9px]"
                      >
                        <option value="clinician">Standard Clinician (Doctor)</option>
                        <option value="researcher">Science Researcher</option>
                        <option value="viewer">Regulatory Auditor</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary py-1.5 px-4 bg-accent-600 hover:bg-accent-500 border-accent-400 text-white font-mono uppercase tracking-widest text-[9px] shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                    >
                      Provision staff
                    </button>
                  </div>
                </form>
              )}

              {/* Dynamic Practitioner Invites Generator */}
              <div className="flex flex-col gap-3 p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-clinical font-mono text-[10px]">
                <h4 className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                  <span>Practitioner Invite Link Generator</span>
                  <span className="text-[8px] text-cyan-400">ORG-CLINIC / ORG-RESEARCH</span>
                </h4>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateStaffInvite("clinician")}
                    className="flex-1 py-1.5 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 font-bold rounded uppercase tracking-wider text-[8.5px] transition-all animate-fade-in"
                  >
                    + Invite Clinician (Doctor)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateStaffInvite("researcher")}
                    className="flex-1 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-400 font-bold rounded uppercase tracking-wider text-[8.5px] transition-all animate-fade-in"
                  >
                    + Invite Researcher
                  </button>
                </div>

                {activeStaffInvites.length > 0 ? (
                  <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 border-t border-slate-800/60 pt-2">
                    {activeStaffInvites.map((inv) => (
                      <div key={inv.code} className="flex justify-between items-center bg-slate-950 p-2 border border-slate-800 rounded">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold tracking-widest uppercase">{inv.code}</span>
                          <span className="text-[8px] text-slate-500 capitalize">{inv.role} invite</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(inv.code);
                            alert(`COPIED CODE: ${inv.code}`);
                          }}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:text-white text-slate-400 rounded text-[8px] uppercase font-bold"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[8px] text-slate-500 text-center leading-normal italic">
                    No active practitioner invites generated yet.
                  </div>
                )}
              </div>

              {/* Roster list */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5">
                  Clinic Staff Roster Directory ({staffList.length} members)
                </h4>

                <div className="flex flex-col border border-slate-800/80 rounded-clinical overflow-hidden divide-y divide-slate-800/50 bg-slate-950/20 font-mono text-[10px]">
                  {staffList.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 hover:bg-slate-900/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-bold flex items-center justify-center select-none text-[10px]">
                          {s.initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-white truncate text-[11px]">{s.name}</span>
                          <span className="text-[8px] text-slate-500 truncate mt-0.5 normal-case">{s.email}</span>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] tracking-wider uppercase font-semibold border ${
                        s.role === "owner"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : s.role === "clinician"
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {s.role === "owner" ? "Admin" : s.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CAPABILITIES MATRIX */}
          {profileTab === "capabilities" && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1.5">
                Active Security Capability Registry
              </h4>

              <div className="flex flex-col border border-slate-800/80 rounded-clinical overflow-hidden divide-y divide-slate-800/50 bg-slate-950/20 font-mono text-[10px]">
                {Object.keys(CAPABILITIES).map((capKey) => {
                  const hasAccess = CAPABILITIES[capKey as keyof typeof CAPABILITIES].includes(user.role);
                  return (
                    <div key={capKey} className="flex items-center justify-between p-3 hover:bg-slate-900/30 transition-colors">
                      <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                        <span className="font-semibold text-white tracking-wide text-[10px]">{capKey}</span>
                        <span className="text-[9px] text-slate-500 font-sans truncate">{capabilityLabels[capKey as keyof typeof CAPABILITIES]}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
          )}

        </div>

        {/* PAYMENT MODAL OVERLAY (B2B INVOICE PROCUREMENT) */}
        {showPaymentModal && pendingPlan && (
          <div className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-xl p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar animate-fade-in select-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-[8px] font-mono text-accent-400 uppercase tracking-widest block">🔒 SECURE INSTITUTIONAL B2B PROCUREMENT GATEWAY</span>
                <h3 className="text-sm font-bold text-white tracking-wide">Procurement Invoice Request</h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment && !paymentSuccess}
                className="text-slate-500 hover:text-white text-xs font-mono disabled:opacity-30"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-center gap-4 py-4">
              
              {/* Order summary */}
              <div className="p-3 border border-slate-800 bg-slate-950/40 rounded-clinical font-mono text-[10px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Selected License Tier:</span>
                  <span className="text-white font-bold uppercase">{pendingPlan} Plan</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recurring Charge:</span>
                  <span className="text-accent-400 font-bold font-mono">
                    {pendingPlan === "clinical" ? "$149.00 / month" : "$499.00 / month"}
                  </span>
                </div>
                <div className="flex justify-between text-[8.5px] text-slate-500 border-t border-slate-900 pt-1">
                  <span>Payment Terms:</span>
                  <span className="text-slate-300 font-bold">NET 30 (Cashier's Check / ACH)</span>
                </div>
              </div>

              {/* B2B INVOICE RECEIPT DISPLAY (Once Generated) */}
              {paymentSuccess && generatedInvoiceId ? (
                <div className="flex-grow flex flex-col gap-3 p-4 border border-emerald-500/30 bg-emerald-950/10 rounded-clinical font-mono text-[9.5px] text-slate-300 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                    <span className="text-emerald-400 font-bold uppercase text-[10px]">✓ INVOICE REGISTERED & PROVISIONED</span>
                    <span className="text-white font-bold text-xs">{generatedInvoiceId}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 leading-relaxed">
                    <div>
                      <span className="text-[7.5px] text-slate-500 uppercase block">Billing Organization</span>
                      <span className="text-white font-bold">{org.name}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-slate-500 uppercase block">Purchase Order (PO)</span>
                      <span className="text-white font-bold">{poNumber}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-slate-500 uppercase block">Billing Email</span>
                      <span className="text-white font-bold truncate block">{billingEmail}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-slate-500 uppercase block">Billing Address</span>
                      <span className="text-white font-bold truncate block">{billingAddress}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 bg-slate-950/40 p-2.5 rounded border border-slate-900 leading-normal text-[9px]">
                    <strong className="text-white uppercase block mb-1">🏦 Cashier's Check Payment Instructions:</strong>
                    1. Make checks payable to: <strong className="text-emerald-400">Najmos Sakib</strong><br />
                    2. Mail check to: <strong className="text-emerald-400">Najmos Sakib, Connectome Treasury (Mailing address provided in your invoice email)</strong><br />
                    3. Important: Write the Invoice ID <strong className="text-white font-mono">{generatedInvoiceId}</strong> on the check memo line to secure license persistence.<br />
                    <span className="text-slate-500 block mt-1.5">* Net 30 terms apply. Sandbox boundaries have been fully upgraded and unlocked for instant workspace clinical access!</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPendingPlan(null);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded border border-emerald-400/30 text-center font-mono mt-1 text-[10px]"
                  >
                    Close & Enter Upgraded Workspace
                  </button>
                </div>
              ) : isProcessingPayment ? (
                /* PROCESSING TERMINAL */
                <div className="flex-1 flex flex-col justify-between p-4 border border-slate-800 bg-slate-950 rounded-clinical h-48 font-mono text-[9px] text-slate-400">
                  <div className="flex items-center gap-2 text-[10px] text-accent-400 animate-pulse border-b border-slate-900 pb-1.5 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-ping" />
                    GENERATING INVOICE...
                  </div>
                  <div className="flex-grow overflow-y-auto custom-scrollbar py-2 space-y-1 text-slate-500">
                    {paymentLogs.map((log, idx) => (
                      <div key={idx} className={idx === paymentLogs.length - 1 ? "text-cyan-400 font-bold" : ""}>
                        ▶ {log}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* INVOICE REGISTRY REQUEST FORM */
                <form onSubmit={executePaymentMock} className="flex flex-col gap-3 font-mono text-[9.5px]">
                  {paymentError && (
                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-[8.5px] font-mono text-rose-400 uppercase leading-relaxed">
                      ⚠️ ERROR: {paymentError}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                      <label className="text-[8px] uppercase text-slate-500 font-bold">Purchase Order (PO) Number</label>
                      <span className="text-[7.5px] text-slate-600">Enter 'PENDING' if PO in process</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                      placeholder="PO-UNSC-2026-X"
                      className="input-clinical w-full text-white bg-slate-950 border border-slate-800 px-2 py-1 text-[10px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase text-slate-500 font-bold">Institutional Billing Email</label>
                    <input
                      type="email"
                      required
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="finance@unsc.gov"
                      className="input-clinical w-full text-white bg-slate-950 border border-slate-800 px-2 py-1 text-[10px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase text-slate-500 font-bold">Billing Dept mailing Address</label>
                    <textarea
                      required
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      rows={2}
                      placeholder="UNSC ONI HQ, Treasury Wing, Reach"
                      className="input-clinical w-full text-white bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] resize-none"
                    />
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/40 border border-slate-800/40 text-slate-500 leading-normal text-[8.5px] uppercase">
                    🔒 Cashier's checks must be signed by authorized financial officers and referenced to unique Invoice IDs. Net 30 routing keys will lock workspace if check is not received by maturity date.
                  </div>

                  <button
                    type="submit"
                    className="btn-primary py-2.5 mt-2 bg-accent-600 hover:bg-accent-500 border-accent-400 text-white font-mono uppercase tracking-widest text-[9.5px] shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all"
                  >
                    Request B2B Invoice & Unlock Workspace
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </DraggablePanel>
  );
}
