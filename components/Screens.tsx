"use client";

import { useEffect, useRef, useState } from "react";
import { Orb, Waveform } from "./Orb";
import type { Translations } from "@/lib/i18n";

interface ScreenProps {
  t: Translations;
  lang: string;
}

export function IdleScreen({ t }: ScreenProps) {
  const [hello, em] = t.idle.hello.split(",");
  return (
    <div className="screen-center screen-enter">
      <Orb state="idle" size={260} />
      <h1 className="hero-title">
        {hello}, <em>{(em || "").trim().replace(".", "")}</em>.
      </h1>
      <p className="hero-sub">{t.idle.sub}</p>
      <div className="hero-hint">
        <kbd>SPACE</kbd>
        <span>{t.idle.hint}</span>
      </div>
      <div style={{ marginTop: 22, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        {t.idle.version}
      </div>
    </div>
  );
}

export function ListeningScreen({ t }: ScreenProps) {
  return (
    <div className="screen-center screen-enter">
      <Orb state="listening" size={200} />
      <div className="status-line" style={{ marginTop: 28 }}>
        <span className="dot" /> {t.status.listening}
      </div>
      <p className="quote">
        &ldquo;{t.listening.cue}
        <span className="quote-caret" />&rdquo;
      </p>
      <div className="mic-meter" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${(i * 43) % 600}ms`, animationDuration: `${700 + ((i * 53) % 600)}ms` }} />
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <button className="btn ghost">{t.listening.stop}</button>
      </div>
    </div>
  );
}

export function ThinkingScreen({ t }: ScreenProps) {
  const [now, setNow] = useState(1);
  useEffect(() => {
    const i = setInterval(() => setNow(n => (n + 1) % (t.thinking.steps.length + 1)), 1500);
    return () => clearInterval(i);
  }, [t]);
  return (
    <div className="screen-center screen-enter">
      <Orb state="thinking" size={220} />
      <div className="status-line" style={{ marginTop: 22 }}>
        <span className="dot amber" /> {t.status.thinking}
      </div>
      <h2 className="serif" style={{ fontSize: 40, margin: "10px 0 4px", fontWeight: 400, letterSpacing: "-0.01em" }}>{t.thinking.title}</h2>
      <p className="hero-sub">{t.thinking.sub}</p>
      <ul className="think-steps">
        {t.thinking.steps.map((s, i) => {
          const cls = i < now ? "is-done" : i === now ? "is-now" : "";
          return (
            <li key={i} className={cls}>
              <span className="think-idx">0{i + 1}</span>
              <span>
                <span className="think-label">{s.l}</span>
                <div className="think-sub">{s.s}</div>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SpeakingScreen({ t }: ScreenProps) {
  return (
    <div className="screen-center screen-enter">
      <Orb state="speaking" size={200} />
      <div className="status-line" style={{ marginTop: 22 }}>
        <span className="dot" /> {t.status.speaking}
      </div>
      <div className="speak-card">
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 10 }}>
          Orion · {t.speaking.title}
        </div>
        <p className="speak-body">{t.speaking.body}</p>
        <div style={{ marginTop: 18 }}>
          <Waveform active bars={64} />
        </div>
      </div>
      <div className="btn-row">
        <button className="btn primary">{t.speaking.action}</button>
        <button className="btn ghost">{t.speaking.skip}</button>
      </div>
    </div>
  );
}

export function TranscriptScreen({ t }: ScreenProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, []);
  return (
    <div className="screen-split screen-enter">
      <div className="split-orb">
        <Orb state="speaking" size={320} />
        <div className="split-orb-footer">
          <span><span className="dot" /> {t.status.speaking} · 00:27</span>
          <span>FIBRE · 612 MBPS</span>
        </div>
      </div>
      <div className="split-panel">
        <div className="panel-head">
          <h3>{t.transcript.title}</h3>
          <span className="pill cyan">● {t.transcript.tag}</span>
        </div>
        <div className="panel-body" ref={bodyRef}>
          {t.transcript.msgs.map((m, i) => (
            <div key={i} className={`msg ${m.who} ${m.active ? "active" : ""}`}>
              <div className="msg-time mono">{m.time}</div>
              <div className="msg-main">
                <div className="who">{m.who === "orion" ? "ORION" : "CLIENT"}</div>
                <p>{m.t}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="panel-foot">{t.transcript.live}</div>
      </div>
    </div>
  );
}

export function HistoryScreen({ t }: ScreenProps) {
  const [sel, setSel] = useState("0-0");
  const activeItem = t.history.groups[0].items[0];
  return (
    <div className="history-grid screen-enter">
      <div className="history-rail">
        <div className="search">
          <span style={{ color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>⌕</span>
          <input placeholder={t.history.search} />
          <button className="chip">+</button>
        </div>
        <div className="history-list">
          {t.history.groups.map((g, gi) => (
            <div key={gi}>
              <div className="history-group-label">{g.label}</div>
              {g.items.map((it, ii) => {
                const k = `${gi}-${ii}`;
                return (
                  <div key={k} className={`history-item ${sel === k ? "is-active" : ""}`} onClick={() => setSel(k)}>
                    <div className="ht">{it.t}</div>
                    {it.unread ? <div className="unread" /> : <div className="hm">{it.m}</div>}
                    <div className="hd">{it.d}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="history-detail">
        <div className="hd-head">
          <div>
            <h2>{activeItem.t}</h2>
            <div className="meta">{activeItem.d} · 2 min 14 s · Fibre 600</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="chip">Export</button>
            <button className="chip active">Open ticket</button>
          </div>
        </div>
        <div className="hd-body">
          <div className="sum-stats">
            <div className="sum-stat"><div className="sv ok">{t.summary.sentiment}</div><div className="sl">Sentiment</div></div>
            <div className="sum-stat"><div className="sv">{t.summary.duration}</div><div className="sl">Duration</div></div>
            <div className="sum-stat"><div className="sv ok">{t.summary.result}</div><div className="sl">Status</div></div>
          </div>
          <div className="sum-section">
            <h4>{t.summary.problem}</h4>
            <p>{t.summary.problemT}</p>
          </div>
          <div className="sum-section">
            <h4>{t.summary.action}</h4>
            <p>{t.summary.actionT}</p>
          </div>
          <div className="sum-section">
            <h4>{t.summary.next}</h4>
            <p>{t.summary.nextT}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HandoffScreen({ t }: ScreenProps) {
  return (
    <div className="handoff-wrap screen-enter">
      <div className="handoff-card">
        <div className="handoff-top">
          <div className="handoff-arrow">↗</div>
          <div>
            <div className="status-line" style={{ marginBottom: 4 }}>
              <span className="dot amber" /> {t.status.escalating}
            </div>
            <h2 className="handoff-title">{t.handoff.title}</h2>
            <p className="handoff-sub">{t.handoff.sub}</p>
          </div>
        </div>

        <div className="agent-strip">
          <div className="agent-avatar">DO</div>
          <div>
            <div className="agent-name">{t.handoff.agent}</div>
            <div className="agent-role">{t.handoff.role}</div>
          </div>
          <div className="agent-wait">
            <div className="wv serif">{t.handoff.waitv}</div>
            <div className="wl">{t.handoff.wait}</div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div className="setting-label">{t.handoff.ctx}</div>
          <ul className="ctx-list">
            {t.handoff.ctxItems.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>

        <div className="btn-row" style={{ justifyContent: "flex-end", marginTop: 26 }}>
          <button className="btn ghost">{t.handoff.cancel}</button>
          <button className="btn primary">{t.handoff.confirm}</button>
        </div>
      </div>
    </div>
  );
}

export function SettingsScreen({ t, lang }: ScreenProps) {
  const [voice, setVoice] = useState(0);
  const [persona, setPersona] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [interrupt, setInterrupt] = useState(true);
  const [wake, setWake] = useState(true);
  return (
    <div className="settings-wrap screen-enter">
      <div className="settings-head">
        <h2>{t.settings.title}</h2>
        <p>{t.settings.sub}</p>
      </div>
      <div className="settings-grid">
        <div className="setting-card">
          <div className="setting-label">{t.settings.voice}</div>
          <div className="option-grid">
            {t.settings.voices.map((v, i) => (
              <button key={i} className={`option ${voice === i ? "is-on" : ""}`} onClick={() => setVoice(i)}>{v}</button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="setting-label">{t.settings.speed}</div>
            <input className="slider" type="range" min="0.6" max="1.6" step="0.05" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginTop: 6, letterSpacing: "0.08em" }}>{speed.toFixed(2)}×</div>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-label">{t.settings.lang}</div>
          <div className="option-grid">
            {t.settings.langs.map((l, i) => (
              <button key={i} className={`option ${lang === (i === 0 ? "es" : "en") ? "is-on" : ""}`}
                onClick={() => window.dispatchEvent(new CustomEvent("orion:lang", { detail: i === 0 ? "es" : "en" }))}
              >{l}</button>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="setting-label">{t.settings.persona}</div>
            <div className="option-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {t.settings.personas.map((p, i) => (
                <button key={i} className={`option ${persona === i ? "is-on" : ""}`} onClick={() => setPersona(i)}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="setting-card">
          <div className="toggle-row">
            <div>
              <div className="tlabel">{t.settings.interrupt}</div>
              <div className="tsub">{t.settings.interruptSub}</div>
            </div>
            <div className={`toggle ${interrupt ? "on" : ""}`} onClick={() => setInterrupt(!interrupt)} />
          </div>
        </div>

        <div className="setting-card">
          <div className="toggle-row">
            <div>
              <div className="tlabel">{t.settings.wake}</div>
              <div className="tsub">{t.settings.wakeSub}</div>
            </div>
            <div className={`toggle ${wake ? "on" : ""}`} onClick={() => setWake(!wake)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummaryScreen({ t }: ScreenProps) {
  return (
    <div className="summary-wrap screen-enter">
      <div className="summary-left">
        <div className="summary-meta">{t.summary.ticket} · {new Date().toISOString().slice(0, 10)}</div>
        <h2 className="summary-title">{t.summary.title}</h2>
        <div className="summary-cust">{t.summary.customer}</div>

        <div className="sum-stats">
          <div className="sum-stat"><div className="sv">{t.summary.duration}</div><div className="sl">Duration</div></div>
          <div className="sum-stat"><div className="sv ok">{t.summary.sentiment}</div><div className="sl">Sentiment</div></div>
          <div className="sum-stat"><div className="sv ok">{t.summary.result}</div><div className="sl">Result</div></div>
        </div>

        <div className="sum-section">
          <h4>{t.summary.problem}</h4>
          <p>{t.summary.problemT}</p>
        </div>
        <div className="sum-section">
          <h4>{t.summary.action}</h4>
          <p>{t.summary.actionT}</p>
        </div>
        <div className="sum-section">
          <h4>{t.summary.next}</h4>
          <p>{t.summary.nextT}</p>
        </div>

        <div className="btn-row" style={{ justifyContent: "flex-start", marginTop: 28 }}>
          <button className="btn primary">{t.summary.close}</button>
          <button className="btn ghost">{t.summary.reopen}</button>
        </div>
      </div>
      <div className="summary-right">
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 12 }}>
          Line diagnostics · post-fix
        </div>
        <div className="placeholder-img">[ speed-test graph placeholder ]</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="sum-stat"><div className="sv">612</div><div className="sl">Mbps down</div></div>
          <div className="sum-stat"><div className="sv">312</div><div className="sl">Mbps up</div></div>
          <div className="sum-stat"><div className="sv">9 ms</div><div className="sl">Ping</div></div>
          <div className="sum-stat"><div className="sv">0.1%</div><div className="sl">Loss</div></div>
        </div>
      </div>
    </div>
  );
}
