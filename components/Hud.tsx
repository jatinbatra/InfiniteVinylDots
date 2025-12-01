import React from 'react';
import { VinylRecord } from '../types';

interface HudProps {
  onDropVinyl: () => void;
  myVinyl?: VinylRecord;
}

const Hud: React.FC<HudProps> = ({ onDropVinyl, myVinyl }) => {
  return (
    <>
      {/* Top Left: Logo & Drop Vinyl */}
      <div className="fixed top-6 left-6 z-50 flex flex-col gap-4">
        <div className="text-white font-bold text-2xl tracking-tighter flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
          </div>
          VINYL<span className="text-accent">VERSE</span>
        </div>

        <button 
          onClick={onDropVinyl}
          className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 hover:border-gold text-white px-4 py-3 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-3 group"
        >
          <div className="bg-gold text-black rounded-full p-1 group-hover:rotate-90 transition-transform duration-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div className="text-left">
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Add Music</div>
            <div className="text-sm font-medium">Drop Your Vinyl</div>
          </div>
        </button>
      </div>

      {/* Bottom Left: Mini Status */}
      <div className="fixed bottom-6 left-6 z-50">
        {myVinyl && (
          <div className="bg-zinc-900/80 backdrop-blur border border-gold/30 rounded-lg p-3 flex items-center gap-3 shadow-lg max-w-xs animate-in slide-in-from-left duration-500">
            <img src={myVinyl.coverUrl} className="w-10 h-10 rounded-full animate-[spin_10s_linear_infinite]" alt="Playing" />
            <div>
              <div className="text-xs text-gold uppercase font-bold">Your Vinyl Playing</div>
              <div className="text-sm text-white truncate">{myVinyl.title}</div>
            </div>
            <div className="h-4 flex gap-0.5 items-end ml-2">
              <div className="w-1 bg-accent h-3 animate-[pulse_0.5s_ease-in-out_infinite]"></div>
              <div className="w-1 bg-accent h-4 animate-[pulse_0.7s_ease-in-out_infinite]"></div>
              <div className="w-1 bg-accent h-2 animate-[pulse_0.6s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Right: Hints */}
      <div className="fixed bottom-6 right-6 z-50 text-right pointer-events-none opacity-50">
        <p className="text-xs text-white uppercase tracking-wider">Drag to Pan • Scroll to Zoom</p>
      </div>
    </>
  );
};

export default Hud;