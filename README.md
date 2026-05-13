# VinylVerse

> An immersive, 3D music discovery playground where users explore a glowing holographic world of music, drop their favorite YouTube/Spotify tracks, and gather in real-time listening rooms.

## 📖 Documentation

- **[VISUALIZATION.md](./VISUALIZATION.md)** - Comprehensive guide to the 3D environment, shaders, and visual architecture.

## Features

- **Holographic 3D Globe**: Explore a high-performance Three.js Earth with dynamic atmosphere and city heatmaps.
- **Cinematic Visuals**: Powered by UnrealBloom post-processing for a rich, glowing "cyber-vinyl" aesthetic.
- **Living World Map**: Music is geolocated to real-world regions using iTunes charts, visualized as glowing 3D markers.
- **Drop Your Vinyl**: Users can paste YouTube or Spotify links to place their own records on the globe for others to find.
- **Social Listening**: Join listening rooms, "hype" tracks with reactions, follow artists, and chat with simulated listeners.
- **AI Insights**: Powered by **Google Gemini** to generate instant "vibe checks" and trivia for every album.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **3D Engine**: Three.js, @react-three/fiber, @react-three/drei
- **Visuals**: GLSL Custom Shaders, @react-three/postprocessing (Bloom)
- **APIs**: 
  - **Google Gemini** (AI Insights)
  - **iTunes Search API** (Global music data)
  - **Noembed** (YouTube/Spotify metadata parsing)


## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

For detailed setup instructions and visual documentation, see [VISUALIZATION.md](./VISUALIZATION.md).

## Usage

1. **Explore**: Drag to pan, scroll to zoom. Visit different continents to hear local top hits.
2. **Listen**: Hover over any dot to hear a preview. Click to open the full experience.
3. **Contribute**: Click "Drop Your Vinyl" in the top left to add your favorite song from YouTube or Spotify to the canvas.
