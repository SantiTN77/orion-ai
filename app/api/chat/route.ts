/**
 * Orion AI — Chat endpoint (Next.js App Router, Edge-compatible).
 *
 * Proxies a customer-service conversation through OpenRouter (Claude).
 * Detects `[HANDOFF]` in the reply and returns `action: "handoff"` so the
 * UI can jump to the human-agent screen while the farewell audio plays.
 *
 * Mirrors backend/main.py (kept as a reference / Railway alternative).
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

const COMPANY_CONTEXT = `
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
`;

const SYSTEM_PROMPT_ES = `Eres Orion, asistente de voz de atención al cliente de NovaTel Conecta.

${COMPANY_CONTEXT}

REGLAS DE CONVERSACIÓN:
- Responde SIEMPRE en español neutro latinoamericano, tono cálido, empático y profesional.
- Máximo 2-3 oraciones por turno (eres voz, no texto).
- Cero markdown, listas ni emojis. Habla de forma completamente natural.
- Haz UNA sola pregunta de diagnóstico por turno.
- Si puedes resolver el problema técnico: ofrece reiniciar el router remotamente o ejecutar diagnóstico de línea.
- REGLA CRÍTICA DE ESCALACIÓN: Si el usuario pide explícitamente hablar con una persona/agente/humano/supervisor, o menciona "cancelar servicio", "poner una queja formal", "quiero hablar con alguien", "no quiero hablar con un bot", DEBES:
  (1) Responder UNA frase cálida confirmando que lo transfieres (ej: "Entendido Laura, te voy a pasar ahora mismo con un agente humano que te va a atender en breve.")
  (2) TERMINAR tu respuesta con la etiqueta literal: [HANDOFF]
  No hagas más preguntas de diagnóstico si ya pidió agente humano.
- Si el usuario no dice nada útil en su turno, invita amablemente a que reformule.
- Nunca inventes información fuera del contexto de la empresa proporcionado.
`;

const SYSTEM_PROMPT_EN = `You are Orion, NovaTel Conecta's voice customer-service assistant.

${COMPANY_CONTEXT}

CONVERSATION RULES:
- Respond in English (or Spanish if the user speaks Spanish), warm and professional.
- Keep responses to 2-3 sentences max (voice only, not text).
- No markdown, lists, or emojis. Speak naturally.
- Ask ONE diagnostic question per turn.
- For technical issues: offer remote router restart or line diagnostics.
- If human agent is needed: warm farewell, say you will transfer, end reply with: [HANDOFF]
- Never invent information outside the company context provided.
`;

const HANDOFF_RE = /\[HANDOFF\]|transfiriendo|voy a transferir(te)?|te (voy a |vamos a )?pas(o|ar|amos)( ahora)?( mismo)? con un agente|agente (humano )?(te|le) (va a atender|atender[aá]|ayudar[aá])|connecting you to|transferring you/i;

// Fallback: if the LLM forgets to emit [HANDOFF], scan the *user* message
// for unmistakable escalation intent. Triggers handoff even if the reply
// is a normal answer — the UI still jumps to the transfer screen.
const USER_ESCALATION_RE = /\b(agente humano|hablar con (una )?persona|hablar con (un |una )?humano|hablar con alguien|no quiero (hablar con )?(un )?bot|quiero (un )?supervisor|pon(er|go) (una )?queja formal|cancelar mi (servicio|contrato|cuenta))\b/i;

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatBody {
  messages: IncomingMessage[];
  lang?: "es" | "en";
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured on the server" },
      { status: 500 },
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lang = body.lang === "en" ? "en" : "es";
  const system = lang === "es" ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;

  const messages = [
    { role: "system", content: system },
    ...(body.messages || []).filter(m => m.role !== "system"),
  ];

  const origin = req.headers.get("origin") || "https://orion-ai.vercel.app";

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": origin,
      "X-Title": "Orion AI Voice Agent",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.65,
      max_tokens: 200,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: `OpenRouter ${upstream.status}`, detail: text.slice(0, 400) },
      { status: upstream.status },
    );
  }

  const data = await upstream.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const raw = (data.choices?.[0]?.message?.content || "").trim();
  const clean = raw.replace(/\[HANDOFF\]/g, "").trim();

  const lastUserMsg =
    [...(body.messages || [])].reverse().find(m => m.role === "user")?.content || "";
  const action =
    HANDOFF_RE.test(raw) || USER_ESCALATION_RE.test(lastUserMsg) ? "handoff" : null;

  return NextResponse.json({
    reply: clean,
    model: DEFAULT_MODEL,
    action,
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "orion-ai", model: DEFAULT_MODEL });
}
