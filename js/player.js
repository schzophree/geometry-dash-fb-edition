import { CONFIG, clamp } from './config.js';
import { getPerfConfig } from './perf.js';

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
    this.mode = 'cube'; // cube, ship, ball
    this.gravity = 1; // 1 (normal) or -1 (reversed)
    this.onGround = true;
    this.onCeiling = false;
    this.wasOnGround = true;
    this.justLanded = false;
    this.coyote = CONFIG.player.coyoteFrames;
    this.invincible = 0;
    this.trail = [];
  }

  update(isJumpHeld, solidFloorY = CONFIG.GROUND_Y) {
    this.wasOnGround = this.onGround || this.onCeiling;
    this.justLanded = false;

    // Physics constants
    const gravForce = CONFIG.player.gravity * this.gravity;
    const ceilingY = 64;

    if (this.mode === 'ship') {
      const shipAccel = 0.8;
      const shipMaxSpeed = 8.2;
      if (isJumpHeld) {
        this.vy -= shipAccel * this.gravity;
      } else {
        this.vy += gravForce; // Ship also falls normally when not held
      }
      this.vy = Math.min(shipMaxSpeed, Math.max(-shipMaxSpeed, this.vy));
      
      // Auto-rotation for ship
      const targetRot = clamp(Math.atan2(this.vy, 9), -0.6, 0.6);
      this.rot += (targetRot - this.rot) * 0.18;
    } else {
      this.vy += gravForce;
    }

    this.y += this.vy;

    // Floor collision
    if (this.y + this.size >= solidFloorY) {
      this.y = solidFloorY - this.size;
      this.vy = 0;
      this.onGround = true;
      this.onCeiling = false;
      this.coyote = CONFIG.player.coyoteFrames;
      this.justLanded = !this.wasOnGround;
    } 
    // Ceiling collision
    else if (this.y <= ceilingY) {
      this.y = ceilingY;
      this.vy = 0;
      this.onCeiling = true;
      this.onGround = false;
      this.justLanded = !this.wasOnGround;
    }
    else {
      this.onGround = false;
      this.onCeiling = false;
      this.coyote = Math.max(0, this.coyote - 1);
    }

    // Rotation logic
    if (this.mode === 'cube') {
      if (this.onGround || this.onCeiling) {
        const snap = Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2);
        this.rot += (snap - this.rot) * 0.45;
      } else {
        this.rot += 0.11 * this.gravity;
      }
    } else if (this.mode === 'ball') {
      if (!(this.onGround || this.onCeiling)) {
        this.rot += 0.14 * this.gravity;
      }
    }

    if (isJumpHeld && this.justLanded && this.mode !== 'ship') this.jump();
    if (this.invincible > 0) this.invincible--;

    this.trail.push({
      x: this.x,
      y: this.y,
      sz: this.size,
      rot: this.rot,
      life: 1,
      mode: this.mode,
    });
    for (const item of this.trail) item.life -= CONFIG.player.trailLifeStep;
    this.trail = this.trail.filter((item) => item.life > 0);
    const maxTrail = getPerfConfig().particles + 12;
    while (this.trail.length > maxTrail) this.trail.shift();
  }

  jump(customVy = null) {
    if (this.mode === 'ball' && !customVy) {
      if (this.onGround || this.onCeiling) {
        this.gravity *= -1;
        this.onGround = false;
        this.onCeiling = false;
        return true;
      }
      return false;
    }

    if (this.onGround || this.onCeiling || this.coyote > 0 || customVy !== null) {
      this.vy = (customVy !== null ? customVy : -14.2) * this.gravity;
      this.onGround = false;
      this.onCeiling = false;
      this.coyote = 0;
      return true;
    }
    return false;
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    // Reset rotation style if needed
  }

  setGravity(g) {
    this.gravity = g;
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
