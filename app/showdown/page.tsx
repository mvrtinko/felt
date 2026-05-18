"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Frame } from "../components/Frame";
import { Logo } from "../components/Logo";
import { PlayerAvatar } from "../components/PlayerAvatar";
import {
  cardKey,
  CardPicker,
} from "../components/CardPicker";
import {
  EmptyCardSlot,
  PlayingCard,
} from "../components/PlayingCard";
import { useHasMounted } from "../hooks/useHasMounted";
import { useGameStore } from "@/lib/store";
import type { Card } from "@/lib/types";

type OpenSlot =
  | { kind: "board"; index: number }
  | { kind: "hole"; playerId: string; slot: 0 | 1 }
  | null;

export default function ShowdownPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const currentHand = useGameStore((s) => s.currentHand);
  const pendingShowdown = useGameStore((s) => s.pendingShowdown);
  const initShowdown = useGameStore((s) => s.initShowdown);
  const setBoardCard = useGameStore((s) => s.setBoardCard);
  const setHoleCard = useGameStore((s) => s.setHoleCard);

  const [openSlot, setOpenSlot] = useState<OpenSlot>(null);

  useEffect(() => {
    if (!mounted) return;
    if (!currentHand || players.length < 2) {
      router.replace("/");
      return;
    }
    if (!pendingShowdown) {
      initShowdown();
    }
  }, [mounted, currentHand, players.length, pendingShowdown, initShowdown, router]);

  const stillIn = useMemo(() => {
    if (!currentHand) return [];
    const folded = new Set(currentHand.foldedPlayerIds);
    return players.filter((p) => !folded.has(p.id));
  }, [players, currentHand]);

  const usedCards = useMemo(() => {
    const set = new Set<string>();
    if (!pendingShowdown) return set;
    pendingShowdown.board.forEach((c) => {
      if (c) set.add(cardKey(c));
    });
    for (const id of Object.keys(pendingShowdown.holeCards)) {
      const [a, b] = pendingShowdown.holeCards[id];
      if (a) set.add(cardKey(a));
      if (b) set.add(cardKey(b));
    }
    return set;
  }, [pendingShowdown]);

  const currentCard: Card | null = useMemo(() => {
    if (!openSlot || !pendingShowdown) return null;
    if (openSlot.kind === "board")
      return pendingShowdown.board[openSlot.index];
    return (
      pendingShowdown.holeCards[openSlot.playerId]?.[openSlot.slot] ?? null
    );
  }, [openSlot, pendingShowdown]);

  const boardFilledCount = pendingShowdown
    ? pendingShowdown.board.filter(Boolean).length
    : 0;

  const allHoleFilled = stillIn.every((p) => {
    const cards = pendingShowdown?.holeCards[p.id];
    return cards && cards[0] && cards[1];
  });

  const canReveal = boardFilledCount >= 3 && allHoleFilled;

  if (!mounted) {
    return (
      <Frame>
        <div className="flex-1 flex items-center justify-center">
          <Logo size="lg" />
        </div>
      </Frame>
    );
  }

  if (!currentHand || players.length < 2) {
    return (
      <Frame>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-xs text-cream-dim uppercase tracking-[0.2em]">
            Returning to setup…
          </p>
        </div>
      </Frame>
    );
  }

  if (!pendingShowdown) {
    return (
      <Frame>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-xs text-cream-dim uppercase tracking-[0.2em]">
            Preparing showdown…
          </p>
        </div>
      </Frame>
    );
  }

  function pick(card: Card) {
    if (!openSlot) return;
    if (openSlot.kind === "board") {
      setBoardCard(openSlot.index, card);
    } else {
      setHoleCard(openSlot.playerId, openSlot.slot, card);
    }
    setOpenSlot(null);
  }

  function clear() {
    if (!openSlot) return;
    if (openSlot.kind === "board") {
      setBoardCard(openSlot.index, null);
    } else {
      setHoleCard(openSlot.playerId, openSlot.slot, null);
    }
    setOpenSlot(null);
  }

  function handleReveal() {
    router.push("/verdict");
  }

  return (
    <Frame>
      <header className="flex items-center justify-between mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim">
          Hand · {String(currentHand.handNumber).padStart(3, "0")}
        </p>
        <Logo size="sm" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-full border border-line-strong bg-felt-deep text-cream">
          Showdown
        </span>
      </header>

      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold mb-3">
          ◆ Reveal
        </p>
        <h1 className="font-display text-cream text-[34px] leading-[1.1] tracking-tight mb-1">
          Who&apos;s <em className="text-coral not-italic">still in?</em>
        </h1>
        <p className="font-sans text-sm text-cream-dim">
          Tap each player&apos;s hole cards and the board to see who wins.
        </p>
      </div>

      <section className="rounded-2xl border border-line-strong bg-felt/30 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim">
            Board · 5 cards
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim">
            {boardFilledCount}/5
          </p>
        </div>
        <div className="flex gap-1.5">
          {pendingShowdown.board.map((card, i) => (
            <button
              key={i}
              onClick={() =>
                setOpenSlot({ kind: "board", index: i })
              }
              className="focus:outline-none"
            >
              {card ? (
                <PlayingCard card={card} size="md" />
              ) : (
                <EmptyCardSlot
                  size="md"
                  active={i < Math.max(3, boardFilledCount)}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 mb-6">
        {stillIn.map((p) => {
          const [c1, c2] = pendingShowdown.holeCards[p.id] ?? [null, null];
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-line-strong bg-felt/30 p-4 flex items-center gap-4"
            >
              <PlayerAvatar name={p.name} color={p.avatarColor} />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-cream text-base truncate">
                  {p.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim mt-0.5">
                  {c1 && c2 ? "Picked" : "Tap to pick"}
                </p>
              </div>
              <div className="flex gap-1.5">
                {[c1, c2].map((card, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setOpenSlot({
                        kind: "hole",
                        playerId: p.id,
                        slot: i as 0 | 1,
                      })
                    }
                    className="focus:outline-none"
                  >
                    {card ? (
                      <PlayingCard card={card} size="sm" />
                    ) : (
                      <EmptyCardSlot size="sm" active />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <button
        onClick={handleReveal}
        disabled={!canReveal}
        className="w-full py-4 rounded-2xl bg-coral text-ink font-display italic text-xl tracking-tight hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed mt-auto"
      >
        Reveal winner →
      </button>
      <p className="text-center mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim">
        {!canReveal
          ? `Need ${Math.max(0, 3 - boardFilledCount)} more board · ${stillIn.filter((p) => {
              const c = pendingShowdown.holeCards[p.id];
              return !c || !c[0] || !c[1];
            }).length} hands to pick`
          : "Tap reveal when ready"}
      </p>

      <CardPicker
        open={openSlot !== null}
        onPick={pick}
        onClear={clear}
        onClose={() => setOpenSlot(null)}
        usedCards={usedCards}
        current={currentCard}
      />
    </Frame>
  );
}
