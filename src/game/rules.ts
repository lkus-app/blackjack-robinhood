/**
 * International Blackjack house rules used by this game.
 * Based on common multi-deck casino rules (Atlantic City / European S17 style).
 */
export const HOUSE_RULES = {
  name: 'International Blackjack',
  decks: 6,
  /** Blackjack pays 3 to 2 (not 6:5) */
  blackjackPayout: '3:2' as const,
  /** Insurance pays 2 to 1, costs half the original bet */
  insurancePayout: '2:1' as const,
  /** Dealer stands on soft 17 (Ace+6) — S17 */
  dealerHitsSoft17: false,
  /** American style: dealer receives a hole card and peeks for blackjack */
  dealerHoleCard: true,
  /** Peek when upcard is Ace or 10-value */
  dealerPeek: true,
  /** Double down allowed on any first two cards */
  doubleAnyTwo: true,
  /** Only one card after double; no further hit */
  doubleOneCardOnly: true,
  /** Split not implemented in this build */
  splitAllowed: false,
  /** Late surrender not offered */
  surrender: false,
  /** Shoe reshuffles when ~1 deck remains */
  penetration: 'reshuffle near 52 cards left',
  startingBalance: 100,
  currency: 'USD',
  /** Reward: $10 net profit → 5 BJ coins */
  bjRate: { dollars: 10, coins: 5 },
} as const;

export const HOW_TO_PLAY_LINES: string[] = [
  'CARA BERMAIN',
  '',
  '1. Pasang taruhan — klik chip ($1 / $5 / $25 / $100). CLEAR untuk reset.',
  '2. DEAL — kartu dibagikan: 2 ke Anda, 2 ke dealer (1 tertutup).',
  '3. Jika dealer menunjuk Ace → Insurance opsional (setengah bet, bayar 2:1).',
  '4. Giliran Anda: HIT (ambil kartu), STAND (tahan), DOUBLE (gandakan bet + 1 kartu).',
  '5. Dealer buka hole card, hit sampai 17+. Soft 17 = stand (aturan S17).',
  '6. Bandingkan total. NEW untuk ronde berikutnya.',
  '',
  'ATURAN INTERNASIONAL (house rules)',
  '• 6-deck shoe  ·  Blackjack bayar 3:2  ·  Insurance 2:1',
  '• Dealer stand on soft 17 (S17)  ·  Hole card + peek Ace/10',
  '• Double di 2 kartu pertama (any total)  ·  1 kartu saja setelah double',
  '• Ace = 1 atau 11  ·  J/Q/K = 10  ·  Bust > 21 kalah otomatis',
  '• Push (seri) = taruhan dikembalikan  ·  Split belum tersedia',
  '',
  'KOIN BJ',
  'Saldo awal $100 virtual. Setiap kemenangan: $10 profit = 5 koin BJ.',
  '',
  'Tekan ESC atau tombol X untuk menutup.',
];

export function isTenValue(rank: string): boolean {
  return rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K';
}
