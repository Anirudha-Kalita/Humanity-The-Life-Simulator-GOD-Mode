import { GeminiService, type AiProvider } from '../engine/GeminiService';

export class AiBrainModal {
  private container: HTMLElement;
  private isVisible: boolean = false;
  private isTesting: boolean = false;
  private testResult: { success: boolean; message: string; latencyMs: number } | null = null;
  private showKey: boolean = false;

  // 9Router Local AI Gateway state
  private show9RouterSecrets: boolean = false;
  private isTesting9Router: boolean = false;
  private test9RouterResult: { success: boolean; message: string; latencyMs: number } | null = null;
  private nineRouterModels: string[] = [];
  private isFetchingModels: boolean = false;
  private customModelMode: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.bindGlobalKeys();
    // Auto-fetch models on startup in background
    this.fetchModelsFrom9Router(true);
  }

  private bindGlobalKeys(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.close();
      }
    });
  }

  public async fetchModelsFrom9Router(silent: boolean = false): Promise<void> {
    const gemini = GeminiService.getInstance();
    if (!silent) {
      this.isFetchingModels = true;
      this.render();
    }
    const res = await gemini.fetchNineRouterModels();
    this.isFetchingModels = false;
    if (res.success && res.models.length > 0) {
      this.nineRouterModels = res.models;
      const current = gemini.getNineRouterModel();
      if (!current || current === 'default' || !res.models.includes(current)) {
        const preferred = res.models.find(m => m.includes('gemini-3.6-flash'))
          || res.models.find(m => m.includes('gemini-3.7-flash'))
          || res.models.find(m => m.startsWith('ac-prod/'))
          || res.models[0];
        if (preferred) {
          gemini.setNineRouterModel(preferred);
        }
      }
    }
    this.render();
  }

  public open(): void {
    this.isVisible = true;
    this.container.classList.remove('hidden');
    this.testResult = null;
    this.test9RouterResult = null;
    this.render();
    if (this.nineRouterModels.length === 0) {
      this.fetchModelsFrom9Router(false);
    }
  }

  public close(): void {
    this.isVisible = false;
    this.container.classList.add('hidden');
  }

  public toggle(): void {
    if (this.isVisible) {
      this.close();
    } else {
      this.open();
    }
  }

  public render(): void {
    const gemini = GeminiService.getInstance();
    const apiKey = gemini.getApiKey();
    const currentModel = gemini.getModel();
    const isEnabled = gemini.isEnabled();
    const isAvailable = gemini.isAvailable();
    const provider = gemini.getProvider();
    const nineRouterUrl = gemini.getNineRouterUrl();
    const nineRouterApiKey = gemini.getNineRouterApiKey();
    const nineRouterPassword = gemini.getNineRouterPassword();
    const nineRouterModel = gemini.getNineRouterModel();
    const hasGemini = gemini.hasGemini();
    const hasNineRouter = gemini.hasNineRouter();
    const recentDialogues = gemini.getRecentDialogues();

    let statusBadgeClass = 'status-offline';
    let statusBadgeText = '⚪ Offline (Procedural Fallback Active)';

    if (!isEnabled) {
      statusBadgeClass = 'status-paused';
      statusBadgeText = '⏸️ AI NPC Brain Paused';
    } else if (isAvailable) {
      statusBadgeClass = 'status-active';
      if (provider === 'auto') {
        if (hasGemini && hasNineRouter) {
          statusBadgeText = `🟢 Active (Gemini + 9Router Fallback)`;
        } else if (hasGemini) {
          statusBadgeText = `🟢 Active (Gemini: ${currentModel})`;
        } else {
          statusBadgeText = `💻 Active (9Router: ${nineRouterModel})`;
        }
      } else if (provider === '9router') {
        statusBadgeText = `💻 Active (9Router Local: ${nineRouterModel})`;
      } else {
        statusBadgeText = `🟢 Active (Gemini: ${currentModel})`;
      }
    } else {
      statusBadgeClass = 'status-missing';
      statusBadgeText = '🟡 No Credentials (Configure Gemini or 9Router)';
    }

    this.container.innerHTML = `
      <div class="ai-modal-backdrop" id="ai-modal-backdrop"></div>
      <div class="ai-modal-card">
        <div class="ai-modal-header">
          <div class="ai-modal-title">
            <span class="ai-modal-icon">🧠</span>
            <div>
              <h3>NPC Generative AI Brain</h3>
              <p class="ai-modal-subtitle">Context-aware dialogues, shared memories, & local 9Router fallback</p>
            </div>
          </div>
          <button class="close-btn" id="btn-close-ai-modal" title="Close (ESC)">&times;</button>
        </div>

        <div class="ai-status-banner ${statusBadgeClass}">
          <span>${statusBadgeText}</span>
          <label class="ai-toggle-switch" title="Toggle AI NPC Brain on/off">
            <input type="checkbox" id="ai-enable-toggle" ${isEnabled ? 'checked' : ''} />
            <span class="ai-slider"></span>
          </label>
        </div>

        <div class="ai-modal-body">
          <!-- Provider Strategy Pills -->
          <div class="ai-provider-mode-row">
            <label>AI Routing Strategy</label>
            <div class="ai-mode-pills">
              <button class="ai-mode-pill ${provider === 'auto' ? 'active' : ''}" data-provider-btn="auto" title="Default: use Gemini cloud, and automatically fallback to local 9Router when Gemini is down or times out">
                ⚡ Gemini + 9Router Fallback
              </button>
              <button class="ai-mode-pill ${provider === 'gemini' ? 'active' : ''}" data-provider-btn="gemini" title="Use Google Gemini API only">
                🌐 Gemini Only
              </button>
              <button class="ai-mode-pill ${provider === '9router' ? 'active' : ''}" data-provider-btn="9router" title="Route all requests locally through 9Router">
                💻 9Router Local Only
              </button>
            </div>
          </div>

          <!-- Section 1: Google Gemini Cloud Configuration -->
          <div class="ai-feature-card ${provider === '9router' ? 'dimmed' : ''}">
            <div class="ai-feature-title">
              <span>🌐 1. Google Gemini Cloud API</span>
              <span class="badge-feature ${hasGemini ? 'active' : 'idle'}">${hasGemini ? 'Ready' : 'Missing Key'}</span>
            </div>

            <div class="ai-form-group" style="margin-top: 8px;">
              <label for="ai-api-key-input">Gemini API Key</label>
              <div class="ai-input-row">
                <input
                  type="${this.showKey ? 'text' : 'password'}"
                  id="ai-api-key-input"
                  class="ai-input"
                  placeholder="AIzaSy..."
                  value="${apiKey}"
                  autocomplete="off"
                  spellcheck="false"
                />
                <button class="ai-btn-small" id="btn-toggle-key-visibility" title="${this.showKey ? 'Hide key' : 'Show key'}">
                  ${this.showKey ? '🙈 Hide' : '👁️ Show'}
                </button>
                <button class="ai-btn-small primary" id="btn-save-key">Save Key</button>
                ${apiKey ? `<button class="ai-btn-small danger" id="btn-clear-key" title="Remove saved API key">Clear</button>` : ''}
              </div>
            </div>

            <div class="ai-row-two-col" style="margin-top: 10px;">
              <div class="ai-form-group">
                <label for="ai-model-select">Gemini Model</label>
                <select id="ai-model-select" class="ai-select">
                  <option value="gemini-3.8-flash" ${currentModel === 'gemini-3.8-flash' ? 'selected' : ''}>gemini-3.8-flash (Recommended - 2026 Latest & Fastest)</option>
                  <option value="gemini-2.0-flash" ${currentModel === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Fast & Smart)</option>
                  <option value="gemini-1.5-flash" ${currentModel === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash (Standard)</option>
                  <option value="gemini-1.5-pro" ${currentModel === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro (Deep reasoning)</option>
                </select>
              </div>

              <div class="ai-form-group">
                <label>Gemini Ping</label>
                <button class="ai-btn full-width ${this.isTesting ? 'loading' : ''}" id="btn-test-connection" ${this.isTesting ? 'disabled' : ''}>
                  ${this.isTesting ? '⏳ Testing...' : '⚡ Test Gemini'}
                </button>
              </div>
            </div>

            ${this.testResult ? `
              <div class="ai-test-result ${this.testResult.success ? 'success' : 'error'}" style="margin-top: 10px;">
                <span>${this.testResult.success ? '✅' : '❌'} ${this.testResult.message}</span>
              </div>
            ` : ''}
          </div>

          <!-- Section 2: Local 9Router AI Model Manager Configuration (Automatic Fallback) -->
          <div class="ai-feature-card router-card ${provider === 'gemini' ? 'dimmed' : ''}">
            <div class="ai-feature-title">
              <span>💻 2. Local 9Router AI Gateway (Automatic Fallback)</span>
              <span class="badge-feature ${hasNineRouter ? 'active' : 'idle'}">${hasNineRouter ? 'Configured' : 'Offline'}</span>
            </div>
            <p class="ai-feature-desc">
              When Gemini is down, rate-limited, or timing out, dialogue generation automatically fails over to your local 9Router instance at <code>${nineRouterUrl}</code>.
            </p>

            <div class="ai-row-two-col" style="margin-top: 10px;">
              <div class="ai-form-group">
                <label for="ai-9router-url">9Router Endpoint</label>
                <input
                  type="text"
                  id="ai-9router-url"
                  class="ai-input"
                  value="${nineRouterUrl}"
                  placeholder="http://localhost:20128/v1"
                />
              </div>

              <div class="ai-form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label for="ai-9router-model-select">9Router Model</label>
                  <button class="ai-btn-text" id="btn-refresh-9router-models" style="font-size: 11px; padding: 2px 6px; cursor: pointer; color: #2563eb; background: rgba(37, 99, 235, 0.08); border-radius: 4px; border: 1px solid rgba(37, 99, 235, 0.2);" title="Fetch live models from 9Router">
                    ${this.isFetchingModels ? '⏳ Fetching...' : '🔄 Refresh Models'}
                  </button>
                </div>
                ${this.nineRouterModels.length > 0 && !this.customModelMode ? `
                  <div class="ai-input-row">
                    <select id="ai-9router-model-select" class="ai-select" style="width: 100%;">
                      <optgroup label="🌟 Recommended Active Models">
                        <option value="ac-prod/gemini-3.6-flash" ${nineRouterModel === 'ac-prod/gemini-3.6-flash' ? 'selected' : ''}>ac-prod/gemini-3.6-flash (Fast & Active)</option>
                        <option value="ac-prod/gemini-3.7-flash" ${nineRouterModel === 'ac-prod/gemini-3.7-flash' ? 'selected' : ''}>ac-prod/gemini-3.7-flash (Active)</option>
                        <option value="ac-prod/gpt-5.5" ${nineRouterModel === 'ac-prod/gpt-5.5' ? 'selected' : ''}>ac-prod/gpt-5.5 (Active)</option>
                      </optgroup>
                      <optgroup label="Detected 9Router Models (${this.nineRouterModels.length})">
                        ${this.nineRouterModels.map(m => `
                          <option value="${m}" ${nineRouterModel === m ? 'selected' : ''}>${m}</option>
                        `).join('')}
                      </optgroup>
                      <optgroup label="Custom">
                        <option value="__custom__">✏️ Custom Model Input...</option>
                      </optgroup>
                    </select>
                  </div>
                ` : `
                  <div class="ai-input-row">
                    <input
                      type="text"
                      id="ai-9router-model"
                      class="ai-input"
                      value="${nineRouterModel}"
                      placeholder="e.g. ac-prod/gemini-3.6-flash"
                    />
                    ${this.nineRouterModels.length > 0 ? `
                      <button class="ai-btn-small" id="btn-switch-to-select" title="Switch back to dropdown">📋 List</button>
                    ` : ''}
                  </div>
                `}
                <p class="ai-field-hint">💡 <em>Do NOT use 'default'. 9Router routes 'default' to OpenAI. Use <code>ac-prod/gemini-3.6-flash</code>.</em></p>
              </div>
            </div>

            <div class="ai-row-two-col" style="margin-top: 8px;">
              <div class="ai-form-group">
                <label for="ai-9router-key">9Router API Key</label>
                <input
                  type="${this.show9RouterSecrets ? 'text' : 'password'}"
                  id="ai-9router-key"
                  class="ai-input"
                  value="${nineRouterApiKey}"
                  placeholder="sk-... (e.g. your 9Router Game key)"
                  autocomplete="off"
                />
              </div>

              <div class="ai-form-group">
                <label for="ai-9router-password">9Router Password</label>
                <input
                  type="${this.show9RouterSecrets ? 'text' : 'password'}"
                  id="ai-9router-password"
                  class="ai-input"
                  value="${nineRouterPassword}"
                  placeholder="Optional / INITIAL_PASSWORD"
                  autocomplete="off"
                />
              </div>
            </div>

            <div class="ai-input-row" style="margin-top: 10px; justify-content: flex-end; gap: 8px;">
              <button class="ai-btn-small" id="btn-toggle-9router-secrets">
                ${this.show9RouterSecrets ? '🙈 Hide Secrets' : '👁️ Show Secrets'}
              </button>
              <button class="ai-btn-small primary" id="btn-save-9router">💾 Save 9Router</button>
              <button class="ai-btn-small ${this.isTesting9Router ? 'loading' : ''}" id="btn-test-9router" ${this.isTesting9Router ? 'disabled' : ''}>
                ${this.isTesting9Router ? '⏳ Testing 9Router...' : '⚡ Test 9Router'}
              </button>
            </div>

            ${this.test9RouterResult ? `
              <div class="ai-test-result ${this.test9RouterResult.success ? 'success' : 'error'}" style="margin-top: 10px;">
                <span>${this.test9RouterResult.success ? '✅' : '❌'} ${this.test9RouterResult.message}</span>
              </div>
            ` : ''}
          </div>

          <!-- Section 3: Person Memory System Info -->
          <div class="ai-feature-card">
            <div class="ai-feature-title">
              <span>🎭 Person-Targeted Memory System</span>
              <span class="badge-feature active">Active</span>
            </div>
            <p class="ai-feature-desc">
              When two villagers chat, their past shared memories (grudges, brawls, love, favors, or previous chats) are retrieved and injected directly into the prompt. After each dialogue, the new exchange is saved back into both NPCs' memories.
            </p>
          </div>

          <!-- Section 4: Live AI Dialogue Chronicle -->
          <div class="ai-feed-section">
            <div class="ai-feed-header">
              <h4>Live AI Conversations & Used Memories (${recentDialogues.length})</h4>
              ${recentDialogues.length > 0 ? `<span class="feed-pulse-indicator">● LIVE</span>` : ''}
            </div>

            <div class="ai-dialogue-list">
              ${recentDialogues.length === 0 ? `
                <div class="ai-empty-feed">
                  No live AI conversations recorded yet. Unpause the game or press <strong>E</strong> while possessing a citizen to talk to someone!
                </div>
              ` : recentDialogues.map(d => `
                <div class="ai-feed-item">
                  <div class="feed-item-header">
                    <span class="speakers">
                      <strong>${d.initiatorName}</strong> 💬 <strong>${d.replierName}</strong>
                      <span class="provider-tag ${d.providerUsed === '9router' ? 'nine-router' : 'gemini'}">
                        ${d.providerUsed === '9router' ? '💻 9Router' : '✨ Gemini'}
                      </span>
                    </span>
                    <span class="feed-topic-pill">#${d.topic}</span>
                    <span class="feed-time">${new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <div class="feed-lines">
                    <div class="feed-line initiator">
                      <span class="speaker-label">${d.initiatorName.split(' ')[0]}:</span> "${d.line1}"
                    </div>
                    <div class="feed-line replier">
                      <span class="speaker-label">${d.replierName.split(' ')[0]}:</span> "${d.line2}"
                    </div>
                  </div>
                  ${d.memoriesUsed && d.memoriesUsed.length > 0 ? `
                    <div class="feed-memories-used">
                      <span class="mem-label">🧠 Referenced Person Memories:</span>
                      ${d.memoriesUsed.map(m => `<span class="mem-tag">${m}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const gemini = GeminiService.getInstance();

    // Close buttons
    const closeBtn = this.container.querySelector('#btn-close-ai-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const backdrop = this.container.querySelector('#ai-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => this.close());

    // Routing Strategy Pills
    this.container.querySelectorAll('[data-provider-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = (btn as HTMLElement).dataset.providerBtn as AiProvider;
        if (p) {
          gemini.setProvider(p);
          this.render();
        }
      });
    });

    // Toggle Gemini key visibility
    const toggleVisBtn = this.container.querySelector('#btn-toggle-key-visibility');
    if (toggleVisBtn) {
      toggleVisBtn.addEventListener('click', () => {
        this.showKey = !this.showKey;
        this.render();
      });
    }

    // Save Gemini key
    const saveKeyBtn = this.container.querySelector('#btn-save-key');
    const keyInput = this.container.querySelector('#ai-api-key-input') as HTMLInputElement;
    if (saveKeyBtn && keyInput) {
      saveKeyBtn.addEventListener('click', () => {
        gemini.setApiKey(keyInput.value);
        this.testResult = {
          success: true,
          message: 'Gemini API key saved! Click "Test Gemini" to verify.',
          latencyMs: 0
        };
        this.render();
      });
    }

    // Clear Gemini key
    const clearKeyBtn = this.container.querySelector('#btn-clear-key');
    if (clearKeyBtn) {
      clearKeyBtn.addEventListener('click', () => {
        gemini.setApiKey('');
        this.testResult = null;
        this.render();
      });
    }

    // Toggle 9Router secrets visibility
    const toggle9RouterSecretsBtn = this.container.querySelector('#btn-toggle-9router-secrets');
    if (toggle9RouterSecretsBtn) {
      toggle9RouterSecretsBtn.addEventListener('click', () => {
        this.show9RouterSecrets = !this.show9RouterSecrets;
        this.render();
      });
    }

    // Refresh 9Router models button
    const refreshModelsBtn = this.container.querySelector('#btn-refresh-9router-models');
    if (refreshModelsBtn) {
      refreshModelsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.fetchModelsFrom9Router(false);
      });
    }

    // 9Router Model select
    const nineModelSelect = this.container.querySelector('#ai-9router-model-select') as HTMLSelectElement | null;
    if (nineModelSelect) {
      nineModelSelect.addEventListener('change', () => {
        if (nineModelSelect.value === '__custom__') {
          this.customModelMode = true;
          this.render();
        } else {
          gemini.setNineRouterModel(nineModelSelect.value);
        }
      });
    }

    // Switch back from custom input to list
    const switchToListBtn = this.container.querySelector('#btn-switch-to-select');
    if (switchToListBtn) {
      switchToListBtn.addEventListener('click', () => {
        this.customModelMode = false;
        this.render();
      });
    }

    // Helper to get currently active 9Router model
    const getChosen9RouterModel = (): string => {
      const select = this.container.querySelector('#ai-9router-model-select') as HTMLSelectElement | null;
      const modelInput = this.container.querySelector('#ai-9router-model') as HTMLInputElement | null;
      if (select && select.value !== '__custom__') {
        return select.value;
      }
      return modelInput ? modelInput.value.trim() : gemini.getNineRouterModel();
    };

    // Save 9Router settings
    const save9RouterBtn = this.container.querySelector('#btn-save-9router');
    const urlInput = this.container.querySelector('#ai-9router-url') as HTMLInputElement | null;
    const nineKeyInput = this.container.querySelector('#ai-9router-key') as HTMLInputElement | null;
    const ninePassInput = this.container.querySelector('#ai-9router-password') as HTMLInputElement | null;

    if (save9RouterBtn) {
      save9RouterBtn.addEventListener('click', () => {
        if (urlInput) gemini.setNineRouterUrl(urlInput.value);
        const chosenModel = getChosen9RouterModel();
        if (chosenModel) gemini.setNineRouterModel(chosenModel);
        if (nineKeyInput) gemini.setNineRouterApiKey(nineKeyInput.value);
        if (ninePassInput) gemini.setNineRouterPassword(ninePassInput.value);

        this.test9RouterResult = {
          success: true,
          message: `9Router settings saved! Model: ${gemini.getNineRouterModel()}. Click "Test 9Router" to verify connection.`,
          latencyMs: 0
        };
        this.render();
      });
    }

    // Enable/disable toggle
    const enableToggle = this.container.querySelector('#ai-enable-toggle') as HTMLInputElement;
    if (enableToggle) {
      enableToggle.addEventListener('change', () => {
        gemini.setEnabled(enableToggle.checked);
        this.render();
      });
    }

    // Gemini Model select
    const modelSelect = this.container.querySelector('#ai-model-select') as HTMLSelectElement;
    if (modelSelect) {
      modelSelect.addEventListener('change', () => {
        gemini.setModel(modelSelect.value);
        this.render();
      });
    }

    // Test Gemini connection
    const testBtn = this.container.querySelector('#btn-test-connection');
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        if (keyInput && keyInput.value !== gemini.getApiKey()) {
          gemini.setApiKey(keyInput.value);
        }
        this.isTesting = true;
        this.render();

        const result = await gemini.testConnection();
        this.isTesting = false;
        this.testResult = result;
        this.render();
      });
    }

    // Test 9Router connection
    const test9RouterBtn = this.container.querySelector('#btn-test-9router');
    if (test9RouterBtn) {
      test9RouterBtn.addEventListener('click', async () => {
        if (urlInput) gemini.setNineRouterUrl(urlInput.value);
        const chosenModel = getChosen9RouterModel();
        if (chosenModel) gemini.setNineRouterModel(chosenModel);
        if (nineKeyInput) gemini.setNineRouterApiKey(nineKeyInput.value);
        if (ninePassInput) gemini.setNineRouterPassword(ninePassInput.value);

        this.isTesting9Router = true;
        this.render();

        const result = await gemini.testNineRouterConnection();
        this.isTesting9Router = false;
        this.test9RouterResult = result;
        this.render();
      });
    }
  }
}
