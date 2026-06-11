import numpy as np
from typing import List, Dict, Any, Tuple
from .pharma_engine import MOLECULES_DB
from .topology_engine import get_baseline_topology, create_modifier

# Mock running a simplified diagnostic calculation to find integrity
def calculate_trial_integrity(states: List[str], vectors: Dict[str, float]) -> float:
    # Estimate K and Noise
    arousal = vectors.get("arousal", 0.0)
    dampening = vectors.get("dampening", 0.0)
    chaos = vectors.get("chaos", 0.0)
    repair = vectors.get("repair", 0.0)
    
    balance = 1.0 + 0.25 * repair - 0.30 * chaos
    tone = 1.0 + 0.10 * (arousal - dampening)
    K = max(0.05, 0.85 * balance * tone)
    noise = max(0.01, 0.05 + 0.18 * chaos + 0.04 * max(0.0, arousal))
    
    # Base pathology penalty
    base_penalty = len(states) * 0.15
    # Repair factor reduces penalty, chaos increases it
    net_penalty = max(0.0, base_penalty - 0.2 * repair + 0.25 * chaos)
    
    # R parameter estimate
    R = 1.0 / (1.0 + noise + net_penalty)
    # Scaling factor
    R = max(0.0, min(1.0, R * (1.0 + 0.1 * K)))
    
    return float(round(R * 100, 2))

def auto_optimize_ideal(states: List[str], max_stack: int = 3) -> Dict[str, Any]:
    """Greedy auto-optimization using novels and novels-synergies."""
    chosen = []
    reasoning = []
    
    candidates = [mol for id_key, mol in MOLECULES_DB.items() if id_key not in ["alc", "nicotine", "meth"]]
    
    for pick in range(max_stack):
        best_candidate = None
        best_dose = 0
        best_integrity = 0.0
        
        for mol in candidates:
            # Check if already in stack
            if any(c["id"] == mol["id"] for c in chosen):
                continue
                
            for dose in [1, 2, 3]:
                # Trial stack
                trial = chosen + [{"id": mol["id"], "dose": dose}]
                
                # Sum vectors
                v = {"arousal": 0.0, "dampening": 0.0, "chaos": 0.0, "repair": 0.0}
                for item in trial:
                    m = MOLECULES_DB[item["id"]]
                    ratio = item["dose"] / 3.0
                    for k in v.keys():
                        v[k] += m["effects"][k] * ratio
                        
                integ = calculate_trial_integrity(states, v)
                if integ > best_integrity:
                    best_candidate = mol
                    best_dose = dose
                    best_integrity = integ
                    
        if not best_candidate:
            break
            
        v_current = {"arousal": 0.0, "dampening": 0.0, "chaos": 0.0, "repair": 0.0}
        for item in chosen:
            m = MOLECULES_DB[item["id"]]
            ratio = item["dose"] / 3.0
            for k in v_current.keys():
                v_current[k] += m["effects"][k] * ratio
        integ_prev = calculate_trial_integrity(states, v_current)
        
        if best_integrity <= integ_prev + 0.5:
            break
            
        chosen.append({"id": best_candidate["id"], "name": best_candidate["name"], "dose": best_dose})
        delta = best_integrity - integ_prev
        reasoning.append(f"+ {best_candidate['name']} @ dose {best_dose} -> Phi = {best_integrity}% (Delta {'' if delta < 0 else '+'}{round(delta, 2)}%)")
        
    return {
        "regimen": chosen,
        "integrity": best_integrity if chosen else 100.0,
        "reasoning": reasoning
    }

def gradient_descent_continuous_optimization(
    states: List[str],
    steps: int = 50,
    lr: float = 0.05
) -> Dict[str, Any]:
    """
    Continuous gradient descent solver:
    Loss = (100.0 - calculate_trial_integrity(states, vectors))^2
    Finds the optimal 4D vectors coordinates directly, and matches them to the database.
    """
    # Start at zero vectors
    vectors = {"arousal": 0.0, "dampening": 0.0, "chaos": 0.0, "repair": 0.0}
    
    history = []
    
    for _ in range(steps):
        current_loss = (100.0 - calculate_trial_integrity(states, vectors)) ** 2
        
        # Calculate numerical gradient for each dimension
        grad = {}
        eps = 1e-4
        for k in vectors.keys():
            v_plus = vectors.copy()
            v_plus[k] += eps
            loss_plus = (100.0 - calculate_trial_integrity(states, v_plus)) ** 2
            
            v_minus = vectors.copy()
            v_minus[k] -= eps
            loss_minus = (100.0 - calculate_trial_integrity(states, v_minus)) ** 2
            
            grad[k] = (loss_plus - loss_minus) / (2.0 * eps)
            
        # Update vectors along negative gradient (descent)
        for k in vectors.keys():
            vectors[k] -= lr * grad[k]
            # Clip between canonical bounds
            vectors[k] = max(-2.0, min(3.0, vectors[k]))
            
    # Solve matching combination
    # Find the single compound that matches the target vectors closest by Cosine/Euclidean distance
    best_mol_id = None
    best_dist = float('inf')
    
    for id_key, mol in MOLECULES_DB.items():
        # Euclidean distance in 4D space
        dist = sum((vectors[k] - mol["effects"][k]) ** 2 for k in vectors.keys())
        if dist < best_dist:
            best_dist = dist
            best_mol_id = id_key
            
    matched_mol = MOLECULES_DB.get(best_mol_id, {})
    
    return {
        "target_vectors": {k: float(round(v, 4)) for k, v in vectors.items()},
        "recommended_match": {
            "id": best_mol_id,
            "name": matched_mol.get("name"),
            "effects": matched_mol.get("effects")
        },
        "optimized_projected_integrity": calculate_trial_integrity(states, vectors)
    }
