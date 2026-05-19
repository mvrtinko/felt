import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActionType,
  AvatarColor,
  Card,
  HandState,
  Player,
  ShowdownResult,
} from "./types";
import {
  applyAction,
  createInitialHand,
  forceShowdown,
  rewindLastAction,
} from "./hand-engine";

type BlindsConfig = {
  initialSb: number;
  initialBb: number;
  intervalMinutes: number;
  sessionStartedAt: number | null;
  pausedAt: number | null;
  totalPausedMs: number;
};

type State = {
  players: Player[];
  firstDealerIndex: number;
  currentHand: HandState | null;
  history: HandState[];
  pendingShowdown: {
    board: (Card | null)[];
    holeCards: Record<string, [Card | null, Card | null]>;
  } | null;
  lastShowdownResult: ShowdownResult | null;
  blinds: BlindsConfig;
};

type Actions = {
  addPlayer: (name: string, color: AvatarColor) => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;
  setFirstDealer: (index: number) => void;
  startGame: () => void;
  resetGame: () => void;

  setInitialBlinds: (sb: number, bb: number) => void;
  setBlindsInterval: (minutes: number) => void;
  pauseBlinds: () => void;
  resumeBlinds: () => void;

  recordAction: (playerId: string, action: ActionType) => void;
  undoLastAction: () => void;
  goToShowdown: () => void;
  declareWinner: (playerId: string) => void;
  startNextHand: () => void;

  initShowdown: () => void;
  setBoardCard: (slot: number, card: Card | null) => void;
  setHoleCard: (
    playerId: string,
    slot: 0 | 1,
    card: Card | null,
  ) => void;
  setShowdownResult: (result: ShowdownResult | null) => void;
  clearShowdown: () => void;
};

export type Store = State & Actions;

const AVATAR_PALETTE: AvatarColor[] = [
  "coral",
  "gold",
  "green",
  "blue",
  "purple",
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function nextAvatarColor(players: Player[]): AvatarColor {
  return AVATAR_PALETTE[players.length % AVATAR_PALETTE.length];
}

const DEFAULT_BLINDS: BlindsConfig = {
  initialSb: 1,
  initialBb: 2,
  intervalMinutes: 15,
  sessionStartedAt: null,
  pausedAt: null,
  totalPausedMs: 0,
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      players: [],
      firstDealerIndex: 0,
      currentHand: null,
      history: [],
      pendingShowdown: null,
      lastShowdownResult: null,
      blinds: { ...DEFAULT_BLINDS },

      addPlayer: (name, color) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => {
          if (s.players.length >= 9) return s;
          const exists = s.players.some(
            (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
          );
          if (exists) return s;
          const player: Player = {
            id: generateId(),
            name: trimmed,
            avatarColor: color,
            seatOrder: s.players.length,
          };
          return { players: [...s.players, player] };
        });
      },

      removePlayer: (id) => {
        set((s) => {
          const filtered = s.players
            .filter((p) => p.id !== id)
            .map((p, i) => ({ ...p, seatOrder: i }));
          let firstDealer = s.firstDealerIndex;
          if (firstDealer >= filtered.length) firstDealer = 0;
          return { players: filtered, firstDealerIndex: firstDealer };
        });
      },

      renamePlayer: (id, name) => {
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, name: name.trim() } : p,
          ),
        }));
      },

      setFirstDealer: (index) => {
        set({ firstDealerIndex: index });
      },

      startGame: () => {
        const { players, firstDealerIndex, blinds } = get();
        if (players.length < 2) return;
        const hand = createInitialHand(players, firstDealerIndex, 1);
        set({
          currentHand: hand,
          history: [],
          pendingShowdown: null,
          lastShowdownResult: null,
          blinds: {
            ...blinds,
            sessionStartedAt: Date.now(),
            pausedAt: null,
            totalPausedMs: 0,
          },
        });
      },

      resetGame: () => {
        set({
          players: [],
          firstDealerIndex: 0,
          currentHand: null,
          history: [],
          pendingShowdown: null,
          lastShowdownResult: null,
          blinds: { ...DEFAULT_BLINDS },
        });
      },

      setInitialBlinds: (sb, bb) => {
        set((s) => ({
          blinds: {
            ...s.blinds,
            initialSb: Math.max(1, Math.floor(sb)),
            initialBb: Math.max(1, Math.floor(bb)),
          },
        }));
      },

      setBlindsInterval: (minutes) => {
        set((s) => ({
          blinds: {
            ...s.blinds,
            intervalMinutes: Math.max(1, Math.floor(minutes)),
          },
        }));
      },

      pauseBlinds: () => {
        set((s) => {
          if (s.blinds.pausedAt !== null) return s;
          return {
            blinds: { ...s.blinds, pausedAt: Date.now() },
          };
        });
      },

      resumeBlinds: () => {
        set((s) => {
          if (s.blinds.pausedAt === null) return s;
          const now = Date.now();
          return {
            blinds: {
              ...s.blinds,
              totalPausedMs: s.blinds.totalPausedMs + (now - s.blinds.pausedAt),
              pausedAt: null,
            },
          };
        });
      },

      declareWinner: (winnerId) => {
        const { currentHand } = get();
        if (!currentHand) return;
        set({
          currentHand: {
            ...currentHand,
            street: "showdown",
            winnerPlayerId: winnerId,
          },
        });
      },

      recordAction: (playerId, action) => {
        const { currentHand, players } = get();
        if (!currentHand) return;
        const next = applyAction(currentHand, players, playerId, action);
        set({ currentHand: next });
      },

      undoLastAction: () => {
        const { currentHand, players } = get();
        if (!currentHand) return;
        const next = rewindLastAction(currentHand, players);
        set({ currentHand: next });
      },

      goToShowdown: () => {
        const { currentHand } = get();
        if (!currentHand) return;
        set({ currentHand: forceShowdown(currentHand) });
      },

      startNextHand: () => {
        const { currentHand, history, players } = get();
        if (!currentHand || players.length < 2) return;
        const newHistory = [...history, currentHand];
        const nextDealerSeat =
          (currentHand.dealerSeat + 1) % players.length;
        const newHand = createInitialHand(
          players,
          nextDealerSeat,
          currentHand.handNumber + 1,
        );
        set({
          history: newHistory,
          currentHand: newHand,
          pendingShowdown: null,
          lastShowdownResult: null,
        });
      },

      initShowdown: () => {
        const { currentHand, players } = get();
        if (!currentHand) return;
        const stillIn = players.filter(
          (p) => !currentHand.foldedPlayerIds.includes(p.id),
        );
        const holeCards: Record<string, [Card | null, Card | null]> = {};
        for (const p of stillIn) {
          holeCards[p.id] = [null, null];
        }
        set({
          pendingShowdown: {
            board: [null, null, null, null, null],
            holeCards,
          },
        });
      },

      setBoardCard: (slot, card) => {
        set((s) => {
          if (!s.pendingShowdown) return s;
          const board = [...s.pendingShowdown.board];
          board[slot] = card;
          return {
            pendingShowdown: { ...s.pendingShowdown, board },
          };
        });
      },

      setHoleCard: (playerId, slot, card) => {
        set((s) => {
          if (!s.pendingShowdown) return s;
          const holeCards = { ...s.pendingShowdown.holeCards };
          const existing = holeCards[playerId] ?? [null, null];
          const updated: [Card | null, Card | null] = [
            existing[0],
            existing[1],
          ];
          updated[slot] = card;
          holeCards[playerId] = updated;
          return {
            pendingShowdown: { ...s.pendingShowdown, holeCards },
          };
        });
      },

      setShowdownResult: (result) => {
        set({ lastShowdownResult: result });
      },

      clearShowdown: () => {
        set({ pendingShowdown: null });
      },
    }),
    {
      name: "felt-game-state",
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<State>;
        if (version < 2 || !state.blinds) {
          state.blinds = { ...DEFAULT_BLINDS };
        }
        return state as State;
      },
    },
  ),
);
