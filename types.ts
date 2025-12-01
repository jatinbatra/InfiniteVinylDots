export interface Position {
  x: number;
  y: number;
}

export interface VinylRecord {
  id: string;
  albumId: string; // Internal or API specific ID
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  previewUrl?: string; // URL for the 30s audio preview (iTunes)
  sourceType?: 'itunes' | 'youtube' | 'spotify';
  externalId?: string; // YouTube Video ID or Spotify Track ID
  position: Position;
  listenerCount: number;
  genre: string[];
  isPlaying: boolean;
  isOwner: boolean; // Is this the current user's dropped vinyl?
  addedBy?: string;
  description?: string; // AI generated description
  
  // Social Features
  likes: number;
  isLiked: boolean;
  isJoined: boolean;
  isFollowed: boolean;
  ownerAvatar?: string; // For the "Added by" user
}

export interface CanvasState {
  offset: Position;
  scale: number;
}

export interface Viewport {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Gemini specific types for our service
export interface AlbumInsight {
  vibe: string;
  trivia: string;
}

export interface Region {
  code: string;
  lat: number;
  lng: number;
  name: string;
}

export interface Chunk {
  id: string; // Region Code or "x,y"
  status: 'loading' | 'loaded' | 'error';
  data: VinylRecord[];
}