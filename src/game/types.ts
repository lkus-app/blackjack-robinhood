export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type GamePhase =
  | 'betting'
  | 'dealing'
  | 'playerTurn'
  | 'dealerTurn'
  | 'insurance'
  | 'settling'
  | 'result';

export type HandResult = 'win' | 'lose' | 'push' | 'blackjack' | 'bust' | null;

export interface HandState {
  cards: CardData[];
  bet: number;
  doubled: boolean;
  stood: boolean;
  result: HandResult;
  payout: number;
}

export interface ChipDenomination {
  value: number;
  color: number;
  label: string;
  rim: number;
}

export const CHIP_VALUES: ChipDenomination[] = [
  { value: 1, color: 0xffffff, label: '1', rim: 0xcccccc },
  { value: 5, color: 0xe63946, label: '5', rim: 0x9b2226 },
  { value: 25, color: 0x1d4ed8, label: '25', rim: 0x1e3a8a },
  { value: 100, color: 0x111111, label: '100', rim: 0x444444 },
];

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
}
