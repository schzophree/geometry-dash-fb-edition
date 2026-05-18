import { CONFIG, intersects, intersectsEllipse } from './config.js';
import { GET_LEVEL_MAPPING } from './level-data.js';

const SPAWN_LEAD_TIME = 2.0;
const RUN_GAP = 82; // Increased from 68 for much better spacing
const STACK_GAP = 82; // Increased from 68 for much better spacing
const TILE = 36;

export class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.hearts = [];
    this.mappingIndex = 0;
    this.lastSpawnTime = 0;
    this.audioTimeOffset = 0;
    this.spawnTimer = 0;
    this.invertedGravityTime = 0;
    this.rhythmIndex = -1;
    this.heartTimer = this.nextHeartDelay();
    this.mirrorMode = false;
  }

  reset() {
    this.obstacles = [];
    this.hearts = [];
    this.mappingIndex = 0;
    this.lastSpawnTime = -10;
    this.audioTimeOffset = 0;
    this.spawnTimer = 0;
    this.invertedGravityTime = 0;
    this.rhythmIndex = -1;
    this.heartTimer = this.nextHeartDelay();
    this.mirrorMode = false;
  }

  fastForwardAudioTime(levelIndex, audioTime) {
    this.audioTimeOffset = audioTime;
    const mapping = GET_LEVEL_MAPPING(levelIndex);
    this.mappingIndex = 0;
    while (this.mappingIndex < mapping.length && mapping[this.mappingIndex].time <= audioTime) {
      this.mappingIndex++;
    }
    this.rhythmIndex = Math.floor(audioTime / this.rhythmInterval(levelIndex));
    this.lastSpawnTime = audioTime;
  }

  update(dt, level, gameSpeed, obInterval, playerHitbox, _frame, options = {}) {
    this.currentLevelIndex = level.index;
    const { spawnObstacles = true, audioTime = 0, playerGravity = 1 } = options;
    let collected = 0;

    if (level.index >= 1) this.mirrorMode = true; 
    else this.mirrorMode = false;

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
      this.processRhythmStream(level.index, audioTime);
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        const minY = Math.max(48, CONFIG.GROUND_Y - 180);
        const maxY = Math.max(minY + 10, CONFIG.GROUND_Y - 62);
        this.addHeart(CONFIG.W + 20, minY + Math.random() * (maxY - minY));
        this.heartTimer = this.nextHeartDelay();
      }
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

    while (this.mappingIndex < mapping.length) {
      const item = mapping[this.mappingIndex];
      if (item.time <= audioTime + SPAWN_LEAD_TIME) {
        this.spawnMappedItem(item, audioTime, gameSpeed);
        this.mappingIndex++;
      } else {
        break;
      }
    }
  }

  rhythmInterval(levelIndex) {
    if (levelIndex === 2) return 0.45; 
    if (levelIndex === 1) return 0.55;
    return 0.72;
  }

  processRhythmStream(levelIndex, audioTime) {
    const interval = this.rhythmInterval(levelIndex);
    const nextIndex = Math.floor(audioTime / interval);
    if (nextIndex <= this.rhythmIndex) return;

    const start = Math.max(this.rhythmIndex + 1, nextIndex - 2);
    for (let idx = start; idx <= nextIndex; idx++) {
      this.spawnRhythmPattern(levelIndex, idx);
      
      if (idx % 8 === 0) {
        const decorX = CONFIG.W + 100;
        const isCloud = Math.random() > 0.5;
        this.addDecoration(decorX, isCloud ? 40 + Math.random() * 60 : CONFIG.GROUND_Y - 80, isCloud ? 'cloud' : 'vine');
      }
    }
    this.rhythmIndex = nextIndex;
  }

  spawnRhythmPattern(levelIndex, idx) {
    if (idx < 1) return;
    const x = CONFIG.W + 86 + (idx % 2) * 22;
    const cycle = idx % (levelIndex === 2 ? 10 : 8);

    const spawnAt = (patternFunc, ...args) => {
      patternFunc.apply(this, [x, ...args]);
      if (this.mirrorMode) {
        if (patternFunc === this.addSpike) this.addSpikeDown(x, 0);
        else if (patternFunc === this.addSpikeDown) this.addSpike(x, CONFIG.GROUND_Y);
        else if (patternFunc === this.addFloorStack) this.addCeilingStack(x, args[0]);
        else if (patternFunc === this.addCeilingStack) this.addFloorStack(x, args[0]);
      }
    };

    if (levelIndex === 2) {
      if (cycle === 0) spawnAt(this.addDualSpikes, 2);
      else if (cycle === 1) spawnAt(this.addShipCorridor, 0);
      else if (cycle === 2) spawnAt(this.addDualStacks, 2, 2);
      else if (cycle === 3) spawnAt(this.addShipCorridor, 1);
      else if (cycle === 4) spawnAt(this.addOrbLane, 'orb_blue', 'mid');
      else if (cycle === 5) spawnAt(this.addDualSpikes, 3);
      else if (cycle === 6) spawnAt(this.addPulsedGate, 2, 2);
      else if (cycle === 7) spawnAt(this.addShipCorridor, 2);
      else if (cycle === 8) spawnAt(this.addOrbLane, 'orb_blue', 'high');
      else spawnAt(this.addPulsedGate, 3, 2);
      return; // IMPORTANT
    }

    if (levelIndex === 1) {
      if (cycle === 0) spawnAt(this.addDualSpikes, 2);
      else if (cycle === 1) spawnAt(this.addDualStacks, 1, 1);
      else if (cycle === 2) spawnAt(this.addPulsedGate, 1, 2);
      else if (cycle === 3) spawnAt(this.addOrbLane, 'orb_yellow', idx % 3 === 0 ? 'ceiling' : 'mid');
      else if (cycle === 4) spawnAt(this.addDualSpikes, 3);
      else if (cycle === 5) spawnAt(this.addDualStacks, 2, 1);
      else if (cycle === 6) spawnAt(this.addPulsedGate, 2, 2);
      else spawnAt(this.addOrbLane, 'orb_blue', 'high');
      return; // IMPORTANT
    }

    // Default (Level 0)
    if (cycle === 0) spawnAt(this.addDualSpikes, 1);
    else if (cycle === 1) spawnAt(this.addDualStacks, 1, 1);
    else if (cycle === 2) spawnAt(this.addSpike, CONFIG.GROUND_Y);
    else if (cycle === 3) spawnAt(this.addCeilingStack, 1);
    else if (cycle === 4) spawnAt(this.addDualSpikes, 2);
    else if (cycle === 5) spawnAt(this.addFloorStack, 2);
    else if (cycle === 6) spawnAt(this.addPulsedGate, 1, 1);
    else spawnAt(this.addOrbLane, 'orb_yellow', 'mid');
  }

  spawnMappedItem(item, audioTime = 0, gameSpeed = 5) {
    const timeUntilHit = Math.max(0, item.time - audioTime);
    const x = CONFIG.W + 80 - Math.max(0, SPAWN_LEAD_TIME - timeUntilHit) * gameSpeed * 60;
    const count = item.count || 1;
    const width = item.width || 3;
    const height = item.height || 1;

    switch (item.type) {
      case 'gd_spike_run':
        for (let i = 0; i < count; i++) this.addSpikeLane(x + i * RUN_GAP, item.lane || 'floor', item.drop || 0);
        break;
      case 'gd_ceiling_spikes':
        for (let i = 0; i < count; i++) this.addSpikeLane(x + i * RUN_GAP, 'ceiling', item.drop || 0);
        break;
      case 'gd_stack':
        this.addFloorStack(x, height);
        break;
      case 'gd_ceiling_stack':
        this.addCeilingStack(x, height);
        break;
      case 'gd_steps':
        (item.heights || [1, 2, 1]).forEach((h, i) => this.addFloorStack(x + i * STACK_GAP, h));
        break;
      case 'gd_ceiling_steps':
        (item.heights || [1, 2, 1]).forEach((h, i) => this.addCeilingStack(x + i * STACK_GAP, h));
        break;
      case 'gd_platform':
        this.addPlatform(x, width, height);
        break;
      case 'gd_tunnel':
        this.addTunnel(x, width, item.floor || 1, item.ceiling || 1);
        break;
      case 'gd_pillar_gap':
        this.addFloorStack(x, item.floor || 1);
        this.addCeilingStack(x, item.ceiling || 1);
        break;
      case 'gd_orb_line':
        for (let i = 0; i < count; i++) this.addOrbLane(x + i * 40, item.orb || 'orb_yellow', item.lane || 'mid');
        break;
      case 'gd_semi_pair':
        for (let i = 0; i < (item.floorSpikes || 0); i++) this.addSpike(x + i * STACK_GAP, CONFIG.GROUND_Y);
        for (let i = 0; i < (item.ceilingSpikes || 0); i++) this.addSpikeDown(x + 36 + i * STACK_GAP, item.drop || 0);
        for (let i = 0; i < (item.floorBlocks || 0); i++) this.addFloorStack(x + i * STACK_GAP, 1);
        for (let i = 0; i < (item.ceilingBlocks || 0); i++) this.addCeilingStack(x + 36 + i * STACK_GAP, 1);
        break;
      case 'gd_ball_lane':
        (item.gaps || [1, 2, 1]).forEach((h, i) => {
          this.addFloorStack(x + i * 56, h);
          this.addOrbLane(x + i * 56 + 12, i % 2 ? 'orb_blue' : 'orb_yellow', i % 2 ? 'high' : 'low');
        });
        break;
      case 'gd_boss_lane':
        this.addBossLane(x, item.pattern || 'fangs');
        break;
      case 'gd_ship_corridor':
        this.addShipCorridor(x, item.variant || 0);
        break;
      case 'gd_finish_lane':
        this.addFinishLane(x);
        break;
      case 'gd_secret_coin':
        this.addSecretCoin(x, item.y || CONFIG.GROUND_Y - 100);
        break;
      case 'PORTAL_SHIP': this.addPortal(x, CONFIG.GROUND_Y - 120, 'portal_ship'); break;
      case 'PORTAL_CUBE': this.addPortal(x, CONFIG.GROUND_Y - 120, 'portal_cube'); break;
      case 'PORTAL_BALL': this.addPortal(x, CONFIG.GROUND_Y - 120, 'portal_ball'); break;
      case 'PORTAL_GRAVITY_UP': this.addPortal(x, CONFIG.GROUND_Y - 120, 'portal_gravity_up'); break;
      case 'PORTAL_GRAVITY_DOWN': this.addPortal(x, CONFIG.GROUND_Y - 120, 'portal_gravity_down'); break;
      case 'LASER_WARNING': this.addLaserWarning(item.y || 200); break;
      case 'LASER_FIRE': /* Handled by CyberDemonBoss */ break;
    }
  }

  nextHeartDelay() {
    return CONFIG.heart.spawnMin + Math.random() * (CONFIG.heart.spawnMax - CONFIG.heart.spawnMin);
  }

  addSpike(x, y) {
    this.obstacles.push({ type: 'spike', x, y: y - 34, w: 32, h: 36, inactive: false });
  }

  addSpikeDown(x, y) {
    this.obstacles.push({ type: 'spike', x, y, w: 32, h: 36, inactive: false, inverted: true });
  }

  addBlock(x, y, surface = 'floor') {
    const yy = surface === 'floor' && y >= CONFIG.GROUND_Y - 2 ? CONFIG.GROUND_Y - 36 : y;
    this.obstacles.push({ type: 'block', x, y: yy, w: 36, h: 36, inactive: false, solid: true, surface });
  }

  addSlope(x, y, dir = 'up') {
    this.obstacles.push({ type: `slope_${dir}`, x, y, w: 36, h: 36, inactive: false, solid: true, surface: 'floor' });
  }

  addPortal(x, y, type) {
    this.obstacles.push({ type, x, y, w: 46, h: 86, inactive: false });
  }

  addOrb(x, y, type) {
    // Fail-safe: prevent jump orbs (Yellow, Green, Red) in boss level (index 2)
    if (this.currentLevelIndex === 2 && (type === 'orb_yellow' || type === 'orb_green' || type === 'orb_red')) {
      return;
    }
    this.obstacles.push({ type, x, y, w: 32, h: 32, inactive: false, primed: false });
  }

  addHeart(x, y) {
    this.hearts.push({ id: Math.random(), x, y, wobble: 0 });
  }

  addSecretCoin(x, y) {
    this.obstacles.push({ type: 'secret_coin', x, y, w: 30, h: 30, inactive: false });
  }

  addDecoration(x, y, type) {
    this.obstacles.push({ type: 'decoration', subType: type, x, y, w: 60, h: 40, solid: false, inactive: false });
  }

  addSpikeLane(x, lane = 'floor', drop = 0) {
    if (lane === 'ceiling') this.addSpikeDown(x, drop);
    else this.addSpike(x, CONFIG.GROUND_Y);
  }

  addFloorStack(x, height = 1) {
    for (let i = 0; i < height; i++) this.addBlock(x, CONFIG.GROUND_Y - 36 * (i + 1), 'floor');
  }

  addCeilingStack(x, height = 1) {
    for (let i = 0; i < height; i++) this.addBlock(x, i * 36, 'ceiling');
  }

  addPlatform(x, width = 3, height = 1) {
    const y = CONFIG.GROUND_Y - 36 * height;
    for (let i = 0; i < width; i++) this.addBlock(x + i * 36, y, 'floor');
  }

  addTunnel(x, width = 3, floorHeight = 1, ceilingHeight = 1) {
    for (let i = 0; i < width; i++) {
      const xx = x + i * STACK_GAP;
      if (floorHeight > 0) this.addFloorStack(xx, floorHeight);
      if (ceilingHeight > 0) this.addCeilingStack(xx, ceilingHeight);
    }
  }

  addOrbLane(x, type, lane = 'mid') {
    const yByLane = {
      floor: CONFIG.GROUND_Y - 42,
      low: CONFIG.GROUND_Y - 110,
      mid: CONFIG.GROUND_Y - 180,
      high: CONFIG.GROUND_Y - 240,
      ceiling: 74,
    };
    this.addOrb(x, yByLane[lane] ?? yByLane.mid, type);
  }

  addBossLane(x, pattern) {
    if (pattern === 'steps') {
      [1, 2, 3, 2].forEach((h, i) => this.addFloorStack(x + i * 62, h));
      this.addCeilingStack(x + 280, 2);
      this.addOrbLane(x + 150, 'orb_blue', 'high');
      return;
    }
    if (pattern === 'gate') {
      this.addFloorStack(x, 3);
      this.addCeilingStack(x, 3);
      this.addSpike(x + 82, CONFIG.GROUND_Y);
      this.addSpikeDown(x + 132, 0);
      this.addOrbLane(x + 158, 'orb_blue', 'mid');
      return;
    }
    for (let i = 0; i < 3; i++) this.addSpike(x + i * 64, CONFIG.GROUND_Y);
    for (let i = 0; i < 2; i++) this.addSpikeDown(x + 32 + i * 72, 0);
    this.addOrbLane(x + 160, 'orb_blue', 'mid');
  }

  addDualSpikes(x, count = 1) {
    for (let i = 0; i < count; i++) {
      const xx = x + i * 64;
      this.addSpike(xx, CONFIG.GROUND_Y);
      this.addSpikeDown(xx, 0);
    }
  }

  addDualStacks(x, floorHeight = 1, ceilingHeight = 1) {
    this.addFloorStack(x, floorHeight);
    this.addCeilingStack(x, ceilingHeight);
  }

  addPulsedGate(x, floorHeight = 1, ceilingHeight = 1) {
    this.addFloorStack(x, floorHeight);
    this.addCeilingStack(x + 64, ceilingHeight);
    this.addSpike(x + 128, CONFIG.GROUND_Y);
    this.addSpikeDown(x + 192, 0);
  }

  addShipCorridor(x, variant = 0) {
    const floorHeight = 1 + (variant % 2);
    const ceilingHeight = 1 + ((variant + 1) % 2);
    this.addTunnel(x, 2, floorHeight, ceilingHeight);
    this.addSpike(x + 140, CONFIG.GROUND_Y);
    this.addSpikeDown(x + 180, 0);
    if (variant === 2) this.addOrbLane(x + 100, 'orb_blue', 'mid');
  }

  addLaserWarning(y) {
    this.obstacles.push({ type: 'laser_warning', x: CONFIG.W, y: y - 20, w: CONFIG.W, h: 40, inactive: false, duration: 1.5, solid: false });
  }

  addFinishLane(x) {
    this.obstacles.push({ type: 'finish_lane', x, y: 0, w: 10, h: CONFIG.GROUND_Y, inactive: false });
  }

  collidesWithPlayer(playerHitbox) {
    for (const o of this.obstacles) {
      if (o.inactive) continue;

      if (o.type.startsWith('portal_') || o.type.startsWith('orb_')) {
        if (intersectsEllipse(playerHitbox, o)) {
          return { type: 'utility', obs: o };
        }
      } else if (o.type === 'secret_coin') {
        if (intersects(playerHitbox, o)) {
          return { type: 'secret_coin', obs: o };
        }
      } else if (o.type === 'spike') {
        const spikeHitbox = { x: o.x + 10, y: o.y + 16, w: 12, h: 20 };
        if (intersects(playerHitbox, spikeHitbox)) return { type: 'lethal', obs: o };
      } else if (o.type === 'block') {
        if (intersects(playerHitbox, o)) {
          const standingOnTop = o.surface !== 'ceiling' && playerHitbox.y + playerHitbox.h <= o.y + 22;
          const standingUnder = o.surface === 'ceiling' && playerHitbox.y >= o.y + o.h - 22;
          if (!standingOnTop && !standingUnder) {
            return { type: 'lethal', obs: o };
          }
        }
      } else if (o.type.startsWith('slope_')) {
        if (intersects(playerHitbox, o)) {
          let slopeY;
          const progress = Math.max(0, Math.min(1, (playerHitbox.x + playerHitbox.w - o.x) / o.w));
          if (o.type === 'slope_up') {
            slopeY = o.y + o.h - (progress * o.h);
          } else {
            slopeY = o.y + (progress * o.h);
          }
          if (playerHitbox.y + playerHitbox.h > slopeY + 16) {
            return { type: 'lethal', obs: o };
          }
        }
      } else if (o.type === 'laser' || o.type === 'laser_warning') {
        if (intersects(playerHitbox, o)) return { type: 'lethal', obs: o };
      } else if (o.type === 'vortex') {
        if (intersectsEllipse(playerHitbox, o)) return { type: 'lethal', obs: o };
      }
    }
    return null;
  }

  draw(ctx, theme, beatFlash, assets) {
    const isLevel1 = this.currentLevelIndex === 0;
    const isLevel2 = this.currentLevelIndex === 1;
    const isBoss = this.currentLevelIndex === 2;

    for (const o of this.obstacles) {
      if (o.type === 'spike') {
        if (!o.variant && assets) o.variant = assets.getRandomSpikeKey();
        const spikeImg = assets?.get?.(o.variant || 'spike_01');
        
        // Custom Level 1: Dark Blue with White outline
        if (isLevel1) {
          ctx.save();
          ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
          if (o.inverted) ctx.scale(1, -1);
          ctx.fillStyle = '#00008b'; // Dark Blue
          ctx.beginPath();
          ctx.moveTo(0, -o.h / 2);
          ctx.lineTo(o.w / 2, o.h / 2);
          ctx.lineTo(-o.w / 2, o.h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff'; // White Outline
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.restore();
        }
        // Custom Level 2: Yellow with Black outline
        else if (isLevel2) {
          ctx.save();
          ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
          if (o.inverted) ctx.scale(1, -1);
          ctx.fillStyle = '#ffff00'; // Yellow
          ctx.beginPath();
          ctx.moveTo(0, -o.h / 2);
          ctx.lineTo(o.w / 2, o.h / 2);
          ctx.lineTo(-o.w / 2, o.h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#000000'; // Black Outline
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.restore();
        }
        // Custom boss spike: Dark Red with white outline
        else if (isBoss) {
          ctx.save();
          ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
          if (o.inverted) ctx.scale(1, -1);
          
          ctx.fillStyle = '#880000'; // Dark Red
          ctx.beginPath();
          ctx.moveTo(0, -o.h / 2);
          ctx.lineTo(o.w / 2, o.h / 2);
          ctx.lineTo(-o.w / 2, o.h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff'; // White Outline
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.restore();
        } else if (spikeImg) {
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
        if (!o.variant && assets) o.variant = assets.getRandomBlockKey();
        const blockImg = assets?.get?.(o.variant || 'block_01');

        if (isLevel1) {
          ctx.fillStyle = '#00008b'; // Dark Blue
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#ffffff'; // White Outline
          ctx.lineWidth = 1.8;
          ctx.strokeRect(o.x, o.y, o.w, o.h);
        } else if (isLevel2) {
          ctx.fillStyle = '#ffff00'; // Yellow
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#000000'; // Black Outline
          ctx.lineWidth = 1.8;
          ctx.strokeRect(o.x, o.y, o.w, o.h);
        } else if (isBoss) {
          ctx.fillStyle = '#880000'; // Dark Red
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#ffffff'; // White Outline
          ctx.lineWidth = 1.8;
          ctx.strokeRect(o.x, o.y, o.w, o.h);
        } else if (blockImg) {
          ctx.drawImage(blockImg, o.x, o.y, o.w, o.h);
        } else {
          ctx.fillStyle = theme.obC;
          ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(o.x, o.y, o.w, o.h);
        }
      } else if (o.type === 'secret_coin') {
        const coinImg = assets?.get?.('secret_coin');
        if (coinImg) {
          ctx.save();
          const wobble = Math.sin(performance.now() * 0.005) * 6;
          ctx.drawImage(coinImg, o.x, o.y + wobble, o.w, o.h);
          ctx.restore();
        } else {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (o.type === 'decoration') {
        const decorImg = assets?.get?.(o.subType === 'cloud' ? 'decor_cloud' : 'decor_vine');
        if (decorImg) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.drawImage(decorImg, o.x, o.y, o.w, o.h);
          ctx.restore();
        }
      } else if (o.type.startsWith('slope_')) {
        ctx.save();
        ctx.beginPath();
        if (o.type === 'slope_up') {
          ctx.moveTo(o.x, o.y + o.h);
          ctx.lineTo(o.x + o.w, o.y);
          ctx.lineTo(o.x + o.w, o.y + o.h);
        } else {
          ctx.moveTo(o.x + o.w, o.y + o.h);
          ctx.lineTo(o.x, o.y);
          ctx.lineTo(o.x, o.y + o.h);
        }
        ctx.closePath();

        if (isLevel1) {
          ctx.fillStyle = '#00008b'; // Dark Blue
          ctx.fill();
        } else if (isLevel2) {
          ctx.fillStyle = '#ffff00'; // Yellow
          ctx.fill();
        } else if (isBoss) {
          ctx.fillStyle = '#880000'; // Dark Red
          ctx.fill();
        } else {
          ctx.save();
          ctx.clip();
          const blockImg = assets?.get?.('block_01');
          if (blockImg) ctx.drawImage(blockImg, o.x, o.y, o.w, o.h);
          else { ctx.fillStyle = theme.obC; ctx.fillRect(o.x, o.y, o.w, o.h); }
          ctx.restore();
        }

        ctx.strokeStyle = isLevel1 ? '#ffffff' : isLevel2 ? '#000000' : isBoss ? '#ffffff' : '#fff'; 
        ctx.lineWidth = (isLevel1 || isLevel2 || isBoss) ? 1.8 : 2;
        ctx.stroke();
        ctx.restore();
      } else if (o.type.startsWith('portal_')) {
        const portalType = o.type.replace('portal_', '');
        const frontKey = `portal_front_${portalType}`;
        const backKey = `portal_back_${portalType}`;
        
        const frontImg = assets?.get?.(frontKey);
        const backImg = assets?.get?.(backKey);
        
        if (backImg) {
          ctx.drawImage(backImg, o.x, o.y, o.w, o.h);
        }
        
        if (frontImg) {
          ctx.drawImage(frontImg, o.x, o.y, o.w, o.h);
        } else if (!backImg) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 4;
          ctx.strokeRect(o.x, o.y, o.w, o.h);
        }
      } else if (o.type.startsWith('orb_')) {
        const orbKey = o.type.includes('yellow') ? 'orb_yellow'
          : o.type.includes('blue') ? 'orb_blue'
            : o.type.includes('green') ? 'orb_green'
              : 'orb_red';
        const orbImg = assets?.get?.(orbKey);
        if (orbImg) {
          ctx.save();
          ctx.drawImage(orbImg, o.x, o.y, o.w, o.h);
          ctx.restore();
        } else {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI * 2);
          ctx.fill();
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
