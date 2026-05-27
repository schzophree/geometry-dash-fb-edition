export class LevelEditor {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.setupUI();
    this.setupEvents();
  }

  setupUI() {
    if (document.getElementById('editorUI')) return;

    const editorUI = document.createElement('div');
    editorUI.id = 'editorUI';
    editorUI.style.cssText = \`
      position: absolute; top: 10px; right: 10px;
      background: rgba(0,0,0,0.8); color: white;
      padding: 10px; border-radius: 5px; display: none;
      z-index: 10000; font-family: monospace;
    \`;

    editorUI.innerHTML = \`
      <h3 style="margin:0 0 10px 0; color:#0f0;">MIKU EDITOR (SAFE MODE)</h3>
      <select id="editorType" style="margin-bottom: 10px; width: 100%;">
        <option value="block">Block</option>
        <option value="spike">Spike</option>
      </select>
      <br>
      <button id="editorExport" style="padding:5px;">EXPORT JSON</button>
      <br>
      <textarea id="editorOut" style="display:none; width:100%; height:80px; margin-top:10px;"></textarea>
    \`;

    document.getElementById('gameWrap').appendChild(editorUI);
    this.ui = editorUI;

    this.ui.querySelector('#editorExport').onclick = () => {
      const out = this.ui.querySelector('#editorOut');
      out.value = JSON.stringify({ objects: this.game.obstacles.obstacles });
      out.style.display = 'block';
    };
  }

  setupEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'e' || e.key === 'E') {
        this.active = !this.active;
        this.ui.style.display = this.active ? 'block' : 'none';
        this.game.gameState = this.active ? 'paused_editor' : 'playing';
      }
    });

    const canvas = document.getElementById('gameCanvas');
    canvas.addEventListener('mousedown', (e) => {
      if (!this.active) return;
      if (e.button === 0) { // Add
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (800 / rect.width);
        const y = (e.clientY - rect.top) * (450 / rect.height);
        
        const gx = Math.round(x / 36) * 36;
        const gy = Math.round((y - 396) / 36) * 36 + 396;
        
        const type = document.getElementById('editorType').value;
        if (type === 'block') this.game.obstacles.addBlock(gx, gy - 36);
        if (type === 'spike') this.game.obstacles.addSpike(gx, gy);
      }
    });
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 450); ctx.stroke(); }
    for (let y = 396; y >= 0; y -= 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }
  }
}
