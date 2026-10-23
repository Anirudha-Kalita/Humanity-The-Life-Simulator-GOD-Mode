import { Simulation } from '../engine/Simulation';
import { Agent } from '../engine/Agent';

export interface SettlerMoodInfo {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  desire: string;
}

export function getSettlerMood(agent: Agent): SettlerMoodInfo {
  const d = agent.data;
  const n = d.needs;

  if (d.isPregnant) {
    return {
      name: 'Expecting Mother',
      emoji: '🤰',
      color: '#db2777',
      bgColor: '#fdf2f8',
      desire: `Nurturing new life (${Math.round(d.pregnancyProgress || 0)}% gestation)`
    };
  }
  if (d.age <= 3 || d.role === 'toddler') {
    return {
      name: 'Curious Toddler',
      emoji: '🍼',
      color: '#0ea5e9',
      bgColor: '#f0f9ff',
      desire: 'Crawling and playing with toys'
    };
  }
  if (d.age < 16) {
    return {
      name: 'Playful Child',
      emoji: '🧒',
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      desire: 'Playing games and exploring with friends'
    };
  }
  if (n.health <= 0) {
    return { name: 'Unconscious', emoji: '🩸', color: '#ef4444', bgColor: '#fee2e2', desire: 'Needs urgent healing!' };
  }
  if (n.health < 35) {
    return { name: 'Gravely Injured', emoji: '🩹', color: '#dc2626', bgColor: '#fee2e2', desire: 'Rushing to the healer' };
  }
  if (d.actionState === 'fighting') {
    return { name: 'Brawling / Enraged', emoji: '⚔️', color: '#dc2626', bgColor: '#fee2e2', desire: 'Fighting for settlement honor' };
  }
  if (d.actionState === 'flirting') {
    return { name: 'Smitten & Romancing', emoji: '💖', color: '#ec4899', bgColor: '#fdf2f8', desire: 'Longing for love and marriage' };
  }
  if (d.actionState === 'sleeping') {
    return { name: 'Sound Asleep', emoji: '💤', color: '#6366f1', bgColor: '#eef2ff', desire: 'Restoring energy and peace' };
  }
  if (d.actionState === 'eating') {
    return { name: 'Feasting on Stew', emoji: '🍲', color: '#f59e0b', bgColor: '#fffbeb', desire: 'Satisfying warm appetite' };
  }
  if (d.actionState === 'sitting') {
    return { name: 'Peaceful & Relaxed', emoji: '☕', color: '#10b981', bgColor: '#ecfdf5', desire: 'Enjoying tranquil companionship' };
  }
  if (d.actionState === 'hunting') {
    return { name: 'Vigilant Hunter', emoji: '🏹', color: '#15803d', bgColor: '#f0fdf4', desire: 'Stalking wild forest game' };
  }
  if (d.actionState === 'chopping') {
    return { name: 'Industrious & Energetic', emoji: '🪓', color: '#854d0e', bgColor: '#fefce8', desire: 'Harvesting tall pine timber' };
  }
  if (d.actionState === 'foraging') {
    return { name: 'Curious & Attentive', emoji: '🫐', color: '#16a34a', bgColor: '#f0fdf4', desire: 'Gathering wild forest herbs' };
  }
  if (d.actionState === 'fishing') {
    return { name: 'Serene & Focused', emoji: '🎣', color: '#0284c7', bgColor: '#f0f9ff', desire: 'Patiently waiting for a fish to bite' };
  }
  if (d.actionState === 'cooking') {
    return { name: 'Warm & Nurturing', emoji: '🍲', color: '#d97706', bgColor: '#fffbeb', desire: 'Feeding the village' };
  }
  if (d.actionState === 'building') {
    return { name: 'Proud Builder', emoji: '🔨', color: '#ea580c', bgColor: '#fff7ed', desire: 'Constructing their family homestead' };
  }
  if (d.actionState === 'carrying') {
    return { name: 'Dutiful & Diligent', emoji: '📦', color: '#b45309', bgColor: '#fef3c7', desire: 'Delivering supplies to storehouse' };
  }
  if (d.actionState === 'fleeing') {
    return { name: 'Terrified & Panicked', emoji: '⚡', color: '#e11d48', bgColor: '#ffe4e6', desire: 'Seeking immediate shelter' };
  }

  // Need-based urgency
  if (n.hunger < 20) {
    return { name: 'Ravenously Hungry', emoji: '🥣', color: '#ea580c', bgColor: '#fff7ed', desire: 'Needs food urgently' };
  }
  if (n.energy < 20) {
    return { name: 'Drowsy & Fatigued', emoji: '🥱', color: '#7c3aed', bgColor: '#f5f3ff', desire: 'Needs bed rest' };
  }
  if (n.social < 25) {
    return { name: 'Lonely', emoji: '🥺', color: '#64748b', bgColor: '#f8fafc', desire: 'Seeking friends or romance' };
  }
  if (n.fun < 25) {
    return { name: 'Bored & Restless', emoji: '😑', color: '#71717a', bgColor: '#fafafa', desire: 'Craving recreation' };
  }

  // Wellness average
  const wellness = (n.hunger + n.energy + n.social + n.fun + n.health) / 5;
  if (wellness > 75) {
    return { name: 'Content & Joyful', emoji: '😊', color: '#10b981', bgColor: '#ecfdf5', desire: 'Thriving in harmony' };
  }
  if (wellness > 50) {
    return { name: 'Calm & Steady', emoji: '🙂', color: '#84cc16', bgColor: '#f7fee7', desire: 'Going about the day' };
  }
  return { name: 'Melancholic', emoji: '😟', color: '#f59e0b', bgColor: '#fffbeb', desire: 'Hoping for better fortune' };
}

export class EventLog {
  private container: HTMLElement;
  private sim: Simulation;
  private currentFilter: string = 'all';
  private isCollapsed: boolean = false;
  private activeTab: 'events' | 'thoughts' = 'events';
  private onFocusAgent?: (agent: Agent) => void;
  private lastUpdateMs: number = 0;

  constructor(container: HTMLElement, sim: Simulation, onFocusAgent?: (agent: Agent) => void) {
    this.container = container;
    this.sim = sim;
    this.onFocusAgent = onFocusAgent;
    this.render();

    this.sim.onEventAdded = () => {
      this.updateEventsList();
      this.updateTickerText();
    };
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="drama-feed-panel ${this.isCollapsed ? 'collapsed' : ''}" id="drama-panel">
        <!-- Main Panel Header -->
        <div class="drama-header" id="drama-header">
          <div class="drama-header-left" id="drama-toggle-area">
            <span class="drama-title-icon">📜</span>
            <div class="drama-title-block">
              <span class="drama-title-text">CHRONICLES OF LIFE</span>
              <span class="settlers-count-badge">👥 ${this.sim.agents.length} Settlers</span>
            </div>
          </div>

          <!-- Tab buttons when expanded -->
          <div class="chronicle-tabs-bar" id="chronicle-tabs-bar" style="${this.isCollapsed ? 'display: none;' : ''}">
            <button class="chronicle-tab-btn ${this.activeTab === 'events' ? 'active' : ''}" data-tab="events">
              📜 Events
            </button>
            <button class="chronicle-tab-btn ${this.activeTab === 'thoughts' ? 'active' : ''}" data-tab="thoughts">
              💭 Thoughts & Feelings
            </button>
          </div>

          <!-- Collapse / Expand Button -->
          <button class="collapse-toggle-btn" id="collapse-toggle-btn" title="${this.isCollapsed ? 'Expand panel' : 'Collapse panel'}">
            ${this.isCollapsed ? '▲' : '▼'}
          </button>
        </div>

        <!-- Collapsed Compact Ticker (Visible only when collapsed) -->
        <div class="drama-collapsed-ticker" id="drama-collapsed-ticker" style="${this.isCollapsed ? '' : 'display: none;'}">
          <span class="ticker-prefix">✨ LATEST:</span>
          <span class="ticker-text" id="ticker-text">Village is peaceful under your gaze.</span>
          <span class="ticker-hint">▲ Click to Expand</span>
        </div>

        <!-- Main Content Body (Visible when expanded) -->
        <div class="drama-content-body" id="drama-content-body" style="${this.isCollapsed ? 'display: none;' : ''}">
          <!-- Tab 1: Chronicle Events -->
          <div class="chronicle-tab-content ${this.activeTab === 'events' ? 'active' : ''}" id="tab-events-content">
            <div class="drama-filters">
              <button class="filter-btn active" data-filter="all">All</button>
              <button class="filter-btn" data-filter="dialog">💬 Dialog</button>
              <button class="filter-btn" data-filter="love">❤️ Love</button>
              <button class="filter-btn" data-filter="violence">⚠️ Violence</button>
              <button class="filter-btn" data-filter="work">🔨 Work</button>
              <button class="filter-btn" data-filter="miracle">✨ Miracle</button>
            </div>
            <div class="drama-list" id="drama-events-container"></div>
          </div>

          <!-- Tab 2: Settler Thoughts & Feelings -->
          <div class="chronicle-tab-content ${this.activeTab === 'thoughts' ? 'active' : ''}" id="tab-thoughts-content">
            <div class="thoughts-subhead">
              <span>Living Mindset & Heartbeats of All Forest Citizens:</span>
            </div>
            <div class="settler-thoughts-list" id="settler-thoughts-container"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateEventsList();
    this.updateThoughtsList();
    this.updateTickerText();
  }

  private bindEvents(): void {
    // 1. Collapse / Expand toggle button
    const collapseBtn = this.container.querySelector('#collapse-toggle-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse();
      });
    }

    // 2. Click header left to toggle collapse
    const toggleArea = this.container.querySelector('#drama-toggle-area');
    if (toggleArea) {
      toggleArea.addEventListener('click', () => {
        this.toggleCollapse();
      });
    }

    // 3. Click collapsed ticker to expand
    const tickerEl = this.container.querySelector('#drama-collapsed-ticker');
    if (tickerEl) {
      tickerEl.addEventListener('click', () => {
        if (this.isCollapsed) {
          this.toggleCollapse();
        }
      });
    }

    // 4. Tab switching
    this.container.querySelectorAll('.chronicle-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = (e.currentTarget as HTMLElement).dataset.tab as 'events' | 'thoughts';
        this.setTab(tab);
      });
    });

    // 5. Category filter buttons in Events tab
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        this.currentFilter = (e.currentTarget as HTMLElement).dataset.filter || 'all';
        this.updateEventsList();
      });
    });
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;

    const panel = this.container.querySelector('#drama-panel');
    const collapseBtn = this.container.querySelector('#collapse-toggle-btn');
    const tabsBar = this.container.querySelector('#chronicle-tabs-bar') as HTMLElement;
    const ticker = this.container.querySelector('#drama-collapsed-ticker') as HTMLElement;
    const body = this.container.querySelector('#drama-content-body') as HTMLElement;

    if (this.isCollapsed) {
      panel?.classList.add('collapsed');
      if (collapseBtn) collapseBtn.textContent = '▲';
      if (tabsBar) tabsBar.style.display = 'none';
      if (ticker) ticker.style.display = 'flex';
      if (body) body.style.display = 'none';
      this.updateTickerText();
    } else {
      panel?.classList.remove('collapsed');
      if (collapseBtn) collapseBtn.textContent = '▼';
      if (tabsBar) tabsBar.style.display = 'flex';
      if (ticker) ticker.style.display = 'none';
      if (body) body.style.display = 'block';
      if (this.activeTab === 'events') {
        this.updateEventsList();
      } else {
        this.updateThoughtsList();
      }
    }
  }

  public setTab(tab: 'events' | 'thoughts'): void {
    this.activeTab = tab;

    // Update active tab buttons
    this.container.querySelectorAll('.chronicle-tab-btn').forEach(btn => {
      const b = btn as HTMLElement;
      if (b.dataset.tab === tab) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Update content tabs
    const eventsTab = this.container.querySelector('#tab-events-content');
    const thoughtsTab = this.container.querySelector('#tab-thoughts-content');

    if (tab === 'events') {
      eventsTab?.classList.add('active');
      thoughtsTab?.classList.remove('active');
      this.updateEventsList();
    } else {
      eventsTab?.classList.remove('active');
      thoughtsTab?.classList.add('active');
      this.updateThoughtsList();
    }
  }

  public update(): void {
    const now = performance.now();
    // Throttle thought updates to once every 600ms for smooth performance
    if (now - this.lastUpdateMs > 600) {
      this.lastUpdateMs = now;
      if (!this.isCollapsed && this.activeTab === 'thoughts') {
        this.updateThoughtsList();
      }
    }
  }

  public updateTickerText(): void {
    const tickerTextEl = this.container.querySelector('#ticker-text');
    if (!tickerTextEl) return;

    if (this.sim.eventLog.length > 0) {
      tickerTextEl.textContent = this.sim.eventLog[0].text;
    } else {
      tickerTextEl.textContent = 'The settlement rests peacefully under your divine gaze.';
    }
  }

  public updateEventsList(): void {
    const listEl = this.container.querySelector('#drama-events-container');
    if (!listEl) return;

    let events = this.sim.eventLog;
    if (this.currentFilter !== 'all') {
      events = events.filter(e => e.category === this.currentFilter);
    }

    if (events.length === 0) {
      listEl.innerHTML = `<div class="empty-feed">The town is peaceful... for now.</div>`;
      return;
    }

    listEl.innerHTML = events.slice(0, 35).map(evt => {
      // Find involved agent to display what they felt and thought
      let feelingSnippet = '';
      if (evt.agentIds && evt.agentIds.length > 0) {
        const agent = this.sim.agents.find(a => evt.agentIds.includes(a.data.id));
        if (agent) {
          const mood = getSettlerMood(agent);
          feelingSnippet = `
            <div class="event-feeling-snippet">
              <span class="snippet-mood" style="color: ${mood.color}">
                ${mood.emoji} ${agent.data.name} felt ${mood.name}:
              </span>
              <span class="snippet-thought">“${agent.data.thought}”</span>
            </div>
          `;
        }
      }

      return `
        <div class="drama-item cat-${evt.category}" data-agent-ids="${evt.agentIds.join(',')}">
          <div class="drama-time">${evt.timeString}</div>
          <div class="drama-body">${evt.text}</div>
          ${feelingSnippet}
        </div>
      `;
    }).join('');

    // Clicking an event selects or focuses the first agent
    listEl.querySelectorAll('.drama-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const rawIds = (e.currentTarget as HTMLElement).dataset.agentIds;
        if (rawIds) {
          const firstId = rawIds.split(',')[0];
          const agent = this.sim.agents.find(a => a.data.id === firstId);
          if (agent) {
            this.sim.selectedAgent = agent;
            if (this.onFocusAgent) {
              this.onFocusAgent(agent);
            }
          }
        }
      });
    });
  }

  public updateThoughtsList(): void {
    const container = this.container.querySelector('#settler-thoughts-container');
    if (!container) return;

    const agents = this.sim.agents;
    if (agents.length === 0) {
      container.innerHTML = `<div class="empty-feed">No settlers residing in the valley yet.</div>`;
      return;
    }

    container.innerHTML = agents.map(agent => {
      const d = agent.data;
      const mood = getSettlerMood(agent);
      const isSelected = this.sim.selectedAgent?.data.id === d.id;

      // Gender icon
      const avatarIcon = d.appearance.gender === 'female' ? '👩' : '👨';
      const roleIcon = 
        d.role === 'lumberjack' ? '🪓' :
        d.role === 'forager' ? '🫐' :
        d.role === 'fisher' ? '🎣' :
        d.role === 'cook' ? '🍲' :
        d.role === 'healer' ? '🌿' :
        d.role === 'hunter' ? '🏹' :
        d.role === 'elder' ? '🏛️' : '🛖';

      return `
        <div class="settler-thought-card ${isSelected ? 'selected' : ''}" data-agent-id="${d.id}">
          <div class="settler-card-top">
            <div class="settler-avatar-badge" style="background: ${d.appearance.shirtColor || '#78350f'}">
              <span>${avatarIcon}</span>
            </div>
            <div class="settler-identity">
              <div class="settler-name-row">
                <span class="settler-card-name">${d.name}</span>
                <span class="settler-age-pill">Age ${d.age}</span>
              </div>
              <div class="settler-role-text">${roleIcon} ${d.role.toUpperCase()} • ${d.familyName} Homestead</div>
            </div>
            <div class="settler-mood-badge" style="color: ${mood.color}; background: ${mood.bgColor}; border: 1.5px solid ${mood.color}">
              <span>${mood.emoji}</span>
              <span>${mood.name}</span>
            </div>
          </div>

          <!-- Thought Quote -->
          <div class="settler-thought-quote">
            <span class="thought-quote-mark">“</span>
            <span class="thought-quote-body">${d.thought || 'Observing the mountain pines...'}</span>
            <span class="thought-quote-mark">”</span>
          </div>

          ${d.activeDialog ? `
            <div class="settler-active-dialog-callout">
              <span class="dialog-chip-icon">🗣️</span>
              <span class="dialog-chip-speaker">${d.activeDialog.isSpeaker ? 'Saying to' : 'Listening to'} <strong>${d.activeDialog.partnerName}</strong>:</span>
              <span class="dialog-chip-text">“${d.activeDialog.line || d.activeDialog.fullExchange.line1}”</span>
            </div>
          ` : ''}

          <!-- Action & Need Desire Bottom Row -->
          <div class="settler-card-footer">
            <div class="settler-action-chip">
              <span class="chip-label">Action:</span>
              <span class="chip-val">${d.actionState}</span>
            </div>
            <div class="settler-desire-chip" title="Current inner urge">
              🎯 ${mood.desire}
            </div>
            <div class="settler-vitals-mini">
              <span title="Hunger level">🍖 ${Math.round(d.needs.hunger)}%</span>
              <span title="Energy level">⚡ ${Math.round(d.needs.energy)}%</span>
              <span title="Social level">💬 ${Math.round(d.needs.social)}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Click handler to select and focus agent
    container.querySelectorAll('.settler-thought-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const agentId = (e.currentTarget as HTMLElement).dataset.agentId;
        const agent = this.sim.agents.find(a => a.data.id === agentId);
        if (agent) {
          this.sim.selectedAgent = agent;
          if (this.onFocusAgent) {
            this.onFocusAgent(agent);
          }
          this.updateThoughtsList();
        }
      });
    });
  }
}
