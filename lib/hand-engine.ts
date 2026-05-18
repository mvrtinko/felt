import type {
  ActionType,
  HandAction,
  HandState,
  Player,
  Street,
} from "./types";
import { getFirstToAct, getNextToAct } from "./positions";

const STREET_ORDER: Street[] = [
  "preflop",
  "flop",
  "turn",
  "river",
  "showdown",
];

export function createInitialHand(
  players: Player[],
  dealerSeat: number,
  handNumber: number,
): HandState {
  const folded = new Set<number>();
  const firstActor = getFirstToAct(
    "preflop",
    dealerSeat,
    folded,
    players.length,
  );
  return {
    handNumber,
    dealerSeat,
    street: "preflop",
    actions: [],
    foldedPlayerIds: [],
    raisesThisStreet: 1,
    currentActorIndex: firstActor,
    actedThisStreet: [],
    winnerPlayerId: null,
  };
}

function foldedIndexSet(
  players: Player[],
  foldedPlayerIds: string[],
): Set<number> {
  const ids = new Set(foldedPlayerIds);
  const indexes = new Set<number>();
  players.forEach((p, i) => {
    if (ids.has(p.id)) indexes.add(i);
  });
  return indexes;
}

export function applyAction(
  state: HandState,
  players: Player[],
  playerId: string,
  action: ActionType,
  now: number = Date.now(),
): HandState {
  if (state.street === "showdown") return state;
  const actorPlayer = players[state.currentActorIndex];
  if (!actorPlayer || actorPlayer.id !== playerId) return state;

  const newAction: HandAction = {
    playerId,
    street: state.street,
    action,
    timestamp: now,
  };

  const folded = new Set(state.foldedPlayerIds);
  let actedThisStreet = [...state.actedThisStreet];
  let raisesThisStreet = state.raisesThisStreet;

  if (action === "fold") {
    folded.add(playerId);
  } else if (action === "raise") {
    raisesThisStreet += 1;
    actedThisStreet = [playerId];
  } else {
    if (!actedThisStreet.includes(playerId)) {
      actedThisStreet = [...actedThisStreet, playerId];
    }
  }

  const nonFolded = players.filter((p) => !folded.has(p.id));

  if (nonFolded.length === 1) {
    return {
      ...state,
      actions: [...state.actions, newAction],
      foldedPlayerIds: Array.from(folded),
      actedThisStreet,
      raisesThisStreet,
      winnerPlayerId: nonFolded[0].id,
      street: "showdown",
    };
  }

  const foldedIdx = foldedIndexSet(players, Array.from(folded));
  const allActed = nonFolded.every((p) => actedThisStreet.includes(p.id));

  if (allActed) {
    const idx = STREET_ORDER.indexOf(state.street);
    const nextStreet = STREET_ORDER[idx + 1];
    if (!nextStreet || nextStreet === "showdown") {
      return {
        ...state,
        actions: [...state.actions, newAction],
        foldedPlayerIds: Array.from(folded),
        actedThisStreet: [],
        raisesThisStreet: 0,
        street: "showdown",
      };
    }
    const nextActor = getFirstToAct(
      nextStreet,
      state.dealerSeat,
      foldedIdx,
      players.length,
    );
    return {
      ...state,
      actions: [...state.actions, newAction],
      foldedPlayerIds: Array.from(folded),
      actedThisStreet: [],
      raisesThisStreet: 0,
      street: nextStreet,
      currentActorIndex: nextActor,
    };
  }

  const nextActor = getNextToAct(
    state.currentActorIndex,
    foldedIdx,
    players.length,
  );

  return {
    ...state,
    actions: [...state.actions, newAction],
    foldedPlayerIds: Array.from(folded),
    actedThisStreet,
    raisesThisStreet,
    currentActorIndex: nextActor,
  };
}

export function rewindLastAction(
  state: HandState,
  players: Player[],
): HandState {
  if (state.actions.length === 0) return state;
  const trimmed = state.actions.slice(0, -1);
  let rebuilt = createInitialHand(players, state.dealerSeat, state.handNumber);
  for (const a of trimmed) {
    rebuilt = applyAction(rebuilt, players, a.playerId, a.action, a.timestamp);
  }
  return rebuilt;
}

export function forceShowdown(state: HandState): HandState {
  if (state.street === "showdown") return state;
  return { ...state, street: "showdown" };
}

export function activePlayerIds(
  state: HandState,
  players: Player[],
): string[] {
  const folded = new Set(state.foldedPlayerIds);
  return players.filter((p) => !folded.has(p.id)).map((p) => p.id);
}

export function isCheckAllowed(
  state: HandState,
  players: Player[],
): boolean {
  const actor = players[state.currentActorIndex];
  if (!actor) return false;
  if (state.street === "preflop") {
    const bbSeat =
      players.length === 2
        ? (state.dealerSeat + 1) % players.length
        : (state.dealerSeat + 2) % players.length;
    const isBB = state.currentActorIndex === bbSeat;
    return isBB && state.raisesThisStreet === 1;
  }
  return state.raisesThisStreet === 0;
}

export function isCallAllowed(
  state: HandState,
  players: Player[],
): boolean {
  if (state.street === "showdown") return false;
  return !isCheckAllowed(state, players);
}

export function lastActionByPlayer(
  state: HandState,
  playerId: string,
): ActionType | null {
  for (let i = state.actions.length - 1; i >= 0; i--) {
    const a = state.actions[i];
    if (a.playerId === playerId && a.street === state.street) return a.action;
  }
  return null;
}
