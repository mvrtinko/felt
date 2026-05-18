declare module 'pokersolver' {
  export class Hand {
    static solve(cards: string[]): Hand;
    static winners(hands: Hand[]): Hand[];
    descr: string;
    name: string;
    cards: { value: string; suit: string }[];
    rank: number;
  }
}
