export const CONFIG = {
  W: 800,
  H: 450,
  GROUND_Y: 384,
  SCALE_MAX: 1.8,
  SCORE_PER_FRAME: 1,

  player: {
    x: 140,
    size: 36,
    gravity: 0.85,
    jumpForce: -14.8,
    coyoteFrames: 4,
    trailLifeStep: 0.075,
    invincibleFrames: 90,
    hitboxInset: 6,
  },

  facebook: {
    x: -120,
    w: 110,
    h: 110,
    targetGap: 280,
    angryDistance: 200,
    maxPressure: 50,
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
    startLives: 10,
    oneHitKill: false,
    useVectorCubeIcon: false,
    /** Enable FB chaser */
    facebookChaserEnabled: true,
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
    hitSfx: 'assets/audio/sfx/hit.ogg',
    bossCheckpointSfx: [
      {
        name: 'warningAlarm',
        file: 'assets/audio/sfx/hit.ogg',
        gain: 0.80,
        delay: 0,
      },
      {
        name: 'incomingTears',
        file: 'assets/audio/sfx/hit.ogg',
        gain: 0.72,
        delay: 0.18,
      },
    ],
  },

  overlayMemes: [
    'overlay-action-consequences-editor.png', 'overlay-baca-buku-scroll-10-jam.png',
    'overlay-besok-kita-ngedit.png', 'overlay-fokus-coding-scroll-fesnuk.png',
    'overlay-harga-ide-editing.png', 'overlay-ide-masuk-penjara.png',
    'overlay-i-hate-ngoding.png', 'overlay-js-atau-php.png',
    'overlay-komentar-ai-mecut.png', 'overlay-korban-kriminalisasi-jaksa.png',
    'overlay-laptop-coding-konteks.png', 'overlay-level-kecanduan-facebook.png',
    'overlay-lowongan-scroll-fesnuk.png', 'overlay-mending-scroll-fesnuk.png',
    'overlay-ngoding-pay-to-win.png', 'overlay-obat-malas-coding.png',
    'overlay-penulis-pemed-fb-terus.png', 'overlay-penyakit-facebook.png',
    'overlay-rust-10-jam-vibe-coder.png', 'overlay-scroll-bentar-ah.png',
    'overlay-skripsi-frieren.png', 'overlay-sql-select-fesnuk.png',
    'overlay-token-habis-llm.png', 'overlay-web-desa-kumparan.png',
    'overlay-website-100rb.png', 'overlay-whatsapp-vscode-panda.png',
    'overlay-perusahaan-pake-xyz.png', 'overlay-sabung-js-php.png',
    'overlays-pecut-ai.png'
  ],

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
    layer0: { speedMultiplier: 0.2, name: 'far' },
    layer1: { speedMultiplier: 0.5, name: 'mid' },
    layer2: { speedMultiplier: 1.0, name: 'near' },
  },

  levels: [
    {
      index: 0,
      label: 'LEVEL 1',
      name: 'EASY',
      diff: 'EASY',
      speed: 5.0,
      bpm: 170,
      obInterval: 70,
      obMin: 40,
      musicIndex: 0,
      theme: {
        bg0: '#050d28', bg1: '#091640', bg2: '#060e2a',
        primary: '#00d4ff', accent: '#0088ff',
        gnd0: '#0d2045', gnd1: '#07112a',
        line: '#00d4ff', obC: '#00ccff', obC2: '#0055cc', fbC: '#4267B2',
      },
    },
    {
      index: 1,
      label: 'LEVEL 2',
      name: 'NORMAL',
      diff: 'NORMAL',
      speed: 6.2,
      bpm: 175,
      obInterval: 58,
      obMin: 35,
      musicIndex: 1,
      theme: {
        bg0: '#1a0900', bg1: '#2a1200', bg2: '#1e0c00',
        primary: '#ffaa00', accent: '#ff6600',
        gnd0: '#361400', gnd1: '#1c0900',
        line: '#ffaa00', obC: '#ffaa00', obC2: '#ff4400', fbC: '#cc3300',
      },
    },
    {
      index: 2,
      label: 'LEVEL 3',
      name: 'BOSS',
      diff: 'BOSS',
      speed: 7.8,
      bpm: 200,
      obInterval: 48,
      obMin: 30,
      musicIndex: 2,
      theme: {
        bg0: '#100008', bg1: '#1a000e', bg2: '#120008',
        primary: '#ff3333', accent: '#ffffff',
        gnd0: '#2a0012', gnd1: '#160008',
        line: '#ff3333', obC: '#ff3333', obC2: '#aa0000', fbC: '#880000',
      },
    },
  ],
};

/** Sesuaikan resolusi logika dengan pixel buffer canvas. */
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

export function intersectsEllipse(rectHitbox, ellipseObs) {
  const ellipseCenterX = ellipseObs.x + ellipseObs.w / 2;
  const ellipseCenterY = ellipseObs.y + ellipseObs.h / 2;
  const ellipseRadiusX = ellipseObs.w / 2;
  const ellipseRadiusY = ellipseObs.h / 2;

  let closestX = Math.max(rectHitbox.x, Math.min(ellipseCenterX, rectHitbox.x + rectHitbox.w));
  let closestY = Math.max(rectHitbox.y, Math.min(ellipseCenterY, rectHitbox.y + rectHitbox.h));

  const dx = ellipseCenterX - closestX;
  const dy = ellipseCenterY - closestY;

  const distSquared = (dx / ellipseRadiusX) ** 2 + (dy / ellipseRadiusY) ** 2;
  return distSquared <= 1;
}
