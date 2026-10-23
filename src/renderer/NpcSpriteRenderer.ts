import type { AgentData } from '../types/simulation';

import farmerUrl from '../assets/npcs/farmer.png';
import femaleFarmerUrl from '../assets/npcs/female_farmer.png';
import fishermanUrl from '../assets/npcs/fisherman.png';
import fisherwomanUrl from '../assets/npcs/fisherwoman.png';
import lumberjackUrl from '../assets/npcs/lumberjack.png';
import woodcutterUrl from '../assets/npcs/woodcutter.png';
import minerUrl from '../assets/npcs/miner.png';
import blacksmithUrl from '../assets/npcs/blacksmith.png';
import cookUrl from '../assets/npcs/cook.png';
import bakerUrl from '../assets/npcs/baker.png';
import merchantUrl from '../assets/npcs/merchant.png';
import shopkeeperUrl from '../assets/npcs/shopkeeper.png';
import guardUrl from '../assets/npcs/guard.png';
import guardCaptainUrl from '../assets/npcs/guard_captain.png';
import healerUrl from '../assets/npcs/healer.png';
import teacherUrl from '../assets/npcs/teacher.png';
import priestUrl from '../assets/npcs/priest.png';
import childBoyUrl from '../assets/npcs/child_boy.png';
import childGirlUrl from '../assets/npcs/child_girl.png';
import elderlyManUrl from '../assets/npcs/elderly_man.png';
import elderlyWomanUrl from '../assets/npcs/elderly_woman.png';
import travelerUrl from '../assets/npcs/traveler.png';
import wandererUrl from '../assets/npcs/wanderer.png';
import beggarUrl from '../assets/npcs/beggar.png';
import thiefUrl from '../assets/npcs/thief.png';
import banditUrl from '../assets/npcs/bandit.png';
import animalHandlerUrl from '../assets/npcs/animal_handler.png';
import pregnantWomanUrl from '../assets/npcs/pregnant_woman.png';
import childToddlerUrl from '../assets/npcs/child_toddler.png';
import toddlerUrl from '../assets/npcs/toddler.png';

import actSleepUrl from '../assets/actions/act_sleep.png';
import actFightUrl from '../assets/actions/act_fight.png';

import farmerAnimUrl from '../assets/animations/farmer.png';
import femaleFarmerAnimUrl from '../assets/animations/female_farmer.png';
import fishermanAnimUrl from '../assets/animations/fisherman.png';
import fisherwomanAnimUrl from '../assets/animations/fisherwoman.png';
import lumberjackAnimUrl from '../assets/animations/lumberjack.png';
import woodcutterAnimUrl from '../assets/animations/woodcutter.png';
import minerAnimUrl from '../assets/animations/miner.png';
import blacksmithAnimUrl from '../assets/animations/blacksmith.png';
import cookAnimUrl from '../assets/animations/cook.png';
import bakerAnimUrl from '../assets/animations/baker.png';
import merchantAnimUrl from '../assets/animations/merchant.png';
import shopkeeperAnimUrl from '../assets/animations/shopkeeper.png';
import guardAnimUrl from '../assets/animations/guard.png';
import guardCaptainAnimUrl from '../assets/animations/guard_captain.png';
import healerAnimUrl from '../assets/animations/healer.png';
import teacherAnimUrl from '../assets/animations/teacher.png';
import priestAnimUrl from '../assets/animations/priest.png';
import childBoyAnimUrl from '../assets/animations/child_boy.png';
import childGirlAnimUrl from '../assets/animations/child_girl.png';
import elderlyManAnimUrl from '../assets/animations/elderly_man.png';
import elderlyWomanAnimUrl from '../assets/animations/elderly_woman.png';
import travelerAnimUrl from '../assets/animations/traveler.png';
import wandererAnimUrl from '../assets/animations/wanderer.png';
import beggarAnimUrl from '../assets/animations/beggar.png';
import thiefAnimUrl from '../assets/animations/thief.png';
import banditAnimUrl from '../assets/animations/bandit.png';
import animalHandlerAnimUrl from '../assets/animations/animal_handler.png';
import pregnantWomanAnimUrl from '../assets/animations/pregnant_woman.png';
import childToddlerAnimUrl from '../assets/animations/child_toddler.png';
import toddlerAnimUrl from '../assets/animations/toddler.png';

import cookPondFill1Url from '../assets/npcs/cook_pond_fill_1.png';
import cookPondFill2Url from '../assets/npcs/cook_pond_fill_2.png';
import cookPondFill3Url from '../assets/npcs/cook_pond_fill_3.png';
import cookPondFill4Url from '../assets/npcs/cook_pond_fill_4.png';
import cookPondFill5Url from '../assets/npcs/cook_pond_fill_5.png';
import cookPondFill6Url from '../assets/npcs/cook_pond_fill_6.png';
import cookWaterLiftUrl from '../assets/npcs/cook_water_lift.png';
import cookWaterStandUrl from '../assets/npcs/cook_water_stand.png';
import cookWaterWalk1Url from '../assets/npcs/cook_water_walk_1.png';
import cookWaterWalk2Url from '../assets/npcs/cook_water_walk_2.png';
import cookWaterWalk3Url from '../assets/npcs/cook_water_walk_3.png';
import cookWaterIdleUrl from '../assets/npcs/cook_water_idle.png';

type NpcSpriteKey =
  | 'farmer'
  | 'female_farmer'
  | 'pregnant_woman'
  | 'fisherman'
  | 'fisherwoman'
  | 'lumberjack'
  | 'woodcutter'
  | 'miner'
  | 'blacksmith'
  | 'cook'
  | 'baker'
  | 'merchant'
  | 'shopkeeper'
  | 'guard'
  | 'guard_captain'
  | 'healer'
  | 'teacher'
  | 'priest'
  | 'child_boy'
  | 'child_girl'
  | 'child_toddler'
  | 'toddler'
  | 'elderly_man'
  | 'elderly_woman'
  | 'traveler'
  | 'wanderer'
  | 'beggar'
  | 'thief'
  | 'bandit'
  | 'animal_handler';

type ActionSpriteKey = 'act_sleep' | 'act_fight';

const NPC_SOURCES: Record<NpcSpriteKey, string> = {
  farmer: farmerUrl,
  female_farmer: femaleFarmerUrl,
  fisherman: fishermanUrl,
  fisherwoman: fisherwomanUrl,
  lumberjack: lumberjackUrl,
  woodcutter: woodcutterUrl,
  miner: minerUrl,
  blacksmith: blacksmithUrl,
  cook: cookUrl,
  baker: bakerUrl,
  merchant: merchantUrl,
  shopkeeper: shopkeeperUrl,
  guard: guardUrl,
  guard_captain: guardCaptainUrl,
  healer: healerUrl,
  teacher: teacherUrl,
  priest: priestUrl,
  child_boy: childBoyUrl,
  child_girl: childGirlUrl,
  elderly_man: elderlyManUrl,
  elderly_woman: elderlyWomanUrl,
  traveler: travelerUrl,
  wanderer: wandererUrl,
  beggar: beggarUrl,
  thief: thiefUrl,
  bandit: banditUrl,
  animal_handler: animalHandlerUrl,
  pregnant_woman: pregnantWomanUrl,
  child_toddler: childToddlerUrl,
  toddler: toddlerUrl
};

const ANIMATION_SOURCES: Record<NpcSpriteKey, string> = {
  farmer: farmerAnimUrl,
  female_farmer: femaleFarmerAnimUrl,
  pregnant_woman: pregnantWomanAnimUrl,
  fisherman: fishermanAnimUrl,
  fisherwoman: fisherwomanAnimUrl,
  lumberjack: lumberjackAnimUrl,
  woodcutter: woodcutterAnimUrl,
  miner: minerAnimUrl,
  blacksmith: blacksmithAnimUrl,
  cook: cookAnimUrl,
  baker: bakerAnimUrl,
  merchant: merchantAnimUrl,
  shopkeeper: shopkeeperAnimUrl,
  guard: guardAnimUrl,
  guard_captain: guardCaptainAnimUrl,
  healer: healerAnimUrl,
  teacher: teacherAnimUrl,
  priest: priestAnimUrl,
  child_boy: childBoyAnimUrl,
  child_girl: childGirlAnimUrl,
  elderly_man: elderlyManAnimUrl,
  elderly_woman: elderlyWomanAnimUrl,
  traveler: travelerAnimUrl,
  wanderer: wandererAnimUrl,
  beggar: beggarAnimUrl,
  thief: thiefAnimUrl,
  bandit: banditAnimUrl,
  animal_handler: animalHandlerAnimUrl,
  child_toddler: childToddlerAnimUrl,
  toddler: toddlerAnimUrl
};

const ACTION_SOURCES: Record<ActionSpriteKey, string> = {
  act_sleep: actSleepUrl,
  act_fight: actFightUrl
};

const MALE_SETTLER_POOL: NpcSpriteKey[] = [
  'farmer',
  'merchant',
  'miner',
  'blacksmith',
  'fisherman',
  'baker',
  'teacher',
  'priest',
  'guard',
  'traveler',
  'wanderer',
  'animal_handler'
];

const FEMALE_SETTLER_POOL: NpcSpriteKey[] = [
  'female_farmer',
  'shopkeeper',
  'fisherwoman',
  'cook',
  'healer',
  'woodcutter'
];

const NPC_BASE_SCALE = 0.44;
const SLEEP_SCALE = 0.58;
const FIGHT_SCALE = 0.66;
const ANIM_REFERENCE_HEIGHT = 66;
const CELL_WIDTH = 64;
const CELL_HEIGHT = 80;
const CELL_FEET_Y = 76;

const ROW = {
  walkDown: 0,
  walkLeft: 1,
  walkUp: 2,
  walkRight: 3,
  idleDown: 4,
  idleLeft: 5,
  idleUp: 6,
  idleRight: 7,
  sit: 8,
  sleep: 9,
  eat: 10,
  fight: 11,
  carry: 12,
  emote: 13,
  read: 14,
  work: 15,
  craft: 16,
  staticWork: 17
} as const;

interface AnimationSpec {
  row: number;
  frames: number;
  fps: number;
  scaleMul: number;
  groundY: number;
  flip: boolean;
  walk: boolean;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Draws illustrated NPCs with the supplied sheet's 4-direction walk/idle
 * cycles, common action poses, and role-specific working swings.
 *
 * The front-facing walk cycle keeps each settler's own high-detail upper body
 * and uses the sheet's animated legs. Side/back views and actions use the
 * sheet art recoloured to the settler's palette, with the settler's head
 * restored on action poses.
 */
export class NpcSpriteRenderer {
  private static npcSprites: Partial<Record<NpcSpriteKey, HTMLImageElement>> = {};
  private static actionSprites: Partial<Record<ActionSpriteKey, HTMLImageElement>> = {};
  private static atlasSprites: Partial<Record<NpcSpriteKey, HTMLImageElement>> = {};
  private static waterPondSprites: HTMLImageElement[] = [];
  private static waterLiftImg: HTMLImageElement;
  private static waterStandImg: HTMLImageElement;
  private static waterWalkSprites: HTMLImageElement[] = [];
  private static waterIdleImg: HTMLImageElement;
  private static initialized = false;

  private static loadImage(bundledUrl: string, fallbackUrl: string): HTMLImageElement {
    const img = new Image();
    img.onerror = () => {
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      }
    };
    img.src = bundledUrl || fallbackUrl;
    return img;
  }

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    for (const key of Object.keys(NPC_SOURCES) as NpcSpriteKey[]) {
      const img = new Image();
      img.src = NPC_SOURCES[key];
      this.npcSprites[key] = img;
    }
    for (const key of Object.keys(ACTION_SOURCES) as ActionSpriteKey[]) {
      const img = new Image();
      img.src = ACTION_SOURCES[key];
      this.actionSprites[key] = img;
    }

    // Handcrafted animated drinking water fetching & carrying sprites
    this.waterPondSprites = [
      this.loadImage(cookPondFill1Url, '/assets/npcs/cook_pond_fill_1.png'),
      this.loadImage(cookPondFill2Url, '/assets/npcs/cook_pond_fill_2.png'),
      this.loadImage(cookPondFill3Url, '/assets/npcs/cook_pond_fill_3.png'),
      this.loadImage(cookPondFill4Url, '/assets/npcs/cook_pond_fill_4.png'),
      this.loadImage(cookPondFill5Url, '/assets/npcs/cook_pond_fill_5.png'),
      this.loadImage(cookPondFill6Url, '/assets/npcs/cook_pond_fill_6.png')
    ];
    this.waterLiftImg = this.loadImage(cookWaterLiftUrl, '/assets/npcs/cook_water_lift.png');
    this.waterStandImg = this.loadImage(cookWaterStandUrl, '/assets/npcs/cook_water_stand.png');
    this.waterWalkSprites = [
      this.loadImage(cookWaterWalk1Url, '/assets/npcs/cook_water_walk_1.png'),
      this.loadImage(cookWaterWalk2Url, '/assets/npcs/cook_water_walk_2.png'),
      this.loadImage(cookWaterWalk3Url, '/assets/npcs/cook_water_walk_3.png'),
      this.loadImage(cookWaterWalk2Url, '/assets/npcs/cook_water_walk_2.png')
    ];
    this.waterIdleImg = this.loadImage(cookWaterIdleUrl, '/assets/npcs/cook_water_idle.png');
  }

  /** Warm the animation atlases for the starting population. */
  public static preloadAgents(agents: AgentData[]): void {
    this.init();
    for (const agent of agents) {
      this.getAtlas(this.getNpcKey(agent));
    }
  }

  public static drawAgent(ctx: CanvasRenderingContext2D, agent: AgentData, globalTime: number): boolean {
    this.init();

    // 1. Check if agent is currently fetching water at pond or carrying drinking water
    if (this.drawWaterFetchingOrCarrying(ctx, agent, globalTime)) {
      return true;
    }

    const npcKey = this.getNpcKey(agent);
    const atlas = this.getAtlas(npcKey);
    if (!atlas.complete || atlas.naturalWidth === 0) {
      return this.drawStaticFallback(ctx, agent, npcKey, globalTime);
    }

    const spec = this.getAnimationSpec(agent, globalTime, npcKey);
    const staticImg = this.npcSprites[npcKey];
    const staticHeight = staticImg?.naturalHeight || 130;
    const baseScale = (staticHeight * NPC_BASE_SCALE) / ANIM_REFERENCE_HEIGHT;
    const scale = baseScale * (agent.appearance.scale || 1) * spec.scaleMul;
    const visualW = CELL_WIDTH * scale;
    const visualH = ANIM_REFERENCE_HEIGHT * scale;

    const hash = hashString(agent.id);
    const phase = (hash % 13) * 0.17;
    const isDead = agent.isDead || agent.actionState === 'dead';
    const isMoving = !isDead && spec.walk;
    const isRunning = !isDead && (agent.actionState === 'running' || agent.actionState === 'fleeing');
    const breathe = isDead ? 0 : Math.sin(globalTime * 0.003 + hash * 0.001) * 0.5;
    const walkBob = isDead
      ? 0
      : isMoving
      ? -Math.abs(Math.sin(agent.walkCycle * 2 + phase)) * (isRunning ? 2.5 : 1.45)
      : breathe;
    const lean = isRunning
      ? agent.facing === 'left'
        ? -0.075
        : agent.facing === 'right'
          ? 0.075
          : 0
      : 0;

    // Drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(38, 32, 27, 0.28)';
    ctx.beginPath();
    ctx.ellipse(
      agent.x,
      agent.y + (spec.row === ROW.sleep ? 6 : 3),
      Math.max(9, visualW * (spec.row === ROW.sleep ? 0.34 : 0.27)),
      spec.row === ROW.sleep ? 5 : Math.max(3.5, visualH * 0.09),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Divine possession aura
    if (agent.isPossessed) {
      const pulse = 1 + 0.1 * Math.sin(globalTime * 0.008);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        agent.x,
        agent.y - visualH * 0.45,
        visualW * 0.62 * pulse,
        visualH * 0.55 * pulse,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    if (isRunning) {
      ctx.save();
      ctx.fillStyle = 'rgba(235, 230, 210, 0.42)';
      const dustDir = agent.facing === 'left' ? 1 : -1;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(agent.x + dustDir * (10 + i * 5), agent.y + 12 + i * 2, 2.4 - i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Frame selection
    let frame: number;
    if (spec.walk) {
      frame = Math.floor(agent.walkCycle * (isRunning ? 2.0 : 1.15) + phase) % spec.frames;
    } else if (spec.frames > 1) {
      frame = Math.floor((globalTime * spec.fps) / 1000 + phase) % spec.frames;
    } else if (spec.row >= ROW.idleDown && spec.row <= ROW.idleRight) {
      frame = Math.floor((globalTime * 0.0022 + phase) % spec.frames);
    } else {
      frame = 0;
    }
    frame = ((frame % spec.frames) + spec.frames) % spec.frames;

    const sx = frame * CELL_WIDTH;
    const sy = spec.row * CELL_HEIGHT;

    ctx.save();
    ctx.translate(agent.x, agent.y + spec.groundY + walkBob);
    ctx.rotate(lean);
    if (agent.actionState === 'fighting') {
      ctx.translate(Math.sin(globalTime * 0.022) * 1.2, 0);
    }
    if (spec.flip) ctx.scale(-1, 1);

    ctx.drawImage(
      atlas,
      sx,
      sy,
      CELL_WIDTH,
      CELL_HEIGHT,
      -visualW / 2,
      -CELL_FEET_Y * scale,
      visualW,
      CELL_HEIGHT * scale
    );

    // Local-space overlays.  The sheet action art already supplies its own
    // log, bowl, book, crate, anvil, plant, bedroll and Zzz letters.
    if (agent.carriedItem && spec.row !== ROW.carry && spec.row !== ROW.sleep) {
      this.drawCarriedItem(ctx, agent, visualH);
    }
    if (agent.actionState === 'fishing' && spec.row !== ROW.sleep) {
      this.drawFishingLine(ctx, visualW, visualH, globalTime);
    }
    if ((agent.actionState === 'chopping' || agent.actionState === 'building') && spec.row !== ROW.sleep) {
      this.drawWorkSpark(ctx, visualW, visualH, globalTime, agent.actionState === 'building');
    }
    if (agent.actionState === 'foraging' && spec.row !== ROW.sleep) {
      this.drawForageSparkle(ctx, visualW, visualH, globalTime);
    }
    if (agent.actionState === 'healing' && spec.row !== ROW.sleep) {
      this.drawHealingGlow(ctx, visualW, visualH, globalTime);
    }
    if (agent.actionState === 'cooking' && spec.row !== ROW.sleep) {
      this.drawCookingSteam(ctx, visualW, visualH, globalTime);
    }
    ctx.restore();

    return true;
  }

  /** Distance from the settler's feet to the top of the drawn sprite. */
  public static getSpriteTopOffset(agent: AgentData): number | null {
    this.init();
    if (agent.actionState === 'fetching_water' || agent.carriedItem?.type === 'water') {
      return -52 * (agent.appearance.scale || 1);
    }
    const npcKey = this.getNpcKey(agent);
    const atlas = this.getAtlas(npcKey);
    const staticImg = this.npcSprites[npcKey];

    if (!atlas.complete || atlas.naturalWidth === 0) {
      const actionKey = this.getActionKey(agent);
      const img = actionKey ? this.actionSprites[actionKey] : staticImg;
      if (!img || !img.complete || img.naturalWidth === 0) return null;
      const isSleeping = actionKey === 'act_sleep';
      const isFighting = actionKey === 'act_fight';
      const baseScale = isSleeping ? SLEEP_SCALE : isFighting ? FIGHT_SCALE : NPC_BASE_SCALE;
      const groundY = isSleeping ? 8 : agent.actionState === 'sitting' ? 14 : 2;
      return groundY - img.naturalHeight * baseScale * (agent.appearance.scale || 1);
    }

    const spec = this.getAnimationSpec(agent, 0, npcKey);
    const staticHeight = staticImg?.naturalHeight || 130;
    const scale = ((staticHeight * NPC_BASE_SCALE) / ANIM_REFERENCE_HEIGHT) *
      (agent.appearance.scale || 1) *
      spec.scaleMul;
    return spec.groundY - ANIM_REFERENCE_HEIGHT * scale;
  }

  private static getAtlas(key: NpcSpriteKey): HTMLImageElement {
    let img = this.atlasSprites[key];
    if (!img) {
      img = new Image();
      img.src = ANIMATION_SOURCES[key];
      this.atlasSprites[key] = img;
    }
    return img;
  }

  private static drawStaticFallback(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    npcKey: NpcSpriteKey,
    globalTime: number
  ): boolean {
    const actionKey = this.getActionKey(agent);
    const img = actionKey ? this.actionSprites[actionKey] : this.npcSprites[npcKey];
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    const isSleeping = actionKey === 'act_sleep';
    const isFighting = actionKey === 'act_fight';
    const isSitting = agent.actionState === 'sitting';
    const isMoving =
      agent.actionState === 'walking' ||
      agent.actionState === 'running' ||
      agent.actionState === 'fleeing' ||
      (agent.targetX !== undefined && agent.targetY !== undefined && !isSitting && !isSleeping);
    const isRunning = agent.actionState === 'running' || agent.actionState === 'fleeing';
    const baseScale = isSleeping ? SLEEP_SCALE : isFighting ? FIGHT_SCALE : NPC_BASE_SCALE;
    const scale = baseScale * (agent.appearance.scale || 1);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const breathe = Math.sin(globalTime * 0.003 + hashString(agent.id) * 0.001) * 0.55;
    const walkBob = isMoving
      ? -Math.abs(Math.sin(agent.walkCycle * 2)) * (isRunning ? 3.1 : 1.7)
      : breathe;
    const groundY = isSleeping ? 8 : isSitting ? 14 : 2;
    const flip = !isSleeping && agent.facing === 'left' ? -1 : 1;

    ctx.save();
    ctx.fillStyle = 'rgba(38, 32, 27, 0.28)';
    ctx.beginPath();
    ctx.ellipse(agent.x, agent.y + 3, Math.max(9, drawW * 0.27), Math.max(3.5, drawH * 0.09), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(agent.x, agent.y + groundY + walkBob);
    ctx.scale(flip, 1);
    ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
    return true;
  }

  private static getActionKey(agent: AgentData): ActionSpriteKey | null {
    if (agent.actionState === 'sleeping' || agent.actionState === 'unconscious' || agent.actionState === 'dead' || agent.isDead) return 'act_sleep';
    if (agent.actionState === 'fighting') return 'act_fight';
    return null;
  }

  private static getAnimationSpec(
    agent: AgentData,
    globalTime: number,
    npcKey: NpcSpriteKey
  ): AnimationSpec {
    const facing = agent.facing;
    const walkRow =
      facing === 'up'
        ? ROW.walkUp
        : facing === 'left'
          ? ROW.walkLeft
          : facing === 'right'
            ? ROW.walkRight
            : ROW.walkDown;
    const idleRow =
      facing === 'up'
        ? ROW.idleUp
        : facing === 'left'
          ? ROW.idleLeft
          : facing === 'right'
            ? ROW.idleRight
            : ROW.idleDown;

    if (agent.actionState === 'sleeping' || agent.actionState === 'unconscious' || agent.actionState === 'dead' || agent.isDead) {
      const isCustomRest =
        npcKey === 'elderly_man' ||
        npcKey === 'healer' ||
        npcKey === 'guard' ||
        npcKey === 'cook' ||
        npcKey === 'baker' ||
        npcKey === 'lumberjack' ||
        npcKey === 'woodcutter' ||
        npcKey === 'female_farmer' ||
        npcKey === 'child_boy' ||
        npcKey === 'child_girl' ||
        npcKey === 'child_toddler' ||
        npcKey === 'toddler' ||
        npcKey === 'pregnant_woman';
      return {
        row: ROW.sleep,
        frames: isCustomRest ? 4 : 1,
        fps: isCustomRest ? 2 : 1,
        scaleMul: isCustomRest ? 0.98 : 0.68,
        groundY: isCustomRest ? 2 : 8,
        flip: false,
        walk: false
      };
    }
    if (agent.actionState === 'sitting') {
      const isCustomSit =
        npcKey === 'elderly_man' ||
        npcKey === 'healer' ||
        npcKey === 'guard' ||
        npcKey === 'cook' ||
        npcKey === 'baker' ||
        npcKey === 'lumberjack' ||
        npcKey === 'woodcutter' ||
        npcKey === 'female_farmer' ||
        npcKey === 'child_boy' ||
        npcKey === 'child_girl' ||
        npcKey === 'child_toddler' ||
        npcKey === 'toddler' ||
        npcKey === 'pregnant_woman';
      return {
        row: ROW.sit,
        frames: isCustomSit ? 4 : 1,
        fps: 2,
        scaleMul: isCustomSit ? 0.98 : 0.9,
        groundY: isCustomSit ? 3 : 6,
        flip: false,
        walk: false
      };
    }
    if (agent.actionState === 'fighting') {
      const isCustomFight =
        npcKey === 'elderly_man' ||
        npcKey === 'healer' ||
        npcKey === 'guard' ||
        npcKey === 'cook' ||
        npcKey === 'baker' ||
        npcKey === 'lumberjack' ||
        npcKey === 'woodcutter' ||
        npcKey === 'female_farmer' ||
        npcKey === 'child_boy' ||
        npcKey === 'child_girl' ||
        npcKey === 'child_toddler' ||
        npcKey === 'toddler' ||
        npcKey === 'pregnant_woman';
      return {
        row: ROW.fight,
        frames: 4,
        fps: isCustomFight ? 8 : 9,
        scaleMul: isCustomFight ? 0.98 : 0.9,
        groundY: isCustomFight ? 2 : 3,
        flip: false,
        walk: false
      };
    }

    const isMoving =
      agent.actionState === 'walking' ||
      agent.actionState === 'running' ||
      agent.actionState === 'fleeing' ||
      (agent.targetX !== undefined && agent.targetY !== undefined);

    if (isMoving) {
      return {
        row: walkRow,
        frames: 4,
        fps: 8,
        scaleMul: 1,
        groundY: 2,
        flip: false,
        walk: true
      };
    }

    const isCustomActor =
      npcKey === 'elderly_man' ||
      npcKey === 'healer' ||
      npcKey === 'guard' ||
      npcKey === 'cook' ||
      npcKey === 'baker' ||
      npcKey === 'lumberjack' ||
      npcKey === 'woodcutter' ||
      npcKey === 'female_farmer' ||
      npcKey === 'child_boy' ||
      npcKey === 'child_girl' ||
      npcKey === 'child_toddler' ||
      npcKey === 'toddler' ||
      npcKey === 'pregnant_woman';

    switch (agent.actionState) {
      case 'eating':
        return {
          row: ROW.eat,
          frames: isCustomActor ? 4 : 1,
          fps: 2,
          scaleMul: 0.96,
          groundY: 2,
          flip: false,
          walk: false
        };
      case 'foraging': {
        const isNimbleForager = agent.appearance.gender === 'female' && agent.role === 'forager';
        const fps = isNimbleForager ? 8.5 : agent.age < 16 ? 6.5 : 6.0;
        return { row: ROW.work, frames: 4, fps, scaleMul: 0.96, groundY: 3, flip: false, walk: false };
      }
      case 'building':
        return { row: ROW.craft, frames: 4, fps: 8, scaleMul: 0.95, groundY: 4, flip: false, walk: false };
      case 'chopping': {
        const isMuscularMale = agent.appearance.gender === 'male' && agent.age >= 18 && agent.age < 55;
        const fps = isMuscularMale ? 9.5 : 7.5;
        return { row: ROW.staticWork, frames: 4, fps, scaleMul: 1, groundY: 2, flip: false, walk: false };
      }
      case 'cooking': {
        const isChef = agent.role === 'cook';
        const fps = isChef ? 6.0 : 4.5;
        return { row: ROW.staticWork, frames: 4, fps, scaleMul: 1, groundY: 2, flip: false, walk: false };
      }
      case 'healing':
        return { row: ROW.staticWork, frames: 4, fps: 5, scaleMul: 1, groundY: 2, flip: false, walk: false };
      case 'fishing':
        return { row: ROW.staticWork, frames: 4, fps: 3.5, scaleMul: 1, groundY: 2, flip: false, walk: false };
      case 'hunting': {
        const isScout = agent.role === 'hunter' && agent.appearance.gender === 'male';
        const fps = isScout ? 6.0 : 4.5;
        return { row: ROW.staticWork, frames: 4, fps, scaleMul: 1, groundY: 2, flip: false, walk: false };
      }
      case 'carrying':
        if (!agent.carriedItem) {
          return {
            row: ROW.carry,
            frames: isCustomActor ? 4 : 1,
            fps: 3,
            scaleMul: 0.96,
            groundY: 2,
            flip: false,
            walk: false
          };
        }
        break;
      case 'flirting':
        return {
          row: ROW.emote,
          frames: isCustomActor ? 4 : 1,
          fps: 3,
          scaleMul: 0.96,
          groundY: 2,
          flip: false,
          walk: false
        };
      case 'talking':
        if (isCustomActor) {
          // Cheerful conversation: periodically show joyful heart emote
          const talkCycle = (Math.floor(globalTime / 1800) + hashString(agent.id)) % 3;
          if (talkCycle === 0) {
            return { row: ROW.emote, frames: 4, fps: 3, scaleMul: 0.96, groundY: 2, flip: false, walk: false };
          }
        }
        break;
      default:
        break;
    }

    // Teachers, elders, healers, guards, and cooks occasionally pull out a book/map while resting.
    if (
      agent.actionState === 'idle' &&
      (npcKey === 'teacher' ||
        npcKey === 'elderly_man' ||
        npcKey === 'elderly_woman' ||
        npcKey === 'healer' ||
        npcKey === 'guard' ||
        npcKey === 'cook' ||
        npcKey === 'baker' ||
        agent.age >= 60) &&
      (Math.floor(globalTime / 1000) + hashString(agent.id)) % 29 < 4
    ) {
      return {
        row: ROW.read,
        frames: isCustomActor ? 4 : 1,
        fps: 2,
        scaleMul: 0.94,
        groundY: 2,
        flip: false,
        walk: false
      };
    }

    return {
      row: idleRow,
      frames: 4,
      fps: 2.2,
      scaleMul: 1,
      groundY: 2,
      flip: false,
      walk: false
    };
  }

  private static getNpcKey(agent: AgentData): NpcSpriteKey {
    const female = agent.appearance.gender === 'female';

    if (agent.actionState === 'stealing') return 'thief';
    if (female && (agent.isPregnant || agent.appearance.isPregnant)) {
      return 'pregnant_woman';
    }
    if (
      agent.age <= 3 ||
      agent.role === 'toddler' ||
      agent.appearance.outfitType === 'toddler'
    ) {
      return 'child_toddler';
    }
    if (agent.age < 16) return female ? 'child_girl' : 'child_boy';
    if (agent.age >= 60 || agent.role === 'elder') return female ? 'elderly_woman' : 'elderly_man';

    switch (agent.actionState) {
      case 'chopping':
        return female ? 'woodcutter' : 'lumberjack';
      case 'building':
        return 'blacksmith';
      case 'fishing':
        return female ? 'fisherwoman' : 'fisherman';
      case 'foraging':
        return female ? 'female_farmer' : 'farmer';
      case 'cooking':
        return 'cook';
      case 'hunting':
        return 'guard';
      case 'healing':
        return 'healer';
      default:
        break;
    }

    switch (agent.role) {
      case 'lumberjack':
        return female ? 'woodcutter' : 'lumberjack';
      case 'forager':
        return female ? 'female_farmer' : 'farmer';
      case 'fisher':
        return female ? 'fisherwoman' : 'fisherman';
      case 'cook':
        return 'cook';
      case 'healer':
        return 'healer';
      case 'hunter':
        return 'guard';
      case 'builder':
        return 'blacksmith';
      default:
        break;
    }

    // Unspecialised settlers get a stable, varied look based on their id.
    if (agent.needs.morality < 30 && agent.traits.greed > 0.65) {
      return agent.traits.aggression > 0.6 ? 'bandit' : 'thief';
    }
    if (agent.cash < 10) return 'beggar';

    const pool = female ? FEMALE_SETTLER_POOL : MALE_SETTLER_POOL;
    return pool[hashString(agent.id) % pool.length];
  }

  private static drawCarriedItem(ctx: CanvasRenderingContext2D, agent: AgentData, drawH: number): void {
    const item = agent.carriedItem;
    if (!item) return;

    const y = -drawH * 0.46;
    ctx.save();
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    if (item.type === 'log') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-17, y - 4, 34, 9, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d6a46a';
      ctx.beginPath();
      ctx.ellipse(17, y + 0.5, 3.2, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 237, 213, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-12, y - 1);
      ctx.lineTo(11, y - 1);
      ctx.moveTo(-12, y + 2.5);
      ctx.lineTo(11, y + 2.5);
      ctx.stroke();
    } else if (item.type === 'berries') {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(-9, y - 1, 18, 11, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(-8, y - 3, 16, 3);
      ctx.fillStyle = '#dc2626';
      for (const [bx, by] of [[-5, y + 2], [0, y + 4], [5, y + 2], [-2, y + 6], [4, y + 6]]) {
        ctx.beginPath();
        ctx.arc(bx, by, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item.type === 'fish') {
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.ellipse(0, y + 1, 11, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, y + 1);
      ctx.lineTo(-17, y - 3);
      ctx.lineTo(-17, y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, y - 0.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'meal') {
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(0, y + 2, 11, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(0, y, 8, 3.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-3, y - 3);
      ctx.quadraticCurveTo(0, y - 8, 3, y - 3);
      ctx.stroke();
    } else {
      // Fresh game meat
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.roundRect(-10, y - 2, 20, 10, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef2f2';
      ctx.beginPath();
      ctx.arc(-6, y + 3, 2, 0, Math.PI * 2);
      ctx.arc(6, y + 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e7e5e4';
      ctx.beginPath();
      ctx.roundRect(10, y - 2, 5, 3, 1.5);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawFishingLine(
    ctx: CanvasRenderingContext2D,
    drawW: number,
    drawH: number,
    globalTime: number
  ): void {
    const bob = Math.sin(globalTime * 0.005) * 2;
    const startX = drawW * 0.34;
    const startY = -drawH * 0.72;
    const endX = drawW * 0.82;
    const endY = 7 + bob;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(drawW * 0.72, startY + 4, endX, endY);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(endX, endY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endX, endY - 0.4, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Subtle water ripple ring around the bobber on the water surface
    const ripplePhase = (globalTime * 0.0018) % 1;
    const rippleRadius = 2.5 + ripplePhase * 5.5;
    const rippleAlpha = (1 - ripplePhase) * 0.5;
    ctx.strokeStyle = `rgba(180, 235, 255, ${rippleAlpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(endX, endY + 1.2, rippleRadius, rippleRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private static drawWorkSpark(
    ctx: CanvasRenderingContext2D,
    drawW: number,
    drawH: number,
    globalTime: number,
    isBuilding: boolean
  ): void {
    const pulse = Math.max(0, Math.sin(globalTime * 0.012));
    if (pulse < 0.55) return;

    const x = drawW * 0.36;
    const y = -drawH * 0.52;
    ctx.save();
    ctx.fillStyle = isBuilding ? '#fde047' : '#d6a46a';
    for (let i = 0; i < 3; i++) {
      const angle = -0.9 + i * 0.6;
      const dist = 5 + pulse * 6;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawForageSparkle(
    ctx: CanvasRenderingContext2D,
    drawW: number,
    drawH: number,
    globalTime: number
  ): void {
    const pulse = 0.5 + 0.5 * Math.sin(globalTime * 0.01);
    ctx.save();
    ctx.fillStyle = `rgba(74, 222, 128, ${0.35 + pulse * 0.5})`;
    for (let i = 0; i < 3; i++) {
      const angle = globalTime * 0.004 + i * 2.1;
      ctx.beginPath();
      ctx.arc(
        drawW * 0.28 + Math.cos(angle) * 8,
        -drawH * 0.4 + Math.sin(angle) * 5,
        1.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawHealingGlow(
    ctx: CanvasRenderingContext2D,
    drawW: number,
    drawH: number,
    globalTime: number
  ): void {
    const pulse = 0.6 + 0.4 * Math.sin(globalTime * 0.006);
    ctx.save();
    ctx.strokeStyle = `rgba(74, 222, 128, ${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 1.6;
    const cx = drawW * 0.2;
    const cy = -drawH * 0.48;
    for (let i = 0; i < 2; i++) {
      const y = cy - i * 7 - (globalTime * 0.01 + i * 4) % 10;
      ctx.beginPath();
      ctx.moveTo(cx - 3, y);
      ctx.lineTo(cx + 3, y);
      ctx.moveTo(cx, y - 3);
      ctx.lineTo(cx, y + 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawCookingSteam(
    ctx: CanvasRenderingContext2D,
    drawW: number,
    drawH: number,
    globalTime: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 2; i++) {
      const drift = Math.sin(globalTime * 0.004 + i) * 2;
      const x = drawW * 0.16 + i * 4;
      const y = -drawH * 0.42 - ((globalTime * 0.012 + i * 7) % 12);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 2 + drift, y - 4, x, y - 8);
      ctx.stroke();
    }
    ctx.restore();
  }
  private static drawWaterFetchingOrCarrying(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    globalTime: number
  ): boolean {
    const isFetching = agent.actionState === 'fetching_water';
    const isCarryingWater = agent.carriedItem?.type === 'water';
    if (!isFetching && !isCarryingWater) return false;

    // Drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(38, 32, 27, 0.28)';
    ctx.beginPath();
    ctx.ellipse(agent.x, agent.y + 3, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Divine possession aura
    if (agent.isPossessed) {
      const pulse = 1 + 0.1 * Math.sin(globalTime * 0.008);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(agent.x, agent.y - 25, 20 * pulse, 30 * pulse, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    const flip = agent.facing === 'left' ? -1 : 1;

    if (isFetching) {
      // 6-Frame animated sequence dipping and filling wooden bucket at the pond
      const timer = agent.actionTimer || 0;
      const progress = Math.max(0, Math.min(0.99, 1 - (timer / 4.2)));
      let img: HTMLImageElement;
      const frameIdx = Math.min(5, Math.floor(progress * 6));
      const isLiftFrame = progress > 0.85;

      if (isLiftFrame && this.waterLiftImg && this.waterLiftImg.complete && this.waterLiftImg.naturalWidth > 0) {
        img = this.waterLiftImg;
      } else {
        const frameImg = this.waterPondSprites[frameIdx];
        if (frameImg && frameImg.complete && frameImg.naturalWidth > 0) {
          img = frameImg;
        } else {
          img = this.waterPondSprites.find(s => s && s.complete && s.naturalWidth > 0) || this.waterPondSprites[0];
        }
      }
      if (!img || !img.complete || img.naturalWidth === 0) return false;

      const scale = 0.38 * (agent.appearance.scale || 1.0);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;

      ctx.save();
      ctx.translate(agent.x, agent.y);
      ctx.scale(flip, 1);

      if (img === this.waterLiftImg) {
        // Character standing upright on ground lifting full wooden bucket
        ctx.drawImage(img, -drawW / 2, -drawH + 3, drawW, drawH);
      } else {
        // Dipping into pond: character body is centered around 30% width, knees at ground level (~58% height)
        const bodyCenterRatio = 0.30;
        const groundYRatio = 0.58;
        const offsetX = -drawW * bodyCenterRatio;
        const offsetY = -drawH * groundYRatio;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        // Water splash particles while dipping/filling (frames 1, 2, 3, 4)
        if (frameIdx >= 1 && frameIdx <= 4) {
          const splashT = (globalTime * 0.012) % 1.0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          for (let i = 0; i < 4; i++) {
            const sx = 12 + (i * 6);
            const sy = 10 + Math.sin((splashT + i * 0.25) * Math.PI) * 6;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
      return true;
    }

    if (isCarryingWater) {
      // Carrying wooden bucket with fresh drinking water
      const isWalking = agent.actionState === 'walking' || agent.actionState === 'running' || agent.actionState === 'carrying';
      const scale = 0.38 * (agent.appearance.scale || 1.0);
      let img: HTMLImageElement;
      let walkBob = 0;

      if (isWalking) {
        // Walk cycle across frames 1, 2, 3, 2
        const frameIdx = Math.floor(agent.walkCycle * 1.6) % 4;
        const walkImg = this.waterWalkSprites[frameIdx];
        if (walkImg && walkImg.complete && walkImg.naturalWidth > 0) {
          img = walkImg;
        } else {
          img = this.waterWalkSprites[0];
        }
        walkBob = -Math.abs(Math.sin(agent.walkCycle * 2)) * 1.5;
      } else {
        img = this.waterStandImg || this.waterIdleImg;
      }
      if (!img || !img.complete || img.naturalWidth === 0) return false;

      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;

      ctx.save();
      ctx.translate(agent.x, agent.y + walkBob);
      ctx.scale(flip, 1);
      ctx.drawImage(img, -drawW / 2, -drawH + 3, drawW, drawH);

      // Occasional tiny sparkling droplet dripping from bucket
      const dripPhase = (globalTime * 0.003 + hashString(agent.id)) % 1.0;
      if (dripPhase < 0.35) {
        ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
        ctx.beginPath();
        ctx.arc(drawW * 0.28, -drawH * 0.32 + dripPhase * 24, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return true;
    }

    return false;
  }
}
