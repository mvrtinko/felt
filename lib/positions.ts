import type { Position, Street } from "./types";

export function getPosition(
  seatIndex: number,
  dealerSeat: number,
  totalPlayers: number,
): Position {
  if (totalPlayers < 2) return null;
  if (totalPlayers === 2) {
    return seatIndex === dealerSeat ? "D" : "BB";
  }
  const sb = (dealerSeat + 1) % totalPlayers;
  const bb = (dealerSeat + 2) % totalPlayers;
  if (seatIndex === dealerSeat) return "D";
  if (seatIndex === sb) return "SB";
  if (seatIndex === bb) return "BB";
  return null;
}

export function getPositionLabel(
  seatIndex: number,
  dealerSeat: number,
  totalPlayers: number,
): string {
  if (totalPlayers < 2) return "";
  const offset = (seatIndex - dealerSeat + totalPlayers) % totalPlayers;
  if (totalPlayers === 2) {
    return offset === 0 ? "D/SB" : "BB";
  }
  if (offset === 0) return "D";
  if (offset === 1) return "SB";
  if (offset === 2) return "BB";

  const lateLabels: Record<number, string[]> = {
    4: ["UTG"],
    5: ["UTG", "CO"],
    6: ["UTG", "HJ", "CO"],
    7: ["UTG", "MP", "HJ", "CO"],
    8: ["UTG", "UTG+1", "MP", "HJ", "CO"],
    9: ["UTG", "UTG+1", "MP", "MP+1", "HJ", "CO"],
  };
  const labels = lateLabels[totalPlayers];
  if (!labels) return "";
  return labels[offset - 3] ?? "";
}

export function getFirstToAct(
  street: Street,
  dealerSeat: number,
  foldedSeatIndexes: Set<number>,
  totalPlayers: number,
): number {
  if (totalPlayers < 2) return -1;
  if (totalPlayers === 2) {
    if (street === "preflop") {
      return findNextNonFolded(dealerSeat, foldedSeatIndexes, totalPlayers);
    }
    return findNextNonFolded(
      (dealerSeat + 1) % totalPlayers,
      foldedSeatIndexes,
      totalPlayers,
    );
  }
  if (street === "preflop") {
    const utg = (dealerSeat + 3) % totalPlayers;
    return findNextNonFolded(utg, foldedSeatIndexes, totalPlayers);
  }
  const sb = (dealerSeat + 1) % totalPlayers;
  return findNextNonFolded(sb, foldedSeatIndexes, totalPlayers);
}

export function getNextToAct(
  currentIndex: number,
  foldedSeatIndexes: Set<number>,
  totalPlayers: number,
): number {
  if (totalPlayers < 2) return -1;
  return findNextNonFolded(
    (currentIndex + 1) % totalPlayers,
    foldedSeatIndexes,
    totalPlayers,
  );
}

function findNextNonFolded(
  start: number,
  folded: Set<number>,
  total: number,
): number {
  let i = start;
  for (let visited = 0; visited < total; visited++) {
    if (!folded.has(i)) return i;
    i = (i + 1) % total;
  }
  return -1;
}
