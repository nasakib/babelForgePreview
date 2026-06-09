import random
import math
import os
import io
import csv
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict, Tuple

app = FastAPI(title="babelForge API", description="Backend Engine for Computational Topology and Pharmacopeia")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allowing all origins for custom domain compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathologicalState(BaseModel):
    states: List[str]

class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/topology")
def get_topology_data():
    """Generates composable topology data for babelForge."""
    num_nodes = 200
    nodes = []
    
    # Brain dimensions (Ellipsoid)
    a, b, c = 48, 38, 58
    
    for i in range(num_nodes):
        while True:
            x = random.uniform(-a, a)
            y = random.uniform(-b, b)
            z = random.uniform(-c, c)
            if (x/a)**2 + (y/b)**2 + (z/c)**2 <= 1:
                if abs(x) < 4: continue
                break
                
        hemi = "RH" if x > 0 else "LH"
        if z < -25: cluster = "Visual"
        elif y > 18 and -25 <= z <= 20: cluster = "SomatoMotor"
        elif z > 25 and y > 5: cluster = "Control"
        elif z > 25 and y <= 5: cluster = "Limbic"
        elif y < -5 and -25 <= z <= 20: cluster = "VentAttn"
        else: cluster = "Default"
            
        nodes.append({
            "id": i,
            "name": f"{hemi}_{cluster}_{i}",
            "region": cluster,
            "hemi": hemi,
            "x": round(x, 2),
            "y": round(y, 2),
            "z": round(z, 2),
            "cliques": 0,
            "hubness": 0
        })

    # Generate Baseline Healthy State
    baseline_edges = []
    baseline_cliques = []
    
    # 1. Guarantee global connectivity via K-Nearest Neighbors (KNN)
    k_neighbors = 3
    for i in range(num_nodes):
        distances = [(j, (nodes[j]["x"]-nodes[i]["x"])**2 + (nodes[j]["y"]-nodes[i]["y"])**2 + (nodes[j]["z"]-nodes[i]["z"])**2) for j in range(num_nodes) if i != j]
        distances.sort(key=lambda item: item[1])
        for j, dist in distances[:k_neighbors]:
            pair = tuple(sorted((i, j)))
            baseline_edges.append(pair)
            
    # 2. Add high-dimensional functional cliques
    # Healthy: 60 cliques, max dim 11
    for _ in range(60):
        dim = random.randint(2, 11)
        clique_size = dim + 1
        center_node = random.choice(nodes)
        
        distances = [(j, (n["x"]-center_node["x"])**2 + (n["y"]-center_node["y"])**2 + (n["z"]-center_node["z"])**2) for j, n in enumerate(nodes)]
        distances.sort(key=lambda item: item[1])
        c_nodes = [idx for idx, d in distances[:clique_size]]
        
        baseline_cliques.append({"nodes": sorted(c_nodes), "dimension": dim})
        for nid in c_nodes:
            nodes[nid]["cliques"] += 1
            nodes[nid]["hubness"] += round(clique_size / 10.0, 2)
            
        for i in range(len(c_nodes)):
            for j in range(i + 1, len(c_nodes)):
                pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                baseline_edges.append(pair)

    baseline_edges = list(set(baseline_edges))
    baseline_edges_formatted = [{"source": u, "target": v} for u, v in baseline_edges]

    baseline = {
        "nodes": nodes,
        "edges": baseline_edges_formatted,
        "cliques": baseline_cliques,
        "stats": {"clique_count": len(baseline_cliques)}
    }

    def create_modifier(state_type):
        edges_added = set()
        edges_removed = set()
        cliques_added = []
        cliques_removed = [] # We'll just remove a percentage of baseline cliques
        
        num_remove = 0
        num_add = 0
        max_dim = 5
        bias_region = None
        
        if state_type == "PTSD":
            num_remove = 45 # Massive collapse
            num_add = 10
            max_dim = 4
            bias_region = "Limbic"
        elif state_type == "ADHD":
            num_remove = 25
            num_add = 5
            max_dim = 5
            bias_region = "Control" # Removes from control, doesn't add much
        elif state_type == "TOURETTES":
            num_remove = 10
            num_add = 30
            max_dim = 9
            bias_region = "SomatoMotor"
        elif state_type == "DEPRESSION":
            num_remove = 30
            num_add = 20
            max_dim = 6
            bias_region = "Default"
            
        # Remove cliques (simulate collapse)
        indices_to_remove = random.sample(range(len(baseline_cliques)), min(num_remove, len(baseline_cliques)))
        if state_type == "ADHD":
             # Try to preferentially remove Control cliques
             control_cliques = [i for i, c in enumerate(baseline_cliques) if any(nodes[nid]["region"] == "Control" for nid in c["nodes"])]
             indices_to_remove = random.sample(control_cliques, min(num_remove, len(control_cliques)))
             
        for idx in indices_to_remove:
            cliques_removed.append(baseline_cliques[idx]["nodes"])
            c_nodes = baseline_cliques[idx]["nodes"]
            for i in range(len(c_nodes)):
                for j in range(i + 1, len(c_nodes)):
                    pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                    edges_removed.add(pair)
                    
        # Add cliques (simulate pathological hyper-connectivity)
        for _ in range(num_add):
            dim = random.randint(2, max_dim)
            clique_size = dim + 1
            
            valid_centers = [n for n in nodes if n["region"] == bias_region] if bias_region and random.random() < 0.8 else nodes
            if not valid_centers: valid_centers = nodes
            center_node = random.choice(valid_centers)
            
            distances = [(j, (n["x"]-center_node["x"])**2 + (n["y"]-center_node["y"])**2 + (n["z"]-center_node["z"])**2) for j, n in enumerate(nodes)]
            distances.sort(key=lambda item: item[1])
            c_nodes = sorted([idx for idx, d in distances[:clique_size]])
            cliques_added.append({"nodes": c_nodes, "dimension": dim})
            
            for i in range(len(c_nodes)):
                for j in range(i + 1, len(c_nodes)):
                    pair = tuple(sorted((c_nodes[i], c_nodes[j])))
                    edges_added.add(pair)

        # Cleanup: Don't remove an edge if it was just added, etc.
        actual_edges_removed = edges_removed - edges_added
        # We only add edges that aren't already in the baseline
        actual_edges_added = edges_added - set(baseline_edges)

        return {
            "edges_added": [{"source": u, "target": v} for u, v in actual_edges_added],
            "edges_removed": [{"source": u, "target": v} for u, v in actual_edges_removed],
            "cliques_added": cliques_added,
            "cliques_removed": cliques_removed
        }

    modifiers = {
        "PTSD": create_modifier("PTSD"),
        "ADHD": create_modifier("ADHD"),
        "TOURETTES": create_modifier("TOURETTES"),
        "DEPRESSION": create_modifier("DEPRESSION")
    }

    return {
        "baseline": baseline,
        "modifiers": modifiers
    }

@app.get("/api/pharma")
def get_pharma_data():
    """Generates expanded pharmacopeia data for babelForge."""
    num_nodes = 50
    nodes = []
    colors = ["#9333EA", "#7c3aed", "#6366f1", "#4f46e5", "#3730a3"]
    
    for i in range(num_nodes):
        angle = (i / num_nodes) * 2 * math.pi
        r = 80 + random.uniform(-10, 10)
        nodes.append({
            "id": f"node_{i}",
            "x": r * math.cos(angle),
            "y": r * math.sin(angle),
            "z": random.uniform(-40, 40),
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

    drugs = [
        {"id": "ZB-01", "name": "ZB-01", "class": "Precision", "target": "Global Phase-Locking"},
        {"id": "SS-20", "name": "SS-20", "class": "Precision", "target": "Frontoparietal Upregulation"},
        {"id": "LL-07", "name": "LimbicLink (LL-07)", "class": "Precision", "target": "DMN Fluidity Restoration"},
        {"id": "DR-02", "name": "DR-02", "class": "Precision", "target": "Somatomotor Dampening"},
        {"id": "NX-44", "name": "NX-44", "class": "Precision", "target": "Global Synaptogenesis"},
        {"id": "FLX", "name": "Fluoxetine", "class": "Conventional", "target": "Broad Serotonin Reuptake"},
        {"id": "KET", "name": "Ketamine", "class": "Conventional", "target": "NMDA Antagonism"},
        {"id": "AMP", "name": "Amphetamine", "class": "Conventional", "target": "Global Monoamine Release"},
        {"id": "THC", "name": "Delta-9-THC", "class": "Recreational", "target": "CB1 Agonism (Entropy Inc.)"},
        {"id": "CBD", "name": "Cannabidiol", "class": "Functional", "target": "CB Modulation / 5-HT1A"},
        {"id": "NIC", "name": "Nicotine", "class": "Recreational", "target": "nAChR Agonism (Transient FP)"},
        {"id": "IBO", "name": "Ibogaine", "class": "Precision", "target": "Mesolimbic GDNF/BDNF Upregulation"}
    ]

    return {
        "nodes": nodes,
        "states": {
            "pre_treatment": {"edges": get_edges(80), "cliques": []},
            "post_treatment": {
                "edges": get_edges(200),
                "cliques": [[f"node_{i}" for i in random.sample(range(num_nodes), random.randint(3, 8))] for _ in range(15)]
            }
        },
        "drugs": drugs
    }

class SimulateRequest(BaseModel):
    experience: str
    context: Dict[str, Any]

def call_openrouter(prompt: str, model: str = "google/gemini-2.5-pro") -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API key not configured.")
    
    import urllib.request
    import json
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/google-gemini/antigravity",
    }
    
    data = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    with urllib.request.urlopen(req, timeout=30) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        if "choices" in res_data and len(res_data["choices"]) > 0:
            return res_data["choices"][0]["message"]["content"]
        elif "error" in res_data:
            raise ValueError(f"OpenRouter Error: {res_data['error']}")
        else:
            raise ValueError(f"Unexpected OpenRouter response: {res_data}")

@app.post("/api/simulate")
def simulate_experience(req: SimulateRequest):
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    use_openrouter = bool(openrouter_key or (gemini_key and gemini_key.startswith("sk-or-")))

    prompt = (
        "You are babelForge's simulation engine. The user has described a subjective experience, intervention, or state. "
        "You must map this experience into exactly 4 pharmacological/topological vectors (arousal, dampening, chaos, repair) "
        "each ranging from -2.0 to 3.0.\n\n"
        "Here is the canonical reference specification of our proprietary compounds to guide your vector mapping:\n"
        "- Seriphadine (Oneirogenic Anxiolytic): arousal: -0.4, dampening: 1.2, chaos: 0.8, repair: 0.4\n"
        "- SPUR-MTDL (Epigenetic Neuroplastogen): arousal: -0.2, dampening: 0.5, chaos: -1.8, repair: 3.5\n"
        "- ZenBud (ZB-01) (Anxiolytic Ligand): arousal: -0.4, dampening: 1.0, chaos: -0.5, repair: 0.6\n"
        "- LimbicLink (LL-07) (DMN Modulator): arousal: -0.2, dampening: 0.3, chaos: 0.4, repair: 1.2\n"
        "- SynaptoStim (SS-20) (Targeted DRI): arousal: 1.5, dampening: 0.0, chaos: -0.2, repair: 0.5\n"
        "- DopaReg (DR-02) (Precision Antagonist): arousal: -0.5, dampening: 1.2, chaos: -0.4, repair: 0.2\n"
        "- NeuroX (NX-44) (BDNF Enhancer): arousal: 0.2, dampening: 0.1, chaos: -0.5, repair: 2.5\n"
        "- Jianshouqing Mushroom (Oneirogenic Hallucinogen): arousal: 0.1, dampening: 0.3, chaos: 1.8, repair: 0.8\n"
        "- Ibogaine (GDNF/BDNF Neurogenesis): arousal: 0.2, dampening: 0.5, chaos: 0.8, repair: 3.0\n\n"
        "You must also provide a short 'label' (e.g. 'Acute Stress Response'), a 'desc' (objective topological description), "
        "and a 'subj' (projected subjective feeling). "
        f"User Experience: {req.experience}\n"
        f"Current Baseline Pathologies: {req.context.get('pathologies', [])}\n"
        "Return ONLY a valid JSON object with the following exact keys: "
        '{"arousal": float, "dampening": float, "chaos": float, "repair": float, "label": "string", "desc": "string", "subj": "string"}'
    )

    if use_openrouter:
        try:
            text = call_openrouter(prompt, model="google/gemini-2.5-pro").strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            
            import json
            data = json.loads(text.strip())
            return data
        except Exception as e:
            return {"error": f"OpenRouter simulation error: {str(e)}"}
    else:
        api_key = gemini_key
        if not api_key:
            return {"error": "GEMINI_API_KEY not configured."}
        
        genai.configure(api_key=api_key)
        try:
            model = genai.GenerativeModel('gemini-1.5-flash-latest')
            response = model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
            
            import json
            data = json.loads(text)
            return data
        except Exception as e:
            return {"error": str(e)}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    use_openrouter = bool(openrouter_key or (gemini_key and gemini_key.startswith("sk-or-")))

    system_instruction = (
        "You are babelAI, a clinical computational neuroscience assistant. "
        "You explain and answer based on the proprietary science of babelForge "
        "(algebraic topology, multi-dimensional cliques, Kuramoto phase-locking) "
        "and the latest peer-reviewed literature. Be concise, clinical, precise. "
        "When grounding evidence is provided below, CITE the listed sources by "
        "their labels in your response and DO NOT invent citations. If a claim "
        "is not supported by the grounding or by widely accepted clinical "
        "consensus, explicitly mark it as a model inference rather than fact."
    )

    ctx = req.context or {}
    grounding = ctx.get("grounding", "")
    grounding_block = f"\n\n{grounding}\n" if grounding else ""
    brain_tokens = ctx.get("brainTokens", "")
    tokens_block = f"\n\n{brain_tokens}\n" if brain_tokens else ""
    has_dataset = bool(ctx.get("hasDataset"))
    dataset_block = (
        "\nAn uploaded fMRI dataset is loaded. When the user asks about regions, "
        "FC, networks, or scale-equivalents, reference the brain tokens above by "
        "their canonical handles (e.g. R:HPC, M:5HT, X:meanFC).\n"
        if has_dataset
        else ""
    )

    prompt = (
        f"{system_instruction}\n\n"
        f"System Context:\n"
        f"Module: {ctx.get('module', 'None')}\n"
        f"Pathologies: {ctx.get('pathologies', [])}\n"
        f"Stack: {ctx.get('stack', [])}\n"
        f"Baseline Alignment Score: {ctx.get('integrityScore', 'N/A')}%"
        f"{grounding_block}"
        f"{tokens_block}"
        f"{dataset_block}\n"
        f"User Query: {req.message}"
    )

    if use_openrouter:
        try:
            text = call_openrouter(prompt, model="google/gemini-2.5-pro")
            return {"response": text}
        except Exception as e:
            return {"response": f"Error communicating with OpenRouter: {str(e)}"}
    else:
        api_key = gemini_key
        if not api_key:
            return {"response": "GEMINI_API_KEY not configured on server. Please configure it in GitHub Secrets."}
        
        genai.configure(api_key=api_key)
        try:
            model = genai.GenerativeModel('gemini-1.5-flash-latest')
            response = model.generate_content(prompt)
            return {"response": response.text}
        except Exception as e:
            return {"response": f"Error communicating with AI: {str(e)}"}

@app.post("/api/fmri/analyze")
async def analyze_fmri(file: UploadFile = File(...), pathologies: Optional[str] = Form(None)):
    """
    Accept an fMRI upload and return a structured dataset the frontend
    engines can apply functions to.

    Real-data path: if the upload is a CSV, TSV, TXT or JSON containing numerical
    BOLD matrix, we parse it directly. Otherwise we synthesize a physiologically
    plausible BOLD dataset via coupled-oscillator dynamics + HRF convolution
    biased by detected pathologies. Either way, the returned payload includes:

      - parcels        : list of parcel metadata (id, name, network, MNI,
                         dominant frequency, hemi).
      - tr             : repetition time in seconds.
      - time_series    : float matrix [n_parcels][n_TR] (downsampled to
                         keep the JSON payload reasonable).
      - fc_matrix      : Pearson functional connectivity [n][n].
      - topology       : legacy node/edge structure for NeuroCanvas.
      - diagnostic_profile : pathology labels for AIContext routing.
    """
    import asyncio
    await asyncio.sleep(1.0)

    raw = await file.read()

    # ----- Parse CSV/TSV/TXT/JSON if applicable ------------------------------
    parsed_bold: Optional[List[List[float]]] = None
    filename_lower = file.filename.lower() if file.filename else ""
    
    if filename_lower.endswith((".csv", ".tsv", ".txt")):
        try:
            text = raw.decode("utf-8", errors="replace")
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            rows: List[List[float]] = []
            
            # Detect separator
            separator = ","
            if lines:
                first_line = lines[0]
                if "\t" in first_line:
                    separator = "\t"
                elif ";" in first_line:
                    separator = ";"
                elif " " in first_line and "," not in first_line:
                    separator = None
            
            for line in lines:
                if separator is None:
                    parts = line.split()
                else:
                    parts = line.split(separator)
                
                vals = []
                for p in parts:
                    p = p.strip()
                    if not p:
                        continue
                    try:
                        vals.append(float(p))
                    except ValueError:
                        pass
                if vals:
                    rows.append(vals)
            
            if rows and len(rows) >= 2 and len(rows[0]) >= 2:
                n_rows = len(rows)
                n_cols = len(rows[0])
                if n_cols > n_rows:
                    parsed_bold = rows
                else:
                    parsed_bold = [[rows[t][r] for t in range(n_rows)] for r in range(n_cols)]
        except Exception as e:
            print(f"Backend parsing text BOLD matrix failed: {e}")
            parsed_bold = None
            
    elif filename_lower.endswith(".json"):
        try:
            import json
            text = raw.decode("utf-8", errors="replace")
            obj = json.loads(text)
            matrix = None
            if isinstance(obj, list) and len(obj) >= 2 and isinstance(obj[0], list):
                matrix = obj
            elif isinstance(obj, dict):
                for k in ["time_series", "timeSeries", "data", "bold", "matrix"]:
                    if k in obj and isinstance(obj[k], list) and len(obj[k]) >= 2 and isinstance(obj[k][0], list):
                        matrix = obj[k]
                        break
            
            if matrix:
                n_rows = len(matrix)
                n_cols = len(matrix[0])
                num_matrix = [[float(v) for v in row if not isinstance(v, str)] for row in matrix]
                num_matrix = [row for row in num_matrix if row]
                if num_matrix and len(num_matrix) >= 2 and len(num_matrix[0]) >= 2:
                    n_rows = len(num_matrix)
                    n_cols = len(num_matrix[0])
                    if n_cols > n_rows:
                        parsed_bold = num_matrix
                    else:
                        parsed_bold = [[num_matrix[t][r] for t in range(n_rows)] for r in range(n_cols)]
        except Exception as e:
            print(f"Backend parsing JSON BOLD matrix failed: {e}")
            parsed_bold = None

    # ----- Parcels (real Yeo-7 inspired layout, 32 ROIs) ---------------------
    parcels = _build_parcels()
    n_parcels = len(parcels)

    # ----- Decide pathologies ------------------------------------------------
    detected_pathologies = None
    if pathologies:
        try:
            import json
            parsed_paths = json.loads(pathologies)
            if isinstance(parsed_paths, list):
                detected_pathologies = [str(p).lower() for p in parsed_paths]
        except Exception:
            pass
            
    if not detected_pathologies:
        detected_pathologies = random.sample(
            ["depression", "anxiety", "adhd", "ptsd", "ocd", "addiction"],
            random.randint(1, 2),
        )

    # ----- Build BOLD time series -------------------------------------------
    tr = 2.0
    n_tr = 150
    if parsed_bold is not None:
        src = parsed_bold
        src_n_regions = len(src)
        time_series: List[List[float]] = []
        for p in range(n_parcels):
            src_idx = int(p * src_n_regions / n_parcels)
            src_row = src[src_idx] if src_idx < src_n_regions else src[-1]
            if not src_row:
                row = [0.0] * n_tr
            elif len(src_row) < n_tr:
                row = list(src_row) + [src_row[-1]] * (n_tr - len(src_row))
            else:
                row = src_row[:n_tr]
            
            # z-score the row
            mu = sum(row) / len(row)
            var = sum((v - mu) ** 2 for v in row) / len(row)
            sd = math.sqrt(var) if var > 0 else 1.0
            time_series.append([round((v - mu) / sd, 4) for v in row])
    else:
        time_series = _synthesize_bold(parcels, n_tr, tr, detected_pathologies)

    # ----- Functional connectivity (Pearson) --------------------------------
    fc_matrix = _pearson_fc(time_series)

    # ----- Legacy node/edge topology for NeuroCanvas ------------------------
    edge_threshold = 0.35
    nodes: List[Dict[str, Any]] = []
    for i, p in enumerate(parcels):
        nodes.append({
            "id": i,
            "name": p["name"],
            "region": p["network"],
            "hemi": p["hemi"],
            "x": p["mni"][0],
            "y": p["mni"][1],
            "z": p["mni"][2],
            "cliques": 0,
            "hubness": 0,
        })
    edges: List[Dict[str, Any]] = []
    for i in range(n_parcels):
        for j in range(i + 1, n_parcels):
            r = fc_matrix[i][j]
            if r >= edge_threshold:
                edges.append({"source": i, "target": j, "weight": round(r, 3)})

    return {
        "filename": file.filename,
        "status": "success",
        "source": "csv" if parsed_bold is not None else "synthesized",
        "diagnostic_profile": detected_pathologies,
        "parcels": parcels,
        "tr": tr,
        "time_series": time_series,
        "fc_matrix": fc_matrix,
        "topology": {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_edges": len(edges),
                "mean_fc": _mean_off_diag(fc_matrix),
                "estimated_entropy": _entropy_estimate(fc_matrix),
            },
        },
    }


# ----------------------------------------------------------------------------
# fMRI helpers (stdlib only)
# ----------------------------------------------------------------------------

def _build_parcels() -> List[Dict[str, Any]]:
    """Curated 32-parcel set covering Yeo-7 networks bilaterally.

    Centroids are MNI-approximate. Each parcel carries the dominant EEG
    band frequency the frontend uses to set its motion / animation Hz.
    """
    base = [
        # (id, name, network, x, y, z, freqHz)
        ("L_V1",   "L Primary Visual",      "Visual",       -10, -85,   0, 45),
        ("R_V1",   "R Primary Visual",      "Visual",        10, -85,   0, 45),
        ("L_V2",   "L Extrastriate",        "Visual",       -20, -75,   5, 45),
        ("R_V2",   "R Extrastriate",        "Visual",        20, -75,   5, 45),
        ("L_M1",   "L Primary Motor",       "SomatoMotor",  -40, -20,  55, 20),
        ("R_M1",   "R Primary Motor",       "SomatoMotor",   40, -20,  55, 20),
        ("L_S1",   "L Primary Sensory",     "SomatoMotor",  -40, -30,  55, 20),
        ("R_S1",   "R Primary Sensory",     "SomatoMotor",   40, -30,  55, 20),
        ("L_A1",   "L Primary Auditory",    "SomatoMotor",  -50, -22,   8, 45),
        ("R_A1",   "R Primary Auditory",    "SomatoMotor",   50, -22,   8, 45),
        ("L_DAN",  "L Dorsal Attn (IPS)",   "DorsalAttn",   -30, -55,  50, 20),
        ("R_DAN",  "R Dorsal Attn (IPS)",   "DorsalAttn",    30, -55,  50, 20),
        ("L_FEF",  "L Frontal Eye Field",   "DorsalAttn",   -28,  -5,  55, 20),
        ("R_FEF",  "R Frontal Eye Field",   "DorsalAttn",    28,  -5,  55, 20),
        ("L_INS",  "L Anterior Insula",     "VentAttn",     -40,  10,   0, 20),
        ("R_INS",  "R Anterior Insula",     "VentAttn",      40,  10,   0, 20),
        ("L_ACC",  "L Anterior Cingulate",  "VentAttn",      -5,  30,  20,  6),
        ("R_ACC",  "R Anterior Cingulate",  "VentAttn",       5,  30,  20,  6),
        ("L_OFC",  "L Orbitofrontal",       "Limbic",       -20,  35, -18, 10),
        ("R_OFC",  "R Orbitofrontal",       "Limbic",        20,  35, -18, 10),
        ("L_HPC",  "L Hippocampus",         "Limbic",       -28, -22, -15,  6),
        ("R_HPC",  "R Hippocampus",         "Limbic",        28, -22, -15,  6),
        ("L_AMY",  "L Amygdala",            "Limbic",       -25,  -5, -20, 45),
        ("R_AMY",  "R Amygdala",            "Limbic",        25,  -5, -20, 45),
        ("L_DLPFC","L DLPFC",               "Control",      -40,  35,  35, 20),
        ("R_DLPFC","R DLPFC",               "Control",       40,  35,  35, 20),
        ("L_IPL",  "L Inferior Parietal",   "Control",      -45, -55,  50, 20),
        ("R_IPL",  "R Inferior Parietal",   "Control",       45, -55,  50, 20),
        ("L_VMPFC","L VMPFC",               "Default",       -5,  45, -15, 10),
        ("R_VMPFC","R VMPFC",               "Default",        5,  45, -15, 10),
        ("L_PCC",  "L Posterior Cingulate", "Default",       -5, -50,  30, 10),
        ("R_PCC",  "R Posterior Cingulate", "Default",        5, -50,  30, 10),
    ]
    parcels = []
    for i, (pid, name, network, x, y, z, freq) in enumerate(base):
        parcels.append({
            "index": i,
            "id": pid,
            "name": name,
            "network": network,
            "hemi": "LH" if pid.startswith("L_") else "RH",
            "mni": [x, y, z],
            "freqHz": freq,
        })
    return parcels


def _synthesize_bold(
    parcels: List[Dict[str, Any]],
    n_tr: int,
    tr: float,
    pathologies: List[str],
) -> List[List[float]]:
    """Coupled-oscillator + HRF-shaped BOLD generator.

    The neural signal at each parcel is a phase oscillator at the parcel's
    dominant frequency, coupled to other parcels in the same Yeo network.
    Pathology biases the coupling matrix: depression boosts DMN coupling,
    anxiety boosts amygdala-DMN, ADHD weakens control coupling, etc. The
    raw oscillator output is convolved with a canonical HRF (gamma
    difference) to produce BOLD.
    """
    n = len(parcels)
    rng = random.Random(sum(ord(c) for c in "".join(pathologies)) or 42)

    # Coupling matrix
    K = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            same_net = parcels[i]["network"] == parcels[j]["network"]
            K[i][j] = 0.4 if same_net else 0.05

    def _boost(idxs: List[int], factor: float) -> None:
        for a in idxs:
            for b in idxs:
                if a != b:
                    K[a][b] *= factor

    def _idx(net: str) -> List[int]:
        return [p["index"] for p in parcels if p["network"] == net]

    def _by_id_prefix(prefix: str) -> List[int]:
        return [p["index"] for p in parcels if prefix in p["id"]]

    if "depression" in pathologies:
        _boost(_idx("Default"), 1.6)
        _boost(_idx("Control"), 0.6)
    if "anxiety" in pathologies:
        _boost(_by_id_prefix("AMY") + _idx("Default"), 1.4)
    if "ptsd" in pathologies:
        _boost(_by_id_prefix("AMY") + _by_id_prefix("HPC"), 1.7)
    if "adhd" in pathologies:
        _boost(_idx("Control") + _idx("DorsalAttn"), 0.5)
    if "ocd" in pathologies:
        _boost(_by_id_prefix("ACC") + _by_id_prefix("OFC"), 1.6)
    if "addiction" in pathologies:
        _boost(_by_id_prefix("INS") + _by_id_prefix("OFC"), 1.5)

    # Simulate a fast neural signal at 100 Hz, downsample to BOLD
    fast_dt = 0.01
    fast_steps_per_tr = int(round(tr / fast_dt))
    total_fast = n_tr * fast_steps_per_tr

    # Phase oscillators at each parcel's neural frequency
    phases = [rng.uniform(0, 2 * math.pi) for _ in range(n)]
    omegas = [2 * math.pi * p["freqHz"] for p in parcels]

    neural: List[List[float]] = [[] for _ in range(n)]
    for t in range(total_fast):
        new_phases = []
        for i in range(n):
            coupling = 0.0
            for j in range(n):
                if i == j:
                    continue
                coupling += K[i][j] * math.sin(phases[j] - phases[i])
            dphi = omegas[i] + coupling + rng.gauss(0, 0.3)
            new_phases.append(phases[i] + fast_dt * dphi)
        phases = new_phases
        for i in range(n):
            neural[i].append(math.sin(phases[i]))

    # Canonical HRF (difference of two gammas, Glover 1999 simplification)
    hrf_t = [k * fast_dt for k in range(int(round(20.0 / fast_dt)))]
    def _gamma(t: float, a: float, b: float) -> float:
        if t <= 0:
            return 0.0
        return (t ** (a - 1)) * math.exp(-t / b) / (b ** a)

    hrf = [_gamma(t, 6, 0.9) - 0.35 * _gamma(t, 16, 0.9) for t in hrf_t]
    norm = max(abs(v) for v in hrf) or 1.0
    hrf = [v / norm for v in hrf]

    # Convolve neural with HRF then downsample to TR
    bold: List[List[float]] = []
    for i in range(n):
        s = neural[i]
        # Truncated convolution
        conv = [0.0] * len(s)
        for t in range(len(s)):
            acc = 0.0
            kmax = min(len(hrf), t + 1)
            for k in range(kmax):
                acc += hrf[k] * s[t - k]
            conv[t] = acc
        # Downsample to TR
        ds = [conv[k * fast_steps_per_tr] for k in range(n_tr) if k * fast_steps_per_tr < len(conv)]
        if len(ds) < n_tr:
            ds = ds + [ds[-1]] * (n_tr - len(ds))
        # z-score
        mu = sum(ds) / len(ds)
        var = sum((v - mu) ** 2 for v in ds) / len(ds)
        sd = math.sqrt(var) if var > 0 else 1.0
        bold.append([round((v - mu) / sd, 4) for v in ds])
    return bold


def _pearson_fc(ts: List[List[float]]) -> List[List[float]]:
    n = len(ts)
    T = len(ts[0])
    means = [sum(row) / T for row in ts]
    stds = []
    for i in range(n):
        var = sum((v - means[i]) ** 2 for v in ts[i]) / T
        stds.append(math.sqrt(var) if var > 0 else 1.0)
    fc = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i, n):
            if i == j:
                fc[i][j] = 1.0
                continue
            cov = 0.0
            for t in range(T):
                cov += (ts[i][t] - means[i]) * (ts[j][t] - means[j])
            cov /= T
            r = cov / (stds[i] * stds[j])
            fc[i][j] = round(r, 4)
            fc[j][i] = fc[i][j]
    return fc


def _mean_off_diag(m: List[List[float]]) -> float:
    n = len(m)
    if n < 2:
        return 0.0
    acc = 0.0
    cnt = 0
    for i in range(n):
        for j in range(n):
            if i != j:
                acc += m[i][j]
                cnt += 1
    return round(acc / cnt, 4) if cnt else 0.0


def _entropy_estimate(m: List[List[float]]) -> float:
    # Shannon entropy of the histogram of off-diagonal FC values.
    vals: List[float] = []
    n = len(m)
    for i in range(n):
        for j in range(i + 1, n):
            vals.append(m[i][j])
    if not vals:
        return 0.0
    bins = 20
    lo = min(vals)
    hi = max(vals)
    if hi - lo < 1e-9:
        return 0.0
    width = (hi - lo) / bins
    counts = [0] * bins
    for v in vals:
        idx = min(bins - 1, int((v - lo) / width))
        counts[idx] += 1
    total = sum(counts)
    h = 0.0
    for c in counts:
        if c == 0:
            continue
        p = c / total
        h -= p * math.log(p)
    return round(h / math.log(bins), 4)