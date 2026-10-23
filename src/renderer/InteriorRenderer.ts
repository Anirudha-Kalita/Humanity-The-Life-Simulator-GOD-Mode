import type { Building } from '../types/simulation';

import residentialUrl from '../assets/interiors/residential.png';
import cookhouseUrl from '../assets/interiors/cookhouse.png';
import storageUrl from '../assets/interiors/storage.png';
import townhallUrl from '../assets/interiors/townhall.png';

export type InteriorKey = 'residential' | 'cookhouse' | 'storage' | 'townhall';

interface InteriorSpriteDef {
  img: HTMLImageElement;
}

const INTERIOR_SOURCES: Record<InteriorKey, string> = {
  residential: residentialUrl,
  cookhouse: cookhouseUrl,
  storage: storageUrl,
  townhall: townhallUrl
};

export interface InteriorLayout {
  key: InteriorKey;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

const INTERIOR_WORLD_WIDTH = 330;

export class InteriorRenderer {
  private static sprites: Partial<Record<InteriorKey, InteriorSpriteDef>> = {};
  private static initialized = false;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    for (const key of Object.keys(INTERIOR_SOURCES) as InteriorKey[]) {
      const img = new Image();
      img.src = INTERIOR_SOURCES[key];
      this.sprites[key] = { img };
    }
  }

  public static getInteriorKey(b: Building): InteriorKey | null {
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
        return null;
    }
  }

  public static getLayout(b: Building, centerX?: number, centerY?: number): InteriorLayout | null {
    if (!this.initialized) this.init();

    const key = this.getInteriorKey(b);
    if (!key) return null;

    const sprite = this.sprites[key];
    if (!sprite || !sprite.img.complete || sprite.img.naturalWidth === 0) return null;

    const width = INTERIOR_WORLD_WIDTH;
    const height = width * (sprite.img.naturalHeight / sprite.img.naturalWidth);
    // Default to the building itself, but the renderer can pass the camera
    // centre so the cutaway always appears centred in the viewport.
    const cx = centerX ?? b.x + b.width / 2;
    const cy = centerY ?? b.y + b.height / 2 + 40;

    return {
      key,
      img: sprite.img,
      x: cx - width / 2,
      y: cy - height / 2,
      width,
      height
    };
  }
}
