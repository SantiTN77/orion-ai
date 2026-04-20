"use client";

import dynamic from "next/dynamic";

const OrionApp = dynamic(() => import("@/components/OrionApp"), { ssr: false });

export default function Page() {
  return <OrionApp />;
}
