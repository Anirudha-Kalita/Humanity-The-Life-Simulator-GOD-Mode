import { Simulation } from '../engine/Simulation';
import { Agent } from '../engine/Agent';
import type { SettlerRole } from '../types/simulation';

export class InspectorModal {
  private container: HTMLElement;
  private sim: Simulation;
  private currentAgentId: string | null = null;
  private activeTabId: string = 'tab-needs';
  private onPanToLocation?: (x: number, y: number) => void;

  constructor(container: HTMLElement, sim: Simulation, onPanToLocation?: (x: number, y: number) => void) {
    this.container = container;
    this.sim = sim;
    this.onPanToLocation = onPanToLocation;
  }

  public update(): void {
    const agent = this.sim.selectedAgent;
    if (!agent) {
      this.container.classList.add('hidden');
      this.currentAgentId = null;
      return;
    }

    this.container.classList.remove('hidden');

    if (this.currentAgentId !== agent.data.id) {
      this.currentAgentId = agent.data.id;
      this.renderFull(agent);
    } else {
      this.updateDynamicValues(agent);
    }
  }

  private renderFull(agent: Agent): void {
    const d = agent.data;
    const allOtherAgents = this.sim.agents.filter(a => a.data.id !== d.id);
    const currentHour = Math.floor(this.sim.gameMinutes / 60);
    const activeSlot = d.schedule.find(s => currentHour >= s.startHour && currentHour < s.endHour);

    // Family & House context
    const cabin = this.sim.world.getBuildingById(d.homeCabinId);
    const houseResidents = this.sim.getHouseResidents(d.homeCabinId);
    const spouse = d.spouseId ? this.sim.agents.find(a => a.data.id === d.spouseId) : undefined;
    const isSinglePar = this.sim.isSingleParent(agent);
    const isRemarried = !!spouse && ((d.marriageCount || 0) > 1 || (d.divorceCount || 0) > 0);

    // Romance / Dating search if unmarried
    const datingPartner = !spouse ? this.sim.agents.find(a => {
      const rel = d.relationships[a.data.id];
      return rel && (rel.status === 'dating' || rel.status === 'in_love' || rel.status === 'madly_in_love');
    }) : undefined;
    const datingRel = datingPartner ? d.relationships[datingPartner.data.id] : undefined;

    // Dependent children count
    const minorChildren = this.sim.agents.filter(a => 
      !a.data.isDead && a.data.age < 16 && (a.data.fatherId === d.id || a.data.motherId === d.id)
    );

    this.container.innerHTML = `
      <div class="inspector-card">
        <!-- Header -->
        <div class="inspector-header">
          <div class="header-avatar" style="background-color: ${d.appearance.shirtColor};">
            <span class="avatar-gender">${d.appearance.gender === 'female' ? '♀' : '♂'}</span>
            <span class="avatar-flair">${d.appearance.facialHair && d.appearance.facialHair !== 'none' ? '🧔' : (d.appearance.gender === 'female' ? '🌸' : '🪓')}</span>
          </div>
          <div class="header-info">
            <div class="header-top-row">
              <input type="text" id="edit-agent-name" class="editable-name-input" value="${d.name}" />
              <button class="close-btn" id="btn-close-inspector">&times;</button>
            </div>
            <div class="header-meta">
              <span>Age ${d.age} (${d.age <= 3 ? '🍼 Toddler' : d.age < 16 ? '🧒 Child' : d.age >= 60 ? '📜 Elder' : '🧑 Adult'})</span>
              ${d.isPregnant ? ` • <span style="color: #ec4899; font-weight: bold;">🤰 Pregnant (${Math.round(d.pregnancyProgress || 0)}%)</span>` : ''} • 
              <select id="edit-agent-role" class="role-select">
                ${(['lumberjack', 'forager', 'fisher', 'cook', 'healer', 'hunter', 'elder', 'settler', 'toddler', 'child'] as SettlerRole[]).map(r => 
                  `<option value="${r}" ${d.role === r ? 'selected' : ''}>${r.toUpperCase()}</option>`
                ).join('')}
              </select> • 
              <span>⚔️ ${d.equippedWeapon || 'fists'}</span>
            </div>
            <div class="header-sub-pills">
              <span class="badge-house" id="header-badge-house" title="Current household occupancy">
                🏡 ${cabin ? cabin.name : 'Homeless'} (${houseResidents.length}/5)
              </span>
              ${spouse ? `
                <span class="badge-spouse ${isRemarried ? 'badge-remarried' : ''}" id="header-badge-spouse" data-inspect-agent-id="${spouse.data.id}" title="${isRemarried ? 'Remarried spouse (Blended family)' : 'Current spouse'}">
                  ${isRemarried ? '💍 Remarried to ' : '💍 Married to '} ${spouse.data.name}
                </span>
              ` : isSinglePar ? `
                <span class="badge-single-parent" title="Raising children as a single parent">
                  🛡️ Single Parent (${minorChildren.length} Kids)
                </span>
              ` : datingPartner ? `
                <span class="badge-dating" data-inspect-agent-id="${datingPartner.data.id}" title="Current romantic courtship partner">
                  ${datingRel?.status === 'madly_in_love' ? '🔥 Madly in Love with ' : datingRel?.status === 'in_love' ? '❤️ In Love with ' : '🌹 Dating '} ${datingPartner.data.name}
                </span>
              ` : (d.divorceCount || 0) > 0 ? `
                <span class="badge-divorced">💔 Divorced</span>
              ` : `
                <span class="badge-single">🕊️ Single</span>
              `}
              <span class="badge-tree-link" id="header-badge-tree">🌳 View Family Tree</span>
            </div>
          </div>
        </div>

        <!-- Routine & Schedule Status -->
        <div class="routine-status-box ${d.routineInterrupted ? 'interrupted' : 'normal'}">
          <div class="routine-header">
            <span>📅 DAILY ROUTINE</span>
            <span class="routine-badge ${d.routineInterrupted ? 'badge-alert' : 'badge-ok'}">
              ${d.routineInterrupted ? 'INTERRUPTED' : 'ON SCHEDULE'}
            </span>
          </div>
          <div class="routine-details">
            ${d.routineInterrupted 
              ? `⚠️ ${d.interruptionReason || 'Distracted by sudden event'}`
              : `🕒 ${activeSlot ? activeSlot.description : 'Resting in the settlement'}`}
          </div>
        </div>

        ${d.isDead ? `
          <div class="dead-indicator-banner" style="background: ${d.causeOfDeath === 'old_age' ? 'rgba(71, 85, 105, 0.3)' : 'rgba(220, 38, 38, 0.25)'}; border: 1px solid ${d.causeOfDeath === 'old_age' ? '#94a3b8' : '#ef4444'}; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; color: ${d.causeOfDeath === 'old_age' ? '#e2e8f0' : '#fca5a5'}; font-size: 11px; font-weight: bold; text-align: center;">
            ${d.causeOfDeath === 'old_age' ? '🕊️ PASSED AWAY OF OLD AGE' : '⚡ SMITTEN BY GOD'}: Dissolving to rest in <span id="inspector-death-countdown">${Math.max(1, Math.ceil(d.deathTimer || 0))}</span>s...
          </div>
        ` : ''}

        <!-- Quick God Actions Bar -->
        <div class="inspector-quick-actions">
          <button class="action-pill ${d.isPossessed ? 'active' : ''}" id="btn-inspect-possess">
            ${d.isPossessed ? '👁️ Release' : '🎭 Possess'}
          </button>
          ${spouse ? `
            <button class="action-pill divorce-pill" id="btn-inspect-divorce" style="background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #f87171;" title="Trigger marital separation and divorce">
              💔 Divorce
            </button>
          ` : (d.age >= 16 && (datingPartner || allOtherAgents.length > 0)) ? `
            <button class="action-pill romance-pill" id="btn-inspect-courtship" style="background: rgba(236, 72, 153, 0.2); border-color: #ec4899; color: #f472b6;" title="Advance relationship through flirt -> dating -> love -> marriage">
              ${datingPartner ? '💍 Propose' : '💖 Flirt / Court'}
            </button>
          ` : ''}
          <button class="action-pill build-pill" id="btn-inspect-build-house" title="Start building separate family home">
            🔨 Build House
          </button>
          ${d.isPregnant ? `
            <button class="action-pill birth-pill" id="btn-inspect-birth" style="background: rgba(236, 72, 153, 0.2); border-color: #ec4899; color: #f472b6;" title="Deliver baby immediately">
              🍼 Give Birth
            </button>
          ` : ''}
          ${d.age < 16 ? `
            <button class="action-pill age-pill" id="btn-inspect-ageup" style="background: rgba(168, 85, 247, 0.2); border-color: #a855f7; color: #c084fc;" title="Advance age by +1 year">
              🎂 Age Up (+1y)
            </button>
            <button class="action-pill mature-pill" id="btn-inspect-mature" style="background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; color: #60a5fa;" title="Mature to Adult immediately (Age 16)">
              🎓 Mature to Adult
            </button>
          ` : ''}
          <button class="action-pill heal-pill" id="btn-inspect-heal">🧪 Revive</button>
          <button class="action-pill smite-pill" id="btn-inspect-smite">⚡ Smite</button>
        </div>

        <!-- Real-time Mind Monologue -->
        <div class="thought-bubble-box">
          <div class="thought-label">💭 INTERNAL MIND MONOLOGUE:</div>
          <div class="thought-text" id="inspector-thought">"${d.thought}"</div>
        </div>

        <!-- Real-time Active Dialogue Callout -->
        <div class="dialogue-bubble-box" id="inspector-dialog-box" style="${d.activeDialog ? '' : 'display: none;'}">
          <div class="dialogue-label">💬 CURRENT CONVERSATION:</div>
          <div class="dialogue-text" id="inspector-dialog">
            ${d.activeDialog ? `${d.activeDialog.isSpeaker ? '🗣️ Saying to' : '👂 Listening to'} <strong>${d.activeDialog.partnerName}</strong>: “${d.activeDialog.line || '...' }”` : ''}
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="inspector-tabs">
          <button class="tab-btn ${this.activeTabId === 'tab-needs' ? 'active' : ''}" data-tab="tab-needs">Needs</button>
          <button class="tab-btn ${this.activeTabId === 'tab-family' ? 'active' : ''}" data-tab="tab-family">🌳 Family Tree</button>
          <button class="tab-btn ${this.activeTabId === 'tab-schedule' ? 'active' : ''}" data-tab="tab-schedule">Schedule</button>
          <button class="tab-btn ${this.activeTabId === 'tab-traits' ? 'active' : ''}" data-tab="tab-traits">Traits</button>
          <button class="tab-btn ${this.activeTabId === 'tab-relationships' ? 'active' : ''}" data-tab="tab-relationships">Social</button>
          <button class="tab-btn ${this.activeTabId === 'tab-memories' ? 'active' : ''}" data-tab="tab-memories">Memories</button>
        </div>

        <!-- Tab 1: Needs -->
        <div class="tab-pane ${this.activeTabId === 'tab-needs' ? 'active' : ''}" id="tab-needs">
          <div class="stat-sliders">
            ${this.renderSlider('Health / Vitality', 'health', d.needs.health, 0, 100, '%', '#22c55e')}
            ${this.renderSlider('Hunger (Fullness)', 'hunger', d.needs.hunger, 0, 100, '%', '#f97316')}
            ${this.renderSlider('Energy / Stamina', 'energy', d.needs.energy, 0, 100, '%', '#3b82f6')}
            ${this.renderSlider('Social Connection', 'social', d.needs.social, 0, 100, '%', '#ec4899')}
            ${this.renderSlider('Fun & Leisure', 'fun', d.needs.fun, 0, 100, '%', '#a855f7')}
            ${this.renderSlider('Morality / Conscience', 'morality', d.needs.morality, 0, 100, '%', '#eab308')}
          </div>
        </div>

        <!-- Tab: 🌳 Family Tree (Dynamic Multi-Generational & Accurate) -->
        <div class="tab-pane ${this.activeTabId === 'tab-family' ? 'active' : ''}" id="tab-family">
          ${this.renderFamilyTree(agent)}
        </div>

        <!-- Tab 2: 24-Hour Schedule -->
        <div class="tab-pane ${this.activeTabId === 'tab-schedule' ? 'active' : ''}" id="tab-schedule">
          <div class="schedule-timeline">
            ${d.schedule.map(slot => {
              const isCurrent = currentHour >= slot.startHour && currentHour < slot.endHour;
              return `
                <div class="schedule-slot ${isCurrent ? 'active-slot' : ''}">
                  <div class="slot-time">${slot.startHour.toString().padStart(2, '0')}:00 - ${slot.endHour.toString().padStart(2, '0')}:00</div>
                  <div class="slot-task"><strong>${slot.task.replace('_', ' ').toUpperCase()}</strong>: ${slot.description}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Tab 3: Psychology & Traits -->
        <div class="tab-pane ${this.activeTabId === 'tab-traits' ? 'active' : ''}" id="tab-traits">
          <div class="stat-sliders">
            ${this.renderSlider('Work Ethic (Dedication)', 'workEthic', d.traits.workEthic * 100, 0, 100, '%', '#10b981')}
            ${this.renderSlider('Aggression (Violence)', 'aggression', d.traits.aggression * 100, 0, 100, '%', '#ef4444')}
            ${this.renderSlider('Libido (Romance Drive)', 'libido', d.traits.libido * 100, 0, 100, '%', '#f43f5e')}
            ${this.renderSlider('Empathy (Agreeableness)', 'agreeableness', (d.traits.agreeableness + 1) * 50, 0, 100, '%', '#06b6d4')}
            ${this.renderSlider('Neuroticism (Stress)', 'neuroticism', (d.traits.neuroticism + 1) * 50, 0, 100, '%', '#f59e0b')}
          </div>
        </div>

        <!-- Tab 4: Social Web -->
        <div class="tab-pane ${this.activeTabId === 'tab-relationships' ? 'active' : ''}" id="tab-relationships">
          <div class="rel-target-picker">
            <label>Select Companion:</label>
            <select id="rel-select-target">
              ${allOtherAgents.map(a => `<option value="${a.data.id}">${a.data.name} (${a.data.role})</option>`).join('')}
            </select>
          </div>
          <div id="rel-sliders-container">
            ${this.renderRelationshipSliders(agent, allOtherAgents[0])}
          </div>
        </div>

        <!-- Tab 5: Memories -->
        <div class="tab-pane ${this.activeTabId === 'tab-memories' ? 'active' : ''}" id="tab-memories">
          <div class="memory-actions">
            <button class="action-pill" id="btn-wipe-trauma">🧹 Wipe Trauma</button>
            <button class="action-pill" id="btn-inject-love-memory">Inject Love</button>
          </div>
          <div class="memory-list" id="inspector-memory-list">
            ${this.renderMemories(d.memories)}
          </div>
        </div>
      </div>
    `;

    this.bindEvents(agent);
  }

  /**
   * Renders the dynamic and accurate family tree for the inspected settler.
   */
  private renderFamilyTree(agent: Agent): string {
    const d = agent.data;
    const father = d.fatherId ? this.sim.agents.find(a => a.data.id === d.fatherId) : undefined;
    const mother = d.motherId ? this.sim.agents.find(a => a.data.id === d.motherId) : undefined;

    // Grandparents
    const paternalGrandfather = father?.data.fatherId ? this.sim.agents.find(a => a.data.id === father.data.fatherId) : undefined;
    const paternalGrandmother = father?.data.motherId ? this.sim.agents.find(a => a.data.id === father.data.motherId) : undefined;
    const maternalGrandfather = mother?.data.fatherId ? this.sim.agents.find(a => a.data.id === mother.data.fatherId) : undefined;
    const maternalGrandmother = mother?.data.motherId ? this.sim.agents.find(a => a.data.id === mother.data.motherId) : undefined;
    const hasAnyGrandparents = paternalGrandfather || paternalGrandmother || maternalGrandfather || maternalGrandmother;

    // Current Spouse & Remarriage
    const spouse = d.spouseId ? this.sim.agents.find(a => a.data.id === d.spouseId) : undefined;
    const isSinglePar = this.sim.isSingleParent(agent);
    const isRemarried = !!spouse && ((d.marriageCount || 0) > 1 || (d.divorceCount || 0) > 0);

    // Dating / Courting partner
    const datingPartner = !spouse ? this.sim.agents.find(a => {
      const rel = d.relationships[a.data.id];
      return rel && (rel.status === 'dating' || rel.status === 'in_love' || rel.status === 'madly_in_love');
    }) : undefined;
    const datingRel = datingPartner ? d.relationships[datingPartner.data.id] : undefined;

    // Ex-Spouses (Divorced)
    const exSpouses = (d.exSpouseIds || []).map(id => this.sim.agents.find(a => a.data.id === id)).filter((a): a is Agent => !!a);

    // Siblings (Biological full and half)
    const allSiblings = this.sim.agents.filter(a => 
      a.data.id !== d.id && 
      ((d.fatherId && a.data.fatherId === d.fatherId) || (d.motherId && a.data.motherId === d.motherId))
    );
    const fullSiblings = allSiblings.filter(a => a.data.fatherId === d.fatherId && a.data.motherId === d.motherId);
    const halfSiblings = allSiblings.filter(a => !(a.data.fatherId === d.fatherId && a.data.motherId === d.motherId));

    // Biological Children
    const bioChildren = this.sim.agents.filter(a => 
      a.data.fatherId === d.id || a.data.motherId === d.id
    ).sort((a, b) => b.data.age - a.data.age);

    // Step-Children (Children of current spouse that are not biologically this agent's children)
    const stepChildren = (spouse ? this.sim.agents.filter(a => 
      (a.data.fatherId === spouse.data.id || a.data.motherId === spouse.data.id) &&
      a.data.fatherId !== d.id && a.data.motherId !== d.id
    ) : []).sort((a, b) => b.data.age - a.data.age);

    // Step-Parents (If this agent's parent is married to someone who isn't biological parent)
    const stepParents: { agent: Agent; roleLabel: string }[] = [];
    if (father && father.data.spouseId && father.data.spouseId !== d.motherId) {
      const stMother = this.sim.agents.find(a => a.data.id === father.data.spouseId);
      if (stMother) stepParents.push({ agent: stMother, roleLabel: 'Step-Mother' });
    }
    if (mother && mother.data.spouseId && mother.data.spouseId !== d.fatherId) {
      const stFather = this.sim.agents.find(a => a.data.id === mother.data.spouseId);
      if (stFather && !stepParents.some(p => p.agent.data.id === stFather.data.id)) {
        stepParents.push({ agent: stFather, roleLabel: 'Step-Father' });
      }
    }

    // Grandchildren
    const grandchildren = this.sim.agents.filter(a => {
      const aFather = this.sim.agents.find(x => x.data.id === a.data.fatherId);
      const aMother = this.sim.agents.find(x => x.data.id === a.data.motherId);
      return (aFather && (aFather.data.fatherId === d.id || aFather.data.motherId === d.id)) ||
             (aMother && (aMother.data.fatherId === d.id || aMother.data.motherId === d.id));
    });

    // Household & Living space
    const cabin = this.sim.world.getBuildingById(d.homeCabinId);
    const houseResidents = this.sim.getHouseResidents(d.homeCabinId);
    const maxCapacity = 5;
    const remainingSpots = Math.max(0, maxCapacity - houseResidents.length);

    // Household family type determination
    const householdTypeLabel = isSinglePar
      ? '🛡️ Single Parent Household'
      : (isRemarried || stepChildren.length > 0)
      ? '🏡 Blended Family Household'
      : (spouse && bioChildren.length > 0)
      ? '🏡 Nuclear Family Household'
      : '🛖 Frontier Settlement Household';

    return `
      <div class="family-tree-container">
        <!-- Household & Home Card -->
        <div class="household-summary-card">
          <div class="household-header">
            <div class="household-title-group">
              <span class="household-icon">${cabin?.icon || '🏡'}</span>
              <div>
                <div class="household-name">${cabin ? cabin.name : 'Unassigned Cabin'}</div>
                <div class="household-subtitle">
                  ${householdTypeLabel} • Pos (${Math.round(cabin?.x || 0)}, ${Math.round(cabin?.y || 0)})
                </div>
              </div>
            </div>
            ${cabin ? `
              <button class="btn-locate-house" id="btn-pan-house" data-x="${cabin.door.x}" data-y="${cabin.door.y}" title="Center view on this home">
                📍 Locate Home
              </button>
            ` : ''}
          </div>

          <!-- Capacity Bar (Hard Real-Life limit: max 5) -->
          <div class="household-capacity-box">
            <div class="capacity-label-row">
              <span class="capacity-title">HOUSE OCCUPANCY LIMIT</span>
              <span class="capacity-stat ${houseResidents.length >= 5 ? 'stat-full' : 'stat-open'}">
                ${houseResidents.length} / ${maxCapacity} Members (${houseResidents.length >= 5 ? 'MAX LIMIT REACHED (5/5)' : `${remainingSpots} vacancies remaining`})
              </span>
            </div>
            <div class="capacity-pips">
              ${[0, 1, 2, 3, 4].map(idx => {
                const isOccupied = idx < houseResidents.length;
                return `<span class="cap-pip ${isOccupied ? 'pip-filled' : 'pip-empty'}" title="${isOccupied ? `Occupied by ${houseResidents[idx].data.name}` : 'Vacant bed'}"></span>`;
              }).join('')}
            </div>
          </div>

          <!-- Residents list under this roof -->
          <div class="household-residents-preview">
            <span class="residents-subheading">Living Under This Roof (${houseResidents.length}):</span>
            <div class="resident-pills-row">
              ${houseResidents.map(r => {
                const isSelf = r.data.id === d.id;
                const isSp = r.data.id === d.spouseId;
                const isCh = r.data.fatherId === d.id || r.data.motherId === d.id;
                const isStCh = spouse && (r.data.fatherId === spouse.data.id || r.data.motherId === spouse.data.id);
                const isPr = r.data.id === d.fatherId || r.data.id === d.motherId;
                const tag = isSelf ? 'Self' : isSp ? 'Spouse' : isCh ? 'Child' : isStCh ? 'Step-Child' : isPr ? 'Parent' : 'Member';
                return `
                  <div class="resident-chip ${isSelf ? 'chip-self' : ''}" data-inspect-agent-id="${r.data.id}" title="Click to inspect ${r.data.name}">
                    <span class="chip-avatar" style="background-color: ${r.data.appearance.shirtColor};">${r.data.appearance.gender === 'female' ? '♀' : '♂'}</span>
                    <span class="chip-name">${r.data.name.split(' ')[0]}</span>
                    <span class="chip-tag">${tag}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Lineage Header -->
        <div class="family-tree-title-banner">
          <span>🌳 THE ${d.familyName.toUpperCase()} FAMILY LINEAGE</span>
          <span class="family-generation-badge">
            ${!d.fatherId && !d.motherId ? 'FOUNDER (GEN 1)' : 'ESTABLISHED GENERATION'}
          </span>
        </div>

        <!-- Generation 1: Grandparents (If known) -->
        ${hasAnyGrandparents ? `
          <div class="tree-level level-grandparents">
            <div class="level-tag">GEN 1: GRANDPARENTS</div>
            <div class="tree-nodes-row">
              ${this.renderFamilyCard(paternalGrandfather, 'Pat. Grandfather')}
              ${this.renderFamilyCard(paternalGrandmother, 'Pat. Grandmother')}
              ${this.renderFamilyCard(maternalGrandfather, 'Mat. Grandfather')}
              ${this.renderFamilyCard(maternalGrandmother, 'Mat. Grandmother')}
            </div>
            <div class="tree-connector-down"></div>
          </div>
        ` : ''}

        <!-- Generation 2: Parents & Step-Parents -->
        <div class="tree-level level-parents">
          <div class="level-tag">PARENTS & STEP-PARENTS</div>
          <div class="tree-nodes-row">
            ${father ? this.renderFamilyCard(father, 'Father (Bio)') : `
              <div class="family-node-empty">
                <span class="empty-icon">🌱</span>
                <span class="empty-title">Father</span>
                <span class="empty-desc">Founding Settler</span>
              </div>
            `}
            ${mother ? this.renderFamilyCard(mother, 'Mother (Bio)') : `
              <div class="family-node-empty">
                <span class="empty-icon">🌱</span>
                <span class="empty-title">Mother</span>
                <span class="empty-desc">Founding Settler</span>
              </div>
            `}
            ${stepParents.map(sp => this.renderFamilyCard(sp.agent, sp.roleLabel)).join('')}
          </div>
          <div class="tree-connector-down"></div>
        </div>

        <!-- Generation 3: The NPC, Current Union / Courting & Siblings -->
        <div class="tree-level level-current">
          <div class="level-tag">CURRENT GENERATION (MARRIAGE, COURTING & SIBLINGS)</div>
          <div class="tree-nodes-row union-row">
            <!-- Inspected NPC -->
            <div class="family-card current-self-card" title="Selected Settler">
              <div class="card-crown-badge">⭐ INSPECTED</div>
              <div class="card-avatar" style="background-color: ${d.appearance.shirtColor};">
                <span>${d.appearance.gender === 'female' ? '👩' : '👨'}</span>
              </div>
              <div class="card-info">
                <span class="card-name">${d.name}</span>
                <span class="card-role">${d.role.toUpperCase()} • Age ${d.age}</span>
                <span class="card-home">${cabin ? cabin.name : 'Homeless'}</span>
              </div>
            </div>

            <!-- Union Link / Marital Status -->
            <div class="union-heart-box">
              <span class="heart-symbol">${spouse ? '💍' : datingPartner ? '💖' : isSinglePar ? '🛡️' : (d.divorceCount || 0) > 0 ? '💔' : '🕊️'}</span>
              <span class="union-text">
                ${isRemarried ? 'REMARRIED' : spouse ? 'MARRIED' : datingRel?.status === 'madly_in_love' ? 'MADLY IN LOVE' : datingRel?.status === 'in_love' ? 'IN LOVE' : datingPartner ? 'DATING' : isSinglePar ? 'SINGLE PARENT' : (d.divorceCount || 0) > 0 ? 'DIVORCED' : 'SINGLE'}
              </span>
            </div>

            <!-- Current Spouse or Courting Partner -->
            ${spouse ? this.renderFamilyCard(spouse, isRemarried ? 'Remarried Spouse' : (d.appearance.gender === 'male' ? 'Wife' : 'Husband')) : datingPartner ? this.renderFamilyCard(datingPartner, datingRel?.status === 'madly_in_love' ? 'Madly in Love' : datingRel?.status === 'in_love' ? 'Love' : 'Dating Partner') : `
              <div class="family-node-empty single-card">
                <span class="empty-icon">${isSinglePar ? '🛡️' : (d.divorceCount || 0) > 0 ? '💔' : '🕊️'}</span>
                <span class="empty-title">${isSinglePar ? 'Single Parent' : (d.divorceCount || 0) > 0 ? 'Divorced & Single' : 'Unattached'}</span>
                <span class="empty-desc">${isSinglePar ? 'Focusing on raising children in homestead' : 'Open to flirting, dating, and finding love'}</span>
              </div>
            `}
          </div>

          <!-- Siblings (Full and Half) -->
          ${(fullSiblings.length > 0 || halfSiblings.length > 0) ? `
            <div class="siblings-section">
              <div class="siblings-header">Brothers & Sisters (${allSiblings.length}):</div>
              <div class="tree-nodes-row siblings-row">
                ${fullSiblings.map(sib => this.renderFamilyCard(sib, sib.data.appearance.gender === 'male' ? 'Brother' : 'Sister')).join('')}
                ${halfSiblings.map(sib => this.renderFamilyCard(sib, sib.data.appearance.gender === 'male' ? 'Half-Brother' : 'Half-Sister')).join('')}
              </div>
            </div>
          ` : ''}
          <div class="tree-connector-down"></div>
        </div>

        <!-- Past Unions & Ex-Spouses (Divorced) -->
        ${exSpouses.length > 0 ? `
          <div class="tree-level level-ex-spouses">
            <div class="level-tag level-divorced-tag">💔 PAST MARRIAGES & EX-SPOUSES (${exSpouses.length})</div>
            <div class="tree-nodes-row ex-spouses-row">
              ${exSpouses.map(ex => this.renderFamilyCard(ex, 'Ex-Spouse (Divorced)')).join('')}
            </div>
            <div class="tree-connector-down"></div>
          </div>
        ` : ''}

        <!-- Generation 4: Biological & Step-Children -->
        <div class="tree-level level-children">
          <div class="level-tag">CHILDREN & STEP-CHILDREN (${bioChildren.length + stepChildren.length})</div>
          
          <!-- Expecting Announcement if Pregnant -->
          ${(d.isPregnant || spouse?.data.isPregnant) ? `
            <div class="pregnant-announcement-card">
              <span class="pregnant-icon">🤰</span>
              <div class="pregnant-info">
                <span class="pregnant-title">Expecting a New Child!</span>
                <span class="pregnant-desc">
                  Natural family gestation at ${Math.round(d.pregnancyProgress || spouse?.data.pregnancyProgress || 0)}%. 
                  Will be born directly into this home (Household currently ${houseResidents.length}/5 members).
                </span>
              </div>
            </div>
          ` : ''}

          ${(bioChildren.length > 0 || stepChildren.length > 0) ? `
            <div class="tree-nodes-row children-row">
              ${bioChildren.map((child, idx) => {
                const birthOrder = idx === 0 ? '1st Child' : idx === 1 ? '2nd Child' : idx === 2 ? '3rd Child' : `${idx + 1}th Child`;
                const relLabel = `${birthOrder} (Bio ${child.data.appearance.gender === 'female' ? 'Daughter' : 'Son'})`;
                return this.renderFamilyCard(child, relLabel);
              }).join('')}
              ${stepChildren.map(stChild => {
                return this.renderFamilyCard(stChild, `Step-${stChild.data.appearance.gender === 'female' ? 'Daughter' : 'Son'}`);
              }).join('')}
            </div>
          ` : `
            <div class="family-node-empty" style="max-width: 340px; margin: 0 auto;">
              <span class="empty-icon">${spouse ? '🏡' : '🌱'}</span>
              <span class="empty-title">No Children Yet</span>
              <span class="empty-desc">
                ${spouse ? 'Living in their dedicated house. Children will be born here (max 5 members per house).' : 'Settler has not produced children yet.'}
              </span>
            </div>
          `}
        </div>

        <!-- Generation 5: Grandchildren (If any) -->
        ${grandchildren.length > 0 ? `
          <div class="tree-connector-down"></div>
          <div class="tree-level level-grandchildren">
            <div class="level-tag">GRANDCHILDREN (${grandchildren.length})</div>
            <div class="tree-nodes-row grandchildren-row">
              ${grandchildren.map(gc => this.renderFamilyCard(gc, gc.data.appearance.gender === 'male' ? 'Grandson' : 'Granddaughter')).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Helper to render an individual family node card.
   */
  private renderFamilyCard(target: Agent | undefined, relationshipLabel: string): string {
    if (!target) return '';
    const d = target.data;
    const cabin = this.sim.world.getBuildingById(d.homeCabinId);
    const lifeStage = d.age <= 3 ? '🍼 Toddler' : d.age < 16 ? '🧒 Child' : d.age >= 60 ? '📜 Elder' : '🧑 Adult';
    const isEx = relationshipLabel.includes('Ex-Spouse');
    const isStep = relationshipLabel.includes('Step');

    return `
      <div class="family-card ${isEx ? 'card-ex-spouse' : isStep ? 'card-step-relation' : ''}" data-inspect-agent-id="${d.id}" title="Click to inspect ${d.name}">
        <div class="card-badge-relation ${isEx ? 'badge-rel-ex' : isStep ? 'badge-rel-step' : ''}">${relationshipLabel}</div>
        <div class="card-avatar" style="background-color: ${d.appearance.shirtColor};">
          <span>${d.appearance.gender === 'female' ? '👩' : '👨'}</span>
        </div>
        <div class="card-info">
          <span class="card-name">${d.name}</span>
          <span class="card-role">${lifeStage} • Age ${d.age}</span>
          <span class="card-home">${cabin ? cabin.name : 'Homeless'}</span>
        </div>
        ${d.isDead ? '<div class="card-dead-tag">🕊️ Deceased</div>' : ''}
      </div>
    `;
  }

  private renderSlider(label: string, field: string, value: number, min: number, max: number, unit: string, color: string): string {
    return `
      <div class="slider-row">
        <div class="slider-header">
          <span class="slider-label">${label}</span>
          <span class="slider-val" id="val-${field}">${Math.round(value)}${unit}</span>
        </div>
        <input 
          type="range" 
          class="god-slider" 
          data-field="${field}" 
          min="${min}" 
          max="${max}" 
          value="${Math.round(value)}"
          style="accent-color: ${color};"
        />
      </div>
    `;
  }

  private renderRelationshipSliders(agent: Agent, targetAgent?: Agent): string {
    if (!targetAgent) return `<div class="empty-state">No other settlers in the forest.</div>`;

    const rel = agent.getOrCreateRelationship(targetAgent.data);
    const isTargetSpouse = agent.data.spouseId === targetAgent.data.id;

    return `
      <div class="rel-box">
        <div class="rel-status-header">
          <span>Relationship with <strong>${targetAgent.data.name}</strong></span>
          <span class="rel-badge status-${rel.status}">${rel.status.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="stat-sliders">
          ${this.renderSlider('Affinity (Love / Hate)', 'rel_affinity', (rel.affinity + 100) / 2, 0, 100, '%', '#ec4899')}
          ${this.renderSlider('Attraction', 'rel_attraction', rel.attraction, 0, 100, '%', '#f43f5e')}
          ${this.renderSlider('Trust', 'rel_trust', (rel.trust + 100) / 2, 0, 100, '%', '#3b82f6')}
          ${this.renderSlider('Fear', 'rel_fear', rel.fear, 0, 100, '%', '#ef4444')}
        </div>
        <div class="rel-force-buttons">
          <button class="action-pill" id="btn-force-flirt" data-target-id="${targetAgent.data.id}">
            ${rel.status === 'madly_in_love' ? '💍 Propose Marriage' : rel.status === 'in_love' ? '🔥 Deepen to Madly in Love' : rel.status === 'dating' ? '❤️ Confess Love' : rel.status === 'flirting' ? '🌹 Start Dating' : '💖 Flirt'}
          </button>
          ${isTargetSpouse ? `
            <button class="action-pill smite-pill" id="btn-force-divorce" data-target-id="${targetAgent.data.id}">💔 Divorce</button>
          ` : ''}
          <button class="action-pill smite-pill" id="btn-force-fight" data-target-id="${targetAgent.data.id}">⚠️ Force Fight</button>
        </div>
      </div>
    `;
  }

  private renderMemories(memories: Agent['data']['memories']): string {
    if (memories.length === 0) return `<div class="empty-state">No memories recorded yet.</div>`;

    return memories.map(m => {
      const isPositive = m.emotionalWeight > 0;
      return `
        <div class="memory-item ${isPositive ? 'positive' : 'negative'}">
          <div class="memory-desc">${m.description}</div>
          <div class="memory-meta">
            <span>Impact: ${m.emotionalWeight > 0 ? '+' : ''}${m.emotionalWeight}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private bindEvents(agent: Agent): void {
    const closeBtn = this.container.querySelector('#btn-close-inspector');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.sim.selectedAgent = null;
        this.update();
      });
    }

    const nameInput = this.container.querySelector('#edit-agent-name') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('change', () => {
        agent.data.name = nameInput.value.trim() || agent.data.name;
      });
    }

    // Role changer
    const roleSelect = this.container.querySelector('#edit-agent-role') as HTMLSelectElement;
    if (roleSelect) {
      roleSelect.addEventListener('change', () => {
        const newRole = roleSelect.value as SettlerRole;
        agent.data.role = newRole;
        if (newRole === 'hunter') {
          agent.data.equippedWeapon = 'bow';
        } else if (newRole === 'lumberjack') {
          agent.data.equippedWeapon = 'axe';
        } else if (newRole === 'builder') {
          agent.data.equippedWeapon = 'hammer';
        }
        agent.initDefaultSchedule();
        this.renderFull(agent);
      });
    }

    // Header badge shortcuts
    const badgeTree = this.container.querySelector('#header-badge-tree');
    if (badgeTree) {
      badgeTree.addEventListener('click', () => {
        this.switchTab('tab-family');
      });
    }

    const badgeSpouse = this.container.querySelector('#header-badge-spouse') as HTMLElement | null;
    if (badgeSpouse && badgeSpouse.dataset.inspectAgentId) {
      badgeSpouse.addEventListener('click', () => {
        const spouseAgent = this.sim.agents.find(a => a.data.id === badgeSpouse.dataset.inspectAgentId);
        if (spouseAgent) {
          this.sim.selectedAgent = spouseAgent;
          this.renderFull(spouseAgent);
        }
      });
    }

    // Clickable Family Tree cards & Resident chips
    this.container.querySelectorAll('[data-inspect-agent-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = (e.currentTarget as HTMLElement).dataset.inspectAgentId;
        const target = this.sim.agents.find(a => a.data.id === targetId);
        if (target) {
          this.sim.selectedAgent = target;
          this.renderFull(target);
        }
      });
    });

    // Pan camera to home
    const panHouseBtn = this.container.querySelector('#btn-pan-house') as HTMLElement | null;
    if (panHouseBtn) {
      panHouseBtn.addEventListener('click', () => {
        const x = parseFloat(panHouseBtn.dataset.x || '0');
        const y = parseFloat(panHouseBtn.dataset.y || '0');
        if (this.onPanToLocation && x > 0 && y > 0) {
          this.onPanToLocation(x, y);
        }
      });
    }

    // Quick Action Divorce
    const divorceBtn = this.container.querySelector('#btn-inspect-divorce');
    if (divorceBtn && agent.data.spouseId) {
      divorceBtn.addEventListener('click', () => {
        const spouse = this.sim.agents.find(a => a.data.id === agent.data.spouseId);
        if (spouse) {
          const msg = this.sim.processDivorce(agent, spouse, 'Irreconcilable differences and dissolution of vows');
          this.sim.addDramaEvent('violence', msg, [agent.data.id, spouse.data.id]);
          this.renderFull(agent);
        }
      });
    }

    // Quick Action Courtship / Propose
    const courtshipBtn = this.container.querySelector('#btn-inspect-courtship');
    if (courtshipBtn) {
      courtshipBtn.addEventListener('click', () => {
        // Find best match or current dating partner
        const partner = this.sim.agents.find(a => {
          if (a.data.id === agent.data.id) return false;
          const r = agent.data.relationships[a.data.id];
          return r && (r.status === 'madly_in_love' || r.status === 'in_love' || r.status === 'dating' || r.status === 'flirting');
        }) || this.sim.agents.find(a => a.data.id !== agent.data.id && a.data.age >= 16 && !a.data.spouseId);

        if (partner) {
          const msg = this.sim.triggerRomanceBetween(agent, partner);
          if (msg) {
            this.sim.addDramaEvent('love', msg, [agent.data.id, partner.data.id]);
          }
          this.renderFull(agent);
        }
      });
    }

    const possessBtn = this.container.querySelector('#btn-inspect-possess');
    if (possessBtn) {
      possessBtn.addEventListener('click', () => {
        this.sim.togglePossession(agent);
        this.renderFull(agent);
      });
    }

    const buildHouseBtn = this.container.querySelector('#btn-inspect-build-house');
    if (buildHouseBtn) {
      buildHouseBtn.addEventListener('click', () => {
        agent.data.wantsToBuildHouse = true;
        const msg = agent.checkAutonomousHouseBuilding(this.sim.world);
        if (msg) {
          this.sim.addDramaEvent('work', msg, [agent.data.id]);
        }
        this.renderFull(agent);
      });
    }

    const healBtn = this.container.querySelector('#btn-inspect-heal');
    if (healBtn) {
      healBtn.addEventListener('click', () => {
        this.sim.activeGodPower = 'resurrect';
        this.sim.executeGodPower(agent.data.x, agent.data.y, agent);
        this.sim.activeGodPower = 'none';
        this.updateDynamicValues(agent);
      });
    }

    const smiteBtn = this.container.querySelector('#btn-inspect-smite');
    if (smiteBtn) {
      smiteBtn.addEventListener('click', () => {
        this.sim.smiteLivingThing(agent);
        this.renderFull(agent);
      });
    }

    const elderDeathBtn = this.container.querySelector('#btn-inspect-elder-death');
    if (elderDeathBtn) {
      elderDeathBtn.addEventListener('click', () => {
        this.sim.forcePassOfOldAge(agent.data.id);
        this.renderFull(agent);
      });
    }

    const birthBtn = this.container.querySelector('#btn-inspect-birth');
    if (birthBtn) {
      birthBtn.addEventListener('click', () => {
        this.sim.forceDeliverBaby(agent.data.id);
        this.renderFull(agent);
      });
    }

    const ageUpBtn = this.container.querySelector('#btn-inspect-ageup');
    if (ageUpBtn) {
      ageUpBtn.addEventListener('click', () => {
        this.sim.forceAgeUp(agent.data.id, 1);
        this.renderFull(agent);
      });
    }

    const matureBtn = this.container.querySelector('#btn-inspect-mature');
    if (matureBtn) {
      matureBtn.addEventListener('click', () => {
        this.sim.forceMatureToAdult(agent.data.id);
        this.renderFull(agent);
      });
    }

    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab;
        if (target) {
          this.switchTab(target);
        }
      });
    });

    this.container.querySelectorAll('.god-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const input = e.currentTarget as HTMLInputElement;
        const field = input.dataset.field;
        const val = parseFloat(input.value);

        const labelEl = this.container.querySelector(`#val-${field}`);
        if (labelEl) labelEl.textContent = `${Math.round(val)}%`;

        if (field === 'health') agent.data.needs.health = val;
        else if (field === 'hunger') agent.data.needs.hunger = val;
        else if (field === 'energy') agent.data.needs.energy = val;
        else if (field === 'social') agent.data.needs.social = val;
        else if (field === 'fun') agent.data.needs.fun = val;
        else if (field === 'morality') agent.data.needs.morality = val;
        else if (field === 'workEthic') agent.data.traits.workEthic = val / 100;
        else if (field === 'aggression') agent.data.traits.aggression = val / 100;
        else if (field === 'libido') agent.data.traits.libido = val / 100;
        else if (field === 'agreeableness') agent.data.traits.agreeableness = (val / 50) - 1;
        else if (field === 'neuroticism') agent.data.traits.neuroticism = (val / 50) - 1;
      });
    });

    const targetSelect = this.container.querySelector('#rel-select-target') as HTMLSelectElement;
    if (targetSelect) {
      targetSelect.addEventListener('change', () => {
        const target = this.sim.agents.find(a => a.data.id === targetSelect.value);
        const relContainer = this.container.querySelector('#rel-sliders-container');
        if (relContainer) {
          relContainer.innerHTML = this.renderRelationshipSliders(agent, target);
          this.bindRelButtons(agent, target);
        }
      });
      // Initial bind for the first companion
      const initialTarget = this.sim.agents.find(a => a.data.id === targetSelect.value);
      this.bindRelButtons(agent, initialTarget);
    }

    const wipeTraumaBtn = this.container.querySelector('#btn-wipe-trauma');
    if (wipeTraumaBtn) {
      wipeTraumaBtn.addEventListener('click', () => {
        agent.data.memories = agent.data.memories.filter(m => m.emotionalWeight >= 0);
        this.renderFull(agent);
      });
    }

    const injectLoveBtn = this.container.querySelector('#btn-inject-love-memory');
    if (injectLoveBtn) {
      injectLoveBtn.addEventListener('click', () => {
        agent.addMemory('Felt a profound spiritual warmth in the forest.', 80);
        this.renderFull(agent);
      });
    }
  }

  private switchTab(target: string): void {
    this.activeTabId = target;
    this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const tabBtn = this.container.querySelector(`.tab-btn[data-tab="${target}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const pane = this.container.querySelector(`#${target}`);
    if (pane) pane.classList.add('active');
  }

  private bindRelButtons(agent: Agent, target?: Agent): void {
    if (!target) return;
    const forceFlirtBtn = this.container.querySelector('#btn-force-flirt');
    if (forceFlirtBtn) {
      forceFlirtBtn.addEventListener('click', () => {
        const msg = this.sim.triggerRomanceBetween(agent, target);
        if (msg) {
          this.sim.addDramaEvent('love', msg, [agent.data.id, target.data.id]);
        }
        this.renderFull(agent);
      });
    }

    const forceDivorceBtn = this.container.querySelector('#btn-force-divorce');
    if (forceDivorceBtn) {
      forceDivorceBtn.addEventListener('click', () => {
        this.sim.processDivorce(agent, target, 'Irreconcilable differences and shattered trust');
        this.renderFull(agent);
      });
    }

    const forceFightBtn = this.container.querySelector('#btn-force-fight');
    if (forceFightBtn) {
      forceFightBtn.addEventListener('click', () => {
        const msg = agent.triggerConflict(target);
        if (msg) {
          this.sim.addDramaEvent('violence', msg, [agent.data.id, target.data.id]);
        }
        this.renderFull(agent);
      });
    }
  }

  private updateDynamicValues(agent: Agent): void {
    const d = agent.data;
    const countdownEl = this.container.querySelector('#inspector-death-countdown');
    if (countdownEl && d.deathTimer !== undefined) {
      countdownEl.textContent = Math.max(1, Math.ceil(d.deathTimer)).toString();
    }

    const thoughtEl = this.container.querySelector('#inspector-thought');
    if (thoughtEl) {
      thoughtEl.textContent = `"${d.thought}"`;
    }

    const dialogBox = this.container.querySelector('#inspector-dialog-box') as HTMLElement;
    const dialogText = this.container.querySelector('#inspector-dialog');
    if (dialogBox && dialogText) {
      if (d.activeDialog) {
        dialogBox.style.display = 'block';
        dialogText.innerHTML = `${d.activeDialog.isSpeaker ? '🗣️ Saying to' : '👂 Listening to'} <strong>${d.activeDialog.partnerName}</strong>: “${d.activeDialog.line || '...' }”`;
      } else {
        dialogBox.style.display = 'none';
      }
    }

    this.syncSlider('health', d.needs.health);
    this.syncSlider('hunger', d.needs.hunger);
    this.syncSlider('energy', d.needs.energy);
    this.syncSlider('social', d.needs.social);
    this.syncSlider('fun', d.needs.fun);
    this.syncSlider('morality', d.needs.morality);
    this.syncSlider('workEthic', d.traits.workEthic * 100);
    this.syncSlider('aggression', d.traits.aggression * 100);
    this.syncSlider('libido', d.traits.libido * 100);
    this.syncSlider('agreeableness', (d.traits.agreeableness + 1) * 50);
    this.syncSlider('neuroticism', (d.traits.neuroticism + 1) * 50);

    const possessBtn = this.container.querySelector('#btn-inspect-possess') as HTMLButtonElement | null;
    if (possessBtn) {
      const label = d.isPossessed ? '👁️ Release' : '🎭 Possess';
      if (possessBtn.textContent?.trim() !== label) possessBtn.textContent = label;
      possessBtn.classList.toggle('active', d.isPossessed);
    }

    const routineBox = this.container.querySelector('.routine-status-box');
    const routineBadge = this.container.querySelector('.routine-badge');
    const routineDetails = this.container.querySelector('.routine-details');
    if (routineBox) routineBox.classList.toggle('interrupted', d.routineInterrupted);
    if (routineBadge) {
      routineBadge.textContent = d.routineInterrupted ? 'INTERRUPTED' : 'ON SCHEDULE';
      routineBadge.classList.toggle('badge-alert', d.routineInterrupted);
      routineBadge.classList.toggle('badge-ok', !d.routineInterrupted);
    }
    if (routineDetails) {
      const currentHour = Math.floor(this.sim.gameMinutes / 60);
      const activeSlot = d.schedule.find(s => currentHour >= s.startHour && currentHour < s.endHour);
      routineDetails.textContent = d.routineInterrupted 
        ? `⚠️ ${d.interruptionReason || 'Distracted by sudden event'}`
        : `🕒 ${activeSlot ? activeSlot.description : 'Resting in the settlement'}`;
    }
  }

  private syncSlider(field: string, rawValue: number): void {
    const slider = this.container.querySelector(`.god-slider[data-field="${field}"]`) as HTMLInputElement | null;
    if (!slider || document.activeElement === slider) return;

    const value = Math.max(0, Math.min(100, Math.round(rawValue)));
    const next = String(value);
    if (slider.value !== next) slider.value = next;

    const labelEl = this.container.querySelector(`#val-${field}`);
    const nextLabel = `${value}%`;
    if (labelEl && labelEl.textContent !== nextLabel) labelEl.textContent = nextLabel;
  }
}
