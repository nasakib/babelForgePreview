/**
 * @file database.ts
 * @description Production-grade TypeScript schemas for Firestore & Vector DB layout.
 * 
 * Defines type-safe structures mapping Boundary functional profiles, Bulk algebraic topology coordinates,
 * empirical Target Forge subject records, and semantic vector database embeddings.
 */

// ============================================================================
// 1. SUBJECT RECORDS & EMPIRICAL SPECTRAL FINGERPRINTS
// ============================================================================

/**
 * Path: /subjects/{subjectId}
 * Represents subject clinical profiles and ground-truth responsive/resistant markers.
 */
export interface FirestoreSubjectDocument {
  subjectId: string;
  createdAt: string; // ISO Timestamp
  updatedAt: string;
  demographics: {
    age: number;
    gender: string;
    clinicalDiagnosis: string; // e.g., "PTSD"
  };
  /**
   * Ground-truth clinical label:
   * 0 = Treatment-RESPONSIVE
   * 1 = Treatment-RESISTANT
   */
  treatmentResistanceStatus: 0 | 1;
  hasConsolidatedFingerprint: boolean;
  notes?: string;
}

/**
 * Path: /subjects/{subjectId}/fourier_fingerprints/{scanId}
 * Stores the continuous spectral arrays (32 frequency bins x 200 Schaefer ROIs).
 */
export interface FirestoreFourierFingerprintDocument {
  scanId: string;
  subjectId: string;
  timestamp: number; // Unix Epoch Milliseconds
  scannerHarmonizationToken: string; // e.g., "3T_SIEMENS_PRISMA_UPENN"
  /**
   * 200 x 32 continuous matrix.
   * Row index matches Schaefer 200-ROI coordinates (0..199).
   * Column index matches 32 spectral bins from 0.01 Hz to 0.1 Hz (0..31).
   */
  fingerprintMatrix: number[][]; 
  meanAmplitude: number;
  qualityScore: number; // quality assurance metric [0..1]
}

// ============================================================================
// 2. SIMULATION SCHEMAS (BOUNDARY / BULK / DIAGNOSTICS)
// ============================================================================

/**
 * Path: /simulations/{simId}/boundary_states/{stateId}
 * Functional Boundary Information profiles.
 */
export interface FirestoreBoundaryStateDocument {
  stateId: string;
  simId: string;
  timestamp: number;
  /** Sliding window duration key */
  windowSizeSeconds: number;
  /** Dense 200x200 symmetric Mutual Information Matrix (serialized coordinate map or row-major array) */
  mutualInformationMatrix: number[][];
  globalEntropyProfile: {
    meanShannonEntropy: number;
    varianceEntropy: number;
    totalSystemCapacityBits: number;
  };
  /** Calculated subnetwork entanglement tracking (AdS/CFT Boundary Entanglement) */
  subnetworkEntanglements: {
    selectionAName: string;
    selectionBName: string;
    indicesA: number[];
    indicesB: number[];
    entanglementEntropyBits: number;
  }[];
}

/**
 * Path: /simulations/{simId}/bulk_topology/{topologyId}
 * Structural Algebraic Topology datasets.
 */
export interface FirestoreBulkTopologyDocument {
  topologyId: string;
  simId: string;
  timestamp: number;
  /** Number of active vertices (ROIs) in the simplicial complex */
  activeVertexCount: number;
  /** List of active k-simplices (complete cliques) indexed by dimension [k] */
  activeSimplicesCount: { [dim: number]: number };
  /** Persistent Homology landscape birth-death statistics */
  persistentHomologyLandscape: {
    dimension: number;
    birth: number;
    death: number;
    persistence: number;
    nodes: number[];
  }[];
  /** Compressed Coordinate (COO) sparse matrix formats of boundary operators \partial_1, \partial_2, \partial_3 */
  boundaryOperatorsSparse: {
    dimension: number; // e.g., 1, 2, 3
    rows: number; // N_{k-1}
    cols: number; // N_k
    /** Sparsified entries: array of [rowIndex, colIndex, value] */
    nonZeroValues: [number, number, number][];
  }[];
  /** QLDPC Parity-Check stabilized syndromes */
  stabilizerSyndromes: {
    dimension: number;
    /** Parity check syndrome vector s where \partial_k * e = s != 0 */
    syndromeVector: number[];
    isStable: boolean; // true if s = 0 (perfect manifold integrity)
    activeHomologyErrorClass?: string; // Homology class identifier for logical error
  }[];
}

/**
 * Path: /simulations/{simId}/diagnostics/{diagnosticId}
 * Houses performance tracking scoreboard parameters.
 */
export interface FirestoreDiagnosticsDocument {
  diagnosticId: string;
  simId: string;
  timestamp: number;
  /** Node Persistence matrix: sum of lifetimes per node */
  nodePersistenceProfile: number[];
  /** Persistent Entropy: structural organization complexity */
  persistentEntropy: number;
  /** Generalization Capacity Score powered by Chung Population Error equation */
  generalizationCapacity: {
    scorePercent: number; // Generalization Capacity Score (0..100)
    representationDimensionalityD: number;
    taskCorrelationRho: number;
    signalToNoiseRatioSNR: number;
  };
  clinicalProfilePrediction: {
    predictedLabel: 0 | 1; // 0 = Treatment-Responsive, 1 = Treatment-Resistant
    probabilityOfResistance: number;
  };
}

// ============================================================================
// 3. SUPERVISED CLASSIFIERS & FEATURE SIEVES
// ============================================================================

/**
 * Path: /simulations/{simId}/biomarker_forges/{forgeId}
 * Tracks the training state, accuracy profiles, and classification models.
 */
export interface FirestoreBiomarkerForgeDocument {
  forgeId: string;
  simId: string;
  updatedAt: string;
  /** Balanced class metrics target-locked to 95.52% baseline performance */
  modelMetrics: {
    accuracy: number; // Target: 0.9552
    precision: number;
    recall: number;
    f1Score: number;
    balancedClassWeights: { [label: number]: number };
  };
  trainingLogs: {
    epoch: number;
    loss: number;
    validationAccuracy: number;
  }[];
}

/**
 * Path: /simulations/{simId}/logos_sieves/{sieveId}
 * Preserves top-10 hottest connection logs matching Schaefer descriptors.
 */
export interface FirestoreLogosSieveDocument {
  sieveId: string;
  simId: string;
  timestamp: number;
  topFeatures: {
    rank: number;
    index: number;
    roi: number;
    roiName: string;
    bin: number;
    frequencyHz: number;
    networkName: string;
    importanceWeight: number;
    currentAmplitude: number;
  }[];
  detectedInformationDropOffs: {
    network: string;
    severityPercent: number;
    triggeredBulkCollapse: boolean;
  }[];
}

// ============================================================================
// 4. VECTOR DATABASE INTERACTION SCHEMAS
// ============================================================================

/**
 * Interface representing Vector Database Records.
 * Multi-dimensional semantic vector states generated by high-dimensional concepts
 * are indexed against the topological coordinates of the bulk cavities containing them.
 * This facilitates ultra-fast similarity searches across geometric neural states.
 */
export interface VectorDBEmbeddingRecord {
  /** Unique semantic concept vector ID */
  embeddingId: string;
  /** High-dimensional text or concept embedding vector (e.g., length 1536) */
  embeddingVector: number[];
  /** Semantic description of the high-dimensional concept */
  metadata: {
    conceptLabel: string;
    clinicalSignificance: string;
    associatedSubjectiveExpression: string;
  };
  /** Indexed coordinate parameters linking semantic state to the Bulk Simplicial Complex */
  topologicalBulkAnchor: {
    /** Simplex dimension containing the concept */
    cavityDimension: number;
    /** Simplex index inside the bulk complex */
    simplexIndex: number;
    /** Participating node indices forming the cavity boundary */
    boundaryNodes: number[];
    /** Topological Hodge Laplacian energy around this cavity */
    localHodgeLaplacianEnergy: number;
  };
}
