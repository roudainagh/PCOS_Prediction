# chat/router.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import os, httpx, json

router = APIRouter(prefix="/chat", tags=["Chat"])

GROQ_API_KEY = "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"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "meta-llama/llama-4-scout-17b-16e-instruct"

SYSTEM_PROMPT = """You are Pulse, a friendly and knowledgeable AI health assistant 
for the PMOS (PCOS Monitoring & Support) platform. 

You help users understand:
- What PCOS (Polycystic Ovary Syndrome) is and its symptoms
- How to interpret their risk scores (Low/Medium/High) from symptom assessments
- What clinical lab values mean (FSH, LH, TSH, prolactin, testosterone, follicle count)
- General lifestyle advice for managing PCOS (diet, exercise, stress)
- How to use the PMOS app (symptom checker, lab upload, dashboard)
- When to seek medical attention

Rules:
- Always remind users you are not a doctor and cannot diagnose
- Be warm, empathetic, and supportive — PCOS is emotionally difficult
- Keep answers concise (3-5 sentences max unless asked for detail)
- If asked about something unrelated to PCOS or the app, politely redirect
- Never invent specific medical advice or medication dosages
"""

class Message(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@router.post("/message")
async def chat(data: ChatRequest):
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[{"role": m.role, "content": m.content} for m in data.messages],
        ],
        "max_tokens": 512,
        "temperature": 0.7,
        "stream": True,
    }

    async def stream_groq():
        async with httpx.AsyncClient(timeout=30) as client:
            async with client.stream(
                "POST", GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            ) as resp:
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        chunk = line[6:]
                        if chunk.strip() == "[DONE]":
                            break
                        try:
                            delta = json.loads(chunk)["choices"][0]["delta"].get("content", "")
                            if delta:
                                yield delta          # ← yields str, that's fine
                        except (json.JSONDecodeError, KeyError, IndexError):
                            pass

    return StreamingResponse(
        stream_groq(),
        media_type="text/plain",
        headers={"X-Accel-Buffering": "no"},   
    )