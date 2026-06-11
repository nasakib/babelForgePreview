import numpy as np
import networkx as nx
from typing import List, Tuple, Dict, Any

def compute_persistent_homology_barcodes(
    fc_matrix: np.ndarray,
    filtration_steps: int = 50
) -> Dict[str, Any]:
    """
    Computes H0 and H1 barcodes by filtering the functional connectivity matrix.
    Filtration thresholds decrease from 1.0 down to 0.0.
    At each step, we track connected components (H0) and 1D cycles (H1).
    """
    n = fc_matrix.shape[0]
    thresholds = np.linspace(1.0, 0.0, filtration_steps)
    
    # Track birth and death of H0 components
    # We start with n components (each node is a component). As threshold decreases, edges are added and components merge.
    h0_barcodes: List[Tuple[float, float]] = []
    
    # Active components mapping: node -> parent node representing the component
    parent = list(range(n))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
        
    def union(i, j, threshold):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j
            # Component root_i dies at this threshold, birth was at 1.0 (baseline node birth)
            h0_barcodes.append((1.0, threshold))
            return True
        return False

    # Get sorted edges by correlation strength
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            edges.append((fc_matrix[i, j], i, j))
    edges.sort(key=lambda x: x[0], reverse=True)
    
    # Union-Find to track H0 births/deaths
    edge_idx = 0
    num_components = n
    for t in thresholds:
        while edge_idx < len(edges) and edges[edge_idx][0] >= t:
            corr, u, v = edges[edge_idx]
            if union(u, v, t):
                num_components -= 1
            edge_idx += 1
            
    # Any components remaining alive at threshold 0.0 die at 0.0
    for _ in range(num_components):
        h0_barcodes.append((1.0, 0.0))
        
    # Estimate H1 (cycles) barcodes
    h1_barcodes: List[Tuple[float, float]] = []
    G = nx.Graph()
    G.add_nodes_from(range(n))
    
    # Track cycles
    active_cycles: Dict[int, float] = {} # cycle_id -> birth_threshold
    cycle_counter = 0
    
    edge_idx = 0
    for t in thresholds:
        while edge_idx < len(edges) and edges[edge_idx][0] >= t:
            corr, u, v = edges[edge_idx]
            
            # Check if adding this edge creates a cycle (u and v are already connected)
            if nx.has_path(G, u, v):
                # A cycle is born
                active_cycles[cycle_counter] = t
                cycle_counter += 1
            else:
                G.add_edge(u, v)
                
            edge_idx += 1
            
        # As threshold decreases, some cycles collapse/die. We model cycle death based on regional clique density.
        # Simple topological heuristic: cycle dies when average degree exceeds a limit
        density = nx.density(G)
        for cid in list(active_cycles.keys()):
            if density > 0.45: # Cycle dies due to clique fill-in
                birth = active_cycles.pop(cid)
                h1_barcodes.append((birth, t))
                
    # Unclosed cycles die at 0.0
    for cid, birth in active_cycles.items():
        h1_barcodes.append((birth, 0.0))
        
    return {
        "H0": h0_barcodes,
        "H1": h1_barcodes
    }

def calculate_persistent_entropy(barcodes: List[Tuple[float, float]]) -> float:
    """
    Computes persistent entropy H_p:
    H_p = - \sum p_i * log(p_i)
    where p_i = length_i / total_length, and length_i = birth_i - death_i.
    """
    lengths = [abs(birth - death) for birth, death in barcodes if birth > death]
    total_length = sum(lengths)
    
    if total_length == 0:
        return 0.0
        
    entropy = 0.0
    for l in lengths:
        p = l / total_length
        if p > 0:
            entropy -= p * np.log(p)
            
    return float(round(entropy, 4))

def compute_chung_generalization_capacity(fc_matrix: np.ndarray, threshold: float = 0.35) -> float:
    """
    Computes the Generalization Capacity Score GC based on Chung Population Geometry:
    GC = \sum_{i=1}^{k} 1 / \lambda_i
    where \lambda_i are the non-zero eigenvalues of the normalized Laplacian.
    Provides a metric of communication capacity and network resilience.
    """
    n = fc_matrix.shape[0]
    
    # Build adjacency from thresholded FC
    adj = (fc_matrix >= threshold).astype(float)
    np.fill_diagonal(adj, 0.0)
    
    # Compute node degrees
    degrees = np.sum(adj, axis=1)
    
    # Build normalized Laplacian: L = I - D^{-1/2} * A * D^{-1/2}
    # For isolated nodes, set degrees to 1.0 to avoid division by zero
    deg_inv_sqrt = np.zeros(n)
    for i in range(n):
        if degrees[i] > 0:
            deg_inv_sqrt[i] = 1.0 / np.sqrt(degrees[i])
            
    D_inv_sqrt = np.diag(deg_inv_sqrt)
    L = np.eye(n) - np.dot(D_inv_sqrt, np.dot(adj, D_inv_sqrt))
    
    # Eigenvalues of normalized Laplacian (all lie in [0, 2])
    eigenvalues = np.linalg.eigvalsh(L)
    
    # We omit the first eigenvalue (which is always 0) and sum 1 / \lambda_i for the rest
    non_zero_eigs = eigenvalues[eigenvalues > 1e-5]
    if len(non_zero_eigs) == 0:
        return 0.0
        
    gc = np.sum(1.0 / non_zero_eigs)
    return float(round(gc, 4))
