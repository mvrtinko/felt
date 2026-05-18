export type Suit = 'h' | 'd' | 'c' | 's';

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export type Card = {
  rank: Rank;
  suit: Suit;
};

export type Position = 'D' | 'SB' | 'BB' | null;

export type ActionType = 'fold' | 'check' | 'call' | 'raise';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type AvatarColor = 'coral' | 'gold' | 'green' | 'blue' | 'purple';

export type Player = {
  id: string;
  name: string;
  avatarColor: AvatarColor;
  seatOrder: number;
};

export type HandAction = {
  playerId: string;
  street: Street;
  action: ActionType;
  timestamp: number;
};

export type HandState = {
  handNumber: number;
  dealerSeat: number;
  street: Street;
  actions: HandAction[];
  foldedPlayerIds: string[];
  raisesThisStreet: number;
  currentActorIndex: number;
  actedThisStreet: string[];
  winnerPlayerId: string | null;
};

export type ShowdownInput = {
  board: Card[];
  playerCards: Record<string, [Card, Card]>;
};

export type RankedHand = {
  playerId: string;
  handName: string;
  handDescr: string;
  cards: Card[];
  rank: number;
};

export type ShowdownResult = {
  winners: RankedHand[];
  rankings: RankedHand[];
  explanation: string;
};

export type GameState = {
  players: Player[];
  firstDealerIndex: number;
  currentHand: HandState | null;
  history: HandState[];
};
