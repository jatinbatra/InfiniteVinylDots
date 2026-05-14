import React, { useEffect, useState, useRef } from 'react';
import { VinylRecord, AlbumInsight } from '../types';
import { getAlbumInsight } from '../services/geminiService';
import { audioManager } from '../services/musicService';
import { searchYouTubeVideo } from '../services/youtubeService';
import { addToCrate, removeFromCrate, isInCrate, getCondition, improveCondition } from '../services/crateService';
import SharePostcard from './SharePostcard';

interface PlayerModalProps {
  vinyl: VinylRecord | null;
  onClose: () => void;
  onUpdate: (vinyl: VinylRecord) => void;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ vinyl, onClose, onUpdate }) => {
  const [insight, setInsight] = useState<AlbumInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [isSearchingYT, setIsSearchingYT] = useState(false);
  const [showYouTube, setShowYouTube] = useState(false);
  const [inCrate, setInCrate] = useState(false);
  const [condition, setCondition] = useState(0.3);
  const [showShare, setShowShare] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!vinyl) return;
    audioManager.stop();
    setInsight(null);
    setIsLoadingInsight(true);
    setYoutubeId(null);
    setShowYouTube(false);
    setInCrate(isInCrate(vinyl.id));
    setCondition(getCondition(vinyl.id));

    getAlbumInsight(vinyl.artist, vinyl.title).then(data => {
      setInsight(data);
      setIsLoadingInsight(false);
    });

    if (vinyl.sourceType === 'youtube' && vinyl.externalId) {
      setYoutubeId(vinyl.externalId);
    } else {
      setIsSearchingYT(true);
      searchYouTubeVideo(vinyl.artist, vinyl.title).then(id => {
        setYoutubeId(id);
        setIsSearchingYT(false);
      });
    }

    if (vinyl.previewUrl && vinyl.sourceType !== 'youtube' && vinyl.sourceType !== 'spotify') {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [vinyl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && !showYouTube) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, showYouTube]);

  useEffect(() => {
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    if (isPlaying && vinyl) {
      playTimerRef.current = setTimeout(() => {
        const newCond = improveCondition(vinyl.id);
        setCondition(newCond);
      }, 5000);
    }
    return () => { if (playTimerRef.current) clearTimeout(playTimerRef.current); };
  }, [isPlaying, vinyl]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!vinyl) return null;

  const handleCrateToggle = () => {
    if (inCrate) { removeFromCrate(vinyl.id); setInCrate(false); } 
    else { addToCrate(vinyl); setInCrate(true); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
      {vinyl.previewUrl && <audio ref={audioRef} src={vinyl.previewUrl} loop />}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

      <div className="relative bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col md:flex-row max-h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Close & Share */}
        <div className="absolute top-8 right-8 z-30 flex gap-2">
            <ActionButton onClick={() => setShowShare(true)}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></ActionButton>
            <ActionButton onClick={onClose}>✕</ActionButton>
        </div>

        {/* Visual Side */}
        <div className="md:w-[45%] relative flex items-center justify-center p-12 bg-black/40 border-r border-white/5 overflow-hidden">
            <div className="absolute inset-0 opacity-30 blur-[100px] animate-pulse" style={{ background: `radial-gradient(circle, ${vinyl.circadianColor || '#00D9FF'} 0%, transparent 70%)` }} />
            
            <div className="relative w-full max-w-[340px] aspect-square group">
                <div className={`w-full h-full rounded-full overflow-hidden shadow-2xl border-[12px] border-black/40 ring-1 ring-white/10 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                    <img src={vinyl.coverUrl} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Grooves */}
                <div className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle_at_center,transparent_0,transparent_4px,rgba(255,255,255,0.03)_5px)] pointer-events-none" />
                {/* Spindle */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-zinc-900 rounded-full border-2 border-white/10 shadow-inner" />
                </div>
            </div>

            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-10 bg-white text-black h-12 px-8 rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl z-20"
            >
                {isPlaying ? 'Pause Preview' : 'Play Preview'}
            </button>
        </div>

        {/* Info Side */}
        <div className="md:w-[55%] p-12 md:p-16 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-8">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-cyan-400/20">{vinyl.genre[0]}</span>
                        <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{vinyl.year} &bull; {vinyl.sourceType}</span>
                    </div>
                    <h2 className="text-white text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] mb-4">{vinyl.title}</h2>
                    <p className="text-zinc-400 text-xl font-medium tracking-tight">{vinyl.artist}</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                        <div className="w-4 h-[1px] bg-cyan-400" />
                        AI Insight
                    </div>
                    {isLoadingInsight ? (
                        <div className="h-20 flex items-center gap-1"><div className="w-1 h-1 bg-zinc-800 animate-bounce" /><div className="w-1 h-1 bg-zinc-800 animate-bounce delay-75" /><div className="w-1 h-1 bg-zinc-800 animate-bounce delay-150" /></div>
                    ) : (
                        <p className="text-zinc-300 text-lg leading-relaxed font-medium italic">"{insight?.vibe || 'The atmosphere is shifting...'}"</p>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={handleCrateToggle} className={`flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] border transition-all ${inCrate ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/5'}`}>
                        {inCrate ? 'In Your Crate' : 'Add to Crate'}
                    </button>
                    {youtubeId && !showYouTube && (
                        <button onClick={() => setShowYouTube(true)} className="flex-1 h-14 rounded-2xl bg-red-600 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-red-500 transition-all shadow-lg shadow-red-600/20">
                            Play Full Song
                        </button>
                    )}
                </div>
            </div>

            <div className="pt-12 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-4 border-[#0a0a0c]" />)}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{vinyl.listenerCount}+ Listening Now</div>
                </div>
                <div className="text-[10px] text-zinc-700 font-mono">ID: {vinyl.id.slice(-8)}</div>
            </div>
        </div>

        {/* YouTube Overlay */}
        {showYouTube && youtubeId && (
            <div className="absolute inset-0 z-50 bg-black animate-in fade-in duration-500 flex flex-col">
                <div className="p-8 flex justify-between items-center bg-black/80 backdrop-blur-xl">
                    <h3 className="text-white font-bold uppercase tracking-widest text-xs">YouTube Cinema Mode</h3>
                    <button onClick={() => setShowYouTube(false)} className="text-zinc-500 hover:text-white font-bold">Close Player</button>
                </div>
                <iframe className="flex-1 w-full" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen />
            </div>
        )}
      </div>

      {showShare && <SharePostcard vinyl={vinyl} onClose={() => setShowShare(false)} />}
    </div>
  );
};

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all">{children}</button>
);

export default PlayerModal;
