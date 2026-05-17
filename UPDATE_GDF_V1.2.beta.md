Ini adalah update besar untuk project geometry-dash-fb-edition di GitHub.

Baca seluruh codebase yang ada, lalu terapkan semua perubahan berikut.

══════════════════════════════════════════════════════
REPO REFERENCE
══════════════════════════════════════════════════════
GitHub: https://github.com/schzophree/geometry-dash-fb-edition
Folder musik: music/
level1.mp3 → DJ Genki VS Camellia - Sunshine feat. moimoi [170 BPM]
level2.mp3 → DJ Noriken & DJ Genki - Dream Away feat. Yukacco [175 BPM]
boss.mp3 → USAO & DJ Genki feat. ルーン - Ouvertüre (FULL Ver) [200 BPM]

══════════════════════════════════════════════════════
FIX 1 — BUG PORTAL HIJAU (OVAL HIJAU TITIK-TITIK)
══════════════════════════════════════════════════════
Bug: ketika player menyentuh green orb/ring (oval hijau titik-titik),
game crash atau trigger death — padahal seharusnya memberikan boost jump.

Root cause yang dicari dan diperbaiki:

1. Cek collision detection untuk entitas bertipe 'orb' atau 'ring':
   - Jangan gunakan hitbox obstacle biasa (yang trigger death)
   - Orb/ring harus punya collision handler sendiri
2. Green orb behavior yang benar:
   - Saat player MENYENTUH orb: tampilkan visual flash (glow hijau)
   - Saat player MENEKAN jump DALAM radius orb: trigger boost jump
     vy = -16.0 (lebih tinggi dari jump biasa -14.2)
   - Setelah dipakai: orb berkedip lalu hilang (atau tetap tapi non-aktif)
3. Pastikan tipe entitas dibedakan:
   LETHAL → spike, block, tall block (trigger death on touch)
   UTILITY → orb, ring, portal, pad (trigger ability, TIDAK death)
4. Jika ada tipe lain yang juga ngebug (orb kuning, biru, ungu):
   - Yellow orb: normal jump force vy = -14.2
   - Blue orb: flip gravity
   - Green orb: strong jump vy = -16.0
   - Red orb: reverse jump direction

══════════════════════════════════════════════════════
FIX 2 — ASSET SYSTEM: SPRITESHEET AUTOCROP
══════════════════════════════════════════════════════
Di folder 'geometry-dash-assets/' ada file gambar spritesheet GD
yang masih dalam bentuk sheet besar (semua sprite nyatu dalam satu PNG).

Tugas:

1. Buat file 'js/spritesheet.js' yang berisi:
   - Fungsi loadSpritesheet(path) → load Image, return promise
   - Fungsi cropSprite(sheet, x, y, w, h) → return ImageBitmap
   - Atlas JSON hardcoded berisi koordinat tiap sprite di GJ_GameSheet-hd.png:

   Gunakan koordinat GD standar berikut (sesuaikan jika berbeda):
   const ATLAS = {
   // PLAYER CUBES
   cube_01: { x:0, y:0, w:75, h:75 },
   cube_02: { x:75, y:0, w:75, h:75 },
   cube_inner: { x:150, y:0, w:75, h:75 },

   // OBSTACLES
   spike_01: { x:0, y:150, w:50, h:60 },
   block_01: { x:50, y:150, w:60, h:60 },
   block_02: { x:110, y:150, w:60, h:60 },

   // ORBS / RINGS
   orb_yellow: { x:0, y:300, w:60, h:60 },
   orb_green: { x:60, y:300, w:60, h:60 },
   orb_blue: { x:120, y:300, w:60, h:60 },

   // PORTALS
   portal_cube: { x:0, y:420, w:50, h:80 },
   portal_ship: { x:50, y:420, w:50, h:80 },
   portal_ball: { x:100, y:420, w:50, h:80 },

   // GROUND TILES
   ground_tile: { x:0, y:600, w:60, h:40 },
   ground_edge: { x:60, y:600, w:60, h:40 },

   // BACKGROUND ELEMENTS
   bg_line: { x:0, y:700, w:100, h:20 },
   };

2. Saat game init: coba load setiap file di geometry-dash-assets/:
   - Scan nama file (list hardcoded): GJ_GameSheet-hd.png, GJ_GameSheet02-hd.png
   - Jika berhasil load: gunakan cropSprite() untuk extract tiap sprite
   - Jika gagal load atau crop koordinat tidak match: FALLBACK ke Canvas API
   - Log ke console setiap sprite yang berhasil/gagal di-crop

3. Semua draw function harus support dua mode:
   function drawSpike(ctx, x, y, size) {
   if (sprites.spike_01) {
   ctx.drawImage(sprites.spike_01, x, y, size.w, size.h);
   } else {
   // Canvas fallback — kode triangle yang sudah ada
   }
   }

4. Scale sprite sesuai game size:
   - Original GD sprite size: 75×75px untuk cube
   - In-game player size: 36×36px
   - Scale factor: 36/75 = 0.48 — apply saat drawImage

══════════════════════════════════════════════════════
FIX 3 — GAMEPLAY AUTHENTIC GEOMETRY DASH
══════════════════════════════════════════════════════
Referensi: gameplay GD di video, BUKAN seperti Google Dino.
Perbedaan utama yang harus dipastikan ada:

A. PHYSICS CUBE MODE:

- Gravity: 0.74/frame — KONSTAN, tidak berubah
- Jump: vy = -14.2 — INSTANT, satu frame langsung naik
- Tidak ada "run-up" atau acceleration horizontal — player X tetap
- Saat landing: snap rotation ke 90° terdekat dalam 3-5 frame
- TIDAK ADA double jump (kecuali ada orb)
- Floor = GROUND_Y (konstan), tidak ada terrain berbeda ketinggian

B. KECEPATAN SCROLL:

- World scroll ke kiri di kecepatan gameSpeed px/frame
- Player X tetap di 140px — yang bergerak adalah world
- gameSpeed meningkat smooth setiap 300 score:
  score 0: speed 5.5
  score 300: speed 5.8
  score 600: speed 6.1
  dst. sampai cap di max speed level tersebut

C. OBSTACLE SPAWNING BERBASIS BEAT:
Beat interval dalam frame = (60 / BPM) × 60 (assuming 60fps)
Level 1 (170 BPM): beat = 21.2 frame → spawn setiap 2 beat = ~42 frame
Level 2 (175 BPM): beat = 20.6 frame → spawn setiap 2 beat = ~41 frame
Level 3 boss: beat sesuai BPM lagu boss (slot kosong)

BUKAN timer random — spawn obstacle SELALU pada interval kelipatan beat.
Variasi: kadang 1 beat, kadang 2 beat, kadang 4 beat (sesuai pattern level).

D. VISUAL BEAT SYNC:
Setiap beat (dari beat detection atau fallback BPM timer):

- Background: flash rgba(255,255,255, 0.05) satu frame
- Ground glow line: shadowBlur spike dari base ke base×2.5, decay 8 frame
- Player glow: shadowBlur spike naik 10px, decay 6 frame
- Parallax shapes: alpha naik 0.3, decay 5 frame
- Obstacle glow: shadowBlur +8, decay 4 frame
  Semua decay berjalan independent, tidak blocking game loop.

E. KAMERA & PARALLAX:
Tidak ada camera shake saat normal gameplay.
Camera shake HANYA saat:

- Player mati (intensity 12, decay 0.8/frame)
- Level transition (intensity 8)
- Beat pada bass drop (intensity 2, hanya selama 3 frame)

Parallax layers:

- Layer 0 (jauh): scroll 0.2× gameSpeed
- Layer 1 (tengah): scroll 0.5× gameSpeed
- Layer 2 (dekat/ground deco): scroll 1.0× gameSpeed

F. MODES (jika ada portal di level):
Saat ini cukup implementasi CUBE dan SHIP mode:
CUBE: jump dengan space/click
SHIP: tahan space/click = naik (vy -= 0.8/frame), lepas = turun (gravity normal)
Mode berganti saat player menyentuh mode portal

══════════════════════════════════════════════════════
FIX 4 — MUSIC & BEAT CONFIG UPDATE
══════════════════════════════════════════════════════
Update music-list.js:

window.MUSIC_LIST = [
{
file: 'music/level1.mp3',
name: 'Sunshine (feat. moimoi)',
artist: 'DJ Genki VS Camellia',
bpm: 170,
beatInterval: 352.9, // ms per beat = 60000/170
label: 'LEVEL 1', diff: 'EASY',
// Visual: bright, warm, WACCA sunshine energy
theme: {
bg0:'#120a1a', bg1:'#1e0f2e', bg2:'#180c22',
primary:'#ffcc00', accent:'#ff8800',
gnd0:'#3a1800', gnd1:'#200e00',
line:'#ffcc00', obC:'#ffcc00', obC2:'#ff6600', fbC:'#cc4400',
},
obstacleInterval: 42, // frames (2 beats at 170 BPM × 60fps)
minInterval: 21, // 1 beat minimum
speed: 5.5,
scoreEnd: 900,
},
{
file: 'music/level2.mp3',
name: 'Dream Away feat. Yukacco',
artist: 'DJ Noriken & DJ Genki',
bpm: 175,
beatInterval: 342.9,
label: 'LEVEL 2', diff: 'NORMAL',
theme: {
bg0:'#060018', bg1:'#0e0030', bg2:'#090022',
primary:'#7744ff', accent:'#cc88ff',
gnd0:'#180040', gnd1:'#0a0022',
line:'#8855ff', obC:'#9966ff', obC2:'#5500cc', fbC:'#6600cc',
},
obstacleInterval: 41,
minInterval: 20,
speed: 6.8,
scoreEnd: 2100,
},
{
file: 'music/boss.mp3',
name: 'Ouvertüre (FULL Ver)',
artist: 'USAO & DJ Genki feat. ルーン',
source: 'From WACCA Reverse',
bpm: 200,
beatInterval: 300, // ms per beat = 60000/200
label: 'BOSS',
diff: 'INSANE',
theme: {
bg0:'#0a0808', bg1:'#1a1000', bg2:'#120c00',
primary:'#ffe066', accent:'#ffffff',
gnd0:'#2a1e00', gnd1:'#160f00',
line:'#ffe066', obC:'#ffe066', obC2:'#ffaa00', fbC:'#cc8800',
},
obstacleInterval: 36, // 2 beat = 36 frame @ 60fps
minInterval: 18, // 1 beat minimum
speed: 9.2,
scoreEnd: Infinity,
},
];

Beat detection: gunakan AnalyserNode (fftSize=1024, smoothing=0.85).
Bass bins 0-9, threshold 1.45×average, minInterval 250ms.
Fallback: jika tidak ada audio file, gunakan timer berbasis beatInterval dari config.

══════════════════════════════════════════════════════
DELIVERY
══════════════════════════════════════════════════════

- Jangan ubah struktur folder yang sudah ada
- Semua fix bersifat additive — jangan hapus fitur yang sudah jalan
- Setelah semua fix: jalankan dan pastikan:
  1. Green orb tidak trigger death
  2. Sprite dari spritesheet terbaca (atau fallback berjalan silent)
  3. Obstacle muncul sinkron dengan beat musik
  4. Physics player terasa seperti GD asli (bukan floaty/dino-like)
