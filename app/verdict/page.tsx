"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Frame } from "../components/Frame";
import { Logo } from "../components/Logo";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PlayingCard } from "../components/PlayingCard";
import { useHasMounted } from "../hooks/useHasMounted";
import { useGameStore } from "@/lib/store";
import { evaluateShowdown } from "@/lib/evaluator";
import type { Card } from "@/lib/types";

export default function VerdictPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const currentHand = useGameStore((s) => s.currentHand);
  const pendingShowdown = useGameStore((s) => s.pendingShowdown);
  const setShowdownResult = useGameStore((s) => s.setShowdownResult);
  const startNextHand = useGameStore((s) => s.startNextHand);

  const evalInput = useMemo(() => {
    if (!pendingShowdown || !currentHand) return null;
    const board = pendingShowdown.board.filter(Boolean) as Card[];
    if (board.length < 3) return null;
    const playerCards: Record<string, [Card, Card]> = {};
    const playerNames: Record<string, string> = {};
    for (const [pid, cards] of Object.entries(pendingShowdown.holeCards)) {
      if (cards[0] && cards[1]) {
        playerCards[pid] = [cards[0], cards[1]];
        const player = players.find((p) => p.id === pid);
        playerNames[pid] = player?.name ?? "Player";
      }
    }
    if (Object.keys(playerCards).length < 1) return null;
    return { board, playerCards, playerNames };
  }, [pendingShowdown, currentHand, players]);

  const result = useMemo(() => {
    if (!evalInput) return null;
    return evaluateShowdown(evalInput);
  }, [evalInput]);

  useEffect(() => {
    if (!mounted) return;
    if (!currentHand || players.length < 2) {
      router.replace("/");
      return;
    }
    if (currentHand.street !== "showdown") {
      router.replace("/hand");
      return;
    }
    if (!pendingShowdown || !evalInput) {
      router.replace("/showdown");
      return;
    }
  }, [mounted, currentHand, players.length, pendingShowdown, evalInput, router]);

  useEffect(() => {
    if (result) setShowdownResult(result);
  }, [result, setShowdownResult]);

  if (!mounted) {
    return (
      <Frame>
        <div className="flex-1 flex items-center justify-center">
          <Logo size="lg" />
        </div>
      </Frame>
    );
  }

  if (!currentHand || !result || !evalInput) {
    return (
      <Frame>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-xs text-cream-dim uppercase tracking-[0.2em]">
            Returning…
          </p>
        </div>
      </Frame>
    );
  }

  const handNumStr = String(currentHand.handNumber).padStart(3, "0");
  const winners = result.winners;
  const winnersNames = winners
    .map((w) => players.find((p) => p.id === w.playerId)?.name ?? "—")
    .filter(Boolean);
  const titleNames =
    winnersNames.length === 1
      ? winnersNames[0]
      : winnersNames.length === 2
        ? `${winnersNames[0]} & ${winnersNames[1]}`
        : winnersNames.slice(0, -1).join(", ") +
          ` & ${winnersNames[winnersNames.length - 1]}`;

  const isSplit = winners.length > 1;
  const headDescr = winners[0]?.handDescr ?? "";

  return (
    <Frame>
      <header className="flex items-center justify-between mb-8">
        <Logo size="sm" />
        <button
          onClick={() => {
            startNextHand();
            router.push("/hand");
          }}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim hover:text-cream"
        >
          Skip →
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="text-center mb-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold mb-3">
          ◆ Winner · Hand {handNumStr}
        </p>
        <h1 className="font-display text-cream text-[40px] leading-[1.05] tracking-tight mb-2">
          {isSplit ? (
            <>
              Split pot:{" "}
              <em className="text-coral italic">{titleNames}</em>
            </>
          ) : (
            <>
              <em className="text-coral italic">{titleNames}</em>{" "}
              <span className="text-cream">takes it.</span>
            </>
          )}
        </h1>
        <p className="font-sans text-sm text-cream-dim">{headDescr}</p>
      </motion.div>

      <section className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim mb-2 text-center">
          Board
        </p>
        <div className="flex justify-center gap-1.5">
          {evalInput.board.map((c, i) => (
            <PlayingCard key={i} card={c} size="sm" />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 mb-6">
        {result.rankings.map((rh) => {
          const player = players.find((p) => p.id === rh.playerId);
          if (!player) return null;
          const isWinner = winners.some((w) => w.playerId === rh.playerId);
          const hole = evalInput.playerCards[rh.playerId];
          return (
            <div
              key={rh.playerId}
              className={`rounded-2xl p-4 flex items-center gap-4 border transition-all ${
                isWinner
                  ? "border-coral coral-glow bg-coral-glow"
                  : "border-line-strong bg-felt/30"
              }`}
            >
              <PlayerAvatar
                name={player.name}
                color={player.avatarColor}
              />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-cream text-base truncate">
                  {player.name}
                  {isWinner ? (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-coral">
                      ◆ won
                    </span>
                  ) : null}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim mt-0.5">
                  {rh.handDescr}
                </p>
              </div>
              <div className="flex gap-1">
                {hole.map((c, i) => (
                  <PlayingCard key={i} card={c} size="sm" />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <div className="relative rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 mb-6">
        <span className="absolute -top-2 left-4 px-2 bg-[#0a0f0b] font-mono text-[9px] uppercase tracking-[0.24em] text-gold">
          ◆ Why
        </span>
        <p className="font-sans text-[14px] leading-relaxed text-cream">
          {result.explanation}
        </p>
      </div>

      <button
        onClick={() => {
          startNextHand();
          router.push("/hand");
        }}
        className="w-full py-4 rounded-2xl bg-coral text-ink font-display italic text-xl tracking-tight hover:opacity-90 transition-opacity mt-auto"
      >
        Deal next hand →
      </button>
    </Frame>
  );
}
