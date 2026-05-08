import { CONFIG, clamp } from './config.js';
import { intersects } from './obstacles.js';

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
    this.scale = 0;
    this.targetScale = 0;
    this.x = 610;
    this.y = 162;
    this.isMouthOpen = false;
    this.mouthTimer = 0;
    this.likeTimer = 0;
    this.glowIntensity = 0;
    this.pendingShake = 0;
    this.lastAudioTime = 0;
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
    this.y = 164 + Math.sin(audioTime * 2.6) * 5;

    if (this.mouthTimer > 0) {
      this.mouthTimer -= seconds;
      this.isMouthOpen = true;
      this.likeTimer -= seconds;
      if (this.likeTimer <= 0) {
        this.spawnLikes(2);
        this.likeTimer = CONFIG.performance.lowFx ? 0.28 : 0.16;
      }
    } else {
      this.isMouthOpen = false;
    }

    for (const attack of this.activeAttacks) {
      attack.life -= seconds;
      attack.age += seconds;
      attack.isHittingPlayer = false;
      if (attack.type === 'pillar') attack.x -= (CONFIG.levels[2].speed * 0.95) * dt;
      if (playerHitbox && this.attackHitsPlayer(attack, playerHitbox)) attack.isHittingPlayer = true;
    }

    this.activeAttacks = this.activeAttacks.filter((attack) => attack.life > 0 && attack.x > -120);

    for (const item of this.likeParticles) {
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vy += 0.015 * dt;
      item.rot += item.spin * dt;
      item.life -= seconds;
    }
    this.likeParticles = this.likeParticles.filter((item) => item.life > 0);

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
      this.spawnLikes(event.count || 10);
      this.pendingShake = Math.max(this.pendingShake, 4);
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
    this.drawLikes(ctx, assets, theme);
    this.drawAttacks(ctx, assets, theme, playerHitbox, frame);
    this.drawBanner(ctx, theme);
  }

  drawBoss(ctx, assets, theme, beatFlash, frame) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    const pulse = 1 + Math.sin(this.lastAudioTime * 20.94) * 0.025 + beatFlash * 0.04;
    ctx.scale(pulse, pulse);

    const glow = 0.35 + this.glowIntensity * 0.65;
    ctx.globalAlpha = 0.95;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 4 + glow * 8 : 18 + glow * 24;

    const body = ctx.createLinearGradient(-150, -130, 130, 120);
    body.addColorStop(0, '#080522');
    body.addColorStop(0.42, '#162b7a');
    body.addColorStop(1, '#02030b');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-178, 124);
    ctx.bezierCurveTo(-154, -86, -72, -160, 0, -168);
    ctx.bezierCurveTo(82, -158, 154, -78, 172, 124);
    ctx.lineTo(112, 154);
    ctx.bezierCurveTo(54, 118, -50, 118, -116, 154);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = CONFIG.performance.lowFx ? 0 : 10;
    this.drawHorn(ctx, -82, -132, -1, '#8eeaff');
    this.drawHorn(ctx, 82, -132, 1, '#8eeaff');
    this.drawEye(ctx, -58, -72, theme, beatFlash);
    this.drawEye(ctx, 58, -72, theme, beatFlash);

    this.drawChestLogo(ctx, theme, beatFlash);
    this.drawMouth(ctx, assets, theme, frame);
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
    ctx.font = 'bold 118px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', 0, 24);
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
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      for (let i = -4; i <= 4; i++) ctx.fillRect(i * 14 - 4, mouthY - 18, 8, 12);
    }
    ctx.restore();
  }

  drawLikes(ctx, assets, theme) {
    if (this.likeParticles.length === 0) return;
    ctx.save();
    for (const item of this.likeParticles) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rot);
      ctx.globalAlpha = clamp(item.life / item.maxLife, 0, 1);
      if (!drawSheetSprite(ctx, assets, item.sprite, -item.size / 2, -item.size / 2, item.size, item.size)) {
        ctx.fillStyle = item.color;
        ctx.shadowColor = '#4267B2';
        ctx.shadowBlur = CONFIG.performance.lowFx ? 3 : 10;
        ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(item.size * 0.72)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('f', 0, 1);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawAttacks(ctx, assets, theme, playerHitbox, frame) {
    for (const attack of this.activeAttacks) {
      if (attack.type === 'warning') this.drawLaserWarning(ctx, attack, theme, frame);
      else if (attack.type === 'laser') this.drawLaser(ctx, attack, theme);
      else if (attack.type === 'pillar') this.drawPillar(ctx, assets, attack, theme, frame);
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
    ctx.globalCompositeOperation = CONFIG.performance.lowFx ? 'source-over' : 'lighter';
    ctx.fillStyle = 'rgba(255, 30, 80, 0.34)';
    ctx.fillRect(0, attack.y - 34, CONFIG.W, 68);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = CONFIG.performance.lowFx ? 8 : 28;
    ctx.fillRect(0, attack.y - 15, CONFIG.W, 30);
    ctx.fillStyle = theme.primary;
    ctx.fillRect(0, attack.y - 24, CONFIG.W, 5);
    ctx.fillRect(0, attack.y + 19, CONFIG.W, 5);
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

    return false;
  }

  spawnLikes(count) {
    const max = CONFIG.performance.lowFx ? 22 : 46;
    const spritePool = [SPRITES.likeChip, SPRITES.blueOrb, SPRITES.speedArrow];
    for (let i = 0; i < count && this.likeParticles.length < max; i++) {
      const angle = -Math.PI + (Math.random() - 0.5) * 1.25;
      const speed = 1.3 + Math.random() * 2.7;
      this.likeParticles.push({
        x: this.x - 22 + (Math.random() - 0.5) * 70,
        y: this.y + 92 + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * speed - 1.8,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.08,
        size: 16 + Math.random() * 16,
        life: 1.2 + Math.random() * 0.9,
        maxLife: 1.2 + Math.random() * 0.9,
        color: Math.random() > 0.35 ? '#4267B2' : '#00d4ff',
        sprite: spritePool[Math.floor(Math.random() * spritePool.length)],
      });
      this.likeParticles[this.likeParticles.length - 1].maxLife = this.likeParticles[this.likeParticles.length - 1].life;
    }
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
