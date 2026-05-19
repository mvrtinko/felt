"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Frame } from "./components/Frame";
import { Logo } from "./components/Logo";
import { PlayerAvatar } from "./components/PlayerAvatar";
import { useHasMounted } from "./hooks/useHasMounted";
import { nextAvatarColor, useGameStore } from "@/lib/store";

export default function SetupPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const firstDealerIndex = useGameStore((s) => s.firstDealerIndex);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const setFirstDealer = useGameStore((s) => s.setFirstDealer);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const blinds = useGameStore((s) => s.blinds);
  const setInitialBlinds = useGameStore((s) => s.setInitialBlinds);
  const setBlindsInterval = useGameStore((s) => s.setBlindsInterval);

  const [adding, setAdding] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmed = nameInput.trim();
  const duplicate = players.some(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const atCap = players.length >= 9;

  function commitAdd() {
    if (!trimmed) {
      setAdding(false);
      setError(null);
      return;
    }
    if (duplicate) {
      setError("Name already taken.");
      return;
    }
    if (atCap) {
      setError("Max 9 players.");
      return;
    }
    addPlayer(trimmed, nextAvatarColor(players));
    setNameInput("");
    setError(null);
    setAdding(false);
  }

  function handleStart() {
    if (players.length < 2) return;
    if (firstDealerIndex >= players.length) return;
    startGame();
    router.push("/hand");
  }

  const canStart = players.length >= 2 && firstDealerIndex < players.length;

  if (!mounted) {
    return (
      <Frame>
        <div className="flex-1 flex items-center justify-center">
          <Logo size="lg" />
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <header className="flex items-center justify-between mb-10">
        <Logo size="sm" />
        {players.length > 0 ? (
          <button
            onClick={() => {
              if (confirm("Clear all players and start over?")) resetGame();
            }}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim hover:text-cream transition-colors"
          >
            Reset
          </button>
        ) : null}
      </header>

      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold mb-3">
          ◆ New night
        </p>
        <h1 className="font-display text-cream text-[40px] leading-[1.1] tracking-tight">
          Who&apos;s <em className="text-coral italic">playing?</em>
        </h1>
      </div>

      <ul className="flex flex-col gap-2 mb-3">
        {players.map((p, i) => {
          const isDealer = i === firstDealerIndex;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all ${
                isDealer
                  ? "border-coral coral-glow bg-coral-glow"
                  : "border-line-strong bg-felt/30"
              }`}
            >
              <button
                type="button"
                onClick={() => setFirstDealer(i)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                aria-pressed={isDealer}
              >
                <PlayerAvatar name={p.name} color={p.avatarColor} />
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-cream text-base truncate">
                    {p.name}
                  </div>
                  {isDealer ? (
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-coral mt-0.5">
                      First dealer
                    </div>
                  ) : (
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim mt-0.5">
                      Tap to deal first
                    </div>
                  )}
                </div>
              </button>
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => removePlayer(p.id)}
                className="w-8 h-8 grid place-items-center rounded-full text-cream-dim hover:text-coral hover:bg-coral-glow transition-colors"
              >
                <X size={16} />
              </button>
            </li>
          );
        })}

        <li>
          {adding ? (
            <div className="flex items-center gap-2 px-3 py-3 rounded-2xl border border-coral bg-coral-glow">
              <PlayerAvatar
                name={trimmed || "?"}
                color={nextAvatarColor(players)}
              />
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitAdd();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNameInput("");
                    setError(null);
                  }
                }}
                placeholder="Player name"
                maxLength={20}
                className="flex-1 bg-transparent outline-none text-cream font-sans text-base placeholder:text-cream-dim/60"
              />
              <button
                onClick={commitAdd}
                aria-label="Confirm"
                className="w-8 h-8 grid place-items-center rounded-full bg-coral text-ink hover:opacity-90"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNameInput("");
                  setError(null);
                }}
                aria-label="Cancel"
                className="w-8 h-8 grid place-items-center rounded-full text-cream-dim hover:text-cream"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={atCap}
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-2xl border border-dashed border-line-strong text-cream-dim hover:text-cream hover:border-cream-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span className="font-mono text-xs uppercase tracking-[0.18em]">
                {atCap ? "Table full" : "Add player"}
              </span>
            </button>
          )}
        </li>
      </ul>

      {error ? (
        <p className="font-mono text-[11px] text-coral mb-3">{error}</p>
      ) : null}

      <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 mb-5">
        <p className="font-sans text-xs text-cream-dim leading-relaxed">
          <span className="text-gold font-mono uppercase tracking-[0.18em] text-[10px] mr-1">
            ◆ Tip ·
          </span>
          Dealer, small blind, and big blind rotate clockwise after each hand.
          You only set the first dealer.
        </p>
      </div>

      <div className="rounded-2xl border border-line-strong bg-felt/30 p-4 mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim mb-3">
          ◆ Stakes &amp; blinds
        </p>
        <div className="grid grid-cols-3 gap-2">
          <StakeInput
            label="Small blind"
            value={blinds.initialSb}
            onChange={(v) =>
              setInitialBlinds(v, Math.max(v, blinds.initialBb))
            }
          />
          <StakeInput
            label="Big blind"
            value={blinds.initialBb}
            onChange={(v) =>
              setInitialBlinds(Math.min(v, blinds.initialSb), v)
            }
          />
          <StakeInput
            label="Bump (min)"
            value={blinds.intervalMinutes}
            onChange={(v) => setBlindsInterval(v)}
          />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim mt-3 leading-relaxed">
          Blinds double when the timer hits zero.
        </p>
      </div>

      <div className="mt-auto">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-4 rounded-2xl bg-coral text-ink font-display italic text-xl tracking-tight hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Start the night →
        </button>
        <p className="text-center mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim">
          {players.length < 2
            ? `Need ${2 - players.length} more`
            : `${players.length} ${players.length === 1 ? "player" : "players"} · ${blinds.initialSb}/${blinds.initialBb} · ready`}
        </p>
      </div>
    </Frame>
  );
}

function StakeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream-dim">
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n) && n >= 1) onChange(n);
        }}
        className="bg-felt-deep border border-line-strong rounded-lg px-2.5 py-2 text-cream font-mono text-sm text-center focus:border-coral focus:outline-none"
      />
    </label>
  );
}
