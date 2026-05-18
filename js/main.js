import { CONFIG, clamp, getLevel, intersects, syncCanvasLayout } from './config.js';
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
let totalDeaths = 0;
let lives = CONFIG.gameplay.startLives;
let gameSpeed = getLevel(0).speed;
let obInterval = getLevel(0).obInterval;
let checkpoint = null;
let shownCheckpoints = new Set();
let isJumpHeld = false;
let jumpBufferTimer = 0;
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

// --- Initialization ---
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Initialize core objects immediately (synchronously)
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

// Start the loop only after objects exist to prevent ReferenceErrors
requestAnimationFrame(loop);
bindUI();

bootstrap().catch((err) => {
  console.error('[FATAL] Bootstrap failed:', err);
  const loadingText = document.getElementById('loadingText');
  if (loadingText) loadingText.textContent = 'Gagal memuat game! Cek Console (F12).';
});

async function bootstrap() {
  console.log('[bootstrap] starting...');
  try {
    screens.setTheme(getLevel(0).theme);
    drawLoadingFrame();

    // Add a fail-safe timeout to preload (60 seconds)
    const preloadPromise = Promise.all([
      assets.preload((progress) => {
        assetProgress = progress;
        updateProgress();
      }),
      audio.preload((progress) => {
        audioProgress = progress;
        updateProgress();
      }),
    ]);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Preload timeout')), 60000)
    );

    await Promise.race([preloadPromise, timeoutPromise]);
    console.log('[bootstrap] preload finished');
  } catch (err) {
    console.error('[bootstrap] initialization error or timeout:', err);
    // Continue anyway to avoid being stuck at 0%
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

window.startGame = () => {
  if (state === 'start') startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
};

function updateProgress() {
  const pct = Math.round((assetProgress * 0.72 + audioProgress * 0.28) * 100);
  if (screens && typeof screens.showLoading === 'function') {
    screens.showLoading(pct / 100);
  }
}

function getMusicEntryForLevel(levelIndex) {
  const list = window.MUSIC_LIST || [];
  const lv = getLevel(levelIndex);
  const idx = lv.musicIndex ?? levelIndex;
  return list[Math.min(idx, list.length - 1)] || null;
}

function checkAndSaveCheckpoint() {
  // Hanya simpan checkpoint di Level 1 (index 0). 
  if (currentLevelIndex !== 0) return;

  const ml = getMusicEntryForLevel(currentLevelIndex);
  const levelStart = 0;
  const levelEnd = !ml || ml.scoreEnd == null || ml.scoreEnd === Infinity ? 900 : ml.scoreEnd;
  const span = Math.max(1, levelEnd - levelStart);
  const audioProgressVal = typeof audio?.progress === 'function' ? audio.progress() : 0;
  const scoreProgress = Math.min(Math.max((score - levelStart) / span, 0), 1);
  const progress = Math.min(Math.max(audioProgressVal || scoreProgress, scoreProgress), 1);

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
  try {
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
  } catch (e) {
    console.error('[loop] error:', e);
  }

  requestAnimationFrame(loop);
}

function updatePlaying(dt) {
  const level = getLevel(currentLevelIndex);
  let beatHit = false;
  try {
    beatHit = Boolean(audio.detectBeat(level.bpm));
  } catch (e) {
    console.warn('[Audio] detectBeat error:', e);
  }
  if (beatHit) {
    beatFlash = 1;
    screenShake = Math.max(screenShake, 3.5);
  }
  const audioTime = audio.currentTime();

  score += CONFIG.SCORE_PER_FRAME;
  checkAndSaveCheckpoint();
  handleLevelTransition();

  const activeLevel = getLevel(currentLevelIndex);
  const baseSpeed = activeLevel.speed;
  const speedBoostStages = Math.floor(score / 300);
  const speedIncrementPerStage = 0.3;
  gameSpeed = Math.min(baseSpeed + speedBoostStages * speedIncrementPerStage, baseSpeed + 3.0);
  obInterval = activeLevel.obInterval;
  bgScroll += gameSpeed * dt;

  const collected = obstacles.update(dt, activeLevel, gameSpeed, obInterval, player.hitbox(), frame, {
    spawnObstacles: true,
    audioTime: audioTime,
    playerGravity: player.gravity,
  });
  if (collected > 0) {
    lives += collected;
    screenShake = Math.max(screenShake, 2.2);
  }

  if (CONFIG.gameplay.facebookChaserEnabled) {
    facebook.update(player, gameSpeed, audioTime * 60, frame);
  }

  if (activeLevel.index === 2) {
    cyberBoss.update(dt, audioTime, beatFlash, player.hitbox(), audio.progress());
    
    // Player bullets hit boss
    const bossHitbox = {
      x: cyberBoss.x - 128 * cyberBoss.scale,
      y: cyberBoss.y - 136 * cyberBoss.scale,
      w: 256 * cyberBoss.scale,
      h: 272 * cyberBoss.scale,
    };
    for (const b of player.bullets) {
      const bulletHitbox = {
        x: b.x - b.size / 2,
        y: b.y - b.size / 2,
        w: b.size,
        h: b.size,
      };
      if (!b.hit && intersects(bulletHitbox, bossHitbox)) {
        b.hit = true;
        b.life = 0;
        cyberBoss.takeHit();
        spawnImpact(b.x, b.y, '#ffffff', 8);
      }
    }

    const shake = cyberBoss.takeShake();
    if (shake > 0) {
      screenShake = Math.max(screenShake, shake);
      // If the shake is high, it's likely a laser fire event
      if (shake >= 10) VisualEffects.triggerInvert(0.5);
    }
  }
  ghost.update(dt, frame);
  VisualEffects.update(dt);
  updateImpactParticles(dt);

  let solidFloorY = CONFIG.GROUND_Y;
  let solidCeilingY = 0; 

  for (const obs of obstacles.obstacles) {
    if (obs.inactive || obs.type.startsWith('portal_') || obs.type.startsWith('orb_') || obs.type === 'spike') continue;
    if (!obs.solid && obs.type !== 'trampoline' && obs.type !== 'triangle_step') continue;
    
    if (player.x + player.size > obs.x && player.x < obs.x + obs.w) {
      if (obs.type === 'trampoline') {
        if (player.gravity === 1 && player.y + player.size <= obs.y + 14 && player.vy >= 0) {
          solidFloorY = Math.min(solidFloorY, obs.y);
        }
      } else if (obs.type === 'triangle_step' || obs.type.startsWith('slope_')) {
        const progress = Math.max(0, Math.min(1, (player.x + player.size - obs.x) / obs.w));
        let stepY;
        if (obs.direction === 'up' || obs.type === 'slope_up') {
          stepY = obs.y + obs.h - (progress * obs.h);
        } else {
          stepY = obs.y + (progress * obs.h);
        }
        if (player.gravity === 1 && player.y + player.size <= stepY + 26 && player.vy >= 0) {
          solidFloorY = Math.min(solidFloorY, stepY);
        }
      } else {
        if (player.gravity === 1 && player.y + player.size <= obs.y + 24 && player.vy >= 0) {
          solidFloorY = Math.min(solidFloorY, obs.y);
        } else if (player.gravity === -1 && player.y >= obs.y + obs.h - 24 && player.vy <= 0) {
          solidCeilingY = Math.max(solidCeilingY, obs.y + obs.h);
        }
      }
    }
  }

  const wantsToJump = isJumpHeld || jumpBufferTimer > 0;
  if (jumpBufferTimer > 0) {
    jumpBufferTimer -= dt * 16.666;
  }

  const oldVy = player.vy;
  player.update(wantsToJump, solidFloorY, solidCeilingY, dt, {
    autoFire: activeLevel.index === 2,
    targetBossX: cyberBoss.x,
    targetBossY: cyberBoss.y
  });
  const jumped = (player.gravity === 1 && player.vy < 0 && (oldVy >= 0 || player.justLanded)) ||
                 (player.gravity === -1 && player.vy > 0 && (oldVy <= 0 || player.justLanded));

  if (wantsToJump && jumped) {
    if (!player.wasOnGround && !player.onGround && !player.onCeiling && player.coyote <= 0 && player.mode !== 'ship') {
       // already jumping
    } else {
        jumpBufferTimer = 0; 
    }
  }

  const hitObs = obstacles.collidesWithPlayer(player.hitbox());
  if (hitObs) {
    if (hitObs.type === 'utility') {
      const obs = hitObs.obs;
      if (!utilityCollisionLock) {
        if (obs.type.startsWith('portal_')) {
          const nowP = performance.now();
          if (nowP - (obs.lastTriggered || 0) >= 1000) {
            obs.lastTriggered = nowP;
            utilityCollisionLock = true;
            handlePortal(obs.type);
            obs.inactive = true;
            setTimeout(() => (utilityCollisionLock = false), 300);
          }
        } else if (obs.type.startsWith('orb_')) {
          if (isJumpHeld) {
            utilityCollisionLock = true;
            handleOrb(obs.type);
            obs.inactive = true;
            screenShake = Math.max(screenShake, 3);
            beatFlash = 1;
            setTimeout(() => (utilityCollisionLock = false), 300);
          } else {
            obs.primed = true;
          }
        }
      }
    } else if (hitObs.type === 'springpad') {
      player.vy = -hitObs.obs.springPower;
      screenShake = Math.max(screenShake, 2);
      beatFlash = 0.6;
    } else if (hitObs.type === 'secret_coin') {
      hitObs.obs.inactive = true;
      score += 500; // Bonus score
      audio.playBossCheckpointCue(); // Use as placeholder for collection sound
      VisualEffects.checkpointPulse();
    } else if (hitObs.type === 'lethal' && !player.isInvincible()) {
      applyDamage('Kena rintangan neon.');
    }
  } else if (CONFIG.gameplay.facebookChaserEnabled && !player.isInvincible() && facebook.caught(player)) {
    applyDamage('Logo Fesnuk berhasil nyentuh cube.');
    facebook.reset();
  }

  if (activeLevel.index === 2 && !player.isInvincible() && cyberBoss.checkCollision()) {
    applyDamage('Hancur oleh Laser Cyber-Demon FB!');
  }

  beatFlash *= 0.955;
  screenShake *= 0.88;
}

function handleOrb(type) {
  // Disable all JUMP orbs (Yellow, Green, Red) for Boss Level as requested
  // Only Blue Orb (Gravity Switch) remains functional
  if (currentLevelIndex === 2 && (type === 'orb_yellow' || type === 'orb_green' || type === 'orb_red')) {
    return;
  }

  if (type === 'orb_yellow') {
    player.jump(-14.2);
    VisualEffects.beatPulse(0.6);
  } else if (type === 'orb_green') {
    player.jump(-16.0);
    VisualEffects.beatPulse(1.0);
    screenShake = Math.max(screenShake, 4);
  } else if (type === 'orb_blue') {
    player.jump(-12.0);
    player.gravity *= -1;
    VisualEffects.beatPulse(0.8);
  } else if (type === 'orb_red') {
    player.jump(-18.0);
    VisualEffects.beatPulse(0.9);
    screenShake = Math.max(screenShake, 5);
  }
}

function handlePortal(type) {
  if (type.includes('ship') && player.mode !== 'ship') player.setMode('ship');
  else if (type.includes('cube') && player.mode !== 'cube') player.setMode('cube');
  else if (type.includes('ball') && player.mode !== 'ball') player.setMode('ball');
  else if (type.includes('gravity_up') && player.gravity !== -1) player.setGravity(-1);
  else if (type.includes('gravity_down') && player.gravity !== 1) player.setGravity(1);
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

  checkpoint = {
    level: nextIndex,
    score: score,
    lives,
    gameSpeed,
    obInterval,
    audioTime: 0
  };

  if (!shownCheckpoints.has(nextIndex)) {
    shownCheckpoints.add(nextIndex);
    if (nextIndex !== 1 && nextIndex !== 2) {
      screens.checkpoint();
    }
    screenShake = Math.max(screenShake, CONFIG.camera.shakeOnTransition.intensity);
  }

  const previousTheme = getLevel(currentLevelIndex).theme;
  currentLevelIndex = nextIndex;
  const level = getLevel(currentLevelIndex);

  if (level.name === 'BOSS') {
    audio.playBossCheckpointCue();
    obstacles.mirrorMode = true;
  } else if (level.index >= 1) {
    obstacles.mirrorMode = true;
  } else {
    obstacles.mirrorMode = false;
  }

  transition = { from: previousTheme, to: level.theme, started: performance.now(), duration: 2500 };
  levelTransitionFx = { label: level.label, name: level.name, started: performance.now(), duration: 2500 };
  screens.setTheme(level.theme);
  obstacles.reset();
  ghost.reset();
  cyberBoss.reset();
  audio.playLevel(currentLevelIndex, 0);
}

function applyDamage(reason) {
  if (player.isInvincible() || godMode) return;
  audio.playHitSfx();
  totalDeaths++;
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
  screenShake = Math.max(screenShake, CONFIG.camera.shakeOnDeath.intensity);

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
  
  if (getLevel(currentLevelIndex).name === 'BOSS') {
    cyberBoss.triggerExplosion();
    audio.playBossCheckpointCue();
    VisualEffects.shake(20, 0.8);
    VisualEffects.triggerInvert(0.4);
  }

  completeInfo = { 
    score: Math.floor(score), 
    song: audio.currentSongName(), 
    deaths: totalDeaths,
    levelName: getLevel(currentLevelIndex).name,
    started: performance.now() 
  };
  beatFlash = 1;
  screenShake = Math.max(screenShake, 6);
  audio.stop(false);
  spawnImpact(CONFIG.W / 2, CONFIG.H / 2, '#78ff38', 64);
}

function startGame({ fromCheckpoint = false, levelIndex = selectedLevel, clearCheckpoint = true } = {}) {
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
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
    const lv = getLevel(currentLevelIndex);
    score = 0;
    totalDeaths = 0;
    lives = CONFIG.gameplay.startLives;
    gameSpeed = lv.speed;
    obInterval = lv.obInterval;
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
  if (currentLevelIndex >= 1) obstacles.mirrorMode = true;
  ghost.reset();
  cyberBoss.reset();
  audio.playLevel(currentLevelIndex, fromCheckpoint ? (checkpoint?.audioTime || 0) : 0);
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  audio.pause();
  screens.showPause({ score, song: audio.currentSongName(), muted: audio.muted });
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
  setStartPreviewLevel(currentLevelIndex);
  screens.hideGameOver();
  screens.hidePause(() => {
    screens.showStart(selectedLevel, assets.logo);
  });
  bgScroll = 0;
}

function spawnImpact(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    impactParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      color,
    });
  }
}

function updateImpactParticles(dt) {
  for (const p of impactParticles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= 0.03 * dt;
  }
  impactParticles = impactParticles.filter((p) => p.life > 0);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function drawScene(drawHud) {
  let theme = getLevel(currentLevelIndex).theme;
  let transitionFlash = 0;
  if (transition) {
    const elapsed = performance.now() - transition.started;
    const rawP = Math.min(1, elapsed / transition.duration);
    const p = easeInOutCubic(rawP);
    theme = blendThemes(transition.from, transition.to, p);
    transitionFlash = Math.sin(rawP * Math.PI) * 0.18;
    if (rawP >= 1) transition = null;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
  ctx.fillStyle = theme.bg0 || '#02040a';
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

  let shakeX = 0, shakeY = 0;
  if (screenShake > 0.1 && !godMode) {
    // Balanced shake around the center
    shakeX = (Math.random() - 0.5) * Math.min(screenShake, 15) * 1.5;
    shakeY = (Math.random() - 0.5) * Math.min(screenShake, 15) * 1.5;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Overscan sedikit supaya tepi canvas tidak bolong saat camera shake.
  ctx.save();
  ctx.fillStyle = theme.bg0 || '#02040a';
  ctx.fillRect(-32, -32, CONFIG.W + 64, CONFIG.H + 64);
  ctx.restore();

  drawStageBack(ctx, stageArt, getLevel(currentLevelIndex), theme, bgScroll, beatFlash, frame);
  VisualEffects.drawGrid(ctx, theme, bgScroll, beatFlash, getLevel(currentLevelIndex).name);
  if (activeStars()) drawStars(theme);
  if (activeShapes()) drawShapes(theme);

  if (state !== 'start') {
    if (activeBoss()) cyberBoss.draw(ctx, assets, theme, player.hitbox(), beatFlash, frame);
    ghost.draw(ctx, theme, player);
    obstacles.draw(ctx, theme, beatFlash, assets);
    if (CONFIG.gameplay.facebookChaserEnabled) facebook.draw(ctx, theme, beatFlash, assets);
  }

  VisualEffects.drawGroundGlow(ctx, theme, beatFlash);
  drawStageFront(ctx, stageArt, getLevel(currentLevelIndex), theme, bgScroll, beatFlash, frame);

  if (levelTransitionFx) {
    const elapsed = performance.now() - levelTransitionFx.started;
    const p = elapsed / levelTransitionFx.duration;
    if (p < 1) {
      const yOff = p < 0.2 ? -50 * (1 - p / 0.2) : p > 0.8 ? 50 * ((p - 0.8) / 0.2) : 0;
      const alpha = p < 0.2 ? p / 0.2 : p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(levelTransitionFx.label, CONFIG.W / 2, CONFIG.H / 2 - 20 + yOff);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = theme.primary;
      ctx.globalAlpha = alpha;
      ctx.fillText(levelTransitionFx.name, CONFIG.W / 2, CONFIG.H / 2 + 20 + yOff);
      ctx.globalAlpha = 1;
    } else {
      levelTransitionFx = null;
    }
  }

  if (state !== 'start') {
    player.drawTrail(ctx, theme);
    player.drawBullets(ctx, theme);
    assets.drawPlayer(ctx, player, theme, beatFlash);
  }

  ctx.globalAlpha = 1;
  for (const p of impactParticles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  if (activeBoss() && state !== 'complete') {
    cyberBoss.drawMemeOverlay(ctx, assets);
  }

  // Overlay layar penuh tidak ikut camera shake.
  if (transitionFlash > 0.01) {
    ctx.save();
    ctx.globalAlpha = transitionFlash;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    ctx.restore();
  }

  if (state === 'complete' && completeInfo) {
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    if (completeInfo.levelName === 'BOSS') {
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = '#ff3333';
      ctx.fillText('KAMU BERHASIL MENAMATKAN', CONFIG.W / 2, CONFIG.H / 2 - 80);
      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('RAJA IBLIS FESNUK!', CONFIG.W / 2, CONFIG.H / 2 - 35);
    } else {
      ctx.font = 'bold 54px Arial';
      ctx.fillText('LEVEL CLEARED', CONFIG.W / 2, CONFIG.H / 2 - 40);
    }

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = theme.primary;
    ctx.fillText(`Final Score: ${completeInfo.score}`, CONFIG.W / 2, CONFIG.H / 2 + 25);

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#ff6666';
    ctx.fillText(`Total Deaths: ${completeInfo.deaths}`, CONFIG.W / 2, CONFIG.H / 2 + 60);

    ctx.fillStyle = '#aaa';
    ctx.font = '16px Arial';
    ctx.fillText('Click anywhere to Return to Menu', CONFIG.W / 2, CONFIG.H / 2 + 100);
  }

  // Apply final visual overlays (invert glitch, beat pulse, etc.)
  VisualEffects.draw(ctx, getLevel(currentLevelIndex).name.toLowerCase(), 1000);

  // HUD digambar paling akhir dan tetap terhadap viewport, bukan world/camera.
  if (drawHud && state !== 'complete') {
    const dangerDist = CONFIG.gameplay.facebookChaserEnabled ? (player.x - facebook.x) : 1000;
    hud.draw(ctx, {
      score,
      level: getLevel(currentLevelIndex),
      theme,
      lives,
      dangerDistance: dangerDist,
      beatFlash,
      songProgress: audio.progress(),
      godMode: godMode
    });
  }
}

function drawLoadingFrame() {
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
  ctx.save();
  ctx.globalAlpha = 0.1;
  VisualEffects.drawGrid(ctx, { line: '#00d4ff' }, bgScroll, 0, 'LOADING');
  ctx.restore();
}

function activeStars() {
  const perf = getPerfConfig();
  return perf.stars > 0 && state !== 'start' && getLevel(currentLevelIndex).name !== 'BOSS';
}

function activeShapes() {
  const perf = getPerfConfig();
  return perf.shapes > 0 && state !== 'start';
}

function activeBoss() {
  return state !== 'start' && getLevel(currentLevelIndex).name === 'BOSS';
}

function drawStars(theme) {
  if (!stars) return;
  const count = Math.min(getPerfConfig().stars, stars.length);
  ctx.fillStyle = theme.accent;
  for (let i = 0; i < count; i++) {
    const s = stars[i];
    s.x -= s.speed * (gameSpeed * 0.4);
    if (s.x < 0) {
      s.x = CONFIG.W;
      s.y = Math.random() * (CONFIG.H * 0.6);
    }
    const alpha = 0.3 + Math.sin(frame * 0.05 + s.id) * 0.2;
    ctx.globalAlpha = alpha;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
}

function drawShapes(theme) {
  if (!shapes) return;
  const count = Math.min(getPerfConfig().shapes, shapes.length);
  const cloudImg = assets.get('decor_cloud');
  
  for (let i = 0; i < count; i++) {
    const sh = shapes[i];
    sh.x -= sh.speed * (gameSpeed * 0.5);
    if (sh.x < -120) {
      sh.x = CONFIG.W + 120;
      sh.y = 42 + Math.random() * (CONFIG.GROUND_Y * 0.35);
    }

    const bob = Math.sin(frame * 0.02 + sh.phase) * 5;
    const x = sh.x;
    const y = sh.y + bob;
    const s = sh.size * 1.5; // Make clouds a bit bigger

    ctx.save();
    ctx.globalAlpha = 0.45;
    if (cloudImg) {
      // Draw actual cloud image instead of vector shapes
      ctx.drawImage(cloudImg, x - s/2, y - s/2, s, s * 0.6);
    } else {
      // Fallback to cleaner simple circle if image not loaded
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function resizeCanvas() {
  const wrap = document.getElementById('gameWrap');
  if (!wrap) return;
  canvas.width = 800;
  canvas.height = 450;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.position = 'absolute';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.transform = 'none';
  syncCanvasLayout(canvas);
}

function setStartPreviewLevel(idx) {
  selectedLevel = clamp(idx, 0, CONFIG.levels.length - 1);
  screens.updateLevelButtons(selectedLevel);
  const lv = getLevel(selectedLevel);
  screens.setTheme(lv.theme);
  gameSpeed = lv.speed;
}

let godMode = false;
let cheatBuffer = '';

function bindUI() {
  document.getElementById('startButton')?.addEventListener('click', () => {
    audio.unlock();
    startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
  });

  const levelBtns = document.querySelectorAll('.level-choice');
  levelBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const lvl = Number(e.currentTarget.dataset.level);
      setStartPreviewLevel(lvl);
    });
  });

  document.getElementById('resumeButton')?.addEventListener('click', resumeGame);
  document.getElementById('pauseRestartButton')?.addEventListener('click', () => {
    resumeGame();
    startGame({ levelIndex: currentLevelIndex, clearCheckpoint: true });
  });
  document.getElementById('menuButton')?.addEventListener('click', returnToMenu);
  document.getElementById('muteButton')?.addEventListener('click', () => {
    const isMuted = audio.toggleMuted();
    screens.showPause({ score, song: audio.currentSongName(), muted: isMuted });
  });

  document.getElementById('continueCheckpointButton')?.addEventListener('click', () => {
    if (progressCheckpoint.saved) {
      resumeFromProgressCheckpoint();
    } else if (checkpoint) {
      startGame({ fromCheckpoint: true });
    }
  });

  document.getElementById('restartButton')?.addEventListener('click', () => {
    startGame({ levelIndex: currentLevelIndex, clearCheckpoint: true });
  });

  window.addEventListener('keydown', (e) => {
    // Secret Cheat: type 'moonchi'
    cheatBuffer = (cheatBuffer + e.key.toLowerCase()).slice(-7);
    if (cheatBuffer === 'moonchi') {
      godMode = !godMode;
      cheatBuffer = '';
      console.log('%c [CHEAT] GOD MODE: ' + (godMode ? 'ON' : 'OFF'), 'color: #ff00ff; font-weight: bold;');
      if (godMode) {
        VisualEffects.checkpointPulse(); 
      } else {
        VisualEffects.triggerInvert(0.2); // Feedback for OFF
      }
    }

    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (state === 'start' && e.code === 'Space') {
        startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
        return;
      }
      isJumpHeld = true;
      jumpBufferTimer = 150;
      e.preventDefault();
    } else if (e.code === 'Escape') {
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
    } else if (e.code === 'Enter') {
      if (state === 'start') {
        startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
      } else if (state === 'dead' && (checkpoint || progressCheckpoint.saved)) {
        if (progressCheckpoint.saved) resumeFromProgressCheckpoint();
        else startGame({ fromCheckpoint: true });
      } else if (state === 'dead') {
        startGame({ levelIndex: currentLevelIndex, clearCheckpoint: true });
      } else if (state === 'complete') {
        returnToMenu();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      isJumpHeld = false;
      e.preventDefault();
    }
  });

  function handlePointerDown(e, clientX, clientY) {
    if (state === 'playing') {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      if (hud.hitPauseButton(x, y)) {
        pauseGame();
        return;
      }
    }
    if (state === 'start') {
      startGame({ levelIndex: selectedLevel, clearCheckpoint: true });
      return;
    }
    if (state === 'complete') {
      returnToMenu();
      return;
    }
    isJumpHeld = true;
    jumpBufferTimer = 150;
    if (e.cancelable) e.preventDefault();
  }

  canvas.addEventListener('touchstart', (e) => {
    handlePointerDown(e, e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    isJumpHeld = false;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    handlePointerDown(e, e.clientX, e.clientY);
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) isJumpHeld = false;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') {
      pauseGame();
    }
  });
}
