import type { Building } from '../types/simulation';

import residentialUrl from '../assets/buildings/residential.png';
import cookhouseUrl from '../assets/buildings/cookhouse.png';
import storageUrl from '../assets/buildings/storage.png';
import townhallUrl from '../assets/buildings/townhall.png';

interface BuildingSpriteDef {
  img: HTMLImageElement;
  /** Multiplier applied to the building footprint width. */
  widthScale: number;
}

type SpriteKey = 'residential' | 'cookhouse' | 'storage' | 'townhall';

const SPRITE_SOURCES: Record<SpriteKey, { url: string; widthScale: number }> = {
  residential: { url: residentialUrl, widthScale: 1.3 },
  cookhouse: { url: cookhouseUrl, widthScale: 1.2 },
  storage: { url: storageUrl, widthScale: 1.45 },
  townhall: { url: townhallUrl, widthScale: 1.18 }
};

export class BuildingRenderer {
  private static sprites: Partial<Record<SpriteKey, BuildingSpriteDef>> = {};
  private static initialized = false;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    for (const key of Object.keys(SPRITE_SOURCES) as SpriteKey[]) {
      const source = SPRITE_SOURCES[key];
      const img = new Image();
      img.src = source.url;
      this.sprites[key] = {
        img,
        widthScale: source.widthScale
      };
    }
  }

  private static getSpriteKey(b: Building): SpriteKey | null {
    switch (b.type) {
      case 'cabin':
        return 'residential';
      case 'hearth':
        return 'cookhouse';
      case 'storage':
        return 'storage';
      case 'healer_hut':
        return 'townhall';
      default:
        // Lumber camp and pier keep their bespoke procedural artwork.
        return null;
    }
  }

  /**
   * Draws an illustrated building sprite. Returns false when the building type
   * has no sprite (or the image has not loaded yet) so the caller can fall back
   * to the original hand-drawn architecture.
   */
  public static draw(ctx: CanvasRenderingContext2D, b: Building): boolean {
    if (!this.initialized) this.init();

    const key = this.getSpriteKey(b);
    if (!key) return false;

    const sprite = this.sprites[key];
    if (!sprite || !sprite.img.complete || sprite.img.naturalWidth === 0) return false;

    const drawW = b.width * sprite.widthScale;
    const drawH = drawW * (sprite.img.naturalHeight / sprite.img.naturalWidth);
    const drawX = b.x + b.width / 2 - drawW / 2;
    // Rest the illustrated ground shadow on the bottom of the footprint.
    const drawY = b.y + b.height - drawH + 6;

    ctx.save();
    // A soft contact shadow keeps the sprite grounded if the asset's baked-in
    // shadow lands on a road or dirt patch.
    ctx.fillStyle = 'rgba(38, 30, 20, 0.18)';
    ctx.beginPath();
    ctx.ellipse(b.x + b.width / 2, b.y + b.height - 2, drawW * 0.33, drawW * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(sprite.img, drawX, drawY, drawW, drawH);
    ctx.restore();

    return true;
  }
}
