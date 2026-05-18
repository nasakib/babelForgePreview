import random
import math
import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

app = FastAPI(title="babelForge API", description="Backend Engine for Computational Topology and Pharmacopeia")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allowing all origins for custom domain compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathologicalState(BaseModel):
    states: List[str]

class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/topology")
def get_topology_data():
    """Generates composable topology data for babelForge."""
    num_nodes = 200
    nodes = []
    
    # Brain dimensions (Ellipsoid)
    a, b, c = 48, 38, 58
    
    for i in range(num_nodes):
        while True:
            x = random.uniform(-a, a)
            y = random.uniform(-b, b)
            z = random.uniform(-c, c)
            if (x/a)**2 + (y/b)**2 + (z/c)**2 <= 1:
                if abs(x) < 4: continue
                break
                
        hemi = "RH" if x > 0 else "LH"
        if z < -25: cluster = "Visual"
        elif y > 18 and -25 <= z <= 20: cluster = "SomatoMotor"
        elif z > 25 and y > 5: cluster = "Control"
        elif z > 25 and y <= 5: cluster = "Limbic"
        elif y < -5 and -25 <= z <= 20: cluster = "VentAttn"
        else: cluster = "Default"
            
        nodes.append({
            "id": i,
            "name": f"{hemi}_{cluster}_{i}",
            "region": cluster,
            "hemi": hemi,
            "x": round(x, 2),
            "y": round(y, 2),
            "z": round(z, 2),
            "cliques": 0,
            "hubness": 0
        })

    # Generate Baseline Healthy State
    baseline_edges = []
    baseline_cliques = []
    
    # 1. Guarantee global connectivity via K-Nearest Neighbors (KNN)
    k_neighbors = 3
    for i in range(num_nodes):
        distances = [(j, (nodes[j]["x"]-nodes[i]["x"])**2 + (nodes[j]["y"]-nodes[i]["y"])**2 + (nodes[j]["z"]-nodes[i]["z"])**2) for j in range(num_nodes) if i != j]
        distances.sort(key=lambda item: item[1])
        for j, dist in distances[:k_neighbors]:
            pair = tuple(sorted((i, j)))
            baseline_edges.append(pair)
            
    # 2. Add high-dimensional functional cliques
    # Healthy: 60 cliques, max dim 11
    for _ in range(60):
        dim = random.randint(2, 11)
        clique_size = dim + 1
        center_node = random.choice(nodes)
        
        distances = [(j, (n["x"]-center_node["x"])**2 + (n["y"]-center_node["y"])**2 + (n["z"]-center_node["z"])**2) for j, n in enumerate(nodes)]
        distances.sort(key=lambda item: item[1])
        c_nodes = [idx for idx, d in distances[:clique_size]]
        
        baseline_cliques.append({"nodes": sorted(c_nodes), "dimension": dim})
        for nid in c_nodes:
            nodes[nid]["cliques"] += 1
            nodes[nid]["hubness"] += round(clique_size / 10.0, 2)
            
        for i in range(len(c_nodes)):
            for j in range(i + 1, len(c_nodes)):
                pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                baseline_edges.append(pair)

    baseline_edges = list(set(baseline_edges))
    baseline_edges_formatted = [{"source": u, "target": v} for u, v in baseline_edges]

    baseline = {
        "nodes": nodes,
        "edges": baseline_edges_formatted,
        "cliques": baseline_cliques,
        "stats": {"clique_count": len(baseline_cliques)}
    }

    def create_modifier(state_type):
        edges_added = set()
        edges_removed = set()
        cliques_added = []
        cliques_removed = [] # We'll just remove a percentage of baseline cliques
        
        num_remove = 0
        num_add = 0
        max_dim = 5
        bias_region = None
        
        if state_type == "PTSD":
            num_remove = 45 # Massive collapse
            num_add = 10
            max_dim = 4
            bias_region = "Limbic"
        elif state_type == "ADHD":
            num_remove = 25
            num_add = 5
            max_dim = 5
            bias_region = "Control" # Removes from control, doesn't add much
        elif state_type == "TOURETTES":
            num_remove = 10
            num_add = 30
            max_dim = 9
            bias_region = "SomatoMotor"
        elif state_type == "DEPRESSION":
            num_remove = 30
            num_add = 20
            max_dim = 6
            bias_region = "Default"
            
        # Remove cliques (simulate collapse)
        indices_to_remove = random.sample(range(len(baseline_cliques)), min(num_remove, len(baseline_cliques)))
        if state_type == "ADHD":
             # Try to preferentially remove Control cliques
             control_cliques = [i for i, c in enumerate(baseline_cliques) if any(nodes[nid]["region"] == "Control" for nid in c["nodes"])]
             indices_to_remove = random.sample(control_cliques, min(num_remove, len(control_cliques)))
             
        for idx in indices_to_remove:
            cliques_removed.append(baseline_cliques[idx]["nodes"])
            c_nodes = baseline_cliques[idx]["nodes"]
            for i in range(len(c_nodes)):
                for j in range(i + 1, len(c_nodes)):
                    pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                    edges_removed.add(pair)
                    
        # Add cliques (simulate pathological hyper-connectivity)
        for _ in range(num_add):
            dim = random.randint(2, max_dim)
            clique_size = dim + 1
            
            valid_centers = [n for n in nodes if n["region"] == bias_region] if bias_region and random.random() < 0.8 else nodes
            if not valid_centers: valid_centers = nodes
            center_node = random.choice(valid_centers)
            
            distances = [(j, (n["x"]-center_node["x"])**2 + (n["y"]-center_node["y"])**2 + (n["z"]-center_node["z"])**2) for j, n in enumerate(nodes)]
            distances.sort(key=lambda item: item[1])
            c_nodes = sorted([idx for idx, d in distances[:clique_size]])
            cliques_added.append({"nodes": c_nodes, "dimension": dim})
            
            for i in range(len(c_nodes)):
                for j in range(i + 1, len(c_nodes)):
                    pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                    edges_added.add(pair)

        # Cleanup: Don't remove an edge if it was just added, etc.
        actual_edges_removed = edges_removed - edges_added
        # We only add edges that aren't already in the baseline
        actual_edges_added = edges_added - set(baseline_edges)

        return {
            "edges_added": [{"source": u, "target": v} for u, v in actual_edges_added],
            "edges_removed": [{"source": u, "target": v} for u, v in actual_edges_removed],
            "cliques_added": cliques_added,
            "cliques_removed": cliques_removed
        }

    modifiers = {
        "PTSD": create_modifier("PTSD"),
        "ADHD": create_modifier("ADHD"),
        "TOURETTES": create_modifier("TOURETTES"),
        "DEPRESSION": create_modifier("DEPRESSION")
    }

    return {
        "baseline": baseline,
        "modifiers": modifiers
    }

@app.get("/api/pharma")
def get_pharma_data():
    """Generates expanded pharmacopeia data for babelForge."""
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

    drugs = [
        {"id": "ZB-01", "name": "ZB-01", "class": "Precision", "target": "Global Phase-Locking"},
        {"id": "SS-20", "name": "SS-20", "class": "Precision", "target": "Frontoparietal Upregulation"},
        {"id": "LL-07", "name": "LimbicLink (LL-07)", "class": "Precision", "target": "DMN Fluidity Restoration"},
        {"id": "DR-02", "name": "DR-02", "class": "Precision", "target": "Somatomotor Dampening"},
        {"id": "NX-44", "name": "NX-44", "class": "Precision", "target": "Global Synaptogenesis"},
        {"id": "FLX", "name": "Fluoxetine", "class": "Conventional", "target": "Broad Serotonin Reuptake"},
        {"id": "KET", "name": "Ketamine", "class": "Conventional", "target": "NMDA Antagonism"},
        {"id": "AMP", "name": "Amphetamine", "class": "Conventional", "target": "Global Monoamine Release"},
        {"id": "THC", "name": "Delta-9-THC", "class": "Recreational", "target": "CB1 Agonism (Entropy Inc.)"},
        {"id": "CBD", "name": "Cannabidiol", "class": "Functional", "target": "CB Modulation / 5-HT1A"},
        {"id": "NIC", "name": "Nicotine", "class": "Recreational", "target": "nAChR Agonism (Transient FP)"}
    ]

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

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"response": "GEMINI_API_KEY not configured on server. Please configure it in GitHub Secrets."}
    
    genai.configure(api_key=api_key)
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        system_instruction = "You are babelAI, a clinical computational neuroscience assistant. You explain everything and answer questions based on the proprietary science of babelForge (including algebraic topology, multi-dimensional cliques, and Kuramoto phase-locking for neuromodulation) and the most accurate and latest scientific literature. You help users analyze 3D brain network topologies, pharmacological stacks, and psychiatric comorbidities. Be concise, clinical, and precise. Analyze the user's current context provided below."
        
        prompt = f"{system_instruction}\n\nSystem Context:\nModule: {req.context.get('module', 'None')}\nPathologies: {req.context.get('pathologies', [])}\nStack: {req.context.get('stack', [])}\nBaseline Alignment Score: {req.context.get('integrityScore', 'N/A')}%\n\nUser Query: {req.message}"
        
        response = model.generate_content(prompt)
        
        return {"response": response.text}
    except Exception as e:
        return {"response": f"Error communicating with AI: {str(e)}"}