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
    this.autoPilot = false;
    this.trail = [];
    this.bullets = [];
    this.bulletTimer = 0;
  }

  fireBullet(targetX, targetY) {
    const angle = Math.atan2(targetY - (this.y + this.size/2), targetX - (this.x + this.size));
    this.bullets.push({
      x: this.x + this.size,
      y: this.y + this.size / 2,
      vx: Math.cos(angle) * 14,
      vy: Math.sin(angle) * 14,
      life: 1.0,
      size: 8
    });
  }

  update(isJumpHeld, solidFloorY = CONFIG.GROUND_Y, solidCeilingY = 0, dt = 1, options = {}) {
    const { targetBossX, targetBossY, autoFire = false, obstacles = [] } = options;
    
    // Auto Pilot Logic
    let botJump = false;
    if (this.autoPilot) {
      const lookAhead = 120; // pixels to look ahead
      const pb = this.hitbox();
      
      for (const obs of obstacles) {
        if (obs.inactive) continue;
        
        const dist = obs.x - (pb.x + pb.w);
        if (dist > -20 && dist < lookAhead) {
          // Dangerous obstacles
          if (obs.type === 'spike' || obs.type === 'block' || obs.type.startsWith('slope_')) {
            // Only jump if obstacle is in our path
            const willHit = (this.gravity === 1 && obs.y < pb.y + pb.h + 20) || 
                            (this.gravity === -1 && obs.y + (obs.h || 36) > pb.y - 20);
            if (willHit) {
              botJump = true;
              break;
            }
          }
          // Orbs
          if (obs.type.startsWith('orb_')) {
            if (dist < 10) { // Hit orb when very close
              botJump = true;
              break;
            }
          }
        }
      }
    }

    const effectiveJump = isJumpHeld || botJump;
    
    // Smoothly return to default X if knocked back
    if (this.x < CONFIG.player.x) {
      this.x += (CONFIG.player.x - this.x) * 0.1;
      if (Math.abs(this.x - CONFIG.player.x) < 0.5) this.x = CONFIG.player.x;
    } else if (this.x > CONFIG.player.x) {
      this.x -= (this.x - CONFIG.player.x) * 0.1;
      if (Math.abs(this.x - CONFIG.player.x) < 0.5) this.x = CONFIG.player.x;
    }

    if (autoFire && this.mode === 'ship') {
      this.bulletTimer += dt;
      if (this.bulletTimer >= 12) { // Fire every ~0.2s
        this.fireBullet(targetBossX || CONFIG.W, targetBossY || CONFIG.H / 2);
        this.bulletTimer = 0;
      }
    }

    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= 0.01 * dt;
    }
    this.bullets = this.bullets.filter(b => b.life > 0 && b.x < CONFIG.W + 50);

    this.wasOnGround = this.onGround || this.onCeiling;
    this.justLanded = false;

    const gravForce = CONFIG.player.gravity * this.gravity;

    if (this.mode === 'ship') {
      const shipAccel = 0.32; // Lebih kalem (sebelumnya 0.38)
      const shipMaxSpeed = 6.8; // Lebih terkendali (sebelumnya 7.5)
      const shipFriction = 0.985; // Menghindari nempel di ujung

      if (effectiveJump) {
        this.vy -= shipAccel * this.gravity;
      } else {
        this.vy += gravForce * 0.55; // Lebih melayang (sebelumnya 0.65)
      }
      
      this.vy *= shipFriction; // Tambah hambatan udara
      this.vy = Math.min(shipMaxSpeed, Math.max(-shipMaxSpeed, this.vy));
      
      const targetRot = clamp(Math.atan2(this.vy, 11), -0.4, 0.4);
      this.rot += (targetRot - this.rot) * 0.1;
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
    else if (this.y <= solidCeilingY) {
      this.y = solidCeilingY;
      if (this.gravity === -1) {
        this.vy = 0;
        this.onCeiling = true;
        this.onGround = false;
        this.coyote = CONFIG.player.coyoteFrames;
        this.justLanded = !this.wasOnGround;
      } else {
        // Kapal kalau kena langit-langit nggak mantul kenceng, langsung lepas pelan
        this.vy = this.mode === 'ship' ? 0.3 : Math.abs(this.vy) * 0.15; 
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
    if (effectiveJump && canAutoJump && this.mode !== 'ship') {
      this.jump();
    }
    if (this.invincible > 0) this.invincible--;

    this.updateTrailSparks(dt);
    this.spawnTrailSparks();

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
    ctx.shadowBlur = 0;
    for (const spark of this.trail) {
      const alpha = Math.max(0, spark.life / spark.maxLife);
      const color = spark.color === 'accent' ? theme.accent : spark.color === 'line' ? theme.line : theme.primary;
      ctx.save();
      ctx.globalAlpha = alpha * 0.72;
      ctx.translate(spark.x, spark.y);
      ctx.rotate(spark.rot);
      ctx.fillStyle = color;

      if (spark.shape === 'circle') this.drawTrailCircle(ctx, spark.size);
      else if (spark.shape === 'ship') this.drawTrailShard(ctx, spark.size);
      else this.drawTrailPixel(ctx, spark.size);

      ctx.restore();
    }
    ctx.restore();
  }

  updateTrailSparks(dt) {
    for (const spark of this.trail) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= 0.985;
      spark.vy *= 0.96;
      spark.rot += spark.spin * dt;
      spark.life -= CONFIG.player.trailLifeStep * (spark.decay || 1);
    }
    this.trail = this.trail.filter((spark) => spark.life > 0);
  }

  spawnTrailSparks() {
    if (this.mode === 'ship') {
      if (Math.random() > 0.72) return;
    } else if (Math.random() > 0.45) {
      return;
    }

    const count = this.mode === 'ship' ? 2 : 1;
    const baseX = this.x + this.size * 0.18;
    const baseY = this.y + this.size * 0.52;

    for (let i = 0; i < count; i++) {
      const isShip = this.mode === 'ship';
      const isBall = this.mode === 'ball';
      const maxLife = 0.7 + Math.random() * 0.35;
      const scatterX = -Math.random() * this.size * (isShip ? 0.62 : 0.50);
      const scatterY = (Math.random() - 0.5) * this.size * (isShip ? 0.34 : 0.42);

      this.trail.push({
        x: baseX + scatterX,
        y: baseY + scatterY,
        vx: -1.35 - Math.random() * (isShip ? 3.4 : 2.2),
        vy: (Math.random() - 0.5) * (isShip ? 2.4 : 1.8) + this.vy * 0.06,
        rot: isShip ? this.rot + (Math.random() - 0.5) * 0.8 : Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * (isShip ? 0.18 : 0.08),
        size: Math.max(2, this.size * (0.045 + Math.random() * (isShip ? 0.07 : 0.055))),
        life: maxLife,
        maxLife,
        decay: 0.85 + Math.random() * 0.45,
        color: i === 0 ? 'primary' : isShip ? 'accent' : Math.random() > 0.65 ? 'line' : 'primary',
        shape: isShip ? 'ship' : isBall ? 'circle' : 'pixel',
      });
    }
  }

  drawTrailPixel(ctx, size) {
    ctx.fillRect(-size / 2, -size / 2, size, size);
  }

  drawTrailCircle(ctx, size) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.58, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTrailShard(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(size * 1.45, 0);
    ctx.lineTo(-size * 1.1, -size * 0.85);
    ctx.lineTo(-size * 0.65, 0);
    ctx.lineTo(-size * 1.1, size * 0.85);
    ctx.closePath();
    ctx.fill();
  }

  drawBullets(ctx, theme) {
    for (const b of this.bullets) {
      ctx.save();
      ctx.globalAlpha = b.life;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
