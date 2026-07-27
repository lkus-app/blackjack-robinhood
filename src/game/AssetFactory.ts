import Phaser from 'phaser';
import { Suit, Rank, isRed, suitSymbol, CHIP_VALUES, SUITS, RANKS } from './types';

const CARD_W = 100;
const CARD_H = 140;

/** Procedural textures via Canvas 2D (reliable — no RenderTexture black-card bugs) */
export class AssetFactory {
  static generate(scene: Phaser.Scene): void {
    this.makeCardBack(scene);
    this.makeAllFaces(scene);
    this.makeFelt(scene);
    this.makeChips(scene);
    this.makeParticle(scene);
    this.makeDealer(scene);
    this.makeTableDecor(scene);
  }

  private static addCanvasTexture(
    scene: Phaser.Scene,
    key: string,
    canvas: HTMLCanvasElement
  ): void {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    scene.textures.addCanvas(key, canvas);
  }

  private static roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  static makeCardBack(scene: Phaser.Scene): void {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d')!;

    // Cream border / card body
    this.roundedRect(ctx, 0, 0, CARD_W, CARD_H, 10);
    ctx.fillStyle = '#f8f6f0';
    ctx.fill();

    // Navy face
    this.roundedRect(ctx, 5, 5, CARD_W - 10, CARD_H - 10, 7);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();

    // Gold border
    this.roundedRect(ctx, 7, 7, CARD_W - 14, CARD_H - 14, 6);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner panel
    this.roundedRect(ctx, 12, 12, CARD_W - 24, CARD_H - 24, 4);
    ctx.fillStyle = '#16213e';
    ctx.fill();

    // Diamond lattice
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 7; j++) {
        const cx = 22 + i * 14;
        const cy = 24 + j * 14;
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Center monogram
    ctx.beginPath();
    ctx.arc(CARD_W / 2, CARD_H / 2, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a227';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(CARD_W / 2, CARD_H / 2, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BJ', CARD_W / 2, CARD_H / 2 + 1);

    this.addCanvasTexture(scene, 'card-back', canvas);
  }

  private static makeAllFaces(scene: Phaser.Scene): void {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.makeCardFace(scene, suit, rank);
      }
    }
  }

  private static makeCardFace(scene: Phaser.Scene, suit: Suit, rank: Rank): void {
    const key = `card-${suit}-${rank}`;
    const red = isRed(suit);
    const ink = red ? '#c41e3a' : '#1a1a1a';
    const sym = suitSymbol(suit);

    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d')!;

    // White card body
    this.roundedRect(ctx, 0, 0, CARD_W, CARD_H, 10);
    ctx.fillStyle = '#f8f6f0';
    ctx.fill();
    this.roundedRect(ctx, 1, 1, CARD_W - 2, CARD_H - 2, 9);
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top-left rank + suit
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${rank === '10' ? 16 : 20}px Georgia, "Times New Roman", serif`;
    ctx.fillText(rank, 8, 6);
    ctx.font = '16px Georgia, "Times New Roman", serif';
    ctx.fillText(sym, 8, 28);

    // Center suit
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '48px Georgia, "Times New Roman", serif';
    ctx.fillText(sym, CARD_W / 2, CARD_H / 2 + 4);

    // Bottom-right rank + suit (upright for readability)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.font = `bold ${rank === '10' ? 16 : 20}px Georgia, "Times New Roman", serif`;
    ctx.fillText(rank, CARD_W - 8, CARD_H - 6);
    ctx.font = '16px Georgia, "Times New Roman", serif';
    ctx.fillText(sym, CARD_W - 8, CARD_H - 28);

    this.addCanvasTexture(scene, key, canvas);
  }

  private static makeChips(scene: Phaser.Scene): void {
    for (const chip of CHIP_VALUES) {
      const size = 56;
      const g = scene.make.graphics({ x: 0, y: 0 });
      // Shadow
      g.fillStyle(0x000000, 0.35);
      g.fillCircle(size / 2 + 2, size / 2 + 3, size / 2 - 2);
      // Outer rim
      g.fillStyle(chip.rim, 1);
      g.fillCircle(size / 2, size / 2, size / 2 - 1);
      // Body
      g.fillStyle(chip.color, 1);
      g.fillCircle(size / 2, size / 2, size / 2 - 5);
      // Edge dashes
      g.lineStyle(3, 0xffffff, chip.value === 1 ? 0.5 : 0.85);
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const r1 = size / 2 - 4;
        const r0 = size / 2 - 10;
        g.beginPath();
        g.moveTo(size / 2 + Math.cos(ang) * r0, size / 2 + Math.sin(ang) * r0);
        g.lineTo(size / 2 + Math.cos(ang) * r1, size / 2 + Math.sin(ang) * r1);
        g.strokePath();
      }
      // Inner ring
      g.lineStyle(2, 0xffffff, 0.4);
      g.strokeCircle(size / 2, size / 2, size / 2 - 14);
      g.generateTexture(`chip-${chip.value}`, size, size);
      g.destroy();
    }
  }

  private static makeFelt(scene: Phaser.Scene): void {
    const w = 900;
    const h = 520;
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Base green
    g.fillStyle(0x0d5c3d, 1);
    g.fillEllipse(w / 2, h / 2, w, h);
    // Inner darker
    g.fillStyle(0x0a4a32, 1);
    g.fillEllipse(w / 2, h / 2, w - 40, h - 40);
    // Subtle grain via dots
    g.fillStyle(0x0f6b47, 0.15);
    for (let i = 0; i < 200; i++) {
      const x = 40 + Math.random() * (w - 80);
      const y = 40 + Math.random() * (h - 80);
      // Keep inside ellipse roughly
      const nx = (x - w / 2) / (w / 2);
      const ny = (y - h / 2) / (h / 2);
      if (nx * nx + ny * ny < 0.85) {
        g.fillCircle(x, y, 1 + Math.random() * 2);
      }
    }
    // Yellow rail outline
    g.lineStyle(4, 0xd4af37, 0.9);
    g.strokeEllipse(w / 2, h / 2, w - 16, h - 16);
    g.lineStyle(2, 0xf0d060, 0.5);
    g.strokeEllipse(w / 2, h / 2, w - 28, h - 28);

    g.generateTexture('felt-table', w, h);
    g.destroy();
  }

  private static makeTableDecor(scene: Phaser.Scene): void {
    // Betting circle
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.lineStyle(3, 0xd4af37, 0.95);
    g.strokeCircle(50, 50, 46);
    g.lineStyle(1.5, 0xf0d060, 0.5);
    g.strokeCircle(50, 50, 40);
    g.generateTexture('bet-circle', 100, 100);
    g.destroy();

    // Soft glow particle
    const p = scene.make.graphics({ x: 0, y: 0 });
    p.fillStyle(0xffd700, 1);
    p.fillCircle(8, 8, 8);
    p.generateTexture('spark', 16, 16);
    p.destroy();
  }

  private static makeParticle(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffe566, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('gold-particle', 8, 8);
    g.destroy();

    const c = scene.make.graphics({ x: 0, y: 0 });
    c.fillStyle(0xe63946, 1);
    c.fillCircle(6, 6, 6);
    c.generateTexture('chip-particle', 12, 12);
    c.destroy();
  }

  private static makeDealer(scene: Phaser.Scene): void {
    // Stylized female dealer — vector portrait suitable for 2D game
    const w = 220;
    const h = 320;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Soft glow behind
    g.fillStyle(0x7c3aed, 0.12);
    g.fillEllipse(w / 2, h / 2 + 20, 180, 280);

    // Shoulders / torso — black vest over white shirt
    g.fillStyle(0xf5f5f5, 1);
    g.fillRoundedRect(50, 200, 120, 110, 8);
    // Vest
    g.fillStyle(0x1a1a1a, 1);
    g.fillTriangle(w / 2, 200, 55, 310, 165, 310);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(w / 2 - 8, 210, 16, 90);
    // Shirt collar
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(w / 2, 200, w / 2 - 28, 230, w / 2, 220);
    g.fillTriangle(w / 2, 200, w / 2 + 28, 230, w / 2, 220);
    // Bow tie
    g.fillStyle(0xc9a227, 1);
    g.fillTriangle(w / 2 - 22, 218, w / 2, 212, w / 2, 228);
    g.fillTriangle(w / 2 + 22, 218, w / 2, 212, w / 2, 228);
    g.fillCircle(w / 2, 220, 5);

    // Neck
    g.fillStyle(0xf1c27d, 1);
    g.fillRect(w / 2 - 16, 168, 32, 36);

    // Hair back
    g.fillStyle(0x1a0a0a, 1);
    g.fillEllipse(w / 2, 130, 130, 150);

    // Face
    g.fillStyle(0xf3c98b, 1);
    g.fillEllipse(w / 2, 130, 88, 105);

    // Ears
    g.fillStyle(0xe8b87a, 1);
    g.fillEllipse(w / 2 - 46, 135, 14, 20);
    g.fillEllipse(w / 2 + 46, 135, 14, 20);

    // Hair front / bangs
    g.fillStyle(0x1a0a0a, 1);
    g.fillEllipse(w / 2, 88, 100, 55);
    g.fillEllipse(w / 2 - 40, 100, 40, 50);
    g.fillEllipse(w / 2 + 40, 100, 40, 50);
    // Side locks
    g.fillEllipse(w / 2 - 52, 160, 28, 70);
    g.fillEllipse(w / 2 + 52, 160, 28, 70);

    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(w / 2 - 20, 128, 16, 12);
    g.fillEllipse(w / 2 + 20, 128, 16, 12);
    g.fillStyle(0x3d2914, 1);
    g.fillCircle(w / 2 - 18, 128, 6);
    g.fillCircle(w / 2 + 18, 128, 6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(w / 2 - 16, 125, 2);
    g.fillCircle(w / 2 + 20, 125, 2);

    // Brows
    g.lineStyle(3, 0x1a0a0a, 1);
    g.beginPath();
    g.moveTo(w / 2 - 32, 114);
    g.lineTo(w / 2 - 8, 112);
    g.strokePath();
    g.beginPath();
    g.moveTo(w / 2 + 8, 112);
    g.lineTo(w / 2 + 32, 114);
    g.strokePath();

    // Nose
    g.lineStyle(2, 0xd4a574, 0.8);
    g.beginPath();
    g.moveTo(w / 2, 130);
    g.lineTo(w / 2 + 4, 148);
    g.lineTo(w / 2 - 2, 150);
    g.strokePath();

    // Smile (friendly professional)
    g.lineStyle(2.5, 0xc47a6a, 1);
    g.beginPath();
    g.arc(w / 2, 158, 16, 0.15, Math.PI - 0.15, false);
    g.strokePath();

    // Blush
    g.fillStyle(0xf5a9a9, 0.35);
    g.fillEllipse(w / 2 - 32, 148, 14, 8);
    g.fillEllipse(w / 2 + 32, 148, 14, 8);

    // Name badge
    g.fillStyle(0xc9a227, 1);
    g.fillRoundedRect(w / 2 + 18, 250, 42, 16, 3);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(w / 2 + 20, 252, 38, 12, 2);

    g.generateTexture('dealer-idle', w, h);
    g.destroy();

    // Smile variant (bigger smile for win)
    this.makeDealerExpression(scene, 'dealer-win', true, false);
    this.makeDealerExpression(scene, 'dealer-sad', false, true);
    this.makeDealerExpression(scene, 'dealer-deal', false, false, true);
  }

  private static makeDealerExpression(
    scene: Phaser.Scene,
    key: string,
    bigSmile: boolean,
    sad: boolean,
    dealPose = false
  ): void {
    // Reuse base by redrawing simplified variants
    const w = 220;
    const h = 320;
    const g = scene.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x7c3aed, 0.12);
    g.fillEllipse(w / 2, h / 2 + 20, 180, 280);

    g.fillStyle(0xf5f5f5, 1);
    g.fillRoundedRect(50, 200, 120, 110, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillTriangle(w / 2, 200, 55, 310, 165, 310);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(w / 2 - 8, 210, 16, 90);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(w / 2, 200, w / 2 - 28, 230, w / 2, 220);
    g.fillTriangle(w / 2, 200, w / 2 + 28, 230, w / 2, 220);
    g.fillStyle(0xc9a227, 1);
    g.fillTriangle(w / 2 - 22, 218, w / 2, 212, w / 2, 228);
    g.fillTriangle(w / 2 + 22, 218, w / 2, 212, w / 2, 228);
    g.fillCircle(w / 2, 220, 5);

    g.fillStyle(0xf1c27d, 1);
    g.fillRect(w / 2 - 16, 168, 32, 36);

    g.fillStyle(0x1a0a0a, 1);
    g.fillEllipse(w / 2, 130, 130, 150);

    g.fillStyle(0xf3c98b, 1);
    g.fillEllipse(w / 2, 130, 88, 105);

    g.fillStyle(0xe8b87a, 1);
    g.fillEllipse(w / 2 - 46, 135, 14, 20);
    g.fillEllipse(w / 2 + 46, 135, 14, 20);

    g.fillStyle(0x1a0a0a, 1);
    g.fillEllipse(w / 2, 88, 100, 55);
    g.fillEllipse(w / 2 - 40, 100, 40, 50);
    g.fillEllipse(w / 2 + 40, 100, 40, 50);
    g.fillEllipse(w / 2 - 52, 160, 28, 70);
    g.fillEllipse(w / 2 + 52, 160, 28, 70);

    g.fillStyle(0xffffff, 1);
    g.fillEllipse(w / 2 - 20, 128, 16, 12);
    g.fillEllipse(w / 2 + 20, 128, 16, 12);
    g.fillStyle(0x3d2914, 1);
    g.fillCircle(w / 2 - 18, 128 + (sad ? 2 : 0), 6);
    g.fillCircle(w / 2 + 18, 128 + (sad ? 2 : 0), 6);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(w / 2 - 16, 125, 2);
    g.fillCircle(w / 2 + 20, 125, 2);

    g.lineStyle(3, 0x1a0a0a, 1);
    if (sad) {
      g.beginPath();
      g.moveTo(w / 2 - 32, 112);
      g.lineTo(w / 2 - 8, 116);
      g.strokePath();
      g.beginPath();
      g.moveTo(w / 2 + 8, 116);
      g.lineTo(w / 2 + 32, 112);
      g.strokePath();
    } else {
      g.beginPath();
      g.moveTo(w / 2 - 32, 114);
      g.lineTo(w / 2 - 8, 112);
      g.strokePath();
      g.beginPath();
      g.moveTo(w / 2 + 8, 112);
      g.lineTo(w / 2 + 32, 114);
      g.strokePath();
    }

    g.lineStyle(2, 0xd4a574, 0.8);
    g.beginPath();
    g.moveTo(w / 2, 130);
    g.lineTo(w / 2 + 4, 148);
    g.lineTo(w / 2 - 2, 150);
    g.strokePath();

    g.lineStyle(2.5, 0xc47a6a, 1);
    g.beginPath();
    if (sad) {
      g.arc(w / 2, 175, 14, Math.PI + 0.2, -0.2, false);
    } else if (bigSmile) {
      g.arc(w / 2, 155, 20, 0.1, Math.PI - 0.1, false);
      g.lineStyle(1.5, 0xffffff, 0.6);
      g.beginPath();
      g.arc(w / 2, 158, 12, 0.2, Math.PI - 0.2, false);
    } else {
      g.arc(w / 2, 158, 16, 0.15, Math.PI - 0.15, false);
    }
    g.strokePath();

    g.fillStyle(0xf5a9a9, bigSmile ? 0.45 : 0.35);
    g.fillEllipse(w / 2 - 32, 148, 14, 8);
    g.fillEllipse(w / 2 + 32, 148, 14, 8);

    if (dealPose) {
      // Raised dealing arm hint
      g.fillStyle(0xf1c27d, 1);
      g.fillRoundedRect(155, 210, 50, 16, 8);
      g.fillCircle(205, 218, 10);
    }

    g.fillStyle(0xc9a227, 1);
    g.fillRoundedRect(w / 2 + 18, 250, 42, 16, 3);

    g.generateTexture(key, w, h);
    g.destroy();
  }
}

export const CARD_WIDTH = CARD_W;
export const CARD_HEIGHT = CARD_H;
