export const CONFIG = {
  W: 800,
  H: 450,
  GROUND_Y: 384,
  SCALE_MAX: 1.8,
  SCORE_PER_FRAME: 1,

  player: {
    x: 140,
    size: 36,
    gravity: 0.74,
    jumpForce: -16.5,
    coyoteFrames: 0,
    trailLifeStep: 0.075,
    invincibleFrames: 90,
    hitboxInset: 6,
  },

  facebook: {
    x: -72,
    w: 46,
    h: 46,
    targetGap: 210,
    angryDistance: 170,
    maxPressure: 46,
  },

  performance: {
    stars: 20,
    shapes: 4,
    sparks: 16,
    starterSparks: 12,
    normalSparks: 14,
    bossSparks: 18,
    bossShards: 8,
    caveTeeth: 10,
    lowFx: true,
  },

  gameplay: {
    startLives: 5,
    oneHitKill: false,
    /** true = gambar ikon cube vektor (mirip GD, stabil). false = bitmap dari atlas (butuh koordinat benar). */
    useVectorCubeIcon: true,
  },

  heart: {
    spawnMin: 400,
    spawnMax: 700,
    size: 28,
    hitbox: 24,
    minY: 204,
    maxY: 324,
  },

  audio: {
    fallbackBpm: 140,
    volume: 0.55,
    minBeatIntervalMs: 250,
    analyserIntervalMs: 33,
    sfxVolume: 0.72,
    bossCheckpointSfx: [
      {
        name: 'warningAlarm',
        file: 'geometry-dash-assets/warning-alarm-not-loud.mp3',
        gain: 0.80,
        delay: 0,
      },
      {
        name: 'incomingTears',
        file: 'geometry-dash-assets/incoming-tears.mp3',
        gain: 0.72,
        delay: 0.18,
      },
    ],
  },

  ghost: {
    intervalMin: 300,
    intervalMax: 700,
    fadeSpeed: 0.018,
    holdDuration: 160,
    maxAlpha: 0.82,
    bobAmplitude: 6,
    messages: [
      ['ngapain ngoding,', 'mending scroll fesnuk 😹😹'],
      ['deadline besok?', 'ya scroll aja dulu 😌'],
      ['bug belum kelar?', 'fesnuk dulu 5 menit 🙃'],
      ['ngoding dari tadi,', 'istirahat fesnuk yuk 😴'],
      ['error mulu,', 'udah buka fesnuk aja ngab 💀'],
    ],
  },

  camera: {
    shakeOnDeath: { intensity: 12, decay: 0.8 },
    shakeOnTransition: { intensity: 8, decay: 0.9 },
    shakeOnBassDrop: { intensity: 2, duration: 3 },
  },

  parallax: {
    // FIX 3E: Parallax layers for depth effect
    layer0: { speedMultiplier: 0.2, name: 'far' },     // Jauh: scroll 0.2× gameSpeed
    layer1: { speedMultiplier: 0.5, name: 'mid' },     // Tengah: scroll 0.5× gameSpeed
    layer2: { speedMultiplier: 1.0, name: 'near' },    // Dekat: scroll 1.0× gameSpeed (ground deco)
  },

  levels: [
    {
      index: 0,
      label: 'LEVEL 1',
      name: 'EASY',
      diff: 'EASY',
      speed: 5.5,
      bpm: 140,
      obInterval: 90,
      obMin: 54,
      musicIndex: 0,
      theme: {
        bg0: '#050d28',
        bg1: '#091640',
        bg2: '#060e2a',
        primary: '#00d4ff',
        accent: '#0088ff',
        gnd0: '#0d2045',
        gnd1: '#07112a',
        line: '#00d4ff',
        obC: '#00ccff',
        obC2: '#0055cc',
        fbC: '#4267B2',
      },
    },
    {
      index: 1,
      label: 'LEVEL 2',
      name: 'NORMAL',
      diff: 'NORMAL',
      speed: 6.5,
      bpm: 145,
      obInterval: 75,
      obMin: 44,
      musicIndex: 1,
      theme: {
        bg0: '#1a0900',
        bg1: '#2a1200',
        bg2: '#1e0c00',
        primary: '#ffaa00',
        accent: '#ff6600',
        gnd0: '#361400',
        gnd1: '#1c0900',
        line: '#ffaa00',
        obC: '#ffaa00',
        obC2: '#ff4400',
        fbC: '#cc3300',
      },
    },
    {
      index: 2,
      label: 'LEVEL 3',
      name: 'BOSS',
      diff: 'BOSS',
      speed: 8.4,
      bpm: 200,
      obInterval: 56,
      obMin: 32,
      musicIndex: 2,
      theme: {
        bg0: '#100008',
        bg1: '#1a000e',
        bg2: '#120008',
        primary: '#ff2288',
        accent: '#ffffff',
        gnd0: '#2a0012',
        gnd1: '#160008',
        line: '#ff2288',
        obC: '#ff2288',
        obC2: '#aa0055',
        fbC: '#880033',
      },
    },
  ],
};

/** Sesuaikan resolusi logika dengan pixel buffer canvas (FIX 2). */
export function syncCanvasLayout(canvas) {
  if (!canvas || !canvas.width) return;
  CONFIG.W = canvas.width;
  CONFIG.H = canvas.height;
  CONFIG.GROUND_Y = canvas.height - Math.round(canvas.height * 0.145);
  CONFIG.player.x = Math.round(canvas.width * 0.175);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function getLevel(index) {
  return CONFIG.levels[clamp(index, 0, CONFIG.levels.length - 1)];
}

export function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Collision detection: Rectangle vs Ellipse
// Used for player (rect) hitting portals (ellipse)
export function intersectsEllipse(rectHitbox, ellipseObs) {
  const ellipseCenterX = ellipseObs.x + ellipseObs.w / 2;
  const ellipseCenterY = ellipseObs.y + ellipseObs.h / 2;
  const ellipseRadiusX = ellipseObs.w / 2;
  const ellipseRadiusY = ellipseObs.h / 2;

  // Find the closest point on the rectangle to the ellipse center
  let closestX = Math.max(rectHitbox.x, Math.min(ellipseCenterX, rectHitbox.x + rectHitbox.w));
  let closestY = Math.max(rectHitbox.y, Math.min(ellipseCenterY, rectHitbox.y + rectHitbox.h));

  // Calculate distance between closest point and ellipse center
  const dx = ellipseCenterX - closestX;
  const dy = ellipseCenterY - closestY;

  // Normalize to ellipse space and check if distance <= 1 (inside ellipse)
  const distSquared = (dx / ellipseRadiusX) ** 2 + (dy / ellipseRadiusY) ** 2;
  return distSquared <= 1;
}

