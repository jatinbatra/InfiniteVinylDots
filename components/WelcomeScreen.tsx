import React, { useEffect, useState } from 'react';

const WELCOME_KEY = 'vinylverse-welcomed-v1';

interface WelcomeScreenProps {
  skipWelcome: boolean;
  onDismiss: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ skipWelcome, onDismiss }) => {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Skip for deep-link arrivals or returning visitors
    if (skipWelcome || localStorage.getItem(WELCOME_KEY)) {
      onDismiss();
      return;
    }
    setVisible(true);
    setMounted(true);

    const timer = setTimeout(() => dismiss(), 5500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    if (fading) return;
    setFading(true);
    localStorage.setItem(WELCOME_KEY, '1');
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 600);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center select-none"
      style={{
        background:
          'radial-gradient(ellipse 120% 120% at 50% 60%, #050510 0%, #000000 70%)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Ambient glow rings */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,217,255,0.04) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: mounted ? 'welcomePulse 4s ease-in-out infinite' : 'none',
        }}
      />

      <div
        className="text-center px-6 max-w-xs"
        style={{
          animation: mounted ? 'welcomeFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both' : 'none',
        }}
      >
        {/* Vinyl record */}
        <div className="mx-auto mb-9 relative w-28 h-28">
          <div
            className="w-full h-full rounded-full shadow-2xl"
            style={{
              background:
                'conic-gradient(from 0deg, #141414 0%, #1e1e1e 20%, #111 40%, #1c1c1c 60%, #141414 80%, #181818 100%)',
              animation: 'vinylSpinWelcome 5s linear infinite',
            }}
          >
            {/* Record grooves */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'repeating-radial-gradient(circle at center, transparent 0px, transparent 9px, rgba(0,0,0,0.25) 9px, rgba(0,0,0,0.25) 10px)',
              }}
            />
          </div>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(circle, rgba(0,217,255,0.12) 0%, rgba(0,217,255,0.04) 100%)',
                border: '1px solid rgba(0,217,255,0.25)',
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: '#00D9FF',
                  boxShadow: '0 0 12px #00D9FF, 0 0 24px rgba(0,217,255,0.4)',
                }}
              />
            </div>
          </div>

          {/* Outer glow */}
          <div
            className="absolute inset-[-8px] rounded-full pointer-events-none"
            style={{
              boxShadow: '0 0 50px rgba(0,217,255,0.08)',
            }}
          />
        </div>

        <h1
          className="text-[42px] font-black text-white tracking-tighter leading-none mb-3"
          style={{ letterSpacing: '-0.03em' }}
        >
          VinylVerse
        </h1>

        <p className="text-zinc-300 text-[17px] leading-snug mb-2 font-medium">
          Hear what Earth is listening to.
        </p>
        <p className="text-zinc-600 text-sm leading-relaxed mb-10">
          100+ cities. Real local music. Spin the globe.
        </p>

        {/* EQ bars */}
        <div className="flex items-center justify-center gap-[4px] mb-8 h-5">
          {[12, 20, 14, 20, 12, 18, 10].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: `${h}px`,
                background: '#00D9FF',
                opacity: 0.5,
                animation: `eqWelcome 0.${5 + i}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>

        <button
          onClick={dismiss}
          className="group relative px-10 py-3.5 rounded-full text-sm font-bold overflow-hidden transition-all"
          style={{
            background: '#00D9FF',
            color: '#000',
            boxShadow: '0 0 30px rgba(0,217,255,0.3)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 0 50px rgba(0,217,255,0.5)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 0 30px rgba(0,217,255,0.3)';
          }}
        >
          Start Exploring
          <svg
            className="inline-block ml-2 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M13 7l5 5-5 5M6 12h12"
            />
          </svg>
        </button>

        <p className="mt-5 text-[10px] text-zinc-800 uppercase tracking-widest font-bold">
          Click anywhere to skip
        </p>
      </div>

      <style>{`
        @keyframes welcomeFadeUp {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes vinylSpinWelcome {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes welcomePulse {
          0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1);    }
          50%     { opacity: 1;   transform: translate(-50%,-50%) scale(1.08); }
        }
        @keyframes eqWelcome {
          0%   { height: 4px;  }
          100% { height: 20px; }
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
