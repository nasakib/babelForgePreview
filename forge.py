import json
import random
import math
import os

def generate_topology_data():
    """Generates data for 11d-projection.html and index.html dashboard"""
    regions = [
        {"name": "LH_Vis_1", "hemi": "LH", "cluster": "Visual", "base_x": -30, "base_y": -40, "base_z": -20},
        {"name": "LH_Vis_2", "hemi": "LH", "cluster": "Visual", "base_x": -35, "base_y": -45, "base_z": -10},
        {"name": "LH_SomMot_1", "hemi": "LH", "cluster": "SomatoMotor", "base_x": -40, "base_y": 5, "base_z": 40},
        {"name": "LH_SomMot_2", "hemi": "LH", "cluster": "SomatoMotor", "base_x": -45, "base_y": 10, "base_z": 35},
        {"name": "LH_DorsAttn_1", "hemi": "LH", "cluster": "DorsAttn", "base_x": -35, "base_y": -15, "base_z": 45},
        {"name": "LH_DorsAttn_2", "hemi": "LH", "cluster": "DorsAttn", "base_x": -40, "base_y": -20, "base_z": 40},
        {"name": "LH_VentAttn_1", "hemi": "LH", "cluster": "VentAttn", "base_x": -50, "base_y": 5, "base_z": 10},
        {"name": "LH_Limbic_1", "hemi": "LH", "cluster": "Limbic", "base_x": -25, "base_y": 15, "base_z": -30},
        {"name": "LH_Cont_1", "hemi": "LH", "cluster": "Control", "base_x": -30, "base_y": 35, "base_z": 20},
        {"name": "LH_Default_1", "hemi": "LH", "cluster": "Default", "base_x": -20, "base_y": -55, "base_z": 25},
        {"name": "LH_Default_2", "hemi": "LH", "cluster": "Default", "base_x": -15, "base_y": 45, "base_z": 15},
        {"name": "RH_Vis_1", "hemi": "RH", "cluster": "Visual", "base_x": 30, "base_y": -40, "base_z": -20},
        {"name": "RH_SomMot_1", "hemi": "RH", "cluster": "SomatoMotor", "base_x": 40, "base_y": 5, "base_z": 40},
        {"name": "RH_DorsAttn_1", "hemi": "RH", "cluster": "DorsAttn", "base_x": 35, "base_y": -15, "base_z": 45},
        {"name": "RH_VentAttn_1", "hemi": "RH", "cluster": "VentAttn", "base_x": 50, "base_y": 5, "base_z": 10},
        {"name": "RH_Limbic_1", "hemi": "RH", "cluster": "Limbic", "base_x": 25, "base_y": 15, "base_z": -30},
        {"name": "RH_Cont_1", "hemi": "RH", "cluster": "Control", "base_x": 30, "base_y": 35, "base_z": 20},
        {"name": "RH_Default_1", "hemi": "RH", "cluster": "Default", "base_x": 20, "base_y": -55, "base_z": 25}
    ]
    
    def create_state(is_resistant=False):
        num_nodes = 60
        nodes = []
        for i in range(num_nodes):
            reg = random.choice(regions)
            # Create a more brain-like distribution around base centers
            nodes.append({
                "id": i,
                "name": f"{reg['name']}_{i}",
                "region": reg['cluster'],
                "hemi": reg['hemi'],
                "x": reg['base_x'] + random.uniform(-15, 15),
                "y": reg['base_y'] + random.uniform(-15, 15),
                "z": reg['base_z'] + random.uniform(-15, 15)
            })

        edges = []
        cliques = []
        num_cliques = 8 if is_resistant else 25
        max_dim = 4 if is_resistant else 11
        
        for _ in range(num_cliques):
            dim = random.randint(2, max_dim)
            c_nodes = random.sample(range(num_nodes), min(dim + 1, num_nodes))
            cliques.append({"nodes": c_nodes, "dimension": dim})
            for i in range(len(c_nodes)):
                for j in range(i + 1, len(c_nodes)):
                    edges.append({"source": c_nodes[i], "target": c_nodes[j]})

        seen = set()
        unique_edges = []
        for e in edges:
            pair = tuple(sorted((e["source"], e["target"])))
            if pair not in seen:
                unique_edges.append(e)
                seen.add(pair)

        return {
            "nodes": nodes,
            "edges": unique_edges,
            "cliques": cliques,
            "stats": {"max_dimension_found": max_dim, "total_cliques_2D_plus": len(cliques)}
        }

    data = {
        "RESPONSIVE": create_state(is_resistant=False),
        "RESISTANT": create_state(is_resistant=True)
    }
    
    with open('data/topology_projection.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("Generated data/topology_projection.json")

def generate_pharma_data():
    """Generates data for pharma-projection.html and marketing materials"""
    num_nodes = 50
    nodes = []
    # Clinical colors
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

    data = {
        "nodes": nodes,
        "states": {
            "pre_treatment": {"edges": get_edges(80), "cliques": []},
            "post_treatment": {
                "edges": get_edges(200),
                "cliques": [[f"node_{i}" for i in random.sample(range(num_nodes), random.randint(3, 8))] for _ in range(15)]
            }
        },
        "drug_profile": {
            "name": "ZenBud Agonist (ZB-01)",
            "target": "Topological Stabilization",
            "efficacy": "92.6%",
            "mechanism": "Arnold Tongue phase-locking optimization"
        }
    }

    with open('data/pharma_projection.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("Generated data/pharma_projection.json")

if __name__ == "__main__":
    if not os.path.exists('data'):
        os.makedirs('data')
    generate_topology_data()
    generate_pharma_data()
