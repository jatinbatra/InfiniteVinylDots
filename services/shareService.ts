import { VinylRecord } from '../types';

export function buildShareUrl(vinyl: VinylRecord): string {
  const params = new URLSearchParams();
  params.set('t', vinyl.title.slice(0, 200));
  params.set('a', vinyl.artist.slice(0, 100));
  if (vinyl.coverUrl) params.set('c', vinyl.coverUrl);
  if (vinyl.genre.length) params.set('g', vinyl.genre.slice(0, 3).join(','));
  if (vinyl.lat != null) params.set('lat', vinyl.lat.toFixed(4));
  if (vinyl.lng != null) params.set('lng', vinyl.lng.toFixed(4));
  if (vinyl.year) params.set('y', String(vinyl.year));
  if (vinyl.sourceType) params.set('s', vinyl.sourceType);
  if (vinyl.externalId) params.set('e', vinyl.externalId);

  const base =
    typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : '';
  return `${base}?${params.toString()}`;
}

export function decodeShareParams(): VinylRecord | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const title = params.get('t');
  const artist = params.get('a');
  if (!title || !artist) return null;

  return {
    id: `shared-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    albumId: `shared-album-${Date.now()}`,
    title,
    artist,
    coverUrl: params.get('c') || '',
    genre: params.get('g')?.split(',').filter(Boolean) ?? [],
    lat: params.get('lat') != null ? Number(params.get('lat')) : undefined,
    lng: params.get('lng') != null ? Number(params.get('lng')) : undefined,
    year: params.get('y') ? Number(params.get('y')) : new Date().getFullYear(),
    sourceType: (params.get('s') as VinylRecord['sourceType']) ?? 'itunes',
    externalId: params.get('e') ?? undefined,
    listenerCount: Math.floor(Math.random() * 60) + 1,
    isPlaying: false,
    isOwner: false,
    likes: Math.floor(Math.random() * 120),
    isLiked: false,
    isJoined: false,
    isFollowed: false,
  };
}

export function hasShareParams(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return !!(params.get('t') && params.get('a'));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

export async function nativeShare(
  vinyl: VinylRecord,
  url: string,
): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share({
      title: `${vinyl.title} — ${vinyl.artist}`,
      text: `🎵 Found this on VinylVerse: "${vinyl.title}" by ${vinyl.artist}. Explore the world's music from space!`,
      url,
    });
    return true;
  } catch {
    return false;
  }
}
