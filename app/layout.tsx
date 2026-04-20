import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--loaded-instrument-serif",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--loaded-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--loaded-geist-mono",
});

export const metadata: Metadata = {
  title: "Orion AI — Voice Customer Support",
  description: "AI-powered voice agent for customer service. Dark cinematic UI with real-time transcription.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body className={`${instrumentSerif.variable} ${geist.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
