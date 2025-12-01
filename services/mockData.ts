import { VinylRecord } from '../types';
import { GENRES, MOCK_USER_ID } from '../constants';

const ARTISTS = ["Tame Impala", "Daft Punk", "Pink Floyd", "Radiohead", "Kendrick Lamar", "Miles Davis", "Aphex Twin", "Beach House"];
const ALBUMS = ["Currents", "Random Access Memories", "Dark Side of the Moon", "In Rainbows", "DAMN.", "Kind of Blue", "Selected Ambient Works", "Bloom"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const generateUniverse = (count: number = 200): VinylRecord[] => {
  const universe: VinylRecord[] = [];
  const WORLD_SIZE = 4000; // -2000 to 2000

  for (let i = 0; i < count; i++) {
    const isOwner = i === 0; // First one is ours for demo
    
    universe.push({
      id: `vinyl-${i}`,
      albumId: `spotify-${i}`,
      title: randomItem(ALBUMS),
      artist: randomItem(ARTISTS),
      year: randomInt(1960, 2024),
      coverUrl: `https://picsum.photos/seed/${i}/300/300`,
      position: {
        x: randomInt(-WORLD_SIZE, WORLD_SIZE),
        y: randomInt(-WORLD_SIZE, WORLD_SIZE),
      },
      listenerCount: randomInt(0, 150),
      genre: [randomItem(GENRES), randomItem(GENRES)],
      isPlaying: Math.random() > 0.3,
      isOwner: isOwner,
      addedBy: isOwner ? "You" : `User-${randomInt(100, 999)}`,
      likes: randomInt(0, 500),
      isLiked: false,
      isJoined: false,
      isFollowed: false,
      ownerAvatar: `https://i.pravatar.cc/150?u=${i}`
    });
  }

  return universe;
};