import React, { useState, useEffect, useRef } from 'react';
import { VinylRecord } from '../types';
import { REGIONS } from '../constants';
import { getCircadianMood, formatLocalTime } from '../services/circadianService';

interface HudProps {
  onDropVinyl: () => void;
  myVinyl?: VinylRecord;
  vinylCount?: number;
  regionCount?: number;
  totalRegions?: number;
}

/* ------------------------------------------------------------------ */
/*  CSS keyframes injected once via <style> tag                        */
/* ------------------------------------------------------------------ */
const hudStyles = `
@keyframes hudFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hudSlideFromLeft {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes hudSlideFromRight {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes hudSlideFromBottom {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hudCountUp {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hudProgressPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.6; }
}
`;

const Hud: React.FC<HudProps> = ({ onDropVinyl, myVinyl, vinylCount = 0, regionCount = 0, totalRegions = 24 }) => {
  // ---- state ----------------------------------------------------------
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [hintsVisible, setHintsVisible] = useState(false);
  const [hintsAutoHidden, setHintsAutoHidden] = useState(false);
  const [animatedVinylCount, setAnimatedVinylCount] = useState(0);
  const [animatedRegionCount, setAnimatedRegionCount] = useState(0);

  // ---- live clock -----------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- mobile detection -----------------------------------------------
  useEffect(() => {
    const check = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const narrow = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(touch && narrow);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ---- gesture hints lifecycle ----------------------------------------
  useEffect(() => {
    const showTimer = setTimeout(() => setHintsVisible(true), 2000);
    const hideTimer = setTimeout(() => setHintsAutoHidden(true), 10000); // 2s delay + 8s visible
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  // ---- animated counters ----------------------------------------------
  useEffect(() => {
    if (animatedVinylCount < vinylCount) {
      const step = Math.max(1, Math.ceil((vinylCount - animatedVinylCount) / 10));
      const id = setTimeout(() => setAnimatedVinylCount(prev => Math.min(prev + step, vinylCount)), 40);
      return () => clearTimeout(id);
    }
  }, [vinylCount, animatedVinylCount]);

  useEffect(() => {
    if (animatedRegionCount < regionCount) {
      const id = setTimeout(() => setAnimatedRegionCount(prev => Math.min(prev + 1, regionCount)), 120);
      return () => clearTimeout(id);
    }
  }, [regionCount, animatedRegionCount]);

  // ---- mood cities ----------------------------------------------------
  const sampleCities = [
    { name: 'NYC', lng: -74 },
    { name: 'London', lng: 0 },
    { name: 'Tokyo', lng: 139.7 },
    { name: 'São Paulo', lng: -46.6 },
  ];

  const isLoading = regionCount < totalRegions;
  const progressPct = totalRegions > 0 ? Math.round((animatedRegionCount / totalRegions) * 100) : 0;

  return (
    <>
      {/* Inject keyframe styles */}
      <style>{hudStyles}</style>

      {/* ============================================================ */}
      {/*  TOP LEFT: Logo, About, Drop Vinyl, Mood Ticker              */}
      {/* ============================================================ */}
      <div
        className="fixed top-5 left-5 z-50 flex flex-col gap-3"
        style={{ animation: 'hudSlideFromLeft 0.6s ease-out both' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-full border-[3px] border-white flex items-center justify-center bg-black/50 backdrop-blur-sm relative">
            <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
            <div className="absolute inset-0 rounded-full animate-[spin_4s_linear_infinite] border-t-2 border-transparent border-t-accent opacity-50" />
          </div>
          <div>
            <div className="text-white font-black text-xl tracking-tight leading-none">
              VINYL<span className="text-accent">VERSE</span>
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-medium">
              Circadian 3D Globe
            </div>
          </div>
        </div>

        {/* About / Bio Panel */}
        <div style={{ animation: 'hudSlideFromLeft 0.6s ease-out 0.15s both' }}>
          {!aboutOpen ? (
            <button
              onClick={() => setAboutOpen(true)}
              className="w-8 h-8 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-[#00D9FF] hover:border-[#00D9FF]/40 transition-all"
              title="About VinylVerse"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            </button>
          ) : (
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-4 max-w-[240px] space-y-3 relative">
              <button
                onClick={() => setAboutOpen(false)}
                className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div>
                <div className="text-white font-bold text-sm">VinylVerse</div>
                <div className="text-[10px] text-[#00D9FF] font-medium mt-0.5">A Circadian 3D Globe of Music</div>
              </div>

              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Explore music from around the world, changing with the time of day.
                Each glowing dot is a track playing somewhere on Earth right now.
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-zinc-500">Created by</span>
                  <a
                    href="https://github.com/jatinbatra"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00D9FF] hover:underline font-medium"
                  >
                    @jatinbatra
                  </a>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-zinc-500">Built with</span>
                  <span className="text-zinc-300">React, Three.js, iTunes API</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drop vinyl button */}
        <button
          onClick={onDropVinyl}
          className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 hover:border-[#FFD700] text-white px-4 py-3 rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 group"
          style={{ animation: 'hudSlideFromLeft 0.6s ease-out 0.3s both' }}
        >
          <div className="bg-[#FFD700] text-black rounded-full p-1.5 group-hover:rotate-90 transition-transform duration-300">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Add Music</div>
            <div className="text-sm font-medium">Drop Your Vinyl</div>
          </div>
        </button>

        {/* Circadian mood ticker */}
        <div
          className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-3 space-y-2 max-w-[220px]"
          style={{ animation: 'hudSlideFromLeft 0.6s ease-out 0.45s both' }}
        >
          <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
            Live Moods Around the World
          </div>
          {sampleCities.map(city => {
            const mood = getCircadianMood(city.lng);
            const localTime = formatLocalTime(city.lng);
            return (
              <div key={city.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: mood.color }} />
                  <span className="text-[11px] text-zinc-300 font-medium truncate">{city.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/5" style={{ color: mood.color }}>
                    {mood.name}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono">{localTime}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  TOP RIGHT: Stats with progress bar & animated counters       */}
      {/* ============================================================ */}
      <div
        className="fixed top-5 right-5 z-50 flex flex-col items-end gap-2"
        style={{ animation: 'hudSlideFromRight 0.6s ease-out 0.2s both' }}
      >
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-lg px-3 py-2 flex flex-col gap-2 min-w-[200px]">
          {/* Region & vinyl counts */}
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              )}
              <span className="text-zinc-400" style={{ animation: 'hudCountUp 0.3s ease-out' }}>
                {animatedRegionCount}/{totalRegions} regions
              </span>
            </div>
            <div className="w-px h-3 bg-zinc-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#00D9FF] rounded-full" />
              <span className="text-zinc-400" style={{ animation: 'hudCountUp 0.3s ease-out' }}>
                {animatedVinylCount} vinyls
              </span>
            </div>
          </div>

          {/* Progress bar while loading */}
          {isLoading && (
            <div className="w-full space-y-1">
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, #00D9FF, #FFD700)',
                    animation: 'hudProgressPulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
              <div className="text-[9px] text-zinc-600 font-mono text-right">
                {progressPct}% loaded
              </div>
            </div>
          )}
        </div>

        {/* UTC Clock */}
        <div
          className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/30 rounded-lg px-3 py-1.5 text-[10px] font-mono text-zinc-500"
          style={{ animation: 'hudSlideFromRight 0.6s ease-out 0.4s both' }}
        >
          UTC {time.getUTCHours().toString().padStart(2, '0')}:{time.getUTCMinutes().toString().padStart(2, '0')}:{time.getUTCSeconds().toString().padStart(2, '0')}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  BOTTOM LEFT: Now Playing                                     */}
      {/* ============================================================ */}
      <div
        className="fixed bottom-5 left-5 z-50"
        style={{ animation: 'hudSlideFromBottom 0.6s ease-out 0.5s both' }}
      >
        {myVinyl && (
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-[#FFD700]/20 rounded-xl p-3 flex items-center gap-3 shadow-2xl max-w-xs">
            <div className="relative">
              <img
                src={myVinyl.coverUrl}
                className="w-11 h-11 rounded-full animate-[spin_6s_linear_infinite] object-cover"
                alt=""
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-[#FFD700] uppercase font-bold tracking-wider">Your Vinyl</div>
              <div className="text-sm text-white truncate font-medium">{myVinyl.title}</div>
              <div className="text-[10px] text-zinc-500 truncate">{myVinyl.artist}</div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  BOTTOM RIGHT: Gesture Hints (mobile-aware, auto-hide)        */}
      {/* ============================================================ */}
      {hintsVisible && (
        <div
          className="fixed bottom-5 right-5 z-50 text-right pointer-events-auto group"
          style={{
            animation: 'hudSlideFromBottom 0.5s ease-out both',
            opacity: hintsAutoHidden ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
          onMouseEnter={() => setHintsAutoHidden(false)}
          onMouseLeave={() => setHintsAutoHidden(true)}
        >
          <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/30 rounded-lg px-3 py-2">
            {isMobile ? (
              <p className="text-[10px] text-zinc-500 font-medium">
                <span className="text-zinc-400">Swipe</span> to rotate{' '}
                &middot; <span className="text-zinc-400">Pinch</span> to zoom{' '}
                &middot; <span className="text-zinc-400">Tap dot</span> to play
              </p>
            ) : (
              <p className="text-[10px] text-zinc-500 font-medium">
                <span className="text-zinc-400">Drag</span> to rotate{' '}
                &middot; <span className="text-zinc-400">Scroll</span> to zoom{' '}
                &middot; <span className="text-zinc-400">Click dot</span> to play{' '}
                &middot; Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-300 border border-zinc-700">/</kbd> to search
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  LOADING OVERLAY                                              */}
      {/* ============================================================ */}
      {regionCount === 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div
            className="bg-black/70 backdrop-blur-lg border border-zinc-800 rounded-2xl px-8 py-6 flex flex-col items-center gap-4"
            style={{ animation: 'hudFadeIn 0.5s ease-out both' }}
          >
            <div className="w-10 h-10 rounded-full border-[3px] border-[#00D9FF] border-t-transparent animate-spin" />
            <div className="text-center">
              <div className="text-white font-bold text-lg">Loading the World</div>
              <div className="text-zinc-500 text-sm">Fetching music from across the globe...</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Hud;
