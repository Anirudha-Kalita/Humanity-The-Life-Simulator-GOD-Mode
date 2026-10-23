export type Gender = 'male' | 'female' | 'nonbinary';

export interface Needs {
  hunger: number;    // 100 = full, 0 = starving
  energy: number;    // 100 = fully rested, 0 = collapsed exhaustion
  social: number;    // 100 = loved/connected, 0 = isolated depression
  fun: number;       // 100 = thrilled, 0 = bored/restless
  health: number;    // 100 = peak vitality, 0 = dead/unconscious
  morality: number;  // 100 = virtuous saint, 0 = ruthless sociopath
}

export interface Traits {
  openness: number;          // -1 to 1 (artistic/curious vs rigid)
  conscientiousness: number; // -1 to 1 (disciplined vs impulsive)
  extraversion: number;      // -1 to 1 (outgoing vs solitary)
  agreeableness: number;     // -1 to 1 (empathetic vs cynical/hostile)
  neuroticism: number;       // -1 to 1 (volatile/anxious vs calm)
  aggression: number;        // 0 to 1 (propensity for violence)
  greed: number;             // 0 to 1 (lure of wealth, theft)
  libido: number;            // 0 to 1 (romantic/flirtatious drive)
  workEthic: number;         // 0 to 1 (dedication to daily routine)
}

export type FacialHairType = 'none' | 'stubble' | 'beard' | 'full_beard' | 'mustache';
export type OutfitType = 'tunic_pants' | 'dress_apron' | 'robe' | 'vest_pants' | 'skirt_blouse' | 'toddler';

export interface Appearance {
  gender: Gender;
  skinColor: string;
  hairColor: string;
  hairStyle: 'short' | 'buzz' | 'wavy' | 'long' | 'bun' | 'spiky' | 'braids' | 'ponytail' | 'twin_tails';
  shirtColor: string;
  pantsColor: string;
  dressColor?: string;
  apronColor?: string;
  accessory: 'none' | 'glasses' | 'hat' | 'bandage' | 'flower' | 'cloak' | 'headband' | 'ribbon';
  cloakColor?: string;
  eyeColor: string;
  facialHair?: FacialHairType;
  outfitType?: OutfitType;
  scale?: number; // Height/size variance (0.9 to 1.1)
  isPregnant?: boolean;
}

export type BubbleType = 
  | 'heart' 
  | 'broken_heart' 
  | 'rage' 
  | 'fist' 
  | 'shock' 
  | 'tears' 
  | 'money' 
  | 'sleep' 
  | 'food' 
  | 'laugh' 
  | 'blood' 
  | 'police'
  | 'peace' 
  | 'idea'
  | 'kiss'
  | 'axe'
  | 'bow'
  | 'fish'
  | 'berry'
  | 'hammer'
  | 'home'
  | 'water'
  | 'talk'
  | 'greet';

export interface ActiveDialog {
  partnerId: string;
  partnerName: string;
  line: string;
  isSpeaker: boolean;
  phase: 1 | 2;
  timer: number;
  fullExchange: {
    line1: string;
    line2: string;
    initiatorName: string;
    replierName: string;
    topic?: string;
    bubble1?: BubbleType;
    bubble2?: BubbleType;
    isAiGenerated?: boolean;
    memoriesUsed?: string[];
  };
}

export interface EmotionBubble {
  type: BubbleType;
  duration: number;
  maxDuration: number;
  text?: string;
  speakerName?: string;
  bounceOffset: number;
}

export interface Memory {
  id: string;
  timestamp: number;
  description: string;
  emotionalWeight: number; // -100 to 100
  targetId?: string;
}

export type RelationshipStatus = 
  | 'stranger' 
  | 'acquaintance' 
  | 'friend' 
  | 'best_friend' 
  | 'crush' 
  | 'flirting' 
  | 'dating' 
  | 'in_love' 
  | 'madly_in_love' 
  | 'married' 
  | 'divorced' 
  | 'ex_spouse' 
  | 'rival' 
  | 'enemy';

export interface Relationship {
  targetId: string;
  targetName: string;
  affinity: number;     // -100 to 100 (hate vs love)
  attraction: number;   // 0 to 100 (platonic vs intense desire)
  trust: number;        // -100 to 100 (betrayal vs unwavering faith)
  fear: number;         // 0 to 100 (comfort vs intimidation)
  status: RelationshipStatus;
}

export type ActionState = 
  | 'idle' 
  | 'walking' 
  | 'running'
  | 'talking' 
  | 'flirting' 
  | 'fighting' 
  | 'eating' 
  | 'sleeping' 
  | 'sitting'
  | 'chopping'     // Lumberjack swinging axe at tree
  | 'foraging'     // Picking berries/herbs
  | 'hunting'      // Hunter tracking and bow-shooting wild game
  | 'fishing'      // Fishing rod at river bank
  | 'carrying'     // Carrying log/basket/meat to storage or construction site
  | 'cooking'      // Stirring pot at communal hearth
  | 'fetching_water' // Walking to pond / dipping bucket into pond to fill drinking water
  | 'building'     // Constructing / hammering a wooden house
  | 'stealing' 
  | 'fleeing' 
  | 'grieving' 
  | 'healing' 
  | 'unconscious'
  | 'dead';

export type FacingDirection = 'down' | 'up' | 'left' | 'right';

export type SettlerRole = 'lumberjack' | 'forager' | 'fisher' | 'healer' | 'cook' | 'elder' | 'hunter' | 'builder' | 'settler' | 'toddler' | 'child';

export type ScheduledTaskType = 
  | 'sleep' 
  | 'breakfast' 
  | 'work' 
  | 'lunch' 
  | 'afternoon_work' 
  | 'evening_social' 
  | 'dinner' 
  | 'relax';

export interface ScheduleEntry {
  startHour: number; // 0 - 24
  endHour: number;   // 0 - 24
  task: ScheduledTaskType;
  locationId: string; // Target location or building
  description: string;
}

export interface AgentData {
  id: string;
  name: string;
  familyName: string;
  age: number;
  role: SettlerRole;
  cash: number;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  finalTargetX?: number;
  finalTargetY?: number;
  waypoints?: { x: number; y: number }[];
  facing: FacingDirection;
  walkCycle: number;
  actionState: ActionState;
  actionTimer: number;
  targetAgentId?: string;
  targetResourceId?: string;
  targetBuildingId?: string;
  needs: Needs;
  traits: Traits;
  appearance: Appearance;
  relationships: Record<string, Relationship>;
  memories: Memory[];
  activeBubble?: EmotionBubble;
  isPossessed: boolean;
  equippedWeapon?: 'fists' | 'knife' | 'axe' | 'bow' | 'hammer';
  carriedItem?: {
    type: 'log' | 'berries' | 'fish' | 'meal' | 'meat' | 'water';
    count: number;
  };
  thought: string;
  injuryDescription?: string;
  
  // Daily Routine & Interruptions
  schedule: ScheduleEntry[];
  routineInterrupted: boolean;
  interruptionReason?: string;
  interruptionTimer?: number;

  // Family & Housing
  homeCabinId: string;
  /** Set while the settler is physically inside an interior view. */
  indoorBuildingId?: string;
  spouseId?: string;
  exSpouseIds?: string[];
  maritalStatus?: 'single' | 'dating' | 'in_love' | 'madly_in_love' | 'married' | 'divorced';
  marriageCount?: number;
  divorceCount?: number;
  wantsToBuildHouse?: boolean;
  isPregnant?: boolean;
  pregnancyProgress?: number; // 0 to 100%
  exactAge?: number;
  motherId?: string;
  fatherId?: string;

  // Active Conversations & Socializing
  activeDialog?: ActiveDialog;
  lastSocialTime?: number;

  // Mortality & Divine Smite (Dies, collapses for 10s, then removed from game)
  isDead?: boolean;
  deathTimer?: number;
  causeOfDeath?: 'old_age' | 'divine_smite' | 'injury';
  maxLifespan?: number;
}

export type ItemType = 'cash' | 'knife' | 'axe' | 'hammer' | 'log' | 'berries' | 'fish' | 'meal' | 'meat' | 'flower' | 'medkit' | 'water';

export interface SpecialEffect {
  type: 'lightning' | 'heart_burst' | 'smoke' | 'sparkle' | 'arrow';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  timer: number;
  maxTimer: number;
}

export interface WorldItem {
  id: string;
  type: ItemType;
  name: string;
  x: number;
  y: number;
  value: number;
}

export type AnimalType = 'chicken' | 'sheep' | 'cow' | 'dog' | 'rabbit';
export type AnimalState =
  | 'idle'
  | 'grazing'
  | 'walking'
  | 'hopping'
  | 'running'
  | 'swimming'
  | 'fleeing'
  | 'drinking'
  | 'chewing'
  | 'diving'
  | 'sniffing'
  | 'eating'
  | 'grooming'
  | 'sleeping'
  | 'sitting'
  | 'crouching'
  | 'standing_up'
  | 'jumping'
  | 'in_box'
  | 'dead';

export interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export interface WildlifeAnimal {
  id: string;
  type: AnimalType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: 'left' | 'right' | 'front' | 'back';
  state: AnimalState;
  stateTimer: number;
  animTimer: number;
  speed: number;
  variant: number; // 0, 1, 2 for distinctive coat / size variation
  scale: number;
  emote?: string;
  emoteTimer?: number;
  // Legacy water ripple data retained for the procedural fallback renderer.
  rippleTimer?: number;
  ripples?: WaterRipple[];

  // Reproduction & Breeding System
  isBaby?: boolean;
  growthTimer?: number;
  breedCooldown?: number;
  pregnancyTimer?: number;
  motherId?: string;

  // Mortality & Divine Smite
  isDead?: boolean;
  deathTimer?: number;
  causeOfDeath?: 'old_age' | 'divine_smite' | 'injury';
  maxLifespan?: number;
  // Combat & Health System
  health?: number;
  maxHealth?: number;
}

export type TreeStage = 'sapling' | 'young' | 'mature' | 'ancient' | 'decaying';

export type TreeVariant =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17
  | 'small' | 'medium' | 'large' | 'tall_slim' | 'pine' | 'snow_pine'
  | 'apple' | 'orange' | 'cherry' | 'autumn' | 'blooming' | 'palm'
  | 'willow' | 'birch' | 'dead' | 'rocky' | 'mangrove' | 'bamboo'
  | 'oak' | 'banyan' | 'elm';

export interface ForestTree {
  id: string;
  x: number;
  y: number;
  woodHealth: number;
  maxWoodHealth: number;
  regrowTimer: number;
  shakeTimer: number;
  variant: TreeVariant;
  stage: TreeStage;
  age: number;
  maxLifespan: number;
  seedTimer: number;
  decayTimer?: number;
}

export type BushStage = 'sprout' | 'flowering' | 'fruiting' | 'withering';

export type NatureCategory =
  | 'rock'
  | 'pebble'
  | 'mushroom'
  | 'bush'
  | 'plant'
  | 'flower'
  | 'leaf'
  | 'grass'
  | 'branch'
  | 'log'
  | 'stump'
  | 'leaves_pile'
  | 'moss'
  | 'fern'
  | 'tall_grass'
  | 'misc';

export interface NatureElement {
  id: string;
  type: string;
  category: NatureCategory;
  x: number;
  y: number;
  scale?: number;
  flipX?: boolean;
}

export interface BerryBush {
  id: string;
  x: number;
  y: number;
  hasBerries: boolean;
  regrowTimer: number;
  stage: BushStage;
  age: number;
  maxLifespan: number;
  seedTimer: number;
  decayTimer?: number;
}

export interface RiverFish {
  id: string;
  x: number;
  y: number;
  speed: number;
  targetX: number;
  targetY: number;
  swimCycle: number;
}

export type PondFishColor = 'orange' | 'calico' | 'white_red' | 'gold' | 'blue_silver';

export interface PondFish {
  id: string;
  pondId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: PondFishColor;
  swimCycle: number;
  size: number;
  angle: number;
  nibbleTimer: number;
}

export interface Pond {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  waterCenterX: number;
  waterCenterY: number;
  waterRadiusX: number;
  waterRadiusY: number;
  fish: PondFish[];
  sprite?: 'default' | 'small';
}

export type BonfireView = 'front' | 'back' | 'left' | 'right' | 'top';
export type BonfireState = 'auto' | 'idle' | 'burning_medium' | 'burning_high' | 'crackling' | 'smoldering' | 'dying_out';

export interface Campfire {
  x: number;
  y: number;
  intensity: number;
  view?: BonfireView;
  state?: BonfireState;
  fuel?: number;
}

export interface RoadSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  controlPoint?: { x: number; y: number };
  buildingId?: string; // Optional: tagged if connecting a specific house
}

export type SettlementBuildingType = 
  | 'cabin' 
  | 'hearth' 
  | 'lumber_camp' 
  | 'dock' 
  | 'healer_hut' 
  | 'storage';

export interface Building {
  id: string;
  name: string;
  familyName?: string;
  type: SettlementBuildingType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  roofColor?: string;
  shutterColor?: string;
  icon: string;
  door: { x: number; y: number };
  description: string;
  
  // Dynamic Construction Properties
  isConstructed: boolean;
  constructionProgress: number; // 0 - 100%
  builderId?: string;
  ownerIds: string[];
  maxResidents?: number;
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export type GodPowerType = 
  | 'none'
  | 'lightning' 
  | 'cupid' 
  | 'discord' 
  | 'drop_cash' 
  | 'drop_weapon' 
  | 'drop_food' 
  | 'tranquility' 
  | 'resurrect' 
  | 'smite' 
  | 'rain' 
  | 'possess' 
  | 'inspect'
  | 'build_homestead'
  | 'create_house'
  | 'move_house'
  | 'destroy_house'
  | 'plant_tree'
  | 'remove_tree'
  | 'spawn_settler';

export interface DramaEvent {
  id: string;
  timeString: string;
  category: 'love' | 'violence' | 'crime' | 'miracle' | 'work' | 'general' | 'dialog';
  text: string;
  agentIds: string[];
}

export interface SettlementStockpile {
  wood: number;
  food: number;
  fish: number;
  water: number;
}
