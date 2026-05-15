import { useState, useEffect, useRef, useCallback } from 'react';
import { REGIONS } from '../constants';
import { getCircadianMood, formatLocalTime } from '../services/circadianService';
import { getDJIntro } from '../services/geminiService';
import { fetchRegionalTracks, audioManager } from '../services/musicService';
import { VinylRecord } from '../types';

export interface AutoPilotState {
  active: boolean;
  cityName: string | null;
  djIntro: string | null;
  track: VinylRecord | null;
  moodColor: string | null;
}

const speakIntro = (text: string) => {
  return new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick a high-quality voice if available
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => 
        (v.name.includes('Google') || v.name.includes('Premium')) && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.pitch = 1.0;
    utterance.rate = 0.95; // Slightly slower for that "radio" vibe
    utterance.volume = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    // Duck the music volume
    audioManager.setVolume(0.2);
    
    synth.speak(utterance);
  });
};

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

    // Play preview if available
    if (track?.previewUrl) {
        audioManager.play(track.previewUrl);
    }

    // Speak the intro
    if (intro) {
        await speakIntro(intro);
        // Fade music back up after intro ends
        audioManager.setVolume(1.0);
    }
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
