# UPDATE GDF V1.3 — PATCH KOMPREHENSIF
Ini adalah patch lanjutan dari V1.2.
Baca seluruh codebase terlebih dahulu, lalu terapkan semua fix berikut secara berurutan.
Jangan hapus fitur yang sudah berjalan. Semua perubahan bersifat additive.

Repo: https://github.com/schzophree/geometry-dash-fb-edition

---

## FIX 1 — SPRITE SALAH (PRIORITAS UTAMA)

Masalah: Player menampilkan sprite salah — muncul texture gelombang biru
(bukan cube GD asli). Ini karena koordinat atlas di spritesheet.js
tidak cocok dengan spritesheet yang dipakai.

### Solusi: Sprite Validator + Auto-fallback

Tambahkan fungsi validasi di `js/spritesheet.js`:

```js
// Setelah cropSprite(), validasi hasilnya sebelum dipakai:
async function validateAndCrop(sheet, key, rect) {
  try {
    const bitmap = await createImageBitmap(sheet, rect.x, rect.y, rect.w, rect.h);

    // Validasi: cek apakah crop menghasilkan gambar yang tidak kosong
    // Buat offscreen canvas kecil, gambar bitmap, sample beberapa pixel
    const oc = new OffscreenCanvas(rect.w, rect.h);
    const oc_ctx = oc.getContext('2d');
    oc_ctx.drawImage(bitmap, 0, 0);
    const data = oc_ctx.getImageData(rect.w/2, rect.h/2, 1, 1).data;

    // Jika pixel tengah transparan (alpha=0), crop kemungkinan salah
    if (data[3] < 10) {
      console.warn(`[Sprite] ${key}: crop area kosong/transparan → pakai fallback`);
      return null;
    }

    console.log(`[Sprite] ${key}: OK`);
    return bitmap;

  } catch (e) {
    console.warn(`[Sprite] ${key}: gagal crop → pakai fallback`, e);
    return null;
  }
}
```

### Atlas koordinat GD yang telah diverifikasi

Ganti seluruh isi ATLAS di spritesheet.js dengan koordinat ini.
PENTING: koordinat ini untuk GJ_GameSheet-hd.png versi 2.2+.
Jika spritesheet berbeda, validasi akan otomatis fallback ke Canvas.

```js
const ATLAS = {
  // PLAYER — cube default GD (75×75 per frame, grid 4 kolom)
  cube_01:      { x: 0,    y: 0,    w: 75,  h: 75  },
  cube_02:      { x: 75,   y: 0,    w: 75,  h: 75  },
  cube_03:      { x: 150,  y: 0,    w: 75,  h: 75  },
  cube_glow:    { x: 225,  y: 0,    w: 75,  h: 75  },

  // OBSTACLES
  spike_01:     { x: 0,    y: 164,  w: 55,  h: 56  },
  spike_02:     { x: 55,   y: 164,  w: 55,  h: 56  },
  block_01:     { x: 0,    y: 220,  w: 60,  h: 60  },
  block_02:     { x: 60,   y: 220,  w: 60,  h: 60  },
  block_glow:   { x: 120,  y: 220,  w: 60,  h: 60  },

  // ORBS (ring trigger)
  orb_yellow:   { x: 0,    y: 828,  w: 53,  h: 53  },
  orb_blue:     { x: 53,   y: 828,  w: 53,  h: 53  },
  orb_green:    { x: 106,  y: 828,  w: 53,  h: 53  },
  orb_red:      { x: 159,  y: 828,  w: 53,  h: 53  },
  orb_purple:   { x: 212,  y: 828,  w: 53,  h: 53  },

  // PORTALS
  portal_cube:  { x: 0,    y: 1016, w: 60,  h: 90  },
  portal_ship:  { x: 60,   y: 1016, w: 60,  h: 90  },
  portal_ball:  { x: 120,  y: 1016, w: 60,  h: 90  },

  // PADS (jump pad)
  pad_yellow:   { x: 0,    y: 934,  w: 67,  h: 30  },
  pad_pink:     { x: 67,   y: 934,  w: 67,  h: 30  },

  // GROUND
  ground_tile:  { x: 0,    y: 614,  w: 60,  h: 60  },

  // DECO
  bg_line_01:   { x: 0,    y: 1200, w: 100, h: 20  },
};
```

### Fallback Canvas untuk Player Cube (GD-style, jika sprite gagal)

Jika sprites.cube_01 null, gambar cube ini (BUKAN texture random):

```js
function drawPlayerFallback(ctx, x, y, w, h, rot, lv, beatFlash) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  ctx.rotate(rot);

  // Outer square — warna primary level
  ctx.shadowColor = lv.primary;
  ctx.shadowBlur  = 14 + beatFlash * 12;
  ctx.fillStyle   = lv.primary;
  ctx.fillRect(-w/2, -h/2, w, h);

  // Inner dark square (inset 5px)
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-w/2 + 5, -h/2 + 5, w - 10, h - 10);

  // Diagonal cross lines (GD cube detail)
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(-w/2 + 5, -h/2 + 5); ctx.lineTo(w/2 - 5, h/2 - 5);
  ctx.moveTo(w/2 - 5, -h/2 + 5);  ctx.lineTo(-w/2 + 5, h/2 - 5);
  ctx.stroke();

  // Center orb
  ctx.shadowColor = lv.accent;
  ctx.shadowBlur  = 8 + beatFlash * 6;
  ctx.fillStyle   = lv.accent;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // 4 corner dots
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = 'rgba(255,255,255,0.7)';
  const cd = w/2 - 7;
  for (const [cx,cy] of [[-cd,-cd],[cd,-cd],[-cd,cd],[cd,cd]]) {
    ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // White border
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(-w/2, -h/2, w, h);

  ctx.restore();
}
```

---

## FIX 2 — FULLSCREEN GAMEPLAY

Canvas harus mengisi seluruh viewport tanpa border hitam di sisi-sisi.

Di `index.html`:
```html
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #000;
    overflow: hidden;
    width: 100vw; height: 100vh;
  }
  #gameCanvas {
    display: block;
    width: 100vw !important;
    height: 100vh !important;
  }
</style>
```

Di `js/main.js`, ganti logika sizing:
```js
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // Recalculate semua konstanta yang bergantung pada ukuran canvas
  GROUND_Y = canvas.height - Math.round(canvas.height * 0.145); // 14.5% dari bawah
  PLAYER_X = Math.round(canvas.width * 0.175);                  // 17.5% dari kiri

  // Re-init bg shapes supaya memenuhi canvas baru
  initBg();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // panggil saat init
```

Semua hardcoded 800 dan 450 di codebase harus diganti dengan
`canvas.width` dan `canvas.height`. Cari dan ganti semua referensinya.

---

## FIX 3 — FREEZE / STUCK BUG (CRITICAL)

Masalah: game macet setelah menyentuh portal atau orb tertentu.
Player tidak mati dan tidak bisa bergerak → harus refresh.

Root cause kemungkinan:
1. State machine game_state tidak keluar dari state 'orb_active' atau 'transition'
2. AudioContext suspended setelah interaksi → game loop berhenti menunggu audio
3. Infinite loop di collision handler portal

### Perbaikan:

```js
// 1. Tambahkan guard di semua collision handler utility
let utilityCollisionLock = false;

function handleOrbCollision(orb) {
  if (utilityCollisionLock) return; // cegah double-trigger
  utilityCollisionLock = true;

  // ... logic orb ...

  // Reset lock setelah 300ms (batas waktu aman)
  setTimeout(() => { utilityCollisionLock = false; }, 300);
}

// 2. Tambahkan watchdog di game loop — jika frame skip > 500ms, reset state
let lastFrameTime = performance.now();
function gameLoop(timestamp) {
  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  // Jika delta > 500ms (game froze), paksa reset state berbahaya
  if (delta > 500 && gameState === 'transition') {
    console.warn('[Watchdog] State transition timeout → force reset to playing');
    gameState = 'playing';
    utilityCollisionLock = false;
  }

  // ... rest of game loop ...
  requestAnimationFrame(gameLoop);
}

// 3. AudioContext: jangan suspend game loop karena audio
// Pisahkan audio tick dari game loop — audio failure tidak boleh block render
function safeAudioTick() {
  try {
    if (AC && AC.state === 'running') tickAudio(currentLv);
  } catch(e) {
    console.warn('[Audio] tick error (non-fatal):', e);
  }
}
// Panggil safeAudioTick() di game loop, bukan tickAudio() langsung

// 4. Portal collision: tambahkan cooldown per portal
// Setiap portal objek punya property: lastTriggered = 0
function handlePortalCollision(portal) {
  const now = performance.now();
  if (now - portal.lastTriggered < 1000) return; // 1 detik cooldown
  portal.lastTriggered = now;
  // ... switch mode ...
}
```

---

## FIX 4 — PERFORMANCE (i5 Gen 6 / Hardware Rendah)

i5 Gen 6 = CPU lemah untuk Canvas 2D yang banyak shadowBlur.
Target: stable 60fps tanpa lag.

### Strategi optimasi:

```js
// ── A. DETEKSI PERFORMA OTOMATIS ─────────────────────────────
const perf = {
  tier: 'high', // 'high' | 'medium' | 'low'
  frameDropCount: 0,
  lastFPS: 60,
};

// Ukur FPS rata-rata dalam 3 detik pertama
// Jika < 50fps rata-rata → tier = 'medium'
// Jika < 35fps rata-rata → tier = 'low'
function detectPerfTier() {
  const samples = [];
  let last = performance.now();
  const measure = () => {
    const now = performance.now();
    samples.push(1000 / (now - last));
    last = now;
    if (samples.length < 180) { requestAnimationFrame(measure); return; }
    const avg = samples.reduce((a,b)=>a+b,0)/samples.length;
    perf.tier = avg > 50 ? 'high' : avg > 35 ? 'medium' : 'low';
    console.log(`[Perf] Tier: ${perf.tier} (avg ${avg.toFixed(1)} fps)`);
  };
  requestAnimationFrame(measure);
}

// ── B. KONFIGURASI BERDASARKAN TIER ─────────────────────────
function getPerfConfig() {
  return {
    high:   { shadowBlur: true,  particles: 30, bgShapes: 28, parallax: true  },
    medium: { shadowBlur: true,  particles: 15, bgShapes: 16, parallax: true  },
    low:    { shadowBlur: false, particles:  8, bgShapes:  8, parallax: false },
  }[perf.tier];
}

// ── C. GANTI SEMUA ctx.shadowBlur DENGAN WRAPPER INI ────────
function setGlow(ctx, color, blur) {
  if (!getPerfConfig().shadowBlur) return; // skip glow di tier low
  ctx.shadowColor = color;
  ctx.shadowBlur  = blur;
}
function clearGlow(ctx) {
  ctx.shadowBlur = 0; // selalu clear setelah draw
}

// ── D. OFFSCREEN CANVAS UNTUK BACKGROUND STATIS ─────────────
// Background grid, ground fill → gambar sekali ke offscreen canvas
// Hanya update jika level berubah atau canvas resize

let bgCache = null;
let bgCacheLv = -1;

function getBgCanvas(lv, lvIdx) {
  if (bgCache && bgCacheLv === lvIdx) return bgCache; // pakai cache

  bgCache = new OffscreenCanvas(canvas.width, canvas.height);
  const bc = bgCache.getContext('2d');

  // Gambar gradient sky
  const g = bc.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, lv.bg0); g.addColorStop(0.5, lv.bg1); g.addColorStop(1, lv.bg2);
  bc.fillStyle = g;
  bc.fillRect(0, 0, canvas.width, GROUND_Y);

  // Gambar ground fill
  const gg = bc.createLinearGradient(0, GROUND_Y+2, 0, canvas.height);
  gg.addColorStop(0, lv.gnd0); gg.addColorStop(1, lv.gnd1);
  bc.fillStyle = gg;
  bc.fillRect(0, GROUND_Y + 2, canvas.width, canvas.height);

  bgCacheLv = lvIdx;
  return bgCache;
}

// Di game loop, render bg dari cache:
// ctx.drawImage(getBgCanvas(lv, lvIdx), 0, 0);
// Lalu gambar elemen dinamis (stars, shapes, beat flash) di atasnya

// ── E. BATASI TRAIL PARTICLES ────────────────────────────────
// Max particles sesuai tier:
const MAX_TRAIL = getPerfConfig().particles;
// Di update trail: if (player.trail.length > MAX_TRAIL) player.trail.shift();

// ── F. SKIP GLOW TIAP 2 FRAME DI TIER LOW ───────────────────
// let glowFrame = 0;
// Di game loop: glowFrame++; const doGlow = perf.tier !== 'low' || glowFrame%2===0;

// ── G. GUNAKAN INTEGER COORDINATES ──────────────────────────
// Semua posisi draw: Math.round(x), Math.round(y)
// Hindari subpixel rendering yang memperlambat canvas

// ── H. HINDARI OBJECT CREATION DI GAME LOOP ─────────────────
// Pre-allocate arrays, gunakan object pooling untuk particles
// Jangan buat array baru tiap frame: obstacles.filter(...) → jalankan in-place
```

---

## FIX 5 — CHECKPOINT DALAM LEVEL

Masalah: checkpoint hanya di level transition (score 900, 2100).
User ingin: kalau kalah di level 2 atau 3, bisa lanjut dari progress terakhir.

### Sistem checkpoint tiap 25% progress dalam level:

```js
// Checkpoint tersimpan di memori (bukan localStorage)
const checkpointData = {
  saved: false,
  level: 0,
  score: 0,
  progress: 0,       // 0.0 - 1.0
  speed: 0,
  lives: 0,
  obInterval: 0,
};

// Threshold checkpoint dalam level (25%, 50%, 75%)
const CP_THRESHOLDS = [0.25, 0.50, 0.75];
let lastCpThreshold = -1;

function checkAndSaveCheckpoint() {
  const lv = MUSIC_LIST[currentLevel];
  const levelStart = currentLevel === 0 ? 0 :
                     currentLevel === 1 ? 900 : 2100;
  const levelEnd   = lv.scoreEnd === Infinity ? levelStart + 1700 : lv.scoreEnd;
  const progress   = Math.min((score - levelStart) / (levelEnd - levelStart), 1);

  for (const threshold of CP_THRESHOLDS) {
    if (progress >= threshold && lastCpThreshold < threshold) {
      lastCpThreshold = threshold;

      // Simpan checkpoint
      Object.assign(checkpointData, {
        saved: true,
        level: currentLevel,
        score: score,
        progress: progress,
        speed: gameSpeed,
        lives: lives,
        obInterval: obIvl,
      });

      // Tampilkan notifikasi "CHECKPOINT!" 2 detik
      showCheckpointNotif();
      console.log(`[Checkpoint] Saved at ${Math.round(progress*100)}%`, checkpointData);
      break;
    }
  }
}

// Panggil checkAndSaveCheckpoint() di game loop setiap frame saat playing

// Saat resume dari checkpoint:
function resumeFromCheckpoint() {
  const cp = checkpointData;
  currentLevel = cp.level;
  score        = cp.score;
  gameSpeed    = cp.speed;
  lives        = cp.lives;
  obIvl        = cp.obInterval;
  lastCpThreshold = CP_THRESHOLDS.find(t => t <= cp.progress) || -1;

  // Reset player dan obstacles
  player.x = PLAYER_X; player.y = GROUND_Y;
  player.vy = 0; player.onGround = true; player.rot = 0;
  player.trail = [];
  obstacles = [];
  fb.x = -72;

  // Putar musik level yang sesuai
  switchMusic(cp.level);

  gameState = 'playing';
}

// Di layar game over, tampilkan dua tombol jika checkpoint.saved:
// [▶ LANJUT DARI CHECKPOINT] → resumeFromCheckpoint()
// [🔄 MULAI DARI AWAL]       → fullReset()

// Reset checkpoint saat fullReset() atau kembali ke menu
function clearCheckpoint() {
  checkpointData.saved = false;
  lastCpThreshold = -1;
}
```

---

## FIX 6 — BOSS LEVEL: DAMAGE TIDAK TERDETEKSI

Masalah: di level boss, player menyentuh spike tidak ada reaksi (tidak mati/tidak damage).

Root cause: collision detection kemungkinan di-disable atau di-skip saat
`currentLevel === 2` karena boss fight logic yang override.

### Perbaikan:

```js
// Di fungsi update() atau collision loop:
// Pastikan obstacle collision TETAP berjalan di semua level termasuk boss

function checkObstacleCollision() {
  // JANGAN ada kondisi: if (currentLevel < 2) { ... }
  // Collision harus jalan di SEMUA level

  const px = player.x + 5, py = player.y + 5,
        pw = player.w - 10, ph = player.h - 10;

  for (const ob of obstacles) {
    // Skip jika tipe UTILITY
    if (ob.category === 'utility') continue;

    const hit = px < ob.x + ob.w &&
                px + pw > ob.x &&
                py < ob.y + ob.h &&
                py + ph > ob.y;

    if (hit) {
      takeDamage(); // gunakan sistem nyawa, BUKAN langsung die()
      return;
    }
  }
}

// takeDamage() — sistem nyawa
function takeDamage() {
  if (player.invincible > 0) return; // sudah invincible, skip

  lives--;
  player.invincible = 90; // 90 frame kebal = 1.5 detik

  // Flash merah
  screenFlash = { color: 'rgba(255,0,0,0.3)', duration: 8 };
  screenShake = 8;

  if (lives <= 0) {
    die();
  }
}

// Di boss level: boss sendiri juga bisa deal damage
// Jika boss dalam attack state DAN player dalam range boss mouth → takeDamage()
```

---

## FIX 7 — BOSS FACEBOOK MONSTER (REDESIGN TOTAL)

Masalah: bentuk boss jelek dan tidak sesuai estetika GD.
Lihat referensi Image 1 yang dikirim — sudah ada arahnya, tinggal disempurnakan.

### Desain Boss yang Disempurnakan (Canvas API)

Boss adalah kepala Facebook Demon raksasa yang chibi-geometric, mirip
style boss GD (Cyclops, Gatekeeper, dll). Gambar ini di `js/boss.js`:

```js
class FacebookBoss {
  constructor(canvas) {
    this.canvas  = canvas;
    this.state   = 'idle';   // 'idle' | 'attack' | 'stunned' | 'rage'
    this.hp      = 100;
    this.maxHp   = 100;
    this.frame   = 0;

    // Ukuran boss: 55% lebar canvas, posisi tengah
    this.w       = canvas.width  * 0.55;
    this.h       = canvas.height * 0.72;
    this.x       = (canvas.width - this.w) / 2;
    this.y       = canvas.height - this.h * 0.88; // muncul dari bawah

    // Animasi
    this.mouthOpen   = 0;     // 0.0 - 1.0
    this.eyePulse    = 0;
    this.bodyBob     = 0;
    this.bobDir      = 1;
    this.attackTimer = 0;
    this.rageMode    = false;
  }

  update(beatFlash) {
    this.frame++;

    // Body bob
    this.bodyBob += 0.022 * this.bobDir;
    if (Math.abs(this.bodyBob) > 8) this.bobDir *= -1;

    // Eye pulse sesuai beat
    this.eyePulse = beatFlash;

    // Mouth: buka-tutup berdasarkan state
    if (this.state === 'attack') {
      this.mouthOpen = Math.min(1, this.mouthOpen + 0.06);
    } else {
      this.mouthOpen = Math.max(0.1, this.mouthOpen - 0.04);
    }

    // Attack cycle: setiap 180 frame, boss attack
    this.attackTimer++;
    if (this.attackTimer > 180) {
      this.state = 'attack';
      this.attackTimer = 0;
    }
    if (this.state === 'attack' && this.frame % 60 === 0) {
      this.state = 'idle';
      this.spawnAttackProjectiles();
    }

    // Rage mode jika HP < 40%
    this.rageMode = this.hp < this.maxHp * 0.4;
  }

  draw(ctx) {
    const bx = this.x;
    const by = this.y + this.bodyBob;
    const bw = this.w;
    const bh = this.h;
    const cx = bx + bw / 2; // center X
    const rage = this.rageMode;

    ctx.save();

    // ── BODY: trapezoid besar, Facebook dark blue ──────────────
    const bodyColor  = rage ? '#880000' : '#1a2a6c';
    const glowColor  = rage ? '#ff2244' : '#00d4ff';
    const glowBlur   = 18 + this.eyePulse * 20;

    ctx.shadowColor  = glowColor;
    ctx.shadowBlur   = glowBlur;
    ctx.fillStyle    = bodyColor;

    // Bentuk kepala: rounded trapezoid (lebih lebar di atas)
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.04, by + bh);             // kiri bawah
    ctx.lineTo(bx,              by + bh * 0.35);       // kiri tengah
    ctx.quadraticCurveTo(bx, by, bx + bw * 0.05, by); // kiri atas (rounded)
    ctx.lineTo(bx + bw * 0.95, by);                   // kanan atas
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + bh * 0.35); // kanan atas rounded
    ctx.lineTo(bx + bw * 0.96, by + bh);              // kanan bawah
    ctx.closePath();
    ctx.fill();

    // ── TELINGA / TANDUK ───────────────────────────────────────
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = rage ? '#660000' : '#152060';

    // Tanduk kiri (segitiga geometris)
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.15, by);
    ctx.lineTo(bx + bw * 0.05, by - bh * 0.18);
    ctx.lineTo(bx + bw * 0.30, by - bh * 0.02);
    ctx.closePath(); ctx.fill();

    // Tanduk kanan
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.85, by);
    ctx.lineTo(bx + bw * 0.95, by - bh * 0.18);
    ctx.lineTo(bx + bw * 0.70, by - bh * 0.02);
    ctx.closePath(); ctx.fill();

    // ── MATA KIRI ──────────────────────────────────────────────
    const eyeY  = by + bh * 0.28;
    const eyeR  = bw * 0.115;
    const lEyeX = cx - bw * 0.22;
    const rEyeX = cx + bw * 0.22;
    const eyeGlow = rage ? '#ff4444' : '#00ffff';

    // Mata: lingkaran luar hitam
    ctx.shadowColor = eyeGlow;
    ctx.shadowBlur  = 22 + this.eyePulse * 18;
    ctx.fillStyle   = '#000000';
    ctx.beginPath(); ctx.arc(lEyeX, eyeY, eyeR, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(rEyeX, eyeY, eyeR, 0, Math.PI*2); ctx.fill();

    // Mata: ring luar warna (stroke)
    ctx.strokeStyle = eyeGlow;
    ctx.lineWidth   = eyeR * 0.18;
    ctx.beginPath(); ctx.arc(lEyeX, eyeY, eyeR * 0.85, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(rEyeX, eyeY, eyeR * 0.85, 0, Math.PI*2); ctx.stroke();

    // Mata: pupil (titik terang di dalam)
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = eyeGlow;
    const pupilR    = eyeR * 0.35 * (1 + this.eyePulse * 0.3);
    ctx.beginPath(); ctx.arc(lEyeX, eyeY, pupilR, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(rEyeX, eyeY, pupilR, 0, Math.PI*2); ctx.fill();

    // ── LOGO "f" BESAR DI DADA ─────────────────────────────────
    ctx.shadowColor = '#4267B2';
    ctx.shadowBlur  = 20 + this.eyePulse * 15;
    ctx.fillStyle   = 'rgba(255,255,255,0.9)';
    ctx.font        = `bold ${Math.round(bw * 0.22)}px 'Arial Black', Impact, Arial`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText('f', cx, by + bh * 0.62);

    // Ray lines di sekitar "f" (seperti aura)
    if (this.eyePulse > 0.5) {
      ctx.strokeStyle = `rgba(66,103,178,${this.eyePulse * 0.4})`;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 0;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + this.frame * 0.02;
        const r1 = bw * 0.12, r2 = bw * 0.22;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle)*r1, by+bh*0.62 + Math.sin(angle)*r1);
        ctx.lineTo(cx + Math.cos(angle)*r2, by+bh*0.62 + Math.sin(angle)*r2);
        ctx.stroke();
      }
    }

    // ── MULUT ──────────────────────────────────────────────────
    const mouthW  = bw * 0.48;
    const mouthH  = bh * 0.12 * (0.15 + this.mouthOpen * 0.85);
    const mouthX  = cx - mouthW / 2;
    const mouthY  = by + bh * 0.76;

    ctx.shadowColor = rage ? '#ff0000' : '#001144';
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx, mouthY, mouthW/2, mouthH/2, 0, 0, Math.PI*2);
    ctx.fill();

    // Gigi (hanya jika mulut cukup terbuka)
    if (this.mouthOpen > 0.3) {
      ctx.fillStyle   = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur  = 0;
      const toothW    = mouthW / 7;
      const toothH    = mouthH * 0.6;
      for (let t = 0; t < 6; t++) {
        const tx = mouthX + toothW * t + toothW * 0.1;
        const ty = mouthY - mouthH/2;
        // Gigi atas: segitiga
        ctx.beginPath();
        ctx.moveTo(tx, ty + toothH * this.mouthOpen);
        ctx.lineTo(tx + toothW*0.4, ty);
        ctx.lineTo(tx + toothW*0.8, ty + toothH * this.mouthOpen);
        ctx.closePath(); ctx.fill();
      }
    }

    // ── HP BAR ────────────────────────────────────────────────
    const barW = bw * 0.6, barH = 12;
    const barX = cx - barW/2, barY = by - 28;
    const hpRatio = this.hp / this.maxHp;

    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle   = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa00' : '#ff2244';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Label
    ctx.fillStyle   = 'white';
    ctx.font        = 'bold 11px Arial';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(`IBLIS FACEBOOK — ${Math.round(hpRatio*100)}%`, cx, barY + barH/2);

    ctx.restore();
  }

  spawnAttackProjectiles() {
    // Spawn 3 projectile (spike bergerak) dari mulut boss menuju player
    // Projectile: { x, y, vx, vy, type:'proj' }
    // Boss HP turun jika player berhasil menghindari semua projectile dalam 1 cycle
    for (let i = 0; i < 3; i++) {
      const spread = (i - 1) * 0.3;
      obstacles.push({
        type: 'spike',
        category: 'lethal',
        x: this.x + this.w/2,
        y: this.y + this.h * 0.76,
        w: 24, h: 30,
        vx: -(8 + i * 1.5),
        vy: spread * 4,
        isProjectile: true,
      });
    }
  }

  takeDamage(amount = 10) {
    this.hp = Math.max(0, this.hp - amount);
    this.state = 'stunned';
    // Flash putih sebentar
    setTimeout(() => {
      this.state = this.hp <= 0 ? 'dead' : 'idle';
    }, 400);
  }

  isDead() { return this.hp <= 0; }
}
```

---

## FIX 8 — MUSIC LIST UPDATE (LENGKAP)

```js
// music-list.js — VERSI FINAL

window.MUSIC_LIST = [
  {
    file: 'music/level1.mp3',
    name: 'Sunshine (feat. moimoi)',
    artist: 'DJ Genki VS Camellia',
    bpm: 170,
    beatInterval: 352.9,
    label: 'LEVEL 1', diff: 'EASY',
    theme: {
      bg0:'#050d28', bg1:'#091640', bg2:'#060e2a',
      primary:'#00d4ff', accent:'#0088ff',
      gnd0:'#0d2045', gnd1:'#07112a',
      line:'#00d4ff', obC:'#00ccff', obC2:'#0055cc', fbC:'#4267B2',
    },
    obstacleInterval: 42,
    minInterval: 21,
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
      bg0:'#1a0900', bg1:'#2a1200', bg2:'#1e0c00',
      primary:'#ffaa00', accent:'#ff6600',
      gnd0:'#361400', gnd1:'#1c0900',
      line:'#ffaa00', obC:'#ffaa00', obC2:'#ff4400', fbC:'#cc3300',
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
    beatInterval: 300,
    label: 'LEVEL 3', diff: 'BOSS',
    theme: {
      bg0:'#100008', bg1:'#1a000e', bg2:'#120008',
      primary:'#ff2288', accent:'#ffffff',
      gnd0:'#2a0012', gnd1:'#160008',
      line:'#ff2288', obC:'#ff2288', obC2:'#aa0055', fbC:'#880033',
    },
    obstacleInterval: 36,
    minInterval: 18,
    speed: 9.2,
    scoreEnd: Infinity,
    isBoss: true,
  },
];
```

*Catatan: Level 3 boss theme diubah ke pink/merah gelap agar kontras
dengan visual boss Facebook yang biru → lebih dramatis.*

---

## DELIVERY CHECKLIST

Setelah semua fix diterapkan, verifikasi:

- [ ] Player sprite = cube GD asli (bukan texture gelombang)
- [ ] Fullscreen tanpa border hitam di semua layar
- [ ] Checkpoint muncul di 25%, 50%, 75% dalam level 2 dan 3
- [ ] Game tidak freeze setelah menyentuh orb/portal
- [ ] FPS stabil di i5 Gen 6 (target 60fps, minimum 45fps)
- [ ] Spike di boss level → takeDamage() → nyawa berkurang
- [ ] Boss Facebook: kepala geometris, mata cyan glow, logo "f", gigi, HP bar
- [ ] Boss: state machine idle→attack→stunned berjalan
- [ ] Musik: level1/level2/boss.mp3 terbaca, beat sync visual aktif
- [ ] Semua fitur V1.2 sebelumnya tetap berjalan

Jangan ubah nama file atau struktur folder yang sudah ada.