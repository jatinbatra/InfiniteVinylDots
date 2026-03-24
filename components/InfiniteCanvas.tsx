import React, { useMemo, useRef } from 'react';
import { VinylRecord, CanvasState } from '../types';
import VinylDot from './VinylDot';
import WorldMap from './WorldMap';
import { CANVAS_OPTS, REGIONS } from '../constants';
import { latLngToCanvas } from '../services/musicService';

interface InfiniteCanvasProps {
  vinyls: VinylRecord[];
  canvasState: CanvasState;
  handlers: any;
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked?: boolean;
}

const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ vinyls, canvasState, handlers, onVinylClick, audioUnlocked }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport culling - only render vinyls visible on screen
  const visibleVinyls = useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1000;
    const buffer = CANVAS_OPTS.BUFFER;

    // The world container is at left:50%, top:50% then translated by offset
    // So world coord (0,0) appears at screen (w/2 + offset.x, h/2 + offset.y)
    // A point at world (wx, wy) appears at screen (w/2 + offset.x + wx*scale, h/2 + offset.y + wy*scale)
    // Visible range in world coords:
    const minX = (-canvasState.offset.x - w / 2) / canvasState.scale - buffer;
    const maxX = (-canvasState.offset.x + w / 2) / canvasState.scale + buffer;
    const minY = (-canvasState.offset.y - h / 2) / canvasState.scale - buffer;
    const maxY = (-canvasState.offset.y + h / 2) / canvasState.scale + buffer;

    return vinyls.filter(v =>
      v.position.x >= minX && v.position.x <= maxX &&
      v.position.y >= minY && v.position.y <= maxY
    );
  }, [vinyls, canvasState]);

  // Region labels for the map
  const regionLabels = useMemo(() => {
    return REGIONS.map(r => {
      const pos = latLngToCanvas(r.lat, r.lng);
      return { ...r, pos };
    });
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-background select-none cursor-grab active:cursor-grabbing"
      {...handlers}
      ref={containerRef}
      style={{
        touchAction: 'none', // Prevent browser touch gestures
        backgroundImage: 'radial-gradient(circle at center, #060612 0%, #000 100%)'
      }}
    >
      {/* The world container - CSS transform for hardware-accelerated pan/zoom */}
      <div
        className="absolute left-1/2 top-1/2 w-0 h-0 origin-center will-change-transform"
        style={{
          transform: `translate(${canvasState.offset.x}px, ${canvasState.offset.y}px) scale(${canvasState.scale})`
        }}
      >
        {/* Map layer */}
        <WorldMap />

        {/* Region labels */}
        {regionLabels.map(r => (
          <div
            key={r.code}
            className="absolute pointer-events-none select-none"
            style={{
              left: r.pos.x,
              top: r.pos.y - 40,
              transform: 'translate(-50%, -100%)',
              opacity: canvasState.scale > 0.4 ? 0.6 : 0.3,
              transition: 'opacity 0.5s'
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/60 whitespace-nowrap text-center">
              {r.name}
            </div>
            <div className="w-px h-4 bg-accent/20 mx-auto" />
          </div>
        ))}

        {/* Vinyl dots */}
        {visibleVinyls.map(vinyl => (
          <VinylDot
            key={vinyl.id}
            vinyl={vinyl}
            scale={canvasState.scale}
            onClick={onVinylClick}
            audioUnlocked={audioUnlocked}
          />
        ))}
      </div>

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Minimap corner info */}
      <div className="absolute top-2 right-2 text-zinc-700 text-[10px] pointer-events-none font-mono text-right">
        {visibleVinyls.length} vinyls visible
      </div>
    </div>
  );
};

export default InfiniteCanvas;
