import React, { useState, useEffect, useRef } from 'react';
import { VinylRecord } from '../types';
import { audioManager } from '../services/musicService';

interface NowPlayingBarProps {
  vinyls: VinylRecord[];
}

const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ vinyls }) => {
  const [currentTrack, setCurrentTrack] = useState<VinylRecord | null>(null);
  const [visible, setVisible] = useState(false);
  const vinylsRef = useRef(vinyls);
  vinylsRef.current = vinyls;

  // Subscribe once, use ref for latest vinyls
  useEffect(() => {
    const unsub = audioManager.onStateChange((playing, url) => {
      if (playing && url) {
        const match = vinylsRef.current.find(v => v.previewUrl === url);
        if (match) {
          setCurrentTrack(match);
          setVisible(true);
        }
      } else {
        setVisible(false);
      }
    });
    return unsub;
  }, []);

  if (!currentTrack) return null;

  const color = currentTrack.circadianColor || '#00D9FF';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[90] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto max-w-lg px-4 pb-4">
        <div
          className="bg-black/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl"
          style={{ boxShadow: `0 -4px 40px ${color}15` }}
        >
          {currentTrack.coverUrl && (
            <div className="relative flex-shrink-0">
              <img
                src={currentTrack.coverUrl.replace('600x600', '100x100')}
                alt=""
                className="w-11 h-11 rounded-lg object-cover shadow-lg"
              />
              <div
                className="absolute inset-0 rounded-lg border-2 border-transparent"
                style={{
                  borderTopColor: color,
                  animation: 'npSpin 2s linear infinite',
                  opacity: 0.4,
                }}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-semibold truncate leading-tight">
              {currentTrack.title}
            </div>
            <div className="text-zinc-500 text-[11px] truncate mt-0.5">
              {currentTrack.artist}
            </div>
          </div>

          <div className="flex items-end gap-[2px] h-5 pr-1">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  backgroundColor: color,
                  animation: visible ? `eqBar 0.${4 + i}s ease-in-out infinite alternate` : 'none',
                  height: '8px',
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes npSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes eqBar {
          0% { height: 4px; }
          100% { height: 20px; }
        }
      `}</style>
    </div>
  );
};

export default NowPlayingBar;
