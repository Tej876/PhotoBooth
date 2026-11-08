# chocobooth 
> A cute Y2K retro online photobooth running 100% in your browser.

**Live Website:** [https://tej876.github.io/PhotoBooth/](https://tej876.github.io/PhotoBooth/)

**chocobooth** is an aesthetic, early-2000s desktop browser photobooth run by **Choco**, a regal, tortoiseshell Persian cat operator. Open the booth, allow your webcam, take 4 photos with a countdown, customize your strip with themes, vintage filters, and draggable cat stickers, and download a high-resolution vertical film strip PNG.

All photo processing and rendering happens completely inside your browser using the HTML5 Canvas API. **No photos are ever uploaded anywhere.**

---

##  Features

- **Mirrored 4:3 Live Webcam Preview**: Large, centered retro OS window with real-time camera preview.
- **3-2-1 Countdown & Capture Sequence**: Full-screen white flash and authentic mechanical shutter click with sound toggle.
- **Photo Indicators**: Clean "PHOTO X OF 4" counter during the capture sequence.
- **Choco Mascot Operator**: Reactive expressions (`choco-idle`, `choco-shocked`, `choco-approve`, `choco-happy`, `choco-sleeping` with floating animated "z"s) and pixel-font dialogue.
- **Darkroom Developing Screen**: Chunky retro segmented loading bar that simulates photo development before revealing the strip.
- **6 Curated Strip Themes**:
  -  **Strawberry Milk**: Dusty pink base with vector heart repeat pattern.
  -  **Midnight Arcade**: Deep navy with retro sparkle stars pattern.
  -  **Matcha Latte**: Sage green with cute cat paw prints pattern.
  -  **Cherry Pop**: Brick red with retro checkerboard pattern.
  -  **Lagoon**: Cool teal with clean minimalist frame.
  -  **Butter Toast**: Warm mustard yellow with heart accents.
- **Interactive Carousel Preview**:
  - Centered active strip displayed large and full-resolution.
  - Previous and next strips peeking in at the sides.
  - Seamless navigation via on-screen arrows, keyboard left/right arrow keys, clicking peeking strips, or trackpad horizontal swipe.
- **5 Photo Canvas Filters**:
  - **★ Normal**: Original clean capture.
  - **B&W**: High-contrast retro monochrome.
  - **Vintage**: Muted film tones with soft contrast and warm wash.
  - **Disposable**: Warm golden tint + subtle 35mm film grain + glowing orange digital date stamp in the bottom-right corner (`'04 MM DD`).
  - **Soft Glow**: Dreamy Y2K diffused highlight bloom.
  - Live filter preview on webcam before shooting, and changeable anytime on the strip review screen.
- **8 Draggable Y2K Cat Stickers**:
  -  Paw Print,  Sparkle Heart,  Pixel Star,  Ribbon Bow,  Stamp,  Fish Treat,  Daisy Flower,  Kitty Face.
  - Click to add to strip, or drag directly from the tray onto the strip.
  - Smooth pointer drag-and-drop to reposition anywhere on the strip.
  - Interactive selection with `✕` delete button, keyboard `Delete`/`Backspace`, or `✕ CLEAR` button.
- **Guaranteed Export Parity**:
  - A **SINGLE** canvas drawing function (`renderStrip`) powers both the interactive screen preview (1x scale) and the exported high-resolution PNG (3x scale: `1140 x 3492`).
  - Cropping, borders, filters, date stamps, and stickers are positioned and scaled identically.
- **Keyboard Shortcuts**:
  - `Spacebar`: Start photobooth countdown from the main screen.
  - `←` / `→`: Navigate between strip themes in the carousel.
  - `Delete` / `Backspace`: Remove selected sticker.

---

##  Tech Stack

- **HTML5 & Vanilla JavaScript**: ES Modules, zero external frameworks, lightweight and ultra-fast.
- **CSS3**: Custom properties, hard offset shadows, repeating gradients, responsive `vw`/`%` layout.
- **Canvas 2D API**: Procedural vector patterns (hearts, stars, paws, checkerboard), photo matting, filters, film grain, and stickers.
- **Web Audio API**: Shutter click sound with synthetic fallback.
- **Google Fonts**: *Press Start 2P*, *VT323*, *Nunito*.

---

##  Running Locally

Because **chocobooth** is built with modern ES Modules and accesses the browser MediaDevices (Webcam) API, it must be served over `http://localhost` or `https://`.

### Option 1: Python (Built-in)
```bash
# Navigate to the project directory
cd chocobooth

# Start local server (Python 3)
python -m http.server 3000
```
Open **`http://localhost:3000`** in Chrome, Edge, Safari, or Firefox.

### Option 2: Node.js (npx)
```bash
# Using serve
npx serve .

# Or using http-server
npx http-server -p 3000
```

### Option 3: VS Code / IDE
Install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.

---

##  Free Deployment (HTTPS Ready)

Modern desktop browsers require an **HTTPS** connection to access the webcam. All of the following free hosting platforms automatically provide HTTPS:

### 1. GitHub Pages
1. Push this folder to a GitHub repository.
2. In your repository on GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment**, select **Source: Deploy from a branch**, choose `main` (or `master`) and `/ (root)`.
4. Click **Save**. Your site will be live at `https://<username>.github.io/<repo-name>/`.

### 2. Netlify (Drag & Drop or Git)
1. Go to [app.netlify.com](https://app.netlify.com).
2. Drag and drop the `chocobooth` folder directly into the Netlify dashboard.
3. Your site deploys instantly with an automatic SSL/HTTPS certificate!

### 3. Vercel
```bash
# Using Vercel CLI
npm i -g vercel
vercel
```
Or connect your GitHub repository on [vercel.com](https://vercel.com). No build settings are needed (select "Other" or static).

---

##  Project Structure

```
chocobooth/
├── assets/
│   ├── mascot/
│   │   ├── choco-idle.png        # Choco neutral expression
│   │   ├── choco-shocked.png     # Countdown expression
│   │   ├── choco-approve.png     # After-shot expression
│   │   ├── choco-happy.png       # Strip review expression
│   │   ├── choco-sleeping.png    # Developing darkroom expression
│   │   └── choco-logo.png        # Header mascot face
│   └── sounds/
│       └── click.mp3             # Shutter click audio
├── js/
│   ├── config.js                 # Central configuration (timings, themes, dialogue, filters)
│   ├── stripRenderer.js          # Unified procedural canvas strip renderer
│   └── booth.js                  # Photobooth controller, carousel, stickers, and webcam logic
├── index.html                    # Single-page semantic HTML structure
├── styles.css                    # Y2K retro styles, curtains, windows, and animations
└── README.md                     # Project documentation
```

---

##  Configuration & Customization

All colors, themes, dialogue, and timings are cleanly centralized in `js/config.js`:
- To adjust countdown duration: edit `countdownSeconds` (default: `3`).
- To adjust export resolution: edit `strip.exportScale` (default: `3`).
- To add or modify themes: edit `CONFIG.themes` with your own colors and vector patterns (`hearts`, `stars`, `paws`, `checker`, `plain`).
- To change Choco's voice lines: edit `CONFIG.mascotLines`.

---

##  Privacy

All webcam frames and generated photo strips remain strictly inside your browser's local memory. No images, telemetry, or data are transmitted over the network.
