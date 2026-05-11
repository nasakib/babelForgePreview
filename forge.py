import json
import random
import math
import os
import copy

def generate_topology_data():
    """Generates data for 11d-projection.html and index.html dashboard"""
    num_nodes = 150
    nodes = []
    
    # Brain dimensions (Ellipsoid)
    a, b, c = 45, 35, 55 # X (Left/Right), Y (Bottom/Top), Z (Back/Front)
    
    for i in range(num_nodes):
        # Rejection sampling for an ellipsoid
        while True:
            x = random.uniform(-a, a)
            y = random.uniform(-b, b)
            z = random.uniform(-c, c)
            # Check if point is inside ellipsoid
            if (x/a)**2 + (y/b)**2 + (z/c)**2 <= 1:
                # Carve out the interhemispheric fissure (make it slightly split)
                if abs(x) < 4:
                    continue
                break
                
        # Assign region based on coordinates
        hemi = "RH" if x > 0 else "LH"
        if z < -20:
            cluster = "Visual"
            name = f"{hemi}_Vis_{i}"
        elif y > 15 and -20 <= z <= 20:
            cluster = "SomatoMotor"
            name = f"{hemi}_SomMot_{i}"
        elif z > 20 and y > 0:
            cluster = "Control"
            name = f"{hemi}_Cont_{i}"
        elif z > 20 and y <= 0:
            cluster = "Limbic"
            name = f"{hemi}_Limbic_{i}"
        elif y < 0 and -20 <= z <= 20:
            cluster = "VentAttn"
            name = f"{hemi}_VentAttn_{i}"
        else:
            cluster = "Default"
            name = f"{hemi}_Default_{i}"
            
        nodes.append({
            "id": i,
            "name": name,
            "region": cluster,
            "hemi": hemi,
            "x": x,
            "y": y,
            "z": z,
            "cliques": 0
        })

    def create_state(state_type="HEALTHY"):
        state_nodes = copy.deepcopy(nodes)
        
        state_edges = []
        state_cliques = []
        
        if state_type == "HEALTHY":
            num_cliques = 45
            max_dim = 11
        elif state_type == "PTSD":
            num_cliques = 12
            max_dim = 4
        elif state_type == "ADHD":
            num_cliques = 20
            max_dim = 6
        elif state_type == "TOURETTES":
            num_cliques = 60
            max_dim = 9
        
        for _ in range(num_cliques):
            dim = random.randint(2, max_dim)
            clique_size = dim + 1
            
            # Find nodes that are somewhat close to each other to form a clique
            center_node = random.choice(state_nodes)
            
            # Disorder specific biases
            if state_type == "TOURETTES" and random.random() < 0.7:
                somato_nodes = [n for n in state_nodes if n["region"] == "SomatoMotor"]
                if somato_nodes:
                    center_node = random.choice(somato_nodes)
            if state_type == "ADHD" and center_node["region"] == "Control" and random.random() < 0.8:
                non_control = [n for n in state_nodes if n["region"] != "Control"]
                if non_control:
                    center_node = random.choice(non_control)

            distances = [(j, (n["x"]-center_node["x"])**2 + (n["y"]-center_node["y"])**2 + (n["z"]-center_node["z"])**2) for j, n in enumerate(state_nodes)]
            distances.sort(key=lambda item: item[1])
            
            # Select the closest nodes for the clique to make spatial sense
            c_nodes = [idx for idx, d in distances[:clique_size]]
            state_cliques.append({"nodes": c_nodes, "dimension": dim})
            
            for nid in c_nodes:
                state_nodes[nid]["cliques"] += 1

            for i in range(len(c_nodes)):
                for j in range(i + 1, len(c_nodes)):
                    state_edges.append({"source": c_nodes[i], "target": c_nodes[j]})

        seen = set()
        unique_edges = []
        for e in state_edges:
            pair = tuple(sorted((e["source"], e["target"])))
            if pair not in seen:
                unique_edges.append(e)
                seen.add(pair)

        return {
            "nodes": state_nodes,
            "edges": unique_edges,
            "cliques": state_cliques,
            "stats": {"max_dimension_found": max_dim, "total_cliques_2D_plus": len(state_cliques)}
        }

    data = {
        "RESPONSIVE": create_state("HEALTHY"),
        "RESISTANT": create_state("PTSD"),
        "ADHD": create_state("ADHD"),
        "TOURETTES": create_state("TOURETTES")
    }
    
    with open('data/topology_projection.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("Generated data/topology_projection.json")
    
    with open('data/topology_projection.js', 'w') as f:
        f.write("window.precalculatedTopologyData = " + json.dumps(data, indent=2) + ";")
    print("Generated data/topology_projection.js")

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

    with open('data/pharma_projection.js', 'w') as f:
        f.write("window.precalculatedPharmaData = " + json.dumps(data, indent=2) + ";")
    print("Generated data/pharma_projection.js")

if __name__ == "__main__":
    if not os.path.exists('data'):
        os.makedirs('data')
    generate_topology_data()
    generate_pharma_data()