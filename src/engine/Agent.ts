import type {
  AgentData,
  Relationship,
  Memory,
  BubbleType,
  ActionState,
  WildlifeAnimal
} from '../types/simulation';
import { World } from './World';
import { DialogSystem } from './DialogSystem';
import { GeminiService } from './GeminiService';

interface ScheduledAction {
  remaining: number;
  run: () => void;
}

export class Agent {
  public sim?: any;
  public data: AgentData;
  public lastSocialCooldown: number = 3.0;
  public recentChatPartners: Record<string, number> = {};

  // Simulation-time timers. Unlike setTimeout, these pause with the game and
  // cannot fire after the game has been paused or the agent state has changed.
  private scheduledActions: ScheduledAction[] = [];
  private healingPending = false;
  private eatingPending = false;

  constructor(data: AgentData) {
    this.data = data;
    if (!this.data.schedule || this.data.schedule.length === 0) {
      this.initDefaultSchedule();
    }
  }

  private scheduleAction(delaySeconds: number, action: () => void): void {
    this.scheduledActions.push({
      remaining: Math.max(0, delaySeconds),
      run: action
    });
  }

  private processScheduledActions(delta: number): void {
    if (this.scheduledActions.length === 0) return;

    // Iterate backwards so callbacks may safely add new scheduled actions.
    for (let i = this.scheduledActions.length - 1; i >= 0; i--) {
      const scheduled = this.scheduledActions[i];
      scheduled.remaining -= delta;

      if (scheduled.remaining <= 0) {
        this.scheduledActions.splice(i, 1);
        try {
          scheduled.run();
        } catch (error) {
          console.error('Scheduled settler action failed:', error);
        }
      }
    }
  }

  public initDefaultSchedule(): void {
    const isToddler = this.data.age <= 3 || this.data.role === 'toddler';
    const isChild = !isToddler && this.data.age < 16;
    const isPregnant = !!(this.data.isPregnant || this.data.appearance.isPregnant);
    const isElder = this.data.age >= 60 || this.data.role === 'elder';

    // 1. Toddler schedule: sleep, nursery meals, crawl exploration & floor play with toys
    if (isToddler) {
      this.data.schedule = [
        { startHour: 0, endHour: 7, task: 'sleep', locationId: this.data.homeCabinId, description: 'Sleeping soundly tucked in crib' },
        { startHour: 7, endHour: 8, task: 'breakfast', locationId: 'hearth', description: 'Eating cereal and warm milk with mother' },
        { startHour: 8, endHour: 12, task: 'work', locationId: this.data.homeCabinId, description: 'Crawling on all fours and playing with stacking rings' },
        { startHour: 12, endHour: 13, task: 'lunch', locationId: 'hearth', description: 'Midday meal with family' },
        { startHour: 13, endHour: 15, task: 'sleep', locationId: this.data.homeCabinId, description: 'Afternoon toddler nap' },
        { startHour: 15, endHour: 17, task: 'work', locationId: this.data.homeCabinId, description: 'Rolling toy car and exploring on hands and knees' },
        { startHour: 17, endHour: 20, task: 'evening_social', locationId: 'hearth', description: 'Cuddled by parents at the evening campfire' },
        { startHour: 20, endHour: 24, task: 'sleep', locationId: this.data.homeCabinId, description: 'Bedtime sleep' }
      ];
      return;
    }

    // 2. Child schedule (Ages 4-15): Strictly never works! Play, games, pond stone-skipping & nature
    if (isChild) {
      this.data.schedule = [
        { startHour: 0, endHour: 7, task: 'sleep', locationId: this.data.homeCabinId, description: 'Sleeping soundly in family bed' },
        { startHour: 7, endHour: 8, task: 'breakfast', locationId: 'hearth', description: 'Morning porridge with family' },
        { startHour: 8, endHour: 12, task: 'work', locationId: 'hearth', description: 'Morning childhood play: tag, skipping pond stones, exploring' },
        { startHour: 12, endHour: 13, task: 'lunch', locationId: 'hearth', description: 'Lunch meal at communal hearth' },
        { startHour: 13, endHour: 17, task: 'afternoon_work', locationId: 'hearth', description: 'Afternoon play: pet animals, pick wildflowers, games with friends' },
        { startHour: 17, endHour: 20, task: 'evening_social', locationId: 'hearth', description: 'Listening to elder folklore around campfire' },
        { startHour: 20, endHour: 24, task: 'sleep', locationId: this.data.homeCabinId, description: 'Bedtime sleep in family cabin' }
      ];
      return;
    }

    // 3. Expecting mother: frequent rest, gentle domestic tasks, avoiding heavy strains
    if (isPregnant) {
      this.data.schedule = [
        { startHour: 0, endHour: 7, task: 'sleep', locationId: this.data.homeCabinId, description: 'Resting comfortably in family bed' },
        { startHour: 7, endHour: 8, task: 'breakfast', locationId: 'hearth', description: 'Nourishing morning meal for mother and baby' },
        { startHour: 8, endHour: 12, task: 'work', locationId: 'hearth', description: 'Gentle domestic tasks and preparing baby blankets' },
        { startHour: 12, endHour: 13, task: 'lunch', locationId: 'hearth', description: 'Warm lunch stew' },
        { startHour: 13, endHour: 15, task: 'relax', locationId: this.data.homeCabinId, description: 'Afternoon rest and gentle stroll' },
        { startHour: 15, endHour: 17, task: 'afternoon_work', locationId: 'hearth', description: 'Light hearth tending and herb sorting' },
        { startHour: 17, endHour: 21, task: 'evening_social', locationId: 'hearth', description: 'Relaxing by the campfire with family' },
        { startHour: 21, endHour: 24, task: 'sleep', locationId: this.data.homeCabinId, description: 'Early night rest' }
      ];
      return;
    }

    // 3. Elder: steady counsel, stockpile overview, measured walking patrol with cane
    if (isElder) {
      this.data.schedule = [
        { startHour: 0, endHour: 6, task: 'sleep', locationId: this.data.homeCabinId, description: 'Elder sleep' },
        { startHour: 6, endHour: 8, task: 'breakfast', locationId: 'hearth', description: 'Morning tea and bread' },
        { startHour: 8, endHour: 12, task: 'work', locationId: 'hearth', description: 'Elder counsel and village stockpile overview' },
        { startHour: 12, endHour: 13, task: 'lunch', locationId: 'hearth', description: 'Midday meal with companions' },
        { startHour: 13, endHour: 17, task: 'afternoon_work', locationId: 'hearth', description: 'Peaceful walking patrol with cane and greeting settlers' },
        { startHour: 17, endHour: 21, task: 'evening_social', locationId: 'hearth', description: 'Storytelling and guidance at campfire' },
        { startHour: 21, endHour: 24, task: 'sleep', locationId: this.data.homeCabinId, description: 'Early night rest' }
      ];
      return;
    }

    const isFisher = this.data.role === 'fisher';
    const workLocation = 
      this.data.role === 'lumberjack' ? 'lumber_camp' :
      this.data.role === 'forager' ? 'storehouse' :
      isFisher ? 'pond_pastoral' :
      this.data.role === 'healer' ? 'healer_hut' : 
      this.data.role === 'hunter' ? 'cabin_stone' : 'hearth';

    const afternoonWorkLocation = isFisher ? (Math.random() < 0.5 ? 'pond_sanctuary' : 'dock_north') : workLocation;

    this.data.schedule = [
      { startHour: 0, endHour: 6, task: 'sleep', locationId: this.data.homeCabinId, description: 'Sleeping peacefully in family home' },
      { startHour: 6, endHour: 8, task: 'breakfast', locationId: 'hearth', description: 'Eating morning stew at communal hearth' },
      { startHour: 8, endHour: 12, task: 'work', locationId: workLocation, description: isFisher ? 'Morning fishing at Tranquil Lotus Pond' : `Working as ${this.data.role}` },
      { startHour: 12, endHour: 13, task: 'lunch', locationId: 'hearth', description: 'Midday meal with companions' },
      { startHour: 13, endHour: 17, task: 'afternoon_work', locationId: afternoonWorkLocation, description: isFisher ? 'Afternoon fishing at River Pier & Sanctuary Pond' : `Afternoon duty as ${this.data.role}` },
      { startHour: 17, endHour: 21, task: 'evening_social', locationId: 'hearth', description: 'Campfire gathering, drinks, stories, and romance' },
      { startHour: 21, endHour: 24, task: 'sleep', locationId: this.data.homeCabinId, description: 'Returning home to sleep' }
    ];
  }

  public update(delta: number, world: World, allAgents: Agent[], gameMinutes: number): string | null {
    // Mortality (Old Age Natural Passing or Divine Smite): corpse collapses, countdown 10-12s
    if (this.data.isDead || this.data.actionState === 'dead') {
      this.data.isDead = true;
      this.data.actionState = 'dead';
      this.data.needs.health = 0;
      if (!this.data.thought || this.data.thought.includes('divine wrath')) {
        this.data.thought = this.data.causeOfDeath === 'old_age'
          ? '...peacefully at rest after a long, full life in the valley...'
          : '...smitten by divine wrath...';
      }
      if (this.data.deathTimer === undefined) {
        this.data.deathTimer = this.data.causeOfDeath === 'old_age' ? 12.0 : 10.0;
      }
      this.data.deathTimer -= delta;
      return null;
    }

    this.updateNeeds(this.data.isPossessed ? delta * 0.5 : delta);
    this.updateBubble(delta);
    this.processScheduledActions(delta);

    // Settlers are only "indoors" while asleep in a real interior. Any state
    // change (waking, possession, panic) brings them back outside.
    if (this.data.indoorBuildingId && this.data.actionState !== 'sleeping') {
      this.data.indoorBuildingId = undefined;
    }

    if (this.data.isPossessed) {
      return null;
    }

    // Unconscious
    if (this.data.needs.health <= 0 || this.data.actionState === 'unconscious') {
      this.data.actionState = 'unconscious';
      this.data.thought = '...unconscious from severe wounds...';
      if (this.data.needs.health < 25) {
        this.data.needs.health += delta * 0.08;
      }
      return null;
    }

    // Interruption timer
    if (this.data.interruptionTimer && this.data.interruptionTimer > 0) {
      this.data.interruptionTimer -= delta;
      if (this.data.interruptionTimer <= 0) {
        this.data.routineInterrupted = false;
        this.data.interruptionReason = undefined;
        this.data.interruptionTimer = undefined;
      }
    }

    if (this.lastSocialCooldown > 0) {
      this.lastSocialCooldown -= delta;
    }

    // 1. Process active dialogue (Turn 1 -> Turn 2 -> Complete)
    if (this.data.activeDialog) {
      const dialogEvt = this.updateActiveDialog(delta, allAgents);
      if (dialogEvt) return dialogEvt;
      return null;
    }

    // 2. Check spontaneous social encounters with nearby settlers!
    const socialEvt = this.checkSocialEncounter(world, allAgents, gameMinutes);
    if (socialEvt) return socialEvt;

    // 3. Spontaneous admiration of nearby wildlife in the forest or river
    if (Math.random() < 0.08 && this.data.actionState !== 'sleeping' && this.data.actionState !== 'fighting' && this.data.actionState !== 'hunting' && this.data.actionState !== 'chopping' && this.data.actionState !== 'building' && this.data.actionState !== 'carrying' && this.data.actionState !== 'fetching_water' && this.data.actionState !== 'fishing') {
      const nearAnimal = world.animals.find(an => Math.hypot(an.x - this.data.x, an.y - this.data.y) < 80);
      if (nearAnimal) {
        if (nearAnimal.type === 'chicken') {
          this.data.thought = 'Watching a plucky hen scratch and peck through the wild clover.';
        } else if (nearAnimal.type === 'sheep') {
          this.data.thought = 'Admiring a woolly sheep grazing quietly by the forest edge.';
        } else if (nearAnimal.type === 'cow') {
          this.data.thought = 'Listening to the peaceful cow chewing sweet meadow grass.';
        } else if (nearAnimal.type === 'dog') {
          this.data.thought = 'Smiling at a friendly wild dog trotting along the riverbank.';
        }
      } else {
        const nearPond = world.ponds.find(p => Math.hypot(p.centerX - this.data.x, p.centerY - this.data.y) < 170);
        if (nearPond) {
          this.data.thought = 'Watching the colorful koi fish swim peacefully among the water lilies and lotus blossoms.';
          this.setBubble('fish', 3);
          this.data.needs.fun = Math.min(100, this.data.needs.fun + 5);
        }
      }
    }

    // Movement
    if (this.data.targetX !== undefined && this.data.targetY !== undefined) {
      this.moveTowardsTarget(delta, world);
      return null;
    }

    // Action timer
    if (this.data.actionTimer > 0) {
      this.data.actionTimer -= delta;
      if (this.data.actionTimer <= 0) {
        if (this.data.actionState === 'hunting' && this.data.targetResourceId) {
          const animalId = this.data.targetResourceId;
          const animal = world.animals.find(a => a.id === animalId);
          const isBabyAnimal = !!(
            animal && (
              animal.isBaby ||
              (animal.growthTimer !== undefined && animal.growthTimer > 0) ||
              (animal.type === 'rabbit' && animal.variant === 1) ||
              animal.motherId !== undefined
            )
          );

          if (animal && !animal.isDead && !isBabyAnimal) {
            // Ensure health is properly initialized
            if (animal.maxHealth === undefined) {
              animal.maxHealth = animal.type === 'cow' ? 85 : animal.type === 'sheep' ? 48 : animal.type === 'rabbit' ? 26 : animal.type === 'chicken' ? 22 : 38;
            }
            if (animal.health === undefined) {
              animal.health = animal.maxHealth;
            }

            // Arrow flight trajectory from hunter's bow to target animal
            world.spawnSpecialEffect('arrow', this.data.x, this.data.y - 14, animal.x, animal.y, 0.32);

            // Hunter arrow damage calculation:
            // Critical rule: An uninjured animal NEVER dies on one single arrow shot!
            // Maximum single-shot damage is strictly capped at 48% of its max health,
            // so rabbits and chickens take 2-3 shots, sheep take 3-4 shots, cows take 5-6 shots.
            const maxDamageAllowed = Math.floor(animal.maxHealth * 0.48);
            const baseDamage = animal.type === 'cow' ? 18 : animal.type === 'sheep' ? 15 : animal.type === 'rabbit' ? 12 : animal.type === 'chicken' ? 10 : 13;
            const arrowDamage = Math.max(7, Math.min(maxDamageAllowed, baseDamage));

            // Arrow impact after 0.32s flight time
            this.scheduleAction(0.32, () => {
              if (!animal || animal.isDead) return;

              // Apply damage to animal
              animal.health = Math.max(0, (animal.health ?? animal.maxHealth ?? 30) - arrowDamage);
              world.spawnSpecialEffect('sparkle', animal.x, animal.y - 4, undefined, undefined, 0.8);

              if (animal.health <= 0) {
                // FATAL FINAL SHOT: Animal collapses dead on ground, stays 3.5s, then dissolves
                animal.isDead = true;
                animal.state = 'dead';
                animal.speed = 0;
                animal.deathTimer = 3.5;
                animal.targetX = animal.x;
                animal.targetY = animal.y;
                animal.emote = '💀';
                animal.emoteTimer = 2.0;

                const animalType = animal.type;
                const meatCount = animalType === 'sheep' ? 5 : animalType === 'chicken' ? 2 : animalType === 'rabbit' ? 2 : 3;
                const meatName = animalType === 'sheep' ? 'tender mutton' : animalType === 'chicken' ? 'wild poultry' : animalType === 'rabbit' ? 'tender rabbit meat' : 'fresh game';

                this.data.carriedItem = { type: 'meat', count: meatCount };
                this.data.actionState = 'carrying';
                this.setBubble('food', 3);
                this.data.thought = animalType === 'rabbit'
                  ? 'Fatal shot! The wild rabbit fell after tracking. Carrying fresh tender rabbit meat back to storehouse.'
                  : `Fatal shot! The wild ${animalType} fell. Carrying fresh ${meatName} back to storehouse.`;
                this.addMemory(
                  animalType === 'rabbit'
                    ? 'Successfully hunted a swift mature wild rabbit after tracking its trail'
                    : `Successfully hunted a mature wild ${animalType} for settlement sustenance`,
                  35
                );
                this.data.targetResourceId = undefined;
              } else {
                // WOUNDED BUT SURVIVED: Animal panics, bleeds, and dashes away at high speed!
                animal.state = 'fleeing';
                animal.stateTimer = 4.2;
                animal.emote = '🩸';
                animal.emoteTimer = 2.5;

                const fleeAngle = Math.atan2(animal.y - this.data.y, animal.x - this.data.x) + (Math.random() - 0.5) * 0.5;
                const dashDist = 150 + Math.random() * 90;
                let fleeX = Math.max(340, Math.min(2700, animal.x + Math.cos(fleeAngle) * dashDist));
                let fleeY = Math.max(240, Math.min(1720, animal.y + Math.sin(fleeAngle) * dashDist));

                // Validate safe dry land spot away from river
                if (world.isWater(fleeX, fleeY, 10) || !world.canMoveTo(fleeX, fleeY, 8)) {
                  for (let step = 1; step <= 8; step++) {
                    const altAngle = fleeAngle + (step % 2 === 0 ? 1 : -1) * (step * 0.45);
                    const altX = Math.max(340, Math.min(2700, animal.x + Math.cos(altAngle) * dashDist));
                    const altY = Math.max(240, Math.min(1720, animal.y + Math.sin(altAngle) * dashDist));
                    if (!world.isWater(altX, altY, 10) && world.canMoveTo(altX, altY, 8)) {
                      fleeX = altX;
                      fleeY = altY;
                      break;
                    }
                  }
                }

                animal.targetX = fleeX;
                animal.targetY = fleeY;
                animal.facing = animal.targetX > animal.x ? 'right' : 'left';

                // Hunter persistently tracks this wounded prey to shoot again!
                this.setBubble('bow', 2.5);
                this.data.actionState = 'idle';
                this.data.thought = `Arrow struck the wild ${animal.type}! Wounded (${animal.health}/${animal.maxHealth} HP), it bolted into the thicket—tracking it down!`;
                this.data.targetResourceId = animal.id;
              }
            });
          } else {
            this.data.actionState = 'idle';
            this.data.thought = isBabyAnimal
              ? 'Lowered my bow—I will not hunt young baby animals until they reach full maturity!'
              : 'The wild prey darted away into the thicket!';
            this.data.targetResourceId = undefined;
          }
        } else {
          // Action timer completed for sitting, eating, talking, cooking, flirting, etc.
          // Restore to 'idle' so scheduled routine, work, and movement can naturally proceed!
          if (this.data.actionState !== 'sleeping' && this.data.actionState !== 'carrying') {
            this.data.actionState = 'idle';
          }
        }
      }
      return null;
    }

    // Check emergencies
    const emergencyEvent = this.checkEmergencies(world, allAgents);
    if (emergencyEvent) return emergencyEvent;

    // Check autonomous desire to build a new house!
    const buildEvent = this.checkAutonomousHouseBuilding(world);
    if (buildEvent) return buildEvent;

    if (this.data.routineInterrupted) {
      return null;
    }

    // Execute Scheduled Routine
    return this.executeSchedule(world, allAgents, gameMinutes);
  }

  private updateNeeds(delta: number): void {
    const n = this.data.needs;
    n.hunger = Math.max(0, n.hunger - delta * 0.1);

    if (this.data.actionState === 'sleeping') {
      n.energy = Math.min(100, n.energy + delta * 2.0);
      n.health = Math.min(100, n.health + delta * 0.5);
    } else {
      n.energy = Math.max(0, n.energy - delta * 0.07);
    }

    if (this.data.actionState !== 'talking' && this.data.actionState !== 'flirting' && this.data.actionState !== 'sitting') {
      n.social = Math.max(0, n.social - delta * 0.06);
    }

    n.fun = Math.max(0, n.fun - delta * 0.08);

    if (n.hunger > 60 && n.energy > 50 && n.health < 100) {
      n.health = Math.min(100, n.health + delta * 0.2);
    }
  }

  private updateBubble(delta: number): void {
    if (this.data.activeBubble) {
      this.data.activeBubble.duration -= delta;
      if (this.data.activeBubble.duration <= 0) {
        this.data.activeBubble = undefined;
      }
    }
  }

  public setBubble(type: BubbleType, durationSeconds = 3, text?: string, speakerName?: string): void {
    this.data.activeBubble = {
      type,
      duration: durationSeconds,
      maxDuration: durationSeconds,
      text,
      speakerName,
      bounceOffset: 0
    };
  }

  public addMemory(description: string, emotionalWeight: number, targetId?: string): void {
    const memory: Memory = {
      id: 'mem_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      description,
      emotionalWeight,
      targetId
    };
    this.data.memories.unshift(memory);
    if (this.data.memories.length > 25) {
      this.data.memories.pop();
    }
  }

  public getOrCreateRelationship(target: AgentData): Relationship {
    if (!this.data.relationships[target.id]) {
      const traitDiff = Math.abs(this.data.traits.agreeableness - target.traits.agreeableness);
      const initialAffinity = Math.round((1 - traitDiff) * 35);
      const attractionBase = Math.round(this.data.traits.libido * 50 + (Math.random() * 30));

      this.data.relationships[target.id] = {
        targetId: target.id,
        targetName: target.name,
        affinity: initialAffinity,
        attraction: attractionBase,
        trust: 25,
        fear: 0,
        status: 'acquaintance'
      };
    }
    return this.data.relationships[target.id];
  }

  public faceTowards(targetX: number, targetY: number): void {
    const dx = targetX - this.data.x;
    const dy = targetY - this.data.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.data.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.data.facing = dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Biomechanically grounded gait and demographic speed profile based on
   * empirical human walking surveys (m/s converted to game pixels/sec):
   * - Global default speed modifier: -20% (0.80x) across all NPCs
   * - Working men (20-55): baseline ~1.38 m/s (62-64 px/s)
   * - Working women (20-55): ~1.34 m/s (58-60 px/s, ~94% of male stride length)
   * - Children (8-15): ~1.10-1.18 m/s (50-52 px/s, shorter legs, agile bursts)
   * - Young kids (4-7): ~1.00 m/s (45 px/s)
   * - Elders (60+): ~1.15-1.25 m/s (47 px/s with cane, deliberate footing)
   * - Pregnant women: ~1.05-1.18 m/s (46 px/s, maternal load, widened stance)
   * - Toddlers (1-3): ~0.25-0.45 m/s (27 px/s, exclusively crawls on hands & knees)
   */
  public getGaitProfile(): {
    walkSpeed: number;
    runSpeed: number;
    fleeSpeed: number;
    strideCadence: number;
    maxCarryWeight: number;
    workPaceFactor: number;
  } {
    // Default 20% overall speed reduction applied across all NPCs
    const SPEED_SCALE = 0.80;

    const isToddler = this.data.age <= 3 || this.data.role === 'toddler';
    const isPregnant = !!(this.data.isPregnant || this.data.appearance.isPregnant);
    const isElder = this.data.age >= 60 || this.data.role === 'elder';
    const isMale = this.data.appearance.gender === 'male';

    let rawWalk = 78;
    let rawRun = 142;
    let rawFlee = 160;
    let strideCadence = 1.0;
    let maxCarryWeight = 1.0;
    let workPaceFactor = 1.0;

    // 1. Toddler (Ages 1-3): Hands-and-knees crawling only
    // Real crawling speed: 0.25 to 0.45 m/s (~25-35% of adult walking)
    if (isToddler) {
      rawWalk = 34;
      rawRun = 48;
      rawFlee = 54;
      strideCadence = 0.70;
      maxCarryWeight = 0.15;
      workPaceFactor = 0.0;
    }
    // 2. Expecting Mother (Pregnant 2nd/3rd trimester):
    // Real gait: ~1.05 to 1.18 m/s (~74-78% of adult male)
    // Maternal load, wider stance, pelvic shift; avoids running for safety
    else if (isPregnant) {
      rawWalk = 57;
      rawRun = 72;
      rawFlee = 85;
      strideCadence = 0.78;
      maxCarryWeight = 0.40;
      workPaceFactor = 0.72;
    }
    // 3. Elderly (60+ yrs, e.g. Elder Bron with cane):
    // Real gait: ~1.15 to 1.25 m/s (~75-80% of young working man)
    // Deliberate footing, cane support, sprint pace restricted to avoid falls
    else if (isElder) {
      rawWalk = 59;
      rawRun = 78;
      rawFlee = 92;
      strideCadence = 0.80;
      maxCarryWeight = 0.60;
      workPaceFactor = 0.75;
    }
    // 4. Children (Ages 4 to 15):
    // Shorter limbs and stride, high cadence
    else if (this.data.age < 16) {
      if (this.data.age <= 7) {
        rawWalk = 56;
        rawRun = 98;
        rawFlee = 112;
        strideCadence = 0.95;
        maxCarryWeight = 0.35;
        workPaceFactor = 0.45;
      } else {
        rawWalk = isMale ? 65 : 62;
        rawRun = isMale ? 116 : 110;
        rawFlee = isMale ? 132 : 126;
        strideCadence = 0.98;
        maxCarryWeight = 0.55;
        workPaceFactor = 0.65;
      }
    }
    // 5. Working Adult Women (Ages 16-59):
    // Real gait: ~1.31 to 1.39 m/s (~94-96% of adult male)
    else if (!isMale) {
      const isForager = this.data.role === 'forager';
      const isCook = this.data.role === 'cook';
      rawWalk = isForager ? 75 : isCook ? 73 : 73;
      rawRun = isForager ? 138 : 135;
      rawFlee = 148;
      strideCadence = 1.00;
      maxCarryWeight = 0.85;
      workPaceFactor = isForager ? 1.35 : isCook ? 1.40 : 1.00;
    }
    // 6. Working Adult Men (Ages 16-59):
    // Real gait: ~1.34 to 1.43 m/s (baseline ~1.39 m/s)
    // Higher average stature, stride length, and upper body muscle mass
    else {
      const isHunter = this.data.role === 'hunter';
      const isFisher = this.data.role === 'fisher';
      const isLumberjack = this.data.role === 'lumberjack';
      rawWalk = (isHunter || isFisher) ? 80 : isLumberjack ? 79 : 78;
      rawRun = isHunter ? 146 : isFisher ? 145 : 142;
      rawFlee = 160;
      strideCadence = 1.02;
      maxCarryWeight = 1.00;
      workPaceFactor = isLumberjack ? 1.35 : isHunter ? 1.30 : isFisher ? 1.25 : 1.00;
    }

    return {
      walkSpeed: Math.max(16, Math.round(rawWalk * SPEED_SCALE)),
      runSpeed: Math.max(24, Math.round(rawRun * SPEED_SCALE)),
      fleeSpeed: Math.max(28, Math.round(rawFlee * SPEED_SCALE)),
      strideCadence,
      maxCarryWeight,
      workPaceFactor
    };
  }

  public getMovementSpeed(world: World): { speed: number; state: 'walking' | 'running' | 'fleeing' } {
    const profile = this.getGaitProfile();
    const isToddler = this.data.age <= 3 || this.data.role === 'toddler';
    const isPregnant = !!(this.data.isPregnant || this.data.appearance.isPregnant);
    const isElder = this.data.age >= 60 || this.data.role === 'elder';

    // 1. Panic / Fleeing from attacks or lightning
    if (this.data.actionState === 'fleeing' || (this.data.routineInterrupted && this.data.interruptionReason?.includes('Lightning'))) {
      if (isToddler) {
        return { speed: profile.runSpeed, state: 'walking' }; // Toddlers crawl fast, never run
      }
      return { speed: profile.fleeSpeed, state: 'fleeing' };
    }

    // 2. Severe Starvation (hunger < 18) - rushing to food!
    if (this.data.needs.hunger < 18) {
      if (isToddler) {
        return { speed: profile.runSpeed, state: 'walking' };
      }
      return { speed: profile.runSpeed, state: isPregnant ? 'walking' : 'running' };
    }

    // 3. Severe Injury (health < 35) - rushing to healer!
    if (this.data.needs.health < 35) {
      if (isToddler) {
        return { speed: profile.runSpeed, state: 'walking' };
      }
      return { speed: profile.runSpeed, state: isPregnant ? 'walking' : 'running' };
    }

    // 4. Storm / Heavy Rain - hurrying for shelter!
    if (world.weather === 'stormy') {
      const hurrySpeed = Math.round(profile.walkSpeed * 1.32);
      if (isToddler) {
        return { speed: Math.min(profile.runSpeed, hurrySpeed), state: 'walking' };
      }
      return { 
        speed: Math.min(profile.runSpeed, hurrySpeed), 
        state: (isElder || isPregnant) ? 'walking' : 'running' 
      };
    }

    // 5. Romance sprint - rushing to meet spouse/crush
    if (this.data.targetAgentId) {
      const rel = this.data.relationships[this.data.targetAgentId];
      if (rel && (rel.status === 'married' || rel.status === 'dating' || rel.status === 'crush')) {
        return { speed: Math.round(profile.runSpeed * 0.9), state: (isElder || isPregnant) ? 'walking' : 'running' };
      }
    }

    // 6. Base movement speed
    let currentSpeed = profile.walkSpeed;
    let currentState: ActionState = 'walking';

    if (this.data.actionState === 'running') {
      currentSpeed = profile.runSpeed;
      currentState = isToddler ? 'walking' : (isElder || isPregnant ? 'walking' : 'running');
    }

    // 7. Carrying encumbrance: scales with cargo weight & physical strength
    if (this.data.carriedItem) {
      let weightPenalty = 0.95; // light basket (berries)
      if (this.data.carriedItem.type === 'log') {
        // Heavy timber load: strong lumberjacks bear weight better than lighter settlers
        weightPenalty = profile.maxCarryWeight >= 1.0 ? 0.78 : 0.65;
      } else if (this.data.carriedItem.type === 'meat' || this.data.carriedItem.type === 'fish' || this.data.carriedItem.type === 'water') {
        weightPenalty = 0.88;
      }
      currentSpeed = Math.round(currentSpeed * weightPenalty);
    }

    // 8. Fatigue / Exhaustion penalty: low energy (< 20) reduces pace
    if (this.data.needs.energy < 20) {
      currentSpeed = Math.round(currentSpeed * 0.85);
    }

    // 9. Paved road travel bonus: smooth cobbled trails grant +20% travel speed
    if (world.isOnRoad(this.data.x, this.data.y)) {
      currentSpeed = Math.round(currentSpeed * 1.20);
    }

    return { speed: Math.max(20, currentSpeed), state: currentState };
  }

  public setDestination(targetX: number, targetY: number, world: World, desiredState: ActionState = 'walking'): void {
    this.data.finalTargetX = targetX;
    this.data.finalTargetY = targetY;
    this.data.waypoints = [];

    const fromSide = world.getRiverSide(this.data.x, this.data.y);
    const toSide = world.getRiverSide(targetX, targetY);

    // If crossing the sandstone cliff (y: 240 to 318):
    const crossingCliff = (this.data.y < 240 && targetY > 318) || (this.data.y > 318 && targetY < 240);
    if (crossingCliff) {
      const isEast = fromSide === 'east' || toSide === 'east';
      const stairX = isEast ? 2050 : (this.data.x < 850 ? 580 : 1150);
      if (this.data.y < 240) {
        this.data.waypoints.push({ x: stairX, y: 228 });
        this.data.waypoints.push({ x: stairX, y: 326 });
      } else {
        this.data.waypoints.push({ x: stairX, y: 326 });
        this.data.waypoints.push({ x: stairX, y: 228 });
      }
    }

    // If crossing the river between West Bank and East Bank:
    if ((fromSide === 'west' && toSide === 'east') || (fromSide === 'east' && toSide === 'west')) {
      const midY = (this.data.y + targetY) / 2;
      // Find the closest bridge to cross safely
      const chosenBridge = world.bridges.slice().sort((a, b) =>
        Math.abs(midY - a.centerY) - Math.abs(midY - b.centerY)
      )[0];

      const bridgeY = chosenBridge.centerY;
      const bcx = world.getRiverCenterX(bridgeY);

      if (fromSide === 'west') {
        // West to East: approach west entrance -> cross deck -> exit east landing
        this.data.waypoints.push({ x: bcx - 85, y: bridgeY });
        this.data.waypoints.push({ x: bcx + 85, y: bridgeY });
      } else {
        // East to West: approach east entrance -> cross deck -> exit west landing
        this.data.waypoints.push({ x: bcx + 85, y: bridgeY });
        this.data.waypoints.push({ x: bcx - 85, y: bridgeY });
      }
    }

    // Add final destination
    this.data.waypoints.push({ x: targetX, y: targetY });

    // Begin with first waypoint
    const first = this.data.waypoints.shift()!;
    this.data.targetX = first.x;
    this.data.targetY = first.y;
    this.data.actionState = desiredState;
  }

  private moveTowardsTarget(delta: number, world: World): void {
    if (this.data.targetX === undefined || this.data.targetY === undefined) {
      if (this.data.waypoints && this.data.waypoints.length > 0) {
        const next = this.data.waypoints.shift()!;
        this.data.targetX = next.x;
        this.data.targetY = next.y;
      } else {
        return;
      }
    }

    const dx = this.data.targetX - this.data.x;
    const dy = this.data.targetY - this.data.y;
    const dist = Math.hypot(dx, dy);

    const { speed, state } = this.getMovementSpeed(world);
    if (this.data.actionState !== 'fleeing' && this.data.actionState !== 'carrying') {
      this.data.actionState = state;
    }

    const hasMoreWaypoints = !!(this.data.waypoints && this.data.waypoints.length > 0);
    const arrivalThreshold = hasMoreWaypoints ? 24 : 10;

    if (dist <= 0.001) {
      this.data.targetX = undefined;
      this.data.targetY = undefined;
      this.data.walkCycle = 0;
      if (this.data.actionState === 'walking' || this.data.actionState === 'running' || this.data.actionState === 'fleeing') {
        this.data.actionState = 'idle';
      }
      return;
    }

    if (dist < arrivalThreshold) {
      if (hasMoreWaypoints) {
        // Proceed to next waypoint on route. Wait for the next simulation tick
        // before moving so we never travel toward a stale point.
        const next = this.data.waypoints!.shift()!;
        this.data.targetX = next.x;
        this.data.targetY = next.y;
        return;
      }

      // Arrived at destination
      this.data.x = this.data.targetX;
      this.data.y = this.data.targetY;
      this.data.targetX = undefined;
      this.data.targetY = undefined;
      this.data.finalTargetX = undefined;
      this.data.finalTargetY = undefined;
      this.data.walkCycle = 0;
      if (this.data.actionState === 'walking' || this.data.actionState === 'running' || this.data.actionState === 'fleeing') {
        this.data.actionState = 'idle';
      }
      return;
    }

    const step = Math.min(dist, speed * delta);
    const stepX = (dx / dist) * step;
    const stepY = (dy / dist) * step;

    // Movement with physics water collision avoidance and bank sliding
    const newPos = world.moveWithPhysics(this.data.x, this.data.y, stepX, stepY, 8);
    const movedDist = Math.hypot(newPos.x - this.data.x, newPos.y - this.data.y);
    this.data.x = newPos.x;
    this.data.y = newPos.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.data.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.data.facing = dy > 0 ? 'down' : 'up';
    }

    const profile = this.getGaitProfile();
    const isRunning = state === 'running' || state === 'fleeing';
    const baseRate = isRunning ? 16 : 8.5;
    const cadenceRate = (speed / 60) * baseRate * profile.strideCadence;
    this.data.walkCycle += delta * Math.max(3.0, cadenceRate);

    // Anti-stuck safeguard: If blocked from moving forward, skip waypoint or finish
    if (movedDist < 0.05 && dist > 14) {
      if (hasMoreWaypoints) {
        const next = this.data.waypoints!.shift()!;
        this.data.targetX = next.x;
        this.data.targetY = next.y;
      } else {
        // Clear destination so agent chooses next task naturally
        this.data.targetX = undefined;
        this.data.targetY = undefined;
        this.data.actionState = 'idle';
      }
    }
  }

  private checkEmergencies(world: World, allAgents: Agent[]): string | null {
    // Exhaustion Collapse: Lay down to sleep if energy is depleted!
    if (this.data.needs.energy < 12 && this.data.actionState !== 'sleeping') {
      this.interruptRoutine('Exhaustion Collapse', 12);
      this.data.targetX = undefined;
      this.data.targetY = undefined;
      this.data.waypoints = [];
      this.data.actionState = 'sleeping';
      this.data.facing = 'right';
      this.data.thought = 'Completely exhausted... collapsed into deep sleep.';
      this.setBubble('sleep', 5);
      return `${this.data.name} collapsed from exhaustion and lay down to sleep.`;
    }

    if (this.data.needs.health < 35 && this.data.actionState !== 'healing' && !this.healingPending) {
      this.healingPending = true;
      this.interruptRoutine('Severe Injury', 10);
      const hut = world.getBuildingById('healer_hut');
      const healX = hut ? hut.door.x : world.campfire.x;
      const healY = hut ? hut.door.y : world.campfire.y;
      this.setDestination(healX, healY, world, 'running');
      this.data.thought = hut
        ? 'Bleeding heavily... sprinting to the Healer!'
        : 'Bleeding heavily... resting by the campfire until the pain fades.';
      this.setBubble('blood', 4);

      this.scheduleAction(3, () => {
        this.healingPending = false;
        this.data.needs.health = Math.min(100, this.data.needs.health + 40);
        this.data.actionState = 'healing';
        this.data.actionTimer = 5;
      });
      return `${this.data.name} sprinted to the Healer's Sanctuary for emergency care.`;
    }

    if (this.data.needs.hunger < 15 && !this.eatingPending && this.data.actionState !== 'eating') {
      this.eatingPending = true;
      this.interruptRoutine('Severe Starvation', 8);
      const hearth = world.getBuildingById('hearth');
      const mealX = hearth ? hearth.door.x : world.campfire.x;
      const mealY = hearth ? hearth.door.y : world.campfire.y;
      this.setDestination(mealX, mealY, world, 'running');
      this.data.thought = 'Starving! Running to the hearth for food!';
      this.setBubble('food', 3);

      this.scheduleAction(2.5, () => {
        this.eatingPending = false;
        if (world.stockpile.food > 0) world.stockpile.food -= 1;
        this.data.needs.hunger = 80;
        this.faceTowards(mealX, mealY - 15);
        this.data.actionState = 'eating';
        this.data.actionTimer = 4;
      });
      return `${this.data.name} sprinted out of acute hunger to eat at the hearth.`;
    }

    // Never start a second brawl while one is already in progress. Without
    // this guard the emergency check queued a new damage callback every frame.
    if (this.data.actionState !== 'fighting') {
      const nearbyEnemy = allAgents.find(a => {
        if (a.data.id === this.data.id || a.data.actionState === 'unconscious') return false;
        const rel = this.data.relationships[a.data.id];
        return rel && rel.affinity < -50 && Math.hypot(a.data.x - this.data.x, a.data.y - this.data.y) < 70;
      });

      if (nearbyEnemy && (this.data.traits.aggression > 0.5 || nearbyEnemy.data.traits.aggression > 0.5)) {
        this.interruptRoutine(`Brawl with ${nearbyEnemy.data.name}`, 8);
        nearbyEnemy.interruptRoutine(`Brawl with ${this.data.name}`, 8);
        return this.triggerConflict(nearbyEnemy);
      }
    }

    return null;
  }

  public interruptRoutine(reason: string, durationSeconds = 10): void {
    this.data.routineInterrupted = true;
    this.data.interruptionReason = reason;
    this.data.interruptionTimer = durationSeconds;
  }

  /**
   * Autonomous House Building Decision:
   * When an NPC wants their own house (new family, married, or desire for independence)
   */
  public checkAutonomousHouseBuilding(world: World): string | null {
    if (this.data.age < 16 || this.data.isPregnant) return null;
    // 1. If currently building an in-progress house
    if (this.data.targetBuildingId) {
      const site = world.getBuildingById(this.data.targetBuildingId);
      if (site && !site.isConstructed) {
        const dist = Math.hypot(this.data.x - site.door.x, this.data.y - site.door.y);
        if (dist > 30) {
          this.setDestination(site.door.x, site.door.y, world, 'walking');
          this.data.thought = `Walking to my house construction site.`;
          return null;
        }

        // Hammer and build!
        this.faceTowards(site.x + site.width / 2, site.y + site.height / 2);
        this.data.actionState = 'building';
        this.data.actionTimer = 5;
        this.setBubble('hammer', 4);
        this.data.thought = 'Hammering wooden beams and fitting logs for my family home!';

        this.scheduleAction(3.5, () => {
          const finished = world.advanceBuildingConstruction(site.id, 25);
          if (finished) {
            this.data.homeCabinId = site.id;
            this.data.targetBuildingId = undefined;
            this.data.wantsToBuildHouse = false;
            this.initDefaultSchedule();
            this.setBubble('home', 5);
            this.addMemory(`Finished building my own home: ${site.name}!`, 95);
          } else {
            this.data.actionState = 'idle';
          }
        });

        return `${this.data.name} is hammering timber at ${site.name} (${site.constructionProgress + 25}% complete).`;
      } else {
        this.data.targetBuildingId = undefined;
      }
    }

    // 2. Decide if they want to start a brand new house
    const ownsHouse = world.buildings.some(b => b.ownerIds.includes(this.data.id));
    const canAffordWood = world.stockpile.wood >= 10;

    if ((!ownsHouse || this.data.wantsToBuildHouse) && canAffordWood && Math.random() < 0.05) {
      world.stockpile.wood -= 10;
      const spot = world.findClearSpotForHouse();
      const houseName = `${this.data.familyName} Homestead`;
      const site = world.createBuildingSite(houseName, this.data.familyName, spot.x, spot.y, this.data.id);
      this.data.targetBuildingId = site.id;
      this.setBubble('hammer', 4);
      this.addMemory(`Laid the foundation for a new family homestead: ${houseName}`, 70);
      return `🔨 ${this.data.name} initiated construction of ${houseName} in a forest clearing!`;
    }

    return null;
  }

  private executeSchedule(world: World, allAgents: Agent[], gameMinutes: number): string | null {
    const currentHour = Math.floor(gameMinutes / 60);
    const entry = this.data.schedule.find(s => currentHour >= s.startHour && currentHour < s.endHour);

    if (!entry) return null;

    switch (entry.task) {
      case 'sleep':
        return this.performSleepTask(world);

      case 'breakfast':
      case 'lunch':
      case 'dinner':
        return this.performMealTask(world, allAgents, entry.task);

      case 'work':
      case 'afternoon_work':
        return this.performWorkTask(world, allAgents);

      case 'evening_social':
        return this.performCampfireSocialTask(world, allAgents);

      case 'relax':
      default:
        // Settlers occasionally enjoy peaceful fishing at the lotus pond or forest sanctuary pond!
        if (Math.random() < 0.22 && (world.stockpile.fish || 0) < 55 && this.data.actionState !== 'fishing' && this.data.actionState !== 'sitting') {
          return this.workFisher(world);
        }
        if (Math.random() < 0.6 && this.data.actionState !== 'sitting') {
          this.data.actionState = 'sitting';
          this.data.actionTimer = 8;
          this.data.thought = 'Sitting down peacefully to rest and breathe the mountain pine air.';
          this.setBubble('peace', 3);
        } else if (this.data.actionState !== 'sitting') {
          this.data.actionState = 'idle';
          this.data.thought = 'Taking a peaceful moment in the forest.';
        }
        return null;
    }
  }

  private performSleepTask(world: World): string | null {
    if (this.data.actionState === 'sleeping') return null;

    const cabin = world.getBuildingById(this.data.homeCabinId) || world.getBuildingById('cabin_vance');

    if (!cabin) {
      // Homes can be demolished by the god player; sleep where we stand rather
      // than crashing on a missing building.
      this.data.indoorBuildingId = undefined;
      this.data.actionState = 'sleeping';
      this.data.facing = 'right';
      this.data.thought = 'Too tired to walk home; curling up to sleep under the stars.';
      this.setBubble('sleep', 5);
      return null;
    }

    const bedX = cabin.door.x + (this.data.age % 2 === 0 ? -16 : 16);
    const bedY = cabin.door.y - 12;
    const dist = Math.hypot(this.data.x - bedX, this.data.y - bedY);

    if (dist > 16) {
      this.setDestination(bedX, bedY, world, 'walking');
      this.data.thought = `Walking home to ${cabin.name} to lay down and sleep.`;
      return null;
    }

    this.data.actionState = 'sleeping';
    this.data.indoorBuildingId = cabin.id;
    this.data.facing = 'right';
    this.data.thought = `Sleeping soundly in my family bed at ${cabin.name}.`;
    this.setBubble('sleep', 5);
    return null;
  }

  private performMealTask(world: World, allAgents: Agent[], mealName: string): string | null {
    if (this.data.actionState === 'eating' || this.data.actionState === 'sitting') return null;

    const hearth = world.getBuildingById('hearth');

    // If the communal hearth is gone, eat around the campfire instead.
    const diningX = hearth ? hearth.x + hearth.width - 64 : world.campfire.x;
    const diningY = hearth ? hearth.y + hearth.height - 18 : world.campfire.y;
    const dist = Math.hypot(this.data.x - diningX, this.data.y - diningY);

    if (dist > 30) {
      this.setDestination(diningX + (Math.random() * 24 - 12), diningY + (Math.random() * 12 - 6), world, 'walking');
      this.data.thought = `Heading to the ${hearth ? 'great hearth veranda' : 'campfire'} for ${mealName}.`;
      return null;
    }

    this.faceTowards(diningX - 10, diningY);
    this.data.actionState = 'sitting';
    this.data.actionTimer = 6;
    this.setBubble('food', 3);
    this.data.needs.hunger = Math.min(100, this.data.needs.hunger + 45);
    this.data.thought = hearth
      ? 'Sitting on the veranda bench enjoying warm roasted stew.'
      : 'Sharing a simple meal beside the crackling campfire.';

    if (world.stockpile.food > 0) {
      world.stockpile.food = Math.max(0, world.stockpile.food - 1);
    }
    if ((world.stockpile.water || 0) > 0 && Math.random() < 0.6) {
      world.stockpile.water = Math.max(0, (world.stockpile.water || 0) - 1);
    }

    const fellowDiner = allAgents.find(a => 
      a.data.id !== this.data.id && 
      (a.data.actionState === 'eating' || a.data.actionState === 'sitting' || a.data.actionState === 'idle') &&
      !a.data.activeDialog &&
      Math.hypot(a.data.x - this.data.x, a.data.y - this.data.y) < 70
    );

    if (fellowDiner && this.lastSocialCooldown <= 0) {
      return this.startConversationWith(fellowDiner, world, 12 * 60);
    }

    return null;
  }

  private performWorkTask(world: World, allAgents: Agent[] = []): string | null {
    if (this.data.carriedItem) {
      if (this.data.carriedItem.type === 'water') {
        const hearth = world.getBuildingById('hearth') || world.getBuildingById('storehouse');
        const dropX = hearth ? hearth.x + 80 : world.campfire.x + 30;
        const dropY = hearth ? hearth.y + 70 : world.campfire.y + 20;
        const dist = Math.hypot(this.data.x - dropX, this.data.y - dropY);
        if (dist > 30) {
          this.setDestination(dropX, dropY, world, 'carrying');
          this.data.thought = 'Carrying a bucket of fresh drinking water back to the kitchen hearth.';
          return null;
        }
        world.stockpile.water = (world.stockpile.water || 0) + this.data.carriedItem.count;
        const msg = `${this.data.name} delivered fresh pond drinking water to the kitchen hearth.`;
        this.data.carriedItem = undefined;
        this.data.actionState = 'idle';
        this.setBubble('water', 3);
        this.addMemory('Delivered fresh drinking water from the lotus pond to the settlement hearth', 30);
        return msg;
      }

      const storehouse = world.getBuildingById('storehouse');

      if (storehouse) {
        const dist = Math.hypot(this.data.x - storehouse.door.x, this.data.y - storehouse.door.y);

        if (dist > 30) {
          this.setDestination(storehouse.door.x, storehouse.door.y, world, 'carrying');
          this.data.thought = `Carrying ${this.data.carriedItem.type} to the central storehouse.`;
          return null;
        }
      }

      if (this.data.carriedItem.type === 'log') {
        world.stockpile.wood += this.data.carriedItem.count;
      } else if (this.data.carriedItem.type === 'berries') {
        world.stockpile.food += this.data.carriedItem.count;
      } else if (this.data.carriedItem.type === 'fish') {
        world.stockpile.fish += this.data.carriedItem.count;
        world.stockpile.food += this.data.carriedItem.count;
      } else if (this.data.carriedItem.type === 'meat') {
        world.stockpile.food += this.data.carriedItem.count;
      }

      const deposited = storehouse
        ? `${this.data.name} deposited ${this.data.carriedItem.count} ${this.data.carriedItem.type} into the grand storehouse.`
        : `${this.data.name} unloaded ${this.data.carriedItem.count} ${this.data.carriedItem.type} at the camp.`;
      this.data.carriedItem = undefined;
      this.data.actionState = 'idle';
      this.setBubble('idea', 2);
      return deposited;
    }

    // Life-stage & demographic role specialization:
    // Children and toddlers strictly NEVER work! They play until full adult maturity at Age 16.
    if (this.data.age < 16 || this.data.role === 'toddler' || this.data.role === 'child') {
      if (this.data.carriedItem) {
        this.data.carriedItem = undefined;
      }
      if (this.data.age <= 3 || this.data.role === 'toddler') {
        return this.workToddlerPlay(world);
      }
      return this.workChildPlay(world, allAgents);
    }

    if (this.data.isPregnant || this.data.appearance.isPregnant) {
      return this.workMaternalTending(world);
    }
    if (this.data.age >= 60 || this.data.role === 'elder') {
      return this.workElderCounsel(world, allAgents);
    }

    if (this.data.role === 'lumberjack') {
      return this.workLumberjack(world);
    } else if (this.data.role === 'forager') {
      return this.workForager(world);
    } else if (this.data.role === 'fisher') {
      return this.workFisher(world);
    } else if (this.data.role === 'cook') {
      return this.workCook(world);
    } else if (this.data.role === 'hunter') {
      return this.workHunter(world);
    } else {
      if (this.data.appearance.gender === 'female' && (world.stockpile.water || 0) < 35 && Math.random() < 0.5) {
        return this.workFetchDrinkingWater(world);
      }
      if ((world.stockpile.fish || 0) < 30 && Math.random() < 0.45) {
        return this.workFisher(world);
      }
      return this.workPatrol(world);
    }
  }

  /**
   * Toddler Routine: Toddlers explore by crawling on hands & knees near home,
   * stacking rainbow rings on the grass, or rolling their little toy car.
   */
  private workToddlerPlay(world: World): string | null {
    if (this.data.actionState === 'sitting' || this.data.actionState === 'walking') return null;

    const cabin = world.getBuildingById(this.data.homeCabinId);
    const baseX = cabin ? cabin.door.x : this.data.x;
    const baseY = cabin ? cabin.door.y : this.data.y;
    const dist = Math.hypot(this.data.x - baseX, this.data.y - baseY);

    if (dist > 50 && Math.random() < 0.45) {
      // Crawl back closer to family home
      this.setDestination(baseX + (Math.random() * 24 - 12), baseY + (Math.random() * 20 - 10), world, 'walking');
      this.data.thought = 'Crawling on hands and knees back toward home.';
      return null;
    }

    if (Math.random() < 0.45) {
      // Sit on floor to play with toys
      this.data.actionState = 'sitting';
      this.data.actionTimer = 6;
      const toy = Math.random() < 0.5 ? 'colorful stacking rings' : 'little red wooden toy car';
      this.data.thought = `Sitting happily on the grass playing with ${toy}.`;
      this.setBubble('idea', 4);
    } else {
      // Crawl around playfully
      const crawlX = baseX + (Math.random() * 60 - 30);
      const crawlY = baseY + (Math.random() * 50 - 25);
      this.setDestination(crawlX, crawlY, world, 'walking');
      this.data.thought = 'Crawling around happily exploring the ground on all fours.';
      this.setBubble('peace', 3);
    }
    return null;
  }

  /**
   * Child Routine (Ages 4 to 15):
   * Children NEVER work! They dedicate their childhood to playful exploration,
   * active tag games with friends, friendly animal interactions, and nature discovery.
   */
  private workChildPlay(world: World, allAgents: Agent[]): string | null {
    if (this.data.actionState === 'sitting' || this.data.actionState === 'walking' || this.data.actionState === 'running') {
      return null;
    }

    const otherChildren = allAgents.filter(a => 
      a.data.id !== this.data.id && 
      a.data.age >= 4 && 
      a.data.age < 16 && 
      !a.data.isDead
    );

    const lotusPond = world.ponds.find(p => p.id === 'pond_pastoral');
    const roll = Math.random();

    // 1. Tag & Chase Game with other village children (30% chance if friends are nearby)
    if (roll < 0.30 && otherChildren.length > 0) {
      const playmate = otherChildren[Math.floor(Math.random() * otherChildren.length)];
      const dist = Math.hypot(this.data.x - playmate.data.x, this.data.y - playmate.data.y);

      if (dist < 180) {
        const runTargetX = playmate.data.x + (Math.random() * 40 - 20);
        const runTargetY = playmate.data.y + (Math.random() * 40 - 20);
        this.setDestination(runTargetX, runTargetY, world, 'running');
        this.data.thought = `Playing tag with ${playmate.data.name.split(' ')[0]}! Running joyfully across the grass!`;
        this.setBubble('laugh', 3.5);
        this.data.needs.fun = Math.min(100, this.data.needs.fun + 12);
        this.data.needs.social = Math.min(100, this.data.needs.social + 10);
        return `${this.data.name} is playing a spirited game of tag with ${playmate.data.name.split(' ')[0]}.`;
      }
    }

    // 2. Skipping Stones at the Lotus Pond (25% chance)
    if (roll < 0.55 && lotusPond) {
      const shoreX = lotusPond.waterCenterX - 18;
      const shoreY = lotusPond.waterCenterY - lotusPond.waterRadiusY - 10;
      const pondDist = Math.hypot(this.data.x - shoreX, this.data.y - shoreY);

      if (pondDist > 30) {
        this.setDestination(shoreX, shoreY, world, 'walking');
        this.data.thought = 'Skipping down to the lotus pond with a handful of smooth flat stones.';
        this.setBubble('peace', 3);
        return null;
      }

      // At the pond: skip stones!
      this.faceTowards(lotusPond.waterCenterX, lotusPond.waterCenterY);
      this.data.actionState = 'sitting';
      this.data.actionTimer = 5;
      const skips = Math.floor(Math.random() * 4) + 2;
      this.data.thought = `Skipped a smooth flat pebble across the lotus pond—counted ${skips} skips over the lily pads!`;
      this.setBubble('idea', 4);
      world.spawnSpecialEffect('sparkle', lotusPond.waterCenterX - 20, lotusPond.waterCenterY - 10, undefined, undefined, 0.6);
      this.data.needs.fun = Math.min(100, this.data.needs.fun + 15);
      return `${this.data.name} skipped stones across the lotus pond.`;
    }

    // 3. Petting & Playing with Friendly Animals (20% chance)
    if (roll < 0.75 && world.animals.length > 0) {
      const liveAnimals = world.animals.filter(an => !an.isDead && an.state !== 'fleeing');
      if (liveAnimals.length > 0) {
        const petAnimal = liveAnimals[Math.floor(Math.random() * liveAnimals.length)];
        const dist = Math.hypot(this.data.x - petAnimal.x, this.data.y - petAnimal.y);

        if (dist > 30) {
          this.setDestination(petAnimal.x + (Math.random() * 20 - 10), petAnimal.y + (Math.random() * 20 - 10), world, 'walking');
          this.data.thought = `Running over to pet the friendly wild ${petAnimal.type}.`;
          return null;
        }

        // Beside animal: pet and scratch!
        this.data.actionState = 'sitting';
        this.data.actionTimer = 4.5;
        this.setBubble('heart', 3.5);
        petAnimal.emote = '❤️';
        petAnimal.emoteTimer = 3.0;

        if (petAnimal.type === 'chicken') {
          this.data.thought = 'Gently scratching a fluffy hen, giggling as she clucks happily!';
        } else if (petAnimal.type === 'dog') {
          this.data.thought = 'Playing fetch and rubbing the friendly village dog behind the ears!';
        } else if (petAnimal.type === 'sheep') {
          this.data.thought = 'Hugging a gentle woolly sheep by the meadow clover!';
        } else if (petAnimal.type === 'rabbit') {
          this.data.thought = 'Watching a soft wild rabbit nibble wild clover, smiling quietly.';
        } else {
          this.data.thought = `Petting a calm ${petAnimal.type} grazing in the sweet grass.`;
        }
        this.data.needs.fun = Math.min(100, this.data.needs.fun + 10);
        return `${this.data.name} is playing with a friendly ${petAnimal.type}.`;
      }
    }

    // 4. Gathering Meadow Wildflowers or Doodling in the Dirt (25% chance)
    this.data.actionState = 'sitting';
    this.data.actionTimer = 5;
    const isFlower = Math.random() < 0.5;
    if (isFlower) {
      this.data.thought = 'Picking bluebells and yellow buttercups from the meadow to weave a flower crown.';
      this.setBubble('berry', 3.5);
    } else {
      this.data.thought = 'Doodling a smiling sun and a little cabin in the soft dirt with a pine stick.';
      this.setBubble('idea', 3.5);
    }
    this.data.needs.fun = Math.min(100, this.data.needs.fun + 8);
    return null;
  }

  /**
   * Expecting Mother: Focuses on gentle domestic chores, sorting herbs,
   * preparing warm swaddling blankets, and taking restful pauses.
   */
  private workMaternalTending(world: World): string | null {
    if (this.data.actionState === 'sitting' || this.data.actionState === 'walking') return null;

    const hearth = world.getBuildingById('hearth');
    const targetX = hearth ? hearth.x + 40 : this.data.x;
    const targetY = hearth ? hearth.y + 50 : this.data.y;
    const dist = Math.hypot(this.data.x - targetX, this.data.y - targetY);

    if (dist > 35 && Math.random() < 0.5) {
      this.setDestination(targetX, targetY, world, 'walking');
      this.data.thought = 'Walking at a careful, gentle pace toward the hearth veranda.';
      return null;
    }

    this.data.actionState = 'sitting';
    this.data.actionTimer = 6;
    this.data.thought = 'Resting comfortably, feeling the baby kick while sewing warm swaddling clothes.';
    this.setBubble('heart', 4);
    this.data.needs.energy = Math.min(100, this.data.needs.energy + 8);
    return `${this.data.name} is resting and preparing soft blankets for the upcoming baby.`;
  }

  /**
   * Elder Council & Blessing: Elder Bron walks with his walking stick,
   * sharing wisdom, historical tales, and guidance with nearby villagers.
   */
  private workElderCounsel(world: World, allAgents: Agent[]): string | null {
    if (this.data.actionState === 'talking' || this.data.actionState === 'sitting' || this.data.actionState === 'walking') return null;

    const nearby = allAgents.find(a => 
      a.data.id !== this.data.id && 
      a.data.actionState !== 'sleeping' && 
      Math.hypot(a.data.x - this.data.x, a.data.y - this.data.y) < 65
    );

    if (nearby && Math.random() < 0.4) {
      this.faceTowards(nearby.data.x, nearby.data.y);
      this.data.actionState = 'sitting';
      this.data.actionTimer = 5;
      this.data.thought = `Sharing ancient mountain folklore and gentle guidance with ${nearby.data.name}.`;
      this.setBubble('peace', 4);
      nearby.data.needs.fun = Math.min(100, nearby.data.needs.fun + 6);
      nearby.data.needs.social = Math.min(100, nearby.data.needs.social + 6);
      return `${this.data.name} offered wise counsel and blessing to ${nearby.data.name}.`;
    }

    return this.workPatrol(world);
  }

  /**
   * Lumberjack Woodcutting:
   * Real ergonomics: Male upper-body strength and isometric swing power yield higher kinetic force per stroke.
   * - Adult male lumberjack (Bram Vance): 55 woodHealth per hit (takes 2 hits to fell tree), 2.8s swing time.
   * - Female woodcutter: rhythmic technique, 40 woodHealth per hit, 3.4s swing time.
   * - Apprentice/others: 25 woodHealth, 4.5s swing time.
   */
  private workLumberjack(world: World): string | null {
    if (this.data.actionState === 'chopping') return null;

    const targetTree = world.trees
      .filter(t => t.woodHealth > 0 && t.stage !== 'sapling' && t.stage !== 'decaying')
      .sort((a, b) => 
        Math.hypot(a.x - this.data.x, a.y - this.data.y) - 
        Math.hypot(b.x - this.data.x, b.y - this.data.y)
      )[0];

    if (!targetTree) {
      this.data.thought = 'Waiting for forest trees to regrow.';
      return null;
    }

    const dist = Math.hypot(this.data.x - targetTree.x, this.data.y - targetTree.y);

    if (dist > 30) {
      this.setDestination(targetTree.x - 15, targetTree.y, world, 'walking');
      this.data.thought = 'Walking to a tall pine tree with my woodcutting axe.';
      return null;
    }

    this.faceTowards(targetTree.x, targetTree.y);
    this.data.actionState = 'chopping';

    const isMale = this.data.appearance.gender === 'male';
    const isPrimeAge = this.data.age >= 18 && this.data.age < 55;
    const isSpecialist = this.data.role === 'lumberjack';

    const swingDuration = (isSpecialist && isMale && isPrimeAge) ? 2.8 : isSpecialist ? 3.4 : 4.5;
    const damagePerSwing = (isSpecialist && isMale && isPrimeAge) ? 55 : isSpecialist ? 40 : 25;

    this.data.actionTimer = swingDuration + 1.2;
    this.setBubble('axe', 4);
    this.data.thought = (isSpecialist && isMale && isPrimeAge)
      ? 'Swinging heavy timber axe with powerful, muscular strokes!'
      : 'Rhythmically striking the trunk with steady woodcutter swings.';

    this.scheduleAction(swingDuration, () => {
      if (!world.trees.includes(targetTree)) {
        this.data.actionState = 'idle';
        return;
      }

      targetTree.shakeTimer = 1.0;
      targetTree.woodHealth = Math.max(0, targetTree.woodHealth - damagePerSwing);

      if (targetTree.woodHealth <= 0) {
        this.data.carriedItem = { type: 'log', count: 2 };
        this.data.actionState = 'carrying';
        this.setBubble('idea', 3);
        this.addMemory('Felled a giant timber tree for the settlement', 30);
      } else {
        this.data.actionState = 'idle';
      }
    });

    return `${this.data.name} is chopping wood at the forest edge.`;
  }

  /**
   * Foraging:
   * Real ergonomics: Female fine motor dexterity and visual color discrimination grant superior picking speed
   * and higher cluster yield.
   * - Female forager (Talia Thorne): 2.0s pick time, 3-4 berries per bush (40% bonus chance).
   * - Male / untrained forager: 3.2s pick time, 2-3 berries.
   * - Apprentice children: 2.6s pick time, 2 berries.
   */
  private workForager(world: World): string | null {
    if (this.data.actionState === 'foraging') return null;

    const bush = world.berryBushes
      .filter(b => b.hasBerries && b.stage === 'fruiting')
      .sort((a, b) => 
        Math.hypot(a.x - this.data.x, a.y - this.data.y) - 
        Math.hypot(b.x - this.data.x, b.y - this.data.y)
      )[0];

    if (!bush) {
      this.data.thought = 'Searching for ripe berries.';
      return null;
    }

    const dist = Math.hypot(this.data.x - bush.x, this.data.y - bush.y);

    if (dist > 25) {
      this.setDestination(bush.x, bush.y, world, 'walking');
      this.data.thought = 'Heading over to the wild berry patch.';
      return null;
    }

    this.faceTowards(bush.x, bush.y);
    this.data.actionState = 'foraging';

    const isFemale = this.data.appearance.gender === 'female';
    const isSpecialist = this.data.role === 'forager';
    const pickDuration = (isSpecialist && isFemale) ? 2.0 : isSpecialist ? 2.5 : 3.2;
    const bonusChance = (isSpecialist && isFemale) ? 0.40 : 0.15;
    const count = Math.random() < bonusChance ? 4 : 3;

    this.data.actionTimer = pickDuration + 1.0;
    this.setBubble('berry', 3);
    this.data.thought = isFemale 
      ? 'Deftly picking clusters of ripe wild berries with quick, gentle fingers.'
      : 'Carefully picking wild berries from the bush.';

    this.scheduleAction(pickDuration, () => {
      if (!world.berryBushes.includes(bush) || !bush.hasBerries) {
        this.data.actionState = 'idle';
        return;
      }

      bush.hasBerries = false;
      this.data.carriedItem = { type: 'berries', count };
      this.data.actionState = 'carrying';
      this.addMemory(`Gathered ${count} fresh wild berries for dinner`, 25);
    });

    return `${this.data.name} is foraging berries in the forest.`;
  }

  /**
   * Fishing:
   * Reflexes, line patience, and hook timing.
   * Catching a fish is never instant — it takes genuine patience and staged bite timing.
   * - Finn Gale (athletic young male fisher): 16.0–20.0s catch duration, lands 1 fresh fish.
   * - Untrained fisher: 22.0–28.0s catch duration, lands 1 fresh fish.
   * Staged progression:
   * 1. Line cast & patient observation
   * 2. Nibbles & float twitch (~50% duration)
   * 3. Strike & firm bite hook set (~80% duration)
   * 4. Reeling and landing 1 fish (100% duration)
   */
  private workFisher(world: World): string | null {
    if (this.data.actionState === 'fishing') return null;

    // Available fishing spots across the settlement:
    // 1. Tranquil Lotus Pond (West Bank pastoral lily pond)
    // 2. Whispering Sanctuary Pond (East Bank secluded forest lily pond)
    // 3. North River Fishing Pier (River dock)
    const lotusPond = world.ponds.find(p => p.id === 'pond_pastoral');
    const sanctuaryPond = world.ponds.find(p => p.id === 'pond_sanctuary');
    const dock = world.getBuildingById('dock_north');

    interface FishingSpot {
      id: string;
      name: string;
      type: 'pond' | 'river';
      x: number;
      y: number;
      waterTargetX: number;
      waterTargetY: number;
    }

    const spots: FishingSpot[] = [];

    if (lotusPond) {
      // Dry grassy northern rim of lotus pond
      const shoreX = lotusPond.waterCenterX - 18;
      const shoreY = lotusPond.waterCenterY - lotusPond.waterRadiusY - 14;
      spots.push({
        id: 'pond_pastoral',
        name: 'Tranquil Lotus Pond',
        type: 'pond',
        x: shoreX,
        y: shoreY,
        waterTargetX: lotusPond.waterCenterX,
        waterTargetY: lotusPond.waterCenterY
      });
    }

    if (sanctuaryPond) {
      // Dry grassy northern bank of sanctuary pond
      const shoreX = sanctuaryPond.waterCenterX;
      const shoreY = sanctuaryPond.waterCenterY - sanctuaryPond.waterRadiusY - 14;
      spots.push({
        id: 'pond_sanctuary',
        name: 'Whispering Sanctuary Pond',
        type: 'pond',
        x: shoreX,
        y: shoreY,
        waterTargetX: sanctuaryPond.waterCenterX,
        waterTargetY: sanctuaryPond.waterCenterY
      });
    }

    if (dock) {
      spots.push({
        id: 'dock_north',
        name: 'North River Pier',
        type: 'river',
        x: dock.x + 50,
        y: dock.y + 75,
        waterTargetX: world.getRiverCenterX(dock.y + 75),
        waterTargetY: dock.y + 75
      });
    } else {
      const bankY = Math.max(300, Math.min(1500, this.data.y));
      const rc = world.getRiverCenterX(bankY);
      const side = this.data.x < rc ? -1 : 1;
      spots.push({
        id: 'river_bank',
        name: 'Riverbank',
        type: 'river',
        x: rc + side * 76,
        y: bankY,
        waterTargetX: rc,
        waterTargetY: bankY
      });
    }

    // If lotus pond is available, also register its east bank for variety
    if (lotusPond && !spots.some(s => s.id === 'pond_pastoral_east')) {
      spots.push({
        id: 'pond_pastoral_east',
        name: 'Tranquil Lotus Pond (East Bank)',
        type: 'pond',
        x: lotusPond.waterCenterX + lotusPond.waterRadiusX + 16,
        y: lotusPond.waterCenterY - 4,
        waterTargetX: lotusPond.waterCenterX,
        waterTargetY: lotusPond.waterCenterY
      });
    }

    // Select fishing spot:
    // If agent already selected a fishing spot and is en route, stick with it
    let chosenSpot: FishingSpot | undefined;
    if (this.data.targetBuildingId && spots.some(s => s.id === this.data.targetBuildingId)) {
      chosenSpot = spots.find(s => s.id === this.data.targetBuildingId);
    }

    if (!chosenSpot) {
      // Fishers actively fish in the ponds as well as the river!
      // 65% of fishing trips target the village lotus pond or forest sanctuary pond,
      // 35% target the river pier or riverbanks.
      const pondSpots = spots.filter(s => s.type === 'pond');
      const riverSpots = spots.filter(s => s.type === 'river');

      const pickPond = Math.random() < 0.65;
      const candidatePool = (pickPond && pondSpots.length > 0) ? pondSpots : riverSpots;
      chosenSpot = candidatePool[Math.floor(Math.random() * candidatePool.length)] || spots[0];
      this.data.targetBuildingId = chosenSpot.id;
    }

    const dist = Math.hypot(this.data.x - chosenSpot.x, this.data.y - chosenSpot.y);

    if (dist > 28) {
      this.setDestination(chosenSpot.x, chosenSpot.y, world, 'walking');
      this.data.thought = chosenSpot.type === 'pond'
        ? `Heading down to the ${chosenSpot.name} with my fishing rod to cast for pond fish.`
        : `Heading down to the ${chosenSpot.name} to cast a line into the river.`;
      this.setBubble('fish', 3);
      return `${this.data.name} is walking to ${chosenSpot.name} to fish.`;
    }

    // Arrived at the fishing spot! Face into water and begin fishing
    this.faceTowards(chosenSpot.waterTargetX, chosenSpot.waterTargetY);
    this.data.targetX = undefined;
    this.data.targetY = undefined;
    this.data.waypoints = [];
    this.data.actionState = 'fishing';

    const isSkilled = this.data.role === 'fisher';
    // Realistic fishing patience: catching one fish takes genuine time, never instant!
    // Skilled fisher: 16-20 seconds; untrained settler: 22-28 seconds.
    const catchDuration = isSkilled ? (16.0 + Math.random() * 4.0) : (22.0 + Math.random() * 6.0);
    const count = 1; // Always lands exactly ONE fish per catch!

    this.data.actionTimer = catchDuration + 1.2;
    this.setBubble('fish', 4.5);
    this.data.thought = chosenSpot.type === 'pond'
      ? `Casting line into the ${chosenSpot.name}... watching colorful koi and carp glide past the water lilies, waiting patiently for a bite.`
      : `Casting fishing line into the cold currents of ${chosenSpot.name}... watching the float bob peacefully, waiting patiently for a bite.`;

    const isPond = chosenSpot.type === 'pond';
    const spotName = chosenSpot.name;
    const waterX = chosenSpot.waterTargetX;
    const waterY = chosenSpot.waterTargetY;

    // Small ripple on initial cast
    world.spawnSpecialEffect('sparkle', waterX, waterY, undefined, undefined, 0.4);

    // Stage 2: Nibble & Interest (~50% into fishing duration)
    const nibbleDelay = catchDuration * 0.50;
    this.scheduleAction(nibbleDelay, () => {
      if (this.data.actionState !== 'fishing') return;
      this.setBubble('fish', 3.5);
      world.spawnSpecialEffect('sparkle', waterX + (Math.random() * 8 - 4), waterY + (Math.random() * 6 - 3), undefined, undefined, 0.6);
      this.data.thought = isPond
        ? `The float twitched! A curious pond fish is circling the bait beneath the lily pads... holding steady...`
        : `Gentle tug on the line! A river salmon is testing the bait in the current... holding steady...`;
    });

    // Stage 3: Strike & Hook Bite (~80% into fishing duration)
    const strikeDelay = catchDuration * 0.80;
    this.scheduleAction(strikeDelay, () => {
      if (this.data.actionState !== 'fishing') return;
      this.setBubble('shock', 2.8);
      world.spawnSpecialEffect('sparkle', waterX, waterY, undefined, undefined, 0.9);
      this.data.thought = isPond
        ? `Strike! The float plunged beneath the lotus blossoms! Got a firm bite, reeling in against the pond weeds!`
        : `Strike! The bobber was pulled under by a strong fish! Reeling in firmly against the river currents!`;
    });

    // Stage 4: Landing 1 Single Fish (at catchDuration)
    this.scheduleAction(catchDuration, () => {
      if (this.data.actionState !== 'fishing') return;
      this.data.carriedItem = { type: 'fish', count };
      this.data.actionState = 'carrying';
      this.data.targetBuildingId = undefined; // Reset so next trip can rotate to another pond or river spot!
      const fishKind = isPond ? 'plump freshwater pond carp' : 'fresh river salmon';
      this.addMemory(`Hooked and landed 1 ${fishKind} after patient fishing at ${spotName}`, 35);
      this.data.thought = `Landed 1 fine fresh ${fishKind}! Carrying the fresh catch back to the village storehouse.`;
      this.setBubble('fish', 3.5);
      world.spawnSpecialEffect('sparkle', waterX, waterY, undefined, undefined, 0.8);
    });

    return `${this.data.name} cast a fishing line into ${chosenSpot.name}, waiting patiently for a fish.`;
  }

  /**
   * Cooking:
   * Culinary efficiency, heat management, and nutrition.
   * - Master chef Aria Sol: 3.6s prep timer, rich savory stew.
   * - Untrained cook: 5.2s prep timer, simple campfire stew.
   */
  private workCook(world: World): string | null {
    if (this.data.actionState === 'cooking') return null;

    if (this.data.actionState === 'fetching_water') {
      return `${this.data.name} is filling fresh drinking water at the lotus pond.`;
    }

    // Check if kitchen needs fresh drinking water from the lotus pond
    if ((world.stockpile.water || 0) < 40 || Math.random() < 0.35) {
      const waterRes = this.workFetchDrinkingWater(world);
      if (waterRes !== null) return waterRes;
    }

    const hearth = world.getBuildingById('hearth');
    const cookX = hearth ? hearth.x + 80 : world.campfire.x + 45;
    const cookY = hearth ? hearth.y + 60 : world.campfire.y + 30;
    const lookX = hearth ? hearth.x + hearth.width / 2 : world.campfire.x;
    const lookY = hearth ? hearth.y + hearth.height / 2 : world.campfire.y;
    const dist = Math.hypot(this.data.x - cookX, this.data.y - cookY);

    if (dist > 30) {
      this.setDestination(cookX, cookY, world, 'walking');
      this.data.thought = hearth
        ? 'Heading to the communal hearth to prepare the evening meal.'
        : 'Heading to the campfire to prepare a simple meal.';
      return null;
    }

    this.faceTowards(lookX, lookY);
    this.data.actionState = 'cooking';

    const isExpert = this.data.role === 'cook' && this.data.appearance.gender === 'female';
    const cookDuration = isExpert ? 3.6 : 5.2;

    this.data.actionTimer = cookDuration;
    this.setBubble('food', 3);
    if ((world.stockpile.water || 0) > 0) {
      world.stockpile.water = Math.max(0, (world.stockpile.water || 0) - 1);
    }
    this.data.thought = isExpert
      ? 'Artfully stirring and seasoning a savory vegetable and fish stew in the great copper cauldron.'
      : 'Cooking a humble campfire stew for the settlement.';
    return null;
  }

  /**
   * Hunting:
   * Stalking speed, bow draw tension, aim stability.
   * - Scout hunter Kaelen Stone: 1.8s draw & aim delay, high precision.
   * - Untrained hunter: 2.8s aim delay.
   */
  /**
   * Fetch Drinking Water from the Lotus Pond:
   * The cook or village women walk down the trail to the tranquil lotus pond with a wooden bucket,
   * dip the bucket into the clear water, fill it with sparkling fresh water, and carry it back
   * to the cookhouse / hearth.
   */
  private workFetchDrinkingWater(world: World): string | null {
    if (this.data.actionState === 'fetching_water') {
      return `${this.data.name} is filling fresh drinking water at the lotus pond.`;
    }

    const pond = world.ponds.find(p => p.id === 'pond_pastoral') || world.ponds[0];
    if (!pond) return null;

    // Dry grassy shoreline at the north rim of the pond
    const shoreX = pond.waterCenterX - 25; // ~470
    const shoreY = pond.waterCenterY - pond.waterRadiusY - 14; // ~1372
    const dist = Math.hypot(this.data.x - shoreX, this.data.y - shoreY);

    if (dist > 30) {
      this.setDestination(shoreX, shoreY, world, 'walking');
      this.data.thought = 'Walking down to the lotus pond with my wooden bucket to fetch fresh drinking water.';
      this.setBubble('water', 3);
      return `${this.data.name} is walking to the lotus pond to fetch drinking water.`;
    }

    // Arrived at the pond shore! Clear destination and begin filling drinking water
    this.data.targetX = undefined;
    this.data.targetY = undefined;
    this.data.waypoints = [];
    this.data.actionState = 'fetching_water';
    this.data.actionTimer = 4.2;
    this.data.facing = 'right'; // Bending down and to the right into the pond water
    this.setBubble('water', 4);
    this.data.thought = 'Bending down by the pond, dipping my wooden bucket into the cool, clear water to scoop fresh drinking water.';

    this.scheduleAction(4.2, () => {
      this.data.carriedItem = { type: 'water', count: 10 };
      this.data.actionState = 'carrying';
      this.addMemory('Filled a wooden bucket with fresh, sparkling drinking water from the lotus pond', 35);
      this.data.thought = 'Lifting the heavy bucket of fresh drinking water to carry back to the cookhouse.';
      this.setBubble('water', 3);
    });

    return `${this.data.name} is filling fresh drinking water at the lotus pond.`;
  }

  private workHunter(world: World): string | null {
    if (this.data.actionState === 'hunting') return null;

    if (this.data.equippedWeapon !== 'bow') {
      this.data.equippedWeapon = 'bow';
    }

    // Helper to identify any baby or immature animal that must NOT be hunted
    const isImmatureBaby = (a: WildlifeAnimal): boolean => {
      return !!(
        a.isBaby ||
        (a.growthTimer !== undefined && a.growthTimer > 0) ||
        (a.type === 'rabbit' && a.variant === 1) ||
        (a.motherId !== undefined)
      );
    };

    // Hunters track and hunt wild game: mature adults ONLY. Young baby animals are protected until maturity.
    const huntableAnimals = world.animals.filter(
      a => !a.isDead && !isImmatureBaby(a) && (a.type === 'rabbit' || a.type === 'sheep' || a.type === 'chicken')
    );

    if (huntableAnimals.length === 0) {
      this.data.thought = 'Prowling forest trails with my bow. Sparing young baby animals until they reach full maturity.';
      if (this.data.actionState !== 'walking') {
        const scoutX = 1860 + Math.random() * 450;
        const scoutY = 1180 + Math.random() * 380;
        this.setDestination(scoutX, scoutY, world, 'walking');
      }
      return null;
    }

    // 1. If currently tracking a wounded prey, stick to that target!
    let targetAnimal: WildlifeAnimal | undefined;
    if (this.data.targetResourceId) {
      const existing = huntableAnimals.find(a => a.id === this.data.targetResourceId);
      if (existing && !existing.isDead) {
        targetAnimal = existing;
      }
    }

    if (!targetAnimal) {
      // Prioritize wounded animals first, then nearby rabbits and game
      const sortedAnimals = [...huntableAnimals].sort((a, b) => {
        const isWoundedA = (a.health !== undefined && a.maxHealth !== undefined && a.health < a.maxHealth) ? -800 : 0;
        const isWoundedB = (b.health !== undefined && b.maxHealth !== undefined && b.health < b.maxHealth) ? -800 : 0;

        const distA = Math.hypot(a.x - this.data.x, a.y - this.data.y);
        const distB = Math.hypot(b.x - this.data.x, b.y - this.data.y);
        const priorityA = (a.type === 'rabbit' && distA < 450) ? distA * 0.68 : distA;
        const priorityB = (b.type === 'rabbit' && distB < 450) ? distB * 0.68 : distB;
        return (isWoundedA + priorityA) - (isWoundedB + priorityB);
      });
      targetAnimal = sortedAnimals[0];
    }

    if (!targetAnimal || isImmatureBaby(targetAnimal)) {
      this.data.actionState = 'idle';
      this.data.thought = 'Prowling forest trails with my bow. Sparing young baby animals until they reach full maturity.';
      return null;
    }

    const dist = Math.hypot(this.data.x - targetAnimal.x, this.data.y - targetAnimal.y);
    const isWounded = targetAnimal.health !== undefined && targetAnimal.maxHealth !== undefined && targetAnimal.health < targetAnimal.maxHealth;

    // Stalking range: if further than 78px, pursue through brush
    if (dist > 78) {
      this.setDestination(targetAnimal.x, targetAnimal.y, world, 'walking');
      this.data.thought = isWounded
        ? `Pursuing the wounded ${targetAnimal.type} (${targetAnimal.health}/${targetAnimal.maxHealth} HP) through the brush with notched arrow.`
        : targetAnimal.type === 'rabbit'
        ? 'Quietly stalking a quick wild rabbit through the grass with notched arrow.'
        : `Stalking a wild ${targetAnimal.type} through the brush with notched arrow.`;
      return null;
    }

    // Within bow range! Take aim and shoot!
    this.data.targetX = undefined;
    this.data.targetY = undefined;
    this.data.waypoints = [];
    this.data.targetResourceId = targetAnimal.id;
    this.faceTowards(targetAnimal.x, targetAnimal.y);
    this.data.actionState = 'hunting';

    const isScout = this.data.role === 'hunter' && this.data.appearance.gender === 'male';
    const aimTime = isScout ? 1.5 : 2.4;

    this.data.actionTimer = aimTime;
    this.setBubble('bow', 2.5);
    this.data.thought = isWounded
      ? `Drawing bowstring taut to deliver another shot to the wounded ${targetAnimal.type}...`
      : targetAnimal.type === 'rabbit'
      ? 'Holding breath, drawing bowstring taut to target the swift wild rabbit...'
      : `Holding breath, taking steady aim at the wild ${targetAnimal.type}...`;

    return isWounded
      ? `🏹 ${this.data.name} notched another arrow and took aim at the wounded ${targetAnimal.type}.`
      : `🏹 ${this.data.name} drew back their bowstring and took aim at a wild ${targetAnimal.type}.`;
  }

  private workPatrol(world: World): string | null {
    if (this.data.actionState === 'walking') return null;

    const patrolSpots = [
      { x: 1650, y: 530 }, // North bridge
      { x: 1650, y: 1230 }, // South bridge
      { x: 400, y: 300 }, // Lumber camp
      { x: 1150, y: 850 }, // Central campfire
      { x: 1950, y: 550 } // East bank
    ];
    const spot = patrolSpots[Math.floor(Math.random() * patrolSpots.length)];
    this.setDestination(spot.x, spot.y, world, 'walking');
    this.data.thought = 'Patrolling the settlement borders to ensure peace.';
    return null;
  }

  private performCampfireSocialTask(world: World, allAgents: Agent[]): string | null {
    const cf = world.campfire;
    const dist = Math.hypot(this.data.x - cf.x, this.data.y - cf.y);

    if (dist > 85) {
      const angle = Math.random() * Math.PI * 2;
      this.setDestination(cf.x + Math.cos(angle) * 55, cf.y + Math.sin(angle) * 55, world, 'walking');
      this.data.thought = 'Evening has arrived. Heading to the campfire to relax and talk.';
      return null;
    }

    this.data.actionState = 'sitting';
    this.faceTowards(cf.x, cf.y);
    this.data.thought = 'Enjoying the crackling warmth of the evening campfire with my family and friends.';
    this.data.needs.fun = Math.min(100, this.data.needs.fun + 5);
    this.data.needs.social = Math.min(100, this.data.needs.social + 6);

    const companion = allAgents.find(a => 
      a.data.id !== this.data.id && 
      (a.data.actionState === 'sitting' || a.data.actionState === 'talking' || a.data.actionState === 'idle') &&
      !a.data.activeDialog &&
      Math.hypot(a.data.x - this.data.x, a.data.y - this.data.y) < 80
    );

    if (companion && this.lastSocialCooldown <= 0) {
      const rel = this.getOrCreateRelationship(companion.data);

      if (rel.attraction > 50 && this.data.traits.libido > 0.3 && Math.random() < 0.35) {
        return this.triggerRomance(companion);
      } else {
        return this.startConversationWith(companion, world, 19 * 60);
      }
    }

    return null;
  }

  public triggerConflict(other: Agent): string {
    if (other === this) return '';
    // Never stack brawls: a settler can only be in one fight at a time.
    if (this.data.actionState === 'fighting' || other.data.actionState === 'fighting') {
      return '';
    }

    const myRel = this.getOrCreateRelationship(other.data);
    const otherRel = other.getOrCreateRelationship(this.data);

    this.faceTowards(other.data.x, other.data.y);
    other.faceTowards(this.data.x, this.data.y);

    this.data.actionState = 'fighting';
    other.data.actionState = 'fighting';
    this.setBubble('rage', 4);
    other.setBubble('fist', 4);

    this.data.thought = `I'm going to take down ${other.data.name}!`;
    other.data.thought = `Stand down, ${this.data.name}!`;

    this.scheduleAction(2, () => {
      // The fight may have been interrupted (unconsciousness, possession, or
      // a god power) before the blow landed.
      if (this.data.actionState !== 'fighting' && this.data.actionState !== 'unconscious') {
        return;
      }

      const myDmg = Math.floor(15 + Math.random() * 20);
      const otherDmg = Math.floor(15 + Math.random() * 20);

      other.data.needs.health = Math.max(0, other.data.needs.health - myDmg);
      this.data.needs.health = Math.max(0, this.data.needs.health - otherDmg);

      myRel.affinity -= 30;
      otherRel.affinity -= 30;

      this.addMemory(`Violent brawl with ${other.data.name}`, -40, other.data.id);
      other.addMemory(`Assaulted by ${this.data.name}`, -40, this.data.id);

      if (other.data.needs.health <= 0) {
        other.data.actionState = 'unconscious';
        other.setBubble('blood', 5);
      } else if (other.data.actionState === 'fighting') {
        other.data.actionState = 'idle';
      }

      if (this.data.needs.health <= 0) {
        this.data.actionState = 'unconscious';
        this.setBubble('blood', 5);
      } else if (this.data.actionState === 'fighting') {
        this.data.actionState = 'idle';
      }
    });

    return `⚠️ Violent fight broke out between ${this.data.name} and ${other.data.name}!`;
  }

  public triggerRomance(other: Agent): string {
    const myRel = this.getOrCreateRelationship(other.data);
    const otherRel = other.getOrCreateRelationship(this.data);

    this.faceTowards(other.data.x, other.data.y);
    other.faceTowards(this.data.x, this.data.y);

    this.data.actionState = 'flirting';
    this.data.actionTimer = 4;
    this.setBubble('heart', 4);

    // If already married to each other: warm reaffirmation of marital devotion
    if (this.data.spouseId === other.data.id) {
      myRel.affinity = Math.min(100, myRel.affinity + 8);
      myRel.attraction = Math.min(100, myRel.attraction + 8);
      otherRel.affinity = Math.min(100, otherRel.affinity + 8);
      otherRel.attraction = Math.min(100, otherRel.attraction + 8);
      this.data.thought = `Holding my beloved spouse ${other.data.name} close to my heart...`;
      other.data.thought = `Finding peaceful warmth in ${this.data.name}'s loving arms...`;
      other.setBubble('kiss', 4);
      return `❤️ MARITAL WARMTH: ${this.data.name} and ${other.data.name} embraced warmly, reaffirming their marriage vows.`;
    }

    // Check reciprocation based on attraction and compatibility
    const reciprocates = otherRel.attraction > 25 || other.data.traits.agreeableness > -0.1;

    if (!reciprocates) {
      other.setBubble('broken_heart', 3);
      this.setBubble('broken_heart', 3);
      myRel.affinity -= 8;
      this.data.thought = `Felt an awkward pang of romantic rejection from ${other.data.name}.`;
      return `💔 ${other.data.name} gently turned away from ${this.data.name}'s romantic advance.`;
    }

    // Reciprocal affection
    other.data.actionState = 'flirting';
    other.data.actionTimer = 4;
    other.setBubble('kiss', 4);

    myRel.affinity = Math.min(100, myRel.affinity + 15);
    myRel.attraction = Math.min(100, myRel.attraction + 15);
    otherRel.affinity = Math.min(100, otherRel.affinity + 15);
    otherRel.attraction = Math.min(100, otherRel.attraction + 15);

    this.data.needs.social = 100;
    other.data.needs.social = 100;

    // Progression Stage 5: Marriage or Remarriage (From Madly in Love)
    const isReadyForMarriage = (myRel.status === 'madly_in_love' || otherRel.status === 'madly_in_love' || (myRel.affinity >= 80 && myRel.attraction >= 80));
    const neitherHasSpouse = !this.data.spouseId && !other.data.spouseId;

    if (isReadyForMarriage && neitherHasSpouse) {
      myRel.status = 'married';
      otherRel.status = 'married';
      this.data.spouseId = other.data.id;
      other.data.spouseId = this.data.id;
      this.data.maritalStatus = 'married';
      other.data.maritalStatus = 'married';

      const isRemarriage = (this.data.divorceCount || 0) > 0 || (other.data.divorceCount || 0) > 0 || (this.data.marriageCount || 0) > 0 || (other.data.marriageCount || 0) > 0;

      if (isRemarriage && this.sim) {
        this.sim.processRemarriage(this, other);
        return `💍 REMARRIAGE: ${this.data.name} and ${other.data.name} found love again, wed, and united their household into a blended family!`;
      } else if (this.sim) {
        this.sim.establishCoupleHomestead(this, other);
      }

      // Conception chance for eligible married female
      const female = this.data.appearance.gender === 'female' ? this : (other.data.appearance.gender === 'female' ? other : null);
      const male = female === this ? other : this;
      if (female && male && female.data.age >= 18 && female.data.age <= 44 && !female.data.isPregnant) {
        const residents = this.sim ? this.sim.getHouseResidents(female.data.homeCabinId) : [];
        if (residents.length < 5) {
          female.data.isPregnant = true;
          female.data.appearance.isPregnant = true;
          female.data.pregnancyProgress = 0;
          female.addMemory(`Conceived a child with my spouse ${male.data.name} in our new home.`, 85, male.data.id);
          male.addMemory(`Conceived a child with my spouse ${female.data.name} in our new home.`, 85, female.data.id);
        }
      }

      this.addMemory(`Married ${other.data.name}! We established our own separate family home.`, 100, other.data.id);
      other.addMemory(`Married ${this.data.name}! We established our own separate family home.`, 100, this.data.id);
      return `💍 MARRIAGE: ${this.data.name} and ${other.data.name} fell in love, married, and established their own separate homestead!`;
    }

    // Progression Stage 4: Madly in Love
    if ((myRel.status === 'in_love' || otherRel.status === 'in_love') && myRel.affinity >= 75 && myRel.attraction >= 75) {
      myRel.status = 'madly_in_love';
      otherRel.status = 'madly_in_love';
      this.data.maritalStatus = 'madly_in_love';
      other.data.maritalStatus = 'madly_in_love';
      myRel.trust = Math.min(100, myRel.trust + 20);
      otherRel.trust = Math.min(100, otherRel.trust + 20);
      this.data.thought = `I am completely and madly in love with ${other.data.name}! My soul is theirs.`;
      other.data.thought = `My heart races with starry-eyed passion for ${this.data.name}!`;
      this.addMemory(`Fell madly in love with ${other.data.name} — ready to spend forever together.`, 85, other.data.id);
      other.addMemory(`Fell madly in love with ${this.data.name} — ready to spend forever together.`, 85, this.data.id);
      return `🔥 MADLY IN LOVE: Passion reached its heights! ${this.data.name} and ${other.data.name} are head-over-heels, madly in love!`;
    }

    // Progression Stage 3: Love (In Love)
    if ((myRel.status === 'dating' || otherRel.status === 'dating') && myRel.affinity >= 60 && myRel.attraction >= 60) {
      myRel.status = 'in_love';
      otherRel.status = 'in_love';
      this.data.maritalStatus = 'in_love';
      other.data.maritalStatus = 'in_love';
      myRel.trust = Math.min(100, myRel.trust + 15);
      otherRel.trust = Math.min(100, otherRel.trust + 15);
      this.data.thought = `I have truly fallen in love with ${other.data.name}...`;
      other.data.thought = `My feelings for ${this.data.name} have deepened into real, genuine love.`;
      this.addMemory(`Fell in love with ${other.data.name}.`, 70, other.data.id);
      other.addMemory(`Fell in love with ${this.data.name}.`, 70, this.data.id);
      return `❤️ TRUE LOVE: Courting blossomed into devotion! ${this.data.name} and ${other.data.name} have fallen in love!`;
    }

    // Progression Stage 2: Dating (Official Courtship)
    if (myRel.affinity >= 45 && myRel.attraction >= 45) {
      myRel.status = 'dating';
      otherRel.status = 'dating';
      this.data.maritalStatus = 'dating';
      other.data.maritalStatus = 'dating';
      this.data.thought = `So excited to be officially dating ${other.data.name}!`;
      other.data.thought = `Walking hand-in-hand with ${this.data.name} as a sweet couple.`;
      this.addMemory(`Started officially dating ${other.data.name}.`, 50, other.data.id);
      other.addMemory(`Started officially dating ${this.data.name}.`, 50, this.data.id);
      return `💖 DATING: Romantic chemistry bloomed! ${this.data.name} and ${other.data.name} are now officially dating!`;
    }

    // Progression Stage 1: Flirt / Spark
    myRel.status = 'flirting';
    otherRel.status = 'flirting';
    this.data.thought = `Flirting playfully with ${other.data.name}... feeling a wonderful spark!`;
    other.data.thought = `Blushing and smiling back at ${this.data.name}...`;
    return `😘 FLIRT: ${this.data.name} and ${other.data.name} shared sweet compliments, flirty glances, and shy smiles.`;
  }

  public triggerFriendlyChat(other: Agent, world?: World, gameMinutes?: number): string {
    if (world && gameMinutes !== undefined) {
      return this.startConversationWith(other, world, gameMinutes);
    }
    const exchange = DialogSystem.generateExchange(this.data, other.data, 12, 'sunny');
    this.faceTowards(other.data.x, other.data.y);
    other.faceTowards(this.data.x, this.data.y);
    this.data.actionState = 'talking';
    other.data.actionState = 'talking';
    this.data.actionTimer = 4.0;
    other.data.actionTimer = 4.0;
    this.setBubble('talk', 3.5, exchange.line1, this.data.name.split(' ')[0]);
    other.setBubble('talk', 3.5, exchange.line2, other.data.name.split(' ')[0]);
    this.data.thought = `Talking with ${other.data.name.split(' ')[0]}: "${exchange.line1}"`;
    other.data.thought = `Replying to ${this.data.name.split(' ')[0]}: "${exchange.line2}"`;
    return `💬 ${this.data.name}: "${exchange.line1}"`;
  }

  public checkSocialEncounter(world: World, allAgents: Agent[], gameMinutes: number): string | null {
    if (this.data.isPossessed) return null;
    if (
      this.data.actionState === 'sleeping' ||
      this.data.actionState === 'unconscious' ||
      this.data.actionState === 'fighting' ||
      this.data.actionState === 'fleeing'
    ) {
      return null;
    }
    if (this.lastSocialCooldown > 0) return null;

    const mySide = world.getRiverSide(this.data.x, this.data.y);

    const candidate = allAgents.find(other => {
      if (other.data.id === this.data.id) return false;
      if (other.data.isPossessed) return false;
      const oState = other.data.actionState;
      if (
        oState === 'sleeping' ||
        oState === 'unconscious' ||
        oState === 'fighting' ||
        oState === 'fleeing' ||
        oState === 'talking'
      ) {
        return false;
      }
      if (other.data.activeDialog) return false;

      const lastChat = this.recentChatPartners[other.data.id];
      if (lastChat && Date.now() - lastChat < 16000) return false;

      const dist = Math.hypot(this.data.x - other.data.x, this.data.y - other.data.y);
      if (dist > 65) return false;

      const otherSide = world.getRiverSide(other.data.x, other.data.y);
      if (mySide !== otherSide && mySide !== 'bridge' && otherSide !== 'bridge') return false;

      return true;
    });

    if (!candidate) return null;

    // Interaction probability
    const isBothSitting = this.data.actionState === 'sitting' && candidate.data.actionState === 'sitting';
    const isLowSocial = this.data.needs.social < 65 || candidate.data.needs.social < 65;
    const triggerChance = isBothSitting ? 0.75 : (isLowSocial ? 0.65 : 0.45);

    if (Math.random() < triggerChance) {
      return this.startConversationWith(candidate, world, gameMinutes);
    } else {
      this.lastSocialCooldown = 2.0;
    }

    return null;
  }

  public startConversationWith(other: Agent, world: World, gameMinutes: number): string {
    const defaultExchange = DialogSystem.generateExchange(this.data, other.data, Math.floor(gameMinutes / 60), world.weather);

    this.lastSocialCooldown = 15.0;
    other.lastSocialCooldown = 15.0;
    this.recentChatPartners[other.data.id] = Date.now();
    other.recentChatPartners[this.data.id] = Date.now();

    // Clear any pending delayed actions and movement targets so states don't get clobbered mid-chat!
    this.scheduledActions = [];
    other.scheduledActions = [];
    this.data.targetX = undefined;
    this.data.targetY = undefined;
    other.data.targetX = undefined;
    other.data.targetY = undefined;

    // Face each other directly
    this.faceTowards(other.data.x, other.data.y);
    other.faceTowards(this.data.x, this.data.y);

    this.data.actionState = 'talking';
    other.data.actionState = 'talking';
    this.data.actionTimer = 6.8;
    other.data.actionTimer = 6.8;

    const phaseDuration = 3.2;
    const isAi = GeminiService.getInstance().isAvailable();

    // Phase 1: Initiator speaks Line 1, other listens
    this.data.activeDialog = {
      partnerId: other.data.id,
      partnerName: other.data.name,
      line: defaultExchange.line1,
      isSpeaker: true,
      phase: 1,
      timer: phaseDuration,
      fullExchange: {
        line1: defaultExchange.line1,
        line2: defaultExchange.line2,
        initiatorName: this.data.name,
        replierName: other.data.name,
        topic: defaultExchange.topic,
        bubble1: defaultExchange.bubble1,
        bubble2: defaultExchange.bubble2,
        isAiGenerated: false
      }
    };

    other.data.activeDialog = {
      partnerId: this.data.id,
      partnerName: this.data.name,
      line: '',
      isSpeaker: false,
      phase: 1,
      timer: phaseDuration,
      fullExchange: {
        line1: defaultExchange.line1,
        line2: defaultExchange.line2,
        initiatorName: this.data.name,
        replierName: other.data.name,
        topic: defaultExchange.topic,
        bubble1: defaultExchange.bubble1,
        bubble2: defaultExchange.bubble2,
        isAiGenerated: false
      }
    };

    // Start speaking line 1 immediately without any freezing, delays, or blank thoughts
    this.setBubble('talk', phaseDuration, defaultExchange.line1, this.data.name.split(' ')[0]);
    this.data.thought = `Talking with ${other.data.name.split(' ')[0]}: "${defaultExchange.line1}"`;
    other.data.thought = `Listening to ${this.data.name.split(' ')[0]}: "${defaultExchange.line1}"`;

    // In the background, if Gemini is available, generate context-aware memory reply for line 2
    if (isAi) {
      DialogSystem.generateExchangeAsync(this.data, other.data, Math.floor(gameMinutes / 60), world.weather)
        .then((aiExchange) => {
          if (!this.data.activeDialog || this.data.activeDialog.partnerId !== other.data.id) return;
          if (aiExchange && aiExchange.isAiGenerated) {
            this.data.activeDialog.fullExchange = {
              line1: defaultExchange.line1,
              line2: aiExchange.line2,
              initiatorName: this.data.name,
              replierName: other.data.name,
              topic: aiExchange.topic,
              bubble1: aiExchange.bubble1,
              bubble2: aiExchange.bubble2,
              isAiGenerated: true,
              memoriesUsed: aiExchange.memoriesUsed
            };

            if (other.data.activeDialog && other.data.activeDialog.partnerId === this.data.id) {
              other.data.activeDialog.fullExchange = this.data.activeDialog.fullExchange;
            }
          }
        })
        .catch(() => {
          // Fallback line is already active
        });
    }

    return `💬 ${this.data.name}: "${defaultExchange.line1}"`;
  }

  private updateActiveDialog(delta: number, allAgents: Agent[]): string | null {
    if (!this.data.activeDialog) return null;

    const partnerId = this.data.activeDialog.partnerId;
    const partner = allAgents.find(a => a.data.id === partnerId);

    // Failsafe 1: If partner was interrupted, dead, or no longer talking to us, end dialogue immediately!
    if (!partner || partner.data.isDead || partner.data.actionState !== 'talking' || !partner.data.activeDialog || partner.data.activeDialog.partnerId !== this.data.id) {
      this.finishConversation(partner, allAgents);
      return null;
    }

    // Keep facing each other throughout the conversation
    this.faceTowards(partner.data.x, partner.data.y);

    // Only the current speaker ticks down the main timer to keep the turn synchronous
    if (!this.data.activeDialog.isSpeaker) {
      // Failsafe 2: Listener watchdog timer in case speaker gets stalled
      this.data.activeDialog.timer -= delta;
      if (this.data.activeDialog.timer <= -1.5) {
        this.finishConversation(partner, allAgents);
      }
      return null;
    }

    this.data.activeDialog.timer -= delta;

    if (this.data.activeDialog.phase === 1 && this.data.activeDialog.timer <= 0) {
      // Transition from Phase 1 to Phase 2: Replier speaks line 2!
      if (partner && partner.data.activeDialog) {
        const exchange = this.data.activeDialog.fullExchange;
        const phaseDuration = 3.2;

        this.data.activeDialog = {
          ...this.data.activeDialog,
          line: '',
          isSpeaker: false,
          phase: 2,
          timer: phaseDuration
        };

        partner.data.activeDialog = {
          ...partner.data.activeDialog,
          line: exchange.line2,
          isSpeaker: true,
          phase: 2,
          timer: phaseDuration
        };

        const bubbleType = exchange.bubble2 || 'talk';
        const prefix = exchange.isAiGenerated ? '✨ ' : '';
        partner.setBubble(bubbleType, phaseDuration, prefix + exchange.line2, partner.data.name.split(' ')[0]);

        partner.data.thought = `Replying to ${this.data.name.split(' ')[0]}: "${exchange.line2}"`;
        this.data.thought = `Listening to ${partner.data.name.split(' ')[0]}: "${exchange.line2}"`;

        const aiTag = exchange.isAiGenerated ? ' [AI]' : '';
        return `💬${aiTag} ${partner.data.name}: "${exchange.line2}"`;
      } else {
        this.finishConversation(partner, allAgents);
        return null;
      }
    }

    if (this.data.activeDialog.phase === 2 && this.data.activeDialog.timer <= 0) {
      // Both lines complete! Wrap up conversation cleanly for both participants
      this.finishConversation(partner, allAgents);
      return null;
    }

    return null;
  }

  public finishConversation(partner?: Agent, allAgents?: Agent[]): void {
    if (!partner && this.data.activeDialog && allAgents) {
      partner = allAgents.find(a => a.data.id === this.data.activeDialog!.partnerId);
    }

    if (partner) {
      const fullEx = this.data.activeDialog?.fullExchange;
      partner.data.activeDialog = undefined;
      if (!partner.data.isPossessed) {
        partner.data.actionState = 'idle';
        partner.data.actionTimer = 0.5;
      }

      const myRel = this.getOrCreateRelationship(partner.data);
      const otherRel = partner.getOrCreateRelationship(this.data);

      myRel.affinity = Math.min(100, myRel.affinity + 10);
      otherRel.affinity = Math.min(100, otherRel.affinity + 10);

      this.data.needs.social = Math.min(100, this.data.needs.social + 35);
      partner.data.needs.social = Math.min(100, partner.data.needs.social + 35);

      this.data.needs.fun = Math.min(100, this.data.needs.fun + 15);
      partner.data.needs.fun = Math.min(100, partner.data.needs.fun + 15);

      // Save person-targeted memories from this exact exchange so they can be remembered next time!
      if (fullEx) {
        const memPrefix = fullEx.isAiGenerated ? '🧠 ' : '';
        const summaryA = fullEx.topic 
          ? `Discussed ${fullEx.topic} with ${partner.data.name}: "${fullEx.line1.slice(0, 45)}"`
          : `Enjoyed a conversation with ${partner.data.name}`;
        const summaryB = fullEx.topic
          ? `Replied to ${this.data.name} about ${fullEx.topic}: "${fullEx.line2.slice(0, 45)}"`
          : `Enjoyed a conversation with ${this.data.name}`;

        const isNegative = fullEx.bubble1 === 'rage' || fullEx.bubble1 === 'broken_heart' || fullEx.bubble1 === 'fist';
        const emotionalWeight = isNegative ? -25 : 20;

        this.addMemory(`${memPrefix}${summaryA}`, emotionalWeight, partner.data.id);
        partner.addMemory(`${memPrefix}${summaryB}`, emotionalWeight, this.data.id);
      } else {
        this.addMemory(`Enjoyed a wonderful conversation with ${partner.data.name}`, 20, partner.data.id);
        partner.addMemory(`Enjoyed a wonderful conversation with ${this.data.name}`, 20, this.data.id);
      }

      this.data.thought = `Just enjoyed a conversation with ${partner.data.name.split(' ')[0]}.`;
      partner.data.thought = `Just enjoyed a conversation with ${this.data.name.split(' ')[0]}.`;
    }

    this.data.activeDialog = undefined;
    if (!this.data.isPossessed) {
      this.data.actionState = 'idle';
      this.data.actionTimer = 0.5;
    }
  }
}
