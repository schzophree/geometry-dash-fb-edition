import { CONFIG, intersects, intersectsEllipse } from './config.js';
import { GET_LEVEL_MAPPING } from './level-data.js';

export class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.hearts = [];
    this.mappingIndex = 0;
    this.lastSpawnTime = 0;
    this.audioTimeOffset = 0;
    this.spawnTimer = 0;
    this.invertedGravityTime = 0;
  }

  reset() {
    this.obstacles = [];
    this.hearts = [];
    this.mappingIndex = 0;
    this.lastSpawnTime = -10;
    this.audioTimeOffset = 0;
    this.spawnTimer = 0;
    this.invertedGravityTime = 0;
  }

  fastForwardAudioTime(levelIndex, audioTime) {
    this.audioTimeOffset = audioTime;
    const mapping = GET_LEVEL_MAPPING(levelIndex);
    this.mappingIndex = 0;
    while (this.mappingIndex < mapping.length && mapping[this.mappingIndex].time <= audioTime) {
      this.mappingIndex++;
    }
    this.lastSpawnTime = audioTime;
  }

  update(dt, level, gameSpeed, obInterval, playerHitbox, _frame, options = {}) {
    const { spawnObstacles = true, audioTime = 0, playerGravity = 1 } = options;
    let collected = 0;

    if (playerGravity === -1) {
      this.invertedGravityTime += dt / 60;
    } else {
      this.invertedGravityTime = 0;
    }

    for (const h of this.hearts) {
      h.x -= gameSpeed * dt;
      h.wobble = Math.sin(performance.now() * 0.005 + h.id) * 8;
    }

    if (spawnObstacles) {
      this.processMapping(level.index, audioTime, gameSpeed);
    }

    for (const o of this.obstacles) {
      o.x -= gameSpeed * dt;
    }

    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      const hBox = { x: h.x + 2, y: h.y + h.wobble + 2, w: CONFIG.heart.hitbox, h: CONFIG.heart.hitbox };
      if (intersects(playerHitbox, hBox)) {
        collected++;
        this.hearts.splice(i, 1);
      } else if (h.x < -100) {
        this.hearts.splice(i, 1);
      }
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (this.obstacles[i].x < -150) this.obstacles.splice(i, 1);
    }

    return collected;
  }

  processMapping(levelIndex, audioTime, gameSpeed) {
    const mapping = GET_LEVEL_MAPPING(levelIndex);
    if (!mapping || this.mappingIndex >= mapping.length) return;

    const spawnLeadTime = 2.0;

    while (this.mappingIndex < mapping.length) {
      const item = mapping[this.mappingIndex];
      if (item.time <= audioTime + spawnLeadTime) {
        this.spawnMappedItem(item);
        this.mappingIndex++;
      } else {
        break;
      }
    }
  }

  spawnMappedItem(item) {
    const x = CONFIG.W + 80;
    const gY = CONFIG.GROUND_Y;

    switch (item.type) {
      // ═══ Basic Obstacles ═══
      case 'spike':
        this.addSpike(x, gY);
        break;
      case 'spike_double':
        this.addSpike(x, gY);
        this.addSpike(x + 40, gY);
        break;
      case 'spike_triple':
        this.addSpike(x, gY);
        this.addSpike(x + 40, gY);
        this.addSpike(x + 80, gY);
        break;
      case 'block':
        this.addBlock(x, gY - 36);
        break;
      case 'block_double':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 40, gY - 36);
        break;
      case 'block_tower_2':
        this.addBlock(x, gY - 36);
        this.addBlock(x, gY - 72);
        break;
      case 'block_tower_3':
        this.addBlock(x, gY - 36);
        this.addBlock(x, gY - 72);
        this.addBlock(x, gY - 108);
        break;
      case 'block_tower_4':
        this.addBlock(x, gY - 36);
        this.addBlock(x, gY - 72);
        this.addBlock(x, gY - 108);
        this.addBlock(x, gY - 144);
        break;
      case 'block_tower_5':
        for (let i = 0; i < 5; i++) {
          this.addBlock(x, gY - 36 - i * 36);
        }
        break;

      // ═══ Trampoline (bisa diinjak) ═══
      case 'trampoline':
        this.addTrampoline(x, gY - 12);
        break;
      case 'trampoline_double':
        this.addTrampoline(x, gY - 12);
        this.addTrampoline(x + 40, gY - 12);
        break;

      // ═══ Triangle Step (bisa diinjak) ═══
      case 'triangle_step':
        this.addTriangleStep(x, gY - 20, 'up');
        break;
      case 'triangle_double':
        this.addTriangleStep(x, gY - 20, 'up');
        this.addTriangleStep(x + 40, gY - 20, 'up');
        break;
      case 'triangle_staircase':
        this.addTriangleStep(x, gY - 20, 'up');
        this.addTriangleStep(x + 40, gY - 56, 'up');
        this.addTriangleStep(x + 80, gY - 92, 'up');
        break;
      case 'triangle_maze':
        this.addTriangleStep(x, gY - 20, 'up');
        this.addBlock(x + 40, gY - 36);
        this.addTriangleStep(x + 80, gY - 20, 'up');
        this.addBlock(x + 120, gY - 36);
        break;
      case 'triangle_maze_complex':
        this.addTriangleStep(x, gY - 20, 'up');
        this.addBlock(x + 40, gY - 36);
        this.addBlock(x + 40, gY - 72);
        this.addTriangleStep(x + 80, gY - 20, 'up');
        this.addBlock(x + 120, gY - 36);
        break;
      case 'triangle_staircase_offset':
        this.addTriangleStep(x, gY - 56, 'up');
        this.addTriangleStep(x + 40, gY - 20, 'up');
        this.addTriangleStep(x + 80, gY - 92, 'up');
        break;

      // ═══ Spike Patterns ═══
      case 'spike_pit':
        for (let i = 0; i < 4; i++) {
          this.addSpike(x + i * 40, gY);
        }
        this.addOrb(x + 80, gY - 100, 'orb_blue');
        break;
      case 'spike_pit_long':
        for (let i = 0; i < 6; i++) {
          this.addSpike(x + i * 40, gY);
        }
        this.addOrb(x + 120, gY - 120, 'orb_blue');
        break;
      case 'spike_pit_offset':
        for (let i = 0; i < 4; i++) {
          this.addSpike(x + i * 40, gY);
        }
        this.addSpike(x + 160, gY - 40);
        break;

      // ═══ Ceiling Spikes ═══
      case 'spike_ceiling':
        this.addSpikeDown(x, 40);
        break;
      case 'spike_ceiling_double':
        this.addSpikeDown(x, 40);
        this.addSpikeDown(x + 40, 40);
        break;
      case 'spike_ceiling_triple':
        this.addSpikeDown(x, 40);
        this.addSpikeDown(x + 40, 40);
        this.addSpikeDown(x + 80, 40);
        break;

      // ═══ Block Patterns ═══
      case 'block_gap':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 80, gY - 36);
        break;
      case 'block_alternating':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 80, gY - 36);
        this.addBlock(x + 160, gY - 36);
        break;
      case 'block_offset':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 40, gY - 72);
        break;
      case 'block_double_offset':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 40, gY - 72);
        this.addBlock(x + 80, gY - 36);
        break;
      case 'block_gap_offset':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 80, gY - 72);
        this.addBlock(x + 160, gY - 36);
        break;
      case 'block_alternating_offset':
        this.addBlock(x, gY - 72);
        this.addBlock(x + 40, gY - 36);
        this.addBlock(x + 80, gY - 72);
        this.addBlock(x + 120, gY - 36);
        break;
      case 'block_offset_complex':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 40, gY - 72);
        this.addBlock(x + 80, gY - 36);
        this.addBlock(x + 120, gY - 108);
        break;
      case 'block_gap_complex':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 80, gY - 36);
        this.addBlock(x + 160, gY - 36);
        this.addBlock(x + 40, gY - 72);
        break;

      // ═══ Spike Triple Patterns ═══
      case 'spike_triple_offset':
        this.addSpike(x, gY);
        this.addSpike(x + 40, gY - 40);
        this.addSpike(x + 80, gY);
        break;

      // ═══ Tunnel Obstacles ═══
      case 'tunnel_blocks':
        this.addBlock(x, gY - 36);
        this.addBlock(x, 0);
        this.addBlock(x + 80, gY - 36);
        this.addBlock(x + 80, 0);
        break;
      case 'tunnel_blocks_narrow':
        this.addBlock(x, gY - 72);
        this.addBlock(x, 0);
        this.addBlock(x + 40, gY - 36);
        this.addBlock(x + 40, 36);
        break;
      case 'tunnel_blocks_tight':
        this.addBlock(x, gY - 36);
        this.addBlock(x, 36);
        this.addBlock(x + 40, gY - 72);
        this.addBlock(x + 40, 0);
        break;
      case 'tunnel_blocks_ultra_tight':
        this.addBlock(x, gY - 36);
        this.addBlock(x, 36);
        this.addBlock(x + 40, gY - 72);
        this.addBlock(x + 40, 0);
        this.addBlock(x + 80, gY - 36);
        this.addBlock(x + 80, 36);
        break;
      case 'tunnel_spike_walls':
        this.addSpike(x, gY);
        this.addSpikeDown(x, 40);
        this.addSpike(x + 80, gY);
        this.addSpikeDown(x + 80, 40);
        break;
      case 'tunnel_zigzag':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 40, 0);
        this.addBlock(x + 80, gY - 36);
        this.addBlock(x + 120, 0);
        break;
      case 'tunnel_dodge':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 80, 0);
        break;
      case 'tunnel_curve':
        this.addBlock(x, gY - 36);
        this.addBlock(x + 40, gY - 72);
        this.addBlock(x + 80, 0);
        break;

      // ═══ Portal & Orb ═══
      case 'platform_jump_orb':
        this.addSpike(x, gY);
        this.addSpike(x + 40, gY);
        this.addSpike(x + 80, gY);
        this.addBlock(x, gY - 72);
        this.addBlock(x + 40, gY - 72);
        this.addBlock(x + 80, gY - 72);
        this.addOrb(x + 40, gY - 120, 'orb_yellow');
        break;
      case 'PORTAL_SHIP':
        this.addPortal(x, gY - 100, 'portal_ship');
        break;
      case 'PORTAL_CUBE':
        this.addPortal(x, gY - 100, 'portal_cube');
        break;
      case 'PORTAL_BALL':
        this.addPortal(x, gY - 100, 'portal_ball');
        break;
      case 'PORTAL_GRAVITY_UP':
        this.addPortal(x, gY - 100, 'portal_gravity_up');
        break;
      case 'PORTAL_GRAVITY_DOWN':
        this.addPortal(x, Math.max(64, gY - 80), 'portal_gravity_down');
        break;
      case 'BOSS_APPEAR':
        // boss handling di boss.js
        break;
    }

    if (Math.random() < 0.1) {
      const heartY = 80 + Math.random() * (CONFIG.GROUND_Y - 160);
      this.addHeart(x + 40 + Math.random() * 80, heartY);
    }
    this.lastSpawnTime = item.time;
  }

  // ═══ Add Methods ═══
  addSpike(x, y) {
    this.obstacles.push({ type: 'spike', x, y: y - 34, w: 32, h: 36, inactive: false });
  }

  addSpikeDown(x, y) {
    this.obstacles.push({ type: 'spike', x, y, w: 32, h: 36, inactive: false, inverted: true });
  }

  addBlock(x, y) {
    this.obstacles.push({ type: 'block', x, y, w: 36, h: 36, inactive: false });
  }

  addTrampoline(x, y) {
    this.obstacles.push({ type: 'trampoline', x, y, w: 40, h: 12, inactive: false, springPower: 16 });
  }

  addTriangleStep(x, y, direction = 'up') {
    this.obstacles.push({ type: 'triangle_step', x, y, w: 36, h: 36, inactive: false, direction });
  }

  addPortal(x, y, type) {
    this.obstacles.push({ type, x, y, w: 46, h: 86, inactive: false });
  }

  addOrb(x, y, type) {
    this.obstacles.push({ type, x, y, w: 32, h: 32, inactive: false, primed: false });
  }

  addHeart(x, y) {
    this.hearts.push({ id: Math.random(), x, y, wobble: 0 });
  }

  collidesWithPlayer(playerHitbox) {
    for (const o of this.obstacles) {
      if (o.inactive) continue;

      if (o.type.startsWith('portal_') || o.type.startsWith('orb_')) {
        if (intersectsEllipse(playerHitbox, o)) {
          return { type: 'utility', obs: o };
        }
      } else if (o.type === 'spike') {
        const spikeHitbox = { x: o.x + 10, y: o.y + 16, w: 12, h: 20 };
        if (intersects(playerHitbox, spikeHitbox)) return { type: 'lethal', obs: o };
      } else if (o.type === 'block') {
        if (intersects(playerHitbox, o)) {
          if (playerHitbox.y + playerHitbox.h > o.y + 8) {
            return { type: 'lethal', obs: o };
          }
        }
      } else if (o.type === 'trampoline') {
        if (intersects(playerHitbox, o)) {
          // Trampoline springJump handled in main.js
          return { type: 'springpad', obs: o };
        }
      } else if (o.type === 'triangle_step') {
        if (intersects(playerHitbox, o)) {
          // Triangle step is like a slope
          let stepY;
          const progress = Math.max(0, Math.min(1, (playerHitbox.x + playerHitbox.w - o.x) / o.w));
          if (o.direction === 'up') {
            stepY = o.y + o.h - (progress * o.h);
          } else {
            stepY = o.y + (progress * o.h);
          }
          if (playerHitbox.y + playerHitbox.h > stepY + 8) {
            return { type: 'lethal', obs: o };
          }
        }
      }
    }
    return null;
  }

  draw(ctx, theme, beatFlash, assets) {
    for (const o of this.obstacles) {
      if (o.type === 'spike') {
        const spikeImg = assets?.get?.('spike_01');
        if (spikeImg) {
          ctx.save();
          if (o.inverted) {
            ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
            ctx.scale(1, -1);
            ctx.drawImage(spikeImg, -o.w / 2, -o.h / 2, o.w, o.h);
          } else {
            ctx.drawImage(spikeImg, o.x, o.y, o.w, o.h);
          }
          ctx.restore();
        } else {
          ctx.fillStyle = theme.obC2;
          ctx.beginPath();
          if (o.inverted) {
            ctx.moveTo(o.x + o.w / 2, o.y + o.h);
            ctx.lineTo(o.x, o.y);
            ctx.lineTo(o.x + o.w, o.y);
          } else {
            ctx.moveTo(o.x + o.w / 2, o.y);
            ctx.lineTo(o.x, o.y + o.h);
            ctx.lineTo(o.x + o.w, o.y + o.h);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (o.type === 'block') {
        const blockImg = assets?.get?.('block_01');
        if (blockImg) {
          ctx.drawImage(blockImg, o.x, o.y, o.w, o.h);
        } else {
          ctx.fillStyle = theme.obC;
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(o.x, o.y, o.w, o.h);
        }
      } else if (o.type === 'trampoline') {
        ctx.fillStyle = theme.accent || '#ffff44';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      } else if (o.type === 'triangle_step') {
        ctx.fillStyle = theme.obC;
        ctx.beginPath();
        if (o.direction === 'up') {
          ctx.moveTo(o.x + o.w / 2, o.y);
          ctx.lineTo(o.x + o.w, o.y + o.h);
          ctx.lineTo(o.x, o.y + o.h);
        } else {
          ctx.moveTo(o.x + o.w / 2, o.y + o.h);
          ctx.lineTo(o.x + o.w, o.y);
          ctx.lineTo(o.x, o.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (o.type.startsWith('portal_')) {
        const portalKey = o.type.includes('ship') ? 'portal_front_ship'
                        : o.type.includes('cube') ? 'portal_front_cube'
                        : o.type.includes('ball') ? 'portal_front_ball'
                        : 'portal_front_gravity';
        const portalImg = assets?.get?.(portalKey);
        if (portalImg) {
          ctx.save();
          ctx.shadowColor = o.type.includes('ship') ? '#ff44aa'
                          : o.type.includes('cube') ? '#44ffaa'
                          : o.type.includes('ball') ? '#ffaa44'
                          : '#44aaff';
          ctx.shadowBlur = 12 + beatFlash * 8;
          ctx.drawImage(portalImg, o.x, o.y, o.w, o.h);
          ctx.restore();
        }
      } else if (o.type.startsWith('orb_')) {
        const orbKey = o.type.includes('yellow') ? 'orb_yellow' : 'orb_blue';
        const orbImg = assets?.get?.(orbKey);
        if (orbImg) {
          ctx.save();
          ctx.shadowColor = o.type.includes('yellow') ? '#ffff00' : '#00aaff';
          ctx.shadowBlur = 8 + beatFlash * 6;
          ctx.drawImage(orbImg, o.x, o.y, o.w, o.h);
          ctx.restore();
        }
      }
    }

    const hs = CONFIG.heart.size;
    ctx.fillStyle = '#ff3366';
    for (const h of this.hearts) {
      const hy = h.y + h.wobble;
      const hx = h.x;
      ctx.beginPath();
      ctx.moveTo(hx + hs / 2, hy + hs);
      ctx.bezierCurveTo(hx + hs / 2, hy + hs * 0.75, hx, hy + hs * 0.65, hx, hy + hs * 0.35);
      ctx.bezierCurveTo(hx, hy, hx + hs / 2, hy, hx + hs / 2, hy + hs * 0.2);
      ctx.bezierCurveTo(hx + hs / 2, hy, hx + hs, hy, hx + hs, hy + hs * 0.35);
      ctx.bezierCurveTo(hx + hs, hy + hs * 0.65, hx + hs / 2, hy + hs * 0.75, hx + hs / 2, hy + hs);
      ctx.closePath();
      ctx.fill();
    }
  }
}