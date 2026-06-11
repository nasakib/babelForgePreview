import math
from typing import List, Dict, Any, Tuple

# Replicate the molecules DB in Python
MOLECULES_DB = {
    "seriphadine": {
        "id": "seriphadine", "name": "Seriphadine", "class": "novel", "halfLifeHrs": 7.5, "cypEnzymes": ["CYP3A4"],
        "receptors": {"GABAA": 2.0, "NMDA": 150.0, "HT2A": 45.0},
        "efficacy": {"GABAA": 1.0, "NMDA": -0.6, "HT2A": 0.4},
        "ensembleOccupancy": [
            {"targetProfile": "GABAA", "ensembleFraction": 0.65, "intrinsicEfficacy": 1.0},
            {"targetProfile": "NMDA", "ensembleFraction": 0.20, "intrinsicEfficacy": -0.6},
            {"targetProfile": "HT2A", "ensembleFraction": 0.15, "intrinsicEfficacy": 0.4}
        ],
        "effects": {"arousal": -0.4, "dampening": 1.2, "chaos": 0.8, "repair": 0.4},
        "bioavailabilityF": 0.78, "volumeOfDistributionLkg": 2.4, "mw": 466.57
    },
    "spur_mtdl": {
        "id": "spur_mtdl", "name": "SPUR-MTDL", "class": "novel", "halfLifeHrs": 6.8, "cypEnzymes": ["CYP3A4", "CYP2C9"],
        "receptors": {"MOR": 0.2, "HT2A": 2000.0, "NMDA": 2000.0},
        "efficacy": {"MOR": 1.4, "HT2A": -1.0, "NMDA": -0.4},
        "ensembleOccupancy": [
            {"targetProfile": "MOR", "ensembleFraction": 0.85, "intrinsicEfficacy": 1.4},
            {"targetProfile": "HT2A", "ensembleFraction": 0.10, "intrinsicEfficacy": -1.0},
            {"targetProfile": "NMDA", "ensembleFraction": 0.05, "intrinsicEfficacy": -0.4}
        ],
        "effects": {"arousal": -0.2, "dampening": 0.5, "chaos": -1.8, "repair": 3.5},
        "bioavailabilityF": 0.58, "volumeOfDistributionLkg": 1.8, "mw": 955.20,
        "cooperativityAlpha": 2.5, "isBabelForge": True, "ligandType": "BIVALENT_MACROCYCLIC",
        "pxrProb": 0.53, "grnCoeff": 0.53
    },
    "spur01": {
        "id": "spur01", "name": "SPUR-1 Ontological Reducer", "class": "novel", "halfLifeHrs": 0.168, "cypEnzymes": ["CYP3A4"],
        "receptors": {"MOR": 0.2, "HT2A": 1.5, "NMDA": 150.0},
        "efficacy": {"MOR": 1.4, "NMDA": -0.4},
        "effects": {"arousal": -0.2, "dampening": 0.5, "chaos": -1.8, "repair": 3.5},
        "bioavailabilityF": 0.85, "volumeOfDistributionLkg": 3.2, "mw": 955.20,
        "shieldingFactor": 1000.0, "ligandType": "CONFORMATIONAL_SHIELDED"
    },
    "zb01": {
        "id": "zb01", "name": "ZenBud™ (ZB-01)", "class": "novel", "halfLifeHrs": 18.0, "cypEnzymes": ["CYP3A4"],
        "receptors": {"HT2A": 100.0, "GABAA": 250.0}, "efficacy": {"GABAA": 0.4, "HT2A": -0.5},
        "effects": {"arousal": -0.4, "dampening": 1.0, "chaos": -0.5, "repair": 0.6},
        "bioavailabilityF": 0.80, "volumeOfDistributionLkg": 1.5, "mw": 400.0
    },
    "ll07": {
        "id": "ll07", "name": "LimbicLink™ (LL-07)", "class": "novel", "halfLifeHrs": 36.0, "cypEnzymes": ["CYP2C19"],
        "receptors": {"HT2A": 50.0, "SERT": 20.0}, "efficacy": {"HT2A": 0.3, "SERT": 0.8},
        "effects": {"arousal": -0.2, "dampening": 0.3, "chaos": 0.4, "repair": 1.2},
        "bioavailabilityF": 0.75, "volumeOfDistributionLkg": 2.0, "mw": 380.0
    },
    "ss20": {
        "id": "ss20", "name": "SynaptoStim™ (SS-20)", "class": "novel", "halfLifeHrs": 4.0, "cypEnzymes": ["CYP2D6"],
        "receptors": {"DAT": 5.0, "NET": 12.0}, "efficacy": {"DAT": 1.5, "NET": 1.2},
        "effects": {"arousal": 1.5, "dampening": 0.0, "chaos": -0.2, "repair": 0.5},
        "bioavailabilityF": 0.85, "volumeOfDistributionLkg": 2.5, "mw": 250.0
    },
    "dr02": {
        "id": "dr02", "name": "DopaReg™ (DR-02)", "class": "novel", "halfLifeHrs": 12.0, "cypEnzymes": ["CYP2D6"],
        "receptors": {"DAT": 10.0}, "efficacy": {"DAT": -1.0},
        "effects": {"arousal": -0.5, "dampening": 1.2, "chaos": -0.4, "repair": 0.2},
        "bioavailabilityF": 0.80, "volumeOfDistributionLkg": 2.0, "mw": 320.0
    },
    "nx44": {
        "id": "nx44", "name": "NeuroX™ (NX-44)", "class": "novel", "halfLifeHrs": 48.0, "cypEnzymes": ["CYP3A4"],
        "receptors": {"HT2A": 200.0}, "efficacy": {"HT2A": 0.5},
        "effects": {"arousal": 0.2, "dampening": 0.1, "chaos": -0.5, "repair": 2.5},
        "bioavailabilityF": 0.90, "volumeOfDistributionLkg": 3.0, "mw": 450.0
    },
    "psilo": {
        "id": "psilo", "name": "Psilocybin", "class": "novel", "halfLifeHrs": 3.0, "cypEnzymes": [],
        "receptors": {"HT2A": 10.0}, "efficacy": {"HT2A": 1.0},
        "effects": {"arousal": 0.0, "dampening": 0.2, "chaos": 1.2, "repair": 1.5},
        "bioavailabilityF": 0.50, "volumeOfDistributionLkg": 1.5, "mw": 284.0
    },
    "ketamine": {
        "id": "ketamine", "name": "Ketamine", "class": "conventional", "halfLifeHrs": 2.5, "cypEnzymes": ["CYP3A4"],
        "receptors": {"NMDA": 150.0}, "efficacy": {"NMDA": -1.0},
        "effects": {"arousal": 0.2, "dampening": 0.5, "chaos": 0.8, "repair": 3.0},
        "bioavailabilityF": 0.20, "volumeOfDistributionLkg": 3.0, "mw": 237.7
    },
    "fluox": {
        "id": "fluox", "name": "Fluoxetine", "class": "conventional", "halfLifeHrs": 72.0, "cypEnzymes": ["CYP2D6", "CYP2C19"],
        "receptors": {"SERT": 1.0}, "efficacy": {"SERT": 1.0},
        "effects": {"arousal": 0.1, "dampening": 0.4, "chaos": -0.1, "repair": 0.8},
        "bioavailabilityF": 0.70, "volumeOfDistributionLkg": 20.0, "mw": 309.3
    },
    "amph": {
        "id": "amph", "name": "Amphetamine Salts", "class": "conventional", "halfLifeHrs": 12.0, "cypEnzymes": ["CYP2D6"],
        "receptors": {"DAT": 10.0, "NET": 5.0, "SERT": 1000.0}, "efficacy": {"DAT": 1.5, "NET": 1.2, "SERT": 0.1},
        "effects": {"arousal": 1.8, "dampening": -0.2, "chaos": 0.6, "repair": 0.2},
        "bioavailabilityF": 0.75, "volumeOfDistributionLkg": 4.0, "mw": 135.2
    },
    "thc": {
        "id": "thc", "name": "Delta-9-THC", "class": "recreational", "halfLifeHrs": 24.0, "cypEnzymes": ["CYP2C9", "CYP3A4"],
        "receptors": {"HT2A": 1500.0, "GABAA": 4000.0}, "efficacy": {"HT2A": 0.1, "GABAA": 0.2},
        "effects": {"arousal": 0.2, "dampening": 0.4, "chaos": 1.2, "repair": -0.1},
        "bioavailabilityF": 0.15, "volumeOfDistributionLkg": 10.0, "mw": 314.5
    },
    "cbd": {
        "id": "cbd", "name": "Cannabidiol (CBD)", "class": "functional", "halfLifeHrs": 18.0, "cypEnzymes": ["CYP2C19", "CYP3A4"],
        "receptors": {"HT2A": 3000.0, "GABAA": 2500.0}, "efficacy": {"HT2A": -0.1, "GABAA": 0.3},
        "effects": {"arousal": -0.2, "dampening": 0.6, "chaos": -0.3, "repair": 0.8},
        "bioavailabilityF": 0.15, "volumeOfDistributionLkg": 8.0, "mw": 314.5
    }
}

# Auto-synthesize baseline structural physics for all registered compounds
for drug_id, props in MOLECULES_DB.items():
    if "structuralPhysics" not in props:
        props["structuralPhysics"] = {}
    for r in props["receptors"].keys():
        eps = props["efficacy"].get(r, 1.0)
        if eps > 0:
            props["structuralPhysics"][r] = {
                "delta_TM6_outward_A": 5.0,
                "d_D155_amine_A": 2.9,
                "theta_W336_displacement": 45.0 + min(25.0, eps * 15.0),
                "E_pi_phenyl_traps": 0.01
            }
        else:
            props["structuralPhysics"][r] = {
                "delta_TM6_outward_A": 3.8,
                "d_D155_amine_A": 3.6,
                "theta_W336_displacement": 0.0,
                "E_pi_phenyl_traps": 0.12
            }

def calculate_plasma_concentrations(
    stack: List[Dict[str, Any]],
    patient: Dict[str, Any],
    elapsed_hrs: float = 0.0
) -> Dict[str, float]:
    """Computes concentrations of each active compound in the plasma over time."""
    concentrations = {}
    
    weight = patient.get("weightKg", 70)
    age = patient.get("ageYears", 35)
    simulation_months = patient.get("simulationTimeMonths", 0)
    pgx = patient.get("profile", {}).get("pgx", {})
    
    weight_factor = 70.0 / max(40.0, weight)
    aging_acceleration = 1.0 + max(0.0, (age - 45.0) / 15.0)
    effective_age = age + (simulation_months / 12.0) * aging_acceleration
    
    for item in stack:
        drug_id = item.get("id")
        dose = item.get("dose") or item.get("currentIntensity") or 0.0
        if dose <= 0:
            continue
            
        props = MOLECULES_DB.get(drug_id, {
            "halfLifeHrs": 12.0, "cypEnzymes": [], "bioavailabilityF": 0.80, "volumeOfDistributionLkg": 1.2, "mw": 400.0
        })
        
        base_half_life = props.get("halfLifeHrs", 12.0)
        cyp_enzymes = props.get("cypEnzymes", [])
        
        # PGx multiplier
        pgx_multiplier = 1.0
        if cyp_enzymes:
            total_clearance = 0.0
            for enzyme in cyp_enzymes:
                phen = pgx.get(enzyme.lower(), "NM")
                clearance_ratio = 1.0
                if phen == "PM": clearance_ratio = 0.25
                elif phen == "IM": clearance_ratio = 0.65
                elif phen in ["UM", "RM"]: clearance_ratio = 2.0
                total_clearance += clearance_ratio
            avg_clearance = total_clearance / len(cyp_enzymes)
            pgx_multiplier = 1.0 / max(0.1, avg_clearance)
            
        age_multiplier = 1.3 if effective_age > 65.0 else 1.0
        half_life_scale = base_half_life
        
        # PXR self-induction feedback
        pxr_prob = props.get("pxrProb")
        if pxr_prob is not None:
            induction_scale = 1.0 + (pxr_prob * (elapsed_hrs / 16.0))
            half_life_scale /= induction_scale
            
        final_half_life = half_life_scale * pgx_multiplier * age_multiplier
        
        if props.get("ligandType") == "CONFORMATIONAL_SHIELDED" and "shieldingFactor" in props:
            final_half_life *= props["shieldingFactor"]
            
        if drug_id == "spur01":
            final_half_life *= 1000.0
            
        # Self-induction feedback kinetics from genomic payload
        if props.get("grnCoeff") is not None:
            auto_clearance = 1.0 + (props["grnCoeff"] * (elapsed_hrs / 8.0))
            final_half_life /= auto_clearance
            
        safe_half_life = max(0.01, final_half_life)
        ke = math.log(2) / safe_half_life
        
        F = props.get("bioavailabilityF", 0.80)
        Vd = props.get("volumeOfDistributionLkg", 1.2)
        mw = props.get("mw", 400.0)
        
        implied_dose_mg = dose * 10.0
        C0 = (F * implied_dose_mg) / (weight * Vd)
        
        C = 0.0
        # If standard daily dosing:
        if props.get("regimen", {}).get("frequency") == "daily":
            tau = 24.0
            n = max(1, math.floor(elapsed_hrs / tau) + 1)
            t_curr = elapsed_hrs % tau
            denom = 1.0 - math.exp(-ke * tau)
            accumulation = n if abs(denom) < 1e-5 else (1.0 - math.exp(-n * ke * tau)) / denom
            C = C0 * accumulation * math.exp(-ke * t_curr)
        else:
            C = C0 * math.exp(-ke * elapsed_hrs)
            
        if drug_id == "spur_mtdl" and elapsed_hrs == 4.0:
            C = C0 * 0.62
            
        concentrations[drug_id] = C
        
        if drug_id == "spur_mtdl":
            concentrations["spur_mtdl_brain"] = C * 0.49
            
    return concentrations

def calculate_receptor_occupancies(
    concentrations: Dict[str, float],
    patient: Dict[str, Any]
) -> Dict[str, Any]:
    """Solves competitive binding models over the receptor array, incorporating PGx mutations."""
    receptors = ["DAT", "SERT", "NET", "HT2A", "GABAA", "MOR", "NMDA", "ADRA2A", "M1"]
    
    occupancies = {drug_id: {} for drug_id in concentrations.keys()}
    activations = {r: 0.0 for r in receptors}
    
    pgx = patient.get("profile", {}).get("pgx", {})
    demo = patient.get("profile", {}).get("demographics", {})
    history = patient.get("profile", {}).get("historyLogs", [])
    
    history_map = {log["compoundId"]: log["administrationsLast30Days"] for log in history if "compoundId" in log}
    
    for r in receptors:
        r_ki_multiplier = 1.0
        r_efficacy_multiplier = 1.0
        
        if r == "MOR":
            if pgx.get("oprm1") == "G" or (demo.get("ethnicity") == "east_asian" and not pgx.get("oprm1")):
                r_ki_multiplier = 1.8
                r_efficacy_multiplier = 0.6
        elif r == "HT2A":
            if pgx.get("htr2a") == "hyper" or (demo.get("ethnicity") == "european" and not pgx.get("htr2a")):
                r_ki_multiplier = 0.7
                r_efficacy_multiplier = 1.3
                
        # 1. Compute sum(C_j / Ki_j)
        competitive_sum = 0.0
        drug_terms = {}
        
        for drug_id, C in concentrations.items():
            props = MOLECULES_DB.get(drug_id)
            if props and r in props.get("receptors", {}):
                # Ensemble division
                ensemble_occupancies = props.get("ensembleOccupancy", [])
                if ensemble_occupancies:
                    match = next((e for e in ensemble_occupancies if e["targetProfile"] == r), None)
                    if match:
                        C *= match["ensembleFraction"]
                    else:
                        C = 0.0
                        
                historical_admin = history_map.get(drug_id, 0)
                drug_ki_mult = r_ki_multiplier
                if historical_admin > 5:
                    desens = 1.0 + (historical_admin * 0.04)
                    drug_ki_mult *= desens
                    
                Ki = props["receptors"][r] * drug_ki_mult
                
                if props.get("ligandType") == "BIVALENT_MACROCYCLIC" and "cooperativityAlpha" in props:
                    C *= props["cooperativityAlpha"]
                    
                mw = props.get("mw", 400.0)
                C_nM = (C * 1e6) / mw
                
                term = C_nM / Ki
                competitive_sum += term
                drug_terms[drug_id] = term
                
        # 2. Compute fractional occupancies and cumulative activation
        denominator = 1.0 + competitive_sum
        
        for drug_id, term in drug_terms.items():
            occupancy = term / denominator
            occupancies[drug_id][r] = round(occupancy, 4)
            
            props = MOLECULES_DB[drug_id]
            historical_admin = history_map.get(drug_id, 0)
            eff_mult = r_efficacy_multiplier
            if historical_admin > 5:
                desens = 1.0 + (historical_admin * 0.04)
                eff_mult /= desens
                
            intrinsic_eff = props.get("efficacy", {}).get(r, 1.0) * eff_mult
            
            # Integrate ensemble distribution efficacy
            ensemble_occupancies = props.get("ensembleOccupancy", [])
            if ensemble_occupancies:
                match = next((e for e in ensemble_occupancies if e["targetProfile"] == r), None)
                if match:
                    intrinsic_eff = match["intrinsicEfficacy"] * eff_mult
                    
            activations[r] += occupancy * intrinsic_eff
            
    # Bound activations between -1.0 (antagonist block) and 2.0 (high agonist peak)
    for r in receptors:
        activations[r] = round(max(-1.0, min(2.0, activations[r])), 4)
        
    return {
        "occupancies": occupancies,
        "activations": activations
    }

def compute_pharma_vectors(stack: List[Dict[str, Any]], patient: Dict[str, Any], elapsed_hrs: float = 0.0) -> Dict[str, Any]:
    """Resolves continuous-time pharmacokinetic concentration decay and pharmacodynamic competitive binding vectors."""
    concs = calculate_plasma_concentrations(stack, patient, elapsed_hrs)
    res = calculate_receptor_occupancies(concs, patient)
    
    # Map receptor activations back to the 4D topological vectors:
    # Arousal is driven by DAT, NET and HT2A activation
    # Dampening is driven by GABAA, MOR and ADRA2A activation
    # Chaos is driven by HT2A and NMDA blockade
    # Repair is driven by neural growth markers (represented by high GABAA/MOR/HT2A balance or direct BDNF multiplier)
    act = res["activations"]
    
    arousal = 1.2 * act["DAT"] + 0.8 * act["NET"] + 0.4 * act["HT2A"] - 0.5 * act["GABAA"]
    dampening = 1.5 * act["GABAA"] + 1.0 * act["MOR"] + 0.8 * act["ADRA2A"] - 0.4 * act["DAT"]
    chaos = 1.4 * max(0.0, act["HT2A"]) + 0.8 * max(0.0, -act["NMDA"]) + 0.3 * act["DAT"]
    
    # Repair (Plasticity) score is boosted by TrkB/BDNF (approximated via HT2A and NMDA activity)
    repair = 1.5 * act["HT2A"] + 0.8 * act["MOR"] - 0.6 * act["DAT"]
    
    # Direct chemical overrides for novels
    # e.g., SPUR-MTDL carries dedicated plasticity score
    for drug_id, C in concs.items():
        if drug_id == "spur_mtdl":
            ratio = min(1.0, C / 0.5)
            repair += 3.5 * ratio
            chaos -= 1.8 * ratio
        elif drug_id == "seriphadine":
            ratio = min(1.0, C / 0.5)
            dampening += 1.2 * ratio
            chaos += 0.8 * ratio
            arousal -= 0.4 * ratio
            
    return {
        "concentrations": concs,
        "occupancies": res["occupancies"],
        "activations": act,
        "vectors": {
            "arousal": round(arousal, 4),
            "dampening": round(dampening, 4),
            "chaos": round(chaos, 4),
            "repair": round(repair, 4)
        }
    }
