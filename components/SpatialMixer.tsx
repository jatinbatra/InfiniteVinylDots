import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VinylRecord } from '../types';
import { audioManager } from '../services/musicService';
import { latLngToSphere } from '../utils/geoUtils';
import { GLOBE_RADIUS } from './Earth';

interface SpatialMixerProps {
  vinyls: VinylRecord[];
  active: boolean;
}

const SpatialMixer: React.FC<SpatialMixerProps> = ({ vinyls, active }) => {
  const { camera } = useThree();
  const lastActiveId = useRef<string | null>(null);
  const throttleRef = useRef(0);

  useFrame((state) => {
    if (!active || vinyls.length === 0) return;

    // Throttle checks to every 400ms for performance
    const now = state.clock.getElapsedTime();
    if (now - throttleRef.current < 0.4) return;
    throttleRef.current = now;

    const camDir = camera.position.clone().normalize();
    
    let closestVinyl: VinylRecord | null = null;
    let maxDot = 0.99; // Only tracks very close to center

    for (const v of vinyls) {
        const pos = latLngToSphere(v.lat ?? 0, v.lng ?? 0, GLOBE_RADIUS).normalize();
        const dot = pos.dot(camDir);
        if (dot > maxDot) {
            maxDot = dot;
            closestVinyl = v;
        }
    }

    if (closestVinyl && closestVinyl.id !== lastActiveId.current) {
        lastActiveId.current = closestVinyl.id;
        if (closestVinyl.previewUrl) {
            audioManager.play(closestVinyl.previewUrl);
        }
    }
  });

  return null;
};

export default SpatialMixer;
