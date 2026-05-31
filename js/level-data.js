// Deterministic obstacle choreography.
// every gameplay lane below is generated on a 0.6 second grid so the level never
// has empty surprise gaps. Difficulty is stored as 1..100 for tuning/debugging.

const STEP = 0.6; // Increased from 0.5 to reduce crowding across all levels
const LEVEL1_END = 305.0; // Synced with music (304.96s)
const LEVEL2_END = 256.0; // Synced with music (256.02s)
const BOSS_END = 277.0;   // Synced with music (276.94s)
const CEILING_RETURN_Y = 44;
const CEILING_RETURN_LANES = [36, 48, 62];
const LEVEL1_PATTERN_SEQUENCE = ['A', 'B', 'C', 'D', 'E', 'A', 'A', 'A', 'C', 'E', 'E', 'B', 'D', 'D', 'D', 'C', 'C', 'A', 'B', 'B'];
const LEVEL2_PATTERN_SEQUENCE = ['C', 'A', 'E', 'B', 'D', 'D', 'B', 'E', 'A', 'C', 'C', 'D', 'B', 'E', 'A', 'A', 'E', 'C', 'D', 'B'];
const BOSS_PATTERN_SEQUENCE = ['B', 'A', 'C', 'D', 'E', 'E', 'B', 'A', 'C', 'D', 'D', 'C', 'E', 'B', 'A'];

class BagRandomizer {
  constructor(sequence, seed = 12345) {
    this.baseSequence = [...sequence];
    this.currentBag = [];
    this.seed = seed;
  }

  next() {
    if (this.currentBag.length === 0) {
      // Refill and shuffle
      this.currentBag = [...this.baseSequence];
      // Fisher-Yates shuffle using seeded01 equivalent inside class
      for (let i = this.currentBag.length - 1; i > 0; i--) {
        this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
        const r = this.seed / 0x100000000;
        const j = Math.floor(r * (i + 1));
        const temp = this.currentBag[i];
        this.currentBag[i] = this.currentBag[j];
        this.currentBag[j] = temp;
      }
    }
    return this.currentBag.pop();
  }
}

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

function levelOnePattern(time, tick, difficulty, key = null) {
  if (!key) {
    key = LEVEL1_PATTERN_SEQUENCE[tick % LEVEL1_PATTERN_SEQUENCE.length];
  }
  const tier = difficulty < 35 ? 1 : difficulty < 70 ? 2 : 3;
  const patterns = {
    A: ['gd_spike_run', { count: tier, gap: 82 - tier * 2 }],
    B: ['gd_stack', { height: tier }],
    C: ['gd_steps', { heights: tier === 1 ? [1, 2, 1] : [1, 2, 3, 1] }],
    D: ['gd_pillar_gap', { floor: Math.min(3, tier + 1), ceiling: tier > 1 ? 1 : 0 }],
    E: ['gd_spike_block_mix', { pattern: tier === 1 ? 'single' : 'teeth', intensity: tier }],
  };
  return patterns[key];
}

function levelTwoPattern(time, tick, difficulty, key = null) {
  if (!key) {
    key = LEVEL2_PATTERN_SEQUENCE[tick % LEVEL2_PATTERN_SEQUENCE.length];
  }
  const tier = difficulty < 30 ? 2 : difficulty < 72 ? 3 : 4;
  const patterns = {
    A: ['gd_mirror_gate', { floor: Math.min(3, tier - 1), ceiling: Math.min(3, tier - 1), spikes: Math.max(1, tier - 2) }],
    B: ['gd_spike_block_mix', { pattern: 'stairs', intensity: tier }],
    C: ['gd_tunnel', { width: Math.min(5, tier + 1), floor: Math.min(3, tier - 1), ceiling: Math.min(3, tier - 1) }],
    D: ['gd_semi_pair', { floorSpikes: tier - 1, ceilingSpikes: Math.max(1, tier - 2), floorBlocks: 1 }],
    E: ['gd_pillar_gap', { floor: Math.min(3, tier), ceiling: Math.min(3, tier - 1) }],
  };
  return patterns[key];
}

function bossPattern(time, tick, difficulty, key = null) {
  if (!key) {
    key = BOSS_PATTERN_SEQUENCE[tick % BOSS_PATTERN_SEQUENCE.length];
  }
  const tier = difficulty < 35 ? 2 : difficulty < 72 ? 3 : 4;
  const patterns = {
    A: ['gd_ship_corridor', { variant: tick % 3 }],
    B: ['gd_tunnel', { width: Math.min(6, tier + 2), floor: Math.min(3, tier), ceiling: Math.min(3, tier - 1) }],
    C: ['gd_boss_lane', { pattern: tick % 2 ? 'gate' : 'fangs' }],
    D: ['gd_mirror_gate', { floor: Math.min(3, tier), ceiling: Math.min(3, tier), spikes: Math.max(2, tier - 1) }],
    E: ['gd_spike_block_mix', { pattern: 'ceiling', intensity: tier }],
  };
  return patterns[key];
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

// Add coin and heart items deterministic-randomly across specified time intervals
function addDynamicItems(list, start, end, coinSeed, heartSeed) {
  let coinTime = start + 10;
  let coinN = 0;
  while (coinTime < end) {
    coinN++;
    const seed = coinSeed + coinN * 83;
    const y = 150 + Math.round(seeded01(seed) * 150); // 150 - 300
    const difficulty = difficultyAt(coinTime, start, end);
    add(list, coinTime, 'gd_secret_coin', { y, difficulty });
    // Random interval between 15 and 20 seconds
    const interval = 15 + seeded01(seed + 13) * 5;
    coinTime += interval;
  }

  let heartTime = start + 25;
  let heartN = 0;
  while (heartTime < end) {
    heartN++;
    const seed = heartSeed + heartN * 97;
    const y = 150 + Math.round(seeded01(seed) * 150); // 150 - 300
    const difficulty = difficultyAt(heartTime, start, end);
    add(list, heartTime, 'gd_heart', { y, difficulty });
    // Random interval between 30 and 40 seconds
    const interval = 30 + seeded01(seed + 29) * 10;
    heartTime += interval;
  }
}

function buildLevelOne() {
  const list = [];
  const start = 2.5;
  const end = LEVEL1_END - 1.5;

  const bag = new BagRandomizer(LEVEL1_PATTERN_SEQUENCE, 11111);
  let time = start;
  let tick = 0;
  let seed = 22222;

  while (time <= end) {
    const difficulty = difficultyAt(time, start, end);
    let key;

    if (time < 50.0) {
      // Keep the intro portion sequential as designed originally until time=50s
      key = LEVEL1_PATTERN_SEQUENCE[tick % LEVEL1_PATTERN_SEQUENCE.length];
      const [type, data] = levelOnePattern(time, tick, difficulty, key);
      add(list, time, type, { ...data, difficulty });
      time += STEP;
    } else {
      // Bag randomizer shuffle
      key = bag.next();
      const [type, data] = levelOnePattern(time, tick, difficulty, key);
      add(list, time, type, { ...data, difficulty });

      // Add a random gap of 0.3-0.5s (representing 6-8 grid units gap)
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const r = seed / 0x100000000;
      const gap = 0.3 + r * 0.2;
      time += STEP + gap;
    }
    tick++;
  }

  // More orb beats spread all the way to level end
  addOrbBeats(list, 7.0, LEVEL1_END - 10.0, ['mid', 'high', 'low']);

  // Gravity portal variety & safety ceiling nets
  add(list, 22.5, 'PORTAL_GRAVITY_UP', { difficulty: 25 });
  add(list, 27.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 31 });
  add(list, 31.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 36 });
  add(list, 58.5, 'PORTAL_GRAVITY_UP', { difficulty: 70 });
  add(list, 63.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 76 });
  
  // Extra gravity switches for added challenge in later portion
  add(list, 110.5, 'PORTAL_GRAVITY_UP', { difficulty: 80 });
  add(list, 116.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 82 });
  add(list, 170.5, 'PORTAL_GRAVITY_UP', { difficulty: 90 });
  add(list, 176.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 92 });
  add(list, 230.5, 'PORTAL_GRAVITY_UP', { difficulty: 95 });
  add(list, 236.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 97 });

  addCeilingReturnNet(list, 24.5, 34.5, 2.5, 101);
  addCeilingReturnNet(list, 60.5, 68.0, 2.5, 151);
  addCeilingReturnNet(list, 111.5, 117.5, 2.5, 601);
  addCeilingReturnNet(list, 171.5, 177.5, 2.5, 651);
  addCeilingReturnNet(list, 231.5, 237.5, 2.5, 701);

  // Dynamic coin and heart items
  addDynamicItems(list, start, end, 100, 200);

  add(list, LEVEL1_END, 'gd_finish_lane', { difficulty: 100 });
  return list.sort((a, b) => a.time - b.time);
}

function buildLevelTwo() {
  const list = [];
  const start = 2.5;
  const end = LEVEL2_END - 1.5;

  const bag = new BagRandomizer(LEVEL2_PATTERN_SEQUENCE, 33333);
  let time = start;
  let tick = 0;
  let seed = 44444;

  while (time <= end) {
    // Aggressive difficulty scaling
    const baseDifficulty = difficultyAt(time, start, end);
    const difficulty = Math.min(100, Math.round(15 + baseDifficulty * 0.85));

    const key = bag.next();
    const [type, data] = levelTwoPattern(time, tick, difficulty, key);
    add(list, time, type, { ...data, difficulty });

    // Add a random gap of 0.3-0.5s
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const r = seed / 0x100000000;
    const gap = 0.3 + r * 0.2;
    time += STEP + gap;
    tick++;
  }

  // More frequent orb beats
  addOrbBeats(list, 6.5, LEVEL2_END - 10.0, ['mid', 'high', 'ceiling', 'low']);

  // Gravity portal sections
  add(list, 14.5, 'PORTAL_GRAVITY_UP', { difficulty: 16 });
  add(list, 20.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 23 });
  add(list, 34.0, 'PORTAL_GRAVITY_UP', { difficulty: 41 });
  add(list, 39.5, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 48 });
  add(list, 56.0, 'PORTAL_GRAVITY_UP', { difficulty: 69 });
  add(list, 61.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 75 });
  add(list, 72.0, 'PORTAL_GRAVITY_UP', { difficulty: 89 });
  add(list, 77.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 95 });

  // Additional gravity switches in second half
  add(list, 115.0, 'PORTAL_GRAVITY_UP', { difficulty: 90 });
  add(list, 121.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 92 });
  add(list, 155.0, 'PORTAL_GRAVITY_UP', { difficulty: 95 });
  add(list, 161.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 97 });
  add(list, 195.0, 'PORTAL_GRAVITY_UP', { difficulty: 98 });
  add(list, 201.0, 'PORTAL_GRAVITY_DOWN', { y: CEILING_RETURN_Y, difficulty: 99 });

  addCeilingReturnNet(list, 16.5, 24.0, 2.0, 201);
  addCeilingReturnNet(list, 36.0, 44.5, 2.0, 251);
  addCeilingReturnNet(list, 58.0, 66.0, 2.0, 301);
  addCeilingReturnNet(list, 73.5, 79.0, 1.75, 351);
  addCeilingReturnNet(list, 116.0, 122.5, 2.0, 361);
  addCeilingReturnNet(list, 156.0, 162.5, 2.0, 371);
  addCeilingReturnNet(list, 196.0, 202.5, 2.0, 381);

  // Ship Portal Flight Sections
  add(list, 82.0, 'PORTAL_SHIP', { difficulty: 50 });
  add(list, 102.0, 'PORTAL_CUBE', { difficulty: 60 });
  add(list, 135.0, 'PORTAL_SHIP', { difficulty: 75 });
  add(list, 148.0, 'PORTAL_CUBE', { difficulty: 80 });
  add(list, 175.0, 'PORTAL_SHIP', { difficulty: 85 });
  add(list, 188.0, 'PORTAL_CUBE', { difficulty: 90 });
  add(list, 215.0, 'PORTAL_SHIP', { difficulty: 95 });
  add(list, 230.0, 'PORTAL_CUBE', { difficulty: 98 });

  // Dynamic coin and heart items
  addDynamicItems(list, start, end, 300, 400);

  add(list, LEVEL2_END, 'gd_finish_lane', { difficulty: 100 });
  return list.sort((a, b) => a.time - b.time);
}

function buildBoss() {
  const list = [];
  const start = 2.5;
  const end = BOSS_END - 2;

  // Boss intro actions
  add(list, 2.5, 'PORTAL_SHIP', { difficulty: 1 });
  add(list, 3.5, 'BOSS_APPEAR', { text: '', difficulty: 2 });
  add(list, 8.0, 'PORTAL_SHIP', { difficulty: 4 });

  // Gravity portal triggers
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

  // Dynamic Boss Mode Switches (Ship & Ball portal sections)
  add(list, 20.0, 'PORTAL_BALL', { difficulty: 10 });
  add(list, 40.0, 'PORTAL_CUBE', { difficulty: 20 });
  add(list, 60.0, 'PORTAL_SHIP', { difficulty: 30 });
  add(list, 80.0, 'PORTAL_BALL', { difficulty: 45 });
  add(list, 100.0, 'PORTAL_CUBE', { difficulty: 55 });
  add(list, 120.0, 'PORTAL_SHIP', { difficulty: 68 });
  add(list, 140.0, 'PORTAL_BALL', { difficulty: 78 });
  add(list, 160.0, 'PORTAL_CUBE', { difficulty: 85 });
  add(list, 180.0, 'PORTAL_SHIP', { difficulty: 90 });
  add(list, 200.0, 'PORTAL_BALL', { difficulty: 95 });
  add(list, 220.0, 'PORTAL_CUBE', { difficulty: 97 });
  add(list, 240.0, 'PORTAL_SHIP', { difficulty: 99 });

  const bag = new BagRandomizer(BOSS_PATTERN_SEQUENCE, 55555);
  let time = 5.0;
  let tick = 0;
  let seed = 66666;

  while (time <= end) {
    const difficulty = difficultyAt(time, start, end);
    const key = bag.next();
    const [type, data] = bossPattern(time, tick, difficulty, key);
    add(list, time, type, { ...data, difficulty });

    // Laser & Pillar hazards
    if (tick % 14 === 0) add(list, time + 0.05, 'PILLAR_SPAWN', { position: tick % 28 === 0 ? 'top' : 'bottom', difficulty });
    if (tick % 16 === 8) {
      add(list, time + 0.1, 'LASER_WARNING', { difficulty });
      add(list, time + 1.45, 'LASER_FIRE', { duration: difficulty > 70 ? 1.3 : 1.0, difficulty });
    }

    // Add a random gap of 0.3-0.5s
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const r = seed / 0x100000000;
    const gap = 0.3 + r * 0.2;
    time += STEP + gap;
    tick++;
  }

  // Boss orb beats
  addOrbBeats(list, 9.0, 172.0, ['mid', 'high', 'low'], ['orb_blue']);

  // Dynamic coin and heart items
  addDynamicItems(list, start, end, 500, 600);

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
