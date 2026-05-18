---
name: fesnuk-dash
description: >
  Partner Coding Skill untuk proyek game "Fesnuk Dash" — remake Geometry Dash Lite berbasis
  Vanilla JavaScript (ES6+ Modules) + HTML5 Canvas API + CSS murni (tanpa build tool) + Web Audio API.
  GUNAKAN skill ini setiap kali pengguna meminta bantuan coding pada game ini: menambah fitur baru,
  debug, visual/animasi, responsivitas desktop/HP, obstacle baru, HUD, audio, sistem level,
  sistem nyawa, death screen, motivasi ngauwor, atau pertanyaan apapun tentang arsitektur game.
  Trigger WAJIB saat pengguna menyebut: "fesnuk dash", "geometry dash", "game vanilla js",
  "lanjutkan kode game", "perbaiki game", "tambah fitur", "tambah obstacle", "karakter melompat",
  "responsif game", "antigravity", "portal", "level baru", "bgm game", "nyawa game",
  "death screen", "pause game", "progress bar game", "ngauwor", "tolong", "yaampun", "skill issue", "oke", "astaga", "bagaimana ", "coba ", "fix ", "game fesnuk ", "fesnuk", "bug ", "aneh ", "kok ", "kenapa ", "gimana ", "jir", "njir", "wkwk", "wkwkwk", "wkwkwkwk", "wkwkwkwkwk", "wkwkwkwkwkwk", "wkwkwkwkwkwkwk", "dongo", "masih ", "kok gerakannya aneh ", " kok beda", "benerin ", "bagaimana ", "coba ", "gimana ", "kok ", "hilangkan ". Skill ini memastikan
  TIDAK perlu bertanya ulang konteks proyek — langsung bantu, token hemat, sesi efisien.
---

# Fesnuk Dash — Partner Coding Skill

Kamu adalah **Partner Coding senior** yang sudah hafal luar-dalam proyek ini.
**Jangan tanya ulang konteks dasar. Langsung bantu** sesuai stack dan konvensi di bawah.

---

## 🗂️ Struktur Proyek

```
geometridash/
├── assets/
│   ├── audio/
│   │   └── bgm/
│   │       ├── boss.mp3          ← Ref: music-list.js
│   │       ├── level1.mp3        ← Ref: music-list.js
│   │       └── level2.mp3        ← Ref: music-list.js
│   ├── fonts/
│   │   └── pusab.otf             ← Ref: style.css (@font-face)
│   └── ui/
│       ├── fesnuk_edition.png    ← Ref: index.html (splash screen)
│       └── loading_logo.png      ← Ref: index.html (loading)
├── js/
│   ├── main.js                   ← Entry point (type="module"), ref: index.html
│   └── ...                       ← Modul logika game (ES6 Modules, saling import)
├── assets/plan.assets/
│   └── Texture2D/                ← Asset sprite mentah dari pipeline
├── index.html                    ← File HTML utama
├── music-list.js                 ← Daftar track BGM & tema per level
└── style.css                     ← Styling global + animasi GD-style
```

> **Catatan aset:** Sprite sheet dan texture mentah tersedia di `assets/plan.assets/Texture2D/`.
> Selalu cek folder ini sebelum menyarankan membuat grafis dari scratch.

---

## ⚙️ Tech Stack & Aturan Wajib

| Aspek          | Keputusan Proyek                                                             |
| -------------- | ---------------------------------------------------------------------------- |
| **Engine**     | Vanilla JS — BUKAN Phaser, BUKAN Three.js                                    |
| **Rendering**  | HTML5 Canvas API (`CanvasRenderingContext2D`)                                |
| **Modul**      | ES6 Modules (`type="module"`) — `import`/`export` antar file di `js/`        |
| **Styling**    | CSS murni — TANPA Tailwind, TANPA framework                                  |
| **Audio**      | Web Audio API (`AudioContext`) — BUKAN `<audio>` tag biasa untuk BGM         |
| **Build Tool** | ❌ TIDAK ADA — tidak ada webpack/vite/rollup                                 |
| **Server**     | Wajib HTTP (`python -m http.server 8080`) — `file://` AKAN GAGAL karena CORS |

### Konvensi Import (contoh benar)

```js
// js/main.js
import { Player } from "./player.js";
import { Level } from "./level.js";
import { AudioManager } from "./audio.js";
```

---

## 🎮 Sistem Game — Referensi Cepat

### HUD

- **Progress bar**: horizontal di bagian atas canvas, warna emas (`#FFD700`), titik bulat di ujung kanan
- **Tombol Pause**: ikon lingkaran di pojok kanan atas
- Semua elemen HUD: posisi tetap terhadap viewport (bukan dunia game) → gunakan koordinat canvas langsung, bukan koordinat dunia
- Z-order: render HUD TERAKHIR agar selalu di atas semua objek

### Death System

1. Flash putih penuh layar + efek shake kamera (translate canvas +/- N px)
2. **12 kotak kecil kuning** terbang ke segala arah (tween manual dengan `requestAnimationFrame`, BUKAN particle engine)
3. Player `visible = false` + physics pause
4. Delay **700ms** → tampilkan overlay "NEW BEST! X%" bergaya Geometry Dash
5. Restart via: `SPACE` / `R` / tap layar
6. **Motivasi Ngauwor** muncul acak di death screen, contoh:
   - _"ngapain ngoding, mending scroll fesnuk😹"_
   - _"skill issue detected 💀"_
   - _"touch grass dulu bro"_
   - _"lu kalah lagi? sad 😔"_
   - _(tambah lebih banyak di array `ngauworQuotes` di modul death)_

### Sistem Nyawa

- Default: **5 nyawa** saat mulai
- Nyawa bisa **bertambah bebas** (dari collectible, achievement, dll.)
- Saat nyawa habis (0): game over total, bukan sekadar restart level
- Simpan state nyawa di variabel global/state manager yang dapat diakses semua modul

### Audio (Web Audio API)

- BGM dikelola via `music-list.js` → mapping `levelId → file path`
- Pattern: `AudioContext` → `fetch()` audio → `decodeAudioData()` → `BufferSourceNode`
- Pause/resume: simpan `AudioContext.currentTime` offset
- SFX (lompat, mati, koin): `AudioBuffer` pendek, trigger on-demand

---

## 🧱 Obstacle & Mekanik — Panduan Implementasi

### Obstacle yang Sudah Ada / Direncanakan

_(Update bagian ini setiap kali obstacle baru ditambahkan)_

| Obstacle         | Deskripsi                                  | Status          |
| ---------------- | ------------------------------------------ | --------------- |
| Spike            | Segitiga mematikan di lantai/langit-langit | Planned         |
| Block            | Kotak solid, bisa diinjak atau membunuh    | Planned         |
| Portal           | Mengubah mode gravity / ukuran player      | Planned         |
| Antigravity Zone | Area yang membalik gravitasi player        | **FITUR UTAMA** |

### Mekanik Antigravity (Fitur Inti Skill Ini)

```js
// Contoh logika antigravity di player.js
if (player.inAntigravityZone) {
  player.gravity = -GRAVITY_CONSTANT; // balik gravitasi
  player.jumpDir = 1; // lompat ke bawah
} else {
  player.gravity = GRAVITY_CONSTANT;
  player.jumpDir = -1; // lompat ke atas
}
```

- Portal antigravity: collision trigger → toggle `player.inAntigravityZone`
- Visual indicator: warna aura player berubah (normal: kuning, antigravity: ungu/biru)
- Partikel manual saat masuk portal (lingkaran kecil menyebar)
- Monster facebook di assets\images\enemy\fb_monster.png seperti mengejar kita tetapi tidak dapat disentuh, jangan sampai berdempetan sama sekali dengan pengguna player kita
- player kita menggunakan assets\images\player\characters\player.png
- gunakan assets icon atau gambar yang ada di folder plan.assets\Texture2D (kalau error gunakan sistem fallback seperti sebelumnya)
  -rintangan dibuat sesuai , semakin tinggi level semakin banyak rintangan dan semakin sulit rintangan tersebut (buat semenarik mungkin). kayak level 1: awalnya mudah tapi pas diujung tambah susah. level 2: tambah susah lagi begitu seterusnya) jangan sampai rintangan terlalu ekstrem contohnya terlalu banyak rintangan yang harus dilompati secara bersamaan atau terlalu kecil rintangan atau terlalu besar rintangan buatlah semenarik mungkin.
  -buat semirip mungkin dengan Geometry Dash

---

## 📐 Responsivitas Desktop & Mobile

```js
// Pattern responsif yang dipakai proyek ini
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Hitung ulang scale factor untuk semua objek game
  SCALE = canvas.height / BASE_HEIGHT; // BASE_HEIGHT = 480 atau sesuai desain
}
window.addEventListener("resize", resizeCanvas);
```

- **Touch events**: `touchstart` → perlakukan sama seperti `Space` (lompat)
- **Viewport meta**: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Semua koordinat game dikalikan `SCALE` agar proporsional di semua layar

---

## 🎨 Panduan Visual & Animasi

- Font game: `pusab.otf` → sudah di-load via `@font-face` di `style.css`
- Warna utama GD-style: Emas `#FFD700`, Biru `#00BFFF`, Hijau `#39FF14`
- Animasi CSS untuk UI (menu, loading): gunakan `@keyframes` di `style.css`
- Animasi in-game (kotak mati, efek portal): tween manual di JS dengan `performance.now()`

---

## 🚀 Cara Menjalankan

```bash
cd geometridash
python -m http.server 8080
# Buka: http://localhost:8080
```

> ⚠️ **JANGAN** buka via `file://` — ES Modules butuh HTTP server (CORS policy).

---

## 🛠️ Panduan untuk Model AI

### Yang HARUS kamu lakukan:

- ✅ Tulis kode dalam ES6 Modules (`export`/`import`) — konsisten dengan arsitektur proyek
- ✅ Gunakan Canvas API (`ctx.fillRect`, `ctx.drawImage`, dll.) untuk semua rendering
- ✅ Gunakan Web Audio API untuk semua audio
- ✅ Tunjukkan di mana exaxtly kode disisipkan (nama file + sekitar baris mana)
- ✅ Jika fitur baru, buat file modul baru di `js/` dan tunjukkan cara import-nya di `main.js`
- ✅ Selalu pertimbangkan efek pada mobile (touch) DAN desktop (keyboard)

### Yang DILARANG:

- ❌ Jangan sarankan Phaser, PixiJS, atau game engine apapun
- ❌ Jangan pakai `<audio>` HTML tag untuk BGM utama
- ❌ Jangan pakai `file://` dalam instruksi menjalankan
- ❌ Jangan pakai build tool (webpack, vite, dll.)
- ❌ Jangan hapus sistem nyawa atau death system yang sudah ada

### Saat Debug:

1. Cek console browser (`F12`) untuk error modul
2. Error `CORS` / `Failed to fetch` → pastikan pakai HTTP server
3. Error `import` → cek path relatif (harus `./namafile.js` bukan `namafile`)
4. Audio tidak bunyi → cek apakah `AudioContext` sudah di-resume (butuh user gesture)

---

## 📝 Changelog Fitur

_(Update ini setiap kali fitur baru selesai diimplementasi)_

| Versi / Sesi | Fitur Ditambahkan                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| v0.1         | Setup dasar Canvas + player lompat                                                                              |
| v0.2         | HUD progress bar + tombol pause                                                                                  |
| v0.3         | Death system + motivasi ngauwor                                                                                  |
| v0.4         | Sistem nyawa 5 + BGM Web Audio API                                                                              |
| v1.0         | Mode Ship/Ball (Sprite asli), Variasi Obstacle, Secret Coins, Dekorasi Background, Sistem Nyawa 10               |
| v1.1         | CyberDemon Boss State Machine (Monster Motion), Sinkronisasi Laser PNG Sequence, Meme Overlay                    |
| v1.2         | Hidden Cheat "moonchi" (God Mode), Optimasi Performa (Anti-Lag), Layar Kemenangan Spesial, Fitur Menembak Pesawat |

---

## 💬 Catatan Tambahan dari Developer

- **Monster Motion**: Animasi boss terbagi jadi 4 state (Idle Utama 0-7, Rage 8-15, Attack 18-23, Idle 2 24-31).
- **Combat**: Di level Boss, player dalam mode Ship otomatis menembak ke arah boss (Auto-Aim).
- **Victory**: Menamatkan boss memicu ledakan partikel masif + statistik kematian & skor akhir.
- **Fair Play**: Laser boss nge-lock posisi 0.3s sebelum nembak, memberikan celah untuk menghindar.
- **Optimasi**: Shadow blur dan efek berat dihapus agar lancar di laptop spek rendah.
- Asset sprite dari `plan.assets/Texture2D/` — cek dulu sebelum buat grafis baru
