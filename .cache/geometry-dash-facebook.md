# 🎮 Geometry Dash: Dikejar Icon Facebook

## Deskripsi Game

Game web berbasis **HTML5 Canvas** bergaya *Geometry Dash*, di mana pemain mengendalikan sebuah kotak/karakter yang berlari ke depan dan harus **melompati rintangan** (spike & platform). Yang membuatnya unik: **icon Facebook** terus mengejar pemain dari belakang — jika tertangkap, game over!

---

## 🗂️ Struktur Folder & File

```
geometry-dash-facebook/
│
├── index.html                  ← Halaman utama game
│
├── css/
│   └── style.css               ← Styling canvas, UI, overlay
│
├── js/
│   ├── main.js                 ← Entry point, game loop utama
│   ├── player.js               ← Logika & render pemain
│   ├── facebook.js             ← Logika & render pengejar (Facebook)
│   ├── obstacle.js             ← Spawn, update, render rintangan
│   ├── physics.js              ← Gravitasi, lompat, deteksi tabrakan
│   ├── renderer.js             ← Background, tanah, parallax
│   ├── hud.js                  ← Score, indikator bahaya, nyawa
│   ├── audio.js                ← Manajemen BGM & SFX
│   ├── ghost.js                ← 👻 Hantu screenshot status FB (BARU)
│   └── config.js               ← ⚙️ Semua nilai yang bisa dikustom
│
├── assets/
│   │
│   ├── audio/
│   │   ├── bgm/
│   │   │   ├── level1.mp3      ← Musik latar level 1
│   │   │   ├── level2.mp3      ← Musik latar level 2
│   │   │   └── boss.mp3        ← Musik saat Facebook hampir menangkap
│   │   │
│   │   └── sfx/
│   │       ├── jump.wav        ← Suara lompat
│   │       ├── hit.wav         ← Suara kena rintangan
│   │       ├── gameover.wav    ← Suara game over
│   │       ├── levelup.wav     ← Suara naik level / milestone
│   │       └── caught.wav      ← Suara ketangkep Facebook
│   │
│   ├── images/
│   │   ├── player/
│   │   │   ├── cube.png        ← Sprite karakter kotak (default)
│   │   │   ├── cube_alt.png    ← Skin alternatif karakter
│   │   │   └── trail.png       ← Efek ekor/trail karakter
│   │   │
│   │   ├── enemy/
│   │   │   ├── facebook.png        ← Icon Facebook (normal)
│   │   │   └── facebook_angry.png  ← Versi marah saat sudah dekat
│   │   │
│   │   ├── obstacles/
│   │   │   ├── spike.png       ← Sprite spike
│   │   │   ├── block.png       ← Sprite block
│   │   │   └── platform.png    ← Sprite platform melayang
│   │   │
│   │   ├── background/
│   │   │   ├── bg_layer1.png   ← Layer belakang (langit/bintang)
│   │   │   ├── bg_layer2.png   ← Layer tengah (gedung/gunung)
│   │   │   └── bg_layer3.png   ← Layer depan (tanah/detail)
│   │   │
│   │   └── ui/
│   │       ├── logo.png        ← Logo game
│   │       ├── heart.png       ← Ikon nyawa
│   │       ├── btn_play.png    ← Tombol play
│   │       └── btn_restart.png ← Tombol restart
│   │
│   └── fonts/
│       ├── game-font.ttf       ← Font utama game (pixel/retro style)
│       └── hud-font.ttf        ← Font khusus HUD & score
│
└── README.md                   ← Dokumentasi project ini
```

---

## ⚙️ `js/config.js` — Pusat Kustomisasi Developer

> File ini adalah **satu-satunya tempat** yang perlu diubah developer untuk mengatur perilaku dan tampilan game, tanpa menyentuh logika inti.

```js
// ============================================================
//  CONFIG.JS — Ubah nilai di sini untuk kustomisasi game
// ============================================================

const CONFIG = {

  // ─── CANVAS ──────────────────────────────────────────────
  canvas: {
    width: 800,
    height: 400,
    groundOffset: 60,       // Jarak permukaan tanah dari bawah canvas (px)
  },

  // ─── PEMAIN ──────────────────────────────────────────────
  player: {
    startX: 120,
    width: 40,
    height: 40,
    gravity: 0.7,
    jumpForce: -14,
    color: '#00d4ff',          // Warna kotak jika spriteEnabled = false
    spriteEnabled: true,
    sprite: 'assets/images/player/cube.png',
    trailEnabled: true,
    trailSprite: 'assets/images/player/trail.png',
  },

  // ─── PENGEJAR (FACEBOOK) ─────────────────────────────────
  facebook: {
    startX: -80,               // Posisi awal (di luar layar kiri)
    width: 50,
    height: 50,
    baseSpeed: 2.5,            // Kecepatan awal mengejar
    speedScaling: 0.001,       // Tambahan kecepatan per poin score
    catchDistance: 10,         // Jarak (px) dianggap menangkap pemain
    angryThreshold: 150,       // Jarak (px) untuk tampilkan sprite marah
    sprite: 'assets/images/enemy/facebook.png',
    spriteAngry: 'assets/images/enemy/facebook_angry.png',
    spriteEnabled: true,
  },

  // ─── RINTANGAN ───────────────────────────────────────────
  obstacles: {
    startInterval: 90,         // Frame antar rintangan di awal
    minInterval: 40,           // Interval minimum (makin susah = makin kecil)
    types: ['spike', 'block', 'platform'],
    spike: {
      width: 30,
      height: 40,
      color: '#ff6b6b',
      sprite: 'assets/images/obstacles/spike.png',
    },
    block: {
      width: 40,
      height: 60,
      color: '#f9ca24',
      sprite: 'assets/images/obstacles/block.png',
    },
    platform: {
      width: 80,
      height: 20,
      color: '#6ab04c',
      sprite: 'assets/images/obstacles/platform.png',
      floatHeight: 100,        // Ketinggian platform dari tanah (px)
    },
  },

  // ─── KECEPATAN GAME ──────────────────────────────────────
  speed: {
    initial: 4,
    increment: 0.5,            // Tambahan kecepatan per milestone
    milestoneEvery: 500,       // Setiap sekian score, kecepatan naik
  },

  // ─── AUDIO ───────────────────────────────────────────────
  audio: {
    enabled: true,
    bgmVolume: 0.4,            // 0.0 – 1.0
    sfxVolume: 0.7,
    bgm: {
      level1: 'assets/audio/bgm/level1.mp3',
      level2: 'assets/audio/bgm/level2.mp3',
      boss:   'assets/audio/bgm/boss.mp3',
    },
    sfx: {
      jump:     'assets/audio/sfx/jump.wav',
      hit:      'assets/audio/sfx/hit.wav',
      gameover: 'assets/audio/sfx/gameover.wav',
      levelup:  'assets/audio/sfx/levelup.wav',
      caught:   'assets/audio/sfx/caught.wav',
    },
  },

  // ─── BACKGROUND / PARALLAX ───────────────────────────────
  background: {
    parallax: true,
    layers: [
      { src: 'assets/images/background/bg_layer1.png', speed: 0.2 },
      { src: 'assets/images/background/bg_layer2.png', speed: 0.5 },
      { src: 'assets/images/background/bg_layer3.png', speed: 1.0 },
    ],
    // Digunakan saat gambar belum tersedia
    fallbackGradient: ['#0f0c29', '#302b63'],
  },

  // ─── FONT ────────────────────────────────────────────────
  fonts: {
    game: 'assets/fonts/game-font.ttf',
    hud:  'assets/fonts/hud-font.ttf',
    fallback: 'Arial',
  },

  // ─── HUD ─────────────────────────────────────────────────
  hud: {
    showScore: true,
    showDangerIndicator: true,
    showSpeed: false,          // Aktifkan untuk keperluan debug
    dangerColor: '#ff4444',
    safeColor:   '#00ff88',
  },

  // ─── GAMEPLAY ────────────────────────────────────────────
  gameplay: {
    lives: 3,                  // Jumlah nyawa (0 = infinite)
    invincibleFrames: 90,      // Frame kebal setelah kena rintangan
    checkpointEvery: 1000,     // Score per checkpoint (0 = nonaktif)
  },

  // ─── HANTU STATUS FB 👻 ──────────────────────────────────
  ghost: {
    enabled: true,
    intervalMin: 300,          // Frame minimum sebelum hantu muncul lagi
    intervalMax: 700,          // Frame maksimum (munculnya acak)
    fadeSpeed: 0.018,          // Kecepatan fade in/out (makin kecil = makin lambat)
    holdDuration: 160,         // Frame hantu diam di layar (penuh kelihatan)
    maxAlpha: 0.82,            // Opacity puncak hantu (0.0 - 1.0)
    bobAmplitude: 6,           // Pixel naik-turun animasi melayang
    bobSpeed: 0.025,           // Kecepatan naik-turun
    glowColor: 'rgba(150, 200, 255, 0.7)', // Warna aura hantu
    glowBlur: 22,              // Intensitas blur aura
    messages: [                // Isi status yang muncul (random tiap spawn)
      ['ngapain ngoding,', 'mending scroll fesnuk 😂'],
      ['deadline besok?', 'ya scroll aja dulu 😌'],
      ['bug belum kelar?', 'fesnuk dulu 5 menit 🙃'],
      ['ngoding dari tadi,', 'istirahat fesnuk yuk 😴'],
    ],
  },

};
```

---

## 📄 `index.html`

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Geometry Dash — Dikejar Facebook</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="wrapper">
    <canvas id="gameCanvas"></canvas>
    <div id="ui">
      <span id="scoreDisplay">Score: 0</span>
      <span id="dangerDisplay" class="safe">🟢 Aman</span>
    </div>
  </div>

  <!-- Urutan load penting: config dulu, baru modul lain -->
  <script src="js/config.js"></script>
  <script src="js/audio.js"></script>
  <script src="js/renderer.js"></script>
  <script src="js/player.js"></script>
  <script src="js/facebook.js"></script>
  <script src="js/obstacle.js"></script>
  <script src="js/ghost.js"></script>
  <script src="js/hud.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

---

## 📄 `css/style.css`

```css
@font-face {
  font-family: 'GameFont';
  src: url('../assets/fonts/game-font.ttf');
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-family: 'GameFont', 'Arial', sans-serif;
  color: white;
}

#wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

canvas {
  border: 3px solid #4267B2;
  border-radius: 8px;
  box-shadow: 0 0 30px #4267B2aa;
  display: block;
}

#ui {
  display: flex;
  gap: 30px;
  font-size: 18px;
  letter-spacing: 2px;
}

#dangerDisplay.danger {
  color: #ff4444;
  animation: pulse 0.4s infinite;
}
#dangerDisplay.safe {
  color: #00ff88;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

---

## 📄 `js/audio.js`

```js
// audio.js — Manajemen semua suara game

const sounds = {};

function loadAudio() {
  if (!CONFIG.audio.enabled) return;

  // Load SFX
  Object.entries(CONFIG.audio.sfx).forEach(([key, src]) => {
    const audio = new Audio(src);
    audio.volume = CONFIG.audio.sfxVolume;
    sounds[key] = audio;
  });

  // Load BGM
  Object.entries(CONFIG.audio.bgm).forEach(([key, src]) => {
    const audio = new Audio(src);
    audio.volume = CONFIG.audio.bgmVolume;
    audio.loop = true;
    sounds[`bgm_${key}`] = audio;
  });
}

let currentBGM = null;

function playBGM(key) {
  if (!CONFIG.audio.enabled) return;
  if (currentBGM) { currentBGM.pause(); currentBGM.currentTime = 0; }
  currentBGM = sounds[`bgm_${key}`];
  currentBGM?.play().catch(() => {}); // abaikan autoplay policy error
}

function playSFX(key) {
  if (!CONFIG.audio.enabled) return;
  const sfx = sounds[key];
  if (sfx) { sfx.currentTime = 0; sfx.play().catch(() => {}); }
}

loadAudio();
```

---

## 📄 `js/renderer.js`

```js
// renderer.js — Background & efek parallax

const bgLayers = CONFIG.background.layers.map(layer => {
  const img = new Image();
  img.src = layer.src;
  return { img, speed: layer.speed, x: 0 };
});

function renderBackground(ctx) {
  const W = CONFIG.canvas.width;
  const H = CONFIG.canvas.height;
  const groundY = H - CONFIG.canvas.groundOffset;

  const allLoaded = bgLayers.every(l => l.img.complete && l.img.naturalWidth > 0);

  if (CONFIG.background.parallax && allLoaded) {
    bgLayers.forEach(layer => {
      layer.x -= layer.speed;
      if (layer.x <= -W) layer.x = 0;
      ctx.drawImage(layer.img, layer.x, 0, W, H);
      ctx.drawImage(layer.img, layer.x + W, 0, W, H);
    });
  } else {
    // Fallback gradient jika gambar belum ada
    const [c1, c2] = CONFIG.background.fallbackGradient;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Render tanah
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(0, groundY + 40, W, H);
  ctx.fillStyle = '#4267B2';
  ctx.fillRect(0, groundY + 38, W, 4);
}
```

---

## 📄 `js/player.js`

```js
// player.js — State & render pemain

const playerImg = new Image();
playerImg.src = CONFIG.player.sprite;

const playerState = {
  x: CONFIG.player.startX,
  y: 0,
  w: CONFIG.player.width,
  h: CONFIG.player.height,
  vy: 0,
  onGround: true,
  rotation: 0,
};

function resetPlayer() {
  const groundY = CONFIG.canvas.height - CONFIG.canvas.groundOffset;
  playerState.y = groundY;
  playerState.vy = 0;
  playerState.onGround = true;
  playerState.rotation = 0;
}

function jumpPlayer() {
  if (playerState.onGround) {
    playerState.vy = CONFIG.player.jumpForce;
    playerState.onGround = false;
    playSFX('jump');
  }
}

function updateAndDrawPlayer(ctx) {
  const groundY = CONFIG.canvas.height - CONFIG.canvas.groundOffset;

  playerState.vy += CONFIG.player.gravity;
  playerState.y  += playerState.vy;

  if (playerState.y >= groundY) {
    playerState.y = groundY;
    playerState.vy = 0;
    playerState.onGround = true;
  }

  if (!playerState.onGround) playerState.rotation += 0.1;

  ctx.save();
  ctx.translate(
    playerState.x + playerState.w / 2,
    playerState.y + playerState.h / 2
  );
  ctx.rotate(playerState.rotation);

  if (CONFIG.player.spriteEnabled && playerImg.complete && playerImg.naturalWidth > 0) {
    ctx.drawImage(playerImg, -playerState.w / 2, -playerState.h / 2, playerState.w, playerState.h);
  } else {
    ctx.fillStyle = CONFIG.player.color;
    ctx.fillRect(-playerState.w / 2, -playerState.h / 2, playerState.w, playerState.h);
    ctx.fillStyle = 'white';
    ctx.fillRect(-playerState.w / 4, -playerState.h / 4, playerState.w / 2, playerState.h / 2);
  }

  ctx.restore();
}
```

---

## 📄 `js/facebook.js`

```js
// facebook.js — Pengejar icon Facebook

const fbImg      = new Image();
const fbImgAngry = new Image();
fbImg.src        = CONFIG.facebook.sprite;
fbImgAngry.src   = CONFIG.facebook.spriteAngry;

const fbState = {
  x: CONFIG.facebook.startX,
  y: 0,
  w: CONFIG.facebook.width,
  h: CONFIG.facebook.height,
};

function resetFacebook() {
  fbState.x = CONFIG.facebook.startX;
  fbState.y = CONFIG.canvas.height - CONFIG.canvas.groundOffset;
}

function updateAndDrawFacebook(ctx, score) {
  const targetX = playerState.x - 80;
  const speed   = CONFIG.facebook.baseSpeed + score * CONFIG.facebook.speedScaling;

  if (fbState.x < targetX) fbState.x += speed;

  const dist    = playerState.x - fbState.x;
  const isAngry = dist < CONFIG.facebook.angryThreshold;
  const img     = isAngry ? fbImgAngry : fbImg;

  ctx.save();
  ctx.translate(fbState.x + fbState.w / 2, fbState.y + fbState.h / 2);

  if (CONFIG.facebook.spriteEnabled && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -fbState.w / 2, -fbState.h / 2, fbState.w, fbState.h);
  } else {
    // Fallback: gambar manual canvas
    ctx.beginPath();
    ctx.arc(0, 0, fbState.w / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#4267B2';
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = `bold ${fbState.w * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', 3, 2);

    if (isAngry) {
      ctx.fillStyle = '#ff4444';
      ctx.beginPath(); ctx.arc(-8, -8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -8, 5, 0, Math.PI * 2);  ctx.fill();
    }
  }

  ctx.restore();
}

function checkFacebookCatch() {
  const dist = playerState.x - fbState.x;
  if (dist < CONFIG.facebook.catchDistance + fbState.w) gameOver();
}
```

---

## 📄 `js/obstacle.js`

```js
// obstacle.js — Spawn & render rintangan

let obstacles = [];

function spawnObstacle(canvasW) {
  const groundY = CONFIG.canvas.height - CONFIG.canvas.groundOffset;
  const types   = CONFIG.obstacles.types;
  const type    = types[Math.floor(Math.random() * types.length)];
  const cfg     = CONFIG.obstacles[type];

  const img = new Image();
  img.src = cfg.sprite;

  obstacles.push({
    type, img,
    x: canvasW + 20,
    y: type === 'platform' ? groundY - cfg.floatHeight : groundY,
    w: cfg.width,
    h: cfg.height,
    color: cfg.color,
  });
}

function updateAndDrawObstacles(ctx, speed) {
  for (const obs of obstacles) {
    obs.x -= speed;

    if (obs.img.complete && obs.img.naturalWidth > 0) {
      ctx.drawImage(obs.img, obs.x, obs.y, obs.w, obs.h);
    } else {
      ctx.fillStyle = obs.color;
      if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.h);
        ctx.lineTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      }
    }
  }
  obstacles = obstacles.filter(o => o.x + o.w > -50);
}

function checkObstacleCollisions() {
  const p = playerState;
  for (const obs of obstacles) {
    if (
      p.x < obs.x + obs.w &&
      p.x + p.w > obs.x &&
      p.y < obs.y + obs.h &&
      p.y + p.h > obs.y
    ) { gameOver(); break; }
  }
}

function resetObstacles() { obstacles = []; }
```

---

## 📄 `js/ghost.js` ✨ BARU

```js
// ghost.js — Hantu screenshot status Facebook yang menghantui pemain

// ─── State ───────────────────────────────────────────────────────────────────
let ghostState = {
  active:       false,
  phase:        'idle',   // 'idle' | 'fadein' | 'hold' | 'fadeout'
  alpha:        0,
  holdTimer:    0,
  triggerTimer: 0,
  nextTrigger:  0,        // di-set saat resetGhost()
  x:            0,
  y:            0,
  bobOffset:    0,
  bobDir:       1,
  currentMsg:   null,     // ['baris1', 'baris2'] pilihan random tiap spawn
};

// ─── Public API ──────────────────────────────────────────────────────────────

function resetGhost() {
  const cfg = CONFIG.ghost;
  Object.assign(ghostState, {
    active: false, phase: 'idle', alpha: 0,
    holdTimer: 0, triggerTimer: 0, bobOffset: 0, bobDir: 1,
    nextTrigger: cfg.intervalMin +
                 Math.random() * (cfg.intervalMax - cfg.intervalMin),
  });
}

function updateAndDrawGhost(ctx, canvas) {
  if (!CONFIG.ghost.enabled) return;
  const cfg = CONFIG.ghost;

  // ── Timer & spawn trigger ─────────────────────────────────
  if (!ghostState.active) {
    ghostState.triggerTimer++;
    if (ghostState.triggerTimer >= ghostState.nextTrigger) {
      _spawnGhost(canvas, cfg);
    }
    return;
  }

  // ── Update fase ──────────────────────────────────────────
  switch (ghostState.phase) {
    case 'fadein':
      ghostState.alpha += cfg.fadeSpeed;
      if (ghostState.alpha >= cfg.maxAlpha) {
        ghostState.alpha = cfg.maxAlpha;
        ghostState.phase = 'hold';
      }
      break;

    case 'hold':
      ghostState.holdTimer++;
      if (ghostState.holdTimer >= cfg.holdDuration) {
        ghostState.phase = 'fadeout';
      }
      break;

    case 'fadeout':
      ghostState.alpha -= cfg.fadeSpeed;
      if (ghostState.alpha <= 0) {
        ghostState.alpha = 0;
        ghostState.active = false;
        ghostState.phase  = 'idle';
        // Set jadwal kemunculan berikutnya
        ghostState.triggerTimer = 0;
        ghostState.nextTrigger  = cfg.intervalMin +
          Math.random() * (cfg.intervalMax - cfg.intervalMin);
      }
      break;
  }

  // ── Animasi melayang (bob) ───────────────────────────────
  ghostState.bobOffset += cfg.bobSpeed * ghostState.bobDir;
  if (Math.abs(ghostState.bobOffset) >= cfg.bobAmplitude) ghostState.bobDir *= -1;

  // ── Render ───────────────────────────────────────────────
  _drawGhostPost(
    ctx,
    ghostState.x,
    ghostState.y + ghostState.bobOffset,
    ghostState.alpha,
    ghostState.currentMsg,
    cfg,
  );
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function _spawnGhost(canvas, cfg) {
  const W = 300, H = 130;   // Lebar & tinggi kartu

  ghostState.active      = true;
  ghostState.phase       = 'fadein';
  ghostState.alpha       = 0;
  ghostState.holdTimer   = 0;
  ghostState.triggerTimer = 0;
  ghostState.bobOffset   = 0;
  ghostState.bobDir      = 1;

  // Posisi acak — masih di dalam canvas, hindari terlalu bawah
  ghostState.x = 40 + Math.random() * (canvas.width  - W - 80);
  ghostState.y = 30 + Math.random() * (canvas.height - H - 80);

  // Pilih pesan random dari daftar
  const msgs = cfg.messages;
  ghostState.currentMsg = msgs[Math.floor(Math.random() * msgs.length)];
}

function _drawGhostPost(ctx, x, y, alpha, msg, cfg) {
  const W = 300, H = 130, R = 12;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── Glow / aura hantu ────────────────────────────────────
  ctx.shadowColor = cfg.glowColor;
  ctx.shadowBlur  = cfg.glowBlur;

  // ── Kartu Facebook-style ─────────────────────────────────
  // Background kartu (transparan kebiruan, kayak hantu)
  ctx.fillStyle   = 'rgba(230, 236, 255, 0.12)';
  ctx.strokeStyle = 'rgba(180, 210, 255, 0.45)';
  ctx.lineWidth   = 1.5;
  _roundRect(ctx, x, y, W, H, R);
  ctx.fill();
  ctx.stroke();

  // Hilangkan shadow setelah kartu supaya teks tidak blur berlebihan
  ctx.shadowBlur = 0;

  // ── Avatar FB ────────────────────────────────────────────
  ctx.fillStyle = 'rgba(66, 103, 178, 0.55)';
  ctx.beginPath();
  ctx.arc(x + 30, y + 30, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle   = 'rgba(255, 255, 255, 0.8)';
  ctx.font        = 'bold 20px Arial';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('f', x + 30, y + 31);

  // ── Nama & timestamp ────────────────────────────────────
  ctx.textAlign   = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = 'rgba(190, 215, 255, 0.95)';
  ctx.font      = 'bold 13px Arial';
  ctx.fillText('Facebook', x + 57, y + 24);

  ctx.fillStyle = 'rgba(170, 195, 230, 0.65)';
  ctx.font      = '11px Arial';
  ctx.fillText('Barusan · 🌐', x + 57, y + 40);

  // ── Teks status (2 baris, dari config.ghost.messages) ───
  ctx.fillStyle = 'rgba(225, 238, 255, 0.97)';
  ctx.font      = '14px Arial';
  ctx.fillText(msg[0], x + 18, y + 68);
  ctx.fillText(msg[1], x + 18, y + 88);

  // ── Divider tipis ────────────────────────────────────────
  ctx.strokeStyle = 'rgba(180, 210, 255, 0.2)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 100);
  ctx.lineTo(x + W - 16, y + 100);
  ctx.stroke();

  // ── Reaction bar ────────────────────────────────────────
  ctx.fillStyle = 'rgba(170, 195, 230, 0.6)';
  ctx.font      = '11px Arial';
  ctx.fillText('👍 Suka   💬 Komentar   ↗️ Bagikan', x + 18, y + 118);

  ctx.restore();
}

// Utility: gambar rounded rectangle tanpa path library external
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}
```

---

## 📄 `js/hud.js`

```js
// hud.js — Score, indikator bahaya, game over screen

function drawHUD(ctx, score) {
  const cfg = CONFIG.hud;

  ctx.save();
  ctx.font = `bold 20px ${CONFIG.fonts.fallback}`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';

  if (cfg.showScore) ctx.fillText(`Score: ${score}`, 20, 30);
  if (cfg.showSpeed) ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 20, 58);

  if (cfg.showDangerIndicator) {
    const dist = playerState.x - fbState.x;
    const el   = document.getElementById('dangerDisplay');
    if (el) {
      const isDanger = dist < 150;
      el.textContent = isDanger ? '🔴 BAHAYA!' : '🟢 Aman';
      el.className   = isDanger ? 'danger' : 'safe';
    }
  }

  ctx.restore();
}

function showGameOverScreen(ctx, canvas, score) {
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = `bold 48px ${CONFIG.fonts.fallback}`;
  ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = 'white';
  ctx.font = `24px ${CONFIG.fonts.fallback}`;
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText('Kamu ketangkep Facebook! 😱', canvas.width / 2, canvas.height / 2 + 45);
  ctx.fillText('Tekan ENTER / Tap untuk main lagi', canvas.width / 2, canvas.height / 2 + 80);

  ctx.textAlign = 'left';
}
```

---

## 📄 `js/main.js`

```js
// main.js — Entry point & game loop

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

canvas.width  = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

let score            = 0;
let gameSpeed        = CONFIG.speed.initial;
let running          = false;
let animId           = null;
let obstacleTimer    = 0;
let obstacleInterval = CONFIG.obstacles.startInterval;

function gameLoop() {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderBackground(ctx);
  updateAndDrawObstacles(ctx, gameSpeed);
  updateAndDrawFacebook(ctx, score);
  updateAndDrawPlayer(ctx);
  updateAndDrawGhost(ctx, canvas);   // 👻 hantu status FB
  drawHUD(ctx, score);

  checkObstacleCollisions();
  checkFacebookCatch();

  obstacleTimer++;
  if (obstacleTimer >= obstacleInterval) {
    spawnObstacle(canvas.width);
    obstacleTimer = 0;
    obstacleInterval = Math.max(CONFIG.obstacles.minInterval, obstacleInterval - 1);
  }

  score++;
  if (score % CONFIG.speed.milestoneEvery === 0) {
    gameSpeed += CONFIG.speed.increment;
    playSFX('levelup');
  }

  animId = requestAnimationFrame(gameLoop);
}

function startGame() {
  score            = 0;
  gameSpeed        = CONFIG.speed.initial;
  obstacleTimer    = 0;
  obstacleInterval = CONFIG.obstacles.startInterval;

  resetPlayer();
  resetFacebook();
  resetObstacles();
  resetGhost();                      // 👻 reset hantu

  running = true;
  playBGM('level1');
  gameLoop();
}

function gameOver() {
  running = false;
  cancelAnimationFrame(animId);
  playSFX('caught');
  showGameOverScreen(ctx, canvas, score);
}

// ─── Kontrol ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') jumpPlayer();
  if (e.code === 'Enter' && !running) startGame();
});
canvas.addEventListener('click', () => {
  if (!running) startGame();
  else jumpPlayer();
});

// Mulai
startGame();
```

---

## 🚀 Cara Menjalankan

```bash
# WAJIB pakai local server agar audio & gambar bisa dimuat

# Opsi 1 — VS Code (paling mudah)
# Install ekstensi "Live Server" → klik kanan index.html → Open with Live Server

# Opsi 2 — Python
python -m http.server 8080
# Buka: http://localhost:8080

# Opsi 3 — Node.js
npx serve .
# Buka: http://localhost:3000
```

> ⚠️ **Jangan buka `index.html` langsung** (double-click) karena browser memblokir load audio & gambar lokal via protokol `file://`.

---

## 🕹️ Kontrol

| Tombol | Aksi |
|---|---|
| `Spasi` | Lompat |
| `↑ ArrowUp` | Lompat |
| `Klik / Tap` | Lompat |
| `Enter` | Restart (saat Game Over) |

---

## 🎯 Panduan Kustomisasi Cepat

| Yang ingin diubah | Caranya |
|---|---|
| Ganti musik | Taruh `.mp3` di `assets/audio/bgm/`, update path di `config.js` |
| Ganti suara efek | Taruh `.wav` di `assets/audio/sfx/`, update path di `config.js` |
| Ganti sprite pemain | Taruh `.png` di `assets/images/player/`, update `CONFIG.player.sprite` |
| Ganti icon Facebook | Taruh `.png` di `assets/images/enemy/`, update `CONFIG.facebook.sprite` |
| Tambah background | Taruh layer `.png` di `assets/images/background/`, daftarkan di `CONFIG.background.layers` |
| Ubah tingkat kesulitan | Main-main di `CONFIG.speed`, `CONFIG.obstacles.startInterval`, `CONFIG.facebook.baseSpeed` |
| Nonaktifkan audio | Set `CONFIG.audio.enabled = false` |
| Aktifkan debug info | Set `CONFIG.hud.showSpeed = true` |
| Tambah tipe rintangan baru | Edit `obstacle.js` + tambahkan entri di `CONFIG.obstacles` |
| **Ubah pesan hantu** | **Edit array `CONFIG.ghost.messages` — tiap entri = `['baris1', 'baris2']`** |
| **Ubah frekuensi hantu** | **Naikkan `CONFIG.ghost.intervalMin/Max` = lebih jarang, turunkan = lebih sering** |
| **Matikan hantu** | **Set `CONFIG.ghost.enabled = false`** |

---

## 📝 Catatan Penting

- Game ini **100% vanilla HTML/CSS/JS** — tidak butuh library atau build tool apapun.
- Semua sprite & audio bersifat **opsional** — jika file tidak ditemukan, game otomatis pakai fallback yang digambar via Canvas API.
- Cocok di-host gratis di **GitHub Pages**, **Netlify**, atau **Vercel** — cukup push folder ini ke repo.
- 👻 Hantu status FB sepenuhnya **digambar via Canvas API** — tidak butuh asset gambar tambahan apapun.

---

## 👻 Cara Kerja Fitur Hantu (Ghost Status FB)

Fitur ini hidup sepenuhnya di `js/ghost.js` dan dikontrol dari `CONFIG.ghost`.

**Alur hidup hantu per kemunculan:**

```
[idle] → triggerTimer >= nextTrigger
       → [fadein]  alpha naik dari 0 ke maxAlpha
       → [hold]    diam di layar selama holdDuration frame
       → [fadeout] alpha turun ke 0
       → [idle]    jadwal kemunculan berikutnya di-set acak
```

**Animasi:**
- **Melayang (bob):** posisi Y naik-turun ±`bobAmplitude` px secara sinusoidal
- **Glow / aura:** `ctx.shadowColor` + `ctx.shadowBlur` memberi efek cahaya biru hantu
- **Transparansi:** `ctx.globalAlpha` mengontrol seluruh kartu sekaligus

**Pesan:**
Array `CONFIG.ghost.messages` bisa diisi sebanyak apapun. Setiap muncul, hantu memilih satu secara acak — jadi pemain tidak bosan lihat teks yang sama terus.

---

*Dibuat dengan ❤️ — lari terus, jangan sampai kena notifikasi Facebook!* 🏃💨📘
