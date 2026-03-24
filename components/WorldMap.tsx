import React, { memo } from 'react';
import { MAP_DIMENSIONS } from '../constants';

const WorldMap: React.FC = () => {
  const w = MAP_DIMENSIONS.width;
  const h = MAP_DIMENSIONS.height;
  // SVG viewBox maps to our world coordinate system
  // World coords go from -w/2 to w/2 and -h/2 to h/2
  // SVG viewBox: 0 0 w h, so SVG (x,y) = world (x - w/2, y - h/2)

  return (
    <div
      className="absolute pointer-events-none select-none overflow-visible"
      style={{
        width: w,
        height: h,
        left: -w / 2,
        top: -h / 2,
        zIndex: 0
      }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Subtle grid */}
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#00D9FF" strokeWidth="0.3" opacity="0.08" />
          </pattern>

          {/* Fine grid */}
          <pattern id="gridFine" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="0.3" fill="#00D9FF" opacity="0.15" />
          </pattern>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft continent glow */}
          <filter id="continentGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="scanGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="85%" stopColor="#00D9FF" stopOpacity="0.04" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Background grid */}
        <rect x="0" y="0" width={w} height={h} fill="url(#grid)" />
        <rect x="0" y="0" width={w} height={h} fill="url(#gridFine)" />

        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map(lat => {
          const y = h / 2 - (lat / 90) * (h / 2);
          return (
            <g key={`lat-${lat}`}>
              <line x1="0" y1={y} x2={w} y2={y} stroke="#00D9FF" strokeWidth="0.5" strokeDasharray="6,12" opacity="0.08" />
              <text x="8" y={y - 4} fill="#00D9FF" opacity="0.15" fontSize="10" fontFamily="monospace">{lat}°</text>
            </g>
          );
        })}

        {/* Longitude lines */}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lng => {
          const x = w / 2 + (lng / 180) * (w / 2);
          return (
            <g key={`lng-${lng}`}>
              <line x1={x} y1="0" x2={x} y2={h} stroke="#00D9FF" strokeWidth="0.5" strokeDasharray="6,12" opacity="0.08" />
              <text x={x + 4} y="14" fill="#00D9FF" opacity="0.15" fontSize="10" fontFamily="monospace">{lng}°</text>
            </g>
          );
        })}

        {/* Equator highlight */}
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#00D9FF" strokeWidth="0.8" strokeDasharray="4,8" opacity="0.12" />
        {/* Prime meridian */}
        <line x1={w / 2} y1="0" x2={w / 2} y2={h} stroke="#00D9FF" strokeWidth="0.8" strokeDasharray="4,8" opacity="0.12" />

        {/* Continents - simplified geometric shapes with glow */}
        <g filter="url(#continentGlow)">
          {/* North America */}
          <path
            d="M600,250 L700,200 L850,180 L1000,220 L1100,350 L1050,500 L900,550 L750,500 L650,400 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.8"
            opacity="0.5"
          />
          {/* Central America */}
          <path
            d="M900,550 L950,580 L920,680 L880,700 L850,640 L860,590 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.6"
            opacity="0.4"
          />
          {/* South America */}
          <path
            d="M950,700 L1050,680 L1100,750 L1120,900 L1080,1100 L1000,1250 L920,1200 L880,1050 L900,850 L920,750 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.8"
            opacity="0.5"
          />
          {/* Europe */}
          <path
            d="M1850,250 L1950,200 L2100,200 L2200,250 L2250,350 L2200,420 L2100,440 L1950,400 L1880,350 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.8"
            opacity="0.5"
          />
          {/* Africa */}
          <path
            d="M1900,500 L2050,480 L2200,500 L2250,650 L2200,900 L2100,1050 L1950,1100 L1850,950 L1830,750 L1850,600 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.8"
            opacity="0.5"
          />
          {/* Asia */}
          <path
            d="M2250,180 L2500,150 L2800,170 L3100,200 L3300,300 L3350,450 L3200,550 L3000,600 L2800,580 L2600,520 L2400,480 L2300,400 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.8"
            opacity="0.5"
          />
          {/* India */}
          <path
            d="M2800,580 L2900,560 L2950,650 L2900,800 L2800,750 L2780,650 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.6"
            opacity="0.4"
          />
          {/* Southeast Asia / Indonesia */}
          <path
            d="M3000,600 L3200,580 L3350,620 L3400,700 L3300,720 L3100,700 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.6"
            opacity="0.4"
          />
          {/* Japan/Korea */}
          <path
            d="M3300,280 L3350,260 L3380,300 L3370,380 L3340,400 L3300,350 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.6"
            opacity="0.5"
          />
          {/* Australia */}
          <path
            d="M3200,900 L3450,880 L3550,950 L3500,1100 L3350,1150 L3200,1050 Z"
            fill="#0a1525"
            stroke="#00D9FF"
            strokeWidth="0.8"
            opacity="0.5"
          />
        </g>

        {/* Animated radar sweep */}
        <g transform={`translate(${w / 2}, ${h / 2})`}>
          <circle r="800" fill="none" stroke="#00D9FF" strokeWidth="0.3" opacity="0.06" strokeDasharray="8 16" />
          <circle r="500" fill="none" stroke="#00D9FF" strokeWidth="0.3" opacity="0.04" />
          <g className="animate-[spin_20s_linear_infinite]">
            <path d="M0,0 L0,-800 A800,800 0 0,1 140,-785 L0,0" fill="url(#scanGrad)" opacity="0.4" />
          </g>
        </g>

        {/* Decorative pulsing hotspots at music capitals */}
        {[
          { x: 830, y: 420, label: 'NYC' },      // New York
          { x: 680, y: 440, label: 'LA' },        // LA
          { x: 1980, y: 310, label: 'LON' },      // London
          { x: 2050, y: 360, label: 'BER' },      // Berlin
          { x: 3320, y: 330, label: 'TKY' },      // Tokyo
          { x: 3150, y: 380, label: 'SEO' },      // Seoul
          { x: 1000, y: 850, label: 'RIO' },      // Rio
          { x: 2100, y: 600, label: 'LGS' },      // Lagos
          { x: 2850, y: 650, label: 'MUM' },      // Mumbai
        ].map(spot => (
          <g key={spot.label}>
            <circle cx={spot.x} cy={spot.y} r="4" fill="#00D9FF" opacity="0.15" className="animate-pulse" />
            <circle cx={spot.x} cy={spot.y} r="1.5" fill="#00D9FF" opacity="0.4" />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default memo(WorldMap);
