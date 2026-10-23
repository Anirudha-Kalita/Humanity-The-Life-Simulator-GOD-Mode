import type { AgentData } from '../types/simulation';
import { NpcSpriteRenderer } from './NpcSpriteRenderer';

export class SpriteRenderer {
  /**
   * Draws distinct illustrated chibi settlers matching the reference image.
   * Full Situational Animation & 4-Directional Turning:
   * 1. Walking vs Running vs Strolling:
   *    - Walking: steady upright pace with moderate stride.
   *    - Running / Sprinting: athletic forward body lean, rapid pumping arms, wide bounding stride,
   *      wind-blown trailing hair/ribbons/cloaks, and kicking up cartoon dust puffs!
   *    - Triggers situational running during emergencies, starvation, bleeding injury, panic fleeing,
   *      weather storms, romance dashes, or holding SHIFT while possessed!
   * 2. Sitting:
   *    - Lowered torso, folded legs/skirt grounded on floor or bench, hands resting on knees/lap.
   *    - Triggers at campfire circle, feast table veranda at hearth, and resting breaks.
   * 3. Laying Down to Sleep:
   *    - Horizontal woven straw bedroll with wooden trim, plush down feather pillow,
   *      warm patchwork wool quilt tucked to shoulders with stitching lines, gentle breathing bob,
   *      peaceful closed eyes with lashes, and animated Zzz letters drifting softly upward!
   *    - Triggers at night in family cabins, or when collapsing from acute exhaustion.
   * 4. 4-Directional Perspective:
   *    - Down (Front view), Up (Back side view), Left/Right (Side profile view).
   */
  public static drawAgent(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    globalTime: number
  ): void {
    // Use the newly illustrated NPC sprite sheet once the PNGs have loaded.
    // The original procedural art below remains as a seamless fallback for the
    // first frame(s) while assets are decoded.
    if (NpcSpriteRenderer.drawAgent(ctx, agent, globalTime)) {
      return;
    }

    ctx.save();
    ctx.translate(agent.x, agent.y);

    const isFemale = agent.appearance.gender === 'female';
    const scale = agent.appearance.scale || (isFemale ? 0.94 : 1.04);
    ctx.scale(scale, scale);

    const isLyingDown = agent.actionState === 'sleeping' || agent.actionState === 'unconscious' || agent.actionState === 'dead' || agent.isDead;
    const isRunning = agent.actionState === 'running' || agent.actionState === 'fleeing';
    const isWalking = agent.actionState === 'walking' || (agent.targetX !== undefined && agent.targetY !== undefined && !isRunning);
    const isMoving = isWalking || isRunning;

    const isChopping = agent.actionState === 'chopping';
    const isBuilding = agent.actionState === 'building';
    const isForaging = agent.actionState === 'foraging';
    const isFishing = agent.actionState === 'fishing';
    const isEating = agent.actionState === 'eating';
    const isCarrying = agent.actionState === 'carrying' || !!agent.carriedItem;
    const isSitting = agent.actionState === 'sitting';
    const isFighting = agent.actionState === 'fighting';
    const isFlirting = agent.actionState === 'flirting';

    // Divine God aura if possessed
    if (agent.isPossessed) {
      const haloPulse = 1 + 0.12 * Math.sin(globalTime * 0.008);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, isLyingDown ? 0 : -22, 28 * haloPulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // Soft organic drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, isSitting ? 2 : 4, isSitting ? 16 : (isFemale ? 12 : 14), isSitting ? 7 : 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(38, 32, 27, 0.28)';
    ctx.fill();
    ctx.restore();

    // 1. LAYING DOWN TO SLEEP
    if (isLyingDown) {
      this.drawLyingDown(ctx, agent, isFemale, globalTime);
      ctx.restore();
      return;
    }

    // Movement cycles (Brisk walk vs Fast athletic sprint pump)
    const breatheBob = Math.sin(globalTime * 0.004) * 0.6;
    const walkSwing = isMoving ? Math.sin(agent.walkCycle) : 0;
    const walkBob = isMoving ? Math.abs(Math.sin(agent.walkCycle * 2)) * (isRunning ? 3.0 : 2.0) : 0;
    const sittingOffsetY = isSitting ? 6 : 0;
    const facing = agent.facing;

    // Dispatch to directional renderer
    if (facing === 'up') {
      this.drawBackView(
        ctx,
        agent,
        isFemale,
        walkSwing,
        walkBob,
        breatheBob,
        sittingOffsetY,
        isRunning,
        isChopping,
        isBuilding,
        isForaging,
        isFishing,
        isEating,
        isCarrying,
        isFighting,
        isFlirting,
        isSitting,
        globalTime
      );
    } else if (facing === 'left') {
      ctx.save();
      ctx.scale(-1, 1); // Flip horizontally for left view
      this.drawSideView(
        ctx,
        agent,
        isFemale,
        walkSwing,
        walkBob,
        breatheBob,
        sittingOffsetY,
        isRunning,
        isChopping,
        isBuilding,
        isForaging,
        isFishing,
        isEating,
        isCarrying,
        isFighting,
        isFlirting,
        isSitting,
        globalTime
      );
      ctx.restore();
    } else if (facing === 'right') {
      ctx.save();
      this.drawSideView(
        ctx,
        agent,
        isFemale,
        walkSwing,
        walkBob,
        breatheBob,
        sittingOffsetY,
        isRunning,
        isChopping,
        isBuilding,
        isForaging,
        isFishing,
        isEating,
        isCarrying,
        isFighting,
        isFlirting,
        isSitting,
        globalTime
      );
      ctx.restore();
    } else {
      // Default: Front view ('down')
      this.drawFrontView(
        ctx,
        agent,
        isFemale,
        walkSwing,
        walkBob,
        breatheBob,
        sittingOffsetY,
        isRunning,
        isChopping,
        isBuilding,
        isForaging,
        isFishing,
        isEating,
        isCarrying,
        isFighting,
        isFlirting,
        isSitting,
        globalTime
      );
    }

    ctx.restore();
  }

  // ==========================================
  // 1. FRONT VIEW (FACING DOWN)
  // ==========================================
  private static drawFrontView(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    walkSwing: number,
    walkBob: number,
    breatheBob: number,
    sittingOffsetY: number,
    isRunning: boolean,
    isChopping: boolean,
    isBuilding: boolean,
    isForaging: boolean,
    isFishing: boolean,
    isEating: boolean,
    isCarrying: boolean,
    isFighting: boolean,
    isFlirting: boolean,
    isSitting: boolean,
    globalTime: number
  ): void {
    if (isRunning) {
      ctx.translate(0, 2); // Forward sprint drive
      // Dust puffs kicking up at the sides
      ctx.fillStyle = 'rgba(235, 230, 210, 0.45)';
      ctx.beginPath();
      ctx.arc(-11, 14, 3, 0, Math.PI * 2);
      ctx.arc(11, 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cloak back behind
    if (agent.appearance.accessory === 'cloak') {
      this.drawCloakBack(ctx, agent, walkSwing, walkBob, sittingOffsetY);
    }

    // Scout Quiver
    if (agent.id === 'agent_kaelen' || agent.role === 'hunter') {
      this.drawScoutQuiver(ctx, walkBob, sittingOffsetY);
    }

    // Legs, Skirts & Boots
    this.drawFrontLowerBody(ctx, agent, isFemale, walkSwing, walkBob, isSitting, isRunning);

    // Torso, Tunics & Aprons
    this.drawFrontTorso(ctx, agent, isFemale, walkBob, breatheBob, sittingOffsetY, isForaging);

    // Arms & Tools
    this.drawArms(
      ctx,
      agent,
      isFemale,
      walkSwing,
      walkBob,
      sittingOffsetY,
      isRunning,
      isChopping,
      isBuilding,
      isForaging,
      isFishing,
      isEating,
      isCarrying,
      isFighting,
      isFlirting,
      globalTime
    );

    // Head, Eyes, Eyelashes, Beards & Hair
    this.drawFrontHead(ctx, agent, isFemale, walkBob, breatheBob, sittingOffsetY, isEating, isFlirting, isFighting, globalTime);

    // Handheld Props
    if (!isChopping && !isBuilding && !isFishing && !isCarrying) {
      if (agent.id === 'agent_bron' || agent.role === 'elder') {
        this.drawElderStaff(ctx, walkBob, sittingOffsetY, globalTime);
      }
      if (agent.id === 'agent_talia' || (isFemale && agent.role === 'forager')) {
        this.drawWickerBasket(ctx, walkBob, sittingOffsetY);
      }
    }
  }

  // ==========================================
  // 2. BACK VIEW (FACING UP - TRUE BACK SIDE)
  // ==========================================
  private static drawBackView(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    walkSwing: number,
    walkBob: number,
    breatheBob: number,
    sittingOffsetY: number,
    isRunning: boolean,
    isChopping: boolean,
    isBuilding: boolean,
    isForaging: boolean,
    isFishing: boolean,
    isEating: boolean,
    isCarrying: boolean,
    isFighting: boolean,
    isFlirting: boolean,
    isSitting: boolean,
    globalTime: number
  ): void {
    const hair = agent.appearance.hairColor || '#4a2c1b';
    const tunicColor = agent.appearance.shirtColor || '#f1ebe1';
    const pantsColor = agent.appearance.pantsColor || '#292524';
    const bootColor = isFemale ? '#4a321f' : '#6b4028';
    const outlineColor = '#2b2118';
    const headY = -39 - walkBob + breatheBob + sittingOffsetY;
    const torsoY = -29 - walkBob + breatheBob + sittingOffsetY;

    if (isRunning) {
      ctx.translate(0, -2); // Leaning forward into sprint
      // Dust puffs at heels
      ctx.fillStyle = 'rgba(235, 230, 210, 0.45)';
      ctx.beginPath();
      ctx.arc(-8, 14, 3, 0, Math.PI * 2);
      ctx.arc(8, 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. Back Lower Body (Skirt back pleats or Trousers with back pockets)
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.6;

    if (isFemale && (agent.appearance.outfitType === 'dress_apron' || agent.appearance.outfitType === 'skirt_blouse' || !agent.appearance.outfitType)) {
      const dressColor = agent.appearance.dressColor || agent.appearance.shirtColor || '#166534';
      const y = -18 - walkBob;
      const skirtSway = walkSwing * (isRunning ? 5 : 3.5);

      if (isSitting) {
        ctx.fillStyle = dressColor;
        ctx.beginPath();
        ctx.roundRect(-13, -10, 26, 11, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = dressColor;
        ctx.beginPath();
        ctx.moveTo(-6.5, y);
        ctx.lineTo(6.5, y);
        ctx.lineTo(11 + skirtSway, y + 13);
        ctx.quadraticCurveTo(0, y + 15, -11 + skirtSway, y + 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-10 + skirtSway, y + 12);
        ctx.quadraticCurveTo(0, y + 14, 10 + skirtSway, y + 12);
        ctx.stroke();

        ctx.fillStyle = bootColor;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 1.4;
        const lOffset = walkSwing * (isRunning ? 6 : 4);
        const rOffset = -walkSwing * (isRunning ? 6 : 4);
        ctx.fillRect(-6, y + 13 + (lOffset > 0 ? -lOffset * 0.3 : 0), 4, 4);
        ctx.strokeRect(-6, y + 13 + (lOffset > 0 ? -lOffset * 0.3 : 0), 4, 4);
        ctx.fillRect(2, y + 13 + (rOffset > 0 ? -rOffset * 0.3 : 0), 4, 4);
        ctx.strokeRect(2, y + 13 + (rOffset > 0 ? -rOffset * 0.3 : 0), 4, 4);
      }
    } else if (agent.appearance.outfitType === 'robe') {
      const robeColor = agent.appearance.dressColor || '#581c87';
      const y = -20 - walkBob;
      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(-8.5, y);
      ctx.lineTo(8.5, y);
      ctx.lineTo(11, y + 17);
      ctx.lineTo(-11, y + 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      if (isSitting) {
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.roundRect(-10.5, -8, 21, 8, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        const leftSwing = walkSwing * (isRunning ? 9 : 6);
        const rightSwing = -walkSwing * (isRunning ? 9 : 6);

        ctx.fillStyle = pantsColor;
        ctx.fillRect(-7.5, -14 - walkBob + (leftSwing > 0 ? -leftSwing * 0.2 : 0), 6.5, 11);
        ctx.strokeRect(-7.5, -14 - walkBob + (leftSwing > 0 ? -leftSwing * 0.2 : 0), 6.5, 11);
        ctx.fillRect(1, -14 - walkBob + (rightSwing > 0 ? -rightSwing * 0.2 : 0), 6.5, 11);
        ctx.strokeRect(1, -14 - walkBob + (rightSwing > 0 ? -rightSwing * 0.2 : 0), 6.5, 11);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-6, -12 - walkBob, 3.5, 4);
        ctx.strokeRect(2.5, -12 - walkBob, 3.5, 4);

        ctx.fillStyle = bootColor;
        ctx.fillRect(-8.5, -4 - walkBob + (leftSwing > 0 ? -leftSwing * 0.2 : 0), 8.5, 5.5);
        ctx.strokeRect(-8.5, -4 - walkBob + (leftSwing > 0 ? -leftSwing * 0.2 : 0), 8.5, 5.5);
        ctx.fillRect(0, -4 - walkBob + (rightSwing > 0 ? -rightSwing * 0.2 : 0), 8.5, 5.5);
        ctx.strokeRect(0, -4 - walkBob + (rightSwing > 0 ? -rightSwing * 0.2 : 0), 8.5, 5.5);
      }
    }
    ctx.restore();

    // 2. Back Torso
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;
    const width = isFemale ? 13 : 18;

    ctx.fillStyle = tunicColor;
    ctx.beginPath();
    ctx.roundRect(-width / 2, torsoY, width, 16, [4, 4, 3, 3]);
    ctx.fill();
    ctx.stroke();

    if (agent.id === 'agent_rowan' || (agent.role === 'lumberjack' && !isFemale)) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-width / 2, torsoY + 4, width, 3);
      ctx.fillRect(-width / 2, torsoY + 10, width, 3);
      ctx.fillRect(-3, torsoY, 6, 16);
    }

    if (isFemale && agent.appearance.apronColor) {
      ctx.fillStyle = agent.appearance.apronColor;
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.4;

      ctx.fillRect(-5.5, torsoY + 1, 2.5, 10);
      ctx.strokeRect(-5.5, torsoY + 1, 2.5, 10);
      ctx.fillRect(3, torsoY + 1, 2.5, 10);
      ctx.strokeRect(3, torsoY + 1, 2.5, 10);

      ctx.fillRect(-width / 2, torsoY + 10, width, 2.5);

      // CUTE WHITE TIED APRON RIBBON BOW IN CENTER OF BACK!
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-3.5, torsoY + 11, 3.2, 2.2, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(3.5, torsoY + 11, 3.2, 2.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, torsoY + 11, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1, torsoY + 12); ctx.lineTo(-3, torsoY + 18);
      ctx.moveTo(1, torsoY + 12); ctx.lineTo(3, torsoY + 18);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#4a2c1b';
      ctx.fillRect(-width / 2, torsoY + 10, width, 3.5);
      ctx.strokeRect(-width / 2, torsoY + 10, width, 3.5);

      ctx.strokeStyle = '#4a2c1b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-5, torsoY); ctx.lineTo(0, torsoY + 6);
      ctx.moveTo(5, torsoY); ctx.lineTo(0, torsoY + 6);
      ctx.moveTo(0, torsoY + 6); ctx.lineTo(0, torsoY + 10);
      ctx.stroke();
    }

    if (agent.id === 'agent_kaelen' || agent.role === 'hunter') {
      this.drawScoutQuiver(ctx, walkBob, sittingOffsetY);
    }

    if (agent.appearance.accessory === 'cloak' || agent.id === 'agent_bron') {
      this.drawCloakBack(ctx, agent, walkSwing, walkBob, sittingOffsetY);
    }

    ctx.restore();

    // 3. Back Arms
    this.drawArms(
      ctx,
      agent,
      isFemale,
      walkSwing,
      walkBob,
      sittingOffsetY,
      isRunning,
      isChopping,
      isBuilding,
      isForaging,
      isFishing,
      isEating,
      isCarrying,
      isFighting,
      isFlirting,
      globalTime
    );

    // 4. Back Head & Hair (NO Face Features!)
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, headY, isFemale ? 12 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = agent.appearance.skinColor;
    ctx.fillRect(-3, headY + 7, 6, 3.5);

    const style = agent.appearance.hairStyle;

    if (style === 'ponytail' || agent.id === 'agent_talia') {
      const sway = isRunning ? Math.sin(globalTime * 0.015) * 8 : Math.sin(globalTime * 0.007) * 4;

      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(-4, headY - 8);
      ctx.quadraticCurveTo(-6 + sway, headY + 4, -4 + sway, headY + 18);
      ctx.lineTo(4 + sway, headY + 18);
      ctx.quadraticCurveTo(6 + sway, headY + 4, 4, headY - 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-3, headY - 8, 3, 2, -0.3, 0, Math.PI * 2);
      ctx.ellipse(3, headY - 8, 3, 2, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(8, headY - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'bun' || agent.id === 'agent_aria') {
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(0, headY - 14, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-8, headY - 15); ctx.lineTo(8, headY - 12);
      ctx.stroke();
    } else if (style === 'braids') {
      ctx.fillStyle = hair;
      ctx.fillRect(-11, headY - 1, 3.5, 16);
      ctx.strokeRect(-11, headY - 1, 3.5, 16);
      ctx.fillRect(7.5, headY - 1, 3.5, 16);
      ctx.strokeRect(7.5, headY - 1, 3.5, 16);
    } else if (agent.id === 'agent_bron' || agent.appearance.facialHair === 'mustache') {
      // Grey mustache matching pixel art sprite
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(0, headY + 5, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (agent.role === 'elder') {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-10, headY);
      ctx.lineTo(-9, headY + 14);
      ctx.quadraticCurveTo(0, headY + 18, 9, headY + 14);
      ctx.lineTo(10, headY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (agent.id === 'agent_kaelen' || agent.role === 'hunter') {
      // Royal blue watchman / hunter peaked cap with gold emblem
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(0, headY - 4, 11, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, headY - 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (agent.id === 'agent_finn' || agent.appearance.accessory === 'hat') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, headY - 4, 11, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-10, headY - 5, 20, 4.5, 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // 3. SIDE VIEW (FACING LEFT / RIGHT)
  // ==========================================
  private static drawSideView(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    walkSwing: number,
    walkBob: number,
    breatheBob: number,
    sittingOffsetY: number,
    isRunning: boolean,
    isChopping: boolean,
    isBuilding: boolean,
    isForaging: boolean,
    isFishing: boolean,
    isEating: boolean,
    isCarrying: boolean,
    isFighting: boolean,
    isFlirting: boolean,
    isSitting: boolean,
    globalTime: number
  ): void {
    const hair = agent.appearance.hairColor || '#4a2c1b';
    const tunicColor = agent.appearance.shirtColor || '#f1ebe1';
    const pantsColor = agent.appearance.pantsColor || '#292524';
    const bootColor = isFemale ? '#4a321f' : '#6b4028';
    const outlineColor = '#2b2118';
    const headY = -39 - walkBob + breatheBob + sittingOffsetY;
    const torsoY = -29 - walkBob + breatheBob + sittingOffsetY;
    const isHunting = agent.actionState === 'hunting';

    // Running Forward Athletic Lean & Kicking Dust Puffs
    if (isRunning) {
      ctx.rotate(0.14);
      ctx.fillStyle = 'rgba(235, 230, 210, 0.45)';
      ctx.beginPath();
      ctx.arc(-15, 14, 3.5, 0, Math.PI * 2);
      ctx.arc(-20, 12, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. Scissors Stepping Legs (Forward leg and backward leg in stride)
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.6;

    const strideAmp = isRunning ? 10 : 7;
    const fwdSwing = walkSwing * strideAmp;
    const backSwing = -walkSwing * strideAmp;

    if (isSitting) {
      if (isFemale) {
        ctx.fillStyle = agent.appearance.dressColor || agent.appearance.shirtColor || '#166534';
        ctx.beginPath();
        ctx.roundRect(-8, -8, 16, 8, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = bootColor;
        ctx.fillRect(4, -3, 5, 4);
        ctx.strokeRect(4, -3, 5, 4);
      } else {
        ctx.fillStyle = pantsColor;
        ctx.beginPath();
        ctx.roundRect(-8, -8, 16, 8, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = bootColor;
        ctx.fillRect(5, -3, 5, 4);
        ctx.strokeRect(5, -3, 5, 4);
      }
    } else if (isFemale && (agent.appearance.outfitType === 'dress_apron' || agent.appearance.outfitType === 'skirt_blouse' || !agent.appearance.outfitType)) {
      const dressColor = agent.appearance.dressColor || agent.appearance.shirtColor || '#166534';
      const y = -18 - walkBob;

      ctx.fillStyle = dressColor;
      ctx.beginPath();
      ctx.moveTo(-5, y);
      ctx.lineTo(5, y);
      ctx.lineTo(8 + fwdSwing * 0.4, y + 13);
      ctx.lineTo(-8 + backSwing * 0.4, y + 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bootColor;
      ctx.beginPath();
      ctx.roundRect(1 + fwdSwing, y + 13, 6, 4.5, [2, 2, 1, 1]);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(-7 + backSwing, y + 13, 6, 4.5, [2, 2, 1, 1]);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = pantsColor;

      ctx.fillRect(-1 + fwdSwing, -14 - walkBob, 6, 11);
      ctx.strokeRect(-1 + fwdSwing, -14 - walkBob, 6, 11);

      ctx.fillStyle = bootColor;
      ctx.beginPath();
      ctx.roundRect(-1 + fwdSwing, -4 - walkBob, 8, 5.5, [2, 2, 1, 1]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pantsColor;
      ctx.fillRect(-6 + backSwing, -14 - walkBob, 6, 11);
      ctx.strokeRect(-6 + backSwing, -14 - walkBob, 6, 11);

      ctx.fillStyle = bootColor;
      ctx.beginPath();
      ctx.roundRect(-7 + backSwing, -4 - walkBob, 8, 5.5, [2, 2, 1, 1]);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 2. Side Torso
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;
    const profileW = isFemale ? 11 : 14;

    ctx.fillStyle = tunicColor;
    ctx.beginPath();
    ctx.roundRect(-profileW / 2, torsoY, profileW, 16, [4, 4, 3, 3]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a2c1b';
    ctx.fillRect(-profileW / 2, torsoY + 10, profileW, 3.5);
    ctx.strokeRect(-profileW / 2, torsoY + 10, profileW, 3.5);

    if (isFemale && agent.appearance.apronColor) {
      ctx.fillStyle = agent.appearance.apronColor;
      ctx.fillRect(0, torsoY + 2, 3, 14);
      ctx.strokeRect(0, torsoY + 2, 3, 14);

      if (agent.id === 'agent_talia' || agent.role === 'forager') {
        this.drawWickerBasket(ctx, walkBob, sittingOffsetY);
      }
    }

    if (agent.id === 'agent_kaelen' || agent.role === 'hunter') {
      ctx.save();
      ctx.translate(-8, torsoY + 4);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#6b4028';
      ctx.fillRect(-2, -2, 5, 18);
      ctx.strokeRect(-2, -2, 5, 18);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, -7, 4, 5);
      ctx.restore();
    }

    ctx.restore();

    // 3. Side Arms & Tool Actions
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.6;

    if (isChopping) {
      const chopAngle = Math.sin(globalTime * 0.009) > 0.4 ? Math.PI / 4 : -Math.PI / 4;
      ctx.translate(4, torsoY + 2);
      ctx.rotate(chopAngle);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1.5, 0, 3, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(1, 16, 8, 6);
      ctx.strokeRect(1, 16, 8, 6);
    } else if (isBuilding) {
      const strikeAngle = Math.sin(globalTime * 0.012) > 0.4 ? Math.PI / 3 : -Math.PI / 4;
      ctx.translate(4, torsoY + 2);
      ctx.rotate(strikeAngle);
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-1.5, 0, 3, 18);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(1, 13, 7, 5);
      ctx.strokeRect(1, 13, 7, 5);
    } else if (isFishing) {
      ctx.fillStyle = '#6b4028';
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(3, torsoY + 6);
      ctx.lineTo(26, torsoY - 12);
      ctx.stroke();
    } else if (isHunting) {
      // Aiming Hunting Bow forward with drawn arrow
      const aimWobble = Math.sin(globalTime * 0.008) * 1.5;
      ctx.translate(6, torsoY + 2 + aimWobble);
      // Bow curved stave
      ctx.strokeStyle = '#5a3825';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(8, 0, 14, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      // Bowstring drawn back
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(8 + Math.cos(-Math.PI * 0.45) * 14, Math.sin(-Math.PI * 0.45) * 14);
      ctx.lineTo(2, 0);
      ctx.lineTo(8 + Math.cos(Math.PI * 0.45) * 14, Math.sin(Math.PI * 0.45) * 14);
      ctx.stroke();

      // Nocked arrow
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(13, -2.5);
      ctx.lineTo(13, 2.5);
      ctx.closePath();
      ctx.fill();
    } else if (isForaging) {
      ctx.fillStyle = agent.appearance.shirtColor || '#f1ebe1';
      ctx.fillRect(0, torsoY + 4, 8, 4);
      ctx.strokeRect(0, torsoY + 4, 8, 4);
      ctx.fillStyle = agent.appearance.skinColor;
      ctx.beginPath();
      ctx.arc(8, torsoY + 11, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (isEating) {
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.arc(6, torsoY + 5, 4.5, 0, Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (isCarrying) {
      ctx.fillStyle = agent.appearance.shirtColor || '#f1ebe1';
      ctx.fillRect(2, torsoY + 4, 7, 4);
      ctx.strokeRect(2, torsoY + 4, 7, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, torsoY + 1, 14, 8);
      ctx.strokeRect(8, torsoY + 1, 14, 8);
    } else if (isFighting) {
      const punchX = Math.sin(globalTime * 0.035) > 0 ? 12 : 5;
      ctx.fillStyle = agent.appearance.shirtColor || '#f1ebe1';
      ctx.fillRect(0, torsoY + 3, punchX, 4.5);
      ctx.strokeRect(0, torsoY + 3, punchX, 4.5);
      ctx.fillStyle = agent.appearance.skinColor;
      ctx.beginPath();
      ctx.arc(punchX, torsoY + 5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isFlirting) {
      ctx.fillStyle = agent.appearance.skinColor;
      ctx.beginPath();
      ctx.arc(5, torsoY + 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (agent.actionState === 'talking') {
      // Forward arm extended in friendly handshake / conversational reach ("hand")
      const handGesture = Math.sin(globalTime * 0.015) * 3;
      ctx.translate(4, torsoY + 4);
      ctx.rotate(-0.4 + handGesture * 0.08);
      ctx.fillStyle = tunicColor;
      ctx.fillRect(-1.5, 0, 3.5, 9);
      ctx.strokeRect(-1.5, 0, 3.5, 9);
      ctx.fillStyle = agent.appearance.skinColor;
      ctx.beginPath();
      ctx.arc(0, 10, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      const armAmp = isRunning ? 12 : 8;
      const armSwing = -walkSwing * armAmp;
      ctx.fillStyle = agent.appearance.shirtColor || '#f1ebe1';
      ctx.fillRect(-2, torsoY + 2, 4, 8);
      ctx.strokeRect(-2, torsoY + 2, 4, 8);

      ctx.fillStyle = agent.appearance.skinColor;
      ctx.beginPath();
      ctx.arc(armSwing * 0.6, torsoY + 11, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 4. Side Head & Profile Features
    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, headY, isFemale ? 11.5 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Profile Face Flesh (Protruding forward at right side)
    ctx.fillStyle = agent.appearance.skinColor;
    ctx.beginPath();
    ctx.moveTo(-2, headY - 7);
    ctx.lineTo(4, headY - 7);
    ctx.lineTo(8.5, headY + 0.5); // Cute button nose
    ctx.lineTo(5.5, headY + 2.5);
    ctx.lineTo(6.5, headY + 4.5);
    ctx.lineTo(4.5, headY + 8);
    ctx.lineTo(-4, headY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Single Profile Eye & Cat-Eye Lashes
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.ellipse(3.5, headY - 1, isFemale ? 2 : 1.8, isFemale ? 3 : 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4.2, headY - 2, 0.9, 0, Math.PI * 2);
    ctx.fill();

    if (isFemale) {
      ctx.strokeStyle = '#2b2118';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(5, headY - 3);
      ctx.lineTo(7.5, headY - 4.5);
      ctx.stroke();
    } else {
      ctx.strokeStyle = hair;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, headY - 4); ctx.lineTo(6.5, headY - 3.5);
      ctx.stroke();
    }

    ctx.fillStyle = isFemale ? 'rgba(244, 114, 182, 0.45)' : 'rgba(235, 95, 80, 0.28)';
    ctx.beginPath();
    ctx.arc(2.5, headY + 3.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (!isFemale && agent.appearance.facialHair && agent.appearance.facialHair !== 'none') {
      ctx.fillStyle = hair;
      if (agent.appearance.facialHair === 'full_beard' || agent.id === 'agent_bron') {
        ctx.beginPath();
        ctx.moveTo(2, headY + 3);
        ctx.lineTo(8, headY + 6);
        ctx.quadraticCurveTo(10, headY + 16, 2, headY + 22);
        ctx.lineTo(-4, headY + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (agent.appearance.facialHair === 'beard') {
        ctx.beginPath();
        ctx.moveTo(0, headY + 3);
        ctx.lineTo(7, headY + 5);
        ctx.lineTo(5, headY + 11);
        ctx.lineTo(-3, headY + 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (agent.appearance.facialHair === 'stubble') {
        ctx.fillStyle = 'rgba(43, 33, 24, 0.28)';
        ctx.fillRect(0, headY + 3, 5.5, 5.5);
      }
    }

    if (agent.appearance.hairStyle === 'ponytail' || agent.id === 'agent_talia') {
      const sway = isRunning ? Math.sin(globalTime * 0.015) * 8 - 4 : Math.sin(globalTime * 0.007) * 4;
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(-5, headY - 8);
      ctx.quadraticCurveTo(-14 + sway, headY - 2, -14 + sway, headY + 11);
      ctx.lineTo(-8 + sway, headY + 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-5, headY - 8, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (agent.appearance.hairStyle === 'bun' || agent.id === 'agent_aria') {
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(-4, headY - 13, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (agent.id === 'agent_finn' || agent.appearance.accessory === 'hat') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(-1, headY - 7, 10, 4.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // HELPER COMPONENTS FOR FRONT VIEW
  // ==========================================

  private static drawFrontLowerBody(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    swing: number,
    bob: number,
    isSitting: boolean,
    isRunning: boolean
  ): void {
    const pantsColor = agent.appearance.pantsColor || '#292524';
    const bootColor = isFemale ? '#4a321f' : '#6b4028';
    const outlineColor = '#2b2118';

    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    if (isFemale && (agent.appearance.outfitType === 'dress_apron' || agent.appearance.outfitType === 'skirt_blouse' || !agent.appearance.outfitType)) {
      const dressColor = agent.appearance.dressColor || agent.appearance.shirtColor || '#166534';
      const y = -18 - bob;
      const skirtSway = swing * (isRunning ? 5 : 3.5);

      if (isSitting) {
        ctx.fillStyle = dressColor;
        ctx.beginPath();
        ctx.roundRect(-13, -10, 26, 11, 5);
        ctx.fill();
        ctx.stroke();
        return;
      }

      ctx.fillStyle = dressColor;
      ctx.beginPath();
      ctx.moveTo(-6.5, y);
      ctx.lineTo(6.5, y);
      ctx.lineTo(11 + skirtSway, y + 13);
      ctx.quadraticCurveTo(0, y + 15, -11 + skirtSway, y + 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-10 + skirtSway, y + 12);
      ctx.quadraticCurveTo(0, y + 14, 10 + skirtSway, y + 12);
      ctx.stroke();

      ctx.fillStyle = bootColor;
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.4;
      const lOffset = swing * (isRunning ? 6 : 4);
      const rOffset = -swing * (isRunning ? 6 : 4);

      ctx.fillRect(-6, y + 13 + (lOffset > 0 ? -lOffset * 0.3 : 0), 4, 4);
      ctx.strokeRect(-6, y + 13 + (lOffset > 0 ? -lOffset * 0.3 : 0), 4, 4);
      ctx.fillRect(2, y + 13 + (rOffset > 0 ? -rOffset * 0.3 : 0), 4, 4);
      ctx.strokeRect(2, y + 13 + (rOffset > 0 ? -rOffset * 0.3 : 0), 4, 4);
      ctx.restore();
      return;
    }

    if (agent.appearance.outfitType === 'robe') {
      const robeColor = agent.appearance.dressColor || '#581c87';
      const y = -20 - bob;
      ctx.fillStyle = robeColor;
      ctx.beginPath();
      ctx.moveTo(-8.5, y);
      ctx.lineTo(8.5, y);
      ctx.lineTo(11, y + 17);
      ctx.lineTo(-11, y + 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-11, y + 14, 22, 2.5);
      ctx.restore();
      return;
    }

    // Male Trousers
    if (isSitting) {
      ctx.fillStyle = pantsColor;
      ctx.beginPath();
      ctx.roundRect(-10.5, -8, 21, 8, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = bootColor;
      ctx.fillRect(-12.5, -4, 6, 6);
      ctx.strokeRect(-12.5, -4, 6, 6);
      ctx.fillRect(6.5, -4, 6, 6);
      ctx.strokeRect(6.5, -4, 6, 6);
      ctx.restore();
      return;
    }

    const leftSwing = swing * (isRunning ? 9 : 6);
    const rightSwing = -swing * (isRunning ? 9 : 6);

    ctx.fillStyle = pantsColor;
    ctx.fillRect(-7.5, -14 - bob + (leftSwing > 0 ? -leftSwing * 0.2 : 0), 6.5, 11);
    ctx.strokeRect(-7.5, -14 - bob + (leftSwing > 0 ? -leftSwing * 0.2 : 0), 6.5, 11);

    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(-8.5, -4 - bob + (leftSwing > 0 ? -leftSwing * 0.2 : 0), 8.5, 5.5, [2, 2, 1, 1]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = pantsColor;
    ctx.fillRect(1, -14 - bob + (rightSwing > 0 ? -rightSwing * 0.2 : 0), 6.5, 11);
    ctx.strokeRect(1, -14 - bob + (rightSwing > 0 ? -rightSwing * 0.2 : 0), 6.5, 11);

    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(0, -4 - bob + (rightSwing > 0 ? -rightSwing * 0.2 : 0), 8.5, 5.5, [2, 2, 1, 1]);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private static drawFrontTorso(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    bob: number,
    breathe: number,
    sittingOffset: number,
    isForaging: boolean
  ): void {
    const tunicColor = agent.appearance.shirtColor || '#f1ebe1';
    const outlineColor = '#2b2118';
    let y = -29 - bob + breathe + sittingOffset;

    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    if (isForaging) {
      ctx.translate(0, y + 8);
      ctx.rotate(Math.PI / 7);
      y = -8;
    }

    const width = isFemale ? 13 : 18;

    ctx.fillStyle = tunicColor;
    ctx.beginPath();
    ctx.roundRect(-width / 2, y, width, 16, [4, 4, 3, 3]);
    ctx.fill();
    ctx.stroke();

    if (agent.id === 'agent_rowan' || (agent.role === 'lumberjack' && !isFemale)) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-width / 2, y + 4, width, 3);
      ctx.fillRect(-width / 2, y + 10, width, 3);
      ctx.fillRect(-3, y, 6, 16);
    }

    if (isFemale && agent.appearance.apronColor) {
      ctx.fillStyle = agent.appearance.apronColor;
      ctx.beginPath();
      ctx.roundRect(-5.5, y + 2, 11, 14, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillRect(-6.5, y + 2, 2.5, 9);
      ctx.fillRect(4, y + 2, 2.5, 9);

      if (agent.id === 'agent_aria' || agent.role === 'cook') {
        ctx.fillStyle = '#ebd5b3';
        ctx.fillRect(-4, y + 8, 8, 6);
        ctx.strokeRect(-4, y + 8, 8, 6);

        ctx.fillStyle = '#a16207';
        ctx.fillRect(0, y + 3, 2, 6);
        ctx.beginPath();
        ctx.arc(1, y + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#4a2c1b';
      ctx.fillRect(-width / 2, y + 10, width, 3.5);
      ctx.strokeRect(-width / 2, y + 10, width, 3.5);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(-2.5, y + 9.5, 5, 4.5);
      ctx.strokeRect(-2.5, y + 9.5, 5, 4.5);
    }

    if (agent.id === 'agent_aria') {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(-4, y); ctx.lineTo(4, y); ctx.lineTo(0, y + 4.5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = agent.appearance.skinColor;
      ctx.beginPath();
      ctx.moveTo(-3, y); ctx.lineTo(3, y); ctx.lineTo(0, y + (isFemale ? 3.5 : 4.5));
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawFrontHead(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    bob: number,
    breathe: number,
    sittingOffset: number,
    isEating: boolean,
    isFlirting: boolean,
    isFighting: boolean,
    globalTime: number
  ): void {
    const skin = agent.appearance.skinColor || '#f8d7b8';
    const hair = agent.appearance.hairColor || '#4a2c1b';
    const outlineColor = '#2b2118';
    const headY = -39 - bob + breathe + sittingOffset;

    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, headY, isFemale ? 12 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = skin;
    ctx.beginPath();
    if (isFemale) {
      ctx.roundRect(-8, headY - 8, 16, 17, [7, 7, 9, 9]);
    } else {
      ctx.roundRect(-9, headY - 8, 18, 18, [6, 6, 6, 6]);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(isFemale ? -8.5 : -9.5, headY + 1, 2.3, 0, Math.PI * 2);
    ctx.arc(isFemale ? 8.5 : 9.5, headY + 1, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const blink = (globalTime * 0.001) % 3.5;
    const isBlinking = blink > 3.35;

    ctx.fillStyle = isFlirting ? 'rgba(239, 68, 68, 0.65)' : (isFemale ? 'rgba(244, 114, 182, 0.48)' : 'rgba(235, 95, 80, 0.28)');
    ctx.beginPath();
    ctx.arc(-5.5, headY + 3.2, isFemale ? 3.2 : 2.5, 0, Math.PI * 2);
    ctx.arc(5.5, headY + 3.2, isFemale ? 3.2 : 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (!isFemale) {
      ctx.strokeStyle = agent.appearance.hairColor || '#2b2118';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (agent.id === 'agent_bron') {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.4;
        ctx.moveTo(-6.5, headY - 4); ctx.lineTo(-2, headY - 3.5);
        ctx.moveTo(2, headY - 3.5); ctx.lineTo(6.5, headY - 4);
      } else {
        ctx.moveTo(-6.5, headY - 3.5); ctx.lineTo(-2, headY - 3);
        ctx.moveTo(2, headY - 3); ctx.lineTo(6.5, headY - 3.5);
      }
      ctx.stroke();
    }

    if (isBlinking) {
      ctx.strokeStyle = '#2b2118';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-6, headY); ctx.lineTo(-2.5, headY);
      ctx.moveTo(2.5, headY); ctx.lineTo(6, headY);
      ctx.stroke();

      if (isFemale) {
        ctx.beginPath();
        ctx.moveTo(-6, headY); ctx.lineTo(-8, headY - 2);
        ctx.moveTo(6, headY); ctx.lineTo(8, headY - 2);
        ctx.stroke();
      }
    } else if (isFighting) {
      ctx.fillStyle = '#2b2118';
      ctx.fillRect(-6, headY - 1, 3.5, 2);
      ctx.fillRect(2.5, headY - 1, 3.5, 2);
    } else {
      ctx.fillStyle = '#2b2118';
      ctx.beginPath();
      ctx.ellipse(-4, headY - 0.5, isFemale ? 2.3 : 2.0, isFemale ? 3.2 : 2.8, 0, 0, Math.PI * 2);
      ctx.ellipse(4, headY - 0.5, isFemale ? 2.3 : 2.0, isFemale ? 3.2 : 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3.5, headY - 1.5, 1, 0, Math.PI * 2);
      ctx.arc(4.5, headY - 1.5, 1, 0, Math.PI * 2);
      ctx.fill();

      if (isFemale) {
        ctx.strokeStyle = '#2b2118';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5.5, headY - 2.5); ctx.lineTo(-8.5, headY - 3.8);
        ctx.moveTo(-5, headY - 3.2); ctx.lineTo(-7.5, headY - 5.0);
        ctx.moveTo(5.5, headY - 2.5); ctx.lineTo(8.5, headY - 3.8);
        ctx.moveTo(5, headY - 3.2); ctx.lineTo(7.5, headY - 5.0);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#c98a64';
    ctx.beginPath();
    ctx.arc(0, headY + 1.5, 1, 0, Math.PI * 2);
    ctx.fill();

    if (!isFemale && agent.appearance.facialHair && agent.appearance.facialHair !== 'none') {
      this.drawFacialHair(ctx, agent.appearance.facialHair, hair, headY);
    }

    ctx.strokeStyle = '#3d2516';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (isEating) {
      const chew = (Math.sin(globalTime * 0.015) + 1) * 1.5;
      ctx.arc(0, headY + 4, chew, 0, Math.PI * 2);
      ctx.stroke();
    } else if (isFlirting) {
      ctx.arc(0, headY + 3.5, 2.6, 0.2, Math.PI - 0.2, false);
      ctx.stroke();
    } else if (agent.actionState === 'talking') {
      const talkMouth = Math.sin(globalTime * 0.02);
      if (talkMouth > 0.15) {
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.ellipse(0, headY + 4.5, 2.4, 2.0, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.arc(0, headY + 3.5, 2.4, 0.1, Math.PI - 0.1, false);
        ctx.stroke();
      }
    } else {
      ctx.arc(0, headY + 3.5, 2.2, 0.1, Math.PI - 0.1, false);
      ctx.stroke();
    }

    this.drawFrontHair(ctx, agent, isFemale, hair, headY, globalTime);

    ctx.restore();
  }

  private static drawFrontHair(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    hairColor: string,
    headY: number,
    globalTime: number
  ): void {
    const style = agent.appearance.hairStyle;
    const outlineColor = '#2b2118';

    ctx.save();
    ctx.fillStyle = hairColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.8;

    if (style === 'ponytail' || agent.id === 'agent_talia') {
      const sway = Math.sin(globalTime * 0.007) * 4;
      ctx.beginPath();
      ctx.moveTo(3, headY - 10);
      ctx.quadraticCurveTo(15 + sway, headY - 4, 14 + sway, headY + 12);
      ctx.lineTo(8 + sway, headY + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(3, headY - 10, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (agent.appearance.accessory === 'flower' || agent.id === 'agent_talia') {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(7.5, headY - 8, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(7.5, headY - 8, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (style === 'bun' || agent.id === 'agent_aria') {
      ctx.beginPath();
      ctx.arc(0, headY - 13.5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-7, headY - 15); ctx.lineTo(7, headY - 12);
      ctx.stroke();
    }

    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(-9.5, headY - 3);
    ctx.quadraticCurveTo(-6, headY - 12, 0, headY - 10);
    ctx.quadraticCurveTo(6, headY - 12, 9.5, headY - 3);
    ctx.quadraticCurveTo(8, headY - 1, 5, headY - 4);
    ctx.quadraticCurveTo(0, headY - 2, -5, headY - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isFemale && (agent.appearance.accessory === 'headband' || agent.id === 'agent_kaelen')) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-9.5, headY - 5); ctx.lineTo(9.5, headY - 5);
      ctx.stroke();
    } else if (!isFemale && (agent.appearance.accessory === 'hat' || agent.id === 'agent_finn')) {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, headY - 9, 11, 5, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-10, headY - 9, 20, 4, 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawFacialHair(
    ctx: CanvasRenderingContext2D,
    type: 'stubble' | 'beard' | 'full_beard' | 'mustache',
    hairColor: string,
    headY: number
  ): void {
    ctx.save();
    ctx.fillStyle = hairColor;
    ctx.strokeStyle = '#261b14';
    ctx.lineWidth = 1.6;

    if (type === 'full_beard') {
      ctx.beginPath();
      ctx.moveTo(-9, headY + 2);
      ctx.quadraticCurveTo(-11, headY + 15, -4, headY + 22);
      ctx.quadraticCurveTo(0, headY + 25, 4, headY + 22);
      ctx.quadraticCurveTo(11, headY + 15, 9, headY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'beard') {
      ctx.beginPath();
      ctx.moveTo(-9, headY + 2);
      ctx.quadraticCurveTo(-8, headY + 11, 0, headY + 12);
      ctx.quadraticCurveTo(8, headY + 11, 9, headY + 2);
      ctx.quadraticCurveTo(0, headY + 5.5, -9, headY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'stubble') {
      ctx.fillStyle = 'rgba(43, 33, 24, 0.28)';
      ctx.beginPath();
      ctx.roundRect(-7, headY + 2, 14, 7, 3);
      ctx.fill();
    } else if (type === 'mustache') {
      ctx.beginPath();
      ctx.arc(-2.5, headY + 3, 2, Math.PI, 0);
      ctx.arc(2.5, headY + 3, 2, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawArms(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    swing: number,
    bob: number,
    sittingOffset: number,
    isRunning: boolean,
    isChopping: boolean,
    isBuilding: boolean,
    isForaging: boolean,
    isFishing: boolean,
    isEating: boolean,
    isCarrying: boolean,
    isFighting: boolean,
    isFlirting: boolean,
    globalTime: number
  ): void {
    const skin = agent.appearance.skinColor;
    const sleeve = agent.appearance.shirtColor || '#f1ebe1';
    const outlineColor = '#2b2118';
    const y = -26 - bob + sittingOffset;
    const armW = isFemale ? 3.5 : 4.5;

    ctx.save();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    if (isBuilding) {
      const strikeCycle = (globalTime * 0.012) % (Math.PI * 2);
      const isStriking = Math.sin(strikeCycle) > 0.4;
      const angle = isStriking ? Math.PI / 3 : -Math.PI / 4;

      ctx.save();
      ctx.translate(3, y + 2);
      ctx.rotate(angle);
      ctx.fillStyle = sleeve;
      ctx.fillRect(-armW / 2, 0, armW, 8);
      ctx.strokeRect(-armW / 2, 0, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(-1.5, 0, 3, 17);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-5, 14, 10, 5);
      ctx.strokeRect(-5, 14, 10, 5);
      ctx.restore();
      ctx.restore();
      return;
    }

    if (isChopping) {
      const chopCycle = (globalTime * 0.009) % (Math.PI * 2);
      const isStriking = Math.sin(chopCycle) > 0.45;
      const angle = isStriking ? Math.PI / 4 : -Math.PI / 3;

      ctx.save();
      ctx.translate(2, y + 2);
      ctx.rotate(angle);
      ctx.fillStyle = sleeve;
      ctx.fillRect(-3, 0, 6, 10);
      ctx.strokeRect(-3, 0, 6, 10);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, 12, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -4, 4, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(-9, -4); ctx.lineTo(7, -8); ctx.lineTo(7, 2); ctx.lineTo(-9, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      return;
    }

    if (isFishing) {
      const bobFloat = Math.sin(globalTime * 0.005) * 2;
      ctx.fillStyle = sleeve;
      ctx.fillRect(5, y, armW, 8);
      ctx.strokeRect(5, y, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(7, y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#6b4028';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(7, y + 8);
      ctx.quadraticCurveTo(22, y - 8, 34, y - 14);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(34, y - 14);
      ctx.lineTo(42, y + 12 + bobFloat);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(42, y + 12 + bobFloat, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (isForaging) {
      const reach = Math.sin(globalTime * 0.01) * 3;
      ctx.fillStyle = sleeve;
      ctx.fillRect(-10, y + 3, armW, 10);
      ctx.fillRect(6, y + 3, armW, 10);
      ctx.strokeRect(-10, y + 3, armW, 10);
      ctx.strokeRect(6, y + 3, armW, 10);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(-8, y + 14 + reach, 3, 0, Math.PI * 2);
      ctx.arc(8, y + 14 - reach, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (isEating) {
      const eat = Math.sin(globalTime * 0.008);
      const handY = y + 2 - (eat > 0 ? eat * 6 : 0);

      ctx.fillStyle = sleeve;
      ctx.fillRect(-11, y, armW, 8);
      ctx.strokeRect(-11, y, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(-7, y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.arc(0, y + 7, 5, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = sleeve;
      ctx.fillRect(7, y, armW, 7);
      ctx.strokeRect(7, y, armW, 7);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(3, handY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (isCarrying) {
      ctx.fillStyle = sleeve;
      ctx.fillRect(-11, y + 1, armW, 8);
      ctx.fillRect(7, y + 1, armW, 8);
      ctx.strokeRect(-11, y + 1, armW, 8);
      ctx.strokeRect(7, y + 1, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(-7, y + 9, 3, 0, Math.PI * 2);
      ctx.arc(7, y + 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (agent.carriedItem?.type === 'log') {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(-13, y + 4, 26, 8, 2);
        ctx.fill();
        ctx.stroke();
      } else if (agent.carriedItem?.type === 'meat') {
        // Fresh game meat roast flank
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.roundRect(-9, y + 2, 18, 10, 4);
        ctx.fill();
        ctx.stroke();
        // Marbled fat and bone handle
        ctx.fillStyle = '#fef2f2';
        ctx.beginPath();
        ctx.arc(-7, y + 7, 2, 0, Math.PI * 2);
        ctx.arc(7, y + 7, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.roundRect(-8, y + 3, 16, 10, 3);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (isFighting) {
      const punchCycle = Math.sin(globalTime * 0.035);
      const lP = punchCycle > 0 ? 10 : 2;
      const rP = punchCycle <= 0 ? 10 : 2;

      ctx.fillStyle = sleeve;
      ctx.fillRect(-12, y, armW, 8);
      ctx.fillRect(8, y, armW, 8);
      ctx.strokeRect(-12, y, armW, 8);
      ctx.strokeRect(8, y, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(-10, y + 8 + lP, 3.5, 0, Math.PI * 2);
      ctx.arc(10, y + 8 + rP, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (isFlirting) {
      const sway = Math.sin(globalTime * 0.006) * 3;
      ctx.fillStyle = sleeve;
      ctx.fillRect(-10, y, armW, 8);
      ctx.fillRect(7, y, armW, 8);
      ctx.strokeRect(-10, y, armW, 8);
      ctx.strokeRect(7, y, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(-6 + sway, y + 10, 3, 0, Math.PI * 2);
      ctx.arc(6 + sway, y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Expressive Talking / Handshaking / Gesturing Arms
    if (agent.actionState === 'talking') {
      const talkWave = Math.sin(globalTime * 0.016);
      const gesture = Math.sin(globalTime * 0.012) * 3;

      // Left arm: raised waving / gesturing expressively
      ctx.save();
      ctx.translate(-8, y + 2);
      ctx.rotate(-0.35 + talkWave * 0.28);
      ctx.fillStyle = sleeve;
      ctx.fillRect(-armW / 2, 0, armW, 8);
      ctx.strokeRect(-armW / 2, 0, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, 10, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right arm: extended forward in friendly handshake / conversational reach ("hand")
      ctx.save();
      ctx.translate(8, y + 2);
      ctx.rotate(0.3 + gesture * 0.08);
      ctx.fillStyle = sleeve;
      ctx.fillRect(-armW / 2, 0, armW, 8);
      ctx.strokeRect(-armW / 2, 0, armW, 8);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, 10, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      return;
    }

    // Walking / Running Arm Swing
    const armAmp = isRunning ? 10 : 6;
    const lSwing = -swing * armAmp;
    const rSwing = swing * armAmp;

    ctx.fillStyle = sleeve;
    ctx.fillRect(-10.5, y, armW, 7);
    ctx.fillRect(7, y, armW, 7);
    ctx.strokeRect(-10.5, y, armW, 7);
    ctx.strokeRect(7, y, armW, 7);

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-8.5, y + 8 + lSwing, 3, 0, Math.PI * 2);
    ctx.arc(9, y + 8 + rSwing, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private static drawCloakBack(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    swing: number,
    bob: number,
    sittingOffset: number
  ): void {
    const cloakColor = agent.appearance.cloakColor || '#4c1d95';
    const y = -30 - bob + sittingOffset;
    const sway = swing * 4;

    ctx.save();
    ctx.fillStyle = cloakColor;
    ctx.strokeStyle = '#261b14';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-11, y + 2);
    ctx.lineTo(11, y + 2);
    ctx.quadraticCurveTo(16 + sway, y + 26, 10 + sway, y + 29);
    ctx.lineTo(-10 + sway, y + 29);
    ctx.quadraticCurveTo(-16 + sway, y + 26, -11, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9 + sway, y + 27);
    ctx.lineTo(9 + sway, y + 27);
    ctx.stroke();

    ctx.restore();
  }

  private static drawScoutQuiver(ctx: CanvasRenderingContext2D, bob: number, sittingOffset: number): void {
    const y = -28 - bob + sittingOffset;
    ctx.save();
    ctx.translate(7, y);
    ctx.rotate(0.35);

    ctx.fillStyle = '#6b4028';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-3, -2, 6, 20, 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ded0b6';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-2, -2); ctx.lineTo(-2, -9);
    ctx.moveTo(0, -2); ctx.lineTo(0, -11);
    ctx.moveTo(2, -2); ctx.lineTo(2, -8);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-3, -9, 2, 4);
    ctx.fillRect(-1, -11, 2, 4);
    ctx.fillRect(1, -8, 2, 4);

    ctx.restore();
  }

  private static drawElderStaff(ctx: CanvasRenderingContext2D, bob: number, sittingOffset: number, globalTime: number): void {
    const y = -14 - bob + sittingOffset;
    ctx.save();
    ctx.translate(13, y);

    ctx.strokeStyle = '#5a3818';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(1, 14);
    ctx.stroke();

    ctx.fillStyle = '#78461b';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -28, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const glow = Math.sin(globalTime * 0.006) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(245, 158, 11, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, -28, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawWickerBasket(ctx: CanvasRenderingContext2D, bob: number, sittingOffset: number): void {
    const y = -12 - bob + sittingOffset;
    ctx.save();
    ctx.translate(-11, y);

    ctx.fillStyle = '#c49a60';
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-4, -4, 8, 8, 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#8c6031';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
    ctx.moveTo(0, -4); ctx.lineTo(0, 4);
    ctx.stroke();

    ctx.fillStyle = '#8b3fb8';
    ctx.beginPath();
    ctx.arc(-2, -5, 2, 0, Math.PI * 2);
    ctx.arc(2, -5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Cozy Laying Down to Sleep:
   * - Woven straw mattress with wooden corner frame and soft shadow
   * - Plush cream down feather pillow under head
   * - Patchwork wool quilt blanket tucked up to shoulders with stitching lines
   * - Rhythmic gentle breathing chest rise-and-fall
   * - Peaceful closed eyes with curved eyelashes
   * - Floating animated Zzz letters drifting softly upward
   */
  private static drawLyingDown(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    isFemale: boolean,
    globalTime: number
  ): void {
    const breathe = Math.sin(globalTime * 0.003) * 1.5;
    const outline = '#2b2118';

    ctx.save();

    // 1. Cozy Woven Straw Mattress & Wooden Frame
    ctx.fillStyle = '#6b4028';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-24, -13, 48, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e8d49e';
    ctx.beginPath();
    ctx.roundRect(-22, -11, 44, 22, 5);
    ctx.fill();
    ctx.stroke();

    // 2. Soft Down Feather Pillow under head
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-20, -8, 12, 16, 4);
    ctx.fill();
    ctx.stroke();

    // 3. Sleeping Head on Pillow
    const skin = agent.appearance.skinColor;
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(-14, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = agent.appearance.hairColor || '#4a2c1b';
    ctx.beginPath();
    ctx.arc(-16, -1, 7, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    // Peaceful closed eye
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, -1); ctx.lineTo(-12, -1);
    if (isFemale) {
      ctx.moveTo(-16, -1); ctx.lineTo(-17.5, -2.5);
    }
    ctx.stroke();

    // Rosy sleeping cheek
    ctx.fillStyle = isFemale ? 'rgba(244, 114, 182, 0.45)' : 'rgba(235, 95, 80, 0.3)';
    ctx.beginPath();
    ctx.arc(-12, 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Elder Bron mustache resting on chest
    if (agent.id === 'agent_bron' || agent.appearance.facialHair === 'mustache' || agent.appearance.facialHair === 'full_beard') {
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(-9, 3, 4.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 4. Warm Patchwork Wool Quilt / Blanket tucked up to shoulders
    const blanketColor = agent.appearance.cloakColor || (isFemale ? '#047857' : '#991b1b');
    ctx.fillStyle = blanketColor;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-5, -9 - breathe, 25, 18, 3);
    ctx.fill();
    ctx.stroke();

    // Blanket decorative stitching / stripes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, -4 - breathe); ctx.lineTo(19, -4 - breathe);
    ctx.moveTo(-4, 4 - breathe); ctx.lineTo(19, 4 - breathe);
    ctx.stroke();

    // 5. Floating Animated Zzz Letters (Drifting softly upward with wind sway)
    ctx.font = 'bold 9px monospace';
    for (let i = 0; i < 3; i++) {
      const cycle = ((globalTime * 0.0012 + i * 0.9) % 3);
      const zx = -12 + i * 6 + Math.sin(globalTime * 0.003 + i) * 3;
      const zy = -12 - cycle * 8;
      const zAlpha = Math.max(0, 1 - cycle / 3);
      ctx.fillStyle = `rgba(186, 230, 253, ${zAlpha})`;
      ctx.fillText(i === 2 ? 'Z' : 'z', zx, zy);
    }

    ctx.restore();
  }
}
