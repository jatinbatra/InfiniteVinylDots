import React, { useState, useEffect, useRef } from 'react';
import { VinylRecord } from '../types';

interface AutoPilotPanelProps {
  active: boolean;
  cityName: string | null;
  djIntro: string | null;
  track: VinylRecord | null;
  moodColor: string | null;
  onTrackClick?: (vinyl: VinylRecord) => void;
}

const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 35 }) => {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    const timer = setInterval(() => {
      indexRef.current++;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 animate-pulse" />
      )}
    </span>
  );
};

const AutoPilotPanel: React.FC<AutoPilotPanelProps> = ({
  active,
  cityName,
  djIntro,
  track,
  moodColor,
  onTrackClick,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active && cityName) {
      setVisible(true);
    } else if (!active) {
      setVisible(false);
    }
  }, [active, cityName]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-full max-w-xl px-4">
      <div
        className="bg-black/80 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl transition-all duration-500"
        style={{
          borderColor: moodColor ? `${moodColor}40` : 'rgba(255,255,255,0.1)',
          boxShadow: moodColor ? `0 0 40px ${moodColor}15, 0 0 80px ${moodColor}08` : undefined,
        }}
      >
        {/* Top row: city + mode indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: moodColor || '#00D9FF' }}
            />
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: moodColor || '#00D9FF' }}>
              Discovery Flight
            </span>
          </div>
          {cityName && (
            <span className="text-[10px] text-zinc-500 font-medium">
              {cityName}
            </span>
          )}
        </div>

        {/* DJ Intro with typewriter */}
        <div className="min-h-[40px] mb-3">
          {djIntro ? (
            <p className="text-sm text-zinc-300 leading-relaxed italic">
              <TypewriterText text={djIntro} speed={30} />
            </p>
          ) : cityName ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: moodColor || '#00D9FF', borderTopColor: 'transparent' }} />
              <span className="text-xs text-zinc-600">Tuning in to {cityName}...</span>
            </div>
          ) : null}
        </div>

        {/* Track info */}
        {track && (
          <button
            onClick={() => onTrackClick?.(track)}
            className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <img
              src={track.coverUrl}
              alt=""
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-lg"
            />
            <div className="min-w-0 flex-1 text-left">
              <div className="text-sm text-white font-semibold truncate group-hover:text-accent transition-colors">
                {track.title}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">{track.artist}</div>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default AutoPilotPanel;
