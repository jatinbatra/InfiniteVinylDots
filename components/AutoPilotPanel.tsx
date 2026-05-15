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
    <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none px-6">
      <div
        className="max-w-2xl w-full text-center transition-all duration-1000"
        style={{
          opacity: djIntro ? 1 : 0,
          transform: `translateY(${djIntro ? '0' : '20px'})`,
        }}
      >
        {/* DJ Intro with typewriter */}
        <div className="mb-8">
          {djIntro && (
            <h2 className="text-2xl md:text-4xl text-white font-black tracking-tighter leading-tight italic drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <TypewriterText text={djIntro} speed={40} />
            </h2>
          )}
        </div>

        {/* Track info - Small & Minimal */}
        {track && (
          <div className="flex flex-col items-center gap-3">
             <div className="w-16 h-16 rounded-full overflow-hidden shadow-2xl border-2 border-white/20 animate-pulse">
                <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
             </div>
             <div>
                <div className="text-white text-xs font-bold uppercase tracking-widest">{track.title}</div>
                <div className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{track.artist} &bull; {cityName}</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default AutoPilotPanel;
