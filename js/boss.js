import { CONFIG, clamp, intersects } from './config.js';
import { getPerfConfig } from './perf.js';

const SPRITES = {
  speedArrow: { sheet: 'sheet2', sx: 394, sy: 18, sw: 132, sh: 104 },
  portalYellow: { sheet: 'sheet2', sx: 540, sy: 148, sw: 150, sh: 96 },
  portalPink: { sheet: 'sheet2', sx: 618, sy: 344, sw: 82, sh: 170 },
  likeChip: { sheet: 'sheet2', sx: 1068, sy: 286, sw: 72, sh: 76 },
  blueOrb: { sheet: 'sheet2', sx: 1096, sy: 218, sw: 52, sh: 52 },
};

export class CyberDemonBoss {
  constructor(mapping) {
    this.mapping = [...mapping].sort((a, b) => a.time - b.time);
    this.reset();
  }

  reset() {
    this.eventIndex = 0;
    this.activeAttacks = [];
    this.likeParticles = [];
    this.bannerText = '';
    this.bannerLife = 0;
    this.scale = 0.9;
    this.targetScale = 0.9;
    this.x = CONFIG.W / 2;
    this.y = Math.round(CONFIG.H * 0.38);
    this.isMouthOpen = false;
    this.mouthTimer = 0;
    this.glowIntensity = 0;
    this.pendingShake = 0;
    this.lastAudioTime = 0;
    this.lastAutoHazardBeat = -1;
    this.hpDisplay = 1;
    this.bodyBob = 0;
    this.bobDir = 1;
    this.hitFlash = 0;
    
    // Animation state machine
    this.animState = 'idle'; // idle, rage, attack, idle2
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.lastLockedX = 0;
    this.lastLockedY = 0;

    // Meme Overlay system
    this.overlayTimer = 0;
    this.activeOverlayKey = null;
    this.overlayAlpha = 0;

    this.isDefeated = false;
    this.explosionParticles = [];
  }

  triggerExplosion() {
    this.isDefeated = true;
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 12;
      this.explosionParticles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 10,
        life: 1.0,
        color: i % 2 === 0 ? '#ff3333' : '#ffffff'
      });
    }
  }

  notifyPlayerDamaged() {
    this.hpDisplay = Math.max(0.06, this.hpDisplay - 0.12);
  }

  takeHit() {
    this.hitFlash = 1.0;
  }

  fastForwardTimeline(audioTime) {
    this.reset();
    while (this.eventIndex < this.mapping.length && this.mapping[this.eventIndex].time <= audioTime) {
      this.eventIndex++;
    }
    this.lastAudioTime = audioTime;
  }

  update(dt, audioTime, beatFlash, playerHitbox, songProgress = 0) {
    // Always update active explosion particles
    for (const p of this.explosionParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.018 * dt;
    }
    this.explosionParticles = this.explosionParticles.filter(p => p.life > 0);

    if (this.isDefeated) {
      // Rapidly shrink scale on defeat
      this.scale = Math.max(0, this.scale - 0.025 * dt);
      return;
    }

    const seconds = dt / 60;

    // Spawn cascading mini-explosions popping off all over the boss's body near the end of the song
    if (songProgress >= 0.94) {
      if (Math.random() < 0.24 * dt) {
        const offsetX = (Math.random() - 0.5) * 200 * this.scale;
        const offsetY = (Math.random() - 0.5) * 220 * this.scale;
        const count = 5 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 8;
          this.explosionParticles.push({
            x: this.x + offsetX,
            y: this.y + offsetY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 6,
            life: 1.0,
            color: Math.random() > 0.4 ? '#ff3333' : '#ffffff'
          });
        }
        
        // Add dynamic screenshake feedback for each mini-explosion
        this.pendingShake = Math.max(this.pendingShake, 2.5);
      }
    }
    this.lastAudioTime = audioTime;
    this.glowIntensity = Math.max(this.glowIntensity * 0.9, beatFlash);
    this.hitFlash = Math.max(0, this.hitFlash - 0.08 * dt);

    // Update animation state machine
    this.updateAnimation(dt);

    // Update Meme Overlays
    this.updateOverlays(seconds);

    while (this.eventIndex < this.mapping.length && audioTime >= this.mapping[this.eventIndex].time) {
      this.triggerEvent(this.mapping[this.eventIndex], playerHitbox);
      this.eventIndex++;
    }

    this.scale += (this.targetScale - this.scale) * Math.min(1, 0.055 * dt);
    this.bodyBob += 0.022 * this.bobDir * dt * 1.05;
    if (Math.abs(this.bodyBob) > 8) this.bobDir *= -1;

    const baseY = Math.round(CONFIG.H * 0.38);
    this.y = baseY + this.bodyBob + Math.sin(audioTime * 2.6) * 4;

    this.spawnAutoHazards(audioTime, playerHitbox);
    this.hpDisplay = Math.max(0, 1 - songProgress);

    if (this.mouthTimer > 0) {
      this.mouthTimer -= seconds;
      this.isMouthOpen = true;
    } else {
      this.isMouthOpen = false;
    }

    for (const attack of this.activeAttacks) {
      attack.life -= seconds;
      attack.age += seconds;
      attack.isHittingPlayer = false;
      
      if (attack.type === 'pillar' || attack.type === 'spike' || attack.type === 'block') {
        attack.x -= (CONFIG.levels[2].speed * 0.95) * dt;
      }

      if (attack.type === 'warning' && playerHitbox) {
        if (attack.life > 0.35) {
          const px = playerHitbox.x + playerHitbox.w / 2;
          const py = playerHitbox.y + playerHitbox.h / 2;
          const followSpeed = 0.08 * dt; 
          attack.targetX += (px - attack.targetX) * followSpeed;
          attack.targetY += (py - attack.targetY) * followSpeed;
          this.lastLockedX = attack.targetX;
          this.lastLockedY = attack.targetY;
        }
      }

      if (playerHitbox && this.attackHitsPlayer(attack, playerHitbox)) attack.isHittingPlayer = true;
    }

    this.activeAttacks = this.activeAttacks.filter((attack) => attack.life > 0 && (attack.type === 'laser' || attack.type === 'warning' || attack.x > -120));

    if (this.bannerLife > 0) this.bannerLife -= seconds;
  }

  updateAnimation(dt) {
    this.frameTimer += dt * 0.35; // Default slow (was 0.45)

    if (this.animState === 'idle') {
      this.currentFrame = Math.floor(this.frameTimer) % 8;
    } 
    else if (this.animState === 'rage') {
      const rageSpeed = 0.28; // Slower rage loop (was 0.45 implicitly)
      this.currentFrame = 8 + (Math.floor(this.frameTimer * rageSpeed) % 8);
    } 
    else if (this.animState === 'attack') {
      const animSpeed = 0.22; // Slower attack sequence (was 0.35)
      const frames = [18, 19, 20, 21, 22, 23, 23, 23, 23, 23, 23]; // Even longer hold on 23
      const idx = Math.floor(this.frameTimer * animSpeed) % frames.length;
      this.currentFrame = frames[idx];
    } 
    else if (this.animState === 'idle2') {
      const idle2Speed = 0.3; // Slower transition back
      const frames = [24, 25, 26, 27, 28, 29, 30, 31];
      const idx = Math.floor(this.frameTimer * idle2Speed) % frames.length;
      this.currentFrame = frames[idx];
      if (idx === frames.length - 1) {
        this.animState = 'idle';
        this.frameTimer = 0;
      }
    }
  }

  updateOverlays(dt) {
    this.overlayTimer -= dt;
    if (this.overlayTimer <= 0) {
      this.overlayTimer = 5 + Math.random() * 6; // Every 5-11 seconds
      this.activeOverlayKey = null; // Reset to pick new one in draw
      this.overlayAlpha = 0;
    }

    if (this.overlayTimer > 1.5) {
      this.overlayAlpha = Math.min(0.22, this.overlayAlpha + dt * 0.4);
    } else {
      this.overlayAlpha = Math.max(0, this.overlayAlpha - dt * 1.2);
    }
  }

  triggerEvent(event, playerHitbox) {
    if (event.type === 'BOSS_APPEAR') {
      this.targetScale = 1;
      this.scale = Math.max(this.scale, 0.08);
      this.bannerText = event.text || 'BOSS';
      this.bannerLife = 2.2;
      this.pendingShake = Math.max(this.pendingShake, 7);
      return;
    }

    if (event.type === 'PILLAR_SPAWN') {
      this.activeAttacks.push({
        type: 'pillar',
        position: event.position,
        x: CONFIG.W + 54,
        y: event.position === 'top' ? 0 : CONFIG.GROUND_Y - 118,
        w: 54,
        h: event.position === 'top' ? 178 : 118,
        life: 8,
        age: 0,
      });
      return;
    }

    if (event.type === 'FLOOR_SPIKES') {
      const count = event.count || 2;
      for (let i = 0; i < count; i++) {
        this.activeAttacks.push({
          type: 'spike',
          x: CONFIG.W + 60 + i * 64,
          y: CONFIG.GROUND_Y - 38,
          w: 30,
          h: 38,
          life: 7,
          age: 0,
        });
      }
      return;
    }

    if (event.type === 'BLOCK_STACK') {
      const height = event.height || 1;
      for (let i = 0; i < height; i++) {
        this.activeAttacks.push({
          type: 'block',
          x: CONFIG.W + 62,
          y: CONFIG.GROUND_Y - 36 * (i + 1),
          w: 38,
          h: 36,
          life: 7,
          age: 0,
        });
      }
      return;
    }

    if (event.type === 'LASER_WARNING') {
      const tx = playerHitbox ? playerHitbox.x + playerHitbox.w / 2 : CONFIG.W * 0.2;
      const ty = playerHitbox ? playerHitbox.y + playerHitbox.h / 2 : CONFIG.GROUND_Y / 2;
      this.activeAttacks.push({ 
        type: 'warning', 
        targetX: tx, 
        targetY: ty, 
        life: 1.35, 
        age: 0 
      });
      this.pendingShake = Math.max(this.pendingShake, 3);
      this.mouthTimer = Math.max(this.mouthTimer, 1.35);
      this.animState = 'rage';
      this.frameTimer = 0;
      return;
    }

    if (event.type === 'LASER_FIRE') {
      this.activeAttacks.push({ 
        type: 'laser', 
        targetX: this.lastLockedX, 
        targetY: this.lastLockedY, 
        life: event.duration || 1, 
        age: 0 
      });
      this.pendingShake = Math.max(this.pendingShake, 10);
      this.mouthTimer = Math.max(this.mouthTimer, event.duration || 1);
      this.animState = 'attack';
      this.frameTimer = 0;

      setTimeout(() => {
        if (this.animState === 'attack') {
          this.animState = 'idle2';
          this.frameTimer = 0;
        }
      }, (event.duration || 1) * 1000);

      return;
    }

    if (event.type === 'MOUTH_VORTEX') {
      this.mouthTimer = event.duration || 3;
      this.isMouthOpen = true;
      this.pendingShake = Math.max(this.pendingShake, 5);
      return;
    }
  }

  takeShake() {
    const value = this.pendingShake;
    this.pendingShake = 0;
    return value;
  }

  checkCollision() {
    return this.activeAttacks.some((attack) => attack.isHittingPlayer);
  }

  draw(ctx, assets, theme, playerHitbox, beatFlash, frame) {
    if (this.overlayAlpha > 0) this.drawMemeOverlay(ctx, assets);
    if (this.scale > 0.02) this.drawBoss(ctx, assets, theme, beatFlash, frame);
    this.drawAttacks(ctx, assets, theme, playerHitbox, frame);
    this.drawBanner(ctx, theme);
    this.drawExplosions(ctx);
  }

  drawExplosions(ctx) {
    for (const p of this.explosionParticles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawMemeOverlay(ctx, assets) {
    if (!assets.overlayKeys || assets.overlayKeys.length === 0) return;
    
    if (!this.activeOverlayKey) {
      this.activeOverlayKey = assets.overlayKeys[Math.floor(Math.random() * assets.overlayKeys.length)];
      // Randomize position when a new overlay starts
      this.overlayPosX = 50 + Math.random() * (CONFIG.W - 250);
      this.overlayPosY = 50 + Math.random() * (CONFIG.H - 200);
      // Randomize scale slightly (0.4 to 0.6 of screen)
      this.overlayScale = 0.35 + Math.random() * 0.2;
    }

    const img = assets.get(this.activeOverlayKey);
    if (!img) return;

    ctx.save();
    ctx.globalAlpha = this.overlayAlpha;
    
    const baseScale = Math.min(CONFIG.W / img.width, CONFIG.H / img.height);
    const finalScale = baseScale * this.overlayScale;
    const w = img.width * finalScale;
    const h = img.height * finalScale;
    
    // Draw at randomized position
    ctx.drawImage(img, this.overlayPosX, this.overlayPosY, w, h);
    
    ctx.restore();
  }

  drawBoss(ctx, assets, theme, beatFlash, frame) {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(this.scale, this.scale);

    const pulse = 1 + Math.sin(this.lastAudioTime * 20.94) * 0.025 + beatFlash * 0.04;
    ctx.scale(pulse, pulse);

    const sheet = assets.get('boss_sheet');
    if (sheet) {
      const fw = 258;
      const fh = 288;
      const cols = 8;
      const col = this.currentFrame % cols;
      const row = Math.floor(this.currentFrame / cols);

      ctx.drawImage(
        sheet, 
        col * fw, row * fh, fw, fh,
        -fw / 2, -fh / 2, fw, fh
      );

      // Hit flash disabled as requested
      /*
      if (this.hitFlash > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = this.hitFlash * 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
        ctx.restore();
      }
      */
    } else {
      ctx.fillStyle = theme.fbC;
      ctx.fillRect(-100, -100, 200, 200);
    }

    const hpRatio = Math.max(0, Math.min(1, this.hpDisplay));
    const barW = 160;
    const barH = 10;
    const barY = -160;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(-barW / 2, barY, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa00' : '#ff2244';
    ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, barY, barW, barH);
    ctx.restore();
  }

  drawAttacks(ctx, assets, theme, playerHitbox, frame) {
    for (const attack of this.activeAttacks) {
      if (attack.type === 'warning') this.drawLaserWarning(ctx, attack, assets, frame);
      else if (attack.type === 'laser') this.drawLaser(ctx, attack, assets, frame);
      else if (attack.type === 'pillar') this.drawPillar(ctx, assets, attack, theme, frame);
      else if (attack.type === 'spike') this.drawSpikeAttack(ctx, attack, theme);
      else if (attack.type === 'block') this.drawBlockAttack(ctx, attack, theme);
    }
  }

  drawLaserWarning(ctx, attack, assets, frame) {
    const currentAnimFrame = Math.floor(frame * 0.8) % 35;
    const aimImg = assets.get(`laser_aim_${currentAnimFrame}`);
    if (!aimImg) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // Ensure glowing transparency
    const mx = this.x;
    const my = this.y + 42; 
    const angle = Math.atan2(attack.targetY - my, attack.targetX - mx);
    const dist = Math.sqrt((attack.targetX - mx) ** 2 + (attack.targetY - my) ** 2) * 2.8;
    
    ctx.translate(mx, my);
    ctx.rotate(angle);
    ctx.drawImage(aimImg, 0, -25, dist, 50);
    ctx.restore();
  }

  drawLaser(ctx, attack, assets, frame) {
    const currentAnimFrame = Math.floor(frame * 0.6) % 18;
    const fireImg = assets.get(`laser_fire_${currentAnimFrame}`);
    if (!fireImg) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen'; // Ensure glowing transparency
    const mx = this.x;
    const my = this.y + 42;
    const angle = Math.atan2(attack.targetY - my, attack.targetX - mx);
    const dist = CONFIG.W * 2.8;
    
    ctx.translate(mx, my);
    ctx.rotate(angle);
    ctx.globalAlpha = Math.min(1, attack.life * 5.0);
    ctx.drawImage(fireImg, 0, -70, dist, 140);
    ctx.restore();
  }

  drawPillar(ctx, assets, attack, theme, frame) {
    ctx.save();
    ctx.globalAlpha = clamp(attack.life, 0, 1);
    
    const cols = 2;
    const rows = 10;
    const cw = attack.w / cols;
    const ch = attack.h / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = attack.x + c * cw;
        const y = attack.y + r * ch;
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeRect(x, y, cw, ch);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.strokeRect(x + 4, y + 4, cw - 8, ch - 8);
      }
    }
    ctx.restore();
  }

  drawSpikeAttack(ctx, attack, theme) {
    ctx.save();
    ctx.fillStyle = theme.obC;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(attack.x + attack.w / 2, attack.y);
    ctx.lineTo(attack.x + attack.w, attack.y + attack.h);
    ctx.lineTo(attack.x, attack.y + attack.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawBlockAttack(ctx, attack, theme) {
    ctx.save();
    ctx.fillStyle = theme.obC;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.fillRect(attack.x, attack.y, attack.w, attack.h);
    ctx.restore();
  }

  drawBanner(ctx, theme) {
    if (this.bannerLife <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(this.bannerLife / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '24px Pusab, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.bannerText, CONFIG.W / 2, 96);
    ctx.restore();
  }

  attackHitsPlayer(attack, playerHitbox) {
    // Add a safety margin (padding) to make collisions less punishing
    const margin = 8;
    const safeHitbox = {
      x: playerHitbox.x + margin,
      y: playerHitbox.y + margin,
      w: playerHitbox.w - margin * 2,
      h: playerHitbox.h - margin * 2
    };

    if (attack.type === 'laser') {
      const mx = this.x;
      const my = this.y + 42;
      const angle = Math.atan2(attack.targetY - my, attack.targetX - mx);
      const px = safeHitbox.x + safeHitbox.w / 2;
      const py = safeHitbox.y + safeHitbox.h / 2;
      const distToLine = Math.abs((attack.targetY - my) * px - (attack.targetX - mx) * py + attack.targetX * my - attack.targetY * mx) / Math.sqrt((attack.targetY - my) ** 2 + (attack.targetX - mx) ** 2);
      return distToLine < 28; // Reduced from 35 for more leniency
    }
    if (attack.type === 'pillar') return intersects(safeHitbox, { x: attack.x + 4, y: attack.y + 4, w: attack.w - 8, h: attack.h - 8 });
    if (attack.type === 'spike' || attack.type === 'block') return intersects(safeHitbox, { x: attack.x + 4, y: attack.y + 4, w: attack.w - 8, h: attack.h - 8 });
    return false;
  }

  spawnAutoHazards(audioTime, playerHitbox) {
    const lastMapped = this.mapping.length ? this.mapping[this.mapping.length - 1].time : 27.6;
    const mappingEnd = Math.max(27.6, lastMapped + 2);
    if (audioTime < mappingEnd) return;
    const beat = Math.floor((audioTime - mappingEnd) / 2.2);
    if (beat === this.lastAutoHazardBeat) return;
    this.lastAutoHazardBeat = beat;

    const cycle = beat % 5;
    if (cycle === 0) this.triggerEvent({ type: 'FLOOR_SPIKES', count: 3, time: audioTime });
    else if (cycle === 1) this.triggerEvent({ type: 'BLOCK_STACK', height: 1 + (beat % 2), time: audioTime });
    else if (cycle === 2) this.triggerEvent({ type: 'PILLAR_SPAWN', position: beat % 4 === 0 ? 'top' : 'bottom', time: audioTime });
    else if (cycle === 3 || cycle === 4) this.triggerEvent({ type: 'LASER_WARNING', time: audioTime }, playerHitbox);

    if (cycle === 3 || cycle === 4) {
      window.setTimeout(() => {
        this.triggerEvent({ type: 'LASER_FIRE', duration: 0.9, time: audioTime + 0.9 }, playerHitbox);
      }, 1350);
    }
  }
}
