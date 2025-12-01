import React, { memo } from 'react';
import { MAP_DIMENSIONS } from '../constants';

const WorldMap: React.FC = () => {
  return (
    <div 
        className="absolute pointer-events-none select-none overflow-visible"
        style={{
            width: MAP_DIMENSIONS.width,
            height: MAP_DIMENSIONS.height,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0
        }}
    >
        <svg 
            viewBox="0 0 2000 1000" 
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                {/* Tech Grid Pattern */}
                <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.1"/>
                    <circle cx="2" cy="2" r="0.5" fill="#00D9FF" opacity="0.3" />
                </pattern>
                
                {/* Radar Gradient */}
                <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="90%" stopColor="#00D9FF" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.0" />
                </radialGradient>

                <filter id="geo-glow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            {/* 1. Drifting Background Grid */}
            <rect 
                x="-100" y="-100" width="2200" height="1200" 
                fill="url(#techGrid)" 
                className="animate-[float_20s_linear_infinite]"
                opacity="0.6"
            />

            {/* 2. World Continents - Abstract Geometric Style */}
            <g className="fill-zinc-900/50 stroke-zinc-700 stroke-[0.5]" filter="url(#geo-glow)">
                 {/* North America */}
                 <path d="M180,100 L450,80 L550,350 L300,450 L180,300 Z" className="hover:stroke-accent/50 transition-colors duration-1000" /> 
                 {/* South America */}
                 <path d="M480,450 L650,480 L580,850 L450,700 Z" className="hover:stroke-accent/50 transition-colors duration-1000" />
                 {/* Africa */}
                 <path d="M880,300 L1150,300 L1100,700 L900,600 Z" className="hover:stroke-accent/50 transition-colors duration-1000" />
                 {/* Europe */}
                 <path d="M900,150 L1150,150 L1100,300 L900,300 Z" className="hover:stroke-accent/50 transition-colors duration-1000" />
                 {/* Asia */}
                 <path d="M1150,120 L1750,120 L1650,500 L1350,450 L1200,300 Z" className="hover:stroke-accent/50 transition-colors duration-1000" />
                 {/* Australia */}
                 <path d="M1500,650 L1700,650 L1650,850 L1450,800 Z" className="hover:stroke-accent/50 transition-colors duration-1000" />
            </g>

            {/* 3. Pulsing Hotspots (Decorations) */}
            <g className="fill-accent opacity-30">
                <circle cx="400" cy="200" r="2" className="animate-pulse" />
                <circle cx="1000" cy="200" r="2" className="animate-[pulse_3s_infinite]" />
                <circle cx="1500" cy="300" r="2" className="animate-[pulse_4s_infinite]" />
                <circle cx="550" cy="600" r="2" className="animate-[pulse_2s_infinite]" />
            </g>

            {/* 4. Radar Scan Effect - Large rotating element */}
            <g transform="translate(1000, 500)">
                <circle r="600" fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.1" strokeDasharray="10 20" />
                <circle r="400" fill="none" stroke="#00D9FF" strokeWidth="0.5" opacity="0.05" />
                {/* Rotating scanner */}
                <g className="animate-[spin_10s_linear_infinite]">
                    <path d="M0,0 L0,-600 A600,600 0 0,1 100,-590 L0,0" fill="url(#radar-gradient)" opacity="0.5" />
                </g>
            </g>

            {/* 5. Latitude/Longitude Reference Lines */}
            <line x1="0" y1="500" x2="2000" y2="500" stroke="#00D9FF" strokeWidth="1" strokeDasharray="4,8" opacity="0.1" />
            <line x1="1000" y1="0" x2="1000" y2="1000" stroke="#00D9FF" strokeWidth="1" strokeDasharray="4,8" opacity="0.1" />
        </svg>
    </div>
  );
};

export default memo(WorldMap);