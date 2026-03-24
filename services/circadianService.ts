import { getLocalHour } from '../utils/geoUtils';

export interface CircadianMood {
  name: string;
  emoji: string;
  genres: string[];
  color: string; // hex color for the vinyl marker glow
}

const MOODS: { startHour: number; mood: CircadianMood }[] = [
  {
    startHour: 6,
    mood: {
      name: 'Morning Energy',
      emoji: '🌅',
      genres: ['pop', 'dance pop', 'upbeat', 'feel good', 'happy hits'],
      color: '#FFD700', // gold
    },
  },
  {
    startHour: 10,
    mood: {
      name: 'Midday Vibes',
      emoji: '☀️',
      genres: ['rock', 'hip hop', 'latin', 'reggaeton', 'summer hits'],
      color: '#FF6B35', // orange
    },
  },
  {
    startHour: 14,
    mood: {
      name: 'Afternoon Groove',
      emoji: '🎸',
      genres: ['funk', 'soul', 'r&b', 'indie', 'alternative'],
      color: '#FF3CAC', // pink
    },
  },
  {
    startHour: 18,
    mood: {
      name: 'Evening Wind-down',
      emoji: '🌆',
      genres: ['jazz', 'acoustic', 'folk', 'singer songwriter', 'bossa nova'],
      color: '#845EC2', // purple
    },
  },
  {
    startHour: 22,
    mood: {
      name: 'Night Owl',
      emoji: '🌙',
      genres: ['electronic', 'deep house', 'techno', 'synthwave', 'trance'],
      color: '#00D9FF', // cyan
    },
  },
  {
    startHour: 2,
    mood: {
      name: 'Late Night',
      emoji: '🌌',
      genres: ['lo-fi', 'ambient', 'classical', 'chillhop', 'sleep'],
      color: '#4B7BE5', // blue
    },
  },
];

/**
 * Get the circadian mood for a given longitude based on its local time.
 */
export function getCircadianMood(lng: number): CircadianMood {
  const localHour = getLocalHour(lng);

  // Sort by start hour to search correctly
  // The moods wrap around midnight, so we need special handling
  if (localHour >= 22 || localHour < 2) {
    return MOODS.find(m => m.startHour === 22)!.mood;
  }
  if (localHour >= 2 && localHour < 6) {
    return MOODS.find(m => m.startHour === 2)!.mood;
  }
  if (localHour >= 6 && localHour < 10) {
    return MOODS.find(m => m.startHour === 6)!.mood;
  }
  if (localHour >= 10 && localHour < 14) {
    return MOODS.find(m => m.startHour === 10)!.mood;
  }
  if (localHour >= 14 && localHour < 18) {
    return MOODS.find(m => m.startHour === 14)!.mood;
  }
  // 18-22
  return MOODS.find(m => m.startHour === 18)!.mood;
}

/**
 * Get a random genre search term for a given longitude's current mood.
 */
export function getCircadianSearchTerm(lng: number): string {
  const mood = getCircadianMood(lng);
  return mood.genres[Math.floor(Math.random() * mood.genres.length)];
}

/**
 * Format the local time at a longitude as a string.
 */
export function formatLocalTime(lng: number): string {
  const hour = getLocalHour(lng);
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}
