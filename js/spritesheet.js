/** GD 2.2+ atlas for GJ_GameSheet-hd.png — validated crops with fallback */

export const ATLAS = {
  cube_01: { x: 0, y: 0, w: 75, h: 75 },
  cube_02: { x: 75, y: 0, w: 75, h: 75 },
  cube_03: { x: 150, y: 0, w: 75, h: 75 },
  cube_glow: { x: 225, y: 0, w: 75, h: 75 },

  spike_01: { x: 0, y: 164, w: 55, h: 56 },
  spike_02: { x: 55, y: 164, w: 55, h: 56 },
  block_01: { x: 0, y: 220, w: 60, h: 60 },
  block_02: { x: 60, y: 220, w: 60, h: 60 },
  block_glow: { x: 120, y: 220, w: 60, h: 60 },

  orb_yellow: { x: 0, y: 828, w: 53, h: 53 },
  orb_blue: { x: 53, y: 828, w: 53, h: 53 },
  orb_green: { x: 106, y: 828, w: 53, h: 53 },
  orb_red: { x: 159, y: 828, w: 53, h: 53 },
  orb_purple: { x: 212, y: 828, w: 53, h: 53 },

  portal_cube: { x: 0, y: 1016, w: 60, h: 90 },
  portal_ship: { x: 60, y: 1016, w: 60, h: 90 },
  portal_ball: { x: 120, y: 1016, w: 60, h: 90 },

  pad_yellow: { x: 0, y: 934, w: 67, h: 30 },
  pad_pink: { x: 67, y: 934, w: 67, h: 30 },

  ground_tile: { x: 0, y: 614, w: 60, h: 60 },

  bg_line_01: { x: 0, y: 1200, w: 100, h: 20 },
};

let supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

/** Spike segitiga → tengah transparan; portal → area kosong. Cek tengah hanya untuk icon cube. */
const CENTER_ALPHA_KEYS = new Set(['cube_01', 'cube_02', 'cube_03', 'cube_glow']);


/** Sheet2 / sheet non-resmi punya grid lain — crop (0,0) bisa jadi noise/gelombang.
 *  Atlas V1.3 diasumsikan untuk GJ_GameSheet-hd 2048 (build GD 2.2+). */
const MIN_MAIN_SHEET_SIDE = 1800;

function sheetIsMainAtlasSize(img) {
  return img && img.width >= MIN_MAIN_SHEET_SIDE && img.height >= MIN_MAIN_SHEET_SIDE;
}

async function validateAndCrop(sheet, key, rect) {
  try {
    const bitmap = await createImageBitmap(sheet, rect.x, rect.y, rect.w, rect.h);

    if (supportsOffscreenCanvas && CENTER_ALPHA_KEYS.has(key)) {
      const oc = new OffscreenCanvas(Math.max(1, rect.w), Math.max(1, rect.h));
      const ocCtx = oc.getContext('2d');
      ocCtx.drawImage(bitmap, 0, 0);
      const sx = Math.min(Math.floor(rect.w / 2), Math.max(0, rect.w - 1));
      const sy = Math.min(Math.floor(rect.h / 2), Math.max(0, rect.h - 1));
      const data = ocCtx.getImageData(sx, sy, 1, 1).data;

      if (data[3] < 10) {
        bitmap.close?.();
        console.warn(`[Sprite] ${key}: pusat transparan (cube)`);
        return null;
      }
    }

    return bitmap;
  } catch (e) {
    console.warn(`[Sprite] ${key}: gagal crop → pakai fallback`, e);
    return null;
  }
}

/**
 * Fallback cube centered at origin; ctx.translate/rotate sudah oleh caller (mode cube).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} size
 * @param {{ primary:string, accent:string }} lv
 */
export function drawPlayerFallbackCube(ctx, size, lv, beatFlash, allowGlow = true) {
  const w = size;
  const h = size;
  ctx.save();

  if (allowGlow) {
    ctx.shadowColor = lv.primary;
    ctx.shadowBlur = 14 + beatFlash * 12;
  } else ctx.shadowBlur = 0;

  ctx.fillStyle = lv.primary;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10);

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 5, -h / 2 + 5);
  ctx.lineTo(w / 2 - 5, h / 2 - 5);
  ctx.moveTo(w / 2 - 5, -h / 2 + 5);
  ctx.lineTo(-w / 2 + 5, h / 2 - 5);
  ctx.stroke();

  if (allowGlow) {
    ctx.shadowColor = lv.accent;
    ctx.shadowBlur = 8 + beatFlash * 6;
  }
  ctx.fillStyle = lv.accent;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const cd = w / 2 - 7;
  for (const [cx, cy] of [
    [-cd, -cd],
    [cd, -cd],
    [-cd, cd],
    [cd, cd],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  ctx.restore();
}

const SPRITE_FALLBACK = {
  spike_01: ['spike_02'],
  block_02: ['block_01'],
  block_glow: ['block_01'],
  portal_cube: ['portal_ball', 'portal_ship'],
  portal_ship: ['portal_ball', 'portal_cube'],
  pad_pink: ['pad_yellow'],
  orb_purple: ['orb_blue'],
  cube_02: ['cube_01'],
  cube_03: ['cube_01'],
  cube_glow: ['cube_01'],
};

export class Spritesheet {
  constructor() {
    this.sprites = {};
    this.scaleFactor = 36 / 75;
    /** True hanya jika atlas utama 2048 berhasil — hindari bitmap salah dari sheet lain. */
    this.mainAtlasReliable = false;
    this._mainSheetLabel = '';
  }

  async loadSpritesheet(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load spritesheet at ${path}`));
      img.src = path;
    });
  }

  async cropSprite(sheetImage, x, y, w, h) {
    return createImageBitmap(sheetImage, x, y, w, h);
  }

  /**
   * Hanya gunakan path ke GJ_GameSheet-hd.png utama (2048).
   * Jangan campur GJ_GameSheet02: layout beda → icón pemain/spike jadi acak & putih.
   */
  async init(primaryPathsOnly) {
    console.log('[spritesheet] initializing main atlas from:', primaryPathsOnly);
    supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    this.mainAtlasReliable = false;
    this.sprites = {};

    for (const path of primaryPathsOnly) {
      try {
        const sheetImg = await this.loadSpritesheet(path);
        if (!sheetIsMainAtlasSize(sheetImg)) {
          console.warn(
            `[spritesheet] lewati ${path} (${sheetImg.width}×${sheetImg.height}): butuh sheet utama ≥${MIN_MAIN_SHEET_SIDE}px (bukan Sheet02 / non-HD)`,
          );
          continue;
        }

        console.log(`[spritesheet] memakai sheet utama: ${path} (${sheetImg.width}×${sheetImg.height})`);
        this._mainSheetLabel = path;

        for (const [key, rect] of Object.entries(ATLAS)) {
          try {
            if (rect.x + rect.w <= sheetImg.width && rect.y + rect.h <= sheetImg.height) {
              const validated = await validateAndCrop(sheetImg, key, rect);
              if (validated) {
                this.sprites[key] = validated;
              }
            } else {
              console.warn(
                `[spritesheet] ✗ OOB ${key} vs (${sheetImg.width}×${sheetImg.height})`,
              );
            }
          } catch (cropErr) {
            console.warn(`[spritesheet] ✗ ${key}: ${cropErr.message}`);
          }
        }

        this.mainAtlasReliable = true;
        if (!this.sprites.cube_01) {
          console.warn('[spritesheet] cube_01 tidak lolos validasi — gunakan ikon vektor (config gameplay.useVectorCubeIcon)');
        }
        break;
      } catch (err) {
        console.warn(`[spritesheet] gagal muat ${path}:`, err.message);
      }
    }

    console.log(
      `[spritesheet] selesai: ${Object.keys(this.sprites).length}/${Object.keys(ATLAS).length} sprite, reliable=${this.mainAtlasReliable}`,
    );
  }

  getSprite(key) {
    if (!this.mainAtlasReliable) return null;
    const order = [key];
    const fb = SPRITE_FALLBACK[key];
    if (fb) order.push(...fb);
    for (const k of order) {
      const bmp = this.sprites[k];
      if (bmp) return bmp;
    }
    return null;
  }
}
