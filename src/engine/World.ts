import type {
  Building,
  WorldItem,
  ItemType,
  ForestTree,
  BerryBush,
  RiverFish,
  Campfire,
  SettlementStockpile,
  WeatherType,
  RoadSegment,
  WildlifeAnimal,
  TreeStage,
  TreeVariant,
  SpecialEffect,
  NatureElement,
  NatureCategory,
  Pond,
  PondFish,
  PondFishColor
} from '../types/simulation';
import { WildlifeSystem } from './WildlifeSystem';
import type { Agent } from './Agent';

export class World {
  public width = 2800;
  public height = 1800;
  public weather: WeatherType = 'sunny';
  public buildings: Building[] = [];
  public items: WorldItem[] = [];
  public roads: RoadSegment[] = [];

  // Forest Living Resources
  public trees: ForestTree[] = [];
  public berryBushes: BerryBush[] = [];
  public natureElements: NatureElement[] = [];
  public riverFish: RiverFish[] = [];
  public ponds: Pond[] = [];
  public campfire: Campfire = { x: 1150, y: 850, intensity: 1.0, view: 'front', state: 'auto', fuel: 100 };
  public wildlife: WildlifeSystem;

  public get animals(): WildlifeAnimal[] {
    return this.wildlife.animals;
  }

  public getAnimalAt(x: number, y: number, radius?: number): WildlifeAnimal | undefined {
    return this.wildlife.getAnimalAt(x, y, radius);
  }

  public specialEffects: SpecialEffect[] = [];

  public spawnSpecialEffect(
    type: 'lightning' | 'heart_burst' | 'smoke' | 'sparkle' | 'arrow',
    x: number,
    y: number,
    targetX?: number,
    targetY?: number,
    duration = 0.5
  ): void {
    this.specialEffects.push({
      type,
      x,
      y,
      targetX,
      targetY,
      timer: duration,
      maxTimer: duration
    });
  }

  public removeAnimal(animalId: string): WildlifeAnimal | null {
    const idx = this.wildlife.animals.findIndex(a => a.id === animalId);
    if (idx !== -1) {
      return this.wildlife.animals.splice(idx, 1)[0];
    }
    return null;
  }

  // Settlement Stockpile
  public stockpile: SettlementStockpile = {
    wood: 60,
    food: 80,
    fish: 25,
    water: 20
  };

  constructor() {
    this.initBuildings();
    this.initPonds();
    this.initRoads();
    this.initForestNature();
    this.initRiverFish();
    this.initDefaultItems();
    this.wildlife = new WildlifeSystem(this);
  }

  private initBuildings(): void {
    this.buildings = [
      // 1. Communal Hubs
      {
        id: 'storehouse',
        name: 'Grand Timber Storehouse',
        type: 'storage',
        x: 950,
        y: 420,
        width: 220,
        height: 160,
        color: '#78350f',
        icon: '📦',
        door: { x: 1060, y: 580 },
        description: 'Central storehouse holding building logs, dried meats, fish, and winter reserves.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: []
      },
      {
        id: 'hearth',
        name: 'Great Hearth & Communal Kitchen',
        type: 'hearth',
        x: 1050,
        y: 660,
        width: 260,
        height: 160,
        color: '#b45309',
        icon: '🍲',
        door: { x: 1180, y: 820 },
        description: 'The social heart of the forest settlement with a great stone fire, stew pots, and wooden tables.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: []
      },
      {
        id: 'lumber_camp',
        name: "Northwood Lumber Yard",
        type: 'lumber_camp',
        x: 280,
        y: 220,
        width: 240,
        height: 180,
        color: '#854d0e',
        icon: '🪓',
        door: { x: 400, y: 400 },
        description: 'Logging headquarters with splitting blocks, sawmills, and stacked lumber piles.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: []
      },
      {
        id: 'healer_hut',
        name: "Herbalist & Healer's Sanctuary",
        type: 'healer_hut',
        x: 1280,
        y: 380,
        width: 200,
        height: 160,
        color: '#065f46',
        icon: '🌿',
        door: { x: 1380, y: 540 },
        description: 'Sanctuary with drying mountain herbs, soothing poultices, and recovery beds.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: []
      },
      {
        id: 'dock_north',
        name: 'North River Pier',
        type: 'dock',
        x: 1620,
        y: 320,
        width: 140,
        height: 150,
        color: '#a16207',
        icon: '🎣',
        door: { x: 1630, y: 400 },
        description: 'Sturdy wooden dock projecting over deep river currents, perfect for fishing.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: []
      },

      // 2. Family Homesteads & Houses
      {
        id: 'cabin_vance',
        name: 'The Vance Homestead',
        familyName: 'Vance',
        type: 'cabin',
        x: 480,
        y: 520,
        width: 200,
        height: 160,
        color: '#713f12',
        icon: '🏡',
        door: { x: 580, y: 680 },
        description: 'The handcrafted log home of the Vance family, featuring firewood porches and flowerboxes.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: ['agent_rowan', 'agent_leo'],
        maxResidents: 5
      },
      {
        id: 'cabin_thorne',
        name: 'The Thorne Family Cottage',
        familyName: 'Thorne',
        type: 'cabin',
        x: 580,
        y: 1040,
        width: 190,
        height: 150,
        color: '#14532d',
        icon: '🛖',
        door: { x: 675, y: 1190 },
        description: 'A cozy herbal cottage surrounded by berry patches and climbing ivy.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: ['agent_talia'],
        maxResidents: 5
      },
      {
        id: 'cabin_gale',
        name: 'Gale Riverside Lodge',
        familyName: 'Gale',
        type: 'cabin',
        x: 1940,
        y: 460,
        width: 210,
        height: 160,
        color: '#0369a1',
        icon: '🏡',
        door: { x: 2045, y: 620 },
        description: 'A tranquil riverfront lodge on the eastern bluffs, with nets and scenic water views.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: ['agent_finn'],
        maxResidents: 5
      },
      {
        id: 'cabin_sol',
        name: 'Sol Hearth House',
        familyName: 'Sol',
        type: 'cabin',
        x: 880,
        y: 920,
        width: 190,
        height: 150,
        color: '#9a3412',
        icon: '🛖',
        door: { x: 975, y: 1070 },
        description: 'Warm timber home infused with roasted spices, bread scents, and stone oven warmth.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: ['agent_aria', 'agent_ivy'],
        maxResidents: 5
      },
      {
        id: 'cabin_stone',
        name: 'Stone Guard Watchhouse',
        familyName: 'Stone',
        type: 'cabin',
        x: 1820,
        y: 1120,
        width: 200,
        height: 160,
        color: '#3f3f46',
        icon: '🏹',
        door: { x: 1920, y: 1280 },
        description: 'Sturdy oak watchhouse on the eastern ridge overlooking the southern stone bridge.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: ['agent_kaelen', 'agent_clara', 'agent_toby'],
        maxResidents: 5
      },
      {
        id: 'cabin_bron',
        name: "Elder Bron's Longhouse",
        familyName: 'Bron',
        type: 'cabin',
        x: 1140,
        y: 1020,
        width: 230,
        height: 170,
        color: '#581c87',
        icon: '🏛️',
        door: { x: 1255, y: 1190 },
        description: 'Spacious longhouse with carved totems, where community elders sleep and hold council.',
        isConstructed: true,
        constructionProgress: 100,
        ownerIds: ['agent_bron'],
        maxResidents: 5
      }
    ];
  }

  private initRoads(): void {
    // 1. Primary Settlement Trunk Trails (Connecting hubs, clearings, and bridges)
    this.roads = [
      // West Bank Trunk Network
      { id: 'trunk_lumber_vance', x1: 400, y1: 390, x2: 580, y2: 600 },
      { id: 'trunk_vance_square', x1: 580, y1: 600, x2: 1050, y2: 720 },
      { id: 'trunk_square_hearth', x1: 1050, y1: 720, x2: 1150, y2: 850 },
      { id: 'trunk_hearth_north_bridge', x1: 1150, y1: 850, x2: 1650, y2: 530 },
      { id: 'trunk_hearth_south_bridge', x1: 1150, y1: 850, x2: 1500, y2: 1235 },
      { id: 'trunk_hearth_thorne', x1: 1150, y1: 850, x2: 670, y2: 1100 },
      
      // East Bank Trunk Network
      { id: 'trunk_north_bridge_gale', x1: 1650, y1: 530, x2: 2040, y2: 540 },
      { id: 'trunk_south_bridge_stone', x1: 1620, y1: 1235, x2: 1860, y2: 1220 },
      { id: 'trunk_stone_gale_ridge', x1: 1860, y1: 1220, x2: 2040, y2: 540 },

      // Initial Homestead & Hub Road Connections
      { id: 'road_lumber_camp', x1: 400, y1: 400, x2: 400, y2: 390, buildingId: 'lumber_camp' },
      { id: 'road_cabin_vance', x1: 580, y1: 680, x2: 580, y2: 600, buildingId: 'cabin_vance' },
      { id: 'road_storehouse', x1: 1060, y1: 580, x2: 1050, y2: 720, buildingId: 'storehouse' },
      { id: 'road_hearth', x1: 1180, y1: 820, x2: 1150, y2: 850, buildingId: 'hearth' },
      { id: 'road_healer_hut', x1: 1380, y1: 540, x2: 1350, y2: 620, buildingId: 'healer_hut' },
      { id: 'road_dock_north', x1: 1630, y1: 400, x2: 1650, y2: 530, buildingId: 'dock_north' },
      { id: 'road_cabin_thorne', x1: 675, y1: 1190, x2: 670, y2: 1100, buildingId: 'cabin_thorne' },
      { id: 'road_cabin_sol', x1: 975, y1: 1070, x2: 1050, y2: 920, buildingId: 'cabin_sol' },
      { id: 'road_cabin_bron', x1: 1255, y1: 1190, x2: 1150, y2: 950, buildingId: 'cabin_bron' },
      { id: 'road_cabin_gale', x1: 2045, y1: 620, x2: 2040, y2: 540, buildingId: 'cabin_gale' },
      { id: 'road_cabin_stone', x1: 1920, y1: 1280, x2: 1860, y2: 1220, buildingId: 'cabin_stone' },
      // Scenic Meandering Trail down to the Lotus Pond
      { id: 'trail_pastoral_pond', x1: 670, y1: 1100, x2: 540, y2: 1300 }
    ];
  }

  /**
   * Finds the closest valid road connection point for a given door location.
   * Guarantees the connecting road does not cross river water or sandstone cliffs.
   */
  public findRoadConnectionPoint(startX: number, startY: number, excludeBuildingId?: string): { x: number; y: number } {
    const houseSide = this.getRiverSide(startX, startY);
    let bestPoint: { x: number; y: number } | null = null;
    let bestDist = Infinity;

    for (const seg of this.roads) {
      if (excludeBuildingId && seg.buildingId === excludeBuildingId) continue;

      const s1 = this.getRiverSide(seg.x1, seg.y1);
      const s2 = this.getRiverSide(seg.x2, seg.y2);

      // Must be on the same bank of the river
      if (houseSide === 'west' && s1 === 'east' && s2 === 'east') continue;
      if (houseSide === 'east' && s1 === 'west' && s2 === 'west') continue;

      // Closest point on segment
      const dx = seg.x2 - seg.x1;
      const dy = seg.y2 - seg.y1;
      const lenSq = dx * dx + dy * dy;
      let t = 0.5;
      if (lenSq > 0) {
        t = Math.max(0, Math.min(1, ((startX - seg.x1) * dx + (startY - seg.y1) * dy) / lenSq));
      }
      const px = seg.x1 + t * dx;
      const py = seg.y1 + t * dy;

      // 1. Water clearance check: Line from door to connection point must NOT touch river water
      let crossesWater = false;
      for (let step = 1; step <= 8; step++) {
        const tx = startX + (px - startX) * (step / 9);
        const ty = startY + (py - startY) * (step / 9);
        if (this.isWater(tx, ty, 8)) {
          crossesWater = true;
          break;
        }
      }
      if (crossesWater) continue;

      // 2. Sandstone Cliff Clearance (y: 240 to 318)
      const crossesCliff = (startY < 240 && py > 318) || (startY > 318 && py < 240);
      if (crossesCliff) continue;

      const dist = Math.hypot(px - startX, py - startY);
      if (dist < bestDist) {
        bestDist = dist;
        bestPoint = { x: px, y: py };
      }
    }

    if (bestPoint) return bestPoint;

    // Fallback 1: If above cliff (y < 240), route to the nearest stair top
    if (startY < 240) {
      const stairX = houseSide === 'east' ? 2050 : (startX < 850 ? 580 : 1150);
      return { x: stairX, y: 235 };
    }

    // Fallback 2: Connect to primary bank landmark
    if (houseSide === 'east') {
      return { x: 1735, y: 535 }; // North Bridge East Landing
    } else {
      return { x: 1150, y: 850 }; // Central Campfire
    }
  }

  /**
   * Connects a new or relocated building's door to the road network automatically.
   */
  public connectBuildingWithRoad(building: Building): RoadSegment {
    // 1. Remove any previous road segments linked to this building
    this.removeRoadsForBuilding(building.id);

    const startX = building.door.x;
    const startY = building.door.y;
    const target = this.findRoadConnectionPoint(startX, startY, building.id);

    // Calculate a soft, organic midpoint curve for natural hand-carved look
    const midX = (startX + target.x) / 2;
    const midY = (startY + target.y) / 2;
    const normalX = -(target.y - startY);
    const normalY = target.x - startX;
    const normLen = Math.hypot(normalX, normalY) || 1;
    const curveOffset = Math.min(20, normLen * 0.08) * (Math.sin(startX * 0.015 + startY * 0.02) > 0 ? 1 : -1);
    const ctrlX = midX + (normalX / normLen) * curveOffset;
    const ctrlY = midY + (normalY / normLen) * curveOffset;
    const validCtrl = !this.isWater(ctrlX, ctrlY, 12);

    const newRoad: RoadSegment = {
      id: `road_${building.id}_${Date.now()}`,
      x1: startX,
      y1: startY,
      x2: target.x,
      y2: target.y,
      controlPoint: validCtrl ? { x: ctrlX, y: ctrlY } : undefined,
      buildingId: building.id
    };

    this.roads.push(newRoad);
    return newRoad;
  }

  /**
   * Removes any road spurs associated with a specific demolished house.
   */
  public removeRoadsForBuilding(buildingId: string): void {
    this.roads = this.roads.filter(r => r.buildingId !== buildingId);
  }

  /**
   * Checks if a point is within walking distance of any paved road/trail.
   */
  public isOnRoad(x: number, y: number, tolerance = 24): boolean {
    for (const r of this.roads) {
      const dx = r.x2 - r.x1;
      const dy = r.y2 - r.y1;
      const lenSq = dx * dx + dy * dy;
      let t = 0.5;
      if (lenSq > 0) {
        t = Math.max(0, Math.min(1, ((x - r.x1) * dx + (y - r.y1) * dy) / lenSq));
      }
      const px = r.x1 + t * dx;
      const py = r.y1 + t * dy;
      if (Math.hypot(x - px, y - py) <= tolerance) {
        return true;
      }
    }
    return false;
  }

  private initForestNature(): void {
    // 80+ Forest Trees scattered realistically across the 2800x1800 expanse,
    // with a concentrated Whispering Wildlife Sanctuary in the South-East Corner
    const treeCoords = [
      // Deep western lumber woods
      { x: 120, y: 140 }, { x: 220, y: 100 }, { x: 160, y: 300 }, { x: 80, y: 460 },
      { x: 190, y: 580 }, { x: 120, y: 720 }, { x: 240, y: 840 }, { x: 140, y: 980 },
      { x: 260, y: 1120 }, { x: 180, y: 1280 }, { x: 120, y: 1450 }, { x: 280, y: 1580 },
      { x: 200, y: 1700 }, { x: 380, y: 1650 }, { x: 520, y: 1720 },
      // North-west clearings
      { x: 420, y: 120 }, { x: 560, y: 180 }, { x: 680, y: 90 }, { x: 820, y: 160 },
      { x: 960, y: 110 }, { x: 1120, y: 160 }, { x: 1280, y: 120 }, { x: 1440, y: 170 },
      // Central forest borders
      { x: 740, y: 440 }, { x: 860, y: 320 }, { x: 760, y: 760 }, { x: 840, y: 1260 },
      { x: 700, y: 1440 }, { x: 880, y: 1560 }, { x: 1040, y: 1420 }, { x: 1160, y: 1620 },
      // Eastern wilderness across river
      { x: 1880, y: 160 }, { x: 2020, y: 110 }, { x: 2180, y: 170 }, { x: 2340, y: 130 },
      { x: 2500, y: 220 }, { x: 2660, y: 180 }, { x: 1840, y: 760 }, { x: 2140, y: 680 },
      { x: 2320, y: 560 }, { x: 2520, y: 640 }, { x: 2240, y: 880 }, { x: 2440, y: 980 },
      { x: 2640, y: 860 }, { x: 1980, y: 1140 }, { x: 2180, y: 1220 }, { x: 2360, y: 1120 },
      { x: 2580, y: 1280 }, { x: 1880, y: 1420 }, { x: 2060, y: 1540 }, { x: 2280, y: 1460 },
      { x: 2460, y: 1620 }, { x: 2660, y: 1520 }, { x: 2540, y: 1720 },
      // South-East Whispering Sanctuary Forest Corner (Dense Ancient Grove)
      { x: 2180, y: 1300 }, { x: 2320, y: 1260 }, { x: 2480, y: 1320 }, { x: 2650, y: 1280 },
      { x: 2240, y: 1420 }, { x: 2400, y: 1460 }, { x: 2580, y: 1420 }, { x: 2710, y: 1450 },
      { x: 2160, y: 1560 }, { x: 2340, y: 1580 }, { x: 2520, y: 1590 }, { x: 2680, y: 1580 },
      { x: 2260, y: 1700 }, { x: 2420, y: 1710 }, { x: 2600, y: 1700 }, { x: 2720, y: 1680 },
      // Scenic Riverbank Trees (Willows & Tropical Palms along the water edges)
      { x: 1510, y: 240 }, { x: 1780, y: 260 }, { x: 1490, y: 680 }, { x: 1790, y: 720 },
      { x: 1520, y: 980 }, { x: 1780, y: 1020 }, { x: 1500, y: 1380 }, { x: 1790, y: 1410 },
      { x: 1520, y: 1600 }, { x: 1780, y: 1630 }
    ];

    for (let i = 0; i < treeCoords.length; i++) {
      const coord = treeCoords[i];
      const rc = this.getRiverCenterX(coord.y);
      const distToRiver = Math.abs(coord.x - rc);

      let variant: TreeVariant;
      if (distToRiver < 180) {
        // Riverbanks: Willow (12), Mangrove (16), Palm (11), Bamboo (17)
        const riverVariants: TreeVariant[] = [12, 16, 11, 17, 12, 16];
        variant = riverVariants[i % riverVariants.length];
      } else if (coord.x >= 2100 && coord.y >= 1200) {
        // Whispering Sanctuary: Large Tree (2), Blooming Tree (10), Cherry Tree (8), Rocky Tree (15), Autumn Tree (9)
        const sanctuaryVariants: TreeVariant[] = [2, 10, 8, 15, 9, 2];
        variant = sanctuaryVariants[i % sanctuaryVariants.length];
      } else if (coord.x <= 550) {
        // Western lumber timberland: Pine Tree (4), Snow Pine (5), Tall Slim (3), Birch (13), Autumn (9)
        const westVariants: TreeVariant[] = [4, 5, 3, 13, 9, 4];
        variant = westVariants[i % westVariants.length];
      } else {
        // General landscape & settlement orchards: Small, Medium, Large, Apple, Orange, Cherry, Autumn, Willow, Birch
        const generalVariants: TreeVariant[] = [0, 1, 2, 6, 7, 8, 9, 13, 15, 3];
        variant = generalVariants[i % generalVariants.length];
      }

      const stages: TreeStage[] = (coord.x >= 2100 && coord.y >= 1200)
        ? ['ancient', 'mature', 'ancient', 'mature']
        : ['mature', 'mature', 'ancient', 'young'];
      const stage = stages[i % stages.length];
      const health = stage === 'ancient' ? 140 : stage === 'young' ? 65 : 100;
      this.trees.push({
        id: `tree_${i}`,
        x: coord.x + (Math.random() * 20 - 10),
        y: coord.y + (Math.random() * 20 - 10),
        woodHealth: health,
        maxWoodHealth: health,
        regrowTimer: 0,
        shakeTimer: 0,
        variant,
        stage,
        age: stage === 'ancient' ? 750 + Math.random() * 150 : 150 + Math.random() * 250,
        maxLifespan: 900 + Math.random() * 500,
        seedTimer: 45 + Math.random() * 60
      });
    }

    // 28+ Berry Bushes (including clusters in the South-East Wildlife Sanctuary)
    const berryCoords = [
      { x: 380, y: 720 }, { x: 440, y: 780 }, { x: 390, y: 860 },
      { x: 480, y: 1160 }, { x: 540, y: 1220 }, { x: 470, y: 1300 },
      { x: 740, y: 600 }, { x: 820, y: 560 }, { x: 920, y: 840 },
      { x: 1360, y: 680 }, { x: 1460, y: 760 }, { x: 1400, y: 860 },
      { x: 1860, y: 880 }, { x: 1940, y: 940 }, { x: 2040, y: 840 },
      { x: 1780, y: 1360 }, { x: 1860, y: 1440 }, { x: 2120, y: 1380 },
      // South-East Sanctuary bushes
      { x: 2220, y: 1360 }, { x: 2380, y: 1340 }, { x: 2540, y: 1380 },
      { x: 2300, y: 1520 }, { x: 2480, y: 1530 }, { x: 2640, y: 1500 },
      // Riverbank Foraging Bushes (Rich fruit bushes rooted along both sides of the river)
      { x: Math.round(this.getRiverCenterX(180) - 86), y: 180 },
      { x: Math.round(this.getRiverCenterX(340) + 86), y: 340 },
      { x: Math.round(this.getRiverCenterX(680) - 86), y: 680 },
      { x: Math.round(this.getRiverCenterX(840) + 86), y: 840 },
      { x: Math.round(this.getRiverCenterX(1020) - 86), y: 1020 },
      { x: Math.round(this.getRiverCenterX(1360) + 86), y: 1360 },
      { x: Math.round(this.getRiverCenterX(1520) - 86), y: 1520 },
      { x: Math.round(this.getRiverCenterX(1680) + 86), y: 1680 }
    ];

    for (let i = 0; i < berryCoords.length; i++) {
      this.berryBushes.push({
        id: `bush_${i}`,
        x: berryCoords[i].x,
        y: berryCoords[i].y,
        hasBerries: true,
        regrowTimer: 0,
        stage: 'fruiting',
        age: 100 + Math.random() * 150,
        maxLifespan: 450 + Math.random() * 250,
        seedTimer: 40 + Math.random() * 50
      });
    }

    // Initialize rich authentic nature assets across biomes and along riverbanks
    this.initNatureElements();
  }

  /**
   * Initializes 200+ authentic handcrafted nature elements across all biomes,
   * with special dense clusters of bushes, reeds, rocks, and flowers along the riverbanks.
   */
  private initNatureElements(): void {
    this.natureElements = [];

    const addElement = (
      type: string,
      category: NatureCategory,
      x: number,
      y: number,
      scale = 0.65,
      flipX = false
    ) => {
      if (x < 30 || x > this.width - 30 || y < 30 || y > this.height - 30) return;
      if (this.isWater(x, y, 6)) return;
      for (const b of this.buildings) {
        if (x >= b.x - 14 && x <= b.x + b.width + 14 && y >= b.y - 14 && y <= b.y + b.height + 14) {
          return;
        }
      }
      for (const p of this.ponds) {
        if (x >= p.x - 10 && x <= p.x + p.width + 10 && y >= p.y - 10 && y <= p.y + p.height + 10) {
          return;
        }
      }
      this.natureElements.push({
        id: `nature_${this.natureElements.length}`,
        type,
        category,
        x: Math.round(x),
        y: Math.round(y),
        scale,
        flipX
      });
    };

    // 1. DENSE RIVERBANK NATURE & BUSHES (West & East Riverbanks from top to bottom)
    const riverYPoints = [
      70, 110, 150, 190, 230, 270, 310, 350, 390, 430,
      610, 650, 690, 730, 770, 810, 850, 890, 930, 970, 1010, 1050, 1090, 1130,
      1310, 1350, 1390, 1430, 1470, 1510, 1550, 1590, 1630, 1670, 1710
    ];

    const westBankItems: { type: string; cat: NatureCategory; scale: number }[] = [
      { type: 'bush_leafy', cat: 'bush', scale: 0.72 },
      { type: 'tall_grass_large', cat: 'tall_grass', scale: 0.70 },
      { type: 'moss_rock_large', cat: 'moss', scale: 0.62 },
      { type: 'bush_grassy', cat: 'bush', scale: 0.70 },
      { type: 'pebble_cluster', cat: 'misc', scale: 0.65 },
      { type: 'fern_large', cat: 'fern', scale: 0.70 },
      { type: 'bush_berry', cat: 'bush', scale: 0.72 },
      { type: 'flower_bluebell', cat: 'flower', scale: 0.65 },
      { type: 'log_mossy', cat: 'log', scale: 0.60 },
      { type: 'bush_leafy', cat: 'bush', scale: 0.75 },
      { type: 'pebble_1', cat: 'pebble', scale: 0.65 },
      { type: 'tall_grass_medium', cat: 'tall_grass', scale: 0.68 },
      { type: 'plant_fern', cat: 'plant', scale: 0.70 },
      { type: 'bush_grassy', cat: 'bush', scale: 0.70 },
      { type: 'stump_mossy', cat: 'stump', scale: 0.65 },
      { type: 'rock_medium_3', cat: 'rock', scale: 0.62 },
      { type: 'bush_berry', cat: 'bush', scale: 0.72 },
      { type: 'flower_buttercup', cat: 'flower', scale: 0.65 },
      { type: 'leaf_willow', cat: 'leaf', scale: 0.65 },
      { type: 'fern_medium', cat: 'fern', scale: 0.68 },
      { type: 'bush_leafy', cat: 'bush', scale: 0.70 },
      { type: 'moss_rock_medium', cat: 'moss', scale: 0.62 },
      { type: 'tall_grass_small', cat: 'tall_grass', scale: 0.68 },
      { type: 'plant_daisy', cat: 'plant', scale: 0.65 },
      { type: 'leaves_scatter', cat: 'leaves_pile', scale: 0.65 },
      { type: 'pebble_3', cat: 'pebble', scale: 0.65 },
      { type: 'bush_grassy', cat: 'bush', scale: 0.72 },
      { type: 'branch_leafy', cat: 'branch', scale: 0.65 }
    ];

    const eastBankItems: { type: string; cat: NatureCategory; scale: number }[] = [
      { type: 'bush_grassy', cat: 'bush', scale: 0.70 },
      { type: 'fern_medium', cat: 'fern', scale: 0.68 },
      { type: 'bush_leafy', cat: 'bush', scale: 0.72 },
      { type: 'rock_medium_2', cat: 'rock', scale: 0.62 },
      { type: 'tall_grass_large', cat: 'tall_grass', scale: 0.70 },
      { type: 'bush_berry', cat: 'bush', scale: 0.72 },
      { type: 'moss_rock_medium', cat: 'moss', scale: 0.65 },
      { type: 'flower_daisy', cat: 'flower', scale: 0.65 },
      { type: 'plant_clover', cat: 'plant', scale: 0.65 },
      { type: 'bush_leafy', cat: 'bush', scale: 0.74 },
      { type: 'tall_grass_medium', cat: 'tall_grass', scale: 0.68 },
      { type: 'pebble_cluster', cat: 'misc', scale: 0.65 },
      { type: 'fern_large', cat: 'fern', scale: 0.72 },
      { type: 'bush_grassy', cat: 'bush', scale: 0.70 },
      { type: 'pebble_2', cat: 'pebble', scale: 0.65 },
      { type: 'flower_bluebell', cat: 'flower', scale: 0.65 },
      { type: 'log_cut', cat: 'log', scale: 0.60 },
      { type: 'bush_leafy', cat: 'bush', scale: 0.72 },
      { type: 'tall_grass_large', cat: 'tall_grass', scale: 0.70 },
      { type: 'bush_berry', cat: 'bush', scale: 0.70 },
      { type: 'leaf_willow', cat: 'leaf', scale: 0.65 },
      { type: 'fern_small', cat: 'fern', scale: 0.65 },
      { type: 'moss_mound', cat: 'moss', scale: 0.65 },
      { type: 'plant_fern', cat: 'plant', scale: 0.70 },
      { type: 'bush_grassy', cat: 'bush', scale: 0.72 },
      { type: 'pebble_4', cat: 'pebble', scale: 0.65 },
      { type: 'flower_buttercup', cat: 'flower', scale: 0.65 },
      { type: 'bush_leafy', cat: 'bush', scale: 0.72 }
    ];

    for (let i = 0; i < riverYPoints.length; i++) {
      const ry = riverYPoints[i];
      const rc = this.getRiverCenterX(ry);

      // West riverbank element (bushes, tall reeds, pebbles, ferns)
      const wDef = westBankItems[i % westBankItems.length];
      const wOffset = 78 + (i % 4) * 9;
      addElement(wDef.type, wDef.cat, rc - wOffset, ry, wDef.scale, i % 2 === 1);

      // East riverbank element
      const eDef = eastBankItems[i % eastBankItems.length];
      const eOffset = 78 + ((i + 2) % 4) * 9;
      addElement(eDef.type, eDef.cat, rc + eOffset, ry + 12, eDef.scale, i % 2 === 0);
    }

    // 2. SOUTH-EAST WHISPERING WILDLIFE SANCTUARY (Mystical Ancient Woodland Grove)
    const sanctuaryItems: { type: string; cat: NatureCategory; x: number; y: number; scale?: number }[] = [
      { type: 'moss_rock_large', cat: 'moss', x: 2150, y: 1320, scale: 0.70 },
      { type: 'mushroom_purple', cat: 'mushroom', x: 2190, y: 1340, scale: 0.70 },
      { type: 'leaves_pile_large', cat: 'leaves_pile', x: 2280, y: 1290, scale: 0.68 },
      { type: 'fern_large', cat: 'fern', x: 2360, y: 1310, scale: 0.72 },
      { type: 'mushroom_white', cat: 'mushroom', x: 2430, y: 1280, scale: 0.70 },
      { type: 'log_mossy', cat: 'log', x: 2510, y: 1330, scale: 0.65 },
      { type: 'mushroom_chanterelle', cat: 'mushroom', x: 2610, y: 1310, scale: 0.68 },
      { type: 'moss_mound', cat: 'moss', x: 2690, y: 1330, scale: 0.65 },
      { type: 'pinecone', cat: 'misc', x: 2210, y: 1410, scale: 0.65 },
      { type: 'mushroom_red_1', cat: 'mushroom', x: 2270, y: 1440, scale: 0.65 },
      { type: 'stump_mossy', cat: 'stump', x: 2350, y: 1420, scale: 0.65 },
      { type: 'fern_medium', cat: 'fern', x: 2440, y: 1450, scale: 0.68 },
      { type: 'acorn', cat: 'misc', x: 2490, y: 1430, scale: 0.65 },
      { type: 'sapling_pine', cat: 'misc', x: 2550, y: 1460, scale: 0.68 },
      { type: 'leaves_pile_medium', cat: 'leaves_pile', x: 2630, y: 1430, scale: 0.65 },
      { type: 'mushroom_red_2', cat: 'mushroom', x: 2700, y: 1470, scale: 0.65 },
      { type: 'moss_rock_medium', cat: 'moss', x: 2170, y: 1540, scale: 0.65 },
      { type: 'grass_large', cat: 'grass', x: 2250, y: 1570, scale: 0.70 },
      { type: 'mushroom_brown_1', cat: 'mushroom', x: 2330, y: 1550, scale: 0.68 },
      { type: 'leaf_fern', cat: 'leaf', x: 2410, y: 1590, scale: 0.65 },
      { type: 'feather', cat: 'misc', x: 2470, y: 1560, scale: 0.65 },
      { type: 'fern_large', cat: 'fern', x: 2570, y: 1580, scale: 0.70 },
      { type: 'leaves_scatter', cat: 'leaves_pile', x: 2660, y: 1560, scale: 0.65 },
      { type: 'mushroom_purple', cat: 'mushroom', x: 2220, y: 1680, scale: 0.70 },
      { type: 'stump_mossy', cat: 'stump', x: 2310, y: 1690, scale: 0.65 },
      { type: 'moss_rock_large', cat: 'moss', x: 2400, y: 1690, scale: 0.68 },
      { type: 'pinecone', cat: 'misc', x: 2480, y: 1710, scale: 0.65 },
      { type: 'mushroom_white', cat: 'mushroom', x: 2580, y: 1680, scale: 0.70 },
      { type: 'log_mossy', cat: 'log', x: 2680, y: 1700, scale: 0.65 }
    ];
    for (const it of sanctuaryItems) {
      addElement(it.type, it.cat, it.x, it.y, it.scale);
    }

    // 3. WESTERN TIMBERLAND (Lumber Woods, Logs, Stumps, Branches, Forest Fungi)
    const timberItems: { type: string; cat: NatureCategory; x: number; y: number; scale?: number }[] = [
      { type: 'log_cut', cat: 'log', x: 140, y: 190, scale: 0.65 },
      { type: 'stump_mossy', cat: 'stump', x: 240, y: 150, scale: 0.65 },
      { type: 'branch_leafy', cat: 'branch', x: 190, y: 340, scale: 0.65 },
      { type: 'mushroom_red_1', cat: 'mushroom', x: 110, y: 410, scale: 0.65 },
      { type: 'rock_large_3', cat: 'rock', x: 270, y: 470, scale: 0.65 },
      { type: 'log_slice', cat: 'log', x: 150, y: 550, scale: 0.65 },
      { type: 'branch_stick', cat: 'branch', x: 230, y: 640, scale: 0.65 },
      { type: 'stump_small', cat: 'stump', x: 130, y: 760, scale: 0.65 },
      { type: 'mushroom_brown_small', cat: 'mushroom', x: 210, y: 810, scale: 0.65 },
      { type: 'branch_twig', cat: 'branch', x: 280, y: 890, scale: 0.65 },
      { type: 'leaf_oak', cat: 'leaf', x: 160, y: 940, scale: 0.65 },
      { type: 'rock_medium_2', cat: 'rock', x: 110, y: 1040, scale: 0.65 },
      { type: 'log_mossy', cat: 'log', x: 220, y: 1080, scale: 0.65 },
      { type: 'mushroom_red_3', cat: 'mushroom', x: 270, y: 1180, scale: 0.65 },
      { type: 'branch_medium', cat: 'branch', x: 150, y: 1240, scale: 0.65 },
      { type: 'leaf_maple', cat: 'leaf', x: 230, y: 1330, scale: 0.65 },
      { type: 'stump_mossy', cat: 'stump', x: 140, y: 1410, scale: 0.65 },
      { type: 'branch_small', cat: 'branch', x: 240, y: 1490, scale: 0.65 },
      { type: 'log_cut', cat: 'log', x: 160, y: 1560, scale: 0.65 },
      { type: 'pinecone', cat: 'misc', x: 250, y: 1640, scale: 0.65 },
      { type: 'rock_medium_3', cat: 'rock', x: 330, y: 1680, scale: 0.65 },
      { type: 'bush_leafy', cat: 'bush', x: 440, y: 1620, scale: 0.70 }
    ];
    for (const it of timberItems) {
      addElement(it.type, it.cat, it.x, it.y, it.scale);
    }

    // 4. PASTORAL MEADOWS & SETTLEMENT VALLEYS (Grasslands, Flowers, Daisies, Clovers, Bushes)
    const meadowItems: { type: string; cat: NatureCategory; x: number; y: number; scale?: number }[] = [
      { type: 'flower_daisy', cat: 'flower', x: 490, y: 160, scale: 0.65 },
      { type: 'plant_clover', cat: 'plant', x: 620, y: 140, scale: 0.65 },
      { type: 'grass_medium', cat: 'grass', x: 750, y: 110, scale: 0.68 },
      { type: 'flower_buttercup', cat: 'flower', x: 890, y: 150, scale: 0.65 },
      { type: 'bush_grassy', cat: 'bush', x: 1040, y: 130, scale: 0.70 },
      { type: 'flower_bluebell', cat: 'flower', x: 1190, y: 170, scale: 0.65 },
      { type: 'grass_small', cat: 'grass', x: 1330, y: 130, scale: 0.65 },
      { type: 'flower_daisy_small', cat: 'flower', x: 1470, y: 160, scale: 0.65 },
      { type: 'plant_daisy', cat: 'plant', x: 460, y: 350, scale: 0.65 },
      { type: 'pebble_1', cat: 'pebble', x: 690, y: 320, scale: 0.65 },
      { type: 'bush_leafy', cat: 'bush', x: 820, y: 400, scale: 0.70 },
      { type: 'flower_clover', cat: 'flower', x: 670, y: 520, scale: 0.65 },
      { type: 'grass_large', cat: 'grass', x: 790, y: 690, scale: 0.68 },
      { type: 'flower_buttercup', cat: 'flower', x: 910, y: 770, scale: 0.65 },
      { type: 'feather', cat: 'misc', x: 1220, y: 780, scale: 0.65 },
      { type: 'leaf_green', cat: 'leaf', x: 1320, y: 710, scale: 0.65 },
      { type: 'flower_daisy', cat: 'flower', x: 640, y: 920, scale: 0.65 },
      { type: 'bush_grassy', cat: 'bush', x: 780, y: 980, scale: 0.70 },
      { type: 'flower_bluebell', cat: 'flower', x: 890, y: 1060, scale: 0.65 },
      { type: 'plant_clover', cat: 'plant', x: 1020, y: 1120, scale: 0.65 },
      { type: 'grass_medium', cat: 'grass', x: 1240, y: 1150, scale: 0.68 },
      { type: 'flower_clover', cat: 'flower', x: 1380, y: 1110, scale: 0.65 },
      { type: 'bush_leafy', cat: 'bush', x: 630, y: 1260, scale: 0.70 },
      { type: 'pebble_5', cat: 'pebble', x: 750, y: 1350, scale: 0.65 },
      { type: 'flower_daisy_small', cat: 'flower', x: 930, y: 1310, scale: 0.65 },
      { type: 'grass_small', cat: 'grass', x: 1110, y: 1350, scale: 0.65 },
      { type: 'leaf_golden', cat: 'leaf', x: 1270, y: 1320, scale: 0.65 },
      { type: 'flower_buttercup', cat: 'flower', x: 640, y: 1510, scale: 0.65 },
      { type: 'plant_daisy', cat: 'plant', x: 790, y: 1610, scale: 0.65 },
      { type: 'grass_large', cat: 'grass', x: 950, y: 1540, scale: 0.68 },
      { type: 'bush_grassy', cat: 'bush', x: 1100, y: 1590, scale: 0.70 },
      { type: 'flower_bluebell', cat: 'flower', x: 1260, y: 1560, scale: 0.65 }
    ];
    for (const it of meadowItems) {
      addElement(it.type, it.cat, it.x, it.y, it.scale);
    }

    // 5. EASTERN WILDERNESS & BLUFFS (Rock Formations, Highlands, Boulders, Shrubbery)
    const bluffItems: { type: string; cat: NatureCategory; x: number; y: number; scale?: number }[] = [
      { type: 'rock_large_1', cat: 'rock', x: 1940, y: 180, scale: 0.65 },
      { type: 'tall_grass_large', cat: 'tall_grass', x: 2070, y: 150, scale: 0.70 },
      { type: 'rock_medium_1', cat: 'rock', x: 2210, y: 220, scale: 0.65 },
      { type: 'bush_leafy', cat: 'bush', x: 2360, y: 180, scale: 0.70 },
      { type: 'rock_large_2', cat: 'rock', x: 2540, y: 250, scale: 0.65 },
      { type: 'pebble_6', cat: 'pebble', x: 2680, y: 220, scale: 0.65 },
      { type: 'leaf_elm', cat: 'leaf', x: 1890, y: 380, scale: 0.65 },
      { type: 'moss_rock_large', cat: 'moss', x: 2050, y: 390, scale: 0.65 },
      { type: 'rock_large_4', cat: 'rock', x: 2280, y: 370, scale: 0.65 },
      { type: 'tall_grass_medium', cat: 'tall_grass', x: 2460, y: 410, scale: 0.68 },
      { type: 'bush_grassy', cat: 'bush', x: 2620, y: 360, scale: 0.70 },
      { type: 'rock_medium_2', cat: 'rock', x: 1950, y: 580, scale: 0.65 },
      { type: 'pebble_cluster', cat: 'misc', x: 2110, y: 550, scale: 0.65 },
      { type: 'rock_large_3', cat: 'rock', x: 2250, y: 620, scale: 0.65 },
      { type: 'branch_medium', cat: 'branch', x: 2410, y: 590, scale: 0.65 },
      { type: 'moss_mound', cat: 'moss', x: 2590, y: 560, scale: 0.65 },
      { type: 'rock_medium_1', cat: 'rock', x: 1890, y: 770, scale: 0.65 },
      { type: 'tall_grass_large', cat: 'tall_grass', x: 2060, y: 790, scale: 0.70 },
      { type: 'leaf_ivy', cat: 'leaf', x: 2220, y: 740, scale: 0.65 },
      { type: 'rock_large_2', cat: 'rock', x: 2390, y: 780, scale: 0.65 },
      { type: 'pebble_7', cat: 'pebble', x: 2550, y: 750, scale: 0.65 },
      { type: 'bush_leafy', cat: 'bush', x: 2690, y: 790, scale: 0.70 },
      { type: 'rock_large_1', cat: 'rock', x: 1960, y: 990, scale: 0.65 },
      { type: 'moss_rock_medium', cat: 'moss', x: 2150, y: 970, scale: 0.65 },
      { type: 'rock_medium_3', cat: 'rock', x: 2310, y: 1040, scale: 0.65 },
      { type: 'tall_grass_medium', cat: 'tall_grass', x: 2470, y: 990, scale: 0.68 },
      { type: 'bush_grassy', cat: 'bush', x: 2650, y: 1020, scale: 0.70 },
      { type: 'rock_large_4', cat: 'rock', x: 2040, y: 1140, scale: 0.65 },
      { type: 'pebble_cluster', cat: 'misc', x: 2260, y: 1160, scale: 0.65 },
      { type: 'moss_rock_large', cat: 'moss', x: 2450, y: 1150, scale: 0.65 },
      { type: 'rock_medium_2', cat: 'rock', x: 2630, y: 1140, scale: 0.65 }
    ];
    for (const it of bluffItems) {
      addElement(it.type, it.cat, it.x, it.y, it.scale);
    }
  }

  private initPonds(): void {
    const pondWidth = 340;
    const pondHeight = 225;
    const px = 330;
    const py = 1308;
    const centerX = px + pondWidth / 2;
    const centerY = py + pondHeight / 2;

    const waterCenterX = Math.round(px + pondWidth * 0.4857);
    const waterCenterY = Math.round(py + pondHeight * 0.5944);
    const waterRadiusX = Math.round(pondWidth * 0.38);
    const waterRadiusY = Math.round(pondHeight * 0.25);

    // 8 Colorful Ornamental Koi Fish (Kohaku, Ogon, Showa/Calico, and Asagi)
    const fishDefs: { color: PondFishColor; size: number }[] = [
      { color: 'orange', size: 1.05 },
      { color: 'white_red', size: 1.0 },
      { color: 'gold', size: 0.95 },
      { color: 'calico', size: 1.0 },
      { color: 'blue_silver', size: 0.9 },
      { color: 'orange', size: 0.85 },
      { color: 'white_red', size: 0.95 },
      { color: 'gold', size: 1.1 }
    ];

    const fishList: PondFish[] = [];
    for (let i = 0; i < fishDefs.length; i++) {
      const def = fishDefs[i];
      const ang = (i / fishDefs.length) * Math.PI * 2;
      const r = 0.3 + (i % 3) * 0.22;
      const fx = waterCenterX + Math.cos(ang) * (waterRadiusX * r);
      const fy = waterCenterY + Math.sin(ang) * (waterRadiusY * r);

      const targetAng = ang + Math.PI * 0.6 + Math.random() * 0.5;
      const targetR = 0.25 + Math.random() * 0.55;
      const tx = waterCenterX + Math.cos(targetAng) * (waterRadiusX * targetR);
      const ty = waterCenterY + Math.sin(targetAng) * (waterRadiusY * targetR);

      fishList.push({
        id: `pond_fish_${i}`,
        pondId: 'pond_pastoral',
        x: fx,
        y: fy,
        targetX: tx,
        targetY: ty,
        speed: 15 + Math.random() * 14,
        color: def.color,
        swimCycle: Math.random() * Math.PI * 2,
        size: def.size,
        angle: Math.atan2(ty - fy, tx - fx),
        nibbleTimer: 0
      });
    }

    // 2. Compact Sanctuary Forest Lily Pond (South-East Whispering Sanctuary)
    const p2w = 265;
    const p2h = 163;
    const p2x = 2210;
    const p2y = 1430;
    const p2CenterX = p2x + p2w / 2;
    const p2CenterY = p2y + p2h / 2;
    const p2WaterCX = Math.round(p2x + p2w * 0.49);
    const p2WaterCY = Math.round(p2y + p2h * 0.58);
    const p2WaterRX = Math.round(p2w * 0.36);
    const p2WaterRY = Math.round(p2h * 0.26);

    const fishDefs2: { color: PondFishColor; size: number }[] = [
      { color: 'gold', size: 0.95 },
      { color: 'orange', size: 1.0 },
      { color: 'white_red', size: 0.9 },
      { color: 'calico', size: 0.85 },
      { color: 'blue_silver', size: 0.95 }
    ];
    const fishList2: PondFish[] = [];
    for (let i = 0; i < fishDefs2.length; i++) {
      const def = fishDefs2[i];
      const ang = (i / fishDefs2.length) * Math.PI * 2;
      const r = 0.35 + (i % 2) * 0.25;
      const fx = p2WaterCX + Math.cos(ang) * (p2WaterRX * r);
      const fy = p2WaterCY + Math.sin(ang) * (p2WaterRY * r);
      const targetAng = ang + Math.PI * 0.7;
      const tx = p2WaterCX + Math.cos(targetAng) * (p2WaterRX * 0.5);
      const ty = p2WaterCY + Math.sin(targetAng) * (p2WaterRY * 0.5);
      fishList2.push({
        id: `pond_fish_sanc_${i}`,
        pondId: 'pond_sanctuary',
        x: fx,
        y: fy,
        targetX: tx,
        targetY: ty,
        speed: 14 + Math.random() * 12,
        color: def.color,
        swimCycle: Math.random() * Math.PI * 2,
        size: def.size,
        angle: Math.atan2(ty - fy, tx - fx),
        nibbleTimer: 0
      });
    }

    this.ponds = [
      {
        id: 'pond_pastoral',
        name: 'Tranquil Lotus Pond',
        x: px,
        y: py,
        width: pondWidth,
        height: pondHeight,
        centerX,
        centerY,
        waterCenterX,
        waterCenterY,
        waterRadiusX,
        waterRadiusY,
        fish: fishList,
        sprite: 'default'
      },
      {
        id: 'pond_sanctuary',
        name: 'Whispering Sanctuary Pond',
        x: p2x,
        y: p2y,
        width: p2w,
        height: p2h,
        centerX: p2CenterX,
        centerY: p2CenterY,
        waterCenterX: p2WaterCX,
        waterCenterY: p2WaterCY,
        waterRadiusX: p2WaterRX,
        waterRadiusY: p2WaterRY,
        fish: fishList2,
        sprite: 'small'
      }
    ];
  }

  private initRiverFish(): void {
    for (let i = 0; i < 16; i++) {
      const riverY = 100 + Math.random() * 1600;
      this.riverFish.push({
        id: `fish_${i}`,
        x: this.getRiverCenterX(riverY) + (Math.random() * 50 - 25),
        y: riverY,
        speed: 25 + Math.random() * 25,
        targetX: this.getRiverCenterX(riverY),
        targetY: riverY + (Math.random() * 160 - 80),
        swimCycle: Math.random() * Math.PI * 2
      });
    }
  }

  private initDefaultItems(): void {
    this.spawnItem('axe', 'Forged Woodcutting Axe', 410, 380, 50);
    this.spawnItem('hammer', 'Carpenter Hammer', 510, 620, 45);
    this.spawnItem('knife', 'Hunting Dagger', 1490, 500, 35);
    this.spawnItem('log', 'Seasoned Pine Log', 460, 420, 15);
    this.spawnItem('berries', 'Wild Blueberries', 500, 1180, 10);
    this.spawnItem('fish', 'River Salmon', 1660, 420, 20);
  }

  public update(delta: number, agents: Agent[] = []): void {
    // 1. Update Autonomous Wildlife (Rabbits, Deer, Cows, Ducks)
    this.wildlife.update(delta, this, agents);

    // 2. Update Fish inside River
    for (const fish of this.riverFish) {
      fish.swimCycle += delta * 4;
      const dx = fish.targetX - fish.x;
      const dy = fish.targetY - fish.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 12) {
        const nextY = Math.max(100, Math.min(1700, fish.y + (Math.random() * 200 - 100)));
        fish.targetY = nextY;
        fish.targetX = this.getRiverCenterX(nextY) + (Math.random() * 60 - 30);
      } else {
        fish.x += (dx / dist) * fish.speed * delta;
        fish.y += (dy / dist) * fish.speed * delta;
      }
    }

    // 2b. Update Pond Koi Fish
    for (const pond of this.ponds) {
      // Check if any settler is currently fishing at this pond
      const fisherAtPond = agents.find(a => 
        a.data.actionState === 'fishing' && 
        Math.hypot(a.data.x - pond.waterCenterX, a.data.y - pond.waterCenterY) < (pond.waterRadiusX + 85)
      );

      for (const fish of pond.fish) {
        fish.swimCycle += delta * (fish.speed * 0.28);
        if (fish.nibbleTimer > 0) {
          fish.nibbleTimer -= delta;
          fish.swimCycle += delta * 1.5;
          continue;
        }

        // If someone is actively fishing at this pond, fish occasionally swim over to nibble near the float!
        if (fisherAtPond && Math.random() < 0.06 && fish.nibbleTimer <= 0) {
          const floatX = fisherAtPond.data.x + (fisherAtPond.data.facing === 'left' ? -24 : 24);
          const floatY = fisherAtPond.data.y + 12;
          const floatDist = Math.hypot(fish.x - floatX, fish.y - floatY);
          if (floatDist < 75) {
            fish.targetX = floatX + (Math.random() * 16 - 8);
            fish.targetY = floatY + (Math.random() * 12 - 6);
            fish.nibbleTimer = 2.2;
            fish.speed = 18;
          }
        }

        const dx = fish.targetX - fish.x;
        const dy = fish.targetY - fish.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10) {
          // Reached wander destination, pause to nibble near lily pads
          fish.nibbleTimer = 1.8 + Math.random() * 2.8;
          const ang = Math.random() * Math.PI * 2;
          const rad = Math.sqrt(Math.random()) * 0.82;
          fish.targetX = pond.waterCenterX + Math.cos(ang) * (pond.waterRadiusX * rad);
          fish.targetY = pond.waterCenterY + Math.sin(ang) * (pond.waterRadiusY * rad);
          fish.speed = 13 + Math.random() * 15;
        } else {
          // Smoothly rotate facing towards heading
          const targetAngle = Math.atan2(dy, dx);
          let diffAngle = targetAngle - fish.angle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
          fish.angle += diffAngle * Math.min(1, delta * 3.8);

          const moveDist = fish.speed * delta;
          fish.x += Math.cos(fish.angle) * moveDist;
          fish.y += Math.sin(fish.angle) * moveDist;

          // Clamp within water basin
          const relX = (fish.x - pond.waterCenterX) / (pond.waterRadiusX * 0.92);
          const relY = (fish.y - pond.waterCenterY) / (pond.waterRadiusY * 0.92);
          const rSq = relX * relX + relY * relY;
          if (rSq > 1.0) {
            const norm = Math.sqrt(rSq);
            fish.x = pond.waterCenterX + (relX / norm) * (pond.waterRadiusX * 0.90);
            fish.y = pond.waterCenterY + (relY / norm) * (pond.waterRadiusY * 0.90);
          }
        }
      }
    }

    // 3. Dynamic Tree Lifecycle (Aging, Growth, Seed Sprouting, and Decay of Old Age)
    const newSaplings: ForestTree[] = [];
    for (let i = this.trees.length - 1; i >= 0; i--) {
      const tree = this.trees[i];
      if (tree.shakeTimer > 0) tree.shakeTimer -= delta;

      // Tree felled by Settler Woodcutter
      if (tree.woodHealth <= 0 && tree.stage !== 'decaying') {
        tree.regrowTimer += delta;
        if (tree.regrowTimer > 75) {
          // Fresh young sapling sprouts from the root!
          tree.stage = 'sapling';
          tree.woodHealth = 25;
          tree.maxWoodHealth = 25;
          tree.age = 0;
          tree.regrowTimer = 0;
          tree.maxLifespan = 850 + Math.random() * 450;
        }
        continue;
      }

      // Natural Living Tree Aging
      tree.age += delta;

      // Stage Evolution
      if (tree.stage === 'sapling' && tree.age > 55) {
        tree.stage = 'young';
        tree.woodHealth = 65;
        tree.maxWoodHealth = 65;
      } else if (tree.stage === 'young' && tree.age > 160) {
        tree.stage = 'mature';
        tree.woodHealth = 100;
        tree.maxWoodHealth = 100;
      } else if (tree.stage === 'mature' && tree.age > 620) {
        tree.stage = 'ancient';
        tree.woodHealth = 140;
        tree.maxWoodHealth = 140;
      }

      // Natural Seed Dispersal (If not cut down, trees spawn saplings nearby)
      tree.seedTimer -= delta;
      if ((tree.stage === 'mature' || tree.stage === 'ancient') && tree.seedTimer <= 0) {
        tree.seedTimer = 90 + Math.random() * 110;

        if (this.trees.length + newSaplings.length < 88) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 55 + Math.random() * 85;
          const sx = tree.x + Math.cos(angle) * dist;
          const sy = tree.y + Math.sin(angle) * dist;

          if (this.canMoveTo(sx, sy, 14) && !this.isWater(sx, sy, 22)) {
            const tooClose = this.trees.some(t => Math.hypot(t.x - sx, t.y - sy) < 36);
            const nearBuilding = this.buildings.some(b => Math.hypot(b.x - sx, b.y - sy) < 80);
            if (!tooClose && !nearBuilding) {
              newSaplings.push({
                id: `tree_seed_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                x: sx,
                y: sy,
                woodHealth: 25,
                maxWoodHealth: 25,
                regrowTimer: 0,
                shakeTimer: 0,
                variant: tree.variant,
                stage: 'sapling',
                age: 0,
                maxLifespan: 800 + Math.random() * 500,
                seedTimer: 60 + Math.random() * 80
              });
            }
          }
        }
      }

      // Natural Death & Decay of Old Age (Ancient trees wither if not cut)
      if (tree.age > tree.maxLifespan && tree.stage !== 'decaying') {
        tree.stage = 'decaying';
        tree.decayTimer = 85 + Math.random() * 35;
        tree.woodHealth = 0;
      }

      if (tree.stage === 'decaying') {
        tree.decayTimer = (tree.decayTimer || 85) - delta;
        if (tree.decayTimer <= 0) {
          // Decomposes into forest soil humus!
          this.trees.splice(i, 1);
        }
      }
    }
    if (newSaplings.length > 0) {
      this.trees.push(...newSaplings);
    }

    // 4. Dynamic Berry Bush Lifecycle (Aging, Berries, Wild Seed Drops, Withering)
    const newBushes: BerryBush[] = [];
    for (let i = this.berryBushes.length - 1; i >= 0; i--) {
      const bush = this.berryBushes[i];
      bush.age += delta;

      // Stage Evolution
      if (bush.stage === 'sprout' && bush.age > 45) {
        bush.stage = 'flowering';
      } else if (bush.stage === 'flowering' && bush.age > 90) {
        bush.stage = 'fruiting';
        bush.hasBerries = true;
      }

      if (bush.stage === 'fruiting') {
        // Regrowth if berries were picked by settlers
        if (!bush.hasBerries) {
          bush.regrowTimer += delta;
          if (bush.regrowTimer > 40) {
            bush.hasBerries = true;
            bush.regrowTimer = 0;
          }
        }

        // Seed Drop & Sprouting if berries are left unpicked
        bush.seedTimer -= delta;
        if (bush.hasBerries && bush.seedTimer <= 0) {
          bush.seedTimer = 110 + Math.random() * 90;

          if (this.berryBushes.length + newBushes.length < 45) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 65;
            const bx = bush.x + Math.cos(angle) * dist;
            const by = bush.y + Math.sin(angle) * dist;

            if (this.canMoveTo(bx, by, 12) && !this.isWater(bx, by, 18)) {
              const tooClose = this.berryBushes.some(b => Math.hypot(b.x - bx, b.y - by) < 30);
              if (!tooClose) {
                newBushes.push({
                  id: `bush_sprout_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                  x: bx,
                  y: by,
                  hasBerries: false,
                  regrowTimer: 0,
                  stage: 'sprout',
                  age: 0,
                  maxLifespan: 420 + Math.random() * 240,
                  seedTimer: 45 + Math.random() * 60
                });
              }
            }
          }
        }
      }

      // Natural Withering of Old Age
      if (bush.age > bush.maxLifespan && bush.stage !== 'withering') {
        bush.stage = 'withering';
        bush.hasBerries = false;
        bush.decayTimer = 60;
      }

      if (bush.stage === 'withering') {
        bush.decayTimer = (bush.decayTimer || 60) - delta;
        if (bush.decayTimer <= 0) {
          // Decomposes into mulch
          this.berryBushes.splice(i, 1);
        }
      }
    }
    if (newBushes.length > 0) {
      this.berryBushes.push(...newBushes);
    }

    // 5. Minimum Ecosystem Population Thresholds
    if (this.trees.length < 52) {
      const rx = 2150 + Math.random() * 520;
      const ry = 1300 + Math.random() * 400;
      if (!this.isWater(rx, ry, 20)) {
        this.trees.push({
          id: `tree_safety_${Date.now()}`,
          x: rx,
          y: ry,
          woodHealth: 25,
          maxWoodHealth: 25,
          regrowTimer: 0,
          shakeTimer: 0,
          variant: (Math.floor(Math.random() * 18)) as TreeVariant,
          stage: 'sapling',
          age: 0,
          maxLifespan: 850 + Math.random() * 400,
          seedTimer: 60
        });
      }
    }

    // 6. Visual Effects Update
    for (let i = this.specialEffects.length - 1; i >= 0; i--) {
      const fx = this.specialEffects[i];
      fx.timer -= delta;
      if (fx.timer <= 0) {
        this.specialEffects.splice(i, 1);
      }
    }
  }

  // River Bridges
  public readonly bridges = [
    { id: 'bridge_north', name: 'North Timber Bridge', y: 500, height: 70, centerY: 535 },
    { id: 'bridge_south', name: 'South Stone Bridge', y: 1200, height: 70, centerY: 1235 }
  ];

  /**
   * Center X of winding river across the 2800 width map.
   */
  public getRiverCenterX(y: number): number {
    return 1650 + Math.sin(y * 0.0035) * 85 + Math.cos(y * 0.008) * 40;
  }

  public isBridge(x: number, y: number, margin = 0): boolean {
    for (const b of this.bridges) {
      if (y >= b.y - margin && y <= b.y + b.height + margin) {
        const rc = this.getRiverCenterX(b.centerY);
        if (Math.abs(x - rc) <= 90 + margin) {
          return true;
        }
      }
    }
    return false;
  }

  public isWater(x: number, y: number, padding = 0): boolean {
    if (this.isBridge(x, y, 4)) {
      return false; // Crossing safely on bridge deck
    }
    const riverCenter = this.getRiverCenterX(y);
    if (Math.abs(x - riverCenter) < (66 + padding)) {
      return true;
    }
    for (const pond of this.ponds) {
      const rx = pond.waterRadiusX + padding;
      const ry = pond.waterRadiusY + padding;
      const dx = (x - pond.waterCenterX) / rx;
      const dy = (y - pond.waterCenterY) / ry;
      if (dx * dx + dy * dy <= 1.0) {
        return true;
      }
    }
    return false;
  }

  public getRiverSide(x: number, y: number): 'west' | 'east' | 'bridge' {
    if (this.isBridge(x, y, 6)) {
      return 'bridge';
    }
    const rc = this.getRiverCenterX(y);
    return x < rc ? 'west' : 'east';
  }

  public isAreaWater(x: number, y: number, width: number, height: number, margin = 35): boolean {
    for (let testY = y - margin; testY <= y + height + margin; testY += 15) {
      const cx = this.getRiverCenterX(testY);
      const boxLeft = x - margin;
      const boxRight = x + width + margin;
      if (boxRight >= cx - 85 && boxLeft <= cx + 85) {
        return true;
      }
    }
    return false;
  }

  public canMoveTo(x: number, y: number, radius = 8): boolean {
    // 1. World Bounds
    if (x < 40 + radius || x > this.width - 40 - radius) return false;
    if (y < 40 + radius || y > this.height - 40 - radius) return false;

    // 2. Sandstone Cliff Face (y: 240 to 315) - can only cross via stone stairs
    if (y >= 238 && y <= 318) {
      const onStair1 = Math.abs(x - 580) <= 60;
      const onStair2 = Math.abs(x - 1150) <= 70;
      const onStair3 = Math.abs(x - 2050) <= 60;
      if (!onStair1 && !onStair2 && !onStair3) {
        return false;
      }
    }

    // 3. Impassable River Water Collision (Bridges are passable, water is blocked!)
    if (this.isWater(x, y, radius)) {
      return false;
    }

    return true;
  }

  public moveWithPhysics(currentX: number, currentY: number, deltaX: number, deltaY: number, radius = 10): { x: number; y: number } {
    // 1. Full move
    const nextX = currentX + deltaX;
    const nextY = currentY + deltaY;

    if (this.canMoveTo(nextX, nextY, radius)) {
      return { x: nextX, y: nextY };
    }

    // 2. Slide along X axis
    if (Math.abs(deltaX) > 0.001 && this.canMoveTo(nextX, currentY, radius)) {
      return { x: nextX, y: currentY };
    }

    // 3. Slide along Y axis
    if (Math.abs(deltaY) > 0.001 && this.canMoveTo(currentX, nextY, radius)) {
      return { x: currentX, y: nextY };
    }

    // 4. Blocked
    return { x: currentX, y: currentY };
  }

  /**
   * Creates a new building construction site dynamically when an NPC wants their own house!
   */
  public createBuildingSite(
    name: string,
    familyName: string,
    x: number,
    y: number,
    builderId: string,
    ownerIds: string[] = [builderId],
    instantConstructed: boolean = false,
    roofColor?: string
  ): Building {
    // Ensure the new site never overlaps water!
    let safeX = x;
    let safeY = y;
    if (this.isAreaWater(safeX, safeY, 190, 150, 40)) {
      const clear = this.findClearSpotForHouse();
      safeX = clear.x;
      safeY = clear.y;
    }

    const newCabin: Building = {
      id: 'cabin_user_' + Math.random().toString(36).substring(2, 8),
      name,
      familyName,
      type: 'cabin',
      x: safeX,
      y: safeY,
      width: 190,
      height: 150,
      color: '#78350f',
      icon: '🛖',
      door: { x: safeX + 95, y: safeY + 150 },
      description: `A handcrafted forest cabin built with care by ${familyName}.`,
      isConstructed: instantConstructed,
      constructionProgress: instantConstructed ? 100 : 0,
      builderId,
      roofColor: roofColor || '#854d0e',
      ownerIds: [...ownerIds],
      maxResidents: 5
    };
    this.buildings.push(newCabin);
    // Automatically pave road trail connecting the new house
    this.connectBuildingWithRoad(newCabin);
    return newCabin;
  }

  /**
   * Advances construction progress on an in-progress house.
   */
  public advanceBuildingConstruction(buildingId: string, amount: number): boolean {
    const building = this.buildings.find(b => b.id === buildingId);
    if (!building || building.isConstructed) return false;

    building.constructionProgress = Math.min(100, building.constructionProgress + amount);
    if (building.constructionProgress >= 100) {
      building.isConstructed = true;
      building.description = `A newly finished, beautiful handcrafted forest home.`;
      return true; // Completed!
    }
    return false;
  }

  public findClearSpotForHouse(): { x: number; y: number } {
    // Open clearings strictly on land (guaranteed away from river)
    const spots = [
      { x: 380, y: 880 },
      { x: 740, y: 1320 },
      { x: 2180, y: 780 },
      { x: 2180, y: 1040 },
      { x: 1980, y: 1260 },
      { x: 620, y: 280 },
      { x: 320, y: 1220 },
      { x: 2200, y: 340 },
      { x: 420, y: 1020 },
      { x: 2020, y: 880 },
      { x: 500, y: 1380 },
      { x: 2280, y: 1200 },
      { x: 800, y: 400 },
      { x: 2150, y: 550 },
      { x: 350, y: 650 }
    ];

    // Pick a spot not too close to existing buildings and not on water
    for (const spot of spots) {
      if (this.isAreaWater(spot.x, spot.y, 200, 160, 40)) continue;
      const collides = this.buildings.some(b => Math.hypot(b.x - spot.x, b.y - spot.y) < 210);
      if (!collides) return spot;
    }

    // Procedural search across west and east banks for continuous generations
    for (let attempts = 0; attempts < 50; attempts++) {
      const isWest = Math.random() < 0.5;
      const testX = isWest ? (260 + Math.random() * 600) : (1800 + Math.random() * 500);
      const testY = 260 + Math.random() * 1150;
      if (this.isAreaWater(testX, testY, 200, 160, 40)) continue;
      const collides = this.buildings.some(b => Math.hypot(b.x - testX, b.y - testY) < 200);
      if (!collides) return { x: testX, y: testY };
    }

    return { x: 340 + Math.random() * 200, y: 1220 + Math.random() * 150 };
  }

  public spawnItem(type: ItemType, name: string, x: number, y: number, value: number): WorldItem {
    const item: WorldItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      type,
      name,
      x,
      y,
      value
    };
    this.items.push(item);
    return item;
  }

  public removeItem(itemId: string): void {
    this.items = this.items.filter(i => i.id !== itemId);
  }

  public getBuildingById(id: string): Building | undefined {
    return this.buildings.find(b => b.id === id);
  }

  public clampToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(40, Math.min(this.width - 40, x)),
      y: Math.max(40, Math.min(this.height - 40, y))
    };
  }
}
