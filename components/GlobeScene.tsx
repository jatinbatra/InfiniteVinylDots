import React, { useRef, useMemo, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import Earth, { GLOBE_RADIUS } from './Earth';
import Atmosphere from './Atmosphere';
import VinylMarker3D from './VinylMarker3D';
import { VinylRecord, Chunk } from '../types';
import { getSunDirection, latLngToSphere } from '../utils/geoUtils';
import { REGIONS } from '../constants';
import { getCircadianMood } from '../services/circadianService';

interface GlobeSceneProps {
  vinyls: VinylRecord[];
  regions?: Record<string, Chunk>;
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
  flyToTarget?: { lat: number; lng: number } | null;
  introActive?: boolean;
  onVisibleRegionsChange?: (regionNames: string[]) => void;
}

const SunLight: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
    </>
  );
};

const FlyToController: React.FC<{ target: { lat: number; lng: number } | null }> = ({ target }) => {
  const { camera } = useThree();
  const isAnimating = useRef(false);
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const startPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const progress = useRef(0);

  useEffect(() => {
    if (target) {
      startPos.current.copy(camera.position);
      const pos = latLngToSphere(target.lat, target.lng, GLOBE_RADIUS * 2.8);
      targetPos.current = pos;
      progress.current = 0;
      isAnimating.current = true;
    }
  }, [target, camera.position]);

  useFrame(() => {
    if (!isAnimating.current || !targetPos.current) return;
    
    progress.current = Math.min(1, progress.current + 0.015);
    
    // Smooth progress using ease-in-out cubic
    const t = progress.current < 0.5 
        ? 4 * progress.current * progress.current * progress.current 
        : 1 - Math.pow(-2 * progress.current + 2, 3) / 2;

    // Linear path
    const current = new THREE.Vector3().lerpVectors(startPos.current, targetPos.current, t);
    
    // Add "Swoop": zoom out mid-flight
    const swoopIntensity = 2.5;
    const swoop = Math.sin(t * Math.PI) * swoopIntensity;
    current.setLength(current.length() + swoop);

    camera.position.copy(current);
    camera.lookAt(0, 0, 0);

    if (progress.current >= 1) {
        isAnimating.current = false;
        targetPos.current = null;
    }
  });
  return null;
};


const CityLabel: React.FC<{ city: typeof REGIONS[0] }> = ({ city }) => {
  const pos = useMemo(() => latLngToSphere(city.lat, city.lng, GLOBE_RADIUS * 1.02), [city.lat, city.lng]);
  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <Html center distanceFactor={10}>
        <div className="text-[8px] text-white/20 uppercase tracking-widest pointer-events-none select-none">
          {city.name}
        </div>
      </Html>
    </group>
  );
};

const VisibleRegionDetector: React.FC<{ onChange: (names: string[]) => void }> = ({ onChange }) => {
  const lastUpdate = useRef(0);
  useFrame(({ camera, clock }) => {
    const now = clock.getElapsedTime();
    if (now - lastUpdate.current < 0.8) return;
    lastUpdate.current = now;

    const camDir = camera.position.clone().normalize();
    const visible = REGIONS.filter(r => {
        const pos = latLngToSphere(r.lat, r.lng, GLOBE_RADIUS).normalize();
        return pos.dot(camDir) > 0.4;
    }).map(r => r.name);
    onChange(visible);
  });
  return null;
};

const GlobeContent: React.FC<GlobeSceneProps> = ({ vinyls, regions, onVinylClick, audioUnlocked, flyToTarget, onVisibleRegionsChange }) => {
  return (
    <>
      <SunLight />
      <FlyToController target={flyToTarget ?? null} />
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      
      <Earth />
      <Atmosphere sunDirection={getSunDirection()} />

      {vinyls.map(vinyl => (
        <VinylMarker3D key={vinyl.id} vinyl={vinyl} onClick={onVinylClick} audioUnlocked={audioUnlocked} />
      ))}

      {REGIONS.filter((_, i) => i % 5 === 0).map(city => <CityLabel key={city.name} city={city} />)}
      
      {onVisibleRegionsChange && <VisibleRegionDetector onChange={onVisibleRegionsChange} />}

      <OrbitControls 
        enablePan={false} 
        enableDamping 
        minDistance={GLOBE_RADIUS * 1.2} 
        maxDistance={GLOBE_RADIUS * 6} 
        autoRotate 
        autoRotateSpeed={0.1} 
      />
    </>
  );
};

const GlobeScene: React.FC<GlobeSceneProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-black">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <Suspense fallback={null}>
          <GlobeContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobeScene;
