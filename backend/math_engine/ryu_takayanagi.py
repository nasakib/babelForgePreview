import numpy as np
import networkx as np_nx
import networkx as nx
from typing import List, Tuple, Dict, Set, Any

def solve_ryu_takayanagi_cut(
    adjacency_matrix: np.ndarray,
    source_nodes: List[int],
    target_nodes: List[int]
) -> Dict[str, Any]:
    """
    Finds the Ryu-Takayanagi minimal surface cut separating source_nodes (A)
    from target_nodes (B). The capacity of each connectome edge (i, j) is
    defined by its connection strength (adjacency value).
    """
    n = adjacency_matrix.shape[0]
    
    # Create a NetworkX directed graph for flow calculations
    G = nx.DiGraph()
    for i in range(n):
        G.add_node(i)
        
    for i in range(n):
        for j in range(n):
            if i != j and adjacency_matrix[i, j] > 0:
                G.add_edge(i, j, capacity=float(adjacency_matrix[i, j]))
                
    # Add a virtual source node 'S' and virtual sink node 'T'
    virtual_source = "S"
    virtual_sink = "T"
    G.add_node(virtual_source)
    G.add_node(virtual_sink)
    
    for src in source_nodes:
        if src < n:
            G.add_edge(virtual_source, src, capacity=float('inf'))
            
    for tgt in target_nodes:
        if tgt < n:
            G.add_edge(tgt, virtual_sink, capacity=float('inf'))
            
    try:
        # Compute the minimum cut / maximum flow
        cut_value, partition = nx.minimum_cut(G, virtual_source, virtual_sink)
        
        # Partition consists of two sets: nodes reachable from S, and nodes not reachable
        reachable, non_reachable = partition
        
        # Filter out virtual nodes to get actual network nodes
        set_A = {node for node in reachable if isinstance(node, int)}
        set_B = {node for node in non_reachable if isinstance(node, int)}
        
        # Find cut edges: edges in the original network going from set_A to set_B
        cut_edges = []
        for u in set_A:
            for v in set_B:
                if adjacency_matrix[u, v] > 0:
                    cut_edges.append((u, v, float(adjacency_matrix[u, v])))
                    
        return {
            "cut_value": cut_value,
            "partition_A": list(set_A),
            "partition_B": list(set_B),
            "cut_edges": [{"source": u, "target": v, "weight": w} for u, v, w in cut_edges]
        }
    except Exception as e:
        # Fallback if graph is disconnected or there's a partition error
        return {
            "cut_value": 0.0,
            "partition_A": source_nodes,
            "partition_B": target_nodes,
            "cut_edges": []
        }

def gradient_descent_mending(
    adjacency_matrix: np.ndarray,
    healthy_matrix: np.ndarray,
    learning_rate: float = 0.1,
    steps: int = 10
) -> List[Dict[str, Any]]:
    """
    Identifies the connections that deviate most from the healthy baseline.
    Computes the gradient of the deviation loss L = 0.5 * ||W_healthy - W_pathology||_F^2
    and returns suggested mending weight updates.
    """
    # Gradient: \nabla_W L = W_pathology - W_healthy
    # To minimize loss, we update: W_new = W_pathology - lr * \nabla_L = W_pathology + lr * (W_healthy - W_pathology)
    gradient = adjacency_matrix - healthy_matrix
    updates = []
    
    n = adjacency_matrix.shape[0]
    for i in range(n):
        for j in range(i + 1, n):
            grad_val = gradient[i, j]
            # If the current connection is weaker than healthy (grad_val < 0), we want to strengthen it
            if grad_val < -0.1:
                suggested_increase = -learning_rate * grad_val * steps
                updates.append({
                    "source": i,
                    "target": j,
                    "priority": float(abs(grad_val)),
                    "current": float(adjacency_matrix[i, j]),
                    "healthy": float(healthy_matrix[i, j]),
                    "suggested_increase": float(round(suggested_increase, 4))
                })
                
    # Sort updates by priority (highest deviation first)
    updates.sort(key=lambda x: x["priority"], reverse=True)
    return updates[:15] # Top 15 recommendations
