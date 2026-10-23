import type { Caravan } from '../engine/Caravan';

import caravanUrl from '../assets/npcs/merchant_caravan.png';

/**
 * Draws the merchant caravan (a pack camel loaded with trade goods) that
 * occasionally crosses the valley.  The sprite is only a single image, so the
 * walking motion is faked with a gentle bob, a lean and a dust trail.
 */
export class CaravanRenderer {
  private static sprite: HTMLImageElement | null = null;
  private static initialized = false;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;
    const img = new Image();
    img.src = caravanUrl;
    this.sprite = img;
  }

  /** Returns the visual top of the caravan relative to its ground position. */
  public static draw(
    ctx: CanvasRenderingContext2D,
    caravan: Caravan,
    globalTime: number
  ): number | null {
    this.init();
    const img = this.sprite;
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    if (!caravan.active) return null;

    const scale = 74 / img.naturalHeight;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const groundY = 4;
    const bob = -Math.abs(Math.sin(globalTime * 0.006)) * 1.6;
    const lean = caravan.facing === 1 ? 0.018 : -0.018;
    const topOffset = groundY - drawH;

    // Drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(38, 32, 27, 0.24)';
    ctx.beginPath();
    ctx.ellipse(caravan.x, caravan.y + groundY, drawW * 0.36, Math.max(4, drawH * 0.07), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // A little kicked-up dust behind the caravan.
    ctx.save();
    ctx.fillStyle = 'rgba(226, 214, 176, 0.45)';
    for (let i = 0; i < 3; i++) {
      const t = (globalTime * 0.0016 + i * 0.33) % 1;
      const x = caravan.x - caravan.facing * (drawW * 0.35 + t * 16);
      const y = caravan.y - t * 6;
      ctx.globalAlpha = 0.4 * (1 - t);
      ctx.beginPath();
      ctx.arc(x, y, 2.6 - i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(caravan.x, caravan.y + groundY + bob);
    ctx.rotate(lean);
    if (caravan.facing === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();

    return topOffset;
  }
}
