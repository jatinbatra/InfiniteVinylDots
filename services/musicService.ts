import { VinylRecord, Position } from '../types';
import { MUSIC_TERMS, CANVAS_OPTS, MAP_DIMENSIONS } from '../constants';

// --- Audio Manager for smooth playback ---
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  private fadeInterval: any = null;

  play(url: string) {
    if (this.currentUrl === url && this.currentAudio && !this.currentAudio.paused) return;

    // Stop existing
    this.stop();

    this.currentUrl = url;
    this.currentAudio = new Audio(url);
    this.currentAudio.volume = 0;
    this.currentAudio.loop = true;
    
    const playPromise = this.currentAudio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeIn();
        })
        .catch(error => {
          console.warn("Audio play blocked or failed:", error);
        });
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
      if (!this.currentAudio) {
        clearInterval(this.fadeInterval);
        return;
      }
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
      audio.volume = vol;
      if (vol <= 0) {
        clearInterval(fadeOutInterval);
        audio.pause();
        audio.currentTime = 0;
      }
    }, 50);
  }
}

export const audioManager = new AudioManager();

// --- Coordinate Projection ---

// Converts Lat/Lng to World Canvas Coordinates (Equirectangular approximation)
// Center (0,0) is Lat 0, Lng 0
export const latLngToCanvas = (lat: number, lng: number): Position => {
  const x = (lng / 180) * (MAP_DIMENSIONS.width / 2);
  const y = -(lat / 90) * (MAP_DIMENSIONS.height / 2);
  return { x, y };
};

// --- Link Parsers ---

export const parseSpotifyLink = (url: string): string | null => {
  // Supports: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

export const parseYouTubeLink = (url: string): string | null => {
  // Supports: https://www.youtube.com/watch?v=dQw4w9WgXcQ, youtu.be/dQw4w9WgXcQ, and shorts/dQw4w9WgXcQ
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const fetchLinkMetadata = async (url: string): Promise<{ title?: string; artist?: string; thumbnail_url?: string } | null> => {
    try {
        // Use Noembed for simple CORS-friendly oEmbed fetching
        // Ensure URL is encoded to handle special chars properly
        const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        // Noembed returns 200 OK even on error, but with an 'error' property
        if (data.error) {
            console.warn("oEmbed error:", data.error);
            return null;
        }

        return {
            title: data.title,
            artist: data.author_name,
            thumbnail_url: data.thumbnail_url ? data.thumbnail_url.replace('http://', 'https://') : undefined
        };
    } catch (error) {
        console.warn("Failed to fetch oEmbed metadata", error);
        return null;
    }
}

// --- iTunes API Integration ---

export const fetchRegionalTracks = async (regionCode: string, centerLat: number, centerLng: number): Promise<VinylRecord[]> => {
  try {
    // Search for "music" or "hits" in specific country
    // We limit to 25 to populate the region without overcrowding
    // Use genre-diverse search terms per region for variety
    const terms = ['pop', 'rock', 'hip hop', 'electronic', 'jazz', 'soul', 'indie', 'r&b', 'dance', 'latin'];
    const termIndex = regionCode.charCodeAt(0) % terms.length;
    const searchTerm = terms[termIndex];
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=${regionCode}&entity=song&limit=25`);
    const data: any = await response.json();

    if (!data.results) return [];

    const centerPos = latLngToCanvas(centerLat, centerLng);

    return data.results.map((item: any, index: number) => {
        // Scatter dots around the region's center
        // Use a semi-random distribution but deterministic based on index for stability
        const angle = (index * 137.5) * (Math.PI / 180); // Golden angle scatter
        const radius = Math.sqrt(index) * 60; // Spread outwards
        
        const localX = Math.cos(angle) * radius;
        const localY = Math.sin(angle) * radius;

        return {
          id: `${regionCode}-${item.trackId}`,
          albumId: item.collectionId,
          title: item.trackName, 
          artist: item.artistName,
          year: new Date(item.releaseDate).getFullYear(),
          coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : 'https://picsum.photos/300/300',
          previewUrl: item.previewUrl,
          sourceType: 'itunes',
          position: {
             x: centerPos.x + localX, 
             y: centerPos.y + localY
          },
          listenerCount: Math.floor(Math.random() * 1000) + 50,
          genre: [item.primaryGenreName],
          isPlaying: Math.random() > 0.4,
          isOwner: false,
          
          // Social Data
          likes: Math.floor(Math.random() * 500),
          isLiked: false,
          isJoined: false,
          isFollowed: false,
          ownerAvatar: `https://i.pravatar.cc/150?u=${item.artistName.replace(/\s/g, '')}`
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
                sourceType: 'itunes',
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
    } catch (e) {
        return [];
    }
}