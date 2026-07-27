import {
  CardData,
  GamePhase,
  HandResult,
  HandState,
  Rank,
  SUITS,
  RANKS,
  cardValue,
} from './types';
import { HOUSE_RULES, isTenValue } from './rules';

/**
 * International Blackjack engine.
 * Rules: see HOUSE_RULES in rules.ts (S17, 3:2 BJ, 6-deck, dealer peek, double any two).
 */
export class BlackjackEngine {
  private deck: CardData[] = [];
  private shoeIndex = 0;
  player: HandState;
  dealer: CardData[] = [];
  dealerHoleRevealed = false;
  phase: GamePhase = 'betting';
  /** Virtual USD bankroll */
  balance: number;
  /** Reward coin: every $10 profit → 5 BJ */
  bjCoins = 0;
  /** BJ earned on the last settled hand */
  lastBjEarned = 0;
  currentBet = 0;
  insuranceBet = 0;
  message = 'Place your bet';
  winStreak = 0;
  handsPlayed = 0;
  totalWon = 0;
  totalLost = 0;

  static readonly BJ_PER_TEN_DOLLARS = HOUSE_RULES.bjRate.coins;

  constructor(startingBalance = HOUSE_RULES.startingBalance) {
    this.balance = startingBalance;
    this.player = this.emptyHand();
    this.reshuffle();
  }

  static profitToBj(profitDollars: number): number {
    if (profitDollars <= 0) return 0;
    return Math.floor(
      (profitDollars / HOUSE_RULES.bjRate.dollars) * HOUSE_RULES.bjRate.coins
    );
  }

  private emptyHand(): HandState {
    return {
      cards: [],
      bet: 0,
      doubled: false,
      stood: false,
      result: null,
      payout: 0,
    };
  }

  reshuffle(): void {
    this.deck = [];
    for (let d = 0; d < HOUSE_RULES.decks; d++) {
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          this.deck.push({
            suit,
            rank,
            id: `${d}-${suit}-${rank}`,
          });
        }
      }
    }
    this.shuffle(this.deck);
    this.shoeIndex = 0;
  }

  private shuffle(arr: CardData[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private draw(): CardData {
    // Reshuffle when about one deck remains (standard penetration practice)
    if (this.shoeIndex >= this.deck.length - 52) {
      this.reshuffle();
    }
    return this.deck[this.shoeIndex++];
  }

  /**
   * best = playable total (Aces counted as 11 then reduced).
   * soft = true if best uses an Ace as 11.
   */
  handTotal(cards: CardData[]): { hard: number; soft: boolean; best: number } {
    let total = 0;
    let aces = 0;
    for (const c of cards) {
      total += cardValue(c.rank);
      if (c.rank === 'A') aces++;
    }
    let reducedAces = aces;
    while (total > 21 && reducedAces > 0) {
      total -= 10;
      reducedAces--;
    }
    const soft = reducedAces > 0 && total <= 21;
    return { hard: total, soft, best: total };
  }

  isBlackjack(cards: CardData[]): boolean {
    return cards.length === 2 && this.handTotal(cards).best === 21;
  }

  isBust(cards: CardData[]): boolean {
    return this.handTotal(cards).best > 21;
  }

  canDouble(): boolean {
    return (
      this.phase === 'playerTurn' &&
      this.player.cards.length === 2 &&
      !this.player.doubled &&
      HOUSE_RULES.doubleAnyTwo &&
      this.balance >= this.player.bet
    );
  }

  canInsurance(): boolean {
    return (
      this.phase === 'insurance' &&
      this.dealer.length >= 1 &&
      this.dealer[0].rank === 'A' &&
      this.insuranceBet === 0 &&
      this.balance >= Math.floor(this.player.bet / 2)
    );
  }

  canHit(): boolean {
    return this.phase === 'playerTurn' && !this.player.stood && !this.isBust(this.player.cards);
  }

  canStand(): boolean {
    return this.phase === 'playerTurn' && !this.player.stood;
  }

  addChip(value: number): boolean {
    if (this.phase !== 'betting') return false;
    if (this.balance < value) return false;
    this.balance -= value;
    this.currentBet += value;
    this.player.bet = this.currentBet;
    this.message = `Bet: $${this.currentBet}`;
    return true;
  }

  clearBet(): number {
    if (this.phase !== 'betting') return 0;
    const returned = this.currentBet;
    this.balance += this.currentBet;
    this.currentBet = 0;
    this.player.bet = 0;
    this.message = 'Place your bet';
    return returned;
  }

  startDeal(): { player: CardData[]; dealer: CardData[] } | null {
    if (this.phase !== 'betting' || this.currentBet <= 0) return null;

    this.player = {
      cards: [],
      bet: this.currentBet,
      doubled: false,
      stood: false,
      result: null,
      payout: 0,
    };
    this.dealer = [];
    this.dealerHoleRevealed = false;
    this.insuranceBet = 0;
    this.lastBjEarned = 0;
    this.phase = 'dealing';
    this.message = 'Dealing...';

    // Deal order: player, dealer, player, dealer (hole)
    const p1 = this.draw();
    const d1 = this.draw();
    const p2 = this.draw();
    const d2 = this.draw();

    this.player.cards = [p1, p2];
    this.dealer = [d1, d2];

    return { player: [p1, p2], dealer: [d1, d2] };
  }

  /**
   * After deal animation. Handles naturals, insurance offer, and dealer peek (Ace/10).
   */
  afterDeal(): 'blackjack' | 'insurance' | 'playerTurn' | 'dealerBj' {
    const playerBJ = this.isBlackjack(this.player.cards);
    const dealerBJ = this.isBlackjack(this.dealer);
    const up = this.dealer[0];
    const upIsAce = up.rank === 'A';
    const upIsTen = isTenValue(up.rank);

    // Both natural → push
    if (playerBJ && dealerBJ) {
      this.settlePush();
      this.message = 'Double Blackjack — Push';
      return 'blackjack';
    }

    // Player natural: pay 3:2 unless dealer peeks BJ (already handled)
    if (playerBJ) {
      // If dealer shows Ace/10, peek already known via hole card (American)
      if (dealerBJ) {
        this.settlePush();
        return 'blackjack';
      }
      this.settleBlackjack();
      return 'blackjack';
    }

    // Dealer natural with Ace up → insurance first, then resolve
    if (upIsAce) {
      this.phase = 'insurance';
      this.message = 'Insurance? (half bet, pays 2:1)';
      return 'insurance';
    }

    // Dealer peek on 10-value upcard (American / international multi-deck)
    if (HOUSE_RULES.dealerPeek && upIsTen && dealerBJ) {
      this.dealerHoleRevealed = true;
      this.player.result = 'lose';
      this.player.payout = 0;
      this.phase = 'result';
      this.message = 'Dealer Blackjack';
      this.recordLoss();
      return 'dealerBj';
    }

    this.phase = 'playerTurn';
    this.message = 'Your turn — Hit, Stand, or Double';
    return 'playerTurn';
  }

  takeInsurance(): boolean {
    if (!this.canInsurance()) return false;
    const cost = Math.floor(this.player.bet / 2);
    this.balance -= cost;
    this.insuranceBet = cost;
    this.resolveInsurancePeek();
    return true;
  }

  declineInsurance(): void {
    if (this.phase !== 'insurance') return;
    this.insuranceBet = 0;
    this.resolveInsurancePeek();
  }

  /** After insurance decision: peek hole card for dealer BJ */
  private resolveInsurancePeek(): void {
    if (this.isBlackjack(this.dealer)) {
      this.dealerHoleRevealed = true;
      // Insurance wins 2:1 (+ stake returned) = 3× insurance amount total
      if (this.insuranceBet > 0) {
        this.balance += this.insuranceBet * 3;
        this.message = 'Dealer Blackjack — Insurance pays 2:1';
      } else {
        this.message = 'Dealer Blackjack';
      }
      // Main bet loses to dealer BJ
      this.player.result = 'lose';
      this.player.payout = 0;
      this.phase = 'result';
      this.recordLoss();
      return;
    }

    // No dealer BJ — insurance stake is forfeited (already deducted)
    this.insuranceBet = 0;
    this.phase = 'playerTurn';
    this.message = 'No dealer BJ — Your turn';
  }

  hit(): CardData | null {
    if (!this.canHit()) return null;
    const card = this.draw();
    this.player.cards.push(card);
    if (this.isBust(this.player.cards)) {
      this.player.result = 'bust';
      this.player.payout = 0;
      this.phase = 'result';
      this.message = 'Bust!';
      this.dealerHoleRevealed = true;
      this.recordLoss();
    } else if (this.handTotal(this.player.cards).best === 21) {
      // Auto-stand on hard/soft 21 (common table practice)
      this.player.stood = true;
    }
    return card;
  }

  stand(): void {
    if (!this.canStand()) return;
    this.player.stood = true;
    this.phase = 'dealerTurn';
    this.message = "Dealer's turn";
  }

  doubleDown(): CardData | null {
    if (!this.canDouble()) return null;
    this.balance -= this.player.bet;
    this.player.bet *= 2;
    this.currentBet = this.player.bet;
    this.player.doubled = true;
    const card = this.draw();
    this.player.cards.push(card);
    if (this.isBust(this.player.cards)) {
      this.player.result = 'bust';
      this.player.payout = 0;
      this.phase = 'result';
      this.message = 'Bust!';
      this.dealerHoleRevealed = true;
      this.recordLoss();
    } else {
      // Exactly one card after double — no further hits
      this.player.stood = true;
      this.phase = 'dealerTurn';
      this.message = "Dealer's turn";
    }
    return card;
  }

  /**
   * Dealer draws while total < 17.
   * S17: stands on soft 17 (best === 17 does not hit).
   * If HOUSE_RULES.dealerHitsSoft17 were true, soft 17 would hit.
   */
  dealerPlay(): CardData[] {
    this.dealerHoleRevealed = true;
    const drawn: CardData[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { best, soft } = this.handTotal(this.dealer);
      if (best > 21) break;
      if (best > 17) break;
      if (best === 17) {
        // Soft 17: hit only if H17 house rule
        if (soft && HOUSE_RULES.dealerHitsSoft17) {
          // fall through to draw
        } else {
          break; // S17 — stand
        }
      }
      if (best < 17) {
        // draw
      } else if (!(best === 17 && soft && HOUSE_RULES.dealerHitsSoft17)) {
        break;
      }
      const c = this.draw();
      this.dealer.push(c);
      drawn.push(c);
    }
    return drawn;
  }

  settleAfterDealer(): HandResult {
    this.phase = 'settling';
    const p = this.handTotal(this.player.cards).best;
    const d = this.handTotal(this.dealer).best;

    if (d > 21) {
      return this.settleWin();
    }
    if (p > d) {
      return this.settleWin();
    }
    if (p < d) {
      this.player.result = 'lose';
      this.player.payout = 0;
      this.phase = 'result';
      this.message = 'Dealer wins';
      this.recordLoss();
      return 'lose';
    }
    this.settlePush();
    return 'push';
  }

  private settleBlackjack(): HandResult {
    // 3:2: return stake + 1.5× stake = 2.5× bet
    const payout = Math.floor(this.player.bet * 2.5);
    const profit = payout - this.player.bet;
    this.balance += payout;
    this.player.payout = payout;
    this.player.result = 'blackjack';
    this.dealerHoleRevealed = true;
    this.phase = 'result';
    this.recordWin(profit);
    this.message =
      this.lastBjEarned > 0
        ? `BLACKJACK! 3:2  +${this.lastBjEarned} BJ`
        : 'BLACKJACK! Pays 3:2';
    return 'blackjack';
  }

  private settleWin(): HandResult {
    // Even money 1:1: return stake + equal win = 2× bet
    const payout = this.player.bet * 2;
    const profit = this.player.bet;
    this.balance += payout;
    this.player.payout = payout;
    this.player.result = 'win';
    this.phase = 'result';
    this.recordWin(profit);
    this.message =
      this.lastBjEarned > 0 ? `You win! +${this.lastBjEarned} BJ` : 'You win!';
    return 'win';
  }

  private settlePush(): void {
    this.balance += this.player.bet;
    this.player.payout = this.player.bet;
    this.player.result = 'push';
    this.dealerHoleRevealed = true;
    this.phase = 'result';
    this.lastBjEarned = 0;
    this.message = 'Push — bet returned';
    this.handsPlayed++;
  }

  private recordWin(profit: number): void {
    this.winStreak++;
    this.handsPlayed++;
    this.totalWon += profit;
    this.lastBjEarned = BlackjackEngine.profitToBj(profit);
    this.bjCoins += this.lastBjEarned;
  }

  private recordLoss(): void {
    this.winStreak = 0;
    this.handsPlayed++;
    this.totalLost += this.player.bet;
    this.lastBjEarned = 0;
  }

  newRound(): void {
    this.currentBet = 0;
    this.player = this.emptyHand();
    this.dealer = [];
    this.dealerHoleRevealed = false;
    this.insuranceBet = 0;
    this.lastBjEarned = 0;
    this.phase = 'betting';
    this.message = 'Place your bet';
  }

  displayTotal(cards: CardData[], hideHole = false): string {
    if (cards.length === 0) return '';
    if (hideHole && cards.length >= 1) {
      const up = cards[0];
      if (up.rank === 'A') return '11';
      return String(cardValue(up.rank as Rank));
    }
    const { best, soft } = this.handTotal(cards);
    if (soft && best <= 21) {
      // Show hard/soft form e.g. 7/17 for Ace+6
      const hardOnly = best - 10;
      if (hardOnly >= 1 && hardOnly !== best) {
        return `${hardOnly}/${best}`;
      }
    }
    return String(best);
  }
}
