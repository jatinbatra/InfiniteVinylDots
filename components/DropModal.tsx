import React, { useState } from 'react';
import { parseSpotifyLink, parseYouTubeLink, fetchLinkMetadata } from '../services/musicService';

interface DropModalProps {
  onClose: () => void;
  onSubmit: (data: {
      title: string;
      artist: string;
      coverUrl: string;
      sourceType: 'itunes' | 'youtube' | 'spotify';
      externalId?: string;
      searchTerm?: string;
  }) => void;
}

const DropModal: React.FC<DropModalProps> = ({ onClose, onSubmit }) => {
  const [input, setInput] = useState('');
  const [step, setStep] = useState<'input' | 'loading' | 'details'>('input');
  
  // Form State
  const [sourceType, setSourceType] = useState<'itunes' | 'youtube' | 'spotify'>('itunes');
  const [externalId, setExternalId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://picsum.photos/300/300');
  const [metadataError, setMetadataError] = useState(false);

  const handleNext = async () => {
    const spotifyId = parseSpotifyLink(input);
    const youtubeId = parseYouTubeLink(input);

    if (youtubeId || spotifyId) {
        setStep('loading');
        setMetadataError(false);
        
        // Auto-detect metadata
        const metadata = await fetchLinkMetadata(input);
        
        if (youtubeId) {
            setSourceType('youtube');
            setExternalId(youtubeId);
            setCoverUrl(metadata?.thumbnail_url || `https://img.youtube.com/vi/${youtubeId}/0.jpg`);
            if (metadata?.title) setTitle(metadata.title);
            if (metadata?.artist) setArtist(metadata.artist);
        } else if (spotifyId) {
            setSourceType('spotify');
            setExternalId(spotifyId);
            setCoverUrl(metadata?.thumbnail_url || 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg');
            if (metadata?.title) setTitle(metadata.title);
            if (metadata?.artist) setArtist(metadata.artist);
        }

        if (!metadata) {
            setMetadataError(true);
        }

        setStep('details');
    } else {
        // Assume search term for iTunes
        onSubmit({ 
            title: '', 
            artist: '', 
            coverUrl: '', 
            sourceType: 'itunes', 
            searchTerm: input 
        });
    }
  };

  const handleSubmitDetails = () => {
      onSubmit({
          title: title || 'Unknown Track',
          artist: artist || 'Unknown Artist',
          coverUrl,
          sourceType,
          externalId
      });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-white mb-1">Drop Your Vinyl</h2>
        <p className="text-zinc-400 text-sm mb-6">Paste a YouTube/Spotify link or a search term.</p>

        {step === 'input' && (
            <div className="space-y-4">
                <input 
                    type="text"
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent placeholder-zinc-600"
                    placeholder="e.g. https://youtu.be/... or 'Daft Punk'"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    autoFocus
                />
                <button 
                    onClick={handleNext}
                    disabled={!input.trim()}
                    className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        )}

        {step === 'loading' && (
             <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 text-sm">Fetching track details...</p>
             </div>
        )}

        {step === 'details' && (
            <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                    <img src={coverUrl} className="w-16 h-16 rounded-lg object-cover bg-black" alt="Preview" />
                    <div>
                        <div className="text-xs uppercase text-accent font-bold tracking-wider">{sourceType} Detected</div>
                        <div className="text-xs text-zinc-500">
                             {metadataError ? 'Could not fetch metadata. Please enter details.' : 'Confirm details below.'}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-zinc-400 block mb-1">Track Title</label>
                    <input 
                        type="text"
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Song Name"
                    />
                </div>
                 <div>
                    <label className="text-xs text-zinc-400 block mb-1">Artist</label>
                    <input 
                        type="text"
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="Artist Name"
                    />
                </div>

                 <button 
                    onClick={handleSubmitDetails}
                    disabled={!title.trim() || !artist.trim()}
                    className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:bg-white transition-colors mt-2 disabled:opacity-50 disabled:hover:bg-gold"
                >
                    Drop It
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default DropModal;