import type { AgentData, BubbleType, Memory } from '../types/simulation';
import { GeminiService } from './GeminiService';

export interface DialogExchange {
  line1: string;
  line2: string;
  topic: string;
  gesture1: 'waving' | 'handshake' | 'gesturing' | 'holding_hands';
  gesture2: 'waving' | 'handshake' | 'gesturing' | 'holding_hands';
  bubble1?: BubbleType;
  bubble2?: BubbleType;
  isAiGenerated?: boolean;
  providerUsed?: 'gemini' | '9router';
  memoriesUsed?: string[];
}

export class DialogSystem {
  /**
   * Extracts targeted memories between the two agents, prioritizing emotional significance.
   */
  public static getSharedMemories(agentA: AgentData, agentB: AgentData): {
    memoriesAAboutB: Memory[];
    memoriesBAboutA: Memory[];
    recentGeneralMemoriesA: Memory[];
  } {
    const memoriesAAboutB = (agentA.memories || [])
      .filter(m => m.targetId === agentB.id)
      .sort((a, b) => Math.abs(b.emotionalWeight) - Math.abs(a.emotionalWeight))
      .slice(0, 4);

    const memoriesBAboutA = (agentB.memories || [])
      .filter(m => m.targetId === agentA.id)
      .sort((a, b) => Math.abs(b.emotionalWeight) - Math.abs(a.emotionalWeight))
      .slice(0, 4);

    const recentGeneralMemoriesA = (agentA.memories || [])
      .filter(m => !m.targetId && Math.abs(m.emotionalWeight) >= 25)
      .slice(0, 2);

    return { memoriesAAboutB, memoriesBAboutA, recentGeneralMemoriesA };
  }

  /**
   * Asynchronously attempts to generate a context-aware conversation powered by Google Gemini,
   * incorporating personal memories about each other.
   * If Gemini is unavailable, disabled, or encounters an error, safely falls back to standard templates.
   */
  public static async generateExchangeAsync(
    agentA: AgentData,
    agentB: AgentData,
    gameHour: number,
    weather: string
  ): Promise<DialogExchange> {
    const gemini = GeminiService.getInstance();
    if (gemini.isAvailable()) {
      const { memoriesAAboutB, memoriesBAboutA, recentGeneralMemoriesA } = this.getSharedMemories(agentA, agentB);
      const aiExchange = await gemini.generateDialogue(
        agentA,
        agentB,
        memoriesAAboutB,
        memoriesBAboutA,
        recentGeneralMemoriesA,
        gameHour,
        weather
      );

      if (aiExchange) {
        return aiExchange;
      }
    }

    // Rock-solid fallback to procedural templates
    return this.generateExchange(agentA, agentB, gameHour, weather);
  }

  public static generateExchange(agentA: AgentData, agentB: AgentData, gameHour: number, weather: string): DialogExchange {
    const relA = agentA.relationships[agentB.id];
    const isMarriedOrDating = relA && (relA.status === 'married' || relA.status === 'dating');
    const isCrush = relA && relA.status === 'crush';
    const isRival = relA && (relA.status === 'rival' || relA.status === 'enemy' || relA.affinity < -15);
    const isElderA = agentA.role === 'elder';
    const isElderB = agentB.role === 'elder';

    // 1. Married or Dating Couples
    if (isMarriedOrDating) {
      const romanticDialogs: DialogExchange[] = [
        {
          line1: `My heart warms every time I see you, ${agentB.name.split(' ')[0]}. Take my hand.`,
          line2: `Always, my love. Together, this mountain forest feels like heaven.`,
          topic: 'love',
          gesture1: 'holding_hands',
          gesture2: 'holding_hands'
        },
        {
          line1: `Did you rest well last night in our family cabin?`,
          line2: `Wonderfully! Listening to your steady breathing by my side brings me peace.`,
          topic: 'love',
          gesture1: 'holding_hands',
          gesture2: 'gesturing'
        },
        {
          line1: `I was just thinking about planting sweet wildflowers along our front porch.`,
          line2: `What a lovely thought! I'll help you spade the soil by our doorway tonight.`,
          topic: 'homestead',
          gesture1: 'gesturing',
          gesture2: 'holding_hands'
        },
        {
          line1: `Don't work yourself too hard today, darling.`,
          line2: `I won't! Just saving my energy so we can watch the sunset together by the river.`,
          topic: 'love',
          gesture1: 'waving',
          gesture2: 'holding_hands'
        }
      ];
      return romanticDialogs[Math.floor(Math.random() * romanticDialogs.length)];
    }

    // 2. Secret Crushes & Budding Romance
    if (isCrush) {
      const crushDialogs: DialogExchange[] = [
        {
          line1: `Good day, ${agentB.name.split(' ')[0]}! You look... glowing in the sunlight today.`,
          line2: `Oh! Thank you... that is so sweet of you to say!`,
          topic: 'flirt',
          gesture1: 'waving',
          gesture2: 'gesturing'
        },
        {
          line1: `I saved a handful of sweet plump blueberries for you from this morning's basket.`,
          line2: `For me? You're far too kind, ${agentA.name.split(' ')[0]}!`,
          topic: 'flirt',
          gesture1: 'handshake',
          gesture2: 'waving'
        }
      ];
      return crushDialogs[Math.floor(Math.random() * crushDialogs.length)];
    }

    // 3. Elder Bron Wisdom & Mentorship
    if (isElderA || isElderB) {
      const younger = isElderA ? agentB : agentA;

      const elderDialogs: DialogExchange[] = [
        {
          line1: isElderA 
            ? `Walk with patience, ${younger.name.split(' ')[0]}. A sturdy village is built beam by beam, bond by bond.`
            : `Elder Bron, how were the winter winds when you first settled these woods?`,
          line2: isElderA 
            ? `Wise words, Elder Bron. I will take care with every log I shape.`
            : `Fierce and biting, child! But warmth shared around the hearth conquered the frost.`,
          topic: 'wisdom',
          gesture1: 'gesturing',
          gesture2: 'handshake'
        },
        {
          line1: isElderA 
            ? `May the ancient pine canopy shelter your family's homestead today.`
            : `Blessings to you, Elder. Your guidance keeps our settlement in harmony.`,
          line2: isElderA 
            ? `Thank you, Elder. We all cherish your council.`
            : `Walk in peace, my child. The land provides if we treat it with honor.`,
          topic: 'blessing',
          gesture1: 'handshake',
          gesture2: 'gesturing'
        }
      ];
      return elderDialogs[Math.floor(Math.random() * elderDialogs.length)];
    }

    // 4. Rivals & Competitive Clashes
    if (isRival) {
      const rivalDialogs: DialogExchange[] = [
        {
          line1: `Watch where you're swinging that axe, ${agentB.name.split(' ')[0]}!`,
          line2: `I know my timber! Don't tell me how to do honest settlement work.`,
          topic: 'rivalry',
          gesture1: 'gesturing',
          gesture2: 'gesturing'
        },
        {
          line1: `Still bragging about that tiny trout you pulled from the north pier?`,
          line2: `It was a prize salmon, and you know it! Catch one bigger if you can!`,
          topic: 'rivalry',
          gesture1: 'gesturing',
          gesture2: 'gesturing'
        }
      ];
      return rivalDialogs[Math.floor(Math.random() * rivalDialogs.length)];
    }

    // 5. Weather Situations
    if (weather === 'stormy' || weather === 'rainy') {
      const weatherDialogs: DialogExchange[] = [
        {
          line1: `The rain is pouring hard! Did you latch the storehouse shutters?`,
          line2: `Aye, secure and tight! Come under the porch eave before you catch a chill.`,
          topic: 'weather',
          gesture1: 'waving',
          gesture2: 'handshake'
        },
        {
          line1: `Listen to that thunder rolling over the western ridge!`,
          line2: `Divine power stirs above! Let's stay close to the warm stone hearth.`,
          topic: 'weather',
          gesture1: 'gesturing',
          gesture2: 'gesturing'
        }
      ];
      return weatherDialogs[Math.floor(Math.random() * weatherDialogs.length)];
    }

    // 6. Time-of-Day Context (Evening Social / Campfire)
    if (gameHour >= 17 && gameHour < 21) {
      const eveningDialogs: DialogExchange[] = [
        {
          line1: `Good evening, ${agentB.name.split(' ')[0]}! Pull up a cedar stool by the embers.`,
          line2: `Evening! Nothing beats roasted stew and warm cider after a hard day's labor.`,
          topic: 'campfire',
          gesture1: 'handshake',
          gesture2: 'waving'
        },
        {
          line1: `The sparks dancing up into the starry sky are hypnotic tonight.`,
          line2: `Truly peaceful. Our little sanctuary in the forest is becoming something grand.`,
          topic: 'campfire',
          gesture1: 'gesturing',
          gesture2: 'gesturing'
        },
        {
          line1: `Did you hear that owl hooting by the eastern wooden bridge?`,
          line2: `Aye! A good omen for the village hunters, according to old lore.`,
          topic: 'lore',
          gesture1: 'waving',
          gesture2: 'handshake'
        }
      ];
      return eveningDialogs[Math.floor(Math.random() * eveningDialogs.length)];
    }

    // 7. Role-Specific & General Daily Banter
    const generalDialogs: DialogExchange[] = [
      {
        line1: `Well met, ${agentB.name.split(' ')[0]}! How fares your chores today?`,
        line2: `Steady and good! The stockpiles are growing and the settlement thrives.`,
        topic: 'greeting',
        gesture1: 'handshake',
        gesture2: 'handshake'
      },
      {
        line1: `Have you seen the new homesteads and trails paved through the clearings?`,
        line2: `A blessing of providence! Fresh stone roads connecting straight to our front doors.`,
        topic: 'village',
        gesture1: 'gesturing',
        gesture2: 'waving'
      },
      {
        line1: `The river currents are clear as glass today. The salmon are leaping!`,
        line2: `I'll head down with my fishing line after lunch. Fresh fish for everyone tonight!`,
        topic: 'fishing',
        gesture1: 'waving',
        gesture2: 'handshake'
      },
      {
        line1: `The wild rabbits have been bounding through the eastern forest clearing today.`,
        line2: `Aye, Kaelen's keen hunter eye has brought in plenty of fresh tender rabbit meat for supper!`,
        topic: 'hunting',
        gesture1: 'gesturing',
        gesture2: 'handshake'
      },
      {
        line1: `Have you cast a line into the lotus pond? The carp and koi are active around the water lilies!`,
        line2: `Yes! Reeled in a fine plump pond fish earlier — the peaceful water makes for splendid fishing.`,
        topic: 'fishing',
        gesture1: 'waving',
        gesture2: 'gesturing'
      },
      {
        line1: `The scent of seasoned pine lumber in the morning air is invigorating.`,
        line2: `Indeed! Each felled timber means warmth for our stoves and beams for new cabins.`,
        topic: 'lumber',
        gesture1: 'handshake',
        gesture2: 'gesturing'
      },
      {
        line1: `I found wild mint and chamomile growing along the western sandstone cliff!`,
        line2: `Wonderful! That will make soothing mountain tea for the elder council.`,
        topic: 'foraging',
        gesture1: 'waving',
        gesture2: 'gesturing'
      },
      {
        line1: `Good day! Let's shake hands on another peaceful day in the sanctuary.`,
        line2: `Gladly, neighbor! May our hands be strong and our families safe.`,
        topic: 'handshake',
        gesture1: 'handshake',
        gesture2: 'handshake'
      },
      {
        line1: `The baker's oven is filling the entire clearing with the aroma of roasted bread!`,
        line2: `My stomach rumbled the moment I caught the scent on the breeze!`,
        topic: 'food',
        gesture1: 'gesturing',
        gesture2: 'waving'
      },
      {
        line1: `Watch your footing on the wooden bridge deck, it gets slick near the spray.`,
        line2: `Appreciate the warning! Safe travels through the eastern woods.`,
        topic: 'travel',
        gesture1: 'waving',
        gesture2: 'handshake'
      }
    ];

    return generalDialogs[Math.floor(Math.random() * generalDialogs.length)];
  }
}
