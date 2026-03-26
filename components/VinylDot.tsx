import React, { memo, useState, useEffect, useRef } from 'react';
import { VinylRecord } from '../types';
import { CANVAS_OPTS } from '../constants';
import { audioManager } from '../services/musicService';

interface VinylDotProps {
  vinyl: VinylRecord;
  scale: number;
  onClick: (vinyl: VinylRecord) => void;
  audioUnlocked?: boolean;
}

const VinylDot: React.FC<VinylDotProps> = ({ vinyl, scale, onClick, audioUnlocked }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const baseSize = vinyl.listenerCount > 50 ? 80 : CANVAS_OPTS.DOT_BASE_SIZE;
  const hoverSize = CANVAS_OPTS.DOT_HOVER_SIZE;

  // Inverse scale for text so it stays readable at any zoom
  const textScale = Math.max(0.5, Math.min(2, 1 / scale));

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (vinyl.previewUrl && audioUnlocked) {
        audioManager.play(vinyl.previewUrl);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    audioManager.stop();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Only trigger click if the pointer didn't move much (not a drag)
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      if (dx < 10 && dy < 10) {
        e.stopPropagation();
        audioManager.stop();
        onClick(vinyl);
      }
    }
    mouseDownPos.current = null;
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  return (
    <div
      className="absolute transform-gpu transition-all duration-300 ease-out cursor-pointer flex items-center justify-center group"
      style={{
        left: vinyl.position.x,
        top: vinyl.position.y,
        width: isHovered ? hoverSize : baseSize,
        height: isHovered ? hoverSize : baseSize,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 50 : 1
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer glow ring on hover */}
      {isHovered && (
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: hoverSize + 20,
            height: hoverSize + 20,
            border: '1px solid rgba(0, 217, 255, 0.3)',
            left: -10,
            top: -10,
          }}
        />
      )}

      {/* The vinyl disc */}
      <div
        className={`
          w-full h-full rounded-full overflow-hidden relative
          transition-all duration-300
          ${vinyl.isOwner ? 'ring-2 ring-gold shadow-[0_0_20px_rgba(255,215,0,0.4)]' : ''}
          ${isHovered ? 'shadow-[0_0_40px_rgba(0,217,255,0.5)] ring-2 ring-accent' : 'shadow-[0_0_10px_rgba(255,255,255,0.05)]'}
        `}
      >
        {/* Album art */}
        <img
          src={vinyl.coverUrl}
          alt={vinyl.title}
          className={`
            w-full h-full object-cover transition-all duration-500
            ${isHovered ? 'opacity-100 scale-105' : 'opacity-50'}
            ${vinyl.isPlaying && !isHovered ? 'animate-[spin_8s_linear_infinite]' : ''}
          `}
          loading="lazy"
          draggable={false}
        />

        {/* Vinyl grooves overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: isHovered
              ? 'none'
              : 'repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
          }}
        />

        {/* Center hole */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-[14%] h-[14%] bg-black rounded-full border border-white/10 flex items-center justify-center`}>
            {vinyl.isPlaying && (
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      <div
        className={`
          absolute pointer-events-none z-[60]
          transition-all duration-300 flex flex-col items-center
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          bottom: '100%',
          left: '50%',
          transform: `translate(-50%, ${isHovered ? '-12px' : '8px'}) scale(${textScale})`,
          transformOrigin: 'bottom center'
        }}
      >
        <div className="bg-black/95 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl flex flex-col items-center gap-0.5 min-w-[180px]">
          <span className="text-white font-bold text-sm leading-tight text-center line-clamp-1">
            {vinyl.title}
          </span>
          <span className="text-accent text-xs font-medium">
            {vinyl.artist}
          </span>
          {vinyl.genre?.[0] && (
            <span className="text-zinc-500 text-[10px] mt-0.5">
              {vinyl.genre[0]} &middot; {vinyl.year}
            </span>
          )}
          {vinyl.previewUrl && audioUnlocked && (
            <div className="text-[9px] text-zinc-500 flex items-center gap-1 mt-1">
              <div className="flex gap-[2px] items-end h-3">
                <div className="w-[2px] bg-accent h-1 animate-[pulse_0.4s_ease-in-out_infinite]" />
                <div className="w-[2px] bg-accent h-2 animate-[pulse_0.6s_ease-in-out_infinite]" />
                <div className="w-[2px] bg-accent h-1.5 animate-[pulse_0.5s_ease-in-out_infinite]" />
              </div>
              Previewing
            </div>
          )}
        </div>

        {/* Listener count badge */}
        {vinyl.listenerCount > 0 && (
          <span className="text-black text-[9px] font-bold flex items-center gap-1 bg-gold px-2 py-0.5 rounded-full shadow-lg -mt-1.5 z-10">
            {vinyl.listenerCount > 999 ? `${(vinyl.listenerCount / 1000).toFixed(1)}k` : vinyl.listenerCount} listening
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(VinylDot);
