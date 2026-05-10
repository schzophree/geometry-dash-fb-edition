export const LEVEL1_MAPPING = [
  { time: 2.0, type: 'spike' },
  { time: 4.5, type: 'block' },
  { time: 6.0, type: 'spike_double' },
  { time: 8.5, type: 'block_double' },
  { time: 10.0, type: 'spike_triple' },
  
  { time: 13.0, type: 'PORTAL_SHIP' },
  { time: 15.0, type: 'pillar', position: 'top' },
  { time: 16.5, type: 'pillar', position: 'bottom' },
  { time: 18.0, type: 'pillar', position: 'top' },
  { time: 21.0, type: 'PORTAL_CUBE' },
  
  { time: 24.0, type: 'stair_up' },
  { time: 27.0, type: 'spike_double' },
  { time: 30.0, type: 'tall_block' },
];

export const LEVEL2_MAPPING = [
  { time: 1.5, type: 'spike_double' },
  { time: 3.5, type: 'PORTAL_BALL' },
  { time: 5.5, type: 'spike' }, // In ball mode, spike is on ground/ceiling
  { time: 7.5, type: 'spike' },
  { time: 10.0, type: 'PORTAL_CUBE' },
  
  { time: 12.5, type: 'spike_triple' },
  { time: 15.0, type: 'PORTAL_GRAVITY_UP' },
  { time: 17.5, type: 'spike' }, // Spike is now on ceiling
  { time: 20.0, type: 'PORTAL_GRAVITY_DOWN' },
  
  { time: 23.0, type: 'PORTAL_SHIP' },
  { time: 25.0, type: 'pillar', position: 'bottom' },
  { time: 27.0, type: 'pillar', position: 'top' },
  { time: 29.0, type: 'PORTAL_CUBE' },
];

const CORE_BOSS_MAPPING = [
  { time: 1.2, type: 'BOSS_APPEAR', text: 'ACOLYTE OF CORRUPTION' },
  { time: 2.4, type: 'LIKE_BURST', count: 10 },
  { time: 3.0, type: 'FLOOR_SPIKES', count: 2 },
  { time: 5.4, type: 'BLOCK_STACK', height: 1 },

  { time: 8.4, type: 'PILLAR_SPAWN', position: 'top' },
  { time: 9.0, type: 'PILLAR_SPAWN', position: 'bottom' },
  { time: 10.2, type: 'PILLAR_SPAWN', position: 'bottom' },
  { time: 10.8, type: 'BLOCK_STACK', height: 1 },

  { time: 12.0, type: 'LASER_WARNING', y: 350 },
  { time: 13.5, type: 'LASER_FIRE', y: 350, duration: 1.15 },
  { time: 14.4, type: 'FLOOR_SPIKES', count: 3 },

  { time: 16.0, type: 'MOUTH_VORTEX', duration: 4 },
  { time: 17.2, type: 'LIKE_BURST', count: 16 },
  { time: 19.2, type: 'PILLAR_SPAWN', position: 'top' },
  { time: 20.1, type: 'PILLAR_SPAWN', position: 'bottom' },
  { time: 21.0, type: 'BLOCK_STACK', height: 2 },

  { time: 22.8, type: 'LASER_WARNING', y: 300 },
  { time: 24.0, type: 'LASER_FIRE', y: 300, duration: 1.05 },
  { time: 25.6, type: 'LASER_WARNING', y: 350 },
  { time: 26.8, type: 'LASER_FIRE', y: 350, duration: 1.05 },
  { time: 27.6, type: 'FLOOR_SPIKES', count: 2 },

  { time: 29.4, type: 'PILLAR_SPAWN', position: 'top' },
  { time: 30.0, type: 'PILLAR_SPAWN', position: 'bottom' },
  { time: 30.6, type: 'PILLAR_SPAWN', position: 'top' },
  { time: 31.2, type: 'LIKE_BURST', count: 18 },
  { time: 32.4, type: 'BLOCK_STACK', height: 1 },

  { time: 34.2, type: 'MOUTH_VORTEX', duration: 3.2 },
  { time: 36.0, type: 'LASER_WARNING', y: 338 },
  { time: 37.2, type: 'LASER_FIRE', y: 338, duration: 1.4 },
  { time: 38.4, type: 'FLOOR_SPIKES', count: 4 },

  { time: 41.4, type: 'PILLAR_SPAWN', position: 'bottom' },
  { time: 42.0, type: 'PILLAR_SPAWN', position: 'bottom' },
  { time: 42.9, type: 'PILLAR_SPAWN', position: 'top' },
  { time: 44.4, type: 'LASER_WARNING', y: 314 },
  { time: 45.6, type: 'LASER_FIRE', y: 314, duration: 1.2 },
  { time: 46.5, type: 'BLOCK_STACK', height: 2 },

  { time: 49.2, type: 'LIKE_BURST', count: 22 },
  { time: 50.4, type: 'MOUTH_VORTEX', duration: 4.5 },
  { time: 54.0, type: 'LASER_WARNING', y: 354 },
  { time: 55.2, type: 'LASER_FIRE', y: 354, duration: 1.6 },
  { time: 57.0, type: 'FLOOR_SPIKES', count: 3 },
];

const ENDURANCE_MAPPING = [];
for (let time = 60; time <= 180; time += 2.4) {
  const step = Math.round((time - 60) / 2.4);
  const cycle = step % 6;
  if (cycle === 0) ENDURANCE_MAPPING.push({ time, type: 'FLOOR_SPIKES', count: 2 + (step % 3) });
  else if (cycle === 1) ENDURANCE_MAPPING.push({ time, type: 'BLOCK_STACK', height: 1 + (step % 2) });
  else if (cycle === 2) ENDURANCE_MAPPING.push({ time, type: 'PILLAR_SPAWN', position: step % 4 === 0 ? 'top' : 'bottom' });
  else if (cycle === 3) {
    const y = step % 2 === 0 ? 314 : 350;
    ENDURANCE_MAPPING.push({ time, type: 'LASER_WARNING', y });
    ENDURANCE_MAPPING.push({ time: time + 1.0, type: 'LASER_FIRE', y, duration: 0.95 });
  } else if (cycle === 4) ENDURANCE_MAPPING.push({ time, type: 'LIKE_BURST', count: 10 });
  else ENDURANCE_MAPPING.push({ time, type: 'MOUTH_VORTEX', duration: 1.8 });
}

export const BOSS_MAPPING = [...CORE_BOSS_MAPPING, ...ENDURANCE_MAPPING];

export function GET_LEVEL_MAPPING(index) {
  if (index === 0) return LEVEL1_MAPPING;
  if (index === 1) return LEVEL2_MAPPING;
  if (index === 2) return BOSS_MAPPING;
  return [];
}
