"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { PlayerAvatar } from "./PlayerAvatar";
import type { Player } from "@/lib/types";

export function WinnerPickerSheet({
  open,
  players,
  onPick,
  onClose,
}: {
  open: boolean;
  players: Player[];
  onPick: (playerId: string) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-felt-deep border border-line-strong rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
                ◆ Declare winner
              </p>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 grid place-items-center rounded-full text-cream-dim hover:text-cream hover:bg-line"
              >
                <X size={16} />
              </button>
            </div>
            <p className="font-sans text-xs text-cream-dim mb-4">
              Skip the card picker — tap whoever took the pot.
            </p>
            <ul className="flex flex-col gap-2">
              {players.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => onPick(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl border border-line-strong bg-felt/30 hover:border-coral hover:bg-coral-glow transition-colors text-left"
                  >
                    <PlayerAvatar name={p.name} color={p.avatarColor} />
                    <span className="font-sans text-cream text-base flex-1">
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-dim">
                      tap →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
