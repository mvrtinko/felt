"use client";

import Link from "next/link";
import { Frame } from "../components/Frame";
import { Logo } from "../components/Logo";

export default function ShowdownPagePlaceholder() {
  return (
    <Frame>
      <header className="mb-12">
        <Logo size="sm" />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
          ◆ Coming next
        </p>
        <h1 className="font-display italic text-cream text-4xl">Card picker</h1>
        <p className="font-sans text-sm text-cream-dim max-w-xs">
          Showdown UI lands in the next milestone.
        </p>
        <Link
          href="/hand"
          className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-cream-dim hover:text-cream"
        >
          ← Back to hand
        </Link>
      </div>
    </Frame>
  );
}
