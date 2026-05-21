/**
 * @file bulk.ts
 * @description Bulk Topology Engine
 * 
 * Biological Analogue: Higher-order neural assemblies and structural clique complexes in cortical connectomes.
 * Physics Principle: Algebraic Topology & Bulk Spacetime Geometry; simplicial structures form the bulk manifold.
 * Runtime Complexity: O(N_k * k * log(N_{k-1})) to generate boundary matrices; O(N_k^3) or sparse equivalent for Hodge Laplacian.
 * Role in Prevention: Tracks structural integration. Degraded high-dimensional Hodge diffusion causes information cavities.
 */

export interface Simplex {
  nodes: number[]; // Sorted vertex indices
  dimension: number;
}

export interface SimplicialComplex {
  N: number; // Number of base vertices
  /** Simplicial database where simplices[k] lists all k-simplices. */
  simplices: number[][][]; // dimension k -> list of simplices (node index arrays)
}

/**
 * Validates if an array of nodes forms a sorted, unique simplex.
 */
export function createSimplex(nodes: number[]): number[] {
  return [...nodes].sort((a, b) => a - b);
}

/**
 * Checks if a subset of vertices is present in a list of simplices.
 */
export function findSimplexIndex(list: number[][], target: number[]): number {
  const tStr = target.join(",");
  for (let i = 0; i < list.length; i++) {
    if (list[i].join(",") === tStr) return i;
  }
  return -1;
}

/**
 * Builds a SimplicialComplex from an adjacency matrix up to a maximum dimension.
 * Generates all cliques (complete subgraphs) as simplices up to maxDim (default 11).
 * Uses a Bron-Kerbosch style clique enumeration.
 */
export function buildCliqueComplex(adjacency: Uint8Array | number[][], N: number, maxDim = 11): SimplicialComplex {
  const simplices: number[][][] = Array.from({ length: maxDim + 1 }, () => []);
  
  // 0-simplices (Vertices)
  for (let i = 0; i < N; i++) {
    simplices[0].push([i]);
  }
  
  const getEdge = (u: number, v: number): boolean => {
    if (adjacency instanceof Uint8Array) {
      return adjacency[u * N + v] > 0;
    }
    return adjacency[u][v] > 0;
  };
  
  // 1-simplices (Edges)
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (getEdge(i, j)) {
        simplices[1].push([i, j]);
      }
    }
  }
  
  // Higher-order cliques (up to maxDim)
  // We can recursively grow cliques
  const growCliques = (currentClique: number[], candidates: number[], k: number) => {
    if (k > maxDim) return;
    
    // Add current clique as a k-simplex if k > 1 (0 and 1 are handled)
    if (k >= 2) {
      simplices[k].push([...currentClique]);
    }
    
    for (let i = 0; i < candidates.length; i++) {
      const nextNode = candidates[i];
      
      // Verify if nextNode is connected to all elements in currentClique
      let connected = true;
      for (const node of currentClique) {
        if (!getEdge(node, nextNode)) {
          connected = false;
          break;
        }
      }
      
      if (connected) {
        // Next candidate pool must only contain nodes indexed higher than nextNode
        const nextCandidates = candidates.slice(i + 1);
        growCliques([...currentClique, nextNode], nextCandidates, k + 1);
      }
    }
  };
  
  // Start clique expansion
  for (let i = 0; i < N; i++) {
    const candidates: number[] = [];
    for (let j = i + 1; j < N; j++) {
      if (getEdge(i, j)) candidates.push(j);
    }
    growCliques([i], candidates, 1);
  }
  
  return { N, simplices };
}

/**
 * Computes the boundary operator matrix \partial_k mapping k-simplices to (k-1)-faces.
 * Alternating sign: \partial_k([v_0, ..., v_k]) = \sum (-1)^m [v_0, ..., \hat{v}_m, ..., v_k].
 * Returns a matrix of size [N_{k-1}][N_k].
 */
export function computeBoundaryOperator(complex: SimplicialComplex, k: number): number[][] {
  const maxDim = complex.simplices.length - 1;
  if (k <= 0 || k > maxDim) return [[]];
  
  const faces = complex.simplices[k - 1];
  const simplices = complex.simplices[k];
  
  const m = faces.length;
  const n = simplices.length;
  
  const boundary = Array.from({ length: m }, () => new Array(n).fill(0));
  
  if (m === 0 || n === 0) return boundary;
  
  // Map faces to their indices for O(1) index lookup
  const faceIndexMap = new Map<string, number>();
  for (let i = 0; i < m; i++) {
    faceIndexMap.set(faces[i].join(","), i);
  }
  
  for (let j = 0; j < n; j++) {
    const simplex = simplices[j];
    
    // Generate all (k-1)-faces of this k-simplex
    for (let omitIdx = 0; omitIdx < simplex.length; omitIdx++) {
      const face = simplex.filter((_, idx) => idx !== omitIdx);
      const faceKey = face.join(",");
      
      const faceIdx = faceIndexMap.get(faceKey);
      if (faceIdx !== undefined) {
        // Alternating sign: (-1)^omitIdx
        const sign = omitIdx % 2 === 0 ? 1 : -1;
        boundary[faceIdx][j] = sign;
      }
    }
  }
  
  return boundary;
}

/**
 * Transposes a matrix.
 */
export function transposeMatrix(matrix: number[][]): number[][] {
  const m = matrix.length;
  if (m === 0) return [];
  const n = matrix[0].length;
  
  const transposed = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      transposed[j][i] = matrix[i][j];
    }
  }
  return transposed;
}

/**
 * Multiplies two matrices: A (m x p) and B (p x n).
 */
export function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const m = a.length;
  if (m === 0) return [];
  const p = a[0].length;
  const n = b[0].length;
  
  const result = Array.from({ length: m }, () => new Array(n).fill(0));
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < p; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

/**
 * Adds two matrices of same dimensions.
 */
export function addMatrices(a: number[][], b: number[][]): number[][] {
  const m = a.length;
  if (m === 0) return [];
  const n = a[0].length;
  
  const result = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = a[i][j] + b[i][j];
    }
  }
  return result;
}

/**
 * Computes the combinatorial Hodge Laplacian matrix L_k.
 * L_k = \partial_{k+1} \partial_{k+1}^T + \partial_k^T \partial_k.
 * Measures higher-dimensional diffusion processes in topological complexes.
 */
export function computeCombinatorialHodgeLaplacian(complex: SimplicialComplex, k: number): number[][] {
  const maxDim = complex.simplices.length - 1;
  const numSimplices = complex.simplices[k]?.length ?? 0;
  
  if (numSimplices === 0) return [[]];
  
  // Term 1: L_k^{up} = \partial_{k+1} \cdot \partial_{k+1}^T
  let termUp = Array.from({ length: numSimplices }, () => new Array(numSimplices).fill(0));
  if (k < maxDim) {
    const dKPlus1 = computeBoundaryOperator(complex, k + 1);
    if (dKPlus1.length > 0 && dKPlus1[0].length > 0) {
      const dKPlus1T = transposeMatrix(dKPlus1);
      termUp = multiplyMatrices(dKPlus1, dKPlus1T);
    }
  }
  
  // Term 2: L_k^{down} = \partial_k^T \cdot \partial_k
  let termDown = Array.from({ length: numSimplices }, () => new Array(numSimplices).fill(0));
  if (k > 0) {
    const dK = computeBoundaryOperator(complex, k);
    if (dK.length > 0 && dK[0].length > 0) {
      const dKT = transposeMatrix(dK);
      termDown = multiplyMatrices(dKT, dK);
    }
  }
  
  return addMatrices(termUp, termDown);
}
