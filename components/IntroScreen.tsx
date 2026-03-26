import React, { useState, useEffect, useRef } from 'react';

interface IntroScreenProps {
  loadedCities: string[];
  totalCities: number;
  onEnter: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ loadedCities, totalCities, onEnter }) => {
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [step, setStep] = useState(0); // 0=loading, 1=ready

  useEffect(() => {
    if (loadedCities.length >= 3 && !ready) {
      setReady(true);
      const timer = setTimeout(() => setStep(1), 400);
      return () => clearTimeout(timer);
    }
  }, [loadedCities.length, ready]);

  const handleEnter = () => {
    setFadeOut(true);
    setTimeout(onEnter, 500);
  };

  const pct = totalCities > 0 ? Math.min(100, Math.round((loadedCities.length / totalCities) * 100)) : 0;
  const currentCity = loadedCities.length > 0 ? loadedCities[loadedCities.length - 1] : '';

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-all duration-500 ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #0a0a0a 0%, #000 70%)',
      }}
    >
      {/* Ambient colored orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[120px]"
        style={{ background: '#00D9FF', top: '20%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px]"
        style={{ background: '#FF3CAC', bottom: '10%', right: '20%' }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 max-w-md text-center">

        {/* Animated vinyl icon */}
        <div className="mb-8 relative">
          <div
            className="w-24 h-24 rounded-full border border-white/[0.06] flex items-center justify-center"
            style={{ animation: 'vinylSpin 8s linear infinite' }}
          >
            {/* Grooves */}
            <div className="absolute inset-[8px] rounded-full border border-white/[0.04]" />
            <div className="absolute inset-[16px] rounded-full border border-white/[0.03]" />
            <div className="absolute inset-[24px] rounded-full border border-white/[0.04]" />
            <div className="absolute inset-[32px] rounded-full border border-white/[0.03]" />
            {/* Center label */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
            </div>
          </div>
          {/* Glow ring */}
          <div
            className="absolute inset-[-12px] rounded-full border border-white/[0.03]"
            style={{ animation: 'pulseRing 3s ease-in-out infinite' }}
          />
        </div>

        {/* Title */}
        <h1
          className="text-white text-[40px] font-bold tracking-tight leading-none"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui, sans-serif',
            animation: 'fadeUp 0.8s ease-out both',
          }}
        >
          VinylVerse
        </h1>

        <p
          className="text-zinc-500 text-[15px] mt-3 leading-relaxed font-normal max-w-[320px]"
          style={{ animation: 'fadeUp 0.8s ease-out 0.15s both' }}
        >
          Explore music playing across 100+ cities. Every region sounds different.
        </p>

        {/* Live city names scrolling */}
        <div
          className="mt-8 h-6 overflow-hidden"
          style={{ animation: 'fadeUp 0.8s ease-out 0.3s both' }}
        >
          {currentCity && (
            <div key={currentCity} className="text-zinc-600 text-xs font-medium" style={{ animation: 'cityFlip 0.3s ease-out' }}>
              {currentCity}
            </div>
          )}
        </div>

        {/* Progress */}
        <div
          className="w-48 mt-3"
          style={{ animation: 'fadeUp 0.8s ease-out 0.4s both' }}
        >
          <div className="w-full h-[1px] bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out bg-white/40"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10" style={{ animation: 'fadeUp 0.8s ease-out 0.5s both' }}>
          {step >= 1 ? (
            <button
              onClick={handleEnter}
              className="group relative px-8 py-3 rounded-full bg-white text-black text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95"
            >
              Explore the Globe
            </button>
          ) : (
            <div className="flex items-center gap-2 text-zinc-600 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
              <span>Loading cities...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom credit */}
      <div
        className="absolute bottom-8 flex items-center gap-2 text-zinc-700 text-[11px]"
        style={{ animation: 'fadeUp 0.8s ease-out 0.6s both' }}
      >
        <span>by</span>
        <a
          href="https://x.com/jatinbatra_"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-white transition-colors font-medium"
        >
          Jatin Batra
        </a>
      </div>

      <style>{`
        @keyframes vinylSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cityFlip {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;
