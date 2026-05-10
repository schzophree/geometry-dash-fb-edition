import { CONFIG, clamp } from './config.js';
import { Spritesheet, drawPlayerFallbackCube } from './spritesheet.js';
import { getPerfConfig } from './perf.js';

const IMAGE_GROUPS = {
  sheet1: [
    'assets/sprites/GJ_GameSheet-hd.png',
    'assets/images/GJ_GameSheet-hd.png',
    'gd-assets/assets/GJ_GameSheet-hd.png',
    'geometry-dash-assets/geometry-dash-assets/GJ_GameSheet-hd.png',
  ],
  sheet2: [
    'assets/sprites/GJ_GameSheet02-hd.png',
    'assets/images/GJ_GameSheet02-hd.png',
    'gd-assets/assets/GJ_GameSheet02-hd.png',
    'geometry-dash-assets/geometry-dash-assets/GJ_GameSheet02-hd.png',
  ],
  ground: ['assets/backgrounds/ground.png'],
  logo: ['assets/ui/logo.png', 'assets/images/ui/logo.png'],
  bossCyberDemon: ['assets/images/boss/cyber-demon-fb.png'],
};

function imageGroupForBackground(index) {
  return [`assets/backgrounds/bg_${index}.png`, `assets/images/backgrounds/bg_${index}.png`];
}

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.backgrounds = [];
    this.logo = null;
    this.progress = 0;
    this.spritesheet = new Spritesheet();
  }

  async preload(onProgress = () => {}) {
    const tasks = [];
    const queue = [
      ['sheet1', IMAGE_GROUPS.sheet1],
      ['sheet2', IMAGE_GROUPS.sheet2],
      ['bossCyberDemon', IMAGE_GROUPS.bossCyberDemon],
      ['ground', IMAGE_GROUPS.ground],
      ['logo', IMAGE_GROUPS.logo],
    ];

    for (let i = 0; i < CONFIG.levels.length; i++) {
      queue.push([`bg_${i}`, imageGroupForBackground(i)]);
    }

    let done = 0;
    const total = queue.length;
    for (const [key, candidates] of queue) {
      tasks.push(
        this.loadFirst(candidates, key).then((img) => {
          if (img) {
            this.images.set(key, img);
            if (key.startsWith('bg_')) this.backgrounds[Number(key.slice(3))] = img;
            if (key === 'logo') this.logo = img;
          }
          done++;
          this.progress = done / total;
          onProgress(this.progress, key);
        }),
      );
    }

    await Promise.all(tasks);
    
    // Initialize spritesheet from loaded sheets
    // Hanya GJ_GameSheet-hd (2048) — jangan campur Sheet02 (layout beda = tekstur acak/lag).
    await this.spritesheet.init(IMAGE_GROUPS.sheet1);
    
    console.log('[assets] preload finished', {
      loaded: [...this.images.keys()],
      fallbacks: queue.length - this.images.size,
    });
  }

  async loadFirst(candidates, key) {
    for (const src of candidates) {
      const img = await loadImage(src);
      if (img) {
        console.log(`[assets] loaded ${key}: ${src}`);
        return img;
      }
    }
    console.log(`[assets] fallback for ${key}`);
    return null;
  }

  drawBackground(ctx, level, theme, scroll, beatFlash, stars, shapes) {
    const skyH = CONFIG.GROUND_Y;
    ctx.save();

    // Deep gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
    bgGrad.addColorStop(0, theme.bg0);
    bgGrad.addColorStop(0.4, theme.bg1);
    bgGrad.addColorStop(1, theme.bg2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    // Epic Geometry Dash Style Moving Grid
    ctx.save();
    ctx.globalAlpha = 0.15 + beatFlash * 0.1;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    const gridSpacing = 60;
    const gridOffset = -(scroll * 0.4) % gridSpacing;
    
    // Vertical grid lines
    ctx.beginPath();
    for (let x = gridOffset; x <= CONFIG.W + gridSpacing; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, skyH);
    }
    // Horizontal grid lines
    for (let y = skyH; y >= 0; y -= gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.W, y);
    }
    ctx.stroke();
    ctx.restore();

    drawStars(ctx, stars, scroll, theme, beatFlash);
    if (getPerfConfig().parallax) drawParallaxShapes(ctx, shapes, scroll, theme, beatFlash);

    // Beat Flash Overlay
    if (beatFlash > 0.02) {
      ctx.globalAlpha = beatFlash * 0.15;
      ctx.fillStyle = theme.primary;
      ctx.fillRect(0, 0, CONFIG.W, skyH);
    }

    ctx.restore();
  }

  drawGround(ctx, theme, scroll, beatFlash) {
    const y = CONFIG.GROUND_Y;
    const h = CONFIG.H - y;

    ctx.save();
    
    // Base solid ground color
    const grad = ctx.createLinearGradient(0, y, 0, CONFIG.H);
    grad.addColorStop(0, theme.gnd0);
    grad.addColorStop(1, theme.gnd1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, CONFIG.W, h);

    // Dynamic ground grid
    ctx.strokeStyle = theme.line;
    ctx.globalAlpha = 0.5 + beatFlash * 0.3;
    ctx.lineWidth = 2;
    const grid = 30;
    
    // Ground moves faster than background (parallax)
    const offset = -((scroll * 1.0) % grid); 
    
    // Slanted lines for 3D speed effect
    for (let x = offset - grid; x <= CONFIG.W + grid * 2; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - h, CONFIG.H); // Slant backwards
      ctx.stroke();
    }
    
    // Horizontal lines in ground
    for (let gy = y + grid; gy < CONFIG.H; gy += grid) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(CONFIG.W, gy);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;

    // Epic Glowing Top Edge
    ctx.shadowColor = theme.line;
    ctx.shadowBlur =
      CONFIG.performance.lowFx || !getPerfConfig().shadowBlur ? 3 + beatFlash * 5 : 12 + beatFlash * 20;
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.W, y);
    ctx.stroke();
    
    // Secondary bright line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.W, y);
    ctx.stroke();
    
    ctx.restore();
  }

  drawPlayer(ctx, player, theme, beatFlash, frame) {
    const flicker = player.invincible > 0 && Math.floor(frame / 6) % 2 === 0;
    if (flicker) return;

    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    
    // Reverse gravity flip
    if (player.gravity === -1) {
      ctx.scale(1, -1);
    }
    
    ctx.rotate(player.rot);
    const allowGlowDraw = !CONFIG.performance.lowFx && getPerfConfig().shadowBlur;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = allowGlowDraw ? 6 + beatFlash * 6 : 4 + beatFlash * 4;

    if (player.mode === 'ship') {
      drawFallbackShip(ctx, player.size, theme);
    } else if (player.mode === 'ball') {
      drawFallbackBall(ctx, player.size, theme);
    } else {
      if (CONFIG.gameplay.useVectorCubeIcon) {
        drawPlayerFallbackCube(ctx, player.size, theme, beatFlash, allowGlowDraw);
      } else {
        const sprite = this.spritesheet.getSprite('cube_01');
        if (sprite) {
          ctx.drawImage(
            sprite,
            Math.round(-player.size / 2),
            Math.round(-player.size / 2),
            player.size,
            player.size,
          );
        } else {
          drawPlayerFallbackCube(ctx, player.size, theme, beatFlash, allowGlowDraw);
        }
      }
    }

    ctx.restore();
  }

  drawObstacle(ctx, obs, theme, beatFlash) {
    ctx.save();
    const glowOb =
      !CONFIG.performance.lowFx && getPerfConfig().shadowBlur;
    ctx.shadowBlur = glowOb ? 4 + beatFlash * 3 : 0;
    
    if (obs.type.startsWith('portal_')) {
      const spriteKey = obs.type.toLowerCase();
      const sprite = this.spritesheet.getSprite(spriteKey);
      if (sprite) {
        ctx.drawImage(sprite, obs.x, obs.y, obs.w, obs.h);
      } else {
        drawPortal(ctx, obs.x, obs.y, obs.w, obs.h, obs.type, theme);
      }
    } else if (obs.type.startsWith('orb_')) {
      const sprite = this.spritesheet.getSprite(obs.type);
      if (sprite) {
        ctx.drawImage(sprite, obs.x, obs.y, obs.w, obs.h);
      } else {
        drawOrb(ctx, obs.x, obs.y, obs.w, obs.h, obs.type, theme);
      }
    } else if (obs.type === 'pillar') {
      ctx.shadowColor = theme.accent;
      drawBlock(ctx, obs.x, obs.y, obs.w, obs.h, theme, true);
    } else if (obs.type === 'spike') {
      ctx.shadowColor = theme.obC;
      const sprite = this.spritesheet.getSprite('spike_01');
      if (sprite) {
        ctx.drawImage(sprite, obs.x, obs.y, obs.w, obs.h);
      } else {
        drawSpike(ctx, obs.x, obs.y, obs.w, obs.h, theme);
      }
    } else {
      ctx.shadowColor = theme.obC;
      const sprite = obs.type === 'tall_block' ? null : this.spritesheet.getSprite('block_01');
      if (sprite && obs.type !== 'tall_block') {
        ctx.drawImage(sprite, obs.x, obs.y, obs.w, obs.h);
      } else {
        drawBlock(ctx, obs.x, obs.y, obs.w, obs.h, theme, obs.type === 'tall_block');
      }
    }
    ctx.restore();
  }
}

function drawPortal(ctx, x, y, w, h, type, theme) {
  const isGravity = type.includes('gravity');
  const isShip = type.includes('ship');
  const isBall = type.includes('ball');
  const isCube = type.includes('cube');
  
  let color = '#ffffff';
  if (isShip) color = '#78ff38';
  else if (isBall) color = '#ff33ff';
  else if (isCube) color = '#00d4ff';
  else if (type === 'portal_gravity_up') color = '#ffff33';
  else if (type === 'portal_gravity_down') color = '#3333ff';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  
  // Outer ring
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner glow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  ctx.fill();
  
  // Particles/Dots inside
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const py = y + 20 + i * (h - 40) / 4;
    ctx.beginPath();
    ctx.arc(x + w/2, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawOrb(ctx, x, y, w, h, type, theme) {
  let color = '#ffffff';
  if (type === 'orb_green') color = '#00ff00';
  else if (type === 'orb_yellow') color = '#ffff00';
  else if (type === 'orb_blue') color = '#0000ff';
  else if (type === 'orb_red') color = '#ff0000';

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + w/2, y + h/2, w/2 - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + w/2, y + h/2, w/6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function createStars() {
  const pc = getPerfConfig();
  const n = Math.min(CONFIG.performance.stars, pc.stars);
  return Array.from({ length: Math.max(6, Math.floor(n)) }, () => ({
    x: Math.random() * CONFIG.W,
    y: Math.random() * (CONFIG.GROUND_Y - 24),
    r: 0.7 + Math.random() * 1.8,
    tw: Math.random() * Math.PI * 2,
    depth: 0.6 + Math.random() * 1.4,
  }));
}

export function createShapes() {
  const pc = getPerfConfig();
  const shapes = pc.bgShapes;
  return Array.from({ length: Math.max(3, Math.floor(shapes)) }, (_, i) => ({
    x: Math.random() * CONFIG.W,
    y: 42 + Math.random() * (CONFIG.GROUND_Y - 110),
    size: 24 + Math.random() * 54,
    sides: 3 + (i % 4),
    layer: i % 2 === 0 ? 0.28 : 0.62,
    rot: Math.random() * Math.PI,
  }));
}

export function blendThemes(a, b, t) {
  if (!a || !b || t >= 1) return b;
  if (t <= 0) return a;
  const out = { ...b };
  for (const key of ['bg0', 'bg1', 'bg2', 'primary', 'accent', 'gnd0', 'gnd1', 'line', 'obC', 'obC2', 'fbC']) {
    out[key] = blendHex(a[key], b[key], t);
  }
  return out;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCoverTiled(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dy = y + (h - dh) / 2;
  for (let tx = x - (dw % w); tx < x + w + dw; tx += dw) {
    ctx.drawImage(img, tx, dy, dw, dh);
  }
}

function drawStars(ctx, stars, scroll, theme, beatFlash) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  const twinkle = CONFIG.performance.lowFx ? 0 : scroll * 0.02;
  for (const star of stars) {
    const x = wrap(star.x - scroll * 0.35 * star.depth, CONFIG.W);
    const alpha = clamp(0.36 + Math.sin(star.tw + twinkle) * 0.2 + beatFlash * 0.2, 0.1, 1);
    ctx.globalAlpha = alpha;
    if (!CONFIG.performance.lowFx && getPerfConfig().shadowBlur) {
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 5 + beatFlash * 9;
    }
    ctx.beginPath();
    ctx.arc(x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParallaxShapes(ctx, shapes, scroll, theme, beatFlash) {
  ctx.save();
  ctx.lineWidth = 1.4;
  for (const shape of shapes) {
    const x = wrap(shape.x - scroll * shape.layer, CONFIG.W + shape.size * 2) - shape.size;
    ctx.save();
    ctx.translate(x, shape.y);
    ctx.rotate(CONFIG.performance.lowFx ? shape.rot : shape.rot + scroll * 0.002 * shape.layer);
    ctx.globalAlpha = 0.18 + beatFlash * 0.22;
    ctx.strokeStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = CONFIG.performance.lowFx || !getPerfConfig().shadowBlur ? 0 : 8 + beatFlash * 16;
    polygonPath(ctx, 0, 0, shape.size, shape.sides);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawFallbackCube(ctx, size, theme) {
  const half = size / 2;
  const isBossTheme = theme.primary === '#ff2288' || theme.fbC === '#880033';
  const main = isBossTheme ? '#ff3030' : theme.primary;
  const accent = isBossTheme ? '#00e5ff' : theme.accent;
  ctx.fillStyle = main;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.fillRect(-half, -half, size, size);
  ctx.strokeRect(-half, -half, size, size);

  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.fillRect(-half + 8, -half + 8, size - 16, size - 16);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-half + 9, -half + 10, 7, 7);
  ctx.fillRect(half - 16, -half + 10, 7, 7);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-half + 9, half - 11);
  ctx.lineTo(half - 9, half - 16);
  ctx.stroke();
}

function drawFallbackShip(ctx, size, theme) {
  const half = size / 2;
  ctx.fillStyle = theme.primary;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  
  // Body ship
  ctx.beginPath();
  ctx.moveTo(-half, 0);
  ctx.lineTo(half, -half/2);
  ctx.lineTo(half, half/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cockpit
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.arc(0, 0, half/2, 0, Math.PI * 2);
  ctx.fill();
}

function drawFallbackBall(ctx, size, theme) {
  const r = size / 2;
  ctx.fillStyle = theme.primary;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner pattern
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(r, 0);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
}

function drawSpike(ctx, x, y, w, h, theme) {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.25, theme.obC);
  grad.addColorStop(1, theme.obC2);
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBlock(ctx, x, y, w, h, theme, tall) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, theme.obC);
  grad.addColorStop(1, theme.obC2);
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  const rows = tall ? 4 : 2;
  for (let i = 1; i < rows; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h / rows) * i);
    ctx.lineTo(x + w, y + (h / rows) * i);
    ctx.stroke();
  }
}

function polygonPath(ctx, x, y, radius, sides) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (i / sides) * Math.PI * 2;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function blendHex(a, b, t) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return rgbToHex(
    Math.round(ar.r + (br.r - ar.r) * t),
    Math.round(ar.g + (br.g - ar.g) * t),
    Math.round(ar.b + (br.b - ar.b) * t),
  );
}

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function wrap(value, size) {
  return ((value % size) + size) % size;
}
