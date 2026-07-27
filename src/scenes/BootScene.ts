import Phaser from 'phaser';
import { AssetFactory, CARD_WIDTH, CARD_HEIGHT } from '../game/AssetFactory';
import { chromaKeyTexture, splitChipSheet, processCardBack } from '../game/ChromaKey';
import { CHIP_VALUES } from '../game/types';

export class BootScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('Boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0e17, 0x0a0e17, 0x12182b, 0x1a1030, 1);
    bg.fillRect(0, 0, width, height);

    this.add
      .text(width / 2, height / 2 - 40, 'BlackJack', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '48px',
        color: '#e8d5a3',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#7c3aed', 18, true, true);

    this.statusText = this.add
      .text(width / 2, height / 2 + 20, 'Loading rendered assets…', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: '#8b9bb4',
      })
      .setOrigin(0.5);

    // AI-rendered art (optional — game falls back to procedural if missing)
    const optional = [
      ['raw-dealer-idle', 'assets/dealer-idle.jpg'],
      ['raw-dealer-deal', 'assets/dealer-deal.jpg'],
      ['raw-dealer-win', 'assets/dealer-win.jpg'],
      ['raw-dealer-sad', 'assets/dealer-sad.jpg'],
      ['raw-table', 'assets/table-felt.jpg'],
      ['raw-card-back', 'assets/card-back.jpg'],
      ['raw-chips', 'assets/chips-sheet.jpg'],
      ['raw-ui-chrome', 'assets/ui-chrome.jpg'],
    ] as const;
    for (const [key, url] of optional) {
      this.load.image(key, url);
    }

    this.load.on('loaderror', () => {
      // Missing art is OK — AssetFactory procedural textures cover gameplay
    });
    this.load.on('progress', (v: number) => {
      this.statusText.setText(`Loading casino… ${Math.round(v * 100)}%`);
    });
  }

  create(): void {
    this.statusText.setText('Processing sprites…');

    // Procedural faces / particles always available as fallback
    AssetFactory.generate(this);

    // Replace dealer textures with chroma-keyed renders
    chromaKeyTexture(this, 'raw-dealer-idle', 'dealer-idle');
    chromaKeyTexture(this, 'raw-dealer-deal', 'dealer-deal');
    chromaKeyTexture(this, 'raw-dealer-win', 'dealer-win');
    chromaKeyTexture(this, 'raw-dealer-sad', 'dealer-sad');

    // Table (no chroma — dark BG is fine)
    if (this.textures.exists('raw-table')) {
      if (this.textures.exists('felt-table')) this.textures.remove('felt-table');
      // Clone as felt-table key
      const img = this.textures.get('raw-table').getSourceImage() as HTMLImageElement;
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      this.textures.addCanvas('felt-table', c);
    }

    // Optional AI card-back (keeps procedural if render keys out to black)
    const okBack = processCardBack(this, 'raw-card-back', 'card-back', CARD_WIDTH, CARD_HEIGHT);
    if (!okBack) {
      // Ensure solid procedural back remains
      AssetFactory.makeCardBack(this);
    }

    // Chips from sheet (overwrite procedural)
    splitChipSheet(
      this,
      'raw-chips',
      CHIP_VALUES.map((c) => c.value)
    );

    // Optional UI chrome (reference / future 9-slice)
    chromaKeyTexture(this, 'raw-ui-chrome', 'ui-chrome');

    this.statusText.setText('Welcome, crypto adventurer');
    this.time.delayedCall(350, () => this.scene.start('Game'));
  }
}
