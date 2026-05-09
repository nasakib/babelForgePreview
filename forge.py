import json
import random
import math
import os

def generate_topology_data():
    """Generates data for 11d-projection.html"""
    regions = [
        "LH_Vis_1", "LH_Vis_2", "LH_SomMot_1", "LH_SomMot_2", "LH_DorsAttn_Post_1", 
        "LH_DorsAttn_Post_2", "LH_DorsAttn_FEF", "LH_VentAttn_1", "LH_VentAttn_2", 
        "LH_Limbic_OFC", "LH_Limbic_TempPole", "LH_Cont_Par_1", "LH_Cont_PFCl_1", 
        "LH_Default_Temp_1", "LH_Default_Par_1", "LH_Default_PFC_1",
        "RH_Vis_1", "RH_Vis_2", "RH_SomMot_1", "RH_SomMot_2", "RH_DorsAttn_Post_1",
        "RH_DorsAttn_FEF", "RH_VentAttn_1", "RH_Cont_PFCl_1", "RH_Default_PFC_1"
    ]
    
    def create_state(is_resistant=False):
        num_nodes = 50
        nodes = []
        for i in range(num_nodes):
            # Clusters
            angle = random.uniform(0, 2 * math.pi)
            dist = random.uniform(20, 80)
            region = random.choice(regions)
            nodes.append({
                "id": i,
                "name": f"{region}_{i}",
                "region": region.split('_')[1],
                "x": dist * math.cos(angle) + random.uniform(-10, 10),
                "y": dist * math.sin(angle) + random.uniform(-10, 10),
                "z": random.uniform(-30, 30)
            })

        edges = []
        cliques = []
        
        # Connect nodes to form cliques
        # Healthy has more high-D cliques
        num_cliques = 5 if is_resistant else 15
        max_dim = 3 if is_resistant else 11
        
        all_clique_nodes = set()
        
        for _ in range(num_cliques):
            dim = random.randint(2, max_dim)
            clique_size = dim + 1
            c_nodes = random.sample(range(num_nodes), min(clique_size, num_nodes))
            cliques.append({
                "nodes": c_nodes,
                "dimension": dim
            })
            all_clique_nodes.update(c_nodes)
            
            # Add edges for the clique
            for i in range(len(c_nodes)):
                for j in range(i + 1, len(c_nodes)):
                    edges.append({"source": c_nodes[i], "target": c_nodes[j]})

        # Add some random background edges
        num_extra_edges = 20 if is_resistant else 50
        for _ in range(num_extra_edges):
            u, v = random.sample(range(num_nodes), 2)
            edges.append({"source": u, "target": v})

        # Remove duplicate edges
        unique_edges = []
        seen = set()
        for e in edges:
            pair = tuple(sorted((e["source"], e["target"])))
            if pair not in seen:
                unique_edges.append(e)
                seen.add(pair)

        return {
            "nodes": nodes,
            "edges": unique_edges,
            "cliques": cliques,
            "stats": {
                "max_dimension_found": max_dim,
                "total_cliques_2D_plus": len(cliques)
            }
        }

    data = {
        "RESPONSIVE": create_state(is_resistant=False),
        "RESISTANT": create_state(is_resistant=True)
    }
    
    with open('data/topology_projection.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("Generated data/topology_projection.json")

def generate_pharma_data():
    """Generates data for pharma-projection.html"""
    num_nodes = 40
    nodes = []
    colors = ["#9333EA", "#A855F7", "#C084FC", "#D8B4FE", "#E9D5FF"]
    
    for i in range(num_nodes):
        angle = (i / num_nodes) * 2 * math.pi
        r = 100 + random.uniform(-20, 20)
        nodes.append({
            "id": f"node_{i}",
            "x": r * math.cos(angle),
            "y": r * math.sin(angle),
            "z": random.uniform(-50, 50),
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

    pre_edges = get_edges(60)
    post_edges = get_edges(150)
    
    # Add some cliques to post_treatment
    post_cliques = []
    for _ in range(10):
        clique_size = random.randint(3, 6)
        c_nodes = [f"node_{i}" for i in random.sample(range(num_nodes), clique_size)]
        post_cliques.append(c_nodes)
        # Ensure edges for cliques exist in post_edges
        for i in range(len(c_nodes)):
            for j in range(i + 1, len(c_nodes)):
                pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                # This is a bit lazy but works for simulation
                edge = {"source": c_nodes[i], "target": c_nodes[j]}
                if edge not in post_edges:
                    post_edges.append(edge)

    data = {
        "nodes": nodes,
        "states": {
            "pre_treatment": {
                "edges": pre_edges,
                "cliques": []
            },
            "post_treatment": {
                "edges": post_edges,
                "cliques": post_cliques
            }
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
