"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Undo2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Frame } from "../components/Frame";
import { Logo } from "../components/Logo";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { WinnerPickerSheet } from "../components/WinnerPickerSheet";
import { useHasMounted } from "../hooks/useHasMounted";
import { useGameStore } from "@/lib/store";
import {
  isCheckAllowed,
  isCallAllowed,
  lastActionByPlayer,
} from "@/lib/hand-engine";
import {
  getPosition,
  getPositionLabel,
} from "@/lib/positions";
import { computeBlinds, formatMs, formatStake } from "@/lib/blinds";
import type { ActionType, Position, Street } from "@/lib/types";

const STREET_LABEL: Record<Street, string> = {
  preflop: "Preflop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  showdown: "Showdown",
};

const POS_STYLES: Record<Exclude<Position, null>, string> = {
  D: "bg-cream text-ink",
  SB: "bg-gold text-ink",
  BB: "bg-coral text-ink",
};

export default function HandPage() {
  const mounted = useHasMounted();
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const currentHand = useGameStore((s) => s.currentHand);
  const blindsConfig = useGameStore((s) => s.blinds);
  const recordAction = useGameStore((s) => s.recordAction);
  const undoLastAction = useGameStore((s) => s.undoLastAction);
  const goToShowdown = useGameStore((s) => s.goToShowdown);
  const initShowdown = useGameStore((s) => s.initShowdown);
  const startNextHand = useGameStore((s) => s.startNextHand);
  const declareWinner = useGameStore((s) => s.declareWinner);
  const pauseBlinds = useGameStore((s) => s.pauseBlinds);
  const resumeBlinds = useGameStore((s) => s.resumeBlinds);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const blinds = useMemo(
    () => computeBlinds(blindsConfig, now),
    [blindsConfig, now],
  );

  const [winnerSheetOpen, setWinnerSheetOpen] = useState(false);

  useEffect(() => {
    if (mounted && (!currentHand || players.length < 2)) {
      router.replace("/");
    }
  }, [mounted, currentHand, players.length, router]);

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

  const handNumStr = String(currentHand.handNumber).padStart(3, "0");
  const actor = players[currentHand.currentActorIndex];
  const foldedSet = new Set(currentHand.foldedPlayerIds);
  const stillInCount = players.length - foldedSet.size;

  // Fold-out (everyone but one folded)
  if (currentHand.street === "showdown" && currentHand.winnerPlayerId) {
    const winner = players.find(
      (p) => p.id === currentHand.winnerPlayerId,
    );
    const isFoldOut = stillInCount === 1;
    return (
      <Frame>
        <header className="flex items-center justify-between mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim">
            Hand · {handNumStr}
          </p>
          <Logo size="sm" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
            ◆ Hand over
          </p>
          {winner ? (
            <>
              <PlayerAvatar
                name={winner.name}
                color={winner.avatarColor}
                size="lg"
              />
              <h1 className="font-display italic text-cream text-4xl">
                {winner.name} takes it.
              </h1>
              <p className="font-sans text-sm text-cream-dim max-w-xs">
                {isFoldOut
                  ? "Won by default. Everyone else folded."
                  : "Awarded by table call — no cards needed."}
              </p>
            </>
          ) : null}
        </div>
        <button
          onClick={() => {
            startNextHand();
          }}
          className="w-full py-4 rounded-2xl bg-coral text-ink font-display italic text-xl tracking-tight hover:opacity-90 transition-opacity"
        >
          Deal next hand →
        </button>
      </Frame>
    );
  }

  // Manual showdown (river complete or "show" pressed)
  if (currentHand.street === "showdown" && !currentHand.winnerPlayerId) {
    return (
      <Frame>
        <header className="flex items-center justify-between mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim">
            Hand · {handNumStr}
          </p>
          <Logo size="sm" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
            ◆ Time to show
          </p>
          <h1 className="font-display italic text-cream text-4xl">
            Showdown.
          </h1>
          <p className="font-sans text-sm text-cream-dim max-w-xs">
            Tap below to pick the board and each remaining hand.
          </p>
        </div>
        <button
          onClick={() => {
            initShowdown();
            router.push("/showdown");
          }}
          className="w-full py-4 rounded-2xl bg-coral text-ink font-display italic text-xl tracking-tight hover:opacity-90 transition-opacity"
        >
          Pick cards →
        </button>
      </Frame>
    );
  }

  const checkOk = isCheckAllowed(currentHand, players);
  const callOk = isCallAllowed(currentHand, players);
  const actorPosLabel = getPositionLabel(
    currentHand.currentActorIndex,
    currentHand.dealerSeat,
    players.length,
  );

  const subline = (() => {
    if (currentHand.street === "preflop") {
      if (checkOk) return "your option";
      if (currentHand.raisesThisStreet <= 1) return `${blinds.bb} to call`;
      if (currentHand.raisesThisStreet === 2) return "raised — to call";
      return `${currentHand.raisesThisStreet}-bet — to call`;
    }
    if (checkOk) return "no bet";
    if (currentHand.raisesThisStreet === 1) return "bet — to call";
    return `${currentHand.raisesThisStreet}-bet — to call`;
  })();

  function handleAction(action: ActionType) {
    if (!actor) return;
    if (action === "check" && !checkOk) return;
    if (action === "call" && !callOk) return;
    recordAction(actor.id, action);
  }

  const canShowdown =
    currentHand.street === "river" && stillInCount >= 2;

  return (
    <Frame>
      <header className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim">
          Hand · {handNumStr}
        </p>
        <Logo size="sm" />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-full border border-line-strong bg-felt-deep text-cream">
          {STREET_LABEL[currentHand.street]}
        </span>
      </header>

      <button
        type="button"
        onClick={() => (blinds.paused ? resumeBlinds() : pauseBlinds())}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border ${
          blinds.paused
            ? "border-gold/40 bg-gold/10"
            : "border-line-strong bg-felt/30"
        } mb-5 transition-colors`}
        aria-label={blinds.paused ? "Resume blinds timer" : "Pause blinds timer"}
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim">
            Blinds
          </span>
          <span className="font-display italic text-cream text-base leading-none">
            {formatStake(blinds.sb)}/{formatStake(blinds.bb)}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream-dim">
            Lv {blinds.level + 1}
          </span>
        </span>
        <span
          className={`font-mono text-sm tabular-nums ${
            blinds.paused ? "text-gold" : "text-cream"
          }`}
        >
          {blinds.paused
            ? "PAUSED"
            : formatMs(blinds.msRemainingInLevel)}
        </span>
      </button>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={`${currentHand.street}-${currentHand.currentActorIndex}-${currentHand.actions.length}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="rounded-2xl border border-coral coral-glow bg-coral-glow px-5 py-5 mb-5"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-coral mb-2">
            ◆ To act
          </p>
          <div className="flex items-center gap-3">
            {actor ? (
              <PlayerAvatar
                name={actor.name}
                color={actor.avatarColor}
                size="lg"
              />
            ) : null}
            <div className="flex-1 min-w-0">
              <h2 className="font-display italic text-cream text-3xl leading-none truncate">
                {actor?.name ?? "—"}
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream-dim mt-2">
                <span className="text-cream">{actorPosLabel}</span>
                <span className="mx-2 text-line-strong">·</span>
                <span>{subline}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cream-dim mb-2">
          Table
        </p>
        <ul className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {players.map((p, i) => {
            const folded = foldedSet.has(p.id);
            const isActing = i === currentHand.currentActorIndex && !folded;
            const lastAction = lastActionByPlayer(currentHand, p.id);
            const pos = getPosition(
              i,
              currentHand.dealerSeat,
              players.length,
            );
            const stateLabel = folded
              ? "fold"
              : isActing
                ? "acting"
                : lastAction ?? "—";
            return (
              <li
                key={p.id}
                className={`shrink-0 snap-start w-[78px] flex flex-col items-center gap-1.5 px-1 py-2 rounded-xl border ${
                  isActing
                    ? "border-coral bg-coral-glow"
                    : "border-line-strong bg-felt/20"
                } ${folded ? "opacity-35" : ""}`}
              >
                <div className="relative">
                  <PlayerAvatar
                    name={p.name}
                    color={p.avatarColor}
                    size="md"
                  />
                  {pos ? (
                    <span
                      className={`absolute -bottom-1 -right-1 ${POS_STYLES[pos]} font-mono text-[9px] leading-none px-1.5 py-1 rounded-full font-semibold`}
                    >
                      {pos}
                    </span>
                  ) : null}
                </div>
                <span className="font-sans text-[11px] text-cream truncate w-full text-center">
                  {p.name}
                </span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.16em] ${
                    isActing
                      ? "text-coral"
                      : folded
                        ? "text-cream-dim"
                        : lastAction === "raise"
                          ? "text-coral"
                          : lastAction === "fold"
                            ? "text-cream-dim"
                            : "text-cream-dim"
                  }`}
                >
                  {stateLabel}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <ActionButton
          label="Fold"
          tone="muted"
          onClick={() => handleAction("fold")}
        />
        <ActionButton
          label="Check"
          tone="gold"
          onClick={() => handleAction("check")}
          disabled={!checkOk}
        />
        <ActionButton
          label="Call"
          tone="neutral"
          onClick={() => handleAction("call")}
          disabled={!callOk}
        />
        <ActionButton
          label="Raise"
          tone="coral"
          onClick={() => handleAction("raise")}
        />
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
        <button
          onClick={() => undoLastAction()}
          disabled={currentHand.actions.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-cream-dim hover:text-cream font-mono text-[11px] uppercase tracking-[0.18em] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo2 size={14} />
          Undo last
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWinnerSheetOpen(true)}
            disabled={stillInCount < 2}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-cream hover:opacity-80 font-mono text-[11px] uppercase tracking-[0.18em] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trophy size={14} />
            Winner
          </button>
          <button
            onClick={() => {
              goToShowdown();
              initShowdown();
              router.push("/showdown");
            }}
            disabled={!canShowdown}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gold hover:opacity-80 font-mono text-[11px] uppercase tracking-[0.18em] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Showdown
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <WinnerPickerSheet
        open={winnerSheetOpen}
        players={players.filter((p) => !foldedSet.has(p.id))}
        onPick={(winnerId) => {
          declareWinner(winnerId);
          setWinnerSheetOpen(false);
        }}
        onClose={() => setWinnerSheetOpen(false)}
      />
    </Frame>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  tone: "coral" | "gold" | "neutral" | "muted";
  onClick: () => void;
  disabled?: boolean;
}) {
  const styles = {
    coral: "bg-coral text-ink",
    gold: "bg-gold/20 text-gold border border-gold/40",
    neutral: "bg-felt-light text-cream border border-line-strong",
    muted: "bg-felt-deep text-cream-dim border border-line-strong",
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles} py-4 rounded-2xl font-display italic text-xl tracking-tight transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}
