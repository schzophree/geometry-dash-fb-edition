# CHECKPOINT: Geometry Dash Fesnuk Edition

Tanggal: 9 Mei 2026  
Status: Gameplay 3 level + boss checkpoint SFX + low-FX optimization + staged particles + neon transition + manual boss mapping

## Kondisi Terakhir

Game memakai struktur modular ES Modules di folder `js/`. Entry point utama tetap `index.html`, styling utama di `style.css`, dan daftar lagu di `music-list.js`.

Mode gameplay terbaru mengikuti `GEOMETRY_DASH_IMPROVEMENTS.md`:

- Physics lebih berat: gravity `0.95`, jump force `-16.5`.
- `coyoteFrames = 0`, `invincibleFrames = 0`.
- Speed/interval level dibuat konstan, tidak naik otomatis per frame.
- `CONFIG.gameplay.oneHitKill = true`, jadi tabrakan langsung game over.
- Heart item dan HUD hati lama nonaktif saat `oneHitKill` aktif.

## Level Aktif

Jumlah level sekarang disamakan dengan jumlah lagu default di `music-list.js`, yaitu 3 level.

| Level | Musik | Score Start | Checkpoint | Tema |
| --- | --- | ---: | --- | --- |
| Level 1 EASY | `music/level1.mp3` | 0 | - | Biru neon |
| Level 2 NORMAL | `music/level2.mp3` | 900 | Score 900 | Oranye neon |
| Level 3 BOSS | `music/boss.mp3` | 2100 | Score 2100 | Merah boss/final |

Checkpoint sesi hanya ada di transisi level:

- Level 1 ke Level 2: score 900
- Level 2 ke Level 3: score 2100
- Tidak ada Level 4 / INSANE lagi

## Aturan Transisi Level

Transisi level tidak boleh lompat langsung ke level akhir.

Logika saat ini:

- Score boleh melewati lebih dari satu threshold saat lagu masih berjalan.
- Level baru hanya aktif kalau score sudah melewati threshold dan lagu level aktif sudah selesai minimal sekali.
- Saat transisi, game hanya naik 1 level dari level aktif, meskipun score sudah melewati threshold berikutnya.
- Setelah transisi, lagu level berikutnya mulai dari awal.

## Audio Game Over

Saat nyawa habis, musik tidak langsung dihentikan. Audio diberi efek low-pass / high-cut supaya terdengar mendem:

- Cutoff turun ke sekitar 520 Hz.
- Volume turun ke level rendah.
- Efek di-reset saat restart, lanjut dari checkpoint, atau kembali main.

Implementasi ada di `js/audio.js` melalui `muffleDeath()` dan `resetMuffle()`.

## Audio Boss Checkpoint

Saat transisi dari Level 2 ke Level 3 BOSS, game memutar dua SFX pendek secara layered:

- `geometry-dash-assets/warning-alarm-not-loud.mp3`
- `geometry-dash-assets/incoming-tears.mp3`

Implementasi ada di `CONFIG.audio.bossCheckpointSfx`, `AudioEngine.playBossCheckpointCue()`, dan dipanggil dari `handleLevelTransition()` saat level berikutnya bernama `BOSS`.

## Optimasi Low-FX

Mode low-FX aktif lewat `CONFIG.performance.lowFx = true`.

Yang sudah dipangkas:

- Stars turun ke 30.
- Wireframe shapes turun ke 6.
- Sparks boss-stage turun ke 14.
- Cave teeth turun ke 18.
- Hex wall penuh diganti menjadi 16 hex marks saat low-FX.
- Beat analyzer dibatasi sekitar 30 FPS melalui `CONFIG.audio.analyserIntervalMs`.

## Visual Partikel Terbaru

- Level 1 sekarang punya 18 ambient sparks ringan supaya awal game/menu tidak kosong.
- Level 2 memakai sparks sedang dan tetap lebih kalem dari BOSS.
- Level 3 BOSS memakai spark count lebih besar, shard storm, dan red hazard bands sebagai placeholder brutal sebelum desain monster final.
- Versi BOSS sudah dibuat lebih ringan untuk i5 gen 6: jumlah sparks/shards dipangkas, shadow/composite/rotate dikurangi saat `lowFx`.
- Preview menu mengikuti tombol level yang dipilih, jadi background EASY/NORMAL/BOSS tidak nyangkut di level terakhir.

## Transisi Level

Saat checkpoint transisi level aktif, game menampilkan flash putih singkat, wipe neon horizontal, dan label level baru. Implementasi ada di `levelTransitionFx` dan `drawLevelTransitionOverlay()` pada `js/main.js`.

## Manual Boss Mapping

Level 3 BOSS sekarang memakai sistem manual mapping:

- `js/level-data.js`: timeline `BOSS_MAPPING` berbasis detik lagu.
- `js/boss.js`: `CyberDemonBoss`, trigger system, visual boss, laser, pillar, mouth vortex, dan like burst.
- `js/audio.js`: `audio.currentTime()` menjadi source of truth untuk beat sync.
- `js/main.js`: update/draw boss hanya saat `currentLevelIndex === 2`.

Boss memakai crop sprite dari `GJ_GameSheet02-hd.png` melalui asset loader kalau file di `geometry-dash-assets\geometry-dash-assets` tersedia. Jika spritesheet gagal load, visual tetap jalan dengan Canvas fallback.

## File Penting

- `js/config.js`: jumlah level, threshold score, tema, speed, checkpoint.
- `js/main.js`: state machine, transisi level, damage, game over.
- `js/audio.js`: lazy-load musik, beat detection, efek muffled saat game over.
- `js/stage-art.js`: visual boss-stage, portal, hex wall, speed arrows.
- `js/boss.js`: Boss Manager manual mapping untuk Level 3.
- `js/level-data.js`: timeline serangan boss berbasis detik lagu.
- `music-list.js`: daftar 3 lagu default.

## Catatan Lanjutan

- Kalau nanti menambah lagu ke-4, baru tambahkan level baru di `CONFIG.levels`.
- Kalau tetap 3 lagu, jangan tambahkan tombol level ke-4 di `index.html`.
- Jika score terasa terlalu cepat melewati threshold, ubah `SCORE_PER_FRAME` atau threshold `scoreStart` di `js/config.js`.
