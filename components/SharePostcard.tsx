import React, { useState } from 'react';
import { VinylRecord } from '../types';
import {
  buildShareUrl,
  copyToClipboard,
  canNativeShare,
  nativeShare,
} from '../services/shareService';

interface SharePostcardProps {
  vinyl: VinylRecord;
  onClose: () => void;
}

const GENRE_COLORS = ['#00D9FF', '#FFD700', '#FF6B9D'] as const;

const SharePostcard: React.FC<SharePostcardProps> = ({ vinyl, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareUrl = buildShareUrl(vinyl);
  const supportsNativeShare = canNativeShare();

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    setSharing(true);
    await nativeShare(vinyl, shareUrl);
    setSharing(false);
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `🎵 "${vinyl.title}" by ${vinyl.artist} — found on VinylVerse. Explore the world's music from space ↓`,
  )}&url=${encodeURIComponent(shareUrl)}`;

  const displayUrl = shareUrl.replace(/^https?:\/\//, '').slice(0, 52) + '…';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm" style={{ animation: 'postcardIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* ── POSTCARD ─────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl mb-4 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0d0d0d 0%, #151515 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Album-art background blur */}
          <div
            className="absolute inset-0 scale-125"
            style={{
              backgroundImage: `url(${vinyl.coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(36px) saturate(0.5)',
              opacity: 0.22,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

          {/* Body */}
          <div className="relative p-5 flex gap-4 items-start">
            {/* Spinning Vinyl */}
            <div className="flex-shrink-0 relative w-[88px] h-[88px]">
              <div
                className="w-full h-full rounded-full overflow-hidden border-[3px] border-black/60 shadow-2xl"
                style={{ animation: 'vinylSpinCard 8s linear infinite' }}
              >
                <img
                  src={vinyl.coverUrl}
                  alt={vinyl.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
              {/* Grooves */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    'repeating-radial-gradient(circle at center, transparent 0px, transparent 7px, rgba(0,0,0,0.18) 7px, rgba(0,0,0,0.18) 8px)',
                }}
              />
              {/* Center hole */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-5 h-5 bg-black rounded-full border border-white/15 shadow-inner" />
              </div>
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-[9px] text-accent/70 uppercase tracking-[0.2em] font-black mb-1.5">
                🌍 VinylVerse Drop
              </div>
              <h3 className="text-white font-black text-[15px] leading-snug mb-1 line-clamp-2">
                {vinyl.title}
              </h3>
              <p className="text-zinc-400 text-[13px] font-medium mb-2.5 truncate">
                {vinyl.artist}
              </p>
              <div className="flex flex-wrap gap-1">
                {vinyl.genre.slice(0, 3).map((g, i) => {
                  const color = GENRE_COLORS[i % GENRE_COLORS.length];
                  return (
                    <span
                      key={g}
                      className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
                      style={{
                        color,
                        border: `1px solid ${color}30`,
                        background: `${color}10`,
                      }}
                    >
                      {g}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card footer */}
          <div
            className="relative px-5 py-2.5 flex items-center justify-between border-t border-white/[0.05]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: vinyl.circadianColor ?? '#00D9FF',
                  boxShadow: `0 0 7px ${vinyl.circadianColor ?? '#00D9FF'}99`,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">
                infinitevinyldots.com
              </span>
            </div>
            {vinyl.year ? (
              <span className="text-[9px] text-zinc-700 font-mono">{vinyl.year}</span>
            ) : null}
          </div>
        </div>

        {/* ── URL BAR ──────────────────────────────────────── */}
        <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl p-3 mb-3 flex items-center gap-2 backdrop-blur-sm">
          <svg
            className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m6.414-9.414a4 4 0 010 5.656l-4 4a4 4 0 01-5.656-5.656l1.1-1.1"
            />
          </svg>
          <span className="flex-1 text-[11px] text-zinc-500 truncate font-mono">
            {displayUrl}
          </span>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              copied
                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
            }`}
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>

        {/* ── ACTION BUTTONS ───────────────────────────────── */}
        <div className="flex flex-col gap-2">
          {/* Native share — full-width primary CTA (mobile) */}
          {supportsNativeShare && (
            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="w-full py-3.5 rounded-xl text-sm font-bold bg-accent text-black hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/25 disabled:opacity-60"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {sharing ? 'Sharing…' : 'Share This Drop'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Copy link */}
            <button
              onClick={handleCopy}
              className={`py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                copied
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-zinc-800/70 text-zinc-200 border border-zinc-700/50 hover:border-zinc-500'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            {/* Post to X */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 rounded-xl text-sm font-bold bg-zinc-800/70 text-zinc-200 border border-zinc-700/50 hover:border-zinc-500 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post on X
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
        >
          Close
        </button>
      </div>

      <style>{`
        @keyframes postcardIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes vinylSpinCard {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SharePostcard;
