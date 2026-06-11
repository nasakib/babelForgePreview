import numpy as np
from typing import List, Tuple, Dict
from .boundary import build_boundary_operator

def compute_hodge_laplacian(
    simplices_k_plus_1: List[Tuple[int, ...]],
    simplices_k: List[Tuple[int, ...]],
    simplices_k_minus_1: List[Tuple[int, ...]]
) -> np.ndarray:
    """
    Computes the k-th combinatorial Hodge Laplacian matrix:
    L_k = d_{k+1} * d_{k+1}^T + d_k^T * d_k
    where d_r represents the boundary operator \partial_r.
    
    If k = 0, d_0 is 0, so L_0 = d_1 * d_1^T (standard graph Laplacian).
    """
    # boundary operator d_{k+1}: S_k -> S_{k+1} (matrix maps S_{k+1} to S_k, so size is |S_k| x |S_{k+1}|)
    d_k_plus_1 = build_boundary_operator(simplices_k_plus_1, simplices_k)
    
    # boundary operator d_k: S_{k-1} -> S_k (matrix maps S_k to S_{k-1}, so size is |S_{k-1}| x |S_k|)
    d_k = build_boundary_operator(simplices_k, simplices_k_minus_1)
    
    term_up = np.dot(d_k_plus_1, d_k_plus_1.T) if d_k_plus_1.size > 0 else np.zeros((len(simplices_k), len(simplices_k)))
    term_down = np.dot(d_k.T, d_k) if d_k.size > 0 else np.zeros((len(simplices_k), len(simplices_k)))
    
    L_k = term_up + term_down
    return L_k

def compute_betti_number(
    simplices_k_plus_1: List[Tuple[int, ...]],
    simplices_k: List[Tuple[int, ...]],
    simplices_k_minus_1: List[Tuple[int, ...]],
    tol: float = 1e-9
) -> int:
    """
    Computes the k-th Betti number \beta_k using the Hodge theorem:
    \beta_k = dim(ker(L_k)).
    This is the number of zero eigenvalues of the Hodge Laplacian L_k.
    """
    if len(simplices_k) == 0:
        return 0
        
    L_k = compute_hodge_laplacian(simplices_k_plus_1, simplices_k, simplices_k_minus_1)
    
    # Compute eigenvalues of the symmetric matrix L_k
    eigenvalues = np.linalg.eigvalsh(L_k)
    
    # Count eigenvalues close to zero (within tolerance)
    num_zero_eigenvalues = np.sum(np.abs(eigenvalues) < tol)
    
    return int(num_zero_eigenvalues)
