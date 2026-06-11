import math
import random
from typing import List, Dict, Any

def build_parcels() -> List[Dict[str, Any]]:
    """Curated 32-parcel set covering Yeo-7 networks bilaterally with MNI coordinates."""
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

def synthesize_bold(
    parcels: List[Dict[str, Any]],
    n_tr: int,
    tr: float,
    pathologies: List[str],
) -> List[List[float]]:
    """Coupled-oscillator + HRF-shaped BOLD generator."""
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

    fast_dt = 0.01
    fast_steps_per_tr = int(round(tr / fast_dt))
    total_fast = n_tr * fast_steps_per_tr

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

    hrf_t = [k * fast_dt for k in range(int(round(20.0 / fast_dt)))]
    def _gamma(t: float, a: float, b: float) -> float:
        if t <= 0:
            return 0.0
        return (t ** (a - 1)) * math.exp(-t / b) / (b ** a)

    hrf = [_gamma(t, 6, 0.9) - 0.35 * _gamma(t, 16, 0.9) for t in hrf_t]
    norm = max(abs(v) for v in hrf) or 1.0
    hrf = [v / norm for v in hrf]

    bold: List[List[float]] = []
    for i in range(n):
        s = neural[i]
        conv = [0.0] * len(s)
        for t in range(len(s)):
            acc = 0.0
            kmax = min(len(hrf), t + 1)
            for k in range(kmax):
                acc += hrf[k] * s[t - k]
            conv[t] = acc
        ds = [conv[k * fast_steps_per_tr] for k in range(n_tr) if k * fast_steps_per_tr < len(conv)]
        if len(ds) < n_tr:
            ds = ds + [ds[-1]] * (n_tr - len(ds))
        mu = sum(ds) / len(ds)
        var = sum((v - mu) ** 2 for v in ds) / len(ds)
        sd = math.sqrt(var) if var > 0 else 1.0
        bold.append([round((v - mu) / sd, 4) for v in ds])
    return bold

def pearson_fc(ts: List[List[float]]) -> List[List[float]]:
    """Computes Pearson Functional Connectivity [N][N] from BOLD signals."""
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

def mean_off_diag(m: List[List[float]]) -> float:
    """Mean off-diagonal functional connectivity strength."""
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

def entropy_estimate(m: List[List[float]]) -> float:
    """Shannon entropy of the histogram of off-diagonal FC values."""
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
