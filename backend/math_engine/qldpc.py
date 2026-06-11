import numpy as np
from typing import List, Tuple, Dict, Any
from .boundary import build_boundary_operator

def verify_chain_complex_property(
    simplices_k_plus_1: List[Tuple[int, ...]],
    simplices_k: List[Tuple[int, ...]],
    simplices_k_minus_1: List[Tuple[int, ...]]
) -> bool:
    """
    Verifies that the boundary of a boundary is zero:
    \partial_k * \partial_{k+1} = 0
    This is the fundamental topological identity, isomorphic to the QLDPC stabilizer
    condition H_X * H_Z^T = 0.
    """
    d_k_plus_1 = build_boundary_operator(simplices_k_plus_1, simplices_k)
    d_k = build_boundary_operator(simplices_k, simplices_k_minus_1)
    
    if d_k_plus_1.size == 0 or d_k.size == 0:
        return True # Vacuously true
        
    product = np.dot(d_k, d_k_plus_1)
    # Check if product is extremely close to zero matrix
    is_zero = np.allclose(product, 0.0, atol=1e-12)
    return bool(is_zero)

def calculate_syndrome(boundary_matrix: np.ndarray, error_vector: np.ndarray) -> np.ndarray:
    """
    Computes the error syndrome:
    s = \partial_k * e (mod 2 or over reals for continuous signals)
    """
    if boundary_matrix.size == 0 or error_vector.size == 0:
        return np.zeros(boundary_matrix.shape[0])
    return np.dot(boundary_matrix, error_vector)

def solve_l1_syndrome_decoder(
    boundary_matrix: np.ndarray,
    syndrome: np.ndarray,
    alpha: float = 0.01,
    max_iter: int = 100
) -> np.ndarray:
    """
    Syndrome decoder using coordinate descent for Lasso L1-regularization:
    minimize  0.5 * ||\partial_k * e - syndrome||_2^2 + alpha * ||e||_1
    Finds the sparsest error/repair vector e that explains the stabilizer syndrome.
    """
    num_faces, num_simplices = boundary_matrix.shape
    if num_simplices == 0:
        return np.zeros(0)
        
    # Initialize error/repair vector e to zeros
    e = np.zeros(num_simplices)
    
    # Precompute columns of boundary_matrix for faster iterations
    cols_norm = np.sum(boundary_matrix ** 2, axis=0)
    
    # Coordinate descent iterations
    for _ in range(max_iter):
        for j in range(num_simplices):
            if cols_norm[j] == 0:
                continue
                
            # Calculate residual without coordinate j
            # r_j = syndrome - \partial_k * e + \partial_k[:, j] * e[j]
            pred = np.dot(boundary_matrix, e)
            residual = syndrome - pred + boundary_matrix[:, j] * e[j]
            
            # Compute correlation with column j
            rho = np.dot(boundary_matrix[:, j], residual)
            
            # Soft thresholding operator: sign(rho) * max(0, |rho| - alpha)
            if rho > alpha:
                e[j] = (rho - alpha) / cols_norm[j]
            elif rho < -alpha:
                e[j] = (rho + alpha) / cols_norm[j]
            else:
                e[j] = 0.0
                
    return e
