import { CONFIG, randInt } from './config.js';

/**
 * Loads an image from multiple candidate paths.
 * Returns the first successfully loaded Image, or null if all fail.
 */
function loadImageWithFallback(candidates) {
  return new Promise((resolve) => {
    let idx = 0;
    function tryNext() {
      if (idx >= candidates.length) { resolve(null); return; }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { idx++; tryNext(); };
      img.src = candidates[idx];
    }
    tryNext();
  });
}

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.sprites = new Map();
    this.logo = null;
    this.playerCubeSprites = [];
  }

  async preload(onProgress = () => {}) {
    // === Core UI & character assets ===
    const coreList = [
      { key: 'logo', src: ['assets/ui/loading_logo.png'] },
      { key: 'overlay1', src: ['assets/images/overlays/overlay-fokus-coding-scroll-fesnuk.png'] },
      { key: 'fb_monster', src: ['assets/images/enemy/fb_monster.png'] },
      { key: 'player_cube', src: [
        'assets/images/player/characters/player.png',
        'plan.assets/Texture2D/playerDash2_001.png'
      ]},
    ];

    // === Obstacle sprite assets (from Texture2D with fallback) ===
    const obstacleList = [
      // Spikes
      { key: 'spike_01', src: ['assets/images/obstacles/spikes/RegularSpike01.png', 'plan.assets/Texture2D/RegularSpike01.png'] },
      { key: 'spike_02', src: ['assets/images/obstacles/spikes/RegularSpike02.png', 'plan.assets/Texture2D/RegularSpike02.png'] },
      { key: 'spike_03', src: ['assets/images/obstacles/spikes/RegularSpike03.png', 'plan.assets/Texture2D/RegularSpike03.png'] },
      // Blocks
      { key: 'block_01', src: ['assets/images/obstacles/blocks/BrickBlock01.png', 'plan.assets/Texture2D/BrickBlock01.png'] },
      { key: 'block_02', src: ['assets/images/obstacles/blocks/ChequeredBlock01.png', 'plan.assets/Texture2D/ChequeredBlock01.png'] },
      { key: 'block_03', src: ['assets/images/obstacles/blocks/GridBlock01.png', 'plan.assets/Texture2D/GridBlock01.png'] },
      // Sawblades
      { key: 'saw_01', src: ['assets/images/obstacles/sawblades/GearSawblade01.png', 'plan.assets/Texture2D/GearSawblade01.png'] },
      { key: 'saw_02', src: ['assets/images/obstacles/sawblades/RegularSawblade01.png', 'plan.assets/Texture2D/RegularSawblade01.png'] },
      // Portals
      { key: 'portal_front_ship', src: ['assets/images/portals/portal_01_front_001.png', 'plan.assets/Texture2D/portal_01_front_001.png'] },
      { key: 'portal_front_cube', src: ['assets/images/portals/portal_02_front_001.png', 'plan.assets/Texture2D/portal_02_front_001.png'] },
      { key: 'portal_front_ball', src: ['assets/images/portals/portal_03_front_001.png', 'plan.assets/Texture2D/portal_03_front_001.png'] },
      { key: 'portal_front_gravity', src: ['assets/images/portals/portal_05_front_001.png', 'plan.assets/Texture2D/portal_05_front_001.png'] },
      { key: 'portal_back_ship', src: ['assets/images/portals/portal_01_back_001.png', 'plan.assets/Texture2D/portal_01_back_001.png'] },
      { key: 'portal_back_cube', src: ['assets/images/portals/portal_02_back_001.png', 'plan.assets/Texture2D/portal_02_back_001.png'] },
      // Orbs / Rings
      { key: 'orb_yellow', src: ['assets/images/orbs/ring_01_001.png', 'plan.assets/Texture2D/ring_01_001.png'] },
      { key: 'orb_blue', src: ['assets/images/orbs/ring_02_001.png', 'plan.assets/Texture2D/ring_02_001.png'] },
      { key: 'orb_green', src: ['assets/images/orbs/ring_03_001.png', 'plan.assets/Texture2D/ring_03_001.png'] },
      // Ground tiles
      { key: 'ground_tile', src: ['assets/images/background/ground_tiles/groundSquare_01_001-hd.png', 'plan.assets/Texture2D/groundSquare_01_001-hd.png'] },
      // Checkpoint
      { key: 'checkpoint', src: ['assets/images/ui/panels/checkpoint_01_001.png', 'plan.assets/Texture2D/checkpoint_01_001.png'] },
      { key: 'checkpoint_glow', src: ['assets/images/ui/panels/checkpoint_01_glow_001.png', 'plan.assets/Texture2D/checkpoint_01_glow_001.png'] },
      // GD UI panels
      { key: 'ui_newbest', src: ['assets/images/ui/panels/GJ_newBest_001.png', 'plan.assets/Texture2D/GJ_newBest_001.png'] },
      { key: 'ui_levelcomplete', src: ['assets/images/ui/panels/GJ_levelComplete_001.png', 'plan.assets/Texture2D/GJ_levelComplete_001.png'] },
    ];

    const allItems = [...coreList, ...obstacleList];
    let loaded = 0;
    const total = allItems.length;

    const promises = allItems.map((item) => {
      return loadImageWithFallback(item.src).then((img) => {
        if (img) {
          this.images.set(item.key, img);
          if (item.key === 'logo') this.logo = img;
        } else {
          console.warn(`[AssetLoader] All paths failed for "${item.key}"`);
        }
        loaded++;
        onProgress(loaded / total);
      });
    });

    await Promise.all(promises);

    this.sprites.set('boss', this.images.get('boss') || null);
    console.log(`[AssetLoader] Loaded ${this.images.size}/${total} assets.`);
  }

  /** Get a loaded image by key, or null */
  get(key) {
    return this.images.get(key) || null;
  }

  drawSprite(ctx, key, x, y, w, h) {
    const img = this.images.get(key) || this.sprites.get(key);
    if (img) {
      ctx.drawImage(img, x, y, w, h);
    } else {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y, w, h);
    }
  }

  /** Pick a random spike sprite key that is loaded */
  getRandomSpikeKey() {
    const keys = ['spike_01', 'spike_02', 'spike_03'].filter(k => this.images.has(k));
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : null;
  }

  /** Pick a random block sprite key that is loaded */
  getRandomBlockKey() {
    const keys = ['block_01', 'block_02', 'block_03'].filter(k => this.images.has(k));
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : null;
  }

  drawPlayer(ctx, player, theme, beatFlash) {
    const px = player.x;
    const py = player.y;
    const pSize = player.size;
    const cx = px + pSize / 2;
    const cy = py + pSize / 2;

    ctx.save();
    ctx.translate(cx, cy);
    if (player.gravity === -1) ctx.scale(1, -1);
    ctx.rotate(player.rot);

    ctx.shadowColor = player.isInvincible() ? '#ff4444' : theme.primary;
    ctx.shadowBlur = 8 + beatFlash * 12;

    if (player.isInvincible() && Math.floor(performance.now() / 150) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    const playerImg = this.images.get('player_cube');

    if (player.mode === 'cube') {
      if (playerImg) {
        // Draw player sprite from assets/images/player/characters/player.png
        ctx.drawImage(playerImg, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
        // Fallback procedural cube
        ctx.fillStyle = theme.accent;
        ctx.fillRect(-pSize / 2, -pSize / 2, pSize, pSize);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(-pSize / 2, -pSize / 2, pSize, pSize);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-pSize / 4, -pSize / 4, pSize / 2, pSize / 2);
      }
    } else if (player.mode === 'ship') {
      // Ship mode — keep procedural for now (ship sprite TBD)
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.moveTo(-pSize / 2, -pSize / 4);
      ctx.lineTo(pSize / 2, 0);
      ctx.lineTo(-pSize / 2, pSize / 4);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    } else if (player.mode === 'ball') {
      // Ball mode — keep procedural for now (ball sprite TBD)
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(0, 0, pSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-pSize / 4, 0);
      ctx.lineTo(pSize / 4, 0);
      ctx.moveTo(0, -pSize / 4);
      ctx.lineTo(0, pSize / 4);
      ctx.stroke();
    }

    if (player.isInvincible()) {
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.5;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(-pSize / 2, -pSize / 2, pSize, pSize);
    }

    ctx.restore();
  }
}

export function blendThemes(from, to, p) {
  if (p <= 0) return from;
  if (p >= 1) return to;
  const out = {};
  for (const k in from) {
    if (from[k].startsWith('#') && to[k].startsWith('#')) {
      out[k] = lerpColor(from[k], to[k], p);
    } else {
      out[k] = p < 0.5 ? from[k] : to[k];
    }
  }
  return out;
}

function lerpColor(c1, c2, p) {
  const r1 = parseInt(c1.substr(1, 2), 16), g1 = parseInt(c1.substr(3, 2), 16), b1 = parseInt(c1.substr(5, 2), 16);
  const r2 = parseInt(c2.substr(1, 2), 16), g2 = parseInt(c2.substr(3, 2), 16), b2 = parseInt(c2.substr(5, 2), 16);
  const r = Math.round(r1 + (r2 - r1) * p).toString(16).padStart(2, '0');
  const g = Math.round(g1 + (g2 - g1) * p).toString(16).padStart(2, '0');
  const b = Math.round(b1 + (b2 - b1) * p).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function createStars() {
  const arr = [];
  for (let i = 0; i < 20; i++) {
    arr.push({ id: i, x: Math.random() * CONFIG.W, y: Math.random() * (CONFIG.H * 0.6), size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.1 });
  }
  return arr;
}

export function createShapes() {
  const arr = [];
  for (let i = 0; i < 4; i++) {
    arr.push({ x: Math.random() * CONFIG.W, y: Math.random() * CONFIG.H, size: Math.random() * 40 + 20, sides: randInt(3, 6), rot: Math.random() * Math.PI, rs: (Math.random() - 0.5) * 0.05, speed: Math.random() * 2 + 1 });
  }
  return arr;
}
