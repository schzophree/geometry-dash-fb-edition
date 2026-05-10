# Geometry Dash: Fesnuk Edition

Browser-only endless runner bergaya Geometry Dash. Tidak memakai npm, webpack, React, atau build step.

## Menjalankan

```bash
python -m http.server 8080
```

Buka `http://localhost:8080`.

Jangan buka `index.html` langsung lewat `file://`, karena browser biasanya memblokir load audio dan gambar lokal.

## Struktur Penting

```text
index.html
style.css
music-list.js
js/
  config.js
  assets.js
  audio.js
  player.js
  obstacles.js
  facebook.js
  ghost.js
  stage-art.js
  screens.js
  hud.js
  main.js
assets/
  sprites/
  backgrounds/
  ui/
music/
```

## Asset dan Musik

1. Download GD spritesheets atau cek folder `gd-assets\assets`, lalu taruh `GJ_GameSheet-hd.png` dan `GJ_GameSheet02-hd.png` di `assets\sprites\`. Game tetap jalan tanpa sprite karena ada Canvas fallback.
2. Taruh MP3 di `music\` atau `assets\audio\bgm\`, lalu edit `music-list.js`.
3. Background opsional: `assets\backgrounds\bg_0.png` sampai `bg_2.png`, dan `assets\backgrounds\ground.png`.
4. SFX boss checkpoint dipakai dari `geometry-dash-assets\warning-alarm-not-loud.mp3` dan `geometry-dash-assets\incoming-tears.mp3`.

## Kontrol

- `Space`, `ArrowUp`, atau `W`: lompat
- Tahan tombol/tap: auto-jump setiap mendarat
- `Esc` atau `P`: pause/resume
- `Enter`: mulai dari menu atau restart dari awal saat game over

## Fitur

- 3 level sesuai 3 lagu default, dengan checkpoint/transisi di score `900` dan `2100`
- Canvas dibuat full viewport browser
- Level baru hanya aktif setelah score threshold tercapai dan lagu level aktif selesai minimal sekali
- Checkpoint sesi saat transisi level, tanpa `localStorage`
- Resume dari checkpoint di layar game over
- Mulai dengan 5 nyawa; kena obstacle, laser boss, atau Facebook mengurangi 1 nyawa
- Heart item random muncul di gameplay dan menambah nyawa saat diambil
- Missing assets memakai fallback Canvas
- Audio lazy-load per level agar startup lebih ringan; missing music memakai synthesized EDM beat dari Web Audio API
- SFX layered saat masuk checkpoint BOSS
- Efek game over muffled/high-cut saat nyawa habis
- Font utama memakai `assets/fonts/pusab.otf`, gaya font yang sama dengan default GDColon/GD Browser
- Gameplay memakai layer boss-stage Canvas: hex wall, portal ring, speed arrows, cave silhouette, red sparks, dan boss backdrop untuk level berat
- Mode low-FX aktif di `CONFIG.performance.lowFx` supaya lebih ringan di CPU lama
- Menu/awal level punya ambient sparks ringan; level BOSS punya shard storm dan hazard bands versi brutal-ringan
- Transisi level memakai flash + wipe neon singkat saat checkpoint level baru aktif
- Level BOSS memakai manual mapping di `js/level-data.js`, Boss Manager di `js/boss.js`, dan sinkron ke `audio.currentTime()`
- Boss Cyber-Demon FB memakai crop sprite dari `GJ_GameSheet02-hd.png` jika spritesheet tersedia
- Boss level punya obstacle manual: floor spikes, block stack, pillar, laser, dan finish `LEVEL COMPLETE!`
- Boss art memakai `assets/images/boss/cyber-demon-fb.png`; setelah mapping utama habis, boss tetap spawn auto-hazard beat-synced
