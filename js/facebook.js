import { CONFIG, clamp } from './config.js';

export class FacebookChaser {
  constructor() {
    this.jumpQueue = []; // Store player jumps with timestamps
    this.reset();
  }

  reset() {
    this.x = CONFIG.facebook.x;
    this.w = CONFIG.facebook.w;
    this.h = CONFIG.facebook.h;
    this.y = CONFIG.GROUND_Y - this.h - 18;
    this.vy = 0;
    this.wobble = 0;
    this.angry = false;
    this.jumpQueue = [];
  }

  update(player, levelSpeed, score, frame) {
    const pressure = Math.min(CONFIG.facebook.maxPressure, score * 0.006);
    const targetX = player.x - CONFIG.facebook.targetGap + pressure;
    const chaseSpeed = levelSpeed * 0.36 + score * 0.00035;
    
    // Horizontal movement - smooth pursuit
    this.x += Math.min(chaseSpeed, Math.max(-1.2, targetX - this.x)) * 0.72;
    if (this.x > targetX + 28) this.x += (targetX - this.x) * 0.08;

    // Vertical movement - smooth levitation yang mengikuti player di mana pun (even at ceiling)
    let targetY;
    
    // Follow player's Y center more closely
    const playerYCenter = player.y + player.size / 2;
    targetY = playerYCenter - this.h / 2;

    // Clamp to screen boundaries with some padding
    targetY = clamp(targetY, 40, CONFIG.GROUND_Y - this.h - 40);
    
    // Smooth levitation interpolation - aggressive enough to "ngejar"
    const distance = Math.abs(targetY - this.y);
    const interpSpeed = 0.12 + Math.min(0.2, distance * 0.002); 
    this.y += (targetY - this.y) * interpSpeed;

    // Breathing/hovering animation - smooth sine wave untuk efek melayang
    this.wobble = Math.sin(frame * 0.12) * 12;
    
    this.angry = this.distanceTo(player) < CONFIG.facebook.angryDistance;
  }

  distanceTo(player) {
    return player.x - (this.x + this.w);
  }

  caught(player) {
    if (player.isInvincible()) return false;
    const horizontalHit = this.x + this.w > player.x + 8;
    const verticalHit = Math.abs(this.y - player.y) < player.size + 40;
    return horizontalHit && verticalHit;
  }

  draw(ctx, theme, beatFlash, assets) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2 + this.wobble;
    const color = this.angry ? '#ff263f' : theme.fbC;
    const glowColor = this.angry ? '#ff0000' : (theme.fbC || '#4267B2');

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.angry ? (25 + beatFlash * 35) : (10 + beatFlash * 15);
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(cx * 0.015) * 0.07);

    const img = assets && assets.images ? assets.images.get('fb_monster') : null;
    if (img) {
      let scale = 1.0;
      if (this.angry) {
          scale = 1.12 + Math.sin(performance.now() / 35) * 0.08;
          ctx.filter = 'brightness(1.2) contrast(1.4) saturate(1.2) hue-rotate(-5deg)';
      } else {
          ctx.globalAlpha = 0.85 + beatFlash * 0.15;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, this.w / 2, Math.PI, 0); 
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${this.w * 0.8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('f', 0, -5);
    }

    ctx.restore();
  }
}
