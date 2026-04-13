import React, { useState, useEffect } from 'react';
import { VinylRecord } from '../types';

interface HudProps {
  onDropVinyl: () => void;
  onVortex?: () => void;
  onOpenCrate?: () => void;
  crateCount?: number;
  myVinyl?: VinylRecord;
  vinylCount?: number;
  regionCount?: number;
  totalRegions?: number;
}

const Hud: React.FC<HudProps> = ({ onDropVinyl, onVortex, onOpenCrate, crateCount = 0, myVinyl, vinylCount = 0 }) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const narrow = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(touch && narrow);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <>
      {/* ================================================================ */}
      {/*  TOP LEFT — Logo, minimal                                        */}
      {/* ================================================================ */}
      <div className="fixed top-5 left-5 z-50 flex items-center gap-3 select-none">
        {/* Vinyl icon */}
        <div className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <div>
          <div className="text-white font-semibold text-base tracking-tight leading-none">
            VinylVerse
          </div>
          <div className="text-[10px] text-zinc-600 font-medium mt-0.5">
            {vinylCount.toLocaleString()} tracks worldwide
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  TOP RIGHT — Actions                                             */}
      {/* ================================================================ */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
        {/* About button */}
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </button>

        {/* Crate button */}
        {onOpenCrate && (
          <button
            onClick={onOpenCrate}
            className="relative w-9 h-9 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-gold/70 hover:text-gold hover:bg-gold/10 hover:border-gold/30 transition-all"
            title="The Crate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {crateCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {crateCount > 99 ? '99+' : crateCount}
              </span>
            )}
          </button>
        )}

        {/* Vortex mode button */}
        {onVortex && (
          <button
            onClick={onVortex}
            className="w-9 h-9 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
            title="Turntable God Mode"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4" />
            </svg>
          </button>
        )}

        {/* Drop vinyl button */}
        <button
          onClick={onDropVinyl}
          className="h-9 px-4 rounded-full bg-white text-black text-xs font-semibold flex items-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Music
        </button>
      </div>

      {/* ================================================================ */}
      {/*  ABOUT PANEL — Clean overlay                                     */}
      {/* ================================================================ */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAboutOpen(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <button
              onClick={() => setAboutOpen(false)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h2 className="text-white text-lg font-semibold">VinylVerse</h2>
              <p className="text-zinc-500 text-sm mt-1">Hear what the world is listening to.</p>
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              Spin the globe and discover music from 100+ cities.
              Lagos plays afrobeats. Tokyo plays city pop. Berlin plays techno.
              Each region sounds like itself — and the vibe changes with the time of day.
            </p>

            <p className="text-sm text-zinc-500 leading-relaxed">
              Music is the most universal thing we have, but algorithms trap us in bubbles.
              I wanted to build something where you could just point at a place on Earth
              and hear what's actually playing there.
            </p>

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-xs font-bold text-white">JB</div>
                <div>
                  <div className="text-white text-sm font-semibold">Jatin Batra</div>
                  <div className="text-xs text-zinc-600">Builder</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://x.com/jatinbatra_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  @jatinbatra_
                </a>
                <a
                  href="https://github.com/jatinbatra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </a>
              </div>
            </div>

            <div className="text-[10px] text-zinc-700 pt-2 border-t border-zinc-900">
              React + Three.js + iTunes API
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  BOTTOM LEFT — Now Playing (your vinyl)                          */}
      {/* ================================================================ */}
      {myVinyl && (
        <div className="fixed bottom-5 left-5 z-50">
          <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-xl p-3 flex items-center gap-3 max-w-xs">
            <img
              src={myVinyl.coverUrl}
              className="w-10 h-10 rounded-lg object-cover"
              alt=""
            />
            <div className="min-w-0">
              <div className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider">Your Vinyl</div>
              <div className="text-sm text-white truncate font-medium">{myVinyl.title}</div>
              <div className="text-[10px] text-zinc-500 truncate">{myVinyl.artist}</div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  BOTTOM CENTER — Hint (auto-hides)                               */}
      {/* ================================================================ */}
      <HintBar isMobile={isMobile} />
    </>
  );
};

const HintBar: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-500" style={{ opacity: visible ? 1 : 0 }}>
      <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/50 rounded-full px-4 py-2">
        <p className="text-[11px] text-zinc-500 font-medium whitespace-nowrap">
          {isMobile ? (
            <>Swipe to rotate &middot; Pinch to zoom &middot; Tap a dot to listen</>
          ) : (
            <>Drag to rotate &middot; Scroll to zoom &middot; Hover a dot to preview &middot; Click to open</>
          )}
        </p>
      </div>
    </div>
  );
};

export default Hud;
