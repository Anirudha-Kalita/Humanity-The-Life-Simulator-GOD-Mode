import type { AnimalType, WildlifeAnimal } from '../types/simulation';
import { RabbitSpriteRenderer } from './RabbitSpriteRenderer';

import chickenUrl from '../assets/animals/chicken.png';
import cowUrl from '../assets/animals/cow.png';
import sheepUrl from '../assets/animals/sheep.png';
import dogUrl from '../assets/animals/dog.png';

const ANIMAL_SOURCES: Partial<Record<AnimalType, string>> = {
  chicken: chickenUrl,
  sheep: sheepUrl,
  cow: cowUrl,
  dog: dogUrl
};

const ANIMAL_BASE_SCALE: Partial<Record<AnimalType, number>> = {
  chicken: 0.38,
  sheep: 0.44,
  cow: 0.46,
  dog: 0.4
};

/**
 * Draws the new illustrated wildlife sprites and returns the visual top of the
 * animal (relative to its ground position) so emotes can float above it.
 */
export class AnimalSpriteRenderer {
  private static sprites: Partial<Record<AnimalType, HTMLImageElement>> = {};
  private static initialized = false;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    RabbitSpriteRenderer.init();

    for (const key of Object.keys(ANIMAL_SOURCES) as AnimalType[]) {
      const src = ANIMAL_SOURCES[key];
      if (src) {
        const img = new Image();
        img.src = src;
        this.sprites[key] = img;
      }
    }
  }

  public static draw(
    ctx: CanvasRenderingContext2D,
    animal: WildlifeAnimal,
    globalTime: number
  ): number | null {
    this.init();

    if (animal.type === 'rabbit') {
      return RabbitSpriteRenderer.draw(ctx, animal, globalTime);
    }

    const img = this.sprites[animal.type];
    if (!img || !img.complete || img.naturalWidth === 0) return null;

    const baseScale = ANIMAL_BASE_SCALE[animal.type] || 0.4;
    const scale = baseScale * animal.scale;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    const isDead = animal.isDead || animal.state === 'dead';
    const isMoving = !isDead && (animal.state === 'walking' || animal.state === 'hopping' || animal.state === 'fleeing');
    const isFleeing = !isDead && (animal.state === 'fleeing');
    const isGrazing = !isDead && (animal.state === 'grazing' || animal.state === 'chewing');
    const isSniffing = !isDead && (animal.state === 'sniffing');
    const phase = animal.animTimer * (isFleeing ? 14 : isMoving ? 9 : 4);

    const bob = isDead
      ? 0
      : isMoving
      ? -Math.abs(Math.sin(phase)) * (animal.type === 'chicken' ? 2.8 : animal.type === 'cow' ? 1.2 : 2)
      : Math.sin(globalTime * 0.0025 + animal.animTimer) * 0.5;

    let lean = 0;
    if (isDead) {
      lean = (animal.facing === 'left' ? -1 : 1) * 1.35;
    } else if (isGrazing) {
      lean = Math.sin(globalTime * 0.004 + animal.animTimer) * 0.025;
    } else if (isSniffing) {
      lean = 0.035 + Math.sin(globalTime * 0.008 + animal.animTimer) * 0.02;
    } else if (isFleeing) {
      lean = animal.facing === 'left' ? -0.06 : 0.06;
    }

    const groundY = (animal.type === 'chicken' ? 2 : 3) + (isDead ? 6 : 0);
    const flip = animal.facing === 'left' ? -1 : 1;
    const topOffset = groundY - drawH;

    // Drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(38, 32, 27, 0.24)';
    ctx.beginPath();
    ctx.ellipse(
      animal.x,
      animal.y + 3,
      Math.max(6, drawW * 0.3),
      Math.max(2.8, drawH * 0.09),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Fleeing dust puff
    if (isFleeing) {
      ctx.save();
      ctx.fillStyle = 'rgba(235, 230, 210, 0.45)';
      const dustDir = animal.facing === 'left' ? 1 : -1;
      ctx.beginPath();
      ctx.arc(animal.x + dustDir * (9 + (animal.animTimer * 14) % 8), animal.y + 8, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(animal.x, animal.y + groundY + bob);
    ctx.rotate(lean);
    ctx.scale(flip, 1);

    // Grazing chickens get a tiny head-dip by squashing the whole silhouette
    // around its feet; at this scale it reads as a peck.
    if (animal.type === 'chicken' && isGrazing) {
      const peck = (Math.sin(phase * 1.7) + 1) * 0.5;
      ctx.translate(0, -drawH * 0.12);
      ctx.rotate(peck * 0.055);
      ctx.translate(0, drawH * 0.12);
    }

    ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();

    return topOffset;
  }

  public static getTopOffset(animal: WildlifeAnimal): number {
    if (animal.type === 'rabbit') {
      return RabbitSpriteRenderer.getTopOffset(animal);
    }
    const img = this.sprites[animal.type];
    if (!img || !img.complete || img.naturalWidth === 0) {
      return animal.type === 'cow' ? -34 : animal.type === 'sheep' || animal.type === 'dog' ? -28 : -20;
    }
    const baseScale = ANIMAL_BASE_SCALE[animal.type] || 0.4;
    const scale = baseScale * animal.scale;
    return (animal.type === 'chicken' ? 2 : 3) - img.naturalHeight * scale;
  }
}
