import React, { useState, useEffect, useCallback, useRef } from 'react';
import GlobeScene from './components/GlobeScene';
import PlayerModal from './components/PlayerModal';
import Hud from './components/Hud';
import DropModal from './components/DropModal';
import SearchBar from './components/SearchBar';
import NowPlayingBar from './components/NowPlayingBar';
import ActivityTicker from './components/ActivityTicker';
import VinylVortex from './components/VinylVortex';
import CratePanel from './components/CratePanel';
import AutoPilotPanel from './components/AutoPilotPanel';
import WelcomeScreen from './components/WelcomeScreen';
import WorldChart from './components/WorldChart';
import { fetchRegionalTracks, fetchTrackSearch } from './services/musicService';
import { getCrate } from './services/crateService';
import { decodeShareParams, hasShareParams } from './services/shareService';
import { useAutoPilot } from './hooks/useAutoPilot';
import { VinylRecord, Chunk } from './types';
import { REGIONS } from './constants';

const App: React.FC = () => {
  const [regions, setRegions] = useState<Record<string, Chunk>>({});
  const [selectedVinyl, setSelectedVinyl] = useState<VinylRecord | null>(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [vortexMode, setVortexMode] = useState(false);
  const [crateOpen, setCrateOpen] = useState(false);
  const [crateCount, setCrateCount] = useState(() => getCrate().length);
  const [chartOpen, setChartOpen] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const isDeepLink = hasShareParams();
  const regionsRef = useRef(regions);
  regionsRef.current = regions;
  const fetchingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unlock = () => {
      setAudioUnlocked(true);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => { window.removeEventListener('click', unlock); window.removeEventListener('touchstart', unlock); };
  }, []);

  useEffect(() => {
    const shared = decodeShareParams();
    if (!shared) return;
    window.history.replaceState({}, '', window.location.pathname);
    const timer = setTimeout(() => {
      if (shared.lat != null && shared.lng != null) {
        setFlyToTarget({ lat: shared.lat, lng: shared.lng });
        setTimeout(() => setFlyToTarget(null), 3000);
      }
      setSelectedVinyl(shared);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const loadBatch = useCallback(async (names: string[]) => {
    const toLoad = names
      .map(n => REGIONS.find(r => r.name === n))
      .filter((r): r is typeof REGIONS[0] =>
        !!r && !regionsRef.current[r.name] && !fetchingRef.current.has(r.name)
      );

    if (toLoad.length === 0) return;
    toLoad.forEach(r => fetchingRef.current.add(r.name));

    setRegions(prev => {
      const next = { ...prev };
      toLoad.forEach(r => { if (!next[r.name]) next[r.name] = { id: r.name, status: 'loading', data: [] }; });
      return next;
    });

    const results = await Promise.allSettled(toLoad.map(r => fetchRegionalTracks(r.code, r.lat, r.lng, r.name)));
    toLoad.forEach(r => fetchingRef.current.delete(r.name));

    setRegions(prev => {
      const next = { ...prev };
      results.forEach((result, idx) => {
        const r = toLoad[idx];
        if (result.status === 'fulfilled' && result.value) { next[r.name] = { id: r.name, status: 'loaded', data: result.value }; }
        else if (result.status === 'rejected') { next[r.name] = { id: r.name, status: 'error', data: [] }; }
      });
      return next;
    });
  }, []);

  useEffect(() => { loadBatch(REGIONS.slice(0, 10).map(r => r.name)); }, [loadBatch]);

  const handleVisibleRegions = useCallback((regionNames: string[]) => {
    const unloaded = regionNames.filter(n => !regionsRef.current[n]);
    if (unloaded.length > 0) loadBatch(unloaded);
  }, [loadBatch]);

  const allVinyls = React.useMemo(() => Object.values(regions).flatMap((region: Chunk) => region.data), [regions]);

  const handleVinylClick = useCallback((vinyl: VinylRecord) => { setSelectedVinyl(vinyl); }, []);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setFlyToTarget({ lat, lng });
    setTimeout(() => setFlyToTarget(null), 3000);
  }, []);

  const autoPilot = useAutoPilot(handleFlyTo);

  const handleAutoPilotToggle = useCallback(() => {
    if (autoPilot.active) { autoPilot.stop(); } else { autoPilot.start(); }
  }, [autoPilot]);

  const handleVinylClickWithAutoPilotStop = useCallback((vinyl: VinylRecord) => {
    if (autoPilot.active) autoPilot.stop();
    handleVinylClick(vinyl);
  }, [autoPilot, handleVinylClick]);

  return (
    <div className="w-full h-full font-sans text-white bg-black">
      {!welcomeDismissed && (
        <WelcomeScreen skipWelcome={isDeepLink} onDismiss={() => setWelcomeDismissed(true)} />
      )}

      {vortexMode && <VinylVortex onClose={() => setVortexMode(false)} />}

      {!vortexMode && (
        <GlobeScene
          vinyls={allVinyls} regions={regions} onVinylClick={handleVinylClickWithAutoPilotStop}
          audioUnlocked={audioUnlocked} flyToTarget={flyToTarget} onVisibleRegionsChange={handleVisibleRegions}
        />
      )}

      {!vortexMode && (
        <>
          {!autoPilot.active && <SearchBar onFlyTo={handleFlyTo} />}
          <Hud
            onDropVinyl={() => setIsDropModalOpen(true)}
            onVortex={() => setVortexMode(true)}
            onOpenCrate={() => setCrateOpen(true)}
            onOpenChart={() => setChartOpen(true)}
            onAutoPilotToggle={handleAutoPilotToggle}
            autoPilotActive={autoPilot.active}
            crateCount={crateCount}
            vinylCount={allVinyls.length}
            isZenMode={autoPilot.active}
          />

          {!autoPilot.active && <NowPlayingBar vinyls={allVinyls} />}
          {!autoPilot.active && <ActivityTicker vinyls={allVinyls} />}

          <AutoPilotPanel
            active={autoPilot.active} cityName={autoPilot.cityName} djIntro={autoPilot.djIntro}
            track={autoPilot.track} moodColor={autoPilot.moodColor} onTrackClick={handleVinylClickWithAutoPilotStop}
          />

          <CratePanel
            open={crateOpen} onClose={() => { setCrateOpen(false); setCrateCount(getCrate().length); }}
            onSelectVinyl={handleVinylClick}
          />
          <WorldChart
            open={chartOpen} onClose={() => setChartOpen(false)} regions={regions}
            onFlyAndPlay={(vinyl) => {
              if (autoPilot.active) autoPilot.stop();
              if (vinyl.lat != null && vinyl.lng != null) handleFlyTo(vinyl.lat, vinyl.lng);
              setSelectedVinyl(vinyl);
            }}
          />

          {selectedVinyl && (
            <PlayerModal
              vinyl={selectedVinyl}
              onClose={() => { setSelectedVinyl(null); setCrateCount(getCrate().length); }}
              onUpdate={(v) => setSelectedVinyl(v)}
            />
          )}

          {isDropModalOpen && <DropModal onClose={() => setIsDropModalOpen(false)} onSubmit={() => setIsDropModalOpen(false)} />}
        </>
      )}
    </div>
  );
};

export default App;
