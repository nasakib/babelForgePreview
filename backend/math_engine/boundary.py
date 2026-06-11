import numpy as np
from typing import List, Set, Tuple, Dict

def get_all_faces(simplex: Tuple[int, ...]) -> List[Tuple[int, ...]]:
    """Returns all codimension-1 faces of a simplex."""
    faces = []
    for i in range(len(simplex)):
        face = simplex[:i] + simplex[i+1:]
        faces.append(face)
    return faces

def build_boundary_operator(simplices_k: List[Tuple[int, ...]], simplices_k_minus_1: List[Tuple[int, ...]]) -> np.ndarray:
    """
    Builds the boundary matrix partial_k of size |S_{k-1}| x |S_k|.
    The entry at (f, s) is (-1)^i if the f-th (k-1)-simplex is obtained
    by removing the i-th vertex of the s-th k-simplex, and 0 otherwise.
    """
    num_faces = len(simplices_k_minus_1)
    num_simplices = len(simplices_k)
    
    if num_faces == 0 or num_simplices == 0:
        return np.zeros((num_faces, num_simplices))
        
    # Map face tuples to their indices for fast O(1) lookup
    face_to_idx = {face: idx for idx, face in enumerate(simplices_k_minus_1)}
    
    partial = np.zeros((num_faces, num_simplices), dtype=np.float64)
    
    for s_idx, simplex in enumerate(simplices_k):
        for i, vertex in enumerate(simplex):
            # Create face by omitting the i-th vertex
            face = simplex[:i] + simplex[i+1:]
            if face in face_to_idx:
                f_idx = face_to_idx[face]
                # Alternating sign (-1)^i
                partial[f_idx, s_idx] = (-1) ** i
                
    return partial
