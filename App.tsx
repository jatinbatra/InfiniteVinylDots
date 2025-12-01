import React, { useState, useEffect } from 'react';
import InfiniteCanvas from './components/InfiniteCanvas';
import PlayerModal from './components/PlayerModal';
import Hud from './components/Hud';
import DropModal from './components/DropModal';
import { fetchRegionalTracks, fetchTrackSearch, latLngToCanvas } from './services/musicService';
import { VinylRecord, Chunk } from './types';
import { REGIONS, MAP_DIMENSIONS } from './constants';
import { useInfiniteCanvas } from './hooks/useInfiniteCanvas';

const App: React.FC = () => {
  // Use the hook for canvas mechanics
  const { canvasState, handlers } = useInfiniteCanvas();
  
  // App state for data (using region code as key)
  const [regions, setRegions] = useState<Record<string, Chunk>>({});
  const [selectedVinyl, setSelectedVinyl] = useState<VinylRecord | null>(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  
  // Logic to load regions based on viewport
  useEffect(() => {
    const loadVisibleRegions = async () => {
      // Current Viewport in World Coordinates
      const viewportWidth = window.innerWidth / canvasState.scale;
      const viewportHeight = window.innerHeight / canvasState.scale;
      
      const worldCenterX = -canvasState.offset.x / canvasState.scale;
      const worldCenterY = -canvasState.offset.y / canvasState.scale;

      const viewportMinX = worldCenterX - viewportWidth / 1.5;
      const viewportMaxX = worldCenterX + viewportWidth / 1.5;
      const viewportMinY = worldCenterY - viewportHeight / 1.5;
      const viewportMaxY = worldCenterY + viewportHeight / 1.5;

      // Filter regions that are roughly within the viewport
      const regionsToLoad = REGIONS.filter(region => {
        const pos = latLngToCanvas(region.lat, region.lng);
        return (
            pos.x >= viewportMinX && pos.x <= viewportMaxX &&
            pos.y >= viewportMinY && pos.y <= viewportMaxY
        );
      });

      // Find missing ones
      const missingRegions = regionsToLoad.filter(r => !regions[r.code]);

      if (missingRegions.length > 0) {
        // Mark as loading
        setRegions(prev => {
          const next = { ...prev };
          missingRegions.forEach(r => {
             next[r.code] = { id: r.code, status: 'loading', data: [] };
          });
          return next;
        });

        // Fetch data
        missingRegions.forEach(async (r) => {
            const fetchedVinyls: VinylRecord[] = await fetchRegionalTracks(r.code, r.lat, r.lng);
            setRegions(prev => ({
                ...prev,
                [r.code]: { 
                    id: r.code, 
                    status: 'loaded', 
                    data: fetchedVinyls 
                }
            }));
        });
      }
    };

    const timeoutId = setTimeout(loadVisibleRegions, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [canvasState.offset, canvasState.scale, regions]);

  // Flatten regions into a single vinyl list
  const allVinyls = React.useMemo(() => {
    return Object.values(regions).flatMap((region: Chunk) => region.data);
  }, [regions]);

  const handleVinylClick = (vinyl: VinylRecord) => {
    setSelectedVinyl(vinyl);
  };

  const handleCloseModal = () => {
    setSelectedVinyl(null);
  };

  // Update a vinyl record locally and in the regions store
  const handleVinylUpdate = (updatedVinyl: VinylRecord) => {
    setSelectedVinyl(updatedVinyl);
    
    setRegions(prev => {
      const newRegions = { ...prev };
      // Search for the region containing this vinyl
      // Since we don't have regionId on the vinyl directly, we iterate (efficient enough for this scale)
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
  };

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

    // Center of current view
    const worldX = -canvasState.offset.x / canvasState.scale;
    const worldY = -canvasState.offset.y / canvasState.scale;
    const position = { x: worldX, y: worldY };

    if (data.searchTerm) {
        // iTunes Search fallback
        const tracks = await fetchTrackSearch(data.searchTerm);
        if (tracks.length > 0) {
            newVinyl = { ...tracks[0], position, isOwner: true };
        } else {
            alert("No tracks found for that search term.");
            return;
        }
    } else {
        // Custom YouTube/Spotify
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

    // Add to 'user' region
    setRegions(prev => {
        const userRegion = prev['user'] || { id: 'user', status: 'loaded', data: [] };
        return {
            ...prev,
            'user': {
                ...userRegion,
                data: [...userRegion.data, newVinyl]
            }
        };
    });

    setSelectedVinyl(newVinyl);
  };

  const myVinyl = allVinyls.find(v => v.isOwner);

  return (
    <div className="w-full h-full font-sans text-white">
      <Hud onDropVinyl={() => setIsDropModalOpen(true)} myVinyl={myVinyl} />
      
      <InfiniteCanvas 
        vinyls={allVinyls} 
        canvasState={canvasState}
        handlers={handlers}
        onVinylClick={handleVinylClick} 
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