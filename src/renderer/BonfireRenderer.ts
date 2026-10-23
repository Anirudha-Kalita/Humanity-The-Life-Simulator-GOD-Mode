import type { Campfire, WeatherType } from '../types/simulation';

import bonfireFrontUrl from '../assets/bonfire/bonfire_front.png';
import bonfireBackUrl from '../assets/bonfire/bonfire_back.png';
import bonfireLeftUrl from '../assets/bonfire/bonfire_left.png';
import bonfireRightUrl from '../assets/bonfire/bonfire_right.png';
import bonfireTopUrl from '../assets/bonfire/bonfire_top.png';
import bonfireIdleUrl from '../assets/bonfire/bonfire_idle.png';
import bonfireBurningMedUrl from '../assets/bonfire/bonfire_burning_med.png';
import bonfireBurningHighUrl from '../assets/bonfire/bonfire_burning_high.png';
import bonfireCracklingUrl from '../assets/bonfire/bonfire_crackling.png';
import bonfireSmolderingUrl from '../assets/bonfire/bonfire_smoldering.png';
import bonfireDyingUrl from '../assets/bonfire/bonfire_dying.png';
import bonfireSmallUrl from '../assets/bonfire/bonfire_small.png';
import bonfireLargeUrl from '../assets/bonfire/bonfire_large.png';

interface BonfireSpriteDef {
  img: HTMLImageElement;
  loaded: boolean;
  scale: number;
  anchorYRatio: number; // Anchor ratio from top to center of stone pit
}

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class BonfireRenderer {
  private static initialized = false;
  private static sprites: Record<string, BonfireSpriteDef> = {};
  private static particles: FireParticle[] = [];
  private static lastParticleSpawn = 0;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const sources: Record<string, { url: string; scale: number; anchorYRatio: number }> = {
      // Views (Positions)
      front: { url: bonfireFrontUrl, scale: 0.44, anchorYRatio: 0.80 },
      back: { url: bonfireBackUrl, scale: 0.44, anchorYRatio: 0.80 },
      left: { url: bonfireLeftUrl, scale: 0.44, anchorYRatio: 0.80 },
      right: { url: bonfireRightUrl, scale: 0.44, anchorYRatio: 0.80 },
      top: { url: bonfireTopUrl, scale: 0.44, anchorYRatio: 0.50 },

      // Animation / State variations
      idle: { url: bonfireIdleUrl, scale: 0.44, anchorYRatio: 0.78 },
      burning_medium: { url: bonfireBurningMedUrl, scale: 0.44, anchorYRatio: 0.80 },
      burning_high: { url: bonfireBurningHighUrl, scale: 0.44, anchorYRatio: 0.80 },
      crackling: { url: bonfireCracklingUrl, scale: 0.44, anchorYRatio: 0.80 },
      smoldering: { url: bonfireSmolderingUrl, scale: 0.44, anchorYRatio: 0.82 },
      dying_out: { url: bonfireDyingUrl, scale: 0.44, anchorYRatio: 0.82 },

      // Sizes
      small: { url: bonfireSmallUrl, scale: 0.52, anchorYRatio: 0.80 },
      large: { url: bonfireLargeUrl, scale: 0.50, anchorYRatio: 0.80 }
    };

    for (const [key, def] of Object.entries(sources)) {
      const img = new Image();
      const item: BonfireSpriteDef = {
        img,
        loaded: false,
        scale: def.scale,
        anchorYRatio: def.anchorYRatio
      };
      img.onload = () => { item.loaded = true; };
      img.src = def.url;
      this.sprites[key] = item;
    }
  }

  /**
   * Resolves the current sprite key based on view position, selected state,
   * time of day, weather, and animated flame loop.
   */
  public static resolveSpriteKey(
    cf: Campfire,
    gameMinutes: number,
    weather: WeatherType,
    globalTime: number
  ): string {
    const view = cf.view || 'front';
    const state = cf.state || 'auto';

    // If viewing from non-front perspective (back, left, right, top), display that view angle!
    if (view !== 'front') {
      return view;
    }

    // If a manual animation state is chosen, play that state directly
    if (state !== 'auto') {
      return state;
    }

    // AUTO MODE: Reactive to time of day, settlement social schedule, and weather
    const hour = Math.floor(gameMinutes / 60);

    // Rainy/Stormy weather: fire sizzles and smolders with extra smoke
    if (weather === 'rainy' || weather === 'stormy') {
      const cycle = Math.floor(globalTime / 400) % 3;
      return cycle === 0 ? 'smoldering' : cycle === 1 ? 'crackling' : 'idle';
    }

    // Evening Social Gathering (17:00 - 21:30): Grand blazing bonfire!
    if (hour >= 17 && hour < 22) {
      // Animated roaring fire cycling through dynamic flame frames
      const flameCycle = Math.floor(globalTime / 200) % 4;
      switch (flameCycle) {
        case 0: return 'burning_high';
        case 1: return 'crackling';
        case 2: return 'front';
        case 3: return 'burning_medium';
      }
    }

    // Deep Night (23:30 - 05:00): Settlers are asleep, fire settles to smoldering coals
    if (hour >= 23 || hour < 5) {
      const cycle = Math.floor(globalTime / 800) % 2;
      return cycle === 0 ? 'smoldering' : 'dying_out';
    }

    // Early Morning (05:00 - 07:00): Rekindling small flame
    if (hour >= 5 && hour < 7) {
      const cycle = Math.floor(globalTime / 350) % 2;
      return cycle === 0 ? 'idle' : 'burning_medium';
    }

    // Daytime (07:00 - 17:00): Steady village fire
    const dayCycle = Math.floor(globalTime / 260) % 4;
    switch (dayCycle) {
      case 0: return 'burning_medium';
      case 1: return 'front';
      case 2: return 'crackling';
      case 3: return 'idle';
    }

    return 'front';
  }

  public static draw(
    ctx: CanvasRenderingContext2D,
    cf: Campfire,
    gameMinutes: number,
    weather: WeatherType,
    globalTime: number,
    isSelected: boolean = false
  ): void {
    if (!this.initialized) this.init();

    const spriteKey = this.resolveSpriteKey(cf, gameMinutes, weather, globalTime);
    const sprite = this.sprites[spriteKey] || this.sprites['front'];

    ctx.save();
    ctx.translate(cf.x, cf.y);

    // 1. Selection indicator aura
    if (isSelected) {
      this.drawSelectionHalo(ctx, globalTime);
    }

    // 2. Drop shadow under the stone fire pit
    ctx.save();
    ctx.fillStyle = 'rgba(28, 22, 18, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 34, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Draw Illustrated Bonfire Sprite
    if (sprite && (sprite.loaded || (sprite.img.complete && sprite.img.naturalWidth > 0))) {
      const img = sprite.img;
      const scale = sprite.scale;
      const renderW = img.naturalWidth * scale;
      const renderH = img.naturalHeight * scale;

      // Slight organic flame flicker scaling
      const isBurning = spriteKey === 'burning_high' || spriteKey === 'crackling' || spriteKey === 'burning_medium' || spriteKey === 'front';
      const flameFlicker = isBurning ? Math.sin(globalTime * 0.015 + cf.x) * 0.015 : 0;

      const drawX = -renderW / 2;
      const drawY = -renderH * sprite.anchorYRatio;

      ctx.save();
      if (flameFlicker !== 0) {
        ctx.scale(1 + flameFlicker * 0.4, 1 + flameFlicker);
      }

      ctx.drawImage(img, drawX, drawY, renderW, renderH);
      ctx.restore();
    } else {
      this.drawFallback(ctx);
    }

    // 4. Live Flying Ember Sparks & Smoke Wisps
    this.updateAndDrawParticles(ctx, spriteKey, globalTime);

    ctx.restore();
  }

  private static drawSelectionHalo(ctx: CanvasRenderingContext2D, globalTime: number): void {
    ctx.save();
    const pulse = Math.sin(globalTime * 0.006) * 0.15 + 0.85;
    const rx = 38 * pulse;
    const ry = 16 * pulse;

    // Soft warm outer aura
    ctx.beginPath();
    ctx.ellipse(0, 3, rx + 8, ry + 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
    ctx.fill();

    // Sharp glowing ring
    ctx.beginPath();
    ctx.ellipse(0, 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.restore();
  }

  private static updateAndDrawParticles(
    ctx: CanvasRenderingContext2D,
    spriteKey: string,
    globalTime: number
  ): void {
    const isSmoldering = spriteKey === 'smoldering' || spriteKey === 'dying_out';
    const isHigh = spriteKey === 'burning_high' || spriteKey === 'crackling';

    // Spawn new particles
    if (globalTime - this.lastParticleSpawn > (isHigh ? 60 : 120)) {
      this.lastParticleSpawn = globalTime;

      if (isSmoldering) {
        // Soft rising white/grey smoke puff
        this.particles.push({
          x: (Math.random() - 0.5) * 18,
          y: -14,
          vx: (Math.random() - 0.5) * 0.35 + 0.1,
          vy: -0.6 - Math.random() * 0.5,
          life: 0,
          maxLife: 45 + Math.random() * 30,
          size: 3 + Math.random() * 3.5,
          color: 'rgba(226, 232, 240, 0.45)'
        });
      } else {
        // Glowing orange/gold ember spark
        this.particles.push({
          x: (Math.random() - 0.5) * 22,
          y: -25 - Math.random() * 15,
          vx: (Math.random() - 0.5) * 0.9,
          vy: -1.2 - Math.random() * 1.5,
          life: 0,
          maxLife: 28 + Math.random() * 20,
          size: 1.2 + Math.random() * 1.8,
          color: Math.random() > 0.4 ? '#fbbf24' : '#f97316'
        });
      }

      if (this.particles.length > 28) {
        this.particles.shift();
      }
    }

    // Update and draw existing particles
    ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = 1 - (p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + (p.life / p.maxLife) * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private static drawFallback(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#7a838e';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 16, Math.sin(angle) * 12, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}
