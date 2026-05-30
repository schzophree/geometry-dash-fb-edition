# UPDATE GDF V2.0 — PERFORMA & MAPPING REVOLUTION

Ini adalah update besar yang memfokuskan pada stabilitas 60 FPS dan sistem mapping dinamis yang lebih segar.

## 🚀 OPTIMASI PERFORMA (60 FPS TARGET)
- **Canvas Context Optimization**: Mengaktifkan mode `desynchronized` dan menonaktifkan `alpha` untuk prioritas render GPU.
- **Sharp Rendering**: Mematikan `imageSmoothingEnabled` untuk grafis yang lebih tajam dan performa lebih enteng.
- **Smart Tiering System**: PC spek menengah (seperti i5 Gen 6) otomatis masuk ke **Medium Tier** yang mematikan `shadowBlur` dan `radial gradient` berat.
- **Obstacle Spawning On-Demand**: Implementasi sistem antrian (queue) untuk rintangan. Dari 9.000+ objek, hanya benda yang akan muncul di layar yang diproses CPU.

## 🗺️ DINAMIS MAPPING (BAG RANDOMIZER)
- **Item Coin and Heart**: tambahkan item koin dan nyawa, tadi tidak ada disitu
- **Dynamic Pattern Extraction**: Script Python sekarang mendeteksi pola rintangan secara otomatis berdasarkan jarak antar objek di JSON.
- **Tetris Bag System**: Implementasi *Bag Randomizer* (Sistem Kantong) untuk Level 1 dan Level 2. Pola tidak lagi diulang secara kaku, melainkan dikocok dalam kantong sebelum dikeluarkan.
- **Pattern Sequence Per Level**:
  - Level 1: `[A] [B] [C] [D] [E] [A] [A] [A] [C] [E] [E] [B] [D] [D] [D] [C] [C] [A] [B] [B]`
  - Level 2: `[C] [A] [E] [B] [D] [D] [B] [E] [A] [C] [C] [D] [B] [E] [A] [A] [E] [C] [D] [B]`
  - Level 3 Boss: `[B] [A] [C] [D] [E] [E] [B] [A] [C] [D] [D] [C] [E] [B] [A]`
- **Random Gap Logic**: Menambahkan jeda acak (6-8 grid) antar pola agar alur level terasa lebih organik dan menantang.
- **Level 1 Progression**: Mempertahankan intro desain asli hingga x=850, lalu lanjut ke mode shuffle hingga x=2966.
- **Level 2 Full Shuffle**: Level 2 sekarang memiliki rintangan unik yang diacak terus menerus hingga akhir lagu (x=5000).
- **Level 3 Full Shuffle brutal terowongan**: Level 3 memiliki rintangan yang kebanyakan terowongan dan banyak item atau portal ship dan masih menggunakan *Bag Randomizer* di level 1 atau level 2.

## ✨ EFEK VISUAL & UI
- **Enhanced Collection Animation**: Menghidupkan kembali animasi koin dan hati yang melayang memudar ke atas saat diambil, mirip versi 2 minggu lalu.
- **Persistent Floor Fix**: Memastikan garis lantai dan grid tetap muncul di semua tingkat performa (tidak lagi bolong di mode hemat).
- **Fullscreen Layout**: Menghilangkan border hitam dan memastikan game memenuhi seluruh layar monitor.

---
*Miku-bot: Proyek Fesnuk Dash sekarang sudah jauh lebih stabil dan bervariasi!*
