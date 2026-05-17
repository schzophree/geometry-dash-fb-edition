import { CONFIG } from './config.js';

export class FacebookChaser {
  constructor() {
    this.jumpQueue = []; // Store player jumps with timestamps
    this.reset();
  }

  reset() {
    this.x = CONFIG.facebook.x;
    this.w = CONFIG.facebook.w;
    this.h = CONFIG.facebook.h;
    this.y = CONFIG.GROUND_Y - this.h;
    this.vy = 0;
    this.gravity = 0.85;
    this.jumpForce = -14.8;
    this.onGround = true;
    this.wobble = 0;
    this.angry = false;
    this.jumpQueue = [];
    this.jumpDelayMs = 450; // Delay in milliseconds (approx 0.45s)
  }

  update(player, levelSpeed, score, frame) {
    const now = performance.now();
    const pressure = Math.min(CONFIG.facebook.maxPressure, score * 0.006);
    const targetX = player.x - CONFIG.facebook.targetGap + pressure;
    const chaseSpeed = levelSpeed * 0.36 + score * 0.00035;
    
    // Horizontal movement
    this.x += Math.min(chaseSpeed, Math.max(-1.2, targetX - this.x)) * 0.72;
    if (this.x > targetX + 28) this.x += (targetX - this.x) * 0.08;

    // JUMP LOGIC WITH DELAY
    // 1. Record player jump
    if (player.vy < -2 && player.onGround === false && (this.jumpQueue.length === 0 || now - this.jumpQueue[this.jumpQueue.length-1].t > 300)) {
        this.jumpQueue.push({ t: now });
    }

    // 2. Check queue for delayed jump execution
    if (this.jumpQueue.length > 0 && this.onGround) {
        if (now - this.jumpQueue[0].t >= this.jumpDelayMs) {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.jumpQueue.shift(); // Remove handled jump
        }
    }

    // Vertical Physics
    this.vy += this.gravity;
    this.y += this.vy;

    // Floor collision
    if (this.y + this.h >= CONFIG.GROUND_Y) {
        this.y = CONFIG.GROUND_Y - this.h;
        this.vy = 0;
        this.onGround = true;
    }

    this.wobble = Math.sin(frame * 0.09) * 5;
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
    const cy = this.y + this.h / 2;
    const color = this.angry ? '#ff263f' : theme.fbC;

    ctx.save();
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 20 + beatFlash * 25;
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(cx * 0.015) * 0.1);

    const img = assets && assets.images ? assets.images.get('fb_monster') : null;
    if (img) {
      let scale = 1.0;
      if (this.angry) {
          scale = 1.08 + Math.sin(performance.now() / 40) * 0.06;
          ctx.filter = 'brightness(1.2) contrast(1.3) hue-rotate(-10deg)';
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
