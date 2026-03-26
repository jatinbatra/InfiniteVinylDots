import React, { useState, useEffect, useCallback, useRef } from 'react';
import GlobeScene from './components/GlobeScene';
import PlayerModal from './components/PlayerModal';
import Hud from './components/Hud';
import DropModal from './components/DropModal';
import SearchBar from './components/SearchBar';
import NowPlayingBar from './components/NowPlayingBar';
import ActivityTicker from './components/ActivityTicker';
import VinylVortex from './components/VinylVortex';
import { fetchRegionalTracks, fetchTrackSearch } from './services/musicService';
import { VinylRecord, Chunk } from './types';
import { REGIONS } from './constants';

const App: React.FC = () => {
  const [regions, setRegions] = useState<Record<string, Chunk>>({});
  const [selectedVinyl, setSelectedVinyl] = useState<VinylRecord | null>(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [vortexMode, setVortexMode] = useState(false);

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

  // Load cities — fast first wave (10 concurrent), then background load rest
  useEffect(() => {
    const loadBatch = async (batch: typeof REGIONS) => {
      const results = await Promise.allSettled(
        batch.map(r =>
          regionsRef.current[r.name]?.status === 'loaded'
            ? Promise.resolve(null)
            : fetchRegionalTracks(r.code, r.lat, r.lng, r.name)
        )
      );

      setRegions(prev => {
        const next = { ...prev };
        results.forEach((result, idx) => {
          const r = batch[idx];
          if (result.status === 'fulfilled' && result.value) {
            next[r.name] = { id: r.name, status: 'loaded', data: result.value };
          } else if (result.status === 'rejected') {
            next[r.name] = { id: r.name, status: 'error', data: [] };
          }
        });
        return next;
      });

    };

    const loadAllRegions = async () => {
      // Wave 1: First 10 cities (major ones) — all concurrent, no delay
      await loadBatch(REGIONS.slice(0, 10));

      // Wave 2: Load rest in batches of 10 with minimal delay
      for (let i = 10; i < REGIONS.length; i += 10) {
        const batch = REGIONS.slice(i, i + 10);
        await loadBatch(batch);
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
        newVinyl = { ...tracks[0], lat: 40, lng: -74, isOwner: true };
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

  // Circadian refresh
  useEffect(() => {
    const interval = setInterval(() => {
      const loadedKeys = Object.keys(regionsRef.current).filter(
        k => k !== 'user' && regionsRef.current[k].status === 'loaded'
      );
      if (loadedKeys.length === 0) return;

      const randomKey = loadedKeys[Math.floor(Math.random() * loadedKeys.length)];
      const region = REGIONS.find(r => r.name === randomKey);
      if (!region) return;

      fetchRegionalTracks(region.code, region.lat, region.lng, region.name)
        .then(newVinyls => {
          if (newVinyls.length === 0) return;
          setRegions(prev => ({
            ...prev,
            [randomKey]: { id: randomKey, status: 'loaded', data: newVinyls }
          }));
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setFlyToTarget({ lat, lng });
    setTimeout(() => setFlyToTarget(null), 3000);
  }, []);

  const myVinyl = allVinyls.find(v => v.isOwner);

  return (
    <div className="w-full h-full font-sans text-white">
      {/* Vortex mode — replaces globe */}
      {vortexMode && <VinylVortex onClose={() => setVortexMode(false)} />}

      {/* 3D Globe — shows immediately, dots appear as they load */}
      {!vortexMode && (
        <GlobeScene
          vinyls={allVinyls}
          onVinylClick={handleVinylClick}
          audioUnlocked={audioUnlocked}
          flyToTarget={flyToTarget}
        />
      )}

      {/* UI — always visible (unless vortex) */}
      {!vortexMode && (
        <>
          <SearchBar onFlyTo={handleFlyTo} />

          <Hud
            onDropVinyl={() => setIsDropModalOpen(true)}
            onVortex={() => setVortexMode(true)}
            myVinyl={myVinyl}
            vinylCount={allVinyls.length}
            regionCount={loadedRegionCount}
            totalRegions={REGIONS.length}
          />

          <NowPlayingBar vinyls={allVinyls} />
          <ActivityTicker vinyls={allVinyls} />

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
        </>
      )}
    </div>
  );
};

export default App;
