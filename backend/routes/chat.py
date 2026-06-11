import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from core.ai_client import call_openrouter, call_gemini

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]

@router.post("/chat")
def chat_endpoint(req: ChatRequest):
    """
    FORGEai clinical assistant: forwards clinicians' queries plus current connectome
    state variables to a prompt-tuned Gemini/OpenRouter model.
    """
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
        try:
            text = call_gemini(prompt)
            return {"response": text}
        except Exception as e:
            return {"response": f"Error communicating with AI: {str(e)}"}
