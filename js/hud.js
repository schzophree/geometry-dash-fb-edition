import { CONFIG, clamp } from './config.js';

export class HUD {
  constructor() {
    this.pauseButton = { x: CONFIG.W - 48, y: 12, w: 36, h: 36 };
  }

  repositionPauseButton() {
    this.pauseButton = { x: CONFIG.W - 48, y: 12, w: 36, h: 36 };
  }

  draw(ctx, state) {
    const { score, level, theme, lives, dangerDistance, beatFlash } = state;
    const danger = dangerDistance < 110;
    const caution = dangerDistance < 170;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 10 + beatFlash * 12;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Pusab, Arial';
    ctx.fillText(`${Math.round(state.songProgress * 100)}%`, 18, 30);
    ctx.font = 'bold 12px Pusab, Arial';
    ctx.fillStyle = theme.primary;
    ctx.fillText(`${level.label} · ${level.diff}`, 18, 48);

    drawProgress(ctx, theme, state.songProgress);
    drawDanger(ctx, caution, danger, theme);
    drawPauseButton(ctx, this.pauseButton);
    drawLives(ctx, lives);

    if (state.godMode) {
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('GOD MODE ACTIVE', CONFIG.W - 60, 42);
    }

    ctx.restore();
  }

  hitPauseButton(x, y) {
    const b = this.pauseButton;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }
}

function drawProgress(ctx, theme, songProgress = 0) {
  const x = CONFIG.W / 2 - 120;
  const y = 16;
  const w = 240;
  const h = 14;
  const progress = clamp(songProgress, 0, 1);

  ctx.save();
  roundRect(ctx, x, y, w, h, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();
  roundRect(ctx, x, y, w * progress, h, 7);
  ctx.fillStyle = theme.primary;
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

function drawDanger(ctx, caution, danger, theme) {
  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = 'bold 16px Pusab, Arial';
  const flicker = danger && Math.floor(performance.now() / 90) % 2 === 0;
  ctx.fillStyle = danger ? (flicker ? '#ffffff' : '#ff3355') : caution ? '#ffd166' : '#00e676';
  ctx.shadowColor = danger ? '#ff3355' : theme.primary;
  ctx.shadowBlur = danger ? 20 : 8;
  ctx.fillText(danger ? 'BAHAYA' : caution ? 'WASPADA' : 'AMAN', CONFIG.W - 60, 34);
  ctx.restore();
}

function drawPauseButton(ctx, b) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.strokeStyle = 'rgba(255,255,255,0.64)';
  ctx.lineWidth = 2;
  roundRect(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(b.x + 11, b.y + 9, 5, 18);
  ctx.fillRect(b.x + 20, b.y + 9, 5, 18);
  ctx.restore();
}

function drawLives(ctx, lives) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = 'bold 20px Pusab, Arial';

  if (CONFIG.gameplay.oneHitKill) {
    ctx.restore();
    return;
  }

  ctx.shadowColor = '#ff4488';
  ctx.shadowBlur = 12;
  const liveText = lives > 8 ? `❤️ ×${lives}` : '❤️'.repeat(Math.max(0, lives));
  ctx.fillStyle = '#ffffff';
  ctx.fillText(liveText || '♡ ×0', 16, CONFIG.H - 16);

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
