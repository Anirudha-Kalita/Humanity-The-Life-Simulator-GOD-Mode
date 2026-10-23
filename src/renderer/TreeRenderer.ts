import type { ForestTree } from '../types/simulation';

import tree0Url from '../assets/trees/tree_0.png';
import tree1Url from '../assets/trees/tree_1.png';
import tree2Url from '../assets/trees/tree_2.png';
import tree3Url from '../assets/trees/tree_3.png';
import tree4Url from '../assets/trees/tree_4.png';
import tree5Url from '../assets/trees/tree_5.png';
import tree6Url from '../assets/trees/tree_6.png';
import tree7Url from '../assets/trees/tree_7.png';
import tree8Url from '../assets/trees/tree_8.png';
import tree9Url from '../assets/trees/tree_9.png';
import tree10Url from '../assets/trees/tree_10.png';
import tree11Url from '../assets/trees/tree_11.png';
import tree12Url from '../assets/trees/tree_12.png';
import tree13Url from '../assets/trees/tree_13.png';
import tree14Url from '../assets/trees/tree_14.png';
import tree15Url from '../assets/trees/tree_15.png';
import tree16Url from '../assets/trees/tree_16.png';
import tree17Url from '../assets/trees/tree_17.png';

export interface TreeSpriteDef {
  id: number;
  name: string;
  img: HTMLImageElement;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  isLoaded: boolean;
}

export class TreeRenderer {
  private static sprites: TreeSpriteDef[] = [];
  private static initialized = false;

  public static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const defs = [
      { id: 0, name: 'Small Tree', url: tree0Url, width: 115, height: 135, anchorX: 59.3, anchorY: 134.0 },
      { id: 1, name: 'Medium Tree', url: tree1Url, width: 144, height: 166, anchorX: 74.8, anchorY: 165.0 },
      { id: 2, name: 'Large Tree', url: tree2Url, width: 167, height: 190, anchorX: 81.1, anchorY: 189.0 },
      { id: 3, name: 'Tall Slim Tree', url: tree3Url, width: 74, height: 185, anchorX: 37.2, anchorY: 184.0 },
      { id: 4, name: 'Pine Tree', url: tree4Url, width: 144, height: 182, anchorX: 69.7, anchorY: 181.0 },
      { id: 5, name: 'Snow Pine', url: tree5Url, width: 140, height: 185, anchorX: 72.1, anchorY: 184.0 },
      { id: 6, name: 'Apple Tree', url: tree6Url, width: 145, height: 165, anchorX: 74.3, anchorY: 164.0 },
      { id: 7, name: 'Orange Tree', url: tree7Url, width: 147, height: 167, anchorX: 72.0, anchorY: 166.0 },
      { id: 8, name: 'Cherry Tree', url: tree8Url, width: 146, height: 172, anchorX: 68.4, anchorY: 171.0 },
      { id: 9, name: 'Autumn Tree', url: tree9Url, width: 149, height: 170, anchorX: 72.7, anchorY: 169.0 },
      { id: 10, name: 'Blooming Tree', url: tree10Url, width: 158, height: 172, anchorX: 76.9, anchorY: 171.0 },
      { id: 11, name: 'Palm Tree', url: tree11Url, width: 142, height: 181, anchorX: 62.4, anchorY: 180.0 },
      { id: 12, name: 'Willow Tree', url: tree12Url, width: 153, height: 181, anchorX: 73.1, anchorY: 180.0 },
      { id: 13, name: 'Birch Tree', url: tree13Url, width: 128, height: 186, anchorX: 57.9, anchorY: 185.0 },
      { id: 14, name: 'Dead Tree', url: tree14Url, width: 140, height: 179, anchorX: 67.5, anchorY: 178.0 },
      { id: 15, name: 'Rocky Tree', url: tree15Url, width: 157, height: 190, anchorX: 78.7, anchorY: 189.0 },
      { id: 16, name: 'Mangrove Tree', url: tree16Url, width: 165, height: 172, anchorX: 77.8, anchorY: 171.0 },
      { id: 17, name: 'Bamboo Cluster', url: tree17Url, width: 120, height: 183, anchorX: 61.1, anchorY: 182.0 }
    ];

    for (const d of defs) {
      const img = new Image();
      const item: TreeSpriteDef = {
        id: d.id,
        name: d.name,
        img,
        width: d.width,
        height: d.height,
        anchorX: d.anchorX,
        anchorY: d.anchorY,
        isLoaded: false
      };
      img.onload = () => {
        item.isLoaded = true;
      };
      img.onerror = () => {
        // Fallback to public path if needed
        img.src = `/assets/trees/tree_${d.id}.png`;
      };
      img.src = d.url;
      this.sprites.push(item);
    }
  }

  public static getTreeIndex(variant: ForestTree['variant']): number {
    if (typeof variant === 'number') {
      return Math.max(0, Math.min(17, Math.floor(variant)));
    }
    switch (variant) {
      case 'small': return 0;
      case 'medium': return 1;
      case 'large':
      case 'oak': return 2;
      case 'tall_slim': return 3;
      case 'pine': return 4;
      case 'snow_pine': return 5;
      case 'apple': return 6;
      case 'orange': return 7;
      case 'cherry': return 8;
      case 'autumn':
      case 'elm': return 9;
      case 'blooming': return 10;
      case 'palm': return 11;
      case 'willow': return 12;
      case 'birch': return 13;
      case 'dead': return 14;
      case 'rocky': return 15;
      case 'mangrove':
      case 'banyan': return 16;
      case 'bamboo': return 17;
      default: return 2;
    }
  }

  public static getSpriteDef(index: number): TreeSpriteDef | undefined {
    if (!this.initialized) this.init();
    return this.sprites[index] || this.sprites[0];
  }

  public static getTreeName(variant: ForestTree['variant']): string {
    const idx = this.getTreeIndex(variant);
    const def = this.getSpriteDef(idx);
    return def ? def.name : 'Small Tree';
  }

  public static getTreeSpriteUrl(variant: ForestTree['variant']): string {
    const idx = this.getTreeIndex(variant);
    return `/assets/trees/tree_${idx}.png`;
  }

  public static drawTree(
    ctx: CanvasRenderingContext2D,
    tree: ForestTree,
    globalTime: number,
    isSelected = false,
    isHoveredForRemoval = false
  ): void {
    if (!this.initialized) {
      this.init();
    }

    const outline = '#26201a';
    ctx.save();
    const shakeX = tree.shakeTimer > 0 ? Math.sin(tree.shakeTimer * 38) * 4 : 0;
    ctx.translate(tree.x + shakeX, tree.y);

    // Selected Halo / Indicator at base
    if (isSelected) {
      const ringW = 28;
      const ringH = 14;
      const pulse = 0.85 + Math.sin(globalTime * 0.007) * 0.15;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 2, ringW * pulse, ringH * pulse, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 3]);
      ctx.stroke();

      ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
      ctx.fill();
      ctx.restore();
    }

    // Hovered for Removal Hazard Aura
    if (isHoveredForRemoval) {
      const ringW = 32;
      const ringH = 16;
      const pulse = 0.85 + Math.sin(globalTime * 0.012) * 0.15;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 2, ringW * pulse, ringH * pulse, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.fill();
      ctx.restore();
    }

    // 1. Sprouting Sapling Lifecycle Stage
    if (tree.stage === 'sapling') {
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.ellipse(0, 1, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#3f6212';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(2, -8, -1, -15);
      ctx.stroke();

      ctx.fillStyle = '#84cc16';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(-5, -11, 4.5, 2.5, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(4, -13, 4.5, 2.5, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.ellipse(-1, -17, 3.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
      return;
    }

    // 2. Decaying Stump Stage or Felled by Settler Lumberjack
    if (tree.stage === 'decaying' || tree.woodHealth <= 0) {
      ctx.fillStyle = 'rgba(38, 30, 20, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4a321a';
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.8;
      ctx.fillRect(-8, -10, 16, 12);
      ctx.strokeRect(-8, -10, 16, 12);

      ctx.fillStyle = '#8c6239';
      ctx.beginPath();
      ctx.ellipse(0, -10, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(40, 20, 10, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, -10, 4, 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#4d7c34';
      ctx.beginPath();
      ctx.arc(-7, -2, 4, 0, Math.PI * 2);
      ctx.arc(6, -1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Wild forest mushrooms (🍄)
      this.drawStumpMushroom(ctx, 9, -2, '#dc2626', 3.5);
      this.drawStumpMushroom(ctx, 13, 1, '#ea580c', 2.5);
      this.drawStumpMushroom(ctx, -10, 0, '#ef4444', 3);

      ctx.restore();
      return;
    }

    // 3. Living Illustrated Tree (One of the 8 varieties from uploaded artwork!)
    const treeIdx = this.getTreeIndex(tree.variant);
    const sprite = this.sprites[treeIdx] || this.sprites[0];

    // Scale calculation: Mature, Ancient, Young
    let scale = 0.65;
    if (tree.stage === 'young') {
      scale = 0.42;
    } else if (tree.stage === 'ancient') {
      scale = 0.88;
    }

    // Drop shadow under tree trunk base
    const shadowW = (sprite.width * scale) * 0.38;
    const shadowH = shadowW * 0.38;
    ctx.fillStyle = 'rgba(38, 30, 20, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 3, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawW = sprite.width * scale;
    const drawH = sprite.height * scale;
    const drawX = -sprite.anchorX * scale;
    const drawY = -sprite.anchorY * scale;

    if (sprite.img && (sprite.isLoaded || sprite.img.complete)) {
      ctx.drawImage(sprite.img, drawX, drawY, drawW, drawH);
    } else {
      // Procedural fallback while loading
      ctx.fillStyle = '#46792f';
      ctx.beginPath();
      ctx.arc(0, -drawH * 0.5, drawW * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Overhead tag for Selected Tree
    if (isSelected) {
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const labelY = drawY - 8;
      const labelText = `${sprite.name} (${tree.stage.toUpperCase()})`;

      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(23, 23, 23, 0.88)';
      ctx.beginPath();
      ctx.roundRect(-textWidth / 2 - 8, labelY - 14, textWidth + 16, 20, 6);
      ctx.fill();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = '#f0fdf4';
      ctx.fillText(labelText, 0, labelY);
      ctx.restore();
    }

    // Overhead tag for Hovered Removal
    if (isHoveredForRemoval) {
      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const labelY = drawY - 8;
      const labelText = `🪓 Click to Chop Down ${sprite.name}`;

      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(185, 28, 28, 0.95)';
      ctx.beginPath();
      ctx.roundRect(-textWidth / 2 - 8, labelY - 14, textWidth + 16, 20, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, 0, labelY);
      ctx.restore();
    }

    ctx.restore();
  }

  public static drawTreeGhost(
    ctx: CanvasRenderingContext2D,
    variant: ForestTree['variant'],
    stage: ForestTree['stage'],
    x: number,
    y: number,
    isValid: boolean,
    globalTime: number
  ): void {
    if (!this.initialized) this.init();

    const treeIdx = this.getTreeIndex(variant);
    const sprite = this.sprites[treeIdx] || this.sprites[0];

    let scale = 0.65;
    if (stage === 'young') scale = 0.42;
    else if (stage === 'ancient') scale = 0.88;
    else if (stage === 'sapling') scale = 0.28;

    ctx.save();
    ctx.translate(x, y);

    // Ground placement ring
    const ringRadius = 24 * scale + (Math.sin(globalTime * 0.008) * 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, ringRadius * 1.5, ringRadius * 0.7, 0, 0, Math.PI * 2);
    if (isValid) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.strokeStyle = '#22c55e';
    } else {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.strokeStyle = '#ef4444';
    }
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.fill();
    ctx.stroke();

    // Semi-transparent ghost sprite
    ctx.globalAlpha = 0.72;
    const drawW = sprite.width * scale;
    const drawH = sprite.height * scale;
    const drawX = -sprite.anchorX * scale;
    const drawY = -sprite.anchorY * scale;

    if (stage === 'sapling') {
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(0, -10, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (sprite.img && (sprite.isLoaded || sprite.img.complete)) {
      ctx.drawImage(sprite.img, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#46792f';
      ctx.beginPath();
      ctx.arc(0, -drawH * 0.5, drawW * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Status label above tree canopy
    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';

    const treeName = this.getTreeName(variant);
    const labelY = drawY - 14;
    const labelText = isValid
      ? `🌱 Click to Plant ${treeName} (${stage.toUpperCase()})`
      : `🚫 Cannot plant here (water or obstruction)`;

    const textWidth = ctx.measureText(labelText).width;
    ctx.fillStyle = isValid ? 'rgba(20, 83, 45, 0.92)' : 'rgba(153, 27, 27, 0.92)';
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 10, labelY - 15, textWidth + 20, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, 0, labelY);

    ctx.restore();
  }

  private static drawStumpMushroom(ctx: CanvasRenderingContext2D, x: number, y: number, capColor: string, radius: number): void {
    ctx.fillStyle = '#fdfbf7';
    ctx.strokeStyle = '#26201a';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 1, y, 2, radius + 1);
    ctx.strokeRect(x - 1, y, 2, radius + 1);

    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - radius * 0.4, y - radius * 0.4, 0.8, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.3, y - radius * 0.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
