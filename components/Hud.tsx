import React, { useState, useEffect } from 'react';
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

const Hud: React.FC<HudProps> = ({ onDropVinyl, myVinyl, vinylCount = 0, regionCount = 0, totalRegions = 24 }) => {
  // Live clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sample moods from a few key cities
  const sampleCities = [
    { name: 'NYC', lng: -74 },
    { name: 'London', lng: 0 },
    { name: 'Tokyo', lng: 139.7 },
    { name: 'São Paulo', lng: -46.6 },
  ];

  const isLoading = regionCount < totalRegions;

  return (
    <>
      {/* Top Left: Logo & Controls */}
      <div className="fixed top-5 left-5 z-50 flex flex-col gap-3">
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

        {/* Drop vinyl button */}
        <button
          onClick={onDropVinyl}
          className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 hover:border-gold text-white px-4 py-3 rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 group"
        >
          <div className="bg-gold text-black rounded-full p-1.5 group-hover:rotate-90 transition-transform duration-300">
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
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-3 space-y-2 max-w-[220px]">
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

      {/* Top Right: Stats */}
      <div className="fixed top-5 right-5 z-50 flex flex-col items-end gap-2">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-lg px-3 py-2 flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            {isLoading ? (
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            ) : (
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            )}
            <span className="text-zinc-400">
              {regionCount}/{totalRegions} regions
            </span>
          </div>
          <div className="w-px h-3 bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-accent rounded-full" />
            <span className="text-zinc-400">{vinylCount} vinyls</span>
          </div>
        </div>

        {/* UTC Clock */}
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/30 rounded-lg px-3 py-1.5 text-[10px] font-mono text-zinc-500">
          UTC {time.getUTCHours().toString().padStart(2, '0')}:{time.getUTCMinutes().toString().padStart(2, '0')}:{time.getUTCSeconds().toString().padStart(2, '0')}
        </div>
      </div>

      {/* Bottom Left: Now Playing */}
      <div className="fixed bottom-5 left-5 z-50">
        {myVinyl && (
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-gold/20 rounded-xl p-3 flex items-center gap-3 shadow-2xl max-w-xs">
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
              <div className="text-[9px] text-gold uppercase font-bold tracking-wider">Your Vinyl</div>
              <div className="text-sm text-white truncate font-medium">{myVinyl.title}</div>
              <div className="text-[10px] text-zinc-500 truncate">{myVinyl.artist}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Right: Controls */}
      <div className="fixed bottom-5 right-5 z-50 text-right pointer-events-none">
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/30 rounded-lg px-3 py-2">
          <p className="text-[10px] text-zinc-500 font-medium">
            <span className="text-zinc-400">Drag</span> to rotate &middot; <span className="text-zinc-400">Scroll</span> to zoom &middot; <span className="text-zinc-400">Hover</span> to preview
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {regionCount === 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 backdrop-blur-lg border border-zinc-800 rounded-2xl px-8 py-6 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
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
