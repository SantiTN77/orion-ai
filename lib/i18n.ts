export type Lang = "es" | "en";

export interface TranscriptMsg {
  who: "user" | "orion";
  t: string;
  time: string;
  active?: boolean;
}

export interface HistoryItem {
  t: string;
  d: string;
  m: string;
  unread?: boolean;
}

export interface HistoryGroup {
  label: string;
  items: HistoryItem[];
}

export interface Translations {
  brand: string;
  tagline: string;
  status: {
    idle: string;
    listening: string;
    thinking: string;
    speaking: string;
    escalating: string;
    settings: string;
    summary: string;
    history: string;
  };
  nav: {
    idle: string;
    listening: string;
    thinking: string;
    speaking: string;
    transcript: string;
    history: string;
    handoff: string;
    settings: string;
    summary: string;
  };
  idle: { hello: string; sub: string; hint: string; version: string };
  listening: { title: string; sub: string; cue: string; level: string; stop: string };
  thinking: { title: string; sub: string; steps: { l: string; s: string }[] };
  speaking: { title: string; body: string; action: string; skip: string };
  transcript: { title: string; tag: string; live: string; msgs: TranscriptMsg[] };
  history: { title: string; new: string; search: string; groups: HistoryGroup[] };
  handoff: {
    title: string; sub: string; agent: string; role: string;
    wait: string; waitv: string; ctx: string; ctxItems: string[];
    cancel: string; confirm: string;
  };
  settings: {
    title: string; sub: string; voice: string; voices: string[];
    lang: string; langs: string[]; persona: string; personas: string[];
    speed: string; interrupt: string; interruptSub: string; wake: string; wakeSub: string;
  };
  summary: {
    title: string; ticket: string; customer: string; duration: string;
    sentiment: string; result: string; problem: string; problemT: string;
    action: string; actionT: string; next: string; nextT: string;
    close: string; reopen: string;
  };
}

export const I18N: Record<Lang, Translations> = {
  es: {
    brand: "ORION",
    tagline: "Asistente de voz · Atención al cliente",
    status: {
      idle: "En espera",
      listening: "Escuchando",
      thinking: "Procesando",
      speaking: "Respondiendo",
      escalating: "Transfiriendo",
      settings: "Ajustes",
      summary: "Resumen",
      history: "Historial",
    },
    nav: {
      idle: "01 · Standby",
      listening: "02 · Escuchando",
      thinking: "03 · Procesando",
      speaking: "04 · Respondiendo",
      transcript: "05 · Transcripción",
      history: "06 · Historial",
      handoff: "07 · Agente humano",
      settings: "08 · Ajustes",
      summary: "09 · Resumen",
    },
    idle: {
      hello: "Hola, soy Orion.",
      sub: "Tu asistente de voz para soporte técnico. Di \u201cHola Orion\u201d o toca para empezar.",
      hint: "Pulsa espacio · mantén para hablar",
      version: "Orion v0.4 · Red Fibra 600",
    },
    listening: {
      title: "Te escucho",
      sub: "Habla con naturalidad. Puedes interrumpirme cuando quieras.",
      cue: "Mi internet está lento desde ayer por la tarde\u2026",
      level: "Nivel de voz",
      stop: "Detener",
    },
    thinking: {
      title: "Consultando tu cuenta",
      sub: "Revisando diagnóstico de la línea y últimos tickets.",
      steps: [
        { l: "Identificando cliente", s: "MX·5521·884731" },
        { l: "Diagnóstico de línea", s: "PING · SNR · pérdida" },
        { l: "Historial de 30 días", s: "3 incidencias" },
        { l: "Generando respuesta", s: "ES · voz Aurora" },
      ],
    },
    speaking: {
      title: "Revisé tu línea",
      body: "Detecté pérdida de señal en el nodo de tu zona desde las 19:42 de ayer. Voy a reiniciar tu router de forma remota — tarda unos 40 segundos. ¿Te parece bien?",
      action: "Reiniciar router",
      skip: "No, explícame primero",
    },
    transcript: {
      title: "Transcripción en vivo",
      tag: "EN VIVO",
      live: "Orion transcribe cada palabra en tiempo real. Puedes editar antes de cerrar el ticket.",
      msgs: [
        { who: "user", t: "Hola, tengo problemas con mi internet desde ayer.", time: "00:03" },
        { who: "orion", t: "Claro, déjame revisar tu línea. ¿Me confirmas el número de contrato?", time: "00:06" },
        { who: "user", t: "Sí, es 884-731, el que está a nombre de Laura Méndez.", time: "00:11" },
        { who: "orion", t: "Perfecto Laura. Veo que hubo una caída de señal en tu zona desde las 19:42.", time: "00:18" },
        { who: "user", t: "¿Eso qué significa? ¿Se va a arreglar solo?", time: "00:24" },
        { who: "orion", t: "Ya está restablecida la conexión general. Falta reiniciar tu router\u2026", time: "00:27", active: true },
      ],
    },
    history: {
      title: "Conversaciones",
      new: "Nueva llamada",
      search: "Buscar\u2026",
      groups: [
        { label: "Hoy", items: [
          { t: "Internet lento · Laura M.", d: "Router reiniciado", m: "ahora", unread: true },
          { t: "Cambio de plan · Diego R.", d: "Escalado a ventas", m: "10:22" },
        ]},
        { label: "Ayer", items: [
          { t: "Factura duplicada · Ana P.", d: "Reembolso emitido", m: "19:03" },
          { t: "Instalación nueva · Óscar T.", d: "Cita agendada", m: "16:40" },
          { t: "Corte total · Marta V.", d: "Resuelto", m: "14:11" },
        ]},
        { label: "Esta semana", items: [
          { t: "Cobertura · Jorge S.", d: "Sin cobertura", m: "Lun" },
          { t: "MiFi portátil · Pablo N.", d: "Envío confirmado", m: "Lun" },
        ]},
      ],
    },
    handoff: {
      title: "Pasando con un especialista",
      sub: "Un caso con cobro duplicado necesita un agente humano. Ya le envié el contexto completo.",
      agent: "Daniela Ortega",
      role: "Agente sénior · Billing",
      wait: "Tiempo estimado",
      waitv: "42 s",
      ctx: "Contexto compartido",
      ctxItems: [
        "Transcripción completa (2 min 14 s)",
        "Diagnóstico de línea",
        "Último cargo: MXN 899 · duplicado",
        "Sentimiento del cliente: frustrado",
      ],
      cancel: "Seguir con Orion",
      confirm: "Transferir ahora",
    },
    settings: {
      title: "Ajustes",
      sub: "Personaliza la voz, el idioma y el comportamiento de Orion.",
      voice: "Voz",
      voices: ["Aurora · cálida", "Nova · neutral", "Atlas · grave", "Lumen · brillante"],
      lang: "Idioma",
      langs: ["Español (MX)", "English (US)"],
      persona: "Personalidad",
      personas: ["Formal", "Amable", "Directa"],
      speed: "Velocidad de habla",
      interrupt: "Permitir interrupciones",
      interruptSub: "El cliente puede cortarme mientras hablo.",
      wake: "Palabra de activación",
      wakeSub: "\u201cHola Orion\u201d",
    },
    summary: {
      title: "Resumen de la llamada",
      ticket: "Ticket #OR-884731",
      customer: "Laura Méndez · Fibra 600",
      duration: "2 min 14 s",
      sentiment: "Satisfecha",
      result: "Resuelto",
      problem: "Problema",
      problemT: "Pérdida de conexión de internet desde las 19:42 del 18 de abril, provocada por una caída del nodo regional.",
      action: "Acción",
      actionT: "Reinicio remoto del router tras restablecimiento del nodo. Verificación de velocidad post-reinicio: 612 Mbps.",
      next: "Seguimiento",
      nextT: "Crédito automático de 1 día aplicado. Encuesta de satisfacción enviada por SMS.",
      close: "Cerrar ticket",
      reopen: "Reabrir",
    },
  },
  en: {
    brand: "ORION",
    tagline: "Voice assistant · Customer care",
    status: {
      idle: "Standby",
      listening: "Listening",
      thinking: "Processing",
      speaking: "Responding",
      escalating: "Transferring",
      settings: "Settings",
      summary: "Summary",
      history: "History",
    },
    nav: {
      idle: "01 · Standby",
      listening: "02 · Listening",
      thinking: "03 · Thinking",
      speaking: "04 · Speaking",
      transcript: "05 · Transcript",
      history: "06 · History",
      handoff: "07 · Human agent",
      settings: "08 · Settings",
      summary: "09 · Summary",
    },
    idle: {
      hello: "Hi, I'm Orion.",
      sub: "Your voice assistant for technical support. Say \u201cHey Orion\u201d or tap to start.",
      hint: "Press space · hold to talk",
      version: "Orion v0.4 · Fibre 600 network",
    },
    listening: {
      title: "I'm listening",
      sub: "Speak naturally. You can interrupt me anytime.",
      cue: "My internet has been slow since yesterday evening\u2026",
      level: "Voice level",
      stop: "Stop",
    },
    thinking: {
      title: "Looking at your account",
      sub: "Running line diagnostics and checking recent tickets.",
      steps: [
        { l: "Identifying customer", s: "MX·5521·884731" },
        { l: "Line diagnostics", s: "PING · SNR · loss" },
        { l: "30-day history", s: "3 incidents" },
        { l: "Generating reply", s: "EN · Aurora voice" },
      ],
    },
    speaking: {
      title: "I checked your line",
      body: "I found a signal drop on the node in your area starting at 7:42 pm yesterday. I'll restart your router remotely — it takes about 40 seconds. Does that sound good?",
      action: "Restart router",
      skip: "No, explain first",
    },
    transcript: {
      title: "Live transcript",
      tag: "LIVE",
      live: "Orion transcribes every word in real time. You can edit before closing the ticket.",
      msgs: [
        { who: "user", t: "Hi, I've been having trouble with my internet since yesterday.", time: "00:03" },
        { who: "orion", t: "Of course, let me look at your line. Can you confirm your account number?", time: "00:06" },
        { who: "user", t: "Yes, it's 884-731, under Laura Méndez.", time: "00:11" },
        { who: "orion", t: "Got it Laura. I can see there was a signal drop in your area starting 7:42 pm.", time: "00:18" },
        { who: "user", t: "What does that mean? Will it fix itself?", time: "00:24" },
        { who: "orion", t: "The general connection is already restored. We just need to reboot your router\u2026", time: "00:27", active: true },
      ],
    },
    history: {
      title: "Conversations",
      new: "New call",
      search: "Search\u2026",
      groups: [
        { label: "Today", items: [
          { t: "Slow internet · Laura M.", d: "Router restarted", m: "now", unread: true },
          { t: "Plan change · Diego R.", d: "Escalated to sales", m: "10:22" },
        ]},
        { label: "Yesterday", items: [
          { t: "Duplicate charge · Ana P.", d: "Refund issued", m: "19:03" },
          { t: "New install · Óscar T.", d: "Appt scheduled", m: "16:40" },
          { t: "Full outage · Marta V.", d: "Resolved", m: "14:11" },
        ]},
        { label: "This week", items: [
          { t: "Coverage · Jorge S.", d: "No coverage", m: "Mon" },
          { t: "Portable MiFi · Pablo N.", d: "Shipment confirmed", m: "Mon" },
        ]},
      ],
    },
    handoff: {
      title: "Handing off to a specialist",
      sub: "A duplicate charge case needs a human agent. I've sent them the full context.",
      agent: "Daniela Ortega",
      role: "Senior agent · Billing",
      wait: "Estimated wait",
      waitv: "42 s",
      ctx: "Shared context",
      ctxItems: [
        "Full transcript (2 min 14 s)",
        "Line diagnostics",
        "Last charge: MXN 899 · duplicated",
        "Customer sentiment: frustrated",
      ],
      cancel: "Keep Orion",
      confirm: "Transfer now",
    },
    settings: {
      title: "Settings",
      sub: "Customize Orion's voice, language and behavior.",
      voice: "Voice",
      voices: ["Aurora · warm", "Nova · neutral", "Atlas · deep", "Lumen · bright"],
      lang: "Language",
      langs: ["Español (MX)", "English (US)"],
      persona: "Persona",
      personas: ["Formal", "Friendly", "Direct"],
      speed: "Speech rate",
      interrupt: "Allow interruptions",
      interruptSub: "The customer can cut me off while I speak.",
      wake: "Wake word",
      wakeSub: "\u201cHey Orion\u201d",
    },
    summary: {
      title: "Call summary",
      ticket: "Ticket #OR-884731",
      customer: "Laura Méndez · Fibre 600",
      duration: "2 min 14 s",
      sentiment: "Satisfied",
      result: "Resolved",
      problem: "Problem",
      problemT: "Internet connection drop since 7:42 pm on April 18, caused by a regional node outage.",
      action: "Action",
      actionT: "Remote router restart after node restoration. Post-restart speed check: 612 Mbps.",
      next: "Follow-up",
      nextT: "Automatic 1-day credit applied. Satisfaction survey sent via SMS.",
      close: "Close ticket",
      reopen: "Reopen",
    },
  },
};
