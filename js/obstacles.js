import { CONFIG, rand, randInt } from './config.js';

const POOLS = [
  ['singleSpike', 'singleBlock', 'doubleSpike', 'singleSpike', 'blockGap'],
  ['doubleSpike', 'singleBlock', 'tall', 'step', 'spikeBlock', 'blockGap'],
  ['doubleSpike', 'tripleSpike', 'step', 'tall', 'spikeBlock', 'doubleBlock'],
  ['tripleSpike', 'step', 'tallPair', 'spikeBlock', 'doubleBlock', 'hardMix'],
];

export class ObstacleManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.obstacles = [];
    this.hearts = [];
    this.collectParticles = [];
    this.floatTexts = [];
    this.spawnTimer = 0;
    this.heartTimer = 0;
    this.nextHeart = randInt(CONFIG.heart.spawnMin, CONFIG.heart.spawnMax);
  }

  update(dt, level, gameSpeed, obInterval, playerHitbox, frame) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= obInterval) {
      this.spawnPattern(level);
      this.spawnTimer = 0;
    }

    for (const obs of this.obstacles) obs.x -= gameSpeed * dt;
    this.obstacles = this.obstacles.filter((obs) => obs.x + obs.w > -80);

    this.heartTimer += dt;
    if (this.heartTimer >= this.nextHeart) {
      this.spawnHeart();
      this.heartTimer = 0;
      this.nextHeart = randInt(CONFIG.heart.spawnMin, CONFIG.heart.spawnMax);
    }

    for (const heart of this.hearts) {
      heart.x -= gameSpeed * 0.85 * dt;
      heart.age += dt;
      heart.drawY = heart.baseY + Math.sin((frame + heart.age) * 0.08) * 2;
      heart.alpha = Math.min(1, heart.age / 20);
    }
    this.hearts = this.hearts.filter((heart) => heart.x + heart.w >= -20);

    const collected = this.collectHearts(playerHitbox);
    this.updateCollectEffects(dt);
    return collected;
  }

  spawnPattern(level) {
    const pool = POOLS[level.index] || POOLS[0];
    const name = pool[Math.floor(Math.random() * pool.length)];
    const x = CONFIG.W + 22;
    const g = CONFIG.GROUND_Y;
    const add = (type, dx, w, h, y = g - h) => this.obstacles.push({ type, x: x + dx, y, w, h });

    switch (name) {
      case 'singleSpike':
        add('spike', 0, 28, 34);
        break;
      case 'singleBlock':
        add('block', 0, 36, 36);
        break;
      case 'doubleSpike':
        add('spike', 0, 28, 34);
        add('spike', 31, 28, 34);
        break;
      case 'tripleSpike':
        add('spike', 0, 28, 34);
        add('spike', 31, 28, 34);
        add('spike', 62, 28, 34);
        break;
      case 'tall':
        add('tall', 0, 36, 72);
        break;
      case 'step':
        add('block', 0, 36, 36);
        add('block', 36, 36, 36, g - 72);
        break;
      case 'spikeBlock':
        add('spike', 0, 28, 34);
        add('block', 46, 36, 36);
        break;
      case 'blockGap':
        add('block', 0, 36, 36);
        add('spike', 76, 28, 34);
        break;
      case 'doubleBlock':
        add('block', 0, 36, 36);
        add('block', 40, 36, 36);
        break;
      case 'tallPair':
        add('tall', 0, 36, 72);
        add('spike', 55, 28, 34);
        break;
      case 'hardMix':
        add('spike', 0, 28, 34);
        add('spike', 32, 28, 34);
        add('block', 86, 36, 36);
        add('spike', 132, 28, 34);
        break;
      default:
        add('spike', 0, 28, 34);
    }
  }

  spawnHeart() {
    const y = rand(CONFIG.GROUND_Y - 180, CONFIG.GROUND_Y - 60);
    this.hearts.push({
      x: CONFIG.W + 20,
      baseY: y,
      drawY: y,
      w: CONFIG.heart.size,
      h: CONFIG.heart.size,
      age: 0,
      alpha: 0,
    });
  }

  collectHearts(playerHitbox) {
    let count = 0;
    this.hearts = this.hearts.filter((heart) => {
      const hb = {
        x: heart.x + (heart.w - CONFIG.heart.hitbox) / 2,
        y: heart.drawY + (heart.h - CONFIG.heart.hitbox) / 2,
        w: CONFIG.heart.hitbox,
        h: CONFIG.heart.hitbox,
      };
      if (intersects(playerHitbox, hb)) {
        count++;
        this.spawnCollectEffects(heart.x + heart.w / 2, heart.drawY + heart.h / 2);
        return false;
      }
      return true;
    });
    return count;
  }

  spawnCollectEffects(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + rand(-0.18, 0.18);
      const speed = rand(1.6, 3.8);
      this.collectParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(4, 8),
        life: 0.8,
      });
    }

    this.floatTexts.push({
      x,
      y,
      text: '+1 ❤️',
      age: 0,
      life: 60,
    });
  }

  updateCollectEffects(dt) {
    for (const p of this.collectParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.08 * dt;
      p.life -= 0.032 * dt;
    }
    this.collectParticles = this.collectParticles.filter((p) => p.life > 0);

    for (const text of this.floatTexts) {
      text.age += dt;
      text.y -= 1.5 * dt;
    }
    this.floatTexts = this.floatTexts.filter((text) => text.age < text.life);
  }

  collidesWithPlayer(playerHitbox) {
    for (const obs of this.obstacles) {
      const inset = obs.type === 'spike' ? 7 : 4;
      const box = {
        x: obs.x + inset,
        y: obs.y + inset,
        w: obs.w - inset * 2,
        h: obs.h - inset,
      };
      if (intersects(playerHitbox, box)) return obs;
    }
    return null;
  }

  draw(ctx, assets, theme, beatFlash, frame) {
    for (const obs of this.obstacles) {
      assets.drawObstacle(ctx, obs, theme, beatFlash);
    }

    for (const heart of this.hearts) {
      ctx.save();
      ctx.globalAlpha = heart.alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '24px Arial';
      ctx.shadowColor = '#ff4488';
      ctx.shadowBlur = CONFIG.performance.lowFx ? 6 : 12 + Math.sin(frame * 0.1) * 5;
      ctx.fillText('❤️', heart.x + heart.w / 2, heart.drawY + heart.h / 2);
      ctx.restore();
    }

    for (const p of this.collectParticles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillStyle = '#ff4488';
      ctx.shadowColor = '#ff4488';
      ctx.shadowBlur = CONFIG.performance.lowFx ? 4 : 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const text of this.floatTexts) {
      ctx.save();
      ctx.globalAlpha = 1 - text.age / text.life;
      ctx.font = 'bold 16px Pusab, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff4488';
      ctx.shadowBlur = CONFIG.performance.lowFx ? 5 : 12;
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    }
  }
}

export function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
