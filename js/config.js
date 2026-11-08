// chocobooth Configuration
// All colors, theme presets, dimensions, voice lines and timings are defined here.

export const CONFIG = {
  // Photobooth timing & sequence
  photoCount: 4,
  countdownSeconds: 3,
  pauseBetweenShotsMs: 1400,
  developingDurationMs: 2500,

  // Standard photo aspect ratio (width / height)
  // Regardless of webcam resolution (16:9, 4:3, etc.), captures are center-cropped to this ratio
  aspectRatio: 4 / 3,

  // Typography
  fonts: {
    pixel: '"Press Start 2P", monospace',
    condensedPixel: '"VT323", monospace',
    rounded: '"Nunito", "Quicksand", sans-serif',
  },

  // Strip layout & export configuration
  strip: {
    baseWidth: 380,          // Base logical width of strip
    exportScale: 3,          // Export multiplier (380 * 3 = 1140px wide high-res PNG)
    padding: 20,             // Left/right and top padding
    gap: 16,                 // Vertical space between photos
    headerHeight: 20,        // Top decorative area
    footerHeight: 76,        // Footer area for logo, date stamp, credit (ensures even padding)
    photoBorderWidth: 3,     // Inner photo border
    outlineWidth: 3,         // Outer frame outline
  },

  // Color Palette
  colors: {
    dustyPink: '#F4B9C2',
    cream: '#FFF4E0',
    outline: '#2B2330',
    navy: '#2E3F7F',
    sage: '#9DB59A',
    brickRed: '#B8404A',
    teal: '#2F8F8A',
    mustard: '#E2B33C',
  },

  // 6 Curated Themes (Color + Pattern Presets)
  themes: {
    strawberryMilk: {
      id: 'strawberryMilk',
      name: 'Strawberry Milk',
      frameColor: '#F4B9C2',
      pattern: 'hearts',
      patternTint: '#E5A3AD',
      outlineColor: '#2B2330',
      interiorColor: '#FFF4E0',
      textColor: '#2B2330',
      dateColor: '#5C4852',
    },
    midnightArcade: {
      id: 'midnightArcade',
      name: 'Midnight Arcade',
      frameColor: '#2E3F7F',
      pattern: 'stars',
      patternTint: '#3D52A0',
      outlineColor: '#171E36',
      interiorColor: '#FFF4E0',
      textColor: '#FFF4E0',
      dateColor: '#C4D0F5',
    },
    matchaLatte: {
      id: 'matchaLatte',
      name: 'Matcha Latte',
      frameColor: '#9DB59A',
      pattern: 'paws',
      patternTint: '#8AA587',
      outlineColor: '#2B2330',
      interiorColor: '#FFF4E0',
      textColor: '#2B2330',
      dateColor: '#455643',
    },
    cherryPop: {
      id: 'cherryPop',
      name: 'Cherry Pop',
      frameColor: '#B8404A',
      pattern: 'checker',
      patternTint: '#A0333D',
      outlineColor: '#2B2330',
      interiorColor: '#FFF4E0',
      textColor: '#FFF4E0',
      dateColor: '#FCE0E3',
    },
    lagoon: {
      id: 'lagoon',
      name: 'Lagoon',
      frameColor: '#2F8F8A',
      pattern: 'plain',
      patternTint: '#277A75',
      outlineColor: '#1A4543',
      interiorColor: '#FFF4E0',
      textColor: '#FFF4E0',
      dateColor: '#D3EFEE',
    },
    butterToast: {
      id: 'butterToast',
      name: 'Butter Toast',
      frameColor: '#E2B33C',
      pattern: 'hearts',
      patternTint: '#CE9E2D',
      outlineColor: '#2B2330',
      interiorColor: '#FFF4E0',
      textColor: '#2B2330',
      dateColor: '#5C4718',
    },
  },

  defaultTheme: 'strawberryMilk',

  // 5 Photo Canvas Filters
  filters: {
    none: { id: 'none', name: 'Normal', label: '★ Normal' },
    bw: { id: 'bw', name: 'B&W', label: 'B&W' },
    vintage: { id: 'vintage', name: 'Vintage', label: 'Vintage' },
    disposable: { id: 'disposable', name: 'Disposable', label: 'Disposable' },
    softGlow: { id: 'softGlow', name: 'Soft Glow', label: 'Soft Glow' },
  },

  defaultFilter: 'none',

  // 8 Y2K Cat-themed Stickers
  stickers: [
    { id: 'paw', name: 'Paw', label: '🐾 Paw' },
    { id: 'heart', name: 'Heart', label: '💖 Heart' },
    { id: 'star', name: 'Star', label: '⭐ Star' },
    { id: 'bow', name: 'Bow', label: '🎀 Bow' },
    { id: 'chocoStamp', name: 'Choco', label: '🏷️ CHOCO' },
    { id: 'fish', name: 'Fish', label: '🐟 Fish' },
    { id: 'flower', name: 'Daisy', label: '🌸 Daisy' },
    { id: 'catFace', name: 'Kitty', label: '🐱 Kitty' },
  ],

  // Choco's lines (dialogue)
  mascotLines: {
    idle: ["Ready when you are.", "Make it quick."],
    countdown: ["3", "2", "1"],
    afterShot: "Acceptable.",
    developing: "Choco is developing your photos...",
    done: "Fine. You look good.",
  },

  // Mascot assets mapping
  mascotAssets: {
    idle: './assets/mascot/choco-idle.png',
    shocked: './assets/mascot/choco-shocked.png',
    approve: './assets/mascot/choco-approve.png',
    happy: './assets/mascot/choco-happy.png',
    sleeping: './assets/mascot/choco-sleeping.png',
    logo: './assets/mascot/choco-logo.png',
  },

  // Audio assets
  audio: {
    click: './assets/sounds/click.mp3',
  },
};
