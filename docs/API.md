# babelForge Holographic Engine: API Specification

This document details the strictly-typed TypeScript API specifications, units, and dimensional constraints for the Core Holographic Mathematics and Clinical Biomarker pipelines.

---

## 📐 1. Boundary Information Space API

### `computeBoundaryEntanglement`
Computes the continuous multi-dimensional informational entanglement $I(A:B) = H(A) + H(B) - H(A \cup B)$ between two subnetwork node selections using analytical Gaussian joint entropy.

```typescript
import { computeBoundaryEntanglement } from "@babelforge/core";

const entanglement: number = computeBoundaryEntanglement(
  timeSeriesData: number[][],
  indicesA: number[],
  indicesB: number[]
);
```

#### Parameters:
- `timeSeriesData` (`number[][]`): Dense matrix of continuous BOLD/EEG time-series of size $[N][T]$ where:
  - $N$: Number of parcellation nodes (up to 200).
  - $T$: Number of sliding-window timesteps.
  - Unit: Arbitrary units (z-scored signal amplitudes).
- `indicesA` (`number[]`): Indices of nodes belonging to subnetwork selection $A$. Range: $[0, N-1]$.
- `indicesB` (`number[]`): Indices of nodes belonging to subnetwork selection $B$ (complement or custom). Range: $[0, N-1]$.

#### Returns:
- `number`: Mutual information entanglement in **bits**. Range: $[0, \infty)$.

---

## 🕸️ 2. Bulk Algebraic Topology API

### `computeCombinatorialHodgeLaplacian`
Computes the combinatorial Hodge Laplacian matrix $L_k = \partial_{k+1}\partial_{k+1}^T + \partial_k^T\partial_k$ representing diffusion processes across $k$-dimensional simplicial complexes.

```typescript
import { computeCombinatorialHodgeLaplacian, SimplicialComplex } from "@babelforge/core";

const L_k: number[][] = computeCombinatorialHodgeLaplacian(
  complex: SimplicialComplex,
  k: number
);
```

#### Parameters:
- `complex` (`SimplicialComplex`): Type-safe simplicial database structure.
  - `N`: Number of vertices (200 ROIs).
  - `simplices`: Nested lists of size $[D][M_k][k+1]$ mapping dimension $k$ to its $M_k$ active simplices.
- `k` (`number`): Target topological dimension to calculate. Range: $[0, 11]$ (supporting up to 11 dimensions).

#### Returns:
- `number[][]`: Real-valued symmetric positive semi-definite matrix of size $[M_k][M_k]$ representing structural diffusion rates.

---

## 🧮 3. Ryu-Takayanagi Mapping & Optimization API

### `solveRyuTakayanagiCut`
Computes the minimal structural surface cut vector $\gamma_A$ in the bulk that minimizes the Hodge Laplacian quadratic form $\gamma_A^T L_k \gamma_A$ subject to Dirichlet boundary conditions.

```typescript
import { solveRyuTakayanagiCut, SimplicialComplex } from "@babelforge/core";

const gamma_A: number[] = solveRyuTakayanagiCut(
  L_k: number[][],
  complex: SimplicialComplex,
  k: number,
  indicesA: number[],
  indicesB: number[]
);
```

#### Parameters:
- `L_k` (`number[][]`): Combinatorial Hodge Laplacian matrix of size $[M_k][M_k]$ calculated at dimension $k$.
- `complex` (`SimplicialComplex`): Active simplicial complex.
- `k` (`number`): Target dimension. Range: $[0, 11]$.
- `indicesA` (`number[]`): Boundary nodes locked to $1.0$ (Region $A$).
- `indicesB` (`number[]`): Boundary nodes locked to $0.0$ (Region $B$).

#### Returns:
- `number[]`: Continuous-relaxed surface indicator vector of length $M_k$. Elements are bounded in $[0, 1]$.

---

## 🧬 4. QLDPC Stabilizer Resiliency API

### `decodeQLDPCSyndrome`
Performs continuous L1-regularized sparse decoding (Lasso) to reconstruct synaptic degradation vectors $e$ matching the stabilizer syndrome $\partial_k \cdot e = s$.

```typescript
import { decodeQLDPCSyndrome } from "@babelforge/core";

const errorCorrectionVector: number[] = decodeQLDPCSyndrome(
  syndrome: number[],
  boundaryMatrix: number[][],
  lambda?: number
);
```

#### Parameters:
- `syndrome` (`number[]`): Non-zero stabilizer syndrome vector $s$ of length $N_{k-1}$ representing homeostatic offset: $s = \partial_k \cdot x$.
- `boundaryMatrix` (`number[][]`): Boundary operator matrix $\partial_k$ acting as a parity-check matrix, of size $[N_{k-1}][N_k]$.
- `lambda` (`number`, *optional*): L1 sparsity regularization penalty coefficient. Defaults to $0.05$. Range: $(0, 1.0)$.

#### Returns:
- `number[]`: Reconstructed sparse synaptic correction vector $e$ of length $N_k$. Elements denote synaptic strength corrections required to recover perfect code stability.
