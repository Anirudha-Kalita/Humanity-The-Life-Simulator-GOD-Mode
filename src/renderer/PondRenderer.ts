import type { World } from '../engine/World';
import type { Pond, PondFish } from '../types/simulation';

import pondUrl from '../assets/nature/pond.png';
import pondOverlayUrl from '../assets/nature/pond_overlay.png';
import pondSmallUrl from '../assets/nature/pond_small.png';

export class PondRenderer {
  private static initialized = false;
  private static imgPond: HTMLImageElement;
  private static imgOverlay: HTMLImageElement;
  private static imgPondSmall: HTMLImageElement;

  private static loadImage(bundledUrl: string, fallbackUrl: string): HTMLImageElement {
    const img = new Image();
    img.onerror = () => {
      img.src = fallbackUrl;
    };
    img.src = bundledUrl || fallbackUrl;
    return img;
  }

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.imgPond = this.loadImage(pondUrl, '/assets/nature/pond.png');
    this.imgOverlay = this.loadImage(pondOverlayUrl, '/assets/nature/pond_overlay.png');
    this.imgPondSmall = this.loadImage(pondSmallUrl, '/assets/nature/pond_small.png');
  }

  public static draw(
    ctx: CanvasRenderingContext2D,
    world: World,
    globalTime: number,
    cameraX: number,
    cameraY: number,
    zoom: number,
    canvasW: number,
    canvasH: number
  ): void {
    if (!this.initialized) this.init();

    const halfW = (canvasW / zoom) * 0.5 + 220;
    const halfH = (canvasH / zoom) * 0.5 + 220;
    const minX = cameraX - halfW;
    const maxX = cameraX + halfW;
    const minY = cameraY - halfH;
    const maxY = cameraY + halfH;

    for (const pond of world.ponds) {
      if (
        pond.x + pond.width < minX ||
        pond.x > maxX ||
        pond.y + pond.height < minY ||
        pond.y > maxY
      ) {
        continue;
      }

      this.drawPond(ctx, pond, globalTime);
    }
  }

  private static drawPond(ctx: CanvasRenderingContext2D, pond: Pond, globalTime: number): void {
    ctx.save();

    // 1. Soft ground contact drop shadow
    ctx.fillStyle = 'rgba(24, 18, 12, 0.28)';
    ctx.beginPath();
    ctx.ellipse(
      pond.centerX,
      pond.centerY + pond.height * 0.08,
      pond.width * 0.46,
      pond.height * 0.42,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 2. Base pond sprite (natural shoreline, grassy rim, rocks, cattails, water basin, initial lily pads)
    const baseImg = pond.sprite === 'small' ? this.imgPondSmall : this.imgPond;
    if (baseImg && (baseImg.complete || baseImg.naturalWidth > 0)) {
      ctx.drawImage(baseImg, pond.x, pond.y, pond.width, pond.height);
    }

    // 3. Gentle animated aquatic caustics & shimmer inside the water basin
    this.drawWaterShimmer(ctx, pond, globalTime);

    // 4. Swimming Ornamental Koi Fish
    for (const fish of pond.fish) {
      this.drawKoiFish(ctx, fish, globalTime);
    }

    // 5. Floating lily pads and pink lotus blossoms overlay (renders right over swimming koi fish!)
    if (pond.sprite !== 'small' && this.imgOverlay && (this.imgOverlay.complete || this.imgOverlay.naturalWidth > 0)) {
      ctx.drawImage(this.imgOverlay, pond.x, pond.y, pond.width, pond.height);
    }

    // 6. Surface water ripples
    this.drawSurfaceRipples(ctx, pond, globalTime);

    ctx.restore();
  }

  /**
   * Subtle animated water caustics and aquatic light play inside the pond basin
   */
  private static drawWaterShimmer(ctx: CanvasRenderingContext2D, pond: Pond, globalTime: number): void {
    ctx.save();
    // Clip to water basin ellipse
    ctx.beginPath();
    ctx.ellipse(
      pond.waterCenterX,
      pond.waterCenterY,
      pond.waterRadiusX * 0.94,
      pond.waterRadiusY * 0.94,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();

    // Light sunbeam glints shifting across the turquoise water
    const t = globalTime * 0.0018;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.4;

    for (let i = 0; i < 4; i++) {
      const wavePhase = t + i * 1.57;
      const waveY = pond.waterCenterY + Math.sin(wavePhase) * (pond.waterRadiusY * 0.65);
      const waveX = pond.waterCenterX + Math.cos(wavePhase * 0.8) * (pond.waterRadiusX * 0.45);
      const waveW = 30 + Math.sin(wavePhase * 1.5) * 12;

      ctx.beginPath();
      ctx.ellipse(waveX, waveY, waveW, 3.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders an individual animated ornamental koi fish with smooth body rotation,
   * fluttering pectoral fins, wagging caudal fin, and authentic Kohaku/Ogon/Showa color markings.
   */
  private static drawKoiFish(ctx: CanvasRenderingContext2D, fish: PondFish, globalTime: number): void {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate(fish.angle);

    const s = fish.size || 1.0;
    const bodyLen = 19 * s;
    const bodyWid = 6.2 * s;
    const wag = Math.sin(fish.swimCycle) * (3.2 * s);
    const finFlutter = Math.sin(fish.swimCycle * 1.3) * 0.28;

    // 1. Soft underwater shadow below fish
    ctx.fillStyle = 'rgba(5, 34, 45, 0.32)';
    ctx.beginPath();
    ctx.ellipse(2, 3, bodyLen * 0.52, bodyWid * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Translucent Pectoral Fins (left and right)
    ctx.fillStyle = this.getFinColor(fish.color);
    // Left fin
    ctx.save();
    ctx.translate(bodyLen * 0.15, -bodyWid * 0.55);
    ctx.rotate(-0.55 + finFlutter);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5 * s, 2.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right fin
    ctx.save();
    ctx.translate(bodyLen * 0.15, bodyWid * 0.55);
    ctx.rotate(0.55 - finFlutter);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5 * s, 2.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Wagging Caudal (Tail) Fin
    ctx.fillStyle = this.getFinColor(fish.color);
    ctx.beginPath();
    ctx.moveTo(-bodyLen * 0.45, 0);
    ctx.quadraticCurveTo(
      -bodyLen * 0.72,
      wag * 0.5,
      -bodyLen * 0.95,
      -3.8 * s + wag
    );
    ctx.quadraticCurveTo(
      -bodyLen * 0.82,
      wag * 0.8,
      -bodyLen * 0.95,
      3.8 * s + wag
    );
    ctx.closePath();
    ctx.fill();

    // 4. Main Koi Fish Body
    this.drawKoiBody(ctx, fish, bodyLen, bodyWid, s);

    // 5. Beady Dark Eyes & Head Highlights
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bodyLen * 0.38, -bodyWid * 0.32, 0.9 * s, 0, Math.PI * 2);
    ctx.arc(bodyLen * 0.38, bodyWid * 0.32, 0.9 * s, 0, Math.PI * 2);
    ctx.fill();

    // 6. Dorsal Spine Specular Sheen (Clear water glint on fish scales)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(bodyLen * 0.05, 0, bodyLen * 0.35, 1.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Occasional subtle trailing wake ripple when moving
    if (fish.speed > 18 && fish.nibbleTimer <= 0) {
      const ripplePhase = (globalTime * 0.003 + fish.x * 0.05) % 1.0;
      if (ripplePhase < 0.4) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.4 - ripplePhase) * 0.45})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(
          fish.x - Math.cos(fish.angle) * 8,
          fish.y - Math.sin(fish.angle) * 8,
          4 + ripplePhase * 10,
          2 + ripplePhase * 5,
          fish.angle,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /**
   * Color patterns for different ornamental koi varieties
   */
  private static drawKoiBody(
    ctx: CanvasRenderingContext2D,
    fish: PondFish,
    len: number,
    wid: number,
    s: number
  ): void {
    switch (fish.color) {
      case 'white_red': {
        // Classic Japanese Kohaku: Pearl white body with crimson scarlet patches
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(0, 0, len * 0.48, wid * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crimson forehead and dorsal patch
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(len * 0.22, 0, len * 0.18, wid * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(-len * 0.12, 0, len * 0.16, wid * 0.36, -0.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'gold': {
        // Metallic Yamabuki Ogon: Rich shimmering gold
        const grad = ctx.createLinearGradient(-len * 0.45, 0, len * 0.45, 0);
        grad.addColorStop(0, '#ca8a04');
        grad.addColorStop(0.5, '#eab308');
        grad.addColorStop(1, '#fde047');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, len * 0.48, wid * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'calico': {
        // Showa / Sanke: Tricolor white base with orange and sumi black markings
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.ellipse(0, 0, len * 0.48, wid * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fiery orange marking
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(len * 0.18, -wid * 0.1, len * 0.16, wid * 0.32, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Sumi ink black spots
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(-len * 0.08, wid * 0.12, len * 0.12, wid * 0.26, -0.3, 0, Math.PI * 2);
        ctx.arc(len * 0.28, 0, 2.0 * s, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'blue_silver': {
        // Asagi: Shimmering slate blue back with pearl silver belly
        const grad = ctx.createLinearGradient(-len * 0.45, 0, len * 0.45, 0);
        grad.addColorStop(0, '#334155');
        grad.addColorStop(0.5, '#475569');
        grad.addColorStop(1, '#64748b');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, len * 0.48, wid * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        // Orange flank accents
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(-len * 0.05, -wid * 0.35, len * 0.22, 1.2 * s, 0, 0, Math.PI * 2);
        ctx.ellipse(-len * 0.05, wid * 0.35, len * 0.22, 1.2 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'orange':
      default: {
        // Classic fiery orange pond koi / goldfish
        const grad = ctx.createLinearGradient(-len * 0.45, 0, len * 0.45, 0);
        grad.addColorStop(0, '#c2410c');
        grad.addColorStop(0.5, '#f97316');
        grad.addColorStop(1, '#fb923c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, len * 0.48, wid * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }

  private static getFinColor(color: string): string {
    switch (color) {
      case 'gold':
        return 'rgba(234, 179, 8, 0.78)';
      case 'white_red':
        return 'rgba(255, 255, 255, 0.85)';
      case 'blue_silver':
        return 'rgba(249, 115, 22, 0.82)';
      case 'calico':
        return 'rgba(241, 245, 249, 0.85)';
      case 'orange':
      default:
        return 'rgba(249, 115, 22, 0.82)';
    }
  }

  /**
   * Gentle ambient water surface ripples expanding outwards across the lotus pond
   */
  private static drawSurfaceRipples(ctx: CanvasRenderingContext2D, pond: Pond, globalTime: number): void {
    ctx.save();
    // Clip to water basin
    ctx.beginPath();
    ctx.ellipse(
      pond.waterCenterX,
      pond.waterCenterY,
      pond.waterRadiusX * 0.95,
      pond.waterRadiusY * 0.95,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();

    const t = globalTime * 0.0012;
    // Two natural ripple centers
    const centers = [
      { x: pond.waterCenterX - 35, y: pond.waterCenterY - 10, offset: 0 },
      { x: pond.waterCenterX + 45, y: pond.waterCenterY + 12, offset: 1.8 }
    ];

    for (const c of centers) {
      const cycle = (t + c.offset) % 3.0;
      const progress = cycle / 3.0;
      const r = progress * 32;
      const alpha = (1 - progress) * 0.22;

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
