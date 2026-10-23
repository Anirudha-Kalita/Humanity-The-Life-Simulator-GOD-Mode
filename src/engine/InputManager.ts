import { Simulation } from './Simulation';

export interface CameraFollowTarget {
  cameraX: number;
  cameraY: number;
  zoom: number;
}

export class InputManager {
  private sim: Simulation;
  private renderer?: CameraFollowTarget;
  private keys: Record<string, boolean> = {};

  constructor(sim: Simulation, renderer?: CameraFollowTarget) {
    this.sim = sim;
    this.renderer = renderer;
    this.bindKeys();
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  private bindKeys(): void {
    window.addEventListener('keydown', (e) => {
      // Let text fields own their keyboard input completely.
      if (this.isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      this.keys[key] = true;

      // Quick hotkeys (one-shot: ignore auto-repeat from a held key).
      if (e.key === 'Escape') {
        if (this.sim.movingBuilding) {
          this.sim.movingBuilding = null;
          this.sim.addDramaEvent('general', 'Building placement cancelled.', []);
        } else if (this.sim.possessedAgent) {
          const p = this.sim.possessedAgent;
          if (p.data.activeDialog) {
            const partner = this.sim.agents.find(a => a.data.id === p.data.activeDialog!.partnerId);
            p.finishConversation(partner, this.sim.agents);
          }
          this.sim.togglePossession(p);
        } else {
          this.sim.selectedAgent = null;
          this.sim.selectedBuilding = null;
          this.sim.selectedTree = null;
          this.sim.selectedBonfire = false;
        }
        return;
      }

      if (e.repeat) return;

      // Quick interact while possessed
      if (this.sim.possessedAgent) {
        const p = this.sim.possessedAgent;

        // C key: Toggle Sit / Stand
        if (key === 'c') {
          if (p.data.actionState === 'sitting') {
            p.data.actionState = 'idle';
            p.data.thought = 'Standing back up on my feet.';
          } else {
            p.data.actionState = 'sitting';
            p.data.thought = 'Sitting down to rest my legs.';
            p.setBubble('peace', 3);
          }
          return;
        }

        // Z key: Toggle Lay down to sleep / Wake up
        if (key === 'z') {
          if (p.data.actionState === 'sleeping') {
            p.data.actionState = 'idle';
            p.data.thought = 'Waking up from my sleep.';
          } else {
            p.data.actionState = 'sleeping';
            p.data.facing = 'right';
            p.data.thought = 'Laying down to sleep.';
            p.setBubble('sleep', 5);
          }
          return;
        }

        const nearest = this.sim.agents
          .filter(a => a.data.id !== p.data.id)
          .sort((a, b) => 
            Math.hypot(a.data.x - p.data.x, a.data.y - p.data.y) - 
            Math.hypot(b.data.x - p.data.x, b.data.y - p.data.y)
          )[0];

        if (nearest && Math.hypot(nearest.data.x - p.data.x, nearest.data.y - p.data.y) < 60) {
          if (key === 'e') {
            // Friendly Chat
            const msg = p.triggerFriendlyChat(nearest);
            this.sim.addDramaEvent('dialog', msg, [p.data.id, nearest.data.id]);
          } else if (key === 'r') {
            // Flirt
            const msg = p.triggerRomance(nearest);
            this.sim.addDramaEvent('love', msg, [p.data.id, nearest.data.id]);
          } else if (key === 'f') {
            // Attack
            const msg = p.triggerConflict(nearest);
            if (msg) {
              this.sim.addDramaEvent('violence', msg, [p.data.id, nearest.data.id]);
            }
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Dropping focus (alt-tab, clicking outside the page) must not leave a
    // movement key stuck down.
    window.addEventListener('blur', () => {
      this.keys = {};
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.keys = {};
    });
  }

  public update(delta: number): void {
    const possessed = this.sim.possessedAgent;

    // 1. When NOT possessing an agent: Free camera flight / panning across the god sandbox!
    if (!possessed) {
      let camMoveX = 0;
      let camMoveY = 0;

      if (this.keys['w'] || this.keys['arrowup']) camMoveY -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) camMoveY += 1;
      if (this.keys['a'] || this.keys['arrowleft']) camMoveX -= 1;
      if (this.keys['d'] || this.keys['arrowright']) camMoveX += 1;

      if ((camMoveX !== 0 || camMoveY !== 0) && this.renderer) {
        const isFast = !!(this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright']);
        const panSpeed = (isFast ? 1200 : 600) / (this.renderer.zoom || 1);
        const len = Math.hypot(camMoveX, camMoveY);

        this.renderer.cameraX += (camMoveX / len) * panSpeed * delta;
        this.renderer.cameraY += (camMoveY / len) * panSpeed * delta;
        this.renderer.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, this.renderer.cameraX));
        this.renderer.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, this.renderer.cameraY));
      }
      return;
    }

    // 2. When possessing an agent: Direct character control
    let moveX = 0;
    let moveY = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      if (possessed.data.activeDialog) {
        const partner = this.sim.agents.find(a => a.data.id === possessed.data.activeDialog!.partnerId);
        possessed.finishConversation(partner, this.sim.agents);
      }
      const len = Math.hypot(moveX, moveY);
      const isRunning = !!(this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright']);
      const speed = isRunning ? 150 : 75;

      const deltaX = (moveX / len) * speed * delta;
      const deltaY = (moveY / len) * speed * delta;

      // Realistic top-down physics: Water and building collision with sliding
      const newPos = this.sim.world.moveWithPhysics(
        possessed.data.x,
        possessed.data.y,
        deltaX,
        deltaY,
        10
      );
      possessed.data.x = newPos.x;
      possessed.data.y = newPos.y;

      // Facing
      if (Math.abs(moveX) > Math.abs(moveY)) {
        possessed.data.facing = moveX > 0 ? 'right' : 'left';
      } else {
        possessed.data.facing = moveY > 0 ? 'down' : 'up';
      }

      possessed.data.actionState = isRunning ? 'running' : 'walking';
      possessed.data.walkCycle += delta * (isRunning ? 18 : 9);
    } else if (possessed.data.actionState === 'walking' || possessed.data.actionState === 'running') {
      possessed.data.actionState = 'idle';
      possessed.data.walkCycle = 0;
    }

    // 3. Camera smoothly follows possessed agent so the player never walks off-screen!
    if (this.renderer) {
      const followSpeed = Math.min(1, delta * 9);
      this.renderer.cameraX += (possessed.data.x - this.renderer.cameraX) * followSpeed;
      this.renderer.cameraY += (possessed.data.y - this.renderer.cameraY) * followSpeed;
      this.renderer.cameraX = Math.max(100, Math.min(this.sim.world.width - 100, this.renderer.cameraX));
      this.renderer.cameraY = Math.max(100, Math.min(this.sim.world.height - 100, this.renderer.cameraY));
    }
  }
}
