import type { World } from '../engine/World';
import type { RiverFish } from '../types/simulation';

import riverWaterFlowUrl from '../assets/river/river_water_flow.png';
import riverCausticsUrl from '../assets/river/river_caustics.png';
import riverRock1Url from '../assets/river/river_rock_1.png';
import riverRock2Url from '../assets/river/river_rock_2.png';
import riverRock3Url from '../assets/river/river_rock_3.png';
import riverRock4Url from '../assets/river/river_rock_4.png';
import riverRock5Url from '../assets/river/river_rock_5.png';

interface RiverRockDef {
  y: number;
  xOffset: number;
  spriteIndex: number;
  scale: number;
  phase: number;
}

export class RiverRenderer {
  private static initialized = false;
  private static imgWaterFlow: HTMLImageElement;
  private static imgCaustics: HTMLImageElement;
  private static imgRocks: HTMLImageElement[] = [];

  private static patternWaterFlow: CanvasPattern | null = null;
  private static patternCaustics: CanvasPattern | null = null;

  // Stationary in-stream rocks with clean clearance (water flows freely on both sides)
  // Perfectly positioned along the curve, avoiding the two bridges (y=500 and y=1200)
  private static readonly rocks: RiverRockDef[] = [
    { y: 200, xOffset: -18, spriteIndex: 0, scale: 0.50, phase: 0.3 },
    { y: 360, xOffset: 20, spriteIndex: 1, scale: 0.46, phase: 1.8 },
    { y: 740, xOffset: -16, spriteIndex: 3, scale: 0.48, phase: 3.1 },
    { y: 1000, xOffset: 18, spriteIndex: 4, scale: 0.48, phase: 4.5 },
    { y: 1380, xOffset: -16, spriteIndex: 0, scale: 0.48, phase: 2.2 },
    { y: 1580, xOffset: 18, spriteIndex: 1, scale: 0.46, phase: 5.7 }
  ];

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.imgWaterFlow = this.loadImage(riverWaterFlowUrl, '/assets/river/river_water_flow.png');
    this.imgCaustics = this.loadImage(riverCausticsUrl, '/assets/river/river_caustics.png');

    this.imgRocks = [
      this.loadImage(riverRock1Url, '/assets/river/river_rock_1.png'),
      this.loadImage(riverRock2Url, '/assets/river/river_rock_2.png'),
      this.loadImage(riverRock3Url, '/assets/river/river_rock_3.png'),
      this.loadImage(riverRock4Url, '/assets/river/river_rock_4.png'),
      this.loadImage(riverRock5Url, '/assets/river/river_rock_5.png')
    ];
  }

  private static loadImage(url: string, fallback: string): HTMLImageElement {
    const img = new Image();
    img.src = url;
    img.onerror = () => {
      img.src = fallback;
    };
    return img;
  }

  /**
   * Main River Rendering Pipeline:
   * 1. Uniform Continuous Sandstone & Earth Riverbed Base
   * 2. Continuous Organic Riverbank Cliffs & Grass Ledges (No horizontal seams or bulky blocks)
   * 3. Uniform Continuous Animated Water Channel (Relaxed serene top-to-bottom flow)
   * 4. Stationary In-Stream Rocks with Dynamic Upstream Bow Splash & Downstream Wakes
   * 5. River Fish swimming in the currents
   */
  public static drawRiver(ctx: CanvasRenderingContext2D, world: World, globalTime: number): void {
    if (!this.initialized) this.init();

    const h = world.height;
    const flowSec = globalTime * 0.001;
    // Decreased, serene flow rate: 16 pixels per second downward
    const flowOffset = (flowSec * 16) % 256;

    // 1. Draw Riverbed / Sandstone Shore Base
    this.drawRiverbed(ctx, world, h);

    // 2. Draw Continuous Illustrated Riverbanks
    this.drawContinuousBanks(ctx, world, h);

    // 3. Draw Uniform Flowing Water Body (Clipped strictly to uniform 132px water channel)
    this.drawFlowingWater(ctx, world, h, flowSec, flowOffset);

    // 4. Stationary In-Stream Rocks with Upstream Splash & Downstream Wake
    this.drawRiverRocks(ctx, world, flowSec);

    // 5. River Fish swimming in the currents
    for (const fish of world.riverFish) {
      this.drawRiverFish(ctx, fish);
    }
  }

  /**
   * Sandy / Earthy under-bed channel following the continuous river curves
   */
  private static drawRiverbed(ctx: CanvasRenderingContext2D, world: World, h: number): void {
    ctx.save();

    // Sandy Shore Underlay (#dfc28a with warm shading)
    ctx.fillStyle = '#e2c488';
    ctx.beginPath();
    for (let y = 0; y <= h; y += 20) {
      const cx = world.getRiverCenterX(y);
      if (y === 0) ctx.moveTo(cx - 86, y);
      else ctx.lineTo(cx - 86, y);
    }
    for (let y = h; y >= 0; y -= 20) {
      const cx = world.getRiverCenterX(y);
      ctx.lineTo(cx + 86, y);
    }
    ctx.closePath();
    ctx.fill();

    // Dark organic outline along sand edge
    ctx.strokeStyle = '#382a1c';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Moist wet-sand rim along water edge
    ctx.strokeStyle = 'rgba(120, 85, 45, 0.40)';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Continuous Illustrated Riverbanks:
   * Smooth, uniform organic cliff and grass ribbons framing the river along its curve.
   * Completely seamless with zero horizontal seams, blocks, or discontinuities!
   */
  private static drawContinuousBanks(ctx: CanvasRenderingContext2D, world: World, h: number): void {
    ctx.save();

    // 1. Earthy Cliff Strata on Left and Right Banks
    for (const side of [-1, 1]) {
      // Dark under-cliff shadow
      ctx.fillStyle = '#3a2414';
      ctx.beginPath();
      for (let y = 0; y <= h; y += 15) {
        const cx = world.getRiverCenterX(y);
        const inner = cx + side * 66;
        const outer = cx + side * 84;
        if (side === -1) {
          if (y === 0) ctx.moveTo(outer, y);
          else ctx.lineTo(outer, y);
        } else {
          if (y === 0) ctx.moveTo(inner, y);
          else ctx.lineTo(inner, y);
        }
      }
      for (let y = h; y >= 0; y -= 15) {
        const cx = world.getRiverCenterX(y);
        const inner = cx + side * 66;
        const outer = cx + side * 84;
        if (side === -1) {
          ctx.lineTo(inner, y);
        } else {
          ctx.lineTo(outer, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Warm terraced dirt ledge
      ctx.fillStyle = '#7a522a';
      ctx.beginPath();
      for (let y = 0; y <= h; y += 15) {
        const cx = world.getRiverCenterX(y);
        const inner = cx + side * 68;
        const outer = cx + side * 82;
        if (side === -1) {
          if (y === 0) ctx.moveTo(outer, y);
          else ctx.lineTo(outer, y);
        } else {
          if (y === 0) ctx.moveTo(inner, y);
          else ctx.lineTo(inner, y);
        }
      }
      for (let y = h; y >= 0; y -= 15) {
        const cx = world.getRiverCenterX(y);
        const inner = cx + side * 68;
        const outer = cx + side * 82;
        if (side === -1) {
          ctx.lineTo(inner, y);
        } else {
          ctx.lineTo(outer, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // 2. Lush Scalloped Grass Verge on top of the cliff
      ctx.fillStyle = '#559c2f';
      ctx.strokeStyle = '#2b1e12';
      ctx.lineWidth = 1.2;
      for (let y = 5; y < h; y += 22) {
        const cx = world.getRiverCenterX(y);
        const gx = cx + side * 82;
        ctx.beginPath();
        ctx.arc(gx, y, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Highlight center on grass scallop
        ctx.fillStyle = '#6bb63a';
        ctx.beginPath();
        ctx.arc(gx - side * 1.5, y - 1, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#559c2f';

        // Little wild daisy flower every 66px
        if (y % 66 < 22) {
          const fx = gx - side * 4;
          const fy = y;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(fx - 2, fy, 1.8, 0, Math.PI * 2);
          ctx.arc(fx + 2, fy, 1.8, 0, Math.PI * 2);
          ctx.arc(fx, fy - 2, 1.8, 0, Math.PI * 2);
          ctx.arc(fx, fy + 2, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#559c2f';
        }
      }
    }

    ctx.restore();
  }

  /**
   * Uniform Flowing Water Channel:
   * Smooth continuous 132px water ribbon from y=0 to 1800.
   * Decreased flow velocity for a serene, natural stream feel.
   */
  private static drawFlowingWater(
    ctx: CanvasRenderingContext2D,
    world: World,
    h: number,
    flowSec: number,
    flowOffset: number
  ): void {
    ctx.save();

    // Build the continuous clipping path for the 132px water channel
    ctx.beginPath();
    for (let y = 0; y <= h; y += 15) {
      const cx = world.getRiverCenterX(y);
      if (y === 0) ctx.moveTo(cx - 66, y);
      else ctx.lineTo(cx - 66, y);
    }
    for (let y = h; y >= 0; y -= 15) {
      const cx = world.getRiverCenterX(y);
      ctx.lineTo(cx + 66, y);
    }
    ctx.closePath();

    // Clip strictly to water channel
    ctx.clip();

    // A. Deep Vibrant Blue Water Gradient (Matching uploaded assets)
    const waterGrad = ctx.createLinearGradient(1550, 0, 1750, 0);
    waterGrad.addColorStop(0, '#0c628e');
    waterGrad.addColorStop(0.2, '#118ebd');
    waterGrad.addColorStop(0.5, '#1eb6e5');
    waterGrad.addColorStop(0.8, '#118ebd');
    waterGrad.addColorStop(1, '#0c628e');

    ctx.fillStyle = waterGrad;
    ctx.fillRect(1400, 0, 600, h);

    // B. Downward-Flowing Seamless Clean Water Texture (ZERO rocks!)
    if (this.imgWaterFlow && (this.imgWaterFlow.complete || this.imgWaterFlow.naturalWidth > 0)) {
      if (!this.patternWaterFlow) {
        this.patternWaterFlow = ctx.createPattern(this.imgWaterFlow, 'repeat');
      }
      if (this.patternWaterFlow) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        // Translate downward to animate top-to-bottom flow at decreased pace
        ctx.translate(0, flowOffset);
        ctx.fillStyle = this.patternWaterFlow;
        ctx.fillRect(1400, -256, 600, h + 512);
        ctx.restore();
      }
    }

    // C. Sunlight Caustics Layer (Gentle downward shimmer with subtle wave drift)
    if (this.imgCaustics && (this.imgCaustics.complete || this.imgCaustics.naturalWidth > 0)) {
      if (!this.patternCaustics) {
        this.patternCaustics = ctx.createPattern(this.imgCaustics, 'repeat');
      }
      if (this.patternCaustics) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        const causticsOffset = (flowSec * 22) % 256;
        const causticsSway = Math.sin(flowSec * 1.0) * 4;
        ctx.translate(causticsSway, causticsOffset);
        ctx.fillStyle = this.patternCaustics;
        ctx.fillRect(1400, -256, 600, h + 512);
        ctx.restore();
      }
    }

    // D. Uniform Flow Streamlines & Wake Ribbons traveling downward
    this.drawStreamlines(ctx, world, h, flowSec);

    // E. Natural Shoreline Foam Lapping along water edges
    this.drawShoreFringe(ctx, world, h, flowSec);

    ctx.restore();
  }

  /**
   * Curved streamlines & parabolic foam crests flowing from top to bottom at relaxed pace
   */
  private static drawStreamlines(
    ctx: CanvasRenderingContext2D,
    world: World,
    h: number,
    flowSec: number
  ): void {
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';

    // 3 continuous flow lanes across the channel
    const lanes = [-22, 0, 22];

    for (let l = 0; l < lanes.length; l++) {
      const laneOffset = lanes[l];
      // Serene current speeds: 20 px/s in center, 14 px/s in side lanes
      const laneSpeed = l === 1 ? 20 : 14;

      for (let i = 0; i < 20; i++) {
        // Continuous top-to-bottom motion
        const waveY = (i * 92 + flowSec * laneSpeed + l * 32) % h;
        const waveX = world.getRiverCenterX(waveY) + laneOffset + Math.sin(waveY * 0.012 + flowSec * 0.8) * 3;

        // Smooth fade in and out
        const alpha = Math.sin((waveY / h) * Math.PI) * 0.38;
        if (alpha <= 0.02) continue;

        const waveWidth = 10 + Math.sin(i * 1.5) * 3;

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        // Downward-pointing parabolic wave curve
        ctx.moveTo(waveX - waveWidth, waveY - 3.5);
        ctx.quadraticCurveTo(waveX, waveY + 3.5, waveX + waveWidth, waveY - 3.5);
        ctx.stroke();

        // Delicate crest glimmer dot
        if (i % 4 === 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.85).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(waveX, waveY, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Subtle foam fringe along the water's edge where current grazes the banks
   */
  private static drawShoreFringe(
    ctx: CanvasRenderingContext2D,
    world: World,
    h: number,
    flowSec: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
    ctx.lineWidth = 1.4;

    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let y = 0; y <= h; y += 30) {
        const cx = world.getRiverCenterX(y);
        const wave = Math.sin(y * 0.03 - flowSec * 1.5) * 2;
        const x = cx + side * (64 + wave);
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Stationary in-stream rocks:
   * Rocks remain firmly planted at fixed world coordinates (do NOT move).
   * Upstream bow wave splash where water strikes top of rock + downstream wake ripples.
   */
  private static drawRiverRocks(
    ctx: CanvasRenderingContext2D,
    world: World,
    flowSec: number
  ): void {
    ctx.save();

    for (const rock of this.rocks) {
      const rc = world.getRiverCenterX(rock.y);
      const rockX = rc + rock.xOffset;
      // Fixed Y coordinate: Rock is 100% STATIONARY!
      const rockY = rock.y;
      const img = this.imgRocks[rock.spriteIndex % this.imgRocks.length];

      if (!img || (!img.complete && img.naturalWidth === 0)) continue;

      const rw = img.naturalWidth * rock.scale;
      const rh = img.naturalHeight * rock.scale;

      // 1. Upstream Bow Wave Splash (Water flowing down strikes the top face of the rock)
      const splashPulse = 0.88 + Math.sin(flowSec * 2.5 + rock.phase) * 0.12;
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.55 * splashPulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(
        rockX,
        rockY - rh * 0.35,
        rw * 0.40 * splashPulse,
        4.0 * splashPulse,
        0,
        Math.PI,
        0
      );
      ctx.fill();
      ctx.restore();

      // 2. Downstream Trailing Wake Streamers
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // Left trailing streamer
      ctx.moveTo(rockX - rw * 0.38, rockY);
      ctx.quadraticCurveTo(rockX - rw * 0.32, rockY + rh * 0.6, rockX - rw * 0.1, rockY + rh * 0.9);
      // Right trailing streamer
      ctx.moveTo(rockX + rw * 0.38, rockY);
      ctx.quadraticCurveTo(rockX + rw * 0.32, rockY + rh * 0.6, rockX + rw * 0.1, rockY + rh * 0.9);
      ctx.stroke();

      // 3. Expanding downstream wake ripples drifting downward at relaxed speed
      for (let w = 0; w < 2; w++) {
        const rippleProgress = ((flowSec * 10 + rock.phase * 20 + w * 18) % 36);
        const ripY = rockY + rh * 0.35 + rippleProgress;
        const ripW = rw * 0.32 + rippleProgress * 0.35;
        const ripAlpha = (1 - rippleProgress / 36) * 0.28;
        if (ripAlpha > 0.02) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${ripAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(rockX, ripY, ripW, 3.5 + rippleProgress * 0.1, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 4. Rock Drop Shadow onto water
      ctx.fillStyle = 'rgba(8, 40, 55, 0.40)';
      ctx.beginPath();
      ctx.ellipse(rockX, rockY + rh * 0.12, rw * 0.42, rh * 0.20, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Illustrated Rock Sprite at FIXED position
      ctx.drawImage(img, rockX - rw * 0.5, rockY - rh * 0.5, rw, rh);
    }

    ctx.restore();
  }

  /**
   * River salmon and trout swimming in the river currents
   */
  private static drawRiverFish(ctx: CanvasRenderingContext2D, fish: RiverFish): void {
    ctx.save();
    ctx.translate(fish.x, fish.y);

    // Subtle fish shadow below water
    ctx.fillStyle = 'rgba(6, 35, 48, 0.42)';
    ctx.beginPath();
    ctx.ellipse(1, 2, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Silvery aquatic fish body
    ctx.fillStyle = 'rgba(14, 75, 98, 0.88)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wagging tail fin pointing with current
    const wag = Math.sin(fish.swimCycle) * 3.2;
    ctx.fillStyle = 'rgba(18, 98, 126, 0.92)';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-11, -2.5 + wag);
    ctx.lineTo(-11, 2.5 + wag);
    ctx.closePath();
    ctx.fill();

    // Tiny gill highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.50)';
    ctx.beginPath();
    ctx.arc(3, -0.8, 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
