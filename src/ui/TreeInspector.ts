import { Simulation } from '../engine/Simulation';
import type { ForestTree, TreeStage } from '../types/simulation';
import { TreeRenderer } from '../renderer/TreeRenderer';

export class TreeInspector {
  private container: HTMLElement;
  private sim: Simulation;
  private currentTreeId: string | null = null;

  constructor(container: HTMLElement, sim: Simulation) {
    this.container = container;
    this.sim = sim;
  }

  public update(): void {
    const tree = this.sim.selectedTree;
    if (!tree) {
      this.container.classList.add('hidden');
      this.currentTreeId = null;
      return;
    }

    this.container.classList.remove('hidden');

    if (this.currentTreeId !== tree.id) {
      this.currentTreeId = tree.id;
      this.render(tree);
    } else {
      this.updateDynamicFields(tree);
    }
  }

  private getStageBadgeColor(stage: TreeStage): { bg: string; text: string; border: string } {
    switch (stage) {
      case 'ancient':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' };
      case 'mature':
        return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: '#22c55e' };
      case 'young':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#38bdf8' };
      case 'sapling':
        return { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: '#eab308' };
      case 'decaying':
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: '#9ca3af' };
    }
  }

  private getTreeDescription(variant: ForestTree['variant'], stage: TreeStage): string {
    const idx = TreeRenderer.getTreeIndex(variant);
    const descriptions: Record<number, string> = {
      0: 'A charming, compact tree with a rounded emerald crown and mossy base pebbles, thriving in small homestead gardens and forest clearings.',
      1: 'A full-canopied, vibrant green woodland tree providing dense cooling shade and shelter for nesting forest birds.',
      2: 'A grand, sprawling mature oak tree with a massive knotted trunk, broad leafy boughs, and deep ancient roots.',
      3: 'A slender, columnar evergreen pointing skyward like an emerald spire, standing sentinel along woodland borders and hill crests.',
      4: 'A hardy mountain pine with tiered evergreen needles, exuding the crisp scent of alpine resin and yielding durable timber.',
      5: 'A frost-laden alpine snow pine cloaked in soft crystalline drifts, perfectly adapted to winter peaks and freezing mountain winds.',
      6: 'A fruitful orchard apple tree laden with glossy red apples, sweet blossom fragrance, and bountiful harvest for hungry settlers.',
      7: 'A vibrant citrus tree glowing with plump, sun-ripened golden oranges nestled among aromatic waxy green foliage.',
      8: 'A breathtaking flowering cherry blossom tree draped in soft pink petals that flutter gently on the spring breeze.',
      9: 'A radiant autumn tree ablaze in glorious shades of fiery amber, copper, and golden deciduous foliage.',
      10: 'A magical blooming tree adorned with enchanting lavender and violet blossom clusters that perfume the woodland air.',
      11: 'A stately tropical palm tree with arched feather fronds and ripe coconuts, swaying peacefully along the riverbanks.',
      12: 'A poetic weeping willow with delicate sweeping branches dipping gracefully toward the flowing river currents.',
      13: 'An elegant white-barked birch tree with fluttering bright leaves, revered by woodland wanderers and herbalists.',
      14: 'A weathered, hollow dead tree whose gnarled bare branches reach toward the sky, providing perches for owls and ravens.',
      15: 'A resilient woodland tree rooted tenaciously among mossy granite boulders, standing firm against torrential storms.',
      16: 'A lush wetland mangrove tree supported by a complex network of arched stilt roots wading through tranquil river shallows.',
      17: 'A dense, tranquil grove of segmented green bamboo stalks rustling with calming whispers in the passing wind.'
    };

    const base = descriptions[idx] || descriptions[0];
    if (stage === 'ancient') return `${base} It has grown into an ancient monolith of timeless age.`;
    if (stage === 'sapling') return 'A fragile young shoot taking root in fertile forest loam.';
    if (stage === 'young') return `${base} It is vigorously growing toward the woodland canopy.`;
    if (stage === 'decaying') return 'A weathered forest stump overgrown with moss and wild woodland mushrooms (🍄).';
    return base;
  }

  public render(tree: ForestTree): void {
    const treeName = TreeRenderer.getTreeName(tree.variant);
    const spriteUrl = TreeRenderer.getTreeSpriteUrl(tree.variant);
    const stageColor = this.getStageBadgeColor(tree.stage);
    const desc = this.getTreeDescription(tree.variant, tree.stage);
    const healthPercent = Math.max(0, Math.min(100, (tree.woodHealth / tree.maxWoodHealth) * 100));

    this.container.innerHTML = `
      <div class="tree-card">
        <!-- Header -->
        <div class="tree-header">
          <div class="tree-avatar">
            <img src="${spriteUrl}" alt="${treeName}" class="tree-avatar-img" />
          </div>
          <div class="tree-header-info">
            <div class="tree-title-row">
              <span class="tree-name">${treeName}</span>
              <button class="close-btn" id="btn-close-tree">&times;</button>
            </div>
            <div class="tree-meta">
              <span class="tree-stage-badge" id="tree-stage-badge" style="color: ${stageColor.text}; background: ${stageColor.bg}; border: 1px solid ${stageColor.border}">
                ${tree.stage.toUpperCase()}
              </span>
              <span>• Pos (${Math.round(tree.x)}, ${Math.round(tree.y)})</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="tree-desc-box">
          <p class="tree-desc-text" id="tree-desc-text">${desc}</p>
        </div>

        <!-- Actions Toolbar -->
        <div class="tree-actions-bar">
          <button class="tree-action-btn remove-btn" id="btn-remove-tree" title="Fell this tree and harvest timber logs">
            <span>🪓 Remove Tree</span>
          </button>
          <button class="tree-action-btn cycle-btn" id="btn-cycle-stage" title="Cycle growth stage (Young -> Mature -> Ancient)">
            <span>🌱 Growth Stage</span>
          </button>
          <button class="tree-action-btn shake-btn" id="btn-shake-tree" title="Shake branches to drop seeds">
            <span>🍃 Shake Seeds</span>
          </button>
        </div>

        <!-- Vitals & Ecology Section -->
        <div class="tree-vitals-section">
          <div class="vitals-header">
            <span>🌲 Tree Vitals & Ecology</span>
          </div>

          <!-- Wood Timber Health Bar -->
          <div class="tree-stat-row">
            <div class="stat-labels">
              <span>🪵 Timber Reserve</span>
              <span id="tree-wood-text">${Math.round(tree.woodHealth)} / ${tree.maxWoodHealth}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill wood-fill" id="tree-wood-bar" style="width: ${healthPercent}%"></div>
            </div>
          </div>

          <!-- Tree Age & Lifespan -->
          <div class="tree-stat-grid">
            <div class="mini-stat-card">
              <span class="mini-label">⏳ Current Age</span>
              <span class="mini-value" id="tree-age-val">${Math.floor(tree.age)} days</span>
            </div>
            <div class="mini-stat-card">
              <span class="mini-label">🕰️ Max Lifespan</span>
              <span class="mini-value">${Math.floor(tree.maxLifespan)} days</span>
            </div>
          </div>

          <!-- Seed Germination Timer -->
          <div class="seed-status-card">
            <span class="seed-icon">🌰</span>
            <div class="seed-info">
              <span class="seed-title">Natural Seed Germination</span>
              <span class="seed-countdown" id="tree-seed-text">Drops seeds in ~${Math.max(0, Math.ceil(tree.seedTimer))}s</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(tree);
  }

  private updateDynamicFields(tree: ForestTree): void {
    const healthPercent = Math.max(0, Math.min(100, (tree.woodHealth / tree.maxWoodHealth) * 100));
    const woodText = this.container.querySelector('#tree-wood-text');
    const woodBar = this.container.querySelector('#tree-wood-bar') as HTMLElement | null;
    const ageVal = this.container.querySelector('#tree-age-val');
    const seedText = this.container.querySelector('#tree-seed-text');

    if (woodText) woodText.textContent = `${Math.round(tree.woodHealth)} / ${tree.maxWoodHealth}`;
    if (woodBar) woodBar.style.width = `${healthPercent}%`;
    if (ageVal) ageVal.textContent = `${Math.floor(tree.age)} days`;
    if (seedText) seedText.textContent = `Drops seeds in ~${Math.max(0, Math.ceil(tree.seedTimer))}s`;
  }

  private bindEvents(tree: ForestTree): void {
    // 1. Close Inspector
    const closeBtn = this.container.querySelector('#btn-close-tree');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.sim.selectedTree = null;
      });
    }

    // 2. Remove / Chop Tree
    const removeBtn = this.container.querySelector('#btn-remove-tree');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.sim.removeTree(tree.id);
      });
    }

    // 3. Cycle Growth Stage
    const cycleBtn = this.container.querySelector('#btn-cycle-stage');
    if (cycleBtn) {
      cycleBtn.addEventListener('click', () => {
        const stages: TreeStage[] = ['sapling', 'young', 'mature', 'ancient'];
        const currentIdx = stages.indexOf(tree.stage);
        const nextStage = stages[(currentIdx + 1) % stages.length];
        tree.stage = nextStage;
        tree.woodHealth = nextStage === 'ancient' ? 140 : nextStage === 'young' ? 65 : nextStage === 'sapling' ? 25 : 100;
        tree.maxWoodHealth = tree.woodHealth;
        this.sim.world.spawnSpecialEffect('sparkle', tree.x, tree.y - 20);
        this.render(tree);
      });
    }

    // 4. Shake Branches
    const shakeBtn = this.container.querySelector('#btn-shake-tree');
    if (shakeBtn) {
      shakeBtn.addEventListener('click', () => {
        tree.shakeTimer = 0.8;
        this.sim.world.spawnSpecialEffect('sparkle', tree.x, tree.y - 15);
        // Drop an acorn / sapling nearby
        const sx = tree.x + (Math.random() * 40 - 20);
        const sy = tree.y + (Math.random() * 30 - 15);
        if (!this.sim.world.isWater(sx, sy, 15)) {
          this.sim.world.trees.push({
            id: `tree_seed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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
            seedTimer: 60
          });
          this.sim.addDramaEvent('miracle', `Acorn dropped from ${TreeRenderer.getTreeName(tree.variant)} and sprouted into a new sapling!`, []);
        }
      });
    }
  }
}
