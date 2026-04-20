# Orion AI — Voice Agent para Atención al Cliente

Agente de voz AI tipo Jarvis/Gemini Live para atención al cliente de telecom (empresa simulada: **NovaTel Conecta S.A.**). MVP funcional end-to-end:

> 🎙️ micrófono → STT (browser) → LLM (OpenRouter / Claude) → TTS (browser) → UI reacciona en vivo

### Highlights
- **Conversación continua** — al terminar de hablar, Orion vuelve a escuchar automáticamente (experiencia tipo Gemini Live).
- **Handoff a agente humano** — cuando el LLM detecta que el caso excede al bot emite `[HANDOFF]`; el UI salta a la pantalla de transferencia *mientras* Orion termina la despedida en voz.
- **9 pantallas animadas** (idle · listening · thinking · speaking · transcript · history · handoff · settings · summary) controladas por el estado del agente.
- **Bilingüe ES/EN**, dark/light, atajos de teclado (SPACE para hablar).
- **0 USD/min de voz** — Web Speech API en Chrome/Edge reemplaza Deepgram/ElevenLabs para el MVP (swap trivial después).
- **Contexto de empresa completo** — catálogo de planes, cobertura, facturación, datos del cliente simulado y reglas de escalación ya en el system prompt.

**Live demo:** https://orion-ai.vercel.app

---

## Arquitectura

```
┌──────────────┐    HTTPS POST     ┌──────────────────┐     HTTPS     ┌──────────────┐
│  Next.js UI  │ ───────────────▶  │ FastAPI backend  │ ────────────▶ │  OpenRouter  │
│  (Vercel)    │                   │ (Railway/Render) │               │  (LLM)       │
│              │ ◀─────────────── │                   │ ◀──────────── │              │
└──────┬───────┘     JSON reply    └──────────────────┘               └──────────────┘
       │
       │ Web Speech API (browser-native)
       ├─ SpeechRecognition  (STT)
       └─ SpeechSynthesis    (TTS)
```

**Stack:**
- **Frontend:** Next.js 15 + React 19 + TypeScript (deploy en Vercel)
- **Backend:** Python 3.11 + FastAPI + httpx (deploy en Railway / Render)
- **LLM:** OpenRouter (default: `anthropic/claude-3.5-sonnet`, cambiable por env)
- **STT/TTS:** Web Speech API (Chrome/Edge — gratis, sin latencia de red)

**Por qué este stack:**
- Web Speech API quita la necesidad de Deepgram/ElevenLabs para el MVP → 0 costos de voz.
- Backend Python es el estándar para agentes AI (fácil agregar RAG, LangChain, Whisper después).
- OpenRouter da flexibilidad de modelo (Claude, GPT-4, Llama, Gemini) con una sola API key.

---

## Quick start (local)

### 1. Frontend

```bash
# en la raíz del proyecto
npm install
cp .env.local.example .env.local
# edita .env.local si el backend corre en otra URL
npm run dev
```

Abre http://localhost:3000

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# pega tu OPENROUTER_API_KEY en .env
python main.py
```

Backend corre en http://localhost:8000 — prueba con `curl http://localhost:8000/` → `{"status":"ok"}`

### 3. Usar

- Abre Chrome o Edge (Safari/Firefox no soportan Web Speech API completamente)
- Concede permiso de micrófono
- Pulsa **SPACE** o click en el sidebar → comienza a escuchar
- Habla: "Mi internet está lento desde ayer"
- Orion responde en voz y muestra la transcripción

---

## Deploy

### Frontend → Vercel (ya desplegado)

```bash
npx vercel deploy --prod
```

Después configura la variable de entorno en Vercel:
- `NEXT_PUBLIC_BACKEND_URL` = URL pública de tu backend (Railway/Render)

### Backend → Railway

1. Sube este repo a GitHub.
2. En [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
3. Selecciona la carpeta `backend/` como root.
4. Agrega variables de entorno:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL` (opcional, default Claude 3.5 Sonnet)
   - `ALLOWED_ORIGINS` (URL de tu frontend en Vercel, separadas por coma)
5. Railway detecta `railway.toml` y `Procfile` automáticamente.

### Backend → Render (alternativa)

1. New Web Service → conecta GitHub.
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Agrega las mismas env vars.

---

## Roadmap (post-MVP)

| Feature | Herramienta | Prioridad |
|---------|-------------|-----------|
| STT streaming de alta calidad | Deepgram Nova-3 | Alta |
| TTS con voz personalizada | ElevenLabs / OpenAI TTS | Alta |
| RAG sobre base de conocimiento | Supabase + pgvector | Media |
| Historial de conversaciones | Supabase Postgres | Media |
| Handoff a agente humano | LiveKit / Twilio Flex | Media |
| Llamadas telefónicas reales | Twilio Media Streams → WS | Baja |
| Workflows complejos | n8n (solo si aplica) | Baja |
| Analytics (sentiment, CSAT) | Langfuse / PostHog | Media |

---

## Estructura del proyecto

```
ORION_AI/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Fonts (Instrument Serif, Geist) + metadata
│   ├── page.tsx            # Entry (carga OrionApp client-side)
│   └── globals.css         # Design system completo (oklch tokens)
├── components/
│   ├── OrionApp.tsx        # Shell, nav, estado, integración de voz
│   ├── Screens.tsx         # 9 pantallas (idle, listening, thinking, ...)
│   └── Orb.tsx             # Esfera animada estilo Gemini + waveform
├── lib/
│   ├── i18n.ts             # Traducciones ES/EN tipadas
│   └── useVoiceAgent.ts    # Hook: Web Speech API + fetch al backend
├── backend/                # Microservicio Python
│   ├── main.py             # FastAPI app (POST /chat, /chat/stream)
│   ├── requirements.txt
│   ├── .env.example
│   ├── Procfile            # Para Render
│   └── railway.toml        # Para Railway
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## Atajos de teclado

- **SPACE** — hablar / interrumpir a Orion
- **↑ / ↓** — navegar entre pantallas (modo demo)
- **Click en sidebar** — saltar a cualquier pantalla

---

## Decisiones de diseño

**¿Por qué no n8n?**
Para un MVP de voz en tiempo real, n8n agrega latencia y complejidad sin beneficio claro. Un endpoint FastAPI de 80 líneas hace el mismo trabajo mejor. n8n tiene sentido para automatizaciones cross-sistema (abrir tickets en Zendesk, enviar SMS, etc.) — agregar en fase 2.

**¿Por qué no RAG desde el MVP?**
El system prompt actual tiene los datos del cliente simulado. Agregar RAG antes de validar la UX es prematuro. Cuando tengamos una base de conocimiento real (manuales, FAQs), Supabase + pgvector toma 1 tarde.

**¿Por qué Web Speech API en vez de Deepgram?**
Deepgram es mejor (streaming, diarización, menor WER) pero cuesta ~$0.0043/min y requiere WebSockets. Para demo y primeros usuarios, Web Speech es gratis y funciona bien en Chrome/Edge. Fácil swap después.
