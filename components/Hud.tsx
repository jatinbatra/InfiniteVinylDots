import React, { useState, useEffect } from 'react';
import { VinylRecord } from '../types';

interface HudProps {
  onDropVinyl: () => void;
  onVortex?: () => void;
  onOpenCrate?: () => void;
  onOpenChart?: () => void;
  onAutoPilotToggle?: () => void;
  autoPilotActive?: boolean;
  crateCount?: number;
  myVinyl?: VinylRecord;
  vinylCount?: number;
  isZenMode?: boolean;
}

const Hud: React.FC<HudProps> = ({ 
  onDropVinyl, onVortex, onOpenCrate, onOpenChart, onAutoPilotToggle, 
  autoPilotActive, crateCount = 0, vinylCount = 0, isZenMode = false 
}) => {
  return (
    <div className={`transition-all duration-1000 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Top Header */}

      <div className="fixed top-0 left-0 right-0 p-8 flex justify-between items-start pointer-events-none z-50">
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
          <h1 className="text-white text-xl font-bold tracking-tight">VinylVerse</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">{vinylCount.toLocaleString()} Tracks Active</p>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <NavButton onClick={onOpenChart} label="Leaderboard" />
          <NavButton onClick={onOpenCrate} label={`My Crate (${crateCount})`} />
          <button 
            onClick={onDropVinyl}
            className="bg-white text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl active:scale-95"
          >
            Drop Your Vinyl
          </button>
        </div>
      </div>

      {/* Bottom Discovery */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 pointer-events-auto">
        <button
          onClick={onAutoPilotToggle}
          className={`h-14 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-2xl border ${
            autoPilotActive 
                ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                : 'bg-black/80 backdrop-blur-xl border-white/10 text-white hover:bg-white/10'
          }`}
        >
          {autoPilotActive ? 'Stop Discovery' : 'Start Auto-Pilot'}
        </button>
        
        <button 
            onClick={onVortex}
            className="w-14 h-14 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 shadow-2xl"
            title="God Mode"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Quick Help */}
      <div className="fixed bottom-10 right-10 text-right hidden md:block">
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Drag to Rotate</p>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Scroll to Zoom</p>
      </div>
    </div>
  );
};


const NavButton: React.FC<{ onClick?: () => void; label: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="bg-black/60 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all font-bold text-[10px] uppercase tracking-widest shadow-xl"
  >
    {label}
  </button>
);

export default Hud;
