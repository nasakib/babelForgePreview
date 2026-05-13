# Babel Forge: Google Cloud Platform (GCP) Migration Plan

## 1. Architectural Overview
The current iteration of Babel Forge operates entirely on the client-side (Frontend Composition) to remain compatible with static GitHub Pages hosting. To unlock the full potential of the precision neuroscience engine (including heavy matrix math, real-time multi-user synchronization, and secure patient data handling), the application will migrate to a modern, serverless GCP architecture.

### Target Architecture
*   **Frontend (UI/UX & WebGL):** React / Next.js SPA
    *   **Hosting:** Cloud Storage bucket fronted by **Cloud CDN** and Cloud Load Balancing for global, low-latency asset delivery.
*   **API Gateway & Security:**
    *   **Google Cloud API Gateway:** Manages rate limiting, CORS, and routing.
    *   **Firebase Authentication:** Handles secure clinician/researcher login.
*   **Backend (Physics & Topology Engine):**
    *   **Hosting:** **Cloud Run** (fully managed serverless containers).
    *   **Runtime:** Python / FastAPI.
    *   **Functionality:** Moves the heavy `forge.py` algorithms (Algebraic Topology, Kuramoto phase-locking, Dijkstra pathfinding) to the server. Computes the overlapping modifier matrices on the fly instead of relying on precalculated JSON/JS blobs.
*   **Database (State & Stack Storage):**
    *   **Cloud Firestore:** Real-time NoSQL database to store user-created "NeuroStacks", patient parameters (Weight, Tolerance profiles), and saved baseline topologies.

## 2. Scientific & Mathematical Scalability
Migrating to Cloud Run allows us to utilize high-performance compute instances (and potentially GPU acceleration via specific Cloud Run provisioning or GKE).
*   **Current Limitation:** The browser struggles with network sizes > 200 nodes due to single-threaded V8 limitations and memory caps.
*   **GCP Capability:** We can scale the Schaefer Atlas integration to **1000+ ROI (Regions of Interest)** and simulate continuous-time Kuramoto differential equations natively in Python (using libraries like `numpy`, `scipy`, or `jax`), passing only the lightweight position/color vectors back to the client via WebSockets or Server-Sent Events (SSE).

## 3. Implementation Phases

### Phase A: Backend Containerization
1.  Refactor `forge.py` into a `main.py` FastAPI application.
2.  Create REST endpoints:
    *   `POST /simulate`: Accepts a payload of `[Active States]`, `[Pharmacopeia Stack]`, and `[Patient Parameters]`. Returns the computed 3D vector coordinates and topological integrity scores.
    *   `POST /optimize`: Accepts a pathological baseline and runs a gradient descent algorithm on the server to find the mathematically optimal molecule/dose combination.
3.  Write a `Dockerfile` and deploy the image to **Google Artifact Registry**.
4.  Deploy to **Cloud Run**.

### Phase B: Frontend API Integration
1.  Remove the `window.precalculatedTopologyData` static data load.
2.  Update `composeTopology()` and `calculateAI()` in the frontend to make asynchronous `fetch()` calls to the new Cloud Run endpoints.
3.  Implement loading states (skeletons/spinners) while the server computes the physics.

### Phase C: Infrastructure as Code (IaC) & Deployment
1.  Write Terraform scripts to provision the Cloud Storage bucket, IAM roles, API Gateway, and Cloud Run instances.
2.  Set up **GitHub Actions** for CI/CD:
    *   On push to `main`, run Python unit tests.
    *   Build and push the Docker image to Artifact Registry.
    *   Deploy the new revision to Cloud Run.
    *   Sync frontend assets to the Cloud Storage bucket and invalidate the Cloud CDN cache.

## 4. Security & Compliance Readiness
*   By moving patient parameters (weight, tolerance, pathology combinations) to POST requests over HTTPS (TLS 1.3), we secure the data in transit.
*   Firestore allows us to build HIPAA-compliant data silos for saving longitudinal simulation results.