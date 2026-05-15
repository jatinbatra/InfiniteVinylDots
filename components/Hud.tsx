import React from 'react';

interface HudProps {
  onDropVinyl: () => void;
  onOpenCrate?: () => void;
  onOpenChart?: () => void;
  onAutoPilotToggle?: () => void;
  autoPilotActive?: boolean;
  crateCount?: number;
  vinylCount?: number;
  isZenMode?: boolean;
}

const Hud: React.FC<HudProps> = ({ 
  onDropVinyl, onOpenCrate, onOpenChart, onAutoPilotToggle, 
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
          <NavButton onClick={onOpenChart} label="Global Charts" />
          <NavButton onClick={onOpenCrate} label={`My Crate (${crateCount})`} />
          <button 
            onClick={onDropVinyl}
            className="bg-white text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-accent transition-all shadow-xl active:scale-95"
          >
            Drop Your Vinyl
          </button>
        </div>
      </div>

      {/* Bottom Discovery */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <button
          onClick={onAutoPilotToggle}
          className={`h-14 px-10 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-2xl border ${
            autoPilotActive 
                ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                : 'bg-black/80 backdrop-blur-xl border-white/10 text-white hover:bg-white/10'
          }`}
        >
          {autoPilotActive ? 'Stop Discovery' : 'Start Auto-Pilot Flight'}
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
