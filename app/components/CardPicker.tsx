"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { rankDisplay, SUIT_COLOR, SUIT_SYMBOL } from "./PlayingCard";
import type { Card, Rank, Suit } from "@/lib/types";

const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

const SUITS: Suit[] = ["s", "h", "d", "c"];

export function cardKey(c: Card | null): string {
  return c ? `${c.rank}${c.suit}` : "";
}

export function CardPicker({
  open,
  onPick,
  onClear,
  onClose,
  usedCards,
  current,
}: {
  open: boolean;
  onPick: (c: Card) => void;
  onClear: () => void;
  onClose: () => void;
  usedCards: Set<string>;
  current: Card | null;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-felt-deep border border-line-strong rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
                ◆ Pick a card
              </p>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 grid place-items-center rounded-full text-cream-dim hover:text-cream hover:bg-line"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {SUITS.map((suit) => (
                <div
                  key={suit}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
                >
                  {RANKS.map((rank) => {
                    const c: Card = { rank, suit };
                    const key = cardKey(c);
                    const isCurrent =
                      current?.rank === rank && current?.suit === suit;
                    const used = usedCards.has(key) && !isCurrent;
                    return (
                      <button
                        key={key}
                        disabled={used}
                        onClick={() => onPick(c)}
                        className={`aspect-[2/2.8] bg-cream rounded-sm flex flex-col items-center justify-center font-display ${SUIT_COLOR[suit]} ${used ? "opacity-25" : "hover:scale-105"} ${isCurrent ? "ring-2 ring-coral" : ""} transition-transform`}
                      >
                        <span className="text-[11px] font-semibold leading-none not-italic">
                          {rankDisplay(rank)}
                        </span>
                        <span className="text-[12px] leading-none">
                          {SUIT_SYMBOL[suit]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {current ? (
              <button
                onClick={onClear}
                className="mt-4 w-full py-2.5 rounded-xl border border-line-strong text-cream-dim hover:text-cream font-mono text-[11px] uppercase tracking-[0.18em]"
              >
                Clear this card
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
