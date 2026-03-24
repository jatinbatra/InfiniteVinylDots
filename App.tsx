import React, { useState, useEffect, useCallback, useRef } from 'react';
import GlobeScene from './components/GlobeScene';
import PlayerModal from './components/PlayerModal';
import Hud from './components/Hud';
import DropModal from './components/DropModal';
import SearchBar from './components/SearchBar';
import { fetchRegionalTracks, fetchTrackSearch } from './services/musicService';
import { getCircadianMood, getCircadianSearchTerm } from './services/circadianService';
import { VinylRecord, Chunk } from './types';
import { REGIONS } from './constants';

const App: React.FC = () => {
  const [regions, setRegions] = useState<Record<string, Chunk>>({});
  const [selectedVinyl, setSelectedVinyl] = useState<VinylRecord | null>(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredRegionInfo, setHoveredRegionInfo] = useState<{
    name: string;
    mood: string;
    emoji: string;
    color: string;
    localTime: string;
  } | null>(null);

  const regionsRef = useRef(regions);
  regionsRef.current = regions;

  // Unlock audio on first user interaction
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

  // Load all regions on mount (globe shows everything)
  useEffect(() => {
    const loadAllRegions = async () => {
      // Stagger loading to avoid rate-limiting
      for (let i = 0; i < REGIONS.length; i++) {
        const r = REGIONS[i];

        // Skip if already loaded
        if (regionsRef.current[r.code]) continue;

        // Mark as loading
        setRegions(prev => ({
          ...prev,
          [r.code]: { id: r.code, status: 'loading', data: [] }
        }));

        try {
          const vinyls = await fetchRegionalTracks(r.code, r.lat, r.lng);
          setRegions(prev => ({
            ...prev,
            [r.code]: { id: r.code, status: 'loaded', data: vinyls }
          }));
        } catch {
          setRegions(prev => ({
            ...prev,
            [r.code]: { id: r.code, status: 'error', data: [] }
          }));
        }

        // Small delay between requests to be nice to the API
        if (i < REGIONS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    };

    loadAllRegions();
  }, []);

  // Flatten all vinyls
  const allVinyls = React.useMemo(() => {
    return Object.values(regions).flatMap((region: Chunk) => region.data);
  }, [regions]);

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

    if (data.searchTerm) {
      const tracks = await fetchTrackSearch(data.searchTerm);
      if (tracks.length > 0) {
        newVinyl = { ...tracks[0], lat: 40, lng: -74, isOwner: true }; // Default to NYC
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
        lat: 40.7,
        lng: -74,
        position: { x: 0, y: 0 },
        listenerCount: 1,
        genre: ['User Drop'],
        isPlaying: false,
        isOwner: true,
        likes: 0,
        isLiked: false,
        isJoined: true,
        isFollowed: true,
        circadianColor: '#FFD700',
        circadianMood: 'Your Pick',
      };
    }

    setRegions(prev => {
      const userRegion = prev['user'] || { id: 'user', status: 'loaded', data: [] };
      return {
        ...prev,
        user: { ...userRegion, data: [...userRegion.data, newVinyl] }
      };
    });

    setSelectedVinyl(newVinyl);
  };

  // Circadian refresh: refresh regions periodically with time-appropriate music
  useEffect(() => {
    const interval = setInterval(() => {
      const loadedKeys = Object.keys(regionsRef.current).filter(
        k => k !== 'user' && regionsRef.current[k].status === 'loaded'
      );
      if (loadedKeys.length === 0) return;

      // Pick a random region to refresh
      const randomKey = loadedKeys[Math.floor(Math.random() * loadedKeys.length)];
      const region = REGIONS.find(r => r.code === randomKey);
      if (!region) return;

      const searchTerm = getCircadianSearchTerm(region.lng);
      const mood = getCircadianMood(region.lng);

      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=${randomKey}&entity=song&limit=25`)
        .then(res => res.json())
        .then(data => {
          if (!data.results || data.results.length === 0) return;

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
              lat: region.lat + (Math.sin(angle) * radius) / 111,
              lng: region.lng + (Math.cos(angle) * radius) / (111 * Math.cos(region.lat * Math.PI / 180)),
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

          setRegions(prev => ({
            ...prev,
            [randomKey]: { id: randomKey, status: 'loaded', data: newVinyls }
          }));
        })
        .catch(() => {});
    }, 45000); // Refresh every 45 seconds

    return () => clearInterval(interval);
  }, []);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setFlyToTarget({ lat, lng });
    // Clear after animation has time to complete
    setTimeout(() => setFlyToTarget(null), 3000);
  }, []);

  const myVinyl = allVinyls.find(v => v.isOwner);

  return (
    <div className="w-full h-full font-sans text-white">
      {/* 3D Globe */}
      <GlobeScene
        vinyls={allVinyls}
        onVinylClick={handleVinylClick}
        audioUnlocked={audioUnlocked}
        flyToTarget={flyToTarget}
      />

      {/* Search */}
      <SearchBar onFlyTo={handleFlyTo} />

      {/* HUD Overlay */}
      <Hud
        onDropVinyl={() => setIsDropModalOpen(true)}
        myVinyl={myVinyl}
        vinylCount={allVinyls.length}
        regionCount={loadedRegionCount}
        totalRegions={REGIONS.length}
      />

      {/* Modals */}
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
