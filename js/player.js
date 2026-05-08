import { CONFIG } from './config.js';

export class Player {
  constructor() {
    this.x = CONFIG.player.x;
    this.size = CONFIG.player.size;
    this.trail = [];
    this.reset();
  }

  reset() {
    this.x = CONFIG.player.x;
    this.y = CONFIG.GROUND_Y - this.size;
    this.vy = 0;
    this.rot = 0;
    this.onGround = true;
    this.wasOnGround = true;
    this.justLanded = false;
    this.coyote = CONFIG.player.coyoteFrames;
    this.invincible = 0;
    this.trail = [];
  }

  update(isJumpHeld) {
    this.wasOnGround = this.onGround;
    this.justLanded = false;

    this.vy += CONFIG.player.gravity;
    this.y += this.vy;

    if (this.y + this.size >= CONFIG.GROUND_Y) {
      this.y = CONFIG.GROUND_Y - this.size;
      this.vy = 0;
      this.onGround = true;
      this.coyote = CONFIG.player.coyoteFrames;
      this.justLanded = !this.wasOnGround;
    } else {
      this.onGround = false;
      this.coyote = Math.max(0, this.coyote - 1);
    }

    if (this.onGround) {
      const snap = Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2);
      this.rot += (snap - this.rot) * 0.5;
    } else {
      this.rot += 0.11;
    }

    if (isJumpHeld && this.justLanded) this.jump();
    if (this.invincible > 0) this.invincible--;

    this.trail.push({
      x: this.x,
      y: this.y,
      sz: this.size,
      rot: this.rot,
      life: 1,
    });
    for (const item of this.trail) item.life -= CONFIG.player.trailLifeStep;
    this.trail = this.trail.filter((item) => item.life > 0);
  }

  jump() {
    if (this.onGround || this.coyote > 0) {
      this.vy = CONFIG.player.jumpForce;
      this.onGround = false;
      this.coyote = 0;
      return true;
    }
    return false;
  }

  hit() {
    this.invincible = CONFIG.player.invincibleFrames;
  }

  isInvincible() {
    return this.invincible > 0;
  }

  hitbox() {
    const inset = CONFIG.player.hitboxInset;
    return {
      x: this.x + inset,
      y: this.y + inset,
      w: this.size - inset * 2,
      h: this.size - inset * 2,
    };
  }

  drawTrail(ctx, theme) {
    ctx.save();
    for (const item of this.trail) {
      ctx.save();
      ctx.globalAlpha = item.life * 0.42;
      ctx.translate(item.x + item.sz / 2, item.y + item.sz / 2);
      ctx.rotate(item.rot);
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 4;
      ctx.fillRect(-item.sz / 2, -item.sz / 2, item.sz, item.sz);
      ctx.restore();
    }
    ctx.restore();
  }
}
