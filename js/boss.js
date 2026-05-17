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
    this.likeTimer = 0;
    this.glowIntensity = 0;
    this.pendingShake = 0;
    this.lastAudioTime = 0;
    this.lastAutoHazardBeat = -1;
    this.hpDisplay = 1;
    this.bodyBob = 0;
    this.bobDir = 1;
  }

  notifyPlayerDamaged() {
    this.hpDisplay = Math.max(0.06, this.hpDisplay - 0.12);
  }

  /** Sinkronkan indeks event tanpa memicu spawn (untuk resume checkpoint). */
  fastForwardTimeline(audioTime) {
    this.reset();
    while (this.eventIndex < this.mapping.length && this.mapping[this.eventIndex].time <= audioTime) {
      this.eventIndex++;
    }
    this.lastAudioTime = audioTime;
  }

  update(dt, audioTime, beatFlash, playerHitbox) {
    const seconds = dt / 60;
    this.lastAudioTime = audioTime;
    this.glowIntensity = Math.max(this.glowIntensity * 0.9, beatFlash);

    while (this.eventIndex < this.mapping.length && audioTime >= this.mapping[this.eventIndex].time) {
      this.triggerEvent(this.mapping[this.eventIndex]);
      this.eventIndex++;
    }

    this.scale += (this.targetScale - this.scale) * Math.min(1, 0.055 * dt);

    this.bodyBob += 0.022 * this.bobDir * dt * 1.05;
    if (Math.abs(this.bodyBob) > 8) this.bobDir *= -1;

    const baseY = Math.round(CONFIG.H * 0.38);
    this.y = baseY + this.bodyBob + Math.sin(audioTime * 2.6) * 4;

    this.spawnAutoHazards(audioTime);

    this.hpDisplay = Math.min(1, this.hpDisplay + 0.00014 * dt);

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
      if (playerHitbox && this.attackHitsPlayer(attack, playerHitbox)) attack.isHittingPlayer = true;
    }

    this.activeAttacks = this.activeAttacks.filter((attack) => attack.life > 0 && attack.x > -120);

    if (this.bannerLife > 0) this.bannerLife -= seconds;
  }

  triggerEvent(event) {
    console.log('[boss] trigger', event.type, event.time);

    if (event.type === 'BOSS_APPEAR') {
      this.targetScale = 1;
      this.scale = Math.max(this.scale, 0.08);
      this.bannerText = event.text || 'BOSS';
      this.bannerLife = 2.2;
      this.pendingShake = Math.max(this.pendingShake, 7);
      return;
    }

    if (event.type === 'PILLAR_SPAWN') {
      const spawnPillar = (pos) => {
        this.activeAttacks.push({
          type: 'pillar',
          position: pos,
          x: CONFIG.W + 54,
          y: pos === 'top' ? 0 : CONFIG.GROUND_Y - 118,
          w: 54,
          h: pos === 'top' ? 178 : 118,
          life: 8,
          age: 0,
        });
      };
      spawnPillar(event.position);
      if (event.mirror) {
        spawnPillar(event.position === 'top' ? 'bottom' : 'top');
      }
      return;
    }

    if (event.type === 'FLOOR_SPIKES') {
      const count = event.count || 2;
      for (let i = 0; i < count; i++) {
        this.activeAttacks.push({
          type: 'spike',
          x: CONFIG.W + 60 + i * 34,
          y: CONFIG.GROUND_Y - 38,
          w: 30,
          h: 38,
          life: 7,
          age: 0,
        });
        if (event.mirror) {
          this.activeAttacks.push({
            type: 'spike',
            x: CONFIG.W + 60 + i * 34,
            y: 0,
            w: 30,
            h: 38,
            life: 7,
            age: 0,
            inverted: true
          });
        }
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
        if (event.mirror) {
          this.activeAttacks.push({
            type: 'block',
            x: CONFIG.W + 62,
            y: i * 36,
            w: 38,
            h: 36,
            life: 7,
            age: 0,
          });
        }
      }
      return;
    }

    if (event.type === 'LASER_WARNING') {
      this.activeAttacks.push({ type: 'warning', y: event.y, life: 1.35, age: 0, x: 0 });
      this.pendingShake = Math.max(this.pendingShake, 3);
      return;
    }

    if (event.type === 'LASER_FIRE') {
      this.activeAttacks.push({ type: 'laser', y: event.y, life: event.duration || 1, age: 0, x: 0 });
      this.pendingShake = Math.max(this.pendingShake, 10);
      return;
    }

    if (event.type === 'MOUTH_VORTEX') {
      this.mouthTimer = event.duration || 3;
      this.isMouthOpen = true;
      this.pendingShake = Math.max(this.pendingShake, 5);
      return;
    }

    if (event.type === 'LIKE_BURST') {
      this.pendingShake = Math.max(this.pendingShake, 5);
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
    if (this.scale > 0.02) this.drawBoss(ctx, assets, theme, beatFlash, frame);
    this.drawAttacks(ctx, assets, theme, playerHitbox, frame);
    this.drawBanner(ctx, theme);
  }

  drawBoss(ctx, assets, theme, beatFlash, frame) {
    const glowFx = !CONFIG.performance.lowFx && getPerfConfig().shadowBlur;
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(this.scale, this.scale);

    const pulse = 1 + Math.sin(this.lastAudioTime * 20.94) * 0.025 + beatFlash * 0.04;
    ctx.scale(pulse, pulse);

    ctx.globalAlpha = 0.98;

    const bw = CONFIG.W * 0.52;
    const bh = CONFIG.H * 0.58;
    const bx = -bw / 2;
    const by = -bh * 0.42;
    const cx = 0;
    const rage = this.hpDisplay <= 0.4;
    const eyePulse = beatFlash;

    if (getPerfConfig().tier !== 'low') {
      this.drawDigitalTower(ctx, -232, -54, -1, frame);
      this.drawDigitalTower(ctx, 232, -54, 1, frame);
      this.drawPixelFog(ctx, frame);
    }

    const bodyColor = rage ? '#6b1010' : '#1a2a6c';
    const glowColor = rage ? '#ff2244' : '#00d4ff';

    const mouthOpen = this.isMouthOpen ? Math.min(1, 0.88 + beatFlash * 0.08) : 0.22;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowFx ? 16 + eyePulse * 18 : 0;
    ctx.fillStyle = bodyColor;

    ctx.beginPath();
    ctx.moveTo(Math.round(bx + bw * 0.04), Math.round(by + bh));
    ctx.lineTo(Math.round(bx), Math.round(by + bh * 0.35));
    ctx.quadraticCurveTo(bx, by, Math.round(bx + bw * 0.06), Math.round(by));
    ctx.lineTo(Math.round(bx + bw * 0.94), Math.round(by));
    ctx.quadraticCurveTo(Math.round(bx + bw), by, Math.round(bx + bw), Math.round(by + bh * 0.35));
    ctx.lineTo(Math.round(bx + bw * 0.96), Math.round(by + bh));
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = glowFx ? 8 : 0;
    ctx.fillStyle = rage ? '#4a0606' : '#152060';

    ctx.beginPath();
    ctx.moveTo(Math.round(bx + bw * 0.15), Math.round(by));
    ctx.lineTo(Math.round(bx + bw * 0.06), Math.round(by - bh * 0.16));
    ctx.lineTo(Math.round(bx + bw * 0.3), Math.round(by - bh * 0.02));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(Math.round(bx + bw * 0.85), Math.round(by));
    ctx.lineTo(Math.round(bx + bw * 0.94), Math.round(by - bh * 0.16));
    ctx.lineTo(Math.round(bx + bw * 0.7), Math.round(by - bh * 0.02));
    ctx.closePath();
    ctx.fill();

    const eyeY = by + bh * 0.28;
    const eyeR = bw * 0.11;
    const lEyeX = cx - bw * 0.22;
    const rEyeX = cx + bw * 0.22;
    const eyeGlow = rage ? '#ff4444' : '#00ffff';

    ctx.shadowColor = eyeGlow;
    ctx.shadowBlur = glowFx ? 20 + eyePulse * 16 : 0;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(Math.round(lEyeX), Math.round(eyeY), eyeR, 0, Math.PI * 2);
    ctx.arc(Math.round(rEyeX), Math.round(eyeY), eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = eyeGlow;
    ctx.lineWidth = eyeR * 0.18;
    ctx.beginPath();
    ctx.arc(Math.round(lEyeX), Math.round(eyeY), eyeR * 0.85, 0, Math.PI * 2);
    ctx.arc(Math.round(rEyeX), Math.round(eyeY), eyeR * 0.85, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = glowFx ? 12 : 0;
    ctx.fillStyle = eyeGlow;
    const pupilR = eyeR * 0.35 * (1 + eyePulse * 0.3);
    ctx.beginPath();
    ctx.arc(Math.round(lEyeX), Math.round(eyeY), pupilR, 0, Math.PI * 2);
    ctx.arc(Math.round(rEyeX), Math.round(eyeY), pupilR, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#4267B2';
    ctx.shadowBlur = glowFx ? 18 + eyePulse * 12 : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `bold ${Math.round(bw * 0.22)}px "Arial Black", Impact, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', Math.round(cx), Math.round(by + bh * 0.58));

    if (mouthOpen > 0.5 && glowFx && beatFlash > 0.45) {
      ctx.strokeStyle = `rgba(66,103,178,${beatFlash * 0.38})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + frame * 0.018;
        const r1 = bw * 0.12;
        const r2 = bw * 0.22;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r1, Math.round(by + bh * 0.58 + Math.sin(angle) * r1));
        ctx.lineTo(cx + Math.cos(angle) * r2, Math.round(by + bh * 0.58 + Math.sin(angle) * r2));
        ctx.stroke();
      }
    }

    const mouthW = bw * 0.42;
    const mouthH = bh * 0.12 * (0.22 + mouthOpen * 0.78);
    const mouthX = cx - mouthW / 2;
    const mouthY = by + bh * 0.72;

    ctx.shadowColor = rage ? '#ff0044' : '#001144';
    ctx.shadowBlur = glowFx ? 10 : 0;
    ctx.fillStyle = '#010104';
    ctx.beginPath();
    ctx.ellipse(Math.round(cx), Math.round(mouthY), mouthW / 2, mouthH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (mouthOpen > 0.32) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 0;
      const toothW = mouthW / 7;
      const toothH = mouthH * 0.55;
      for (let t = 0; t < 6; t++) {
        const tx = mouthX + toothW * t + toothW * 0.1;
        const ty = mouthY - mouthH / 2;
        ctx.beginPath();
        ctx.moveTo(tx, ty + toothH * mouthOpen);
        ctx.lineTo(tx + toothW * 0.4, ty);
        ctx.lineTo(tx + toothW * 0.8, ty + toothH * mouthOpen);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    const barW = bw * 0.62;
    const barH = 12;
    const barX = cx - barW / 2;
    const barY = by - 28;
    const hpRatio = Math.max(0, Math.min(1, this.hpDisplay));

    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa00' : '#ff2244';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`IBLIS FACEBOOK — ${Math.round(hpRatio * 100)}%`, Math.round(cx), Math.round(barY + barH / 2));

    ctx.restore();
  }


  drawDigitalTower(ctx, x, y, dir, frame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#06071a';
    ctx.strokeStyle = '#2c5cff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.82;
    ctx.fillRect(-24, -124, 48, 260);
    ctx.strokeRect(-24, -124, 48, 260);

    ctx.fillStyle = '#2b58ff';
    ctx.fillRect(-18, -82, 36, 62);
    ctx.fillRect(-18, -8, 36, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = '7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dir < 0 ? 'FRIEND' : 'FEED', 0, -68);
    ctx.fillText('REQ', 0, -58);

    const rows = CONFIG.performance.lowFx ? 4 : 6;
    for (let i = 0; i < rows; i++) {
      const yy = -44 + i * 16;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#87d8ff';
      ctx.fillRect(-12, yy, 8, 8);
      ctx.fillStyle = '#1affff';
      ctx.fillRect(0, yy + 2, 12, 3);
      if ((Math.floor(frame / 8) + i) % 3 === 0) {
        ctx.fillStyle = '#ff245c';
        ctx.fillRect(11, yy - 1, 5, 5);
      }
    }
    ctx.restore();
  }

  drawPixelFog(ctx, frame) {
    ctx.save();
    ctx.globalAlpha = 0.58;
    for (let i = 0; i < 18; i++) {
      const x = -260 + i * 31 + Math.sin(frame * 0.018 + i) * 8;
      const y = 150 + Math.sin(frame * 0.026 + i * 2) * 12;
      ctx.fillStyle = i % 2 === 0 ? '#4b32cc' : '#167ee6';
      ctx.fillRect(x, y, 42, 18 + (i % 3) * 8);
    }
    ctx.restore();
  }

  drawHorn(ctx, x, y, dir, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = '#b7f7ff';
    ctx.strokeStyle = '#142f66';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.quadraticCurveTo(28, -12, 76, -52);
    ctx.quadraticCurveTo(50, 18, 12, 58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawEye(ctx, x, y, theme, beatFlash) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#02030a';
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7efcff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 8 : 22 + beatFlash * 16;
    ctx.beginPath();
    ctx.arc(0, 0, 13 + beatFlash * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0.15, Math.PI * 1.75);
    ctx.stroke();
    ctx.restore();
  }

  drawHeadLogo(ctx, theme, beatFlash) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#7efcff';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 6 : 20 + beatFlash * 18;
    ctx.font = 'bold 62px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', 0, -118);
    ctx.restore();
  }

  drawChestLogo(ctx, theme, beatFlash) {
    ctx.save();
    const rays = CONFIG.performance.lowFx ? 10 : 18;
    ctx.globalAlpha = 0.45 + beatFlash * 0.3;
    ctx.strokeStyle = '#7efcff';
    ctx.lineWidth = 3;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + this.lastAudioTime * 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28 + 2);
      ctx.lineTo(Math.cos(a) * (76 + beatFlash * 12), Math.sin(a) * (76 + beatFlash * 12) + 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 8 : 28 + beatFlash * 24;
    ctx.font = 'bold 108px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', 0, 18);
    ctx.restore();
  }

  drawMouth(ctx, assets, theme, frame) {
    ctx.save();
    const mouthY = 116;
    const open = this.isMouthOpen ? 1 : 0;
    ctx.fillStyle = '#010104';
    ctx.shadowColor = '#ff1a75';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 5 : 20;
    ctx.beginPath();
    ctx.ellipse(0, mouthY, 78, 30 + open * 28, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.isMouthOpen) {
      drawSheetSprite(ctx, assets, SPRITES.portalPink, -44, mouthY - 52, 88, 104, frame * 0.04);
      ctx.strokeStyle = '#ff4aa2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, mouthY, 34 + Math.sin(frame * 0.2) * 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#4267B2';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const icons = ['f', '1', '@', '+', '#'];
      for (let i = 0; i < 18; i++) {
        const a = frame * 0.035 + i * 0.72;
        const r = 8 + i * 2.2;
        ctx.globalAlpha = 0.25 + i / 28;
        ctx.fillText(icons[i % icons.length], Math.cos(a) * r, mouthY + Math.sin(a) * r * 0.45);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      for (let i = -4; i <= 4; i++) ctx.fillRect(i * 14 - 4, mouthY - 18, 8, 12);
    }
    ctx.restore();
  }

  drawAttacks(ctx, assets, theme, playerHitbox, frame) {
    for (const attack of this.activeAttacks) {
      if (attack.type === 'warning') this.drawLaserWarning(ctx, attack, theme, frame);
      else if (attack.type === 'laser') this.drawLaser(ctx, attack, theme);
      else if (attack.type === 'pillar') this.drawPillar(ctx, assets, attack, theme, frame);
      else if (attack.type === 'spike') this.drawSpikeAttack(ctx, attack, theme);
      else if (attack.type === 'block') this.drawBlockAttack(ctx, attack, theme);
    }
  }

  drawLaserWarning(ctx, attack, theme, frame) {
    ctx.save();
    const alpha = 0.24 + Math.sin(frame * 0.35) * 0.12;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(0, attack.y - 8, CONFIG.W, 16);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([16, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, attack.y);
    ctx.lineTo(CONFIG.W, attack.y);
    ctx.stroke();
    ctx.restore();
  }

  drawLaser(ctx, attack, theme) {
    ctx.save();
    const mx = Math.round(clamp(this.x, 60, CONFIG.W * 0.42));
    const my = attack.y;

    ctx.globalCompositeOperation = getPerfConfig().shadowBlur ? 'lighter' : 'source-over';

    const beam = ctx.createLinearGradient(mx, my, CONFIG.W, my);
    beam.addColorStop(0, 'rgba(255, 240, 255, 0.95)');
    beam.addColorStop(0.12, 'rgba(255, 40, 120, 0.75)');
    beam.addColorStop(0.45, 'rgba(255, 30, 80, 0.35)');
    beam.addColorStop(1, 'rgba(255, 20, 60, 0.08)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(mx, my - 6);
    ctx.lineTo(CONFIG.W + 8, my - 14);
    ctx.lineTo(CONFIG.W + 8, my + 14);
    ctx.lineTo(mx, my + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 30, 80, 0.28)';
    ctx.fillRect(0, my - 38, CONFIG.W, 76);

    ctx.shadowColor = '#00fff6';
    ctx.shadowBlur = getPerfConfig().shadowBlur ? 26 : 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - 2, my - 10, CONFIG.W - mx + 4, 20);

    ctx.shadowBlur = getPerfConfig().shadowBlur ? 18 : 0;
    ctx.fillStyle = theme.primary;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(mx, my - 4, CONFIG.W - mx, 8);
    ctx.globalAlpha = 1;

    ctx.shadowBlur = getPerfConfig().shadowBlur ? 22 : 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(mx, my, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 60, 120, 0.7)';
    ctx.beginPath();
    ctx.arc(mx, my, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPillar(ctx, assets, attack, theme, frame) {
    ctx.save();
    ctx.globalAlpha = clamp(attack.life, 0, 1);
    ctx.fillStyle = '#07102c';
    ctx.strokeStyle = '#7efcff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 3 : 16;
    ctx.fillRect(attack.x, attack.y, attack.w, attack.h);
    ctx.strokeRect(attack.x, attack.y, attack.w, attack.h);

    const capY = attack.position === 'top' ? attack.y + attack.h - 18 : attack.y - 18;
    drawSheetSprite(ctx, assets, SPRITES.portalYellow, attack.x - 26, capY, attack.w + 52, 44);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let y = attack.y + 16; y < attack.y + attack.h - 12; y += 24) {
      ctx.fillRect(attack.x + 9, y, attack.w - 18, 4);
    }
    ctx.restore();
  }

  drawSpikeAttack(ctx, attack, theme) {
    ctx.save();
    ctx.fillStyle = theme.obC;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.obC;
    ctx.shadowBlur = CONFIG.performance.lowFx ? 4 : 12;
    ctx.beginPath();
    if (attack.inverted) {
      ctx.moveTo(attack.x + attack.w / 2, attack.y + attack.h);
      ctx.lineTo(attack.x + attack.w, attack.y);
      ctx.lineTo(attack.x, attack.y);
    } else {
      ctx.moveTo(attack.x + attack.w / 2, attack.y);
      ctx.lineTo(attack.x + attack.w, attack.y + attack.h);
      ctx.lineTo(attack.x, attack.y + attack.h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawBlockAttack(ctx, attack, theme) {
    ctx.save();
    const grad = ctx.createLinearGradient(attack.x, attack.y, attack.x + attack.w, attack.y + attack.h);
    grad.addColorStop(0, theme.obC);
    grad.addColorStop(1, theme.obC2);
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = theme.obC;
    ctx.shadowBlur = CONFIG.performance.lowFx ? 4 : 12;
    ctx.fillRect(attack.x, attack.y, attack.w, attack.h);
    ctx.strokeRect(attack.x, attack.y, attack.w, attack.h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(attack.x + 8, attack.y + 8, attack.w - 16, attack.h - 16);
    ctx.restore();
  }

  drawBanner(ctx, theme) {
    if (this.bannerLife <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(this.bannerLife / 0.8, 0, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '24px Pusab, Impact, Arial Black, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 5 : 18;
    ctx.fillText(this.bannerText, CONFIG.W / 2, 96);
    ctx.restore();
  }

  attackHitsPlayer(attack, playerHitbox) {
    if (attack.type === 'laser') {
      return intersects(playerHitbox, {
        x: 0,
        y: attack.y - 17,
        w: CONFIG.W,
        h: 34,
      });
    }

    if (attack.type === 'pillar') {
      return intersects(playerHitbox, {
        x: attack.x + 6,
        y: attack.y + 4,
        w: attack.w - 12,
        h: attack.h - 8,
      });
    }

    if (attack.type === 'spike' || attack.type === 'block') {
      const inset = attack.type === 'spike' ? 7 : 4;
      return intersects(playerHitbox, {
        x: attack.x + inset,
        y: attack.y + inset,
        w: attack.w - inset * 2,
        h: attack.h - inset,
      });
    }

    return false;
  }

  spawnAutoHazards(audioTime) {
    const mappingEnd = 27.6;
    if (audioTime < mappingEnd) return;
    const beat = Math.floor((audioTime - mappingEnd) / 2.2);
    if (beat === this.lastAutoHazardBeat) return;
    this.lastAutoHazardBeat = beat;

    const cycle = beat % 5;
    if (cycle === 0) this.triggerEvent({ type: 'FLOOR_SPIKES', count: 3, time: audioTime });
    else if (cycle === 1) this.triggerEvent({ type: 'BLOCK_STACK', height: 1 + (beat % 2), time: audioTime });
    else if (cycle === 2) this.triggerEvent({ type: 'PILLAR_SPAWN', position: beat % 4 === 0 ? 'top' : 'bottom', time: audioTime });
    else if (cycle === 3) this.triggerEvent({ type: 'LASER_WARNING', y: beat % 2 === 0 ? 314 : 350, time: audioTime });
    else this.triggerEvent({ type: 'LASER_WARNING', y: CONFIG.GROUND_Y - 110, time: audioTime });

    const lowLaserY = CONFIG.GROUND_Y - 110;
    if (cycle === 3) {
      window.setTimeout(() => {
        this.triggerEvent({ type: 'LASER_FIRE', y: beat % 2 === 0 ? 314 : 350, duration: 0.9, time: audioTime + 0.9 });
      }, 620);
    } else if (cycle === 4) {
      window.setTimeout(() => {
        this.triggerEvent({ type: 'LASER_FIRE', y: lowLaserY, duration: 0.85, time: audioTime + 0.85 });
      }, 620);
    }
  }

  spawnLikes(_count) {
    /* Dinonaktifkan: sprite Sheet02 + ratusan partikel = lag & “muntahan” ikon, bukan laser GD. */
  }
}

function drawSheetSprite(ctx, assets, frame, x, y, w, h, rotation = 0) {
  const sheet = assets?.images?.get(frame.sheet);
  if (!sheet) return false;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (rotation) ctx.rotate(rotation);
  ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}
