// stripRenderer.js
// Single source of truth for drawing the photobooth strip.
// Used for BOTH the on-screen live preview and the high-resolution exported PNG.

import { CONFIG } from './config.js';

/**
 * Calculates strip dimensions based on scale factor
 */
export function getStripDimensions(scale = 1) {
  const baseW = CONFIG.strip.baseWidth;
  const pad = CONFIG.strip.padding;
  const gap = CONFIG.strip.gap;
  const headerH = CONFIG.strip.headerHeight;
  const footerH = CONFIG.strip.footerHeight;
  const photoW = baseW - (pad * 2);
  const photoH = photoW / CONFIG.aspectRatio;
  const totalH = headerH + (photoH * CONFIG.photoCount) + (gap * (CONFIG.photoCount - 1)) + footerH;

  return {
    baseW,
    baseH: totalH,
    scaledW: Math.round(baseW * scale),
    scaledH: Math.round(totalH * scale),
    pad,
    gap,
    headerH,
    footerH,
    photoW,
    photoH,
    scale,
  };
}

/**
 * Procedural vector pattern drawing functions.
 * Pattern tile size is proportional to strip width (baseW).
 * Drawn ONLY in the border/frame area, never behind photos.
 */
function drawThemePattern(ctx, theme, baseW, baseH) {
  if (!theme || !theme.pattern || theme.pattern === 'plain') return;

  const tileSize = Math.round(baseW * 0.088); // Proportional tile size (~33px at 380w)
  const tint = theme.patternTint || 'rgba(0,0,0,0.08)';

  switch (theme.pattern) {
    case 'hearts':
      drawHeartsPattern(ctx, baseW, baseH, tileSize, tint);
      break;
    case 'stars':
      drawStarsPattern(ctx, baseW, baseH, tileSize, tint);
      break;
    case 'paws':
      drawPawsPattern(ctx, baseW, baseH, tileSize, tint);
      break;
    case 'checker':
      drawCheckerPattern(ctx, baseW, baseH, tileSize, tint);
      break;
  }
}

function drawHeartsPattern(ctx, baseW, baseH, tileSize, color) {
  const cols = Math.ceil(baseW / tileSize) + 1;
  const rows = Math.ceil(baseH / tileSize) + 1;
  const r = tileSize * 0.28;

  ctx.save();
  ctx.fillStyle = color;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2 === 1) ? tileSize * 0.5 : 0;
      const cx = col * tileSize + offsetX;
      const cy = row * tileSize + tileSize * 0.5;

      ctx.beginPath();
      const d = r * 0.7;
      ctx.moveTo(cx, cy + d);
      ctx.bezierCurveTo(cx - d * 1.5, cy - d * 0.5, cx - d * 0.8, cy - d * 1.6, cx, cy - d * 0.6);
      ctx.bezierCurveTo(cx + d * 0.8, cy - d * 1.6, cx + d * 1.5, cy - d * 0.5, cx, cy + d);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStarsPattern(ctx, baseW, baseH, tileSize, color) {
  const cols = Math.ceil(baseW / tileSize) + 1;
  const rows = Math.ceil(baseH / tileSize) + 1;
  const r = tileSize * 0.28;

  ctx.save();
  ctx.fillStyle = color;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2 === 1) ? tileSize * 0.5 : 0;
      const cx = col * tileSize + offsetX;
      const cy = row * tileSize + tileSize * 0.5;

      // 4-point retro sparkle star
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx - r, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - r);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPawsPattern(ctx, baseW, baseH, tileSize, color) {
  const cols = Math.ceil(baseW / tileSize) + 1;
  const rows = Math.ceil(baseH / tileSize) + 1;
  const r = tileSize * 0.32;

  ctx.save();
  ctx.fillStyle = color;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2 === 1) ? tileSize * 0.5 : 0;
      const cx = col * tileSize + offsetX;
      const cy = row * tileSize + tileSize * 0.5;

      // Central paw pad
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.18, r * 0.42, r * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3 Toe beans
      const toeR = r * 0.15;
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.35, cy - r * 0.15, toeR, toeR * 1.1, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.32, toeR, toeR * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx + r * 0.35, cy - r * 0.15, toeR, toeR * 1.1, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCheckerPattern(ctx, baseW, baseH, tileSize, color) {
  const cols = Math.ceil(baseW / tileSize);
  const rows = Math.ceil(baseH / tileSize);

  ctx.save();
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }
  }
  ctx.restore();
}

/**
 * 8 Cute Y2K Cat-Themed Sticker Vector SVGs
 */
export const STICKER_SVGS = {
  paw: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="30" rx="14" ry="11" fill="#FFF4E0" stroke="#2B2330" stroke-width="2.5"/>
    <ellipse cx="24" cy="30" rx="10" ry="7.5" fill="#F4B9C2"/>
    <ellipse cx="12" cy="18" rx="5" ry="6.5" transform="rotate(-15 12 18)" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <ellipse cx="12" cy="18" rx="3.5" ry="5" transform="rotate(-15 12 18)" fill="#F4B9C2"/>
    <ellipse cx="24" cy="13" rx="5" ry="7" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <ellipse cx="24" cy="13" rx="3.5" ry="5.5" fill="#F4B9C2"/>
    <ellipse cx="36" cy="18" rx="5" ry="6.5" transform="rotate(15 36 18)" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <ellipse cx="36" cy="18" rx="3.5" ry="5" transform="rotate(15 36 18)" fill="#F4B9C2"/>
  </svg>`,

  heart: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 42 C16 34 6 26 6 16 C6 9 11 4 18 4 C22 4 24 7 24 7 C24 7 26 4 30 4 C37 4 42 9 42 16 C42 26 32 34 24 42 Z" fill="#B8404A" stroke="#2B2330" stroke-width="2.5"/>
    <path d="M24 37 C18 30 10 23 10 16 C10 11 14 7 19 7 C22 7 24 9 24 9 C24 9 26 7 29 7 C34 7 38 11 38 16 C38 23 30 30 24 37 Z" fill="#F4B9C2"/>
    <circle cx="16" cy="13" r="3" fill="#FFFFFF"/>
    <circle cx="13" cy="18" r="1.5" fill="#FFFFFF"/>
  </svg>`,

  star: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 3 L29 17 L44 24 L29 31 L24 45 L19 31 L4 24 L19 17 Z" fill="#E2B33C" stroke="#2B2330" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M24 9 L27 19 L38 24 L27 29 L24 39 L21 29 L10 24 L21 19 Z" fill="#FFF4E0"/>
    <circle cx="24" cy="24" r="3" fill="#E2B33C"/>
  </svg>`,

  bow: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 24 C14 16 6 18 6 24 C6 30 14 32 22 24 Z" fill="#FFF4E0" stroke="#2B2330" stroke-width="2.2"/>
    <path d="M26 24 C34 16 42 18 42 24 C42 30 34 32 26 24 Z" fill="#FFF4E0" stroke="#2B2330" stroke-width="2.2"/>
    <path d="M20 26 L12 40 L19 37 L24 28" fill="#F4B9C2" stroke="#2B2330" stroke-width="2"/>
    <path d="M28 26 L36 40 L29 37 L24 28" fill="#F4B9C2" stroke="#2B2330" stroke-width="2"/>
    <rect x="20" y="20" width="8" height="8" rx="2.5" fill="#B8404A" stroke="#2B2330" stroke-width="2"/>
  </svg>`,

  chocoStamp: `<svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="60" height="32" rx="4" fill="#FFF4E0" stroke="#2B2330" stroke-width="2.5"/>
    <rect x="5" y="5" width="54" height="26" rx="2" fill="#2F8F8A" stroke="#2B2330" stroke-width="1.2" stroke-dasharray="3 2"/>
    <text x="32" y="22" font-family="'Press Start 2P', monospace" font-size="8.5" fill="#FFF4E0" text-anchor="middle" font-weight="bold">CHOCO</text>
  </svg>`,

  fish: `<svg viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="22" cy="18" rx="14" ry="10" fill="#E2B33C" stroke="#2B2330" stroke-width="2.2"/>
    <polygon points="34,18 44,9 41,18 44,27" fill="#E2B33C" stroke="#2B2330" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="14" cy="15" r="2.2" fill="#2B2330"/>
    <path d="M12 21 Q14 23 16 21" stroke="#2B2330" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M22 17 Q25 14 26 19" stroke="#2B2330" stroke-width="1.8" fill="#FFF4E0"/>
  </svg>`,

  flower: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="12" r="7" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <circle cx="35" cy="20" r="7" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <circle cx="31" cy="33" r="7" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <circle cx="17" cy="33" r="7" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <circle cx="13" cy="20" r="7" fill="#FFF4E0" stroke="#2B2330" stroke-width="2"/>
    <circle cx="24" cy="24" r="6.5" fill="#E2B33C" stroke="#2B2330" stroke-width="2"/>
  </svg>`,

  catFace: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="10,22 14,8 22,17" fill="#9DB59A" stroke="#2B2330" stroke-width="2.2"/>
    <polygon points="38,22 34,8 26,17" fill="#9DB59A" stroke="#2B2330" stroke-width="2.2"/>
    <polygon points="12,20 15,11 20,17" fill="#F4B9C2"/>
    <polygon points="36,20 33,11 28,17" fill="#F4B9C2"/>
    <circle cx="24" cy="27" r="14" fill="#FFF4E0" stroke="#2B2330" stroke-width="2.2"/>
    <circle cx="19" cy="25" r="2.5" fill="#2B2330"/>
    <circle cx="29" cy="25" r="2.5" fill="#2B2330"/>
    <polygon points="23,28 25,28 24,30" fill="#B8404A"/>
    <path d="M22 31 Q24 33 26 31" stroke="#2B2330" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <line x1="8" y1="26" x2="15" y2="27" stroke="#2B2330" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="8" y1="30" x2="15" y2="29" stroke="#2B2330" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="40" y1="26" x2="33" y2="27" stroke="#2B2330" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="40" y1="30" x2="33" y2="29" stroke="#2B2330" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,
};

// Sticker Image Cache for Canvas Drawing
const stickerImgCache = {};

export function getStickerImage(type) {
  if (stickerImgCache[type]) return stickerImgCache[type];
  const svg = STICKER_SVGS[type];
  if (!svg) return null;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  stickerImgCache[type] = img;
  return img;
}

// Preload sticker images into memory
Object.keys(STICKER_SVGS).forEach(getStickerImage);

/**
 * Procedural Film Grain Tile Cache for Disposable Camera Filter
 */
let grainPatternCache = null;

function getGrainPattern(ctx) {
  if (grainPatternCache) return grainPatternCache;
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 128;
  grainCanvas.height = 128;
  const gCtx = grainCanvas.getContext('2d');
  if (!gCtx) return null;
  const imgData = gCtx.createImageData(128, 128);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 26; // subtle grain opacity (~10%)
  }
  gCtx.putImageData(imgData, 0, 0);
  grainPatternCache = ctx.createPattern(grainCanvas, 'repeat');
  return grainPatternCache;
}

/**
 * Draw Procedural Film Grain Overlay
 */
function drawProceduralFilmGrain(ctx, x, y, w, h) {
  const pattern = getGrainPattern(ctx);
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/**
 * Draw Retro Orange Segmented Date Stamp in Bottom-Right Corner
 * e.g. '04 11 08
 */
function drawDisposableDateStamp(ctx, x, y, w, h) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `'04 ${mm} ${dd}`;

  ctx.save();
  const fontSize = Math.max(10, Math.round(w * 0.052));
  ctx.font = `bold ${fontSize}px "VT323", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  const posX = x + w - Math.round(w * 0.04);
  const posY = y + h - Math.round(h * 0.035);

  // Soft glowing amber halo
  ctx.shadowColor = 'rgba(255, 110, 0, 0.9)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = '#FFA633';
  ctx.fillText(dateStr, posX, posY);

  // Crisp foreground
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FF7A00';
  ctx.fillText(dateStr, posX, posY);

  ctx.restore();
}

/**
 * Draw a photo with the selected canvas filter
 */
export function drawFilteredPhoto(ctx, photo, x, y, w, h, filterName = 'none') {
  ctx.save();

  // Strict clipping region to prevent filter washes/grain from bleeding outside photo mat
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  switch (filterName) {
    case 'bw':
      ctx.filter = 'grayscale(100%) contrast(120%) brightness(104%)';
      ctx.drawImage(photo, x, y, w, h);
      break;

    case 'vintage':
      ctx.filter = 'sepia(38%) contrast(92%) brightness(104%) saturate(85%)';
      ctx.drawImage(photo, x, y, w, h);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(255, 225, 190, 0.10)';
      ctx.fillRect(x, y, w, h);
      break;

    case 'disposable':
      ctx.filter = 'sepia(24%) saturate(125%) contrast(110%) brightness(102%)';
      ctx.drawImage(photo, x, y, w, h);
      ctx.filter = 'none';
      // Warm disposable camera tint
      ctx.fillStyle = 'rgba(255, 180, 80, 0.10)';
      ctx.fillRect(x, y, w, h);
      // Film grain overlay
      drawProceduralFilmGrain(ctx, x, y, w, h);
      // Retro glowing orange date stamp
      drawDisposableDateStamp(ctx, x, y, w, h);
      break;

    case 'softGlow':
      ctx.filter = 'brightness(106%) contrast(96%) saturate(112%)';
      ctx.drawImage(photo, x, y, w, h);
      // Diffused soft highlight bloom pass
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(4px) brightness(120%)';
      ctx.globalAlpha = 0.38;
      ctx.drawImage(photo, x, y, w, h);
      ctx.restore();
      break;

    case 'none':
    default:
      ctx.filter = 'none';
      ctx.drawImage(photo, x, y, w, h);
      break;
  }

  ctx.restore();
}

/**
 * Draw Placed Stickers on Strip
 */
function drawStickersOnStrip(ctx, stickers, baseW, baseH) {
  if (!stickers || !Array.isArray(stickers)) return;

  for (const s of stickers) {
    const img = getStickerImage(s.type);
    if (!img) continue;

    const px = (s.relX != null ? s.relX : 0.5) * baseW;
    const py = (s.relY != null ? s.relY : 0.5) * baseH;
    const size = (s.scale || 0.18) * baseW;
    const rot = ((s.rotation != null ? s.rotation : 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    // Hard offset shadow matching Y2K graphic style
    ctx.shadowColor = 'rgba(43, 35, 48, 0.32)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1.5;
    ctx.shadowOffsetY = 1.5;

    if (img.complete && img.naturalWidth > 0) {
      const aspect = img.naturalWidth / img.naturalHeight;
      const drawW = aspect >= 1 ? size : size * aspect;
      const drawH = aspect >= 1 ? size / aspect : size;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    }
    ctx.restore();
  }
}

/**
 * Render the complete photobooth strip onto a canvas.
 * @param {HTMLCanvasElement} canvas - The target canvas (preview or offscreen export)
 * @param {Array<CanvasImageSource>} photos - Array of captured cropped photo canvases/images
 * @param {Object} options - Custom options (scale, theme, filter, stickers, dateString, logoImg)
 */
export function renderStrip(canvas, photos = [], options = {}) {
  const scale = options.scale || 1;
  const theme = options.theme || CONFIG.themes[CONFIG.defaultTheme];
  const filter = options.filter || CONFIG.defaultFilter || 'none';
  const stickers = options.stickers || [];
  const dims = getStripDimensions(scale);

  // Set real pixel canvas dimensions
  canvas.width = dims.scaledW;
  canvas.height = dims.scaledH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  // Scale drawing context so all coordinate math uses standard logical units
  ctx.scale(scale, scale);

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const { baseW, baseH, pad, gap, headerH, photoW, photoH, footerH } = dims;

  // 1. Draw Outer Strip Background (Frame Color)
  ctx.fillStyle = theme.frameColor || CONFIG.colors.dustyPink;
  ctx.fillRect(0, 0, baseW, baseH);

  // 2. Draw Curated Theme Pattern in the Border Area (Proportional to strip width)
  drawThemePattern(ctx, theme, baseW, baseH);

  // 3. Render Each Photo Slot (1 to 4)
  // Opaque cream mat covers background pattern so pattern is NEVER behind photos!
  for (let i = 0; i < CONFIG.photoCount; i++) {
    const x = pad;
    const y = headerH + i * (photoH + gap);

    // Inner Cream Photo Mat / Border
    ctx.fillStyle = theme.interiorColor || CONFIG.colors.cream;
    ctx.fillRect(x - 3, y - 3, photoW + 6, photoH + 6);
    ctx.strokeStyle = theme.outlineColor || CONFIG.colors.outline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 3, y - 3, photoW + 6, photoH + 6);

    const photo = photos[i];
    if (photo) {
      // Draw captured cropped photo with selected filter
      drawFilteredPhoto(ctx, photo, x, y, photoW, photoH, filter);

      // Photo inner outline
      ctx.strokeStyle = theme.outlineColor || CONFIG.colors.outline;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, photoW, photoH);
    } else {
      // Placeholder slot before photo is captured
      ctx.fillStyle = '#F8EBD3';
      ctx.fillRect(x, y, photoW, photoH);

      ctx.fillStyle = '#9C8E7C';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`[ Photo ${i + 1} ]`, x + photoW / 2, y + photoH / 2);
    }
  }

  // 4. Footer Section (with even padding around text and mascot logo)
  const footerY = baseH - footerH;

  // Brand text: "chocobooth" in tiny pixel font
  ctx.fillStyle = theme.textColor || theme.outlineColor || CONFIG.colors.outline;
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('chocobooth', pad + 4, footerY + 22);

  // Small Choco head / logo preserving natural aspect ratio
  if (options.logoImg && options.logoImg.complete && options.logoImg.naturalWidth > 0) {
    const img = options.logoImg;
    const w = 46;
    const h = w * img.naturalHeight / img.naturalWidth;
    const x = baseW - pad - w - 4;
    const y = footerY + (footerH - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  // Date Stamp in soft rounded font
  const dateStr = options.dateString || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  ctx.fillStyle = theme.dateColor || '#6B5854';
  ctx.font = 'bold 12px "Nunito", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(dateStr, pad + 4, footerY + 46);

  // 5. Placed Stickers (Rendered on top of photos and frame at high resolution)
  if (stickers.length > 0) {
    drawStickersOnStrip(ctx, stickers, baseW, baseH);
  }

  // 6. Outer Border Outline (ensures all 4 sides remain fully inside canvas bounds for export)
  const borderWidth = CONFIG.strip.outlineWidth || 3;
  ctx.strokeStyle = theme.outlineColor || CONFIG.colors.outline;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, baseW - borderWidth, baseH - borderWidth);

  ctx.restore();
}

/**
 * Generate a high-resolution export data URL using the single draw function
 */
export function exportStripDataURL(photos, options = {}) {
  const exportScale = options.scale || CONFIG.strip.exportScale;
  const offscreen = document.createElement('canvas');
  renderStrip(offscreen, photos, { ...options, scale: exportScale });
  return offscreen.toDataURL('image/png');
}

/**
 * Triggers browser download of the vertical film strip as high-res PNG
 */
export function downloadStripPNG(photos, options = {}, filename = 'chocobooth-strip.png') {
  const dataUrl = exportStripDataURL(photos, options);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
