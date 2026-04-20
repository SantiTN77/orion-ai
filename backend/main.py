"""
Orion AI — Voice agent backend microservice
FastAPI microservice that routes customer-support conversations through OpenRouter.
"""
import os
import re
from typing import List, Literal, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.7-sonnet")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://orion-ai.vercel.app",
).split(",")

# ---------------------------------------------------------------------------
# COMPANY CONTEXT — NovaTel S.A.
# ---------------------------------------------------------------------------
COMPANY_CONTEXT = """
== EMPRESA: NovaTel Conecta S.A. ==
Operadora de telecomunicaciones con presencia en México, Colombia y Argentina.

PLANES RESIDENCIALES:
  • Básico 100   → 100 Mbps bajada / 20 Mbps subida — $199 MXN/mes
  • Avanzado 300 → 300 Mbps bajada / 60 Mbps subida — $349 MXN/mes
  • Fibra 600    → 600 Mbps bajada / 120 Mbps subida — $499 MXN/mes (el más popular)
  • Ultra 1Gbps  → 1 Gbps simétrico — $799 MXN/mes

PLANES EMPRESA:
  • PYME 500     → 500 Mbps / IP dedicada / soporte 24h — $899 MXN/mes
  • Corporativo  → A medida con SLA garantizado

COBERTURA Y TECNOLOGÍA:
  - Fibra óptica FTTH (hasta el hogar) en zonas urbanas.
  - Cable HFC en zonas suburbanas.
  - Sin límite de datos en todos los planes.
  - Router NovaTel Wave6 incluido en préstamo con cada contrato.

SOPORTE TÉCNICO:
  - Reinicio remoto de router disponible (lo puede hacer Orion).
  - Diagnóstico de línea en tiempo real disponible.
  - Tiempo de reparación en campo: 24-72 h hábiles.
  - App NovaTel: disponible en iOS y Android para ver estado de la línea.

FACTURACIÓN:
  - Ciclo mensual, corte el día 1 de cada mes.
  - Métodos de pago: tarjeta, transferencia SPEI, tiendas de conveniencia.
  - Penalización por cancelación anticipada: 1 mes de cuota restante.
  - Promoción actual: 2 meses gratis al contratar Fibra 600 o Ultra 1Gbps.

CLIENTE ACTUAL (SIMULADO):
  Nombre: Laura Méndez
  Plan: Fibra 600 — $499 MXN/mes
  Contrato: #OR-884731
  Dirección de servicio: Av. Insurgentes 1240, CDMX
  Estado de cuenta: Al corriente
  Última factura: $499 MXN — 01/04/2026 — PAGADA
  Router: NovaTel Wave6 (MAC: A4:C3:F0:11:77:2B) — Firmware 3.1.2
  Diagnóstico línea: Señal OK, 98% uptime último mes
  Tickets abiertos: Ninguno

ESCALACIONES — CUÁNDO PASAR A AGENTE HUMANO:
  - El cliente solicita expresamente hablar con una persona.
  - Problemas de facturación complejos (cobros incorrectos, devoluciones).
  - Quejas formales o amenaza de cancelación.
  - Fallo técnico persistente tras reinicio remoto y diagnóstico.
  - Solicitudes de cambio de titular o modificaciones de contrato.
"""

SYSTEM_PROMPT_ES = f"""Eres Orion, asistente de voz de atención al cliente de NovaTel Conecta.

{COMPANY_CONTEXT}

REGLAS DE CONVERSACIÓN:
- Responde SIEMPRE en español neutro latinoamericano, tono cálido, empático y profesional.
- Máximo 2-3 oraciones por turno (eres voz, no texto).
- Cero markdown, listas ni emojis. Habla de forma completamente natural.
- Haz UNA sola pregunta de diagnóstico por turno.
- Si puedes resolver el problema técnico: ofrece reiniciar el router remotamente o ejecutar diagnóstico de línea.
- Si el caso requiere agente humano: despídete de forma cálida, informa que vas a transferir y responde EXACTAMENTE con la etiqueta al final: [HANDOFF]
- Si el usuario no dice nada útil en su turno, invita amablemente a que reformule.
- Nunca inventes información fuera del contexto de la empresa proporcionado.
"""

SYSTEM_PROMPT_EN = f"""You are Orion, NovaTel Conecta's voice customer-service assistant.

{COMPANY_CONTEXT}

CONVERSATION RULES:
- ALWAYS respond in neutral Latin American Spanish accent — or in English if the customer explicitly prefers it.
- Keep responses to 2-3 sentences max (voice only, not text).
- No markdown, lists, or emojis. Speak naturally.
- Ask ONE diagnostic question per turn.
- For technical issues: offer remote router restart or line diagnostics.
- If human agent is needed: give a warm farewell, say you will transfer the call, and end your reply with exactly: [HANDOFF]
- Never invent information outside the company context provided.
"""

# Keywords that indicate the AI decided to escalate (safety fallback)
HANDOFF_PATTERNS = re.compile(
    r"\[HANDOFF\]|transfiriendo|voy a transferir(te)?|paso(ré)? con un agente|"
    r"agente humano te (atenderá|ayudará)|connecting you to|transferring you",
    re.IGNORECASE,
)


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    lang: Literal["es", "en"] = "es"
    stream: bool = False


class ChatResponse(BaseModel):
    reply: str
    model: str
    action: Optional[str] = None   # e.g. "handoff"


app = FastAPI(title="Orion AI Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok", "service": "orion-ai", "model": OPENROUTER_MODEL}


def build_messages(req: ChatRequest) -> List[dict]:
    system = SYSTEM_PROMPT_ES if req.lang == "es" else SYSTEM_PROMPT_EN
    out = [{"role": "system", "content": system}]
    for m in req.messages:
        if m.role == "system":
            continue
        out.append({"role": m.role, "content": m.content})
    return out


def detect_action(reply: str) -> Optional[str]:
    """Return 'handoff' if the reply signals escalation to a human agent."""
    if HANDOFF_PATTERNS.search(reply):
        return "handoff"
    return None


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(500, "OPENROUTER_API_KEY not configured")

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": build_messages(req),
        "temperature": 0.65,
        "max_tokens": 300,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://orion-ai.vercel.app",
        "X-Title": "Orion AI Voice Agent",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        if r.status_code != 200:
            raise HTTPException(r.status_code, f"OpenRouter error: {r.text}")
        data = r.json()

    raw_reply = data["choices"][0]["message"]["content"].strip()
    # Strip the hidden tag from the spoken reply
    clean_reply = re.sub(r"\[HANDOFF\]", "", raw_reply).strip()
    action = detect_action(raw_reply)

    return ChatResponse(reply=clean_reply, model=OPENROUTER_MODEL, action=action)



@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """Server-sent-events stream of LLM tokens, for lower perceived latency."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(500, "OPENROUTER_API_KEY not configured")

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": build_messages(req),
        "temperature": 0.6,
        "max_tokens": 250,
        "stream": True,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://orion-ai.vercel.app",
        "X-Title": "Orion AI Voice Agent",
        "Content-Type": "application/json",
    }

    async def gen():
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", OPENROUTER_URL, json=payload, headers=headers) as r:
                async for line in r.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    chunk = line[6:]
                    if chunk == "[DONE]":
                        break
                    yield f"data: {chunk}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
