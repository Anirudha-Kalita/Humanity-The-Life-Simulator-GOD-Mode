/**
 * A wandering merchant caravan.
 *
 * The supplied sprite sheet includes a pack camel loaded with trade goods, so
 * the settlement gets an occasional visitor that walks the village road
 * network from one end of the valley to the other.  The caravan is purely
 * cosmetic: it never touches the simulation of the settlers themselves.
 */
export interface CaravanWaypoint {
  x: number;
  y: number;
}

const ROUTE: CaravanWaypoint[] = [
  { x: 250, y: 330 },
  { x: 400, y: 400 },
  { x: 580, y: 600 },
  { x: 1050, y: 720 },
  { x: 1150, y: 850 },
  { x: 1650, y: 530 },
  { x: 2040, y: 540 },
  { x: 2560, y: 560 }
];

export class Caravan {
  /** Current world position of the camel (its feet). */
  public x = 0;
  public y = 0;
  /** 1 when travelling right, -1 when travelling left. */
  public facing: 1 | -1 = 1;
  /** True while the caravan is on the road. */
  public active = false;
  /** True once the caravan has passed the settlement centre this trip. */
  public visitedTown = false;

  /** Height of the drawn sprite in world pixels. */
  public static readonly SPRITE_HEIGHT = 74;

  private readonly speed = 26;
  private route: CaravanWaypoint[] = ROUTE.slice();
  private trips = 0;
  private segment = 0;
  private progress = 0;
  private waitTimer = 45;

  private readonly townX: number;
  private readonly townY: number;

  public constructor(townX: number, townY: number) {
    this.townX = townX;
    this.townY = townY;
    this.snapToStart();
  }

  /**
   * Advance the caravan.  Returns true on the frame the caravan reaches the
   * settlement so the simulation can announce the visit.
   */
  public update(deltaSeconds: number): boolean {
    if (!this.active) {
      this.waitTimer -= deltaSeconds;
      if (this.waitTimer <= 0) {
        this.startTrip();
      }
      return false;
    }

    const from = this.route[this.segment];
    const to = this.route[this.segment + 1];
    const segLength = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    this.progress += (this.speed * deltaSeconds) / segLength;

    while (this.progress >= 1 && this.segment < this.route.length - 2) {
      this.progress -= 1;
      this.segment += 1;
    }

    const a = this.route[this.segment];
    const b = this.route[this.segment + 1];
    this.x = a.x + (b.x - a.x) * this.progress;
    this.y = a.y + (b.y - a.y) * this.progress;
    this.facing = b.x >= a.x ? 1 : -1;

    let arrived = false;
    if (!this.visitedTown && Math.hypot(this.x - this.townX, this.y - this.townY) < 240) {
      this.visitedTown = true;
      arrived = true;
    }

    if (this.segment >= this.route.length - 2 && this.progress >= 1) {
      this.active = false;
      this.waitTimer = 160;
    }

    return arrived;
  }

  private startTrip(): void {
    this.active = true;
    this.visitedTown = false;
    this.segment = 0;
    this.progress = 0;
    // Alternate between the west -> east and east -> west crossings.
    this.trips += 1;
    this.route = this.trips % 2 === 1 ? ROUTE.slice() : ROUTE.slice().reverse();
    this.snapToStart();
  }

  private snapToStart(): void {
    const start = this.route[0];
    this.x = start.x;
    this.y = start.y;
  }
}
