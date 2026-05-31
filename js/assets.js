import { CONFIG, randInt } from './config.js';

/**
 * Loads an image from multiple candidate paths.
 * Returns the first successfully loaded Image, or null if all fail.
 */
function loadImageWithFallback(candidates) {
  return new Promise((resolve) => {
    let idx = 0;
    const timeout = setTimeout(() => {
      console.warn(`[AssetLoader] Timeout loading ${candidates[idx]}`);
      resolve(null);
    }, 15000); // Increased to 15 second timeout per attempt

    function tryNext() {
      if (idx >= candidates.length) {
        clearTimeout(timeout);
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      img.onerror = () => {
        idx++;
        tryNext();
      };
      img.src = candidates[idx];
    }
    tryNext();
  });
}

function removeNeutralMatte(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Improved detection: remove if it's white (R,G,B > 250) 
    // or if it's a very specific neutral gray matte
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    // Pure/Near-pure white usually represents the background in these assets
    const isWhite = r > 252 && g > 252 && b > 252;
    // More conservative matte removal: only remove if it's very neutral and in a specific range
    const isNeutralMatte = diff <= 8 && max >= 180 && max <= 235;

    if (a > 0 && (isWhite || isNeutralMatte)) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function removeBlackMatte(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Detect solid black or the custom background color #1e141e (R=30, G=20, B=30)
    const isBlack = r < 12 && g < 12 && b < 12;
    const isCustomBg = r >= 26 && r <= 34 && g >= 16 && g <= 24 && b >= 26 && b <= 34;

    if (a > 0 && (isBlack || isCustomBg)) {
      data[i + 3] = 0; // Make transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}


export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.sprites = new Map();
    this.logo = null;
    this.playerCubeSprites = [];
    this.overlayKeys = [];
  }

  async preload(onProgress = () => {}) {
    onProgress(0);

    const coreList = [
      { key: 'logo', src: ['assets/ui/loading_logo.png'] },
      { key: 'overlay1', src: ['assets/images/overlays/overlay-fokus-coding-scroll-fesnuk.png'] },
      { key: 'boss_sheet', src: ['assets/images/boss/monstersprite.png'] },
      { key: 'player_cube', src: ['assets/images/player/characters/player.png'] },
      { key: 'player_ship', src: ['assets/images/player/ship/ship_01_001.png'] },
      { key: 'player_ball', src: ['assets/images/player/ball/player_ball_01_001.png'] },
      { key: 'secret_coin', src: ['assets/images/coins/secretCoin_01_001.png'] },
      { key: 'decor_cloud', src: ['assets/images/decorations/clouds/CloudDecor01.png'] },
      { key: 'decor_vine', src: ['assets/images/decorations/vines/VineDecor01.png'] },
      { key: 'fb_monster', src: ['assets/images/enemy/fb_monster.png'] },
    ];

    // Load meme overlays
    const overlays = [
      'overlay-action-consequences-editor.png', 'overlay-baca-buku-scroll-10-jam.png', 
      'overlay-besok-kita-ngedit.png', 'overlay-fokus-coding-scroll-fesnuk.png',
      'overlay-harga-ide-editing.png', 'overlay-i-hate-ngoding.png', 
      'overlay-ide-masuk-penjara.png', 'overlay-js-atau-php.png', 
      'overlay-komentar-ai-mecut.png', 'overlay-korban-kriminalisasi-jaksa.png',
      'overlay-laptop-coding-konteks.png', 'overlay-level-kecanduan-facebook.png',
      'overlay-lowongan-scroll-fesnuk.png', 'overlay-mending-scroll-fesnuk.png',
      'overlay-ngoding-pay-to-win.png', 'overlay-obat-malas-coding.png',
      'overlay-penulis-pemed-fb-terus.png', 'overlay-penyakit-facebook.png',
      'overlay-rust-10-jam-vibe-coder.png', 'overlay-scroll-bentar-ah.png',
      'overlay-skripsi-frieren.png', 'overlay-sql-select-fesnuk.png',
      'overlay-token-habis-llm.png', 'overlay-web-desa-kumparan.png',
      'overlay-website-100rb.png', 'overlay-whatsapp-vscode-panda.png'
    ];
    overlays.forEach(filename => {
      coreList.push({ key: `overlay_${filename}`, src: [`assets/images/overlays/${filename}`] });
    });
    this.overlayKeys = overlays.map(f => `overlay_${f}`);

    // Load laser aim animation frames (00-34)
    for (let i = 0; i <= 34; i++) {
      const num = i.toString().padStart(2, '0');
      coreList.push({ 
        key: `laser_aim_${i}`, 
        src: [`assets/images/laser_aim/frame_${num}_delay-0.04s.png`],
        removeMatte: true
      });
    }

    // Load laser fire animation frames (0000-0017)
    for (let i = 0; i <= 17; i++) {
      const num = i.toString().padStart(4, '0');
      coreList.push({ 
        key: `laser_fire_${i}`, 
        src: [`assets/images/laser_fire/laser_fire_${num}.png`],
        removeMatte: true
      });
    }

    const obstacleList = [
      { key: 'spike_01', src: ['assets/images/obstacles/spikes/RegularSpike01.png'] },
      { key: 'spike_02', src: ['assets/images/obstacles/spikes/RegularSpike02.png'] },
      { key: 'spike_03', src: ['assets/images/obstacles/spikes/RegularSpike03.png'] },
      { key: 'spike_04', src: ['assets/images/obstacles/spikes/RegularSpike04.png'] },
      { key: 'block_01', src: ['assets/images/obstacles/blocks/BrickBlock01.png'] },
      { key: 'block_02', src: ['assets/images/obstacles/blocks/ChequeredBlock01.png'] },
      { key: 'block_03', src: ['assets/images/obstacles/blocks/GridBlock01.png'] },
      { key: 'block_04', src: ['assets/images/obstacles/blocks/RegularBlock01.png'] },
      { key: 'block_05', src: ['assets/images/obstacles/blocks/TileBlock01.png'] },
      { key: 'saw_01', src: ['assets/images/obstacles/sawblades/RegularSawblade01.png'] },
      { key: 'saw_02', src: ['assets/images/obstacles/sawblades/GearSawblade01.png'] },
      { key: 'portals_spritesheet', src: ['assets/images/ui/portals/portals_spritesheet.png?v=' + Date.now()], removeMatte: 'black' },
      { key: 'orb_yellow', src: ['assets/images/orbs/ring_01_001.png'] },
      { key: 'orb_blue', src: ['assets/images/orbs/ring_02_001.png'] },
      { key: 'orb_green', src: ['assets/images/orbs/ring_03_001.png'] },
      { key: 'orb_red', src: ['assets/images/orbs/gravJumpRing_01_001.png'] },
      { key: 'ground_tile', src: ['assets/images/background/ground_tiles/groundSquare_01_001-hd.png'] },
      { key: 'checkpoint', src: ['assets/images/ui/panels/checkpoint_01_001.png'] },
      { key: 'ui_newbest', src: ['assets/images/ui/panels/GJ_newBest_001.png'] },
    ];

    const allItems = [...coreList, ...obstacleList];
    let loaded = 0;
    const total = allItems.length;

    const batchSize = 5;
    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        try {
          const img = await loadImageWithFallback(item.src);
          if (img) {
            let finalImg = img;
            if (item.removeMatte === 'black') {
              finalImg = removeBlackMatte(img);
            } else if (item.removeMatte) {
              finalImg = removeNeutralMatte(img);
            }
            this.images.set(item.key, finalImg);
            if (item.key === 'logo') this.logo = finalImg;
          } else {
            console.warn(`[AssetLoader] All paths failed for "${item.key}"`);
          }
        } catch (e) {
          console.error(`[AssetLoader] Critical error loading "${item.key}":`, e);
        } finally {
          loaded++;
          onProgress(loaded / total);
        }
      }));
    }
  }

  get(key) {
    return this.images.get(key) || null;
  }

  drawSprite(ctx, key, x, y, w, h) {
    const img = this.images.get(key);
    if (img) {
      ctx.drawImage(img, x, y, w, h);
    } else {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y, w, h);
    }
  }

  getRandomSpikeKey() {
    const keys = ['spike_01', 'spike_02', 'spike_03', 'spike_04'].filter(k => this.images.has(k));
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : null;
  }

  getRandomBlockKey() {
    const keys = ['block_01', 'block_02', 'block_03', 'block_04', 'block_05'].filter(k => this.images.has(k));
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

    if (player.isInvincible() && Math.floor(performance.now() / 150) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    const playerImg = CONFIG.gameplay.useVectorCubeIcon ? null : this.images.get('player_cube');
    const shipImg = this.images.get('player_ship');
    const ballImg = this.images.get('player_ball');

    if (player.mode === 'cube') {
      if (playerImg) {
        ctx.drawImage(playerImg, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
        this.drawVectorCube(ctx, pSize, theme, beatFlash);
      }
    } else if (player.mode === 'ship') {
      if (shipImg) {
        ctx.drawImage(shipImg, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
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
      }
    } else if (player.mode === 'ball') {
      if (ballImg) {
        ctx.drawImage(ballImg, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.arc(0, 0, pSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }
    }

    if (player.isInvincible()) {
      // 1. Kedip warna merah lembut di bagian dalam player
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.35 + Math.sin(performance.now() * 0.025) * 0.15;
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(-pSize / 2, -pSize / 2, pSize, pSize);
      ctx.globalCompositeOperation = 'source-over';

      // 2. Glow / Outline merah di luar player mengikuti lekukan bentuknya
      ctx.save();
      ctx.globalAlpha = 0.72 + Math.sin(performance.now() * 0.025) * 0.28;
      ctx.strokeStyle = '#ff0033';
      ctx.lineWidth = 3.5 + Math.sin(performance.now() * 0.025) * 1.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      if (player.mode === 'cube') {
        ctx.strokeRect(-pSize / 2, -pSize / 2, pSize, pSize);
      } else if (player.mode === 'ball') {
        ctx.beginPath();
        ctx.arc(0, 0, pSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (player.mode === 'ship') {
        // Lingkaran aura/shield merah di sekeliling ship agar terlihat premium dan natural
        ctx.beginPath();
        ctx.arc(0, 0, pSize * 0.72, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  drawVectorCube(ctx, pSize, theme, beatFlash) {
    const half = pSize / 2;
    ctx.fillStyle = theme.primary;
    ctx.fillRect(-half, -half, pSize, pSize);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(-half + 5, -half + 5, pSize - 10, pSize - 10);
    
    // Removed the 'X' (bersilang) lines that were here
    
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(0, 0, pSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    const dot = half - 8;
    for (const [dx, dy] of [[-dot, -dot], [dot, -dot], [-dot, dot], [dot, dot]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-half, -half, pSize, pSize);
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
    arr.push({
      x: Math.random() * CONFIG.W,
      y: 42 + Math.random() * (CONFIG.GROUND_Y * 0.42),
      size: Math.random() * 22 + 26,
      speed: Math.random() * 0.7 + 0.35,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return arr;
}
