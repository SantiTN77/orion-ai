"use client";

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "mute";

interface OrbProps {
  state?: OrbState;
  size?: number;
}

const INTENSITY: Record<OrbState, { scale: number; speed: number; glow: number; hueShift: number }> = {
  idle:      { scale: 1.00, speed: 14,  glow: 0.55, hueShift: 0 },
  listening: { scale: 1.06, speed: 6,   glow: 0.85, hueShift: 0 },
  thinking:  { scale: 1.02, speed: 3,   glow: 0.7,  hueShift: 30 },
  speaking:  { scale: 1.08, speed: 2.2, glow: 1.0,  hueShift: -10 },
  mute:      { scale: 0.94, speed: 24,  glow: 0.25, hueShift: 0 },
};

export function Orb({ state = "idle", size = 320 }: OrbProps) {
  const intensity = INTENSITY[state];

  return (
    <div
      className="orb-wrap"
      style={{
        width: size,
        height: size,
        ["--orb-scale" as string]: intensity.scale,
        ["--orb-speed" as string]: `${intensity.speed}s`,
        ["--orb-glow" as string]: intensity.glow,
        ["--orb-hue" as string]: `${intensity.hueShift}deg`,
      }}
      data-state={state}
    >
      <div className="orb-halo" />
      <div className="orb-core">
        <div className="orb-blob orb-blob-1" />
        <div className="orb-blob orb-blob-2" />
        <div className="orb-blob orb-blob-3" />
        <div className="orb-blob orb-blob-4" />
        <div className="orb-sheen" />
        <div className="orb-grain" />
      </div>
      <div className="orb-ring orb-ring-1" />
      <div className="orb-ring orb-ring-2" />
    </div>
  );
}

interface WaveformProps {
  active?: boolean;
  bars?: number;
}

export function Waveform({ active = true, bars = 48 }: WaveformProps) {
  return (
    <div className={`wave ${active ? "is-active" : ""}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{
            animationDelay: `${(i * 37) % 1200}ms`,
            animationDuration: `${900 + ((i * 73) % 600)}ms`,
            height: `${18 + ((i * 19) % 60)}%`,
          }}
        />
      ))}
    </div>
  );
}
