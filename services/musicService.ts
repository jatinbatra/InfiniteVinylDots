import { VinylRecord, Position } from '../types';
import { getCircadianMood } from './circadianService';
import { REGIONAL_GENRES } from '../constants';

// --- Audio Manager for smooth playback ---
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  private fadeInterval: any = null;

  play(url: string) {
    if (this.currentUrl === url && this.currentAudio && !this.currentAudio.paused) return;
    this.stop();

    this.currentUrl = url;
    this.currentAudio = new Audio(url);
    this.currentAudio.volume = 0;
    this.currentAudio.loop = true;

    const playPromise = this.currentAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => this.fadeIn())
        .catch(error => console.warn("Audio play blocked:", error));
    }
  }

  stop() {
    if (this.currentAudio) {
      const audioToFade = this.currentAudio;
      this.currentAudio = null;
      this.currentUrl = null;
      this.fadeOut(audioToFade);
    }
  }

  private fadeIn() {
    if (!this.currentAudio) return;
    clearInterval(this.fadeInterval);
    let vol = 0;
    this.currentAudio.volume = vol;
    this.fadeInterval = setInterval(() => {
      if (!this.currentAudio) { clearInterval(this.fadeInterval); return; }
      vol = Math.min(1, vol + 0.1);
      this.currentAudio.volume = vol;
      if (vol >= 1) clearInterval(this.fadeInterval);
    }, 50);
  }

  private fadeOut(audio: HTMLAudioElement) {
    clearInterval(this.fadeInterval);
    let vol = audio.volume;
    const fadeOutInterval = setInterval(() => {
      vol = Math.max(0, vol - 0.1);
      try { audio.volume = vol; } catch {}
      if (vol <= 0) {
        clearInterval(fadeOutInterval);
        audio.pause();
      }
    }, 50);
  }
}

export const audioManager = new AudioManager();

// --- Link Parsers ---

export const parseSpotifyLink = (url: string): string | null => {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

export const parseYouTubeLink = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const fetchLinkMetadata = async (url: string): Promise<{ title?: string; artist?: string; thumbnail_url?: string } | null> => {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (data.error) return null;
    return {
      title: data.title,
      artist: data.author_name,
      thumbnail_url: data.thumbnail_url ? data.thumbnail_url.replace('http://', 'https://') : undefined
    };
  } catch {
    return null;
  }
};

// --- iTunes API Integration (Region-aware + Circadian) ---

/**
 * Pick a search term that reflects the region's actual local music scene.
 * Falls back to a generic genre if no regional mapping exists.
 */
function getRegionalSearchTerm(regionCode: string): string {
  const genres = REGIONAL_GENRES[regionCode];
  if (genres && genres.length > 0) {
    return genres[Math.floor(Math.random() * genres.length)];
  }
  // Fallback — generic popular music terms
  const fallback = ['pop', 'hip hop', 'rock', 'electronic', 'r&b'];
  return fallback[Math.floor(Math.random() * fallback.length)];
}

export const fetchRegionalTracks = async (
  regionCode: string,
  centerLat: number,
  centerLng: number,
  cityName?: string
): Promise<VinylRecord[]> => {
  try {
    // Use region-specific genre so Lagos gets afrobeats, Tokyo gets j-pop, etc.
    const searchTerm = getRegionalSearchTerm(regionCode);
    const mood = getCircadianMood(centerLng);
    const key = cityName || regionCode;

    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=${regionCode}&entity=song&limit=50`
    );
    const data: any = await response.json();
    if (!data.results) return [];

    return data.results.map((item: any, index: number) => {
      // Golden angle scatter — tighter radius for city-level clustering
      const angle = (index * 137.5) * (Math.PI / 180);
      const radius = Math.sqrt(index) * 25; // ~25km spread around city center

      return {
        id: `${key}-${item.trackId}`,
        albumId: item.collectionId,
        title: item.trackName,
        artist: item.artistName,
        year: new Date(item.releaseDate).getFullYear(),
        coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : '',
        previewUrl: item.previewUrl,
        sourceType: 'itunes' as const,
        lat: centerLat + (Math.sin(angle) * radius) / 111,
        lng: centerLng + (Math.cos(angle) * radius) / (111 * Math.cos(centerLat * Math.PI / 180)),
        position: { x: 0, y: 0 },
        listenerCount: Math.floor(Math.random() * 1000) + 50,
        genre: [item.primaryGenreName || searchTerm],
        isPlaying: Math.random() > 0.4,
        isOwner: false,
        likes: Math.floor(Math.random() * 500),
        isLiked: false,
        isJoined: false,
        isFollowed: false,
        ownerAvatar: `https://i.pravatar.cc/150?u=${item.artistName?.replace(/\s/g, '')}`,
        circadianColor: mood.color,
        circadianMood: mood.name,
      };
    });
  } catch (error) {
    console.warn(`Failed to fetch music for ${regionCode}`, error);
    return [];
  }
};

export const fetchTrackSearch = async (term: string): Promise<VinylRecord[]> => {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`);
    const data: any = await response.json();
    if (data.results && data.results.length > 0) {
      const item = data.results[0];
      return [{
        id: `custom-${item.trackId}`,
        albumId: item.collectionId,
        title: item.trackName,
        artist: item.artistName,
        year: new Date(item.releaseDate).getFullYear(),
        coverUrl: item.artworkUrl100.replace('100x100', '600x600'),
        previewUrl: item.previewUrl,
        sourceType: 'itunes' as const,
        lat: 0,
        lng: 0,
        position: { x: 0, y: 0 },
        listenerCount: 1,
        genre: [item.primaryGenreName],
        isPlaying: true,
        isOwner: true,
        likes: 0,
        isLiked: false,
        isJoined: true,
        isFollowed: true,
        ownerAvatar: `https://i.pravatar.cc/150?u=me`
      }];
    }
    return [];
  } catch {
    return [];
  }
};

// Keep for backward compat
export const latLngToCanvas = (lat: number, lng: number): Position => {
  const x = (lng / 180) * 2000;
  const y = -(lat / 90) * 1000;
  return { x, y };
};
