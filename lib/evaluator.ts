import { Hand } from "pokersolver";
import type {
  Card,
  Rank,
  RankedHand,
  ShowdownResult,
  Suit,
} from "./types";

export function cardToString(c: Card): string {
  return `${c.rank}${c.suit}`;
}

const SUIT_NAME: Record<Suit, string> = {
  h: "hearts",
  d: "diamonds",
  c: "clubs",
  s: "spades",
};

const RANK_NAME: Record<Rank, string> = {
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  T: "Ten",
  J: "Jack",
  Q: "Queen",
  K: "King",
  A: "Ace",
};

const RANK_PLURAL: Record<Rank, string> = {
  "2": "Twos",
  "3": "Threes",
  "4": "Fours",
  "5": "Fives",
  "6": "Sixes",
  "7": "Sevens",
  "8": "Eights",
  "9": "Nines",
  T: "Tens",
  J: "Jacks",
  Q: "Queens",
  K: "Kings",
  A: "Aces",
};

function normalizeRank(v: string): Rank {
  if (v === "1") return "A";
  return v as Rank;
}

export type EvaluateInput = {
  board: Card[];
  playerCards: Record<string, [Card, Card]>;
  playerNames: Record<string, string>;
};

export function evaluateShowdown(input: EvaluateInput): ShowdownResult {
  const { board, playerCards, playerNames } = input;
  const playerIds = Object.keys(playerCards);
  const boardStrs = board.map(cardToString);

  const solved = playerIds.map((pid) => {
    const cards = [
      ...boardStrs,
      cardToString(playerCards[pid][0]),
      cardToString(playerCards[pid][1]),
    ];
    const hand = Hand.solve(cards);
    return { playerId: pid, hand };
  });

  const winnerHands = Hand.winners(solved.map((s) => s.hand));
  const winnerIdSet = new Set(
    solved
      .filter((s) => winnerHands.includes(s.hand))
      .map((s) => s.playerId),
  );

  const rankings: RankedHand[] = solved
    .map(({ playerId, hand }) => ({
      playerId,
      handName: hand.name,
      handDescr: hand.descr,
      cards: hand.cards.map((c) => ({
        rank: normalizeRank(c.value),
        suit: c.suit as Suit,
      })),
      rank: hand.rank,
    }))
    .sort((a, b) => b.rank - a.rank);

  const winners = rankings.filter((r) => winnerIdSet.has(r.playerId));
  const losers = rankings.filter((r) => !winnerIdSet.has(r.playerId));

  const explanation = buildExplanation({
    winners,
    losers,
    playerCards,
    playerNames,
  });

  return { winners, rankings, explanation };
}

function isPlayingTheBoard(
  bestCards: Card[],
  hole: [Card, Card],
): boolean {
  const holeStrs = new Set([
    cardToString(hole[0]),
    cardToString(hole[1]),
  ]);
  return bestCards.every((c) => !holeStrs.has(cardToString(c)));
}

function holeCardsUsed(
  bestCards: Card[],
  hole: [Card, Card],
): Card[] {
  const holeKeys = new Set([
    cardToString(hole[0]),
    cardToString(hole[1]),
  ]);
  const used: Card[] = [];
  if (holeKeys.has(cardToString(bestCards[0]))) used.push(hole[0]);
  for (const c of bestCards) {
    const key = cardToString(c);
    if (holeKeys.has(key)) {
      if (!used.some((u) => cardToString(u) === key)) used.push(c);
    }
  }
  return used;
}

function article(rank: Rank): string {
  return rank === "A" || rank === "8" ? "an" : "a";
}

function describeHand(rh: RankedHand): string {
  const r = rh.cards.map((c) => c.rank);
  const s = rh.cards.map((c) => c.suit);

  switch (rh.handName) {
    case "Royal Flush":
      return `a royal flush in ${SUIT_NAME[s[0]]}`;
    case "Straight Flush":
      return `${article(r[0])} ${RANK_NAME[r[0]]}-high straight flush`;
    case "Four of a Kind":
      return `four ${RANK_PLURAL[r[0]]}`;
    case "Full House":
      return `${RANK_PLURAL[r[0]]} full of ${RANK_PLURAL[r[3]]}`;
    case "Flush":
      return `${article(r[0])} ${RANK_NAME[r[0]]}-high flush in ${SUIT_NAME[s[0]]}`;
    case "Straight":
      return `${article(r[0])} ${RANK_NAME[r[0]]}-high straight`;
    case "Three of a Kind":
      return `three ${RANK_PLURAL[r[0]]}`;
    case "Two Pair":
      return `two pair, ${RANK_PLURAL[r[0]]} and ${RANK_PLURAL[r[2]]}`;
    case "Pair":
      return `a pair of ${RANK_PLURAL[r[0]]}`;
    case "High Card":
      return `${RANK_NAME[r[0]]} high`;
    default:
      return rh.handDescr.toLowerCase();
  }
}

function shortHandLabel(rh: RankedHand): string {
  switch (rh.handName) {
    case "Royal Flush":
      return "a royal flush";
    case "Straight Flush":
      return "a straight flush";
    case "Four of a Kind":
      return "four of a kind";
    case "Full House":
      return "a full house";
    case "Flush":
      return "a flush";
    case "Straight":
      return "a straight";
    case "Three of a Kind":
      return "three of a kind";
    case "Two Pair":
      return "two pair";
    case "Pair":
      return "a pair";
    case "High Card":
      return "high card";
    default:
      return rh.handName.toLowerCase();
  }
}

function tiebreakerSentence(
  winner: RankedHand,
  runnerUp: RankedHand,
): string {
  const wr = winner.cards.map((c) => c.rank);
  const lr = runnerUp.cards.map((c) => c.rank);

  switch (winner.handName) {
    case "Two Pair": {
      if (wr[0] !== lr[0]) {
        return `The higher pair (${RANK_PLURAL[wr[0]]}) beats ${RANK_PLURAL[lr[0]]}.`;
      }
      if (wr[2] !== lr[2]) {
        return `Same top pair, but ${RANK_PLURAL[wr[2]]} beats ${RANK_PLURAL[lr[2]]} for the second pair.`;
      }
      if (wr[4] !== lr[4]) {
        return `Same two pair, but the ${RANK_NAME[wr[4]]} kicker beats the ${RANK_NAME[lr[4]]}.`;
      }
      return "";
    }
    case "Pair": {
      if (wr[0] !== lr[0]) {
        return `${RANK_PLURAL[wr[0]]} beat ${RANK_PLURAL[lr[0]]}.`;
      }
      for (let i = 2; i < 5; i++) {
        if (wr[i] !== lr[i]) {
          return `Same pair, but the ${RANK_NAME[wr[i]]} kicker beats the ${RANK_NAME[lr[i]]}.`;
        }
      }
      return "";
    }
    case "Three of a Kind": {
      if (wr[0] !== lr[0]) {
        return `Trip ${RANK_PLURAL[wr[0]]} beats trip ${RANK_PLURAL[lr[0]]}.`;
      }
      for (let i = 3; i < 5; i++) {
        if (wr[i] !== lr[i]) {
          return `Same trips, but the ${RANK_NAME[wr[i]]} kicker is higher.`;
        }
      }
      return "";
    }
    case "Four of a Kind": {
      if (wr[0] !== lr[0]) {
        return `Quad ${RANK_PLURAL[wr[0]]} beats quad ${RANK_PLURAL[lr[0]]}.`;
      }
      if (wr[4] !== lr[4]) {
        return `Same quads, but the ${RANK_NAME[wr[4]]} kicker beats the ${RANK_NAME[lr[4]]}.`;
      }
      return "";
    }
    case "Full House": {
      if (wr[0] !== lr[0]) {
        return `${RANK_PLURAL[wr[0]]} full beats ${RANK_PLURAL[lr[0]]} full.`;
      }
      if (wr[3] !== lr[3]) {
        return `Same trips, but ${RANK_PLURAL[wr[3]]} over ${RANK_PLURAL[lr[3]]} for the pair.`;
      }
      return "";
    }
    case "Flush":
    case "Straight":
    case "Straight Flush": {
      for (let i = 0; i < 5; i++) {
        if (wr[i] !== lr[i]) {
          return `The ${RANK_NAME[wr[i]]} beats the ${RANK_NAME[lr[i]]} on a card-by-card compare.`;
        }
      }
      return "";
    }
    case "High Card": {
      for (let i = 0; i < 5; i++) {
        if (wr[i] !== lr[i]) {
          return `${RANK_NAME[wr[i]]} beats ${RANK_NAME[lr[i]]} as the highest card.`;
        }
      }
      return "";
    }
    default:
      return "";
  }
}

type ExplainCtx = {
  winners: RankedHand[];
  losers: RankedHand[];
  playerCards: Record<string, [Card, Card]>;
  playerNames: Record<string, string>;
};

function getName(id: string, names: Record<string, string>): string {
  return names[id] || "Player";
}

function buildExplanation(ctx: ExplainCtx): string {
  const { winners, losers, playerCards, playerNames } = ctx;
  if (winners.length === 0) return "";

  if (winners.length > 1) {
    return buildSplitExplanation(winners, playerCards, playerNames);
  }

  const winner = winners[0];
  const wName = getName(winner.playerId, playerNames);
  const wHand = describeHand(winner);
  const playingBoard = isPlayingTheBoard(
    winner.cards,
    playerCards[winner.playerId],
  );

  let s = `${wName} wins with ${wHand}.`;

  if (losers.length > 0) {
    const top = losers[0];
    const tName = getName(top.playerId, playerNames);
    const tHand = describeHand(top);
    if (winner.rank > top.rank) {
      const winShort = shortHandLabel(winner);
      const loseShort = shortHandLabel(top);
      s += ` ${tName} had ${tHand}, but ${winShort} beats ${loseShort}.`;
    } else {
      const tb = tiebreakerSentence(winner, top);
      s += ` ${tName} also had ${shortHandLabel(top)}. ${tb}`.trimEnd();
    }
  }

  if (playingBoard) {
    s += ` ${wName} played the board — the hole cards didn't help.`;
  } else {
    const used = holeCardsUsed(winner.cards, playerCards[winner.playerId]);
    if (used.length > 0) {
      const usedStr = used
        .map((c) => `${c.rank === "T" ? "10" : c.rank}${suitGlyph(c.suit)}`)
        .join(" ");
      s += ` Hole card${used.length > 1 ? "s" : ""}: ${usedStr}.`;
    }
  }

  return s.trim();
}

function buildSplitExplanation(
  winners: RankedHand[],
  playerCards: Record<string, [Card, Card]>,
  playerNames: Record<string, string>,
): string {
  const names = winners.map((w) => getName(w.playerId, playerNames));
  const list =
    names.length === 2
      ? `${names[0]} and ${names[1]}`
      : names.slice(0, -1).join(", ") + `, and ${names[names.length - 1]}`;
  const desc = describeHand(winners[0]);
  const allPlayingBoard = winners.every((w) =>
    isPlayingTheBoard(w.cards, playerCards[w.playerId]),
  );
  if (allPlayingBoard) {
    return `Split pot. ${list} all play the board — ${desc}. Hole cards didn't improve on the board.`;
  }
  return `Split pot. ${list} share ${desc} — identical strength on the tiebreaker.`;
}

function suitGlyph(s: Suit): string {
  switch (s) {
    case "h":
      return "♥";
    case "d":
      return "♦";
    case "c":
      return "♣";
    case "s":
      return "♠";
  }
}
