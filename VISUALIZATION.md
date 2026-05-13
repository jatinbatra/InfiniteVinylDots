# VinylVerse - 3D Visualization Documentation

## Overview

VinylVerse is an **immersive 3D music discovery experience** that transforms the world into a glowing, interactive musical globe. The application utilizes a high-performance WebGL engine (Three.js) to render a procedurally generated universe of vinyl records, each positioned geographically on a sci-fi holographic Earth.

## The 3D Environment

### The Holographic Globe

When you launch VinylVerse, you are presented with a **3D space scene** featuring:

- **Sci-Fi Holographic Earth**: 
  - A dark, tech-textured sphere representing the planet.
  - **Dynamic Atmosphere**: A glowing cyan rim with a Fresnel shader that reacts to the camera angle and sun direction.
  - **City Heatmaps**: Glowing hotspots over major music markets (e.g., London, Tokyo, Lagos) that pulse and grow based on the density of tracks loaded in that region.
  - **Grid Projection**: Subtle latitude and longitude lines providing spatial context.

- **Celestial Backdrop**:
  - **Starfield**: A dense, multi-layered star system with varying depths and subtle animations.
  - **Ambient Particles**: Floating data-bits that orbit the globe, reflecting the "circadian mood" of different time zones.

- **Post-Processing (Bloom)**:
  - The scene uses an **UnrealBloom** pass to create a high-end "neon" glow.
  - Emissive elements like the atmosphere, owner-vinyl rings, and city hotspots physically glow and bleed light across the screen.

### Vinyl Markers (3D Dots)

Each vinyl record is a physical 3D object positioned on the globe's surface:

- **Idle State**:
  - A circular disc showing the album artwork.
  - 95% opacity with a subtle colored glow behind it.
  - Slowly rotates at a constant speed to simulate a playing record.
- **Hover State**:
  - Smoothly scales up by 1.8x.
  - Rotation speed increases.
  - Glow intensity doubles, triggering a bright Bloom effect.
  - **3D Tooltip**: A floating React-based card appears above the disc, showing high-res artwork, track title, artist, and an animated audio visualizer.
- **Owner State (Your Drops)**:
  - Distinguished by a bright **Golden Emissive Ring** that pulses with high-intensity bloom.
  - Always rendered at 100% opacity.

## Interaction & Controls

### Camera Mechanics

VinylVerse uses an advanced **OrbitControls** system tuned for discovery:

- **Rotate**: Left-click and drag to spin the globe.
- **Zoom**: Scroll or pinch to zoom in from a global view (3.5x radius) down to a city level (1.5x radius).
- **Auto-Rotation**: When idle, the globe slowly rotates (0.06 speed) to showcase the global distribution of music.
- **Fly-To Transition**: Clicking a track in the "World Chart" or "Crate" triggers a smooth camera interpolation (Lerp) to the specific latitude and longitude of that track.

### Viewport-Aware Loading

To maintain 60FPS with thousands of potential tracks:
- **Frustum Culling**: Only vinyl markers within the camera's field of view are rendered.
- **Lazy Region Loading**: As you rotate the globe, a `VisibleRegionDetector` identifies which geographic markets are coming into view and triggers asynchronous iTunes API calls to populate them.

## Geographic Positioning

- **Spherical Mapping**: Lat/Lng coordinates are converted to 3D Cartesian points $(x, y, z)$ on a sphere with radius $R=2$.
- **Golden Angle Distribution**: Within each city/region, tracks are clustered using a spiral pattern (137.5° offset) to prevent overlapping while maintaining a "dense market" feel.

## Technical Stack

- **Engine**: Three.js via `@react-three/fiber`
- **Post-Processing**: `@react-three/postprocessing` (Bloom, ToneMapping)
- **Shaders**: Custom GLSL for Atmosphere and Fresnel effects.
- **UI Overlay**: React 19 with Tailwind CSS for high-performance 2D elements over the 3D canvas.
