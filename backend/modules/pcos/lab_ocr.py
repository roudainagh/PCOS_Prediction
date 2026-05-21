"""
lab_ocr.py
----------
Send one or more lab-report images to Groq and get back a ClinicalRequest.
Values extracted from each image are merged — useful when results are split
across multiple pages (e.g. prolactin on page 1, FSH/LH/TSH on page 2).
 
Setup:
    pip install httpx
    Get a free API key at https://console.groq.com
    set GROQ_API_KEY=your_key_here
"""
 
import base64
import json
import os
import re
import httpx
 
from .schemas import ClinicalRequest
 
# ── Config ────────────────────────────────────────────────────────────────────
GROQ_API_KEY = "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"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "meta-llama/llama-4-scout-17b-16e-instruct"
 
SYSTEM_PROMPT = """You are a medical-lab OCR assistant.
Extract hormone values from the lab report image and return ONLY a JSON object with exactly these keys (use null if absent or illegible):
 
{
  "fsh_miu_ml": <number or null>,
  "lh_miu_ml": <number or null>,
  "prolactin_ng_ml": <number or null>,
  "tsh_uiu_ml": <number or null>,
  "testosterone_ng_ml": <number or null>,
  "ovary_volume_left_cm3": <number or null>,
  "ovary_volume_right_cm3": <number or null>,
  "follicle_count_left": <number or null>,
  "follicle_count_right": <number or null>
}
 
Rules:
- TSH in µUI/ml or µIU/ml → tsh_uiu_ml
- FSH in mUI/ml or mIU/ml → fsh_miu_ml
- LH in mUI/ml or mIU/ml  → lh_miu_ml
- Prolactin in ng/ml       → prolactin_ng_ml
- Testosterone in ng/ml    → testosterone_ng_ml (if in ng/dL divide by 100)
- French decimal comma: 16,18 → 16.18
- Return ONLY the JSON object, no markdown, no explanation."""
 
 
def _to_b64(image_bytes: bytes) -> str:
    return base64.standard_b64encode(image_bytes).decode("utf-8")
 
 
def _call_groq(image_bytes: bytes, media_type: str) -> dict:
    """Extract values from a single image, returns dict with nulls for missing keys."""
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{_to_b64(image_bytes)}"},
                    },
                    {"type": "text", "text": "Extract the hormone values from this lab report."},
                ],
            },
        ],
        "max_tokens": 512,
        "temperature": 0,
    }
 
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
 
    response = httpx.post(GROQ_API_URL, json=payload, headers=headers, timeout=30)
    response.raise_for_status()
 
    raw_text = response.json()["choices"][0]["message"]["content"].strip()
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
    raw_text = re.sub(r"\s*```$", "", raw_text)
 
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON found in model response: {raw_text[:300]}")
 
    return json.loads(match.group())
 
 
def _merge(results: list[dict]) -> dict:
    """Merge multiple extraction dicts — first non-null value for each key wins."""
    keys = [
        "fsh_miu_ml", "lh_miu_ml", "prolactin_ng_ml", "tsh_uiu_ml",
        "testosterone_ng_ml", "ovary_volume_left_cm3", "ovary_volume_right_cm3",
        "follicle_count_left", "follicle_count_right",
    ]
    merged = {k: None for k in keys}
    for result in results:
        for k in keys:
            if merged[k] is None and result.get(k) is not None:
                merged[k] = result[k]
    return merged
 
 
def extract_clinical_from_images(
    images: list[tuple[bytes, str]]  # list of (image_bytes, media_type)
) -> ClinicalRequest:
    """
    Main entry point. Pass a list of (bytes, media_type) tuples.
    Results from all images are merged before building the ClinicalRequest.
    """
    results = [_call_groq(img_bytes, media_type) for img_bytes, media_type in images]
    extracted = _merge(results)
 
    def _get(key: str, default=None):
        val = extracted.get(key)
        return default if val is None else float(val)
 
    mandatory = ["fsh_miu_ml", "lh_miu_ml", "prolactin_ng_ml", "tsh_uiu_ml", "testosterone_ng_ml"]
    missing = [k for k in mandatory if extracted.get(k) is None]
    if missing:
        raise ValueError(
            f"Could not extract the following required values from the images: {missing}. "
            "Please upload clearer images or enter values manually."
        )
 
    return ClinicalRequest(
        fsh_miu_ml             = _get("fsh_miu_ml"),
        lh_miu_ml              = _get("lh_miu_ml"),
        prolactin_ng_ml        = _get("prolactin_ng_ml"),
        tsh_uiu_ml             = _get("tsh_uiu_ml"),
        testosterone_ng_ml     = _get("testosterone_ng_ml"),
        ovary_volume_left_cm3  = _get("ovary_volume_left_cm3",  0.0),
        ovary_volume_right_cm3 = _get("ovary_volume_right_cm3", 0.0),
        follicle_count_left    = _get("follicle_count_left",    0.0),
        follicle_count_right   = _get("follicle_count_right",   0.0),
    )
 