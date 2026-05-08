# 🚩 CHECKPOINT: Geometry Dash — Dikejar Facebook (Fesnuk Edition)

**Tanggal:** 8 Mei 2026  
**Status Proyek:** Fase Pengembangan Lanjut (Modular & Responsive)  
**Pengembang:** Moonchi (Dan)

---

## 📊 Status Saat Ini
Game sudah memiliki pondasi modular yang kuat menggunakan ES Modules. Semua sistem (Player, Obstacles, Audio, HUD, dll) terpisah dalam file tersendiri di folder `js/`, memudahkan pengembangan fitur baru tanpa merusak logika inti.

### Fitur Utama yang Sudah Implementasi:
1.  **Sistem Level & Tema Dinamis:**
    *   4 Level (Easy, Normal, Hard, Insane) dengan transisi visual yang mulus.
    *   Setiap level memiliki skema warna (Theme) unik yang berubah saat skor mencapai threshold tertentu.
    *   Threshold transisi: Skor 900, 2100, dan 3800.
2.  **Mekanik Pengejar (Facebook Chaser):**
    *   Icon Facebook yang mengejar dari kiri.
    *   Sistem "Pressure" dan "Angry Mode" saat jarak terlalu dekat.
3.  **Ghost Status FB (Hantu Sosial Media):**
    *   Overlay status Facebook yang muncul secara acak dengan pesan-pesan lucu (taunting).
    *   Efek visual hantu (glow, float, fade) sepenuhnya menggunakan Canvas API.
4.  **Audio Engine (Hybrid):**
    *   Mendukung BGM (MP3) dengan lazy-loading per level.
    *   Dilengkapi beat-detection untuk efek visual (beat-flash, screen-shake).
    *   Fallback Web Audio synthesis jika file audio tidak ditemukan.
5.  **Sistem Checkpoint Sesi:**
    *   Menyimpan progress (skor, level, nyawa) setiap transisi level.
    *   Pemain bisa memilih "Lanjut dari Checkpoint" setelah Game Over.
6.  **Responsive & Visual:**
    *   Canvas menskala otomatis sesuai viewport browser.
    *   Efek partikel (impact), trail pemain, dan parallax background.

---

## 📂 Struktur Modular (JS Modules)
*   `main.js`: State machine utama, game loop, dan integrasi antar sistem.
*   `config.js`: Pusat pengaturan (skor, gravitasi, level, tema).
*   `player.js`: Logika fisika, hitbox, dan rendering pemain.
*   `obstacles.js`: Manajemen rintangan (spawn, collision, collection).
*   `facebook.js`: AI pengejar dan deteksi tangkapan.
*   `audio.js`: Engine suara dan beat-sync.
*   `ghost.js`: Fitur hantu status Facebook.
*   `assets.js`: Loader gambar/font dan fallback renderer.
*   `hud.js` & `screens.js`: UI (Heads-Up Display) dan overlay layar (Start, Pause, Dead).
*   `stage-art.js`: Detail visual tambahan untuk stage (hex walls, portals, dll).

---

## 🛠️ Daftar Level & Milestone
| Level | Nama | Threshold Skor | Kecepatan | Tema Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | EASY | 0 | 5.5 | Biru (Stereo Madness vibe) |
| **Level 2** | NORMAL | 900 | 6.5 | Oranye (Back On Track vibe) |
| **Level 3** | HARD | 2100 | 7.8 | Ungu (Polargeist vibe) |
| **Level 4** | INSANE | 3800 | 9.2 | Merah (Dry Out vibe) |

---

## 📝 Catatan Developer Terakhir
*   Asset loader sekarang lebih robust dengan progress bar di loading screen.
*   Ditambahkan sistem nyawa (Lives) dan item Heart yang muncul secara acak.
*   Invincibility frame (90 frame) aktif setelah terkena hit agar pemain tidak langsung mati beruntun.
*   UI Pause menu sudah fungsional (Lanjutkan, Menu Utama, Mute).

---

## 🚀 Rencana Selanjutnya (Next Tasks)
1.  **Boss Screenshot Overlay:** Mengintegrasikan screenshot khusus di Level 4.
2.  **Sound FX Enhancement:** Menambahkan lebih banyak SFX untuk feedback jump dan landing.
3.  **Optimization:** Tweak performa pada mode Low FX untuk perangkat mobile low-end.
4.  **Level Design:** Menambah variasi pola rintangan yang lebih menantang di Level 3 & 4.

---
*Checkpoint ini dibuat otomatis sebagai rangkuman progress proyek "Dikejar Facebook — Geometry Dash Edition".*
