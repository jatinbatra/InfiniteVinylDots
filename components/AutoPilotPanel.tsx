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
}) => {
  if (!active || !cityName) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center pointer-events-none w-full px-12">
      <div
        className="text-center transition-all duration-1000 max-w-xl"
        style={{
          opacity: djIntro ? 1 : 0,
        }}
      >
        {/* Subtitle-style minimal DJ intro */}
        {djIntro && (
          <h2 className="text-lg md:text-xl text-white font-medium tracking-tight italic drop-shadow-lg mb-6">
            <TypewriterText text={djIntro} speed={30} />
          </h2>
        )}

        {/* Small Track Card */}
        {track && (
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-2 pr-6 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
             <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
             </div>
             <div className="text-left">
                <div className="text-white text-[10px] font-bold uppercase tracking-widest leading-none">{track.title}</div>
                <div className="text-zinc-500 text-[9px] uppercase tracking-widest mt-1">{track.artist} &bull; {cityName}</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoPilotPanel;
