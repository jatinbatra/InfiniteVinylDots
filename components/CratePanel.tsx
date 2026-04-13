import React, { useState, useEffect } from 'react';
import { VinylRecord } from '../types';
import { getCrate, removeFromCrate } from '../services/crateService';

interface CratePanelProps {
  open: boolean;
  onClose: () => void;
  onSelectVinyl: (vinyl: VinylRecord) => void;
}

const CratePanel: React.FC<CratePanelProps> = ({ open, onClose, onSelectVinyl }) => {
  const [items, setItems] = useState<VinylRecord[]>([]);

  useEffect(() => {
    if (open) setItems(getCrate());
  }, [open]);

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromCrate(id);
    setItems(prev => prev.filter(v => v.id !== id));
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/40" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-[95] h-full w-80 max-w-[90vw] bg-zinc-950 border-l border-zinc-800 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold text-sm">The Crate</h2>
            <p className="text-[10px] text-zinc-600">{items.length} saved tracks</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-60px)] p-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-zinc-600 text-xs">Your crate is empty.</p>
              <p className="text-zinc-700 text-[10px] mt-1">Open a track and save it here.</p>
            </div>
          ) : (
            items.map(vinyl => (
              <button
                key={vinyl.id}
                onClick={() => { onSelectVinyl(vinyl); onClose(); }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors group text-left"
              >
                <img
                  src={vinyl.coverUrl}
                  alt=""
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate font-medium">{vinyl.title}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{vinyl.artist}</div>
                </div>
                <button
                  onClick={(e) => handleRemove(e, vinyl.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1 flex-shrink-0"
                  title="Remove from crate"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default CratePanel;
