import random
from typing import List, Dict, Any, Tuple

def get_baseline_topology() -> Dict[str, Any]:
    """Generates the composable healthy 200-node baseline connectome."""
    num_nodes = 200
    nodes = []
    
    # Brain dimensions (Ellipsoid)
    a, b, c = 48, 38, 58
    
    # Use deterministic random seed for consistency across client sessions
    rng = random.Random(42)
    
    for i in range(num_nodes):
        while True:
            x = rng.uniform(-a, a)
            y = rng.uniform(-b, b)
            z = rng.uniform(-c, c)
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
            
    # 2. Add high-dimensional functional cliques (Healthy: 60 cliques, max dim 11)
    for _ in range(60):
        dim = rng.randint(2, 11)
        clique_size = dim + 1
        center_node = rng.choice(nodes)
        
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

    return {
        "nodes": nodes,
        "edges": baseline_edges_formatted,
        "cliques": baseline_cliques,
        "stats": {"clique_count": len(baseline_cliques)}
    }

def create_modifier(nodes: List[Dict[str, Any]], baseline_edges: List[Dict[str, Any]], baseline_cliques: List[Dict[str, Any]], state_type: str) -> Dict[str, Any]:
    """Simulates topological additions and deletions based on active pathology."""
    rng = random.Random(sum(ord(c) for c in state_type) or 13)
    edges_added = set()
    edges_removed = set()
    cliques_added = []
    cliques_removed = []
    
    num_remove = 0
    num_add = 0
    max_dim = 5
    bias_region = None
    
    if state_type == "PTSD":
        num_remove = 45
        num_add = 10
        max_dim = 4
        bias_region = "Limbic"
    elif state_type == "ADHD":
        num_remove = 25
        num_add = 5
        max_dim = 5
        bias_region = "Control"
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
        
    # Remove cliques (collapse)
    indices_to_remove = rng.sample(range(len(baseline_cliques)), min(num_remove, len(baseline_cliques)))
    if state_type == "ADHD":
        # Target Control region cliques
        control_cliques = [i for i, c in enumerate(baseline_cliques) if any(nodes[nid]["region"] == "Control" for nid in c["nodes"])]
        if control_cliques:
            indices_to_remove = rng.sample(control_cliques, min(num_remove, len(control_cliques)))
         
    for idx in indices_to_remove:
        cliques_removed.append(baseline_cliques[idx]["nodes"])
        c_nodes = baseline_cliques[idx]["nodes"]
        for i in range(len(c_nodes)):
            for j in range(i + 1, len(c_nodes)):
                pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                edges_removed.add(pair)
                
    # Add cliques (pathological hyper-connectivity)
    for _ in range(num_add):
        dim = rng.randint(2, max_dim)
        clique_size = dim + 1
        
        valid_centers = [n for n in nodes if n["region"] == bias_region] if bias_region and rng.random() < 0.8 else nodes
        if not valid_centers: valid_centers = nodes
        center_node = rng.choice(valid_centers)
        
        distances = [(j, (n["x"]-center_node["x"])**2 + (n["y"]-center_node["y"])**2 + (n["z"]-center_node["z"])**2) for j, n in enumerate(nodes)]
        distances.sort(key=lambda item: item[1])
        c_nodes = sorted([idx for idx, d in distances[:clique_size]])
        cliques_added.append({"nodes": c_nodes, "dimension": dim})
        
        for i in range(len(c_nodes)):
            for j in range(i + 1, len(c_nodes)):
                pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                edges_added.add(pair)

    actual_edges_removed = edges_removed - edges_added
    baseline_edge_tuples = set(tuple(sorted((e["source"], e["target"]))) for e in baseline_edges)
    actual_edges_added = edges_added - baseline_edge_tuples

    return {
        "edges_added": [{"source": u, "target": v} for u, v in actual_edges_added],
        "edges_removed": [{"source": u, "target": v} for u, v in actual_edges_removed],
        "cliques_added": cliques_added,
        "cliques_removed": cliques_removed
    }
