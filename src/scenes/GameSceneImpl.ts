import Phaser from 'phaser';
import { BlackjackEngine } from '../game/BlackjackEngine';
import { CARD_WIDTH, CARD_HEIGHT } from '../game/AssetFactory';
import { CardData, CHIP_VALUES, HandResult } from '../game/types';
import { HOW_TO_PLAY_LINES } from '../game/rules';
import { connectWallet, WalletState, initialWalletState } from '../web3/robinhoodChain';
type UIButton = {
  bg: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone;
  enabled: boolean;
  key: string;
};
/** Main table scene — compact for reliable deploy */
export class GameScene extends Phaser.Scene {
  private engine!: BlackjackEngine;
  private dealerSprite!: Phaser.GameObjects.Image;
  private table!: Phaser.GameObjects.Image;
  private playerCardSprites: Phaser.GameObjects.Image[] = [];
  private dealerCardSprites: Phaser.GameObjects.Image[] = [];
  private betChipSprites: Phaser.GameObjects.Image[] = [];
  private buttons = new Map<string, UIButton>();
  private btnDraw = new Map<string, (e: boolean) => void>();
  private balanceText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private playerTotalText!: Phaser.GameObjects.Text;
  private dealerTotalText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private walletText!: Phaser.GameObjects.Text;
  private helpContainer: Phaser.GameObjects.Container | null = null;
  private helpOpen = false;
  private animating = false;
  private wallet: WalletState = { ...initialWalletState };
  private shoePos = { x: 0, y: 0 };
  private playerCardOrigin = { x: 0, y: 0 };
  private dealerCardOrigin = { x: 0, y: 0 };
  private betCirclePos = { x: 0, y: 0 };
  private chipTrayY = 0;
  private actionBarY = 0;
  private cx = 0;
  private cy = 0;
  private readonly CHIP_UI = 36;
  private readonly CHIP_BET = 28;
  private readonly UI_D = 500;
  private readonly HELP_D = 2000;
  constructor() {
    super('Game');
  }
  create(): void {
    this.engine = new BlackjackEngine(100);
    this.layout();
    this.drawBackground();
    this.drawTable();
    this.drawDealer();
    this.drawTitle();
    this.drawSidePanels();
    this.drawControlDock();
    this.drawHud();
    this.drawHelpButton();
    this.refreshUI();
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.helpOpen) this.closeHelp();
    });
    this.input.keyboard?.on('keydown-H', () => {
      if (this.helpOpen) this.closeHelp();
      else this.openHelp();
    });
    this.scale.on('resize', () => this.scene.restart());
  }
  private layout(): void {
    this.cx = this.scale.width / 2;
    this.cy = this.scale.height / 2;
    const dockH = 118;
    this.shoePos = { x: this.cx + Math.min(300, this.scale.width * 0.28), y: this.cy - 100 };
    this.playerCardOrigin = { x: this.cx - 36, y: this.cy + 70 };
    this.dealerCardOrigin = { x: this.cx - 36, y: this.cy - 70 };
    this.betCirclePos = { x: this.cx, y: this.cy + 20 };
    this.actionBarY = this.scale.height - dockH + 36;
    this.chipTrayY = this.scale.height - 28;
  }
  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x070b14, 0x0a0e17, 0x12101f, 0x0d1520, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);
    const orb1 = this.add.circle(this.scale.width * 0.15, this.scale.height * 0.2, 120, 0x7c3aed, 0.06);
    const orb2 = this.add.circle(this.scale.width * 0.85, this.scale.height * 0.3, 100, 0x06b6d4, 0.05);
    this.tweens.add({ targets: [orb1, orb2], alpha: { from: 0.04, to: 0.1 }, duration: 3000, yoyo: true, repeat: -1 });
  }
  private drawTable(): void {
    this.table = this.add.image(this.cx, this.cy + 10, 'felt-table');
    const maxH = this.scale.height - 118 - 100;
    const fit = Math.min(this.scale.width / this.table.width, maxH / this.table.height);
    this.table.setScale(fit * 0.92).setDepth(1);
    const s = this.table.scaleX;
    this.add
      .text(this.cx, this.cy - 55 * s, 'BLACK JACK PAYS 3 TO 2', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: `${Math.max(11, 13 * Math.min(s * 8, 1.4))}px`,
        color: '#f0d060',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.92)
      .setDepth(2);
    this.add
      .text(this.cx, this.cy - 35 * s, 'INSURANCE PAYS 2 TO 1', {
        fontFamily: 'Inter, sans-serif',
        fontSize: `${Math.max(10, 11 * Math.min(s * 8, 1.2))}px`,
        color: '#e8d5a3',
      })
      .setOrigin(0.5)
      .setAlpha(0.8)
      .setDepth(2);
  }
  private drawDealer(): void {
    this.dealerSprite = this.add.image(this.cx, 8, 'dealer-idle');
    const targetH = Math.min(280, this.scale.height * 0.38);
    this.dealerSprite.setScale(targetH / this.dealerSprite.height).setOrigin(0.5, 0).setDepth(5);
    this.tweens.add({
      targets: this.dealerSprite,
      y: this.dealerSprite.y - 3,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const shoe = this.add.graphics().setDepth(6);
    shoe.fillStyle(0x2a1810, 1);
    shoe.fillRoundedRect(this.shoePos.x - 30, this.shoePos.y - 20, 60, 40, 6);
    shoe.lineStyle(2, 0xc9a227, 0.8);
    shoe.strokeRoundedRect(this.shoePos.x - 30, this.shoePos.y - 20, 60, 40, 6);
    this.add
      .text(this.shoePos.x, this.shoePos.y, 'SHOE', { fontFamily: 'Inter', fontSize: '10px', color: '#c9a227' })
      .setOrigin(0.5)
      .setDepth(6);
  }
  private drawTitle(): void {
    const t = this.add
      .text(this.cx, 28, 'BlackJack', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '32px',
        color: '#f0e6c8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    t.setShadow(0, 0, '#a78bfa', 16, true, true);
    this.add
      .text(this.cx, 52, 'Robinhood Chain Casino', { fontFamily: 'Inter', fontSize: '11px', color: '#64748b' })
      .setOrigin(0.5);
    this.tweens.add({ targets: t, alpha: { from: 0.85, to: 1 }, duration: 2000, yoyo: true, repeat: -1 });
  }
  private drawSidePanels(): void {
    const style = { fontFamily: 'Inter', fontSize: '12px', color: '#cbd5e1', lineSpacing: 6 };
    const leftX = 16;
    const leftBg = this.add.graphics();
    leftBg.fillStyle(0x0f172a, 0.75);
    leftBg.fillRoundedRect(leftX, 80, 150, 160, 12);
    leftBg.lineStyle(1, 0x7c3aed, 0.4);
    leftBg.strokeRoundedRect(leftX, 80, 150, 160, 12);
    this.add.text(leftX + 75, 96, 'MY STATS', { fontFamily: 'Orbitron', fontSize: '12px', color: '#a78bfa' }).setOrigin(0.5);
    this.statsText = this.add.text(leftX + 14, 118, '', style);
    const rightX = this.scale.width - 166;
    const rightBg = this.add.graphics();
    rightBg.fillStyle(0x0f172a, 0.75);
    rightBg.fillRoundedRect(rightX, 80, 150, 160, 12);
    rightBg.lineStyle(1, 0x06b6d4, 0.4);
    rightBg.strokeRoundedRect(rightX, 80, 150, 160, 12);
    this.add.text(rightX + 75, 96, 'LEADERBOARD', { fontFamily: 'Orbitron', fontSize: '12px', color: '#67e8f9' }).setOrigin(0.5);
    this.add.text(rightX + 14, 118, '1. You — ★\n2. 0xAce… — 12\n3. Luna — 9\n4. ChainKing — 7\n5. FeltFox — 5', style);
  }
  private drawControlDock(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const dockH = 118;
    const d = this.UI_D;
    const dock = this.add.graphics().setDepth(d);
    dock.fillStyle(0x070b14, 0.94);
    dock.fillRect(0, h - dockH, w, dockH);
    dock.lineStyle(1, 0x7c3aed, 0.35);
    dock.lineBetween(0, h - dockH, w, h - dockH);
    this.add.graphics().setDepth(d).fillStyle(0xc9a227, 0.15).fillRect(0, h - dockH, w, 2);
    this.drawActionButtons();
    this.drawChipSelector();
  }
  private drawChipSelector(): void {
    const d = this.UI_D + 2;
    const gap = 48;
    const totalW = (CHIP_VALUES.length - 1) * gap;
    const startX = this.cx - totalW / 2;
    const y = this.chipTrayY;
    CHIP_VALUES.forEach((chip, i) => {
      const x = startX + i * gap;
      const img = this.add.image(x, y - 8, `chip-${chip.value}`);
      img.setDisplaySize(this.CHIP_UI, this.CHIP_UI).setDepth(d);
      img.setInteractive({ useHandCursor: true });
      img.on('pointerover', () => {
        if (this.engine.phase === 'betting' && !this.animating) {
          this.tweens.add({ targets: img, y: y - 12, duration: 80 });
        }
      });
      img.on('pointerout', () => this.tweens.add({ targets: img, y: y - 8, duration: 80 }));
      img.on('pointerdown', () => this.onChipClick(chip.value, img));
      this.add
        .text(x, y + 14, `${chip.value}`, { fontFamily: 'Inter', fontSize: '10px', color: '#94a3b8' })
        .setOrigin(0.5)
        .setDepth(d);
    });
    this.makeButton('clear', this.cx + totalW / 2 + 56, y - 4, 'CLEAR', 0x475569, () => this.onClearBet(), 64, 28);
  }
  private drawActionButtons(): void {
    const y = this.actionBarY;
    const gap = Math.min(108, Math.max(86, this.scale.width / 7));
    const specs = [
      { key: 'deal', label: 'DEAL', color: 0x059669, x: this.cx - gap * 2 },
      { key: 'hit', label: 'HIT', color: 0x2563eb, x: this.cx - gap },
      { key: 'stand', label: 'STAND', color: 0xd97706, x: this.cx },
      { key: 'double', label: 'DOUBLE', color: 0x7c3aed, x: this.cx + gap },
      { key: 'insurance', label: 'INSURE', color: 0xdb2777, x: this.cx + gap * 2 },
    ];
    for (const s of specs) {
      this.makeButton(s.key, s.x, y, s.label, s.color, () => this.onAction(s.key), 92, 40);
    }
  }
  private makeButton(
    key: string,
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
    w = 92,
    h = 40
  ): void {
    const d = this.UI_D + 3;
    const bg = this.add.graphics().setDepth(d);
    const draw = (enabled: boolean) => {
      bg.clear();
      bg.fillStyle(0x000000, enabled ? 0.35 : 0.15);
      bg.fillRoundedRect(x - w / 2 + 1, y - h / 2 + 2, w, h, 10);
      bg.fillStyle(enabled ? color : 0x1e293b, enabled ? 1 : 0.55);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      bg.lineStyle(1.5, enabled ? 0xf0d060 : 0x334155, enabled ? 0.55 : 0.25);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    };
    draw(true);
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Orbitron',
        fontSize: label.length > 6 ? '11px' : '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(d + 1);
    const hit = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(d + 2);
    hit.on('pointerdown', () => {
      const btn = this.buttons.get(key);
      if (btn?.enabled && !this.animating) onClick();
    });
    this.buttons.set(key, { bg, text, hit, enabled: true, key });
    this.btnDraw.set(key, draw);
  }
  private setButtonEnabled(key: string, enabled: boolean): void {
    const btn = this.buttons.get(key);
    if (!btn) return;
    btn.enabled = enabled;
    btn.text.setAlpha(enabled ? 1 : 0.45);
    this.btnDraw.get(key)?.(enabled);
  }
  private drawHud(): void {
    const d = this.UI_D + 5;
    this.balanceText = this.add
      .text(16, this.chipTrayY - 2, '', { fontFamily: 'Inter', fontSize: '13px', color: '#e2e8f0', fontStyle: 'bold' })
      .setOrigin(0, 0.5)
      .setDepth(d);
    this.betText = this.add
      .text(this.cx, this.betCirclePos.y + 28, '', { fontFamily: 'Orbitron', fontSize: '13px', color: '#f0d060' })
      .setOrigin(0.5)
      .setDepth(20);
    this.messageText = this.add
      .text(this.cx, this.scale.height - 128, '', { fontFamily: 'Orbitron', fontSize: '16px', color: '#f8fafc' })
      .setOrigin(0.5)
      .setDepth(d);
    this.messageText.setShadow(0, 0, '#7c3aed', 10, true, true);
    this.playerTotalText = this.add
      .text(this.playerCardOrigin.x - 70, this.playerCardOrigin.y, '', {
        fontFamily: 'Orbitron',
        fontSize: '18px',
        color: '#f0d060',
        backgroundColor: '#0f172acc',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30);
    this.dealerTotalText = this.add
      .text(this.dealerCardOrigin.x - 70, this.dealerCardOrigin.y, '', {
        fontFamily: 'Orbitron',
        fontSize: '18px',
        color: '#f0d060',
        backgroundColor: '#0f172acc',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30);
    const wx = this.scale.width - 16;
    const wy = 56;
    this.add.graphics().setDepth(d).fillStyle(0x7c3aed, 0.92).fillRoundedRect(wx - 140, wy - 16, 140, 32, 8);
    this.walletText = this.add
      .text(wx - 70, wy, 'Connect Wallet', { fontFamily: 'Inter', fontSize: '12px', color: '#fff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(d + 1);
    this.add
      .zone(wx - 70, wy, 140, 32)
      .setInteractive({ useHandCursor: true })
      .setDepth(d + 2)
      .on('pointerdown', () => this.onConnectWallet());
  }
  private refreshUI(): void {
    const e = this.engine;
    this.balanceText.setText(`$${e.balance.toFixed(0)}  ·  ${e.bjCoins} BJ`);
    this.betText.setText(e.currentBet > 0 || e.player.bet > 0 ? `BET $${e.player.bet || e.currentBet}` : '');
    this.messageText.setText(e.message);
    this.statsText.setText(
      `Hands: ${e.handsPlayed}\nWin streak: ${e.winStreak}\nWon: $${e.totalWon}\nLost: $${e.totalLost}\nBJ coins: ${e.bjCoins}\nRules: Intl S17 3:2`
    );
    if (e.player.cards.length > 0) {
      this.playerTotalText.setText(e.displayTotal(e.player.cards)).setAlpha(1);
    } else this.playerTotalText.setAlpha(0);
    if (e.dealer.length > 0) {
      this.dealerTotalText.setText(e.displayTotal(e.dealer, !e.dealerHoleRevealed)).setAlpha(1);
    } else this.dealerTotalText.setAlpha(0);
    const betting = e.phase === 'betting' && !this.animating;
    const player = e.phase === 'playerTurn' && !this.animating;
    const insurance = e.phase === 'insurance' && !this.animating;
    const result = e.phase === 'result' && !this.animating;
    this.setButtonEnabled('deal', (betting && e.currentBet > 0) || result || insurance);
    this.setButtonEnabled('hit', player && e.canHit());
    this.setButtonEnabled('stand', player && e.canStand());
    this.setButtonEnabled('double', player && e.canDouble());
    this.setButtonEnabled('insurance', insurance && e.canInsurance());
    this.setButtonEnabled('clear', betting && e.currentBet > 0);
    const dealBtn = this.buttons.get('deal');
    if (dealBtn) dealBtn.text.setText(result ? 'NEW' : insurance ? 'SKIP' : 'DEAL');
    if (insurance) this.messageText.setText('Insurance? INSURE or SKIP');
  }
  private async onConnectWallet(): Promise<void> {
    this.walletText.setText('Connecting…');
    this.wallet = await connectWallet();
    if (this.wallet.connected && this.wallet.address) {
      this.walletText.setText(`${this.wallet.address.slice(0, 6)}…${this.wallet.address.slice(-4)}`);
      this.messageText.setText('Wallet OK · play still offline');
    } else {
      this.walletText.setText('Connect Wallet');
      this.messageText.setText(this.wallet.error ?? 'Wallet not connected');
    }
  }
  private onChipClick(value: number, source: Phaser.GameObjects.Image): void {
    if (this.animating || this.engine.phase !== 'betting') return;
    if (!this.engine.addChip(value)) {
      this.flashMessage('Not enough balance');
      return;
    }
    this.animateChipToBet(source.x, source.y, value);
    this.refreshUI();
  }
  private onClearBet(): void {
    if (this.animating || this.engine.phase !== 'betting') return;
    this.engine.clearBet();
    this.clearBetChips();
    this.refreshUI();
  }
  private clearBetChips(): void {
    for (const s of this.betChipSprites) s.destroy();
    this.betChipSprites = [];
  }
  private animateChipToBet(fromX: number, fromY: number, value: number): void {
    const chip = this.add.image(fromX, fromY, `chip-${value}`);
    chip.setDisplaySize(this.CHIP_UI, this.CHIP_UI).setDepth(50);
    const stack = this.betChipSprites.length;
    const tx = this.betCirclePos.x + (stack % 3) * 5 - 5;
    const ty = this.betCirclePos.y - stack * 3;
    this.betChipSprites.push(chip);
    this.tweens.add({
      targets: chip,
      x: tx,
      y: ty,
      displayWidth: this.CHIP_BET,
      displayHeight: this.CHIP_BET,
      duration: 320,
      ease: 'Cubic.easeOut',
    });
  }
  private async onAction(key: string): Promise<void> {
    if (this.animating) return;
    if (key === 'deal') {
      if (this.engine.phase === 'result') {
        this.resetTableVisuals();
        this.engine.newRound();
        this.refreshUI();
        return;
      }
      if (this.engine.phase === 'insurance') {
        this.engine.declineInsurance();
        if (this.engine.player.result) {
          await this.revealDealerHole();
          this.onRoundResult(this.engine.player.result);
        }
        this.refreshUI();
        return;
      }
      await this.runDeal();
    } else if (key === 'hit') await this.runHit();
    else if (key === 'stand') await this.runStand();
    else if (key === 'double') await this.runDouble();
    else if (key === 'insurance' && this.engine.takeInsurance()) {
      if (this.engine.player.result) {
        await this.revealDealerHole();
        this.onRoundResult(this.engine.player.result);
      }
      this.refreshUI();
    }
  }
  private resetTableVisuals(): void {
    for (const s of this.playerCardSprites) s.destroy();
    for (const s of this.dealerCardSprites) s.destroy();
    this.playerCardSprites = [];
    this.dealerCardSprites = [];
    this.clearBetChips();
    this.dealerSprite.setTexture('dealer-idle');
    this.playerTotalText.setAlpha(0);
    this.dealerTotalText.setAlpha(0);
  }
  private async runDeal(): Promise<void> {
    const dealt = this.engine.startDeal();
    if (!dealt) return;
    this.animating = true;
    this.dealerSprite.setTexture('dealer-deal');
    this.refreshUI();
    await this.flyCard(dealt.player[0], 'player', 0, false);
    await this.flyCard(dealt.dealer[0], 'dealer', 0, false);
    await this.flyCard(dealt.player[1], 'player', 1, false);
    await this.flyCard(dealt.dealer[1], 'dealer', 1, true);
    this.dealerSprite.setTexture('dealer-idle');
    const next = this.engine.afterDeal();
    this.animating = false;
    this.refreshUI();
    if (next === 'blackjack' || next === 'dealerBj') {
      await this.revealDealerHole();
      this.onRoundResult(this.engine.player.result);
      this.refreshUI();
    }
  }
  private drawHelpButton(): void {
    const d = this.UI_D + 5;
    const x = 48;
    const y = 56;
    this.add.graphics().setDepth(d).fillStyle(0x0f172a, 0.9).fillRoundedRect(x - 36, y - 16, 72, 32, 8);
    this.add
      .text(x, y, 'HELP', { fontFamily: 'Orbitron', fontSize: '12px', color: '#f0d060', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(d + 1);
    this.add
      .zone(x, y, 72, 32)
      .setInteractive({ useHandCursor: true })
      .setDepth(d + 2)
      .on('pointerdown', () => this.openHelp());
  }
  private openHelp(): void {
    if (this.helpOpen) return;
    this.helpOpen = true;
    const d = this.HELP_D;
    const w = Math.min(560, this.scale.width - 32);
    const h = Math.min(520, this.scale.height - 40);
    const container = this.add.container(0, 0).setDepth(d);
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.72);
    dim.fillRect(0, 0, this.scale.width, this.scale.height);
    dim.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height), Phaser.Geom.Rectangle.Contains);
    dim.on('pointerdown', () => this.closeHelp());
    const panel = this.add.graphics();
    panel.fillStyle(0x0f172a, 0.98);
    panel.fillRoundedRect(this.cx - w / 2, this.cy - h / 2, w, h, 16);
    panel.lineStyle(2, 0xc9a227, 0.85);
    panel.strokeRoundedRect(this.cx - w / 2, this.cy - h / 2, w, h, 16);
    const title = this.add
      .text(this.cx, this.cy - h / 2 + 18, 'Cara Bermain · International Rules', {
        fontFamily: 'Orbitron',
        fontSize: '16px',
        color: '#f0d060',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    const body = this.add
      .text(this.cx - w / 2 + 24, this.cy - h / 2 + 48, HOW_TO_PLAY_LINES.slice(1).join('\n'), {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
        color: '#e2e8f0',
        lineSpacing: 5,
        wordWrap: { width: w - 48 },
      })
      .setOrigin(0, 0);
    const closeLabel = this.add
      .text(this.cx + w / 2 - 28, this.cy - h / 2 + 18, '✕', { fontFamily: 'Inter', fontSize: '20px', color: '#f8fafc' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeLabel.on('pointerdown', () => this.closeHelp());
    container.add([dim, panel, title, body, closeLabel]);
    this.helpContainer = container;
  }
  private closeHelp(): void {
    this.helpOpen = false;
    this.helpContainer?.destroy(true);
    this.helpContainer = null;
  }
  /** Card display size — use scale-based sizing so flip tweens stay consistent in prod */
  private readonly CARD_SCALE = 0.85;

  private flyCard(card: CardData, who: 'player' | 'dealer', index: number, faceDown: boolean): Promise<void> {
    return new Promise((resolve) => {
      const origin = who === 'player' ? this.playerCardOrigin : this.dealerCardOrigin;
      const list = who === 'player' ? this.playerCardSprites : this.dealerCardSprites;
      const tx = origin.x + index * 32;
      const ty = origin.y;
      const faceKey = `card-${card.suit}-${card.rank}`;
      const startKey = this.textures.exists('card-back') ? 'card-back' : faceKey;
      const img = this.add.image(this.shoePos.x, this.shoePos.y, startKey);
      // Prefer setScale over setDisplaySize so scaleX flip works the same in dev + production
      img.setScale(this.CARD_SCALE).setDepth(20 + index).setAngle(-18);
      list.push(img);
      const midX = (this.shoePos.x + tx) / 2 + Phaser.Math.Between(-12, 12);
      const midY = Math.min(this.shoePos.y, ty) - 70;
      this.tweens.add({
        targets: img,
        x: midX,
        y: midY,
        angle: 8,
        duration: 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: img,
            x: tx,
            y: ty,
            angle: 0,
            duration: 240,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              // Soft land bounce (Y only — does not break flip scale)
              this.tweens.add({
                targets: img,
                y: ty - 6,
                duration: 70,
                yoyo: true,
                ease: 'Quad.easeOut',
                onComplete: () => {
                  if (!faceDown) this.flipCard(img, faceKey).then(resolve);
                  else resolve();
                },
              });
            },
          });
        },
      });
    });
  }

  private flipCard(img: Phaser.GameObjects.Image, faceKey: string): Promise<void> {
    return new Promise((resolve) => {
      const texKey = this.textures.exists(faceKey) ? faceKey : 'card-back';
      const s = this.CARD_SCALE;
      // Flip via scaleX only (never mix with setDisplaySize mid-tween)
      this.tweens.add({
        targets: img,
        scaleX: 0.02,
        duration: 110,
        ease: 'Sine.easeIn',
        onComplete: () => {
          img.setTexture(texKey);
          img.setScale(0.02, s);
          this.tweens.add({
            targets: img,
            scaleX: s,
            duration: 130,
            ease: 'Sine.easeOut',
            onComplete: () => {
              img.setScale(s);
              resolve();
            },
          });
        },
      });
    });
  }
  private async runHit(): Promise<void> {
    const card = this.engine.hit();
    if (!card) return;
    this.animating = true;
    this.dealerSprite.setTexture('dealer-deal');
    await this.flyCard(card, 'player', this.engine.player.cards.length - 1, false);
    this.dealerSprite.setTexture('dealer-idle');
    this.animating = false;
    if (this.engine.phase === 'result') {
      await this.revealDealerHole();
      this.onRoundResult(this.engine.player.result);
    } else if (this.engine.player.stood) {
      await this.runStand();
      return;
    }
    this.refreshUI();
  }
  private async runDouble(): Promise<void> {
    const card = this.engine.doubleDown();
    if (!card) return;
    this.animating = true;
    await this.flyCard(card, 'player', this.engine.player.cards.length - 1, false);
    this.animating = false;
    if (this.engine.phase === 'result') {
      await this.revealDealerHole();
      this.onRoundResult(this.engine.player.result);
      this.refreshUI();
    } else if (this.engine.phase === 'dealerTurn') await this.runDealer();
    else this.refreshUI();
  }
  private async runStand(): Promise<void> {
    this.engine.stand();
    await this.runDealer();
  }
  private async runDealer(): Promise<void> {
    this.animating = true;
    this.engine.phase = 'dealerTurn';
    this.refreshUI();
    await this.revealDealerHole();
    const drawn = this.engine.dealerPlay();
    const startIdx = this.engine.dealer.length - drawn.length;
    for (let i = 0; i < drawn.length; i++) {
      this.dealerSprite.setTexture('dealer-deal');
      await this.flyCard(drawn[i], 'dealer', startIdx + i, false);
      await this.delay(120);
    }
    this.dealerSprite.setTexture('dealer-idle');
    const result = this.engine.settleAfterDealer();
    this.animating = false;
    this.onRoundResult(result);
    this.refreshUI();
  }
  private revealDealerHole(): Promise<void> {
    return new Promise((resolve) => {
      this.engine.dealerHoleRevealed = true;
      const hole = this.dealerCardSprites[1];
      if (!hole || !this.engine.dealer[1]) {
        resolve();
        return;
      }
      const key = `card-${this.engine.dealer[1].suit}-${this.engine.dealer[1].rank}`;
      this.flipCard(hole, key).then(() => {
        this.refreshUI();
        resolve();
      });
    });
  }
  private onRoundResult(result: HandResult): void {
    if (result === 'win' || result === 'blackjack') {
      this.dealerSprite.setTexture('dealer-win');
      this.celebrate(result === 'blackjack');
      this.payoutChipsToPlayer();
    } else if (result === 'lose' || result === 'bust') {
      this.dealerSprite.setTexture('dealer-sad');
      this.collectChipsToDealer();
    } else if (result === 'push') {
      this.dealerSprite.setTexture('dealer-idle');
      this.payoutChipsToPlayer();
    }
  }
  private celebrate(blackjack: boolean): void {
    const particles = this.add.particles(this.cx, this.cy - 40, 'gold-particle', {
      speed: { min: 80, max: 220 },
      angle: { min: 240, max: 300 },
      scale: { start: 1.2, end: 0 },
      lifespan: 900,
      quantity: blackjack ? 8 : 4,
      frequency: 40,
      gravityY: 180,
      emitting: true,
    });
    this.time.delayedCall(blackjack ? 1200 : 700, () => particles.destroy());
    if (blackjack) this.flashMessage('★ BLACKJACK ★');
  }
  private payoutChipsToPlayer(): void {
    for (const chip of this.betChipSprites) {
      this.tweens.add({
        targets: chip,
        x: 40,
        y: this.scale.height - 28,
        scale: 0.3,
        alpha: 0,
        duration: 500,
        onComplete: () => chip.destroy(),
      });
    }
    this.betChipSprites = [];
  }
  private collectChipsToDealer(): void {
    for (const chip of this.betChipSprites) {
      this.tweens.add({
        targets: chip,
        x: this.cx,
        y: 120,
        scale: 0.3,
        alpha: 0,
        duration: 450,
        onComplete: () => chip.destroy(),
      });
    }
    this.betChipSprites = [];
  }
  private flashMessage(msg: string): void {
    this.messageText.setText(msg);
    this.tweens.add({ targets: this.messageText, scale: { from: 0.5, to: 1 }, duration: 280, ease: 'Back.easeOut' });
  }
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
