import type { AgentData, EmotionBubble } from '../types/simulation';

export class BubbleRenderer {
  /**
   * Draws animated overhead emotion bubbles with icons and smooth bounce physics.
   */
  public static drawBubble(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    globalTime: number
  ): void {
    if (!agent.activeBubble) return;

    const bubble = agent.activeBubble;

    // Handle rich spoken dialogue balloons with text and speaker name
    if (bubble.text) {
      this.drawSpeechBalloon(ctx, agent, bubble, globalTime);
      return;
    }

    // Fade out as duration winds down
    const progress = bubble.duration / bubble.maxDuration;
    const alpha = Math.min(1, progress * 3);

    if (alpha <= 0.05) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Head position
    const isLyingDown = agent.actionState === 'sleeping' || agent.actionState === 'unconscious';
    const scale = agent.appearance?.scale || 1;
    const baseY = isLyingDown ? agent.y - 15 * scale : agent.y - 62 * scale;
    // Bouncy floating oscillation
    const bounce = Math.sin(globalTime * 0.008 + agent.id.charCodeAt(0)) * 3;
    const x = agent.x;
    const y = baseY + bounce;

    const bubbleWidth = bubble.text ? Math.max(34, bubble.text.length * 7 + 16) : 30;
    const bubbleHeight = bubble.text ? 24 : 26;

    // Draw speech bubble background with soft shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x - bubbleWidth / 2, y - bubbleHeight, bubbleWidth, bubbleHeight, 8);
    ctx.fill();

    // Stem pointing down to agent head
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 4, y);
    ctx.closePath();
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Subtle border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Draw the specific icon or text inside the bubble
    this.drawBubbleContent(ctx, bubble, x, y - bubbleHeight / 2, globalTime);

    ctx.restore();
  }

  private static drawBubbleContent(
    ctx: CanvasRenderingContext2D,
    bubble: EmotionBubble,
    x: number,
    y: number,
    globalTime: number
  ): void {
    const pulse = 1 + 0.1 * Math.sin(globalTime * 0.015);

    switch (bubble.type) {
      case 'heart':
        // Pulsating red heart
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#ef4444';
        this.renderHeartPath(ctx, 0, 0, 8);
        ctx.fill();
        ctx.restore();
        break;

      case 'broken_heart':
        // Broken split heart
        ctx.fillStyle = '#dc2626';
        this.renderHeartPath(ctx, x - 2, y, 7);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x - 2, y - 2);
        ctx.lineTo(x + 2, y + 2);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
        break;

      case 'rage':
        // Japanese manga rage mark 💢 in fiery red
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6); ctx.lineTo(x - 2, y - 6); ctx.lineTo(x - 2, y - 2);
        ctx.moveTo(x + 6, y - 6); ctx.lineTo(x + 2, y - 6); ctx.lineTo(x + 2, y - 2);
        ctx.moveTo(x - 6, y + 6); ctx.lineTo(x - 2, y + 6); ctx.lineTo(x - 2, y + 2);
        ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + 2, y + 6); ctx.lineTo(x + 2, y + 2);
        ctx.stroke();
        break;

      case 'fist':
        // Clenched combat fist / fight sparks
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        // Impact lines
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 8, y); ctx.lineTo(x - 5, y);
        ctx.moveTo(x + 5, y); ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 5);
        ctx.stroke();
        break;

      case 'shock':
        // Yellow electric lightning / exclamation
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(x + 1, y - 8);
        ctx.lineTo(x - 4, y - 1);
        ctx.lineTo(x, y - 1);
        ctx.lineTo(x - 2, y + 7);
        ctx.lineTo(x + 4, y);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        break;

      case 'tears':
        // Tear drop
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(x, y - 7);
        ctx.quadraticCurveTo(x + 6, y + 1, x, y + 6);
        ctx.quadraticCurveTo(x - 6, y + 1, x, y - 7);
        ctx.fill();
        break;

      case 'money':
        // Green dollar bill
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(x - 7, y - 5, 14, 10);
        ctx.fillStyle = '#dcfce7';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', x, y + 0.5);
        break;

      case 'sleep':
        // Zzz
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Zzz', x, y);
        break;

      case 'food':
        // Apple / Food item
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y + 1, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d'; // Green leaf
        ctx.fillRect(x, y - 6, 2, 3);
        break;

      case 'police':
        // Red / Blue siren beacon
        const sirenToggle = Math.floor(globalTime * 0.01) % 2 === 0;
        ctx.fillStyle = sirenToggle ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(x - 6, y - 6, 12, 10, 3);
        ctx.fill();
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x - 7, y + 4, 14, 2);
        break;

      case 'peace':
        // White dove / olive branch green
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🕊️', x, y + 0.5);
        break;

      case 'idea':
        // Lightbulb
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(x, y - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#71717a';
        ctx.fillRect(x - 2.5, y + 3, 5, 3);
        break;

      case 'kiss':
        ctx.fillStyle = '#f43f5e';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💋', x, y);
        break;

      case 'axe':
        // Mini woodcutting axe
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 2, y - 5, 3, 11);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6);
        ctx.lineTo(x + 5, y - 6);
        ctx.lineTo(x + 3, y - 1);
        ctx.lineTo(x - 4, y - 1);
        ctx.closePath();
        ctx.fill();
        break;

      case 'bow':
        // Hunting Bow and Arrow icon
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x - 2, y, 7, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        // Bowstring
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - 2 + Math.cos(-Math.PI * 0.45) * 7, y + Math.sin(-Math.PI * 0.45) * 7);
        ctx.lineTo(x - 5, y);
        ctx.lineTo(x - 2 + Math.cos(Math.PI * 0.45) * 7, y + Math.sin(Math.PI * 0.45) * 7);
        ctx.stroke();
        // Arrow
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(x + 6, y);
        ctx.lineTo(x + 3, y - 2);
        ctx.lineTo(x + 3, y + 2);
        ctx.closePath();
        ctx.fill();
        break;

      case 'fish':
        // River fish icon
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x - 8, y - 3);
        ctx.lineTo(x - 8, y + 3);
        ctx.closePath();
        ctx.fill();
        break;

      case 'berry':
        // Luscious red berries with green leaf matching new bush art
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(x - 1, y - 5, 3.5, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(x - 3.5, y + 1.5, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 3.5, y + 1.5, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y - 2, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 1, y - 3, 0.9, 0, Math.PI * 2);
        ctx.arc(x - 4.2, y + 0.5, 0.8, 0, Math.PI * 2);
        ctx.arc(x + 2.8, y + 0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'hammer':
        // Carpenter's Hammer
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(x - 1.5, y - 4, 3, 11);
        ctx.fillStyle = '#71717a';
        ctx.fillRect(x - 6, y - 7, 12, 4);
        break;

      case 'home':
        // Cozy House
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x - 6, y - 2, 12, 8);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 2);
        ctx.lineTo(x, y - 8);
        ctx.lineTo(x + 8, y - 2);
        ctx.closePath();
        ctx.fill();
        break;

      case 'water':
        // Pure Drinking Water Droplet & Bucket
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(x, y - 9);
        ctx.quadraticCurveTo(x + 7, y - 1, x + 5, y + 4);
        ctx.arc(x, y + 4, 5, 0, Math.PI);
        ctx.quadraticCurveTo(x - 7, y - 1, x, y - 9);
        ctx.closePath();
        ctx.fill();
        // Droplet specular glint
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.ellipse(x - 2, y + 2, 1.6, 2.5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        if (bubble.text) {
          ctx.fillStyle = '#1e293b';
          ctx.font = '600 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(bubble.text, x, y);
        }
        break;
    }
  }

  private static drawSpeechBalloon(
    ctx: CanvasRenderingContext2D,
    agent: AgentData,
    bubble: EmotionBubble,
    globalTime: number
  ): void {
    if (!bubble.text) return;

    const progress = bubble.duration / bubble.maxDuration;
    const alpha = Math.min(1, progress * 4);
    if (alpha <= 0.05) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const isLyingDown = agent.actionState === 'sleeping' || agent.actionState === 'unconscious';
    const scale = agent.appearance?.scale || 1;
    const baseY = isLyingDown ? agent.y - 20 * scale : (agent.actionState === 'sitting' ? agent.y - 54 * scale : agent.y - 68 * scale);
    const bounce = Math.sin(globalTime * 0.007 + agent.id.charCodeAt(0)) * 2;
    const x = agent.x;
    const y = baseY + bounce;

    // Word wrap text
    ctx.font = '600 11px sans-serif';
    const maxTextW = 190;
    const words = bubble.text.split(' ');
    const lines: string[] = [];
    let curLine = '';
    for (const w of words) {
      const test = curLine ? `${curLine} ${w}` : w;
      if (ctx.measureText(test).width > maxTextW && curLine) {
        lines.push(curLine);
        curLine = w;
      } else {
        curLine = test;
      }
    }
    if (curLine) lines.push(curLine);

    let maxLineWidth = 0;
    for (const l of lines) {
      const lw = ctx.measureText(l).width;
      if (lw > maxLineWidth) maxLineWidth = lw;
    }

    const speaker = bubble.speakerName || agent.name.split(' ')[0];
    const icon = bubble.type === 'heart' ? '❤️' 
      : bubble.type === 'rage' ? '💢' 
      : bubble.type === 'broken_heart' ? '💔' 
      : bubble.type === 'food' ? '🍲' 
      : bubble.type === 'laugh' ? '😄' 
      : bubble.type === 'fist' ? '⚔️' 
      : bubble.type === 'shock' ? '⚡' 
      : bubble.type === 'money' ? '💰'
      : bubble.type === 'idea' ? '💡'
      : '💬';
    ctx.font = 'bold 9.5px sans-serif';
    const speakerW = ctx.measureText(`${icon} ${speaker}`).width;

    const padX = 12;
    const bubbleW = Math.max(95, Math.max(maxLineWidth + padX * 2, speakerW + padX * 2));
    const headerH = 14;
    const lineH = 14;
    const bubbleH = headerH + lines.length * lineH + 10;

    const left = x - bubbleW / 2;
    const top = y - bubbleH;

    // Soft drop shadow
    ctx.shadowColor = 'rgba(43, 33, 24, 0.28)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Background bubble (soft cream matching game visual aesthetic)
    ctx.fillStyle = '#fffdf7';
    ctx.beginPath();
    ctx.roundRect(left, top, bubbleW, bubbleH, 8);
    ctx.fill();

    // Stem pointing to head
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 5, y);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(left, top, bubbleW, bubbleH, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 5, y);
    ctx.stroke();

    // Header Speaker Name Banner
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${icon} ${speaker}`, left + padX, top + 5);

    // Subtle divider line under speaker name
    ctx.strokeStyle = 'rgba(43, 33, 24, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + padX, top + headerH + 3);
    ctx.lineTo(left + bubbleW - padX, top + headerH + 3);
    ctx.stroke();

    // Spoken lines
    ctx.fillStyle = '#1c1917';
    ctx.font = '600 11px sans-serif';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], left + padX, top + headerH + 6 + i * lineH);
    }

    ctx.restore();
  }

  private static renderHeartPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.7);
    ctx.bezierCurveTo(x + size, y, x + size, y - size, x, y - size * 0.5);
    ctx.bezierCurveTo(x - size, y - size, x - size, y, x, y + size * 0.7);
    ctx.closePath();
  }
}
