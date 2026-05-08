// Edit this file to add your music files.
// Place MP3 files in the /music/ folder, or update the file paths below.
// The loader also tries assets/audio/bgm/<file> as a convenience fallback.
window.MUSIC_LIST = [
  {
    file: 'music/level1.mp3',
    name: 'Sunshine',
    artist: 'DJ Genki',
    bpm: 170,
    label: 'LEVEL 1',
    diff: 'EASY',
    theme: {
      bg0: '#1a0a00', bg1: '#2e1500', bg2: '#1e0c00',
      primary: '#ffcc00', accent: '#ff8800',
      gnd0: '#3a1800', gnd1: '#200e00',
      line: '#ffcc00', obC: '#ffcc00', obC2: '#ff6600',
      fbC: '#cc4400',
    },
  },
  {
    file: 'music/level2.mp3',
    name: 'Dream Away feat. Yukacco',
    artist: 'DJ Noriken & DJ Genki',
    bpm: 175,
    label: 'LEVEL 2',
    diff: 'NORMAL',
    theme: {
      bg0: '#060018', bg1: '#0e0030', bg2: '#090022',
      primary: '#7744ff', accent: '#cc88ff',
      gnd0: '#180040', gnd1: '#0a0022',
      line: '#8855ff', obC: '#9966ff', obC2: '#5500cc',
      fbC: '#6600cc',
    },
  },
  {
    file: 'music/boss.mp3',
    name: 'Ouvertüre (FULL Ver)',
    artist: 'USAO & DJ Genki feat. ルーン',
    bpm: 200,
    label: 'BOSS',
    diff: 'HARD',
    theme: {
      bg0: '#0a0808', bg1: '#1a1000', bg2: '#120c00',
      primary: '#ffe066', accent: '#ffffff',
      gnd0: '#2a1e00', gnd1: '#160f00',
      line: '#ffe066', obC: '#ffe066', obC2: '#ffaa00',
      fbC: '#cc8800',
    },
  },
];
// Tip: BPM is used as fallback if beat detection fails.
// Add any MP3 here. Beat detection reads from the actual audio.
