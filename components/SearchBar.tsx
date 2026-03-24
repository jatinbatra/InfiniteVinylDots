import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { REGIONS } from '../constants';

interface SearchLocation {
  name: string;
  lat: number;
  lng: number;
  type: 'region' | 'city';
}

interface SearchBarProps {
  onFlyTo: (lat: number, lng: number) => void;
}

const MAJOR_CITIES: SearchLocation[] = [
  { name: 'New York', lat: 40.7128, lng: -74.006, type: 'city' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, type: 'city' },
  { name: 'London', lat: 51.5074, lng: -0.1278, type: 'city' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'city' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, type: 'city' },
  { name: 'Berlin', lat: 52.52, lng: 13.405, type: 'city' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, type: 'city' },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, type: 'city' },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, type: 'city' },
  { name: 'Seoul', lat: 37.5665, lng: 126.978, type: 'city' },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, type: 'city' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, type: 'city' },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, type: 'city' },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, type: 'city' },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, type: 'city' },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, type: 'city' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, type: 'city' },
  { name: 'Bogotá', lat: 4.711, lng: -74.0721, type: 'city' },
  { name: 'Kingston', lat: 18.0179, lng: -76.8099, type: 'city' },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, type: 'city' },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, type: 'city' },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, type: 'city' },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, type: 'city' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, type: 'city' },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, type: 'city' },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, type: 'city' },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, type: 'city' },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, type: 'city' },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, type: 'city' },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, type: 'city' },
];

const SearchBar: React.FC<SearchBarProps> = ({ onFlyTo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allLocations = useMemo<SearchLocation[]>(() => {
    const regionLocations: SearchLocation[] = REGIONS.map(r => ({
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      type: 'region' as const,
    }));
    return [...regionLocations, ...MAJOR_CITIES];
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allLocations
      .filter(loc => loc.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, allLocations]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const selectResult = useCallback((loc: SearchLocation) => {
    onFlyTo(loc.lat, loc.lng);
    close();
  }, [onFlyTo, close]);

  // Global "/" key to open
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (isOpen) return;
      // Don't trigger if user is typing in another input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, open]);

  // Keyboard navigation inside search
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        selectResult(results[selectedIndex]);
      }
    }
  }, [close, results, selectedIndex, selectResult]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={open}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 backdrop-blur-sm transition-all duration-200"
        title='Search locations (press "/")'
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="text-sm hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 font-mono">
          /
        </kbd>
      </button>

      {/* Search overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

          {/* Search panel */}
          <div
            className="relative w-full max-w-lg mx-4 animate-[slideDown_200ms_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-500 flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search countries and cities..."
                  className="flex-1 bg-transparent text-white text-base placeholder-zinc-500 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 font-mono cursor-pointer hover:text-zinc-300"
                  onClick={close}
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <ul ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
                  {results.map((loc, i) => (
                    <li
                      key={`${loc.type}-${loc.name}`}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-75 ${
                        i === selectedIndex
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => selectResult(loc)}
                    >
                      <span className="text-base flex-shrink-0">
                        {loc.type === 'region' ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-cyan-400"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-400"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 text-sm">{loc.name}</span>
                      <span className="text-[11px] text-zinc-500">
                        {loc.type === 'region' ? 'Country' : 'City'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state */}
              {query.trim() && results.length === 0 && (
                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                  No locations found for "{query}"
                </div>
              )}

              {/* Hint when empty */}
              {!query.trim() && (
                <div className="px-4 py-6 text-center text-zinc-600 text-sm">
                  Type to search countries and cities
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default SearchBar;
