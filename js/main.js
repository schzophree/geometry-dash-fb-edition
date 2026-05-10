import { CONFIG, clamp, getLevel, syncCanvasLayout } from './config.js';
import { perfSampleFrame, resetPerfSampling, getPerfConfig } from './perf.js';
import { VisualEffects } from './visual-effects.js';
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

let assets, audio, screens, player, obstacles, facebook, ghost, hud, stars, shapes, stageArt, cyberBoss;
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
let completeInfo = null;
let impactParticles = [];

let utilityCollisionLock = false;
let rawLoopPrev = performance.now();
let perfSamplingStarted = false;

const progressCheckpoint = {
  saved: false,
  level: 0,
  score: 0,
  progress: 0,
  gameSpeed: 0,
  lives: 0,
  obInterval: 0,
  audioTime: 0,
};
const CP_THRESHOLDS = [0.25, 0.5, 0.75];
let lastProgressCpThreshold = -1;

let assetProgress = 0;
let audioProgress = 0;

if (devParams.has('level')) {
  selectedLevel = clamp(Number(devParams.get('level')) || 0, 0, CONFIG.levels.length - 1);
  currentLevelIndex = selectedLevel;
  const previewLevel = getLevel(selectedLevel);
  score = 0;
  gameSpeed = previewLevel.speed;
  obInterval = previewLevel.obInterval;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

bindUI();
requestAnimationFrame(loop);
window.addEventListener('load', () => {
  bootstrap();
});

async function bootstrap() {
  console.log('[bootstrap] starting...');

  try {
    assets = new AssetLoader();
    audio = new AudioEngine(window.MUSIC_LIST || []);
    screens = new Screens();
    player = new Player();
    obstacles = new ObstacleManager();
    facebook = new FacebookChaser();
    ghost = new GhostStatus();
    hud = new HUD();
    stars = createStars();
    shapes = createShapes();
    stageArt = createStageArt();
    cyberBoss = new CyberDemonBoss(BOSS_MAPPING);
    console.log('[bootstrap] objects initialized');

    screens.setTheme(getLevel(0).theme);
    console.log('[bootstrap] theme set');
    drawLoadingFrame();
    console.log('[bootstrap] loading frame drawn');

    await Promise.all([
      assets.preload((progress, key) => {
        assetProgress = progress;
        console.log(`[assets] progress: ${Math.round(progress*100)}% (${key})`);
        updateProgress();
      }),
      audio.preload((progress) => {
        audioProgress = progress;
        console.log(`[audio] progress: ${Math.round(progress*100)}%`);
        updateProgress();
      }),
    ]);
    console.log('[bootstrap] preload finished');
  } catch (err) {
    console.error('[bootstrap] error during initialization:', err);
    return;
  }

  state = 'start';
  screens.hideLoading();
  setStartPreviewLevel(selectedLevel);
  screens.showStart(selectedLevel, assets.logo);
  if (devParams.has('autostart')) {
    startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
  }
  console.log('[game] ready');
}

function updateProgress() {
  if (screens) screens.showLoading(assetProgress * 0.72 + audioProgress * 0.28);
}

function getMusicEntryForLevel(levelIndex) {
  const list = window.MUSIC_LIST || [];
  const lv = getLevel(levelIndex);
  const idx = lv.musicIndex ?? levelIndex;
  return list[Math.min(idx, list.length - 1)] || null;
}

function checkAndSaveCheckpoint() {
  if (currentLevelIndex < 1) return;
  const ml = getMusicEntryForLevel(currentLevelIndex);
  if (!ml || ml.scoreEnd == null) return;

  const levelStart = currentLevelIndex === 0 ? 0 : currentLevelIndex === 1 ? 900 : 2100;
  const levelEnd = ml.scoreEnd === Infinity ? levelStart + 1700 : ml.scoreEnd;
  const span = Math.max(1, levelEnd - levelStart);
  const progress = Math.min((score - levelStart) / span, 1);

  for (const threshold of CP_THRESHOLDS) {
    if (progress >= threshold && lastProgressCpThreshold < threshold) {
      lastProgressCpThreshold = threshold;
      Object.assign(progressCheckpoint, {
        saved: true,
        level: currentLevelIndex,
        score,
        progress,
        gameSpeed,
        lives,
        obInterval,
        audioTime: audio.currentTime(),
      });
      screens?.checkpoint();
      console.log(`[Checkpoint] Saved at ${Math.round(progress * 100)}%`, { ...progressCheckpoint });
      break;
    }
  }
}

function clearProgressCheckpoint() {
  progressCheckpoint.saved = false;
  lastProgressCpThreshold = -1;
}

function resumeFromProgressCheckpoint() {
  const cp = progressCheckpoint;
  if (!cp.saved) return;
  audio.unlock?.();
  currentLevelIndex = cp.level;
  score = cp.score;
  gameSpeed = cp.gameSpeed;
  lives = cp.lives;
  obInterval = cp.obInterval;
  lastProgressCpThreshold = [...CP_THRESHOLDS].reverse().find((t) => t <= cp.progress) ?? -1;

  player.reset();
  facebook.reset();
  obstacles.reset();
  obstacles.fastForwardAudioTime(cp.level, cp.audioTime || 0);
  ghost.reset();
  if (cp.level === 2) cyberBoss.fastForwardTimeline(cp.audioTime || 0);
  else cyberBoss.reset();
  impactParticles = [];
  beatFlash = 0;
  screenShake = 0;
  utilityCollisionLock = false;
  lastTime = performance.now();
  rawLoopPrev = lastTime;

  const level = getLevel(currentLevelIndex);
  screens.setTheme(level.theme);
  state = 'playing';
  if (audio && typeof audio.resetMuffle === 'function') audio.resetMuffle();
  audio.playLevel(currentLevelIndex, Math.max(0, cp.audioTime || 0));
  screens.hideGameOver();
  console.log('[game] resume progress checkpoint', cp);
}

function loop(now) {
  perfSampleFrame(now, rawLoopPrev);
  rawLoopPrev = now;

  const prevFrameAt = lastTime;
  if (transition && now - prevFrameAt > 500) {
    console.warn('[Watchdog] transition timeout → clear blend');
    transition = null;
    utilityCollisionLock = false;
  }

  const dt = Math.min(2.25, (now - prevFrameAt) / 16.6667 || 1);
  lastTime = now;
  frame += dt;

  if (state === 'loading') {
    bgScroll += 1.6 * dt;
    drawLoadingFrame();
  } else if (state === 'start') {
    if (!perfSamplingStarted) {
      resetPerfSampling();
      perfSamplingStarted = true;
    }
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
  } else if (state === 'complete') {
    updateImpactParticles(dt);
    beatFlash *= 0.96;
    screenShake *= 0.88;
    drawScene(true);
  }

  requestAnimationFrame(loop);
}

function updatePlaying(dt) {
  const level = getLevel(currentLevelIndex);
  let beatHit = false;
  try {
    beatHit = Boolean(audio.detectBeat(level.bpm));
  } catch (e) {
    console.warn('[Audio] detectBeat (non-fatal):', e);
  }
  if (beatHit) {
    beatFlash = 1;
    screenShake = Math.max(screenShake, 3.5);
  }
  const audioTime = audio.currentTime();

  score += 1; // Tetap ada untuk statistik ringan
  checkAndSaveCheckpoint();
  handleLevelTransition();

  const activeLevel = getLevel(currentLevelIndex);
  
  // FIX 3A: Implement speed scaling every 300 score points
  const baseSpeed = activeLevel.speed;
  const speedBoostStages = Math.floor(score / 300);
  const speedIncrementPerStage = 0.3; // Smooth increment
  gameSpeed = baseSpeed + (speedBoostStages * speedIncrementPerStage);
  
  // Cap speed at level maximum (usually scoreEnd level * 0.01 or manually set)
  const maxSpeedForLevel = baseSpeed + 3.0; // Usually cap around +3 from base
  gameSpeed = Math.min(gameSpeed, maxSpeedForLevel);
  
  obInterval = activeLevel.obInterval;
  bgScroll += gameSpeed * dt;

  // Player update moved after solid floor calc

  const collected = obstacles.update(dt, activeLevel, gameSpeed, obInterval, player.hitbox(), frame, {
    spawnObstacles: activeLevel.index !== 2,
    audioTime: audioTime, // Kirim audioTime ke obstacle manager
  });
  if (collected > 0) {
    lives += collected;
    screenShake = Math.max(screenShake, 2.2);
  }

  facebook.update(player, gameSpeed, audioTime * 60, frame);
  if (activeLevel.index === 2) {
    cyberBoss.update(dt, audioTime, beatFlash, player.hitbox());
    screenShake = Math.max(screenShake, cyberBoss.takeShake());
  }
  ghost.update(dt, frame);
  updateImpactParticles(dt);

  const hitObs = obstacles.collidesWithPlayer(player.hitbox());
  
  // Calculate solid floor
  let solidFloorY = CONFIG.GROUND_Y;
  for (const obs of obstacles.obstacles) {
    if (obs.inactive || obs.type.startsWith('portal_') || obs.type.startsWith('orb_') || obs.type === 'spike') continue;
    
    // Check if player is horizontally above the block
    if (player.x + player.size > obs.x && player.x < obs.x + obs.w) {
      // Check if player's bottom is roughly at or slightly above the block's top
      if (player.y + player.size <= obs.y + 12 && player.vy >= 0) {
        solidFloorY = Math.min(solidFloorY, obs.y);
      }
    }
  }
  
  player.update(isJumpHeld, solidFloorY);

  if (hitObs) {
    if (hitObs.type === 'utility') {
      const obs = hitObs.obs;
      if (utilityCollisionLock) {
        /* cegah double-trigger orb/portal sama frame */
      } else if (obs.type.startsWith('portal_')) {
        const nowP = performance.now();
        if (nowP - (obs.lastTriggered || 0) < 1000) {
          /* portal cooldown */
        } else {
          obs.lastTriggered = nowP;
          utilityCollisionLock = true;
          handlePortal(obs.type);
          obs.inactive = true;
          window.setTimeout(() => {
            utilityCollisionLock = false;
          }, 300);
        }
      } else if (obs.type.startsWith('orb_')) {
        if (isJumpHeld) {
          utilityCollisionLock = true;
          handleOrb(obs.type);
          obs.inactive = true;
          screenShake = Math.max(screenShake, 3);
          beatFlash = 1;
          window.setTimeout(() => {
            utilityCollisionLock = false;
          }, 300);
        } else {
          obs.primed = true;
        }
      }
    } else if (hitObs.type === 'lethal' && !player.isInvincible()) {
      applyDamage('Kena rintangan neon.');
    }
  } else if (!player.isInvincible() && facebook.caught(player)) {
    triggerGameOver('Logo Fesnuk berhasil nyentuh cube.');
    facebook.reset();
  }

  if (activeLevel.index === 2 && !player.isInvincible() && cyberBoss.checkCollision()) {
    applyDamage('Hancur oleh Laser Cyber-Demon FB!');
  }

  beatFlash *= 0.955;
  screenShake *= 0.88;
}

function handleOrb(type) {
  // FIX 1: Green orb and other orb behaviors with proper visual feedback
  if (type === 'orb_yellow') {
    player.jump(-14.2); // Normal jump force
    VisualEffects.beatPulse(0.6); // Yellow glow
  } else if (type === 'orb_green') {
    player.jump(-16.0); // Strong jump (boost)
    VisualEffects.beatPulse(1.0); // Green glow - more intense
    screenShake = Math.max(screenShake, 4);
  } else if (type === 'orb_blue') {
    // Blue orb: flip gravity AND jump
    player.jump(-12.0);
    player.gravity *= -1;
    VisualEffects.beatPulse(0.8); // Blue glow
  } else if (type === 'orb_red') {
    player.jump(-18.0); // Very strong jump
    VisualEffects.beatPulse(0.9); // Red glow
    screenShake = Math.max(screenShake, 5);
  }
}

function handlePortal(type) {
  if (type === 'portal_ship' && player.mode !== 'ship') {
    console.log('[game] portal: entering SHIP mode');
    player.setMode('ship');
  } else if (type === 'portal_cube' && player.mode !== 'cube') {
    console.log('[game] portal: back to CUBE mode');
    player.setMode('cube');
  } else if (type === 'portal_ball' && player.mode !== 'ball') {
    console.log('[game] portal: switching to BALL mode');
    player.setMode('ball');
  } else if (type === 'portal_gravity_up' && player.gravity !== -1) {
    console.log('[game] portal: GRAVITY UP');
    player.setGravity(-1);
  } else if (type === 'portal_gravity_down' && player.gravity !== 1) {
    console.log('[game] portal: GRAVITY DOWN');
    player.setGravity(1);
  }
}

function handleLevelTransition() {
  if (!audio.songFinishedOnce()) return;

  lastProgressCpThreshold = -1;

  const nextIndex = currentLevelIndex + 1;
  
  if (nextIndex >= CONFIG.levels.length) {
    triggerLevelComplete();
    return;
  }

  const nextLevel = getLevel(nextIndex);
  gameSpeed = nextLevel.speed;
  obInterval = nextLevel.obInterval;
  
  // Update checkpoint
  checkpoint = {
    level: nextIndex,
    score: score,
    fbX: facebook.x,
    gameSpeed,
    obInterval,
    lives,
  };

  if (!shownCheckpoints.has(nextIndex)) {
    shownCheckpoints.add(nextIndex);
    screens.checkpoint();
    // FIX 3E: Camera shake on level transition
    const transitionShake = CONFIG.camera.shakeOnTransition;
    screenShake = Math.max(screenShake, transitionShake.intensity);
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
  console.log('[game] transitioned to', level.name);
}

function applyDamage(reason) {
  if (player.isInvincible()) return;

  cyberBoss?.notifyPlayerDamaged?.();

  if (lives > 0) {
    lives -= 1;
    spawnImpact(player.x + player.size / 2, player.y + player.size / 2, '#ff4488', 18);
    screenShake = Math.max(screenShake, 8);
    if (lives <= 0) {
      triggerGameOver(reason);
      return;
    }
    player.hit();
    return;
  }

  triggerGameOver(reason);
}

function triggerGameOver(reason) {
  state = 'dead';
  audio.muffleDeath();
  spawnImpact(player.x + player.size / 2, player.y + player.size / 2, '#ff3355', 42);
  
  // FIX 3E: Camera shake only on death
  const deathShake = CONFIG.camera.shakeOnDeath;
  screenShake = Math.max(screenShake, deathShake.intensity);
  
  screens.showGameOver({
    score,
    reason,
    hasCheckpoint: Boolean(checkpoint || progressCheckpoint.saved),
    hasTransitionCheckpoint: Boolean(checkpoint),
    hasProgressCheckpoint: Boolean(progressCheckpoint.saved),
  });
}

function triggerLevelComplete() {
  if (state === 'complete') return;
  state = 'complete';
  completeInfo = {
    score: Math.floor(score),
    song: audio.currentSongName(),
    started: performance.now(),
  };
  beatFlash = 1;
  screenShake = Math.max(screenShake, 6);
  audio.stop(false);
  spawnImpact(CONFIG.W / 2, CONFIG.H / 2, '#78ff38', 64);
}

function startGame({ fromCheckpoint = false, levelIndex = selectedLevel, clearCheckpoint = true } = {}) {
  audio.unlock();
  screens.hideGameOver();
  screens.hideStart();
  if (devParams.has('autostart')) screens.hideStartNow();

  if (fromCheckpoint && checkpoint) {
    clearProgressCheckpoint();
    currentLevelIndex = checkpoint.level;
    score = checkpoint.score;
    lives = checkpoint.lives;
    gameSpeed = checkpoint.gameSpeed;
    obInterval = checkpoint.obInterval;
  } else {
    if (clearCheckpoint) {
      checkpoint = null;
      shownCheckpoints = new Set();
      clearProgressCheckpoint();
    }
    currentLevelIndex = clamp(levelIndex, 0, CONFIG.levels.length - 1);
    const level = getLevel(currentLevelIndex);
    score = 0;
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
  completeInfo = null;
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
  clearProgressCheckpoint();
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
  clearProgressCheckpoint();
  startGame({ levelIndex: 0, clearCheckpoint: true });
}

function continueFromCheckpoint() {
  if (!checkpoint) return;
  clearProgressCheckpoint();
  startGame({ fromCheckpoint: true, clearCheckpoint: false });
}

function resumeFromProgressCheckpointDead() {
  if (!progressCheckpoint.saved) return;
  audio.unlock();
  resumeFromProgressCheckpoint();
}

function drawLoadingFrame() {
  if (!assets) return;
  const level = getLevel(0);
  assets.drawBackground(ctx, level, level.theme, bgScroll, 0.15, stars, shapes);
  assets.drawGround(ctx, level.theme, bgScroll, 0.15);
}

function drawScene(withEntities) {
  if (!assets || !screens || !player) return;
  const level = getLevel(currentLevelIndex);
  const theme = effectiveTheme(level);
  const shake = state === 'playing' || state === 'complete' ? screenShake : 0;

  ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
  ctx.save();
  if (shake > 0.05) {
    ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
  }

  assets.drawBackground(ctx, level, theme, bgScroll, beatFlash, stars, shapes);
  drawStageBack(ctx, stageArt, level, theme, bgScroll, beatFlash, frame);
  assets.drawGround(ctx, theme, bgScroll, beatFlash);
  drawStageFront(ctx, stageArt, level, theme, bgScroll, beatFlash, frame);

  if (withEntities || state === 'dead' || state === 'paused' || state === 'complete') {
    if (currentLevelIndex === 2) {
      cyberBoss.draw(ctx, assets, theme, player.hitbox(), beatFlash, frame);
    }
    player.drawTrail(ctx, theme);
    obstacles.draw(ctx, assets, theme, beatFlash, frame);
    facebook.draw(ctx, theme, beatFlash);
    
    // FIX 3D: Add visual beat sync - player glow enhancement
    if (beatFlash > 0.05) {
      ctx.save();
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = Math.max(0, 10 + beatFlash * 10);
      ctx.globalAlpha = 0.6 + beatFlash * 0.4;
      assets.drawPlayer(ctx, player, theme, beatFlash, frame);
      ctx.restore();
    } else {
      assets.drawPlayer(ctx, player, theme, beatFlash, frame);
    }
    
    ghost.draw(ctx);
    drawImpactParticles(ctx);
  }

  ctx.restore();

  drawLevelTransitionOverlay(ctx, level, theme);
  if (state === 'complete') drawCompleteOverlay(ctx, theme);

  if (state === 'playing' || state === 'paused' || state === 'dead' || state === 'complete') {
    hud.draw(ctx, {
      score,
      level,
      theme,
      lives,
      checkpointActive: Boolean(checkpoint),
      dangerDistance: facebook.distanceTo(player),
      beatFlash,
      songProgress: state === 'playing' || state === 'paused' || state === 'dead' || state === 'complete' ? audio.progress() : null,
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

function drawCompleteOverlay(drawCtx, theme) {
  const age = completeInfo ? (performance.now() - completeInfo.started) / 1000 : 0;
  const alpha = clamp(age / 0.35, 0, 1);

  drawCtx.save();
  drawCtx.globalAlpha = alpha;
  drawCtx.fillStyle = 'rgba(0,0,0,0.48)';
  drawCtx.fillRect(0, 0, CONFIG.W, CONFIG.H);

  drawCtx.textAlign = 'center';
  drawCtx.textBaseline = 'middle';
  drawCtx.shadowColor = '#78ff38';
  drawCtx.shadowBlur = CONFIG.performance.lowFx ? 8 : 24;
  drawCtx.fillStyle = '#8dff3d';
  drawCtx.font = '46px Pusab, Impact, Arial Black, sans-serif';
  drawCtx.fillText('LEVEL COMPLETE!', CONFIG.W / 2, 158);

  drawCtx.shadowColor = theme.primary;
  drawCtx.shadowBlur = CONFIG.performance.lowFx ? 5 : 14;
  drawCtx.fillStyle = '#ffffff';
  drawCtx.font = '20px Pusab, Impact, Arial Black, sans-serif';
  drawCtx.fillText(`SCORE ${completeInfo?.score ?? Math.floor(score)}`, CONFIG.W / 2, 214);
  drawCtx.font = '15px Pusab, Impact, Arial Black, sans-serif';
  drawCtx.fillText('ENTER / TAP UNTUK MENU', CONFIG.W / 2, 258);

  drawCtx.fillStyle = '#78ff38';
  for (let i = 0; i < 3; i++) {
    drawCtx.beginPath();
    drawCtx.arc(CONFIG.W / 2 - 58 + i * 58, 306, 18 + Math.sin(age * 5 + i) * 2, 0, Math.PI * 2);
    drawCtx.fill();
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
  const blur = getPerfConfig().shadowBlur ? 14 : 0;
  for (const p of impactParticles) {
    drawCtx.save();
    drawCtx.globalAlpha = Math.max(0, p.life);
    drawCtx.fillStyle = p.color;
    drawCtx.shadowColor = p.color;
    drawCtx.shadowBlur = blur;
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
  document.getElementById('continueCheckpointButton').addEventListener('click', () => {
    if (progressCheckpoint.saved) resumeFromProgressCheckpointDead();
    else continueFromCheckpoint();
  });

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
    if (state === 'dead') {
      if (progressCheckpoint.saved) resumeFromProgressCheckpointDead();
      else startGame({ fromCheckpoint: Boolean(checkpoint), clearCheckpoint: false });
    }
    else if (state === 'complete') returnToMenu();
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
  else if (state === 'dead') {
    if (progressCheckpoint.saved) resumeFromProgressCheckpointDead();
    else startGame({ fromCheckpoint: Boolean(checkpoint), clearCheckpoint: false });
  }
  else if (state === 'complete') returnToMenu();
}

function setStartPreviewLevel(levelIndex) {
  selectedLevel = clamp(levelIndex, 0, CONFIG.levels.length - 1);
  if (state !== 'start' && state !== 'loading') return;

  currentLevelIndex = selectedLevel;
  const level = getLevel(currentLevelIndex);
  score = 0;
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
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  syncCanvasLayout(canvas);

  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.position = '';
  canvas.style.left = '';
  canvas.style.top = '';

  const wrap = document.getElementById('gameWrap');
  if (wrap) {
    wrap.style.width = '100vw';
    wrap.style.height = '100vh';
  }

  if (assets) {
    stars = createStars();
    shapes = createShapes();
    stageArt = createStageArt();
  }
  hud?.repositionPauseButton?.();
}
