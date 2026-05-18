export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
          ◆ Poker night co-pilot
        </p>
        <h1 className="font-display italic text-cream text-5xl leading-none">
          felt.
        </h1>
        <p className="font-sans text-sm text-cream-dim max-w-xs text-balance mt-2">
          Position tracker, action flow, and showdown referee for home games.
          Setting up.
        </p>
      </div>
    </main>
  );
}
