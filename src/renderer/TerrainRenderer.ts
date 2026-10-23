import type { World } from '../engine/World';

// Seamless Land & Ground Textures (Zero-seam tileable patterns)
import seamlessGrassUrl from '../assets/tiles/seamless_grass.png';
import seamlessDirtUrl from '../assets/tiles/seamless_dirt.png';
import seamlessSandUrl from '../assets/tiles/seamless_sand.png';
import seamlessFlagstoneUrl from '../assets/tiles/seamless_flagstone.png';
import seamlessCobbleUrl from '../assets/tiles/seamless_cobble.png';
import seamlessCrackedUrl from '../assets/tiles/seamless_cracked.png';

// Borderless Nature & Environmental Decals (Transparent, no tile boundaries)
import decalFlowersWhiteUrl from '../assets/tiles/decal_flowers_white.png';
import decalFlowersYellowUrl from '../assets/tiles/decal_flowers_yellow.png';
import decalFlowersWhiteWideUrl from '../assets/tiles/decal_flowers_white_wide.png';
import decalFlowersYellowWideUrl from '../assets/tiles/decal_flowers_yellow_wide.png';
import decalCloverUrl from '../assets/tiles/decal_clover.png';
import decalPebblesUrl from '../assets/tiles/decal_pebbles.png';
import decalPebblesWideUrl from '../assets/tiles/decal_pebbles_wide.png';
import decalTuftUrl from '../assets/tiles/decal_tuft.png';
import decalMudPuddleUrl from '../assets/tiles/decal_mud_puddle.png';

export class TerrainRenderer {
  private static images: Record<string, HTMLImageElement> = {};
  private static initialized = false;
  private static loadedCount = 0;
  private static requiredCount = 6; // Core seamless textures

  // Patterns
  private static grassPattern: CanvasPattern | null = null;
  private static dirtPattern: CanvasPattern | null = null;
  private static sandPattern: CanvasPattern | null = null;
  private static flagstonePattern: CanvasPattern | null = null;
  private static cobblePattern: CanvasPattern | null = null;
  private static crackedPattern: CanvasPattern | null = null;

  // Cached composite offscreen canvas for 60 FPS performance
  private static offscreenCanvas: HTMLCanvasElement | null = null;
  private static offscreenCtx: CanvasRenderingContext2D | null = null;
  private static isBaked = false;
  private static lastRoadsHash = '';
  private static lastBuildingsCount = 0;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const sources: Record<string, string> = {
      // Seamless surface patterns
      seamless_grass: seamlessGrassUrl,
      seamless_dirt: seamlessDirtUrl,
      seamless_sand: seamlessSandUrl,
      seamless_flagstone: seamlessFlagstoneUrl,
      seamless_cobble: seamlessCobbleUrl,
      seamless_cracked: seamlessCrackedUrl,

      // Borderless transparent decals
      decal_flowers_white: decalFlowersWhiteUrl,
      decal_flowers_yellow: decalFlowersYellowUrl,
      decal_flowers_white_wide: decalFlowersWhiteWideUrl,
      decal_flowers_yellow_wide: decalFlowersYellowWideUrl,
      decal_clover: decalCloverUrl,
      decal_pebbles: decalPebblesUrl,
      decal_pebbles_wide: decalPebblesWideUrl,
      decal_tuft: decalTuftUrl,
      decal_mud_puddle: decalMudPuddleUrl
    };

    for (const key of Object.keys(sources)) {
      const img = new Image();
      img.src = sources[key];
      img.onload = () => {
        this.loadedCount++;
        if (this.loadedCount >= this.requiredCount) {
          this.isBaked = false;
        }
      };
      this.images[key] = img;
    }
  }

  public static invalidate(): void {
    this.isBaked = false;
  }

  public static draw(
    ctx: CanvasRenderingContext2D,
    world: World,
    cameraX: number,
    cameraY: number,
    zoom: number,
    viewW: number,
    viewH: number
  ): void {
    try {
      this.init();

      // Check if roads or buildings count changed dynamically
      const roadsHash = `${world.roads.length}_${world.roads.map(r => r.id).join('_')}`;
      if (roadsHash !== this.lastRoadsHash || world.buildings.length !== this.lastBuildingsCount) {
        this.lastRoadsHash = roadsHash;
        this.lastBuildingsCount = world.buildings.length;
        this.isBaked = false;
      }

      if (!this.isBaked && this.loadedCount >= 4) {
        this.bake(world);
      }

      if (this.offscreenCanvas && this.isBaked) {
        const safeZoom = Math.max(0.1, zoom);
        const halfW = (viewW / safeZoom) / 2;
        const halfH = (viewH / safeZoom) / 2;
        const startX = Math.max(0, Math.floor(cameraX - halfW));
        const startY = Math.max(0, Math.floor(cameraY - halfH));
        const endX = Math.min(world.width, Math.ceil(cameraX + halfW));
        const endY = Math.min(world.height, Math.ceil(cameraY + halfH));
        const w = Math.max(0, endX - startX);
        const h = Math.max(0, endY - startY);

        if (w > 0 && h > 0) {
          ctx.drawImage(this.offscreenCanvas, startX, startY, w, h, startX, startY, w, h);
        }
      } else {
        // High quality procedural continuous fallback while assets finish loading
        this.drawUnifiedFallback(ctx, world);
      }
    } catch {
      this.drawUnifiedFallback(ctx, world);
    }
  }

  /**
   * Bakes the unified, seamless, boundary-free landscape onto the offscreen canvas.
   */
  private static bake(world: World): void {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = world.width;
      this.offscreenCanvas.height = world.height;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    const ctx = this.offscreenCtx;
    if (!ctx) return;

    // Create Canvas Patterns from loaded textures
    this.createPatterns(ctx);

    ctx.clearRect(0, 0, world.width, world.height);

    // 1. One Single Unbroken Seamless Green Grassland across the entire world (Zero boundaries!)
    this.bakeSeamlessGrassland(ctx, world);

    // 2. Soft Ambient Environmental Lighting & Biome Tonal Blends
    this.bakeBiomeAtmosphere(ctx, world);

    // 3. Continuous Sandy Shorelines along Riverbanks (Soft organic curves, no square boxes)
    this.bakeSandyRiverbanks(ctx, world);

    // 4. Thematic Non-Grass Plazas, Yards, and Working Grounds (Unified shapes with soft edges)
    this.bakeVillagePlazasAndYards(ctx, world);

    // 5. Village Roads & Trails Network (Continuous smooth curved trails, no tile stamps)
    this.bakeRoadsNetwork(ctx, world);

    // 6. Borderless Organic Nature Decals (Wild daisies, buttercups, clovers, reeds, and pebbles)
    this.bakeNatureDecals(ctx, world);

    this.isBaked = true;
  }

  /**
   * Initializes CanvasPatterns for seamless infinite tiling with zero seams.
   */
  private static createPatterns(ctx: CanvasRenderingContext2D): void {
    const grassImg = this.images['seamless_grass'];
    if (grassImg && grassImg.complete && grassImg.naturalWidth > 0 && !this.grassPattern) {
      this.grassPattern = ctx.createPattern(grassImg, 'repeat');
    }

    const dirtImg = this.images['seamless_dirt'];
    if (dirtImg && dirtImg.complete && dirtImg.naturalWidth > 0 && !this.dirtPattern) {
      this.dirtPattern = ctx.createPattern(dirtImg, 'repeat');
    }

    const sandImg = this.images['seamless_sand'];
    if (sandImg && sandImg.complete && sandImg.naturalWidth > 0 && !this.sandPattern) {
      this.sandPattern = ctx.createPattern(sandImg, 'repeat');
    }

    const flagImg = this.images['seamless_flagstone'];
    if (flagImg && flagImg.complete && flagImg.naturalWidth > 0 && !this.flagstonePattern) {
      this.flagstonePattern = ctx.createPattern(flagImg, 'repeat');
    }

    const cobbleImg = this.images['seamless_cobble'];
    if (cobbleImg && cobbleImg.complete && cobbleImg.naturalWidth > 0 && !this.cobblePattern) {
      this.cobblePattern = ctx.createPattern(cobbleImg, 'repeat');
    }

    const crackedImg = this.images['seamless_cracked'];
    if (crackedImg && crackedImg.complete && crackedImg.naturalWidth > 0 && !this.crackedPattern) {
      this.crackedPattern = ctx.createPattern(crackedImg, 'repeat');
    }
  }

  /**
   * 1. Paints one continuous, seamless green grass field across the entire 2800x1800 map.
   * Completely eliminates all tile borders, honeycomb grids, and dark boundary lines.
   */
  private static bakeSeamlessGrassland(ctx: CanvasRenderingContext2D, world: World): void {
    // Base vibrant spring lawn color matching reference palette
    ctx.fillStyle = '#7ac033';
    ctx.fillRect(0, 0, world.width, world.height);

    // Overlay seamless micro-texture from the user's tiles
    if (this.grassPattern) {
      ctx.save();
      ctx.fillStyle = this.grassPattern;
      ctx.fillRect(0, 0, world.width, world.height);
      ctx.restore();
    }
  }

  /**
   * 2. Soft rolling environmental gradients that give painterly depth without ANY hard edges.
   */
  private static bakeBiomeAtmosphere(ctx: CanvasRenderingContext2D, world: World): void {
    ctx.save();

    // Warm sunlit village square meadow halo
    const sunGlow = ctx.createRadialGradient(1150, 850, 60, 1150, 850, 650);
    sunGlow.addColorStop(0, 'rgba(255, 245, 170, 0.10)');
    sunGlow.addColorStop(0.5, 'rgba(230, 240, 140, 0.05)');
    sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(500, 200, 1300, 1300);

    // Deep lush emerald grove in the South-East Wildlife Sanctuary
    const sanctuaryGlow = ctx.createRadialGradient(2150, 1450, 100, 2150, 1450, 550);
    sanctuaryGlow.addColorStop(0, 'rgba(34, 115, 34, 0.16)');
    sanctuaryGlow.addColorStop(0.65, 'rgba(40, 120, 40, 0.08)');
    sanctuaryGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sanctuaryGlow;
    ctx.fillRect(1600, 900, 1100, 900);

    // Cool moist river valley breeze along the water channel
    for (let y = 0; y < world.height; y += 200) {
      const rc = world.getRiverCenterX(y);
      const riverGlow = ctx.createRadialGradient(rc, y, 40, rc, y, 220);
      riverGlow.addColorStop(0, 'rgba(30, 130, 90, 0.12)');
      riverGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = riverGlow;
      ctx.fillRect(rc - 220, y - 100, 440, 200);
    }

    ctx.restore();
  }

  /**
   * 3. Continuous winding sandy beach shorelines along the riverbanks.
   * Completely borderless: smoothly follows river curves and dissolves naturally into grass.
   */
  private static bakeSandyRiverbanks(ctx: CanvasRenderingContext2D, world: World): void {
    ctx.save();

    // Build smooth continuous path for West Riverbank Shore
    ctx.beginPath();
    for (let y = -20; y <= world.height + 20; y += 30) {
      const rc = world.getRiverCenterX(y);
      const x = rc - 85;
      if (y === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(212, 179, 120, 0.35)';
    ctx.stroke();

    ctx.lineWidth = 26;
    ctx.strokeStyle = this.sandPattern || '#dfc38a';
    ctx.stroke();

    // Build smooth continuous path for East Riverbank Shore
    ctx.beginPath();
    for (let y = -20; y <= world.height + 20; y += 30) {
      const rc = world.getRiverCenterX(y);
      const x = rc + 85;
      if (y === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(212, 179, 120, 0.35)';
    ctx.stroke();

    ctx.lineWidth = 26;
    ctx.strokeStyle = this.sandPattern || '#dfc38a';
    ctx.stroke();

    // South-East river mouth beach cove (smooth organic sand curve)
    const beachGrad = ctx.createRadialGradient(1680, 1600, 30, 1680, 1600, 140);
    beachGrad.addColorStop(0, '#e5cca0');
    beachGrad.addColorStop(0.7, '#dfc38a');
    beachGrad.addColorStop(1, 'rgba(223, 195, 138, 0)');
    ctx.fillStyle = beachGrad;
    ctx.beginPath();
    ctx.ellipse(1680, 1600, 135, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 4. Thematic "No Grass Land" village plazas, courtyards, and working yards.
   * Rendered as continuous organic areas with rounded corners and soft perimeter blending.
   */
  private static bakeVillagePlazasAndYards(ctx: CanvasRenderingContext2D, world: World): void {
    ctx.save();

    // 1. Central Village Square & Plaza (Around Bonfire: x: 1010 to 1290, y: 740 to 930)
    // Seamless stone flagstone surface with softened border
    const pX = 1010;
    const pY = 740;
    const pW = 280;
    const pH = 190;
    const radius = 24;

    // Soft outer earth border transition
    ctx.fillStyle = 'rgba(120, 95, 60, 0.28)';
    ctx.beginPath();
    ctx.roundRect(pX - 6, pY - 6, pW + 12, pH + 12, radius + 4);
    ctx.fill();

    // Main paved stone plaza
    ctx.fillStyle = this.flagstonePattern || '#a89882';
    ctx.beginPath();
    ctx.roundRect(pX, pY, pW, pH, radius);
    ctx.fill();

    // Soft rustic border stroke
    ctx.strokeStyle = 'rgba(70, 55, 38, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Scorched cracked earth ring around central bonfire pit (x: 1150, y: 850)
    const burnGrad = ctx.createRadialGradient(1150, 850, 15, 1150, 850, 75);
    burnGrad.addColorStop(0, '#443224');
    burnGrad.addColorStop(0.45, '#5c4632');
    burnGrad.addColorStop(0.85, 'rgba(92, 70, 50, 0.55)');
    burnGrad.addColorStop(1, 'rgba(92, 70, 50, 0)');
    ctx.fillStyle = burnGrad;
    ctx.beginPath();
    ctx.arc(1150, 850, 75, 0, Math.PI * 2);
    ctx.fill();

    if (this.crackedPattern) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = this.crackedPattern;
      ctx.beginPath();
      ctx.arc(1150, 850, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Grand Timber Storehouse Loading Yard (x: 910 to 1210, y: 460 to 580)
    // Continuous packed loam earth with soft edges
    const sX = 910;
    const sY = 460;
    const sW = 300;
    const sH = 120;

    ctx.fillStyle = 'rgba(105, 75, 42, 0.22)';
    ctx.beginPath();
    ctx.roundRect(sX - 8, sY - 6, sW + 16, sH + 12, 18);
    ctx.fill();

    ctx.fillStyle = this.dirtPattern || '#855d36';
    ctx.beginPath();
    ctx.roundRect(sX, sY, sW, sH, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(90, 62, 32, 0.30)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Communal Hearth & Dining Veranda (x: 660 to 920, y: 660 to 790)
    // Mossy cobblestone courtyard with wooden feast tables
    const hX = 660;
    const hY = 660;
    const hW = 260;
    const hH = 130;

    ctx.fillStyle = 'rgba(80, 85, 70, 0.22)';
    ctx.beginPath();
    ctx.roundRect(hX - 6, hY - 6, hW + 12, hH + 12, 20);
    ctx.fill();

    ctx.fillStyle = this.cobblePattern || '#7a766c';
    ctx.beginPath();
    ctx.roundRect(hX, hY, hW, hH, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(50, 55, 45, 0.32)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Woodcutter Camp Clearing (x: 230 to 430, y: 230 to 370)
    // Sawdust and earthy dirt ground
    const wX = 230;
    const wY = 230;
    const wW = 200;
    const wH = 140;

    ctx.fillStyle = 'rgba(140, 100, 55, 0.18)';
    ctx.beginPath();
    ctx.roundRect(wX - 8, wY - 8, wW + 16, wH + 16, 22);
    ctx.fill();

    ctx.fillStyle = this.dirtPattern || '#8b643a';
    ctx.beginPath();
    ctx.roundRect(wX, wY, wW, wH, 16);
    ctx.fill();

    // 5. Southern Farm & Berry Orchard Working Grounds (x: 550 to 760, y: 980 to 1180)
    // Organic rich soil beds with occasional damp puddles
    const farmBeds = [
      { x: 560, y: 1000, w: 90, h: 50 },
      { x: 670, y: 1020, w: 85, h: 48 },
      { x: 580, y: 1090, w: 95, h: 52 },
      { x: 680, y: 1110, w: 80, h: 46 }
    ];

    for (const bed of farmBeds) {
      ctx.fillStyle = 'rgba(95, 68, 38, 0.25)';
      ctx.beginPath();
      ctx.roundRect(bed.x - 4, bed.y - 4, bed.w + 8, bed.h + 8, 12);
      ctx.fill();

      ctx.fillStyle = this.dirtPattern || '#784d28';
      ctx.beginPath();
      ctx.roundRect(bed.x, bed.y, bed.w, bed.h, 8);
      ctx.fill();
    }

    // Mud puddle decal in orchard
    const mudDecal = this.images['decal_mud_puddle'];
    if (mudDecal && mudDecal.complete && mudDecal.naturalWidth > 0) {
      ctx.drawImage(mudDecal, 605, 1095, 48, 38);
      ctx.drawImage(mudDecal, 690, 1030, 42, 34);
    }

    // 6. Doorstep Cobblestone Aprons for settlement buildings
    for (const b of world.buildings) {
      const doorX = b.door.x;
      const doorY = b.door.y;
      ctx.fillStyle = this.cobblePattern || '#8c8275';
      ctx.beginPath();
      ctx.roundRect(doorX - 28, doorY - 8, 56, 26, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60, 50, 40, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // 7. Bridge Approach Cobblestone Aprons
    for (const b of world.bridges) {
      const bridgeEntryX = world.getRiverCenterX(b.centerY);
      ctx.fillStyle = this.cobblePattern || '#8c8275';

      // West bridge landing
      ctx.beginPath();
      ctx.roundRect(bridgeEntryX - 110, b.y + 10, 60, 50, 8);
      ctx.fill();

      // East bridge landing
      ctx.beginPath();
      ctx.roundRect(bridgeEntryX + 50, b.y + 10, 60, 50, 8);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 5. Village Roads & Trails Network.
   * Rendered as smooth, continuous, curving trails with soft natural edges.
   * Zero rectangular tile stamps or harsh seams!
   */
  private static bakeRoadsNetwork(ctx: CanvasRenderingContext2D, world: World): void {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Broad soft dirt road base
    for (const road of world.roads) {
      const isCentralTrunk = road.id.includes('square') || road.id.includes('trunk');
      const isRiverRoad = road.id.includes('bridge');

      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      if (road.controlPoint) {
        ctx.quadraticCurveTo(road.controlPoint.x, road.controlPoint.y, road.x2, road.y2);
      } else {
        ctx.lineTo(road.x2, road.y2);
      }

      ctx.lineWidth = isCentralTrunk ? 38 : 30;
      ctx.strokeStyle = isCentralTrunk ? '#8c6840' : (isRiverRoad ? '#c7a36b' : '#946d42');
      ctx.stroke();
    }

    // 2. Center worn travel trail
    for (const road of world.roads) {
      const isCentralTrunk = road.id.includes('square') || road.id.includes('trunk');
      const isRiverRoad = road.id.includes('bridge');

      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      if (road.controlPoint) {
        ctx.quadraticCurveTo(road.controlPoint.x, road.controlPoint.y, road.x2, road.y2);
      } else {
        ctx.lineTo(road.x2, road.y2);
      }

      ctx.lineWidth = isCentralTrunk ? 24 : 18;
      ctx.strokeStyle = isCentralTrunk ? '#be9868' : (isRiverRoad ? '#e4caa0' : '#b38c5d');
      ctx.stroke();
    }

    // 3. Subtle inner wheel-rut / foot-track highlights
    for (const road of world.roads) {
      const isCentralTrunk = road.id.includes('square') || road.id.includes('trunk');
      if (!isCentralTrunk) continue;

      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      if (road.controlPoint) {
        ctx.quadraticCurveTo(road.controlPoint.x, road.controlPoint.y, road.x2, road.y2);
      } else {
        ctx.lineTo(road.x2, road.y2);
      }

      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(235, 218, 185, 0.45)';
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 6. Organic Borderless Nature Decals (Wild daisies, yellow buttercups, 4-leaf clovers, river reeds, pebbles).
   * Rendered with transparent backgrounds directly on the seamless grass—ZERO boundaries!
   */
  private static bakeNatureDecals(ctx: CanvasRenderingContext2D, world: World): void {
    const fWhite = this.images['decal_flowers_white'];
    const fYellow = this.images['decal_flowers_yellow'];
    const fWhiteWide = this.images['decal_flowers_white_wide'];
    const fYellowWide = this.images['decal_flowers_yellow_wide'];
    const clover = this.images['decal_clover'];
    const pebbles = this.images['decal_pebbles'];
    const pebblesWide = this.images['decal_pebbles_wide'];
    const tuft = this.images['decal_tuft'];

    // Deterministic organic distribution across the natural landscape
    const stepX = 140;
    const stepY = 110;

    for (let y = 60; y < world.height - 60; y += stepY) {
      for (let x = 60; x < world.width - 60; x += stepX) {
        // Pseudo-random position jitter
        const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
        const posX = x + (rand - 0.5) * 80;
        const posY = y + ((seed * 9.123) % 1 - 0.5) * 60;

        // Never draw flowers inside the river channel
        const rc = world.getRiverCenterX(posY);
        if (Math.abs(posX - rc) < 70) continue;

        // Never draw flowers inside the stone plaza, bonfire, or storehouse yard
        const isPlaza = posX >= 990 && posX <= 1290 && posY >= 730 && posY <= 940;
        const isStorehouse = posX >= 900 && posX <= 1210 && posY >= 450 && posY <= 590;
        const isHearth = posX >= 650 && posX <= 930 && posY >= 650 && posY <= 800;
        if (isPlaza || isStorehouse || isHearth) continue;

        const isSanctuary = posX > 1700 && posY > 1150;
        const isRiverEdge = Math.abs(posX - rc) < 130;
        const isCliffFoot = posY >= 315 && posY <= 355;
        const isCottageGarden = (posX >= 460 && posX <= 860 && posY >= 470 && posY <= 710) ||
                                (posX >= 1900 && posX <= 2180 && posY >= 440 && posY <= 650);

        let decal: HTMLImageElement | null = null;
        let scale = 0.85;

        if (isSanctuary) {
          // Lush clover glade for wildlife
          if (rand < 0.40) decal = clover;
          else if (rand < 0.60) decal = fYellow;
          else if (rand < 0.80) decal = fWhite;
          else decal = tuft;
          scale = 0.90;
        } else if (isRiverEdge) {
          // Reeds, water-pebbles, and buttercups
          if (rand < 0.45) decal = tuft;
          else if (rand < 0.75) decal = pebbles;
          else decal = fYellow;
          scale = 0.85;
        } else if (isCliffFoot) {
          // Rocky pebbles at the foot of the sandstone cliffs
          if (rand < 0.50) decal = pebbles;
          else if (rand < 0.75) decal = pebblesWide || pebbles;
          else decal = tuft;
          scale = 0.85;
        } else if (isCottageGarden) {
          // Cheerful cottage flowerbeds
          if (rand < 0.35) decal = fWhiteWide || fWhite;
          else if (rand < 0.65) decal = fYellowWide || fYellow;
          else if (rand < 0.85) decal = fWhite;
          else decal = clover;
          scale = 0.90;
        } else {
          // Open pastoral meadows: scattered daisies, buttercups, and clover
          if (rand < 0.15) decal = fWhite;
          else if (rand < 0.28) decal = fYellow;
          else if (rand < 0.40) decal = clover;
          else if (rand < 0.48) decal = tuft;
        }

        if (decal && decal.complete && decal.naturalWidth > 0) {
          const dw = decal.naturalWidth * scale;
          const dh = decal.naturalHeight * scale;
          ctx.drawImage(decal, posX - dw / 2, posY - dh / 2, dw, dh);
        }
      }
    }
  }

  /**
   * Clean procedural continuous fallback with zero boundaries.
   */
  private static drawUnifiedFallback(ctx: CanvasRenderingContext2D, world: World): void {
    ctx.fillStyle = '#7ac033';
    ctx.fillRect(0, 0, world.width, world.height);

    for (const road of world.roads) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#946d42';
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      if (road.controlPoint) {
        ctx.quadraticCurveTo(road.controlPoint.x, road.controlPoint.y, road.x2, road.y2);
      } else {
        ctx.lineTo(road.x2, road.y2);
      }
      ctx.stroke();

      ctx.strokeStyle = '#be9868';
      ctx.lineWidth = 20;
      ctx.stroke();
      ctx.restore();
    }
  }
}
