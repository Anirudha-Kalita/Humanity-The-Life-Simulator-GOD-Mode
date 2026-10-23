import { Simulation } from '../engine/Simulation';
import type { GodPowerType, TreeVariant, TreeStage, SettlerRole } from '../types/simulation';

import talkPortraitUrl from '../assets/actions/act_talk.png';

interface PowerButtonDef {
  power: GodPowerType;
  icon: string;
  label: string;
  title: string;
}

export class GodModeBar {
  private container: HTMLElement;
  private sim: Simulation;
  private onOpenAiModal?: () => void;
  private isCollapsed: boolean = false;
  private barResizeObserver: ResizeObserver | null = null;
  private observedWrapper: HTMLElement | null = null;

  private readonly powerDefs: PowerButtonDef[] = [
    { power: 'none', icon: '🔍', label: 'Inspect', title: 'Select / inspect settlers and scenery' },
    { power: 'possess', icon: '🎭', label: 'Possess', title: 'Take direct bodily control of a settler' },
    { power: 'spawn_settler', icon: '👥', label: 'Add Settler', title: 'Add new settlers of chosen gender (Click land to place as many as you want!)' },
    { power: 'lightning', icon: '⚡', label: 'Lightning', title: 'Cast a divine lightning bolt' },
    { power: 'cupid', icon: '💘', label: 'Cupid', title: 'Force two settlers into passionate love' },
    { power: 'discord', icon: '🔥', label: 'Discord', title: 'Sow hatred and spark a brawl' },
    { power: 'drop_cash', icon: '🪵', label: 'Wood', title: 'Bestow 10 pine logs on the ground and in the stockpile' },
    { power: 'drop_food', icon: '🍲', label: 'Food', title: 'Spawn a feast and replenish settlement food' },
    { power: 'tranquility', icon: '🕊️', label: 'Peace', title: 'Restore forest serenity and heal all souls' },
    { power: 'create_house', icon: '🛖', label: 'House', title: 'Create a new family cabin on solid land' },
    { power: 'move_house', icon: '🚚', label: 'Move', title: 'Move and relocate an existing house' },
    { power: 'destroy_house', icon: '💥', label: 'Demolish', title: 'Demolish an existing cabin' },
    { power: 'plant_tree', icon: '🌲', label: 'Plant', title: 'Plant a new illustrated tree anywhere on land' },
    { power: 'remove_tree', icon: '🪓', label: 'Chop', title: 'Chop down and remove any tree' },
    { power: 'smite', icon: '💀', label: 'Smite', title: 'Instantly strike down a target settler' },
    { power: 'resurrect', icon: '✨', label: 'Revive', title: 'Fully heal and revive a target settler' }
  ];

  constructor(container: HTMLElement, sim: Simulation, onOpenAiModal?: () => void) {
    this.container = container;
    this.sim = sim;
    this.onOpenAiModal = onOpenAiModal;
    this.render();
    this.setupBarMetrics();
  }

  private getGenderBreakdown(): string {
    let female = 0;
    let male = 0;
    for (const a of this.sim.agents) {
      if (a.data.appearance.gender === 'female') female++;
      else male++;
    }
    return `${female}👩 ${male}👨`;
  }

  private getPowerName(power: GodPowerType): string {
    const map: Record<string, string> = {
      none: '🔍 Inspect',
      possess: '🎭 Possess',
      spawn_settler: '👥 Add Settler',
      lightning: '⚡ Lightning',
      cupid: '💘 Cupid',
      discord: '🔥 Discord',
      drop_cash: '🪵 Gift Wood',
      drop_weapon: '⚔️ Gift Weapon',
      drop_food: '🍲 Gift Food',
      tranquility: '🕊️ Peace',
      create_house: '🛖 Create House',
      move_house: '🚚 Move House',
      destroy_house: '💥 Demolish',
      plant_tree: '🌲 Plant Tree',
      remove_tree: '🪓 Remove Tree',
      smite: '💀 Smite',
      resurrect: '✨ Revive',
      rain: '🌧️ Rain',
      inspect: '🔍 Inspect',
      build_homestead: '🔨 Build Home'
    };
    return map[power] || '🔍 Inspect';
  }

  public render(): void {
    const s = this.sim.world.stockpile;
    const powerButtons = this.powerDefs.map(def => this.renderPowerButton(def)).join('');

    this.container.innerHTML = `
      <div class="god-bar-wrapper ${this.isCollapsed ? 'collapsed' : ''}" id="god-bar-wrapper">
        <!-- Expanded Full God Bar -->
        <div class="god-bar" id="god-bar-full">
          <!-- Compact top row: brand, clock, stockpile, time, actions -->
          <div class="god-bar-top">
            <div class="god-header">
              <div class="god-title">
                <span class="god-icon">🌲</span>
                <span class="god-name">FOREST SANCTUARY GOD SIM</span>
              </div>
              <div class="clock-display" id="clock-display">
                Day 1, 08:00 AM ☀️
              </div>
            </div>

            <div class="divider god-divider"></div>

            <!-- Settlement Stockpile Tracker -->
            <div class="stockpile-hud" id="stockpile-hud">
              <span class="stock-item" title="Timber reserve for building">🪵 <strong id="stock-wood">${s.wood}</strong></span>
              <span class="stock-item" title="Community food rations">🍲 <strong id="stock-food">${s.food}</strong></span>
              <span class="stock-item" title="River fish in storage">🐟 <strong id="stock-fish">${s.fish}</strong></span>
            </div>

            <div class="divider god-divider"></div>

            <!-- Time Controls -->
            <div class="btn-group time-controls" role="group" aria-label="Time controls">
              <button class="tool-btn ${this.sim.timeSpeed === 0 ? 'active' : ''}" data-speed="0" title="Pause (Space)" aria-label="Pause">
                <span class="btn-icon" aria-hidden="true">⏸️</span><span class="btn-label">Pause</span>
              </button>
              <button class="tool-btn ${this.sim.timeSpeed === 1 ? 'active' : ''}" data-speed="1" title="Normal Speed (1x)" aria-label="Normal speed">
                <span class="btn-icon" aria-hidden="true">▶️</span><span class="btn-label">1x</span>
              </button>
              <button class="tool-btn ${this.sim.timeSpeed === 2 ? 'active' : ''}" data-speed="2" title="Fast Forward (2x)" aria-label="Fast forward">
                <span class="btn-icon" aria-hidden="true">⏩</span><span class="btn-label">2x</span>
              </button>
              <button class="tool-btn ${this.sim.timeSpeed === 5 ? 'active' : ''}" data-speed="5" title="Hyper Speed (5x)" aria-label="Hyper speed">
                <span class="btn-icon" aria-hidden="true">⏭️</span><span class="btn-label">5x</span>
              </button>
            </div>

            <div class="god-bar-spacer" aria-hidden="true"></div>

            <!-- Settler Creator in God Bar -->
            <div class="settler-spawner-control" id="settler-spawner-control" title="Settler Addition">
              <div class="gender-toggle-group" role="group" aria-label="Settler gender selector">
                <button class="gender-btn ${this.sim.selectedSettlerGender === 'female' ? 'active' : ''}" data-settler-gender="female" title="Select Female Gender (👩)">
                  <span class="gender-icon" aria-hidden="true">👩</span><span class="gender-label">Female</span>
                </button>
                <button class="gender-btn ${this.sim.selectedSettlerGender === 'male' ? 'active' : ''}" data-settler-gender="male" title="Select Male Gender (👨)">
                  <span class="gender-icon" aria-hidden="true">👨</span><span class="gender-label">Male</span>
                </button>
                <button class="gender-btn ${this.sim.selectedSettlerGender === 'random' ? 'active' : ''}" data-settler-gender="random" title="Random Gender (🎲)">
                  <span class="gender-icon" aria-hidden="true">🎲</span><span class="gender-label">Any</span>
                </button>
              </div>
              <button class="tool-btn action-btn btn-spawn-settler" id="btn-spawn-human" title="Add new settler of selected gender (Click as many times as you want!)">
                <span class="btn-icon" aria-hidden="true">➕</span><span class="btn-label">Add Settler</span>
              </button>
            </div>

            <!-- Population count badge in god bar -->
            <div class="population-hud" id="population-hud" title="Settlement Population Tracker">
              <span class="pop-icon" aria-hidden="true">👥</span>
              <strong id="pop-total-count">${this.sim.agents.length}</strong>
              <span class="pop-breakdown" id="pop-breakdown">(${this.getGenderBreakdown()})</span>
            </div>

            <div class="divider god-divider"></div>

            <!-- Weather & AI tools -->
            <div class="btn-group action-tools">
              <button class="tool-btn action-btn" id="btn-toggle-weather" title="Toggle Forest Rain / Storm">
                <span class="btn-icon" aria-hidden="true">🌧️</span><span class="btn-label">Weather</span>
              </button>
              <button class="tool-btn action-btn btn-ai-brain-trigger" id="btn-open-ai-brain" title="Gemini AI Brain Settings & Memory Feed">
                <span class="btn-icon" aria-hidden="true">🧠</span><span class="btn-label">AI Brain</span>
              </button>
            </div>

            <!-- Collapse Button -->
            <button class="god-collapse-btn" id="god-collapse-btn" title="Hide God Toolbar (Press 'G')" aria-label="Hide god toolbar">
              <span class="btn-icon" aria-hidden="true">▲</span><span class="btn-label">Hide</span>
            </button>
          </div>

          <!-- Horizontally wrapping God Powers row -->
          <div class="god-bar-powers-row">
            <span class="powers-section-label">God Powers</span>
            <div class="btn-group god-powers" role="group" aria-label="God powers">
              ${powerButtons}
            </div>
          </div>
        </div>

        <!-- Tree Planting Variety Palette (sub-bar visible when plant_tree power is active) -->
        <div class="tree-palette-bar ${this.sim.activeGodPower === 'plant_tree' ? '' : 'hidden'}" id="tree-palette-bar">
          <span class="palette-label">🌱 Tree Type:</span>
          <div class="tree-variant-chips">
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === undefined ? 'active' : ''}" data-tree-variant="random">🎲 Random</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 0 ? 'active' : ''}" data-tree-variant="0">🌳 Small</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 1 ? 'active' : ''}" data-tree-variant="1">🌳 Medium</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 2 ? 'active' : ''}" data-tree-variant="2">🌳 Large</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 3 ? 'active' : ''}" data-tree-variant="3">🌲 Tall Slim</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 4 ? 'active' : ''}" data-tree-variant="4">🌲 Pine</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 5 ? 'active' : ''}" data-tree-variant="5">❄️ Snow Pine</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 6 ? 'active' : ''}" data-tree-variant="6">🍎 Apple</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 7 ? 'active' : ''}" data-tree-variant="7">🍊 Orange</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 8 ? 'active' : ''}" data-tree-variant="8">🌸 Cherry</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 9 ? 'active' : ''}" data-tree-variant="9">🍂 Autumn</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 10 ? 'active' : ''}" data-tree-variant="10">🌺 Blooming</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 11 ? 'active' : ''}" data-tree-variant="11">🌴 Palm</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 12 ? 'active' : ''}" data-tree-variant="12">🌿 Willow</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 13 ? 'active' : ''}" data-tree-variant="13">🎋 Birch</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 14 ? 'active' : ''}" data-tree-variant="14">🪵 Dead</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 15 ? 'active' : ''}" data-tree-variant="15">🪨 Rocky</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 16 ? 'active' : ''}" data-tree-variant="16">🌊 Mangrove</button>
            <button class="variant-chip ${this.sim.selectedPlantTreeVariant === 17 ? 'active' : ''}" data-tree-variant="17">🎍 Bamboo</button>
          </div>
          <div class="palette-divider"></div>
          <span class="palette-label">Stage:</span>
          <div class="tree-stage-chips">
            <button class="stage-chip ${this.sim.selectedPlantTreeStage === 'mature' ? 'active' : ''}" data-tree-stage="mature">Mature</button>
            <button class="stage-chip ${this.sim.selectedPlantTreeStage === 'ancient' ? 'active' : ''}" data-tree-stage="ancient">Ancient</button>
            <button class="stage-chip ${this.sim.selectedPlantTreeStage === 'young' ? 'active' : ''}" data-tree-stage="young">Young</button>
            <button class="stage-chip ${this.sim.selectedPlantTreeStage === 'sapling' ? 'active' : ''}" data-tree-stage="sapling">Sapling</button>
          </div>
        </div>

        <!-- Settler Variety & Role Palette (sub-bar visible when spawn_settler power is active) -->
        <div class="settler-palette-bar ${this.sim.activeGodPower === 'spawn_settler' ? '' : 'hidden'}" id="settler-palette-bar">
          <img class="settler-portrait" src="${talkPortraitUrl}" alt="" aria-hidden="true" />
          <span class="palette-label">👥 Settler Gender:</span>
          <div class="settler-gender-chips">
            <button class="variant-chip gender-chip ${this.sim.selectedSettlerGender === 'female' ? 'active' : ''}" data-palette-gender="female">👩 Female</button>
            <button class="variant-chip gender-chip ${this.sim.selectedSettlerGender === 'male' ? 'active' : ''}" data-palette-gender="male">👨 Male</button>
            <button class="variant-chip gender-chip ${this.sim.selectedSettlerGender === 'random' ? 'active' : ''}" data-palette-gender="random">🎲 Any</button>
          </div>
          <div class="palette-divider"></div>
          <span class="palette-label">Role:</span>
          <div class="settler-role-chips">
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'random' ? 'active' : ''}" data-settler-role="random">🎲 Any</button>
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'lumberjack' ? 'active' : ''}" data-settler-role="lumberjack">🪓 Lumberjack</button>
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'hunter' ? 'active' : ''}" data-settler-role="hunter">🏹 Hunter</button>
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'fisher' ? 'active' : ''}" data-settler-role="fisher">🎣 Fisher</button>
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'forager' ? 'active' : ''}" data-settler-role="forager">🍓 Forager</button>
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'cook' ? 'active' : ''}" data-settler-role="cook">🍳 Cook</button>
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'builder' ? 'active' : ''}" data-settler-role="builder">🔨 Builder</button>
            <button class="stage-chip role-chip ${this.sim.selectedSettlerRole === 'healer' ? 'active' : ''}" data-settler-role="healer">🌿 Healer</button>
          </div>
          <div class="palette-divider"></div>
          <div class="settler-quick-actions">
            <button class="palette-action-btn" id="btn-palette-spawn-one" title="Spawn 1 settler right in town (Click repeatedly to add as many as you want!)">
              <span>➕ Spawn in Town</span>
            </button>
            <button class="palette-action-btn" id="btn-palette-spawn-five" title="Quickly spawn 5 settlers of chosen gender">
              <span>➕ Spawn 5</span>
            </button>
          </div>
          <span class="palette-hint">💡 Click ground to place settlers anywhere!</span>
        </div>

        <!-- Collapsed Compact Pill -->
        <div class="god-bar-collapsed" id="god-bar-collapsed" title="Click to Expand God Toolbar (or press 'G')">
          <div class="collapsed-brand">
            <span class="god-icon">🌲</span>
            <span class="collapsed-title">GOD MENU</span>
            <span class="collapsed-clock" id="collapsed-clock-display">Day 1, 08:00 AM ☀️</span>
          </div>
          <div class="divider collapsed-divider"></div>
          <div class="collapsed-stockpile" id="collapsed-stockpile">
            <span>🪵 <strong id="collapsed-stock-wood">${s.wood}</strong></span>
            <span>🍲 <strong id="collapsed-stock-food">${s.food}</strong></span>
            <span>🐟 <strong id="collapsed-stock-fish">${s.fish}</strong></span>
          </div>
          <div class="divider collapsed-divider"></div>
          <div class="collapsed-population" id="collapsed-population" title="Total Settlers">
            <span>👥 <strong id="collapsed-pop-count">${this.sim.agents.length}</strong></span>
          </div>
          <div class="divider collapsed-divider"></div>
          <div class="collapsed-active-power">
            <span class="power-tag" id="collapsed-power-tag">${this.getPowerName(this.sim.activeGodPower)}</span>
          </div>
          <div class="collapsed-expand-btn">
            <span class="btn-icon" aria-hidden="true">▼</span><span class="btn-label">Expand</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderPowerButton(def: PowerButtonDef): string {
    const isActive = this.sim.activeGodPower === def.power;
    return `
      <button class="tool-btn power-btn${isActive ? ' active' : ''}" data-power="${def.power}"
        title="${def.title}" aria-label="${def.label}" aria-pressed="${isActive}">
        <span class="btn-icon" aria-hidden="true">${def.icon}</span>
        <span class="btn-label">${def.label}</span>
      </button>
    `;
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    const wrapper = this.container.querySelector('#god-bar-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('collapsed', this.isCollapsed);
    }
    this.updateClock();
    this.updateActiveButtons();
    // Layout changes on the next frame; keep the side inspectors aligned with the bar.
    requestAnimationFrame(() => this.updateBarMetrics());
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return (
      el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      el.isContentEditable === true
    );
  }

  private bindEvents(): void {
    this.container.querySelectorAll('[data-speed]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseInt((e.currentTarget as HTMLElement).dataset.speed || '1', 10);
        this.sim.timeSpeed = speed;
        this.updateActiveButtons();
      });
    });

    this.container.querySelectorAll('[data-power]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const power = (e.currentTarget as HTMLElement).dataset.power as GodPowerType;
        this.sim.activeGodPower = power;
        this.updateActiveButtons();
        requestAnimationFrame(() => this.updateBarMetrics());
      });
    });

    const spawnBtn = this.container.querySelector('#btn-spawn-human');
    if (spawnBtn) {
      spawnBtn.addEventListener('click', () => {
        const newAgent = this.sim.spawnCitizenWithSelectedOptions();
        this.sim.selectedAgent = newAgent;
        document.dispatchEvent(new CustomEvent('settler-spawned', { detail: newAgent.data.id }));
        this.updateClock();
      });
    }

    this.container.querySelectorAll('[data-settler-gender], [data-palette-gender]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gender = (e.currentTarget as HTMLElement).dataset.settlerGender ||
          (e.currentTarget as HTMLElement).dataset.paletteGender;
        if (gender === 'male' || gender === 'female' || gender === 'random') {
          this.sim.selectedSettlerGender = gender;
          this.updateActiveButtons();
        }
      });
    });

    this.container.querySelectorAll('[data-settler-role]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = (e.currentTarget as HTMLElement).dataset.settlerRole as SettlerRole | 'random';
        this.sim.selectedSettlerRole = role || 'random';
        this.updateActiveButtons();
      });
    });

    const paletteSpawnOne = this.container.querySelector('#btn-palette-spawn-one');
    if (paletteSpawnOne) {
      paletteSpawnOne.addEventListener('click', () => {
        const newAgent = this.sim.spawnCitizenWithSelectedOptions();
        this.sim.selectedAgent = newAgent;
        document.dispatchEvent(new CustomEvent('settler-spawned', { detail: newAgent.data.id }));
        this.updateClock();
      });
    }

    const paletteSpawnFive = this.container.querySelector('#btn-palette-spawn-five');
    if (paletteSpawnFive) {
      paletteSpawnFive.addEventListener('click', () => {
        let lastAgent: any = null;
        for (let i = 0; i < 5; i++) {
          lastAgent = this.sim.spawnCitizenWithSelectedOptions();
        }
        if (lastAgent) {
          this.sim.selectedAgent = lastAgent;
          document.dispatchEvent(new CustomEvent('settler-spawned', { detail: lastAgent.data.id }));
        }
        this.updateClock();
      });
    }

    const weatherBtn = this.container.querySelector('#btn-toggle-weather');
    if (weatherBtn) {
      weatherBtn.addEventListener('click', () => {
        this.sim.weather = this.sim.weather === 'sunny' ? 'stormy' : 'sunny';
        this.sim.addDramaEvent('general', `Skies above the river shifted to ${this.sim.weather}.`, []);
      });
    }

    const aiBrainBtn = this.container.querySelector('#btn-open-ai-brain');
    if (aiBrainBtn) {
      aiBrainBtn.addEventListener('click', () => {
        if (this.onOpenAiModal) {
          this.onOpenAiModal();
        } else {
          window.dispatchEvent(new CustomEvent('open-ai-brain-modal'));
        }
      });
    }

    const collapseBtn = this.container.querySelector('#god-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse();
      });
    }

    const collapsedBar = this.container.querySelector('#god-bar-collapsed');
    if (collapsedBar) {
      collapsedBar.addEventListener('click', () => {
        if (this.isCollapsed) {
          this.toggleCollapse();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (this.isTypingTarget(e.target) || e.repeat) return;

      if (e.code === 'KeyG' || e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        this.toggleCollapse();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.sim.timeSpeed = this.sim.timeSpeed === 0 ? 1 : 0;
        this.updateActiveButtons();
      }
    });

    // Tree Plant Palette event bindings
    this.container.querySelectorAll('[data-tree-variant]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantStr = (e.currentTarget as HTMLElement).dataset.treeVariant;
        if (variantStr === 'random') {
          this.sim.selectedPlantTreeVariant = undefined;
        } else {
          this.sim.selectedPlantTreeVariant = parseInt(variantStr || '0', 10) as TreeVariant;
        }
        this.updateActiveButtons();
      });
    });

    this.container.querySelectorAll('[data-tree-stage]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stageStr = (e.currentTarget as HTMLElement).dataset.treeStage as TreeStage;
        this.sim.selectedPlantTreeStage = stageStr || 'mature';
        this.updateActiveButtons();
      });
    });
  }

  public updateActiveButtons(): void {
    this.container.querySelectorAll('[data-speed]').forEach(btn => {
      const speed = parseInt((btn as HTMLElement).dataset.speed || '1', 10);
      btn.classList.toggle('active', this.sim.timeSpeed === speed);
    });

    this.container.querySelectorAll('[data-power]').forEach(btn => {
      const power = (btn as HTMLElement).dataset.power;
      btn.classList.toggle('active', this.sim.activeGodPower === power);
    });

    const paletteBar = this.container.querySelector('#tree-palette-bar');
    if (paletteBar) {
      paletteBar.classList.toggle('hidden', this.sim.activeGodPower !== 'plant_tree');
    }

    const settlerBar = this.container.querySelector('#settler-palette-bar');
    if (settlerBar) {
      settlerBar.classList.toggle('hidden', this.sim.activeGodPower !== 'spawn_settler');
    }

    this.container.querySelectorAll('[data-settler-gender], [data-palette-gender]').forEach(btn => {
      const gender = (btn as HTMLElement).dataset.settlerGender || (btn as HTMLElement).dataset.paletteGender;
      btn.classList.toggle('active', gender === this.sim.selectedSettlerGender);
    });

    this.container.querySelectorAll('[data-settler-role]').forEach(btn => {
      const role = (btn as HTMLElement).dataset.settlerRole;
      btn.classList.toggle('active', role === this.sim.selectedSettlerRole);
    });

    this.container.querySelectorAll('[data-tree-variant]').forEach(btn => {
      const v = (btn as HTMLElement).dataset.treeVariant;
      if (v === 'random') {
        btn.classList.toggle('active', this.sim.selectedPlantTreeVariant === undefined);
      } else {
        btn.classList.toggle('active', this.sim.selectedPlantTreeVariant === parseInt(v || '-1', 10));
      }
    });

    this.container.querySelectorAll('[data-tree-stage]').forEach(btn => {
      const s = (btn as HTMLElement).dataset.treeStage;
      btn.classList.toggle('active', this.sim.selectedPlantTreeStage === s);
    });

    const collapsedPowerTag = this.container.querySelector('#collapsed-power-tag');
    if (collapsedPowerTag) {
      collapsedPowerTag.textContent = this.getPowerName(this.sim.activeGodPower);
    }
  }

  public updateClock(): void {
    const weatherEmoji = this.sim.weather === 'sunny'
      ? '☀️'
      : this.sim.weather === 'cloudy'
        ? '☁️'
        : this.sim.weather === 'rainy'
          ? '🌧️'
          : '⛈️';
    const formattedTime = `${this.sim.getTimeFormatted()} ${weatherEmoji}`;

    const clockEl = this.container.querySelector('#clock-display');
    if (clockEl) {
      clockEl.textContent = formattedTime;
    }

    const collapsedClockEl = this.container.querySelector('#collapsed-clock-display');
    if (collapsedClockEl) {
      collapsedClockEl.textContent = formattedTime;
    }

    const woodEl = this.container.querySelector('#stock-wood');
    const foodEl = this.container.querySelector('#stock-food');
    const fishEl = this.container.querySelector('#stock-fish');
    if (woodEl) woodEl.textContent = this.sim.world.stockpile.wood.toString();
    if (foodEl) foodEl.textContent = this.sim.world.stockpile.food.toString();
    if (fishEl) fishEl.textContent = this.sim.world.stockpile.fish.toString();

    const cWoodEl = this.container.querySelector('#collapsed-stock-wood');
    const cFoodEl = this.container.querySelector('#collapsed-stock-food');
    const cFishEl = this.container.querySelector('#collapsed-stock-fish');
    if (cWoodEl) cWoodEl.textContent = this.sim.world.stockpile.wood.toString();
    if (cFoodEl) cFoodEl.textContent = this.sim.world.stockpile.food.toString();
    if (cFishEl) cFishEl.textContent = this.sim.world.stockpile.fish.toString();

    const popTotalEl = this.container.querySelector('#pop-total-count');
    const popBreakdownEl = this.container.querySelector('#pop-breakdown');
    if (popTotalEl) popTotalEl.textContent = this.sim.agents.length.toString();
    if (popBreakdownEl) popBreakdownEl.textContent = `(${this.getGenderBreakdown()})`;

    const cPopEl = this.container.querySelector('#collapsed-pop-count');
    if (cPopEl) cPopEl.textContent = this.sim.agents.length.toString();
  }

  /**
   * Exposes the real rendered bar height as a CSS variable so the right-side
   * inspector panels never overlap the toolbar on short or narrow screens.
   */
  private setupBarMetrics(): void {
    this.updateBarMetrics();

    if (typeof ResizeObserver !== 'undefined') {
      this.barResizeObserver = new ResizeObserver(() => this.updateBarMetrics());
      const wrapper = this.container.querySelector('#god-bar-wrapper') as HTMLElement | null;
      if (wrapper) {
        this.observedWrapper = wrapper;
        this.barResizeObserver.observe(wrapper);
      }
    }

    window.addEventListener('resize', () => this.updateBarMetrics());
  }

  private updateBarMetrics(): void {
    const wrapper = (this.observedWrapper || this.container.querySelector('#god-bar-wrapper')) as HTMLElement | null;
    if (!wrapper) return;

    const height = Math.ceil(wrapper.getBoundingClientRect().height);
    if (height > 0 && Number.isFinite(height)) {
      document.documentElement.style.setProperty('--god-bar-height', `${height}px`);
    }
  }
}
