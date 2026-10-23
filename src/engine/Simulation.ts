import { Agent } from './Agent';
import { World } from './World';
import { Caravan } from './Caravan';
import type {
  AgentData,
  DramaEvent,
  GodPowerType,
  WeatherType,
  ItemType,
  Building,
  ForestTree,
  TreeVariant,
  TreeStage,
  SettlerRole,
  BonfireView,
  BonfireState,
  WildlifeAnimal
} from '../types/simulation';
import { TreeRenderer } from '../renderer/TreeRenderer';

// Communal infrastructure is required by settler AI; demolishing it used to
// leave agents with dangling building lookups.
const PROTECTED_BUILDING_TYPES: Building['type'][] = [
  'hearth',
  'storage',
  'lumber_camp',
  'dock',
  'healer_hut'
];

export class Simulation {
  public world: World;
  public agents: Agent[] = [];
  public caravan: Caravan;
  public selectedAgent: Agent | null = null;
  public selectedBuilding: Building | null = null;
  public movingBuilding: Building | null = null;
  public selectedTree: ForestTree | null = null;
  public selectedBonfire: boolean = false;
  public selectedPlantTreeVariant: TreeVariant | undefined = undefined; // undefined = random
  public selectedPlantTreeStage: TreeStage = 'mature';
  public selectedSettlerGender: 'female' | 'male' | 'random' = 'female';
  public selectedSettlerRole: SettlerRole | 'random' = 'random';
  public possessedAgent: Agent | null = null;

  // Time & Weather
  public gameMinutes = 480; // 08:00 AM (Morning shift)
  public day = 1;
  public timeSpeed = 1; // 0 = pause, 1, 2, 5, 10
  public weather: WeatherType = 'sunny';
  public weatherTimer = 240;

  // Event Feed
  public eventLog: DramaEvent[] = [];
  public onEventAdded?: (event: DramaEvent) => void;

  // Active God Power
  public activeGodPower: GodPowerType = 'none';

  // Visual effects
  public specialEffects: {
    type: 'lightning' | 'heart_burst' | 'smoke' | 'sparkle';
    x: number;
    y: number;
    timer: number;
    maxTimer: number;
  }[] = [];

  constructor() {
    this.world = new World();
    this.caravan = new Caravan(this.world.width / 2, this.world.height / 2);
    this.initForestSettlementCitizens();
    this.addDramaEvent('general', '🌲 The Whispering Wildlife Sanctuary flourishes in the South-East grove with wild chickens, sheep, cows, and riverside dogs.', []);
  }

  
  public getHouseResidents(buildingId: string): Agent[] {
    return this.agents.filter(a => !a.data.isDead && a.data.homeCabinId === buildingId);
  }

  public triggerRomanceBetween(agentA: Agent, agentB: Agent): string {
    return agentA.triggerRomance(agentB);
  }

  
  public isSingleParent(agent: Agent): boolean {
    if (agent.data.spouseId) return false;
    return this.agents.some(a => 
      !a.data.isDead && 
      (a.data.fatherId === agent.data.id || a.data.motherId === agent.data.id) &&
      a.data.age < 16 && 
      a.data.homeCabinId === agent.data.homeCabinId
    );
  }

  public processDivorce(agentA: Agent, agentB: Agent, reason?: string): string {
    if (agentA.data.spouseId !== agentB.data.id && agentB.data.spouseId !== agentA.data.id) {
      return `${agentA.data.name} and ${agentB.data.name} are not currently married.`;
    }

    // 1. Clear spouse status and record ex-spouse history
    agentA.data.spouseId = undefined;
    agentB.data.spouseId = undefined;

    agentA.data.maritalStatus = 'divorced';
    agentB.data.maritalStatus = 'divorced';

    agentA.data.divorceCount = (agentA.data.divorceCount || 0) + 1;
    agentB.data.divorceCount = (agentB.data.divorceCount || 0) + 1;

    if (!agentA.data.exSpouseIds) agentA.data.exSpouseIds = [];
    if (!agentA.data.exSpouseIds.includes(agentB.data.id)) agentA.data.exSpouseIds.push(agentB.data.id);

    if (!agentB.data.exSpouseIds) agentB.data.exSpouseIds = [];
    if (!agentB.data.exSpouseIds.includes(agentA.data.id)) agentB.data.exSpouseIds.push(agentA.data.id);

    const relA = agentA.getOrCreateRelationship(agentB.data);
    const relB = agentB.getOrCreateRelationship(agentA.data);

    relA.status = 'divorced';
    relB.status = 'divorced';
    relA.affinity = Math.min(-20, relA.affinity - 50);
    relB.affinity = Math.min(-20, relB.affinity - 50);
    relA.trust = Math.min(-25, relA.trust - 50);
    relB.trust = Math.min(-25, relB.trust - 50);
    relA.attraction = Math.max(0, relA.attraction - 40);
    relB.attraction = Math.max(0, relB.attraction - 40);

    agentA.setBubble('broken_heart', 5);
    agentB.setBubble('broken_heart', 5);

    const defaultReason = reason || 'irreconcilable differences and broken trust';
    agentA.addMemory(`Divorced ${agentB.data.name} after ${defaultReason}.`, -50, agentB.data.id);
    agentB.addMemory(`Divorced ${agentA.data.name} after ${defaultReason}.`, -50, agentA.data.id);

    // 2. Household & Custody Division
    const sharedCabinId = agentA.data.homeCabinId;
    const minorChildren = this.agents.filter(a => 
      !a.data.isDead && 
      a.data.age < 16 && 
      a.data.homeCabinId === sharedCabinId &&
      ((a.data.fatherId === agentA.data.id && a.data.motherId === agentB.data.id) ||
       (a.data.fatherId === agentB.data.id && a.data.motherId === agentA.data.id))
    );

    // Custodial parent stays in current family cabin with children
    let custodialParent = agentA;
    let exitingSpouse = agentB;

    if (minorChildren.length > 0) {
      if (agentB.data.appearance.gender === 'female' && agentA.data.appearance.gender === 'male') {
        custodialParent = agentB;
        exitingSpouse = agentA;
      } else if (agentB.data.needs.morality > agentA.data.needs.morality) {
        custodialParent = agentB;
        exitingSpouse = agentA;
      }
    }

    // Exiting spouse moves out of the shared cabin
    const cabin = this.world.getBuildingById(sharedCabinId);
    if (cabin) {
      cabin.ownerIds = cabin.ownerIds.filter(id => id !== exitingSpouse.data.id);
    }

    // Exiting spouse establishes a new separate bachelor cabin
    const spot = this.world.findClearSpotForHouse();
    const newCabin = this.world.createBuildingSite(
      `${exitingSpouse.data.name.split(' ')[0]}'s Haven`,
      exitingSpouse.data.familyName,
      spot.x,
      spot.y,
      exitingSpouse.data.id,
      [exitingSpouse.data.id],
      true
    );
    newCabin.description = `A quiet personal home established by ${exitingSpouse.data.name} following their divorce.`;

    exitingSpouse.data.homeCabinId = newCabin.id;
    exitingSpouse.data.wantsToBuildHouse = false;
    exitingSpouse.initDefaultSchedule();
    custodialParent.initDefaultSchedule();

    this.world.spawnSpecialEffect('smoke', exitingSpouse.data.x, exitingSpouse.data.y, undefined, undefined, 2);

    const custodyNotice = minorChildren.length > 0
      ? ` ${custodialParent.data.name} will care for the ${minorChildren.length} children as a single parent in the family homestead, while ${exitingSpouse.data.name} has moved into a separate cabin.`
      : ` ${custodialParent.data.name} keeps the homestead while ${exitingSpouse.data.name} has moved into a separate cabin.`;

    const dramaMsg = `💔 DIVORCE: ${agentA.data.name} and ${agentB.data.name} have officially divorced after ${defaultReason}.${custodyNotice}`;
    this.addDramaEvent('violence', dramaMsg, [agentA.data.id, agentB.data.id]);

    return dramaMsg;
  }

  public processRemarriage(agentA: Agent, agentB: Agent): Building {
    agentA.data.spouseId = agentB.data.id;
    agentB.data.spouseId = agentA.data.id;
    agentA.data.maritalStatus = 'married';
    agentB.data.maritalStatus = 'married';

    agentA.data.marriageCount = (agentA.data.marriageCount || 0) + 1;
    agentB.data.marriageCount = (agentB.data.marriageCount || 0) + 1;

    const relA = agentA.getOrCreateRelationship(agentB.data);
    const relB = agentB.getOrCreateRelationship(agentA.data);
    relA.status = 'married';
    relB.status = 'married';
    relA.affinity = Math.max(80, relA.affinity);
    relB.affinity = Math.max(80, relB.affinity);

    // Blended Household Management (Strict limit: Max 5 members per house!)
    const houseResidentsA = this.getHouseResidents(agentA.data.homeCabinId);
    const houseResidentsB = this.getHouseResidents(agentB.data.homeCabinId);

    const allMembersMap = new Map<string, Agent>();
    houseResidentsA.forEach(a => allMembersMap.set(a.data.id, a));
    houseResidentsB.forEach(a => allMembersMap.set(a.data.id, a));
    allMembersMap.set(agentA.data.id, agentA);
    allMembersMap.set(agentB.data.id, agentB);

    const combinedMembers = Array.from(allMembersMap.values());

    let targetCabin: Building;
    if (combinedMembers.length <= 5) {
      targetCabin = this.establishCoupleHomestead(agentA, agentB);
      combinedMembers.forEach(member => {
        if (member.data.id !== agentA.data.id && member.data.id !== agentB.data.id) {
          member.data.homeCabinId = targetCabin.id;
          if (!targetCabin.ownerIds.includes(member.data.id)) {
            targetCabin.ownerIds.push(member.data.id);
          }
          member.initDefaultSchedule();
        }
      });
    } else {
      // If combined members > 5, couple + youngest children live in main house (max 5)
      targetCabin = this.establishCoupleHomestead(agentA, agentB);
      
      const minors = combinedMembers.filter(m => m.data.id !== agentA.data.id && m.data.id !== agentB.data.id)
        .sort((a, b) => a.data.age - b.data.age); // Younger first
      
      let spotsRemaining = 5 - 2; // 2 spots taken by the couple
      for (const m of minors) {
        if (spotsRemaining > 0) {
          m.data.homeCabinId = targetCabin.id;
          if (!targetCabin.ownerIds.includes(m.data.id)) {
            targetCabin.ownerIds.push(m.data.id);
          }
          m.initDefaultSchedule();
          spotsRemaining--;
        } else {
          // Older teen moves to own adjoining cottage
          const spot = this.world.findClearSpotForHouse();
          const teenCabin = this.world.createBuildingSite(
            `${m.data.name.split(' ')[0]}'s Cottage`,
            m.data.familyName,
            spot.x,
            spot.y,
            m.data.id,
            [m.data.id],
            true
          );
          m.data.homeCabinId = teenCabin.id;
          m.initDefaultSchedule();
        }
      }
    }

    targetCabin.description = `The blended family homestead of ${agentA.data.name} and ${agentB.data.name}, uniting their lives and children.`;

    agentA.addMemory(`Married again! Wed ${agentB.data.name} and established our blended family home.`, 95, agentB.data.id);
    agentB.addMemory(`Married again! Wed ${agentA.data.name} and established our blended family home.`, 95, agentA.data.id);

    this.world.spawnSpecialEffect('heart_burst', targetCabin.door.x, targetCabin.door.y, undefined, undefined, 2.5);
    this.world.spawnSpecialEffect('sparkle', targetCabin.door.x, targetCabin.door.y, undefined, undefined, 2.5);

    this.addDramaEvent(
      'love',
      `💍 REMARRIAGE & BLENDED FAMILY: ${agentA.data.name} and ${agentB.data.name} have married and united their household into ${targetCabin.name}!`,
      [agentA.data.id, agentB.data.id]
    );

    return targetCabin;
  }

  public establishCoupleHomestead(agentA: Agent, agentB: Agent): Building {
    const male = agentA.data.appearance.gender === 'male' ? agentA : (agentB.data.appearance.gender === 'male' ? agentB : agentA);
    const female = male === agentA ? agentB : agentA;

    const familyName = male.data.familyName || female.data.familyName;
    const houseName = `${male.data.name.split(' ')[0]} & ${female.data.name.split(' ')[0]}'s Homestead`;

    // Find clear land spot
    const spot = this.world.findClearSpotForHouse();
    const roofColors = ['#854d0e', '#166534', '#991b1b', '#1e3a8a', '#78350f', '#065f46', '#701a75'];
    const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];

    const newCabin = this.world.createBuildingSite(
      houseName,
      familyName,
      spot.x,
      spot.y,
      agentA.data.id,
      [agentA.data.id, agentB.data.id],
      true,
      roofColor
    );

    newCabin.description = `The matrimonial home of ${agentA.data.name} and ${agentB.data.name}, built with love to start their family.`;

    // Remove from previous cabins' resident tracking
    const oldCabinA = this.world.getBuildingById(agentA.data.homeCabinId);
    if (oldCabinA && oldCabinA.id !== newCabin.id) {
      oldCabinA.ownerIds = oldCabinA.ownerIds.filter(id => id !== agentA.data.id);
    }
    const oldCabinB = this.world.getBuildingById(agentB.data.homeCabinId);
    if (oldCabinB && oldCabinB.id !== newCabin.id) {
      oldCabinB.ownerIds = oldCabinB.ownerIds.filter(id => id !== agentB.data.id);
    }

    // Move in together to their new separate home
    agentA.data.homeCabinId = newCabin.id;
    agentB.data.homeCabinId = newCabin.id;
    agentA.data.wantsToBuildHouse = false;
    agentB.data.wantsToBuildHouse = false;

    agentA.initDefaultSchedule();
    agentB.initDefaultSchedule();

    this.world.spawnSpecialEffect('heart_burst', newCabin.door.x, newCabin.door.y, undefined, undefined, 2);
    this.world.spawnSpecialEffect('sparkle', newCabin.door.x, newCabin.door.y, undefined, undefined, 2);

    agentA.addMemory(`Married ${agentB.data.name} and built our new private home: ${houseName}!`, 95, agentB.data.id);
    agentB.addMemory(`Married ${agentA.data.name} and built our new private home: ${houseName}!`, 95, agentA.data.id);

    this.addDramaEvent(
      'love',
      `🏡 NEW HOMESTEAD: In celebration of their love, ${agentA.data.name} and ${agentB.data.name} built and moved into their separate home (${houseName})!`,
      [agentA.data.id, agentB.data.id]
    );

    return newCabin;
  }

  public initForestSettlementCitizens(): void {
    const defaultData: Partial<AgentData>[] = [
      // 1. Rowan Vance (Male, Rugged Woodsman Lumberjack in Ranger Hat & Beard)
      {
        id: 'agent_rowan',
        name: 'Rowan Vance',
        familyName: 'Vance',
        age: 31,
        role: 'lumberjack',
        homeCabinId: 'cabin_vance',
        x: 420,
        y: 440,
        cash: 65,
        equippedWeapon: 'axe',
        appearance: {
          gender: 'male',
          skinColor: '#e0ac69',
          hairColor: '#4a2c1b',
          hairStyle: 'short',
          shirtColor: '#15803d', // Woodsman forest green shirt
          pantsColor: '#166534', // Forest green woodsman trousers
          accessory: 'hat',      // Brown ranger wide-brim hat
          eyeColor: '#1f2937',
          facialHair: 'beard',   // Full brown beard & mustache
          outfitType: 'tunic_pants',
          scale: 1.02
        },
        traits: {
          openness: 0.3,
          conscientiousness: 0.85,
          extraversion: 0.4,
          agreeableness: 0.6,
          neuroticism: -0.2,
          aggression: 0.3,
          greed: 0.2,
          libido: 0.6,
          workEthic: 0.95
        }
      },
      // 2. Talia Thorne (Female, Forager in Cream Kerchief & Earthy Apron Dress)
      {
        id: 'agent_talia',
        name: 'Talia Thorne',
        familyName: 'Thorne',
        age: 26,
        role: 'forager',
        homeCabinId: 'cabin_thorne',
        x: 675,
        y: 1210,
        cash: 50,
        equippedWeapon: 'knife',
        appearance: {
          gender: 'female',
          skinColor: '#fbd0b2',
          hairColor: '#5c2c16', // Chestnut brown hair
          hairStyle: 'bun',
          shirtColor: '#78350f', // Earthy warm brown dress
          dressColor: '#59250a',
          apronColor: '#fef3c7', // Cream foraging apron
          pantsColor: '#451a03',
          accessory: 'hat',     // Cream kerchief / headscarf
          eyeColor: '#1f2937',
          facialHair: 'none',
          outfitType: 'dress_apron',
          scale: 0.96
        },
        traits: {
          openness: 0.8,
          conscientiousness: 0.75,
          extraversion: 0.6,
          agreeableness: 0.8,
          neuroticism: 0.1,
          aggression: 0.05,
          greed: 0.1,
          libido: 0.7,
          workEthic: 0.85
        }
      },
      // 3. Finn Gale (Male, Athletic Fisher with Cap & Stubble)
      {
        id: 'agent_finn',
        name: 'Finn Gale',
        familyName: 'Gale',
        age: 24,
        role: 'fisher',
        homeCabinId: 'cabin_gale',
        x: 2045,
        y: 640,
        cash: 45,
        equippedWeapon: 'knife',
        appearance: {
          gender: 'male',
          skinColor: '#d4a373',
          hairColor: '#18181b', // Black
          hairStyle: 'buzz',
          shirtColor: '#0284c7', // River blue
          pantsColor: '#334155',
          accessory: 'hat',
          eyeColor: '#38bdf8',
          facialHair: 'stubble',
          outfitType: 'tunic_pants',
          scale: 1.0
        },
        traits: {
          openness: 0.6,
          conscientiousness: 0.65,
          extraversion: 0.5,
          agreeableness: 0.7,
          neuroticism: -0.3,
          aggression: 0.2,
          greed: 0.2,
          libido: 0.8,
          workEthic: 0.8
        }
      },
      // 4. Aria Sol (Female, Master Chef in Toque Blanche & Chef Apron)
      {
        id: 'agent_aria',
        name: 'Aria Sol',
        familyName: 'Sol',
        age: 28,
        role: 'cook',
        homeCabinId: 'cabin_sol',
        x: 1180,
        y: 840,
        cash: 70,
        equippedWeapon: 'knife',
        appearance: {
          gender: 'female',
          skinColor: '#ffdbac',
          hairColor: '#78350f', // Dark chestnut hair
          hairStyle: 'bun',
          shirtColor: '#991b1b', // Burgundy neck scarf / collar
          dressColor: '#1d4ed8', // Royal blue chef tunic
          apronColor: '#ffffff', // Crisp white chef apron
          pantsColor: '#1e3a8a', // Deep navy leggings
          accessory: 'hat',     // White chef hat (toque blanche)
          eyeColor: '#1f2937',
          facialHair: 'none',
          outfitType: 'dress_apron',
          scale: 0.98
        },
        traits: {
          openness: 0.7,
          conscientiousness: 0.8,
          extraversion: 0.8,
          agreeableness: 0.9,
          neuroticism: 0.2,
          aggression: 0.1,
          greed: 0.1,
          libido: 0.6,
          workEthic: 0.9
        }
      },
      // 5. Kaelen Stone (Male, Frontier Scout Hunter / Watchman in Royal Blue Uniform & Spear)
      {
        id: 'agent_kaelen',
        name: 'Kaelen Stone',
        familyName: 'Stone',
        age: 33,
        role: 'hunter',
        homeCabinId: 'cabin_stone',
        spouseId: 'agent_clara',
        x: 1920,
        y: 1300,
        cash: 55,
        equippedWeapon: 'bow',
        appearance: {
          gender: 'male',
          skinColor: '#e0ac69',
          hairColor: '#451a03', // Dark brown hair
          hairStyle: 'short',
          shirtColor: '#1d4ed8', // Royal blue watchman uniform with gold trim
          dressColor: '#1e40af',
          pantsColor: '#1e3a8a', // Matching blue trousers
          accessory: 'hat', // Blue peaked cap with gold emblem
          eyeColor: '#1f2937',
          facialHair: 'beard', // Neat brown beard
          outfitType: 'tunic_pants',
          scale: 1.02
        },
        traits: {
          openness: 0.4,
          conscientiousness: 0.9,
          extraversion: 0.2,
          agreeableness: 0.4,
          neuroticism: -0.4,
          aggression: 0.5,
          greed: 0.1,
          libido: 0.3,
          workEthic: 0.95
        }
      },
      // 6. Elder Bron (Male, Elder with walking cane, brown coat, dark trousers)
      {
        id: 'agent_bron',
        name: 'Elder Bron',
        familyName: 'Bron',
        age: 62,
        role: 'elder',
        homeCabinId: 'cabin_bron',
        x: 1150,
        y: 850,
        cash: 120,
        equippedWeapon: 'fists',
        appearance: {
          gender: 'male',
          skinColor: '#f1c27d',
          hairColor: '#cbd5e1', // Silver grey
          hairStyle: 'short',
          shirtColor: '#8d5b36', // Warm brown shirt matching pixel art sprite
          dressColor: '#6b4226',
          pantsColor: '#374151', // Dark charcoal trousers matching pixel art sprite
          accessory: 'none',
          cloakColor: '#8d5b36',
          eyeColor: '#1f2937',
          facialHair: 'mustache', // Grey mustache
          outfitType: 'tunic_pants',
          scale: 1.0
        },
        traits: {
          openness: 0.9,
          conscientiousness: 0.8,
          extraversion: 0.6,
          agreeableness: 0.85,
          neuroticism: -0.6,
          aggression: 0.05,
          greed: 0.05,
          libido: 0.2,
          workEthic: 0.7
        }
      },
      // 7. Leo Vance (Male, Village Apprentice / Child Boy)
      {
        id: 'agent_leo',
        name: 'Leo Vance',
        familyName: 'Vance',
        age: 10,
        role: 'settler',
        homeCabinId: 'cabin_vance',
        x: 450,
        y: 460,
        cash: 15,
        equippedWeapon: 'fists',
        appearance: {
          gender: 'male',
          skinColor: '#fbd0b2',
          hairColor: '#4a2c1b', // Brown shaggy hair
          hairStyle: 'short',
          shirtColor: '#4d7c0f', // Olive green tunic
          pantsColor: '#78350f', // Brown trousers
          accessory: 'none',
          eyeColor: '#1f2937',
          facialHair: 'none',
          outfitType: 'tunic_pants',
          scale: 0.88
        },
        traits: {
          openness: 0.9,
          conscientiousness: 0.5,
          extraversion: 0.85,
          agreeableness: 0.8,
          neuroticism: 0.1,
          aggression: 0.1,
          greed: 0.1,
          libido: 0.0,
          workEthic: 0.6
        }
      },
      // 8. Ivy Sol (Female, Cheerful Village Girl with Pigtails & Spoon)
      {
        id: 'agent_ivy',
        name: 'Ivy Sol',
        familyName: 'Sol',
        age: 9,
        role: 'settler',
        homeCabinId: 'cabin_sol',
        x: 1210,
        y: 860,
        cash: 15,
        equippedWeapon: 'fists',
        appearance: {
          gender: 'female',
          skinColor: '#fbd0b2',
          hairColor: '#78350f', // Brown hair in pigtails
          hairStyle: 'twin_tails',
          shirtColor: '#be185d', // Rosy pink dress
          dressColor: '#9d174d',
          apronColor: '#fbcfe8', // Soft pink apron
          pantsColor: '#831843',
          accessory: 'ribbon',
          eyeColor: '#1f2937',
          facialHair: 'none',
          outfitType: 'dress_apron',
          scale: 0.86
        },
        traits: {
          openness: 0.95,
          conscientiousness: 0.5,
          extraversion: 0.9,
          agreeableness: 0.85,
          neuroticism: 0.1,
          aggression: 0.05,
          greed: 0.05,
          libido: 0.0,
          workEthic: 0.6
        }
      },
      // 9. Clara Stone (Female, Expecting Mother in Burgundy Dress & Soft Pink Apron)
      {
        id: 'agent_clara',
        name: 'Clara Stone',
        familyName: 'Stone',
        age: 28,
        role: 'settler',
        homeCabinId: 'cabin_stone',
        spouseId: 'agent_kaelen',
        isPregnant: true,
        pregnancyProgress: 70,
        x: 1880,
        y: 1310,
        cash: 45,
        equippedWeapon: 'fists',
        appearance: {
          gender: 'female',
          skinColor: '#ffdbac',
          hairColor: '#6b3018', // Warm brown hair in ponytail
          hairStyle: 'ponytail',
          shirtColor: '#be185d', // Rosy burgundy dress
          dressColor: '#9d174d',
          apronColor: '#fbcfe8', // Soft pink maternal apron
          pantsColor: '#374151',
          accessory: 'none',
          eyeColor: '#1f2937',
          facialHair: 'none',
          outfitType: 'dress_apron',
          scale: 0.98,
          isPregnant: true
        },
        traits: {
          openness: 0.85,
          conscientiousness: 0.8,
          extraversion: 0.75,
          agreeableness: 0.9,
          neuroticism: 0.2,
          aggression: 0.05,
          greed: 0.05,
          libido: 0.5,
          workEthic: 0.75
        }
      },
      // 10. Toby Stone (Male, Adorable 2-Year-Old Toddler in Denim Overalls)
      {
        id: 'agent_toby',
        name: 'Toby Stone',
        familyName: 'Stone',
        age: 2,
        role: 'toddler',
        homeCabinId: 'cabin_stone',
        x: 1890,
        y: 1320,
        cash: 5,
        equippedWeapon: 'fists',
        appearance: {
          gender: 'male',
          skinColor: '#fbd0b2',
          hairColor: '#4a2c1b',
          hairStyle: 'short',
          shirtColor: '#93c5fd', // Light blue undershirt
          pantsColor: '#1d4ed8', // Denim blue overalls
          accessory: 'none',
          eyeColor: '#1f2937',
          facialHair: 'none',
          outfitType: 'toddler',
          scale: 0.72
        },
        traits: {
          openness: 0.95,
          conscientiousness: 0.3,
          extraversion: 0.9,
          agreeableness: 0.9,
          neuroticism: 0.1,
          aggression: 0.05,
          greed: 0.0,
          libido: 0.0,
          workEthic: 0.3
        }
      }
    ];

    for (const d of defaultData) {
      this.spawnCitizen(d);
    }
  }

  public spawnCitizen(custom?: Partial<AgentData>): Agent {
    const id = custom?.id || 'agent_' + Math.random().toString(36).substring(2, 9);
    const firstNamesMale = ['Silas', 'Bram', 'Cole', 'Gideon', 'Ronan', 'Torin', 'Gulliver'];
    const firstNamesFemale = ['Mira', 'Willow', 'Freya', 'Hazel', 'Ivy', 'Lyra', 'Rosalind'];
    const familyNames = ['Vance', 'Thorne', 'Gale', 'Sol', 'Stone', 'Bron', 'Alder', 'Winter', 'Rivers', 'Oakwood'];

    const gender: 'male' | 'female' = custom?.appearance?.gender === 'female' 
      ? 'female' 
      : (custom?.appearance?.gender === 'male' ? 'male' : (Math.random() > 0.5 ? 'female' : 'male'));
    const chosenFirst = gender === 'female' 
      ? firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)]
      : firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)];

    const chosenFamily = custom?.familyName || familyNames[Math.floor(Math.random() * familyNames.length)];
    const fullName = custom?.name || `${chosenFirst} ${chosenFamily}`;

    const familyCabin = this.world.buildings.find(b => b.familyName === chosenFamily);
    const homeCabinId = custom?.homeCabinId || (familyCabin ? familyCabin.id : 'cabin_vance');

    const roles = ['lumberjack', 'forager', 'fisher', 'cook', 'healer', 'builder', 'hunter', 'settler'] as const;
    const role = custom?.role || roles[Math.floor(Math.random() * roles.length)];

    // Build a complete random appearance for the chosen gender, then let the
    // caller override just the pieces they care about (e.g. only the gender).
    const generatedAppearance: AgentData['appearance'] = {
      gender,
      skinColor: ['#fbd0b2', '#e0ac69', '#d4a373', '#ffdbac', '#8d5524'][Math.floor(Math.random() * 5)],
      hairColor: ['#18181b', '#78350f', '#b45309', '#ca8a04', '#e2e8f0'][Math.floor(Math.random() * 5)],
      hairStyle: gender === 'female' 
        ? (['ponytail', 'wavy', 'long', 'bun', 'braids'] as const)[Math.floor(Math.random() * 5)]
        : (['short', 'buzz', 'short', 'spiky', 'long'] as const)[Math.floor(Math.random() * 5)],
      shirtColor: ['#9a3412', '#15803d', '#0284c7', '#ea580c', '#7c3aed', '#475569'][Math.floor(Math.random() * 6)],
      dressColor: gender === 'female' ? ['#166534', '#0369a1', '#b91c1c', '#7c3aed'][Math.floor(Math.random() * 4)] : undefined,
      apronColor: gender === 'female' && Math.random() > 0.4 ? '#fdfbf7' : undefined,
      pantsColor: ['#1c1917', '#292524', '#334155', '#44403c'][Math.floor(Math.random() * 4)],
      accessory: gender === 'female' ? (['flower', 'ribbon', 'none'] as const)[Math.floor(Math.random() * 3)] : (['hat', 'headband', 'none'] as const)[Math.floor(Math.random() * 3)],
      eyeColor: ['#0284c7', '#10b981', '#854d0e', '#38bdf8'][Math.floor(Math.random() * 4)],
      facialHair: gender === 'male' ? (['none', 'stubble', 'beard', 'mustache'] as const)[Math.floor(Math.random() * 4)] : 'none',
      outfitType: gender === 'female' ? (Math.random() > 0.4 ? 'dress_apron' : 'skirt_blouse') : (Math.random() > 0.5 ? 'tunic_pants' : 'vest_pants'),
      scale: gender === 'female' ? 0.95 : 1.04
    };

    const agentData: AgentData = {
      id,
      name: fullName,
      familyName: chosenFamily,
      age: custom?.age || Math.floor(Math.random() * 30 + 18),
      role,
      cash: custom?.cash !== undefined ? custom.cash : Math.floor(Math.random() * 50 + 15),
      x: custom?.x || 1150 + (Math.random() * 120 - 60),
      y: custom?.y || 850 + (Math.random() * 120 - 60),
      facing: 'down',
      walkCycle: 0,
      actionState: 'idle',
      actionTimer: 0,
      homeCabinId,
      schedule: [],
      routineInterrupted: false,
      wantsToBuildHouse: !familyCabin,
      spouseId: custom?.spouseId,
      isPregnant: custom?.isPregnant || custom?.appearance?.isPregnant,
      pregnancyProgress: custom?.pregnancyProgress,
      exactAge: custom?.exactAge ?? custom?.age,
      motherId: custom?.motherId,
      fatherId: custom?.fatherId,
      maxLifespan: custom?.maxLifespan || Math.floor(74 + Math.random() * 14),
      needs: {
        hunger: custom?.needs?.hunger ?? (75 + Math.random() * 20),
        energy: custom?.needs?.energy ?? (75 + Math.random() * 20),
        social: custom?.needs?.social ?? (60 + Math.random() * 25),
        fun: custom?.needs?.fun ?? (55 + Math.random() * 25),
        health: custom?.needs?.health ?? 100,
        morality: custom?.needs?.morality ?? (60 + Math.random() * 30)
      },
      traits: custom?.traits || {
        openness: (Math.random() * 2 - 1),
        conscientiousness: (Math.random() * 2 - 1),
        extraversion: (Math.random() * 2 - 1),
        agreeableness: (Math.random() * 2 - 1),
        neuroticism: (Math.random() * 2 - 1),
        aggression: Math.random() * 0.45,
        greed: Math.random() * 0.35,
        libido: Math.random() * 0.7,
        workEthic: 0.65 + Math.random() * 0.35
      },
      appearance: custom?.appearance 
        ? { ...generatedAppearance, ...custom.appearance }
        : generatedAppearance,
      relationships: {},
      memories: [
        {
          id: 'mem_init',
          timestamp: Date.now(),
          description: `Settled in the forest as part of the ${chosenFamily} family.`,
          emotionalWeight: 25
        }
      ],
      isPossessed: false,
      equippedWeapon: custom?.equippedWeapon || (role === 'lumberjack' ? 'axe' : role === 'builder' ? 'hammer' : role === 'hunter' ? 'bow' : 'knife'),
      thought: 'Taking in the grand pine forests...'
    };

    // Ensure citizen never spawns inside river water
    if (this.world.isWater(agentData.x, agentData.y, 14)) {
      const clear = this.world.findClearSpotForHouse();
      agentData.x = clear.x;
      agentData.y = clear.y;
    }

    const agent = new Agent(agentData);
    this.agents.push(agent);
    this.addDramaEvent('general', `${agent.data.name} [${chosenFamily} Family] arrived in the settlement as a ${agent.data.role}.`, [agent.data.id]);
    return agent;
  }

  public spawnCitizenWithSelectedOptions(customX?: number, customY?: number): Agent {
    const gender: 'male' | 'female' = this.selectedSettlerGender === 'random'
      ? (Math.random() > 0.5 ? 'female' : 'male')
      : this.selectedSettlerGender;

    const role = this.selectedSettlerRole === 'random'
      ? undefined
      : this.selectedSettlerRole;

    const cf = this.world.campfire;
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 85;
    let spawnX = customX !== undefined ? customX : (cf.x + Math.cos(angle) * dist);
    let spawnY = customY !== undefined ? customY : (cf.y + Math.sin(angle) * dist);

    if (this.world.isWater(spawnX, spawnY, 14)) {
      const clear = this.world.findClearSpotForHouse();
      spawnX = clear.x + (Math.random() * 40 - 20);
      spawnY = clear.y + (Math.random() * 40 - 20);
    }

    const agent = this.spawnCitizen({
      appearance: {
        gender
      } as any,
      role,
      x: spawnX,
      y: spawnY
    });

    this.world.spawnSpecialEffect('sparkle', agent.data.x, agent.data.y - 15);
    this.world.spawnSpecialEffect('heart_burst', agent.data.x, agent.data.y - 25);
    this.selectedAgent = agent;
    return agent;
  }

  public update(deltaSeconds: number): void {
    // Clear references to entities that were removed by the God player, decay,
    // or any other system before ticking the simulation.
    this.validateSelections();

    if (this.timeSpeed === 0 || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;

    const scaledDelta = deltaSeconds * this.timeSpeed;

    this.gameMinutes += scaledDelta;
    if (this.gameMinutes >= 1440) {
      this.gameMinutes = 0;
      this.day += 1;
      this.addDramaEvent('general', `🌅 Day ${this.day} breaks across the vast river valley.`, []);
    }

    this.weatherTimer -= scaledDelta;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 400 + Math.random() * 300;
      const weathers: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'stormy'];
      this.weather = weathers[Math.floor(Math.random() * weathers.length)];
      this.addDramaEvent('general', `Forest skies shifted to ${this.weather}.`, []);
    }
    this.world.weather = this.weather;

    // The merchant caravan wanders the valley road and drops by occasionally.
    if (this.caravan.update(scaledDelta)) {
      this.addDramaEvent(
        'work',
        '🐫 A merchant caravan trudges into the valley, its pack camel loaded with salt, spice and cloth for the settlement.',
        []
      );
    }

    this.world.update(scaledDelta, this.agents);

    // Drain wildlife drama events (animal births, baby growth, mating)
    while (this.world.wildlife.pendingEvents.length > 0) {
      const evt = this.world.wildlife.pendingEvents.shift()!;
      this.addDramaEvent(evt.category, evt.message, []);
    }

    for (const agent of this.agents) {
      const eventMessage = agent.update(scaledDelta, this.world, this.agents, this.gameMinutes);
      if (eventMessage) {
        let cat: DramaEvent['category'] = 'general';
        if (eventMessage.includes('❤️') || eventMessage.includes('💖') || eventMessage.includes('MARRIAGE')) cat = 'love';
        else if (eventMessage.includes('⚠️') || eventMessage.includes('fight') || eventMessage.includes('brawl')) cat = 'violence';
        else if (eventMessage.includes('🔨') || eventMessage.includes('deposited') || eventMessage.includes('chopping')) cat = 'work';
        else if (eventMessage.includes('💔') || eventMessage.includes('rejected')) cat = 'love';
        else if (eventMessage.includes('💬')) cat = 'dialog';

        this.addDramaEvent(cat, eventMessage, [agent.data.id]);
      }
    }

    // Update human pregnancy progress and deliver babies
    this.updateHumanPregnancies(scaledDelta);

    // Update natural human aging across life stages
    this.updateHumanAging(scaledDelta);

    // Periodic romantic intimacy check for married/in-love couples (conception)
    if (Math.random() < 0.05) {
      this.checkCouplesRomanceAndConception();
    }

    // Process mortality countdown for dead agents (10 seconds smite removal)
    for (let i = this.agents.length - 1; i >= 0; i--) {
      const agent = this.agents[i];
      if (agent.data.isDead || agent.data.actionState === 'dead') {
        if (agent.data.deathTimer !== undefined) {
          if (agent.data.deathTimer <= 3.0 && Math.random() < 0.25) {
            this.addSpecialEffect(
              'sparkle',
              agent.data.x + (Math.random() - 0.5) * 20,
              agent.data.y - 12 + (Math.random() - 0.5) * 20,
              0.8
            );
          }
          if (agent.data.deathTimer <= 0) {
            this.removeAgent(agent.data.id);
          }
        }
      }
    }

    for (let i = this.specialEffects.length - 1; i >= 0; i--) {
      const fx = this.specialEffects[i];
      fx.timer -= deltaSeconds;
      if (fx.timer <= 0) {
        this.specialEffects.splice(i, 1);
      }
    }
  }

  /**
   * Human Pregnancy System:
   * Biological duration: ~9 months real-world gestation.
   * At 1 RL year = 10 game days, 9 months = 7.5 in-game days = 10,800 game minutes.
   */
  private updateHumanPregnancies(scaledDelta: number): void {
    for (const agent of this.agents) {
      if (agent.data.isPregnant && !agent.data.isDead) {
        if (agent.data.pregnancyProgress === undefined) {
          agent.data.pregnancyProgress = 0;
        }
        // Progress percentage increment: 100% over 10,800 game minutes
        const progressIncrement = (scaledDelta / 10800) * 100;
        agent.data.pregnancyProgress = Math.min(100, agent.data.pregnancyProgress + progressIncrement);

        if (agent.data.pregnancyProgress >= 100) {
          this.deliverHumanBaby(agent);
        }
      }
    }
  }

  /**
   * Delivers a newborn baby to an expecting mother, welcoming a new member
   * into the settlement family and completing the pregnancy cycle!
   */
  public deliverHumanBaby(mother: Agent): Agent {
    mother.data.isPregnant = false;
    mother.data.appearance.isPregnant = false;
    mother.data.pregnancyProgress = undefined;
    mother.setBubble('heart', 5);

    const father = this.agents.find(a => a.data.id === mother.data.spouseId) ||
                   this.agents.find(a => a.data.familyName === mother.data.familyName && a.data.appearance.gender === 'male' && a.data.id !== mother.data.id);

    if (father) {
      father.setBubble('heart', 5);
    }

    const babyGender: 'male' | 'female' = Math.random() < 0.5 ? 'male' : 'female';
    const boyNames = ['Ethan', 'Liam', 'Noah', 'Finnian', 'Silas', 'Oliver', 'Luke', 'Mason', 'Caleb', 'Julian', 'Samuel', 'Arthur'];
    const girlNames = ['Maeve', 'Chloe', 'Lily', 'Ella', 'Nora', 'Hazel', 'Freya', 'Aurora', 'Maya', 'Grace', 'Rose', 'Hannah'];
    const firstName = babyGender === 'male'
      ? boyNames[Math.floor(Math.random() * boyNames.length)]
      : girlNames[Math.floor(Math.random() * girlNames.length)];
    const fullName = `${firstName} ${mother.data.familyName}`;

    const babyId = 'agent_baby_' + Math.random().toString(36).substring(2, 9);
    const babyAppearance = {
      gender: babyGender,
      skinColor: mother.data.appearance.skinColor,
      hairColor: father ? father.data.appearance.hairColor : mother.data.appearance.hairColor,
      hairStyle: 'short' as const,
      shirtColor: babyGender === 'female' ? '#f472b6' : '#60a5fa',
      pantsColor: '#1e293b',
      accessory: 'none' as const,
      eyeColor: mother.data.appearance.eyeColor || '#1f2937',
      facialHair: 'none' as const,
      outfitType: 'toddler' as const,
      scale: 0.60
    };

    const babyData: AgentData = {
      id: babyId,
      name: fullName,
      familyName: mother.data.familyName,
      age: 0,
      exactAge: 0,
      role: 'toddler',
      homeCabinId: mother.data.homeCabinId,
      motherId: mother.data.id,
      fatherId: father?.data.id,
      x: mother.data.x + (Math.random() * 20 - 10),
      y: mother.data.y + (Math.random() * 16 - 8),
            actionState: 'sleeping',
      actionTimer: 8,
      facing: 'down',
      cash: 0,
      walkCycle: 0,
      schedule: [],
      routineInterrupted: false,
      isPossessed: false,
      thought: 'Sleeping soundly wrapped in a soft swaddling blanket.',
      needs: { hunger: 90, energy: 95, social: 85, fun: 80, health: 100, morality: 100 },
      traits: {
        openness: 0.8,
        conscientiousness: 0.5,
        extraversion: 0.7,
        agreeableness: 0.9,
        neuroticism: 0.1,
        aggression: 0.0,
        greed: 0.0,
        libido: 0.0,
        workEthic: 0.5
      },
      appearance: babyAppearance,
      memories: [
        {
          id: 'mem_birth',
          timestamp: this.gameMinutes,
          description: `Safely born into the ${mother.data.familyName} family in the settlement`,
          emotionalWeight: 90
        }
      ],
                  relationships: {}
    };

    const cabin = this.world.getBuildingById(mother.data.homeCabinId);
    if (cabin && !cabin.ownerIds.includes(babyId)) {
      cabin.ownerIds.push(babyId);
    }

    const babyAgent = new Agent(babyData);
    this.agents.push(babyAgent);

    const relToBaby = mother.getOrCreateRelationship(babyAgent.data);
    relToBaby.affinity = 100;
    relToBaby.trust = 100;
    relToBaby.attraction = 0;
    relToBaby.status = 'friend';

    const relToMother = babyAgent.getOrCreateRelationship(mother.data);
    relToMother.affinity = 100;
    relToMother.trust = 100;
    relToMother.attraction = 0;
    relToMother.status = 'friend';

    if (father) {
      const relFatherToBaby = father.getOrCreateRelationship(babyAgent.data);
      relFatherToBaby.affinity = 100;
      relFatherToBaby.trust = 100;
      relFatherToBaby.attraction = 0;
      relFatherToBaby.status = 'friend';

      const relBabyToFather = babyAgent.getOrCreateRelationship(father.data);
      relBabyToFather.affinity = 100;
      relBabyToFather.trust = 100;
      relBabyToFather.attraction = 0;
      relBabyToFather.status = 'friend';
      father.addMemory(`Welcomed our precious new baby, ${fullName}, into our family!`, 90);
    }
    mother.addMemory(`Gave birth to a healthy newborn baby, ${fullName}!`, 95);

    this.world.spawnSpecialEffect('heart_burst', mother.data.x, mother.data.y - 20, undefined, undefined, 1.5);
    this.world.spawnSpecialEffect('sparkle', mother.data.x, mother.data.y - 10, undefined, undefined, 1.5);

    this.addDramaEvent(
      'love',
      `🍼 BLESSED ARRIVAL: ${mother.data.name} has safely given birth to baby ${fullName} [${mother.data.familyName} Family]! The whole settlement rejoices!`,
      [mother.data.id, babyId]
    );

    return babyAgent;
  }

  /**
   * Natural Human Aging System:
   * Conversion baseline: 1 Real-Life Year (365 days) = 10 In-Game Days = 14,400 game minutes.
   * Settlers age continuously and transition across:
   * - Infant (Age 0)
   * - Toddler (Ages 1 to 3)
   * - Child (Ages 4 to 15, strictly playing, never working)
   * - Adult Maturity (Ages 16 to 59, working, romancing, building)
   * - Elder (Ages 60+, wisdom and council)
   */
  private updateHumanAging(scaledDelta: number): void {
    for (const agent of this.agents) {
      if (agent.data.isDead) continue;

      if (agent.data.exactAge === undefined) {
        agent.data.exactAge = agent.data.age;
      }

      const oldAgeFloor = Math.floor(agent.data.exactAge);
      agent.data.exactAge += scaledDelta / 14400;
      const newAgeFloor = Math.floor(agent.data.exactAge);
      agent.data.age = newAgeFloor;

      if (newAgeFloor > oldAgeFloor) {
        this.handleHumanBirthdayMilestone(agent, oldAgeFloor, newAgeFloor);
      }

      // Natural old age mortality: elders eventually pass away peacefully
      if (agent.data.age >= 60 && !agent.data.isDead) {
        if (!agent.data.maxLifespan) {
          agent.data.maxLifespan = Math.floor(74 + Math.random() * 14);
        }

        // Hard limit: reached full natural lifespan
        if (agent.data.exactAge >= agent.data.maxLifespan) {
          this.passAwayOfOldAge(agent);
          continue;
        }

        // Natural daily mortality risk in deep old age
        let dailyRisk = 0;
        if (agent.data.age >= 85) dailyRisk = 0.20;
        else if (agent.data.age >= 80) dailyRisk = 0.12;
        else if (agent.data.age >= 75) dailyRisk = 0.06;
        else if (agent.data.age >= 70) dailyRisk = 0.03;
        else if (agent.data.age >= 65) dailyRisk = 0.012;

        if (dailyRisk > 0 && Math.random() < (dailyRisk * (scaledDelta / 1440))) {
          this.passAwayOfOldAge(agent);
          continue;
        }
      }
    }
  }

  /**
   * Handles visual sprite, role, and schedule transformations when settlers
   * cross life-stage age thresholds.
   */
  public handleHumanBirthdayMilestone(agent: Agent, oldAge: number, newAge: number): void {
    // 1. Infant -> Toddler (Age 0 -> 1)
    if (newAge === 1 && oldAge === 0) {
      agent.data.role = 'toddler';
      agent.data.appearance.outfitType = 'toddler';
      agent.data.appearance.scale = 0.68;
      agent.setBubble('peace', 4);
      agent.addMemory('Celebrated my 1st birthday! Started crawling on all fours and exploring toys.', 60);
      agent.initDefaultSchedule();
      this.world.spawnSpecialEffect('sparkle', agent.data.x, agent.data.y - 15, undefined, undefined, 1.2);
      this.addDramaEvent(
        'general',
        `🎂 FIRST BIRTHDAY: Little ${agent.data.name} [${agent.data.familyName} Family] celebrated their 1st birthday and started crawling as an active toddler!`,
        [agent.data.id]
      );
      return;
    }

    // 2. Toddler -> Child (Age 3 -> 4)
    if (newAge === 4 && oldAge < 4) {
      agent.data.role = 'settler';
      const female = agent.data.appearance.gender === 'female';
      agent.data.appearance.outfitType = female ? 'dress_apron' : 'tunic_pants';
      agent.data.appearance.scale = 0.86;
      agent.setBubble('laugh', 4);
      agent.addMemory('Turned 4 years old! Standing up on two feet and playing games with the village children.', 70);
      agent.initDefaultSchedule();
      this.world.spawnSpecialEffect('heart_burst', agent.data.x, agent.data.y - 20, undefined, undefined, 1.2);
      this.world.spawnSpecialEffect('sparkle', agent.data.x, agent.data.y - 10, undefined, undefined, 1.2);
      this.addDramaEvent(
        'general',
        `🧒 GROWING UP: ${agent.data.name} celebrated their 4th birthday and grown out of toddlerhood into a playful child!`,
        [agent.data.id]
      );
      return;
    }

    // 3. Child -> Adult Maturity (Age 15 -> 16)
    if (newAge === 16 && oldAge < 16) {
      const roles: SettlerRole[] = ['lumberjack', 'forager', 'fisher', 'cook', 'builder', 'hunter', 'settler'];
      const counts: Record<string, number> = {};
      for (const a of this.agents) {
        counts[a.data.role] = (counts[a.data.role] || 0) + 1;
      }
      let chosenRole: SettlerRole = 'settler';
      if ((counts['lumberjack'] || 0) < 2) chosenRole = 'lumberjack';
      else if ((counts['forager'] || 0) < 2) chosenRole = 'forager';
      else if ((counts['fisher'] || 0) < 2) chosenRole = 'fisher';
      else if ((counts['cook'] || 0) < 2) chosenRole = 'cook';
      else if ((counts['builder'] || 0) < 2) chosenRole = 'builder';
      else if ((counts['hunter'] || 0) < 2) chosenRole = 'hunter';
      else chosenRole = roles[Math.floor(Math.random() * roles.length)];

      agent.data.role = chosenRole;
      agent.data.appearance.scale = agent.data.appearance.gender === 'female' ? 0.96 : 1.02;
      agent.setBubble('idea', 5);
      agent.addMemory(`Reached full adulthood at Age 16! Ready to contribute as the settlement's newest ${chosenRole}.`, 85);
      agent.initDefaultSchedule();
      this.world.spawnSpecialEffect('heart_burst', agent.data.x, agent.data.y - 25, undefined, undefined, 1.5);
      this.world.spawnSpecialEffect('sparkle', agent.data.x, agent.data.y - 15, undefined, undefined, 1.5);
      this.addDramaEvent(
        'general',
        `🎓 COMING OF AGE: ${agent.data.name} [${agent.data.familyName} Family] reached full maturity at Age 16 and stepped into adulthood as a ${chosenRole}!`,
        [agent.data.id]
      );
      return;
    }

    // 4. Adult -> Elder (Age 59 -> 60)
    if (newAge === 60 && oldAge < 60) {
      agent.data.role = 'elder';
      agent.setBubble('peace', 4);
      agent.addMemory('Reached the venerable age of 60, joining the elder council of the settlement.', 75);
      agent.initDefaultSchedule();
      this.addDramaEvent(
        'general',
        `📜 VENERABLE ELDER: ${agent.data.name} [${agent.data.familyName} Family] reached age 60 and joined the village elder council!`,
        [agent.data.id]
      );
    }
  }

  /**
   * Periodic check for conception among married or deeply bonded couples.
   */
  private checkCouplesRomanceAndConception(): void {
    const marriedFemales = this.agents.filter(a => 
      a.data.appearance.gender === 'female' &&
      a.data.age >= 18 &&
      a.data.age <= 44 &&
      !a.data.isPregnant &&
      !a.data.isDead &&
      a.data.spouseId
    );

    for (const female of marriedFemales) {
      const spouse = this.agents.find(a => a.data.id === female.data.spouseId);
      if (!spouse || spouse.data.isDead) continue;

      // Strict real-life limit: Max 5 members per house!
      const residents = this.getHouseResidents(female.data.homeCabinId);
      if (residents.length >= 5) continue;

      const hasInfant = this.agents.some(a => a.data.motherId === female.data.id && a.data.age === 0);
      if (hasInfant) continue;

      const dist = Math.hypot(female.data.x - spouse.data.x, female.data.y - spouse.data.y);
      const isCoHabitating = female.data.homeCabinId === spouse.data.homeCabinId;
      const currentHour = Math.floor(this.gameMinutes / 60) % 24;
      const isNightAtHome = isCoHabitating && (currentHour >= 21 || currentHour <= 6);

      if ((dist < 100 || isNightAtHome) && Math.random() < 0.12) {
        female.data.isPregnant = true;
        female.data.appearance.isPregnant = true;
        female.data.pregnancyProgress = 0;
        female.setBubble('heart', 4);
        spouse.setBubble('heart', 4);
        female.addMemory(`Conceived a child with ${spouse.data.name}! We are expecting a baby in our family home.`, 85, spouse.data.id);
        spouse.addMemory(`Conceived a child with ${female.data.name}! We are expecting a baby in our family home.`, 85, female.data.id);
        this.addDramaEvent(
          'love',
          `❤️ BLESSED NEWS: ${female.data.name} and ${spouse.data.name} [${female.data.familyName} Family] are expecting a child in their home (${residents.length}/5 members)!`,
          [female.data.id, spouse.data.id]
        );
        break;
      }
    }
  }

  public forceDeliverBaby(motherId: string): Agent | null {
    const mother = this.agents.find(a => a.data.id === motherId);
    if (!mother || !mother.data.isPregnant) return null;
    return this.deliverHumanBaby(mother);
  }

  public forceAgeUp(agentId: string, years = 1): void {
    const agent = this.agents.find(a => a.data.id === agentId);
    if (!agent) return;
    const oldAge = agent.data.age;
    agent.data.exactAge = (agent.data.exactAge ?? agent.data.age) + years;
    agent.data.age = Math.floor(agent.data.exactAge);
    this.handleHumanBirthdayMilestone(agent, oldAge, agent.data.age);
  }

  public forceMatureToAdult(agentId: string): void {
    const agent = this.agents.find(a => a.data.id === agentId);
    if (!agent || agent.data.age >= 16) return;
    const oldAge = agent.data.age;
    agent.data.exactAge = 16;
    agent.data.age = 16;
    this.handleHumanBirthdayMilestone(agent, oldAge, 16);
  }

  /**
   * Natural Passing of Old Age:
   * When an elder reaches the end of their natural lifespan, they peacefully
   * close their eyes, leaving their legacy and memories to their children and settlement.
   */
  public passAwayOfOldAge(agent: Agent): void {
    if (agent.data.isDead) return;

    agent.data.isDead = true;
    agent.data.causeOfDeath = 'old_age';
    agent.data.actionState = 'dead';
    agent.data.deathTimer = 12.0;
    agent.data.needs.health = 0;
    agent.data.thought = '...peacefully closing my eyes for the final long sleep, leaving my love to the settlement...';
    agent.setBubble('peace', 6);

    // Surviving spouse grieving and unlinking
    if (agent.data.spouseId) {
      const spouse = this.agents.find(a => a.data.id === agent.data.spouseId);
      if (spouse && !spouse.data.isDead) {
        spouse.data.spouseId = undefined;
        spouse.setBubble('tears', 6);
        spouse.addMemory(`Mourning the peaceful passing of my beloved spouse, ${agent.data.name} (Age ${agent.data.age})`, -45, agent.data.id);
      }
    }

    // Family members honoring and grieving
    const familyMembers = this.agents.filter(a => 
      a.data.id !== agent.data.id && 
      !a.data.isDead && 
      (a.data.familyName === agent.data.familyName || a.data.motherId === agent.data.id || a.data.fatherId === agent.data.id)
    );

    for (const member of familyMembers) {
      member.addMemory(`Honoring the memory of our beloved elder, ${agent.data.name} (Age ${agent.data.age})`, -35, agent.data.id);
      if (Math.random() < 0.4) {
        member.setBubble('tears', 4.5);
      }
    }

    this.world.spawnSpecialEffect('sparkle', agent.data.x, agent.data.y - 12, undefined, undefined, 2.0);

    this.addDramaEvent(
      'general',
      `🕊️ PASSING OF AN ELDER: ${agent.data.name} [${agent.data.familyName} Family] has peacefully passed away of old age at the venerable age of ${agent.data.age}. Their legacy lives on in the settlement.`,
      [agent.data.id]
    );
  }

  public forcePassOfOldAge(agentId: string): void {
    const agent = this.agents.find(a => a.data.id === agentId);
    if (!agent || agent.data.isDead) return;
    this.passAwayOfOldAge(agent);
  }

  /**
   * Guarantees that every UI selection still points at a live entity.
   * Natural tree decay and divine demolition can remove objects between frames.
   */
  public validateSelections(): void {
    if (this.selectedAgent && !this.agents.includes(this.selectedAgent)) {
      this.selectedAgent = null;
    }
    if (this.selectedBuilding && !this.world.buildings.includes(this.selectedBuilding)) {
      this.selectedBuilding = null;
    }
    if (this.movingBuilding && !this.world.buildings.includes(this.movingBuilding)) {
      this.movingBuilding = null;
    }
    if (this.selectedTree && !this.world.trees.includes(this.selectedTree)) {
      this.selectedTree = null;
    }
    if (this.possessedAgent && !this.agents.includes(this.possessedAgent)) {
      this.possessedAgent.data.isPossessed = false;
      this.possessedAgent = null;
    }
  }

  public isProtectedBuilding(building: Building): boolean {
    return PROTECTED_BUILDING_TYPES.includes(building.type);
  }

  public addDramaEvent(category: DramaEvent['category'], text: string, agentIds: string[]): void {
    const event: DramaEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      timeString: this.getTimeFormatted(),
      category,
      text,
      agentIds
    };
    this.eventLog.unshift(event);
    if (this.eventLog.length > 50) {
      this.eventLog.pop();
    }
    if (this.onEventAdded) {
      this.onEventAdded(event);
    }
  }

  public getTimeFormatted(): string {
    const hours = Math.floor(this.gameMinutes / 60);
    const mins = Math.floor(this.gameMinutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `Day ${this.day}, ${h12}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }

  // --- GOD MODE POWERS ---

  public executeGodPower(worldX: number, worldY: number, targetAgent?: Agent, targetAnimal?: WildlifeAnimal): void {
    switch (this.activeGodPower) {
      case 'lightning':
        this.castDivineLightning(worldX, worldY);
        break;

      case 'cupid':
        this.castCupidCurse(worldX, worldY, targetAgent);
        break;

      case 'discord':
        this.castDiscordCurse(worldX, worldY, targetAgent);
        break;

      case 'drop_cash':
        this.world.spawnItem('log', 'Divine Timber (+10 Logs)', worldX, worldY, 80);
        this.world.stockpile.wood += 10;
        this.addSpecialEffect('sparkle', worldX, worldY, 1.2);
        this.addDramaEvent('miracle', `✨ Divine Gift: 10 seasoned timber logs materialized!`, []);
        break;

      case 'rain':
        this.weather = 'rainy';
        this.weatherTimer = 240;
        this.addDramaEvent('miracle', `🌧️ Gentle rain began falling over the forest valley.`, []);
        break;

      case 'drop_food':
        this.world.spawnItem('meal', 'Great Roasted Banquet', worldX, worldY, 60);
        this.world.stockpile.food += 15;
        this.addSpecialEffect('sparkle', worldX, worldY, 1.2);
        this.addDramaEvent('miracle', `✨ Divine Feast: Plentiful food replenished the settlement reserves!`, []);
        break;

      case 'drop_weapon':
        const weapons: ItemType[] = ['axe', 'hammer', 'knife'];
        const chosen = weapons[Math.floor(Math.random() * weapons.length)];
        this.world.spawnItem(chosen, `Forged ${chosen.toUpperCase()}`, worldX, worldY, 45);
        this.addSpecialEffect('sparkle', worldX, worldY, 1.2);
        this.addDramaEvent('miracle', `A forged ${chosen} dropped from the heavens.`, []);
        break;

      case 'build_homestead':
        this.commandBuildHomestead(worldX, worldY, targetAgent);
        break;

      case 'create_house':
        this.createHouse(worldX, worldY);
        break;

      case 'move_house':
        if (!this.movingBuilding) {
          const clickedB = this.getBuildingAt(worldX, worldY);
          if (clickedB) {
            this.movingBuilding = clickedB;
            this.addDramaEvent('general', `Picked up ${clickedB.name}. Click new location on solid land to place.`, []);
          } else {
            this.addDramaEvent('general', `Click on an existing building to pick it up for relocation.`, []);
          }
        } else {
          const moved = this.moveHouse(
            this.movingBuilding.id,
            worldX - this.movingBuilding.width / 2,
            worldY - this.movingBuilding.height / 2
          );
          if (moved) {
            this.movingBuilding = null;
          }
        }
        break;

      case 'destroy_house':
        const targetB = this.getBuildingAt(worldX, worldY);
        if (targetB) {
          this.destroyHouse(targetB.id);
        } else {
          this.addDramaEvent('general', `Click on an existing building to demolish it.`, []);
        }
        break;

      case 'plant_tree':
        this.plantTree(worldX, worldY, this.selectedPlantTreeVariant, this.selectedPlantTreeStage);
        break;

      case 'remove_tree': {
        const clickedTree = this.getTreeAt(worldX, worldY);
        if (clickedTree) {
          this.removeTree(clickedTree.id);
        } else {
          this.addDramaEvent('general', `Click directly on a tree to chop it down.`, []);
        }
        break;
      }

      case 'spawn_settler': {
        if (!this.world.isWater(worldX, worldY, 12)) {
          this.spawnCitizenWithSelectedOptions(worldX, worldY);
        } else {
          this.addDramaEvent('general', '⚠️ Cannot spawn a settler in river waters! Choose solid ground.', []);
        }
        break;
      }

      case 'tranquility':
        this.castTranquility();
        break;

      case 'resurrect':
        if (!targetAgent) {
          this.addDramaEvent('general', `✨ Click directly on a settler to restore them.`, []);
          break;
        }
        targetAgent.data.needs.health = 100;
        targetAgent.data.needs.energy = 100;
        targetAgent.data.actionState = 'idle';
        targetAgent.data.actionTimer = 0;
        targetAgent.data.routineInterrupted = false;
        targetAgent.data.interruptionReason = undefined;
        targetAgent.data.interruptionTimer = undefined;
        targetAgent.setBubble('peace', 4);
        this.addSpecialEffect('sparkle', worldX, worldY, 2.0);
        this.addDramaEvent('miracle', `✨ Divine Blessing: ${targetAgent.data.name} was fully restored!`, [targetAgent.data.id]);
        break;

      case 'smite': {
        const candidateAgent = targetAgent || this.getAgentAt(worldX, worldY);
        const candidateAnimal = targetAnimal || this.getAnimalAt(worldX, worldY, 36);

        const target = (candidateAgent && !candidateAgent.data.isDead) ? candidateAgent
          : (candidateAnimal && !candidateAnimal.isDead) ? candidateAnimal
          : candidateAgent || candidateAnimal;

        if (!target) {
          this.addDramaEvent('general', `💀 Click directly on any living settler or animal to smite them.`, []);
          break;
        }

        if (('data' in target && target.data.isDead) || (!('data' in target) && target.isDead)) {
          this.addDramaEvent('general', `⚡ That soul has already been smitten and is departing this world.`, []);
          break;
        }

        this.smiteLivingThing(target, worldX, worldY);
        break;
      }

      case 'possess':
        if (!targetAgent) {
          this.addDramaEvent('general', `🎭 Click directly on a settler to possess them.`, []);
          break;
        }
        this.togglePossession(targetAgent);
        break;

      case 'inspect':
      default:
        if (targetAgent) {
          this.selectedAgent = targetAgent;
        }
        break;
    }
  }

  public commandBuildHomestead(x: number, y: number, targetAgent?: Agent): void {
    const builder = targetAgent || this.agents[Math.floor(Math.random() * this.agents.length)];
    const familyName = builder.data.familyName;
    const houseName = `${familyName} Homestead`;

    const site = this.world.createBuildingSite(houseName, familyName, x - 95, y - 75, builder.data.id);
    builder.data.targetBuildingId = site.id;
    builder.setBubble('hammer', 5);
    builder.addMemory(`God blessed the construction of my new family home: ${houseName}`, 85);
    this.addSpecialEffect('sparkle', site.x + 95, site.y + 75, 1.5);
    this.addDramaEvent('work', `🔨 Divine Command: ${builder.data.name} began raising a new family home [${houseName}]!`, [builder.data.id]);
  }

  public castDivineLightning(x: number, y: number): void {
    this.addSpecialEffect('lightning', x, y, 0.8);
    this.addDramaEvent('miracle', `⚡ A terrifying lightning bolt struck the forest floor!`, []);

    for (const agent of this.agents) {
      const dist = Math.hypot(agent.data.x - x, agent.data.y - y);
      if (dist < 140) {
        agent.data.needs.health = Math.max(15, agent.data.needs.health - 40);
        agent.setBubble('shock', 5);
        agent.interruptRoutine('Terrified by Divine Lightning', 12);
        const fleeX = Math.max(60, Math.min(this.world.width - 60, agent.data.x + (agent.data.x - x) * 2));
        const fleeY = Math.max(60, Math.min(this.world.height - 60, agent.data.y + (agent.data.y - y) * 2));
        agent.setDestination(fleeX, fleeY, this.world, 'fleeing');
      }
    }
  }

  public castCupidCurse(x: number, y: number, target?: Agent): void {
    let agentA = target;
    let agentB: Agent | undefined;

    if (!agentA) {
      const sorted = [...this.agents].sort((a, b) => 
        Math.hypot(a.data.x - x, a.data.y - y) - Math.hypot(b.data.x - x, b.data.y - y)
      );
      agentA = sorted[0];
      agentB = sorted[1];
    } else {
      agentB = this.agents
        .filter(a => a.data.id !== agentA!.data.id)
        .sort((a, b) => 
          Math.hypot(a.data.x - agentA!.data.x, a.data.y - agentA!.data.y) - 
          Math.hypot(b.data.x - agentA!.data.x, b.data.y - agentA!.data.y)
        )[0];
    }

    if (agentA && agentB) {
      const relA = agentA.getOrCreateRelationship(agentB.data);
      const relB = agentB.getOrCreateRelationship(agentA.data);

      relA.attraction = 100;
      relA.affinity = 100;
      relA.status = 'crush';

      relB.attraction = 100;
      relB.affinity = 100;
      relB.status = 'crush';

      agentA.setBubble('heart', 6);
      agentB.setBubble('heart', 6);

      agentA.data.thought = `I am hopelessly in love with ${agentB.data.name}!`;
      agentB.data.thought = `My soul aches for ${agentA.data.name}!`;

      this.addSpecialEffect('heart_burst', (agentA.data.x + agentB.data.x) / 2, (agentA.data.y + agentB.data.y) / 2, 2);
      this.addDramaEvent('love', `💘 CUPID'S CURSE: Passionate love seized ${agentA.data.name} and ${agentB.data.name}!`, [agentA.data.id, agentB.data.id]);
    }
  }

  public castDiscordCurse(x: number, y: number, target?: Agent): void {
    let agentA = target;
    let agentB: Agent | undefined;

    if (!agentA) {
      const sorted = [...this.agents].sort((a, b) => 
        Math.hypot(a.data.x - x, a.data.y - y) - Math.hypot(b.data.x - x, b.data.y - y)
      );
      agentA = sorted[0];
      agentB = sorted[1];
    } else {
      agentB = this.agents
        .filter(a => a.data.id !== agentA!.data.id)
        .sort((a, b) => 
          Math.hypot(a.data.x - agentA!.data.x, a.data.y - agentA!.data.y) - 
          Math.hypot(b.data.x - agentA!.data.x, b.data.y - agentA!.data.y)
        )[0];
    }

    if (agentA && agentB) {
      agentA.triggerConflict(agentB);
      this.addSpecialEffect('smoke', (agentA.data.x + agentB.data.x) / 2, (agentA.data.y + agentB.data.y) / 2, 2);
      this.addDramaEvent('violence', `🔥 SEED OF DISCORD: Bitter hatred provoked a duel between ${agentA.data.name} and ${agentB.data.name}!`, [agentA.data.id, agentB.data.id]);
    }
  }

  public castTranquility(): void {
    for (const agent of this.agents) {
      agent.data.needs.health = Math.min(100, agent.data.needs.health + 30);
      agent.data.needs.social = 90;
      agent.data.targetX = undefined;
      agent.data.targetY = undefined;
      agent.data.finalTargetX = undefined;
      agent.data.finalTargetY = undefined;
      agent.data.waypoints = [];
      agent.data.actionState = 'sitting';
      agent.data.actionTimer = 5;
      agent.data.routineInterrupted = false;
      agent.data.interruptionReason = undefined;
      agent.data.interruptionTimer = undefined;
      agent.setBubble('peace', 4);
      agent.data.thought = 'A serene peace descends through the forest canopy.';
      this.addSpecialEffect('sparkle', agent.data.x, agent.data.y, 1.5);
    }
    this.addDramaEvent('miracle', `🕊️ MASS TRANQUILITY: All strife ceased across the forest realm.`, []);
  }

  public togglePossession(agent: Agent): void {
    if (this.possessedAgent) {
      if (this.possessedAgent.data.activeDialog) {
        const partner = this.agents.find(a => a.data.id === this.possessedAgent!.data.activeDialog!.partnerId);
        this.possessedAgent.finishConversation(partner, this.agents);
      }
      this.possessedAgent.data.isPossessed = false;
      this.addDramaEvent('general', `Released control of ${this.possessedAgent.data.name}.`, [this.possessedAgent.data.id]);
    }

    if (this.possessedAgent?.data.id === agent.data.id) {
      this.possessedAgent = null;
    } else {
      this.possessedAgent = agent;
      agent.data.isPossessed = true;
      this.selectedAgent = agent;
      agent.setBubble('idea', 4, 'POSSESSED');
      this.addDramaEvent('miracle', `👁️ Controlling ${agent.data.name}! WASD: walk, SHIFT: run, C: sit, Z: lay down, E: talk, R: flirt, F: attack.`, [agent.data.id]);
    }
  }

  public setBonfireView(view: BonfireView): void {
    this.world.campfire.view = view;
  }

  public setBonfireState(state: BonfireState): void {
    this.world.campfire.state = state;
  }

  public stokeBonfire(): void {
    const cf = this.world.campfire;
    cf.fuel = Math.min(100, (cf.fuel || 50) + 40);
    cf.intensity = 1.25;
    cf.state = 'burning_high';
    this.addSpecialEffect('sparkle', cf.x, cf.y - 18, 1.5);
    this.addDramaEvent('general', '🔥 Village bonfire stoked with dry timber! Bright flames leap high into the air.', []);
  }

  public douseBonfire(): void {
    const cf = this.world.campfire;
    cf.state = 'smoldering';
    cf.intensity = 0.35;
    this.addSpecialEffect('smoke', cf.x, cf.y - 15, 2.0);
    this.addDramaEvent('general', '💨 Village bonfire doused into peaceful smoldering embers and white smoke.', []);
  }

  public addSpecialEffect(type: 'lightning' | 'heart_burst' | 'smoke' | 'sparkle', x: number, y: number, duration: number): void {
    this.specialEffects.push({
      type,
      x,
      y,
      timer: duration,
      maxTimer: duration
    });
  }

  public getAgentAt(worldX: number, worldY: number): Agent | undefined {
    let closest: Agent | undefined;
    let closestDistance = 28;

    for (const agent of this.agents) {
      const distance = Math.hypot(agent.data.x - worldX, agent.data.y - worldY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = agent;
      }
    }

    return closest;
  }

  public getAnimalAt(worldX: number, worldY: number, radius = 36): WildlifeAnimal | undefined {
    return this.world.getAnimalAt(worldX, worldY, radius);
  }

  public smiteLivingThing(target: Agent | WildlifeAnimal, worldX?: number, worldY?: number): void {
    if ('data' in target) {
      this.smiteAgent(target, worldX, worldY);
    } else {
      this.smiteAnimal(target, worldX, worldY);
    }
  }

  public smiteAgent(agent: Agent, worldX?: number, worldY?: number): void {
    const x = worldX ?? agent.data.x;
    const y = worldY ?? agent.data.y;

    agent.data.isDead = true;
    agent.data.deathTimer = 10.0;
    agent.data.needs.health = 0;
    agent.data.actionState = 'dead';
    agent.data.targetX = undefined;
    agent.data.targetY = undefined;
    agent.data.waypoints = [];
    agent.data.activeDialog = undefined;

    if (agent.data.isPossessed) {
      agent.data.isPossessed = false;
      if (this.possessedAgent?.data.id === agent.data.id) {
        this.possessedAgent = null;
      }
    }

    agent.interruptRoutine('Struck down by Divine Smite', 10);
    agent.setBubble('blood', 4);

    this.addSpecialEffect('lightning', x, y, 0.7);
    this.addSpecialEffect('smoke', x, y, 1.2);
    this.addSpecialEffect('sparkle', x, y, 1.5);
    this.addDramaEvent(
      'violence',
      `⚡ DIVINE SMITE: An unseen heavenly force struck down ${agent.data.name}! Their lifeless body will dissolve in 10 seconds.`,
      [agent.data.id]
    );
  }

  public smiteAnimal(animal: WildlifeAnimal, worldX?: number, worldY?: number): void {
    const x = worldX ?? animal.x;
    const y = worldY ?? animal.y;

    animal.isDead = true;
    animal.deathTimer = 10.0;
    animal.state = 'dead';
    animal.speed = 0;
    animal.targetX = animal.x;
    animal.targetY = animal.y;
    animal.emote = '💀';
    animal.emoteTimer = 10.0;

    this.world.spawnSpecialEffect('lightning', x, y, undefined, undefined, 0.7);
    this.world.spawnSpecialEffect('smoke', x, y, undefined, undefined, 1.2);
    this.world.spawnSpecialEffect('sparkle', x, y, undefined, undefined, 1.5);
    this.addDramaEvent(
      'violence',
      `⚡ DIVINE SMITE: A wild ${animal.type} was struck down by divine wrath! It will return to dust in 10 seconds.`,
      []
    );
  }

  public removeAgent(agentId: string): boolean {
    const idx = this.agents.findIndex(a => a.data.id === agentId);
    if (idx === -1) return false;

    const agent = this.agents[idx];

    // Clear selections and possession
    if (this.selectedAgent?.data.id === agentId) {
      this.selectedAgent = null;
    }
    if (this.possessedAgent?.data.id === agentId) {
      this.possessedAgent.data.isPossessed = false;
      this.possessedAgent = null;
    }

    // Clean up social references in other settlers
    for (const other of this.agents) {
      if (other.data.spouseId === agentId) {
        other.data.spouseId = undefined;
      }
      delete other.data.relationships[agentId];
      if (other.data.targetAgentId === agentId) {
        other.data.targetAgentId = undefined;
      }
      if (other.data.activeDialog?.partnerId === agentId) {
        other.data.activeDialog = undefined;
      }
    }

    // Clean up building ownership
    for (const b of this.world.buildings) {
      b.ownerIds = b.ownerIds.filter(id => id !== agentId);
      if (b.builderId === agentId) {
        b.builderId = undefined;
      }
    }

    this.agents.splice(idx, 1);
    this.addSpecialEffect('sparkle', agent.data.x, agent.data.y, 1.5);
    this.addDramaEvent('general', `🕊️ The soul of ${agent.data.name} departed into the heavens.`, []);
    return true;
  }

  public getBuildingAt(worldX: number, worldY: number): Building | undefined {
    for (let i = this.world.buildings.length - 1; i >= 0; i--) {
      const b = this.world.buildings[i];
      if (worldX >= b.x && worldX <= b.x + b.width && worldY >= b.y && worldY <= b.y + b.height) {
        return b;
      }
    }
    return undefined;
  }

  public createHouse(worldX: number, worldY: number, customFamily?: string): Building | null {
    const w = 190;
    const h = 150;
    const placeX = Math.max(20, Math.min(this.world.width - w - 20, worldX - w / 2));
    const placeY = Math.max(20, Math.min(this.world.height - h - 20, worldY - h / 2));

    if (this.world.isAreaWater(placeX, placeY, w, h, 25)) {
      this.addDramaEvent('general', '⚠️ Cannot build a house in or over the river water! Choose solid land.', []);
      return null;
    }

    const familyPool = ['Ashwood', 'Fern', 'Oak', 'Rivera', 'Pine', 'Moss', 'Briar', 'Falcon', 'Rowan'];
    const familyName = customFamily || familyPool[Math.floor(Math.random() * familyPool.length)];
    const houseName = `${familyName} Homestead`;

    // Find any homeless settler or settler wanting a house
    const needyAgent = this.agents.find(a => a.data.wantsToBuildHouse || a.data.homeCabinId === 'hearth' || !a.data.homeCabinId);

    const site = this.world.createBuildingSite(houseName, familyName, placeX, placeY, needyAgent ? needyAgent.data.id : 'god');
    site.isConstructed = true;
    site.constructionProgress = 100;
    site.description = `A newly consecrated handcrafted homestead granted by divine providence.`;

    this.addSpecialEffect('sparkle', site.x + w / 2, site.y + h / 2, 2.0);
    this.addDramaEvent('miracle', `✨ Divine Construction: ${houseName} materialized in the forest clearing!`, needyAgent ? [needyAgent.data.id] : []);

    if (needyAgent) {
      site.ownerIds = [needyAgent.data.id];
      needyAgent.data.homeCabinId = site.id;
      needyAgent.data.wantsToBuildHouse = false;
      needyAgent.data.targetBuildingId = undefined;
      needyAgent.setBubble('home', 5);
      needyAgent.data.thought = `A miraculous homestead was gifted to us by the heavens!`;
      needyAgent.addMemory(`Blessed with a new family home: ${houseName}`, 90);
      needyAgent.initDefaultSchedule();
      needyAgent.setDestination(site.door.x, site.door.y, this.world, 'walking');
    }

    return site;
  }

  public moveHouse(buildingId: string, newX: number, newY: number): boolean {
    const b = this.world.getBuildingById(buildingId);
    if (!b) return false;

    newX = Math.max(20, Math.min(this.world.width - b.width - 20, newX));
    newY = Math.max(20, Math.min(this.world.height - b.height - 20, newY));

    if (this.world.isAreaWater(newX, newY, b.width, b.height, 25)) {
      this.addDramaEvent('general', `⚠️ Cannot move ${b.name} onto or across the river water! Choose solid ground.`, []);
      return false;
    }

    const oldX = b.x + b.width / 2;
    const oldY = b.y + b.height / 2;

    b.x = newX;
    b.y = newY;
    b.door = { x: newX + b.width / 2, y: newY + b.height };

    // Automatically re-route and connect road to the new doorway location
    this.world.connectBuildingWithRoad(b);

    this.addSpecialEffect('smoke', oldX, oldY, 1.2);
    this.addSpecialEffect('sparkle', b.x + b.width / 2, b.y + b.height / 2, 2.0);
    this.addDramaEvent('miracle', `🚚 Relocation: ${b.name} was moved and a new road trail was automatically paved to its doorway!`, []);

    // NPC Reactions & Route Redirection
    const residents = this.agents.filter(a => a.data.homeCabinId === b.id || b.ownerIds.includes(a.data.id));

    for (const resident of residents) {
      resident.setBubble('home', 5);
      resident.data.thought = `The gods transported our homestead to a beautiful new clearing!`;
      resident.addMemory(`Miraculous relocation: Our home was moved to a fresh clearing`, 65);

      if (resident.data.actionState === 'sleeping') {
        const bedX = b.door.x + (resident.data.age % 2 === 0 ? -16 : 16);
        const bedY = b.door.y - 12;
        resident.data.x = bedX;
        resident.data.y = bedY;
      } else {
        const hr = Math.floor(this.gameMinutes / 60);
        const curTask = resident.data.schedule.find(s => hr >= s.startHour && hr < s.endHour);
        if (curTask && curTask.task === 'sleep') {
          resident.setDestination(b.door.x, b.door.y, this.world, 'walking');
        }
      }
    }

    return true;
  }

  public destroyHouse(buildingId: string): boolean {
    const b = this.world.getBuildingById(buildingId);
    if (!b) return false;

    if (this.isProtectedBuilding(b)) {
      this.addDramaEvent(
        'violence',
        `⚠️ ${b.name} is essential communal infrastructure and cannot be demolished!`,
        []
      );
      return false;
    }

    const centerX = b.x + b.width / 2;
    const centerY = b.y + b.height / 2;

    this.addSpecialEffect('lightning', centerX, centerY, 0.8);
    this.addSpecialEffect('smoke', centerX, centerY, 2.5);

    const residents = this.agents.filter(a => a.data.homeCabinId === b.id || b.ownerIds.includes(a.data.id));

    this.world.buildings = this.world.buildings.filter(item => item.id !== buildingId);
    // Remove road trail spur connecting to the demolished house
    this.world.removeRoadsForBuilding(buildingId);
    if (this.selectedBuilding?.id === buildingId) {
      this.selectedBuilding = null;
    }

    this.addDramaEvent('violence', `💥 DEMOLISHED: ${b.name} crumbled into wooden ruins under divine power!`, residents.map(r => r.data.id));

    for (const resident of residents) {
      resident.data.homeCabinId = 'hearth';
      resident.data.wantsToBuildHouse = true;
      resident.setBubble('broken_heart', 5);
      resident.data.thought = `Our family home was demolished into ruins! We are homeless!`;
      resident.addMemory(`Tragedy: Our home ${b.name} was destroyed by divine decree!`, -85);

      resident.interruptRoutine('Grieving Demolished Home', 15);
      const cf = this.world.campfire;
      const angle = Math.random() * Math.PI * 2;
      resident.setDestination(cf.x + Math.cos(angle) * 60, cf.y + Math.sin(angle) * 60, this.world, 'running');
    }

    return true;
  }

  public getTreeAt(worldX: number, worldY: number): ForestTree | undefined {
    let bestTree: ForestTree | undefined;
    let closestDist = Infinity;

    for (const tree of this.world.trees) {
      // 1. Trunk base click (works for any tree, sapling, or stump)
      const baseDist = Math.hypot(tree.x - worldX, tree.y - worldY);
      if (baseDist < 28) {
        if (baseDist < closestDist) {
          closestDist = baseDist;
          bestTree = tree;
        }
        continue;
      }

      // 2. Canopy click for living mature/young/ancient trees
      if (tree.stage !== 'sapling' && tree.stage !== 'decaying' && tree.woodHealth > 0) {
        let scale = 0.65;
        if (tree.stage === 'young') scale = 0.42;
        else if (tree.stage === 'ancient') scale = 0.88;

        const treeIdx = TreeRenderer.getTreeIndex(tree.variant);
        const def = TreeRenderer.getSpriteDef(treeIdx);
        const w = (def ? def.width : 150) * scale;
        const h = (def ? def.height : 170) * scale;
        const anchorX = (def ? def.anchorX : w * 0.5) * scale;
        const anchorY = (def ? def.anchorY : h) * scale;

        const left = tree.x - anchorX;
        const right = left + w;
        const top = tree.y - anchorY;
        const bottom = tree.y + 12;

        if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
          const distToCenter = Math.hypot(tree.x - worldX, (tree.y - h * 0.5) - worldY);
          if (distToCenter < closestDist) {
            closestDist = distToCenter;
            bestTree = tree;
          }
        }
      }
    }

    return bestTree;
  }

  public removeTree(treeId: string): boolean {
    const idx = this.world.trees.findIndex(t => t.id === treeId);
    if (idx === -1) return false;

    const tree = this.world.trees[idx];
    const treeName = TreeRenderer.getTreeName(tree.variant);

    this.world.trees.splice(idx, 1);

    if (this.selectedTree && this.selectedTree.id === treeId) {
      this.selectedTree = null;
    }

    // Spawn 2-4 wood logs on the ground for settlers to gather
    const logYield = tree.stage === 'ancient' ? 4 : tree.stage === 'young' ? 1 : tree.stage === 'sapling' ? 0 : 2;
    for (let i = 0; i < logYield; i++) {
      this.world.items.push({
        id: `item_wood_${Date.now()}_${i}`,
        type: 'log',
        name: `${treeName} Timber Log`,
        value: 1,
        x: tree.x + (Math.random() * 24 - 12),
        y: tree.y + (Math.random() * 16 - 8)
      });
    }

    // Direct stockpile boost
    if (logYield > 0) {
      this.world.stockpile.wood += logYield;
    }

    // Visual FX: smoke and sparkles
    this.world.spawnSpecialEffect('smoke', tree.x, tree.y - 20);
    this.world.spawnSpecialEffect('sparkle', tree.x, tree.y - 10);

    this.addDramaEvent('work', `🪓 Felled ${treeName} at (${Math.round(tree.x)}, ${Math.round(tree.y)}). Harvested ${logYield} logs.`, []);
    return true;
  }

  public plantTree(
    worldX: number,
    worldY: number,
    variant?: TreeVariant,
    stage: TreeStage = 'mature'
  ): ForestTree | null {
    // Keep divine plantings inside the playable world even when the camera is
    // panned near the map edge at a low zoom level.
    worldX = Math.max(30, Math.min(this.world.width - 30, worldX));
    worldY = Math.max(30, Math.min(this.world.height - 30, worldY));

    // 1. Water check: Cannot plant in river!
    if (this.world.isWater(worldX, worldY, 15)) {
      this.addDramaEvent('general', `⚠️ Cannot plant a tree in river waters! Choose solid soil.`, []);
      return null;
    }

    // 2. Building check
    const nearBuilding = this.world.buildings.some(b => 
      worldX >= b.x - 15 && worldX <= b.x + b.width + 15 &&
      worldY >= b.y - 15 && worldY <= b.y + b.height + 15
    );
    if (nearBuilding) {
      this.addDramaEvent('general', `⚠️ Location is too close to a building. Clear open ground is needed.`, []);
      return null;
    }

    // 3. Collision with existing tree
    const tooClose = this.world.trees.some(t => Math.hypot(t.x - worldX, t.y - worldY) < 22);
    if (tooClose) {
      this.addDramaEvent('general', `⚠️ Another tree is already rooted here. Pick an open space.`, []);
      return null;
    }

    const actualVariant: TreeVariant = variant !== undefined
      ? variant
      : (Math.floor(Math.random() * 18) as TreeVariant);

    const health = stage === 'ancient' ? 140 : stage === 'young' ? 65 : stage === 'sapling' ? 25 : 100;

    const newTree: ForestTree = {
      id: `tree_planted_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x: worldX,
      y: worldY,
      woodHealth: health,
      maxWoodHealth: health,
      regrowTimer: 0,
      shakeTimer: 0,
      variant: actualVariant,
      stage,
      age: stage === 'ancient' ? 600 : stage === 'young' ? 60 : stage === 'sapling' ? 0 : 200,
      maxLifespan: 1000 + Math.random() * 400,
      seedTimer: 50 + Math.random() * 40
    };

    this.world.trees.push(newTree);
    this.selectedTree = newTree;
    this.selectedAgent = null;
    this.selectedBuilding = null;

    this.world.spawnSpecialEffect('sparkle', worldX, worldY - 20);
    this.world.spawnSpecialEffect('heart_burst', worldX, worldY - 10);

    const treeName = TreeRenderer.getTreeName(actualVariant);
    this.addDramaEvent('miracle', `🌱 Divine Plant: Rooted a new ${treeName} (${stage.toUpperCase()}) at (${Math.round(worldX)}, ${Math.round(worldY)}).`, []);

    return newTree;
  }
}
