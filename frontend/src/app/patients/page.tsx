"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import { patientStore } from "@/lib/patient/store";
import { authClient } from "@/lib/auth/client";
import { PLAN_FEATURES } from "@/lib/auth/types";
import HipaaNotice from "@/components/patient/HipaaNotice";
import {
  Patient,
  Sex,
  Gender,
  Handedness,
  PregnancyStatus,
  PathologyCode,
  Severity,
  CypPhenotype,
  ClinicalScales,
  Medication,
  PathologyEntry,
  AGE_RANGES,
  cypDoseMultiplier,
  phq9Band,
  gad7Band,
  PATHOLOGY_LABELS,
  SCALE_BOUNDS,
  bmi,
} from "@/lib/patient/types";

type FormTab = "demographics" | "vitals" | "diagnostics" | "scales" | "pgx";

export default function PatientsPage() {
  const { session, allows } = useAuth();
  const { patients, active, setActiveId, refresh } = usePatient();

  const [search, setSearch] = useState("");
  const [filterPathology, setFilterPathology] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FormTab>("demographics");

  // Load active Patient invite codes
  const [activeInvites, setActiveInvites] = useState<any[]>([]);

  useEffect(() => {
    if (session?.org.id && allows("staff.read")) {
      setActiveInvites(authClient.listOrgInvites(session.org.id).filter((inv: any) => inv.role === "patient"));
    }
  }, [session, allows]);

  const handleGeneratePatientInvite = () => {
    if (!session?.org.id) return;
    authClient.generateOrgInvite(session.org.id, "patient");
    setActiveInvites(authClient.listOrgInvites(session.org.id).filter((inv: any) => inv.role === "patient"));
  };

  // Form local state
  const [mrn, setMrn] = useState("");
  const [initials, setInitials] = useState("");
  const [ageRangeIndex, setAgeRangeIndex] = useState(3); // 35 - 44 default
  const [sex, setSex] = useState<Sex>("unspecified");
  const [gender, setGender] = useState<Gender>("prefer_not_to_say");
  const [handedness, setHandedness] = useState<Handedness>("right");
  const [pregnancy, setPregnancy] = useState<PregnancyStatus>("not_applicable");
  const [weightKg, setWeightKg] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");

  // Allergies
  const [allergiesText, setAllergiesText] = useState("");

  // Vitals
  const [heartRate, setHeartRate] = useState<string>("");
  const [bpSystolic, setBpSystolic] = useState<string>("");
  const [bpDiastolic, setBpDiastolic] = useState<string>("");
  const [sleepHours, setSleepHours] = useState<string>("");

  // Medications
  const [meds, setMeds] = useState<Medication[]>([]);
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medSchedule, setMedSchedule] = useState("QD");

  // Diagnostics
  const [activePathologyCodes, setActivePathologyCodes] = useState<PathologyCode[]>([]);
  const [pathologyDetails, setPathologyDetails] = useState<Record<PathologyCode, Omit<PathologyEntry, "code">>>({
    PTSD: { severity: "moderate", onsetYear: new Date().getFullYear(), priorResponse: 1 },
    ADHD: { severity: "moderate", onsetYear: new Date().getFullYear(), priorResponse: 1 },
    TOURETTES: { severity: "moderate", onsetYear: new Date().getFullYear(), priorResponse: 1 },
    DEPRESSION: { severity: "moderate", onsetYear: new Date().getFullYear(), priorResponse: 1 },
  });

  // Clinical Scales
  const [phq9, setPhq9] = useState<string>("");
  const [gad7, setGad7] = useState<string>("");
  const [moca, setMoca] = useState<string>("");
  const [pcl5, setPcl5] = useState<string>("");
  const [asrs, setAsrs] = useState<string>("");
  const [ygtss, setYgtss] = useState<string>("");
  const [auditc, setAuditc] = useState<string>("");

  // Pharmacogenomics (PGx)
  const [cyp2d6, setCyp2d6] = useState<CypPhenotype>("unknown");
  const [cyp2c19, setCyp2c19] = useState<CypPhenotype>("unknown");
  const [cyp3a4, setCyp3a4] = useState<CypPhenotype>("unknown");
  const [hlaB1502, setHlaB1502] = useState(false);
  const [hlaB5701, setHlaB5701] = useState(false);

  // Search/filter scoping
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        p.initials.toLowerCase().includes(search.toLowerCase()) ||
        p.mrn.toLowerCase().includes(search.toLowerCase()) ||
        (p.region && p.region.toLowerCase().includes(search.toLowerCase()));

      const matchPathology =
        filterPathology === "ALL" ||
        p.pathologies.some((path) => path.code === filterPathology);

      return matchSearch && matchPathology;
    });
  }, [patients, search, filterPathology]);

  const isPatientUser = session?.user.role === "patient";
  const patientData = useMemo(() => {
    if (!isPatientUser) return null;
    return patients.find(
      (p) => 
        p.mrn === "SPARTAN-117" || 
        p.initials === session?.user.initials
    ) || null;
  }, [patients, isPatientUser, session?.user.initials]);

  if (!session) {
    return null;
  }

  const orgId = session.org.id;
  const plan = session.org.plan;
  const isOwner = session.user.role === "owner";
  const canWrite = allows("patient.write");
  const canExport = allows("patient.export");
  const canPurge = allows("patient.purge");

  const planLimits = PLAN_FEATURES[plan];
  const limitCount = planLimits.maxPatients;

  if (session.user.role === "novice") {
    return <NoviceLitePortal name={session.user.name} orgName={session.org.name} signOut={() => authClient.signOut()} />;
  }

  if (session.user.role === "patient") {
    return (
      <div className="flex-1 w-full bg-slate-950 flex flex-col font-sans relative overflow-hidden select-none p-4 md:p-6 lg:p-8">
        {/* Background Neon Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[160px] pointer-events-none translate-y-1/4 -translate-x-1/4" />
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />

        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col gap-6 relative z-10">
          
          {/* Header area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-0.5 animate-pulse">
                🛡️ SECURE REGULATORY MEDICAL PORTAL
              </div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                📋 Personal Health Registry Chart
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                  {session.org.name}
                </span>
              </h1>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-500">
              Biometric Link: SYNC-LOCKED
            </div>
          </div>

          {/* HIPAA notice banner */}
          <HipaaNotice defaultOpen={false} />

          {patientData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              
              {/* Left Column: Demographics & Vitals */}
              <div className="md:col-span-1 flex flex-col gap-6">
                
                {/* Biometrics Card */}
                <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-4 flex flex-col gap-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2">
                    De-Identified Profile
                  </h3>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-500 flex items-center justify-center text-white font-bold text-lg select-none shadow-[0_0_12px_rgba(6,182,212,0.2)] font-mono">
                      {patientData.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white font-mono">{patientData.mrn}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        {patientData.ageRange.min} - {patientData.ageRange.max} yr range
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 border border-slate-850 rounded-clinical p-3 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-500 uppercase">Sex / Gender</span>
                      <span className="text-white font-semibold truncate capitalize">{patientData.sex} / {patientData.gender}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-500 uppercase">Body Mass Index</span>
                      <span className="text-white font-semibold">30.0 kg/m²</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-500 uppercase">Weight</span>
                      <span className="text-white font-semibold">{patientData.weightKg} kg</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] text-slate-500 uppercase">Height</span>
                      <span className="text-white font-semibold">{patientData.heightCm} cm</span>
                    </div>
                    <div className="flex flex-col gap-0.5 col-span-2">
                      <span className="text-[8px] text-slate-500 uppercase">Regional Index</span>
                      <span className="text-white font-semibold truncate">{patientData.region}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals telemetry */}
                <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-4 flex flex-col gap-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2">
                    Resting Vitals
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex flex-col gap-1">
                      <span className="text-[8px] text-slate-500 uppercase">Heart Rate</span>
                      <span className="text-white font-bold text-sm">{patientData.vitals.heartRateBpm} BPM</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex flex-col gap-1">
                      <span className="text-[8px] text-slate-500 uppercase">Blood Pressure</span>
                      <span className="text-white font-bold text-sm">{patientData.vitals.bpSystolic}/{patientData.vitals.bpDiastolic}</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex flex-col gap-1 col-span-2">
                      <span className="text-[8px] text-slate-500 uppercase">Sleep Hours</span>
                      <span className="text-white font-bold text-xs">{patientData.vitals.sleepHours} hrs REST CYCLE</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Center & Right Column: Treatments & Diagnostics */}
              <div className="md:col-span-2 flex flex-col gap-6">
                
                {/* Recommendations & Regimen */}
                <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-5 flex flex-col gap-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2">
                    Prescribed Treatment Regimen & Clinician Notes
                  </h3>

                  <div className="flex flex-col gap-2.5 font-mono">
                    {patientData.medications.length === 0 ? (
                      <div className="text-slate-500 text-xs italic p-3 text-center border border-slate-800 rounded bg-slate-950/20">
                        No medications currently recommended by your practitioner.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {patientData.medications.map((m, idx) => (
                          <div key={idx} className="p-3 rounded bg-slate-950/50 border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.05)] flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-white">{m.name}</span>
                              <span className="text-[9px] text-slate-500 uppercase tracking-wide">prescribed {m.schedule || "QD"} schedule</span>
                            </div>
                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[9px] font-bold">
                              {m.doseMg ? `${m.doseMg}mg` : "Active"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-slate-800/60 pt-3">
                    <span className="text-[9px] font-mono uppercase text-slate-500">Treating Practitioner Notes (Dr. Catherine Halsey)</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded border border-slate-850 font-sans italic">
                      &ldquo;{patientData.notes}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Scales & Genomics Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* PHQ9 / GAD7 */}
                  <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-4 flex flex-col gap-4 font-mono">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2">
                      Clinical Scales Tracker
                    </h3>
                    
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="p-3 rounded bg-slate-950/40 border border-slate-850 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-500">PHQ-9 DEPRESSION SCORE</span>
                          <span className="text-amber-400 font-bold">{phq9Band(patientData.scales.phq9)}</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-lg font-bold text-white">{patientData.scales.phq9} / 27</span>
                          <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-amber-500" style={{ width: `${((patientData.scales.phq9 || 0)/27)*100}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded bg-slate-950/40 border border-slate-850 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-500">GAD-7 ANXIETY SCORE</span>
                          <span className="text-rose-400 font-bold">{gad7Band(patientData.scales.gad7)}</span>
                        </div>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-lg font-bold text-white">{patientData.scales.gad7} / 21</span>
                          <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-rose-500" style={{ width: `${((patientData.scales.gad7 || 0)/21)*100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Genomics CYP Card */}
                  <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-4 flex flex-col gap-4 font-mono">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2">
                      Genomics Card (CYP450)
                    </h3>

                    <div className="flex flex-col gap-2.5 text-xs">
                      {["cyp2d6", "cyp2c19"].map((geneKey) => {
                        const gene = geneKey.toUpperCase();
                        const pheno = patientData.pgx[geneKey as keyof typeof patientData.pgx] as CypPhenotype | undefined;
                        const multiplier = cypDoseMultiplier(pheno);
                        return (
                          <div key={geneKey} className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex items-center justify-between text-[11px]">
                            <div className="flex flex-col">
                              <span className="font-semibold text-white">{gene}</span>
                              <span className="text-[8px] text-slate-500 capitalize">{pheno} metabolizer</span>
                            </div>
                            <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[9px] font-bold">
                              {multiplier}x dose
                            </span>
                          </div>
                        );
                      })}

                      <div className="grid grid-cols-2 gap-2 text-[8px] uppercase tracking-wider border-t border-slate-800/80 pt-2 bg-slate-950/20 p-1.5 rounded">
                        <div className="text-slate-500 flex justify-between">
                          <span>HLA-B*15:02</span>
                          <span className="font-bold text-slate-400">NEG</span>
                        </div>
                        <div className="text-slate-500 flex justify-between">
                          <span>HLA-B*57:01</span>
                          <span className="font-bold text-slate-400">NEG</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-600 border border-dashed border-slate-800 rounded-clinical bg-slate-950/20">
              <span className="text-3xl mb-2 animate-pulse">📡</span>
              <h3 className="text-base font-semibold text-slate-400">Connecting Biometric Security Keys...</h3>
              <p className="max-w-md text-xs text-slate-500 font-mono leading-relaxed mt-1 uppercase tracking-wider">
                Syncing with UNSC clinic databases. Please wait while the local biometric parcellation matrix resolves...
              </p>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Open modal for new patient
  const openNewModal = () => {
    if (!canWrite) return;
    setEditPatientId(null);
    setMrn(`MRN-${Math.floor(1000 + Math.random() * 9000)}`);
    setInitials("");
    setAgeRangeIndex(3);
    setSex("unspecified");
    setGender("prefer_not_to_say");
    setHandedness("right");
    setPregnancy("not_applicable");
    setWeightKg("");
    setHeightCm("");
    setRegion("");
    setNotes("");
    setAllergiesText("");
    setHeartRate("");
    setBpSystolic("");
    setBpDiastolic("");
    setSleepHours("");
    setMeds([]);
    setMedName("");
    setMedDose("");
    setMedSchedule("QD");
    setActivePathologyCodes([]);
    setPhq9("");
    setGad7("");
    setMoca("");
    setPcl5("");
    setAsrs("");
    setYgtss("");
    setAuditc("");
    setCyp2d6("unknown");
    setCyp2c19("unknown");
    setCyp3a4("unknown");
    setHlaB1502(false);
    setHlaB5701(false);
    setActiveTab("demographics");
    setModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (p: Patient) => {
    if (!canWrite) return;
    setEditPatientId(p.id);
    setMrn(p.mrn);
    setInitials(p.initials);
    
    const idx = AGE_RANGES.findIndex(
      (r) => r.min === p.ageRange.min && r.max === p.ageRange.max
    );
    setAgeRangeIndex(idx >= 0 ? idx : 3);
    setSex(p.sex);
    setGender(p.gender);
    setHandedness(p.handedness);
    setPregnancy(p.pregnancy);
    setWeightKg(p.weightKg ? String(p.weightKg) : "");
    setHeightCm(p.heightCm ? String(p.heightCm) : "");
    setRegion(p.region || "");
    setNotes(p.notes || "");
    setAllergiesText(p.allergies.join(", "));

    // Vitals
    setHeartRate(p.vitals.heartRateBpm ? String(p.vitals.heartRateBpm) : "");
    setBpSystolic(p.vitals.bpSystolic ? String(p.vitals.bpSystolic) : "");
    setBpDiastolic(p.vitals.bpDiastolic ? String(p.vitals.bpDiastolic) : "");
    setSleepHours(p.vitals.sleepHours ? String(p.vitals.sleepHours) : "");

    // Meds
    setMeds(p.medications);
    setMedName("");
    setMedDose("");
    setMedSchedule("QD");

    // Pathologies
    const codes = p.pathologies.map((x) => x.code);
    setActivePathologyCodes(codes);
    const updatedDetails = { ...pathologyDetails };
    p.pathologies.forEach((x) => {
      updatedDetails[x.code] = {
        severity: x.severity,
        onsetYear: x.onsetYear ?? new Date().getFullYear(),
        priorResponse: x.priorResponse ?? 1,
      };
    });
    setPathologyDetails(updatedDetails);

    // Scales
    setPhq9(p.scales.phq9 !== undefined ? String(p.scales.phq9) : "");
    setGad7(p.scales.gad7 !== undefined ? String(p.scales.gad7) : "");
    setMoca(p.scales.moca !== undefined ? String(p.scales.moca) : "");
    setPcl5(p.scales.pcl5 !== undefined ? String(p.scales.pcl5) : "");
    setAsrs(p.scales.asrs !== undefined ? String(p.scales.asrs) : "");
    setYgtss(p.scales.ygtss !== undefined ? String(p.scales.ygtss) : "");
    setAuditc(p.scales.auditc !== undefined ? String(p.scales.auditc) : "");

    // PGx
    setCyp2d6(p.pgx.cyp2d6 || "unknown");
    setCyp2c19(p.pgx.cyp2c19 || "unknown");
    setCyp3a4(p.pgx.cyp3a4 || "unknown");
    setHlaB1502(!!p.pgx.hlaB1502);
    setHlaB5701(!!p.pgx.hlaB5701);

    setActiveTab("demographics");
    setModalOpen(true);
  };

  const handleAddMed = () => {
    if (!medName.trim()) return;
    const doseNum = medDose.trim() ? parseFloat(medDose) : undefined;
    setMeds([
      ...meds,
      {
        name: medName.trim(),
        doseMg: doseNum && !Number.isNaN(doseNum) ? doseNum : undefined,
        schedule: medSchedule,
      },
    ]);
    setMedName("");
    setMedDose("");
  };

  const handleRemoveMed = (idx: number) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handlePathologyToggle = (code: PathologyCode) => {
    setActivePathologyCodes((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initials.trim() || !mrn.trim()) {
      alert("Initials and Surrogate MRN are required.");
      return;
    }

    const patientAgeRange = AGE_RANGES[ageRangeIndex];
    
    // Parse weight/height
    const parseWeight = weightKg.trim() ? parseFloat(weightKg) : undefined;
    const parseHeight = heightCm.trim() ? parseFloat(heightCm) : undefined;

    // Parse Vitals
    const parsedVitals = {
      heartRateBpm: heartRate.trim() ? parseInt(heartRate, 10) : undefined,
      bpSystolic: bpSystolic.trim() ? parseInt(bpSystolic, 10) : undefined,
      bpDiastolic: bpDiastolic.trim() ? parseInt(bpDiastolic, 10) : undefined,
      sleepHours: sleepHours.trim() ? parseFloat(sleepHours) : undefined,
    };

    // Parse Scales
    const parseScaleVal = (valStr: string, min: number, max: number) => {
      if (!valStr.trim()) return undefined;
      const v = Math.round(parseFloat(valStr));
      return Number.isNaN(v) ? undefined : Math.max(min, Math.min(max, v));
    };

    const parsedScales: ClinicalScales = {
      phq9: parseScaleVal(phq9, ...SCALE_BOUNDS.phq9),
      gad7: parseScaleVal(gad7, ...SCALE_BOUNDS.gad7),
      pcl5: parseScaleVal(pcl5, ...SCALE_BOUNDS.pcl5),
      asrs: parseScaleVal(asrs, ...SCALE_BOUNDS.asrs),
      ygtss: parseScaleVal(ygtss, ...SCALE_BOUNDS.ygtss),
      auditc: parseScaleVal(auditc, ...SCALE_BOUNDS.auditc),
      moca: parseScaleVal(moca, ...SCALE_BOUNDS.moca),
    };

    // Build pathologies list
    const pathologies: PathologyEntry[] = activePathologyCodes.map((code) => ({
      code,
      severity: pathologyDetails[code].severity,
      onsetYear: pathologyDetails[code].onsetYear,
      priorResponse: pathologyDetails[code].priorResponse,
    }));

    const rawAllergies = allergiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const draft = {
      mrn: mrn.trim(),
      initials: initials.trim().toUpperCase(),
      ageRange: patientAgeRange,
      sex,
      gender,
      handedness,
      pregnancy,
      weightKg: parseWeight && !Number.isNaN(parseWeight) ? parseWeight : undefined,
      heightCm: parseHeight && !Number.isNaN(parseHeight) ? parseHeight : undefined,
      allergies: rawAllergies,
      medications: meds,
      region: region.trim() || undefined,
      notes: notes.trim() || undefined,
      pathologies,
      scales: parsedScales,
      pgx: {
        cyp2d6,
        cyp2c19,
        cyp3a4,
        hlaB1502,
        hlaB5701,
      },
      vitals: parsedVitals,
      clinician: session.user.initials,
    };

    if (editPatientId) {
      patientStore.update(orgId, editPatientId, draft);
    } else {
      // Check quota rules for Free preview
      if (plan === "preview" && patients.length >= PLAN_FEATURES.preview.maxPatients) {
        alert(
          `COHORT CAP REACHED: Your workspace is on the '${plan}' plan which restricts roster limits to ${PLAN_FEATURES.preview.maxPatients} profiles. Request a Clinical Enterprise upgrade inside your Clinician Settings Panel to activate high-capacity databases.`
        );
        return;
      }
      patientStore.create(orgId, draft);
    }

    setModalOpen(false);
    refresh();
  };

  const handleDelete = (id: string, initialsStr: string) => {
    if (!canWrite) return;
    if (confirm(`REGULATORY CONFIRMATION:\nAre you absolutely sure you want to permanently delete de-identified cohort profile '${initialsStr}'? This operation cannot be undone.`)) {
      patientStore.remove(orgId, id);
      refresh();
    }
  };

  const handleExport = () => {
    if (!canExport) return;
    const blob = patientStore.export(orgId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `babelforge-cohort-${orgId}-${session.org.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePurge = () => {
    if (!canPurge) return;
    if (
      confirm(
        "🚨 SECURE PURGE WARNING:\nThis will permanently destroy ALL patient records for this active organization in local storage. Are you absolutely certain you want to purge this database?"
      )
    ) {
      patientStore.purgeAll(orgId);
      refresh();
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col font-sans relative overflow-hidden select-none p-4 md:p-6 lg:p-8">
      {/* Background Neon Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[160px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none translate-y-1/4 -translate-x-1/4" />
      <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />

      {/* Screen Frame Content */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col gap-6 relative z-10">
        
        {/* Header telemetry area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent-400 mb-0.5">
              Active Organization Workspace / Clinic Scopes
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              📋 Patients Cohort Directory
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {session.org.name}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-widest">
            {canWrite && (
              <button
                onClick={openNewModal}
                className="px-3.5 py-2 rounded-clinical bg-accent-600 hover:bg-accent-500 border border-accent-400 hover:border-accent-300 text-white font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] flex items-center gap-1.5"
              >
                ➕ Add Cohort Profile
              </button>
            )}
            
            {canExport && (
              <button
                onClick={handleExport}
                className="px-3.5 py-2 rounded-clinical bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                📤 Export Dataset
              </button>
            )}

            {canPurge && isOwner && (
              <button
                onClick={handlePurge}
                className="px-3.5 py-2 rounded-clinical bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 transition-colors"
              >
                ⚠️ Purge local Database
              </button>
            )}
          </div>
        </div>

        {/* HIPAA notice banner */}
        <HipaaNotice defaultOpen={true} />

        {/* Workspace core layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
          
          {/* Left panel: searches & patient roster list */}
          <div className="lg:col-span-1.5 bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-4 flex flex-col gap-4 overflow-hidden">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2">
              Cohort Roster Search ({filteredPatients.length} profiles)
            </h3>

            {/* Search Input block */}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search MRN, Initials, ZIP..."
                className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
              />

              {/* Pathology filter */}
              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                <select
                  value={filterPathology}
                  onChange={(e) => setFilterPathology(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 rounded px-2 py-1 select-clinical outline-none"
                >
                  <option value="ALL">All Diagnoses</option>
                  <option value="DEPRESSION">Depression</option>
                  <option value="PTSD">PTSD</option>
                  <option value="ADHD">ADHD</option>
                  <option value="TOURETTES">Tourettes</option>
                </select>
                
                <div className="flex items-center justify-end text-slate-500">
                  Plan Limit: {patients.length} / {limitCount === Infinity ? "∞" : limitCount}
                </div>
              </div>
            </div>

            {/* Patients scrolling list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1">
              {filteredPatients.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-600 border border-dashed border-slate-800 rounded-clinical">
                  <span className="text-xl mb-1">📭</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest leading-relaxed">
                    No de-identified cohort profiles found in active workspace.
                  </span>
                </div>
              ) : (
                filteredPatients.map((p) => {
                  const isActivePatient = active?.id === p.id;
                  const patientBmi = bmi({ weightKg: p.weightKg, heightCm: p.heightCm });
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      className={`group relative p-3 rounded-clinical border transition-all cursor-pointer flex flex-col gap-2 ${
                        isActivePatient
                          ? "bg-accent-500/10 border-accent-500/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                          : "bg-slate-950/40 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Initials Circle */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border tracking-wider flex-shrink-0 select-none ${
                            isActivePatient
                              ? "bg-accent-500/25 border-accent-400 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-300"
                          }`}>
                            {p.initials}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-semibold text-white font-mono">{p.mrn}</span>
                              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">
                                {p.ageRange.min}–{p.ageRange.max} yr
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate capitalize mt-0.5">
                              {p.sex} • {p.gender}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {canWrite && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(p);
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                              title="Edit Profile"
                            >
                              ✏️
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id, p.initials);
                              }}
                              className="p-1 hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Patient"
                            >
                               ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pathology pills */}
                      {p.pathologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.pathologies.map((path) => (
                            <span
                              key={path.code}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                                path.severity === "severe"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : path.severity === "moderate"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {path.code} ({path.severity[0]})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Active sync indicator */}
                      {isActivePatient && (
                        <div className="absolute right-2 bottom-2 text-[8px] font-mono text-accent-400 tracking-widest flex items-center gap-1 uppercase select-none">
                          <span className="w-1 h-1 rounded-full bg-accent-400 animate-ping" />
                          synchronized
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Cohort Patient Registration Invites generator (Clinicians / Researchers / Owners) */}
            {allows("staff.read") && (
              <div className="border-t border-slate-800/80 pt-4 mt-2 flex flex-col gap-3 font-mono text-[10px]">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800/40 pb-1.5 flex items-center justify-between">
                  <span>Patient Intake Invites</span>
                  <span className="text-[8px] text-accent-400 font-bold tracking-widest">SECURE PORTAL</span>
                </h4>
                <p className="text-[9px] text-slate-500 leading-normal uppercase">
                  Generate organization-tied codes to invite de-identified patient subjects securely.
                </p>

                <button
                  onClick={handleGeneratePatientInvite}
                  className="w-full py-2 rounded bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/20 hover:border-accent-500/40 text-accent-400 font-mono uppercase text-[9px] font-bold tracking-widest transition-all"
                >
                  ➕ Generate Patient Invite Code
                </button>

                {activeInvites.length > 0 && (
                  <div className="flex flex-col border border-slate-850 rounded max-h-32 overflow-y-auto custom-scrollbar divide-y divide-slate-850 bg-slate-950/30">
                    {activeInvites.map((inv) => (
                      <div key={inv.code} className="flex justify-between items-center p-2 text-[9px]">
                        <span className="font-bold text-white tracking-widest select-all">{inv.code}</span>
                        <button
                          onClick={() => {
                            if (typeof navigator !== "undefined") {
                              navigator.clipboard.writeText(inv.code);
                              alert(`Invite Code ${inv.code} copied to clipboard!`);
                            }
                          }}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded text-[8px] uppercase tracking-wider font-mono"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: focus patient details card */}
          <div className="lg:col-span-2.5 bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            
            {active ? (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* Profile Focus Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg border border-accent-400/30 select-none shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                      {active.initials}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-base font-bold text-white font-mono">{active.mrn}</h2>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                          {active.ageRange.min}–{active.ageRange.max} yr range
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">
                        {active.sex} • {active.gender} • {active.handedness}-handed
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end text-right font-mono text-[9px] text-slate-500">
                    <div>CREATED: {new Date(active.createdAt).toLocaleDateString()}</div>
                    <div>UPDATED: {new Date(active.updatedAt).toLocaleDateString()}</div>
                    <div className="text-accent-400 mt-1 uppercase font-semibold">
                      Connected to Biophysical Engine
                    </div>
                  </div>
                </div>

                {/* Subsections grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Column 1: Diagnostics and Clinical Scales */}
                  <div className="flex flex-col gap-5">
                    
                    {/* Clinical Pathology list */}
                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
                        Active Neurological Pathologies
                      </h4>
                      {active.pathologies.length === 0 ? (
                        <div className="text-slate-500 text-xs italic">No current pathological deformations configured.</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {active.pathologies.map((path) => (
                            <div key={path.code} className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex items-center justify-between text-xs font-mono">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-white">{PATHOLOGY_LABELS[path.code]}</span>
                                <span className="text-[9px] text-slate-500">
                                  Onset Year: {path.onsetYear || "Unknown"} • Prior Response: {
                                    path.priorResponse === 2 ? "Remission" : path.priorResponse === 1 ? "Partial" : "Refractory"
                                  }
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                                path.severity === "severe"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : path.severity === "moderate"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}>
                                {path.severity}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vitals, Metrics & region */}
                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
                        Physical Vitals & Region de-ID
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 border border-slate-850 rounded-clinical p-3 font-mono">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-500 uppercase">Heart Rate</span>
                          <span className="text-white font-semibold">{active.vitals.heartRateBpm ? `${active.vitals.heartRateBpm} BPM` : "—"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-500 uppercase">Blood Pressure</span>
                          <span className="text-white font-semibold">
                            {active.vitals.bpSystolic && active.vitals.bpDiastolic
                              ? `${active.vitals.bpSystolic}/${active.vitals.bpDiastolic} mmHg`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-500 uppercase">Body Mass Index</span>
                          <span className="text-white font-semibold">
                            {bmi(active) ? `${bmi(active)} kg/m²` : "—"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-500 uppercase">Sleep Hours</span>
                          <span className="text-white font-semibold">{active.vitals.sleepHours ? `${active.vitals.sleepHours} hrs` : "—"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 col-span-2">
                          <span className="text-[9px] text-slate-500 uppercase">ZIP3 region surrogate</span>
                          <span className="text-white font-semibold truncate">{active.region || "—"}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Column 2: Pharmacogenomics (PGx) and Vitals/Meds */}
                  <div className="flex flex-col gap-5">
                    
                    {/* Pharmacogenomic Profiles */}
                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
                        Pharmacogenomic Phenotypes (CYP450)
                      </h4>
                      <div className="flex flex-col gap-2 text-xs font-mono">
                        {["cyp2d6", "cyp2c19", "cyp3a4"].map((geneKey) => {
                          const gene = geneKey.toUpperCase();
                          const pheno = active.pgx[geneKey as keyof typeof active.pgx] as CypPhenotype | undefined;
                          const multiplier = cypDoseMultiplier(pheno);
                          return (
                            <div key={geneKey} className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex items-center justify-between">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-white">{gene} Profile</span>
                                <span className="text-[9px] text-slate-500 capitalize">{pheno || "Unknown"} metabolizer</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-semibold border ${
                                multiplier < 1.0
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : multiplier > 1.0
                                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}>
                                {multiplier}x Dose Hint
                              </span>
                            </div>
                          );
                        })}

                        {/* HLA carriers */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] uppercase tracking-wider border-t border-slate-800/80 pt-2.5">
                          <div className={`p-2 rounded border flex items-center justify-between ${
                            active.pgx.hlaB1502 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-slate-950/20 border-slate-850 text-slate-500"
                          }`}>
                            <span>HLA-B*15:02</span>
                            <span className="font-bold">{active.pgx.hlaB1502 ? "CARRIER" : "NEGATIVE"}</span>
                          </div>
                          <div className={`p-2 rounded border flex items-center justify-between ${
                            active.pgx.hlaB5701 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-slate-950/20 border-slate-850 text-slate-500"
                          }`}>
                            <span>HLA-B*57:01</span>
                            <span className="font-bold">{active.pgx.hlaB5701 ? "CARRIER" : "NEGATIVE"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Clinical Instruments */}
                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
                        Standard Clinical Instruments
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                        <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex flex-col justify-between">
                          <span className="text-[9px] text-slate-500 uppercase">PHQ-9 Score</span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-bold text-white">{active.scales.phq9 ?? "—"}</span>
                            <span className="text-[8px] text-slate-400 font-sans">{phq9Band(active.scales.phq9)}</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex flex-col justify-between">
                          <span className="text-[9px] text-slate-500 uppercase">GAD-7 Score</span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-bold text-white">{active.scales.gad7 ?? "—"}</span>
                            <span className="text-[8px] text-slate-400 font-sans">{gad7Band(active.scales.gad7)}</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex flex-col justify-between">
                          <span className="text-[9px] text-slate-500 uppercase">MoCA Score</span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-bold text-white">{active.scales.moca ?? "—"}</span>
                            <span className="text-[8px] text-slate-500 uppercase">cognitive</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 flex flex-col justify-between">
                          <span className="text-[9px] text-slate-500 uppercase">PCL-5 Score</span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-bold text-white">{active.scales.pcl5 ?? "—"}</span>
                            <span className="text-[8px] text-slate-500 uppercase">PTSD scale</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Medications, allergies, clinical notes (full-width row) */}
                <div className="flex flex-col gap-5 border-t border-slate-850 pt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
                        Allergies & Concurrent Pharmacotherapy
                      </h4>
                      <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-clinical space-y-3 font-sans text-xs">
                        <div>
                          <span className="text-[9px] font-mono uppercase text-slate-500 block mb-0.5">Allergies</span>
                          <p className="text-white leading-relaxed">
                            {active.allergies.length > 0 ? active.allergies.join(", ") : "None reported."}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono uppercase text-slate-500 block mb-1">Active Medications</span>
                          {active.medications.length === 0 ? (
                            <p className="text-slate-500 italic">No current concurrent medications.</p>
                          ) : (
                            <div className="flex flex-col gap-1 text-[11px] font-mono">
                              {active.medications.map((m, idx) => (
                                <div key={idx} className="flex justify-between border-b border-slate-900 pb-1 last:border-b-0 text-slate-300">
                                  <span className="font-bold text-white">{m.name}</span>
                                  <span>{m.doseMg ? `${m.doseMg}mg` : ""} {m.schedule ? `(${m.schedule})` : ""}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
                        Clinician Remarks & Connectome Notes
                      </h4>
                      <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-clinical font-sans text-xs text-slate-300 min-h-[120px] leading-relaxed whitespace-pre-wrap">
                        {active.notes || "No clinical narrative notes on file."}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-600">
                <span className="text-4xl mb-3 animate-pulse">📡</span>
                <h3 className="text-base font-semibold text-slate-400">No Active Cohort Profile Selected</h3>
                <p className="max-w-sm text-xs text-slate-500 font-mono leading-relaxed mt-1 uppercase tracking-wider">
                  Select a de-identified clinician cohort profile on the left roster to synchronize the biophysical Kuramoto oscillator visualizer, active connectome modifiers, and stack builders.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* FULL COMPREHENSIVE MULTI-TAB MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="clinical-card w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] rounded-clinical overflow-hidden"
          >
            
            {/* Modal Header */}
            <div className="clinical-card-header bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-accent-400 block mb-0.5">
                  Secure Identity Form Gate
                </span>
                <h3 className="text-base font-bold text-white font-mono">
                  {editPatientId ? `Edit Cohort Profile [${initials}]` : "Register De-identified Cohort"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs navigation */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-[9px] font-mono uppercase tracking-widest text-center cursor-pointer">
              {(["demographics", "vitals", "diagnostics", "scales", "pgx"] as FormTab[]).map((tab) => {
                const labelMap: Record<FormTab, string> = {
                  demographics: "1. Demographics",
                  vitals: "2. Vitals & Meds",
                  diagnostics: "3. Diagnoses",
                  scales: "4. Scales",
                  pgx: "5. Genomics (PGx)",
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 border-b-2 transition-all ${
                      activeTab === tab
                        ? "border-accent-500 text-white font-bold bg-accent-500/5"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {labelMap[tab]}
                  </button>
                );
              })}
            </div>

            {/* Modal scrollable form contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-900 text-xs text-slate-300 space-y-5">
              
              {/* TAB 1: DEMOGRAPHICS */}
              {activeTab === "demographics" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        De-ID Initials (e.g. J.D.) *
                      </label>
                      <input
                        type="text"
                        value={initials}
                        required
                        onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 3))}
                        placeholder="K.Y."
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Internal Surrogate MRN *
                      </label>
                      <input
                        type="text"
                        value={mrn}
                        required
                        onChange={(e) => setMrn(e.target.value)}
                        placeholder="MRN-XXXX"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Age Range Scope
                      </label>
                      <select
                        value={ageRangeIndex}
                        onChange={(e) => setAgeRangeIndex(parseInt(e.target.value, 10))}
                        className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1.5 outline-none font-mono focus:border-accent-500 text-xs"
                      >
                        {AGE_RANGES.map((r, i) => (
                          <option key={i} value={i}>
                            {r.min} - {r.max} years
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Anatomical Sex
                      </label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value as Sex)}
                        className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1.5 outline-none font-mono focus:border-accent-500 text-xs"
                      >
                        <option value="unspecified">Unspecified</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="intersex">Intersex</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Identified Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                        className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1.5 outline-none font-mono focus:border-accent-500 text-xs text-slate-300"
                      >
                        <option value="prefer_not_to_say">Prefer Not To Say</option>
                        <option value="woman">Woman</option>
                        <option value="man">Man</option>
                        <option value="nonbinary">Nonbinary</option>
                        <option value="transgender_woman">Transgender Woman</option>
                        <option value="transgender_man">Transgender Man</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Handedness
                      </label>
                      <select
                        value={handedness}
                        onChange={(e) => setHandedness(e.target.value as Handedness)}
                        className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1.5 outline-none font-mono focus:border-accent-500 text-xs"
                      >
                        <option value="right">Right</option>
                        <option value="left">Left</option>
                        <option value="ambidextrous">Ambidextrous</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="70"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="175"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        Pregnancy Status
                      </label>
                      <select
                        value={pregnancy}
                        onChange={(e) => setPregnancy(e.target.value as PregnancyStatus)}
                        className="bg-slate-950 border border-slate-800 text-white rounded px-2.5 py-1.5 outline-none font-mono focus:border-accent-500 text-xs"
                      >
                        <option value="not_applicable">Not Applicable</option>
                        <option value="none">None</option>
                        <option value="pregnant">Pregnant</option>
                        <option value="lactating">Lactating</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                        ZIP3 Region Surrogate
                      </label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="100XX or London"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VITALS & MEDICATIONS */}
              {activeTab === "vitals" && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Physical Vitals block */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">HR (BPM)</label>
                      <input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        placeholder="72"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">BP Systolic</label>
                      <input
                        type="number"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        placeholder="120"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">BP Diastolic</label>
                      <input
                        type="number"
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(e.target.value)}
                        placeholder="80"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Sleep (Hrs)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        placeholder="7.5"
                        className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                      />
                    </div>
                  </div>

                  {/* Allergies list */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      Allergies (comma-separated, e.g. Penicillin, Sulfa)
                    </label>
                    <input
                      type="text"
                      value={allergiesText}
                      onChange={(e) => setAllergiesText(e.target.value)}
                      placeholder="e.g. penicillin, codeine, peanuts"
                      className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-1.5"
                    />
                  </div>

                  {/* Medications builder */}
                  <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      Add Concurrent Medication
                    </label>
                    
                    <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                      <input
                        type="text"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="Drug Name"
                        className="input-clinical col-span-2 text-white bg-slate-950/60 border border-slate-800 px-2 py-1.5"
                      />
                      <input
                        type="number"
                        value={medDose}
                        onChange={(e) => setMedDose(e.target.value)}
                        placeholder="Dose (mg)"
                        className="input-clinical text-white bg-slate-950/60 border border-slate-800 px-2 py-1.5"
                      />
                      <select
                        value={medSchedule}
                        onChange={(e) => setMedSchedule(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 select-clinical outline-none"
                      >
                        <option value="QD">QD (Daily)</option>
                        <option value="BID">BID (2x Daily)</option>
                        <option value="TID">TID (3x Daily)</option>
                        <option value="QID">QID (4x Daily)</option>
                        <option value="PRN">PRN (As Needed)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMed}
                      className="btn-primary py-1.5 self-end bg-slate-850 hover:bg-slate-800 border-slate-800 text-[10px] uppercase font-mono tracking-widest text-white transition-colors"
                    >
                      ➕ Append Medication
                    </button>

                    {/* Active Meds list table */}
                    {meds.length > 0 && (
                      <div className="flex flex-col border border-slate-800 rounded overflow-hidden mt-2 font-mono text-[10px]">
                        <div className="bg-slate-950 px-3 py-1.5 text-slate-500 flex justify-between border-b border-slate-800 uppercase tracking-widest text-[8px]">
                          <span>Active Regimen</span>
                          <span>Actions</span>
                        </div>
                        <div className="divide-y divide-slate-800">
                          {meds.map((m, idx) => (
                            <div key={idx} className="px-3 py-2 bg-slate-950/30 flex justify-between items-center text-slate-300">
                              <span>
                                <strong className="text-white">{m.name}</strong> — {m.doseMg ? `${m.doseMg}mg` : ""} ({m.schedule || "QD"})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMed(idx)}
                                className="text-rose-500 hover:text-rose-400 font-bold px-1.5"
                              >
                                remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DIAGNOSTICS */}
              {activeTab === "diagnostics" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-clinical text-[10px] leading-relaxed text-slate-400 font-sans">
                    💡 Check any active pathologies to apply anatomical clique de-formations on the connectome matrix.
                  </div>

                  <div className="flex flex-col gap-3 font-mono">
                    {(["DEPRESSION", "PTSD", "ADHD", "TOURETTES"] as PathologyCode[]).map((code) => {
                      const activeState = activePathologyCodes.includes(code);
                      return (
                        <div
                          key={code}
                          className={`p-3.5 border rounded-clinical transition-all flex flex-col gap-3 ${
                            activeState
                              ? "bg-slate-950/60 border-accent-500/40"
                              : "bg-slate-950/20 border-slate-850/60 hover:bg-slate-950/40"
                          }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer select-none text-xs font-semibold text-white">
                            <input
                              type="checkbox"
                              checked={activeState}
                              onChange={() => handlePathologyToggle(code)}
                              className="w-4 h-4 accent-accent-500 rounded border-slate-800"
                            />
                            <span>{PATHOLOGY_LABELS[code]} ({code})</span>
                          </label>

                          {activeState && (
                            <div className="grid grid-cols-3 gap-3 text-[10px] pl-7 animate-fade-in-up">
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">Severity</span>
                                <select
                                  value={pathologyDetails[code].severity}
                                  onChange={(e) =>
                                    setPathologyDetails({
                                      ...pathologyDetails,
                                      [code]: {
                                        ...pathologyDetails[code],
                                        severity: e.target.value as Severity,
                                      },
                                    })
                                  }
                                  className="bg-slate-950 border border-slate-800 text-white rounded p-1 outline-none text-[10px]"
                                >
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="severe">Severe</option>
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">Onset Year</span>
                                <input
                                  type="number"
                                  value={pathologyDetails[code].onsetYear || ""}
                                  onChange={(e) =>
                                    setPathologyDetails({
                                      ...pathologyDetails,
                                      [code]: {
                                        ...pathologyDetails[code],
                                        onsetYear: parseInt(e.target.value, 10),
                                      },
                                    })
                                  }
                                  className="input-clinical text-white bg-slate-950 border border-slate-800 p-1 text-[10px]"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-slate-500 uppercase">Prior Response</span>
                                <select
                                  value={pathologyDetails[code].priorResponse}
                                  onChange={(e) =>
                                    setPathologyDetails({
                                      ...pathologyDetails,
                                      [code]: {
                                        ...pathologyDetails[code],
                                        priorResponse: parseInt(e.target.value, 10) as 0 | 1 | 2,
                                      },
                                    })
                                  }
                                  className="bg-slate-950 border border-slate-800 text-white rounded p-1 outline-none text-[10px]"
                                >
                                  <option value={0}>0: Refractory</option>
                                  <option value={1}>1: Partial</option>
                                  <option value={2}>2: Remission</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: CLINICAL SCALES */}
              {activeTab === "scales" && (
                <div className="space-y-4 animate-fade-in font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 p-3 rounded bg-slate-950/40 border border-slate-850">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] uppercase tracking-wider text-slate-400">PHQ-9 Score (0-27)</label>
                        <span className="text-[8px] text-slate-500 font-sans">{phq9Band(phq9 ? parseInt(phq9, 10) : undefined)}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={27}
                        value={phq9}
                        onChange={(e) => setPhq9(e.target.value)}
                        placeholder="PHQ9"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 text-xs px-2 py-1 mt-1.5"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 p-3 rounded bg-slate-950/40 border border-slate-850">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] uppercase tracking-wider text-slate-400">GAD-7 Score (0-21)</label>
                        <span className="text-[8px] text-slate-500 font-sans">{gad7Band(gad7 ? parseInt(gad7, 10) : undefined)}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={21}
                        value={gad7}
                        onChange={(e) => setGad7(e.target.value)}
                        placeholder="GAD7"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 text-xs px-2 py-1 mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 p-2.5 rounded bg-slate-950/40 border border-slate-850">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400">MoCA (0-30)</label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={moca}
                        onChange={(e) => setMoca(e.target.value)}
                        placeholder="MoCA"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 text-xs px-2 py-1 mt-1"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 p-2.5 rounded bg-slate-950/40 border border-slate-850">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400">PCL-5 (0-80)</label>
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={pcl5}
                        onChange={(e) => setPcl5(e.target.value)}
                        placeholder="PCL5"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 text-xs px-2 py-1 mt-1"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 p-2.5 rounded bg-slate-950/40 border border-slate-850">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400">ASRS (0-24)</label>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={asrs}
                        onChange={(e) => setAsrs(e.target.value)}
                        placeholder="ASRS"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 text-xs px-2 py-1 mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 p-2.5 rounded bg-slate-950/40 border border-slate-850">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400">YGTSS (0-100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={ygtss}
                        onChange={(e) => setYgtss(e.target.value)}
                        placeholder="YGTSS"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 text-xs px-2 py-1 mt-1"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 p-2.5 rounded bg-slate-950/40 border border-slate-850">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400">AUDIT-C (0-12)</label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={auditc}
                        onChange={(e) => setAuditc(e.target.value)}
                        placeholder="AUDIT-C"
                        className="input-clinical w-full text-white bg-slate-950 border border-slate-800 text-xs px-2 py-1 mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PHARMACOGENOMICS (PGX) */}
              {activeTab === "pgx" && (
                <div className="space-y-4 animate-fade-in font-mono">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-clinical text-[10px] leading-relaxed text-slate-400 font-sans">
                    💡 CPIC phenotypes guide dosage heuristics. Multipliers show mock dosage adjustments.
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {["cyp2d6", "cyp2c19", "cyp3a4"].map((geneKey) => {
                      const gene = geneKey.toUpperCase();
                      const val = geneKey === "cyp2d6" ? cyp2d6 : geneKey === "cyp2c19" ? cyp2c19 : cyp3a4;
                      const setVal = geneKey === "cyp2d6" ? setCyp2d6 : geneKey === "cyp2c19" ? setCyp2c19 : setCyp3a4;
                      const multiplier = cypDoseMultiplier(val);
                      return (
                        <div key={geneKey} className="flex flex-col gap-1.5 p-3 rounded bg-slate-950/40 border border-slate-850 justify-between min-h-[100px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase text-slate-400">{gene}</span>
                            <span className="text-[8px] text-cyan-400 font-semibold">{multiplier}x Dose</span>
                          </div>
                          <select
                            value={val}
                            onChange={(e) => setVal(e.target.value as CypPhenotype)}
                            className="bg-slate-950 border border-slate-800 text-white rounded p-1 outline-none text-[10px] mt-1.5"
                          >
                            <option value="unknown">Unknown</option>
                            <option value="poor">Poor (0.5x)</option>
                            <option value="intermediate">Intm (0.75x)</option>
                            <option value="extensive">Normal (1.0x)</option>
                            <option value="ultrarapid">Ultra (1.5x)</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400">HLA carriers status</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2.5 p-3.5 rounded bg-slate-950/40 border border-slate-850 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hlaB1502}
                          onChange={(e) => setHlaB1502(e.target.checked)}
                          className="w-4 h-4 accent-accent-500 rounded border-slate-800"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white">HLA-B*15:02 Carrier</span>
                          <span className="text-[8px] text-slate-500">Associated with carbamazepine SJS toxicity risk</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2.5 p-3.5 rounded bg-slate-950/40 border border-slate-850 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hlaB5701}
                          onChange={(e) => setHlaB5701(e.target.checked)}
                          className="w-4 h-4 accent-accent-500 rounded border-slate-800"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white">HLA-B*57:01 Carrier</span>
                          <span className="text-[8px] text-slate-500">Associated with abacavir hypersensitivity risk</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks/Notes (shown under all tabs) */}
              <div className="flex flex-col gap-1.5 border-t border-slate-800/80 pt-4">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                  Clinician remarks & connectome simulation impressions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record connectome rigidities, specific drug response targets or trial timeline plans here..."
                  className="input-clinical w-full text-white bg-slate-950/60 border border-slate-800 focus:border-accent-500 text-xs px-2.5 py-2 min-h-[90px] font-sans resize-y outline-none"
                />
              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-clinical bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-clinical bg-accent-600 hover:bg-accent-500 border border-accent-400 text-white font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] uppercase tracking-wider"
              >
                {editPatientId ? "Save Cohort Profile" : "Register Cohort Profile"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

interface NoviceLitePortalProps {
  name: string;
  orgName: string;
  signOut: () => void;
}

function NoviceLitePortal({ name, orgName, signOut }: NoviceLitePortalProps) {
  const [arousal, setArousal] = useState(6);
  const [dampening, setDampening] = useState(2);
  const [selectedMolecule, setSelectedMolecule] = useState("zb");

  const rValue = 0.85 * (arousal / 10) * (1.0 - (dampening / 10));

  const getStatusDesc = (r: number) => {
    if (r >= 0.6) return "⚡ Hyper-Synchronous: Dynamic high-coupling focus. Perfect for rapid cognitive welds.";
    if (r >= 0.35) return "🟢 Optimal Coherence: Peak flexibility and homeostatic baseline active.";
    return "⚠️ Dissociated state: High fatigue or stress rigidities locked.";
  };

  const molecules = {
    zb: {
      name: "ZenBud™ (ZB-01)",
      class: "Novel Neuroplastogen",
      desc: "An advanced compound targeting parasympathetic stabilization. Direct action on M1 muscarinic pathways calms the brain's alarm circuits and prompts long-term synaptic repair.",
      cortexImpact: "Salience network hyper-alert drops by 45%. Myelination / synaptogenesis boosted by 35%."
    },
    sert: {
      name: "Sertraline (SSRI)",
      class: "Classic Antidepressant",
      desc: "Inhibits serotonin reuptake, gradually strengthening frontoparietal control loops over 2-6 weeks to alleviate depressive rumination.",
      cortexImpact: "Default-Mode Network hyperactivity reduced. Structural coherence restored."
    }
  };

  const mol = molecules[selectedMolecule as keyof typeof molecules];

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col font-sans relative overflow-hidden select-none p-4 md:p-6 lg:p-8">
      {/* Visual background glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[160px] pointer-events-none translate-y-1/4 -translate-x-1/4" />
      <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col gap-6 relative z-10">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-0.5 animate-pulse">
              🎓 NOVICE EDUCATIONAL SANDBOX PORTAL
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              🧠 Connectome Sandbox Explorer
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {orgName}
              </span>
            </h1>
          </div>
          <button 
            onClick={signOut}
            className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded text-[10px] font-mono uppercase tracking-wider"
          >
            Sign Out
          </button>
        </div>

        {/* Introduction */}
        <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-4 font-mono text-[10.5px] leading-relaxed text-slate-300">
          <p>
            Welcome to the <strong>babelForge Sandbox Explorer</strong>, {name}! 
            This portal is configured for novice practitioners to explore the fundamentals of brain coordinate engineering without requiring clinical credentials or invite codes. 
            All clinical cohort registry tools are gated; explore the dynamic neuro-simulators below to understand how brain networks lock in harmony!
          </p>
        </div>

        {/* Portal Core Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Box 1: Simplified fMRI Phase Coherence Simulator */}
          <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-5 flex flex-col gap-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
              Default Mode Phase Coherence (R)
            </h3>
            
            <div className="space-y-4 font-mono text-[10.5px]">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Brain Arousal Dial</span>
                  <span className="text-white font-bold">{arousal} / 10</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={arousal} 
                  onChange={(e) => setArousal(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Brain Calmness Dial</span>
                  <span className="text-white font-bold">{dampening} / 10</span>
                </div>
                <input 
                  type="range" min="0" max="9" value={dampening} 
                  onChange={(e) => setDampening(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Scoreboard display */}
            <div className="p-4 rounded-clinical bg-slate-950/60 border border-slate-850 flex flex-col gap-2 text-center mt-2 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Calculated Coherence Score</span>
              <span className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                {rValue.toFixed(4)}
              </span>
              <span className="text-[9.5px] text-slate-300 leading-normal mt-1">
                {getStatusDesc(rValue)}
              </span>
            </div>
          </div>

          {/* Box 2: Simplified Regimen Explorer */}
          <div className="bg-slate-900/60 border border-slate-850 backdrop-blur-xl rounded-clinical p-5 flex flex-col gap-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-300 border-b border-slate-800 pb-2">
              Substance Action Directory
            </h3>

            <div className="flex gap-2 font-mono text-[9px]">
              <button 
                onClick={() => setSelectedMolecule("zb")}
                className={`px-3 py-1.5 rounded transition ${selectedMolecule === "zb" ? "bg-accent-500/10 text-accent-400 border border-accent-500/20" : "bg-slate-950 border border-slate-850 text-slate-500"}`}
              >
                ZenBud™ (ZB-01)
              </button>
              <button 
                onClick={() => setSelectedMolecule("sert")}
                className={`px-3 py-1.5 rounded transition ${selectedMolecule === "sert" ? "bg-accent-500/10 text-accent-400 border border-accent-500/20" : "bg-slate-950 border border-slate-850 text-slate-500"}`}
              >
                Sertraline
              </button>
            </div>

            <div className="p-4 rounded bg-slate-950/40 border border-slate-850 space-y-3 font-mono text-[10.5px]">
              <div>
                <span className="text-[8px] text-slate-500 uppercase block">Substance Name / Class</span>
                <span className="text-white font-bold">{mol.name}</span>
                <span className="ml-2 text-[9px] text-accent-400 font-bold px-1.5 py-0.5 rounded bg-accent-500/5 border border-accent-500/20">{mol.class}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 uppercase block">Mechanism of Action</span>
                <p className="text-slate-300 leading-normal mt-0.5">{mol.desc}</p>
              </div>
              <div className="pt-2 border-t border-slate-900">
                <span className="text-[8px] text-emerald-400 uppercase block font-bold">Simulated Cortex Impact</span>
                <p className="text-emerald-300 font-bold leading-normal mt-0.5">{mol.cortexImpact}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Billing/Upgrade Info */}
        <div className="p-4 rounded bg-rose-500/5 border border-rose-500/10 text-center font-mono text-[9px] uppercase tracking-wider text-slate-500 mt-4 leading-normal">
          🔒 CLINICAL PATIENT COHORT INTAKE & COMPREHENSIVE RECEPTOR MATRIX BINDINGS GATED.<br />
          <span className="text-rose-400/70">Requires executing a Business Associate Agreement (BAA) and a clinical workspace subscription.</span>
        </div>

      </div>
    </div>
  );
}
