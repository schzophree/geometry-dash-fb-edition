Berikut adalah teks mentahnya (raw text). Kamu bisa langsung menyalin (copy) semua teks di dalam kotak di bawah ini:

Markdown
# Panduan Peningkatan Gameplay Geometry Dash FB Edition

Dokumen ini berisi analisis dan saran modifikasi kode untuk menyelaraskan gameplay game kamu dengan standar mekanik **Geometry Dash (GD)** asli, seperti yang terlihat pada referensi video "Ultra Violence".

## 1. Analisis Perbedaan Utama
Berdasarkan kode saat ini, ada beberapa perbedaan fundamental yang membuat gameplay terasa berbeda:
- **Sistem Nyawa:** GD menggunakan sistem *1-hit kill*.
- **Kecepatan Variabel:** GD menggunakan kecepatan konstan kecuali melewati portal speed.
- **Physics Toleransi:** GD memiliki gravitasi berat dan tidak menggunakan *coyote time*.
- **Generation:** GD menggunakan penempatan objek statis/manual, bukan rintangan acak (random generation).

---

## 2. Rencana Modifikasi Kode

### A. File: `js/config.js` (Penyesuaian Physics & Feel)
Ubah nilai pada objek `player` untuk membuat gerakan lebih "berat" dan presisi.

```javascript
// Lokasi: js/config.js
player: {
  x: 140,
  size: 36,
  gravity: 0.95,       // Ditingkatkan agar jatuh lebih cepat
  jumpForce: -16.5,    // Disesuaikan dengan gravitasi baru
  coyoteFrames: 0,     // GD tidak mentoleransi telat melompat
  trailLifeStep: 0.075,
  invincibleFrames: 0, // Hapus masa kebal
  hitboxInset: 6,      // Hitbox sedikit lebih kecil dari visual
},
B. File: js/main.js (Kecepatan Konstan & 1-Hit Kill)
Pastikan game tidak bertambah cepat sendiri dan pemain langsung mati saat menabrak.

Ubah fungsi updatePlaying:

JavaScript
// Hapus logika akselerasi otomatis
// Ganti:
gameSpeed = activeLevel.speed; 
obInterval = activeLevel.obInterval;
Ubah fungsi applyDamage:

JavaScript
function applyDamage(reason) {
  // Langsung trigger game over tanpa mengurangi nyawa
  triggerGameOver(reason); 
}
C. File: js/player.js (Rotasi Visual)
Ubah cara karakter berputar agar melakukan "snap" ke sudut 90 derajat saat mendarat.

JavaScript
// Di dalam fungsi update() player.js
if (this.onGround) {
  // Snap ke kelipatan 90 derajat (PI / 2)
  const snap = Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2);
  this.rot += (snap - this.rot) * 0.5; 
} else {
  // Kecepatan putar konstan di udara
  this.rot += 0.11; 
}
3. Strategi Boss Fight (Ultra Violence Style)
Untuk membuat boss fight seperti video referensi, kamu tidak bisa menggunakan generator rintangan otomatis. Kamu memerlukan Level Data/Map System.

Saran Arsitektur:
Manual Mapping: Buat array rintangan yang berisi { time: detik, type: 'spike', y: ground }.

Beat Synchronization: Gunakan audio.currentTime sebagai referensi utama untuk memunculkan objek atau serangan boss.

Trigger System: Buat fungsi untuk memicu animasi boss (seperti menembak laser) pada timestamp tertentu di lagu boss.mp3.