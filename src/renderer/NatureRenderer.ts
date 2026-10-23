import type { World } from '../engine/World';

interface SpriteMeta {
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  category: string;
}

// Vite eager glob import bundles all 71 nature assets into the build
const natureAssetUrls = import.meta.glob('../assets/nature/*.png', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

export class NatureRenderer {
  private static initialized = false;
  private static images: Map<string, HTMLImageElement> = new Map();
  private static metadata: Map<string, SpriteMeta> = new Map();

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Load URL map from glob
    const urlMap = new Map<string, string>();
    for (const [path, url] of Object.entries(natureAssetUrls)) {
      const match = path.match(/\/([^/]+)\.png$/);
      if (match) {
        urlMap.set(match[1], url);
      }
    }

    // Preload image elements for every nature sprite
    const spriteDefs = [
      // Rocks & Pebbles
      { id: 'rock_large_1', w: 140, h: 84, cat: 'rock' },
      { id: 'rock_large_2', w: 110, h: 80, cat: 'rock' },
      { id: 'rock_large_3', w: 104, h: 77, cat: 'rock' },
      { id: 'rock_large_4', w: 103, h: 64, cat: 'rock' },
      { id: 'rock_medium_1', w: 82, h: 47, cat: 'rock' },
      { id: 'rock_medium_2', w: 90, h: 53, cat: 'rock' },
      { id: 'rock_medium_3', w: 65, h: 40, cat: 'rock' },
      { id: 'pebble_1', w: 40, h: 26, cat: 'pebble' },
      { id: 'pebble_2', w: 38, h: 22, cat: 'pebble' },
      { id: 'pebble_3', w: 32, h: 20, cat: 'pebble' },
      { id: 'pebble_4', w: 30, h: 18, cat: 'pebble' },
      { id: 'pebble_5', w: 30, h: 18, cat: 'pebble' },
      { id: 'pebble_6', w: 25, h: 15, cat: 'pebble' },
      { id: 'pebble_7', w: 20, h: 14, cat: 'pebble' },

      // Mushrooms
      { id: 'mushroom_red_1', w: 70, h: 79, cat: 'mushroom' },
      { id: 'mushroom_red_2', w: 45, h: 54, cat: 'mushroom' },
      { id: 'mushroom_red_3', w: 45, h: 47, cat: 'mushroom' },
      { id: 'mushroom_brown_1', w: 80, h: 63, cat: 'mushroom' },
      { id: 'mushroom_chanterelle', w: 75, h: 56, cat: 'mushroom' },
      { id: 'mushroom_brown_small', w: 50, h: 42, cat: 'mushroom' },
      { id: 'mushroom_white', w: 80, h: 65, cat: 'mushroom' },
      { id: 'mushroom_purple', w: 75, h: 60, cat: 'mushroom' },

      // Plants & Small Bushes
      { id: 'bush_leafy', w: 53, h: 61, cat: 'bush' },
      { id: 'bush_grassy', w: 50, h: 57, cat: 'bush' },
      { id: 'plant_daisy', w: 55, h: 77, cat: 'plant' },
      { id: 'bush_berry', w: 55, h: 67, cat: 'bush' },
      { id: 'plant_fern', w: 65, h: 77, cat: 'plant' },
      { id: 'plant_clover', w: 45, h: 57, cat: 'plant' },

      // Leaves
      { id: 'leaf_green', w: 45, h: 70, cat: 'leaf' },
      { id: 'leaf_golden', w: 50, h: 70, cat: 'leaf' },
      { id: 'leaf_oak', w: 45, h: 65, cat: 'leaf' },
      { id: 'leaf_maple', w: 50, h: 70, cat: 'leaf' },
      { id: 'leaf_elm', w: 55, h: 70, cat: 'leaf' },
      { id: 'leaf_willow', w: 36, h: 70, cat: 'leaf' },
      { id: 'leaf_ivy', w: 48, h: 65, cat: 'leaf' },
      { id: 'leaf_fern', w: 55, h: 75, cat: 'leaf' },

      // Flowers
      { id: 'flower_daisy', w: 45, h: 70, cat: 'flower' },
      { id: 'flower_buttercup', w: 45, h: 65, cat: 'flower' },
      { id: 'flower_bluebell', w: 45, h: 70, cat: 'flower' },
      { id: 'flower_clover', w: 45, h: 65, cat: 'flower' },
      { id: 'flower_daisy_small', w: 50, h: 65, cat: 'flower' },

      // Grass
      { id: 'grass_large', w: 95, h: 80, cat: 'grass' },
      { id: 'grass_medium', w: 65, h: 60, cat: 'grass' },
      { id: 'grass_small', w: 45, h: 45, cat: 'grass' },

      // Branches, Logs, Fallen Leaves
      { id: 'branch_leafy', w: 99, h: 74, cat: 'branch' },
      { id: 'branch_medium', w: 65, h: 70, cat: 'branch' },
      { id: 'branch_stick', w: 65, h: 62, cat: 'branch' },
      { id: 'branch_twig', w: 40, h: 39, cat: 'branch' },
      { id: 'branch_small', w: 38, h: 28, cat: 'branch' },
      { id: 'log_mossy', w: 100, h: 65, cat: 'log' },
      { id: 'log_cut', w: 70, h: 50, cat: 'log' },
      { id: 'log_slice', w: 40, h: 30, cat: 'log' },
      { id: 'stump_mossy', w: 50, h: 35, cat: 'stump' },
      { id: 'stump_small', w: 40, h: 29, cat: 'stump' },
      { id: 'leaves_pile_large', w: 135, h: 65, cat: 'leaves_pile' },
      { id: 'leaves_pile_medium', w: 80, h: 40, cat: 'leaves_pile' },
      { id: 'leaves_scatter', w: 50, h: 30, cat: 'leaves_pile' },

      // Moss, Ferns, Tall Grass, Misc
      { id: 'moss_rock_large', w: 120, h: 75, cat: 'moss' },
      { id: 'moss_rock_medium', w: 75, h: 50, cat: 'moss' },
      { id: 'moss_mound', w: 48, h: 35, cat: 'moss' },
      { id: 'fern_large', w: 85, h: 80, cat: 'fern' },
      { id: 'fern_medium', w: 50, h: 55, cat: 'fern' },
      { id: 'fern_small', w: 40, h: 35, cat: 'fern' },
      { id: 'tall_grass_large', w: 66, h: 90, cat: 'tall_grass' },
      { id: 'tall_grass_medium', w: 55, h: 58, cat: 'tall_grass' },
      { id: 'tall_grass_small', w: 30, h: 31, cat: 'tall_grass' },
      { id: 'pinecone', w: 40, h: 50, cat: 'misc' },
      { id: 'sapling_pine', w: 50, h: 57, cat: 'misc' },
      { id: 'feather', w: 55, h: 72, cat: 'misc' },
      { id: 'pebble_cluster', w: 45, h: 38, cat: 'misc' },
      { id: 'acorn', w: 23, h: 28, cat: 'misc' }
    ];

    for (const d of spriteDefs) {
      this.metadata.set(d.id, {
        width: d.w,
        height: d.h,
        anchorX: d.w * 0.5,
        anchorY: d.h - 1,
        category: d.cat
      });

      const img = new Image();
      const bundledUrl = urlMap.get(d.id);
      img.onerror = () => {
        img.src = `/assets/nature/${d.id}.png`;
      };
      img.src = bundledUrl || `/assets/nature/${d.id}.png`;
      this.images.set(d.id, img);
    }
  }

  /**
   * Renders all visible nature elements with viewport culling, drop shadows,
   * and organic wind sway animation for vegetation.
   */
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

    // Viewport frustum culling with safety padding
    const halfW = (canvasW / zoom) * 0.5 + 90;
    const halfH = (canvasH / zoom) * 0.5 + 90;
    const minX = cameraX - halfW;
    const maxX = cameraX + halfW;
    const minY = cameraY - halfH;
    const maxY = cameraY + halfH;

    for (const el of world.natureElements) {
      if (el.x < minX || el.x > maxX || el.y < minY || el.y > maxY) {
        continue;
      }

      const img = this.images.get(el.type);
      const meta = this.metadata.get(el.type);
      if (!img || !meta || (!img.complete && img.naturalWidth === 0)) {
        continue;
      }

      const scale = el.scale ?? 0.65;
      const w = meta.width * scale;
      const h = meta.height * scale;
      const anchorX = meta.anchorX * scale;
      const anchorY = meta.anchorY * scale;

      ctx.save();
      ctx.translate(el.x, el.y);

      if (el.flipX) {
        ctx.scale(-1, 1);
      }

      // 1. Drop shadow for solid objects (rocks, stumps, logs, bushes, mushrooms)
      if (
        meta.category === 'rock' ||
        meta.category === 'log' ||
        meta.category === 'stump' ||
        meta.category === 'moss' ||
        meta.category === 'bush' ||
        meta.category === 'mushroom'
      ) {
        ctx.fillStyle = 'rgba(28, 22, 16, 0.26)';
        ctx.beginPath();
        ctx.ellipse(0, 2, w * 0.42, Math.max(3, h * 0.16), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Gentle wind sway for foliage, grass, ferns, and flowers
      if (
        meta.category === 'tall_grass' ||
        meta.category === 'grass' ||
        meta.category === 'fern' ||
        meta.category === 'flower' ||
        meta.category === 'plant'
      ) {
        const windSway = Math.sin(globalTime * 0.0022 + el.x * 0.04 + el.y * 0.02) * 0.04;
        ctx.transform(1, 0, windSway, 1, 0, 0);
      }

      // 3. Draw illustrated nature sprite
      ctx.drawImage(img, -anchorX, -anchorY, w, h);

      ctx.restore();
    }
  }
}
