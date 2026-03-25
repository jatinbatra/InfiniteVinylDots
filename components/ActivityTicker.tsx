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

/**
 * Floating activity toasts: "Tokyo — Yoasobi playing City Pop"
 * Shows one at a time, cycling through random vinyls every 8s.
 */
const ActivityTicker: React.FC<ActivityTickerProps> = ({ vinyls }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    if (vinyls.length < 20) return;

    const show = () => {
      const v = vinyls[Math.floor(Math.random() * vinyls.length)];
      if (!v.title || !v.artist) return;

      // Extract city from the vinyl ID (format: "CityName-trackId")
      const city = v.id.split('-')[0] || 'Unknown';

      counter.current++;
      setToast({ id: counter.current, vinyl: v, city });
      setVisible(true);

      // Hide after 5s
      setTimeout(() => setVisible(false), 5000);
    };

    // First toast after 4s
    const initialTimer = setTimeout(show, 4000);
    // Then every 8s
    const interval = setInterval(show, 8000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [vinyls]);

  if (!toast) return null;

  const color = toast.vinyl.circadianColor || '#00D9FF';

  return (
    <div
      className={`fixed top-16 right-5 z-50 transition-all duration-500 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      <div className="bg-black/70 backdrop-blur-xl border border-white/[0.06] rounded-xl px-3 py-2.5 flex items-center gap-2.5 max-w-[280px] shadow-lg">
        {/* Album art mini */}
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
        {/* Playing indicator dot */}
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
