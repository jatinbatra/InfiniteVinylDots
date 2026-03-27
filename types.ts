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

  // Vinyl condition: 0 = dusty/unplayed, 1 = crystal clear
  condition?: number;
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
