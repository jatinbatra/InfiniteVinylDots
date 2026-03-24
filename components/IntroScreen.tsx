import React, { useState, useEffect, useRef } from 'react';

interface IntroScreenProps {
  loadedCities: string[];
  totalCities: number;
  onEnter: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ loadedCities, totalCities, onEnter }) => {
  const [currentCity, setCurrentCity] = useState('');
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const cityIdx = useRef(0);

  // Show the latest loaded city
  useEffect(() => {
    if (loadedCities.length > cityIdx.current) {
      setCurrentCity(loadedCities[loadedCities.length - 1]);
      cityIdx.current = loadedCities.length;
    }
  }, [loadedCities]);

  // Ready when 8+ cities loaded — enough for a good first impression
  useEffect(() => {
    if (loadedCities.length >= 8 && !ready) {
      setReady(true);
    }
  }, [loadedCities, ready]);

  const handleEnter = () => {
    setFadeOut(true);
    setTimeout(onEnter, 600);
  };

  const pct = totalCities > 0 ? Math.round((loadedCities.length / totalCities) * 100) : 0;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-950" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-lg text-center">

        {/* Logo mark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(0,217,255,0.15), transparent)',
                animation: 'spin 4s linear infinite',
              }}
            />
            <div className="w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center relative z-10">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            {/* Grooves */}
            <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
            <div className="absolute inset-4 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-6 rounded-full border border-white/[0.02]" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-white text-3xl font-bold tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            VinylVerse
          </h1>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            Hear what the world is listening to, right now.
          </p>
        </div>

        {/* What to expect — subtle feature hints */}
        <div className="flex items-center gap-6 text-zinc-600 text-xs">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                <path strokeWidth="1.5" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <span>Spin the globe</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2zm12-3c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2z" />
              </svg>
            </div>
            <span>Hover to preview</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span>Discover regions</span>
          </div>
        </div>

        {/* Progress section */}
        <div className="w-full max-w-xs space-y-3">
          {/* Progress bar */}
          <div className="w-full h-[2px] bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: 'white',
              }}
            />
          </div>

          {/* City ticker */}
          <div className="h-5 flex items-center justify-center">
            {currentCity ? (
              <p className="text-zinc-600 text-xs animate-pulse">
                Loading <span className="text-zinc-400">{currentCity}</span>...
              </p>
            ) : (
              <p className="text-zinc-600 text-xs">Connecting...</p>
            )}
          </div>
        </div>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={!ready}
          className={`
            mt-2 px-8 py-3 rounded-full text-sm font-medium transition-all duration-300
            ${ready
              ? 'bg-white text-black hover:bg-zinc-200 active:scale-95 cursor-pointer'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
            }
          `}
        >
          {ready ? 'Start Exploring' : `Loading ${loadedCities.length} of ${totalCities} cities...`}
        </button>
      </div>

      {/* Credit line */}
      <div className="absolute bottom-6 flex items-center gap-2 text-zinc-700 text-[10px]">
        <span>Built by</span>
        <a
          href="https://x.com/jatinbatra_"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors"
        >
          @jatinbatra_
        </a>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;
