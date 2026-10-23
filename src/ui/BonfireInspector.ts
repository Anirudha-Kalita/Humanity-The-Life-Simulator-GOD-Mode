import { Simulation } from '../engine/Simulation';
import type { BonfireView, BonfireState } from '../types/simulation';

export class BonfireInspector {
  private container: HTMLElement;
  private sim: Simulation;

  constructor(container: HTMLElement, sim: Simulation) {
    this.container = container;
    this.sim = sim;
  }

  public update(): void {
    if (!this.sim.selectedBonfire) {
      this.container.classList.add('hidden');
      return;
    }

    this.container.classList.remove('hidden');
    this.render();
  }

  private render(): void {
    const cf = this.sim.world.campfire;
    const currentView: BonfireView = cf.view || 'front';
    const currentState: BonfireState = cf.state || 'auto';
    const currentHour = Math.floor(this.sim.gameMinutes / 60);

    const isEvening = currentHour >= 17 && currentHour < 22;
    const isDeepNight = currentHour >= 23 || currentHour < 5;

    let timeSummary = 'Daytime: Steady village warmth.';
    if (isEvening) {
      timeSummary = '🌅 Evening Gathering: Settlers are sitting around the bonfire sharing stories and dinner!';
    } else if (isDeepNight) {
      timeSummary = '🌙 Deep Night: Settlers are asleep in their cabins; coals smolder peacefully.';
    }

    this.container.innerHTML = `
      <div class="building-card bonfire-card">
        <!-- Header -->
        <div class="building-header">
          <div class="building-avatar" style="background-color: #ea580c;">
            <span>🔥</span>
          </div>
          <div class="building-header-info">
            <div class="building-top-row">
              <span class="building-title">Village Bonfire</span>
              <button class="close-btn" id="btn-close-bonfire">&times;</button>
            </div>
            <div class="building-meta">
              <span>Communal Hearth</span> • 
              <span class="status-pill status-ready">BURNING</span> • 
              <span>Position: (${Math.round(cf.x)}, ${Math.round(cf.y)})</span>
            </div>
          </div>
        </div>

        <!-- Time & Status Context -->
        <div class="building-section" style="border-top: none; padding-top: 4px;">
          <div class="bonfire-context-box">
            <span class="bonfire-context-icon">${isEvening ? '🎉' : isDeepNight ? '🌙' : '☀️'}</span>
            <span class="bonfire-context-text">${timeSummary}</span>
          </div>
        </div>

        <!-- 1. Positions / Perspectives (5 Views from artwork) -->
        <div class="building-section">
          <div class="section-title">📐 Perspective View (5 Angles)</div>
          <div class="bonfire-btn-grid">
            <button class="bonfire-opt-btn ${currentView === 'front' ? 'active' : ''}" data-view="front">
              <span>⬇️</span> Front View
            </button>
            <button class="bonfire-opt-btn ${currentView === 'left' ? 'active' : ''}" data-view="left">
              <span>⬅️</span> Left View
            </button>
            <button class="bonfire-opt-btn ${currentView === 'right' ? 'active' : ''}" data-view="right">
              <span>➡️</span> Right View
            </button>
            <button class="bonfire-opt-btn ${currentView === 'back' ? 'active' : ''}" data-view="back">
              <span>⬆️</span> Back View
            </button>
            <button class="bonfire-opt-btn ${currentView === 'top' ? 'active' : ''}" data-view="top">
              <span>🎯</span> Top-Down
            </button>
          </div>
        </div>

        <!-- 2. Animation / State Variations (6 States from artwork) -->
        <div class="building-section">
          <div class="section-title">🔥 Animation & Flame State</div>
          <div class="bonfire-btn-grid">
            <button class="bonfire-opt-btn ${currentState === 'auto' ? 'active' : ''}" data-state="auto">
              <span>✨</span> Dynamic Auto
            </button>
            <button class="bonfire-opt-btn ${currentState === 'burning_high' ? 'active' : ''}" data-state="burning_high">
              <span>🔥</span> Burning (High)
            </button>
            <button class="bonfire-opt-btn ${currentState === 'crackling' ? 'active' : ''}" data-state="crackling">
              <span>⚡</span> Crackling
            </button>
            <button class="bonfire-opt-btn ${currentState === 'burning_medium' ? 'active' : ''}" data-state="burning_medium">
              <span>🪵</span> Burning (Med)
            </button>
            <button class="bonfire-opt-btn ${currentState === 'idle' ? 'active' : ''}" data-state="idle">
              <span>🕯️</span> Idle (Small)
            </button>
            <button class="bonfire-opt-btn ${currentState === 'smoldering' ? 'active' : ''}" data-state="smoldering">
              <span>💨</span> Smoldering
            </button>
            <button class="bonfire-opt-btn ${currentState === 'dying_out' ? 'active' : ''}" data-state="dying_out">
              <span>🪨</span> Dying Out
            </button>
          </div>
        </div>

        <!-- 3. Fuel & Quick Actions -->
        <div class="building-section">
          <div class="section-title">🪵 Firewood & Flame Tending</div>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <button class="building-action-btn" id="btn-stoke-bonfire" style="background: #ea580c; color: white;">
              🪵 Add Firewood (+Stoke)
            </button>
            <button class="building-action-btn" id="btn-douse-bonfire" style="background: #475569; color: white;">
              💧 Douse Flames
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Close button
    const closeBtn = this.container.querySelector('#btn-close-bonfire');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.sim.selectedBonfire = false;
      });
    }

    // View buttons
    this.container.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view as BonfireView;
        if (view) {
          this.sim.setBonfireView(view);
          this.render();
        }
      });
    });

    // State buttons
    this.container.querySelectorAll<HTMLButtonElement>('[data-state]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const state = btn.dataset.state as BonfireState;
        if (state) {
          this.sim.setBonfireState(state);
          this.render();
        }
      });
    });

    // Stoke button
    const stokeBtn = this.container.querySelector('#btn-stoke-bonfire');
    if (stokeBtn) {
      stokeBtn.addEventListener('click', () => {
        this.sim.stokeBonfire();
        this.render();
      });
    }

    // Douse button
    const douseBtn = this.container.querySelector('#btn-douse-bonfire');
    if (douseBtn) {
      douseBtn.addEventListener('click', () => {
        this.sim.douseBonfire();
        this.render();
      });
    }
  }
}
