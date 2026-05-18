// Deterministic obstacle choreography.
// every gameplay lane below is generated on a 0.6 second grid so the level never
// has empty surprise gaps. Difficulty is stored as 1..100 for tuning/debugging.

const STEP = 0.6; // Increased from 0.5 to reduce crowding across all levels
const LEVEL1_END = 92.0; // Adjusted for new step
const LEVEL2_END = 90.0; // Adjusted for new step
const BOSS_END = 180.0;
const CEILING_RETURN_Y = 44;
const CEILING_RETURN_LANES = [36, 48, 62];

function t(value) {
  return Number(value.toFixed(2));
}

function add(list, time, type, data = {}) {
  list.push({ time: t(time), type, ...data });
}

function seeded01(seed) {
  let value = seed >>> 0;
  value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
  return value / 0x100000000;
}

function difficultyAt(time, start, end) {
  const p = Math.max(0, Math.min(1, (time - start) / Math.max(1, end - start)));
  return Math.max(1, Math.min(100, Math.round(1 + p * 99)));
}

function everyHalfSecond(start, end, onTick) {
  for (let time = start; time <= end; time += STEP) {
    onTick(t(time), Math.round((time - start) / STEP));
  }
}

function levelOnePattern(time, tick, difficulty) {
  if (difficulty < 12) {
    return tick % 2 === 0
      ? ['gd_spike_run', { count: 1, gap: 84 }]
      : ['gd_stack', { height: 1 }];
  }
  if (difficulty < 24) {
    const patterns = [
      ['gd_spike_run', { count: 2, gap: 82 }],
      ['gd_slope_chain', { pattern: 'up', length: 2 }],
      ['gd_stack', { height: 2 }],
      ['gd_spike_block_mix', { pattern: 'single', intensity: 1 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 38) {
    const patterns = [
      ['gd_steps', { heights: [1, 2, 1] }],
      ['gd_spike_block_mix', { pattern: 'stairs', intensity: 2 }],
      ['gd_platform', { width: 3, height: 1 }],
      ['gd_ceiling_spikes', { count: 1, drop: 0, gap: 82 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 54) {
    const patterns = [
      ['gd_tunnel', { width: 3, floor: 1, ceiling: 1 }],
      ['gd_slope_chain', { pattern: 'zigzag', length: 3 }],
      ['gd_spike_run', { count: 3, gap: 78 }],
      ['gd_pillar_gap', { floor: 2, ceiling: 1 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 72) {
    const patterns = [
      ['gd_spike_block_mix', { pattern: 'teeth', intensity: 2 }],
      ['gd_steps', { heights: [1, 2, 3, 1] }],
      ['gd_ceiling_steps', { heights: [1, 2] }],
      ['gd_tunnel', { width: 4, floor: 2, ceiling: 1 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 88) {
    const patterns = [
      ['gd_mirror_gate', { floor: 2, ceiling: 2, spikes: 1 }],
      ['gd_spike_block_mix', { pattern: 'ceiling', intensity: 3 }],
      ['gd_slope_chain', { pattern: 'zigzag', length: 4 }],
      ['gd_pillar_gap', { floor: 3, ceiling: 2 }],
    ];
    return patterns[tick % patterns.length];
  }
  const patterns = [
    ['gd_mirror_gate', { floor: 3, ceiling: 2, spikes: 2 }],
    ['gd_spike_block_mix', { pattern: 'teeth', intensity: 3 }],
    ['gd_tunnel', { width: 5, floor: 2, ceiling: 2 }],
    ['gd_steps', { heights: [1, 2, 3, 2] }],
  ];
  return patterns[tick % patterns.length];
}

function levelTwoPattern(time, tick, difficulty) {
  if (difficulty < 12) {
    const patterns = [
      ['gd_spike_run', { count: 2, gap: 78 }],
      ['gd_stack', { height: 2 }],
      ['gd_slope_chain', { pattern: 'up', length: 2 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 28) {
    const patterns = [
      ['gd_semi_pair', { floorSpikes: 1, ceilingBlocks: 1 }],
      ['gd_spike_block_mix', { pattern: 'stairs', intensity: 2 }],
      ['gd_ceiling_spikes', { count: 2, drop: 4, gap: 76 }],
      ['gd_tunnel', { width: 3, floor: 2, ceiling: 1 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 46) {
    const patterns = [
      ['gd_mirror_gate', { floor: 1, ceiling: 2, spikes: 1 }],
      ['gd_steps', { heights: [2, 3, 1] }],
      ['gd_spike_block_mix', { pattern: 'teeth', intensity: 3 }],
      ['gd_pillar_gap', { floor: 2, ceiling: 2 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 64) {
    const patterns = [
      ['gd_tunnel', { width: 4, floor: 2, ceiling: 2 }],
      ['gd_slope_chain', { pattern: 'zigzag', length: 4 }],
      ['gd_semi_pair', { floorBlocks: 2, ceilingSpikes: 3 }],
      ['gd_spike_run', { count: 4, gap: 74 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 82) {
    const patterns = [
      ['gd_mirror_gate', { floor: 2, ceiling: 3, spikes: 2 }],
      ['gd_spike_block_mix', { pattern: 'ceiling', intensity: 4 }],
      ['gd_ceiling_steps', { heights: [2, 3, 2] }],
      ['gd_tunnel', { width: 5, floor: 3, ceiling: 2 }],
    ];
    return patterns[tick % patterns.length];
  }
  const patterns = [
    ['gd_mirror_gate', { floor: 3, ceiling: 3, spikes: 2 }],
    ['gd_spike_block_mix', { pattern: 'teeth', intensity: 4 }],
    ['gd_slope_chain', { pattern: 'zigzag', length: 5 }],
    ['gd_pillar_gap', { floor: 3, ceiling: 3 }],
  ];
  return patterns[tick % patterns.length];
}

function bossPattern(time, tick, difficulty) {
  if (difficulty < 16) {
    const patterns = [
      ['gd_ship_corridor', { variant: tick % 3 }],
      ['gd_boss_lane', { pattern: 'fangs' }],
      ['gd_mirror_gate', { floor: 1, ceiling: 1, spikes: 1 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 36) {
    const patterns = [
      ['gd_ship_corridor', { variant: tick % 3 }],
      ['gd_boss_lane', { pattern: tick % 2 ? 'gate' : 'fangs' }],
      ['gd_spike_block_mix', { pattern: 'ceiling', intensity: 3 }],
      ['gd_mirror_gate', { floor: 2, ceiling: 2, spikes: 1 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 58) {
    const patterns = [
      ['gd_boss_lane', { pattern: 'steps' }],
      ['gd_tunnel', { width: 4, floor: 2, ceiling: 2 }],
      ['gd_mirror_gate', { floor: 2, ceiling: 3, spikes: 2 }],
      ['gd_spike_block_mix', { pattern: 'teeth', intensity: 3 }],
    ];
    return patterns[tick % patterns.length];
  }
  if (difficulty < 80) {
    const patterns = [
      ['gd_mirror_gate', { floor: 3, ceiling: 3, spikes: 2 }],
      ['gd_ship_corridor', { variant: 2 }],
      ['gd_spike_block_mix', { pattern: 'ceiling', intensity: 4 }],
      ['gd_tunnel', { width: 5, floor: 3, ceiling: 2 }],
    ];
    return patterns[tick % patterns.length];
  }
  const patterns = [
    ['gd_mirror_gate', { floor: 3, ceiling: 3, spikes: 3 }],
    ['gd_spike_block_mix', { pattern: 'teeth', intensity: 4 }],
    ['gd_boss_lane', { pattern: tick % 2 ? 'gate' : 'steps' }],
    ['gd_tunnel', { width: 6, floor: 3, ceiling: 3 }],
  ];
  return patterns[tick % patterns.length];
}

function addOrbBeats(list, start, end, lanes, allowedOrbs = ['orb_yellow', 'orb_blue', 'orb_green', 'orb_red']) {
  let n = 0;
  for (let time = start; time <= end; time += 4) {
    add(list, time, 'gd_orb_line', {
      orb: allowedOrbs[n % allowedOrbs.length],
      lane: lanes[n % lanes.length],
      count: n % 3 === 2 ? 2 : 1,
      difficulty: difficultyAt(time, start, end),
    });
    n++;
  }
}

function addCeilingReturnNet(list, start, end, interval, seedBase) {
  let n = 0;
  for (let time = start; time <= end; time += interval) {
    const seed = seedBase + n * 97;
    const lane = CEILING_RETURN_LANES[Math.floor(seeded01(seed) * CEILING_RETURN_LANES.length)];
    const jitter = Math.round(seeded01(seed + 37) * 4) * 0.25;
    add(list, time + jitter, 'PORTAL_GRAVITY_DOWN', {
      y: lane,
      difficulty: difficultyAt(time, start, end),
      safetyReturn: true,
    });
    n++;
  }
}

function buildLevelOne() {
  const list = [];
  const start = 2.5;
  const end = LEVEL1_END - 1.5;
  everyHalfSecond(start, end, (time, tick) => {
    const difficulty = difficultyAt(time, start, end);
    const [type, data] = levelOnePattern(time, tick, difficulty);
    add(list, time, type, { ...data, difficulty });
  });

  addOrbBeats(list, 7.0, 78.0, ['mid', 'high', 'low']);
  add(list, 12.0, 'gd_secret_coin', { y: 260, difficulty: 14 });
  add(list, 22.5, 'PORTAL_GRAVITY_UP', { difficulty: 25 });
  add(list, 27.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 31 });
  add(list, 31.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 36 });
  add(list, 58.5, 'PORTAL_GRAVITY_UP', { difficulty: 70 });
  add(list, 63.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 76 });
  addCeilingReturnNet(list, 24.5, 34.5, 2.5, 101);
  addCeilingReturnNet(list, 60.5, 68.0, 2.5, 151);
  add(list, 52.0, 'gd_secret_coin', { y: 170, difficulty: 63 });
  add(list, LEVEL1_END, 'gd_finish_lane', { difficulty: 100 });
  return list.sort((a, b) => a.time - b.time);
}

function buildLevelTwo() {
  const list = [];
  const start = 2.5;
  const end = LEVEL2_END - 1.5;
  everyHalfSecond(start, end, (time, tick) => {
    const difficulty = difficultyAt(time, start, end);
    const [type, data] = levelTwoPattern(time, tick, difficulty);
    add(list, time, type, { ...data, difficulty });
  });

  addOrbBeats(list, 6.5, 77.5, ['mid', 'high', 'ceiling', 'low']);
  add(list, 14.5, 'PORTAL_GRAVITY_UP', { difficulty: 16 });
  add(list, 20.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 23 });
  add(list, 18.0, 'gd_secret_coin', { y: 150, difficulty: 22 });
  add(list, 34.0, 'PORTAL_GRAVITY_UP', { difficulty: 41 });
  add(list, 39.5, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 48 });
  add(list, 51.5, 'gd_secret_coin', { y: 300, difficulty: 64 });
  add(list, 56.0, 'PORTAL_GRAVITY_UP', { difficulty: 69 });
  add(list, 61.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 75 });
  add(list, 72.0, 'PORTAL_GRAVITY_UP', { difficulty: 89 });
  add(list, 77.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 95 });
  addCeilingReturnNet(list, 16.5, 24.0, 2.0, 201);
  addCeilingReturnNet(list, 36.0, 44.5, 2.0, 251);
  addCeilingReturnNet(list, 58.0, 66.0, 2.0, 301);
  addCeilingReturnNet(list, 73.5, 79.0, 1.75, 351);
  add(list, LEVEL2_END, 'gd_finish_lane', { difficulty: 100 });
  return list.sort((a, b) => a.time - b.time);
}

function buildBoss() {
  const list = [];
  const start = 2.5;
  const end = BOSS_END - 2;
  add(list, 2.5, 'PORTAL_SHIP', { difficulty: 1 });
  add(list, 3.5, 'BOSS_APPEAR', { text: 'ACOLYTE OF CORRUPTION', difficulty: 2 });
  add(list, 24.0, 'PORTAL_GRAVITY_UP', { difficulty: 13 });
  add(list, 29.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 16 });
  add(list, 62.0, 'PORTAL_GRAVITY_UP', { difficulty: 34 });
  add(list, 67.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 37 });
  add(list, 104.0, 'PORTAL_GRAVITY_UP', { difficulty: 58 });
  add(list, 109.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 61 });
  add(list, 148.0, 'PORTAL_GRAVITY_UP', { difficulty: 83 });
  add(list, 153.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 86 });
  addCeilingReturnNet(list, 26.0, 34.0, 2.0, 401);
  addCeilingReturnNet(list, 64.0, 73.0, 2.0, 451);
  addCeilingReturnNet(list, 106.0, 116.0, 2.0, 501);
  addCeilingReturnNet(list, 150.0, 160.0, 1.75, 551);

  everyHalfSecond(5.0, end, (time, tick) => {
    const difficulty = difficultyAt(time, start, end);
    const [type, data] = bossPattern(time, tick, difficulty);
    add(list, time, type, { ...data, difficulty });

    if (tick % 14 === 0) add(list, time + 0.05, 'PILLAR_SPAWN', { position: tick % 28 === 0 ? 'top' : 'bottom', difficulty });
    if (tick % 16 === 8) add(list, time + 0.1, 'LASER_WARNING', { difficulty });
    if (tick % 16 === 11) add(list, time + 0.1, 'LASER_FIRE', { duration: difficulty > 70 ? 1.3 : 1.0, difficulty });
  });

  addOrbBeats(list, 9.0, 172.0, ['mid', 'high', 'low'], ['orb_blue']);
  add(list, BOSS_END, 'gd_finish_lane', { difficulty: 100 });
  return list.sort((a, b) => a.time - b.time);
}

export const LEVEL1_MAPPING = buildLevelOne();
export const LEVEL2_MAPPING = buildLevelTwo();
export const BOSS_MAPPING = buildBoss();

export function GET_LEVEL_MAPPING(index) {
  if (index === 0) return [...LEVEL1_MAPPING];
  if (index === 1) return [...LEVEL2_MAPPING];
  if (index === 2) return [...BOSS_MAPPING];
  return [];
}
