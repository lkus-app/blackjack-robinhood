import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0e17',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [BootScene, GameScene],
  // forceSetTimeOut: more consistent timing between local Chrome and Vercel CDN / mobile
  fps: {
    target: 60,
    forceSetTimeOut: true,
    smoothStep: true,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
    powerPreference: 'high-performance',
    transparent: false,
  },
  // Avoid audio-context resume delays that can hitch first animations
  audio: {
    noAudio: true,
  },
  banner: false,
  disableContextMenu: true,
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
