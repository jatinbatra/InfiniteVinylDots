# VinylVerse

> An infinite, collaborative music discovery playground where users explore a procedurally generated world of vinyl records, drop their favorite YouTube/Spotify tracks, and gather in real-time listening rooms.

## Features

- **Infinite Canvas**: Drag and scroll through an endless universe of music using a custom DOM-based engine.
- **Living World Map**: Music is geolocated to real-world regions using iTunes charts, visualized on a sci-fi holographic map.
- **Drop Your Vinyl**: Users can paste YouTube or Spotify links to place their own records on the map for others to find.
- **Social Listening**: Join listening rooms, "hype" tracks with reactions, follow artists, and chat with simulated listeners.
- **AI Insights**: Powered by **Google Gemini** to generate instant "vibe checks" and trivia for every album.
- **Interactive Player**: 
  - **Hover**: Instant 30s previews for iTunes tracks.
  - **Click**: Full player modal with embedded YouTube/Spotify playback and social controls.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **State Management**: React Hooks (Custom Infinite Canvas logic)
- **APIs**: 
  - **Google Gemini** (AI Insights)
  - **iTunes Search API** (Global music data)
  - **Noembed** (YouTube/Spotify metadata parsing)
- **Visuals**: SVG-based map projections, CSS3 hardware-accelerated animations.

## Usage

1. **Explore**: Drag to pan, scroll to zoom. Visit different continents to hear local top hits.
2. **Listen**: Hover over any dot to hear a preview. Click to open the full experience.
3. **Contribute**: Click "Drop Your Vinyl" in the top left to add your favorite song from YouTube or Spotify to the canvas.
