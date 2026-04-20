"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { I18N, type Lang, type TranscriptMsg } from "@/lib/i18n";
import { useVoiceAgent, type AgentState } from "@/lib/useVoiceAgent";
import {
  IdleScreen, ListeningScreen, ThinkingScreen, SpeakingScreen,
  TranscriptScreen, HistoryScreen, HandoffScreen, SettingsScreen, SummaryScreen,
} from "./Screens";

type ScreenId = "idle" | "listening" | "thinking" | "speaking" | "transcript" | "history" | "handoff" | "settings" | "summary";

const SCREENS: { id: ScreenId; status: string }[] = [
  { id: "idle",       status: "idle" },
  { id: "listening",  status: "listening" },
  { id: "thinking",   status: "thinking" },
  { id: "speaking",   status: "speaking" },
  { id: "transcript", status: "speaking" },
  { id: "history",    status: "history" },
  { id: "handoff",    status: "escalating" },
  { id: "settings",   status: "settings" },
  { id: "summary",    status: "summary" },
];

const AGENT_TO_SCREEN: Record<AgentState, ScreenId> = {
  idle:      "idle",
  listening: "listening",
  thinking:  "thinking",
  speaking:  "transcript",
  error:     "idle",
};

interface Tweaks {
  theme: "dark" | "light";
  lang: Lang;
}

const DEFAULTS: Tweaks = { theme: "dark", lang: "es" };

function useTweaks() {
  const [tweaks, setTweaks] = useState<Tweaks>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      const saved = JSON.parse(localStorage.getItem("orion:tweaks") || "null");
      return { ...DEFAULTS, ...(saved || {}) };
    } catch { return DEFAULTS; }
  });

  const update = useCallback((patch: Partial<Tweaks>) => {
    setTweaks(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem("orion:tweaks", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return [tweaks, update] as const;
}

export default function OrionApp() {
  const [tweaks, setTweaks] = useTweaks();
  const [screen, setScreen] = useState<ScreenId>("idle");
  const [liveMode, setLiveMode] = useState(false);

  const voice = useVoiceAgent({ lang: tweaks.lang });

  const t = I18N[tweaks.lang];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  const startListeningRef = useRef(voice.startListening);
  useEffect(() => {
    startListeningRef.current = voice.startListening;
  }, [voice.startListening]);

  // React to handoff action from backend.
  // Jump to the handoff screen AS SOON as the assistant reply signals
  // escalation, but DO NOT interrupt the farewell speech — Orion should
  // finish its sentence while the human-agent card is already visible.
  useEffect(() => {
    if (voice.action === "handoff") {
      setScreen("handoff");
    }
  }, [voice.action]);

  // Auto-drive screen from agent state when in live mode
  useEffect(() => {
    if (!liveMode) return;

    // Handoff takes over the screen — no auto-resume, no auto-nav
    if (voice.action === "handoff") {
      setScreen("handoff");
      return;
    }

    const target = AGENT_TO_SCREEN[voice.state];
    if (target) setScreen(target);

    // Break loop on silence: user didn't say anything, pause and show SPACE hint
    if (voice.state === "idle" && voice.lastWasSilent) {
      setLiveMode(false);
      return;
    }

    // Continuous Flow: if agent finishes speaking and goes idle (with speech), resume listening
    if (voice.state === "idle" && !voice.lastWasSilent) {
      const timer = setTimeout(() => {
        if (liveMode) startListeningRef.current();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [voice.state, voice.action, voice.lastWasSilent, liveMode]);

  useEffect(() => {
    const onLang = (e: Event) => setTweaks({ lang: (e as CustomEvent).detail as Lang });
    window.addEventListener("orion:lang", onLang);
    return () => window.removeEventListener("orion:lang", onLang);
  }, [setTweaks]);

  // Keyboard: SPACE = talk, arrows = navigate (when not live)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (voice.state === "idle") {
          setLiveMode(true);
          voice.startListening();
        } else if (voice.state === "listening") {
          voice.stopListening();
        } else if (voice.state === "speaking") {
          voice.stopSpeaking();
        }
        return;
      }

      if (liveMode) return;
      const idx = SCREENS.findIndex(s => s.id === screen);
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setScreen(SCREENS[(idx + 1) % SCREENS.length].id); }
      if (e.key === "ArrowUp"   || e.key === "ArrowLeft")  { e.preventDefault(); setScreen(SCREENS[(idx - 1 + SCREENS.length) % SCREENS.length].id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, liveMode, voice]);

  const handleRailClick = useCallback((id: ScreenId) => {
    setLiveMode(false);
    voice.stopListening();
    voice.stopSpeaking();
    setScreen(id);
  }, [voice]);

  const endSession = useCallback(() => {
    voice.stopListening();
    voice.stopSpeaking();
    setLiveMode(false);
    setScreen("summary");
  }, [voice]);

  // Build live translations: overlay real messages on top of the demo copy
  const liveT = useMemo(() => {
    if (!liveMode) return t;
    const cloned: typeof t = JSON.parse(JSON.stringify(t));

    if (voice.interim) {
      cloned.listening = { ...cloned.listening, cue: voice.interim };
    }

    if (voice.messages.length > 0) {
      const msgs: TranscriptMsg[] = voice.messages.map((m, i) => ({
        who: m.role === "user" ? "user" : "orion",
        t: m.content,
        time: m.time,
        active: i === voice.messages.length - 1 && voice.state === "speaking",
      }));
      cloned.transcript = { ...cloned.transcript, msgs };

      const lastAssistant = [...voice.messages].reverse().find(m => m.role === "assistant");
      if (lastAssistant) {
        cloned.speaking = { ...cloned.speaking, body: lastAssistant.content, title: "Orion" };
      }
    }
    return cloned;
  }, [liveMode, t, voice.interim, voice.messages, voice.state]);

  const cur = SCREENS.find(s => s.id === screen) || SCREENS[0];
  const props = { t: liveT, lang: tweaks.lang };

  const Screen = {
    idle:       <IdleScreen {...props} />,
    listening:  <ListeningScreen {...props} />,
    thinking:   <ThinkingScreen {...props} />,
    speaking:   <SpeakingScreen {...props} />,
    transcript: <TranscriptScreen {...props} />,
    history:    <HistoryScreen {...props} />,
    handoff:    <HandoffScreen {...props} />,
    settings:   <SettingsScreen {...props} />,
    summary:    <SummaryScreen {...props} />,
  }[screen];

  const liveStatus = liveMode
    ? (tweaks.lang === "es" ? "● EN VIVO" : "● LIVE")
    : "● REAL-TIME";

  return (
    <div className="app" data-screen-label={`Orion / ${cur.id}`}>
      <aside className="rail">
        <div className="rail-brand">
          <div className="rail-mark" />
          <div>
            <div className="rail-title">ORI<em>O</em>N</div>
            <div className="rail-tag">{t.tagline}</div>
          </div>
        </div>

        <div>
          <div className="rail-section">Flow</div>
          <div className="rail-list">
            {SCREENS.map(s => (
              <button key={s.id} className={`rail-item ${screen === s.id ? "is-active" : ""}`} onClick={() => handleRailClick(s.id)}>
                {t.nav[s.id as keyof typeof t.nav]}
              </button>
            ))}
          </div>
        </div>

        <div className="rail-foot">
          {liveMode && (
            <button className="btn ghost" style={{ fontSize: 10, padding: "8px 12px" }} onClick={endSession}>
              {tweaks.lang === "es" ? "Terminar sesión" : "End session"}
            </button>
          )}
          <div className="rail-kbd"><span>{tweaks.lang === "es" ? "Hablar" : "Talk"}</span><span><kbd>SPACE</kbd></span></div>
          <div className="rail-kbd"><span>{tweaks.lang === "es" ? "Navegar" : "Navigate"}</span><span><kbd>↑</kbd> <kbd>↓</kbd></span></div>
          <div className="rail-kbd"><span>{tweaks.lang === "es" ? "Llamada" : "Session"}</span><span className="mono">OR-884731</span></div>
        </div>
      </aside>

      <main className="stage" data-screen-label={cur.id}>
        <div className="topbar">
          <div className="topbar-left">
            <span className={`dot ${cur.status === "idle" ? "off" : cur.status === "escalating" ? "amber" : ""}`} />
            <span>{t.status[cur.status as keyof typeof t.status]}</span>
            <span className="pill">EN · ES</span>
            <span className={`pill ${liveMode ? "cyan" : ""}`}>{liveStatus}</span>
            {voice.error && (
              <span className="pill" style={{ color: "var(--bad)", borderColor: "var(--bad)" }}>
                {voice.error.slice(0, 40)}
              </span>
            )}
          </div>
          <div className="topbar-right">
            {!voice.supported && (
              <span className="pill" style={{ color: "var(--warn)" }}>
                {tweaks.lang === "es" ? "Usa Chrome/Edge" : "Use Chrome/Edge"}
              </span>
            )}
            <button className={`chip ${tweaks.lang === "es" ? "active" : ""}`} onClick={() => setTweaks({ lang: "es" })}>ES</button>
            <button className={`chip ${tweaks.lang === "en" ? "active" : ""}`} onClick={() => setTweaks({ lang: "en" })}>EN</button>
            <button className="chip" onClick={() => setTweaks({ theme: tweaks.theme === "dark" ? "light" : "dark" })}>
              {tweaks.theme === "dark" ? "◐ Dark" : "◑ Light"}
            </button>
          </div>
        </div>

        <div className="screen" key={screen}>
          {Screen}
        </div>
      </main>
    </div>
  );
}
