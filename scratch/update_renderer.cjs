const fs = require('fs');

const path = 'src/renderer/CanvasRenderer.ts';
let code = fs.readFileSync(path, 'utf8');

// Normalize CRLF to LF for consistent replacement, then we can save as LF or CRLF
const isCRLF = code.includes('\r\n');
if (isCRLF) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. Add mouse state variables
const targetProps = `  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;`;

const newProps = `  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private isMouseDown = false;
  private mouseDownClientX = 0;
  private mouseDownClientY = 0;
  private hasDragged = false;`;

if (!code.includes(targetProps)) {
  console.error('Failed to find targetProps');
  process.exit(1);
}
code = code.replace(targetProps, newProps);

// 2. Replace setupEventListeners
const oldListenersStart = `  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.canvas.addEventListener('mousedown', (e) => {`;

const oldListenersEnd = `    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Anchor the zoom on the cursor so scrolling over a house naturally
      // centres and opens that house's interior.
      const before = this.screenToWorld(e.clientX, e.clientY);
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoom = Math.max(0.45, Math.min(2.0, this.zoom * zoomFactor));
      const after = this.screenToWorld(e.clientX, e.clientY);
      this.cameraX += before.x - after.x;
      this.cameraY += before.y - after.y;
      this.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, this.cameraX));
      this.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, this.cameraY));
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }`;

const oldListenersPattern = /  private setupEventListeners\(\): void \{[\s\S]*?this\.canvas\.addEventListener\('contextmenu', \(e\) => e\.preventDefault\(\)\);\n  \}/;

const newListeners = `  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    this.resize();

    this.canvas.addEventListener('mousedown', (e) => {
      // Minimap check (bottom right)
      const miniW = 180;
      const miniH = miniW * (this.sim.world.height / this.sim.world.width);
      const miniX = this.canvas.width - miniW - 16;
      const miniY = this.canvas.height - miniH - 16;

      if (
        e.clientX >= miniX && e.clientX <= miniX + miniW &&
        e.clientY >= miniY && e.clientY <= miniY + miniH
      ) {
        const rx = (e.clientX - miniX) / miniW;
        const ry = (e.clientY - miniY) / miniH;
        this.cameraX = rx * this.sim.world.width;
        this.cameraY = ry * this.sim.world.height;
        return;
      }

      this.isMouseDown = true;
      this.mouseDownClientX = e.clientX;
      this.mouseDownClientY = e.clientY;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.hasDragged = false;

      // Middle or right click immediately activates pan drag
      if (e.button === 1 || e.button === 2) {
        this.isDragging = true;
        this.hasDragged = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      const wPos = this.screenToWorld(e.clientX, e.clientY);
      this.mouseWorldX = wPos.x;
      this.mouseWorldY = wPos.y;

      if (this.sim.activeGodPower === 'remove_tree') {
        const hTree = this.sim.getTreeAt(wPos.x, wPos.y);
        this.hoveredTreeId = hTree ? hTree.id : null;
      } else {
        this.hoveredTreeId = null;
      }

      if (this.isMouseDown && !this.isDragging) {
        const dist = Math.hypot(e.clientX - this.mouseDownClientX, e.clientY - this.mouseDownClientY);
        if (dist > 5) {
          this.isDragging = true;
          this.hasDragged = true;
        }
      }

      if (this.isDragging) {
        const dx = (e.clientX - this.dragStartX) / this.zoom;
        const dy = (e.clientY - this.dragStartY) / this.zoom;
        this.cameraX -= dx;
        this.cameraY -= dy;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        this.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, this.cameraX));
        this.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, this.cameraY));
      }
    });

    window.addEventListener('mouseup', (e) => {
      const wasDragging = this.isDragging || this.hasDragged;
      this.isDragging = false;
      this.isMouseDown = false;

      // If the player moved the mouse to pan the camera, do not trigger entity clicks!
      if (wasDragging) {
        return;
      }

      if (e.button === 0 && e.target === this.canvas) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        const interiorAgent = this.getInteriorAgentAt(worldPos.x, worldPos.y);
        const activeInteriorBuilding = this.getActiveInteriorBuildingAt(worldPos.x, worldPos.y);
        const rawAgent = !activeInteriorBuilding ? this.sim.getAgentAt(worldPos.x, worldPos.y) : null;
        const clickedAgent = interiorAgent || (rawAgent && !this.isEntityBehindAnyBuilding(rawAgent.data.x, rawAgent.data.y) ? rawAgent : null);
        const rawAnimal = !activeInteriorBuilding ? this.sim.getAnimalAt(worldPos.x, worldPos.y, 36) : null;
        const clickedAnimal = rawAnimal && !this.isEntityBehindAnyBuilding(rawAnimal.x, rawAnimal.y) ? rawAnimal : null;

        if (this.sim.activeGodPower !== 'none') {
          this.sim.executeGodPower(worldPos.x, worldPos.y, clickedAgent || undefined, clickedAnimal || undefined);
          return;
        }

        if (clickedAgent) {
          this.sim.selectedAgent = clickedAgent;
          this.sim.selectedBuilding = null;
          this.sim.selectedTree = null;
          this.sim.selectedBonfire = false;
        } else {
          const clickedBuilding = activeInteriorBuilding || this.sim.getBuildingAt(worldPos.x, worldPos.y);
          if (clickedBuilding) {
            this.sim.selectedBuilding = clickedBuilding;
            this.sim.selectedAgent = null;
            this.sim.selectedTree = null;
            this.sim.selectedBonfire = false;
          } else {
            const clickedTree = this.sim.getTreeAt(worldPos.x, worldPos.y);
            if (clickedTree) {
              this.sim.selectedTree = clickedTree;
              this.sim.selectedAgent = null;
              this.sim.selectedBuilding = null;
              this.sim.selectedBonfire = false;
            } else {
              const cf = this.sim.world.campfire;
              const isOverBonfire = !activeInteriorBuilding && Math.hypot(worldPos.x - cf.x, worldPos.y - (cf.y - 12)) < 36;
              if (isOverBonfire) {
                this.sim.selectedBonfire = true;
                this.sim.selectedAgent = null;
                this.sim.selectedBuilding = null;
                this.sim.selectedTree = null;
              } else {
                this.sim.selectedAgent = null;
                this.sim.selectedBuilding = null;
                this.sim.selectedTree = null;
                this.sim.selectedBonfire = false;
              }
            }
          }
        }
      }
    });

    // Double-click to instantly center camera on clicked point
    this.canvas.addEventListener('dblclick', (e) => {
      const worldPos = this.screenToWorld(e.clientX, e.clientY);
      this.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, worldPos.x));
      this.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, worldPos.y));
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Anchor the zoom on the cursor so scrolling over a house naturally
      // centres and opens that house's interior.
      const before = this.screenToWorld(e.clientX, e.clientY);
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoom = Math.max(0.45, Math.min(2.0, this.zoom * zoomFactor));
      const after = this.screenToWorld(e.clientX, e.clientY);
      this.cameraX += before.x - after.x;
      this.cameraY += before.y - after.y;
      this.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, this.cameraX));
      this.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, this.cameraY));
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }`;

if (!oldListenersPattern.test(code)) {
  console.error('Failed to find oldListenersPattern');
  process.exit(1);
}
code = code.replace(oldListenersPattern, newListeners);

// 3. Add Pause Banner in drawReferenceHUD
const hudTarget = `    // Coin text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('0225', coinBadgeX + coinBadgeW - 14, coinBadgeY + 16);

    ctx.restore();`;

const hudReplacement = `    // Coin text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('0225', coinBadgeX + coinBadgeW - 14, coinBadgeY + 16);

    // 3. Pause Notification Banner (when sim.timeSpeed === 0)
    if (this.sim.timeSpeed === 0) {
      const bannerW = 340;
      const bannerH = 34;
      const bannerX = (this.canvas.width - bannerW) / 2;
      const bannerY = 18;

      ctx.save();
      ctx.fillStyle = 'rgba(28, 20, 14, 0.88)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 17);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸️ SIMULATION PAUSED (Press Space to Resume)', this.canvas.width / 2, bannerY + bannerH / 2);
      ctx.restore();
    }

    ctx.restore();`;

if (code.includes(hudTarget)) {
  code = code.replace(hudTarget, hudReplacement);
}

if (isCRLF) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated CanvasRenderer.ts');
