import math
import random
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from core.pharma_engine import MOLECULES_DB
from core.optimize import auto_optimize_ideal, gradient_descent_continuous_optimization

router = APIRouter(prefix="/api", tags=["pharma"])

class OptimizeRequest(BaseModel):
    states: List[str]
    weightKg: Optional[float] = 70.0
    ageYears: Optional[float] = 35.0
    toleranceMonths: Optional[float] = 0.0
    simulationTimeMonths: Optional[float] = 0.0

@router.get("/pharma")
def get_pharma_data():
    """Generates pharmacopeia data projection for candidate compound target highlights."""
    num_nodes = 50
    nodes = []
    colors = ["#9333EA", "#7c3aed", "#6366f1", "#4f46e5", "#3730a3"]
    
    for i in range(num_nodes):
        angle = (i / num_nodes) * 2 * math.pi
        r = 80 + random.uniform(-10, 10)
        nodes.append({
            "id": f"node_{i}",
            "x": r * math.cos(angle),
            "y": r * math.sin(angle),
            "z": random.uniform(-40, 40),
            "color": random.choice(colors)
        })

    def get_edges(count):
        edges = []
        seen = set()
        while len(edges) < count:
            u, v = random.sample(range(num_nodes), 2)
            pair = tuple(sorted((u, v)))
            if pair not in seen:
                edges.append({"source": f"node_{u}", "target": f"node_{v}"})
                seen.add(pair)
        return edges

    drugs = []
    for id_key, mol in MOLECULES_DB.items():
        drugs.append({
            "id": mol["id"],
            "name": mol["name"],
            "class": mol["class"].capitalize(),
            "target": mol.get("classLabel", "Receptor Modulator")
        })

    return {
        "nodes": nodes,
        "states": {
            "pre_treatment": {"edges": get_edges(80), "cliques": []},
            "post_treatment": {
                "edges": get_edges(200),
                "cliques": [[f"node_{i}" for i in random.sample(range(num_nodes), random.randint(3, 8))] for _ in range(15)]
            }
        },
        "drugs": drugs
    }

@router.post("/optimize")
def run_optimization(req: OptimizeRequest):
    """
    Runs dual-pathway clinical optimization:
    1. Greedy search over categorised molecules database.
    2. Continuous-time gradient descent solver over the 4D vector space.
    """
    greedy_res = auto_optimize_ideal(req.states)
    continuous_res = gradient_descent_continuous_optimization(req.states)
    
    return {
        "greedy_optimal_stack": greedy_res["regimen"],
        "greedy_reasoning": greedy_res["reasoning"],
        "projected_greedy_integrity": greedy_res["integrity"],
        "continuous_mathematical_solver": continuous_res
    }
