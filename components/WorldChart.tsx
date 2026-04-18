import React, { useMemo, useState } from 'react';
import { VinylRecord, Chunk } from '../types';

interface WorldChartProps {
  open: boolean;
  onClose: () => void;
  regions: Record<string, Chunk>;
  onFlyAndPlay: (vinyl: VinylRecord) => void;
}

const heat = (v: VinylRecord) => v.likes * 2 + v.listenerCount;

const MEDALS = ['🥇', '🥈', '🥉'] as const;

// ─────────────────────────────────────────────────────────────────────────────

const WorldChart: React.FC<WorldChartProps> = ({ open, onClose, regions, onFlyAndPlay }) => {
  const [tab, setTab] = useState<'global' | 'city'>('global');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // vinyl.id → region name
  const vinylRegionMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(regions).forEach(([name, chunk]) => {
      chunk.data.forEach((v) => map.set(v.id, name));
    });
    return map;
  }, [regions]);

  // Global top-20 by heat score
  const globalChart = useMemo(() => {
    const all = Object.values(regions).flatMap((c) => c.data);
    return [...all].sort((a, b) => heat(b) - heat(a)).slice(0, 20);
  }, [regions]);

  // Max heat for normalising bars
  const maxHeat = useMemo(() => {
    const all = Object.values(regions).flatMap((c) => c.data);
    return Math.max(1, ...all.map(heat));
  }, [regions]);

  // Loaded, non-empty cities sorted alphabetically
  const cities = useMemo(
    () =>
      Object.entries(regions)
        .filter(([, c]) => c.status === 'loaded' && c.data.length > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name]) => name),
    [regions],
  );

  // Top-10 for the selected city
  const cityChart = useMemo(() => {
    if (!selectedCity) return [];
    const chunk = regions[selectedCity];
    if (!chunk) return [];
    return [...chunk.data].sort((a, b) => heat(b) - heat(a)).slice(0, 10);
  }, [regions, selectedCity]);

  const handlePlay = (vinyl: VinylRecord) => {
    onFlyAndPlay(vinyl);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[140] md:hidden bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[150] w-full md:w-[390px] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0b0b0b 0%, #000 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.055)',
          boxShadow: open ? '-24px 0 80px rgba(0,0,0,0.85)' : 'none',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform',
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-end gap-[3px] h-4">
                {[10, 16, 12, 16, 10].map((h, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-accent"
                    style={{
                      height: `${h}px`,
                      opacity: 0.7,
                      animation: open ? `chartEq 0.${4 + i}s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.09}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-accent/70 font-black uppercase tracking-[0.2em]">
                Live Rankings
              </span>
            </div>
            <h2 className="text-white text-[22px] font-black tracking-tight leading-none">
              World Chart
            </h2>
            <p className="text-zinc-600 text-[11px] mt-1">
              Ranked by listeners &amp; plays
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 mt-0.5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div className="flex gap-1.5 px-4 py-3 flex-shrink-0">
          {(['global', 'city'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === 'global') setSelectedCity(null);
              }}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                tab === t
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]'
              }`}
            >
              {t === 'global' ? '🌍  Global Top 20' : '🗺  By City'}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* ── GLOBAL TAB ─── */}
          {tab === 'global' && (
            <div className="px-3 pb-8">
              {globalChart.length === 0 ? (
                <EmptyState />
              ) : (
                globalChart.map((vinyl, idx) => (
                  <ChartRow
                    key={vinyl.id}
                    vinyl={vinyl}
                    rank={idx + 1}
                    cityName={vinylRegionMap.get(vinyl.id) ?? ''}
                    heatVal={heat(vinyl)}
                    maxHeat={maxHeat}
                    onClick={() => handlePlay(vinyl)}
                  />
                ))
              )}
            </div>
          )}

          {/* ── CITY TAB — grid of cities ─── */}
          {tab === 'city' && !selectedCity && (
            <div className="px-4 pb-8">
              <p className="text-zinc-700 text-[10px] uppercase tracking-widest font-bold mb-3 mt-0.5">
                {cities.length} cities loaded
              </p>
              <div className="grid grid-cols-2 gap-2">
                {cities.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState />
                  </div>
                ) : (
                  cities.map((city) => {
                    const chunk = regions[city];
                    const top = [...(chunk?.data ?? [])]
                      .sort((a, b) => heat(b) - heat(a))[0];
                    return (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className="group text-left p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent/20 transition-all"
                      >
                        <div className="text-white text-xs font-bold truncate group-hover:text-accent transition-colors">
                          {city}
                        </div>
                        {top && (
                          <div className="text-zinc-600 text-[10px] truncate mt-0.5">
                            {top.artist}
                          </div>
                        )}
                        <div className="text-[9px] text-zinc-800 mt-1 font-mono">
                          {chunk.data.length} tracks
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── CITY TAB — single city chart ─── */}
          {tab === 'city' && selectedCity && (
            <div className="px-3 pb-8">
              <button
                onClick={() => setSelectedCity(null)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-2.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All Cities
              </button>

              <div className="flex items-baseline gap-2 px-2 mb-3">
                <h3 className="text-white font-black text-lg leading-tight">
                  {selectedCity}
                </h3>
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">
                  Top 10
                </span>
              </div>

              {cityChart.length === 0 ? (
                <EmptyState />
              ) : (
                cityChart.map((vinyl, idx) => (
                  <ChartRow
                    key={vinyl.id}
                    vinyl={vinyl}
                    rank={idx + 1}
                    cityName={selectedCity}
                    heatVal={heat(vinyl)}
                    maxHeat={maxHeat}
                    onClick={() => handlePlay(vinyl)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes chartEq {
          0%   { height: 4px;  }
          100% { height: 16px; }
        }
      `}</style>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ChartRowProps {
  vinyl: VinylRecord;
  rank: number;
  cityName: string;
  heatVal: number;
  maxHeat: number;
  onClick: () => void;
}

const ChartRow: React.FC<ChartRowProps> = ({
  vinyl, rank, cityName, heatVal, maxHeat, onClick,
}) => {
  const barPct = Math.max(5, Math.round((heatVal / maxHeat) * 100));
  const isTop3 = rank <= 3;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-2 py-[9px] rounded-xl hover:bg-white/[0.04] active:bg-white/[0.06] transition-all group text-left"
    >
      {/* Rank */}
      <div className="w-7 flex-shrink-0 text-center">
        {isTop3 ? (
          <span className="text-[18px] leading-none">{MEDALS[rank - 1]}</span>
        ) : (
          <span className="text-[11px] font-black text-zinc-700 font-mono tabular-nums">
            {String(rank).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Vinyl disc */}
      <div className="flex-shrink-0 relative w-9 h-9">
        <div className="w-full h-full rounded-full overflow-hidden border border-black/50 shadow group-hover:shadow-accent/10 transition-shadow">
          <img
            src={vinyl.coverUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        {/* grooves */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'repeating-radial-gradient(circle at center, transparent 0, transparent 4px, rgba(0,0,0,0.22) 4px, rgba(0,0,0,0.22) 5px)',
          }}
        />
        {/* center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[7px] h-[7px] bg-black rounded-full" />
        </div>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-[12px] font-bold truncate leading-tight group-hover:text-accent transition-colors">
          {vinyl.title}
        </div>
        <div className="text-zinc-500 text-[10px] truncate mt-0.5">{vinyl.artist}</div>
        {cityName && (
          <div className="text-zinc-700 text-[9px] mt-0.5 uppercase tracking-wider truncate">
            {cityName}
          </div>
        )}
      </div>

      {/* Heat bar + count */}
      <div className="flex-shrink-0 flex flex-col items-end gap-[5px] w-14">
        <span className="text-[9px] font-mono text-zinc-600 tabular-nums">
          {vinyl.listenerCount.toLocaleString()}
        </span>
        <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${barPct}%`,
              background: isTop3
                ? 'linear-gradient(90deg, #FFD700, #FF9500)'
                : 'linear-gradient(90deg, rgba(0,217,255,0.4), #00D9FF)',
            }}
          />
        </div>
      </div>
    </button>
  );
};

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
    <div className="w-7 h-7 border-2 border-zinc-800 border-t-zinc-600 rounded-full animate-spin mb-3" />
    <p className="text-[11px]">Loading chart data…</p>
  </div>
);

export default WorldChart;
