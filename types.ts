export interface Position {
  x: number;
  y: number;
}

export interface VinylRecord {
  id: string;
  albumId: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  previewUrl?: string;
  sourceType?: 'itunes' | 'youtube' | 'spotify';
  externalId?: string;

  // Geographic position
  lat?: number;
  lng?: number;
  position: Position; // legacy 2D position

  listenerCount: number;
  genre: string[];
  isPlaying: boolean;
  isOwner: boolean;
  addedBy?: string;
  description?: string;

  // Social
  likes: number;
  isLiked: boolean;
  isJoined: boolean;
  isFollowed: boolean;
  ownerAvatar?: string;

  // Circadian
  circadianColor?: string;
  circadianMood?: string;
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
  id: string;
  status: 'loading' | 'loaded' | 'error';
  data: VinylRecord[];
}
