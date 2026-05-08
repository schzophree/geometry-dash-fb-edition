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
3. Background opsional: `assets\backgrounds\bg_0.png` sampai `bg_3.png`, dan `assets\backgrounds\ground.png`.

## Kontrol

- `Space`, `ArrowUp`, atau `W`: lompat
- Tahan tombol/tap: auto-jump setiap mendarat
- `Esc` atau `P`: pause/resume
- `Enter`: mulai dari menu atau restart dari awal saat game over

## Fitur

- 4 level visual theme dengan transisi score `900`, `2100`, dan `3800`
- Canvas dibuat full viewport browser
- Level baru hanya aktif setelah score threshold tercapai dan lagu level aktif selesai minimal sekali
- Checkpoint sesi saat transisi level, tanpa `localStorage`
- Resume dari checkpoint di layar game over
- Heart item random yang menambah nyawa tanpa batas maksimum
- Invincible 90 frame setelah kena obstacle atau tertangkap Facebook
- Missing assets memakai fallback Canvas
- Audio lazy-load per level agar startup lebih ringan; missing music memakai synthesized EDM beat dari Web Audio API
- Font utama memakai `assets/fonts/pusab.otf`, gaya font yang sama dengan default GDColon/GD Browser
- Gameplay memakai layer boss-stage Canvas: hex wall, portal ring, speed arrows, cave silhouette, red sparks, dan boss backdrop untuk level berat
