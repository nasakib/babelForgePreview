import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from core.ai_client import call_openrouter, call_gemini

router = APIRouter(prefix="/api", tags=["simulate"])

class SimulateRequest(BaseModel):
    experience: str
    context: Dict[str, Any]

@router.post("/simulate")
def simulate_experience(req: SimulateRequest):
    """
    Experience Simulator: maps clinician or patient text descriptions into
    arousal, dampening, chaos and repair vectors.
    """
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

    raw_response = ""
    if use_openrouter:
        try:
            raw_response = call_openrouter(prompt, model="google/gemini-2.5-pro").strip()
        except Exception as e:
            return {"error": f"OpenRouter simulation error: {str(e)}"}
    else:
        try:
            raw_response = call_gemini(prompt).strip()
        except Exception as e:
            return {"error": f"Gemini simulation error: {str(e)}"}

    try:
        # Clean markdown code blocks if any
        if raw_response.startswith("```json"): raw_response = raw_response[7:]
        if raw_response.startswith("```"): raw_response = raw_response[3:]
        if raw_response.endswith("```"): raw_response = raw_response[:-3]
        
        data = json.loads(raw_response.strip())
        return data
    except Exception as e:
        return {
            "error": f"JSON parsing of AI response failed: {str(e)}",
            "raw_response": raw_response
        }
