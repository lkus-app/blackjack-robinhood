import Phaser from 'phaser';
import { AssetFactory, CARD_WIDTH, CARD_HEIGHT } from '../game/AssetFactory';
import { chromaKeyTexture, splitChipSheet, processCardBack } from '../game/ChromaKey';
import { CHIP_VALUES } from '../game/types';
import { EMBEDDED_ASSETS } from '../assets/embeddedAssets';

/**
 * Boot: generate procedural textures, then overlay compressed embedded art.
 * Embedded assets travel with the JS bundle so local === Vercel visuals/animations.
 */
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
      .text(width / 2, height / 2 + 20, 'Loading casino…', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: '#8b9bb4',
      })
      .setOrigin(0.5);

    // Load compressed embedded art (same on localhost and Vercel)
    const keyMap: Record<string, string> = {
      'dealer-idle': 'raw-dealer-idle',
      'dealer-deal': 'raw-dealer-deal',
      'dealer-win': 'raw-dealer-win',
      'dealer-sad': 'raw-dealer-sad',
      'table-felt': 'raw-table',
      'card-back': 'raw-card-back',
      'chips-sheet': 'raw-chips',
      'ui-chrome': 'raw-ui-chrome',
    };
    for (const [name, dataUrl] of Object.entries(EMBEDDED_ASSETS)) {
      const key = keyMap[name] ?? `raw-${name}`;
      this.load.image(key, dataUrl);
    }

    this.load.on('loaderror', (file: { key?: string }) => {
      console.warn('Asset load error', file?.key);
    });
    this.load.on('progress', (v: number) => {
      this.statusText.setText(`Loading casino… ${Math.round(v * 100)}%`);
    });
  }

  create(): void {
    this.statusText.setText('Processing sprites…');

    // Always generate procedural card faces / fallbacks first
    AssetFactory.generate(this);

    // Overlay AI art when textures loaded
    this.applyEmbeddedArt();

    this.statusText.setText('Welcome, crypto adventurer');
    this.time.delayedCall(280, () => this.scene.start('Game'));
  }

  private applyEmbeddedArt(): void {
    if (this.textures.exists('raw-dealer-idle')) {
      chromaKeyTexture(this, 'raw-dealer-idle', 'dealer-idle');
    }
    if (this.textures.exists('raw-dealer-deal')) {
      chromaKeyTexture(this, 'raw-dealer-deal', 'dealer-deal');
    }
    if (this.textures.exists('raw-dealer-win')) {
      chromaKeyTexture(this, 'raw-dealer-win', 'dealer-win');
    }
    if (this.textures.exists('raw-dealer-sad')) {
      chromaKeyTexture(this, 'raw-dealer-sad', 'dealer-sad');
    }

    if (this.textures.exists('raw-table')) {
      if (this.textures.exists('felt-table')) this.textures.remove('felt-table');
      const img = this.textures.get('raw-table').getSourceImage() as HTMLImageElement;
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      this.textures.addCanvas('felt-table', c);
    }

    if (this.textures.exists('raw-card-back')) {
      const ok = processCardBack(this, 'raw-card-back', 'card-back', CARD_WIDTH, CARD_HEIGHT);
      if (!ok) AssetFactory.makeCardBack(this);
    } else {
      AssetFactory.makeCardBack(this);
    }

    if (this.textures.exists('raw-chips')) {
      splitChipSheet(
        this,
        'raw-chips',
        CHIP_VALUES.map((c) => c.value)
      );
    }

    if (this.textures.exists('raw-ui-chrome')) {
      chromaKeyTexture(this, 'raw-ui-chrome', 'ui-chrome');
    }
  }
}
