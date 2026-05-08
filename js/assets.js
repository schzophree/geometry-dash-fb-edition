import { CONFIG, clamp } from './config.js';

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
  }

  async preload(onProgress = () => {}) {
    const tasks = [];
    const queue = [
      ['sheet1', IMAGE_GROUPS.sheet1],
      ['sheet2', IMAGE_GROUPS.sheet2],
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
    const bg = this.backgrounds[level.index];
    const skyH = CONFIG.GROUND_Y;
    ctx.save();

    if (bg) {
      drawCoverTiled(ctx, bg, 0, 0, CONFIG.W, skyH);
      const overlay = ctx.createLinearGradient(0, 0, 0, skyH);
      overlay.addColorStop(0, `${theme.bg0}55`);
      overlay.addColorStop(1, `${theme.bg1}88`);
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, CONFIG.W, skyH);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.H);
      bgGrad.addColorStop(0, theme.bg0);
      bgGrad.addColorStop(0.72, theme.bg1);
      bgGrad.addColorStop(1, theme.bg2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    }

    drawStars(ctx, stars, scroll, theme, beatFlash);
    drawParallaxShapes(ctx, shapes, scroll, theme, beatFlash);

    if (beatFlash > 0.02) {
      ctx.globalAlpha = beatFlash * 0.12;
      ctx.fillStyle = theme.primary;
      ctx.fillRect(0, 0, CONFIG.W, skyH);
    }

    ctx.restore();
  }

  drawGround(ctx, theme, scroll, beatFlash) {
    const groundImg = this.images.get('ground');
    const y = CONFIG.GROUND_Y;
    const h = CONFIG.H - y;

    ctx.save();
    if (groundImg) {
      const tileW = Math.max(48, (groundImg.width / Math.max(1, groundImg.height)) * h);
      const start = -((scroll * 0.85) % tileW);
      for (let x = start - tileW; x < CONFIG.W + tileW; x += tileW) {
        ctx.drawImage(groundImg, x, y, tileW, h);
      }
    } else {
      const grad = ctx.createLinearGradient(0, y, 0, CONFIG.H);
      grad.addColorStop(0, theme.gnd0);
      grad.addColorStop(1, theme.gnd1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, CONFIG.W, h);

      ctx.strokeStyle = `${theme.line}66`;
      ctx.lineWidth = 1;
      const grid = 24;
      const offset = -((scroll * 0.9) % grid);
      for (let x = offset; x <= CONFIG.W + grid; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 22, CONFIG.H);
        ctx.stroke();
      }
      for (let gy = y + grid; gy < CONFIG.H; gy += grid) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CONFIG.W, gy);
        ctx.stroke();
      }
    }

    ctx.shadowColor = theme.line;
    ctx.shadowBlur = CONFIG.performance.lowFx ? 3 + beatFlash * 5 : 8 + beatFlash * 16;
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.W, y);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer(ctx, player, theme, beatFlash, frame) {
    const sheet = this.images.get('sheet1');
    const flicker = player.invincible > 0 && Math.floor(frame / 6) % 2 === 0;
    if (flicker) return;

    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    ctx.rotate(player.rot);
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = CONFIG.performance.lowFx ? 6 + beatFlash * 6 : 12 + beatFlash * 14;

    if (sheet) {
      ctx.drawImage(sheet, 0, 0, 75, 75, -player.size / 2, -player.size / 2, player.size, player.size);
      ctx.strokeStyle = `${theme.primary}aa`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size);
    } else {
      drawFallbackCube(ctx, player.size, theme);
    }

    ctx.restore();
  }

  drawObstacle(ctx, obs, theme, beatFlash) {
    ctx.save();
    ctx.shadowColor = theme.obC;
    ctx.shadowBlur = CONFIG.performance.lowFx ? 4 + beatFlash * 4 : 11 + beatFlash * 9;
    if (obs.type === 'spike') drawSpike(ctx, obs.x, obs.y, obs.w, obs.h, theme);
    else drawBlock(ctx, obs.x, obs.y, obs.w, obs.h, theme, obs.type === 'tall');
    ctx.restore();
  }
}

export function createStars() {
  return Array.from({ length: CONFIG.performance.stars }, () => ({
    x: Math.random() * CONFIG.W,
    y: Math.random() * (CONFIG.GROUND_Y - 24),
    r: 0.7 + Math.random() * 1.8,
    tw: Math.random() * Math.PI * 2,
    depth: 0.6 + Math.random() * 1.4,
  }));
}

export function createShapes() {
  return Array.from({ length: CONFIG.performance.shapes }, (_, i) => ({
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
  for (const star of stars) {
    const x = wrap(star.x - scroll * 0.35 * star.depth, CONFIG.W);
    const alpha = clamp(0.36 + Math.sin(star.tw + scroll * 0.02) * 0.28 + beatFlash * 0.28, 0.1, 1);
    ctx.globalAlpha = alpha;
    if (!CONFIG.performance.lowFx) {
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
    ctx.rotate(shape.rot + scroll * 0.002 * shape.layer);
    ctx.globalAlpha = 0.18 + beatFlash * 0.22;
    ctx.strokeStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = CONFIG.performance.lowFx ? 0 : 8 + beatFlash * 16;
    polygonPath(ctx, 0, 0, shape.size, shape.sides);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawFallbackCube(ctx, size, theme) {
  const half = size / 2;
  ctx.fillStyle = theme.primary;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.fillRect(-half, -half, size, size);
  ctx.strokeRect(-half, -half, size, size);

  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.fillRect(-half + 8, -half + 8, size - 16, size - 16);

  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  const dot = 4;
  ctx.fillRect(-half + 5, -half + 5, dot, dot);
  ctx.fillRect(half - 9, -half + 5, dot, dot);
  ctx.fillRect(-half + 5, half - 9, dot, dot);
  ctx.fillRect(half - 9, half - 9, dot, dot);
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
