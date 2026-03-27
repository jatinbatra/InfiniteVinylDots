# VinylVerse - Visualization Documentation

## Overview

VinylVerse is an **infinite canvas music discovery experience** that transforms the world into an interactive, visual music playground. The application displays an endless universe of vinyl records representing music tracks from around the globe, each positioned geographically based on their regional iTunes chart data.

## What You'll See

### The Infinite Canvas

When you launch VinylVerse, you're greeted with a **dark, space-like canvas** featuring:

- **Abstract geometric world map** rendered in SVG with:
  - Simplified continent shapes in dark zinc with glowing outlines
  - Floating tech grid pattern that drifts across the background
  - Pulsing hotspots at major music markets
  - Rotating radar scan effect centered on the map
  - Latitude/longitude reference lines for spatial awareness

- **Vinyl record dots** scattered across the canvas:
  - Each vinyl appears as a **circular disc** showing album artwork
  - Base size of 40px, scaling up to 180px on hover
  - Golden border and glow effect for user-owned records
  - White border with subtle shadow for global tracks
  - Records with high listener counts (>50) appear larger
  - Spinning animation for currently playing tracks

### Visual Elements Breakdown

#### 1. Vinyl Dot States

**Idle State:**
- Circular album artwork with 60% opacity
- Subtle border and shadow effect
- Black center hole (15% size) representing the vinyl label
- May show gentle spinning animation if marked as "playing"

**Hover State:**
- Expands to 180px diameter with smooth transition
- Opacity increases to 100%
- Bright cyan (accent color) border appears
- Animated ping ring effect pulses outward
- **Floating info card** appears above showing:
  - Track title in white bold text
  - Artist name in cyan accent color
  - "Previewing" indicator with audio icon (if preview available)
  - Listener count badge in gold at bottom
- **Audio preview** begins playing after 200ms hover delay

**Playing State (Global):**
- Continuous slow rotation animation (10 seconds per rotation)
- Center hole shows a small pulsing cyan dot
- Maintains lower opacity (60%) until hovered

**Owner State (Your Drops):**
- Golden border and dramatic glow effect
- Full 100% opacity at all times
- Stands out prominently from other vinyl records

#### 2. The World Map Layer

The map sits behind all vinyl records at z-index 0, providing spatial context:

**Continents:**
- 6 major landmasses rendered as abstract geometric polygons
- Dark zinc fill (zinc-900/50) with semi-transparent overlay
- Zinc-700 stroke outline (0.5px width)
- Hover effect applies subtle accent color glow
- Smooth 1-second transition on hover

**Background Effects:**
- **Tech Grid**: Repeating 40px pattern of cyan lines and dots, slowly floating
- **Radar Scan**: Large rotating gradient wedge (10s rotation) centered at (1000, 500)
- **Concentric Circles**: Multiple rings at 400px and 600px radius with dashed strokes
- **Pulsing Hotspots**: 4 decorative cyan circles with staggered pulse animations

**Reference Grid:**
- Equator line (horizontal) and Prime Meridian line (vertical)
- Cyan dashed lines (4-8 dash pattern) at 10% opacity
- Provides lat/lng visual reference

#### 3. Head-Up Display (HUD)

**Top Left Corner:**
- **VinylVerse Logo**: White text with "VERSE" in accent cyan, vinyl disc icon
- **Drop Your Vinyl Button**: 
  - Dark zinc background with backdrop blur
  - Gold border on hover with scale-up animation
  - Gold plus icon that rotates 90° on hover
  - Two-line label: "Add Music" and "Drop Your Vinyl"

**Bottom Left Corner:**
- **Now Playing Card** (appears when you drop a vinyl):
  - Semi-transparent zinc background with gold border
  - Your album cover (10x10, spinning animation)
  - "Your Vinyl Playing" label in gold
  - Track title truncated
  - 3-bar audio visualizer with pulsing animations

**Bottom Right Corner:**
- **Control Hints**: "Drag to Pan • Scroll to Zoom" in small white text
- 50% opacity, pointer-events disabled

**Top Right Corner (Debug Info):**
- Canvas position coordinates
- Calculated lat/lng position
- Active node count (visible vinyl records)
- Small monospace font in zinc-600

### Geographic Positioning System

VinylVerse uses an **equirectangular projection** to position vinyl records on the canvas:

**Coordinate System:**
- Canvas center (0, 0) represents Latitude 0°, Longitude 0° (Gulf of Guinea)
- Map dimensions: 4000px width × 2000px height
- X-axis: Longitude from -180° (left) to +180° (right)
- Y-axis: Latitude from +90° (top) to -90° (bottom)

**Regional Clustering:**
The app loads music from 24 major music markets worldwide:
- North America: US, Canada, Mexico, Jamaica
- South America: Brazil, Argentina, Colombia
- Europe: UK, France, Germany, Spain, Italy, Netherlands, Sweden, Turkey
- Africa: Nigeria, South Africa, Egypt
- Asia: Japan, South Korea, India, Indonesia, Philippines
- Oceania: Australia

**Distribution Pattern:**
- Each region fetches 25 tracks from iTunes
- Tracks scatter around the region's center using a **golden angle distribution** (137.5°)
- Radius increases with square root of index (√n × 60px)
- Creates organic, spiral-like clustering patterns
- Prevents overlapping while maintaining density

**Viewport Loading:**
- Only regions within current viewport (with 1.5× buffer) are loaded
- Loads on-demand as you pan around the world
- 500ms debounce prevents excessive loading during fast panning

## User Interface Components

### 1. Player Modal

The **full-screen player modal** appears when you click any vinyl record:

**Layout:**
- Dual-panel design (split 50/50 on desktop)
- Dark background (zinc-950) with zinc-800 border
- Rounded 3xl corners with 2xl shadow
- Animated entrance: fade-in + zoom-in over 300ms

**Left Panel - Visual/Player:**

*For iTunes Tracks:*
- Album artwork in a circular frame (aspect-square)
- Spinning animation when playing (6s per rotation)
- Blurred background glow matching cover art
- Gradient overlay for vinyl surface effect
- Black center hole with white border
- 5-bar audio visualizer at bottom (animated heights when playing)

*For YouTube Tracks:*
- Embedded YouTube iframe player
- Autoplay enabled
- Full controls available
- Rounded xl corners with shadow

*For Spotify Tracks:*
- Embedded Spotify player widget
- Dark theme (theme=0)
- Rounded 12px corners
- Full playback controls from Spotify

**Right Panel - Details:**

*Top Section:*
- **Genre Tags**: Small cyan badges with uppercase text, accent border
- **Source Badge**: Gold badge showing "Via YouTube/Spotify/iTunes"
- **Like/Hype Button**: Heart icon with like count
  - Red background when liked
  - Gray background when not liked
  - Shows total like count

*Middle Section:*
- **Track Title**: 3-4xl bold white text, tracking-tight, line-clamped
- **Artist Name**: xl zinc-400 text, medium weight
- **Follow Button**: 
  - "Following" in white on black when active
  - "Follow" in zinc-500 when inactive
  - Smooth color transitions

*AI Insight Section:*
- **Container**: Zinc-800/30 background with backdrop blur
- **Header**: Gold "AI Vibe Check" with star icon
- **Content**: 
  - Loading state: Animated pulse skeleton
  - Loaded state: Italic serif text with AI-generated "vibe" description
  - Error state: "Waiting for Gemini..." message

*Bottom Section:*
- **Listening Room Bar**:
  - Semi-transparent zinc-900 background
  - Overlapping avatar circles (8×8, -space-x-2)
  - "+N" indicator if more than 4 listeners
  - **Join Room Button**: 
    - Blue background with shadow when not joined
    - Green background when joined ("Joined Room")

- **Playback Controls** (iTunes only):
  - Full-width white button with black text
  - Play/Pause toggle with icons
  - "Play Preview" or "Pause Preview" label
  - Active scale animation on click

- **Control Hint** (YouTube/Spotify):
  - Small uppercase text: "Interactive Player Active"
  - Zinc-600 color, centered

**Close Button:**
- Top-right corner (absolute positioning)
- X icon in white/50, transitions to white on hover
- Black/50 background circle, darkens to black/80 on hover

### 2. Drop Modal

The **Drop Modal** allows you to add your own music to the canvas:

**Trigger:**
- Click "Drop Your Vinyl" button in top-left HUD
- Modal appears centered with backdrop

**Step 1 - Input:**
- **Title**: "Drop Your Vinyl"
- **Subtitle**: "Paste a YouTube/Spotify link or a search term"
- **Input Field**:
  - Black/50 background, zinc-700 border
  - Accent border on focus
  - Placeholder: "e.g. https://youtu.be/... or 'Daft Punk'"
  - Auto-focused on open
  - Enter key submits
- **Continue Button**: 
  - Accent background (cyan), black text
  - Disabled state when input is empty
  - Hover changes to white

**Step 2 - Loading:**
- Spinning cyan loader (8×8)
- "Fetching track details..." message
- Appears only for YouTube/Spotify links

**Step 3 - Details:**
- **Preview Card**:
  - Album cover thumbnail (16×16, rounded)
  - Source type badge (YouTube/Spotify detected)
  - Metadata status message
- **Title Input**: 
  - Label: "Track Title"
  - Pre-filled if metadata fetched
  - Required field
- **Artist Input**:
  - Label: "Artist"
  - Pre-filled if metadata fetched
  - Required field
- **Drop It Button**:
  - Gold background, black text
  - Disabled if title or artist empty
  - Hover changes to white

**Behavior:**
- **YouTube/Spotify Links**: Attempts to fetch metadata via Noembed API
- **Search Terms**: Uses iTunes Search API to find matching track
- **Positioning**: New vinyl drops at current viewport center
- **Ownership**: Marked as "isOwner: true" with golden appearance

**Detection Logic:**
- YouTube: Supports watch?v=, youtu.be/, shorts/, embed/ formats
- Spotify: Supports open.spotify.com/track/ format
- Validates video/track ID format

## Music Service Integrations

VinylVerse integrates three major music services to provide a comprehensive music experience:

### 1. iTunes Search API

**Purpose:** Primary data source for global music discovery

**Endpoints Used:**
- `https://itunes.apple.com/search`

**Query Parameters:**
- `term`: Search term (defaults to "music")
- `country`: 2-letter ISO country code (e.g., US, GB, JP)
- `entity`: Set to "song" for track results
- `limit`: Number of results (25 for regions, 1 for search)

**Data Extracted:**
- Track ID, Collection (Album) ID
- Track Name, Artist Name
- Release Date (converted to year)
- Artwork URL (scaled from 100×100 to 600×600)
- **Preview URL**: 30-second MP3 preview for hover playback
- Primary Genre Name

**Features:**
- 30-second audio previews play on hover
- No authentication required
- Regional chart data for 24 countries
- Immediate availability

### 2. YouTube Integration

**Purpose:** User-contributed music via YouTube links

**Embed Method:**
- YouTube iframe embed API
- URL format: `https://www.youtube.com/embed/{videoId}?autoplay=1`

**Link Parsing:**
- Supports multiple URL formats:
  - `youtube.com/watch?v=VIDEO_ID`
  - `youtu.be/VIDEO_ID`
  - `youtube.com/shorts/VIDEO_ID`
  - `youtube.com/embed/VIDEO_ID`
- Extracts 11-character video ID via regex

**Metadata Fetching:**
- Uses **Noembed** (noembed.com) oEmbed service
- CORS-friendly, no API key required
- Returns: title, author_name, thumbnail_url

**Player Features:**
- Full iframe embed with native YouTube controls
- Autoplay on modal open
- 100% width and height in player panel
- Fullscreen, picture-in-picture support

**Fallback Cover Art:**
- Default: `https://img.youtube.com/vi/{videoId}/0.jpg`
- Fetched thumbnail if Noembed succeeds

### 3. Spotify Integration

**Purpose:** User-contributed music via Spotify links

**Embed Method:**
- Spotify Web Player iframe embed
- URL format: `https://open.spotify.com/embed/track/{trackId}?utm_source=generator&theme=0`

**Link Parsing:**
- Supports: `https://open.spotify.com/track/TRACK_ID`
- Extracts alphanumeric track ID via regex

**Metadata Fetching:**
- Uses **Noembed** oEmbed service
- Returns: title, artist, thumbnail

**Player Features:**
- Native Spotify embed player
- Dark theme (theme=0)
- Rounded corners (12px)
- Autoplay, clipboard-write, encrypted-media enabled

**Fallback Cover Art:**
- Default: Spotify logo SVG
- Fetched thumbnail if Noembed succeeds

### 4. Google Gemini AI Integration

**Purpose:** Generate "vibe checks" and album insights

**Implementation:**
- Uses `@google/genai` package
- Async insight generation when modal opens
- Displays loading skeleton while fetching

**Data Generated:**
- AI-powered "vibe" description of the track
- Contextual music trivia (not displayed in current UI)

**User Experience:**
- Loading state with animated pulse
- Displayed in gold-themed "AI Vibe Check" section
- Italic serif font for atmospheric feel

### Audio Manager System

**Features:**
- Singleton audio manager for smooth preview playback
- **Fade In/Out**: 50ms intervals, 0.1 volume steps
- **Debounced Hover**: 200ms delay before preview starts
- **Automatic Cleanup**: Stops previous audio when new preview starts
- **Loop Mode**: iTunes previews loop continuously on hover
- **Volume Control**: Starts at 0, fades to 1.0

## Running the Application Locally

### Prerequisites

- **Node.js** (version 18 or higher recommended)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Setup

1. **Clone or Navigate to Repository:**
   ```bash
   cd /path/to/InfiniteVinylDots
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - React 19.2.0
   - @google/genai 1.30.0 (for AI insights)
   - Vite 6.2.0 (build tool)
   - TypeScript 5.8.2
   - @vitejs/plugin-react 5.0.0

3. **Configure Environment Variables (Optional):**
   
   For AI-powered insights, create a `.env` file in the root directory:
   ```bash
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   ```
   
   If not provided, the app will still work but AI insights may not load.

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

5. **Open in Browser:**
   
   The terminal will display:
   ```
   VITE v6.2.0  ready in XXX ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```
   
   Open `http://localhost:5173/` in your web browser.

### Development Commands

- **Start Dev Server**: `npm run dev`
  - Launches Vite development server with hot-reload
  - Typically runs on port 5173
  - Auto-opens browser (if configured)

- **Build for Production**: `npm run build`
  - Compiles TypeScript
  - Bundles and minifies assets
  - Outputs to `dist/` directory

- **Preview Production Build**: `npm run preview`
  - Serves the built `dist/` folder locally
  - Tests production build before deployment

### What to Expect on Launch

1. **Initial Load:**
   - Dark canvas with floating tech grid appears
   - World map renders with geometric continents
   - Radar scan animation begins

2. **First Region Load:**
   - Canvas starts centered at (0, 0) coordinates
   - Visible regions begin loading asynchronously
   - Vinyl dots fade in as data arrives (500ms debounce)

3. **Initial Viewport:**
   - Usually shows African and European regions
   - 25 vinyl records per visible region
   - Debug info shows active node count in top-right

4. **Interaction Ready:**
   - Cursor changes to "move" cursor over canvas
   - Can immediately drag to pan
   - Scroll to zoom in/out (0.2× to 4.0× scale)
   - Hover over vinyl dots to preview audio

### Troubleshooting

**No Music Appears:**
- Check browser console for API errors
- iTunes API may be rate-limited or temporarily unavailable
- Try refreshing or waiting a moment

**Audio Previews Don't Play:**
- Browser may block autoplay
- Click anywhere on page first to enable audio context
- Check browser console for autoplay policy messages

**Gemini Insights Don't Load:**
- Verify VITE_GEMINI_API_KEY is set correctly
- Check API key has proper permissions
- Insights are optional - app works without them

**Performance Issues:**
- Try zooming in to reduce visible vinyl count
- Check "active nodes" count in top-right debug info
- Close other browser tabs
- GPU acceleration recommended for smooth animations

## Performance Optimizations

VinylVerse implements several optimizations for smooth 60fps performance:

### Viewport Culling
- Only renders vinyl records within visible viewport plus 500px buffer
- Recalculates on every pan/zoom operation
- Dramatically reduces DOM node count

### React Memoization
- VinylDot component wrapped in `React.memo`
- Prevents unnecessary re-renders when data unchanged
- WorldMap component also memoized (static content)

### CSS Hardware Acceleration
- `transform-gpu` class on vinyl dots
- `will-change-transform` on infinite canvas container
- Uses CSS transforms instead of position changes
- Enables GPU compositing for smooth animations

### Lazy Loading
- Regions load only when scrolled into view
- 500ms debounce on region loading logic
- Prevents excessive API calls during fast panning

### Debounced Audio Playback
- 200ms delay before preview starts on hover
- Prevents audio chaos during rapid mouse movement
- Smooth fade-in/out (50ms intervals)

### Image Optimization
- iTunes artwork scaled to 600×600 (from 100×100)
- Album images use `loading="lazy"` attribute
- Pravatar avatars cached by user ID

## Visual Specifications

### Color Palette

- **Background**: Radial gradient from #0a0a0a to #000
- **Accent (Cyan)**: #00D9FF / rgb(0, 217, 255) / tailwind `accent`
- **Gold**: #FFD700 / tailwind `gold`
- **Zinc Grays**: 
  - zinc-900: #18181b
  - zinc-800: #27272a
  - zinc-700: #3f3f46
  - zinc-600: #52525b
  - zinc-500: #71717a
  - zinc-400: #a1a1aa

### Typography

- **Font Family**: System font stack (sans-serif)
- **Logo**: 2xl size, bold weight, tracking-tighter
- **Track Titles**: 3xl-4xl size, black weight (900), tracking-tight
- **Artist Names**: xl size, medium weight (500)
- **Labels**: xs size, uppercase, bold weight, tracking-wider/widest
- **AI Insights**: sm size, italic, serif font-family

### Animation Timings

- **Vinyl Hover Growth**: 500ms ease-out
- **Modal Entrance**: 300ms fade-in + zoom-in
- **Vinyl Rotation**: 6-10s linear infinite (context dependent)
- **Radar Scan**: 10s linear infinite
- **Audio Fade**: 50ms intervals over 500-1000ms total
- **Pulse Animations**: 0.5-4s ease-in-out infinite (staggered)

### Z-Index Layers

- 0: World Map background
- 1: Idle vinyl dots
- 50: Hovered vinyl dots
- 50: HUD elements
- 60: Vinyl hover info cards
- 100: Player modal
- 200: Drop modal

### Responsive Breakpoints

- Uses Tailwind's `md:` breakpoint (768px)
- Mobile: Stacked vertical layout in modals
- Desktop: Side-by-side dual-panel layout
- Canvas scales fluidly at all screen sizes

## Technical Architecture

### Component Hierarchy

```
App (State Management)
├── Hud (UI Overlay)
├── InfiniteCanvas (Viewport & Transform)
│   ├── WorldMap (Background)
│   └── VinylDot[] (Records)
├── PlayerModal (Full Screen)
└── DropModal (User Input)
```

### Custom Hooks

**useInfiniteCanvas:**
- Manages canvas state (offset, scale)
- Provides mouse/touch event handlers
- Handles drag panning and scroll zooming
- Applies min/max scale constraints
- Returns: `{ canvasState, handlers }`

### Data Flow

1. **Initial Load**: App mounts, useEffect triggers
2. **Region Detection**: Calculate visible regions from viewport
3. **API Fetch**: iTunes Search API called for each region
4. **Data Transform**: Raw API data → VinylRecord objects
5. **Position Calculation**: Lat/Lng → Canvas coordinates
6. **State Update**: Regions added to state
7. **Render**: Flattened vinyl list passed to InfiniteCanvas
8. **Culling**: InfiniteCanvas filters to visible vinyls
9. **Display**: VinylDot components render

### State Management

- **Local State**: React useState for UI and data
- **No Redux/External Store**: Simple enough for hooks
- **Region State**: Record<string, Chunk> keyed by country code
- **Loading States**: 'loading' | 'loaded' | 'error'

---

## Summary

VinylVerse creates a **unique visual music discovery experience** by combining:

✨ **Infinite canvas exploration** with smooth pan/zoom mechanics  
🗺️ **Geographic data visualization** showing music's global diversity  
🎵 **Multi-platform integration** supporting iTunes, YouTube, and Spotify  
🎨 **Retro-futuristic aesthetics** with vinyl records and holographic effects  
🤖 **AI-powered insights** adding context and personality  
👥 **Social features** with listening rooms and reactions  

The result is an immersive, visually stunning playground for discovering music from around the world, where every interaction reveals new tracks and the canvas truly never ends.
