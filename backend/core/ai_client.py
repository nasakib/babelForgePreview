import os
import json
import urllib.request
import google.generativeai as genai
from typing import Dict, Any

def call_openrouter(prompt: str, model: str = "google/gemini-2.5-pro") -> str:
    """Invokes OpenRouter chat completions endpoint with the specified model."""
    api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API key not configured.")
        
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

def call_gemini(prompt: str) -> str:
    """Invokes standard Google Generative AI API using the configured key."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured on server.")
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content(prompt)
    return response.text
