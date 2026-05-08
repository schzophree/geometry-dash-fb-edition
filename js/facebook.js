import { CONFIG } from './config.js';

export class FacebookChaser {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = CONFIG.facebook.x;
    this.w = CONFIG.facebook.w;
    this.h = CONFIG.facebook.h;
    this.y = CONFIG.GROUND_Y - this.h;
    this.wobble = 0;
    this.angry = false;
  }

  update(player, levelSpeed, score, frame) {
    const pressure = Math.min(CONFIG.facebook.maxPressure, score * 0.006);
    const targetX = player.x - CONFIG.facebook.targetGap + pressure;
    const chaseSpeed = levelSpeed * 0.36 + score * 0.00035;
    this.x += Math.min(chaseSpeed, Math.max(-1.2, targetX - this.x)) * 0.72;
    if (this.x > targetX + 28) this.x += (targetX - this.x) * 0.08;
    this.wobble = Math.sin(frame * 0.09) * 5;
    this.y = CONFIG.GROUND_Y - this.h + this.wobble;
    this.angry = this.distanceTo(player) < CONFIG.facebook.angryDistance;
  }

  distanceTo(player) {
    return player.x - (this.x + this.w);
  }

  caught(player) {
    if (player.isInvincible()) return false;
    return this.x + this.w > player.x + 8;
  }

  retreat(amount = 120) {
    this.x = Math.min(CONFIG.facebook.x, this.x - amount);
  }

  draw(ctx, theme, beatFlash) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const color = this.angry ? '#ff263f' : theme.fbC;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(cx * 0.02) * 0.08);
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 + beatFlash * 18;

    const grad = ctx.createRadialGradient(-8, -10, 5, 0, 0, this.w / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.18, color);
    grad.addColorStop(1, '#11182d');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.w / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = this.angry ? '#ffffff' : 'rgba(255,255,255,0.78)';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${this.w * 0.74}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', 3, 3);

    if (this.angry) {
      ctx.strokeStyle = '#190000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-15, -15);
      ctx.lineTo(-4, -10);
      ctx.moveTo(15, -15);
      ctx.lineTo(4, -10);
      ctx.stroke();

      ctx.fillStyle = '#190000';
      ctx.beginPath();
      ctx.arc(-10, -5, 3, 0, Math.PI * 2);
      ctx.arc(10, -5, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
