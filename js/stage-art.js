import { CONFIG, clamp } from './config.js';

export function createStageArt() {
  return {
    sparks: Array.from({ length: CONFIG.performance.sparks }, (_, i) => ({
      x: Math.random() * CONFIG.W,
      y: 26 + Math.random() * (CONFIG.GROUND_Y - 62),
      size: 2 + Math.random() * 5,
      speed: 0.25 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      hot: i % 3 === 0,
    })),
    bossShards: Array.from({ length: CONFIG.performance.bossShards }, (_, i) => ({
      x: Math.random() * CONFIG.W,
      y: 32 + Math.random() * (CONFIG.GROUND_Y - 78),
      w: 4 + (i % 4) * 3,
      h: 4 + (i % 3) * 5,
      speed: 0.9 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.035,
      hot: i % 2 === 0,
    })),
    teeth: Array.from({ length: CONFIG.performance.caveTeeth }, (_, i) => ({
      x: i * 48 - 18,
      h: 14 + ((i * 17) % 34),
    })),
    hexMarks: Array.from({ length: 16 }, (_, i) => ({
      x: Math.random() * CONFIG.W,
      y: 70 + Math.random() * (CONFIG.GROUND_Y - 145),
      size: 28 + (i % 4) * 10,
      speed: 0.16 + (i % 3) * 0.12,
    })),
    portals: [
      { x: 520, y: 206, r: 34, tone: '#ffd13b' },
      { x: 690, y: 190, r: 30, tone: '#ff48e5' },
    ],
  };
}

export function drawStageBack(ctx, art, level, theme, scroll, beatFlash, frame) {
  drawDeepVignette(ctx, level, theme, beatFlash);
  drawHexBand(ctx, art, level, theme, scroll);
  drawBossHazardBands(ctx, level, theme, scroll, beatFlash, frame);
  // drawBossBackdrop removed per request
  drawSparks(ctx, art.sparks, level, theme, scroll, beatFlash, frame);
  // Sharp boss shards removed; they looked like stray debris/obstacles.
  // drawPortals removed per request
}

export function drawStageFront(ctx, art, level, theme, scroll, beatFlash, frame) {
  drawCaveSilhouette(ctx, art.teeth, level, theme, scroll, beatFlash);
  drawSpeedArrows(ctx, level, theme, scroll, frame);
  drawEdgeVignette(ctx, level);
}

function drawDeepVignette(ctx, level, theme, beatFlash) {
  ctx.save();
  const intensity = 0.34 + level.index * 0.08;
  const glow = ctx.createRadialGradient(CONFIG.W * 0.5, CONFIG.H * 0.48, 30, CONFIG.W * 0.5, CONFIG.H * 0.48, 430);
  glow.addColorStop(0, `${theme.accent}${level.index >= 2 ? '28' : '18'}`);
  glow.addColorStop(0.42, 'rgba(0,0,0,0)');
  glow.addColorStop(1, `rgba(0,0,0,${intensity})`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

  if (beatFlash > 0.02) {
    ctx.globalAlpha = beatFlash * 0.12;
    ctx.fillStyle = level.index >= 2 ? '#ff0000' : theme.primary;
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  }
  ctx.restore();
}

function drawHexBand(ctx, art, level, theme, scroll) {
  if (level.index < 1) return;
  ctx.save();
  ctx.globalAlpha = 0.14 + level.index * 0.035;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;

  if (CONFIG.performance.lowFx) {
    const count = level.index >= 2 ? 10 : 12;
    for (let i = 0; i < Math.min(count, art.hexMarks.length); i++) {
      const mark = art.hexMarks[i];
      const x = wrap(mark.x - scroll * mark.speed, CONFIG.W + mark.size * 2) - mark.size;
      polygon(ctx, x, mark.y, mark.size, 6);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const size = 26;
  const stepX = size * 1.55;
  const stepY = size * 1.34;
  const offset = -((scroll * 0.42) % stepX);
  for (let y = 72; y < CONFIG.GROUND_Y - 48; y += stepY) {
    for (let x = offset - stepX; x < CONFIG.W + stepX; x += stepX) {
      const shifted = x + ((Math.floor(y / stepY) % 2) * stepX) / 2;
      polygon(ctx, shifted, y, size, 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBossBackdrop(ctx, level, theme, beatFlash, frame) {
  if (level.index < 2) return;

  ctx.save();
  const cx = CONFIG.W * 0.52;
  const cy = CONFIG.GROUND_Y + 84;
  const scale = level.index >= 2 ? 1.16 : 0.96;
  const pulse = 1 + beatFlash * 0.04 + Math.sin(frame * 0.025) * 0.015;

  ctx.globalAlpha = level.index >= 2 ? 0.7 : 0.45;
  ctx.translate(cx, cy);
  ctx.scale(scale * pulse, scale * pulse);

  const bodyGrad = ctx.createRadialGradient(0, -60, 10, 0, -30, 210);
  bodyGrad.addColorStop(0, `${theme.accent}cc`);
  bodyGrad.addColorStop(0.5, `${theme.obC2}88`);
  bodyGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = bodyGrad;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = CONFIG.performance.lowFx ? 0 : 28;

  ctx.beginPath();
  ctx.moveTo(-230, 74);
  ctx.bezierCurveTo(-190, -92, -98, -164, 0, -178);
  ctx.bezierCurveTo(112, -162, 210, -84, 238, 74);
  ctx.lineTo(192, 116);
  ctx.bezierCurveTo(110, 76, 46, 58, 0, 58);
  ctx.bezierCurveTo(-56, 58, -128, 82, -198, 116);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  drawBossEye(ctx, -84, -74, theme, beatFlash);
  drawBossEye(ctx, 84, -74, theme, beatFlash);

  ctx.fillStyle = 'rgba(0,0,0,0.84)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 88, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  for (let i = -4; i <= 4; i++) {
    ctx.fillRect(i * 18 - 6, -28, 11, 18);
  }

  ctx.restore();
}

function drawBossEye(ctx, x, y, theme, beatFlash) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffdf75';
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = CONFIG.performance.lowFx ? 4 + beatFlash * 4 : 8 + beatFlash * 12;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11 + beatFlash * 4, 8 + beatFlash * 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBossHazardBands(ctx, level, theme, scroll, beatFlash, frame) {
  if (level.index < 2) return;
  ctx.save();
  ctx.globalAlpha = 0.16 + beatFlash * 0.18;
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 2;
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = CONFIG.performance.lowFx ? 0 : 16;

  const bands = CONFIG.performance.lowFx ? 3 : 5;
  for (let i = 0; i < bands; i++) {
    const x = wrap(i * 190 - scroll * 0.18 + Math.sin(frame * 0.018 + i) * 18, CONFIG.W + 260) - 130;
    ctx.beginPath();
    ctx.moveTo(x, 38 + i * 24);
    ctx.lineTo(x + 260, 8 + i * 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSparks(ctx, sparks, level, theme, scroll, beatFlash, frame) {
  ctx.save();
  const count =
    level.index >= 2
      ? CONFIG.performance.bossSparks
      : level.index === 1
        ? CONFIG.performance.normalSparks
        : CONFIG.performance.starterSparks;
  const speedBoost = level.index >= 2 ? 1.42 : level.index === 1 ? 1.04 : 0.82;
  const baseAlpha = level.index >= 2 ? 0.34 : level.index === 1 ? 0.22 : 0.18;
  const waveAlpha = level.index >= 2 ? 0.34 : 0.16;

  if (level.index >= 2 && !CONFIG.performance.lowFx) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 12;
  }

  for (let i = 0; i < Math.min(count, sparks.length); i++) {
    const spark = sparks[i];
    const x = wrap(spark.x - scroll * spark.speed * speedBoost, CONFIG.W + 24) - 12;
    const y = spark.y + Math.sin(frame * 0.045 + spark.phase) * (level.index >= 2 ? 9 : 3);
    const alpha = clamp(baseAlpha + Math.sin(frame * 0.06 + spark.phase) * waveAlpha + beatFlash * 0.16, 0.06, 1);
    const size = spark.size * (level.index >= 2 ? 1.1 : level.index === 1 ? 0.86 : 0.68);
    ctx.globalAlpha = alpha;
    ctx.fillStyle =
      level.index >= 2
        ? spark.hot ? '#ff2010' : theme.accent
        : spark.hot ? theme.primary : theme.accent;

    if (level.index >= 2 && i % 4 === 0) ctx.fillRect(x, y, size * 4.2, Math.max(2, size * 0.8));
    else ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawBossShardStorm(ctx, shards, level, theme, scroll, beatFlash, frame) {
  if (level.index < 2) return;
  ctx.save();
  if (!CONFIG.performance.lowFx) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 16;
  }

  for (const shard of shards) {
    const x = wrap(shard.x - scroll * shard.speed, CONFIG.W + 80) - 40;
    const y = wrap(shard.y + Math.sin(frame * 0.05 + shard.phase) * 18, CONFIG.GROUND_Y - 32);
    ctx.globalAlpha = clamp(0.34 + Math.sin(frame * 0.07 + shard.phase) * 0.28 + beatFlash * 0.2, 0.12, 0.95);
    ctx.fillStyle = shard.hot ? '#ff2600' : theme.primary;
    if (CONFIG.performance.lowFx) {
      ctx.fillRect(x - shard.w, y - shard.h / 2, shard.w * 2.3, Math.max(3, shard.h * 0.7));
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(shard.phase + frame * shard.spin);
      ctx.fillRect(-shard.w / 2, -shard.h / 2, shard.w, shard.h);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawPortals(ctx, portals, level, theme, scroll, beatFlash, frame) {
  if (level.index < 2) return;
  ctx.save();
  for (const portal of portals) {
    const x = wrap(portal.x - scroll * 0.78, CONFIG.W + 220) - 110;
    if (x < -70 || x > CONFIG.W + 70) continue;
    const wobble = Math.sin(frame * 0.06 + portal.x) * 8;
    drawPortal(ctx, x, portal.y + wobble, portal.r, portal.tone, theme, beatFlash, frame);
  }
  ctx.restore();
}

function drawPortal(ctx, x, y, r, tone, theme, beatFlash, frame) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(frame * 0.025);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.shadowColor = tone;
  ctx.shadowBlur = CONFIG.performance.lowFx ? 3 : 20;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.72, r, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = tone;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.5, r * 0.82, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = `${theme.primary}aa`;
  const particleCount = CONFIG.performance.lowFx ? 6 : 12;
  for (let i = 0; i < particleCount; i++) {
    const a = (i / particleCount) * Math.PI * 2 + frame * 0.05;
    ctx.fillRect(Math.cos(a) * r * 0.9 - 2, Math.sin(a) * r * 1.14 - 2, 4, 4);
  }
  ctx.restore();
}

function drawCaveSilhouette(ctx, teeth, level, theme, scroll, beatFlash) {
  if (level.index < 1) return;
  ctx.save();
  ctx.shadowColor = level.index >= 2 ? '#ff1f1f' : theme.accent;
  ctx.shadowBlur = CONFIG.performance.lowFx ? 0 : 22;

  if (level.index >= 2) {
    ctx.globalAlpha = 0.72 + beatFlash * 0.2;
    ctx.fillStyle = '#0a0000';
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.GROUND_Y - 4);
    for (let x = 0; x <= CONFIG.W + 24; x += 24) {
      const h = 14 + ((x * 7) % 28);
      ctx.lineTo(x, CONFIG.GROUND_Y - h);
      ctx.lineTo(x + 12, CONFIG.GROUND_Y - 4);
    }
    ctx.lineTo(CONFIG.W, CONFIG.H);
    ctx.lineTo(0, CONFIG.H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSpeedArrows(ctx, level, theme, scroll, frame) {
  if (level.index < 2) return;
  ctx.save();
  const x = wrap(640 - scroll * 1.08, CONFIG.W + 260) - 130;
  const y = 206 + Math.sin(frame * 0.05) * 5;
  if (x > -120 && x < CONFIG.W + 120) {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = CONFIG.performance.lowFx ? 3 : 20;
    for (let i = 0; i < 3; i++) {
      drawArrow(ctx, x + i * 25, y, theme.accent, '#ffffff');
    }
  }
  ctx.restore();
}

function drawArrow(ctx, x, y, fill, stroke) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, -24);
  ctx.lineTo(6, 0);
  ctx.lineTo(-16, 24);
  ctx.lineTo(0, 24);
  ctx.lineTo(22, 0);
  ctx.lineTo(0, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawEdgeVignette(ctx, level) {
  ctx.save();
  const alpha = 0.3 + level.index * 0.07;
  const grad = ctx.createRadialGradient(CONFIG.W / 2, CONFIG.H / 2, 180, CONFIG.W / 2, CONFIG.H / 2, 520);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  ctx.restore();
}

function polygon(ctx, x, y, radius, sides) {
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

function wrap(value, size) {
  return ((value % size) + size) % size;
}
