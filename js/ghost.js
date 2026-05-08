import { CONFIG, randInt } from './config.js';

export class GhostStatus {
  constructor() {
    this.reset();
  }

  reset() {
    this.phase = 'idle';
    this.alpha = 0;
    this.timer = 0;
    this.holdTimer = 0;
    this.nextTrigger = randInt(CONFIG.ghost.intervalMin, CONFIG.ghost.intervalMax);
    this.x = 0;
    this.y = 0;
    this.message = CONFIG.ghost.messages[0];
  }

  update(dt, frame) {
    if (this.phase === 'idle') {
      this.timer += dt;
      if (this.timer >= this.nextTrigger) this.spawn();
      return;
    }

    if (this.phase === 'fadein') {
      this.alpha += CONFIG.ghost.fadeSpeed * dt;
      if (this.alpha >= CONFIG.ghost.maxAlpha) {
        this.alpha = CONFIG.ghost.maxAlpha;
        this.phase = 'hold';
        this.holdTimer = 0;
      }
    } else if (this.phase === 'hold') {
      this.holdTimer += dt;
      if (this.holdTimer >= CONFIG.ghost.holdDuration) this.phase = 'fadeout';
    } else if (this.phase === 'fadeout') {
      this.alpha -= CONFIG.ghost.fadeSpeed * dt;
      if (this.alpha <= 0) this.reset();
    }

    this.bob = Math.sin(frame * 0.04) * CONFIG.ghost.bobAmplitude;
  }

  spawn() {
    this.phase = 'fadein';
    this.alpha = 0;
    this.timer = 0;
    this.holdTimer = 0;
    this.x = 42 + Math.random() * (CONFIG.W - 342);
    this.y = 42 + Math.random() * (CONFIG.GROUND_Y - 190);
    this.message = CONFIG.ghost.messages[Math.floor(Math.random() * CONFIG.ghost.messages.length)];
    this.bob = 0;
  }

  draw(ctx) {
    if (this.phase === 'idle' || this.alpha <= 0) return;

    const x = this.x;
    const y = this.y + (this.bob || 0);
    const w = 300;
    const h = 130;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowColor = 'rgba(150,200,255,0.7)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = 'rgba(230,236,255,0.12)';
    ctx.strokeStyle = 'rgba(180,210,255,0.45)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(66,103,178,0.72)';
    ctx.beginPath();
    ctx.arc(x + 30, y + 30, 19, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', x + 31, y + 31);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(190,215,255,0.95)';
    ctx.font = 'bold 13px Arial';
    ctx.fillText('Facebook', x + 57, y + 24);

    ctx.fillStyle = 'rgba(170,195,230,0.72)';
    ctx.font = '11px Arial';
    ctx.fillText('Barusan · 🌐', x + 57, y + 40);

    ctx.fillStyle = 'rgba(225,238,255,0.98)';
    ctx.font = '14px Arial';
    ctx.fillText(this.message[0], x + 18, y + 68);
    ctx.fillText(this.message[1], x + 18, y + 88);

    ctx.strokeStyle = 'rgba(180,210,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 100);
    ctx.lineTo(x + w - 16, y + 100);
    ctx.stroke();

    ctx.fillStyle = 'rgba(170,195,230,0.66)';
    ctx.font = '11px Arial';
    ctx.fillText('👍 Suka   💬 Komentar   ↗ Bagikan', x + 18, y + 118);
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
