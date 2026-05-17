export const LEVEL1_MAPPING = [
  // ═══ 0-10% INTRO — Familiarization ═══
  { time: 1.0, type: 'spike' },
  { time: 2.0, type: 'spike' },
  { time: 3.0, type: 'trampoline' },
  { time: 4.5, type: 'block' },
  { time: 5.5, type: 'spike_double' },
  { time: 7.0, type: 'triangle_step' },
  { time: 8.5, type: 'block' },

  // ═══ 10-25% — Block Patterns ═══
  { time: 10.0, type: 'block_tower_3' },
  { time: 11.5, type: 'spike_triple' },
  { time: 13.0, type: 'block_gap' },
  { time: 14.5, type: 'trampoline' },
  { time: 15.5, type: 'spike_double' },
  { time: 17.0, type: 'triangle_staircase' },
  { time: 18.5, type: 'block' },
  { time: 19.5, type: 'spike' },

  // ═══ 25-40% — Mixed Challenges ═══
  { time: 21.0, type: 'platform_jump_orb' },
  { time: 22.5, type: 'spike_pit' },
  { time: 24.0, type: 'block_double' },
  { time: 25.5, type: 'trampoline' },
  { time: 26.5, type: 'triangle_double' },
  { time: 28.0, type: 'spike_triple' },
  { time: 29.5, type: 'block_alternating' },
  { time: 31.0, type: 'triangle_step' },
  { time: 32.5, type: 'spike_double' },

  // ═══ 40-55% — Difficulty Spike ═══
  { time: 34.0, type: 'PORTAL_SHIP' },
  { time: 35.5, type: 'tunnel_blocks' },
  { time: 37.0, type: 'spike_triple' },
  { time: 38.5, type: 'block_tower_2' },
  { time: 40.0, type: 'trampoline' },
  { time: 41.5, type: 'triangle_maze' },
  { time: 43.0, type: 'spike_pit' },
  { time: 44.5, type: 'PORTAL_CUBE' },

  // ═══ 55-70% — Gravity Shift ═══
  { time: 46.0, type: 'PORTAL_GRAVITY_UP' },
  { time: 47.5, type: 'spike_ceiling' },
  { time: 49.0, type: 'triangle_step' },
  { time: 50.5, type: 'block_gap' },
  { time: 52.0, type: 'spike_double' },
  { time: 53.5, type: 'trampoline' },
  { time: 55.0, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 56.5, type: 'block_tower_3' },

  // ═══ 70-85% — Intense Combinations ═══
  { time: 58.0, type: 'spike_pit' },
  { time: 59.5, type: 'triangle_staircase' },
  { time: 61.0, type: 'block_alternating' },
  { time: 62.5, type: 'spike_triple' },
  { time: 64.0, type: 'trampoline' },
  { time: 65.5, type: 'spike_ceiling_double' },
  { time: 67.0, type: 'block_double' },
  { time: 68.5, type: 'triangle_maze' },

  // ═══ 85-100% — Final Climax ═══
  { time: 70.0, type: 'spike_pit_long' },
  { time: 71.5, type: 'trampoline_double' },
  { time: 73.0, type: 'block_tower_4' },
  { time: 74.5, type: 'spike_triple' },
  { time: 76.0, type: 'triangle_staircase' },
  { time: 77.5, type: 'platform_jump_orb' },
  { time: 79.0, type: 'spike_pit' },
  { time: 80.5, type: 'trampoline' },
  { time: 82.0, type: 'block_gap' },
  { time: 83.5, type: 'spike_ceiling' },
  { time: 85.0, type: 'triangle_step' },
  { time: 86.5, type: 'spike_double' },
];

export const LEVEL2_MAPPING = [
  // ═══ 0-10% Gravity Swap Intro ═══
  { time: 4.0, type: 'PORTAL_GRAVITY_UP' },
  { time: 5.5, type: 'spike_ceiling_triple' },
  { time: 7.0, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 8.5, type: 'block_tower_2' },
  { time: 10.0, type: 'triangle_step' },
  { time: 11.5, type: 'spike_double' },

  // ═══ 10-25% — Asymmetric Challenges ═══
  { time: 13.0, type: 'block_offset' },
  { time: 14.5, type: 'spike_triple' },
  { time: 16.0, type: 'tunnel_blocks_narrow' },
  { time: 17.5, type: 'triangle_maze' },
  { time: 19.0, type: 'trampoline' },
  { time: 20.5, type: 'PORTAL_GRAVITY_UP' },
  { time: 22.0, type: 'spike_ceiling' },
  { time: 23.5, type: 'block_double_offset' },
  { time: 25.0, type: 'PORTAL_GRAVITY_DOWN' },

  // ═══ 25-40% — Ball Mode Transition ═══
  { time: 26.5, type: 'PORTAL_BALL' },
  { time: 28.0, type: 'tunnel_curve' },
  { time: 29.5, type: 'spike_pit' },
  { time: 31.0, type: 'triangle_staircase' },
  { time: 32.5, type: 'block_tower_3' },
  { time: 34.0, type: 'trampoline_double' },
  { time: 35.5, type: 'spike_ceiling_double' },
  { time: 37.0, type: 'PORTAL_CUBE' },

  // ═══ 40-55% — Complex Mazes ═══
  { time: 38.5, type: 'PORTAL_GRAVITY_UP' },
  { time: 40.0, type: 'block_gap_offset' },
  { time: 41.5, type: 'spike_pit_offset' },
  { time: 43.0, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 44.5, type: 'triangle_maze_complex' },
  { time: 46.0, type: 'block_tower_4' },
  { time: 47.5, type: 'spike_triple_offset' },
  { time: 49.0, type: 'trampoline' },

  // ═══ 55-70% — Ship ZigZag Pattern ═══
  { time: 50.5, type: 'PORTAL_SHIP' },
  { time: 52.0, type: 'tunnel_zigzag' },
  { time: 53.5, type: 'block_alternating_offset' },
  { time: 55.0, type: 'spike_ceiling_triple' },
  { time: 56.5, type: 'triangle_step' },
  { time: 58.0, type: 'trampoline_double' },
  { time: 59.5, type: 'spike_pit' },
  { time: 61.0, type: 'PORTAL_CUBE' },

  // ═══ 70-85% — Gravity Chaos ═══
  { time: 62.5, type: 'PORTAL_GRAVITY_UP' },
  { time: 64.0, type: 'block_offset_complex' },
  { time: 65.5, type: 'spike_triple' },
  { time: 67.0, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 68.5, type: 'tunnel_blocks_tight' },
  { time: 70.0, type: 'triangle_maze' },
  { time: 71.5, type: 'PORTAL_GRAVITY_UP' },
  { time: 73.0, type: 'spike_ceiling_double' },

  // ═══ 85-100% — Brutal Final Section ═══
  { time: 74.5, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 76.0, type: 'block_tower_4' },
  { time: 77.5, type: 'spike_pit_long' },
  { time: 79.0, type: 'trampoline_double' },
  { time: 80.5, type: 'triangle_staircase_offset' },
  { time: 82.0, type: 'PORTAL_GRAVITY_UP' },
  { time: 83.5, type: 'spike_ceiling_triple' },
  { time: 85.0, type: 'block_gap_complex' },
  { time: 86.5, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 88.0, type: 'spike_pit' },
  { time: 89.5, type: 'platform_jump_orb' },
];

const CORE_BOSS_MAPPING = [
  // ═══ 0-10% — Boss Intro ═══
  { time: 4.2, type: 'BOSS_APPEAR', text: 'RAJA FESNUK' },
  { time: 6.0, type: 'PORTAL_SHIP' },
  { time: 8.0, type: 'tunnel_spike_walls' },
  { time: 10.0, type: 'block_tower_3' },
  { time: 12.0, type: 'spike_ceiling_double' },

  // ═══ 10-20% — Laser Intro ═══
  { time: 14.0, type: 'block_offset' },
  { time: 15.5, type: 'spike_pit' },
  { time: 17.0, type: 'LASER_WARNING', y: 350 },
  { time: 18.5, type: 'LASER_FIRE', y: 350, duration: 1.2 },
  { time: 20.0, type: 'tunnel_dodge' },
  { time: 21.5, type: 'spike_ceiling_triple' },

  // ═══ 20-35% — Gravity + Laser ═══
  { time: 23.0, type: 'PORTAL_GRAVITY_UP' },
  { time: 24.5, type: 'block_tower_4' },
  { time: 26.0, type: 'spike_triple' },
  { time: 27.5, type: 'LASER_WARNING', y: 120 },
  { time: 29.0, type: 'LASER_FIRE', y: 120, duration: 1.5 },
  { time: 30.5, type: 'trampoline_double' },
  { time: 32.0, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 33.5, type: 'spike_pit_offset' },
  { time: 35.0, type: 'block_gap_complex' },

  // ═══ 35-50% — Intense Mixed ═══
  { time: 37.0, type: 'block_tower_5' },
  { time: 39.0, type: 'LASER_WARNING', y: 250 },
  { time: 40.5, type: 'LASER_FIRE', y: 250, duration: 1.5 },
  { time: 42.0, type: 'tunnel_blocks_tight' },
  { time: 43.5, type: 'triangle_staircase_offset' },
  { time: 45.0, type: 'spike_ceiling_double' },
  { time: 46.5, type: 'trampoline' },
  { time: 48.0, type: 'spike_pit_long' },

  // ═══ 50-65% — Vortex Phase ═══
  { time: 50.0, type: 'MOUTH_VORTEX', duration: 3.5 },
  { time: 52.0, type: 'LASER_WARNING', y: 350 },
  { time: 53.5, type: 'LASER_FIRE', y: 350, duration: 1.8 },
  { time: 55.0, type: 'block_tower_4' },
  { time: 56.5, type: 'spike_triple' },
  { time: 58.0, type: 'tunnel_zigzag' },
  { time: 59.5, type: 'triangle_maze' },

  // ═══ 65-80% — Double Laser Chaos ═══
  { time: 61.0, type: 'LASER_WARNING', y: 120 },
  { time: 61.5, type: 'LASER_WARNING', y: 350 },
  { time: 63.0, type: 'LASER_FIRE', y: 120, duration: 1.5 },
  { time: 63.0, type: 'LASER_FIRE', y: 350, duration: 1.5 },
  { time: 65.0, type: 'PORTAL_GRAVITY_UP' },
  { time: 66.5, type: 'spike_pit_offset' },
  { time: 68.0, type: 'block_gap_complex' },
  { time: 69.5, type: 'PORTAL_GRAVITY_DOWN' },
  { time: 71.0, type: 'spike_ceiling_triple' },

  // ═══ 80-90% — Extreme Mode ═══
  { time: 72.5, type: 'MOUTH_VORTEX', duration: 4 },
  { time: 74.5, type: 'LASER_WARNING', y: 250 },
  { time: 76.0, type: 'LASER_FIRE', y: 250, duration: 2.0 },
  { time: 78.0, type: 'block_tower_5' },
  { time: 79.5, type: 'spike_pit_long' },
  { time: 81.0, type: 'tunnel_blocks_ultra_tight' },
  { time: 82.5, type: 'triangle_maze_complex' },
  { time: 84.0, type: 'trampoline_double' },

  // ═══ 90-100% — Final Rage ═══
  { time: 85.5, type: 'LASER_WARNING', y: 120 },
  { time: 85.5, type: 'LASER_WARNING', y: 350 },
  { time: 87.0, type: 'LASER_FIRE', y: 120, duration: 2.0 },
  { time: 87.0, type: 'LASER_FIRE', y: 350, duration: 2.0 },
  { time: 89.0, type: 'spike_pit_offset' },
  { time: 90.5, type: 'MOUTH_VORTEX', duration: 3 },
  { time: 92.5, type: 'block_tower_5' },
  { time: 94.0, type: 'spike_triple_offset' },
];

export const BOSS_MAPPING = [...CORE_BOSS_MAPPING];

export function GET_LEVEL_MAPPING(index) {
  if (index === 0) return LEVEL1_MAPPING;
  if (index === 1) return LEVEL2_MAPPING;
  if (index === 2) return BOSS_MAPPING;
  return [];
}