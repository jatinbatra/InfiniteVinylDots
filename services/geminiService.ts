import { AlbumInsight } from "../types";

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const getAlbumInsight = async (artist: string, album: string): Promise<AlbumInsight | null> => {
  if (!GROQ_API_KEY) {
    // Fallback: generate locally when no key is set
    return localFallback(artist, album);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You return JSON only. No markdown, no explanation.'
          },
          {
            role: 'user',
            content: `Give a short "vibe check" (2-3 words describing the mood) and one interesting short trivia fact about the song "${album}" by ${artist}. Return JSON: {"vibe":"...","trivia":"..."}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn('Groq API error:', response.status);
      return localFallback(artist, album);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return { vibe: parsed.vibe, trivia: parsed.trivia } as AlbumInsight;
    }
    return localFallback(artist, album);
  } catch (error) {
    console.error('Error fetching album insight:', error);
    return localFallback(artist, album);
  }
};

// Local fallback when no API key is available
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const VIBES = [
  "Pure Sunshine", "Smoky Elegance", "Raw Power", "Neon Dreams", "Dreamy Nostalgia",
  "Street Poetry", "Velvet Midnight", "Electric Thunder", "Floating Calm", "Fiery Passion",
  "Deep Groove", "Wistful Wandering", "Bold Swagger", "Cosmic Drift", "Soulful Fire",
  "Euphoric Rush", "Gentle Wanderlust", "Dark Warehouse", "Silky Smooth", "Rebel Heartbeat",
];

const TRIVIA = [
  (a: string) => `${a} recorded parts of this while traveling internationally.`,
  (a: string) => `This track by ${a} blends influences from multiple genres.`,
  (a: string) => `${a} spent months perfecting the sound of this recording.`,
  (a: string) => `This is one of ${a}'s most streamed tracks worldwide.`,
  (a: string) => `Fans consider this one of ${a}'s most emotionally resonant works.`,
  (a: string) => `The production features over 40 layered tracks.`,
  (a: string) => `${a} wrote the first draft of this in under an hour.`,
  (a: string) => `This release helped ${a} break into new markets.`,
];

function localFallback(_artist: string, _album: string): AlbumInsight | null {
  return null;
}
