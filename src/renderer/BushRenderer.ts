import type { BerryBush } from '../types/simulation';

import bushNoBerryFrontUrl from '../assets/bushes/bush_no_berry_front.png';
import bushNoBerryBackUrl from '../assets/bushes/bush_no_berry_back.png';
import bushNoBerryLeftUrl from '../assets/bushes/bush_no_berry_left.png';
import bushNoBerryRightUrl from '../assets/bushes/bush_no_berry_right.png';
import bushNoBerryTopUrl from '../assets/bushes/bush_no_berry_top.png';
import bushNoBerrySmallUrl from '../assets/bushes/bush_no_berry_small.png';
import bushNoBerryMediumUrl from '../assets/bushes/bush_no_berry_medium.png';
import bushNoBerryLargeUrl from '../assets/bushes/bush_no_berry_large.png';

import bushBerryFrontUrl from '../assets/bushes/bush_berry_front.png';
import bushBerryBackUrl from '../assets/bushes/bush_berry_back.png';
import bushBerryLeftUrl from '../assets/bushes/bush_berry_left.png';
import bushBerryRightUrl from '../assets/bushes/bush_berry_right.png';
import bushBerryTopUrl from '../assets/bushes/bush_berry_top.png';
import bushBerrySmallUrl from '../assets/bushes/bush_berry_small.png';
import bushBerryMediumUrl from '../assets/bushes/bush_berry_medium.png';
import bushBerryLargeUrl from '../assets/bushes/bush_berry_large.png';
import berryDetailUrl from '../assets/bushes/berry_detail.png';

export type BushVariant = 'front' | 'back' | 'left' | 'right' | 'large';

interface BushSpriteDef {
  img: HTMLImageElement;
  loaded: boolean;
  scale: number;
}

export class BushRenderer {
  private static initialized = false;
  private static spritesNoBerry: Record<string, BushSpriteDef> = {};
  private static spritesWithBerry: Record<string, BushSpriteDef> = {};
  public static berryDetailImg: HTMLImageElement | null = null;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const noBerrySources: Record<string, { url: string; scale: number }> = {
      front: { url: bushNoBerryFrontUrl, scale: 0.30 },
      back: { url: bushNoBerryBackUrl, scale: 0.30 },
      left: { url: bushNoBerryLeftUrl, scale: 0.31 },
      right: { url: bushNoBerryRightUrl, scale: 0.31 },
      top: { url: bushNoBerryTopUrl, scale: 0.30 },
      large: { url: bushNoBerryLargeUrl, scale: 0.44 },
      medium: { url: bushNoBerryMediumUrl, scale: 0.38 },
      small: { url: bushNoBerrySmallUrl, scale: 0.36 }
    };

    const withBerrySources: Record<string, { url: string; scale: number }> = {
      front: { url: bushBerryFrontUrl, scale: 0.30 },
      back: { url: bushBerryBackUrl, scale: 0.30 },
      left: { url: bushBerryLeftUrl, scale: 0.31 },
      right: { url: bushBerryRightUrl, scale: 0.31 },
      top: { url: bushBerryTopUrl, scale: 0.30 },
      large: { url: bushBerryLargeUrl, scale: 0.44 },
      medium: { url: bushBerryMediumUrl, scale: 0.38 },
      small: { url: bushBerrySmallUrl, scale: 0.36 }
    };

    for (const [key, def] of Object.entries(noBerrySources)) {
      const img = new Image();
      const item: BushSpriteDef = { img, loaded: false, scale: def.scale };
      img.onload = () => { item.loaded = true; };
      img.src = def.url;
      this.spritesNoBerry[key] = item;
    }

    for (const [key, def] of Object.entries(withBerrySources)) {
      const img = new Image();
      const item: BushSpriteDef = { img, loaded: false, scale: def.scale };
      img.onload = () => { item.loaded = true; };
      img.src = def.url;
      this.spritesWithBerry[key] = item;
    }

    const detailImg = new Image();
    detailImg.src = berryDetailUrl;
    this.berryDetailImg = detailImg;
  }

  public static hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  public static getBushVariant(id: string): BushVariant {
    const variants: BushVariant[] = ['front', 'large', 'left', 'right', 'back'];
    const idx = this.hashId(id) % variants.length;
    return variants[idx];
  }

  public static drawBush(ctx: CanvasRenderingContext2D, bush: BerryBush, globalTime: number): void {
    if (!this.initialized) this.init();

    // Determine visual variant based on lifecycle stage and ID
    let key: string;
    if (bush.stage === 'sprout') {
      key = 'small';
    } else if (bush.stage === 'flowering') {
      key = 'medium';
    } else {
      key = this.getBushVariant(bush.id);
    }

    const spriteMap = bush.hasBerries ? this.spritesWithBerry : this.spritesNoBerry;
    const sprite = spriteMap[key] || spriteMap['front'];

    ctx.save();
    ctx.translate(bush.x, bush.y);

    // Subtle natural ambient breeze sway
    const hash = this.hashId(bush.id);
    const breeze = Math.sin(globalTime * 0.0022 + hash * 0.1) * 0.015;
    ctx.rotate(breeze);

    if (bush.stage === 'withering') {
      const decayFraction = Math.max(0.3, (bush.decayTimer || 60) / 60);
      ctx.globalAlpha = decayFraction;
      ctx.filter = 'sepia(0.65) saturate(1.4) brightness(0.85)';
    }

    if (sprite && (sprite.loaded || (sprite.img.complete && sprite.img.naturalWidth > 0))) {
      const img = sprite.img;
      const scale = sprite.scale;
      const renderW = img.naturalWidth * scale;
      const renderH = img.naturalHeight * scale;

      // Soft ground drop shadow beneath bush base
      ctx.fillStyle = 'rgba(38, 32, 27, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, 1, renderW * 0.38, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw illustrated bush anchored to the base
      ctx.drawImage(
        img,
        -renderW / 2,
        -renderH + 3,
        renderW,
        renderH
      );

      // Delicate flowering blossoms on budding bushes
      if (bush.stage === 'flowering') {
        this.drawBlossoms(ctx, renderW, renderH, hash);
      }
    } else {
      this.drawFallbackBush(ctx, bush);
    }

    ctx.restore();
  }

  private static drawBlossoms(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
    ctx.save();
    const flowerOffsets = [
      { x: -w * 0.22, y: -h * 0.45 },
      { x: w * 0.18, y: -h * 0.52 },
      { x: -w * 0.05, y: -h * 0.65 },
      { x: w * 0.25, y: -h * 0.32 },
      { x: -w * 0.18, y: -h * 0.28 }
    ];

    for (let i = 0; i < flowerOffsets.length; i++) {
      const pt = flowerOffsets[i];
      const fx = pt.x + Math.sin(seed + i) * 2;
      const fy = pt.y + Math.cos(seed + i) * 2;

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff7ed';
      for (let p = 0; p < 4; p++) {
        const angle = (p * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(angle) * 2.2, fy + Math.sin(angle) * 2.2, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private static drawFallbackBush(ctx: CanvasRenderingContext2D, bush: BerryBush): void {
    ctx.fillStyle = bush.stage === 'withering' ? '#92400e' : '#598f3e';
    ctx.strokeStyle = '#26201a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-7, 0, 9, 0, Math.PI * 2);
    ctx.arc(7, 0, 9, 0, Math.PI * 2);
    ctx.arc(0, -6, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (bush.hasBerries) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(-5, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
