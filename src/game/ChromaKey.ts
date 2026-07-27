import Phaser from 'phaser';

/**
 * Convert a loaded opaque image into a transparent texture by keying out
 * magenta / hot-pink / purple chroma backgrounds used by Imagine assets.
 */
export function chromaKeyTexture(
  scene: Phaser.Scene,
  sourceKey: string,
  destKey: string,
  options?: {
    /** Drop pixels whose chroma is close to magenta/pink/purple key */
    threshold?: number;
    /** Also strip near-black edges if needed */
    cropTransparent?: boolean;
  }
): boolean {
  const threshold = options?.threshold ?? 48;
  if (!scene.textures.exists(sourceKey)) return false;

  const tex = scene.textures.get(sourceKey);
  const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  if (!src || !('width' in src)) return false;

  const w = src.width;
  const h = src.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.drawImage(src as CanvasImageSource, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    // Hot magenta / pink key (FF00FF-ish)
    const magentaScore = Math.min(r, b) - g;
    const isMagenta = r > 180 && b > 150 && g < 140 && magentaScore > 40;

    // Deeper purple key (dealer-win variant background)
    const isPurple =
      r > 140 &&
      b > 160 &&
      g < 120 &&
      b > r * 0.85 &&
      r - g > 30 &&
      b - g > 50;

    // Near-edge soft key: high R+B, low G
    const isSoftPink =
      r > 200 &&
      b > 160 &&
      g < 160 &&
      Math.abs(r - b) < threshold &&
      r - g > 50;

    if (isMagenta || isPurple || isSoftPink) {
      d[i + 3] = 0;
    } else if (r > 220 && g > 80 && g < 180 && b > 180) {
      // Feather semi-transparent fringe
      const fringe = Math.min(r, b) - g;
      if (fringe > 20) {
        d[i + 3] = Math.max(0, 255 - fringe * 3);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  if (scene.textures.exists(destKey)) {
    scene.textures.remove(destKey);
  }
  scene.textures.addCanvas(destKey, canvas);
  return true;
}

function isChipChroma(r: number, g: number, b: number): boolean {
  // Magenta / hot pink key + soft glow fringe
  if (r > 160 && b > 130 && g < 170 && Math.min(r, b) - g > 25) return true;
  if (r > 200 && g < 180 && b > 160 && r + b - 2 * g > 80) return true;
  // Pale pink glow halo around chips
  if (r > 210 && g > 100 && g < 200 && b > 170 && Math.abs(r - b) < 60 && r - g > 20) return true;
  return false;
}

/** Tight-crop opaque content and normalize to a small square texture. */
function tightChipCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  outSize = 64
): HTMLCanvasElement | null {
  const tmp = document.createElement('canvas');
  tmp.width = sw;
  tmp.height = sh;
  const tctx = tmp.getContext('2d');
  if (!tctx) return null;
  tctx.drawImage(source as CanvasImageSource, sx, sy, sw, sh, 0, 0, sw, sh);

  const imageData = tctx.getImageData(0, 0, sw, sh);
  const d = imageData.data;
  let minX = sw;
  let minY = sh;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const p = (y * sw + x) * 4;
      const r = d[p];
      const g = d[p + 1];
      const b = d[p + 2];
      if (isChipChroma(r, g, b)) {
        d[p + 3] = 0;
        continue;
      }
      // Kill near-white soft glow (very bright pinkish)
      if (r > 230 && g > 160 && b > 200 && Math.min(r, b) > g) {
        d[p + 3] = 0;
        continue;
      }
      if (d[p + 3] > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  tctx.putImageData(imageData, 0, 0);

  if (maxX <= minX || maxY <= minY) return null;

  // Small padding so edge isn't clipped
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(sw - 1, maxX + pad);
  maxY = Math.min(sh - 1, maxY + pad);

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const side = Math.max(bw, bh);

  const out = document.createElement('canvas');
  out.width = outSize;
  out.height = outSize;
  const octx = out.getContext('2d');
  if (!octx) return null;

  // Draw chip centered, no background fill
  const scale = (outSize * 0.92) / side;
  const dw = bw * scale;
  const dh = bh * scale;
  const dx = (outSize - dw) / 2;
  const dy = (outSize - dh) / 2;
  octx.clearRect(0, 0, outSize, outSize);
  octx.drawImage(tmp, minX, minY, bw, bh, dx, dy, dw, dh);
  return out;
}

/** Split chips sheet (4 chips in a row) into tight, small individual textures. */
export function splitChipSheet(
  scene: Phaser.Scene,
  sheetKey: string,
  values: number[]
): void {
  if (!scene.textures.exists(sheetKey)) return;
  const tex = scene.textures.get(sheetKey);
  const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  if (!src || !('width' in src)) return;

  const w = src.width;
  const h = src.height;
  const n = values.length;
  const cellW = Math.floor(w / n);

  for (let i = 0; i < n; i++) {
    const canvas = tightChipCanvas(src, i * cellW, 0, cellW, h, 64);
    if (!canvas) continue;
    const key = `chip-${values[i]}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }
}

/**
 * Optional AI card-back. Only replaces procedural texture if the result
 * has enough non-transparent, non-black pixels (avoids blank black cards).
 */
export function processCardBack(
  scene: Phaser.Scene,
  sourceKey: string,
  destKey: string,
  width: number,
  height: number
): boolean {
  if (!scene.textures.exists(sourceKey)) return false;
  chromaKeyTexture(scene, sourceKey, `${destKey}-raw`);
  if (!scene.textures.exists(`${destKey}-raw`)) return false;

  const tex = scene.textures.get(`${destKey}-raw`);
  const src = tex.getSourceImage() as HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Opaque cream base so transparent holes never show as black
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(width / src.width, height / src.height) * 0.92;
  const dw = src.width * scale;
  const dh = src.height * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;
  ctx.drawImage(src, dx, dy, dw, dh);

  // Quality gate: enough visible non-black pixels
  const sample = ctx.getImageData(0, 0, width, height).data;
  let visible = 0;
  for (let i = 0; i < sample.length; i += 16) {
    const r = sample[i];
    const g = sample[i + 1];
    const b = sample[i + 2];
    const a = sample[i + 3];
    if (a > 200 && r + g + b > 40) visible++;
  }
  if (visible < 80) {
    // Keep procedural card-back
    return false;
  }

  if (scene.textures.exists(destKey)) scene.textures.remove(destKey);
  scene.textures.addCanvas(destKey, canvas);
  return true;
}
