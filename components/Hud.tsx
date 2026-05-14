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
  quality?: 'low' | 'high';
  onQualityToggle?: () => void;
}

const Hud: React.FC<HudProps> = ({ 
  onDropVinyl, onVortex, onOpenCrate, onOpenChart, onAutoPilotToggle, 
  autoPilotActive, crateCount = 0, myVinyl, vinylCount = 0, 
  quality = 'high', onQualityToggle 
}) => {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      {/* Sleek Top Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
          <h1 className="text-white text-2xl font-bold tracking-tighter leading-none">VINYL<span className="text-cyan-400">VERSE</span></h1>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Live: {vinylCount.toLocaleString()} Tracks</span>
          </div>
        </div>

        <div className="flex gap-3 pointer-events-auto">
          <ActionButton onClick={onOpenChart} title="Global Charts">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </ActionButton>
          
          <ActionButton onClick={onOpenCrate} title="My Crate" badge={crateCount}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </ActionButton>

          <button
            onClick={onDropVinyl}
            className="h-11 px-6 rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Drop Music
          </button>
        </div>
      </div>

      {/* Floating Discovery Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/40 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-2xl">
        <button
          onClick={onAutoPilotToggle}
          className={`h-10 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
            autoPilotActive ? 'bg-emerald-500 text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          {autoPilotActive ? 'Cancel Flight' : 'Auto-Pilot'}
        </button>

        <div className="w-px h-4 bg-white/10" />

        <button
            onClick={onQualityToggle}
            className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-500 hover:text-cyan-400 transition-colors"
            title="Toggle Visual Quality"
        >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </button>

        <button
          onClick={() => setAboutOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
        </button>
      </div>

      {/* About Modal */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
            <div className="bg-zinc-950 border border-white/10 p-8 rounded-3xl max-w-lg w-full relative">
                <button onClick={() => setAboutOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">✕</button>
                <h2 className="text-white text-3xl font-bold tracking-tighter mb-4">VINYLVERSE</h2>
                <p className="text-zinc-400 leading-relaxed mb-6">Step into a massive, 3D music discovery ecosystem. Explore tracks geolocated across 100+ global markets in real-time.</p>
                <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold">JB</div>
                    <div>
                        <div className="text-white font-bold">Jatin Batra</div>
                        <div className="text-zinc-600 text-xs">Architect & Visionary</div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

const ActionButton: React.FC<{ onClick?: () => void; children: React.ReactNode; title: string; badge?: number }> = ({ onClick, children, title, badge }) => (
  <button
    onClick={onClick}
    className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all relative group shadow-xl"
    title={title}
  >
    {children}
    {badge ? (
      <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
        {badge}
      </span>
    ) : null}
  </button>
);

export default Hud;
