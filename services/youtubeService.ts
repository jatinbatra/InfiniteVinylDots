// YouTube video search service using public Invidious API instances
// No API key required

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
];

// Cache to avoid redundant searches
const searchCache = new Map<string, string | null>();

function buildSearchQuery(artist: string, title: string): string {
  return `${artist} ${title} official audio`;
}

function buildCacheKey(artist: string, title: string): string {
  return `${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`;
}

async function searchViaInvidious(
  instanceUrl: string,
  query: string
): Promise<string | null> {
  const url = `${instanceUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Invidious request failed: ${response.status}`);
  }

  const results = await response.json();

  if (Array.isArray(results) && results.length > 0 && results[0].videoId) {
    return results[0].videoId as string;
  }

  return null;
}

/**
 * Search YouTube for a video matching the given artist and title.
 * Tries multiple Invidious instances as fallbacks.
 * Returns the videoId of the first result, or null if not found.
 */
export async function searchYouTubeVideo(
  artist: string,
  title: string
): Promise<string | null> {
  const cacheKey = buildCacheKey(artist, title);

  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey) ?? null;
  }

  const query = buildSearchQuery(artist, title);

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const videoId = await searchViaInvidious(instance, query);
      searchCache.set(cacheKey, videoId);
      return videoId;
    } catch (error) {
      console.warn(`Invidious instance ${instance} failed:`, error);
      // Continue to next instance
    }
  }

  // All instances failed — construct a fallback YouTube search URL and
  // attempt to extract a video ID from the response HTML.
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const html = await response.text();
      // YouTube embeds video IDs in the page as "videoId":"XXXXXXXXXXX"
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match) {
        const videoId = match[1];
        searchCache.set(cacheKey, videoId);
        return videoId;
      }
    }
  } catch (error) {
    console.warn('YouTube fallback search failed:', error);
  }

  // Nothing found — cache the miss to avoid retrying immediately
  searchCache.set(cacheKey, null);
  return null;
}

/**
 * Build a YouTube embed URL for the given video ID.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}
