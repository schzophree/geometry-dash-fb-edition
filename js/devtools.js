/**
 * ============================================================================
 * 🔧 GEOMETRY DASH DEVTOOLS & LEVEL EDITOR v2.0
 * ============================================================================
 * 
 * CARA PENGGUNAAN / CARA INJEKSI KE index.html:
 * ----------------------------------------------------------------------------
 * 1. Buka file `index.html`.
 * 2. Tambahkan tag <script> berikut tepat sebelum penutup tag </head> atau </body>:
 * 
 *    <!-- GD DevTools/Level Editor (Hanya untuk keperluan developer) -->
 *    <script src="js/devtools.js"></script>
 * 
 * 3. Simpan `index.html` lalu muat ulang game di browser.
 * 4. Tekan tombol [Ctrl + Shift + E] di keyboard untuk memunculkan/menyembunyikan overlay editor.
 * 5. Fitur Duplicate: Pilih objek (Mode Select), lalu Ctrl+C untuk copy dan Ctrl+V untuk paste di kursor.
 * 6. Tombol [G]: Toggle Mode Game (Sembunyikan grid/preview editor agar bersih).
 * ============================================================================
 */

(function () {
  'use strict';

  // ============================
  // STATE EDITOR
  // ============================
  let isDevModeActive = false;
  let showGameView = false; // Jika true, sembunyikan UI editor & grid (tampilan "jadi")
  let activeTool = 'block';
  let hoverTile = null;
  let isDrawing = false;
  let lastPlacedTile = null;
  let history = [];
  let animFrameId = null;
  let selectedObjects = []; // Array objek yang sedang dipilih
  let clipboard = [];       // Array objek yang dicopy
  let isSelectionDragging = false;
  let isDraggingObjects = false; // Memindahkan objek yang dipilih
  let dragStartPos = { x: 0, y: 0 };
  let selectionStart = { x: 0, y: 0 };
  let selectionEnd = { x: 0, y: 0 };
  let focusedToolIndex = 0; // Index tool yang sedang difokuskan keyboard

  // Timeline / Level Progress
  let levelTotalTime = 90; // Default seconds
  let currentTimelineX = 0; // Posisi x dalam pixel (setara waktu)
  let isSeeking = false;

  // Kamera / Pan offset
  let cameraX = 0;
  let cameraY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartCamX = 0;
  let panStartCamY = 0;
  let isSpaceHeld = false; // Shortcut Spasi + Drag untuk geser map

  // Element reference
  let overlayContainer = null;
  let overlayCanvas = null;

  // Konstanta grid & game
  const GRID = 32;
  const GROUND_Y = 384; // Sinkron dengan CONFIG.GROUND_Y di config.js
  const CEILING_Y = 0;   // Batas atas (paling atas canvas)
  const CANVAS_W = 800;
  const CANVAS_H = 450;

  // Inisialisasi window.levelData jika belum ada
  window.levelData = window.levelData || [];

  // Daftar tool lengkap dengan metadata
  const TOOLS = [
    // --- RINTANGAN ---
    { id: 'block',        label: 'Block',                   desc: null, category: 'RINTANGAN', iconClass: 'icon-block' },
    { id: 'spike',        label: 'Spike Atas',              desc: null, category: 'RINTANGAN', iconClass: 'icon-spike-up' },
    { id: 'spike_down',   label: 'Spike Bawah',             desc: null, category: 'RINTANGAN', iconClass: 'icon-spike-down' },
    { id: 'slope_right',  label: 'Slope Kanan',             desc: null, category: 'RINTANGAN', iconClass: 'icon-slope-right' },
    { id: 'slope_left',   label: 'Slope Kiri',              desc: null, category: 'RINTANGAN', iconClass: 'icon-slope-left' },
    { id: 'slope_top_right', label: 'Slope Atas Kan',       desc: 'Untuk langit-langit',             category: 'RINTANGAN', iconClass: 'icon-slope-tr' },
    { id: 'slope_top_left',  label: 'Slope Atas Kir',       desc: 'Untuk langit-langit',             category: 'RINTANGAN', iconClass: 'icon-slope-tl' },
    { id: 'platform',     label: 'Platform',                desc: null, category: 'RINTANGAN', iconClass: 'icon-platform' },
    // --- ORB ---
    { id: 'orb_yellow',   label: 'Orb Kuning',              desc: 'Lompat Tinggi',                  category: 'ORB', iconClass: 'icon-orb-yellow' },
    { id: 'orb_green',    label: 'Orb Hijau',               desc: 'Lompat Lebih Tinggi',             category: 'ORB', iconClass: 'icon-orb-green' },
    { id: 'orb_blue',     label: 'Orb Biru',                desc: 'Ganti Gravitasi + Lompat',        category: 'ORB', iconClass: 'icon-orb-blue' },
    { id: 'orb_red',      label: 'Orb Merah',               desc: 'Lompat Ekstrem',                  category: 'ORB', iconClass: 'icon-orb-red' },
    // --- PORTAL ---
    { id: 'portal_ship',         label: 'Portal Pesawat',   desc: 'Ubah ke Mode Terbang',            category: 'PORTAL', iconClass: 'icon-portal-ship' },
    { id: 'portal_cube',         label: 'Portal Kubus',     desc: 'Kembali ke Mode Kubus',           category: 'PORTAL', iconClass: 'icon-portal-cube' },
    { id: 'portal_ball',         label: 'Portal Bola',      desc: 'Ubah ke Mode Bola',               category: 'PORTAL', iconClass: 'icon-portal-ball' },
    { id: 'portal_gravity_up',   label: 'Gravitasi Atas',   desc: 'Balik Gravitasi ke Atas',         category: 'PORTAL', iconClass: 'icon-portal-grav-up' },
    { id: 'portal_gravity_down', label: 'Gravitasi Bawah',  desc: 'Normal Gravitasi ke Bawah',       category: 'PORTAL', iconClass: 'icon-portal-grav-down' },
    // --- ITEM ---
    { id: 'secret_coin', label: 'Koin Rahasia',             desc: 'Bonus +500 Poin',                 category: 'ITEM', iconClass: 'icon-coin' },
    // --- UTILITAS ---
    { id: 'select',      label: '🎯 Pilih Objek',            desc: 'Klik untuk pilih / Ctrl+C/V',     category: 'UTILITAS', iconClass: 'icon-select' },
    { id: 'eraser',      label: 'Penghapus',                desc: null, category: 'UTILITAS', iconClass: 'icon-eraser' },
    { id: 'pan',         label: '✋ Geser Map',              desc: 'Drag untuk geser tampilan',       category: 'UTILITAS', iconClass: 'icon-pan' },
  ];

  // ============================
  // INISIALISASI
  // ============================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDevTools);
  } else {
    initDevTools();
  }

  function initDevTools() {
    injectStyles();
    createDevUI();
    setupGlobalHotkeys();
    console.log("%c🔧 GD DevTools v2.0 dimuat. Tekan [Ctrl + Shift + E] untuk membuka editor.", "color: #00ff88; font-weight: bold; font-family: monospace;");
  }

  // ============================
  // CSS STYLES
  // ============================
  function injectStyles() {
    const styleId = 'gd-devtools-styles';
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      .gd-dev-overlay {
        position: absolute;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: 9999;
        pointer-events: none;
        font-family: 'Consolas', 'Courier New', Courier, monospace;
        user-select: none;
        -webkit-user-select: none;
      }
      .gd-dev-panel {
        position: absolute;
        top: 0; left: 0;
        width: 230px; height: 100%;
        background: rgba(10, 10, 15, 0.92);
        border-right: 2px solid #00ff88;
        box-shadow: 5px 0 25px rgba(0, 255, 136, 0.2);
        backdrop-filter: blur(8px);
        padding: 12px;
        display: flex; flex-direction: column;
        color: #e0e0e0;
        pointer-events: auto;
        box-sizing: border-box;
        overflow-y: auto;
      }
      .gd-dev-title {
        font-size: 15px; font-weight: bold;
        color: #00ff88;
        text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
        margin-bottom: 12px;
        text-align: center;
        letter-spacing: 1px;
        animation: gd-pulse 2s infinite alternate;
      }
      @keyframes gd-pulse {
        from { text-shadow: 0 0 6px rgba(0, 255, 136, 0.4); }
        to { text-shadow: 0 0 14px rgba(0, 255, 136, 0.8); }
      }
      .gd-dev-section-title {
        font-size: 9px; color: #888;
        margin-bottom: 5px; margin-top: 10px;
        letter-spacing: 2px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 3px;
      }
      .gd-dev-palette { display: flex; flex-direction: column; gap: 3px; }
      .gd-dev-tool {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ccc;
        padding: 5px 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex; align-items: center; gap: 8px;
        text-align: left;
        font-family: inherit; font-size: 11px;
        transition: all 0.2s ease;
      }
      .gd-dev-tool:hover {
        background: rgba(0, 255, 136, 0.08);
        border-color: rgba(0, 255, 136, 0.3);
        color: #fff;
        transform: translateX(2px);
      }
      .gd-dev-tool.active {
        background: rgba(0, 255, 136, 0.15);
        border-color: #00ff88;
        color: #00ff88;
        box-shadow: 0 0 8px rgba(0, 255, 136, 0.2);
        font-weight: bold;
      }
      .gd-dev-tool.focused {
        outline: 2px solid #00ffff;
        outline-offset: -2px;
        background: rgba(0, 255, 255, 0.1);
      }
      .gd-tool-info {
        display: flex; flex-direction: column;
      }
      .gd-tool-desc {
        font-size: 9px; color: #888; font-weight: normal;
        margin-top: 1px; font-style: italic;
      }
      /* Ikon grafis CSS */
      .gd-icon { width: 14px; height: 14px; display: inline-block; box-sizing: border-box; flex-shrink: 0; }
      .icon-block { background: #888; border: 1px solid #444; }
      .icon-spike-up { width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 14px solid #fff; }
      .icon-spike-down { width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 14px solid #fff; }
      .icon-slope-right { width: 0; height: 0; border-left: 14px solid transparent; border-bottom: 14px solid #ff3333; }
      .icon-slope-left { width: 0; height: 0; border-right: 14px solid transparent; border-bottom: 14px solid #ff3333; }
      .icon-slope-tr { width: 0; height: 0; border-left: 14px solid transparent; border-top: 14px solid #ff3333; }
      .icon-slope-tl { width: 0; height: 0; border-right: 14px solid transparent; border-top: 14px solid #ff3333; }
      .icon-platform { background: #33ff33; height: 4px; margin-top: 5px; }
      .icon-select { background: rgba(0, 255, 255, 0.2); border: 1px dashed #00ffff; border-radius: 2px; position: relative; }
      .icon-select::after { content: '🎯'; position: absolute; top: -2px; left: 0px; font-size: 10px; }
      .icon-eraser { background: #ff3333; border-radius: 50%; position: relative; }
      .icon-eraser::after { content: '×'; color: white; position: absolute; top: -4px; left: 2px; font-size: 13px; font-weight: bold; }
      .icon-pan { background: rgba(255,255,255,0.2); border-radius: 3px; display:flex; align-items:center; justify-content:center; font-size:12px; }
      .icon-pan::after { content: '✋'; }
      /* Orb icons */
      .icon-orb-yellow { background: #ffdd00; border-radius: 50%; box-shadow: 0 0 6px #ffdd00; }
      .icon-orb-green { background: #00ff44; border-radius: 50%; box-shadow: 0 0 6px #00ff44; }
      .icon-orb-blue { background: #00aaff; border-radius: 50%; box-shadow: 0 0 6px #00aaff; }
      .icon-orb-red { background: #ff3333; border-radius: 50%; box-shadow: 0 0 6px #ff3333; }
      /* Portal icons */
      .icon-portal-ship { background: linear-gradient(#ff66cc, #cc33aa); border-radius: 3px; }
      .icon-portal-cube { background: linear-gradient(#33ff66, #22aa44); border-radius: 3px; }
      .icon-portal-ball { background: linear-gradient(#ffaa33, #cc7700); border-radius: 3px; }
      .icon-portal-grav-up { background: linear-gradient(#ffee00, #ccaa00); border-radius: 3px; }
      .icon-portal-grav-down { background: linear-gradient(#3399ff, #1155cc); border-radius: 3px; }
      /* Coin icon */
      .icon-coin { background: #ffd700; border-radius: 50%; border: 2px solid #b8860b; }

      .gd-dev-info {
        margin-top: 8px;
        background: rgba(0, 0, 0, 0.4);
        padding: 6px; border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 10px; line-height: 1.5;
      }
      .gd-dev-info div { display: flex; justify-content: space-between; }
      .gd-dev-info span { color: #00ff88; font-weight: bold; }
      .gd-dev-actions { display: flex; flex-direction: column; gap: 4px; }
      .gd-dev-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff; padding: 6px;
        border-radius: 4px; cursor: pointer;
        font-family: inherit; font-size: 10px;
        transition: all 0.2s ease;
        display: flex; align-items: center; justify-content: center; gap: 5px;
      }
      .gd-dev-btn:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
      .gd-dev-btn.primary { background: #00ff88; color: #000; font-weight: bold; border: none; }
      .gd-dev-btn.primary:hover { background: #00dd77; box-shadow: 0 0 10px rgba(0, 255, 136, 0.3); }
      .gd-dev-help {
        margin-top: auto;
        font-size: 8px; color: #666;
        line-height: 1.4;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      /* Timeline / Player Style */
      .gd-dev-timeline-container {
        position: absolute;
        bottom: 20px;
        left: 250px;
        right: 40px;
        height: 60px;
        background: rgba(10, 10, 15, 0.95);
        border: 2px solid #00ff88;
        border-radius: 8px;
        backdrop-filter: blur(10px);
        padding: 10px 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        pointer-events: auto;
        z-index: 10001;
        transition: transform 0.3s ease, opacity 0.3s ease;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
      }
      .gd-dev-timeline-container.hidden {
        transform: translateY(100px);
        opacity: 0;
        pointer-events: none;
      }
      .gd-dev-timeline-track {
        flex-grow: 1;
        height: 14px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 7px;
        position: relative;
        cursor: pointer;
        pointer-events: auto;
      }
      .gd-dev-timeline-fill {
        position: absolute;
        top: 0; left: 0; height: 100%;
        background: linear-gradient(90deg, #00ff88, #00aaff);
        border-radius: 4px;
        width: 0%;
      }
      .gd-dev-timeline-handle {
        position: absolute;
        top: 50%;
        left: 0%;
        width: 16px; height: 16px;
        background: #fff;
        border: 2px solid #00ff88;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      }
      .gd-dev-time-display {
        font-family: monospace;
        font-size: 12px;
        color: #00ff88;
        min-width: 80px;
      }
      .gd-dev-play-btn {
        background: #00ff88;
        color: #000;
        border: none;
        width: 32px; height: 32px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        font-size: 14px;
      }
      #gd-dev-canvas { pointer-events: auto; cursor: crosshair; }
    `;
    document.head.appendChild(styleEl);
  }

  // ============================
  // BUAT UI
  // ============================
  function createDevUI() {
    if (document.getElementById('gd-dev-overlay')) return;

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'gd-dev-overlay';
    overlayContainer.className = 'gd-dev-overlay';
    overlayContainer.style.display = 'none';

    // Buat palet tools berdasarkan TOOLS array
    let paletteHTML = '';
    let lastCategory = '';
    for (const tool of TOOLS) {
      if (tool.category !== lastCategory) {
        if (lastCategory !== '') paletteHTML += '</div>'; // Tutup palette div sebelumnya
        lastCategory = tool.category;
        paletteHTML += `<div class="gd-dev-section-title">${tool.category}</div><div class="gd-dev-palette">`;
      }
      const activeClass = tool.id === 'block' ? ' active' : '';
      const descHTML = tool.desc ? `<span class="gd-tool-desc">${tool.desc}</span>` : '';
      paletteHTML += `
        <button class="gd-dev-tool${activeClass}" data-tool="${tool.id}">
          <span class="gd-icon ${tool.iconClass}"></span>
          <span class="gd-tool-info">
            ${tool.label}
            ${descHTML}
          </span>
        </button>`;
    }
    if (lastCategory !== '') paletteHTML += '</div>'; // Tutup palette div terakhir

    overlayContainer.innerHTML = `
      <div class="gd-dev-panel">
        <div class="gd-dev-title">🔧 DEV MODE</div>
        ${paletteHTML}

        <div class="gd-dev-info">
          <div>Grid: <span id="gd-dev-coords">X=0, Y=0</span></div>
          <div>Objek: <span id="gd-dev-total">0</span></div>
          <div>Kamera: <span id="gd-dev-camera">0, 0</span></div>
        </div>

        <div class="gd-dev-section-title">AKSI</div>
        <div class="gd-dev-actions">
          <button id="gd-btn-save" class="gd-dev-btn primary">💾 Simpan JSON</button>
          <button id="gd-btn-load" class="gd-dev-btn">📋 Muat JSON</button>
          <button id="gd-btn-undo" class="gd-dev-btn">↩ Batalkan (Ctrl+Z)</button>
          <button id="gd-btn-reset-view" class="gd-dev-btn">🏠 Reset Tampilan</button>
        </div>
        
        <div class="gd-dev-help">
          <strong>Shortcut:</strong><br>
          • [Ctrl+Shift+E] Buka/Tutup Editor<br>
          • [G] Toggle Mode Game (Tampilan Jadi)<br>
          • [Klik Kiri] Letakkan Objek<br>
          • [Drag Kiri] Penempatan Cepat<br>
          • [Klik Kanan] Hapus Objek<br>
          • [Spasi + Drag] Geser Map<br>
          • [Ctrl+Z] Batalkan Aksi<br>
          • [Ctrl+C/V] Copy & Paste Grup<br>
          • [Ctrl+Klik] Pilih Banyak<br>
          • [Drag Select] Box Selection
        </div>
      </div>

      <!-- Timeline / Media Player Style -->
      <div id="gd-dev-timeline" class="gd-dev-timeline-container">
        <button id="gd-timeline-play" class="gd-dev-play-btn">▶</button>
        <div id="gd-timeline-track" class="gd-dev-timeline-track">
          <div id="gd-timeline-fill" class="gd-dev-timeline-fill"></div>
          <div id="gd-timeline-handle" class="gd-dev-timeline-handle"></div>
        </div>
        <div id="gd-time-display" class="gd-dev-time-display">00:00 / 01:30</div>
      </div>
    `;

    const mountTarget = document.getElementById('gameWrap') || document.body;
    mountTarget.appendChild(overlayContainer);
    setupUIListeners();
  }

  // ============================
  // EVENT LISTENERS UI
  // ============================
  function setupUIListeners() {
    const tools = overlayContainer.querySelectorAll('.gd-dev-tool');
    tools.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        tools.forEach(btn => btn.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        activeTool = targetBtn.dataset.tool;
        focusedToolIndex = index;
        updateToolFocus();
        updateCanvasCursor();
      });
    });

    document.getElementById('gd-btn-save').addEventListener('click', saveJSON);
    document.getElementById('gd-btn-load').addEventListener('click', loadJSON);
    document.getElementById('gd-btn-undo').addEventListener('click', performUndo);
    document.getElementById('gd-btn-reset-view').addEventListener('click', () => {
      cameraX = 0;
      cameraY = 0;
      updateCameraInfo();
    });
    
    // Auto-generate button
    const autoGenBtn = document.createElement('button');
    autoGenBtn.className = 'gd-dev-btn';
    autoGenBtn.textContent = '🎲 Generate Rintangan';
    autoGenBtn.onclick = autoGenerateLevelContent;
    document.querySelector('.gd-dev-actions').appendChild(autoGenBtn);

    // Timeline Listeners
    const timeline = document.getElementById('gd-dev-timeline');
    const playBtn = document.getElementById('gd-timeline-play');
    const track = document.getElementById('gd-timeline-track');

    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleGamePause();
      });
    }
    
    if (track) {
      track.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isSeeking = true;
        handleSeek(e);
      });
    }

    // Global listeners for seeking to handle dragging outside the track
    document.addEventListener('mousemove', (e) => {
      if (isDevModeActive && isSeeking) {
        handleSeek(e);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDevModeActive) {
        isSeeking = false;
      }
    });
  }

  function updateToolFocus() {
    const tools = overlayContainer.querySelectorAll('.gd-dev-tool');
    tools.forEach((btn, idx) => {
      btn.classList.toggle('focused', idx === focusedToolIndex);
    });
    // Ensure focused element is in view if sidebar scrolls
    const focused = tools[focusedToolIndex];
    if (focused) {
      focused.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function toggleGamePause() {
    if (window.gameState) {
      window.gameState.paused = !window.gameState.paused;
      const playBtn = document.getElementById('gd-timeline-play');
      if (playBtn) playBtn.textContent = window.gameState.paused ? '▶' : '⏸';
    }
  }

  function handleSeek(e) {
    const track = document.getElementById('gd-timeline-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    // Total lebar level (pixel). 1 detik = ~312px.
    const totalWidth = levelTotalTime * 312;
    
    // Untuk melihat bagian kanan, cameraX harus negatif.
    // Kita sisakan sedikit margin kiri (misal 100px) agar tidak mepet START.
    cameraX = -percent * totalWidth + 100; 
    
    updateTimelineUI();
    updateCameraInfo();
  }

  function updateTimelineUI() {
    const totalWidth = levelTotalTime * 312;
    // Hitung persen berdasarkan cameraX (kebalikan dari handleSeek)
    // cameraX = -percent * totalWidth + 100  =>  percent = (100 - cameraX) / totalWidth
    let percent = (100 - cameraX) / totalWidth;
    percent = Math.max(0, Math.min(1, percent));

    const fill = document.getElementById('gd-timeline-fill');
    const handle = document.getElementById('gd-timeline-handle');
    const display = document.getElementById('gd-time-display');

    if (fill) fill.style.width = `${percent * 100}%`;
    if (handle) handle.style.left = `${percent * 100}%`;

    if (display) {
      const curSec = Math.floor(percent * levelTotalTime);
      const totalSec = levelTotalTime;
      const format = (s) => {
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
      };
      display.textContent = `${format(curSec)} / ${format(totalSec)}`;
    }
  }

  function updateCanvasCursor() {
    if (!overlayCanvas) return;
    if (activeTool === 'pan' || isSpaceHeld) {
      overlayCanvas.style.cursor = isPanning ? 'grabbing' : 'grab';
    } else if (activeTool === 'eraser') {
      overlayCanvas.style.cursor = 'not-allowed';
    } else if (activeTool === 'select') {
      overlayCanvas.style.cursor = 'default';
    } else {
      overlayCanvas.style.cursor = 'crosshair';
    }
  }

  // ============================
  // HOTKEYS GLOBAL
  // ============================
  function setupGlobalHotkeys() {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
        e.preventDefault();
        e.stopImmediatePropagation();
        toggleDevMode();
        return;
      }

      if (isDevModeActive) {
        // Arrow Keys handling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (selectedObjects.length > 0) {
            // Pindahkan objek terpilih
            let dx = 0, dy = 0;
            if (e.code === 'ArrowUp') dy = -1;
            if (e.code === 'ArrowDown') dy = 1;
            if (e.code === 'ArrowLeft') dx = -1;
            if (e.code === 'ArrowRight') dx = 1;
            moveSelectedObjects(dx, dy);
          } else {
            // Navigasi palet tools
            const tools = overlayContainer.querySelectorAll('.gd-dev-tool');
            if (e.code === 'ArrowUp') focusedToolIndex = Math.max(0, focusedToolIndex - 1);
            if (e.code === 'ArrowDown') focusedToolIndex = Math.min(tools.length - 1, focusedToolIndex + 1);
            if (e.code === 'ArrowLeft') focusedToolIndex = Math.max(0, focusedToolIndex - 1);
            if (e.code === 'ArrowRight') focusedToolIndex = Math.min(tools.length - 1, focusedToolIndex + 1);
            updateToolFocus();
            
            const target = tools[focusedToolIndex];
            if (target) {
              tools.forEach(btn => btn.classList.remove('active'));
              target.classList.add('active');
              activeTool = target.dataset.tool;
              updateCanvasCursor();
            }
          }
          return;
        }

        if (e.code === 'Delete' || e.code === 'Backspace') {
          if (selectedObjects.length > 0) {
            e.preventDefault();
            e.stopImmediatePropagation();
            deleteSelectedObjects();
            return;
          }
        }

        if (e.ctrlKey && !e.shiftKey && e.code === 'KeyZ') {
          e.preventDefault();
          e.stopImmediatePropagation();
          performUndo();
          return;
        }
        if (e.ctrlKey && !e.shiftKey && e.code === 'KeyC') {
          e.preventDefault();
          e.stopImmediatePropagation();
          copyObject();
          return;
        }
        if (e.ctrlKey && !e.shiftKey && e.code === 'KeyV') {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (hoverTile) pasteObject(hoverTile.x, hoverTile.y);
          return;
        }
        if (e.code === 'KeyG') {
          e.preventDefault();
          e.stopImmediatePropagation();
          toggleGameView();
          return;
        }
        if (e.code === 'Space') {
          e.preventDefault();
          e.stopImmediatePropagation();
          isSpaceHeld = true;
          updateCanvasCursor();
          return;
        }
      }
    }, true); // Use capture phase to intercept early

    window.addEventListener('keyup', (e) => {
      if (isDevModeActive) {
        if (e.code === 'Space') {
          e.preventDefault();
          e.stopImmediatePropagation();
          isSpaceHeld = false;
          isPanning = false;
          updateCanvasCursor();
        }
      }
    }, true);
  }

  // ============================
  // TOGGLE DEV MODE
  // ============================
  function toggleDevMode() {
    isDevModeActive = !isDevModeActive;

    const overlay = document.getElementById('gd-dev-overlay');
    if (!overlay) return;

    if (isDevModeActive) {
      overlay.style.display = 'block';
      window.levelData = window.levelData || [];
      updateObjectsCount();

      // Auto-pause game melalui window.gameState reaktif
      if (window.gameState && typeof window.gameState === 'object') {
        window.gameState.paused = true;
      }

      // Sembunyikan popup pause agar clean
      const pauseOverlay = document.getElementById('pauseOverlay');
      if (pauseOverlay) {
        pauseOverlay.classList.remove('is-visible');
      }

      mountOverlayCanvas();
      syncOverlayCanvas();
      window.addEventListener('resize', syncOverlayCanvas);
      devtoolsRenderLoop();

      console.log("%c🔧 DevTools: EDITOR AKTIF (Game dijeda)", "color: #00ff88; font-weight: bold;");
    } else {
      overlay.style.display = 'none';

      // Resume game
      if (window.gameState && typeof window.gameState === 'object') {
        window.gameState.paused = false;
      }

      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }

      window.removeEventListener('resize', syncOverlayCanvas);
      unmountOverlayCanvas();

      console.log("%c🔧 DevTools: EDITOR NONAKTIF (Game dilanjutkan)", "color: #ff3355; font-weight: bold;");
    }
  }

  // ============================
  // OVERLAY CANVAS
  // ============================
  function mountOverlayCanvas() {
    if (overlayCanvas) return;
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) return;

    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'gd-dev-canvas';

    const mountTarget = document.getElementById('gameWrap') || document.body;
    mountTarget.appendChild(overlayCanvas);
    setupCanvasInteraction();
    updateCanvasCursor();
  }

  function unmountOverlayCanvas() {
    if (overlayCanvas) {
      overlayCanvas.remove();
      overlayCanvas = null;
    }
  }

  function syncOverlayCanvas() {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas || !overlayCanvas) return;

    const rect = gameCanvas.getBoundingClientRect();
    overlayCanvas.width = gameCanvas.width || CANVAS_W;
    overlayCanvas.height = gameCanvas.height || CANVAS_H;
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.left = rect.left + 'px';
    overlayCanvas.style.top = rect.top + 'px';
    overlayCanvas.style.width = rect.width + 'px';
    overlayCanvas.style.height = rect.height + 'px';
    overlayCanvas.style.zIndex = '9998';
  }

  // ============================
  // INTERAKSI CANVAS
  // ============================
  function setupCanvasInteraction() {
    if (!overlayCanvas) return;

    overlayCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // MOUSE DOWN
    overlayCanvas.addEventListener('mousedown', (e) => {
      // Mode geser (Pan)
      if (activeTool === 'pan' || isSpaceHeld) {
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartCamX = cameraX;
        panStartCamY = cameraY;
        updateCanvasCursor();
        return;
      }

      const tile = getMouseGridTile(e);
      if (!tile) return;

      if (e.button === 0) {
        if (activeTool === 'eraser') {
          isDrawing = true;
          eraseAt(tile.x, tile.y);
        } else if (activeTool === 'select') {
          const isOverSelected = selectedObjects.some(o => o.x === tile.x && o.y === tile.y);
          if (isOverSelected && !e.ctrlKey) {
            // Mulai drag objek
            isDraggingObjects = true;
            dragStartPos = { x: tile.x, y: tile.y };
            saveToHistory();
          } else {
            const objAtTile = window.levelData.find(o => o.x === tile.x && o.y === tile.y);
            if (objAtTile || e.ctrlKey) {
              selectAt(tile.x, tile.y, e.ctrlKey);
              if (!e.ctrlKey && objAtTile) {
                isDraggingObjects = true;
                dragStartPos = { x: tile.x, y: tile.y };
                saveToHistory();
              }
            } else {
              // Mulai box selection
              isSelectionDragging = true;
              selectionStart = { x: e.clientX, y: e.clientY };
              selectionEnd = { x: e.clientX, y: e.clientY };
              selectedObjects = [];
            }
          }
        } else {
          isDrawing = true;
          placeAt(tile.x, tile.y, activeTool);
        }
      } else if (e.button === 2) {
        isDrawing = true;
        eraseAt(tile.x, tile.y);
      }
    });

    // MOUSE MOVE
    overlayCanvas.addEventListener('mousemove', (e) => {
      // Mode geser
      if (isPanning) {
        const rect = overlayCanvas.getBoundingClientRect();
        const scaleX = overlayCanvas.width / rect.width;
        const scaleY = overlayCanvas.height / rect.height;
        const dx = (e.clientX - panStartX) * scaleX;
        const dy = (e.clientY - panStartY) * scaleY;
        cameraX = panStartCamX + dx;
        cameraY = panStartCamY + dy;
        updateCameraInfo();
        return;
      }

      const tile = getMouseGridTile(e);
      if (!tile) return;

      if (isDraggingObjects) {
        const dx = tile.x - dragStartPos.x;
        const dy = tile.y - dragStartPos.y;
        if (dx !== 0 || dy !== 0) {
          selectedObjects.forEach(sel => {
            const realObj = window.levelData.find(o => o._placedAt === sel._placedAt);
            if (realObj) {
              realObj.x += dx;
              realObj.y += dy;
            }
            sel.x += dx;
            sel.y += dy;
          });
          dragStartPos = { x: tile.x, y: tile.y };
          triggerReload();
        }
        return;
      }

      if (isSelectionDragging) {
        selectionEnd = { x: e.clientX, y: e.clientY };
        updateSelectionFromBox();
        return;
      }

      const coordsEl = document.getElementById('gd-dev-coords');
      if (coordsEl) coordsEl.textContent = `X=${tile.x}, Y=${tile.y}`;
      hoverTile = tile;

      if (isDrawing) {
        if (!lastPlacedTile || lastPlacedTile.x !== tile.x || lastPlacedTile.y !== tile.y) {
          if (e.buttons === 1) {
            if (activeTool === 'eraser') eraseAt(tile.x, tile.y);
            else if (activeTool === 'select') { /* Do nothing while dragging select unless we implement multi-drag */ }
            else placeAt(tile.x, tile.y, activeTool);
          } else if (e.buttons === 2) {
            eraseAt(tile.x, tile.y);
          }
        }
      }
    });

    // MOUSE UP
    window.addEventListener('mouseup', () => {
      isDrawing = false;
      isSelectionDragging = false;
      isDraggingObjects = false;
      lastPlacedTile = null;
      if (isPanning) {
        isPanning = false;
        updateCanvasCursor();
      }
    });

    overlayCanvas.addEventListener('mouseleave', () => {
      hoverTile = null;
    });
  }

  function updateSelectionFromBox() {
    if (!overlayCanvas) return;
    const rect = overlayCanvas.getBoundingClientRect();
    const scaleX = overlayCanvas.width / rect.width;
    const scaleY = overlayCanvas.height / rect.height;

    const x1 = (Math.min(selectionStart.x, selectionEnd.x) - rect.left) * scaleX - cameraX;
    const y1 = (Math.min(selectionStart.y, selectionEnd.y) - rect.top) * scaleY - cameraY;
    const x2 = (Math.max(selectionStart.x, selectionEnd.x) - rect.left) * scaleX - cameraX;
    const y2 = (Math.max(selectionStart.y, selectionEnd.y) - rect.top) * scaleY - cameraY;

    selectedObjects = window.levelData.filter(o => {
      const px = o.x * GRID;
      const py = o.y * GRID;
      return px >= x1 - GRID && px <= x2 && py >= y1 - GRID && py <= y2;
    }).map(o => ({ ...o }));
  }

  function getMouseGridTile(e) {
    if (!overlayCanvas) return null;
    const rect = overlayCanvas.getBoundingClientRect();
    const scaleX = overlayCanvas.width / rect.width;
    const scaleY = overlayCanvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX - cameraX;
    const mouseY = (e.clientY - rect.top) * scaleY - cameraY;
    return {
      x: Math.floor(mouseX / GRID),
      y: Math.floor(mouseY / GRID)
    };
  }

  function updateCameraInfo() {
    const el = document.getElementById('gd-dev-camera');
    if (el) el.textContent = `${Math.round(cameraX)}, ${Math.round(cameraY)}`;
  }

  // ============================
  // OPERASI DATA LEVEL
  // ============================
  function saveToHistory() {
    const stateCopy = JSON.parse(JSON.stringify(window.levelData));
    history.push(stateCopy);
    if (history.length > 50) history.shift();
  }

  function placeAt(x, y, type) {
    // Snapping: cegah penempatan di luar batas vertikal (lantai & langit)
    const maxTileY = Math.floor(GROUND_Y / GRID) - 1; // 1 tile di atas lantai
    const minTileY = Math.ceil(CEILING_Y / GRID);    // Sejajar garis langit
    
    if (type !== 'eraser' && type !== 'pan' && type !== 'select') {
      if (y > maxTileY) y = maxTileY;
      if (y < minTileY) y = minTileY;
    }

    const existingIndex = window.levelData.findIndex(item => item.x === x && item.y === y);
    if (existingIndex !== -1) {
      if (window.levelData[existingIndex].type === type) return;
      saveToHistory();
      window.levelData.splice(existingIndex, 1);
    } else {
      saveToHistory();
    }

    window.levelData.push({ type, x, y, _placedAt: Date.now() + Math.random() });
    lastPlacedTile = { x, y };
    updateObjectsCount();
    triggerReload();
  }

  function moveSelectedObjects(dx, dy) {
    if (selectedObjects.length === 0) return;
    saveToHistory();
    
    selectedObjects.forEach(sel => {
      const idx = window.levelData.findIndex(o => o.x === sel.x && o.y === sel.y);
      if (idx !== -1) {
        window.levelData[idx].x += dx;
        window.levelData[idx].y += dy;
        // Update selection state too
        sel.x += dx;
        sel.y += dy;
      }
    });
    
    updateObjectsCount();
    triggerReload();
  }

  function deleteSelectedObjects() {
    if (selectedObjects.length === 0) return;
    saveToHistory();
    
    selectedObjects.forEach(sel => {
      const idx = window.levelData.findIndex(o => o.x === sel.x && o.y === sel.y);
      if (idx !== -1) {
        window.levelData.splice(idx, 1);
      }
    });
    
    selectedObjects = [];
    updateObjectsCount();
    triggerReload();
  }

  function autoGenerateLevelContent() {
    saveToHistory();
    const startX = Math.floor(-cameraX / GRID) + 2;
    const endX = startX + Math.floor(CANVAS_W / GRID) - 4;
    const groundY = Math.floor(GROUND_Y / GRID) - 1;
    
    // Pola sederhana: rintangan bertingkat
    for (let x = startX; x < endX; x += 8) {
      // Platform & Orb
      window.levelData.push({ type: 'block', x: x, y: groundY, _placedAt: Date.now() + Math.random() });
      window.levelData.push({ type: 'block', x: x + 1, y: groundY, _placedAt: Date.now() + Math.random() });
      window.levelData.push({ type: 'orb_yellow', x: x + 2, y: groundY - 3, _placedAt: Date.now() + Math.random() });
      
      // Spike
      window.levelData.push({ type: 'spike', x: x + 4, y: groundY, _placedAt: Date.now() + Math.random() });
      
      // Portal (Acak dikit)
      if (x % 16 === 0) {
        window.levelData.push({ type: 'portal_ship', x: x + 6, y: groundY - 2, _placedAt: Date.now() + Math.random() });
      }
    }
    
    updateObjectsCount();
    triggerReload();
    console.log("%c🎲 Pola rintangan berhasil digenerate!", "color: #00ff88;");
  }

  function selectAt(x, y, isMulti = false) {
    const obj = window.levelData.find(item => item.x === x && item.y === y);
    if (!obj) {
      if (!isMulti) selectedObjects = [];
      return;
    }

    const isAlreadySelected = selectedObjects.some(item => item.x === obj.x && item.y === obj.y);

    if (isMulti) {
      if (isAlreadySelected) {
        selectedObjects = selectedObjects.filter(item => !(item.x === obj.x && item.y === obj.y));
      } else {
        selectedObjects.push({ ...obj });
      }
    } else {
      if (isAlreadySelected && selectedObjects.length === 1) {
        // Tetap terpilih jika klik objek yang sama
      } else {
        selectedObjects = [{ ...obj }];
      }
    }
  }

  function copyObject() {
    if (selectedObjects.length > 0) {
      // Hitung pivot (biasanya objek paling kiri atas)
      const minX = Math.min(...selectedObjects.map(o => o.x));
      const minY = Math.min(...selectedObjects.map(o => o.y));

      clipboard = selectedObjects.map(o => ({
        type: o.type,
        offsetX: o.x - minX,
        offsetY: o.y - minY
      }));
      console.log(`%c📋 ${selectedObjects.length} objek dicopy!`, "color: #00ff88;");
    }
  }

  function pasteObject(startX, startY) {
    if (clipboard.length > 0) {
      saveToHistory();
      clipboard.forEach(item => {
        const x = startX + item.offsetX;
        const y = startY + item.offsetY;
        
        // Hapus objek yang ada di posisi tujuan jika ada
        const existingIndex = window.levelData.findIndex(o => o.x === x && o.y === y);
        if (existingIndex !== -1) window.levelData.splice(existingIndex, 1);
        
        window.levelData.push({ type: item.type, x, y, _placedAt: Date.now() + Math.random() });
      });
      updateObjectsCount();
      triggerReload();
      console.log(`%c📋 ${clipboard.length} objek dipaste!`, "color: #00ff88;");
    }
  }

  function eraseAt(x, y) {
    const existingIndex = window.levelData.findIndex(item => item.x === x && item.y === y);
    if (existingIndex !== -1) {
      saveToHistory();
      window.levelData.splice(existingIndex, 1);
      lastPlacedTile = { x, y };
      updateObjectsCount();
      triggerReload();
    }
  }

  function performUndo() {
    if (history.length === 0) return;
    window.levelData = history.pop();
    updateObjectsCount();
    triggerReload();
  }

  function updateObjectsCount() {
    const count = window.levelData ? window.levelData.length : 0;
    const totalEl = document.getElementById('gd-dev-total');
    if (totalEl) totalEl.textContent = count;
  }

  function triggerReload() {
    if (typeof window.reloadLevel === 'function') {
      window.reloadLevel();
    } else {
      window.dispatchEvent(new CustomEvent('levelReload', { detail: { levelData: window.levelData } }));
    }
  }

  // ============================
  // SIMPAN / MUAT JSON
  // ============================
  function getCleanLevelData() {
    return window.levelData.map(item => {
      const clean = { ...item };
      delete clean._placedAt;
      return clean;
    });
  }

  async function saveJSON() {
    const cleanData = getCleanLevelData();
    const jsonString = JSON.stringify(cleanData, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      const saveBtn = document.getElementById('gd-btn-save');
      const orig = saveBtn.textContent;
      saveBtn.textContent = '📋 Tersalin!';
      saveBtn.style.background = '#ffffff';
      saveBtn.style.color = '#000000';
      setTimeout(() => { saveBtn.textContent = orig; saveBtn.style.background = ''; saveBtn.style.color = ''; }, 1200);
      console.log("%c💾 LEVEL_DATA tersalin ke clipboard!", "color: #00ff88; font-weight: bold;");
    } catch (err) {
      alert("Tidak dapat menyalin otomatis.\n\nSalin JSON berikut secara manual:\n\n" + jsonString);
    }
  }

  async function loadJSON() {
    let jsonString = '';
    try { jsonString = await navigator.clipboard.readText(); } catch (err) {}

    if (!jsonString) {
      jsonString = prompt("Tempel (Paste) kode JSON LEVEL_DATA ke kolom ini:");
    } else {
      if (!confirm("Membaca data level dari clipboard.\nApakah Anda yakin ingin memuatnya?")) return;
    }

    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed)) {
          saveToHistory();
          window.levelData = parsed.map(item => ({ type: item.type, x: Number(item.x), y: Number(item.y), _placedAt: Date.now() }));
          updateObjectsCount();
          triggerReload();
          alert("Level JSON berhasil dimuat!");
        } else {
          alert("Format JSON tidak valid! Harus berupa ARRAY objek.");
        }
      } catch (e) {
        alert("Gagal membaca JSON: " + e.message);
      }
    }
  }

  // ============================
  // WARNA OBJEK BERDASARKAN TEMA LEVEL
  // ============================
  function getLevelThemeColors() {
    // Default warna jika tema tidak tersedia
    let blockFill = '#00008b', blockStroke = '#ffffff';
    let spikeFill = '#000000', spikeStroke = '#333333';
    let slopeFill = '#ff3333', slopeStroke = '#880000';

    // Coba baca tema level aktif dari game
    try {
      const levelIndex = window.currentLevelIndex ?? 0;
      if (levelIndex === 0) {
        blockFill = '#00008b'; blockStroke = '#ffffff'; // Biru gelap
        spikeFill = '#00008b'; spikeStroke = '#ffffff';
      } else if (levelIndex === 1) {
        blockFill = '#ffff00'; blockStroke = '#000000'; // Kuning
        spikeFill = '#ffff00'; spikeStroke = '#000000';
      } else if (levelIndex === 2) {
        blockFill = '#880000'; blockStroke = '#ffffff'; // Merah gelap
        spikeFill = '#880000'; spikeStroke = '#ffffff';
      }
    } catch (e) {}

    return { blockFill, blockStroke, spikeFill, spikeStroke, slopeFill, slopeStroke };
  }

  // ============================
  // RENDERER EDITOR
  // ============================
  function drawLevelData(ctx) {
    if (!overlayCanvas) return;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    ctx.save();
    ctx.translate(cameraX, cameraY);

    const theme = getLevelThemeColors();
    const groundPixel = GROUND_Y;
    const ceilingPixel = CEILING_Y;

    // 1. Gambar grid
    if (!showGameView) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;

      const startTileX = Math.floor(-cameraX / GRID) - 1;
      const endTileX = startTileX + Math.ceil(overlayCanvas.width / GRID) + 2;
      const startTileY = Math.floor(-cameraY / GRID) - 1;
      const endTileY = startTileY + Math.ceil(overlayCanvas.height / GRID) + 2;

      for (let ty = startTileY; ty <= endTileY; ty++) {
        const y = ty * GRID;
        ctx.beginPath(); ctx.moveTo(startTileX * GRID, y); ctx.lineTo(endTileX * GRID, y); ctx.stroke();
      }
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const x = tx * GRID;
        ctx.beginPath(); ctx.moveTo(x, startTileY * GRID); ctx.lineTo(x, endTileY * GRID); ctx.stroke();
      }
    }

    // 2. Garis lantai & atap eksplisit
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    
    // LANTAI (Hijau)
    ctx.strokeStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(-1000, groundPixel);
    ctx.lineTo(levelTotalTime * 312 + 1000, groundPixel);
    ctx.stroke();

    // ATAP (Oranye/Merah Muda)
    ctx.strokeStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(-1000, ceilingPixel);
    ctx.lineTo(levelTotalTime * 312 + 1000, ceilingPixel);
    ctx.stroke();

    ctx.setLineDash([]);

    if (!showGameView) {
      // Label "LANTAI"
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 10px Consolas, monospace';
      ctx.fillText('── LANTAI ──', -cameraX + 240, groundPixel - 4);

      // Label "LANGIT"
      ctx.fillStyle = '#ff8800';
      ctx.fillText('── LANGIT ──', -cameraX + 240, ceilingPixel + 12);

      // 3. Zona terlarang (merah transparan)
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      // Bawah lantai
      ctx.fillRect(-1000, groundPixel, levelTotalTime * 312 + 2000, 1000);
      // Atas langit
      ctx.fillRect(-1000, -1000, levelTotalTime * 312 + 2000, 1000 + ceilingPixel);
      
      // Garis START & FINISH
      ctx.setLineDash([10, 5]);
      ctx.lineWidth = 4;
      
      // START
      ctx.strokeStyle = '#00ffdd';
      ctx.beginPath(); ctx.moveTo(0, -1000); ctx.lineTo(0, 1000); ctx.stroke();
      ctx.fillStyle = '#00ffdd';
      ctx.fillText('🏁 START', 10, 40);
      
      // FINISH
      const finishX = levelTotalTime * 312;
      ctx.strokeStyle = '#ff3355';
      ctx.beginPath(); ctx.moveTo(finishX, -1000); ctx.lineTo(finishX, 1000); ctx.stroke();
      ctx.fillStyle = '#ff3355';
      ctx.fillText('🏁 FINISH', finishX + 10, 40);
      ctx.setLineDash([]);
    }

    // 4. Gambar semua objek
    const now = Date.now();
    for (const o of window.levelData) {
      const pxX = o.x * GRID;
      const pxY = o.y * GRID;
      ctx.save();
      drawObject(ctx, o.type, pxX, pxY, theme, 1.0);

        // Highlight jika dipilih (Hanya di mode editor)
      if (!showGameView) {
        const isSelected = selectedObjects.some(s => s.x === o.x && s.y === o.y);
        if (isSelected) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 3;
          ctx.strokeRect(pxX, pxY, GRID, GRID);
          
          // Animasi pulse sederhana (opacity saja, no shadow)
          const pulse = Math.sin(now / 150) * 0.3 + 0.7;
          ctx.globalAlpha = pulse * 0.3;
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(pxX, pxY, GRID, GRID);
        }
      }
      ctx.restore();
    }

    // 5. Ghost Preview kursor
    if (!showGameView && hoverTile && activeTool !== 'pan') {
      const pxX = hoverTile.x * GRID;
      const pxY = hoverTile.y * GRID;
      ctx.save();
      ctx.globalAlpha = 0.45;
      if (activeTool === 'eraser') {
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.strokeRect(pxX, pxY, GRID, GRID);
        ctx.fillStyle = 'rgba(255, 51, 51, 0.2)';
        ctx.fillRect(pxX, pxY, GRID, GRID);
        ctx.beginPath();
        ctx.moveTo(pxX + 6, pxY + 6); ctx.lineTo(pxX + 26, pxY + 26);
        ctx.moveTo(pxX + 26, pxY + 6); ctx.lineTo(pxX + 6, pxY + 26);
        ctx.stroke();
      } else if (activeTool === 'select') {
        // Preview clipboard jika ada
        if (clipboard.length > 0) {
          clipboard.forEach(item => {
            const cX = pxX + item.offsetX * GRID;
            const cY = pxY + item.offsetY * GRID;
            drawObject(ctx, item.type, cX, cY, theme, 0.3);
            ctx.strokeStyle = '#00ffff';
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(cX, cY, GRID, GRID);
            ctx.setLineDash([]);
          });
        } else {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(pxX, pxY, GRID, GRID);
        }
      } else {
        drawObject(ctx, activeTool, pxX, pxY, theme, 0.5);
      }
      ctx.restore();
    }

    // 6. Gambar selection box jika sedang dragging
    if (isSelectionDragging) {
      const rect = overlayCanvas.getBoundingClientRect();
      const scaleX = overlayCanvas.width / rect.width;
      const scaleY = overlayCanvas.height / rect.height;

      const x1 = (selectionStart.x - rect.left) * scaleX - cameraX;
      const y1 = (selectionStart.y - rect.top) * scaleY - cameraY;
      const x2 = (selectionEnd.x - rect.left) * scaleX - cameraX;
      const y2 = (selectionEnd.y - rect.top) * scaleY - cameraY;

      ctx.save();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.restore();
    }

    ctx.restore(); // Pop camera transform
  }

  /**
   * Menggambar satu objek berdasarkan tipenya
   */
  function drawObject(ctx, type, pxX, pxY, theme, alpha) {
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 0; // Pastikan tidak ada shadow yang bikin kelap-kelip

    switch (type) {
      case 'block':
        ctx.fillStyle = theme.blockFill;
        ctx.fillRect(pxX, pxY, GRID, GRID);
        ctx.strokeStyle = theme.blockStroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(pxX, pxY, GRID, GRID);
        break;

      case 'spike':
        ctx.fillStyle = theme.spikeFill;
        ctx.strokeStyle = theme.spikeStroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pxX + GRID / 2, pxY);
        ctx.lineTo(pxX + GRID, pxY + GRID);
        ctx.lineTo(pxX, pxY + GRID);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case 'spike_down':
        ctx.fillStyle = theme.spikeFill;
        ctx.strokeStyle = theme.spikeStroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pxX + GRID / 2, pxY + GRID);
        ctx.lineTo(pxX + GRID, pxY);
        ctx.lineTo(pxX, pxY);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case 'slope_right':
        ctx.fillStyle = theme.slopeFill;
        ctx.strokeStyle = theme.slopeStroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pxX, pxY + GRID);
        ctx.lineTo(pxX + GRID, pxY);
        ctx.lineTo(pxX + GRID, pxY + GRID);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case 'slope_left':
        ctx.fillStyle = theme.slopeFill;
        ctx.strokeStyle = theme.slopeStroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pxX, pxY);
        ctx.lineTo(pxX, pxY + GRID);
        ctx.lineTo(pxX + GRID, pxY + GRID);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case 'slope_top_right':
        ctx.fillStyle = theme.slopeFill;
        ctx.strokeStyle = theme.slopeStroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pxX, pxY);
        ctx.lineTo(pxX + GRID, pxY);
        ctx.lineTo(pxX + GRID, pxY + GRID);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case 'slope_top_left':
        ctx.fillStyle = theme.slopeFill;
        ctx.strokeStyle = theme.slopeStroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pxX, pxY);
        ctx.lineTo(pxX + GRID, pxY);
        ctx.lineTo(pxX, pxY + GRID);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case 'platform':
        ctx.fillStyle = '#33ff33';
        ctx.fillRect(pxX, pxY, GRID, 8);
        ctx.strokeStyle = '#116611';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pxX, pxY, GRID, 8);
        break;

      // ORB
      case 'orb_yellow':
        drawOrb(ctx, pxX, pxY, '#ffdd00', '#ffee66');
        break;
      case 'orb_green':
        drawOrb(ctx, pxX, pxY, '#00ff44', '#66ff88');
        break;
      case 'orb_blue':
        drawOrb(ctx, pxX, pxY, '#00aaff', '#66ccff');
        break;
      case 'orb_red':
        drawOrb(ctx, pxX, pxY, '#ff3333', '#ff7777');
        break;

      // PORTAL
      case 'portal_ship':
        drawPortal(ctx, pxX, pxY, '#ff66cc', '#cc33aa', '🚀');
        break;
      case 'portal_cube':
        drawPortal(ctx, pxX, pxY, '#33ff66', '#22aa44', '⬜');
        break;
      case 'portal_ball':
        drawPortal(ctx, pxX, pxY, '#ffaa33', '#cc7700', '⚽');
        break;
      case 'portal_gravity_up':
        drawPortal(ctx, pxX, pxY, '#ffee00', '#ccaa00', '⬆');
        break;
      case 'portal_gravity_down':
        drawPortal(ctx, pxX, pxY, '#3399ff', '#1155cc', '⬇');
        break;

      // KOIN
      case 'secret_coin':
        drawCoin(ctx, pxX, pxY);
        break;
    }

    ctx.globalAlpha = 1;
  }

  function drawOrb(ctx, x, y, color, glowColor) {
    const cx = x + GRID / 2;
    const cy = y + GRID / 2;
    const r = GRID / 2 - 3;

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Lingkaran utama
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawPortal(ctx, x, y, color1, color2, emoji) {
    const w = GRID;
    const h = GRID * 2.5; // Portal lebih tinggi (2.5 tile)
    const portalY = y - GRID * 0.75; // Sedikit ke atas agar terpusat di tile

    // Kapsul portal
    ctx.shadowBlur = 0;

    const grad = ctx.createLinearGradient(x, portalY, x, portalY + h);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;

    // Bentuk kapsul
    const radius = w / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, portalY);
    ctx.lineTo(x + w - radius, portalY);
    ctx.arc(x + w - radius, portalY + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + radius, portalY + h);
    ctx.arc(x + radius, portalY + h - radius, radius, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Border putih
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji ikon di tengah
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + w / 2, portalY + h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawCoin(ctx, x, y) {
    const cx = x + GRID / 2;
    const cy = y + GRID / 2;
    const r = GRID / 2 - 3;

    ctx.shadowBlur = 0;

    // Lingkaran emas
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Lingkaran dalam
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Tanda bintang di tengah
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ============================
  // LOOP RENDER
  // ============================
  function devtoolsRenderLoop() {
    if (!isDevModeActive) return;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext('2d');
      drawLevelData(ctx);
      updateTimelineUI(); // Sync timeline bar dengan posisi kamera
    }
    animFrameId = requestAnimationFrame(devtoolsRenderLoop);
  }

})();
