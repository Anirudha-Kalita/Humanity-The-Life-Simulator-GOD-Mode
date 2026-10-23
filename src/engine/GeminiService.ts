import type { AgentData, BubbleType, Memory } from '../types/simulation';
import type { DialogExchange } from './DialogSystem';

export type AiProvider = 'auto' | 'gemini' | '9router';

export interface RecentAiDialogue {
  timestamp: number;
  initiatorName: string;
  replierName: string;
  line1: string;
  line2: string;
  topic: string;
  memoriesUsed: string[];
  providerUsed?: 'gemini' | '9router';
}

export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string = '';
  private model: string = 'gemini-3.8-flash';
  private enabled: boolean = true;
  private provider: AiProvider = 'auto';

  // 9Router Local AI Model Gateway settings
  private nineRouterUrl: string = 'http://localhost:20128/v1';
  private nineRouterApiKey: string = '';
  private nineRouterPassword: string = '';
  private nineRouterModel: string = 'ac-prod/gemini-3.6-flash';

  private recentDialogues: RecentAiDialogue[] = [];
  private lastRequestTime: number = 0;
  private minIntervalMs: number = 2500; // Minimum cooldown between AI generation to ensure silky smooth 60 FPS
  private isRequestInFlight: boolean = false;

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public loadSettings(): void {
    // 1. Gemini settings
    const savedKey = localStorage.getItem('gemini_api_key');
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    this.apiKey = (savedKey !== null && savedKey !== undefined && savedKey !== '') 
      ? savedKey 
      : (envKey || '');

    const savedModel = localStorage.getItem('gemini_model');
    if (savedModel) {
      this.model = savedModel;
    }

    // 2. Provider strategy (auto fallback by default)
    const savedProvider = localStorage.getItem('ai_provider') as AiProvider | null;
    if (savedProvider === 'auto' || savedProvider === 'gemini' || savedProvider === '9router') {
      this.provider = savedProvider;
    } else {
      this.provider = 'auto';
    }

    // 3. 9Router Local AI Manager settings
    const savedNineUrl = localStorage.getItem('9router_url');
    const envNineUrl = (import.meta as any).env?.VITE_9ROUTER_URL;
    this.nineRouterUrl = savedNineUrl || envNineUrl || 'http://localhost:20128/v1';

    const savedNineKey = localStorage.getItem('9router_api_key');
    const envNineKey = (import.meta as any).env?.VITE_9ROUTER_API_KEY;
    this.nineRouterApiKey = savedNineKey !== null ? savedNineKey : (envNineKey || '');

    const savedNinePass = localStorage.getItem('9router_password');
    const envNinePass = (import.meta as any).env?.VITE_9ROUTER_PASSWORD;
    this.nineRouterPassword = savedNinePass !== null ? savedNinePass : (envNinePass || '');

    const savedNineModel = localStorage.getItem('9router_model');
    const envNineModel = (import.meta as any).env?.VITE_9ROUTER_MODEL;
    // Upgrade away from 'default' because 9Router maps 'default' to OpenAI
    if (savedNineModel === 'default' || (!savedNineModel && !envNineModel)) {
      this.nineRouterModel = 'ac-prod/gemini-3.6-flash';
    } else {
      this.nineRouterModel = savedNineModel || envNineModel || 'ac-prod/gemini-3.6-flash';
    }

    // 4. Enabled flag
    const savedEnabled = localStorage.getItem('gemini_ai_enabled');
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    } else {
      this.enabled = this.hasGemini() || this.hasNineRouter();
    }
  }

  // --- Gemini Getters & Setters ---
  public getApiKey(): string {
    return this.apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim();
    localStorage.setItem('gemini_api_key', this.apiKey);
    if (this.apiKey && localStorage.getItem('gemini_ai_enabled') === null) {
      this.enabled = true;
      localStorage.setItem('gemini_ai_enabled', 'true');
    }
  }

  public getModel(): string {
    return this.model;
  }

  public setModel(model: string): void {
    this.model = model;
    localStorage.setItem('gemini_model', model);
  }

  // --- 9Router Getters & Setters ---
  public getProvider(): AiProvider {
    return this.provider;
  }

  public setProvider(provider: AiProvider): void {
    this.provider = provider;
    localStorage.setItem('ai_provider', provider);
  }

  public getNineRouterUrl(): string {
    return this.nineRouterUrl;
  }

  public setNineRouterUrl(url: string): void {
    this.nineRouterUrl = url.trim();
    localStorage.setItem('9router_url', this.nineRouterUrl);
  }

  public getNineRouterApiKey(): string {
    return this.nineRouterApiKey;
  }

  public setNineRouterApiKey(key: string): void {
    this.nineRouterApiKey = key.trim();
    localStorage.setItem('9router_api_key', this.nineRouterApiKey);
  }

  public getNineRouterPassword(): string {
    return this.nineRouterPassword;
  }

  public setNineRouterPassword(pass: string): void {
    this.nineRouterPassword = pass.trim();
    localStorage.setItem('9router_password', this.nineRouterPassword);
  }

  public getNineRouterModel(): string {
    return this.nineRouterModel;
  }

  public setNineRouterModel(model: string): void {
    this.nineRouterModel = model.trim();
    localStorage.setItem('9router_model', this.nineRouterModel);
  }

  public hasGemini(): boolean {
    return Boolean(this.apiKey) && this.apiKey.length > 5;
  }

  public hasNineRouter(): boolean {
    return Boolean(this.nineRouterUrl && this.nineRouterUrl.length > 7);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    localStorage.setItem('gemini_ai_enabled', String(val));
  }

  public isAvailable(): boolean {
    return this.enabled && (this.hasGemini() || this.hasNineRouter());
  }

  public getRecentDialogues(): RecentAiDialogue[] {
    return this.recentDialogues;
  }

  private getNineRouterHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.nineRouterApiKey) {
      headers['Authorization'] = `Bearer ${this.nineRouterApiKey}`;
      headers['x-api-key'] = this.nineRouterApiKey;
    }
    if (this.nineRouterPassword) {
      headers['X-Password'] = this.nineRouterPassword;
      headers['x-auth-password'] = this.nineRouterPassword;
      if (!this.nineRouterApiKey) {
        headers['Authorization'] = `Bearer ${this.nineRouterPassword}`;
      }
    }
    return headers;
  }

  /**
   * Tests the Gemini API Key with a lightweight ping.
   */
  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    if (!this.apiKey) {
      return { success: false, message: 'API key is empty. Please enter your Gemini API key.', latencyMs: 0 };
    }

    const startTime = performance.now();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout for connection test

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Respond with the word "READY" in JSON: {"status":"READY"}' }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        return { success: false, message: `Gemini API Error: ${errMsg}`, latencyMs };
      }

      return { success: true, message: `Connected successfully to ${this.model}! (${latencyMs}ms)`, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timed out (18s). Please check your VPN, ad-blocker, or network connection to generativelanguage.googleapis.com, or try gemini-2.0-flash.',
          latencyMs
        };
      }
      return { success: false, message: `Network Error: ${err.message || 'Failed to fetch'}. (Ensure ad-blockers or firewall are not blocking Google API).`, latencyMs };
    }
  }

  /**
   * Fetches the list of active models directly from the local 9Router instance.
   */
  public async fetchNineRouterModels(): Promise<{ success: boolean; models: string[]; message?: string }> {
    const cleanUrl = this.nineRouterUrl.replace(/\/+$/, '');
    const url = `${cleanUrl}/models`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getNineRouterHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        return { success: false, models: [], message: `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      const models: string[] = (data.data || []).map((m: any) => m.id).filter(Boolean);
      return { success: true, models };
    } catch (err: any) {
      return { success: false, models: [], message: err.message || 'Offline' };
    }
  }

  /**
   * Tests the local 9Router AI gateway with a lightweight chat completion ping.
   */
  public async testNineRouterConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const cleanUrl = this.nineRouterUrl.replace(/\/+$/, '');
    const url = `${cleanUrl}/chat/completions`;
    const startTime = performance.now();

    // Guard against 'default' which 9Router routes to OpenAI
    let targetModel = (this.nineRouterModel || '').trim();
    if (!targetModel || targetModel === 'default') {
      targetModel = 'ac-prod/gemini-3.6-flash';
      this.setNineRouterModel(targetModel);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for local gateway

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getNineRouterHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: 'user', content: 'Respond with JSON only: {"status":"READY"}' }
          ],
          max_tokens: 1200,
          stream: false
        })
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        if (/no active credential.*openai/i.test(errMsg)) {
          return {
            success: false,
            message: `9Router Error: No active credentials for OpenAI. In 9Router, 'default' routes to OpenAI. Please select an active model (such as 'ac-prod/gemini-3.6-flash') from the dropdown!`,
            latencyMs
          };
        }
        return { success: false, message: `9Router Error: ${errMsg}`, latencyMs };
      }

      return {
        success: true,
        message: `Connected successfully to 9Router (${targetModel})! (${latencyMs}ms)`,
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: `9Router timed out after 12s at ${url}. Ensure 9Router is running locally (e.g. npx 9router).`,
          latencyMs
        };
      }
      return {
        success: false,
        message: `Failed to connect to 9Router at ${url}: ${err.message || 'Offline'}. Check URL, API key, or password.`,
        latencyMs
      };
    }
  }

  /**
   * Generates a context-aware dialogue exchange between two NPCs incorporating their
   * personal memories about each other, relationships, traits, and needs.
   * If Gemini is down or times out, automatically falls back to local 9Router!
   */
  public async generateDialogue(
    agentA: AgentData,
    agentB: AgentData,
    memoriesAAboutB: Memory[],
    memoriesBAboutA: Memory[],
    recentGeneralMemoriesA: Memory[],
    gameHour: number,
    weather: string
  ): Promise<DialogExchange | null> {
    if (!this.isAvailable()) return null;
    if (this.isRequestInFlight) return null;

    // Strict throttle check to prevent rapid-fire requests
    const now = performance.now();
    if (now - this.lastRequestTime < this.minIntervalMs) {
      return null;
    }
    this.isRequestInFlight = true;
    this.lastRequestTime = now;

    try {
      const relA = agentA.relationships?.[agentB.id];
      const relB = agentB.relationships?.[agentA.id];

      // Format Person-Specific Memories
      const memAStrings = memoriesAAboutB.map(m => {
        const weightTag = m.emotionalWeight > 0 ? `+${m.emotionalWeight}` : `${m.emotionalWeight}`;
        return `• "${m.description}" (Impact: ${weightTag})`;
      });
      const memoriesAFormatted = memAStrings.length > 0 
        ? memAStrings.join('\n') 
        : '• None recorded yet (First memorable encounter or mutual acquaintance).';

      const memBStrings = memoriesBAboutA.map(m => {
        const weightTag = m.emotionalWeight > 0 ? `+${m.emotionalWeight}` : `${m.emotionalWeight}`;
        return `• "${m.description}" (Impact: ${weightTag})`;
      });
      const memoriesBFormatted = memBStrings.length > 0 
        ? memBStrings.join('\n') 
        : '• None recorded yet.';

      const generalA = recentGeneralMemoriesA.map(m => `• "${m.description}"`).join('\n') || '• Routine forest village life.';

      const timeStr = `${gameHour % 12 === 0 ? 12 : gameHour % 12}:00 ${gameHour >= 12 ? 'PM' : 'AM'}`;

      const prompt = `You are the AI brain powering NPCs in a simulated living medieval/rural village sandbox.
Generate a realistic, short 2-line in-character dialogue exchange between two villagers who have bumped into each other.

SPEAKER 1 (Initiator):
- Name: ${agentA.name} (Role: ${agentA.role}, Age: ${agentA.age || 25})
- Personality Traits: Aggression: ${(agentA.traits.aggression * 100).toFixed(0)}%, Agreeableness: ${(agentA.traits.agreeableness * 100).toFixed(0)}%, Neuroticism: ${(agentA.traits.neuroticism * 100).toFixed(0)}%, Greed: ${(agentA.traits.greed * 100).toFixed(0)}%
- Needs Status: Hunger: ${Math.round(agentA.needs.hunger)}/100, Energy: ${Math.round(agentA.needs.energy)}/100, Social: ${Math.round(agentA.needs.social)}/100
- Relationship to ${agentB.name}: Status: ${relA?.status || 'neighbor'}, Affinity: ${relA?.affinity || 0}/100, Trust: ${relA?.trust || 0}/100
- ${agentA.name}'s PERSONAL MEMORIES ABOUT ${agentB.name}:
${memoriesAFormatted}
- Recent Life Events of ${agentA.name}:
${generalA}

SPEAKER 2 (Replier):
- Name: ${agentB.name} (Role: ${agentB.role}, Age: ${agentB.age || 25})
- Personality Traits: Aggression: ${(agentB.traits.aggression * 100).toFixed(0)}%, Agreeableness: ${(agentB.traits.agreeableness * 100).toFixed(0)}%, Neuroticism: ${(agentB.traits.neuroticism * 100).toFixed(0)}%
- Needs Status: Hunger: ${Math.round(agentB.needs.hunger)}/100, Energy: ${Math.round(agentB.needs.energy)}/100
- Relationship to ${agentA.name}: Status: ${relB?.status || 'neighbor'}, Affinity: ${relB?.affinity || 0}/100, Trust: ${relB?.trust || 0}/100
- ${agentB.name}'s PERSONAL MEMORIES ABOUT ${agentA.name}:
${memoriesBFormatted}

ENVIRONMENT:
- Time of Day: ${timeStr}
- Weather: ${weather}

MANDATORY RULES:
1. USE THEIR STORED MEMORIES ABOUT EACH OTHER! If they have past grudges, insults, romances, favors, marriage, or brawls, the dialogue MUST acknowledge or react to that history.
2. If they have NO prior memories about each other, let them interact naturally as neighbors or strangers based on their roles and traits.
3. Keep line1 under 16 words. Punchy, atmospheric, spoken medieval English.
4. Keep line2 under 16 words. Directly answering or countering line1.
5. Emotion bubble MUST be one of: 'heart', 'broken_heart', 'rage', 'food', 'money', 'laugh', 'tears', 'shock', 'peace', 'talk', 'idea', 'fist'.
6. Gestures MUST be one of: 'waving', 'handshake', 'gesturing', 'holding_hands'.

Respond with ONLY raw JSON matching this schema:
{
  "line1": "string (Line spoken by ${agentA.name})",
  "line2": "string (Line spoken by ${agentB.name})",
  "topic": "string (1-3 words topic, e.g. grudge, stolen_apples, romantic, weather, fishing)",
  "bubble1": "string (valid emotion bubble for ${agentA.name})",
  "bubble2": "string (valid emotion bubble for ${agentB.name})",
  "gesture1": "string (valid gesture for ${agentA.name})",
  "gesture2": "string (valid gesture for ${agentB.name})",
  "memoryReferenced": "string (brief note of which past memory was referenced, or 'None')"
}`;

      // 1. If 9Router is explicitly selected as the primary provider:
      if (this.provider === '9router') {
        return await this.generateDialogueNineRouter(agentA, agentB, prompt, memAStrings);
      }

      // 2. If Gemini is available (or provider is 'auto' or 'gemini'):
      if (this.hasGemini()) {
        try {
          const geminiExchange = await this.generateDialogueGemini(agentA, agentB, prompt, memAStrings);
          if (geminiExchange) {
            return geminiExchange;
          }
        } catch (geminiErr: any) {
          console.warn('[GeminiService] Gemini call failed:', geminiErr.message || geminiErr);
        }
      }

      // 3. Fallback: If Gemini is down/timed out/unavailable and 9Router is configured, route through 9Router!
      if (this.hasNineRouter() && (this.provider === 'auto' || this.provider === 'gemini')) {
        console.info('[GeminiService] 🔄 Gemini is down or timed out. Falling back to local 9Router gateway...');
        return await this.generateDialogueNineRouter(agentA, agentB, prompt, memAStrings);
      }

      return null;
    } finally {
      this.isRequestInFlight = false;
    }
  }

  /**
   * Generates dialogue via Google Gemini Generative Language API.
   */
  private async generateDialogueGemini(
    agentA: AgentData,
    agentB: AgentData,
    prompt: string,
    memAStrings: string[]
  ): Promise<DialogExchange | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for dialogue generation

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 280,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[GeminiService] Gemini API returned status ${response.status}: ${response.statusText}`);
        return null;
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      let cleanText = String(rawText).trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      const parsed = JSON.parse(cleanText);
      return this.formatExchange(parsed, agentA, agentB, memAStrings, 'gemini');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[GeminiService] Gemini fetch error:', err.message || err);
      }
      return null;
    }
  }

  /**
   * Generates dialogue via local 9Router OpenAI-compatible endpoint.
   */
  private async generateDialogueNineRouter(
    agentA: AgentData,
    agentB: AgentData,
    prompt: string,
    memAStrings: string[]
  ): Promise<DialogExchange | null> {
    const cleanUrl = this.nineRouterUrl.replace(/\/+$/, '');
    const url = `${cleanUrl}/chat/completions`;

    let targetModel = (this.nineRouterModel || '').trim();
    if (!targetModel || targetModel === 'default') {
      targetModel = 'ac-prod/gemini-3.6-flash';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for local gateway

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getNineRouterHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          messages: [
            {
              role: 'system',
              content: 'You are the AI brain powering NPCs in a simulated living medieval village sandbox. Respond with ONLY raw JSON matching the requested schema.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.85,
          max_tokens: 1200,
          stream: false
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[GeminiService] 9Router returned status ${response.status}: ${response.statusText}`);
        return null;
      }

      const json = await response.json();
      let content = json.choices?.[0]?.message?.content;
      if (!content && json.choices?.[0]?.text) {
        content = json.choices[0].text;
      }
      if (!content) return null;

      let cleanJson = String(content).trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      const parsed = JSON.parse(cleanJson);
      return this.formatExchange(parsed, agentA, agentB, memAStrings, '9router');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[GeminiService] 9Router fetch error:', err.message || err);
      }
      return null;
    }
  }

  /**
   * Normalizes, validates, and records generated dialogue into recent conversation history.
   */
  private formatExchange(
    parsed: any,
    agentA: AgentData,
    agentB: AgentData,
    memAStrings: string[],
    provider: 'gemini' | '9router'
  ): DialogExchange | null {
    const line1 = String(parsed.line1 || '').trim().replace(/^["']|["']$/g, '');
    const line2 = String(parsed.line2 || '').trim().replace(/^["']|["']$/g, '');

    if (!line1 || !line2) return null;

    const validGestures: DialogExchange['gesture1'][] = ['waving', 'handshake', 'gesturing', 'holding_hands'];
    const gesture1 = validGestures.includes(parsed.gesture1) ? parsed.gesture1 : 'gesturing';
    const gesture2 = validGestures.includes(parsed.gesture2) ? parsed.gesture2 : 'gesturing';

    const validBubbles: BubbleType[] = ['heart', 'broken_heart', 'rage', 'food', 'money', 'laugh', 'tears', 'shock', 'peace', 'talk', 'idea', 'fist'];
    const bubble1 = validBubbles.includes(parsed.bubble1) ? parsed.bubble1 : 'talk';
    const bubble2 = validBubbles.includes(parsed.bubble2) ? parsed.bubble2 : 'talk';

    const usedMemories: string[] = [];
    if (parsed.memoryReferenced && parsed.memoryReferenced !== 'None') {
      usedMemories.push(String(parsed.memoryReferenced));
    } else if (memAStrings.length > 0) {
      usedMemories.push(memAStrings[0]);
    }

    const exchange: DialogExchange = {
      line1,
      line2,
      topic: parsed.topic || 'conversation',
      gesture1,
      gesture2,
      bubble1,
      bubble2,
      isAiGenerated: true,
      providerUsed: provider,
      memoriesUsed: usedMemories
    };

    // Record in recent history
    this.recentDialogues.unshift({
      timestamp: Date.now(),
      initiatorName: agentA.name,
      replierName: agentB.name,
      line1,
      line2,
      topic: exchange.topic,
      providerUsed: provider,
      memoriesUsed: usedMemories
    });
    if (this.recentDialogues.length > 30) {
      this.recentDialogues.pop();
    }

    return exchange;
  }
}
