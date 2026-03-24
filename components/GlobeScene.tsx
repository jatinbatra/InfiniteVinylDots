import React, { useRef, useMemo, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import Earth, { GLOBE_RADIUS } from './Earth';
import Atmosphere from './Atmosphere';
import VinylMarker3D from './VinylMarker3D';
import { VinylRecord } from '../types';
import { getSunDirection, latLngToSphere } from '../utils/geoUtils';
import { REGIONS } from '../constants';

interface GlobeSceneProps {
  vinyls: VinylRecord[];
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
  onHoverRegion?: (regionName: string | null, lng: number | null) => void;
}

// Region labels floating above the globe
const RegionLabels: React.FC = () => {
  return (
    <>
      {REGIONS.map(region => {
        const pos = latLngToSphere(region.lat, region.lng, GLOBE_RADIUS * 1.04);
        return (
          <Html
            key={region.code}
            position={[pos.x, pos.y, pos.z]}
            center
            style={{ pointerEvents: 'none' }}
            distanceFactor={5}
            occlude={false}
          >
            <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-400/40 whitespace-nowrap select-none">
              {region.name}
            </div>
          </Html>
        );
      })}
    </>
  );
};

// Animated connection lines between nearby vinyls
const ConnectionLines: React.FC<{ vinyls: VinylRecord[] }> = ({ vinyls }) => {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    // Connect some nearby vinyls with subtle lines
    const positions: number[] = [];
    const playing = vinyls.filter(v => v.isPlaying).slice(0, 30);

    for (let i = 0; i < playing.length - 1; i++) {
      const a = playing[i];
      const b = playing[i + 1];
      if (!a.lat || !b.lat || !a.lng || !b.lng) continue;

      const posA = latLngToSphere(a.lat, a.lng, GLOBE_RADIUS * 1.006);
      const posB = latLngToSphere(b.lat, b.lng, GLOBE_RADIUS * 1.006);

      positions.push(posA.x, posA.y, posA.z);
      positions.push(posB.x, posB.y, posB.z);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [vinyls]);

  useFrame(() => {
    if (linesRef.current) {
      (linesRef.current.material as THREE.LineBasicMaterial).opacity =
        0.05 + Math.sin(Date.now() * 0.001) * 0.03;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color="#00D9FF" transparent opacity={0.06} />
    </lineSegments>
  );
};

// Sun light indicator
const SunLight: React.FC = () => {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      const dir = getSunDirection();
      lightRef.current.position.set(dir.x * 10, dir.y * 10, dir.z * 10);
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight ref={lightRef} intensity={0.5} color="#FFF5E1" />
    </>
  );
};

// Slow auto-rotation when not interacting
const AutoRotate: React.FC<{ controlsRef: React.RefObject<any> }> = ({ controlsRef }) => {
  const isInteracting = useRef(false);
  const idleTimer = useRef(0);

  useFrame((state, delta) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      if (controls._isUserInteracting) {
        isInteracting.current = true;
        idleTimer.current = 0;
      } else {
        idleTimer.current += delta;
        if (idleTimer.current > 3) {
          // Slowly rotate globe when idle
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.3;
        } else {
          controls.autoRotate = false;
        }
      }
    }
  });

  return null;
};

const GlobeContent: React.FC<{
  vinyls: VinylRecord[];
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
}> = ({ vinyls, onVinylClick, audioUnlocked }) => {
  const controlsRef = useRef<any>(null);
  const sunDir = useMemo(() => getSunDirection(), []);

  return (
    <>
      <SunLight />

      {/* Starfield background */}
      <Stars
        radius={100}
        depth={60}
        count={3000}
        factor={3}
        saturation={0.1}
        fade
        speed={0.5}
      />

      {/* The globe */}
      <Earth />
      <Atmosphere sunDirection={sunDir} />

      {/* Connection lines between playing vinyls */}
      <ConnectionLines vinyls={vinyls} />

      {/* Region labels */}
      <RegionLabels />

      {/* Vinyl markers */}
      {vinyls.map(vinyl => (
        <VinylMarker3D
          key={vinyl.id}
          vinyl={vinyl}
          onClick={onVinylClick}
          audioUnlocked={audioUnlocked}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
        minDistance={GLOBE_RADIUS * 1.5}
        maxDistance={GLOBE_RADIUS * 6}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </>
  );
};

const GlobeScene: React.FC<GlobeSceneProps> = ({ vinyls, onVinylClick, audioUnlocked }) => {
  return (
    <div className="w-screen h-screen" style={{ background: '#000005' }}>
      <Canvas
        camera={{
          position: [0, 0, GLOBE_RADIUS * 3.5],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        style={{ touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <GlobeContent
            vinyls={vinyls}
            onVinylClick={onVinylClick}
            audioUnlocked={audioUnlocked}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobeScene;
