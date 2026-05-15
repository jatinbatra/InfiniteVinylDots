import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import Earth, { GLOBE_RADIUS } from './Earth';
import Atmosphere from './Atmosphere';
import VinylMarker3D from './VinylMarker3D';
import GlobalVinylField from './GlobalVinylField';
import { VinylRecord, Chunk } from '../types';
import { getSunDirection, latLngToSphere } from '../utils/geoUtils';
import { REGIONS } from '../constants';

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
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
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
      targetPos.current = latLngToSphere(target.lat, target.lng, GLOBE_RADIUS * 2.5);
      progress.current = 0;
      isAnimating.current = true;
    }
  }, [target, camera.position]);

  useFrame(() => {
    if (!isAnimating.current || !targetPos.current) return;
    progress.current = Math.min(1, progress.current + 0.02);
    const t = 1 - Math.pow(1 - progress.current, 3);
    camera.position.lerpVectors(startPos.current, targetPos.current, t);
    camera.lookAt(0, 0, 0);
    if (progress.current >= 1) isAnimating.current = false;
  });
  return null;
};

const VisibleRegionDetector: React.FC<{ onChange: (names: string[]) => void }> = ({ onChange }) => {
  const lastUpdate = useRef(0);
  useFrame(({ camera, clock }) => {
    const now = clock.getElapsedTime();
    if (now - lastUpdate.current < 1) return;
    lastUpdate.current = now;
    const camDir = camera.position.clone().normalize();
    const visible = REGIONS.filter(r => latLngToSphere(r.lat, r.lng, GLOBE_RADIUS).normalize().dot(camDir) > 0.4).map(r => r.name);
    onChange(visible);
  });
  return null;
};

const GlobeContent: React.FC<GlobeSceneProps> = ({ vinyls, regions, onVinylClick, audioUnlocked, flyToTarget, onVisibleRegionsChange }) => {
  return (
    <>
      <SunLight />
      <FlyToController target={flyToTarget ?? null} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <Earth />
      <Atmosphere sunDirection={getSunDirection()} />

      {/* The Infinite Field - Thousands of dots */}
      <GlobalVinylField />

      {/* Real tracks - Hero dots */}
      {vinyls.map(vinyl => (
        <VinylMarker3D key={vinyl.id} vinyl={vinyl} onClick={onVinylClick} audioUnlocked={audioUnlocked} />
      ))}
      
      {onVisibleRegionsChange && <VisibleRegionDetector onChange={onVisibleRegionsChange} />}

      <OrbitControls enablePan={false} enableDamping minDistance={GLOBE_RADIUS * 1.1} maxDistance={GLOBE_RADIUS * 8} autoRotate autoRotateSpeed={0.05} />
    </>
  );
};

const GlobeScene: React.FC<GlobeSceneProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-[#020205]">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <GlobeContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobeScene;
