// booth.js
// Core photobooth logic for chocobooth
// Features: Webcam 4:3 full-width capture, 3-2-1 countdown with "Photo X of 4" indicator,
// full-screen flash & shutter sounds, darkroom developing screen with chunky progress bar,
// and "Pick your strip" 6-theme interactive carousel (arrows, keyboard, click, trackpad swipe).

import { CONFIG } from './config.js';
import { renderStrip, downloadStripPNG, STICKER_SVGS } from './stripRenderer.js';

// 6 Curated Themes in order
const THEME_LIST = [
  'strawberryMilk',
  'midnightArcade',
  'matchaLatte',
  'cherryPop',
  'lagoon',
  'butterToast',
];

// Application State
const state = {
  stream: null,
  isCapturing: false,
  capturedPhotos: [],
  soundEnabled: localStorage.getItem('chocobooth_sound_enabled') !== 'false',
  audioCtx: null,
  logoImg: null,
  currentView: 'booth', // 'booth' | 'picker'
  activeCarouselIdx: 0, // Default to Strawberry Milk
  activeFilter: CONFIG.defaultFilter || 'none', // 'none' | 'bw' | 'vintage' | 'disposable' | 'softGlow'
  stickers: [], // Placed stickers on strip: [{ id, type, relX, relY, scale, rotation }]
  selectedStickerId: null, // Currently selected/active sticker
};

// DOM Elements - Common
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const flashEl = document.getElementById('flash-overlay');

// DOM Elements - Main Screen (Booth View)
const boothViewEl = document.getElementById('booth-view');
const videoEl = document.getElementById('webcam-video');
const videoStatusEl = document.getElementById('video-status');
const countdownEl = document.getElementById('countdown-overlay');
const photoIndexBadgeEl = document.getElementById('photo-index-badge');
const startBtn = document.getElementById('start-btn');
const retakeBtn = document.getElementById('retake-btn');
const statusMsgEl = document.getElementById('booth-status-msg');
const mascotImgEl = document.getElementById('mascot-img');
const speechBubbleEl = document.getElementById('speech-bubble');
const sleepingZEl = document.getElementById('sleeping-z');

// DOM Elements - Developing Modal
const developingModalEl = document.getElementById('developing-modal');
const developingProgressFillEl = document.getElementById('developing-progress-fill');
const developingPercentageEl = document.getElementById('developing-percentage');
const developingSubtextEl = document.getElementById('developing-subtext');

// DOM Elements - "Pick your strip" Screen (Picker View)
const pickerViewEl = document.getElementById('picker-view');
const carouselStageEl = document.getElementById('carousel-stage');
const carouselViewportWrapperEl = document.getElementById('carousel-viewport-wrapper');
const carouselPrevBtn = document.getElementById('carousel-prev-btn');
const carouselNextBtn = document.getElementById('carousel-next-btn');
const carouselThemeTitleEl = document.getElementById('carousel-theme-name');
const carouselThemePatternEl = document.getElementById('carousel-theme-pattern');
const carouselDotsRowEl = document.getElementById('carousel-dots-row');
const carouselDownloadBtn = document.getElementById('carousel-download-btn');
const carouselRetakeBtn = document.getElementById('carousel-retake-btn');

/**
 * Initialize Web Audio Context on first user interaction
 */
function initAudio() {
  if (!state.audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      state.audioCtx = new AudioContextClass();
    }
  }
}

/**
 * Play shutter sound (uses click.mp3, with Web Audio synthesized click fallback)
 */
function playShutterSound() {
  if (!state.soundEnabled) return;

  const audio = new Audio(CONFIG.audio.click);
  audio.play().catch(() => {
    playSyntheticClick();
  });
}

/**
 * Synthesizes a crisp camera shutter mechanical click using Web Audio
 */
function playSyntheticClick() {
  try {
    initAudio();
    if (!state.audioCtx) return;
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }

    const t = state.audioCtx.currentTime;
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(state.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  } catch (e) {
    // Audio fail safe
  }
}

/**
 * Start webcam stream with user facing camera
 */
async function initWebcam() {
  videoStatusEl.classList.remove('error-state');
  videoStatusEl.innerHTML = `
    <div class="retro-spinner-box">
      <div class="retro-spinner-dots">
        <span class="dot d1">■</span><span class="dot d2">■</span><span class="dot d3">■</span>
      </div>
      <div class="retro-loading-text">CONNECTING TO WEBCAM...</div>
      <div class="retro-loading-subtext">Please allow browser permissions if prompted</div>
    </div>
  `;
  videoStatusEl.style.display = 'flex';
  startBtn.disabled = true;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError('Camera API is not supported in this browser or context. Note: Camera access requires HTTPS or http://localhost.');
    return;
  }

  try {
    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.stream = stream;
    videoEl.srcObject = stream;

    await new Promise((resolve) => {
      videoEl.onloadedmetadata = () => resolve();
    });

    videoEl.play();
    videoStatusEl.style.display = 'none';
    startBtn.disabled = false;
    statusMsgEl.textContent = 'Camera active. Click "START BOOTH" to begin.';
    setMascotExpression('idle');
  } catch (err) {
    handleCameraError(err);
  }
}

/**
 * Friendly error messages for camera failure
 */
function handleCameraError(err) {
  let msg = 'Could not access camera.';
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    msg = 'Camera permission denied. Please allow camera permissions in your browser address bar and click Retry.';
  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    msg = 'No webcam found. Please connect a camera and click Retry.';
  } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    msg = 'Camera is currently in use by another app. Please close other camera apps and click Retry.';
  } else if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    msg = 'Camera access requires HTTPS or localhost. Current origin is insecure.';
  } else {
    msg = `Camera error: ${err.message || err.name}`;
  }
  showError(msg);
}

function showError(msg) {
  videoStatusEl.classList.add('error-state');
  videoStatusEl.innerHTML = `
    <div class="retro-error-dialog">
      <div class="error-icon">📷⚠️</div>
      <div class="error-title">CAMERA ACCESS NEEDED</div>
      <div class="error-desc">${msg}</div>
      <button type="button" class="retro-btn retry-btn" id="camera-retry-btn">↺ RETRY ACCESS</button>
    </div>
  `;
  videoStatusEl.style.display = 'flex';
  startBtn.disabled = true;
  statusMsgEl.textContent = 'Camera error: Please allow permissions.';

  const retryBtn = document.getElementById('camera-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      initWebcam();
    });
  }
}

/**
 * Set Choco Mascot Expression and Speech Bubble
 */
function setMascotExpression(expression, customText = null) {
  if (sleepingZEl) {
    sleepingZEl.style.display = expression === 'developing' ? 'flex' : 'none';
  }

  if (mascotImgEl && CONFIG.mascotAssets[expression]) {
    mascotImgEl.src = CONFIG.mascotAssets[expression];
  }

  if (speechBubbleEl) {
    if (customText) {
      speechBubbleEl.textContent = customText;
    } else {
      switch (expression) {
        case 'idle':
          const lines = CONFIG.mascotLines.idle;
          speechBubbleEl.textContent = lines[Math.floor(Math.random() * lines.length)];
          break;
        case 'shocked':
          speechBubbleEl.textContent = '3';
          break;
        case 'approve':
          speechBubbleEl.textContent = CONFIG.mascotLines.afterShot;
          break;
        case 'developing':
          speechBubbleEl.textContent = CONFIG.mascotLines.developing;
          break;
        case 'happy':
          speechBubbleEl.textContent = CONFIG.mascotLines.done;
          break;
      }
    }
  }
}

/**
 * Captures a frame from the video element:
 * 1. Center-crops to CONFIG.aspectRatio (e.g. 4:3) regardless of webcam aspect ratio (16:9, etc.)
 * 2. Mirrors horizontally so captured photo matches what user sees in mirrored preview
 * 3. Returns an offscreen canvas containing the cropped high-res image
 */
function captureCroppedFrame(video) {
  const vW = video.videoWidth;
  const vH = video.videoHeight;
  const targetAspect = CONFIG.aspectRatio;
  const vAspect = vW / vH;

  let srcX = 0;
  let srcY = 0;
  let srcW = vW;
  let srcH = vH;

  if (vAspect > targetAspect) {
    srcW = vH * targetAspect;
    srcX = (vW - srcW) / 2;
  } else {
    srcH = vW / targetAspect;
    srcY = (vH - srcH) / 2;
  }

  const capCanvas = document.createElement('canvas');
  capCanvas.width = 1200;
  capCanvas.height = Math.round(1200 / targetAspect);
  const ctx = capCanvas.getContext('2d');

  // Mirror horizontally so it matches preview
  ctx.translate(capCanvas.width, 0);
  ctx.scale(-1, 1);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, capCanvas.width, capCanvas.height);

  return capCanvas;
}

/**
 * Helper to pause execution
 */
function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs countdown (3, 2, 1) and shows "Photo X of 4" indicator
 */
async function runCountdown(photoNumber) {
  countdownEl.style.display = 'flex';
  if (photoIndexBadgeEl) {
    photoIndexBadgeEl.textContent = `PHOTO ${photoNumber} OF ${CONFIG.photoCount}`;
    photoIndexBadgeEl.style.display = 'block';
  }
  setMascotExpression('shocked', '3');

  for (let s = CONFIG.countdownSeconds; s > 0; s--) {
    countdownEl.textContent = s;
    if (speechBubbleEl) speechBubbleEl.textContent = `${s}`;
    statusMsgEl.textContent = `Photo ${photoNumber} of ${CONFIG.photoCount} in ${s}...`;
    await waitMs(1000);
  }

  countdownEl.textContent = 'CHEESE!';
  if (speechBubbleEl) speechBubbleEl.textContent = 'CHEESE!';
  await waitMs(250);
  countdownEl.style.display = 'none';
}

/**
 * Full-screen quick white flash on each capture
 */
async function triggerFlash() {
  if (flashEl) {
    flashEl.classList.add('active');
    await waitMs(90);
    flashEl.classList.remove('active');
  }
}

/**
 * "Developing..." screen with chunky retro loading bar, sleeping Choco,
 * and text "Choco is developing your photos..."
 */
async function runDevelopingScreen() {
  setMascotExpression('sleeping', CONFIG.mascotLines.developing);
  statusMsgEl.textContent = 'Choco is developing your photos...';

  if (developingModalEl) {
    developingModalEl.style.display = 'flex';
  }

  const duration = CONFIG.developingDurationMs || 2500;
  const startTime = performance.now();

  const stages = [
    { at: 0, text: 'Washing negative prints...' },
    { at: 35, text: 'Mixing retro color chemistry...' },
    { at: 70, text: 'Adding Choco sparkle & drying...' },
    { at: 92, text: 'Final polish by Choco...' },
  ];

  await new Promise((resolve) => {
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const pct = Math.round(progress * 100);

      if (developingProgressFillEl) {
        developingProgressFillEl.style.width = `${pct}%`;
      }
      if (developingPercentageEl) {
        developingPercentageEl.textContent = `${pct}%`;
      }

      const stage = stages.slice().reverse().find((s) => pct >= s.at);
      if (stage && developingSubtextEl) {
        developingSubtextEl.textContent = stage.text;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(resolve, 250);
      }
    }
    requestAnimationFrame(step);
  });

  if (developingModalEl) {
    developingModalEl.style.display = 'none';
  }
}

/**
 * Main 4-photo photobooth sequence
 */
async function startPhotoboothSequence() {
  if (state.isCapturing || !state.stream) return;

  initAudio();
  state.isCapturing = true;
  state.capturedPhotos = [];

  // Reset UI
  startBtn.disabled = true;
  retakeBtn.disabled = true;

  // Shoot 4 photos in sequence
  for (let i = 0; i < CONFIG.photoCount; i++) {
    const photoNumber = i + 1;

    // Countdown 3-2-1 with Photo X of 4 indicator
    await runCountdown(photoNumber);

    // Capture & shutter sound
    triggerFlash();
    playShutterSound();

    const photoCanvas = captureCroppedFrame(videoEl);
    state.capturedPhotos.push(photoCanvas);

    setMascotExpression('approve', CONFIG.mascotLines.afterShot);
    statusMsgEl.textContent = `Captured photo ${photoNumber} of ${CONFIG.photoCount}!`;

    // Pause between shots (if not last shot)
    if (i < CONFIG.photoCount - 1) {
      statusMsgEl.textContent = `Get ready for photo ${photoNumber + 1}...`;
      await waitMs(CONFIG.pauseBetweenShotsMs);
    }
  }

  // Hide Photo indicator badge
  if (photoIndexBadgeEl) {
    photoIndexBadgeEl.style.display = 'none';
  }

  // Photos taken -> Launch Darkroom Developing Screen
  await runDevelopingScreen();

  state.isCapturing = false;
  startBtn.disabled = false;
  retakeBtn.disabled = false;

  // Transition to "Pick your strip" Screen
  openPickerView();
}

/**
 * ==========================================================================
 * "Pick your strip" Screen - 6-Theme Interactive Carousel
 * ==========================================================================
 */

/**
 * Open the "Pick your strip" view and render the 6 theme strips
 */
function openPickerView() {
  state.currentView = 'picker';
  boothViewEl.style.display = 'none';
  pickerViewEl.style.display = 'flex';

  // Default selection is Strawberry Milk (index 0)
  state.activeCarouselIdx = 0;

  // Render user's real 4 photos onto all 6 theme strip canvases using the SINGLE draw function
  renderAllCarouselStrips();

  // Position carousel slides
  updateCarouselPositions();
}

/**
 * Return to booth view and reset
 */
function closePickerView() {
  state.currentView = 'booth';
  pickerViewEl.style.display = 'none';
  boothViewEl.style.display = 'flex';
  handleRetake();
}

/**
 * Helper to calculate shortest circular offset in carousel (-3 to +3)
 */
function getCircularOffset(i, active, total = 6) {
  let diff = (i - active) % total;
  if (diff > total / 2) diff -= total;
  else if (diff < -total / 2) diff += total;
  return diff;
}

/**
 * Build the 6 Carousel slides & position dots once during initialization
 */
function buildCarouselDOM() {
  if (!carouselStageEl) return;
  carouselStageEl.innerHTML = '';

  THEME_LIST.forEach((themeKey, idx) => {
    const theme = CONFIG.themes[themeKey];
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.dataset.index = idx;

    // Wrap canvas & stickers overlay
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-strip-wrapper';

    // Canvas rendered at 1x base screen size (380x1164) for maximum speed and crispness
    const canvas = document.createElement('canvas');
    canvas.className = 'carousel-strip-canvas';
    canvas.dataset.theme = themeKey;
    wrapper.appendChild(canvas);

    // Interactive stickers overlay
    const overlay = document.createElement('div');
    overlay.className = 'strip-stickers-overlay';
    overlay.dataset.index = idx;

    // Drag-over and drop support for dragging from the sticker tray
    overlay.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    overlay.addEventListener('drop', (e) => {
      e.preventDefault();
      const stickerType = e.dataTransfer.getData('text/plain');
      if (!stickerType) return;
      const rect = overlay.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      addStickerToActiveStrip(stickerType, relX, relY);
    });

    wrapper.appendChild(overlay);
    slide.appendChild(wrapper);

    // Clicking on a peeking strip navigates directly to it
    slide.addEventListener('click', () => {
      const offset = getCircularOffset(idx, state.activeCarouselIdx, THEME_LIST.length);
      if (offset === -1) {
        goToCarouselSlide(state.activeCarouselIdx - 1);
      } else if (offset === 1) {
        goToCarouselSlide(state.activeCarouselIdx + 1);
      }
    });

    carouselStageEl.appendChild(slide);
  });

  // Build 6 position dots
  if (carouselDotsRowEl) {
    carouselDotsRowEl.innerHTML = '';
    THEME_LIST.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
      dot.title = CONFIG.themes[THEME_LIST[idx]].name;
      dot.addEventListener('click', () => goToCarouselSlide(idx));
      carouselDotsRowEl.appendChild(dot);
    });
  }

  // Navigation: On-screen arrow buttons
  if (carouselPrevBtn) {
    carouselPrevBtn.addEventListener('click', () => goToCarouselSlide(state.activeCarouselIdx - 1));
  }
  if (carouselNextBtn) {
    carouselNextBtn.addEventListener('click', () => goToCarouselSlide(state.activeCarouselIdx + 1));
  }

  // Navigation: Keyboard left and right arrow keys
  window.addEventListener('keydown', (e) => {
    if (state.currentView !== 'picker') return;
    if (e.key === 'ArrowLeft') {
      goToCarouselSlide(state.activeCarouselIdx - 1);
    } else if (e.key === 'ArrowRight') {
      goToCarouselSlide(state.activeCarouselIdx + 1);
    }
  });

  // Navigation: Trackpad horizontal swipe/scroll for laptops
  let wheelDebounceTimer = null;
  let accumulatedDeltaX = 0;

  if (carouselViewportWrapperEl) {
    carouselViewportWrapperEl.addEventListener('wheel', (e) => {
      if (state.currentView !== 'picker') return;
      // Capture horizontal delta or shift+wheel
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(dx) < 15) return;

      accumulatedDeltaX += dx;

      if (!wheelDebounceTimer) {
        if (accumulatedDeltaX > 25) {
          goToCarouselSlide(state.activeCarouselIdx + 1);
          accumulatedDeltaX = 0;
        } else if (accumulatedDeltaX < -25) {
          goToCarouselSlide(state.activeCarouselIdx - 1);
          accumulatedDeltaX = 0;
        }

        wheelDebounceTimer = setTimeout(() => {
          wheelDebounceTimer = null;
          accumulatedDeltaX = 0;
        }, 280);
      }
    }, { passive: true });
  }

  // Action Buttons in Picker Screen
  if (carouselDownloadBtn) {
    carouselDownloadBtn.addEventListener('click', handleCarouselDownload);
  }
  if (carouselRetakeBtn) {
    carouselRetakeBtn.addEventListener('click', closePickerView);
  }
}

/**
 * Render all 6 strips on the carousel slides using the SAME draw function
 */
function renderAllCarouselStrips() {
  const slides = carouselStageEl.querySelectorAll('.carousel-slide');
  slides.forEach((slide) => {
    const canvas = slide.querySelector('canvas');
    const themeKey = canvas.dataset.theme;
    const theme = CONFIG.themes[themeKey];
    if (canvas && theme) {
      renderStrip(canvas, state.capturedPhotos, {
        scale: 1,
        theme,
        filter: state.activeFilter,
        stickers: state.stickers,
        logoImg: state.logoImg,
      });
    }
  });
  renderStickersOverlay();
}

/**
 * Navigate to a specific carousel slide
 */
function goToCarouselSlide(targetIdx) {
  const total = THEME_LIST.length;
  state.activeCarouselIdx = ((targetIdx % total) + total) % total;
  updateCarouselPositions();
  renderStickersOverlay();
}

/**
 * Update 3D transforms, opacity, theme title, and dots for all slides
 * Under 300ms smooth animation.
 */
function updateCarouselPositions() {
  const total = THEME_LIST.length;
  const slides = carouselStageEl.querySelectorAll('.carousel-slide');

  slides.forEach((slide, idx) => {
    const offset = getCircularOffset(idx, state.activeCarouselIdx, total);

    if (offset === 0) {
      // Centered Strip: Large, full visibility, centered
      slide.style.transform = 'translateX(0px) scale(1)';
      slide.style.opacity = '1';
      slide.style.filter = 'none';
      slide.style.zIndex = '10';
      slide.style.pointerEvents = 'auto';
      slide.style.cursor = 'default';
    } else if (offset === -1) {
      // Previous Strip: Peeks in on left edge, smaller and dimmed
      slide.style.transform = 'translateX(-210px) scale(0.82)';
      slide.style.opacity = '0.45';
      slide.style.filter = 'brightness(0.75)';
      slide.style.zIndex = '5';
      slide.style.pointerEvents = 'auto';
      slide.style.cursor = 'pointer';
    } else if (offset === 1) {
      // Next Strip: Peeks in on right edge, smaller and dimmed
      slide.style.transform = 'translateX(210px) scale(0.82)';
      slide.style.opacity = '0.45';
      slide.style.filter = 'brightness(0.75)';
      slide.style.zIndex = '5';
      slide.style.pointerEvents = 'auto';
      slide.style.cursor = 'pointer';
    } else {
      // Off-screen strips
      slide.style.transform = `translateX(${offset > 0 ? 380 : -380}px) scale(0.65)`;
      slide.style.opacity = '0';
      slide.style.zIndex = '1';
      slide.style.pointerEvents = 'none';
    }
  });

  // Update Theme Title and Pattern Subtitle
  const currentTheme = CONFIG.themes[THEME_LIST[state.activeCarouselIdx]];
  if (carouselThemeTitleEl) {
    carouselThemeTitleEl.textContent = `★ ${currentTheme.name.toUpperCase()} ★`;
  }
  if (carouselThemePatternEl) {
    const patternName = currentTheme.pattern.charAt(0).toUpperCase() + currentTheme.pattern.slice(1);
    carouselThemePatternEl.textContent = `Pattern: ${patternName}`;
  }

  // Update 6 position dots
  if (carouselDotsRowEl) {
    const dots = carouselDotsRowEl.querySelectorAll('.carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === state.activeCarouselIdx);
    });
  }
}

/**
 * Handle Download in Carousel View:
 * Downloads the currently centered strip theme rendered at high-res 3x scale.
 */
function handleCarouselDownload() {
  if (state.capturedPhotos.length < CONFIG.photoCount) {
    alert('Please capture all 4 photos before downloading.');
    return;
  }
  const activeTheme = CONFIG.themes[THEME_LIST[state.activeCarouselIdx]];
  downloadStripPNG(
    state.capturedPhotos,
    {
      theme: activeTheme,
      filter: state.activeFilter,
      stickers: state.stickers,
      logoImg: state.logoImg,
    },
    `chocobooth-${activeTheme.id}-${Date.now()}.png`
  );
}

/**
 * Setup Filter Pills on both Main Screen and Carousel Review Screen
 */
function initFilters() {
  const allFilterPills = document.querySelectorAll('.filter-pill');
  allFilterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const selectedFilter = pill.dataset.filter;
      if (!selectedFilter) return;
      setActiveFilter(selectedFilter);
    });
  });

  applyLiveWebcamFilter(state.activeFilter);
}

function setActiveFilter(filterName) {
  state.activeFilter = filterName;

  // Sync active classes on all filter pills in both views
  const allFilterPills = document.querySelectorAll('.filter-pill');
  allFilterPills.forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.filter === filterName);
  });

  // Apply to live camera video
  applyLiveWebcamFilter(filterName);

  // If in picker view, re-render all carousel strips immediately
  if (state.currentView === 'picker') {
    renderAllCarouselStrips();
  }
}

function applyLiveWebcamFilter(filterName) {
  if (!videoEl) return;
  const filterMap = {
    none: 'none',
    bw: 'grayscale(100%) contrast(1.20) brightness(1.04)',
    vintage: 'sepia(0.38) contrast(0.92) brightness(1.04) saturate(0.85)',
    disposable: 'sepia(0.24) saturate(1.25) contrast(1.10) brightness(1.02)',
    softGlow: 'brightness(1.08) contrast(0.96) saturate(1.12)',
  };
  videoEl.style.filter = filterMap[filterName] || 'none';

  // Toggle live orange date stamp badge
  const liveDateBadge = document.getElementById('camera-disposable-badge');
  if (liveDateBadge) {
    liveDateBadge.style.display = filterName === 'disposable' ? 'block' : 'none';
  }
}

/**
 * Setup Sticker Tray interaction
 */
function initStickerTray() {
  const trayButtons = document.querySelectorAll('.sticker-tray-btn');
  trayButtons.forEach((btn) => {
    const stickerType = btn.dataset.sticker;

    // Render custom vector SVG inside button if available
    if (STICKER_SVGS[stickerType]) {
      btn.innerHTML = STICKER_SVGS[stickerType];
    }

    // Click to add sticker to center of active strip
    btn.addEventListener('click', () => {
      addStickerToActiveStrip(stickerType);
    });

    // Drag to drop on strip
    btn.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', stickerType);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  // Clear stickers button
  const clearBtn = document.getElementById('clear-stickers-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.stickers = [];
      state.selectedStickerId = null;
      renderAllCarouselStrips();
    });
  }

  // Keyboard shortcut: Delete or Backspace to delete selected sticker
  window.addEventListener('keydown', (e) => {
    if (state.currentView !== 'picker') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedStickerId) {
      deleteSticker(state.selectedStickerId);
    }
  });

  // Click outside to deselect
  window.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.placed-sticker') && !e.target.closest('.sticker-tray-btn')) {
      state.selectedStickerId = null;
      document.querySelectorAll('.placed-sticker').forEach(el => el.classList.remove('selected'));
    }
  });
}

function addStickerToActiveStrip(stickerType, relX = 0.5, relY = 0.45) {
  const newSticker = {
    id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    type: stickerType,
    relX: Math.max(0.12, Math.min(0.88, relX)),
    relY: Math.max(0.06, Math.min(0.94, relY)),
    scale: 0.18,
    rotation: Math.round(Math.random() * 20 - 10),
  };
  state.stickers.push(newSticker);
  state.selectedStickerId = newSticker.id;
  renderAllCarouselStrips();
}

function deleteSticker(stickerId) {
  state.stickers = state.stickers.filter(s => s.id !== stickerId);
  if (state.selectedStickerId === stickerId) {
    state.selectedStickerId = null;
  }
  renderAllCarouselStrips();
}

/**
 * Render Interactive DOM Sticker Overlay on Active Carousel Slide
 */
function renderStickersOverlay() {
  const activeSlide = carouselStageEl.querySelector(`.carousel-slide[data-index="${state.activeCarouselIdx}"]`);
  if (!activeSlide) return;

  const overlay = activeSlide.querySelector('.strip-stickers-overlay');
  if (!overlay) return;

  overlay.innerHTML = '';

  state.stickers.forEach((s) => {
    const el = document.createElement('div');
    el.className = `placed-sticker ${s.id === state.selectedStickerId ? 'selected' : ''}`;
    el.dataset.id = s.id;
    el.style.left = `${s.relX * 100}%`;
    el.style.top = `${s.relY * 100}%`;
    el.style.width = `${s.scale * 100}%`;
    el.style.transform = `translate(-50%, -50%) rotate(${s.rotation || 0}deg)`;

    // SVG icon
    el.innerHTML = STICKER_SVGS[s.type] || '';

    // Delete badge button
    const delBtn = document.createElement('button');
    delBtn.className = 'sticker-del-btn';
    delBtn.title = 'Remove sticker';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSticker(s.id);
    });
    el.appendChild(delBtn);

    // Drag handling via pointer events
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startRelX = s.relX;
    let startRelY = s.relY;

    el.addEventListener('pointerdown', (e) => {
      if (e.target === delBtn) return;
      e.stopPropagation();
      state.selectedStickerId = s.id;
      document.querySelectorAll('.placed-sticker').forEach(p => p.classList.toggle('selected', p.dataset.id === s.id));

      isDragging = true;
      el.classList.add('is-dragging');
      el.setPointerCapture(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;
      startRelX = s.relX;
      startRelY = s.relY;
    });

    el.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.stopPropagation();
      const rect = overlay.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const deltaX = (e.clientX - startX) / rect.width;
      const deltaY = (e.clientY - startY) / rect.height;

      const newRelX = Math.max(0.10, Math.min(0.90, startRelX + deltaX));
      const newRelY = Math.max(0.04, Math.min(0.96, startRelY + deltaY));

      s.relX = newRelX;
      s.relY = newRelY;

      el.style.left = `${newRelX * 100}%`;
      el.style.top = `${newRelY * 100}%`;
    });

    const stopDragging = (e) => {
      if (!isDragging) return;
      isDragging = false;
      el.classList.remove('is-dragging');
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}
      renderAllCarouselStrips();
    };

    el.addEventListener('pointerup', stopDragging);
    el.addEventListener('pointercancel', stopDragging);

    overlay.appendChild(el);
  });
}

/**
 * Retake all photos
 */
function handleRetake() {
  state.capturedPhotos = [];
  state.stickers = [];
  state.selectedStickerId = null;
  if (photoIndexBadgeEl) {
    photoIndexBadgeEl.style.display = 'none';
  }
  startBtn.disabled = false;
  retakeBtn.disabled = true;
  setMascotExpression('idle');
  statusMsgEl.textContent = 'Camera active. Ready when you are!';
}

/**
 * Update sound button UI
 */
function updateSoundUI() {
  const iconEl = document.getElementById('sound-icon');
  const textEl = document.getElementById('sound-state-text');
  if (iconEl) iconEl.textContent = state.soundEnabled ? '🔊' : '🔇';
  if (textEl) textEl.textContent = state.soundEnabled ? 'ON' : 'OFF';
}

/**
 * Toggle sound on/off
 */
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  localStorage.setItem('chocobooth_sound_enabled', state.soundEnabled);
  updateSoundUI();
}

/**
 * Initialization
 */
function init() {
  // Preload logo
  const logo = new Image();
  logo.src = CONFIG.mascotAssets.logo;
  logo.onload = () => {
    state.logoImg = logo;
  };

  // Sound toggle button setup
  updateSoundUI();
  soundToggleBtn.addEventListener('click', toggleSound);

  // Button listeners on Main Screen
  startBtn.addEventListener('click', startPhotoboothSequence);
  retakeBtn.addEventListener('click', handleRetake);

  // Spacebar keyboard shortcut to trigger booth start
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      if (state.currentView === 'booth' && !state.isCapturing && !startBtn.disabled) {
        // Prevent accidental trigger if focus is inside an input field
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        startPhotoboothSequence();
      }
    }
  });

  // Build Carousel DOM elements
  buildCarouselDOM();

  // Initialize Filters & Stickers
  initFilters();
  initStickerTray();

  // Start webcam
  initWebcam();
}

// Kickoff
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
