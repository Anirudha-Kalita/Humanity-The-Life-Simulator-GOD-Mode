import type { WildlifeAnimal } from '../types/simulation';

import walk1Url from '../assets/animals/rabbit/rabbit_walk_1.png';
import walk2Url from '../assets/animals/rabbit/rabbit_walk_2.png';
import walk3Url from '../assets/animals/rabbit/rabbit_walk_3.png';
import walk4Url from '../assets/animals/rabbit/rabbit_walk_4.png';
import walk5Url from '../assets/animals/rabbit/rabbit_walk_5.png';
import walk6Url from '../assets/animals/rabbit/rabbit_walk_6.png';

import run1Url from '../assets/animals/rabbit/rabbit_run_1.png';
import run2Url from '../assets/animals/rabbit/rabbit_run_2.png';
import run3Url from '../assets/animals/rabbit/rabbit_run_3.png';
import run4Url from '../assets/animals/rabbit/rabbit_run_4.png';
import run5Url from '../assets/animals/rabbit/rabbit_run_5.png';
import run6Url from '../assets/animals/rabbit/rabbit_run_6.png';

import viewFrontUrl from '../assets/animals/rabbit/rabbit_view_front.png';
import viewBackUrl from '../assets/animals/rabbit/rabbit_view_back.png';
import viewLeftUrl from '../assets/animals/rabbit/rabbit_view_left.png';
import viewRightUrl from '../assets/animals/rabbit/rabbit_view_right.png';

import eatingUrl from '../assets/animals/rabbit/rabbit_eating.png';
import drinkingUrl from '../assets/animals/rabbit/rabbit_drinking.png';
import groomingUrl from '../assets/animals/rabbit/rabbit_grooming.png';

import sleepingUrl from '../assets/animals/rabbit/rabbit_sleeping.png';
import sittingUrl from '../assets/animals/rabbit/rabbit_sitting.png';
import crouchingUrl from '../assets/animals/rabbit/rabbit_crouching.png';
import standingUpUrl from '../assets/animals/rabbit/rabbit_standing_up.png';
import jumpingUrl from '../assets/animals/rabbit/rabbit_jumping.png';
import inBoxUrl from '../assets/animals/rabbit/rabbit_in_box.png';

import babyUrl from '../assets/animals/rabbit/rabbit_baby.png';
import withCarrotUrl from '../assets/animals/rabbit/rabbit_with_carrot.png';
import withFlowerUrl from '../assets/animals/rabbit/rabbit_with_flower.png';
import withBerryUrl from '../assets/animals/rabbit/rabbit_with_berry.png';

export class RabbitSpriteRenderer {
  private static initialized = false;
  private static walkFrames: HTMLImageElement[] = [];
  private static runFrames: HTMLImageElement[] = [];
  private static views: Record<string, HTMLImageElement> = {};
  private static actions: Record<string, HTMLImageElement> = {};
  private static poses: Record<string, HTMLImageElement> = {};
  private static variants: Record<string, HTMLImageElement> = {};

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const loadImg = (url: string) => {
      const img = new Image();
      img.src = url;
      return img;
    };

    // 6-frame walk cycle
    this.walkFrames = [
      loadImg(walk1Url),
      loadImg(walk2Url),
      loadImg(walk3Url),
      loadImg(walk4Url),
      loadImg(walk5Url),
      loadImg(walk6Url)
    ];

    // 6-frame run cycle
    this.runFrames = [
      loadImg(run1Url),
      loadImg(run2Url),
      loadImg(run3Url),
      loadImg(run4Url),
      loadImg(run5Url),
      loadImg(run6Url)
    ];

    // Views
    this.views = {
      front: loadImg(viewFrontUrl),
      back: loadImg(viewBackUrl),
      left: loadImg(viewLeftUrl),
      right: loadImg(viewRightUrl)
    };

    // Activities
    this.actions = {
      eating: loadImg(eatingUrl),
      drinking: loadImg(drinkingUrl),
      grooming: loadImg(groomingUrl)
    };

    // Poses
    this.poses = {
      sleeping: loadImg(sleepingUrl),
      sitting: loadImg(sittingUrl),
      crouching: loadImg(crouchingUrl),
      standing_up: loadImg(standingUpUrl),
      jumping: loadImg(jumpingUrl),
      in_box: loadImg(inBoxUrl)
    };

    // Special item variants
    this.variants = {
      baby: loadImg(babyUrl),
      carrot: loadImg(withCarrotUrl),
      flower: loadImg(withFlowerUrl),
      berry: loadImg(withBerryUrl)
    };
  }

  public static getTopOffset(animal: WildlifeAnimal): number {
    const isBaby = animal.variant === 1;
    const baseScale = isBaby ? 0.28 : 0.33;
    const scale = baseScale * (animal.scale || 1);
    if (animal.state === 'standing_up') {
      return -128 * scale;
    }
    if (animal.state === 'sleeping') {
      return -68 * scale;
    }
    return -95 * scale;
  }

  public static draw(
    ctx: CanvasRenderingContext2D,
    animal: WildlifeAnimal,
    globalTime: number
  ): number | null {
    this.init();

    const isBaby = animal.variant === 1;
    const baseScale = isBaby ? 0.28 : 0.33;
    const scale = baseScale * (animal.scale || 1);

    const isDead = animal.isDead || animal.state === 'dead';

    // Pick sprite based on state and variant
    let img: HTMLImageElement | undefined;
    let isJumpingState = false;
    let jumpLift = 0;

    if (isDead) {
      img = this.poses.sleeping;
    } else {
      switch (animal.state) {
        case 'walking':
        case 'hopping': {
          const frameIdx = Math.floor(animal.animTimer * 9) % 6;
          img = this.walkFrames[frameIdx];
          break;
        }

        case 'running':
        case 'fleeing': {
          const frameIdx = Math.floor(animal.animTimer * 15) % 6;
          img = this.runFrames[frameIdx];
          break;
        }

        case 'jumping': {
          img = this.poses.jumping;
          isJumpingState = true;
          const jumpProgress = (animal.animTimer * 4) % Math.PI;
          jumpLift = Math.sin(jumpProgress) * 14;
          break;
        }

        case 'eating':
        case 'grazing':
          img = this.actions.eating;
          break;

        case 'drinking':
          img = this.actions.drinking;
          break;

        case 'grooming':
          img = this.actions.grooming;
          break;

        case 'sleeping':
          img = this.poses.sleeping;
          break;

        case 'crouching':
          img = this.poses.crouching;
          break;

        case 'standing_up':
          img = this.poses.standing_up;
          break;

        case 'in_box':
          img = this.poses.in_box;
          break;

        case 'sitting':
        case 'idle':
        default: {
          // Check special item variant when stationary
          if (animal.variant === 1) {
            img = this.variants.baby;
          } else if (animal.variant === 2) {
            img = this.variants.carrot;
          } else if (animal.variant === 3) {
            img = this.variants.flower;
          } else if (animal.variant === 4) {
            img = this.variants.berry;
          } else if (animal.variant === 5) {
            img = this.poses.in_box;
          } else if (animal.facing === 'front') {
            img = this.views.front;
          } else if (animal.facing === 'back') {
            img = this.views.back;
          } else if (animal.facing === 'left') {
            img = this.views.left;
          } else {
            // Classic sitting or 3/4 right view
            img = animal.variant % 2 === 0 ? this.poses.sitting : this.views.right;
          }
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) {
      img = this.poses.sitting;
      if (!img || !img.complete || img.naturalWidth === 0) return null;
    }

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const groundY = 2;

    // 1. Drop shadow on grass
    ctx.save();
    ctx.fillStyle = 'rgba(38, 32, 27, 0.22)';
    const shadowScale = isJumpingState ? Math.max(0.6, 1 - jumpLift / 25) : 1;
    ctx.beginPath();
    ctx.ellipse(
      animal.x,
      animal.y + groundY,
      Math.max(5, (drawW * 0.35) * shadowScale),
      Math.max(2.5, 4 * shadowScale),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 2. Fleeing / Running Dust Puffs
    if (!isDead && (animal.state === 'running' || animal.state === 'fleeing')) {
      ctx.save();
      ctx.fillStyle = 'rgba(235, 230, 210, 0.45)';
      const dustDir = animal.facing === 'left' ? 1 : -1;
      const puffOffset = (animal.animTimer * 16) % 9;
      ctx.beginPath();
      ctx.arc(animal.x + dustDir * (12 + puffOffset), animal.y + groundY - 1, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Rabbit Sprite
    ctx.save();
    ctx.translate(animal.x, animal.y + groundY - jumpLift);

    // Subtle gentle breathing oscillation when sitting / sleeping
    if (!isDead && (animal.state === 'sitting' || animal.state === 'sleeping' || animal.state === 'idle')) {
      const breathe = Math.sin(globalTime * 0.0035 + animal.id.charCodeAt(0)) * 0.015;
      ctx.scale(1, 1 + breathe);
    } else if (isDead) {
      const deathLean = (animal.facing === 'left' ? -1 : 1) * 1.35;
      ctx.rotate(deathLean);
    }

    // Flip horizontally when facing left
    // Note: view_left already faces left, and front/back are symmetrical
    const shouldFlip = animal.facing === 'left' &&
      img !== this.views.left &&
      img !== this.views.front &&
      img !== this.views.back;

    if (shouldFlip) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();

    return groundY - drawH - jumpLift;
  }
}
