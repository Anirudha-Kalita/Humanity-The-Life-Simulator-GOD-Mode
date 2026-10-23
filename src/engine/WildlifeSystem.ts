import type { WildlifeAnimal, AnimalType, DramaEvent } from '../types/simulation';
import type { World } from './World';
import type { Agent } from './Agent';

const SANCTUARY = {
  minX: 1720,
  maxX: 2720,
  minY: 1220,
  maxY: 1740
};

const VILLAGE_BOUNDS = {
  minX: 340,
  maxX: 1620,
  minY: 220,
  maxY: 1320
};

/**
 * Real-world to in-game reproduction timing constants.
 *
 * User specification:
 * "The new baby of animal should happen slowly, as per real life but half time,
 *  if in real life after 1 year then in game after 10 days, etc. check in web for real time value and implement accordingly"
 *
 * Biological conversion baseline:
 * 1 Real-Life Year (365 days) = 10 In-Game Days = 14,400 game minutes.
 * 1 In-Game Day = 1,440 game minutes (24 real minutes at 1x speed, 4.8 min at 5x speed).
 * 1 Real-Life Day = 14,400 / 365 ≈ 39.452 game minutes.
 */
export const RL_YEAR_IN_GAME_DAYS = 10;
export const GAME_MINUTES_PER_DAY = 1440;
export const RL_DAY_IN_GAME_MINUTES = (RL_YEAR_IN_GAME_DAYS * GAME_MINUTES_PER_DAY) / 365; // ~39.452 min

export interface SpeciesReproductionProfile {
  name: string;
  babyName: string;
  babyPluralName: string;
  // Real-world biological durations (in days)
  realGestationDays: number;
  realMaturityDays: number;
  realBreedingIntervalDays: number;
  realWildSpawnDays: number;
  // Converted in-game minutes
  gestationMinutes: number;
  maturityMinutes: number;
  breedCooldownMinutes: number;
  wildSpawnMinutes: number;
  // Combat & Health
  maxHealth: number;
  // Visual scaling
  initialBabyScale: number;
  adultScale: number;
}

export const REPRODUCTION_PROFILES: Record<AnimalType, SpeciesReproductionProfile> = {
  // Rabbit: ~31 days gestation, ~105 days to adult maturity, ~48 days breeding interval
  rabbit: {
    name: 'rabbit',
    babyName: 'baby bunny',
    babyPluralName: 'baby bunnies',
    realGestationDays: 31,
    realMaturityDays: 105,
    realBreedingIntervalDays: 48,
    realWildSpawnDays: 45,
    gestationMinutes: Math.round(31 * RL_DAY_IN_GAME_MINUTES), // ~1,223 min (~0.85 game days = 20.4 game hours)
    maturityMinutes: Math.round(105 * RL_DAY_IN_GAME_MINUTES), // ~4,142 min (~2.88 game days = 69.1 game hours)
    breedCooldownMinutes: Math.round((48 - 31) * RL_DAY_IN_GAME_MINUTES), // ~671 min (~0.47 game days)
    wildSpawnMinutes: Math.round(45 * RL_DAY_IN_GAME_MINUTES), // ~1,775 min (~1.23 game days)
    maxHealth: 26, // Takes 2-3 hunter arrows to fell; never dies in one shot
    initialBabyScale: 0.62,
    adultScale: 0.95
  },
  // Chicken: ~21 days egg incubation, ~135 days to adult point of lay, ~45 days clutch interval
  chicken: {
    name: 'chicken',
    babyName: 'fluffy chick',
    babyPluralName: 'fluffy chicks',
    realGestationDays: 21,
    realMaturityDays: 135,
    realBreedingIntervalDays: 45,
    realWildSpawnDays: 60,
    gestationMinutes: Math.round(21 * RL_DAY_IN_GAME_MINUTES), // ~828 min (~0.58 game days = 13.8 game hours)
    maturityMinutes: Math.round(135 * RL_DAY_IN_GAME_MINUTES), // ~5,326 min (~3.70 game days)
    breedCooldownMinutes: Math.round((45 - 21) * RL_DAY_IN_GAME_MINUTES), // ~947 min (~0.66 game days)
    wildSpawnMinutes: Math.round(60 * RL_DAY_IN_GAME_MINUTES), // ~2,367 min (~1.64 game days)
    maxHealth: 22, // Takes 2-3 hunter arrows to fell; never dies in one shot
    initialBabyScale: 0.52,
    adultScale: 0.90
  },
  // Dog: ~62 days gestation, ~240 days to adult maturity, ~180 days heat cycle
  dog: {
    name: 'dog',
    babyName: 'playful puppy',
    babyPluralName: 'playful puppies',
    realGestationDays: 62,
    realMaturityDays: 240,
    realBreedingIntervalDays: 180,
    realWildSpawnDays: 180,
    gestationMinutes: Math.round(62 * RL_DAY_IN_GAME_MINUTES), // ~2,446 min (~1.70 game days)
    maturityMinutes: Math.round(240 * RL_DAY_IN_GAME_MINUTES), // ~9,468 min (~6.58 game days)
    breedCooldownMinutes: Math.round((180 - 62) * RL_DAY_IN_GAME_MINUTES), // ~4,655 min (~3.23 game days)
    wildSpawnMinutes: Math.round(180 * RL_DAY_IN_GAME_MINUTES), // ~7,101 min (~4.93 game days)
    maxHealth: 38, // Takes 3-4 arrows
    initialBabyScale: 0.58,
    adultScale: 0.92
  },
  // Sheep: ~147 days gestation, ~210 days to adult maturity, ~365 days annual lambing cycle
  sheep: {
    name: 'sheep',
    babyName: 'gentle lamb',
    babyPluralName: 'gentle lambs',
    realGestationDays: 147,
    realMaturityDays: 210,
    realBreedingIntervalDays: 365,
    realWildSpawnDays: 210,
    gestationMinutes: Math.round(147 * RL_DAY_IN_GAME_MINUTES), // ~5,800 min (~4.03 game days)
    maturityMinutes: Math.round(210 * RL_DAY_IN_GAME_MINUTES), // ~8,285 min (~5.75 game days)
    breedCooldownMinutes: Math.round((365 - 147) * RL_DAY_IN_GAME_MINUTES), // ~8,600 min (~5.97 game days)
    wildSpawnMinutes: Math.round(210 * RL_DAY_IN_GAME_MINUTES), // ~8,285 min (~5.75 game days)
    maxHealth: 48, // Takes 3-4 hunter arrows to fell; never dies in one shot
    initialBabyScale: 0.60,
    adultScale: 0.95
  },
  // Cow: ~283 days gestation, ~380 days to adult maturity, ~365 days annual calving cycle (1 year RL = 10 game days)
  cow: {
    name: 'cow',
    babyName: 'newborn calf',
    babyPluralName: 'newborn calves',
    realGestationDays: 283,
    realMaturityDays: 380,
    realBreedingIntervalDays: 365,
    realWildSpawnDays: 365,
    gestationMinutes: Math.round(283 * RL_DAY_IN_GAME_MINUTES), // ~11,165 min (~7.75 game days)
    maturityMinutes: Math.round(380 * RL_DAY_IN_GAME_MINUTES), // ~14,992 min (~10.41 game days)
    breedCooldownMinutes: Math.round((365 - 283) * RL_DAY_IN_GAME_MINUTES), // ~3,235 min (~2.25 game days -> Total calving cycle = 10 days!)
    wildSpawnMinutes: Math.round(365 * RL_DAY_IN_GAME_MINUTES), // ~14,400 min (exactly 10 game days!)
    maxHealth: 85, // Takes 5-6 arrows to fell
    initialBabyScale: 0.68,
    adultScale: 1.05
  }
};

export class WildlifeSystem {
  public animals: WildlifeAnimal[] = [];
  public pendingEvents: { message: string; category: DramaEvent['category'] }[] = [];
  private wildBirthTimer = 720.0; // Checks every 0.5 in-game days

  constructor(world: World) {
    this.initWildlife(world);
  }

  public initWildlife(world: World): void {
    this.animals = [];

    // 1. Chickens scratching through the South-East Forest Meadow
    for (let i = 0; i < 5; i++) {
      const spot = this.landSpot(world, 2280 + Math.random() * 360, 1360 + Math.random() * 320, 12);
      this.animals.push({
        id: `animal_chicken_${i}`,
        type: 'chicken',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        state: 'grazing',
        stateTimer: 2 + Math.random() * 4,
        animTimer: Math.random() * 10,
        speed: 55,
        variant: i % 3,
        scale: 0.9 + Math.random() * 0.25,
        health: REPRODUCTION_PROFILES.chicken.maxHealth,
        maxHealth: REPRODUCTION_PROFILES.chicken.maxHealth,
        breedCooldown: Math.random() * REPRODUCTION_PROFILES.chicken.breedCooldownMinutes
      });
    }

    // 2. Sheep grazing along the forest edge and riverbank
    for (let i = 0; i < 4; i++) {
      const nearBank = i === 0;
      const spot = this.landSpot(
        world,
        nearBank ? 1815 + Math.random() * 35 : 1900 + Math.random() * 520,
        1320 + Math.random() * 320,
        14
      );
      this.animals.push({
        id: `animal_sheep_${i}`,
        type: 'sheep',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        state: nearBank ? 'drinking' : 'grazing',
        stateTimer: 3 + Math.random() * 5,
        animTimer: Math.random() * 10,
        speed: 42,
        variant: i,
        scale: i === 2 ? 0.78 : 0.95 + Math.random() * 0.15,
        health: REPRODUCTION_PROFILES.sheep.maxHealth,
        maxHealth: REPRODUCTION_PROFILES.sheep.maxHealth,
        breedCooldown: Math.random() * REPRODUCTION_PROFILES.sheep.breedCooldownMinutes
      });
    }

    // 3. Cows in the pastoral clearing
    for (let i = 0; i < 3; i++) {
      const spot = this.landSpot(
        world,
        2020 + i * 110 + (Math.random() * 40 - 20),
        1420 + (i % 2) * 120 + (Math.random() * 30 - 15),
        16
      );
      this.animals.push({
        id: `animal_cow_${i}`,
        type: 'cow',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        state: 'chewing',
        stateTimer: 4 + Math.random() * 6,
        animTimer: Math.random() * 10,
        speed: 24,
        variant: i % 2,
        scale: 1.05 + Math.random() * 0.15,
        health: REPRODUCTION_PROFILES.cow.maxHealth,
        maxHealth: REPRODUCTION_PROFILES.cow.maxHealth,
        breedCooldown: Math.random() * REPRODUCTION_PROFILES.cow.breedCooldownMinutes
      });
    }

    // 4. Friendly wild dogs trotting along the riverbank
    for (let i = 0; i < 3; i++) {
      const y = 1280 + i * 130 + (Math.random() * 70 - 35);
      const cx = world.getRiverCenterX(y);
      const spot = this.landSpot(world, cx + 125 + Math.random() * 85, y, 12);
      this.animals.push({
        id: `animal_dog_${i}`,
        type: 'dog',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        state: i === 0 ? 'sniffing' : 'walking',
        stateTimer: 2 + Math.random() * 4,
        animTimer: Math.random() * 10,
        speed: 55,
        variant: i % 2,
        scale: 0.9 + Math.random() * 0.15,
        health: REPRODUCTION_PROFILES.dog.maxHealth,
        maxHealth: REPRODUCTION_PROFILES.dog.maxHealth,
        breedCooldown: Math.random() * REPRODUCTION_PROFILES.dog.breedCooldownMinutes
      });
    }

    // 5. Wild rabbits flourishing all over the village
    const rabbitHotspots = [
      { x: 920, y: 760, variant: 0 },   // Central green near bonfire
      { x: 1040, y: 820, variant: 3 },  // Near lawn flowers (with flower)
      { x: 670, y: 700, variant: 2 },   // Near cookhouse garden (with carrot)
      { x: 610, y: 1080, variant: 4 },  // Near berry orchard (with berry)
      { x: 480, y: 440, variant: 5 },   // Near storage barn crate (in box)
      { x: 530, y: 560, variant: 1 },   // Cottage lawn (baby bunny)
      { x: 980, y: 1060, variant: 0 },  // Village south meadow
      { x: 1420, y: 580, variant: 0 },  // Riverbank clearing
      { x: 420, y: 290, variant: 0 },   // North woodcutter edge
      { x: 780, y: 480, variant: 3 },   // Flowery grove (with flower)
      { x: 1120, y: 460, variant: 2 },  // Cottage path (with carrot)
      { x: 1240, y: 920, variant: 1 },  // East village meadow (baby bunny)
      { x: 860, y: 1180, variant: 4 },  // South bushes (with berry)
      { x: 1480, y: 840, variant: 0 },  // South-east crossing grass
      { x: 1920, y: 1220, variant: 0 }, // Stone cabin forest verge (near hunter Kaelen)
      { x: 2060, y: 1360, variant: 4 }, // Hunter's east forest clearing (with berry)
      { x: 2180, y: 1240, variant: 2 }, // East whispering pines (with carrot)
      { x: 1980, y: 720, variant: 3 },  // Northeast Gale meadow (with flower)
      { x: 2260, y: 1460, variant: 1 }  // Near Sanctuary forest pond (baby bunny)
    ];

    for (let i = 0; i < rabbitHotspots.length; i++) {
      const spotConfig = rabbitHotspots[i];
      const spot = this.villageLandSpot(
        world,
        spotConfig.x + (Math.random() * 80 - 40),
        spotConfig.y + (Math.random() * 80 - 40),
        8
      );
      const isBaby = spotConfig.variant === 1;
      const initialStates: Array<WildlifeAnimal['state']> = [
        'sitting', 'eating', 'grooming', 'standing_up', 'crouching', 'hopping', 'sleeping'
      ];
      const initialState = initialStates[i % initialStates.length];
      const initialFacing: WildlifeAnimal['facing'] =
        i % 4 === 0 ? 'front' : (i % 4 === 1 ? 'right' : (i % 4 === 2 ? 'left' : 'back'));

      this.animals.push({
        id: `animal_rabbit_${i}`,
        type: 'rabbit',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: initialFacing,
        state: initialState,
        stateTimer: 2 + Math.random() * 4,
        animTimer: Math.random() * 10,
        speed: 60,
        variant: spotConfig.variant,
        scale: isBaby ? REPRODUCTION_PROFILES.rabbit.initialBabyScale : 0.95 + Math.random() * 0.15,
        health: isBaby ? Math.round(REPRODUCTION_PROFILES.rabbit.maxHealth * 0.6) : REPRODUCTION_PROFILES.rabbit.maxHealth,
        maxHealth: isBaby ? Math.round(REPRODUCTION_PROFILES.rabbit.maxHealth * 0.6) : REPRODUCTION_PROFILES.rabbit.maxHealth,
        isBaby,
        growthTimer: isBaby ? REPRODUCTION_PROFILES.rabbit.maturityMinutes * (0.3 + Math.random() * 0.4) : undefined,
        breedCooldown: !isBaby ? Math.random() * REPRODUCTION_PROFILES.rabbit.breedCooldownMinutes : undefined
      });
    }
  }

  public update(delta: number, world: World, agents: Agent[]): void {
    // 1. Active reproduction, courting, baby growth, and wild birth cycle
    this.updateReproduction(delta, world);

    // 2. Maintain baseline ecosystem population floor
    this.checkPopulation(world);

    // 2. Update each animal
    for (let i = 0; i < this.animals.length; i++) {
      const animal = this.animals[i];

      // Handle mortality & removal
      if (animal.isDead || animal.state === 'dead') {
        animal.isDead = true;
        animal.state = 'dead';
        animal.speed = 0;
        animal.targetX = animal.x;
        animal.targetY = animal.y;
        if (animal.deathTimer === undefined) {
          animal.deathTimer = 3.5;
        }
        animal.deathTimer -= delta;

        // Ascending soul sparkles in final 2.5 seconds
        if (animal.deathTimer <= 2.5 && Math.random() < 0.28) {
          world.spawnSpecialEffect(
            'sparkle',
            animal.x + (Math.random() - 0.5) * 16,
            animal.y - 8 + (Math.random() - 0.5) * 16,
            undefined,
            undefined,
            0.7
          );
        }

        if (animal.deathTimer <= 0) {
          world.spawnSpecialEffect('sparkle', animal.x, animal.y, undefined, undefined, 1.2);
          this.animals.splice(i, 1);
          i--;
          continue;
        }
        continue;
      }

      animal.animTimer += delta;
      animal.stateTimer -= delta;

      if (animal.emoteTimer && animal.emoteTimer > 0) {
        animal.emoteTimer -= delta;
        if (animal.emoteTimer <= 0) {
          animal.emote = undefined;
        }
      }

      // Natural health regeneration: when an animal is hurt, in each second slight health restores to it!
      if (!animal.isDead && animal.health !== undefined && animal.maxHealth !== undefined && animal.health < animal.maxHealth) {
        // Slight health restoration per second (scales with delta time)
        const regenPerSec = 0.25 + (animal.maxHealth * 0.008); // e.g. ~0.46 HP/s for rabbit, ~0.63 HP/s for sheep, ~0.93 HP/s for cow
        animal.health = Math.min(animal.maxHealth, animal.health + regenPerSec * delta);

        // Subtle green recovery sparkle occasionally as vitality returns
        if (Math.random() < 0.035) {
          world.spawnSpecialEffect('sparkle', animal.x + (Math.random() - 0.5) * 12, animal.y - 6 + (Math.random() - 0.5) * 8, undefined, undefined, 0.5);
        }
      }

      // Unified flee-from-human behavior: any wild animal startles and runs away if a human comes near
      if (!animal.isDead) {
        const isWounded = animal.health !== undefined && animal.maxHealth !== undefined && animal.health < animal.maxHealth;
        const alertBonus = isWounded ? 24 : 0;
        const baseFleeDist = animal.type === 'rabbit' ? 56 : animal.type === 'chicken' ? 52 : animal.type === 'sheep' ? 64 : animal.type === 'cow' ? 46 : 40;
        const fleeDist = baseFleeDist + alertBonus;

        const nearestHuman = agents.find(a => {
          if (a.data.isDead || a.data.actionState === 'dead' || a.data.actionState === 'sleeping') return false;
          const d = Math.hypot(a.data.x - animal.x, a.data.y - animal.y);
          // Stealthy hunter stalking with drawn bow can approach slightly closer, but within 38px animal startles!
          if (a.data.actionState === 'hunting') {
            return d < (38 + (isWounded ? 20 : 0));
          }
          return d < fleeDist;
        });

        if (nearestHuman && animal.state !== 'fleeing') {
          animal.state = 'fleeing';
          animal.stateTimer = 2.8 + Math.random() * 1.8;
          const angle = Math.atan2(animal.y - nearestHuman.data.y, animal.x - nearestHuman.data.x) + (Math.random() - 0.5) * 0.45;
          const dashDist = (animal.type === 'rabbit' ? 140 : animal.type === 'chicken' ? 120 : animal.type === 'sheep' ? 150 : animal.type === 'cow' ? 100 : 120) + Math.random() * 50;

          const rawTargetX = animal.x + Math.cos(angle) * dashDist;
          const rawTargetY = animal.y + Math.sin(angle) * dashDist;
          const isVillageSide = rawTargetX < 1720;
          const spot = isVillageSide
            ? this.villageLandSpot(world, rawTargetX, rawTargetY, 8)
            : this.landSpot(world, rawTargetX, rawTargetY, 12);

          animal.targetX = spot.x;
          animal.targetY = spot.y;
          animal.facing = animal.targetX > animal.x ? 'right' : 'left';
          animal.emote = isWounded ? '🩸' : (Math.random() < 0.35 ? '💨' : (Math.random() < 0.5 ? '❗' : '👀'));
          animal.emoteTimer = 1.8;
        }
      }

      // Specific behavior updates by species
      switch (animal.type) {
        case 'chicken':
          this.updateChicken(animal, delta, world);
          break;
        case 'sheep':
          this.updateSheep(animal, delta, world);
          break;
        case 'cow':
          this.updateCow(animal, delta, world);
          break;
        case 'dog':
          this.updateDog(animal, delta, world);
          break;
        case 'rabbit':
          this.updateRabbit(animal, delta, world);
          break;
      }
    }
  }

  private updateChicken(animal: WildlifeAnimal, delta: number, world: World): void {
    if (animal.state === 'hopping' || animal.state === 'fleeing') {
      const speed = animal.state === 'fleeing' ? animal.speed * 1.7 : animal.speed;
      const dx = animal.targetX - animal.x;
      const dy = animal.targetY - animal.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 6 || animal.stateTimer <= 0) {
        if (dist < 6) {
          animal.x = animal.targetX;
          animal.y = animal.targetY;
        }
        if (animal.health !== undefined && animal.maxHealth !== undefined && animal.health < animal.maxHealth) {
          animal.state = 'fleeing';
          animal.stateTimer = 2.5 + Math.random() * 2.0;
          const hopAngle = Math.random() * Math.PI * 2;
          const hopDist = 80 + Math.random() * 90;
          const spot = this.landSpot(world, animal.x + Math.cos(hopAngle) * hopDist, animal.y + Math.sin(hopAngle) * hopDist, 10);
          animal.targetX = spot.x;
          animal.targetY = spot.y;
          animal.facing = animal.targetX > animal.x ? 'right' : 'left';
          animal.emote = '🩸';
          animal.emoteTimer = 1.8;
          return;
        }
        animal.state = Math.random() > 0.4 ? 'grazing' : 'idle';
        animal.stateTimer = 3 + Math.random() * 4;
        if (Math.random() < 0.2) {
          animal.emote = ['🌾', '🐔', '🥚', '❤️'][Math.floor(Math.random() * 4)];
          animal.emoteTimer = 2.0;
        }
      } else {
        const moveDist = Math.min(dist, speed * delta);
        const nextX = animal.x + (dx / dist) * moveDist;
        const nextY = animal.y + (dy / dist) * moveDist;
        if (world.canMoveTo(nextX, nextY, 6) && !world.isWater(nextX, nextY, 12)) {
          animal.x = nextX;
          animal.y = nextY;
        }
        animal.facing = dx >= 0 ? 'right' : 'left';
      }
    } else if (animal.stateTimer <= 0) {
      // Pick a new scratching/hopping spot in the meadow
      animal.state = 'hopping';
      animal.stateTimer = 1.8 + Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;
      const hopLen = 30 + Math.random() * 70;
      const spot = this.landSpot(
        world,
        Math.max(2150, Math.min(2720, animal.x + Math.cos(angle) * hopLen)),
        Math.max(1280, Math.min(1740, animal.y + Math.sin(angle) * hopLen)),
        12
      );
      animal.targetX = spot.x;
      animal.targetY = spot.y;
      animal.facing = animal.targetX >= animal.x ? 'right' : 'left';
    }
  }

  private updateSheep(animal: WildlifeAnimal, delta: number, world: World): void {
    if (animal.state === 'walking' || animal.state === 'fleeing') {
      const speed = animal.state === 'fleeing' ? animal.speed * 1.8 : animal.speed;
      const dx = animal.targetX - animal.x;
      const dy = animal.targetY - animal.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8 || animal.stateTimer <= 0) {
        if (dist < 8) {
          animal.x = animal.targetX;
          animal.y = animal.targetY;
        }

        if (animal.health !== undefined && animal.maxHealth !== undefined && animal.health < animal.maxHealth) {
          animal.state = 'fleeing';
          animal.stateTimer = 3.0 + Math.random() * 2.0;
          const angle = Math.random() * Math.PI * 2;
          const dist = 100 + Math.random() * 100;
          const spot = this.landSpot(world, animal.x + Math.cos(angle) * dist, animal.y + Math.sin(angle) * dist, 12);
          animal.targetX = spot.x;
          animal.targetY = spot.y;
          animal.facing = animal.targetX > animal.x ? 'right' : 'left';
          animal.emote = '🩸';
          animal.emoteTimer = 2.0;
          return;
        }

        // If near the river's edge, take a drink.
        if (animal.x < 1885) {
          animal.state = 'drinking';
          animal.stateTimer = 4 + Math.random() * 4;
          animal.emote = '💧';
          animal.emoteTimer = 2.5;
        } else {
          animal.state = Math.random() > 0.4 ? 'grazing' : 'idle';
          animal.stateTimer = 4 + Math.random() * 5;
          if (Math.random() < 0.2) {
            animal.emote = Math.random() > 0.5 ? '🌿' : '🐑';
            animal.emoteTimer = 2.0;
          }
        }
      } else {
        const moveDist = Math.min(dist, speed * delta);
        const nextX = animal.x + (dx / dist) * moveDist;
        const nextY = animal.y + (dy / dist) * moveDist;
        if (world.canMoveTo(nextX, nextY, 8) && !world.isWater(nextX, nextY, 14)) {
          animal.x = nextX;
          animal.y = nextY;
        }
        animal.facing = dx >= 0 ? 'right' : 'left';
      }
    } else if (animal.stateTimer <= 0) {
      // Idle, grazing, or drinking: amble to a fresh patch or the riverbank.
      animal.state = 'walking';
      animal.stateTimer = 3 + Math.random() * 4;
      if (Math.random() < 0.3) {
        const bankY = 1320 + Math.random() * 360;
        const spot = this.landSpot(world, 1810 + Math.random() * 25, bankY, 14);
        animal.targetX = spot.x;
        animal.targetY = spot.y;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const roamLen = 60 + Math.random() * 120;
        const spot = this.landSpot(
          world,
          Math.max(1820, Math.min(2650, animal.x + Math.cos(angle) * roamLen)),
          Math.max(1260, Math.min(1720, animal.y + Math.sin(angle) * roamLen)),
          14
        );
        animal.targetX = spot.x;
        animal.targetY = spot.y;
      }
      animal.facing = animal.targetX >= animal.x ? 'right' : 'left';
    }
  }

  private updateCow(animal: WildlifeAnimal, delta: number, world: World): void {
    if (animal.state === 'walking' || animal.state === 'fleeing') {
      const speed = animal.state === 'fleeing' ? animal.speed * 1.8 : animal.speed;
      const dx = animal.targetX - animal.x;
      const dy = animal.targetY - animal.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8 || animal.stateTimer <= 0) {
        if (dist < 8) {
          animal.x = animal.targetX;
          animal.y = animal.targetY;
        }
        animal.state = Math.random() > 0.4 ? 'grazing' : 'chewing';
        animal.stateTimer = 5 + Math.random() * 7;
        if (Math.random() < 0.25) {
          animal.emote = Math.random() > 0.5 ? '🐮' : '🌾';
          animal.emoteTimer = 2.5;
        }
      } else {
        const moveDist = Math.min(dist, speed * delta);
        const nextX = animal.x + (dx / dist) * moveDist;
        const nextY = animal.y + (dy / dist) * moveDist;
        if (world.canMoveTo(nextX, nextY, 12) && !world.isWater(nextX, nextY, 16)) {
          animal.x = nextX;
          animal.y = nextY;
        }
        animal.facing = dx >= 0 ? 'right' : 'left';
      }
    } else if (animal.stateTimer <= 0) {
      if (Math.random() < 0.45) {
        animal.state = animal.state === 'chewing' ? 'grazing' : 'chewing';
        animal.stateTimer = 5 + Math.random() * 6;
        if (Math.random() < 0.2) {
          animal.emote = '🐮';
          animal.emoteTimer = 2.2;
        }
      } else {
        animal.state = 'walking';
        animal.stateTimer = 4 + Math.random() * 5;
        const angle = Math.random() * Math.PI * 2;
        const walkLen = 30 + Math.random() * 70;
        const spot = this.landSpot(
          world,
          Math.max(1960, Math.min(2380, animal.x + Math.cos(angle) * walkLen)),
          Math.max(1320, Math.min(1660, animal.y + Math.sin(angle) * walkLen)),
          16
        );
        animal.targetX = spot.x;
        animal.targetY = spot.y;
        animal.facing = spot.x >= animal.x ? 'right' : 'left';
      }
    }
  }

  private updateDog(animal: WildlifeAnimal, delta: number, world: World): void {
    if (animal.state === 'walking' || animal.state === 'fleeing') {
      const speed = animal.state === 'fleeing' ? animal.speed * 1.9 : animal.speed;
      const dx = animal.targetX - animal.x;
      const dy = animal.targetY - animal.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8 || animal.stateTimer <= 0) {
        if (dist < 8) {
          animal.x = animal.targetX;
          animal.y = animal.targetY;
        }
        animal.state = Math.random() > 0.55 ? 'sniffing' : 'idle';
        animal.stateTimer = 2.5 + Math.random() * 4;
        if (Math.random() < 0.3) {
          animal.emote = Math.random() > 0.5 ? '🐶' : '🦴';
          animal.emoteTimer = 2.0;
        }
      } else {
        const moveDist = Math.min(dist, speed * delta);
        const nextX = animal.x + (dx / dist) * moveDist;
        const nextY = animal.y + (dy / dist) * moveDist;
        if (world.canMoveTo(nextX, nextY, 10) && !world.isWater(nextX, nextY, 14)) {
          animal.x = nextX;
          animal.y = nextY;
        }
        animal.facing = dx >= 0 ? 'right' : 'left';
      }
    } else if (animal.stateTimer <= 0) {
      animal.state = 'walking';
      animal.stateTimer = 3 + Math.random() * 4;

      if (Math.random() < 0.3) {
        // Pad over to the water's edge for a drink or a curious sniff.
        const bankY = Math.max(1240, Math.min(1680, animal.y + (Math.random() * 140 - 70)));
        const cx = world.getRiverCenterX(bankY);
        const spot = this.landSpot(world, cx + 110 + Math.random() * 45, bankY, 12);
        animal.targetX = spot.x;
        animal.targetY = spot.y;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const roamLen = 40 + Math.random() * 90;
        const spot = this.landSpot(
          world,
          Math.max(1740, Math.min(2280, animal.x + Math.cos(angle) * roamLen)),
          Math.max(1240, Math.min(1620, animal.y + Math.sin(angle) * roamLen)),
          12
        );
        animal.targetX = spot.x;
        animal.targetY = spot.y;
      }
      animal.facing = animal.targetX >= animal.x ? 'right' : 'left';
    }
  }

  private updateRabbit(animal: WildlifeAnimal, delta: number, world: World): void {
    const isMoving = animal.state === 'hopping' || animal.state === 'walking' || animal.state === 'running' || animal.state === 'fleeing';

    if (isMoving) {
      const speed = (animal.state === 'fleeing' || animal.state === 'running')
        ? animal.speed * 2.2
        : animal.speed;

      const dx = animal.targetX - animal.x;
      const dy = animal.targetY - animal.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 6 || animal.stateTimer <= 0) {
        if (dist < 6) {
          animal.x = animal.targetX;
          animal.y = animal.targetY;
        }

        // Arrived at destination:
        // When wounded, rabbit stays terrified on the run, continuously bolting to safety!
        if (animal.health !== undefined && animal.maxHealth !== undefined && animal.health < animal.maxHealth) {
          animal.state = 'running';
          animal.stateTimer = 2.4 + Math.random() * 2.0;
          const hopAngle = Math.random() * Math.PI * 2;
          const hopDist = 90 + Math.random() * 100;
          const spot = this.villageLandSpot(world, animal.x + Math.cos(hopAngle) * hopDist, animal.y + Math.sin(hopAngle) * hopDist, 8);
          animal.targetX = spot.x;
          animal.targetY = spot.y;
          animal.facing = animal.targetX > animal.x ? 'right' : 'left';
          animal.emote = '🩸';
          animal.emoteTimer = 1.8;
          return;
        }

        // Arrived at destination: transition to rich rabbit poses/activities
        const roll = Math.random();
        if (roll < 0.25) {
          animal.state = 'eating';
          animal.stateTimer = 3.5 + Math.random() * 3;
          if (Math.random() < 0.3) {
            animal.emote = animal.variant === 2 ? '🥕' : (animal.variant === 4 ? '🫐' : '🌾');
            animal.emoteTimer = 2.0;
          }
        } else if (roll < 0.40) {
          animal.state = 'grooming';
          animal.stateTimer = 2.5 + Math.random() * 2;
          if (Math.random() < 0.25) {
            animal.emote = '✨';
            animal.emoteTimer = 1.8;
          }
        } else if (roll < 0.55) {
          animal.state = 'standing_up';
          animal.stateTimer = 2.0 + Math.random() * 2.5;
          if (Math.random() < 0.3) {
            animal.emote = '👀';
            animal.emoteTimer = 2.0;
          }
        } else if (roll < 0.68) {
          animal.state = 'crouching';
          animal.stateTimer = 2.5 + Math.random() * 2.5;
        } else if (roll < 0.80) {
          animal.state = 'jumping';
          animal.stateTimer = 1.0 + Math.random() * 0.6;
          if (Math.random() < 0.35) {
            animal.emote = '🌸';
            animal.emoteTimer = 1.6;
          }
        } else if (roll < 0.88) {
          animal.state = 'sleeping';
          animal.stateTimer = 4.5 + Math.random() * 4;
          animal.emote = '💤';
          animal.emoteTimer = 3.0;
        } else {
          animal.state = 'sitting';
          animal.stateTimer = 3 + Math.random() * 3;
          const dirRoll = Math.random();
          if (dirRoll < 0.25) animal.facing = 'front';
          else if (dirRoll < 0.45) animal.facing = 'back';
        }
      } else {
        const moveDist = Math.min(dist, speed * delta);
        const nextX = animal.x + (dx / dist) * moveDist;
        const nextY = animal.y + (dy / dist) * moveDist;
        if (world.canMoveTo(nextX, nextY, 6) && !world.isWater(nextX, nextY, 8)) {
          animal.x = nextX;
          animal.y = nextY;
        } else {
          animal.stateTimer = 0;
        }
        animal.facing = dx >= 0 ? 'right' : 'left';
      }
    } else if (animal.stateTimer <= 0) {
      // Transition from idle/pose to new hop or new pose
      if (Math.random() < 0.60) {
        // Hop or sprint to a new spot in the village
        const hopAngle = Math.random() * Math.PI * 2;
        const hopDist = 50 + Math.random() * 110;
        const targetX = Math.max(VILLAGE_BOUNDS.minX, Math.min(VILLAGE_BOUNDS.maxX, animal.x + Math.cos(hopAngle) * hopDist));
        const targetY = Math.max(VILLAGE_BOUNDS.minY, Math.min(VILLAGE_BOUNDS.maxY, animal.y + Math.sin(hopAngle) * hopDist));
        const spot = this.villageLandSpot(world, targetX, targetY, 8);

        animal.targetX = spot.x;
        animal.targetY = spot.y;
        animal.state = Math.random() < 0.2 ? 'running' : 'hopping';
        animal.stateTimer = 3.5 + Math.random() * 2.5;
        animal.facing = animal.targetX >= animal.x ? 'right' : 'left';
      } else {
        // Shift to another cute stationary pose
        const roll = Math.random();
        if (roll < 0.25) {
          animal.state = 'eating';
          animal.stateTimer = 3 + Math.random() * 3;
        } else if (roll < 0.45) {
          animal.state = 'grooming';
          animal.stateTimer = 2.5 + Math.random() * 2;
        } else if (roll < 0.65) {
          animal.state = 'standing_up';
          animal.stateTimer = 2 + Math.random() * 2.5;
        } else if (roll < 0.80) {
          animal.state = 'jumping';
          animal.stateTimer = 0.9 + Math.random() * 0.5;
        } else if (roll < 0.90) {
          animal.state = 'crouching';
          animal.stateTimer = 2.5 + Math.random() * 2;
        } else {
          animal.state = 'sitting';
          animal.stateTimer = 3 + Math.random() * 3;
          const dirRoll = Math.random();
          if (dirRoll < 0.3) animal.facing = 'front';
          else if (dirRoll < 0.5) animal.facing = 'back';
          else animal.facing = Math.random() > 0.5 ? 'right' : 'left';
        }
      }
    }
  }

  /**
   * Spawns a baby animal with proper scaling, coat variant, and biological growth timers.
   */
  public createBabyAnimal(
    type: AnimalType,
    x: number,
    y: number,
    motherId?: string,
    world?: World
  ): WildlifeAnimal {
    const profile = REPRODUCTION_PROFILES[type];
    const isRabbit = type === 'rabbit';
    const spot = world
      ? (isRabbit ? this.villageLandSpot(world, x, y, 8) : this.landSpot(world, x, y, 10))
      : { x, y };

    let variant = 0;
    if (type === 'rabbit') {
      variant = 1; // Variant 1 renders rabbit_baby.png in RabbitSpriteRenderer
    } else if (type === 'chicken') {
      variant = 1;
    } else if (type === 'sheep') {
      variant = 2;
    } else if (type === 'cow') {
      variant = 0;
    } else if (type === 'dog') {
      variant = 0;
    }

    const baby: WildlifeAnimal = {
      id: `animal_${type}_baby_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      x: spot.x,
      y: spot.y,
      targetX: spot.x,
      targetY: spot.y,
      facing: Math.random() > 0.5 ? 'right' : 'left',
      state: isRabbit ? 'sitting' : 'grazing',
      stateTimer: 2 + Math.random() * 3,
      animTimer: Math.random() * 5,
      speed: isRabbit ? 52 : 38,
      variant,
      scale: profile.initialBabyScale,
      health: Math.round(profile.maxHealth * 0.6),
      maxHealth: Math.round(profile.maxHealth * 0.6),
      isBaby: true,
      growthTimer: profile.maturityMinutes * (0.95 + Math.random() * 0.1),
      breedCooldown: profile.breedCooldownMinutes,
      motherId,
      emote: '🍼',
      emoteTimer: 3.5
    };

    if (world) {
      world.spawnSpecialEffect('sparkle', spot.x, spot.y - 6, undefined, undefined, 1.2);
    }

    this.animals.push(baby);
    return baby;
  }

  /**
   * Updates animal reproduction, family bonds, courting, and the realistic wild birth cycle.
   * Scaled according to: 1 Real-Life Year (365 days) = 10 In-Game Days (14,400 game minutes).
   */
  private updateReproduction(delta: number, world: World): void {
    // Current counts of living animals
    const counts: Record<AnimalType, number> = { rabbit: 0, chicken: 0, sheep: 0, cow: 0, dog: 0 };
    for (const a of this.animals) {
      if (!a.isDead && counts[a.type] !== undefined) {
        counts[a.type]++;
      }
    }

    // 1. Process baby animals: slow realistic growth and mother following
    for (const animal of this.animals) {
      if (animal.isDead) continue;

      if (animal.isBaby) {
        if (animal.growthTimer !== undefined) {
          animal.growthTimer -= delta;

          const profile = REPRODUCTION_PROFILES[animal.type];
          const totalGrowth = profile.maturityMinutes;
          const progress = Math.min(1, Math.max(0, 1 - animal.growthTimer / totalGrowth));
          animal.scale = profile.initialBabyScale + (profile.adultScale - profile.initialBabyScale) * progress;

          if (animal.growthTimer <= 0) {
            // Reached adulthood after full real-life scaled growth!
            animal.isBaby = false;
            animal.growthTimer = undefined;
            animal.motherId = undefined;
            animal.breedCooldown = profile.breedCooldownMinutes * (0.8 + Math.random() * 0.4);
            if (animal.type === 'rabbit') {
              const adultVariants = [0, 2, 3, 4, 5];
              animal.variant = adultVariants[Math.floor(Math.random() * adultVariants.length)];
            }
            animal.scale = profile.adultScale;
            animal.maxHealth = profile.maxHealth;
            animal.health = profile.maxHealth;
            animal.emote = '⭐';
            animal.emoteTimer = 3.5;
            world.spawnSpecialEffect('sparkle', animal.x, animal.y - 6, undefined, undefined, 1.2);
            this.pendingEvents.push({
              message: `⭐ After ${profile.realMaturityDays} days of natural growth, a young ${animal.type} has reached full adulthood!`,
              category: 'general'
            });
          }
        }

        // Baby stays close to mother if she is nearby
        if (animal.motherId) {
          const mother = this.animals.find(m => m.id === animal.motherId && !m.isDead);
          if (mother) {
            const dist = Math.hypot(animal.x - mother.x, animal.y - mother.y);
            if (dist > 70 && animal.stateTimer <= 0) {
              const followAngle = Math.random() * Math.PI * 2;
              const followDist = 20 + Math.random() * 30;
              const tx = mother.x + Math.cos(followAngle) * followDist;
              const ty = mother.y + Math.sin(followAngle) * followDist;
              const spot = animal.type === 'rabbit'
                ? this.villageLandSpot(world, tx, ty, 8)
                : this.landSpot(world, tx, ty, 10);
              animal.targetX = spot.x;
              animal.targetY = spot.y;
              animal.state = animal.type === 'rabbit' ? 'hopping' : 'walking';
              animal.stateTimer = 2.5 + Math.random() * 2;
              animal.facing = animal.targetX >= animal.x ? 'right' : 'left';
            }
          } else {
            animal.motherId = undefined;
          }
        }
      } else {
        // Adult animal reproduction logic
        if (animal.breedCooldown !== undefined && animal.breedCooldown > 0) {
          animal.breedCooldown -= delta;
        }

        // Pregnancy countdown & birth
        if (animal.pregnancyTimer !== undefined) {
          animal.pregnancyTimer -= delta;

          // Subtle nesting sparkle
          if (Math.random() < 0.002) {
            world.spawnSpecialEffect('sparkle', animal.x, animal.y - 4, undefined, undefined, 0.6);
          }

          if (animal.pregnancyTimer <= 0) {
            animal.pregnancyTimer = undefined;
            const profile = REPRODUCTION_PROFILES[animal.type];
            animal.breedCooldown = profile.breedCooldownMinutes * (0.9 + Math.random() * 0.2);
            animal.emote = '🍼';
            animal.emoteTimer = 3.5;
            world.spawnSpecialEffect('sparkle', animal.x, animal.y - 4, undefined, undefined, 1.5);

            const litterSize = animal.type === 'rabbit' ? (Math.random() < 0.45 ? 2 : 1) : 1;
            for (let b = 0; b < litterSize; b++) {
              const bx = animal.x + (Math.random() * 24 - 12);
              const by = animal.y + (Math.random() * 24 - 12);
              this.createBabyAnimal(animal.type, bx, by, animal.id, world);
            }

            const babyName = litterSize > 1 ? profile.babyPluralName : profile.babyName;
            this.pendingEvents.push({
              message: `🍼 After ${profile.realGestationDays} days of gestation, a wild mother ${animal.type} gave birth to a healthy ${babyName}!`,
              category: 'general'
            });
          }
        }
      }
    }

    // 2. Courting & Mating between mature adults
    const caps: Record<AnimalType, number> = {
      rabbit: 26,
      chicken: 9,
      sheep: 7,
      cow: 4,
      dog: 4
    };

    for (let i = 0; i < this.animals.length; i++) {
      const a = this.animals[i];
      if (a.isDead || a.isBaby || a.pregnancyTimer !== undefined || (a.breedCooldown && a.breedCooldown > 0)) continue;
      if (counts[a.type] >= caps[a.type]) continue;
      if (a.state === 'fleeing') continue;

      for (let j = i + 1; j < this.animals.length; j++) {
        const b = this.animals[j];
        if (b.type !== a.type || b.isDead || b.isBaby || b.pregnancyTimer !== undefined || (b.breedCooldown && b.breedCooldown > 0)) continue;
        if (b.state === 'fleeing') continue;

        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 46) {
          // Courting pair found!
          a.facing = b.x >= a.x ? 'right' : 'left';
          b.facing = a.x >= b.x ? 'right' : 'left';
          a.state = 'idle';
          b.state = 'idle';
          a.stateTimer = 2.8;
          b.stateTimer = 2.8;
          a.emote = '❤️';
          b.emote = '❤️';
          a.emoteTimer = 3.2;
          b.emoteTimer = 3.2;

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          world.spawnSpecialEffect('sparkle', midX, midY - 8, undefined, undefined, 1.2);

          const profile = REPRODUCTION_PROFILES[a.type];
          // Pregnancy duration derived from real biological days (e.g. cow 283 days = 7.75 game days, rabbit 31 days = 0.85 game days)
          a.pregnancyTimer = profile.gestationMinutes * (0.95 + Math.random() * 0.1);
          a.breedCooldown = profile.breedCooldownMinutes + a.pregnancyTimer;
          b.breedCooldown = profile.breedCooldownMinutes;

          this.pendingEvents.push({
            message: `❤️ Two wild ${a.type}s bonded in the meadow. A mother is now expecting young (${profile.realGestationDays}-day natural gestation).`,
            category: 'love'
          });
          break;
        }
      }
    }

    // 3. Realistic Wild Birth Cycle from Burrows, Clearings & Nests
    // Periodic check every ~0.5 in-game days to keep populations healthy at realistic slow speeds
    this.wildBirthTimer -= delta;
    if (this.wildBirthTimer <= 0) {
      this.wildBirthTimer = 720.0 + Math.random() * 360.0; // Next check in ~0.5 to 0.75 in-game days

      if (counts.rabbit < 16) {
        const isEast = Math.random() < 0.45;
        const rx = isEast
          ? 1880 + Math.random() * 420
          : VILLAGE_BOUNDS.minX + 80 + Math.random() * (VILLAGE_BOUNDS.maxX - VILLAGE_BOUNDS.minX - 160);
        const ry = isEast
          ? 1120 + Math.random() * 440
          : VILLAGE_BOUNDS.minY + 80 + Math.random() * (VILLAGE_BOUNDS.maxY - VILLAGE_BOUNDS.minY - 160);

        this.createBabyAnimal('rabbit', rx, ry, undefined, world);
        this.pendingEvents.push({
          message: '🐇 A wild baby rabbit emerged from a clover burrow into the sun.',
          category: 'general'
        });
      } else if (counts.chicken < 4) {
        const spot = this.landSpot(world, 2300 + Math.random() * 320, 1380 + Math.random() * 300, 12);
        this.createBabyAnimal('chicken', spot.x, spot.y, undefined, world);
        this.pendingEvents.push({
          message: '🐣 A wild chick hatched from a forest nest in the southern meadow.',
          category: 'general'
        });
      } else if (counts.sheep < 3) {
        const spot = this.landSpot(world, 1980 + Math.random() * 420, 1350 + Math.random() * 280, 14);
        this.createBabyAnimal('sheep', spot.x, spot.y, undefined, world);
        this.pendingEvents.push({
          message: '🐑 A gentle wild lamb was born along the river pasture.',
          category: 'general'
        });
      } else if (counts.cow < 2) {
        const spot = this.landSpot(world, 2020 + Math.random() * 220, 1380 + Math.random() * 160, 16);
        this.createBabyAnimal('cow', spot.x, spot.y, undefined, world);
        this.pendingEvents.push({
          message: '🐄 A newborn calf was welcomed into the pastoral clearing.',
          category: 'general'
        });
      }
    }
  }

  private checkPopulation(world: World): void {
    const counts = { chicken: 0, sheep: 0, cow: 0, dog: 0, rabbit: 0 };
    for (const a of this.animals) {
      if (!a.isDead && counts[a.type] !== undefined) {
        counts[a.type]++;
      }
    }

    // Ensure a flourishing village and eastern forest rabbit population (at least 18 rabbits)
    if (counts.rabbit < 12) {
      const isEastBank = Math.random() < 0.45;
      const rx = isEastBank
        ? 1850 + Math.random() * 450
        : VILLAGE_BOUNDS.minX + Math.random() * (VILLAGE_BOUNDS.maxX - VILLAGE_BOUNDS.minX);
      const ry = isEastBank
        ? 1100 + Math.random() * 450
        : VILLAGE_BOUNDS.minY + Math.random() * (VILLAGE_BOUNDS.maxY - VILLAGE_BOUNDS.minY);
      const spot = this.villageLandSpot(world, rx, ry, 8);
      const variant = Math.floor(Math.random() * 6);
      const isBaby = variant === 1;

      this.animals.push({
        id: `animal_rabbit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'rabbit',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: Math.random() > 0.5 ? 'right' : 'left',
        state: 'sitting',
        stateTimer: 3 + Math.random() * 3,
        animTimer: Math.random() * 10,
        speed: 60,
        variant,
        scale: isBaby ? 0.85 : 0.95 + Math.random() * 0.15
      });
    }

    // Ensure a balanced wildlife community.
    if (counts.chicken < 4) {
      const spot = this.landSpot(world, 2300 + Math.random() * 320, 1380 + Math.random() * 300, 12);
      this.animals.push({
        id: `animal_chicken_${Date.now()}`,
        type: 'chicken',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: 'left',
        state: 'grazing',
        stateTimer: 4,
        animTimer: 0,
        speed: 55,
        variant: Math.floor(Math.random() * 3),
        scale: 0.9 + Math.random() * 0.2
      });
    }

    if (counts.sheep < 3) {
      const spot = this.landSpot(world, 1980 + Math.random() * 420, 1350 + Math.random() * 280, 14);
      this.animals.push({
        id: `animal_sheep_${Date.now()}`,
        type: 'sheep',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: 'right',
        state: 'grazing',
        stateTimer: 5,
        animTimer: 0,
        speed: 42,
        variant: Math.floor(Math.random() * 4),
        scale: 0.95
      });
    }

    if (counts.cow < 2) {
      const spot = this.landSpot(world, 2020 + Math.random() * 220, 1380 + Math.random() * 160, 16);
      this.animals.push({
        id: `animal_cow_${Date.now()}`,
        type: 'cow',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: 'left',
        state: 'chewing',
        stateTimer: 5,
        animTimer: 0,
        speed: 24,
        variant: Math.floor(Math.random() * 2),
        scale: 1.05
      });
    }

    if (counts.dog < 2) {
      const y = 1320 + Math.random() * 260;
      const cx = world.getRiverCenterX(y);
      const spot = this.landSpot(world, cx + 125 + Math.random() * 70, y, 12);
      this.animals.push({
        id: `animal_dog_${Date.now()}`,
        type: 'dog',
        x: spot.x,
        y: spot.y,
        targetX: spot.x,
        targetY: spot.y,
        facing: 'right',
        state: 'sniffing',
        stateTimer: 4,
        animTimer: 0,
        speed: 55,
        variant: Math.floor(Math.random() * 2),
        scale: 0.92
      });
    }
  }

  /**
   * Finds a nearby navigable, dry patch of ground. Keeps newly spawned animals
   * out of the river and out of trees/buildings.
   */
  private landSpot(world: World, x: number, y: number, margin = 12): { x: number; y: number } {
    const clampedX = Math.max(SANCTUARY.minX, Math.min(SANCTUARY.maxX, x));
    const clampedY = Math.max(SANCTUARY.minY, Math.min(SANCTUARY.maxY, y));
    if (world.canMoveTo(clampedX, clampedY, margin) && !world.isWater(clampedX, clampedY, margin)) {
      return { x: clampedX, y: clampedY };
    }

    for (let i = 1; i <= 14; i++) {
      const angle = i * 2.399;
      const radius = i * 16;
      const nx = Math.max(SANCTUARY.minX, Math.min(SANCTUARY.maxX, clampedX + Math.cos(angle) * radius));
      const ny = Math.max(SANCTUARY.minY, Math.min(SANCTUARY.maxY, clampedY + Math.sin(angle) * radius));
      if (world.canMoveTo(nx, ny, margin) && !world.isWater(nx, ny, margin)) {
        return { x: nx, y: ny };
      }
    }

    return { x: clampedX, y: clampedY };
  }

  /**
   * Finds a nearby navigable, dry patch of ground in the village area.
   */
  private villageLandSpot(world: World, x: number, y: number, margin = 8): { x: number; y: number } {
    const clampedX = Math.max(VILLAGE_BOUNDS.minX, Math.min(VILLAGE_BOUNDS.maxX, x));
    const clampedY = Math.max(VILLAGE_BOUNDS.minY, Math.min(VILLAGE_BOUNDS.maxY, y));
    if (world.canMoveTo(clampedX, clampedY, margin) && !world.isWater(clampedX, clampedY, margin)) {
      return { x: clampedX, y: clampedY };
    }

    for (let i = 1; i <= 14; i++) {
      const angle = i * 2.399;
      const radius = i * 14;
      const nx = Math.max(VILLAGE_BOUNDS.minX, Math.min(VILLAGE_BOUNDS.maxX, clampedX + Math.cos(angle) * radius));
      const ny = Math.max(VILLAGE_BOUNDS.minY, Math.min(VILLAGE_BOUNDS.maxY, clampedY + Math.sin(angle) * radius));
      if (world.canMoveTo(nx, ny, margin) && !world.isWater(nx, ny, margin)) {
        return { x: nx, y: ny };
      }
    }

    return { x: clampedX, y: clampedY };
  }

  /**
   * Finds the animal nearest to the specified world coordinates within radius.
   */
  public getAnimalAt(x: number, y: number, radius = 36): WildlifeAnimal | undefined {
    let closest: WildlifeAnimal | undefined;
    let closestDist = radius;

    for (const animal of this.animals) {
      const d = Math.hypot(animal.x - x, animal.y - y);
      if (d < closestDist) {
        closest = animal;
        closestDist = d;
      }
    }
    return closest;
  }
}
