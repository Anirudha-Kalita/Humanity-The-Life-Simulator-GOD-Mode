import { Simulation } from '../engine/Simulation';
import type { Building } from '../types/simulation';
import { getSettlerMood } from './EventLog';

export class BuildingInspector {
  private container: HTMLElement;
  private sim: Simulation;
  private currentBuildingId: string | null = null;

  constructor(container: HTMLElement, sim: Simulation) {
    this.container = container;
    this.sim = sim;
  }

  public update(): void {
    const b = this.sim.selectedBuilding;
    if (!b) {
      this.container.classList.add('hidden');
      this.currentBuildingId = null;
      return;
    }

    this.container.classList.remove('hidden');

    if (this.currentBuildingId !== b.id) {
      this.currentBuildingId = b.id;
      this.render(b);
    }
  }

  public render(b: Building): void {
    const residents = this.sim.agents.filter(a => a.data.homeCabinId === b.id || b.ownerIds.includes(a.data.id));

    this.container.innerHTML = `
      <div class="building-card">
        <!-- Header -->
        <div class="building-header">
          <div class="building-avatar" style="background-color: ${b.color};">
            <span class="building-avatar-icon">${b.icon || '🏡'}</span>
          </div>
          <div class="building-header-info">
            <div class="building-title-row">
              <span class="building-name">${b.name}</span>
              <button class="close-btn" id="btn-close-building">&times;</button>
            </div>
            <div class="building-meta">
              <span class="building-type-badge">${b.type.toUpperCase()}</span>
              ${b.familyName ? `<span>• ${b.familyName} Family</span>` : ''}
              <span>• Pos (${Math.round(b.x)}, ${Math.round(b.y)})</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="building-desc-box">
          <p class="building-desc-text">${b.description}</p>
        </div>

        <!-- Actions Toolbar -->
        <div class="building-actions-bar">
          <button class="building-action-btn move-btn" id="btn-move-house" title="Pick up and move this building to a new spot">
            <span>🚚 Move House</span>
          </button>
          ${b.type !== 'hearth' && !this.sim.isProtectedBuilding(b) ? `
            <button class="building-action-btn demolish-btn" id="btn-demolish-house" title="Demolish this building into ruins">
              <span>💥 Demolish</span>
            </button>
          ` : ''}
        </div>

        <!-- Residents Section -->
        <div class="building-residents-section">
          <div class="residents-header">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span>👥 Household Members (${residents.length} / 5 Max)</span>
              ${residents.length >= 5 ? '<span style="color: #ef4444; font-size: 10px; font-weight: bold; background: rgba(239, 68, 68, 0.15); padding: 2px 6px; border-radius: 4px;">FULL (5/5)</span>' : `<span style="color: #166534; font-size: 10px; font-weight: bold;">${5 - residents.length} vacancies</span>`}
            </div>
          </div>
          <div class="residents-list">
            ${residents.length === 0 ? `
              <div class="empty-residents">No residents currently live in this homestead.</div>
            ` : residents.map(agent => {
              const mood = getSettlerMood(agent);
              return `
                <div class="resident-mini-card" data-agent-id="${agent.data.id}">
                  <div class="resident-avatar" style="background: ${agent.data.appearance.shirtColor}">
                    ${agent.data.appearance.gender === 'female' ? '👩' : '👨'}
                  </div>
                  <div class="resident-identity">
                    <span class="resident-name">${agent.data.name}</span>
                    <span class="resident-role">
                      ${agent.data.isPregnant ? '🤰 EXPECTING MOTHER' : agent.data.age < 16 ? (agent.data.age <= 3 ? '🍼 TODDLER' : '🧒 CHILD') : agent.data.role.toUpperCase()} • Age ${agent.data.age}
                      ${agent.data.isPregnant ? ` (${Math.round(agent.data.pregnancyProgress || 0)}%)` : ''}
                    </span>
                  </div>
                  <div class="resident-mood-chip" style="color: ${mood.color}; background: ${mood.bgColor}; border: 1px solid ${mood.color}">
                    <span>${mood.emoji}</span>
                    <span>${mood.name}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(b);
  }

  private bindEvents(b: Building): void {
    // 1. Close button
    const closeBtn = this.container.querySelector('#btn-close-building');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.sim.selectedBuilding = null;
      });
    }

    // 2. Move house button
    const moveBtn = this.container.querySelector('#btn-move-house');
    if (moveBtn) {
      moveBtn.addEventListener('click', () => {
        this.sim.movingBuilding = b;
        this.sim.activeGodPower = 'move_house';
        this.sim.selectedBuilding = null;
        this.sim.addDramaEvent('general', `Picked up ${b.name}. Click new location on solid land to place.`, []);
      });
    }

    // 3. Demolish house button
    const demolishBtn = this.container.querySelector('#btn-demolish-house');
    if (demolishBtn) {
      demolishBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to demolish ${b.name}? Residents will become homeless!`)) {
          this.sim.destroyHouse(b.id);
          this.sim.selectedBuilding = null;
        }
      });
    }

    // 4. Click resident card to inspect that agent
    this.container.querySelectorAll('.resident-mini-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const agentId = (e.currentTarget as HTMLElement).dataset.agentId;
        const agent = this.sim.agents.find(a => a.data.id === agentId);
        if (agent) {
          this.sim.selectedAgent = agent;
          this.sim.selectedBuilding = null;
        }
      });
    });
  }
}
