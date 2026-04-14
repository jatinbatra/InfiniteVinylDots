import { useState, useEffect, useRef, useCallback } from 'react';
import { REGIONS } from '../constants';
import { getCircadianMood, formatLocalTime } from '../services/circadianService';
import { getDJIntro } from '../services/geminiService';
import { fetchRegionalTracks } from '../services/musicService';
import { VinylRecord } from '../types';

export interface AutoPilotState {
  active: boolean;
  cityName: string | null;
  djIntro: string | null;
  track: VinylRecord | null;
  moodColor: string | null;
}

export function useAutoPilot(onFlyTo: (lat: number, lng: number) => void) {
  const [state, setState] = useState<AutoPilotState>({
    active: false,
    cityName: null,
    djIntro: null,
    track: null,
    moodColor: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visitedRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(false);

  const pickNextCity = useCallback(async () => {
    if (!activeRef.current) return;

    // Pick a random region we haven't visited recently
    let candidates = REGIONS.filter(r => !visitedRef.current.has(r.name));
    if (candidates.length === 0) {
      visitedRef.current.clear();
      candidates = REGIONS;
    }
    const region = candidates[Math.floor(Math.random() * candidates.length)];
    visitedRef.current.add(region.name);

    // Get local time and mood
    const mood = getCircadianMood(region.lng);
    const localTime = formatLocalTime(region.lng);

    // Fly camera to the city
    onFlyTo(region.lat, region.lng);

    // Set city name and color immediately
    setState(prev => ({
      ...prev,
      cityName: region.name,
      moodColor: mood.color,
      djIntro: null,
      track: null,
    }));

    // Fetch DJ intro and track in parallel
    const [intro, tracks] = await Promise.all([
      getDJIntro(region.name, localTime, mood.name),
      fetchRegionalTracks(region.code, region.lat, region.lng, region.name),
    ]);

    if (!activeRef.current) return;

    const track = tracks.length > 0
      ? tracks[Math.floor(Math.random() * tracks.length)]
      : null;

    setState(prev => ({
      ...prev,
      djIntro: intro,
      track,
    }));
  }, [onFlyTo]);

  const start = useCallback(() => {
    activeRef.current = true;
    visitedRef.current.clear();
    setState(prev => ({ ...prev, active: true }));

    // Kick off immediately
    pickNextCity();

    // Then every 25 seconds
    intervalRef.current = setInterval(() => {
      pickNextCity();
    }, 25000);
  }, [pickNextCity]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({
      active: false,
      cityName: null,
      djIntro: null,
      track: null,
      moodColor: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { ...state, start, stop };
}
