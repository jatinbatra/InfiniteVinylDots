import React, { useEffect, useState, useRef } from 'react';
import { VinylRecord, AlbumInsight } from '../types';
import { getAlbumInsight } from '../services/geminiService';
import { audioManager } from '../services/musicService';

interface PlayerModalProps {
  vinyl: VinylRecord | null;
  onClose: () => void;
  onUpdate: (vinyl: VinylRecord) => void;
}

// Dedicated YouTube Player Component
const YouTubePlayer: React.FC<{ videoId: string }> = ({ videoId }) => {
  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl relative">
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
};

const PlayerModal: React.FC<PlayerModalProps> = ({ vinyl, onClose, onUpdate }) => {
  const [insight, setInsight] = useState<AlbumInsight | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true); 
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (vinyl) {
      // Logic for External Sources vs iTunes Preview
      if (vinyl.sourceType === 'youtube' || vinyl.sourceType === 'spotify') {
          audioManager.stop(); // Stop the ambient preview immediately
      } else {
          setIsPlaying(true);
      }
      
      setIsLoadingInsight(true);
      setInsight(null);
      
      // Fetch AI insight
      getAlbumInsight(vinyl.artist, vinyl.title)
        .then(data => {
            setInsight(data);
            setIsLoadingInsight(false);
        });
    }
  }, [vinyl]);

  // Handle iTunes Audio Element logic
  useEffect(() => {
      if (vinyl?.sourceType === 'itunes' && audioRef.current) {
          if (isPlaying) {
              audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlaying, vinyl]);

  if (!vinyl) return null;

  const isExternal = vinyl.sourceType === 'youtube' || vinyl.sourceType === 'spotify';

  // --- SOCIAL ACTIONS ---

  const handleJoinToggle = () => {
    const isJoining = !vinyl.isJoined;
    onUpdate({
        ...vinyl,
        isJoined: isJoining,
        listenerCount: vinyl.listenerCount + (isJoining ? 1 : -1)
    });
  };

  const handleLikeToggle = () => {
      const isLiking = !vinyl.isLiked;
      onUpdate({
          ...vinyl,
          isLiked: isLiking,
          likes: vinyl.likes + (isLiking ? 1 : -1)
      });
  };

  const handleFollowToggle = () => {
      onUpdate({
          ...vinyl,
          isFollowed: !vinyl.isFollowed
      });
  };

  // Mock avatars for the listening room
  const listenerAvatars = [
      vinyl.ownerAvatar,
      `https://i.pravatar.cc/150?u=${vinyl.id}1`,
      `https://i.pravatar.cc/150?u=${vinyl.id}2`,
      `https://i.pravatar.cc/150?u=${vinyl.id}3`
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Audio Element (Only for iTunes/Preview) */}
      {!isExternal && vinyl.previewUrl && (
          <audio 
            ref={audioRef} 
            src={vinyl.previewUrl} 
            loop 
            onEnded={() => setIsPlaying(false)}
          />
      )}

      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in duration-300 max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/50 hover:text-white p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Visual / Player Side */}
        <div className="md:w-1/2 relative bg-zinc-900 flex items-center justify-center p-8 md:p-12 overflow-hidden group">
           
           {isExternal ? (
               // EXTERNAL PLAYER
               <div className="w-full aspect-square z-10">
                   {vinyl.sourceType === 'youtube' && vinyl.externalId && (
                       <YouTubePlayer videoId={vinyl.externalId} />
                   )}
                   {vinyl.sourceType === 'spotify' && vinyl.externalId && (
                       <iframe 
                           style={{borderRadius: '12px'}} 
                           src={`https://open.spotify.com/embed/track/${vinyl.externalId}?utm_source=generator&theme=0`} 
                           width="100%" 
                           height="100%" 
                           allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                           loading="lazy"
                           className="shadow-2xl"
                       ></iframe>
                   )}
               </div>
           ) : (
               // STANDARD VINYL VISUALIZER
               <>
                <div className="absolute inset-0 opacity-30 blur-3xl scale-150" style={{ backgroundImage: `url(${vinyl.coverUrl})`, backgroundSize: 'cover' }}></div>
                <div className="relative w-full aspect-square shadow-2xl rounded-full overflow-hidden border-4 border-black/20">
                    <img 
                        src={vinyl.coverUrl} 
                        alt={vinyl.title} 
                        className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-full"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-black rounded-full border border-white/20"></div>
                    </div>
                </div>
                {/* Play status indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-1 bg-accent rounded-full transition-all duration-300 ${isPlaying ? `h-${Math.floor(Math.random()*8)+2} animate-pulse` : 'h-1'}`}></div>
                    ))}
                </div>
               </>
           )}
        </div>

        {/* Details Side */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-zinc-900 to-black relative">
          
          {/* Top Info */}
          <div className="space-y-4">
             <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex gap-2">
                    {vinyl.genre.map(g => (
                        <span key={g} className="text-[10px] uppercase tracking-wider text-accent border border-accent/30 bg-accent/5 px-2 py-1 rounded-full">
                        {g}
                        </span>
                    ))}
                    {vinyl.sourceType && (
                        <span className="text-[10px] uppercase tracking-wider text-gold border border-gold/30 bg-gold/5 px-2 py-1 rounded-full">
                        Via {vinyl.sourceType}
                        </span>
                    )}
                </div>

                {/* Like / Hype Button */}
                <button 
                    onClick={handleLikeToggle}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${vinyl.isLiked ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'}`}
                >
                    <svg className={`w-3.5 h-3.5 ${vinyl.isLiked ? 'fill-current' : 'fill-none stroke-current'}`} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {vinyl.likes}
                </button>
            </div>
            
            <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight tracking-tight line-clamp-2">{vinyl.title}</h2>
                <div className="flex items-center gap-3">
                    <p className="text-xl text-zinc-400 font-medium">{vinyl.artist}</p>
                    {/* Follow Button */}
                    <button 
                        onClick={handleFollowToggle}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${vinyl.isFollowed ? 'bg-white text-black border-white' : 'border-zinc-600 text-zinc-500 hover:border-zinc-400 hover:text-zinc-300'}`}
                    >
                        {vinyl.isFollowed ? 'Following' : 'Follow'}
                    </button>
                </div>
            </div>

            {/* AI Insight Section */}
            <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm mt-4">
              <div className="flex items-center gap-2 mb-2 text-gold text-[10px] font-bold uppercase tracking-widest">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                AI Vibe Check
              </div>
              
              {isLoadingInsight ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-2 bg-zinc-700/50 rounded w-3/4"></div>
                  </div>
                </div>
              ) : insight ? (
                <div className="space-y-1">
                   <p className="text-zinc-200 text-sm font-serif italic leading-snug">"{insight.vibe}"</p>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs">Waiting for Gemini...</p>
              )}
            </div>
          </div>

          {/* Bottom Social & Play Controls */}
          <div className="mt-8 space-y-4">
              
              {/* Listening Room Bar */}
              <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                 <div className="flex items-center -space-x-2">
                    {listenerAvatars.map((src, i) => (
                        <img key={i} src={src} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800" alt="Listener" />
                    ))}
                    {vinyl.listenerCount > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                            +{vinyl.listenerCount - 4}
                        </div>
                    )}
                 </div>
                 
                 <button 
                    onClick={handleJoinToggle}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${vinyl.isJoined ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
                 >
                    {vinyl.isJoined ? 'Joined Room' : 'Join Room'}
                 </button>
              </div>

              {/* Playback Controls (Local) */}
              {!isExternal && (
                    <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                    >
                        {isPlaying ? (
                        <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg> Pause Preview</>
                        ) : (
                        <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Play Preview</>
                        )}
                    </button>
                    </div>
              )}
              
              {/* External Controls Hint */}
              {isExternal && (
                 <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest">
                     Interactive Player Active
                 </p>
              )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default PlayerModal;