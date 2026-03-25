import React, { useState, useEffect, useRef } from 'react';
import { VinylRecord } from '../types';

interface ActivityTickerProps {
  vinyls: VinylRecord[];
}

interface Toast {
  id: number;
  vinyl: VinylRecord;
  city: string;
}

const ActivityTicker: React.FC<ActivityTickerProps> = ({ vinyls }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);
  const vinylsRef = useRef(vinyls);
  const counterRef = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  vinylsRef.current = vinyls;

  // Subscribe once, use ref for latest vinyls
  useEffect(() => {
    const show = () => {
      const current = vinylsRef.current;
      if (current.length < 20) return;

      const v = current[Math.floor(Math.random() * current.length)];
      if (!v.title || !v.artist) return;

      // Extract city from vinyl ID (format: "CityName-trackId")
      const dashIdx = v.id.indexOf('-');
      const city = dashIdx > 0 ? v.id.substring(0, dashIdx) : 'Somewhere';

      counterRef.current++;
      setToast({ id: counterRef.current, vinyl: v, city });
      setVisible(true);

      // Clear previous hide timer
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 5000);
    };

    const initialTimer = setTimeout(show, 4000);
    const interval = setInterval(show, 8000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!toast) return null;

  const color = toast.vinyl.circadianColor || '#00D9FF';

  return (
    <div
      className={`fixed top-16 right-5 z-50 transition-all duration-500 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      <div className="bg-black/70 backdrop-blur-xl border border-white/[0.06] rounded-xl px-3 py-2.5 flex items-center gap-2.5 max-w-[280px] shadow-lg">
        {toast.vinyl.coverUrl && (
          <img
            src={toast.vinyl.coverUrl.replace('600x600', '60x60')}
            alt=""
            className="w-8 h-8 rounded-md object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
            {toast.city}
          </div>
          <div className="text-white text-[11px] font-medium truncate leading-tight">
            {toast.vinyl.artist}
          </div>
          <div className="text-zinc-600 text-[10px] truncate">
            {toast.vinyl.title}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
};

export default ActivityTicker;
