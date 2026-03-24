import React, { useState, useEffect, useCallback, useRef } from 'react';
import InfiniteCanvas from './components/InfiniteCanvas';
import PlayerModal from './components/PlayerModal';
import Hud from './components/Hud';
import DropModal from './components/DropModal';
import { fetchRegionalTracks, fetchTrackSearch, latLngToCanvas } from './services/musicService';
import { VinylRecord, Chunk } from './types';
import { REGIONS, MAP_DIMENSIONS } from './constants';
import { useInfiniteCanvas } from './hooks/useInfiniteCanvas';

const App: React.FC = () => {
  const { canvasState, handlers, setCanvasState } = useInfiniteCanvas();

  const [regions, setRegions] = useState<Record<string, Chunk>>({});
  const [selectedVinyl, setSelectedVinyl] = useState<VinylRecord | null>(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Use ref to avoid stale closure in the effect
  const regionsRef = useRef(regions);
  regionsRef.current = regions;

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      setAudioUnlocked(true);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Center the view on the US at startup for a nice initial experience
  useEffect(() => {
    const usPos = latLngToCanvas(38, -97);
    setCanvasState({
      offset: { x: -usPos.x * 0.8, y: -usPos.y * 0.8 },
      scale: 0.8
    });
  }, []);

  // Load regions based on viewport - uses ref to avoid infinite loop
  useEffect(() => {
    const loadVisibleRegions = async () => {
      const currentRegions = regionsRef.current;
      const viewportWidth = window.innerWidth / canvasState.scale;
      const viewportHeight = window.innerHeight / canvasState.scale;

      // World coordinate at center of screen
      const worldCenterX = -canvasState.offset.x / canvasState.scale;
      const worldCenterY = -canvasState.offset.y / canvasState.scale;

      const margin = 1.5;
      const viewportMinX = worldCenterX - viewportWidth / margin;
      const viewportMaxX = worldCenterX + viewportWidth / margin;
      const viewportMinY = worldCenterY - viewportHeight / margin;
      const viewportMaxY = worldCenterY + viewportHeight / margin;

      const regionsToLoad = REGIONS.filter(region => {
        const pos = latLngToCanvas(region.lat, region.lng);
        return (
          pos.x >= viewportMinX && pos.x <= viewportMaxX &&
          pos.y >= viewportMinY && pos.y <= viewportMaxY
        );
      });

      const missingRegions = regionsToLoad.filter(r => !currentRegions[r.code]);

      if (missingRegions.length > 0) {
        // Mark as loading
        setRegions(prev => {
          const next = { ...prev };
          missingRegions.forEach(r => {
            if (!next[r.code]) {
              next[r.code] = { id: r.code, status: 'loading', data: [] };
            }
          });
          return next;
        });

        // Fetch data for each missing region
        for (const r of missingRegions) {
          try {
            const fetchedVinyls = await fetchRegionalTracks(r.code, r.lat, r.lng);
            setRegions(prev => ({
              ...prev,
              [r.code]: { id: r.code, status: 'loaded', data: fetchedVinyls }
            }));
          } catch {
            setRegions(prev => ({
              ...prev,
              [r.code]: { id: r.code, status: 'error', data: [] }
            }));
          }
        }
      }
    };

    const timeoutId = setTimeout(loadVisibleRegions, 400);
    return () => clearTimeout(timeoutId);
  }, [canvasState.offset.x, canvasState.offset.y, canvasState.scale]);

  // Flatten regions into a single vinyl list
  const allVinyls = React.useMemo(() => {
    return Object.values(regions).flatMap((region: Chunk) => region.data);
  }, [regions]);

  // Count loaded regions
  const loadedRegionCount = React.useMemo(() => {
    return Object.values(regions).filter((r: Chunk) => r.status === 'loaded').length;
  }, [regions]);

  const handleVinylClick = useCallback((vinyl: VinylRecord) => {
    setSelectedVinyl(vinyl);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedVinyl(null);
  }, []);

  const handleVinylUpdate = useCallback((updatedVinyl: VinylRecord) => {
    setSelectedVinyl(updatedVinyl);
    setRegions(prev => {
      const newRegions = { ...prev };
      for (const key in newRegions) {
        const chunk = newRegions[key];
        const idx = chunk.data.findIndex(v => v.id === updatedVinyl.id);
        if (idx !== -1) {
          const newData = [...chunk.data];
          newData[idx] = updatedVinyl;
          newRegions[key] = { ...chunk, data: newData };
          break;
        }
      }
      return newRegions;
    });
  }, []);

  const handleDropSubmit = async (data: {
    title: string;
    artist: string;
    coverUrl: string;
    sourceType: 'itunes' | 'youtube' | 'spotify';
    externalId?: string;
    searchTerm?: string;
  }) => {
    setIsDropModalOpen(false);

    let newVinyl: VinylRecord;
    const worldX = -canvasState.offset.x / canvasState.scale;
    const worldY = -canvasState.offset.y / canvasState.scale;
    const position = { x: worldX, y: worldY };

    if (data.searchTerm) {
      const tracks = await fetchTrackSearch(data.searchTerm);
      if (tracks.length > 0) {
        newVinyl = { ...tracks[0], position, isOwner: true };
      } else {
        return;
      }
    } else {
      newVinyl = {
        id: `custom-${Date.now()}`,
        albumId: `ext-${Date.now()}`,
        title: data.title,
        artist: data.artist,
        year: new Date().getFullYear(),
        coverUrl: data.coverUrl,
        sourceType: data.sourceType,
        externalId: data.externalId,
        position,
        listenerCount: 1,
        genre: ['User Drop'],
        isPlaying: false,
        isOwner: true,
        likes: 0,
        isLiked: false,
        isJoined: true,
        isFollowed: true
      };
    }

    setRegions(prev => {
      const userRegion = prev['user'] || { id: 'user', status: 'loaded', data: [] };
      return {
        ...prev,
        'user': { ...userRegion, data: [...userRegion.data, newVinyl] }
      };
    });

    setSelectedVinyl(newVinyl);
  };

  // Refresh a random loaded region periodically for fresh music
  useEffect(() => {
    const interval = setInterval(() => {
      const loadedKeys = Object.keys(regionsRef.current).filter(
        k => k !== 'user' && regionsRef.current[k].status === 'loaded'
      );
      if (loadedKeys.length === 0) return;

      const randomKey = loadedKeys[Math.floor(Math.random() * loadedKeys.length)];
      const region = REGIONS.find(r => r.code === randomKey);
      if (!region) return;

      // Pick a random genre-focused search term for variety
      const terms = ['pop hits', 'rock', 'hip hop', 'electronic', 'jazz', 'indie', 'latin', 'afrobeat', 'k-pop', 'reggaeton'];
      const randomTerm = terms[Math.floor(Math.random() * terms.length)];

      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(randomTerm)}&country=${randomKey}&entity=song&limit=25`)
        .then(res => res.json())
        .then(data => {
          if (!data.results || data.results.length === 0) return;
          const centerPos = latLngToCanvas(region.lat, region.lng);
          const newVinyls: VinylRecord[] = data.results.map((item: any, index: number) => {
            const angle = (index * 137.5) * (Math.PI / 180);
            const radius = Math.sqrt(index) * 60;
            return {
              id: `${randomKey}-refresh-${item.trackId}-${Date.now()}`,
              albumId: item.collectionId,
              title: item.trackName,
              artist: item.artistName,
              year: new Date(item.releaseDate).getFullYear(),
              coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : '',
              previewUrl: item.previewUrl,
              sourceType: 'itunes' as const,
              position: {
                x: centerPos.x + Math.cos(angle) * radius,
                y: centerPos.y + Math.sin(angle) * radius
              },
              listenerCount: Math.floor(Math.random() * 1000) + 50,
              genre: [item.primaryGenreName],
              isPlaying: Math.random() > 0.4,
              isOwner: false,
              likes: Math.floor(Math.random() * 500),
              isLiked: false,
              isJoined: false,
              isFollowed: false,
              ownerAvatar: `https://i.pravatar.cc/150?u=${item.artistName?.replace(/\s/g, '')}`
            };
          });

          setRegions(prev => ({
            ...prev,
            [randomKey]: { id: randomKey, status: 'loaded', data: newVinyls }
          }));
        })
        .catch(() => {});
    }, 60000); // Refresh one region every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const myVinyl = allVinyls.find(v => v.isOwner);

  return (
    <div className="w-full h-full font-sans text-white">
      <Hud
        onDropVinyl={() => setIsDropModalOpen(true)}
        myVinyl={myVinyl}
        vinylCount={allVinyls.length}
        regionCount={loadedRegionCount}
      />

      <InfiniteCanvas
        vinyls={allVinyls}
        canvasState={canvasState}
        handlers={handlers}
        onVinylClick={handleVinylClick}
        audioUnlocked={audioUnlocked}
      />

      {selectedVinyl && (
        <PlayerModal
          vinyl={selectedVinyl}
          onClose={handleCloseModal}
          onUpdate={handleVinylUpdate}
        />
      )}

      {isDropModalOpen && (
        <DropModal
          onClose={() => setIsDropModalOpen(false)}
          onSubmit={handleDropSubmit}
        />
      )}
    </div>
  );
};

export default App;
