import React, { useEffect, useState, useRef } from 'react';
import { VinylRecord, AlbumInsight } from '../types';
import { getAlbumInsight } from '../services/geminiService';
import { audioManager } from '../services/musicService';

interface PlayerModalProps {
  vinyl: VinylRecord | null;
  onClose: () => void;
  onUpdate: (vinyl: VinylRecord) => void;
}

const YouTubePlayer: React.FC<{ videoId: string }> = ({ videoId }) => (
  <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl">
    <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      className="w-full h-full"
    />
  </div>
);

const PlayerModal: React.FC<PlayerModalProps> = ({ vinyl, onClose, onUpdate }) => {
  const [insight, setInsight] = useState<AlbumInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!vinyl) return;

    // Stop any ambient hover preview
    audioManager.stop();

    setInsight(null);
    setIsLoadingInsight(true);

    getAlbumInsight(vinyl.artist, vinyl.title).then(data => {
      setInsight(data);
      setIsLoadingInsight(false);
    });

    // For iTunes tracks, start playback
    if (vinyl.sourceType !== 'youtube' && vinyl.sourceType !== 'spotify' && vinyl.previewUrl) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [vinyl]);

  // Control audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!vinyl) return null;

  const isExternal = vinyl.sourceType === 'youtube' || vinyl.sourceType === 'spotify';

  const handleJoinToggle = () => {
    onUpdate({
      ...vinyl,
      isJoined: !vinyl.isJoined,
      listenerCount: vinyl.listenerCount + (vinyl.isJoined ? -1 : 1)
    });
  };

  const handleLikeToggle = () => {
    onUpdate({
      ...vinyl,
      isLiked: !vinyl.isLiked,
      likes: vinyl.likes + (vinyl.isLiked ? -1 : 1)
    });
  };

  const handleFollowToggle = () => {
    onUpdate({ ...vinyl, isFollowed: !vinyl.isFollowed });
  };

  const listenerAvatars = [
    vinyl.ownerAvatar,
    `https://i.pravatar.cc/150?u=${vinyl.id}1`,
    `https://i.pravatar.cc/150?u=${vinyl.id}2`,
    `https://i.pravatar.cc/150?u=${vinyl.id}3`
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Audio element for iTunes preview */}
      {!isExternal && vinyl.previewUrl && (
        <audio ref={audioRef} src={vinyl.previewUrl} loop />
      )}

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-lg"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-950 border border-zinc-800/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        style={{ animation: 'fadeZoomIn 0.25s ease-out' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 text-white/40 hover:text-white p-2 bg-black/60 rounded-full hover:bg-black/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Visual Side */}
        <div className="md:w-1/2 relative bg-zinc-900 flex items-center justify-center p-6 md:p-10 overflow-hidden min-h-[300px]">
          {isExternal ? (
            <div className="w-full aspect-square z-10">
              {vinyl.sourceType === 'youtube' && vinyl.externalId && (
                <YouTubePlayer videoId={vinyl.externalId} />
              )}
              {vinyl.sourceType === 'spotify' && vinyl.externalId && (
                <iframe
                  style={{ borderRadius: '12px' }}
                  src={`https://open.spotify.com/embed/track/${vinyl.externalId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="100%"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="shadow-2xl"
                />
              )}
            </div>
          ) : (
            <>
              {/* Blurred background art */}
              <div
                className="absolute inset-0 opacity-20 blur-3xl scale-150"
                style={{ backgroundImage: `url(${vinyl.coverUrl})`, backgroundSize: 'cover' }}
              />

              {/* Spinning vinyl */}
              <div className="relative w-full max-w-[320px] aspect-square">
                <div className={`w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-black/30 ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
                  <img src={vinyl.coverUrl} alt={vinyl.title} className="w-full h-full object-cover" />
                </div>
                {/* Vinyl grooves overlay */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 6px)',
                  }}
                />
                {/* Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-full" />
                {/* Center hole */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 bg-black rounded-full border border-white/20" />
                </div>
              </div>

              {/* Play/pause indicator */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 flex items-center gap-2 hover:bg-black/80 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <div className="flex gap-[3px] items-end h-4">
                      <div className="w-[3px] bg-accent rounded-full h-2 animate-[pulse_0.4s_ease-in-out_infinite]" />
                      <div className="w-[3px] bg-accent rounded-full h-4 animate-[pulse_0.6s_ease-in-out_infinite]" />
                      <div className="w-[3px] bg-accent rounded-full h-3 animate-[pulse_0.5s_ease-in-out_infinite]" />
                    </div>
                    <span className="text-xs text-white font-medium">Playing Preview</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-xs text-white font-medium">Play Preview</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Details Side */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br from-zinc-900 to-black overflow-y-auto">
          <div className="space-y-4">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap gap-1.5">
                {vinyl.genre.map(g => (
                  <span key={g} className="text-[9px] uppercase tracking-wider text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
                {vinyl.sourceType && (
                  <span className="text-[9px] uppercase tracking-wider text-gold border border-gold/20 bg-gold/5 px-2 py-0.5 rounded-full">
                    {vinyl.sourceType}
                  </span>
                )}
              </div>

              {/* Like button */}
              <button
                onClick={handleLikeToggle}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  vinyl.isLiked
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:border-zinc-500'
                }`}
              >
                <svg className={`w-3 h-3 ${vinyl.isLiked ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {vinyl.likes}
              </button>
            </div>

            {/* Title & Artist */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1.5 leading-tight tracking-tight line-clamp-2">
                {vinyl.title}
              </h2>
              <div className="flex items-center gap-2.5">
                <p className="text-lg text-zinc-400 font-medium">{vinyl.artist}</p>
                <button
                  onClick={handleFollowToggle}
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
                    vinyl.isFollowed
                      ? 'bg-white text-black border-white'
                      : 'border-zinc-600 text-zinc-500 hover:border-zinc-400'
                  }`}
                >
                  {vinyl.isFollowed ? 'Following' : 'Follow'}
                </button>
              </div>
              {vinyl.year && (
                <p className="text-xs text-zinc-600 mt-1">{vinyl.year}</p>
              )}
            </div>

            {/* AI Insight */}
            <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
              <div className="flex items-center gap-1.5 mb-2 text-gold text-[9px] font-bold uppercase tracking-[0.15em]">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                AI Vibe Check
              </div>

              {isLoadingInsight ? (
                <div className="flex gap-1 py-2">
                  <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : insight ? (
                <div className="space-y-2">
                  <p className="text-zinc-200 text-sm italic leading-relaxed">"{insight.vibe}"</p>
                  {insight.trivia && (
                    <p className="text-zinc-500 text-xs leading-relaxed">{insight.trivia}</p>
                  )}
                </div>
              ) : (
                <p className="text-zinc-600 text-xs">Insight unavailable</p>
              )}
            </div>
          </div>

          {/* Bottom: Listening Room */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-xl border border-white/5">
              <div className="flex items-center -space-x-2">
                {listenerAvatars.slice(0, 4).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className="w-7 h-7 rounded-full border-2 border-zinc-900 bg-zinc-800 object-cover"
                    alt=""
                  />
                ))}
                {vinyl.listenerCount > 4 && (
                  <div className="w-7 h-7 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                    +{vinyl.listenerCount - 4}
                  </div>
                )}
              </div>

              <button
                onClick={handleJoinToggle}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  vinyl.isJoined
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                    : 'bg-accent/90 hover:bg-accent text-black shadow-lg shadow-accent/10'
                }`}
              >
                {vinyl.isJoined ? 'In Room' : 'Join Room'}
              </button>
            </div>

            {isExternal && (
              <p className="text-center text-[9px] text-zinc-600 uppercase tracking-[0.15em]">
                Interactive Player Active
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Animation keyframe */}
      <style>{`
        @keyframes fadeZoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PlayerModal;
