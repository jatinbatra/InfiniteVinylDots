export const CANVAS_OPTS = {
  MIN_SCALE: 0.2, // Allow zooming out further to see the whole world
  MAX_SCALE: 4,
  DOT_BASE_SIZE: 40,
  DOT_HOVER_SIZE: 180,
  DOT_ACTIVE_SIZE: 350,
  BUFFER: 500, // Pixels to render outside viewport
  FRICTION: 0.9,
  CHUNK_SIZE: 2000, 
};

export const MAP_DIMENSIONS = {
  width: 4000,
  height: 2000,
};

export const MOCK_USER_ID = "current-user-123";

// Placeholder images provided by picsum
export const PLACEHOLDER_ART = "https://picsum.photos/300/300";

// Search terms for generating diverse chunks
export const MUSIC_TERMS = [
  "Deep House", "Indie Rock", "Jazz", "Techno", "Ambient", 
  "Hip Hop", "Soul", "Psychedelic", "Synthwave", "Classical",
  "Funk", "Disco", "Reggae", "Blues", "Metal", "Pop", "R&B",
  "Electronic", "Folk", "Punk", "Lo-Fi", "Dubstep"
];

export const GENRES = MUSIC_TERMS;

// Major music markets with coordinates
export const REGIONS = [
  { code: 'US', lat: 38, lng: -97, name: 'United States' }, // Central US
  { code: 'GB', lat: 54, lng: -2, name: 'United Kingdom' },
  { code: 'FR', lat: 46, lng: 2, name: 'France' },
  { code: 'DE', lat: 51, lng: 10, name: 'Germany' },
  { code: 'JP', lat: 36, lng: 138, name: 'Japan' },
  { code: 'BR', lat: -14, lng: -51, name: 'Brazil' },
  { code: 'IN', lat: 20, lng: 77, name: 'India' },
  { code: 'KR', lat: 36, lng: 127, name: 'South Korea' },
  { code: 'MX', lat: 23, lng: -102, name: 'Mexico' },
  { code: 'AU', lat: -25, lng: 133, name: 'Australia' },
  { code: 'CA', lat: 56, lng: -106, name: 'Canada' },
  { code: 'NG', lat: 9, lng: 8, name: 'Nigeria' },
  { code: 'ZA', lat: -30, lng: 25, name: 'South Africa' },
  { code: 'ES', lat: 40, lng: -3, name: 'Spain' },
  { code: 'IT', lat: 41, lng: 12, name: 'Italy' },
  { code: 'AR', lat: -34, lng: -64, name: 'Argentina' },
  { code: 'SE', lat: 60, lng: 18, name: 'Sweden' },
  { code: 'NL', lat: 52, lng: 5, name: 'Netherlands' },
  { code: 'CO', lat: 4, lng: -72, name: 'Colombia' },
  { code: 'JM', lat: 18, lng: -77, name: 'Jamaica' },
  { code: 'TR', lat: 39, lng: 35, name: 'Turkey' },
  { code: 'ID', lat: -0.7, lng: 113, name: 'Indonesia' },
  { code: 'PH', lat: 12, lng: 121, name: 'Philippines' },
  { code: 'EG', lat: 26, lng: 30, name: 'Egypt' },
];