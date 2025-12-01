import React, { useMemo, useRef } from 'react';
import { VinylRecord, CanvasState } from '../types';
import VinylDot from './VinylDot';
import WorldMap from './WorldMap';
import { CANVAS_OPTS, MAP_DIMENSIONS } from '../constants';

interface InfiniteCanvasProps {
  vinyls: VinylRecord[];
  canvasState: CanvasState;
  handlers: any; // Mouse event handlers
  onVinylClick: (vinyl: VinylRecord) => void;
}

const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({ vinyls, canvasState, handlers, onVinylClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport Culling Logic
  const visibleVinyls = useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1000;

    const buffer = CANVAS_OPTS.BUFFER;
    const centerX = width / 2;
    const centerY = height / 2;

    const minX = ((-centerX - canvasState.offset.x) / canvasState.scale) - buffer;
    const maxX = ((centerX - canvasState.offset.x + width) / canvasState.scale) + buffer;
    const minY = ((-centerY - canvasState.offset.y) / canvasState.scale) - buffer;
    const maxY = ((centerY - canvasState.offset.y + height) / canvasState.scale) + buffer;

    return vinyls.filter(v => 
      v.position.x >= minX && v.position.x <= maxX &&
      v.position.y >= minY && v.position.y <= maxY
    );
  }, [vinyls, canvasState]);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-background select-none cursor-move"
      {...handlers}
      ref={containerRef}
      style={{
        backgroundImage: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)'
      }}
    >
      {/* 
        The World Container 
        We use CSS transform for hardware accelerated panning/zooming.
      */}
      <div 
        className="absolute left-1/2 top-1/2 w-0 h-0 origin-center will-change-transform"
        style={{
          transform: `translate(${canvasState.offset.x}px, ${canvasState.offset.y}px) scale(${canvasState.scale})`
        }}
      >
        {/* The Map Layer - sits behind everything */}
        <WorldMap />

        {/* Vinyl Dots */}
        {visibleVinyls.map(vinyl => (
          <VinylDot 
            key={vinyl.id}
            vinyl={vinyl}
            scale={canvasState.scale}
            onClick={onVinylClick}
          />
        ))}

        {/* Center Origin Marker (optional debug) */}
        {/* <div className="absolute w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none" /> */}
      </div>
      
      {/* Debug Info */}
      <div className="absolute top-2 right-2 text-zinc-600 text-[10px] pointer-events-none font-mono text-right">
        pos: {Math.round(-canvasState.offset.x)}, {Math.round(-canvasState.offset.y)} <br/>
        lat/lng: {(canvasState.offset.y / MAP_DIMENSIONS.height * 180).toFixed(1)}, {(-canvasState.offset.x / MAP_DIMENSIONS.width * 360).toFixed(1)} <br/>
        active nodes: {visibleVinyls.length}
      </div>
    </div>
  );
};

export default InfiniteCanvas;