import { Simulation } from '../engine/Simulation';
import { Agent } from '../engine/Agent';
import { SpriteRenderer } from './SpriteRenderer';
import { BubbleRenderer } from './BubbleRenderer';
import { TreeRenderer } from './TreeRenderer';
import { BuildingRenderer } from './BuildingRenderer';
import { InteriorRenderer } from './InteriorRenderer';
import { NpcSpriteRenderer } from './NpcSpriteRenderer';
import { AnimalSpriteRenderer } from './AnimalSpriteRenderer';
import { CaravanRenderer } from './CaravanRenderer';
import { BushRenderer } from './BushRenderer';
import { BonfireRenderer } from './BonfireRenderer';
import { TerrainRenderer } from './TerrainRenderer';
import { RiverRenderer } from './RiverRenderer';
import { NatureRenderer } from './NatureRenderer';
import { PondRenderer } from './PondRenderer';
import type { InteriorKey } from './InteriorRenderer';
import type { Building, WorldItem, AgentData, ForestTree, BerryBush, WildlifeAnimal } from '../types/simulation';

const INTERIOR_MIN_ZOOM = 1.42;
// People size is decreased by 20% when inside a house cutaway room
const INTERIOR_PEOPLE_SCALE = 0.80;

// Where settlers stand/sleep inside each cutaway room, as a fraction of the
// room sprite's width and height.
const INTERIOR_SLOTS: Record<InteriorKey, { x: number; y: number }[]> = {
  residential: [
    { x: 0.39, y: 0.48 },
    { x: 0.54, y: 0.54 },
    { x: 0.45, y: 0.62 },
    { x: 0.62, y: 0.47 },
    { x: 0.34, y: 0.58 },
    { x: 0.57, y: 0.64 }
  ],
  cookhouse: [
    { x: 0.37, y: 0.56 },
    { x: 0.58, y: 0.53 },
    { x: 0.50, y: 0.67 },
    { x: 0.30, y: 0.63 },
    { x: 0.68, y: 0.60 },
    { x: 0.47, y: 0.43 }
  ],
  storage: [
    { x: 0.45, y: 0.56 },
    { x: 0.59, y: 0.64 },
    { x: 0.35, y: 0.63 },
    { x: 0.52, y: 0.47 },
    { x: 0.64, y: 0.54 }
  ],
  townhall: [
    { x: 0.40, y: 0.58 },
    { x: 0.57, y: 0.55 },
    { x: 0.50, y: 0.67 },
    { x: 0.34, y: 0.62 },
    { x: 0.63, y: 0.62 }
  ]
};

export class CanvasRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public sim: Simulation;

  // Camera
  public cameraX = 1150;
  public cameraY = 850;
  public zoom = 0.95;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private isMouseDown = false;
  private mouseDownClientX = 0;
  private mouseDownClientY = 0;
  private hasDragged = false;

  public mouseWorldX = 0;
  public mouseWorldY = 0;

  // Hovered tree for removal
  private hoveredTreeId: string | null = null;

  // House whose cutaway interior is currently open (camera-centred + zoomed in)
  private activeInteriorBuildingId: string | null = null;

  // Rain particles
  private rainDrops: { x: number; y: number; speed: number; length: number }[] = [];

  constructor(canvas: HTMLCanvasElement, sim: Simulation) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.sim = sim;

    TerrainRenderer.init();
    this.initRain();
    this.setupEventListeners();
  }

  private initRain(): void {
    for (let i = 0; i < 350; i++) {
      this.rainDrops.push({
        x: Math.random() * 3000,
        y: Math.random() * 2000,
        speed: 460 + Math.random() * 240,
        length: 12 + Math.random() * 8
      });
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.canvas.addEventListener('mousedown', (e) => {
      // Minimap check (bottom right)
      const miniW = 180;
      const miniH = miniW * (this.sim.world.height / this.sim.world.width);
      const miniX = this.canvas.width - miniW - 16;
      const miniY = this.canvas.height - miniH - 16;

      if (
        e.clientX >= miniX && e.clientX <= miniX + miniW &&
        e.clientY >= miniY && e.clientY <= miniY + miniH
      ) {
        const rx = (e.clientX - miniX) / miniW;
        const ry = (e.clientY - miniY) / miniH;
        this.cameraX = rx * this.sim.world.width;
        this.cameraY = ry * this.sim.world.height;
        return;
      }

      this.isMouseDown = true;
      this.mouseDownClientX = e.clientX;
      this.mouseDownClientY = e.clientY;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.hasDragged = false;

      // Middle or right click immediately activates pan drag
      if (e.button === 1 || e.button === 2) {
        this.isDragging = true;
        this.hasDragged = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      const wPos = this.screenToWorld(e.clientX, e.clientY);
      this.mouseWorldX = wPos.x;
      this.mouseWorldY = wPos.y;

      if (this.sim.activeGodPower === 'remove_tree') {
        const hTree = this.sim.getTreeAt(wPos.x, wPos.y);
        this.hoveredTreeId = hTree ? hTree.id : null;
      } else {
        this.hoveredTreeId = null;
      }

      if (this.isMouseDown && !this.isDragging) {
        const dist = Math.hypot(e.clientX - this.mouseDownClientX, e.clientY - this.mouseDownClientY);
        if (dist > 5) {
          this.isDragging = true;
          this.hasDragged = true;
        }
      }

      if (this.isDragging) {
        const dx = (e.clientX - this.dragStartX) / this.zoom;
        const dy = (e.clientY - this.dragStartY) / this.zoom;
        this.cameraX -= dx;
        this.cameraY -= dy;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        this.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, this.cameraX));
        this.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, this.cameraY));
      }
    });

    window.addEventListener('mouseup', (e) => {
      const wasDragging = this.isDragging || this.hasDragged;
      this.isDragging = false;
      this.isMouseDown = false;

      // If the player moved the mouse to pan the camera, do not trigger entity clicks!
      if (wasDragging) {
        return;
      }

      if (e.button === 0 && e.target === this.canvas) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        const interiorAgent = this.getInteriorAgentAt(worldPos.x, worldPos.y);
        const activeInteriorBuilding = this.getActiveInteriorBuildingAt(worldPos.x, worldPos.y);
        const rawAgent = !activeInteriorBuilding ? this.sim.getAgentAt(worldPos.x, worldPos.y) : null;
        const clickedAgent = interiorAgent || (rawAgent && !this.isEntityBehindAnyBuilding(rawAgent.data.x, rawAgent.data.y) ? rawAgent : null);
        const rawAnimal = !activeInteriorBuilding ? this.sim.getAnimalAt(worldPos.x, worldPos.y, 36) : null;
        const clickedAnimal = rawAnimal && !this.isEntityBehindAnyBuilding(rawAnimal.x, rawAnimal.y) ? rawAnimal : null;

        if (this.sim.activeGodPower !== 'none') {
          this.sim.executeGodPower(worldPos.x, worldPos.y, clickedAgent || undefined, clickedAnimal || undefined);
          return;
        }

        if (clickedAgent) {
          this.sim.selectedAgent = clickedAgent;
          this.sim.selectedBuilding = null;
          this.sim.selectedTree = null;
          this.sim.selectedBonfire = false;
        } else {
          const clickedBuilding = activeInteriorBuilding || this.sim.getBuildingAt(worldPos.x, worldPos.y);
          if (clickedBuilding) {
            this.sim.selectedBuilding = clickedBuilding;
            this.sim.selectedAgent = null;
            this.sim.selectedTree = null;
            this.sim.selectedBonfire = false;
          } else {
            const clickedTree = this.sim.getTreeAt(worldPos.x, worldPos.y);
            if (clickedTree) {
              this.sim.selectedTree = clickedTree;
              this.sim.selectedAgent = null;
              this.sim.selectedBuilding = null;
              this.sim.selectedBonfire = false;
            } else {
              const cf = this.sim.world.campfire;
              const isOverBonfire = !activeInteriorBuilding && Math.hypot(worldPos.x - cf.x, worldPos.y - (cf.y - 12)) < 36;
              if (isOverBonfire) {
                this.sim.selectedBonfire = true;
                this.sim.selectedAgent = null;
                this.sim.selectedBuilding = null;
                this.sim.selectedTree = null;
              } else {
                this.sim.selectedAgent = null;
                this.sim.selectedBuilding = null;
                this.sim.selectedTree = null;
                this.sim.selectedBonfire = false;
              }
            }
          }
        }
      }
    });

    // Double-click to instantly center camera on clicked point
    this.canvas.addEventListener('dblclick', (e) => {
      const worldPos = this.screenToWorld(e.clientX, e.clientY);
      this.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, worldPos.x));
      this.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, worldPos.y));
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Anchor the zoom on the cursor so scrolling over a house naturally
      // centres and opens that house's interior.
      const before = this.screenToWorld(e.clientX, e.clientY);
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoom = Math.max(0.45, Math.min(2.0, this.zoom * zoomFactor));
      const after = this.screenToWorld(e.clientX, e.clientY);
      this.cameraX += before.x - after.x;
      this.cameraY += before.y - after.y;
      this.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, this.cameraX));
      this.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, this.cameraY));
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.canvas.width / 2) / this.zoom + this.cameraX,
      y: (screenY - this.canvas.height / 2) / this.zoom + this.cameraY
    };
  }

  public render(globalTime: number, delta: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    this.updateActiveInterior();

    // 1. Soft Pastoral Green Grass & Organic Sandy Dirt Patches
    this.drawCozyTerrain();

    // 2. Sandstone Cliff Terraces & Stone Steps (Matching Reference Image)
    this.drawCliffTerraces();

    // 3. Teal-Green River with Sandy Shoreline
    this.drawRiver(globalTime);

    // 4. Illustrated Wooden Bridges with Post Ropes (Matching Reference Image)
    this.drawIllustratedBridges();

    // 5. Environmental Details: 71 Handcrafted Illustrated Nature Assets (Bushes, Rocks, Mushrooms, Reeds, Logs)
    NatureRenderer.draw(
      this.ctx,
      this.sim.world,
      globalTime,
      this.cameraX,
      this.cameraY,
      this.zoom,
      this.canvas.width,
      this.canvas.height
    );

    // 5b. Tranquil Lotus Lily Pond with Swimming Koi Fish
    PondRenderer.draw(
      this.ctx,
      this.sim.world,
      globalTime,
      this.cameraX,
      this.cameraY,
      this.zoom,
      this.canvas.width,
      this.canvas.height
    );

    // 6. Berry Bushes (Handcrafted Illustrated Art: With & Without Berries)
    for (const bush of this.sim.world.berryBushes) {
      this.drawBerryBush(bush, globalTime);
    }

    // 7. Central Campfire
    this.drawCampfire(globalTime);

    // 8. Ground Items
    for (const item of this.sim.world.items) {
      this.drawItem(item, globalTime);
    }

    // 9. Buildings, Trees, Settlers, & Animals (Y-Depth Sorted in 2.5D Perspective)
    this.drawDepthSortedEntities(globalTime);

    // 11. Atmosphere & Night Lighting
    this.drawAtmosphere(globalTime);

    if (this.activeInteriorBuildingId) {
      // 12. Focused cutaway interior (drawn after the night tint so the warm
      // lamplight inside stays readable).
      this.drawActiveInterior(globalTime);
    } else {
      // 13. Weather (never inside a cutaway interior)
      if (this.sim.weather === 'rainy' || this.sim.weather === 'stormy') {
        this.drawRain(delta);
      }

      // 14. Architecture / Building Ghost Preview (Create / Move)
      this.drawGhostBuildingPreview(globalTime);
    }

    // 15. Special God FX (Sparks / Lightning / Hearts) - rendered on top of terrain and cutaway
    this.drawSpecialEffects(globalTime);

    ctx.restore();

    // 14. IN-GAME HUD MATCHING REFERENCE IMAGE
    this.drawReferenceHUD();

    // 15. Minimap Radar
    this.drawMinimap();
  }

  private updateActiveInterior(): void {
    if (this.zoom < INTERIOR_MIN_ZOOM) {
      this.activeInteriorBuildingId = null;
      return;
    }

    let bestId: string | null = null;
    let bestDistance = Infinity;

    for (const b of this.sim.world.buildings) {
      if (!b.isConstructed) continue;
      // Don't open an interior whose artwork hasn't loaded yet.
      if (!InteriorRenderer.getLayout(b)) continue;

      // The viewport centre must be over (or very close to) the house.
      const marginX = b.width * 0.35;
      const marginY = b.height * 0.35;
      if (
        this.cameraX < b.x - marginX ||
        this.cameraX > b.x + b.width + marginX ||
        this.cameraY < b.y - marginY ||
        this.cameraY > b.y + b.height + marginY
      ) {
        continue;
      }

      const dx = b.x + b.width / 2 - this.cameraX;
      const dy = b.y + b.height / 2 - this.cameraY;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = b.id;
      }
    }

    this.activeInteriorBuildingId = bestId;
  }

  private isPointInsideBuilding(x: number, y: number, b: Building, margin = 0): boolean {
    return (
      x >= b.x - margin &&
      x <= b.x + b.width + margin &&
      y >= b.y - margin &&
      y <= b.y + b.height + margin
    );
  }

  /**
   * Computes the visual screen-space bounds of a building (including its roof overhang,
   * eaves, walls, and ground baseline).
   */
  public getBuildingVisualBounds(b: Building): { minX: number; maxX: number; minY: number; maxY: number } {
    let overhangX = 24;
    let roofTopOffset = -28;

    switch (b.type) {
      case 'cabin':
        overhangX = Math.round(b.width * 0.15);
        roofTopOffset = -12;
        break;
      case 'hearth':
        overhangX = Math.round(b.width * 0.11);
        roofTopOffset = -34;
        break;
      case 'storage':
        overhangX = Math.round(b.width * 0.22);
        roofTopOffset = -10;
        break;
      case 'healer_hut':
        overhangX = Math.round(b.width * 0.10);
        roofTopOffset = -26;
        break;
      default:
        overhangX = 24;
        roofTopOffset = -28;
        break;
    }

    return {
      minX: b.x - overhangX,
      maxX: b.x + b.width + overhangX,
      minY: b.y + roofTopOffset,
      maxY: b.y + b.height
    };
  }

  /**
   * Checks if an entity positioned at ground coordinates (x, y) is occluded behind
   * or inside building `b`.
   * In 2.5D top-down perspective, the front ground base is at (b.y + b.height).
   * Any entity positioned north of the front base (y < b.y + b.height) and within
   * the horizontal bounds of the house is behind the house, so it cannot be seen.
   */
  public isEntityBehindBuilding(x: number, y: number, b: Building): boolean {
    const bounds = this.getBuildingVisualBounds(b);
    return (
      x >= bounds.minX + 2 &&
      x <= bounds.maxX - 2 &&
      y >= bounds.minY - 8 &&
      y < bounds.maxY - 2
    );
  }

  /**
   * Checks if an entity positioned at (x, y) is occluded behind any building in the world.
   */
  public isEntityBehindAnyBuilding(x: number, y: number): boolean {
    for (const b of this.sim.world.buildings) {
      if (this.isEntityBehindBuilding(x, y, b)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the building an agent is visually inside, if that building has a
   * cutaway interior. Settlement buildings are not physical collision boxes,
   * so NPCs can stand within a footprint while eating, resting, working, etc.
   * Those agents are hidden outdoors and only appear when the house is focused.
   */
  private getIndoorBuildingForAgent(agent: AgentData): Building | null {
    if (agent.indoorBuildingId) {
      const explicit = this.sim.world.getBuildingById(agent.indoorBuildingId);
      if (explicit && InteriorRenderer.getInteriorKey(explicit)) return explicit;
    }

    const margin = 6;
    for (let i = this.sim.world.buildings.length - 1; i >= 0; i--) {
      const b = this.sim.world.buildings[i];
      if (!b.isConstructed) continue;
      if (!InteriorRenderer.getInteriorKey(b)) continue;
      if (this.isPointInsideBuilding(agent.x, agent.y, b, margin)) return b;
    }

    return null;
  }

  private isAgentInsideBuilding(agent: AgentData, b: Building): boolean {
    return this.getIndoorBuildingForAgent(agent)?.id === b.id;
  }

  private drawActiveInterior(globalTime: number): void {
    const id = this.activeInteriorBuildingId;
    if (!id) return;

    const b = this.sim.world.getBuildingById(id);
    if (!b) {
      this.activeInteriorBuildingId = null;
      return;
    }

    const layout = InteriorRenderer.getLayout(b, this.cameraX, this.cameraY + 40);
    if (!layout) return;

    const ctx = this.ctx;
    const cx = layout.x + layout.width / 2;
    const cy = layout.y + layout.height / 2;

    ctx.save();

    // Dim the settlement so the cutaway room becomes the focus.
    const viewW = this.canvas.width / this.zoom;
    const viewH = this.canvas.height / this.zoom;
    ctx.fillStyle = 'rgba(10, 8, 6, 0.68)';
    ctx.fillRect(this.cameraX - viewW / 2, this.cameraY - viewH / 2, viewW, viewH);

    // Warm lamplight halo behind the room.
    const glow = ctx.createRadialGradient(
      cx, cy, layout.width * 0.08,
      cx, cy, layout.width * 0.72
    );
    glow.addColorStop(0, 'rgba(255, 198, 120, 0.24)');
    glow.addColorStop(0.55, 'rgba(255, 160, 70, 0.09)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(
      cx - layout.width * 0.9,
      cy - layout.height * 0.9,
      layout.width * 1.8,
      layout.height * 1.8
    );

    // Soft floor shadow under the cutaway.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(
      cx,
      layout.y + layout.height * 0.93,
      layout.width * 0.4,
      layout.width * 0.085,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.drawImage(layout.img, layout.x, layout.y, layout.width, layout.height);

    this.drawInteriorResidents(b, layout, globalTime);
    // Draw the room title last so transient speech bubbles cannot hide it.
    this.drawInteriorNameplate(b, layout.x, layout.y, layout.width);

    ctx.restore();
  }

  private drawInteriorNameplate(b: Building, roomX: number, roomY: number, roomW: number): void {
    const ctx = this.ctx;
    const label = `🏠 ${b.name} — Interior`;
    const pillH = 22;

    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const pillW = ctx.measureText(label).width + 22;
    const pillX = roomX + roomW / 2 - pillW / 2;
    // Keep the sign inside the cutaway so the top god bar can never cover it.
    const pillY = roomY + 10;

    ctx.fillStyle = 'rgba(247, 241, 227, 0.97)';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b2118';
    ctx.fillText(label, roomX + roomW / 2, pillY + pillH / 2 + 0.5);
    ctx.restore();
  }

  private getInteriorResidentsWithPositions(
    b: Building,
    layout: ReturnType<typeof InteriorRenderer.getLayout>
  ): Array<{ agent: Agent; residentData: AgentData; posX: number; posY: number }> {
    if (!layout) return [];
    const slots = INTERIOR_SLOTS[layout.key];
    if (!slots || slots.length === 0) return [];

    const indoorAgents = this.sim.agents.filter(a => this.isAgentInsideBuilding(a.data, b));
    const sorted = indoorAgents.slice().sort((a, b) => a.data.id.localeCompare(b.data.id));

    return sorted.map((agent, i) => {
      const slot = slots[i % slots.length];
      const cycle = Math.floor(i / slots.length);
      const cycleOffsetX = cycle === 0 ? 0 : cycle % 2 === 1 ? 0.035 : -0.035;
      const cycleOffsetY = cycle === 0 ? 0 : cycle % 2 === 1 ? -0.02 : 0.02;
      const posX = layout.x + layout.width * (slot.x + cycleOffsetX);
      const posY = layout.y + layout.height * (slot.y + cycleOffsetY);
      const baseScale = agent.data.appearance.scale ?? (agent.data.appearance.gender === 'female' ? 0.95 : 1.04);
      const residentData: AgentData = {
        ...agent.data,
        x: posX,
        y: posY,
        appearance: {
          ...agent.data.appearance,
          scale: baseScale * INTERIOR_PEOPLE_SCALE
        },
        facing: 'down',
        targetX: undefined,
        targetY: undefined
      };
      return { agent, residentData, posX, posY };
    });
  }

  private drawInteriorResidents(
    b: Building,
    layout: ReturnType<typeof InteriorRenderer.getLayout>,
    globalTime: number
  ): void {
    if (!layout) return;

    const residents = this.getInteriorResidentsWithPositions(b, layout);

    for (const { agent, residentData, posX, posY } of residents) {
      const isSelected = this.sim.selectedAgent?.data.id === agent.data.id;
      if (isSelected) {
        this.drawSelectionIndicator(posX, posY, globalTime, INTERIOR_PEOPLE_SCALE);
      }

      const isDead = residentData.isDead || residentData.actionState === 'dead';
      const fadeAlpha = isDead && residentData.deathTimer !== undefined && residentData.deathTimer < 3
        ? Math.max(0, residentData.deathTimer / 3)
        : 1;

      if (fadeAlpha < 1) {
        this.ctx.save();
        this.ctx.globalAlpha *= fadeAlpha;
      }

      SpriteRenderer.drawAgent(this.ctx, residentData, globalTime);
      this.drawAgentTag(residentData, true);
      BubbleRenderer.drawBubble(this.ctx, residentData, globalTime);

      if (fadeAlpha < 1) {
        this.ctx.restore();
      }
    }
  }

  public getInteriorAgentAt(worldX: number, worldY: number): Agent | null {
    if (!this.activeInteriorBuildingId || this.zoom < INTERIOR_MIN_ZOOM) return null;

    const b = this.sim.world.getBuildingById(this.activeInteriorBuildingId);
    if (!b) return null;

    const layout = InteriorRenderer.getLayout(b, this.cameraX, this.cameraY + 40);
    if (!layout) return null;

    const residents = this.getInteriorResidentsWithPositions(b, layout);
    let closestAgent: Agent | null = null;
    let closestDist = Infinity;

    for (const { agent, posX, posY } of residents) {
      const isLyingDown = agent.data.actionState === 'sleeping' || agent.data.actionState === 'unconscious';
      const hasBubble = !!agent.data.activeBubble;
      // Adjusted bounds matching the 20% decreased interior person size
      const minY = isLyingDown ? posY - 20 : (hasBubble ? posY - 68 : posY - 50);
      const maxY = isLyingDown ? posY + 20 : posY + 14;
      const halfW = isLyingDown ? 30 : 23;

      const inBounds =
        worldX >= posX - halfW &&
        worldX <= posX + halfW &&
        worldY >= minY &&
        worldY <= maxY;

      const centerY = (minY + maxY) / 2;
      const dist = Math.hypot(worldX - posX, worldY - centerY);

      if (inBounds || dist < 30) {
        if (dist < closestDist) {
          closestDist = dist;
          closestAgent = agent;
        }
      }
    }

    return closestAgent;
  }

  public getActiveInteriorBuildingAt(worldX: number, worldY: number): Building | null {
    if (!this.activeInteriorBuildingId || this.zoom < INTERIOR_MIN_ZOOM) return null;

    const b = this.sim.world.getBuildingById(this.activeInteriorBuildingId);
    if (!b) return null;

    const layout = InteriorRenderer.getLayout(b, this.cameraX, this.cameraY + 40);
    if (!layout) return null;

    if (
      worldX >= layout.x &&
      worldX <= layout.x + layout.width &&
      worldY >= layout.y &&
      worldY <= layout.y + layout.height
    ) {
      return b;
    }

    return null;
  }

  private drawSelectionIndicator(x: number, y: number, globalTime: number, scale = 1.0): void {
    const ctx = this.ctx;
    ctx.save();

    const pulse = Math.sin(globalTime * 0.006) * 0.15 + 0.85; // 0.70 to 1.00
    const rx = 18 * scale * pulse;
    const ry = 9 * scale * pulse;

    // 1. Soft glowing outer aura
    ctx.beginPath();
    ctx.ellipse(x, y + 2, rx + 6 * scale, ry + 3 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.fill();

    // 2. Bright glowing ring with subtle shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2 * scale;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10 * scale;
    ctx.stroke();

    // 3. Inner bright highlight core
    ctx.beginPath();
    ctx.ellipse(x, y + 2, rx * 0.45, ry * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
    ctx.fill();

    ctx.restore();
  }

  private drawGhostBuildingPreview(globalTime: number): void {
    const ctx = this.ctx;
    const power = this.sim.activeGodPower;

    if (power === 'create_house') {
      const w = 190;
      const h = 150;
      const x = this.mouseWorldX - w / 2;
      const y = this.mouseWorldY - h / 2;
      const isWater = this.sim.world.isAreaWater(x, y, w, h, 25);

      ctx.save();

      // Real-time automatic road connection trail preview
      if (!isWater) {
        const doorX = this.mouseWorldX;
        const doorY = this.mouseWorldY + h / 2;
        const roadTarget = this.sim.world.findRoadConnectionPoint(doorX, doorY);

        ctx.save();
        ctx.strokeStyle = 'rgba(222, 215, 171, 0.75)';
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(doorX, doorY);
        ctx.lineTo(roadTarget.x, roadTarget.y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(235, 230, 197, 0.95)';
        ctx.lineWidth = 14;
        ctx.stroke();

        // Pulsing road target snap node
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(roadTarget.x, roadTarget.y, 6 + Math.sin(globalTime * 0.008) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.translate(x, y);

      const pulse = 0.5 + Math.sin(globalTime * 0.005) * 0.15;

      if (isWater) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = `rgba(234, 179, 8, ${pulse})`;
        ctx.strokeStyle = '#22c55e';
      }

      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 12);
      ctx.fill();
      ctx.stroke();

      // Roof preview
      ctx.beginPath();
      ctx.moveTo(-10, 36);
      ctx.lineTo(w / 2, -15);
      ctx.lineTo(w + 10, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Door indicator
      ctx.fillStyle = '#2b2118';
      ctx.fillRect(w / 2 - 14, h - 30, 28, 30);

      // Label banner
      ctx.setLineDash([]);
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      if (isWater) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('🚫 Cannot build on water!', w / 2, -26);
      } else {
        ctx.fillStyle = '#15803d';
        ctx.fillText('✨ Click on land to construct homestead & auto-connect road', w / 2, -26);
      }

      ctx.restore();
    } else if (power === 'move_house' && this.sim.movingBuilding) {
      const b = this.sim.movingBuilding;
      const x = this.mouseWorldX - b.width / 2;
      const y = this.mouseWorldY - b.height / 2;
      const isWater = this.sim.world.isAreaWater(x, y, b.width, b.height, 25);

      ctx.save();

      // Dashed flight trajectory line from old to new position
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(b.x + b.width / 2, b.y + b.height / 2);
      ctx.lineTo(this.mouseWorldX, this.mouseWorldY);
      ctx.stroke();

      // Real-time automatic road connection trail preview
      if (!isWater) {
        const doorX = this.mouseWorldX;
        const doorY = this.mouseWorldY + b.height / 2;
        const roadTarget = this.sim.world.findRoadConnectionPoint(doorX, doorY, b.id);

        ctx.save();
        ctx.strokeStyle = 'rgba(222, 215, 171, 0.75)';
        ctx.lineWidth = 26;
        ctx.lineCap = 'round';
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(doorX, doorY);
        ctx.lineTo(roadTarget.x, roadTarget.y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(235, 230, 197, 0.95)';
        ctx.lineWidth = 14;
        ctx.stroke();

        // Pulsing road target snap node
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(roadTarget.x, roadTarget.y, 6 + Math.sin(globalTime * 0.008) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.translate(x, y);
      const pulse = 0.5 + Math.sin(globalTime * 0.005) * 0.15;

      if (isWater) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
        ctx.strokeStyle = '#15803d';
      }

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(0, 0, b.width, b.height, 12);
      ctx.fill();
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      if (isWater) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('🚫 Cannot place on water!', b.width / 2, -20);
      } else {
        ctx.fillStyle = '#15803d';
        ctx.fillText(`🚚 Relocating ${b.name} (Road automatically connects)`, b.width / 2, -20);
      }

      ctx.restore();
    } else if (power === 'plant_tree') {
      const variant = this.sim.selectedPlantTreeVariant !== undefined ? this.sim.selectedPlantTreeVariant : 0;
      const stage = this.sim.selectedPlantTreeStage || 'mature';
      const isWater = this.sim.world.isWater(this.mouseWorldX, this.mouseWorldY, 15);
      const nearBuilding = this.sim.world.buildings.some(b => 
        this.mouseWorldX >= b.x - 15 && this.mouseWorldX <= b.x + b.width + 15 &&
        this.mouseWorldY >= b.y - 15 && this.mouseWorldY <= b.y + b.height + 15
      );
      const tooClose = this.sim.world.trees.some(t => Math.hypot(t.x - this.mouseWorldX, t.y - this.mouseWorldY) < 22);
      const isValid = !isWater && !nearBuilding && !tooClose;

      TreeRenderer.drawTreeGhost(ctx, variant, stage, this.mouseWorldX, this.mouseWorldY, isValid, globalTime);
    } else if (power === 'remove_tree') {
      const hovered = this.hoveredTreeId ? this.sim.world.trees.find(t => t.id === this.hoveredTreeId) : null;
      if (!hovered) {
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
        ctx.beginPath();
        ctx.roundRect(this.mouseWorldX - 100, this.mouseWorldY - 32, 200, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🪓 Click tree to chop / remove', this.mouseWorldX, this.mouseWorldY - 16);
        ctx.restore();
      }
    } else if (power === 'spawn_settler') {
      const gender = this.sim.selectedSettlerGender === 'random' ? 'female' : this.sim.selectedSettlerGender;
      const role = this.sim.selectedSettlerRole;
      const isWater = this.sim.world.isWater(this.mouseWorldX, this.mouseWorldY, 12);
      const nearBuilding = this.sim.world.buildings.some(b => 
        this.mouseWorldX >= b.x - 8 && this.mouseWorldX <= b.x + b.width + 8 &&
        this.mouseWorldY >= b.y - 8 && this.mouseWorldY <= b.y + b.height + 8
      );
      const isValid = !isWater && !nearBuilding;

      ctx.save();
      ctx.translate(this.mouseWorldX, this.mouseWorldY);

      // Ground landing reticle
      const pulse = 0.5 + Math.sin(globalTime * 0.007) * 0.18;
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 9, 0, 0, Math.PI * 2);
      if (!isValid) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
        ctx.strokeStyle = '#22c55e';
      }
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 3]);
      ctx.fill();
      ctx.stroke();

      // Ghost agent preview
      ctx.globalAlpha = 0.78;
      SpriteRenderer.drawAgent(ctx, {
        id: 'preview_ghost',
        name: `${gender === 'female' ? 'Female' : 'Male'} Settler`,
        familyName: '',
        age: 24,
        role: role === 'random' ? 'settler' : role,
        cash: 25,
        x: 0,
        y: 0,
        facing: 'down',
        walkCycle: globalTime * 0.004,
        actionState: 'idle',
        actionTimer: 0,
        homeCabinId: 'cabin_vance',
        schedule: [],
        routineInterrupted: false,
        wantsToBuildHouse: false,
        needs: { hunger: 100, energy: 100, social: 100, fun: 100, health: 100, morality: 80 },
        traits: { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0, aggression: 0, greed: 0, libido: 0, workEthic: 0.8 },
        appearance: {
          gender,
          skinColor: '#ffdbac',
          hairColor: '#78350f',
          hairStyle: gender === 'female' ? 'wavy' : 'short',
          shirtColor: '#15803d',
          dressColor: gender === 'female' ? '#166534' : undefined,
          pantsColor: '#1c1917',
          eyeColor: '#0284c7',
          accessory: 'none',
          scale: gender === 'female' ? 0.95 : 1.04
        },
        relationships: {},
        memories: [],
        isPossessed: false,
        equippedWeapon: role === 'hunter' ? 'bow' : role === 'lumberjack' ? 'axe' : undefined,
        thought: 'Ready to arrive in the sanctuary...'
      }, globalTime);

      // Label banner
      ctx.globalAlpha = 1.0;
      ctx.setLineDash([]);
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      if (!isValid) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText(isWater ? '🚫 Cannot spawn on river water!' : '🚫 Too close to building!', 0, -36);
      } else {
        const roleStr = role === 'random' ? '' : ` (${role.toUpperCase()})`;
        ctx.fillStyle = '#15803d';
        ctx.fillText(`✨ Click land to spawn ${gender === 'female' ? 'Female 👩' : 'Male 👨'}${roleStr}`, 0, -36);
      }

      ctx.restore();
    }
  }

  /**
   * Recreates the base of the village using the handcrafted illustrated grass and land tiles
   * (grassland with varied flora, paved plazas, dirt loading yards, sandy shores, and textured roads).
   */
  private drawCozyTerrain(): void {
    TerrainRenderer.draw(
      this.ctx,
      this.sim.world,
      this.cameraX,
      this.cameraY,
      this.zoom,
      this.canvas.width,
      this.canvas.height
    );
  }

  /**
   * Sandstone Cliff Terraces & Stone Steps (Directly from the reference image!)
   */
  private drawCliffTerraces(): void {
    const ctx = this.ctx;

    // Cliff coordinates matching the image upper section
    const cliffY = 240;
    const cliffHeight = 75;

    // 1. Cliff Shadow on lower grass
    ctx.fillStyle = 'rgba(44, 36, 27, 0.22)';
    ctx.fillRect(100, cliffY + cliffHeight, 2600, 16);

    // 2. Sandstone Vertical Face (#dfc38a with gradient)
    const cliffGrad = ctx.createLinearGradient(0, cliffY, 0, cliffY + cliffHeight);
    cliffGrad.addColorStop(0, '#ebd29d');
    cliffGrad.addColorStop(0.5, '#dfc38a');
    cliffGrad.addColorStop(1, '#c5a363');

    ctx.fillStyle = cliffGrad;
    ctx.fillRect(100, cliffY, 2600, cliffHeight);

    // Dark outline bottom edge
    ctx.strokeStyle = '#382a1c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, cliffY + cliffHeight);
    ctx.lineTo(2700, cliffY + cliffHeight);
    ctx.stroke();

    // 3. Overhanging Upper Grass Rim (#94ba59)
    ctx.fillStyle = '#94ba59';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(2700, 0);
    ctx.lineTo(2700, cliffY);
    for (let x = 2700; x >= 100; x -= 40) {
      ctx.quadraticCurveTo(x - 20, cliffY + 8, x - 40, cliffY);
    }
    ctx.closePath();
    ctx.fill();

    // Upper grass dark rim outline
    ctx.strokeStyle = '#382a1c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 100; x <= 2700; x += 40) {
      if (x === 100) ctx.moveTo(x, cliffY);
      ctx.quadraticCurveTo(x + 20, cliffY + 8, x + 40, cliffY);
    }
    ctx.stroke();

    // 4. Carved Stone Stairs (Central staircase matching image!)
    const stairX = 1150;
    this.drawStoneStairs(ctx, stairX, cliffY, 130, cliffHeight);
    this.drawStoneStairs(ctx, 580, cliffY, 110, cliffHeight);
    this.drawStoneStairs(ctx, 2050, cliffY, 110, cliffHeight);
  }

  private drawStoneStairs(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    const steps = 5;
    const stepH = h / steps;

    for (let i = 0; i < steps; i++) {
      const sy = y + i * stepH;
      // Step stone base
      ctx.fillStyle = '#cfb57a';
      ctx.strokeStyle = '#382a1c';
      ctx.lineWidth = 1.8;
      ctx.fillRect(x - w / 2, sy, w, stepH);
      ctx.strokeRect(x - w / 2, sy, w, stepH);

      // Mossy green tuft on step lip
      ctx.fillStyle = '#8db552';
      ctx.fillRect(x - w / 2 + 2, sy + stepH - 3, w - 4, 3);
    }

    // Side stone blocks
    ctx.fillStyle = '#bda066';
    ctx.fillRect(x - w / 2 - 12, y, 12, h);
    ctx.strokeRect(x - w / 2 - 12, y, 12, h);
    ctx.fillRect(x + w / 2, y, 12, h);
    ctx.strokeRect(x + w / 2, y, 12, h);

    ctx.restore();
  }

  /**
   * Illustrated Flowing River with Artwork Assets & Animated Top-to-Bottom Currents
   */
  private drawRiver(globalTime: number): void {
    RiverRenderer.drawRiver(this.ctx, this.sim.world, globalTime);
  }

  /**
   * Illustrated Wooden Bridges (Matching reference image with round posts and rope wraps)
   */
  private drawIllustratedBridges(): void {
    for (const b of this.sim.world.bridges) {
      this.drawSingleBridge(b.y, b.height);
    }
  }

  private drawSingleBridge(bridgeY: number, bridgeHeight: number): void {
    const ctx = this.ctx;
    const riverCenter = this.sim.world.getRiverCenterX(bridgeY + bridgeHeight / 2);
    const bridgeWidth = 172;
    const bridgeX = riverCenter - 86;
    const outlineColor = '#2b2118';

    ctx.save();

    // 1. Cast shadow on water
    ctx.fillStyle = 'rgba(30, 24, 18, 0.35)';
    ctx.fillRect(bridgeX, bridgeY + bridgeHeight, bridgeWidth, 12);

    // 2. Horizontal Wooden Deck Planks (#8b6f47 with grain and outlines)
    ctx.fillStyle = '#8a6e48';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;

    for (let x = bridgeX; x < bridgeX + bridgeWidth; x += 12) {
      ctx.fillRect(x, bridgeY, 10, bridgeHeight);
      ctx.strokeRect(x, bridgeY, 10, bridgeHeight);

      // Plank nail head dots
      ctx.fillStyle = '#3a2818';
      ctx.fillRect(x + 2, bridgeY + 4, 1.5, 1.5);
      ctx.fillRect(x + 2, bridgeY + bridgeHeight - 6, 1.5, 1.5);
      ctx.fillStyle = '#8a6e48';
    }

    // 3. Round Wooden Log Posts with Rope Wraps (Exactly matching reference image!)
    const posts = [
      { x: bridgeX + 2, y: bridgeY },
      { x: bridgeX + bridgeWidth - 2, y: bridgeY },
      { x: bridgeX + 2, y: bridgeY + bridgeHeight },
      { x: bridgeX + bridgeWidth - 2, y: bridgeY + bridgeHeight }
    ];

    for (const p of posts) {
      // Wooden post cylinder
      ctx.fillStyle = '#7a5a3a';
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(p.x - 5, p.y - 12, 10, 16, [4, 4, 2, 2]);
      ctx.fill();
      ctx.stroke();

      // Top oval
      ctx.fillStyle = '#94724c';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 12, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Coiled Rope Wraps around post
      ctx.strokeStyle = '#c8a870';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 5, p.y - 6); ctx.lineTo(p.x + 5, p.y - 6);
      ctx.moveTo(p.x - 5, p.y - 2); ctx.lineTo(p.x + 5, p.y - 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawBerryBush(bush: BerryBush, globalTime: number): void {
    BushRenderer.drawBush(this.ctx, bush, globalTime);
  }

  private drawCampfire(globalTime: number): void {
    BonfireRenderer.draw(
      this.ctx,
      this.sim.world.campfire,
      this.sim.gameMinutes,
      this.sim.weather,
      globalTime,
      this.sim.selectedBonfire
    );
  }

  private drawBuilding(b: Building, globalTime: number): void {
    if (!b.isConstructed) {
      this.drawConstructionSite(b);
      return;
    }

    // Illustrated building artwork takes precedence when available.
    if (BuildingRenderer.draw(this.ctx, b)) {
      this.drawBuildingNameBanner(this.ctx, b);
      return;
    }

    switch (b.type) {
      case 'dock':
        this.drawPierBuilding(b, globalTime);
        break;
      case 'lumber_camp':
        this.drawLumberCampBuilding(b, globalTime);
        break;
      case 'storage':
        this.drawStorehouseBuilding(b, globalTime);
        break;
      case 'hearth':
        this.drawHearthLodgeBuilding(b, globalTime);
        break;
      case 'cabin':
      case 'healer_hut':
      default:
        this.drawCozyCottageBuilding(b, globalTime);
        break;
    }
  }

  /**
   * Cozy Handcrafted Architectural Cottage / Family Homestead:
   * - Realistic multi-layered cast shadow
   * - Cobblestone masonry plinth foundation with moss tufts
   * - Interlocking timber logs with projecting rounded log-ends
   * - Gabled scalloped/shingle roof with overhangs and carved apex finials
   * - Covered front porch with wooden deck, carved timber posts, awning, and steps
   * - Arched plank door with iron strap hinges and glowing lantern post
   * - Multi-pane casement windows with glowing glass, open louvered shutters & blooming flowerboxes
   * - Cobblestone chimney with animated curling translucent smoke puffs
   * - Stack of corded split firewood under the eave
   */
  private drawCozyCottageBuilding(b: Building, globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#2b2118';

    ctx.save();

    // 1. Drop Shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.3)';
    ctx.beginPath();
    ctx.roundRect(b.x + 12, b.y + 14, b.width, b.height, 12);
    ctx.fill();

    // Palette tailoring based on family / building
    let wallColor = b.color || '#784d28';
    let roofColor = b.roofColor || '#54361e';
    let shutterColor = b.shutterColor || '#15803d';

    if (b.familyName === 'Vance') {
      roofColor = '#6c3214'; // Rust terracotta
      wallColor = '#7a4e2b';
      shutterColor = '#166534'; // Forest green
    } else if (b.familyName === 'Thorne') {
      roofColor = '#1c4323'; // Deep moss green
      wallColor = '#6d4827';
      shutterColor = '#ca8a04'; // Warm gold
    } else if (b.familyName === 'Gale') {
      roofColor = '#1e3a5f'; // Slate navy
      wallColor = '#785331';
      shutterColor = '#0284c7'; // River blue
    } else if (b.familyName === 'Sol') {
      roofColor = '#9a3412'; // Warm spice
      wallColor = '#85522e';
      shutterColor = '#ea580c'; // Terracotta
    } else if (b.familyName === 'Stone') {
      roofColor = '#374151'; // Charcoal slate
      wallColor = '#634731';
      shutterColor = '#dc2626'; // Deep red
    } else if (b.familyName === 'Bron') {
      roofColor = '#4c1d95'; // Royal elder violet
      wallColor = '#6b4028';
      shutterColor = '#eab308'; // Elder gold
    } else if (b.type === 'healer_hut') {
      roofColor = '#065f46';
      wallColor = '#5c4028';
      shutterColor = '#10b981';
    }

    const foundationH = 22;
    const wallTopY = b.y + 36;
    const wallBottomY = b.y + b.height - foundationH;
    const wallH = wallBottomY - wallTopY;

    // 2. Cobblestone Plinth Foundation
    this.drawCobblestoneFoundation(ctx, b.x, wallBottomY, b.width, foundationH);

    // 3. Interlocking Log Wall Base
    ctx.fillStyle = wallColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2;
    ctx.fillRect(b.x, wallTopY, b.width, wallH);
    ctx.strokeRect(b.x, wallTopY, b.width, wallH);

    // Stacked horizontal timber logs
    const logSpacing = 13;
    for (let ly = wallTopY + logSpacing; ly < wallBottomY; ly += logSpacing) {
      // Shadow groove
      ctx.strokeStyle = 'rgba(28, 18, 10, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + 2, ly);
      ctx.lineTo(b.x + b.width - 2, ly);
      ctx.stroke();

      // Top soft highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x + 2, ly + 2);
      ctx.lineTo(b.x + b.width - 2, ly + 2);
      ctx.stroke();
    }

    // Interlocking 3D round corner log ends (gives genuine cabin depth!)
    this.drawInterlockingCornerLogs(ctx, b.x, wallTopY, b.width, wallH, wallColor);

    // 4. Split Firewood Stack under the side eave
    this.drawStackedFirewood(ctx, b.x + 6, wallBottomY - 4, 12);

    // 5. Casement Windows with Glowing Glass, Louvered Shutters & Flower Boxes
    const winY = wallTopY + 16;
    const winW = 20;
    const winH = 22;

    // Left window
    this.drawWindowWithFlowerBox(ctx, b.x + 28, winY, winW, winH, shutterColor);
    // Right window
    this.drawWindowWithFlowerBox(ctx, b.x + b.width - 48, winY, winW, winH, shutterColor);

    // 6. Arched Heavy Timber Front Door
    this.drawHeavyWoodenDoor(ctx, b.door.x, wallBottomY, 24, 34);

    // 7. Covered Front Porch with Wooden Deck, Carved Posts, Canopy & Steps
    this.drawFrontPorch(ctx, b.door.x, b.door.y, 60, 24);

    // 8. Stone Masonry Chimney with Animated Translucent Smoke Puffs
    const chimneyX = b.x + b.width - 32;
    const chimneyY = b.y - 28;
    this.drawChimneyWithSmoke(ctx, chimneyX, chimneyY, 16, 52, globalTime);

    // 9. Multi-Pitch Scalloped Shingle Gabled Roof
    const roofOverhang = 14;
    const roofX = b.x - roofOverhang;
    const roofY = b.y - 24;
    const roofW = b.width + roofOverhang * 2;
    const roofH = 64;
    this.drawScallopedRoof(ctx, roofX, roofY, roofW, roofH, roofColor, outline);

    // 10. Hanging Family Name Banner
    this.drawBuildingNameBanner(ctx, b);

    ctx.restore();
  }

  /**
   * The Great Hearth & Communal Kitchen:
   * - Grand double-winged timber lodge
   * - Outdoor covered dining veranda with wooden feast tables and benches
   * - Simmering copper cauldron with bubbling stew and rising steam
   * - Grand double stone chimneys puffing fragrant hearth smoke
   * - Roof dormer window with miniature gable
   */
  private drawHearthLodgeBuilding(b: Building, globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#2b2118';

    ctx.save();

    // Drop Shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.32)';
    ctx.beginPath();
    ctx.roundRect(b.x + 14, b.y + 16, b.width, b.height, 14);
    ctx.fill();

    const foundationH = 24;
    const wallTopY = b.y + 40;
    const wallBottomY = b.y + b.height - foundationH;
    const wallH = wallBottomY - wallTopY;

    // 1. Cobblestone Foundation
    this.drawCobblestoneFoundation(ctx, b.x, wallBottomY, b.width, foundationH);

    // 2. Timber Lodge Walls
    ctx.fillStyle = '#854d0e';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4;
    ctx.fillRect(b.x, wallTopY, b.width, wallH);
    ctx.strokeRect(b.x, wallTopY, b.width, wallH);

    // Timber log lines
    for (let ly = wallTopY + 14; ly < wallBottomY; ly += 14) {
      ctx.strokeStyle = 'rgba(28, 18, 10, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + 2, ly);
      ctx.lineTo(b.x + b.width - 2, ly);
      ctx.stroke();
    }
    this.drawInterlockingCornerLogs(ctx, b.x, wallTopY, b.width, wallH, '#854d0e');

    // 3. Double Stone Chimneys on Left & Right
    this.drawChimneyWithSmoke(ctx, b.x + 24, b.y - 32, 18, 58, globalTime);
    this.drawChimneyWithSmoke(ctx, b.x + b.width - 42, b.y - 32, 18, 58, globalTime + 1800);

    // 4. Large Arched Double Oak Doors
    const doorX = b.door.x;
    ctx.fillStyle = '#3a2012';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(doorX - 18, wallBottomY - 38, 36, 38, [10, 10, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Center seam & iron studs
    ctx.beginPath();
    ctx.moveTo(doorX, wallBottomY - 38);
    ctx.lineTo(doorX, wallBottomY);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(doorX - 4, wallBottomY - 18, 2, 0, Math.PI * 2);
    ctx.arc(doorX + 4, wallBottomY - 18, 2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Windows with Flower Boxes
    this.drawWindowWithFlowerBox(ctx, b.x + 36, wallTopY + 14, 22, 24, '#ca8a04');
    this.drawWindowWithFlowerBox(ctx, b.x + b.width - 58, wallTopY + 14, 22, 24, '#ca8a04');

    // 6. Covered Dining Veranda & Feasting Table (Right Side of Door)
    const tableX = b.x + b.width - 86;
    const tableY = wallBottomY + 2;

    // Wooden trestle table
    ctx.fillStyle = '#8a603c';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(tableX, tableY, 44, 14, 2);
    ctx.fill();
    ctx.stroke();

    // Bread loaves & wooden steins on table
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(tableX + 12, tableY + 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#92400e';
    ctx.fillRect(tableX + 28, tableY + 3, 4, 6);
    ctx.strokeRect(tableX + 28, tableY + 3, 4, 6);

    // Wooden benches above and below
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(tableX - 2, tableY - 5, 48, 4);
    ctx.fillRect(tableX - 2, tableY + 15, 48, 4);

    // 7. Simmering Copper Cauldron on Iron Tripod (Left Side of Door)
    const potX = b.x + 50;
    const potY = wallBottomY + 6;

    // Iron Tripod Legs
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(potX, potY - 16); ctx.lineTo(potX - 10, potY + 10);
    ctx.moveTo(potX, potY - 16); ctx.lineTo(potX + 10, potY + 10);
    ctx.stroke();

    // Copper Cauldron Body
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(potX, potY + 2, 9, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bubbling stew inside cauldron
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(potX, potY + 1, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rising culinary steam
    const steamSway = Math.sin(globalTime * 0.008) * 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(potX, potY - 2);
    ctx.quadraticCurveTo(potX + steamSway, potY - 10, potX - steamSway, potY - 20);
    ctx.stroke();

    // 8. Front Porch Deck & Steps for Grand Lodge
    this.drawFrontPorch(ctx, b.door.x, b.door.y, 68, 24);

    // 9. Grand Scalloped Shingle Roof with Roof Dormer
    const roofOverhang = 16;
    const roofX = b.x - roofOverhang;
    const roofY = b.y - 30;
    const roofW = b.width + roofOverhang * 2;
    const roofH = 72;
    this.drawScallopedRoof(ctx, roofX, roofY, roofW, roofH, '#9a3412', outline);

    // Roof Dormer Window atop the Grand Hearth
    this.drawRoofDormer(ctx, b.x + b.width / 2, roofY + 16, 26, 24, '#b45309');

    // 10. Grand Communal Banner
    this.drawBuildingNameBanner(ctx, b);

    ctx.restore();
  }

  /**
   * Grand Timber Storehouse:
   * - Elevated on heavy wooden stilts with stone rat-guard collars
   * - Front gable hoist beam with rope and wooden cargo pulley
   * - Heavy reinforced double cargo barn doors
   * - Lean-to awning sheltering stacked wooden barrels and grain sacks
   * - Live stockpile counter
   */
  private drawStorehouseBuilding(b: Building, _globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#2b2118';

    ctx.save();

    // Drop Shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.3)';
    ctx.beginPath();
    ctx.roundRect(b.x + 12, b.y + 14, b.width, b.height, 12);
    ctx.fill();

    const stiltH = 18;
    const wallTopY = b.y + 36;
    const wallBottomY = b.y + b.height - stiltH;
    const wallH = wallBottomY - wallTopY;

    // 1. Heavy Wooden Stilts & Stone Saddles Underneath
    const stiltPositions = [b.x + 12, b.x + 60, b.x + b.width - 60, b.x + b.width - 12];
    for (const sx of stiltPositions) {
      // Stone saddle pad
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.4;
      ctx.fillRect(sx - 5, b.y + b.height - 5, 10, 5);
      ctx.strokeRect(sx - 5, b.y + b.height - 5, 10, 5);

      // Wooden stilt beam
      ctx.fillStyle = '#4c2d19';
      ctx.fillRect(sx - 3, wallBottomY, 6, stiltH - 4);
      ctx.strokeRect(sx - 3, wallBottomY, 6, stiltH - 4);
    }

    // 2. Weatherproof Timber Plank Walls
    ctx.fillStyle = '#713f12';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4;
    ctx.fillRect(b.x, wallTopY, b.width, wallH);
    ctx.strokeRect(b.x, wallTopY, b.width, wallH);

    // Vertical heavy timber siding
    for (let vx = b.x + 14; vx < b.x + b.width; vx += 14) {
      ctx.strokeStyle = 'rgba(28, 18, 10, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vx, wallTopY);
      ctx.lineTo(vx, wallBottomY);
      ctx.stroke();
    }

    // 3. Heavy Double Cargo Warehouse Doors with Diagonal Cross Braces
    const doorX = b.door.x;
    const doorW = 44;
    const doorH = 42;
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(doorX - doorW / 2, wallBottomY - doorH, doorW, doorH, 2);
    ctx.fill();
    ctx.stroke();

    // Center door division
    ctx.beginPath();
    ctx.moveTo(doorX, wallBottomY - doorH);
    ctx.lineTo(doorX, wallBottomY);
    ctx.stroke();

    // Diagonal iron bracing
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(doorX - doorW / 2 + 2, wallBottomY - doorH + 2);
    ctx.lineTo(doorX - 2, wallBottomY - 2);
    ctx.moveTo(doorX + 2, wallBottomY - doorH + 2);
    ctx.lineTo(doorX + doorW / 2 - 2, wallBottomY - 2);
    ctx.stroke();

    // 4. Sturdy Cargo Loading Ramp
    ctx.fillStyle = '#8a603c';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(doorX - 20, wallBottomY, 40, stiltH + 4, 2);
    ctx.fill();
    ctx.stroke();

    // 5. Side Lean-To Awning with Wooden Barrels & Grain Sacks
    const barrelX = b.x + 22;
    const barrelY = wallBottomY - 2;

    // 2 Wooden Barrels
    for (let i = 0; i < 2; i++) {
      const bx = barrelX + i * 16;
      ctx.fillStyle = '#a16207';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(bx, barrelY - 14, 13, 16, 3);
      ctx.fill();
      ctx.stroke();

      // Metal barrel hoops
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, barrelY - 10); ctx.lineTo(bx + 13, barrelY - 10);
      ctx.moveTo(bx, barrelY - 2); ctx.lineTo(bx + 13, barrelY - 2);
      ctx.stroke();
    }

    // Grain sacks on right side
    const sackX = b.x + b.width - 40;
    ctx.fillStyle = '#e5d5b5';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(sackX, barrelY - 5, 8, 0, Math.PI * 2);
    ctx.arc(sackX + 10, barrelY - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 6. Deep Gabled Scalloped Shingle Roof
    const roofOverhang = 14;
    const roofX = b.x - roofOverhang;
    const roofY = b.y - 28;
    const roofW = b.width + roofOverhang * 2;
    const roofH = 68;
    this.drawScallopedRoof(ctx, roofX, roofY, roofW, roofH, '#54361e', outline);

    // 7. Protruding Roof Hoist Beam with Rope & Wooden Pulley
    const hoistX = b.x + b.width / 2;
    const hoistY = roofY + 4;
    ctx.fillStyle = '#3a2012';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(hoistX - 3, hoistY, 6, 22, 1);
    ctx.fill();
    ctx.stroke();

    // Hanging rope
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hoistX, hoistY + 22);
    ctx.lineTo(hoistX, hoistY + 36);
    ctx.stroke();

    // Wooden Pulley Wheel
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(hoistX, hoistY + 36, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 8. Name Banner
    this.drawBuildingNameBanner(ctx, b);

    // 9. Live Stockpile Pill Banner
    const s = this.sim.world.stockpile;
    ctx.fillStyle = 'rgba(247, 241, 227, 0.95)';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(b.x + 12, b.y + b.height - 24, b.width - 24, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🪵 Wood: ${s.wood}   🍲 Food: ${s.food}   🐟 Fish: ${s.fish}`, b.x + b.width / 2, b.y + b.height - 15);

    ctx.restore();
  }

  /**
   * Northwood Lumber Yard & Sawmill Camp:
   * - Heavy open timber framing with sawmill shed
   * - Giant stack of seasoned timber logs with growth rings
   * - Chopping stump with double-bit lumberjack axe embedded
   * - Crosscut saw rack
   */
  private drawLumberCampBuilding(b: Building, _globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#2b2118';

    ctx.save();

    // Drop Shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.3)';
    ctx.beginPath();
    ctx.roundRect(b.x + 12, b.y + 14, b.width, b.height, 12);
    ctx.fill();

    const wallTopY = b.y + 36;
    const wallBottomY = b.y + b.height - 20;

    // 1. Sawmill Open Timber Frame
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4;
    ctx.fillRect(b.x, wallTopY, b.width, wallBottomY - wallTopY);
    ctx.strokeRect(b.x, wallTopY, b.width, wallBottomY - wallTopY);

    // Open saw bay
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(b.x + 30, wallTopY + 12, b.width - 60, wallBottomY - wallTopY - 12);
    ctx.strokeRect(b.x + 30, wallTopY + 12, b.width - 60, wallBottomY - wallTopY - 12);

    // 2. Large Stack of Seasoned Round Timber Logs with Rings
    const stackX = b.x + b.width - 50;
    const stackY = wallBottomY - 4;
    const logRadius = 6;
    const logCols = 3;
    const logRows = 2;

    for (let r = 0; r < logRows; r++) {
      for (let c = 0; c < logCols; c++) {
        const lx = stackX + c * (logRadius * 2 + 1);
        const ly = stackY - r * (logRadius * 2);
        ctx.fillStyle = '#a16207';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(lx, ly, logRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Growth rings
        ctx.strokeStyle = '#54361e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(lx, ly, logRadius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 3. Tree Stump Chopping Block with Embedded Double-Bit Axe
    const stumpX = b.x + 40;
    const stumpY = wallBottomY + 4;
    ctx.fillStyle = '#5c3d28';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.fillRect(stumpX - 8, stumpY - 10, 16, 12);
    ctx.strokeRect(stumpX - 8, stumpY - 10, 16, 12);

    // Axe handle
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(stumpX - 2, stumpY - 26, 3, 18);
    // Double-bit iron axe blade
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2;
    ctx.fillRect(stumpX - 7, stumpY - 24, 13, 6);
    ctx.strokeRect(stumpX - 7, stumpY - 24, 13, 6);

    // 4. Scalloped Shingle Roof
    const roofOverhang = 14;
    this.drawScallopedRoof(ctx, b.x - roofOverhang, b.y - 24, b.width + roofOverhang * 2, 64, '#854d0e', outline);

    // 5. Name Banner
    this.drawBuildingNameBanner(ctx, b);

    ctx.restore();
  }

  /**
   * North River Pier & Fishery Dock:
   * - Heavy wooden pier deck extending over teal river currents
   * - Mooring bollards with coiled nautical ropes
   * - Fish drying rack with hanging silver river fish
   */
  private drawPierBuilding(b: Building, _globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#2b2118';

    ctx.save();

    // 1. Heavy Wooden Pier Deck Planks
    ctx.fillStyle = '#8a603c';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.width, b.height, 4);
    ctx.fill();
    ctx.stroke();

    // Horizontal plank lines
    ctx.strokeStyle = 'rgba(28, 18, 10, 0.35)';
    ctx.lineWidth = 1.5;
    for (let py = b.y + 12; py < b.y + b.height; py += 12) {
      ctx.beginPath();
      ctx.moveTo(b.x + 2, py);
      ctx.lineTo(b.x + b.width - 2, py);
      ctx.stroke();
    }

    // 2. Mooring Bollards with Coiled Ropes
    const bollards = [
      { x: b.x + 12, y: b.y + 12 },
      { x: b.x + b.width - 12, y: b.y + 12 },
      { x: b.x + 12, y: b.y + b.height - 12 },
      { x: b.x + b.width - 12, y: b.y + b.height - 12 }
    ];

    for (const bp of bollards) {
      ctx.fillStyle = '#4c2d19';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rope wrap coil
      ctx.strokeStyle = '#c49a60';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 6.5, 0, Math.PI * 1.5);
      ctx.stroke();
    }

    // 3. Fish Drying Rack with Silver Fish
    const rackX = b.x + 24;
    const rackY = b.y + 24;
    const rackW = b.width - 48;
    ctx.strokeStyle = '#5a3818';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rackX, rackY); ctx.lineTo(rackX + rackW, rackY);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const fx = rackX + 8 + i * ((rackW - 16) / 3);
      // Silver fish body
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(fx, rackY + 8, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 4. Fisherman Tackle Box
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(b.x + b.width - 32, b.y + b.height - 30, 18, 12, 2);
    ctx.fill();
    ctx.stroke();

    // 5. Name Banner
    this.drawBuildingNameBanner(ctx, b);

    ctx.restore();
  }

  // --- ARCHITECTURAL COMPONENT RENDERERS ---

  private drawScallopedRoof(
    ctx: CanvasRenderingContext2D,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    primaryColor: string,
    trimColor = '#2b2118'
  ): void {
    const apexX = rx + rw / 2;
    const apexY = ry;
    const leftX = rx;
    const leftY = ry + rh;
    const rightX = rx + rw;
    const rightY = ry + rh;

    ctx.save();

    // 1. Solid Under-Roof Base
    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(apexX, apexY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Horizontal Scalloped Shingle Tiers (Layered tiles)
    const tiers = 5;
    for (let t = 1; t <= tiers; t++) {
      const prog = t / tiers;
      const tierY = apexY + rh * prog;
      const tierLeftX = apexX - (apexX - leftX) * prog;
      const tierRightX = apexX + (rightX - apexX) * prog;
      const tierW = tierRightX - tierLeftX;

      // Dark under-shadow row line
      ctx.strokeStyle = 'rgba(25, 15, 8, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tierLeftX, tierY);
      ctx.lineTo(tierRightX, tierY);
      ctx.stroke();

      // Scallop shingle arcs
      const shingleCount = Math.max(3, Math.floor(tierW / 14));
      const shingleW = tierW / shingleCount;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1.2;
      for (let s = 0; s < shingleCount; s++) {
        const sx = tierLeftX + s * shingleW;
        ctx.beginPath();
        ctx.arc(sx + shingleW / 2, tierY - 2, shingleW / 2, 0, Math.PI);
        ctx.stroke();
      }
    }

    // 3. Carved Timber Bargeboards / Fascia along gables
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(apexX, apexY);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();

    // 4. Apex Finial / Carved Crest
    ctx.fillStyle = '#6b4028';
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(apexX - 4, apexY + 2);
    ctx.lineTo(apexX, apexY - 11);
    ctx.lineTo(apexX + 4, apexY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawRoofDormer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    roofColor: string
  ): void {
    const outline = '#2b2118';
    ctx.save();

    // Dormer walls
    ctx.fillStyle = '#784e2a';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.strokeRect(x - w / 2, y, w, h);

    // Miniature gabled roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 3, y + 4);
    ctx.lineTo(x, y - 8);
    ctx.lineTo(x + w / 2 + 3, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing arched window
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, y + 10, 5, Math.PI, 0);
    ctx.lineTo(x + 5, y + 16);
    ctx.lineTo(x - 5, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawCobblestoneFoundation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h = 22
  ): void {
    const outline = '#2b2118';
    ctx.save();

    // Base stone foundation fill
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Individual cobblestone blocks
    const stoneColors = ['#525e6f', '#6b7a8d', '#7d8c9e', '#5a6676'];
    const blockW = 18;
    const cols = Math.ceil(w / blockW);
    const rows = 2;
    const rowH = h / rows;

    for (let r = 0; r < rows; r++) {
      const rowY = y + r * rowH;
      const offset = r % 2 === 1 ? blockW / 2 : 0;
      for (let c = -1; c <= cols; c++) {
        const bx = x + c * blockW + offset;
        if (bx + blockW < x || bx > x + w) continue;
        const actualX = Math.max(x, bx);
        const actualW = Math.min(x + w - actualX, blockW - 2);
        if (actualW <= 0) continue;

        ctx.fillStyle = stoneColors[(c + r * 3) % stoneColors.length];
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(actualX, rowY + 1, actualW, rowH - 2, 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Small moss / ivy tufts on foundation corners
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.arc(x + 4, y + h - 3, 3, 0, Math.PI * 2);
    ctx.arc(x + 8, y + h - 2, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w - 6, y + h - 3, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawInterlockingCornerLogs(
    ctx: CanvasRenderingContext2D,
    wallX: number,
    wallY: number,
    wallW: number,
    wallH: number,
    logColor: string
  ): void {
    const logHeight = 13;
    const numLogs = Math.floor(wallH / logHeight);
    const outline = '#2b2118';

    ctx.save();
    for (let i = 0; i < numLogs; i++) {
      const ly = wallY + i * logHeight + logHeight / 2;

      // Alternating projecting log ends
      if (i % 2 === 0) {
        // Left projecting round log end
        ctx.fillStyle = logColor;
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(wallX - 3, ly, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Growth rings
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wallX - 3, ly, 3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Right projecting round log end
        ctx.fillStyle = logColor;
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(wallX + wallW + 3, ly, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Growth rings
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wallX + wallW + 3, ly, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawWindowWithFlowerBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    shutterColor = '#166534'
  ): void {
    const outline = '#2b2118';
    ctx.save();

    // 1. Open Louvered Shutters on Left & Right
    const shutterW = 7;
    // Left shutter
    ctx.fillStyle = shutterColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.fillRect(x - shutterW - 2, y, shutterW, h);
    ctx.strokeRect(x - shutterW - 2, y, shutterW, h);
    // Louver slats
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - shutterW - 1, y + 4); ctx.lineTo(x - 3, y + 4);
    ctx.moveTo(x - shutterW - 1, y + 8); ctx.lineTo(x - 3, y + 8);
    ctx.moveTo(x - shutterW - 1, y + 12); ctx.lineTo(x - 3, y + 12);
    ctx.stroke();

    // Right shutter
    ctx.fillStyle = shutterColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.fillRect(x + w + 2, y, shutterW, h);
    ctx.strokeRect(x + w + 2, y, shutterW, h);
    // Louver slats
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w + 3, y + 4); ctx.lineTo(x + w + shutterW + 1, y + 4);
    ctx.moveTo(x + w + 3, y + 8); ctx.lineTo(x + w + shutterW + 1, y + 8);
    ctx.moveTo(x + w + 3, y + 12); ctx.lineTo(x + w + shutterW + 1, y + 12);
    ctx.stroke();

    // 2. Window Frame & Glowing Glass
    ctx.fillStyle = '#fef08a'; // Warm amber candle glow
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Interior window glass pane divider (Mullions)
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();

    // Diagonal glass gleam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 3); ctx.lineTo(x + 6, y + 7);
    ctx.stroke();

    // 3. Flower Box below window
    const boxH = 5;
    const boxY = y + h + 1;
    ctx.fillStyle = '#6b4423';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.fillRect(x - 3, boxY, w + 6, boxH);
    ctx.strokeRect(x - 3, boxY, w + 6, boxH);

    // Green foliage & blooming blossoms
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(x - 1, boxY, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w / 2, boxY, 2.8, 0, Math.PI * 2);
    ctx.arc(x + w + 1, boxY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Blossoms (crimson, pink, yellow, purple)
    const flowerColors = ['#f43f5e', '#fbbf24', '#ec4899', '#a855f7'];
    for (let i = 0; i < 3; i++) {
      const fx = x + 1 + i * ((w - 2) / 2);
      ctx.fillStyle = flowerColors[i % flowerColors.length];
      ctx.beginPath();
      ctx.arc(fx, boxY - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fx, boxY - 1, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawFrontPorch(
    ctx: CanvasRenderingContext2D,
    doorX: number,
    doorY: number,
    porchW = 58,
    porchD = 24
  ): void {
    const outline = '#2b2118';
    ctx.save();

    // 1. Raised Wooden Deck Planks
    const deckX = doorX - porchW / 2;
    const deckY = doorY - porchD + 4;
    ctx.fillStyle = '#8a603c';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(deckX, deckY, porchW, porchD, 3);
    ctx.fill();
    ctx.stroke();

    // Deck plank vertical lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    for (let px = deckX + 10; px < deckX + porchW; px += 10) {
      ctx.beginPath();
      ctx.moveTo(px, deckY);
      ctx.lineTo(px, deckY + porchD);
      ctx.stroke();
    }

    // 2. Entrance Steps leading down to ground
    const stepW = porchW - 12;
    const stepH = 5;
    ctx.fillStyle = '#6c4728';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.fillRect(doorX - stepW / 2, deckY + porchD, stepW, stepH);
    ctx.strokeRect(doorX - stepW / 2, deckY + porchD, stepW, stepH);

    // 3. Carved Wooden Porch Support Pillars
    const pillarW = 5;
    const pillarH = 34;
    const pillarTopY = deckY - 14;
    ctx.fillStyle = '#5a3818';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    // Left pillar
    ctx.fillRect(deckX + 3, pillarTopY, pillarW, pillarH);
    ctx.strokeRect(deckX + 3, pillarTopY, pillarW, pillarH);
    // Right pillar
    ctx.fillRect(deckX + porchW - 8, pillarTopY, pillarW, pillarH);
    ctx.strokeRect(deckX + porchW - 8, pillarTopY, pillarW, pillarH);

    // 4. Porch Canopy Awning Roof
    ctx.fillStyle = '#4a2c14';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(deckX - 3, pillarTopY);
    ctx.lineTo(doorX, pillarTopY - 10);
    ctx.lineTo(deckX + porchW + 3, pillarTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Hanging Brass/Iron Lantern beside door
    const lanternX = deckX + porchW - 4;
    const lanternY = pillarTopY + 12;

    // Bracket
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lanternX - 6, lanternY - 4);
    ctx.lineTo(lanternX, lanternY - 4);
    ctx.lineTo(lanternX, lanternY);
    ctx.stroke();

    // Lantern glass & warm glow
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.2;
    ctx.fillRect(lanternX - 3, lanternY, 6, 8);
    ctx.strokeRect(lanternX - 3, lanternY, 6, 8);

    // Warm light halo on porch deck
    const halo = ctx.createRadialGradient(lanternX, lanternY + 4, 2, lanternX, lanternY + 4, 18);
    halo.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    halo.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(lanternX, lanternY + 4, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawHeavyWoodenDoor(
    ctx: CanvasRenderingContext2D,
    doorX: number,
    doorY: number,
    w = 24,
    h = 34
  ): void {
    const outline = '#2b2118';
    ctx.save();

    const x = doorX - w / 2;
    const y = doorY - h;

    // Arched top door casing
    ctx.fillStyle = '#3a2012';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [7, 7, 1, 1]);
    ctx.fill();
    ctx.stroke();

    // Vertical wood planks
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + w / 3, y + 4); ctx.lineTo(x + w / 3, y + h);
    ctx.moveTo(x + (2 * w) / 3, y + 4); ctx.lineTo(x + (2 * w) / 3, y + h);
    ctx.stroke();

    // Iron strap hinges
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(x + 2, y + 8, w - 8, 2.5);
    ctx.fillRect(x + 2, y + h - 10, w - 8, 2.5);

    // Brass doorknob
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + w - 5, y + h / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawChimneyWithSmoke(
    ctx: CanvasRenderingContext2D,
    chimneyX: number,
    chimneyY: number,
    cw = 16,
    ch = 52,
    globalTime: number
  ): void {
    const outline = '#2b2118';
    ctx.save();

    // Cobblestone Chimney Stack
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.fillRect(chimneyX, chimneyY, cw, ch);
    ctx.strokeRect(chimneyX, chimneyY, cw, ch);

    // Mortar lines & stone blocks
    ctx.fillStyle = '#475569';
    ctx.fillRect(chimneyX + 2, chimneyY + 6, cw - 6, 6);
    ctx.fillRect(chimneyX + 4, chimneyY + 18, cw - 6, 6);
    ctx.fillRect(chimneyX + 2, chimneyY + 30, cw - 5, 6);

    // Flared stone chimney cap (Corbel)
    ctx.fillStyle = '#475569';
    ctx.fillRect(chimneyX - 2, chimneyY, cw + 4, 5);
    ctx.strokeRect(chimneyX - 2, chimneyY, cw + 4, 5);

    // Animated Translucent Smoke Puffs (Continuously rising and swaying)
    const puffCount = 5;
    const cycleDuration = 3600;
    const chimneyTopX = chimneyX + cw / 2;
    const chimneyTopY = chimneyY;

    for (let i = 0; i < puffCount; i++) {
      const puffProgress = ((globalTime + i * (cycleDuration / puffCount)) % cycleDuration) / cycleDuration;
      const yOffset = -puffProgress * 46;
      const sway = Math.sin((globalTime * 0.003) + i + puffProgress * 2.5) * (9 * puffProgress);
      const radius = 3.5 + puffProgress * 9.5;
      const alpha = (1 - puffProgress) * 0.42;

      ctx.fillStyle = `rgba(240, 240, 235, ${alpha})`;
      ctx.beginPath();
      ctx.arc(chimneyTopX + sway, chimneyTopY + yOffset, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawStackedFirewood(ctx: CanvasRenderingContext2D, x: number, y: number, count = 12): void {
    const outline = '#2b2118';
    ctx.save();
    const logW = 13;
    const logH = 5;
    const cols = 3;
    const rows = Math.ceil(count / cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lx = x + c * (logW + 1);
        const ly = y - r * (logH + 1);
        ctx.fillStyle = '#854d0e';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(lx, ly, logW, logH, 1.5);
        ctx.fill();
        ctx.stroke();

        // End grain
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(lx + 2, ly + logH / 2, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawBuildingNameBanner(ctx: CanvasRenderingContext2D, b: Building): void {
    const outline = '#2b2118';
    ctx.save();

    ctx.fillStyle = 'rgba(247, 241, 227, 0.95)';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(b.x + 14, b.y + 4, b.width - 28, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${b.icon} ${b.name}`, b.x + b.width / 2, b.y + 15);

    ctx.restore();
  }

  /**
   * Autonomous Settler Construction Site:
   * - Foundation trench & corner survey stakes with string lines
   * - Wooden platform joists
   * - Vertical scaffolding poles with diagonal bracing
   * - Tool chest and raw timber logs
   * - Dynamic progress meter
   */
  private drawConstructionSite(b: Building): void {
    const ctx = this.ctx;
    const outline = '#2b2118';
    ctx.save();

    // 1. Excavated Ground Dirt Footprint
    ctx.fillStyle = '#bfa87a';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    // 2. Four Wooden Corner Survey Stakes with Taut String
    const stakes = [
      { x: b.x - 4, y: b.y - 4 },
      { x: b.x + b.width + 4, y: b.y - 4 },
      { x: b.x + b.width + 4, y: b.y + b.height + 4 },
      { x: b.x - 4, y: b.y + b.height + 4 }
    ];

    // String lines
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(stakes[0].x, stakes[0].y);
    ctx.lineTo(stakes[1].x, stakes[1].y);
    ctx.lineTo(stakes[2].x, stakes[2].y);
    ctx.lineTo(stakes[3].x, stakes[3].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Stakes
    for (const st of stakes) {
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.4;
      ctx.fillRect(st.x - 2, st.y - 6, 4, 12);
      ctx.strokeRect(st.x - 2, st.y - 6, 4, 12);
    }

    // 3. Wall Progress (Rises as progress reaches 100%)
    const wallH = (b.height - 16) * (b.constructionProgress / 100);
    ctx.fillStyle = 'rgba(138, 110, 72, 0.85)';
    ctx.fillRect(b.x + 8, b.y + b.height - wallH - 8, b.width - 16, wallH);
    ctx.strokeRect(b.x + 8, b.y + b.height - wallH - 8, b.width - 16, wallH);

    // 4. Scaffolding Timber Poles & Diagonal Braces
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2.4;
    // Left scaffolding upright
    ctx.beginPath();
    ctx.moveTo(b.x + 12, b.y - 8); ctx.lineTo(b.x + 12, b.y + b.height);
    // Right scaffolding upright
    ctx.moveTo(b.x + b.width - 12, b.y - 8); ctx.lineTo(b.x + b.width - 12, b.y + b.height);
    // Crossed diagonal braces
    ctx.moveTo(b.x + 12, b.y + 10); ctx.lineTo(b.x + b.width - 12, b.y + b.height - 10);
    ctx.moveTo(b.x + b.width - 12, b.y + 10); ctx.lineTo(b.x + 12, b.y + b.height - 10);
    ctx.stroke();

    // 5. Raw Logs Stacked on ground
    this.drawStackedFirewood(ctx, b.x + 16, b.y + b.height - 10, 8);

    // 6. Overhead Progress Pill Banner
    ctx.fillStyle = 'rgba(247, 241, 227, 0.95)';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(b.x + 14, b.y - 28, b.width - 28, 20, 5);
    ctx.fill();
    ctx.stroke();

    // Progress bar fill inside pill
    ctx.fillStyle = '#eab308';
    ctx.fillRect(b.x + 18, b.y - 24, (b.width - 36) * (b.constructionProgress / 100), 12);

    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🔨 Building: ${Math.round(b.constructionProgress)}%`, b.x + b.width / 2, b.y - 18);

    ctx.restore();
  }

  private drawItem(item: WorldItem, globalTime: number): void {
    const ctx = this.ctx;
    const bounce = Math.sin(globalTime * 0.005 + item.x) * 2;
    const y = item.y + bounce;
    const outline = '#2b2118';

    ctx.save();
    ctx.translate(item.x, y);

    switch (item.type) {
      case 'log':
        ctx.fillStyle = '#7a5230';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-8, -4, 16, 8, 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'berries':
        ctx.fillStyle = '#8b3fb8';
        ctx.beginPath();
        ctx.arc(-3, 0, 3, 0, Math.PI * 2);
        ctx.arc(3, 0, 3, 0, Math.PI * 2);
        ctx.arc(0, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'fish':
        ctx.fillStyle = '#4ba493';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'axe':
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-2, -8, 3, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-7, -8, 7, 5);
        break;

      case 'hammer':
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-1.5, -6, 3, 14);
        ctx.fillStyle = '#71717a';
        ctx.fillRect(-5, -8, 10, 4);
        break;

      default:
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  private drawDepthSortedEntities(globalTime: number): void {
    const ctx = this.ctx;

    type RenderEntity = 
      | { kind: 'agent'; y: number; agent: AgentData }
      | { kind: 'tree'; y: number; tree: ForestTree }
      | { kind: 'animal'; y: number; animal: WildlifeAnimal }
      | { kind: 'building'; y: number; building: Building }
      | { kind: 'caravan'; y: number };

    const entities: RenderEntity[] = [];

    // 1. Buildings (depth-sorted by their front ground baseline so trees, settlers, and animals layer properly)
    for (const building of this.sim.world.buildings) {
      if (building.id === this.activeInteriorBuildingId) continue;
      entities.push({ kind: 'building', y: building.y + building.height - 0.5, building });
    }

    // 2. Settlers (residents inside a cutaway interior are shown when the house is focused)
    for (const agent of this.sim.agents) {
      if (this.getIndoorBuildingForAgent(agent.data)) {
        continue;
      }
      entities.push({ kind: 'agent', y: agent.data.y, agent: agent.data });
    }

    // 3. Trees
    for (const tree of this.sim.world.trees) {
      entities.push({ kind: 'tree', y: tree.y, tree });
    }

    // 4. Wildlife Animals (depth-sorted with buildings, trees, and settlers)
    for (const animal of this.sim.world.animals) {
      entities.push({ kind: 'animal', y: animal.y, animal });
    }

    // 5. Caravan
    if (this.sim.caravan.active) {
      entities.push({ kind: 'caravan', y: this.sim.caravan.y });
    }

    entities.sort((a, b) => a.y - b.y);

    for (const ent of entities) {
      if (ent.kind === 'building') {
        this.drawBuilding(ent.building, globalTime);
      } else if (ent.kind === 'tree') {
        const isSelected = !!(this.sim.selectedTree && this.sim.selectedTree.id === ent.tree.id);
        const isHoveredForRemoval = (this.sim.activeGodPower === 'remove_tree') && (this.hoveredTreeId === ent.tree.id);
        TreeRenderer.drawTree(ctx, ent.tree, globalTime, isSelected, isHoveredForRemoval);
      } else if (ent.kind === 'agent') {
        const isSelected = this.sim.selectedAgent?.data.id === ent.agent.id;
        if (isSelected) {
          this.drawSelectionIndicator(ent.agent.x, ent.agent.y, globalTime);
        }
        const isDead = ent.agent.isDead || ent.agent.actionState === 'dead';
        const fadeAlpha = isDead && ent.agent.deathTimer !== undefined && ent.agent.deathTimer < 3
          ? Math.max(0, ent.agent.deathTimer / 3)
          : 1;

        if (fadeAlpha < 1) {
          ctx.save();
          ctx.globalAlpha *= fadeAlpha;
        }

        SpriteRenderer.drawAgent(ctx, ent.agent, globalTime);
        this.drawAgentTag(ent.agent);
        BubbleRenderer.drawBubble(ctx, ent.agent, globalTime);

        if (fadeAlpha < 1) {
          ctx.restore();
        }
      } else if (ent.kind === 'animal') {
        const isDead = ent.animal.isDead || ent.animal.state === 'dead';
        const fadeAlpha = isDead && ent.animal.deathTimer !== undefined && ent.animal.deathTimer < 3
          ? Math.max(0, ent.animal.deathTimer / 3)
          : 1;

        if (fadeAlpha < 1) {
          ctx.save();
          ctx.globalAlpha *= fadeAlpha;
        }

        this.drawWildlifeAnimal(ent.animal, globalTime);

        if (fadeAlpha < 1) {
          ctx.restore();
        }
      } else {
        CaravanRenderer.draw(ctx, this.sim.caravan, globalTime);
      }
    }
  }

  /**
   * Dispatches drawing for autonomous wildlife animals
   */
  private drawWildlifeAnimal(animal: WildlifeAnimal, globalTime: number): void {
    const spriteTop = AnimalSpriteRenderer.draw(this.ctx, animal, globalTime);
    if (spriteTop !== null) {
      // Draw health bar if the animal is wounded
      if (
        animal.health !== undefined &&
        animal.maxHealth !== undefined &&
        animal.health < animal.maxHealth &&
        !animal.isDead
      ) {
        this.drawAnimalHealthBar(animal, spriteTop);
      }

      if (animal.emote) {
        this.drawAnimalEmote(this.ctx, animal.emote, animal.x, animal.y + spriteTop - 8);
      }
      return;
    }

    // Procedural fallbacks for the first frame(s) while PNGs decode.
    switch (animal.type) {
      case 'chicken':
        this.drawRabbit(animal, globalTime);
        break;
      case 'sheep':
        this.drawDeer(animal, globalTime);
        break;
      case 'cow':
        this.drawCow(animal, globalTime);
        break;
      case 'dog':
        this.drawDuck(animal, globalTime);
        break;
    }
  }

  /**
   * Illustrated Chibi Rabbit with hopping squash-and-stretch physics
   */
  private drawRabbit(animal: WildlifeAnimal, _globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#26201a';

    ctx.save();
    ctx.translate(animal.x, animal.y);
    if (animal.facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.scale(animal.scale, animal.scale);

    const isMoving = animal.state === 'hopping' || animal.state === 'fleeing';
    const hopPhase = isMoving ? Math.abs(Math.sin(animal.animTimer * (animal.state === 'fleeing' ? 14 : 9))) : 0;
    const hopY = -hopPhase * 8.5;
    const stretch = isMoving ? (1 + hopPhase * 0.22) : 1;
    const squash = isMoving ? (1 - hopPhase * 0.14) : 1;

    // Drop shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 8 * (1 - hopPhase * 0.3), 3.5 * (1 - hopPhase * 0.3), 0, 0, Math.PI * 2);
    ctx.fill();

    // Colors
    let bodyColor = '#f8fafc';
    let underColor = '#e2e8f0';
    if (animal.variant === 1) {
      bodyColor = '#92400e';
      underColor = '#d97706';
    } else if (animal.variant === 2) {
      bodyColor = '#f59e0b';
      underColor = '#fef3c7';
    }

    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;

    // Cotton tail at rear
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -5 + hopY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hind Leg / Foot
    ctx.fillStyle = underColor;
    ctx.beginPath();
    ctx.ellipse(-2, -2 + hopY, 4.5 * stretch, 3 * squash, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Chubby Fluffy Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -6 + hopY, 7.5 * squash, 6 * stretch, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Front paw
    ctx.fillStyle = underColor;
    ctx.beginPath();
    ctx.ellipse(5, -2 + hopY, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute Round Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(6, -9 + hopY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Long Perky Ears with Pink Inner Ear
    const earWiggle = Math.sin(animal.animTimer * 5) * 0.15;
    // Back Ear
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(4.5, -17 + hopY, 2.2, 6, -0.25 + earWiggle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(4.5, -17 + hopY, 1.2, 4.2, -0.25 + earWiggle, 0, Math.PI * 2);
    ctx.fill();

    // Front Ear
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(7.5, -18 + hopY, 2.2, 6.2, 0.15 + earWiggle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(7.5, -18 + hopY, 1.2, 4.4, 0.15 + earWiggle, 0, Math.PI * 2);
    ctx.fill();

    // Shiny Bead Eye with Sparkle Dot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8, -10 + hopY, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8.5, -10.4 + hopY, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Pink Twitching Nose & Whiskers
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(11, -8.5 + hopY, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(38, 30, 20, 0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(10, -8 + hopY); ctx.lineTo(15, -9 + hopY);
    ctx.moveTo(10, -7.5 + hopY); ctx.lineTo(14, -6.5 + hopY);
    ctx.stroke();

    ctx.restore();

    // Overhead Emote Bubble
    if (animal.emote) {
      this.drawAnimalEmote(ctx, animal.emote, animal.x, animal.y - 20);
    }
  }

  /**
   * Illustrated Woodland Deer with graceful prance and stags with branching antlers
   */
  private drawDeer(animal: WildlifeAnimal, _globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#26201a';

    ctx.save();
    ctx.translate(animal.x, animal.y);
    if (animal.facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.scale(animal.scale, animal.scale);

    const isMoving = animal.state === 'walking' || animal.state === 'fleeing';
    const legSwing = isMoving ? Math.sin(animal.animTimer * (animal.state === 'fleeing' ? 12 : 7)) * 4.5 : 0;

    // Drop shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const deerCoat = animal.variant === 2 ? '#b46a36' : '#96542e';
    const deerUnder = '#fef3c7';

    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;

    // 4 Slender Legs with Dark Hooves
    // Back legs
    ctx.strokeStyle = deerCoat;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-9, -6);
    ctx.lineTo(-9 - legSwing, 3);
    ctx.moveTo(-5, -6);
    ctx.lineTo(-5 + legSwing, 3);
    ctx.stroke();

    // Front legs
    ctx.beginPath();
    ctx.moveTo(7, -6);
    ctx.lineTo(7 + legSwing, 3);
    ctx.moveTo(11, -6);
    ctx.lineTo(11 - legSwing, 3);
    ctx.stroke();

    // Dark hooves
    ctx.fillStyle = '#1e1b18';
    ctx.fillRect(-10 - legSwing, 2, 2.5, 2);
    ctx.fillRect(-6 + legSwing, 2, 2.5, 2);
    ctx.fillRect(6 + legSwing, 2, 2.5, 2);
    ctx.fillRect(10 - legSwing, 2, 2.5, 2);

    // Graceful Barrel Torso
    ctx.fillStyle = deerCoat;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, -11, 13, 7.5, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cream Underbelly
    ctx.fillStyle = deerUnder;
    ctx.beginPath();
    ctx.ellipse(2, -7.5, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spotted Fawn white dappled spots
    if (animal.variant === 2) {
      ctx.fillStyle = '#ffffff';
      for (const [sx, sy] of [[-6, -14], [-2, -15], [3, -14], [0, -12], [-4, -10]]) {
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Little White-Bottomed Tail
    ctx.fillStyle = deerCoat;
    ctx.beginPath();
    ctx.ellipse(-13, -15, 3.5, 4.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-13.5, -14.5, 2, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Neck and Head Angle (lowered when grazing or drinking)
    const isHeadDown = animal.state === 'grazing' || animal.state === 'drinking';
    const neckEndX = isHeadDown ? 14 : 10;
    const neckEndY = isHeadDown ? -4 : -20;
    const headX = isHeadDown ? 18 : 13;
    const headY = isHeadDown ? -2 : -22;

    // Elegant Slender Neck
    ctx.fillStyle = deerCoat;
    ctx.beginPath();
    ctx.moveTo(6, -15);
    ctx.lineTo(neckEndX, neckEndY);
    ctx.lineTo(neckEndX + 4, neckEndY + 3);
    ctx.lineTo(10, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Refined Head
    ctx.beginPath();
    ctx.ellipse(headX, headY, 5.5, 4, isHeadDown ? 0.3 : -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cream Muzzle & Dark Nose
    ctx.fillStyle = deerUnder;
    ctx.beginPath();
    ctx.ellipse(headX + 4.5, headY + 1, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.arc(headX + 6.5, headY + 1, 1, 0, Math.PI * 2);
    ctx.fill();

    // Alert Liquid Deer Eye with Sparkle Dot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(headX + 1, headY - 1, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(headX + 1.4, headY - 1.4, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Alert Ears
    ctx.fillStyle = deerCoat;
    ctx.beginPath();
    ctx.ellipse(headX - 3, headY - 5, 2, 4.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stag Antlers (Majestic branching antlers for variant 0)
    if (animal.variant === 0 && !isHeadDown) {
      ctx.strokeStyle = '#452b14';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';

      // Left Antler Beam
      ctx.beginPath();
      ctx.moveTo(headX - 1, headY - 3);
      ctx.quadraticCurveTo(headX - 4, headY - 14, headX - 2, headY - 18);
      // Brow tine
      ctx.moveTo(headX - 2, headY - 8);
      ctx.lineTo(headX + 3, headY - 11);
      // Top tines
      ctx.moveTo(headX - 3, headY - 14);
      ctx.lineTo(headX - 6, headY - 17);
      ctx.moveTo(headX - 2, headY - 18);
      ctx.lineTo(headX + 1, headY - 21);
      ctx.stroke();

      // Right Antler Beam
      ctx.beginPath();
      ctx.moveTo(headX + 2, headY - 3);
      ctx.quadraticCurveTo(headX + 6, headY - 14, headX + 8, headY - 19);
      // Brow tine
      ctx.moveTo(headX + 4, headY - 8);
      ctx.lineTo(headX + 9, headY - 10);
      // Top tines
      ctx.moveTo(headX + 6, headY - 14);
      ctx.lineTo(headX + 11, headY - 16);
      ctx.stroke();
    }

    ctx.restore();

    if (animal.emote) {
      this.drawAnimalEmote(ctx, animal.emote, animal.x, animal.y - 30);
    }
  }

  /**
   * Illustrated Pastoral Cow with chewing cud animation and tail swish
   */
  private drawCow(animal: WildlifeAnimal, _globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#26201a';

    ctx.save();
    ctx.translate(animal.x, animal.y);
    if (animal.facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.scale(animal.scale, animal.scale);

    const tailWag = Math.sin(animal.animTimer * 3.8) * 6;
    const legWag = animal.state === 'walking' ? Math.sin(animal.animTimer * 5.5) * 3 : 0;
    const chewX = (animal.state === 'chewing' || animal.state === 'grazing') ? Math.sin(animal.animTimer * 6) * 1.6 : 0;

    // Drop shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const isJersey = animal.variant === 1;
    const cowBase = isJersey ? '#a16207' : '#f8fafc';

    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;

    // 4 Sturdy Legs with Cloven Hooves
    ctx.fillStyle = cowBase;
    // Hind legs
    ctx.fillRect(-14 - legWag, -4, 4.5, 9);
    ctx.strokeRect(-14 - legWag, -4, 4.5, 9);
    ctx.fillRect(-8 + legWag, -4, 4.5, 9);
    ctx.strokeRect(-8 + legWag, -4, 4.5, 9);
    // Front legs
    ctx.fillRect(8 + legWag, -4, 4.5, 9);
    ctx.strokeRect(8 + legWag, -4, 4.5, 9);
    ctx.fillRect(14 - legWag, -4, 4.5, 9);
    ctx.strokeRect(14 - legWag, -4, 4.5, 9);

    // Dark hooves
    ctx.fillStyle = '#1e1b18';
    ctx.fillRect(-14 - legWag, 4, 4.5, 2.5);
    ctx.fillRect(-8 + legWag, 4, 4.5, 2.5);
    ctx.fillRect(8 + legWag, 4, 4.5, 2.5);
    ctx.fillRect(14 - legWag, 4, 4.5, 2.5);

    // Swishing Tail at Rear
    ctx.strokeStyle = cowBase;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-16, -15);
    ctx.quadraticCurveTo(-20 + tailWag * 0.5, -8, -22 + tailWag, -3);
    ctx.stroke();

    // Hairy tail tuft
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.ellipse(-23 + tailWag, -2, 2.5, 3.8, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Chunky Barrel Body
    ctx.fillStyle = cowBase;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-16, -19, 32, 17, 7);
    ctx.fill();
    ctx.stroke();

    // Holstein Black Dairy Patches
    if (!isJersey) {
      ctx.fillStyle = '#1e293b';
      // Patch 1: back
      ctx.beginPath();
      ctx.arc(-8, -17, 6, 0, Math.PI * 2);
      ctx.arc(-4, -14, 5, 0, Math.PI * 2);
      ctx.fill();
      // Patch 2: flank
      ctx.beginPath();
      ctx.arc(6, -11, 5, 0, Math.PI * 2);
      ctx.arc(10, -13, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Jersey Cream Underbelly
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(0, -5, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Friendly Head
    ctx.fillStyle = cowBase;
    ctx.strokeStyle = outline;
    ctx.beginPath();
    ctx.roundRect(14, -18, 12, 12, 4);
    ctx.fill();
    ctx.stroke();

    // Soft Floppy Ears
    ctx.fillStyle = cowBase;
    ctx.beginPath();
    ctx.ellipse(13, -15, 2, 4.5, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Curved Horns on Forehead
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.moveTo(17, -18);
    ctx.quadraticCurveTo(16, -24, 13, -24);
    ctx.lineTo(15, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sweet Pink Muzzle with Chewing Motion
    ctx.fillStyle = '#fbcfe8';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(22 + chewX, -13, 8, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.arc(28 + chewX, -10, 0.9, 0, Math.PI * 2);
    ctx.arc(28 + chewX, -7, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Cute Grass Blade sticking out when chewing
    if (animal.state === 'chewing' || animal.state === 'grazing') {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(27 + chewX, -8);
      ctx.quadraticCurveTo(34 + chewX, -11, 36 + chewX, -9);
      ctx.stroke();
    }

    // Gentle Dark Cow Eye with Highlight
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(19, -13, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(19.4, -13.4, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (animal.emote) {
      this.drawAnimalEmote(ctx, animal.emote, animal.x, animal.y - 28);
    }
  }

  /**
   * Illustrated River Duck with buoyant floating physics, concentric water ripples, and diving
   */
  private drawDuck(animal: WildlifeAnimal, _globalTime: number): void {
    const ctx = this.ctx;
    const outline = '#26201a';

    ctx.save();
    ctx.translate(animal.x, animal.y);

    const bobY = Math.sin(animal.animTimer * 3.5) * 1.8;

    // 1. Concentric Water Ripples expanding outward on the river current
    if (animal.ripples) {
      for (const rip of animal.ripples) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.opacity})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(rip.x - animal.x, (rip.y - animal.y) + bobY, rip.radius, rip.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (animal.facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.scale(animal.scale, animal.scale);

    const isMallard = animal.variant === 0;

    // 2. Diving State: duck tips upside down to forage river moss
    if (animal.state === 'diving') {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.4;

      // Little water splash rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 1 + bobY, 8, 3, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Tail sticking up in the air
      ctx.fillStyle = isMallard ? '#57534e' : '#fef08a';
      ctx.strokeStyle = outline;
      ctx.beginPath();
      ctx.moveTo(-6, 2 + bobY);
      ctx.lineTo(-2, -9 + bobY);
      ctx.lineTo(2, 2 + bobY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Webbed feet paddling above water
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(-1, -6 + bobY, 2.5, 1.4, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    // 3. Normal Floating & Swimming
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;

    // Buoyant Oval Body
    ctx.fillStyle = isMallard ? '#78716c' : '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, -3 + bobY, 10.5, 6.5, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mallard Chestnut Breast Patch
    if (isMallard) {
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.ellipse(5, -2 + bobY, 5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Curved Tail Feathers
    ctx.fillStyle = isMallard ? '#1e293b' : '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-9, -4 + bobY);
    ctx.quadraticCurveTo(-14, -8 + bobY, -11, -9 + bobY);
    ctx.lineTo(-7, -5 + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing Line Accent
    ctx.strokeStyle = isMallard ? '#44403c' : '#fde047';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -3 + bobY);
    ctx.quadraticCurveTo(0, -1 + bobY, 4, -4 + bobY);
    ctx.stroke();

    // Neck & Head
    ctx.fillStyle = isMallard ? '#065f46' : '#fef08a';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;

    // White neck ring for mallard
    if (isMallard) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5.5, -8 + bobY, 3, 2);
    }

    // Emerald Head (Mallard) or Yellow Head
    ctx.fillStyle = isMallard ? '#065f46' : '#fef08a';
    ctx.beginPath();
    ctx.arc(7.5, -9 + bobY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sunny Yellow/Orange Duck Bill
    ctx.fillStyle = isMallard ? '#eab308' : '#ea580c';
    ctx.beginPath();
    ctx.moveTo(11, -10 + bobY);
    ctx.lineTo(16, -8.5 + bobY);
    ctx.lineTo(11, -7 + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark Bead Eye with Sparkle Dot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8.5, -10 + bobY, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8.8, -10.3 + bobY, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (animal.emote) {
      this.drawAnimalEmote(ctx, animal.emote, animal.x, animal.y - 18);
    }
  }

  /**
   * Overhead Illustrated Emote Bubble for Wildlife
   */
  /**
   * Renders a clean floating health bar above wounded wildlife animals
   */
  private drawAnimalHealthBar(animal: WildlifeAnimal, spriteTop: number): void {
    const ctx = this.ctx;
    const barW = Math.max(22, (animal.scale || 1) * 26);
    const barH = 3.5;
    const barX = animal.x - barW / 2;
    const barY = animal.y + spriteTop - 6;

    const hpRatio = Math.max(0, Math.min(1, (animal.health ?? 0) / (animal.maxHealth ?? 1)));

    ctx.save();
    // Dark background pill
    ctx.fillStyle = 'rgba(20, 16, 12, 0.8)';
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
      ctx.fill();
    } else {
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    }

    // Health bar fill color based on remaining health
    const fillColor = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = fillColor;
    const fillW = Math.max(1, barW * hpRatio);
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(barX, barY, fillW, barH, 1.5);
      ctx.fill();
    } else {
      ctx.fillRect(barX, barY, fillW, barH);
    }

    ctx.restore();
  }

  private drawAnimalEmote(ctx: CanvasRenderingContext2D, emote: string, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Drop shadow
    ctx.fillStyle = 'rgba(38, 30, 20, 0.18)';
    ctx.beginPath();
    ctx.roundRect(-10, -11, 20, 16, 6);
    ctx.fill();

    // Bubble white body
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.strokeStyle = '#26201a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-11, -12, 22, 17, 6);
    // Downward tail
    ctx.moveTo(-2, 5);
    ctx.lineTo(0, 8);
    ctx.lineTo(2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Emoji icon centered
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emote, 0, -3.5);

    ctx.restore();
  }

  private drawAgentTag(agent: AgentData, compact = false): void {
    const ctx = this.ctx;
    const isSelected = this.sim.selectedAgent?.data.id === agent.id;
    const isDead = agent.isDead || agent.actionState === 'dead';
    const isLyingDown = isDead || agent.actionState === 'sleeping' || agent.actionState === 'unconscious';
    const isSitting = agent.actionState === 'sitting';
    let tagY: number;
    if (isLyingDown) {
      tagY = agent.y + (compact ? 11 : 14);
    } else {
      const spriteTop = NpcSpriteRenderer.getSpriteTopOffset(agent);
      if (spriteTop !== null) {
        tagY = agent.y + spriteTop - (compact ? 4 : 6);
      } else {
        tagY = agent.y - (isSitting ? (compact ? 42 : 48) : (compact ? 50 : 56));
      }
    }

    ctx.save();
    // Interior tags use first names only: rooms can hold several residents and
    // the full "Name [Family]" pill becomes unreadable when they stand close.
    const countdown = isDead && agent.deathTimer !== undefined ? Math.max(1, Math.ceil(agent.deathTimer)) : null;
    const isOldAge = agent.causeOfDeath === 'old_age';
    const deadPrefix = isOldAge ? '🕊️' : '💀';
    const deadLabel = isOldAge ? 'PASSED' : 'DEAD';
    const nameText = compact
      ? (isDead ? `${deadPrefix} ${agent.name} (${countdown}s)` : agent.name)
      : (isDead ? `${deadPrefix} ${agent.name} [${deadLabel} ${countdown}s]` : `${agent.name} [${agent.familyName}]`);
    const fontSize = compact ? 7.2 : 9.5;
    const padX = compact ? (isSelected ? 3.5 : 2.5) : (isSelected ? 5.5 : 4);
    const pillH = compact ? (isSelected ? 12 : 10.5) : (isSelected ? 16 : 14);
    ctx.font = `bold ${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(nameText).width;

    if (isSelected) {
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = compact ? 1.5 : 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
    } else if (isDead) {
      ctx.fillStyle = isOldAge ? 'rgba(71, 85, 105, 0.95)' : 'rgba(220, 38, 38, 0.94)';
      ctx.strokeStyle = isOldAge ? '#1e293b' : '#450a0a';
      ctx.lineWidth = compact ? 1 : 1.4;
      ctx.shadowBlur = 0;
    } else if (agent.isPossessed) {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.95)';
      ctx.strokeStyle = '#2b2118';
      ctx.lineWidth = compact ? 1 : 1.4;
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(247, 241, 227, 0.92)';
      ctx.strokeStyle = '#2b2118';
      ctx.lineWidth = compact ? 1 : 1.4;
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.roundRect(agent.x - textWidth / 2 - padX, tagY - pillH / 2, textWidth + padX * 2, pillH, compact ? 3 : 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = (isSelected || isDead) ? '#ffffff' : '#2b2118';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameText, agent.x, tagY);

    ctx.restore();
  }

  /**
   * In-Game HUD Matching the Reference Image:
   * - Bottom-left: Cute row of red hearts with white borders
   * - Top-right: Golden coin medallion pill with text 0225
   */
  private drawReferenceHUD(): void {
    const ctx = this.ctx;
    ctx.save();

    // 1. Bottom-Left Heart Row (Matching reference image!)
    const heartStartX = 24;
    const heartY = this.canvas.height - 24;
    const heartCount = 8;

    for (let i = 0; i < heartCount; i++) {
      const hx = heartStartX + i * 20;
      this.drawIllustratedHeart(ctx, hx, heartY, 8);
    }

    // 2. Top-Right Golden Coin Badge (Matching reference image!)
    const coinBadgeW = 100;
    const coinBadgeH = 32;
    const coinBadgeX = this.canvas.width - coinBadgeW - 20;
    const coinBadgeY = 20;

    // Badge background pill (#c5984f)
    ctx.fillStyle = '#b78742';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(coinBadgeX, coinBadgeY, coinBadgeW, coinBadgeH, 16);
    ctx.fill();
    ctx.stroke();

    // Gold coin medallion
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(coinBadgeX + 16, coinBadgeY + 16, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(coinBadgeX + 16, coinBadgeY + 16, 8, 0, Math.PI * 2);
    ctx.fill();

    // Coin text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('0225', coinBadgeX + coinBadgeW - 14, coinBadgeY + 16);

    // 3. Pause Notification Banner (when sim.timeSpeed === 0)
    if (this.sim.timeSpeed === 0) {
      const bannerW = 340;
      const bannerH = 34;
      const bannerX = (this.canvas.width - bannerW) / 2;
      const bannerY = 18;

      ctx.save();
      ctx.fillStyle = 'rgba(28, 20, 14, 0.88)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 17);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸️ SIMULATION PAUSED (Press Space to Resume)', this.canvas.width / 2, bannerY + bannerH / 2);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawIllustratedHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.save();
    ctx.fillStyle = '#e53e3e'; // Bright red
    ctx.strokeStyle = '#ffffff'; // Crisp white border
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.7);
    ctx.bezierCurveTo(x + size, y, x + size, y - size, x, y - size * 0.5);
    ctx.bezierCurveTo(x - size, y - size, x - size, y, x, y + size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawSpecialEffects(globalTime: number): void {
    const ctx = this.ctx;
    const allEffects = [...this.sim.specialEffects, ...this.sim.world.specialEffects];

    for (const fx of allEffects) {
      const alpha = fx.timer / fx.maxTimer;

      if (fx.type === 'lightning') {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        let currentX = fx.x;
        let currentY = 0;
        ctx.moveTo(currentX, currentY);

        while (currentY < fx.y) {
          currentY += 25;
          currentX += (Math.random() - 0.5) * 35;
          ctx.lineTo(currentX, currentY);
        }
        ctx.lineTo(fx.x, fx.y);
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === 'heart_burst') {
        ctx.save();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + (globalTime * 0.005);
          const r = 35 * (1 - alpha);
          ctx.fillText('💖', fx.x + Math.cos(angle) * r, fx.y + Math.sin(angle) * r);
        }
        ctx.restore();
      } else if (fx.type === 'sparkle') {
        ctx.save();
        ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
        for (let i = 0; i < 8; i++) {
          const sx = fx.x + Math.sin(i * 1.5 + globalTime * 0.01) * 25;
          const sy = fx.y - (1 - alpha) * 40 + Math.cos(i) * 15;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (fx.type === 'arrow' && fx.targetX !== undefined && fx.targetY !== undefined) {
        ctx.save();
        const progress = 1 - (fx.timer / fx.maxTimer);
        const curX = fx.x + (fx.targetX - fx.x) * progress;
        const curY = fx.y + (fx.targetY - fx.y) * progress;
        const angle = Math.atan2(fx.targetY - fx.y, fx.targetX - fx.x);

        ctx.translate(curX, curY);
        ctx.rotate(angle);
        // Arrow shaft
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();
        // Arrow head
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(3, -3);
        ctx.lineTo(3, 3);
        ctx.closePath();
        ctx.fill();
        // Fletching feathers
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-8, -2); ctx.lineTo(-11, 0); ctx.lineTo(-8, 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private drawAtmosphere(globalTime: number): void {
    const ctx = this.ctx;
    const mins = this.sim.gameMinutes;
    const hour = mins / 60;

    let nightAlpha = 0;
    let tintColor = 'rgba(6, 12, 24, 0)';

    if (hour >= 20 || hour < 5) {
      nightAlpha = 0.72;
      tintColor = `rgba(18, 28, 48, ${nightAlpha})`;
    } else if (hour >= 5 && hour < 7) {
      const dawnProgress = (hour - 5) / 2;
      nightAlpha = (1 - dawnProgress) * 0.5;
      tintColor = `rgba(234, 140, 40, ${nightAlpha * 0.35})`;
    } else if (hour >= 17 && hour < 20) {
      const duskProgress = (hour - 17) / 3;
      nightAlpha = duskProgress * 0.65;
      tintColor = `rgba(120, 48, 135, ${nightAlpha * 0.4})`;
    }

    if (nightAlpha > 0.05) {
      ctx.save();
      ctx.fillStyle = tintColor;
      ctx.fillRect(0, 0, this.sim.world.width, this.sim.world.height);

      // Campfire glow (Reacts dynamically to bonfire state and height)
      const cf = this.sim.world.campfire;
      const currentSpriteKey = BonfireRenderer.resolveSpriteKey(cf, this.sim.gameMinutes, this.sim.weather, globalTime);
      const isSmoldering = currentSpriteKey === 'smoldering' || currentSpriteKey === 'dying_out';
      const isHigh = currentSpriteKey === 'burning_high' || currentSpriteKey === 'crackling';
      const glowRadius = isHigh ? 230 : isSmoldering ? 95 : 170;
      const glowIntensity = isHigh ? 0.75 : isSmoldering ? 0.35 : 0.58;
      const glowColor = isSmoldering ? 'rgba(239, 68, 68,' : 'rgba(251, 146, 60,';

      const radGrd = ctx.createRadialGradient(cf.x, cf.y, 15, cf.x, cf.y, glowRadius);
      radGrd.addColorStop(0, `${glowColor} ${glowIntensity})`);
      radGrd.addColorStop(1, `${glowColor} 0)`);
      ctx.fillStyle = radGrd;
      ctx.beginPath();
      ctx.arc(cf.x, cf.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Fireflies
      ctx.fillStyle = '#a3e635';
      for (let i = 0; i < 25; i++) {
        const flyX = (i * 95 + globalTime * 0.02) % this.sim.world.width;
        const flyY = (i * 55 + Math.sin(globalTime * 0.003 + i) * 80) % this.sim.world.height;
        const glow = Math.sin(globalTime * 0.006 + i) > 0;
        if (glow) {
          ctx.beginPath();
          ctx.arc(flyX, flyY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  private drawRain(delta: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 1.2;

    for (const drop of this.rainDrops) {
      drop.y += drop.speed * delta;
      drop.x -= (drop.speed * 0.25) * delta;

      if (drop.y > this.sim.world.height) {
        drop.y = -10;
        drop.x = Math.random() * this.sim.world.width;
      }

      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.25, drop.y + drop.length);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawMinimap(): void {
    const ctx = this.ctx;
    const mapW = this.sim.world.width;
    const mapH = this.sim.world.height;
    const miniW = 180;
    const miniH = miniW * (mapH / mapW);
    const miniX = this.canvas.width - miniW - 16;
    const miniY = this.canvas.height - miniH - 16;

    ctx.save();
    ctx.fillStyle = 'rgba(247, 241, 227, 0.92)';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(miniX, miniY, miniW, miniH, 8);
    ctx.fill();
    ctx.stroke();

    const rx = miniW / mapW;
    const ry = miniH / mapH;

    // River
    ctx.fillStyle = '#4ba493';
    for (let y = 0; y < mapH; y += 40) {
      const cx = this.sim.world.getRiverCenterX(y);
      ctx.fillRect(miniX + (cx - 20) * rx, miniY + y * ry, 40 * rx, 40 * ry);
    }

    // Ponds
    for (const pond of this.sim.world.ponds) {
      ctx.beginPath();
      ctx.ellipse(
        miniX + pond.centerX * rx,
        miniY + pond.centerY * ry,
        (pond.width * 0.42) * rx,
        (pond.height * 0.42) * ry,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Roads & Trails (Dynamically updating with new/moved houses)
    ctx.strokeStyle = '#c5ba8a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const r of this.sim.world.roads) {
      ctx.moveTo(miniX + r.x1 * rx, miniY + r.y1 * ry);
      if (r.controlPoint) {
        ctx.quadraticCurveTo(
          miniX + r.controlPoint.x * rx,
          miniY + r.controlPoint.y * ry,
          miniX + r.x2 * rx,
          miniY + r.y2 * ry
        );
      } else {
        ctx.lineTo(miniX + r.x2 * rx, miniY + r.y2 * ry);
      }
    }
    ctx.stroke();

    // Buildings
    for (const b of this.sim.world.buildings) {
      ctx.fillStyle = b.isConstructed ? '#8a6e48' : '#eab308';
      ctx.fillRect(miniX + b.x * rx, miniY + b.y * ry, Math.max(3, b.width * rx), Math.max(3, b.height * ry));
    }

    // South-East Whispering Forest Sanctuary Glade
    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.fillRect(miniX + 2150 * rx, miniY + 1240 * ry, 580 * rx, 500 * ry);

    // Wildlife Radar Dots
    for (const an of this.sim.world.animals) {
      if (this.isEntityBehindAnyBuilding(an.x, an.y)) continue;
      if (an.type === 'chicken') {
        ctx.fillStyle = '#facc15';
      } else if (an.type === 'sheep') {
        ctx.fillStyle = '#e2e8f0';
      } else if (an.type === 'cow') {
        ctx.fillStyle = '#a16207';
      } else if (an.type === 'rabbit') {
        ctx.fillStyle = '#f97316';
      } else {
        ctx.fillStyle = '#fb923c';
      }
      ctx.beginPath();
      ctx.arc(miniX + an.x * rx, miniY + an.y * ry, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Settlers (indoors settlers and settlers occluded behind houses are hidden until their building is focused)
    for (const a of this.sim.agents) {
      if (this.getIndoorBuildingForAgent(a.data) || this.isEntityBehindAnyBuilding(a.data.x, a.data.y)) continue;
      ctx.fillStyle = a.data.isPossessed ? '#eab308' : '#e53e3e';
      ctx.beginPath();
      ctx.arc(miniX + a.data.x * rx, miniY + a.data.y * ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Viewport box
    const vpW = (this.canvas.width / this.zoom) * rx;
    const vpH = (this.canvas.height / this.zoom) * ry;
    const vpX = miniX + (this.cameraX * rx) - vpW / 2;
    const vpY = miniY + (this.cameraY * ry) - vpH / 2;

    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(vpX, vpY, vpW, vpH);

    ctx.fillStyle = '#2b2118';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillText('FOREST RADAR', miniX + 6, miniY + 11);

    ctx.restore();
  }
}
