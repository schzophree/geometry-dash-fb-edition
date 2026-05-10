import { CONFIG, rand, randInt, intersects, intersectsEllipse } from './config.js';
import { GET_LEVEL_MAPPING } from './level-data.js';

export class ObstacleManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.obstacles = [];
    this.hearts = [];
    this.collectParticles = [];
    this.floatTexts = [];
    this.eventIndex = 0;
    this.heartTimer = 0;
    this.nextHeart = randInt(CONFIG.heart.spawnMin, CONFIG.heart.spawnMax);
  }

  /** Lompati event level yang sudah lewat (resume checkpoint, tanpa spawn). */
  fastForwardAudioTime(levelIndex, audioTime) {
    const mapping = GET_LEVEL_MAPPING(levelIndex);
    while (this.eventIndex < mapping.length && mapping[this.eventIndex].time <= audioTime) {
      this.eventIndex++;
    }
  }

  update(dt, level, gameSpeed, obInterval, playerHitbox, frame, options = {}) {
    const audioTime = options.audioTime || 0;
    const mapping = GET_LEVEL_MAPPING(level.index);

    // Process mapping based on audioTime
    while (this.eventIndex < mapping.length && audioTime >= mapping[this.eventIndex].time) {
      this.spawnEvent(mapping[this.eventIndex]);
      this.eventIndex++;
    }

    if (options.spawnObstacles && this.eventIndex >= mapping.length) {
      if (this.obTimer === undefined) this.obTimer = 0;
      this.obTimer += dt;
      
      // FIX 3C: Beat-based obstacle spawning
      // Calculate spawn interval in seconds based on beat information
      // obInterval is in frames at 60fps, convert to dt scale
      const spawnIntervalSeconds = obInterval / 60.0;
      
      if (this.obTimer >= spawnIntervalSeconds) {
        this.obTimer -= spawnIntervalSeconds; // Keep remainder for precise timing
        
        // FIX 3B: Variation in spawning (1 beat, 2 beats, or 4 beats)
        const variation = Math.random();
        let shouldSpawn = false;
        
        if (variation < 0.5) {
          // 50% chance: spawn now
          shouldSpawn = true;
        } else if (variation < 0.8 && this.obTimer < spawnIntervalSeconds * 0.5) {
          // 30% chance: skip 1 beat, will spawn next interval
          shouldSpawn = false;
        } else {
          // 20% chance: spawn
          shouldSpawn = true;
        }
        
        if (shouldSpawn) {
          const types = ['spike', 'spike_double', 'block', 'block_double', 'tall_block', 'stair_up'];
          const type = types[randInt(0, types.length - 1)];
          this.spawnEvent({ type });
        }
      }
    }

    for (const obs of this.obstacles) obs.x -= gameSpeed * dt;
    this.obstacles = this.obstacles.filter((obs) => obs.x + obs.w > -100);

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

  spawnEvent(event) {
    const x = CONFIG.W + 20;
    const g = CONFIG.GROUND_Y;
    /** Portal/orb di jalur lompat (dekat tanah), bukan setengah layar. */
    const portalTop = (h) => Math.round(Math.max(40, g - h - 50));
    const orbTop = (h) => Math.round(Math.max(48, g - h - 55));

    const add = (type, dx, w, h, y = g - h) => {
      const o = { type, x: x + dx, y, w, h, inactive: false };
      if (type.startsWith('portal_')) o.lastTriggered = 0;
      this.obstacles.push(o);
    };

    switch (event.type) {
      case 'spike':
        add('spike', 0, 30, 34);
        break;
      case 'spike_double':
        add('spike', 0, 30, 34);
        add('spike', 32, 30, 34);
        break;
      case 'spike_triple':
        add('spike', 0, 30, 34);
        add('spike', 32, 30, 34);
        add('spike', 64, 30, 34);
        break;
      case 'block':
        add('block', 0, 38, 38);
        break;
      case 'block_double':
        add('block', 0, 38, 38);
        add('block', 42, 38, 38);
        break;
      case 'tall_block':
        add('block', 0, 38, 76);
        break;
      case 'stair_up':
        add('block', 0, 38, 38);
        add('block', 40, 38, 76);
        add('block', 80, 38, 114);
        break;
      case 'pillar':
        const py = event.position === 'top' ? 64 : g - 120;
        add('pillar', 0, 42, 120, py);
        break;
      case 'PORTAL_SHIP':
        add('portal_ship', 0, 46, 100, portalTop(100));
        break;
      case 'PORTAL_CUBE':
        add('portal_cube', 0, 46, 100, portalTop(100));
        break;
      case 'PORTAL_BALL':
        add('portal_ball', 0, 46, 100, portalTop(100));
        break;
      case 'PORTAL_GRAVITY_UP':
        add('portal_gravity_up', 0, 46, 100, portalTop(100));
        break;
      case 'PORTAL_GRAVITY_DOWN':
        add('portal_gravity_down', 0, 46, 100, portalTop(100));
        break;
      case 'orb_yellow':
        add('orb_yellow', 0, 36, 36, orbTop(36));
        break;
      case 'orb_green':
        add('orb_green', 0, 36, 36, orbTop(36));
        break;
      case 'orb_blue':
        add('orb_blue', 0, 36, 36, orbTop(36));
        break;
      case 'orb_red':
        add('orb_red', 0, 36, 36, orbTop(36));
        break;
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
      text: '+1❤️',
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
      if (obs.inactive) continue; // Skip already collected utility items

      const isUtility = obs.type.startsWith('portal_') || obs.type.startsWith('orb_');
      
      if (isUtility) {
        if (intersectsEllipse(playerHitbox, obs)) return { type: 'utility', obs };
      } else {
        const inset = obs.type === 'spike' ? 7 : 4;
        const box = {
          x: obs.x + inset,
          y: obs.y + inset,
          w: obs.w - inset * 2,
          h: obs.h - inset,
        };
        if (intersects(playerHitbox, box)) return { type: 'lethal', obs };
      }
    }
    return null;
  }

  draw(ctx, assets, theme, beatFlash, frame) {
    for (const obs of this.obstacles) {
      if (!obs.inactive) assets.drawObstacle(ctx, obs, theme, beatFlash);
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
