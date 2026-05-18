import type { Card, Suit, Rank } from "@/lib/types";

const SUIT_SYMBOL: Record<Suit, string> = {
  h: "♥",
  d: "♦",
  c: "♣",
  s: "♠",
};

const SUIT_COLOR: Record<Suit, string> = {
  h: "text-chip-red",
  d: "text-chip-red",
  c: "text-ink",
  s: "text-ink",
};

const SIZES = {
  sm: {
    box: "w-9 h-[52px] rounded-md",
    rank: "text-sm",
    suit: "text-base leading-none",
  },
  md: {
    box: "w-12 h-[68px] rounded-md",
    rank: "text-lg",
    suit: "text-xl leading-none",
  },
  lg: {
    box: "w-16 h-[90px] rounded-lg",
    rank: "text-2xl",
    suit: "text-2xl leading-none",
  },
} as const;

export function rankDisplay(rank: Rank): string {
  return rank === "T" ? "10" : rank;
}

export function PlayingCard({
  card,
  size = "sm",
  faded = false,
}: {
  card: Card;
  size?: keyof typeof SIZES;
  faded?: boolean;
}) {
  const s = SIZES[size];
  return (
    <div
      className={`${s.box} bg-cream ${SUIT_COLOR[card.suit]} flex flex-col items-center justify-center shadow-md font-display select-none ${faded ? "opacity-30" : ""}`}
    >
      <span className={`${s.rank} font-semibold leading-none not-italic`}>
        {rankDisplay(card.rank)}
      </span>
      <span className={s.suit}>{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}

export function EmptyCardSlot({
  size = "sm",
  active = false,
}: {
  size?: keyof typeof SIZES;
  active?: boolean;
}) {
  const s = SIZES[size];
  return (
    <div
      className={`${s.box} border border-dashed ${active ? "border-coral bg-coral-glow" : "border-line-strong"} grid place-items-center text-cream-dim`}
    >
      <span className="text-xs">+</span>
    </div>
  );
}

export { SUIT_SYMBOL, SUIT_COLOR };
