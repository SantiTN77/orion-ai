"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "./i18n";

export type AgentState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface UseVoiceAgentOptions {
  lang: Lang;
  backendUrl?: string;
}

const DEFAULT_BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function nowTime(): string {
  const d = new Date();
  return `${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function useVoiceAgent({ lang, backendUrl = DEFAULT_BACKEND }: UseVoiceAgentOptions) {
  const [state, setState] = useState<AgentState>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [interim, setInterim] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(true);
  const [action, setAction] = useState<string | null>(null);  // e.g. "handoff"
  const [lastWasSilent, setLastWasSilent] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef<SpeechSynthesisUtterance | null>(null);
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang === "es" ? "es-ES" : "en-US";
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    speakingRef.current = null;
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "es" ? "es-ES" : "en-US";
      u.rate = 1.05;
      u.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      
      let preferred;
      if (lang === "es") {
        // Prioritize natural neutral Latin American Spanish
        preferred = voices.find(v => v.lang.startsWith("es") && /(neural|natural|multilingual)/i.test(v.name))
          || voices.find(v => /(es-MX|es-US)/i.test(v.lang) && /(female|mujer)/i.test(v.name))
          || voices.find(v => /(es-MX|es-US)/i.test(v.lang))
          || voices.find(v => v.lang.startsWith("es"));
      } else {
        preferred = voices.find(v => v.lang.startsWith("en") && /(neural|natural|multilingual)/i.test(v.name))
          || voices.find(v => v.lang.startsWith("en-US") && /female|aurora|nova/i.test(v.name))
          || voices.find(v => v.lang.startsWith("en"));
      }
      
      if (preferred) u.voice = preferred;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speakingRef.current = u;
      window.speechSynthesis.speak(u);
    });
  }, [lang]);

  const sendToBackend = useCallback(async (userText: string) => {
    const newUserMsg: VoiceMessage = { role: "user", content: userText, time: nowTime() };
    const history = [...messages, newUserMsg];
    setMessages(history);
    setState("thinking");
    setError(null);
    setAction(null);
    setLastWasSilent(false);

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          lang,
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`Backend ${res.status}`);
      const data = await res.json();
      const reply: string = data.reply || "";
      const responseAction: string | null = data.action || null;

      const assistantMsg: VoiceMessage = { role: "assistant", content: reply, time: nowTime() };
      setMessages(prev => [...prev, assistantMsg]);
      if (responseAction) setAction(responseAction);
      setState("speaking");
      await speak(reply);
      setState("idle");
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setState("error");
    }
  }, [messages, backendUrl, lang, speak]);

  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      setError("Speech recognition not supported in this browser. Use Chrome or Edge.");
      setState("error");
      return;
    }
    stopSpeaking();
    setInterim("");
    finalTranscriptRef.current = "";
    setError(null);
    setAction(null);
    // Optimistically set listening state so UI updates instantly,
    // even if rec.onstart fires with a delay (Chrome sometimes takes ~300ms).
    setState("listening");

    rec.onstart = () => setState("listening");
    rec.onresult = (ev: any) => {
      let interimText = "";
      let finalText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const transcript = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        finalTranscriptRef.current += finalText;
        setInterim(finalTranscriptRef.current);
      }
    };
    rec.onerror = (ev: any) => {
      setError(ev.error || "mic error");
      setState("error");
    };
    rec.onend = () => {
      const text = finalTranscriptRef.current.trim();
      setInterim("");
      if (text) {
        setLastWasSilent(false);
        sendToBackend(text);
      } else {
        setLastWasSilent(true);
        setState("idle");
      }
    };

    try { rec.start(); } catch (e: any) {
      setError(e?.message || "Could not start mic");
      setState("error");
    }
  }, [sendToBackend, stopSpeaking]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const reset = useCallback(() => {
    stopListening();
    stopSpeaking();
    setMessages([]);
    setInterim("");
    setError(null);
    setState("idle");
  }, [stopListening, stopSpeaking]);

  return {
    state,
    messages,
    interim,
    error,
    action,
    lastWasSilent,
    supported,
    startListening,
    stopListening,
    stopSpeaking,
    reset,
  };
}
