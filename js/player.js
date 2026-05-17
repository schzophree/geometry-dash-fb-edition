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

  update(isJumpHeld, solidFloorY = CONFIG.GROUND_Y, solidCeilingY = 0) {
    this.wasOnGround = this.onGround || this.onCeiling;
    this.justLanded = false;

    const gravForce = CONFIG.player.gravity * this.gravity;

    if (this.mode === 'ship') {
      const shipAccel = 0.95; // ditingkatkan agar lebih responsif naik
      const shipMaxSpeed = 10.0;
      if (isJumpHeld) {
        this.vy -= shipAccel * this.gravity;
      } else {
        this.vy += gravForce * 1.15; // dikurangi agar jatuhnya lebih mulus dan tidak terlalu berat
      }
      this.vy = Math.min(shipMaxSpeed, Math.max(-shipMaxSpeed, this.vy));
      
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
    // Ceiling collision — hanya nempel jika gravitasi terbalik
    else if (this.y <= solidCeilingY) {
      this.y = solidCeilingY;
      if (this.gravity === -1) {
        // Gravitasi terbalik: langit-langit jadi lantai
        this.vy = 0;
        this.onCeiling = true;
        this.onGround = false;
        this.coyote = CONFIG.player.coyoteFrames;
        this.justLanded = !this.wasOnGround;
      } else {
        // Gravitasi normal: mantul balik ke bawah
        this.vy = Math.abs(this.vy) * 0.3; // pantul lemah ke bawah
        this.onCeiling = false;
        this.onGround = false;
      }
    }
    else {
      this.onGround = false;
      this.onCeiling = false;
      this.coyote = Math.max(0, this.coyote - 1);
    }

    // GD-style rotation: fast snap on ground, smooth spin in air
    if (this.mode === 'cube') {
      if (this.onGround || this.onCeiling) {
        // Snap rotation to nearest 90 degrees quickly
        const snap = Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2);
        this.rot += (snap - this.rot) * 0.6; // Faster snap (was 0.45)
      } else {
        this.rot += 0.12 * this.gravity; // Slightly faster spin
      }
    } else if (this.mode === 'ball') {
      if (!(this.onGround || this.onCeiling)) {
        this.rot += 0.14 * this.gravity;
      }
    }

    // Auto-jump when holding on landing or press jump on ground (GD mechanic)
    const canAutoJump = (this.gravity === 1 && this.onGround) || (this.gravity === -1 && this.onCeiling);
    if (isJumpHeld && canAutoJump && this.mode !== 'ship') {
      this.jump();
    }
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

    const canJump = (this.gravity === 1 && (this.onGround || this.coyote > 0)) ||
                    (this.gravity === -1 && (this.onCeiling || this.coyote > 0)) ||
                    customVy !== null;

    if (canJump) {
      this.vy = (customVy !== null ? customVy : CONFIG.player.jumpForce) * this.gravity;
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
      if (item.gravity === -1) ctx.scale(1, -1);
      ctx.rotate(item.rot);
      ctx.fillStyle = '#00ff44';
      ctx.shadowColor = '#00ff44';
      ctx.shadowBlur = 4;
      ctx.fillRect(-item.sz / 2, -item.sz / 2, item.sz, item.sz);
      ctx.restore();
    }
    ctx.restore();
  }
}
