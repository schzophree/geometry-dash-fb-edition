import { CONFIG, clamp, getLevel, getLevelIndexForScore } from './config.js';
import { AssetLoader, blendThemes, createShapes, createStars } from './assets.js';
import { AudioEngine } from './audio.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { FacebookChaser } from './facebook.js';
import { GhostStatus } from './ghost.js';
import { HUD } from './hud.js';
import { Screens } from './screens.js';
import { createStageArt, drawStageBack, drawStageFront } from './stage-art.js';
import { CyberDemonBoss } from './boss.js';
import { BOSS_MAPPING } from './level-data.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.W;
canvas.height = CONFIG.H;

const assets = new AssetLoader();
const audio = new AudioEngine(window.MUSIC_LIST || []);
const screens = new Screens();
const player = new Player();
const obstacles = new ObstacleManager();
const facebook = new FacebookChaser();
const ghost = new GhostStatus();
const hud = new HUD();
const stars = createStars();
const shapes = createShapes();
const stageArt = createStageArt();
const cyberBoss = new CyberDemonBoss(BOSS_MAPPING);
const devParams = new URLSearchParams(window.location.search);

let state = 'loading';
let selectedLevel = 0;
let currentLevelIndex = 0;
let score = 0;
let lives = CONFIG.gameplay.startLives;
let gameSpeed = getLevel(0).speed;
let obInterval = getLevel(0).obInterval;
let checkpoint = null;
let shownCheckpoints = new Set();
let isJumpHeld = false;
let frame = 0;
let lastTime = performance.now();
let bgScroll = 0;
let beatFlash = 0;
let screenShake = 0;
let transition = null;
let levelTransitionFx = null;
let impactParticles = [];

if (devParams.has('level')) {
  selectedLevel = clamp(Number(devParams.get('level')) || 0, 0, CONFIG.levels.length - 1);
  currentLevelIndex = selectedLevel;
  const previewLevel = getLevel(selectedLevel);
  score = previewLevel.scoreStart;
  gameSpeed = previewLevel.speed;
  obInterval = previewLevel.obInterval;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

bindUI();
requestAnimationFrame(loop);
bootstrap();

async function bootstrap() {
  let assetProgress = 0;
  let audioProgress = 0;
  const updateProgress = () => screens.showLoading(assetProgress * 0.72 + audioProgress * 0.28);

  screens.setTheme(getLevel(0).theme);
  drawLoadingFrame();

  await Promise.all([
    assets.preload((progress) => {
      assetProgress = progress;
      updateProgress();
    }),
    audio.preload((progress) => {
      audioProgress = progress;
      updateProgress();
    }),
  ]);

  if (document.fonts?.ready) await document.fonts.ready.catch(() => {});

  state = 'start';
  screens.hideLoading();
  setStartPreviewLevel(selectedLevel);
  screens.showStart(selectedLevel, assets.logo);
  if (devParams.has('autostart')) {
    startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
  }
  console.log('[game] ready');
}

function loop(now) {
  const dt = Math.min(2.25, (now - lastTime) / 16.6667 || 1);
  lastTime = now;
  frame += dt;

  if (state === 'loading') {
    bgScroll += 1.6 * dt;
    drawLoadingFrame();
  } else if (state === 'start') {
    bgScroll += 1.8 * dt;
    beatFlash *= 0.96;
    drawScene(false);
  } else if (state === 'playing') {
    updatePlaying(dt);
    drawScene(true);
  } else if (state === 'dead') {
    updateImpactParticles(dt);
    bgScroll += 1.3 * dt;
    drawScene(false);
  }

  requestAnimationFrame(loop);
}

function updatePlaying(dt) {
  const level = getLevel(currentLevelIndex);
  if (audio.detectBeat(level.bpm)) {
    beatFlash = 1;
    screenShake = Math.max(screenShake, 3.5);
  }
  const audioTime = audio.currentTime();

  score += CONFIG.SCORE_PER_FRAME * dt;
  handleLevelTransition();

  const activeLevel = getLevel(currentLevelIndex);
  gameSpeed = activeLevel.speed;
  obInterval = activeLevel.obInterval;
  bgScroll += gameSpeed * dt;

  player.update(isJumpHeld);
  const collected = obstacles.update(dt, activeLevel, gameSpeed, obInterval, player.hitbox(), frame, {
    spawnObstacles: activeLevel.index !== 2,
  });
  if (collected > 0) {
    lives += collected;
    screenShake = Math.max(screenShake, 2.2);
  }

  facebook.update(player, gameSpeed, score - activeLevel.scoreStart, frame);
  if (activeLevel.index === 2) {
    cyberBoss.update(dt, audioTime, beatFlash, player.hitbox());
    screenShake = Math.max(screenShake, cyberBoss.takeShake());
  }
  ghost.update(dt, frame);
  updateImpactParticles(dt);

  if (!player.isInvincible()) {
    if (activeLevel.index === 2 && cyberBoss.checkCollision()) {
      applyDamage('Hancur oleh Laser Cyber-Demon FB!');
    } else if (obstacles.collidesWithPlayer(player.hitbox())) {
      applyDamage('Kena rintangan neon.');
    } else if (facebook.caught(player)) {
      applyDamage('Logo Fesnuk berhasil nyentuh cube.');
      facebook.reset();
    }
  }

  beatFlash *= 0.955;
  screenShake *= 0.88;
}

function handleLevelTransition() {
  const targetIndex = getLevelIndexForScore(score);
  if (targetIndex <= currentLevelIndex) return;
  if (!audio.songFinishedOnce()) return;

  // Mencegah skip level: paksa agar selalu transisi 1 level saja secara berurutan
  const nextIndex = currentLevelIndex + 1;
  if (nextIndex >= CONFIG.levels.length) return; // Cegah error jika sudah di level mentok

  for (let levelIndex = currentLevelIndex + 1; levelIndex <= nextIndex; levelIndex++) {
    const nextLevel = getLevel(levelIndex);
    gameSpeed = nextLevel.speed;
    obInterval = nextLevel.obInterval;
    score = Math.max(score, nextLevel.scoreStart);
    checkpoint = {
      level: levelIndex,
      score: nextLevel.scoreStart,
      fbX: facebook.x,
      gameSpeed,
      obInterval,
      lives,
    };

    if (!shownCheckpoints.has(nextLevel.scoreStart)) {
      shownCheckpoints.add(nextLevel.scoreStart);
      screens.checkpoint();
      screenShake = Math.max(screenShake, 5);
    }
  }

  const previousTheme = getLevel(currentLevelIndex).theme;
  currentLevelIndex = nextIndex;
  const level = getLevel(currentLevelIndex);
  if (level.name === 'BOSS') audio.playBossCheckpointCue();
  transition = {
    from: previousTheme,
    to: level.theme,
    started: performance.now(),
    duration: 800,
  };
  levelTransitionFx = {
    label: level.label,
    name: level.name,
    started: performance.now(),
    duration: 920,
  };
  screens.setTheme(level.theme);
  obstacles.reset();
  ghost.reset();
  cyberBoss.reset();
  audio.playLevel(currentLevelIndex, 0);
  console.log('[game] checkpoint saved', checkpoint);
}

function applyDamage(reason) {
  if (!CONFIG.gameplay.oneHitKill && lives > 0) {
    lives -= 1;
    spawnImpact(player.x + player.size / 2, player.y + player.size / 2, '#ff4488', 18);
    screenShake = Math.max(screenShake, 8);
    if (lives > 0) {
      player.hit();
      return;
    }
  }

  triggerGameOver(reason);
}

function triggerGameOver(reason) {
  state = 'dead';
  audio.muffleDeath();
  spawnImpact(player.x + player.size / 2, player.y + player.size / 2, '#ff3355', 42);
  screens.showGameOver({
    score,
    reason,
    hasCheckpoint: Boolean(checkpoint),
  });
}

function startGame({ fromCheckpoint = false, levelIndex = selectedLevel, clearCheckpoint = true } = {}) {
  audio.unlock();
  screens.hideGameOver();
  screens.hideStart();
  if (devParams.has('autostart')) screens.hideStartNow();

  if (fromCheckpoint && checkpoint) {
    currentLevelIndex = checkpoint.level;
    score = checkpoint.score;
    lives = checkpoint.lives;
    gameSpeed = checkpoint.gameSpeed;
    obInterval = checkpoint.obInterval;
  } else {
    if (clearCheckpoint) {
      checkpoint = null;
      shownCheckpoints = new Set();
    }
    currentLevelIndex = clamp(levelIndex, 0, CONFIG.levels.length - 1);
    const level = getLevel(currentLevelIndex);
    score = level.scoreStart;
    lives = CONFIG.gameplay.startLives;
    gameSpeed = level.speed;
    obInterval = level.obInterval;
  }

  const level = getLevel(currentLevelIndex);
  screens.setTheme(level.theme);
  state = 'playing';
  beatFlash = 0;
  screenShake = 0;
  bgScroll = 0;
  impactParticles = [];
  transition = null;
  levelTransitionFx = null;
  lastTime = performance.now();

  player.reset();
  facebook.reset();
  obstacles.reset();
  ghost.reset();
  cyberBoss.reset();
  audio.playLevel(currentLevelIndex, 0);
  console.log('[game] start', { fromCheckpoint, level: level.name, score, lives });
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  audio.pause();
  screens.showPause({
    score,
    song: audio.currentSongName(),
    muted: audio.muted,
  });
}

function resumeGame() {
  if (state !== 'paused') return;
  screens.hidePause(() => {
    state = 'playing';
    lastTime = performance.now();
    audio.resume();
  });
}

function returnToMenu() {
  audio.stop();
  state = 'start';
  screens.hidePause();
  screens.hideGameOver();
  setStartPreviewLevel(selectedLevel);
  screens.showStart(selectedLevel, assets.logo);
}

function restartSameLevel() {
  const levelIndex = currentLevelIndex;
  audio.stop();
  screens.hidePause(() => startGame({ levelIndex, clearCheckpoint: false }));
}

function restartFromBeginning() {
  audio.stop();
  checkpoint = null;
  shownCheckpoints = new Set();
  startGame({ levelIndex: 0, clearCheckpoint: true });
}

function continueFromCheckpoint() {
  if (!checkpoint) return;
  startGame({ fromCheckpoint: true, clearCheckpoint: false });
}

function drawLoadingFrame() {
  const level = getLevel(0);
  assets.drawBackground(ctx, level, level.theme, bgScroll, 0.15, stars, shapes);
  assets.drawGround(ctx, level.theme, bgScroll, 0.15);
}

function drawScene(withEntities) {
  const level = getLevel(currentLevelIndex);
  const theme = effectiveTheme(level);
  const shake = state === 'playing' ? screenShake : 0;

  ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
  ctx.save();
  if (shake > 0.05) {
    ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
  }

  assets.drawBackground(ctx, level, theme, bgScroll, beatFlash, stars, shapes);
  drawStageBack(ctx, stageArt, level, theme, bgScroll, beatFlash, frame);
  assets.drawGround(ctx, theme, bgScroll, beatFlash);
  drawStageFront(ctx, stageArt, level, theme, bgScroll, beatFlash, frame);

  if (withEntities || state === 'dead' || state === 'paused') {
    if (currentLevelIndex === 2) {
      cyberBoss.draw(ctx, assets, theme, player.hitbox(), beatFlash, frame);
    }
    player.drawTrail(ctx, theme);
    obstacles.draw(ctx, assets, theme, beatFlash, frame);
    facebook.draw(ctx, theme, beatFlash);
    assets.drawPlayer(ctx, player, theme, beatFlash, frame);
    ghost.draw(ctx);
    drawImpactParticles(ctx);
  }

  ctx.restore();

  drawLevelTransitionOverlay(ctx, level, theme);

  if (state === 'playing' || state === 'paused' || state === 'dead') {
    hud.draw(ctx, {
      score,
      level,
      theme,
      lives,
      checkpointActive: Boolean(checkpoint),
      dangerDistance: facebook.distanceTo(player),
      beatFlash,
      songProgress: state === 'playing' || state === 'paused' || state === 'dead' ? audio.progress() : null,
    });
  }
}

function drawLevelTransitionOverlay(drawCtx, level, theme) {
  if (!levelTransitionFx) return;

  const elapsed = performance.now() - levelTransitionFx.started;
  const t = elapsed / levelTransitionFx.duration;
  if (t >= 1) {
    levelTransitionFx = null;
    return;
  }

  const wipe = easeOutCubic(clamp((t - 0.06) / 0.54, 0, 1));
  const textIn = clamp((t - 0.16) / 0.22, 0, 1);
  const textOut = clamp((0.86 - t) / 0.18, 0, 1);
  const textAlpha = Math.min(textIn, textOut);
  const flashAlpha = Math.max(0, 0.55 - t * 1.8);
  const bandX = -CONFIG.W * 0.75 + wipe * CONFIG.W * 1.55;

  drawCtx.save();
  if (flashAlpha > 0) {
    drawCtx.globalAlpha = flashAlpha;
    drawCtx.fillStyle = '#ffffff';
    drawCtx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  }

  drawCtx.globalAlpha = 0.78;
  drawCtx.fillStyle = `${theme.primary}cc`;
  drawCtx.beginPath();
  drawCtx.moveTo(bandX - 110, 0);
  drawCtx.lineTo(bandX + 190, 0);
  drawCtx.lineTo(bandX + 70, CONFIG.H);
  drawCtx.lineTo(bandX - 230, CONFIG.H);
  drawCtx.closePath();
  drawCtx.fill();

  drawCtx.globalAlpha = 0.42;
  drawCtx.fillStyle = `${theme.accent}aa`;
  drawCtx.fillRect(0, CONFIG.GROUND_Y - 6, CONFIG.W * wipe, 10);

  if (textAlpha > 0.02) {
    drawCtx.globalAlpha = textAlpha;
    drawCtx.textAlign = 'center';
    drawCtx.fillStyle = '#ffffff';
    drawCtx.font = '42px Pusab, Impact, Arial Black, sans-serif';
    drawCtx.shadowColor = theme.primary;
    drawCtx.shadowBlur = CONFIG.performance.lowFx ? 6 : 18;
    drawCtx.fillText(levelTransitionFx.label, CONFIG.W / 2, 184);
    drawCtx.font = '24px Pusab, Impact, Arial Black, sans-serif';
    drawCtx.fillStyle = theme.accent;
    drawCtx.fillText(levelTransitionFx.name, CONFIG.W / 2, 220);
  }
  drawCtx.restore();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function effectiveTheme(level) {
  if (!transition) return level.theme;
  const t = (performance.now() - transition.started) / transition.duration;
  if (t >= 1) {
    transition = null;
    return level.theme;
  }
  return blendThemes(transition.from, transition.to, t);
}

function spawnImpact(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 5.2;
    impactParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 2 + Math.random() * 6,
      color,
      life: 1,
    });
  }
}

function updateImpactParticles(dt) {
  for (const p of impactParticles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.14 * dt;
    p.life -= 0.025 * dt;
  }
  impactParticles = impactParticles.filter((p) => p.life > 0);
}

function drawImpactParticles(drawCtx) {
  for (const p of impactParticles) {
    drawCtx.save();
    drawCtx.globalAlpha = Math.max(0, p.life);
    drawCtx.fillStyle = p.color;
    drawCtx.shadowColor = p.color;
    drawCtx.shadowBlur = 14;
    drawCtx.beginPath();
    drawCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.restore();
  }
}

function bindUI() {
  document.getElementById('startButton').addEventListener('click', () => {
    startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
  });

  for (const button of document.querySelectorAll('.level-choice')) {
    button.addEventListener('click', () => {
      setStartPreviewLevel(Number(button.dataset.level));
      screens.updateLevelButtons(selectedLevel);
    });
  }

  document.getElementById('resumeButton').addEventListener('click', resumeGame);
  document.getElementById('pauseRestartButton').addEventListener('click', restartSameLevel);
  document.getElementById('menuButton').addEventListener('click', returnToMenu);
  document.getElementById('muteButton').addEventListener('click', () => {
    const muted = audio.toggleMuted();
    screens.showPause({ score, song: audio.currentSongName(), muted });
  });
  document.getElementById('restartButton').addEventListener('click', restartFromBeginning);
  document.getElementById('continueCheckpointButton').addEventListener('click', continueFromCheckpoint);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', () => {
    isJumpHeld = false;
  });
  canvas.addEventListener('touchstart', (event) => event.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (event) => event.preventDefault(), { passive: false });
}

function onKeyDown(event) {
  const jumpKey = event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW';
  if (jumpKey) {
    event.preventDefault();
    isJumpHeld = true;
    audio.unlock();
    if (state === 'playing') player.jump();
    else if (state === 'start') startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
    return;
  }

  if (event.code === 'Escape' || event.code === 'KeyP') {
    event.preventDefault();
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }

  if (event.code === 'Enter') {
    event.preventDefault();
    if (state === 'dead') startGame({ fromCheckpoint: Boolean(checkpoint), clearCheckpoint: false });
    else if (state === 'start') startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
  }
}

function onKeyUp(event) {
  const jumpKey = event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW';
  if (jumpKey) {
    event.preventDefault();
    isJumpHeld = false;
  }
}

function onPointerDown(event) {
  event.preventDefault();
  isJumpHeld = true;
  audio.unlock();
  const pos = canvasPoint(event);
  if (state === 'playing') {
    if (hud.hitPauseButton(pos.x, pos.y)) pauseGame();
    else player.jump();
  }
  else if (state === 'start') startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
  else if (state === 'dead') startGame({ fromCheckpoint: Boolean(checkpoint), clearCheckpoint: false });
}

function setStartPreviewLevel(levelIndex) {
  selectedLevel = clamp(levelIndex, 0, CONFIG.levels.length - 1);
  if (state !== 'start' && state !== 'loading') return;

  currentLevelIndex = selectedLevel;
  const level = getLevel(currentLevelIndex);
  score = level.scoreStart;
  gameSpeed = level.speed;
  obInterval = level.obInterval;
  screens.setTheme(level.theme);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * CONFIG.W,
    y: ((event.clientY - rect.top) / rect.height) * CONFIG.H,
  };
}

function resizeCanvas() {
  const width = `${window.innerWidth}px`;
  const height = `${window.innerHeight}px`;
  canvas.style.width = width;
  canvas.style.height = height;
  document.getElementById('gameWrap').style.width = width;
  document.getElementById('gameWrap').style.height = height;
}
