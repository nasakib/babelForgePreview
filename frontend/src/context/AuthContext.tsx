"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { authClient } from "@/lib/auth/client";
import { Session, AuthStatus, Capability, can, Role, Organization } from "@/lib/auth/types";

const CODE_ROLES: Record<string, Role> = {
  "ADMIN-CREATE-2026": "owner",
  "CLINIC-JOIN-2026": "clinician",
  "RESEARCH-JOIN-2026": "researcher",
  "AUDITOR-VIEW-2026": "viewer",
  "PATIENT-VIEW-2026": "patient",
};

const VALID_CODES = Object.keys(CODE_ROLES);

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  signIn: (input: Parameters<typeof authClient.signIn>[0]) => Promise<void>;
  signOut: () => Promise<void>;
  updateSession: (input: {
    name?: string;
    orgName?: string;
    plan?: Organization["plan"];
    baaSigned?: boolean;
  }) => Promise<void>;
  /** Convenience: capability check against the current role. */
  allows: (capability: Capability) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unknown");
  const [session, setSession] = useState<Session | null>(null);

  // Form states for AuthGate
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [name, setName] = useState("Dr. Catherine Elizabeth Halsey");
  const [email, setEmail] = useState("c.halsey@unsc.gov");
  const [orgName, setOrgName] = useState("UNSC ONI Section III");
  const [inviteCode, setInviteCode] = useState("ADMIN-CREATE-2026");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Registry organizations listing for staff dropdown
  const [registeredOrgs, setRegisteredOrgs] = useState<Organization[]>([]);

  const refresh = useCallback(() => {
    const s = authClient.getSession();
    setSession(s);
    setStatus(s ? "authenticated" : "anonymous");
    
    // Load clinics list for dropdown
    if (typeof window !== "undefined") {
      const clinics = authClient.listOrganizations();
      setRegisteredOrgs(clinics);
      // Auto-select first clinic as fallback
      if (clinics.length > 0) {
        setSelectedOrgId((prev) => prev || clinics[0].id);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    return authClient.subscribe(refresh);
  }, [refresh]);

  // Dynamically resolve role from active code input
  const cleanCode = inviteCode.trim().toUpperCase();
  
  // 1. Resolve standard codes
  let resolvedRole = CODE_ROLES[cleanCode] || null;
  let dynamicInviteOrgId: string | null = null;
  
  // 2. Resolve dynamic organization invite codes from client database
  if (!resolvedRole && cleanCode && typeof window !== "undefined") {
    const dynamicInv = authClient.validateOrgInvite(cleanCode);
    if (dynamicInv) {
      resolvedRole = dynamicInv.role;
      dynamicInviteOrgId = dynamicInv.orgId;
    }
  }

  // 3. Novice (no code required)
  const isNoviceSignup = !inviteCode.trim();

  const isPreFilledCode = cleanCode === "PATIENT-VIEW-2026" || cleanCode === "ADMIN-CREATE-2026";

  // Dynamic Halo character state pre-populator
  useEffect(() => {
    if (cleanCode === "PATIENT-VIEW-2026") {
      setName("John Spartan-117");
      setEmail("j.117@unsc.gov");
    } else if (cleanCode === "ADMIN-CREATE-2026") {
      setName("Dr. Catherine Elizabeth Halsey");
      setEmail("c.halsey@unsc.gov");
      setOrgName("UNSC ONI Section III");
    }
  }, [cleanCode]);

  // Auto-lock selectedOrgId when dynamic invite is verified
  useEffect(() => {
    if (dynamicInviteOrgId) {
      setSelectedOrgId(dynamicInviteOrgId);
    }
  }, [dynamicInviteOrgId]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (authTab === "register") {
      if (!name.trim() || !email.trim()) {
        setErrorMsg("Name and Email are required fields.");
        setLoading(false);
        return;
      }
      
      if (!isNoviceSignup && !resolvedRole) {
        setErrorMsg("INVALID AUTHENTICATION INVITE CODE. CONTACT CLINIC ADMINISTRATOR.");
        setLoading(false);
        return;
      }

      try {
        if (isNoviceSignup) {
          // Novice signup, joins Sandbox Workspace automatically
          await authClient.signIn({
            name: name.trim(),
            email: email.trim(),
            role: "novice",
            orgId: "org_sandbox",
          });
        } else if (resolvedRole === "owner") {
          // Admin registers a brand new organization
          if (!orgName.trim()) {
            setErrorMsg("A New Clinic / Organization Name is required to initialize workspace.");
            setLoading(false);
            return;
          }
          await authClient.signIn({
            name: name.trim(),
            email: email.trim(),
            orgName: orgName.trim(),
            role: "owner",
          });
        } else {
          // Doctor/staff joins an existing organization selected from dropdown (or locked invite)
          const targetOrgId = dynamicInviteOrgId || selectedOrgId;
          if (!targetOrgId) {
            setErrorMsg("A registered Clinic Workspace must be selected to join.");
            setLoading(false);
            return;
          }
          await authClient.signIn({
            name: name.trim(),
            email: email.trim(),
            role: resolvedRole!,
            orgId: targetOrgId,
          });
        }
        refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to establish secure session.");
      }
    } else {
      // Login mode - match email and connect session
      if (!name.trim() || !email.trim() || !selectedOrgId) {
        setErrorMsg("Name, Email, and Organization Selection are required to sync local keys.");
        setLoading(false);
        return;
      }
      try {
        const staff = authClient.listStaff(selectedOrgId);
        const match = staff.find(u => u.email.toLowerCase() === email.toLowerCase());
        const role = match ? match.role : "clinician";

        await authClient.signIn({
          name: name.trim(),
          email: email.trim(),
          role: role,
          orgId: selectedOrgId,
        });
        refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Authentication synclink failed.");
      }
    }
    setLoading(false);
  };

  const value: AuthContextValue = {
    status,
    session,
    signIn: async (input) => {
      await authClient.signIn(input);
      refresh();
    },
    signOut: async () => {
      await authClient.signOut();
      refresh();
    },
    updateSession: async (input) => {
      await authClient.updateSession(input);
      refresh();
    },
    allows: (capability) => can(session?.user.role, capability),
  };

  // 1. Initializing Security subsystem
  if (status === "unknown") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono text-[10px] tracking-widest uppercase select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-ping mb-3 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
        Initialising Security Subsystem...
      </div>
    );
  }

  // 2. AuthGate Lockdown Screen
  if (status === "anonymous") {
    const roleDescriptions: Record<Role, string> = {
      owner: "Clinic Owner & Admin: Registers a new clinic workspace. Holds full billing and clinician staff controls.",
      clinician: "Standard Clinician (Doctor): Joins an existing clinic workspace. Can add/modify patient records and run Kuramoto simulations.",
      researcher: "Science Investigator: Joins an existing clinic. Run connectome simulations, read de-identified rosters, no administrative controls.",
      viewer: "Regulatory Auditor: Joins a clinic workspace for read-only access. Auditing credentials only.",
      patient: "Patient Portal: Access your secure personal health chart, active clinical regimens, and diagnostics.",
      novice: "Novice Portal: Educational and sandbox access. Simplified views and wellness sliders, no codes required."
    };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 p-4 select-none overflow-y-auto custom-scrollbar relative">
        {/* Sleek cybernetic background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />

        <div className="w-full max-w-[460px] bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-clinical shadow-2xl p-6 sm:p-8 flex flex-col gap-5 relative z-10 animate-fade-in-up">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-1.5">
            <svg className="w-10 h-10 text-accent-500 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h1 className="text-2xl font-bold font-sans tracking-tight text-white mt-1">babelForge</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest2 text-accent-400">
              Topological Neuro-Simulation Platform
            </p>
          </div>

          {/* Form Tabs */}
          <div className="flex border-b border-slate-800 font-mono text-[10px] uppercase tracking-widest text-center">
            <button
              onClick={() => { setAuthTab("register"); setErrorMsg(""); }}
              className={`flex-1 pb-2 border-b-2 transition-all ${authTab === "register" ? "border-accent-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Register Workspace
            </button>
            <button
              onClick={() => { setAuthTab("login"); setErrorMsg(""); }}
              className={`flex-1 pb-2 border-b-2 transition-all ${authTab === "login" ? "border-accent-500 text-white font-bold" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Access Session
            </button>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-clinical bg-yellow-500/5 border border-yellow-500/20 text-[10px] leading-relaxed text-yellow-200/90 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse mt-1" />
            <span>
              SECURE REGULATION ACCESS GATED. USER REGISTRATION BOUNDARIES REQUIRE EXPLICIT CLINICAL INVITE ROLES OR FREE NOVICE SIGNUP.
            </span>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 text-xs font-sans">
            {errorMsg && (
              <div className="p-3 rounded-clinical bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono leading-relaxed text-rose-400 uppercase tracking-wide">
                ⚠️ ERROR: {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                type="text"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                disabled={isPreFilledCode}
                placeholder="Dr. Catherine Elizabeth Halsey"
                className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800/80 focus:border-accent-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Security Email Address</label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPreFilledCode}
                placeholder="c.halsey@unsc.gov"
                className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800/80 focus:border-accent-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/30"
              />
            </div>

            {authTab === "register" && (
              <>
                <div className="flex flex-col gap-1.5 animate-fade-in-up">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">Quick-Select Demo Invite Code</label>
                  <select
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setErrorMsg("");
                    }}
                    value={VALID_CODES.includes(cleanCode) ? cleanCode : ""}
                    className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1.5 outline-none focus:border-accent-500 text-xs font-mono"
                  >
                    <option value="">Select a Demo Role / Custom Code...</option>
                    <option value="ADMIN-CREATE-2026">Dr. Halsey (Owner/Admin) [ADMIN-CREATE-2026]</option>
                    <option value="CLINIC-JOIN-2026">Clinician (Doctor) [CLINIC-JOIN-2026]</option>
                    <option value="RESEARCH-JOIN-2026">Science Researcher [RESEARCH-JOIN-2026]</option>
                    <option value="AUDITOR-VIEW-2026">Regulatory Auditor [AUDITOR-VIEW-2026]</option>
                    <option value="PATIENT-VIEW-2026">Master Chief (Patient Portal) [PATIENT-VIEW-2026]</option>
                    <option value="">Novice Sandbox Mode [Leave Blank]</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">Secure Signup Invite Code</label>
                    <span className="text-[8px] text-slate-500 font-mono">Leave blank for Novice Sandbox</span>
                  </div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="ADMIN-XXXX or CLINIC-XXXX"
                    className="input-clinical w-full text-white bg-slate-950/60 border border-rose-500/20 focus:border-accent-500 uppercase tracking-widest font-mono text-center"
                  />
                </div>

                {resolvedRole === "owner" ? (
                  /* Admin creating a new organization */
                  <div className="flex flex-col gap-1.5 animate-fade-in-up">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">New Clinic / Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      required
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={isPreFilledCode}
                      placeholder="UNSC ONI Section III"
                      className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800/80 focus:border-accent-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/30"
                    />
                  </div>
                ) : resolvedRole ? (
                  /* Doctors/staff joining an existing organization */
                  <div className="flex flex-col gap-1.5 animate-fade-in-up font-mono">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400">Select Clinical Workspace to Join</label>
                    <select
                      value={selectedOrgId}
                      required
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      disabled={!!dynamicInviteOrgId}
                      className="bg-slate-950 border border-slate-800/80 text-white rounded px-2.5 py-1.5 outline-none focus:border-accent-500 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {registeredOrgs.length === 0 ? (
                        <option value="">No Clinical Workspaces Registered yet.</option>
                      ) : (
                        registeredOrgs.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ) : isNoviceSignup ? (
                  /* Novice registration mode (No code) */
                  <div className="p-2.5 rounded bg-cyan-500/5 border border-cyan-500/20 text-[9px] font-mono text-cyan-400 leading-relaxed uppercase tracking-wider text-center animate-fade-in-up">
                    🔓 NOVICE PREVIEW MODE UNLOCKED - NO CODE REQUIRED.<br/>
                    <span className="text-slate-500 text-[8px]">Auto-routed to the Novice Sandbox Workspace.</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-slate-950/40 border border-slate-800/30 text-[9px] font-mono text-slate-500 leading-relaxed uppercase tracking-wider text-center">
                    Enter Invite Code to unlock Clinic Roster Options.
                  </div>
                )}

                {(resolvedRole || isNoviceSignup) && (
                  <div className="text-[9px] font-mono text-slate-500 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/30 animate-fade-in-up">
                    🔐 RESOLVED ROLE: <strong className="text-white uppercase">{resolvedRole || "novice"}</strong><br />
                    {dynamicInviteOrgId && (
                      <span className="text-cyan-400 font-bold block mb-1">
                        ● VERIFIED SECURE INVITE - LOCKED TO {registeredOrgs.find(o => o.id === dynamicInviteOrgId)?.name}
                      </span>
                    )}
                    {roleDescriptions[resolvedRole || "novice"]}
                  </div>
                )}
              </>
            )}

            {authTab === "login" && (
              <div className="flex flex-col gap-1.5 font-mono">
                <label className="text-[10px] uppercase tracking-wider text-slate-400">Select Workspace Clinic to Access</label>
                <select
                  value={selectedOrgId}
                  required
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 text-white rounded px-2.5 py-1.5 outline-none focus:border-accent-500 text-xs"
                >
                  {registeredOrgs.length === 0 ? (
                    <option value="">No Clinical Workspaces Registered yet.</option>
                  ) : (
                    registeredOrgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 bg-accent-600 hover:bg-accent-500 border-accent-400 text-white font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-40"
            >
              {loading ? "Establishing Link..." : (authTab === "register" ? "Initialise Workspace Session" : "Sync Local Session")}
            </button>

            <div className="text-[9px] font-sans text-slate-500 leading-normal text-center mt-1 p-2 bg-slate-950/40 border border-slate-800/40 rounded">
              ⚠️ <strong>Liability & Compliance:</strong> babelForge is a research-only platform. The user assumes 100% sole liability for HIPAA de-identification compliance. By initiating a session, you agree that you are solely responsible for ensuring no Protected Health Information (PHI) is entered or stored in this local sandbox.
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. Authenticated Access
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
