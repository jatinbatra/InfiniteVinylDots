import React, { memo, useState, useEffect, useRef } from 'react';
import { VinylRecord } from '../types';
import { CANVAS_OPTS } from '../constants';
import { audioManager } from '../services/musicService';

interface VinylDotProps {
  vinyl: VinylRecord;
  scale: number; // Current canvas scale
  onClick: (vinyl: VinylRecord) => void;
}

const VinylDot: React.FC<VinylDotProps> = ({ vinyl, scale, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic sizing based on listeners and hover state
  const baseSize = vinyl.listenerCount > 50 ? 60 : CANVAS_OPTS.DOT_BASE_SIZE;
  
  // Visual scaling logic
  const textScale = Math.max(0.4, 1 / scale);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Debounce audio start slightly to avoid cacophony when panning fast
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
        if (vinyl.previewUrl) {
            audioManager.play(vinyl.previewUrl);
        }
    }, 200);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    audioManager.stop();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    }
  }, []);

  return (
    <div
      className="absolute transform-gpu transition-all duration-500 ease-out cursor-pointer flex items-center justify-center group"
      style={{
        left: vinyl.position.x,
        top: vinyl.position.y,
        width: isHovered ? CANVAS_OPTS.DOT_HOVER_SIZE : baseSize,
        height: isHovered ? CANVAS_OPTS.DOT_HOVER_SIZE : baseSize,
        transform: `translate(-50%, -50%)`,
        zIndex: isHovered ? 50 : 1
      }}
      onClick={(e) => {
        e.stopPropagation();
        audioManager.stop(); // Stop hover preview when clicking to open modal
        onClick(vinyl);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* The Vinyl Disc Visual */}
      <div 
        className={`
          w-full h-full rounded-full border border-opacity-20 flex items-center justify-center overflow-hidden
          transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)]
          ${vinyl.isOwner ? 'border-gold shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'border-white'}
          ${isHovered ? 'shadow-[0_0_50px_rgba(0,217,255,0.6)] border-accent' : ''}
          ${vinyl.isPlaying ? 'animate-pulse-slow' : ''}
          bg-black relative
        `}
      >
        {/* Album Art */}
        <img 
          src={vinyl.coverUrl} 
          alt={vinyl.title}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}
            ${vinyl.isOwner ? 'opacity-100' : ''}
            ${vinyl.isPlaying && !isHovered ? 'animate-[spin_10s_linear_infinite]' : ''}
          `}
          loading="lazy"
        />

        {/* Center hole / Label */}
        <div className={`absolute w-[15%] h-[15%] bg-black rounded-full z-10 border border-white/10 flex items-center justify-center`}>
            {vinyl.isPlaying && !isHovered && (
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
            )}
        </div>

        {/* Hover overlay ring */}
        {isHovered && (
            <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-20"></div>
        )}
      </div>

      {/* Hover Information / Floating Label */}
      <div 
        className={`
          absolute -top-16 left-1/2 -translate-x-1/2 w-64 text-center pointer-events-none
          transition-all duration-300 flex flex-col items-center z-[60]
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
        style={{ transform: `translate(-50%, ${isHovered ? '-20px' : '10px'}) scale(${textScale})` }}
      >
        <div className="bg-black/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-2xl flex flex-col items-center gap-1">
            <span className="text-white font-bold text-sm leading-tight">
            {vinyl.title}
            </span>
            <span className="text-accent text-xs font-medium">
            {vinyl.artist}
            </span>
            {vinyl.previewUrl && (
                <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    Previewing
                </div>
            )}
        </div>
        
        {/* Listener Count Badge */}
        {vinyl.listenerCount > 0 && (
           <span className="text-black text-[10px] -mt-2 z-10 font-bold flex items-center gap-1 bg-gold px-2 py-0.5 rounded-full border border-white/50 shadow-lg">
             {vinyl.listenerCount} listening
           </span>
        )}
      </div>
    </div>
  );
};

export default memo(VinylDot);