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
    jumpForce: -14.2,
    coyoteFrames: 5,
    trailLifeStep: 0.075,
    invincibleFrames: 90,
    hitboxInset: 5,
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
    stars: 46,
    shapes: 12,
    lowFx: true,
  },

  gameplay: {
    startLives: 5,
    checkpointThresholds: [900, 2100, 3800],
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
  },

  ghost: {
    intervalMin: 300,
    intervalMax: 700,
    fadeSpeed: 0.018,
    holdDuration: 160,
    maxAlpha: 0.82,
    bobAmplitude: 6,
    messages: [
      ['ngapain ngoding,', 'mending scroll fesnuk 😂'],
      ['deadline besok?', 'ya scroll aja dulu 😌'],
      ['bug belum kelar?', 'fesnuk dulu 5 menit 🙃'],
      ['ngoding dari tadi,', 'istirahat fesnuk yuk 😴'],
      ['error mulu,', 'udah buka fesnuk aja bro 💀'],
    ],
  },

  levels: [
    {
      index: 0,
      label: 'LEVEL 1',
      name: 'EASY',
      diff: 'EASY',
      scoreStart: 0,
      scoreEnd: 900,
      speed: 5.5,
      bpm: 140,
      obInterval: 90,
      obMin: 54,
      musicIndex: 0,
      theme: {
        bg0: '#040d28',
        bg1: '#091640',
        bg2: '#071133',
        primary: '#00d4ff',
        accent: '#0088ff',
        gnd0: '#0d2045',
        gnd1: '#08142f',
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
      scoreStart: 900,
      scoreEnd: 2100,
      speed: 6.5,
      bpm: 145,
      obInterval: 75,
      obMin: 44,
      musicIndex: 1,
      theme: {
        bg0: '#180900',
        bg1: '#2a1200',
        bg2: '#1e0b00',
        primary: '#ffaa00',
        accent: '#ff6600',
        gnd0: '#351500',
        gnd1: '#1d0900',
        line: '#ffaa00',
        obC: '#ffaa00',
        obC2: '#ff4400',
        fbC: '#cc3300',
      },
    },
    {
      index: 2,
      label: 'LEVEL 3',
      name: 'HARD',
      diff: 'HARD',
      scoreStart: 2100,
      scoreEnd: 3800,
      speed: 7.8,
      bpm: 152,
      obInterval: 62,
      obMin: 36,
      musicIndex: 2,
      theme: {
        bg0: '#0d0018',
        bg1: '#190030',
        bg2: '#100020',
        primary: '#cc44ff',
        accent: '#ff44cc',
        gnd0: '#220042',
        gnd1: '#100021',
        line: '#cc44ff',
        obC: '#cc44ff',
        obC2: '#8800ee',
        fbC: '#8800cc',
      },
    },
    {
      index: 3,
      label: 'LEVEL 4',
      name: 'INSANE',
      diff: 'INSANE',
      scoreStart: 3800,
      scoreEnd: Infinity,
      speed: 9.2,
      bpm: 158,
      obInterval: 50,
      obMin: 28,
      musicIndex: 2,
      theme: {
        bg0: '#180000',
        bg1: '#2a0000',
        bg2: '#120000',
        primary: '#ff2244',
        accent: '#ff6644',
        gnd0: '#360000',
        gnd1: '#1a0000',
        line: '#ff2244',
        obC: '#ff2244',
        obC2: '#ff5500',
        fbC: '#cc0000',
      },
    },
  ],
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function getLevelIndexForScore(score) {
  let index = 0;
  for (const level of CONFIG.levels) {
    if (score >= level.scoreStart) index = level.index;
  }
  return index;
}

export function getLevel(index) {
  return CONFIG.levels[clamp(index, 0, CONFIG.levels.length - 1)];
}

export function getLevelForScore(score) {
  return getLevel(getLevelIndexForScore(score));
}
