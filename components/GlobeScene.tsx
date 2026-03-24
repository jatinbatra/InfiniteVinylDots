import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Earth, { GLOBE_RADIUS } from './Earth';
import Atmosphere from './Atmosphere';
import VinylMarker3D from './VinylMarker3D';
import { VinylRecord } from '../types';
import { getSunDirection, latLngToSphere } from '../utils/geoUtils';

interface GlobeSceneProps {
  vinyls: VinylRecord[];
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
}

// Connection lines between nearby playing vinyls
const ConnectionLines: React.FC<{ vinyls: VinylRecord[] }> = ({ vinyls }) => {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const playing = vinyls.filter(v => v.isPlaying && v.lat != null && v.lng != null).slice(0, 30);

    for (let i = 0; i < playing.length - 1; i++) {
      const a = playing[i];
      const b = playing[i + 1];
      const posA = latLngToSphere(a.lat!, a.lng!, GLOBE_RADIUS * 1.006);
      const posB = latLngToSphere(b.lat!, b.lng!, GLOBE_RADIUS * 1.006);
      positions.push(posA.x, posA.y, posA.z, posB.x, posB.y, posB.z);
    }

    const geo = new THREE.BufferGeometry();
    if (positions.length > 0) {
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    }
    return geo;
  }, [vinyls]);

  useFrame(() => {
    if (linesRef.current && linesRef.current.material) {
      (linesRef.current.material as THREE.LineBasicMaterial).opacity =
        0.04 + Math.sin(Date.now() * 0.001) * 0.02;
    }
  });

  if (geometry.attributes.position === undefined) return null;

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color="#00D9FF" transparent opacity={0.05} />
    </lineSegments>
  );
};

// Sun-driven directional light
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
      <directionalLight ref={lightRef} intensity={0.4} color="#FFF5E1" />
    </>
  );
};

const GlobeContent: React.FC<{
  vinyls: VinylRecord[];
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
}> = ({ vinyls, onVinylClick, audioUnlocked }) => {
  const sunDir = useMemo(() => getSunDirection(), []);

  return (
    <>
      <SunLight />

      <Stars
        radius={100}
        depth={60}
        count={3000}
        factor={3}
        saturation={0.1}
        fade
        speed={0.5}
      />

      <Earth />
      <Atmosphere sunDirection={sunDir} />

      <ConnectionLines vinyls={vinyls} />

      {vinyls.map(vinyl => (
        <VinylMarker3D
          key={vinyl.id}
          vinyl={vinyl}
          onClick={onVinylClick}
          audioUnlocked={audioUnlocked}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={GLOBE_RADIUS * 1.3}
        maxDistance={GLOBE_RADIUS * 8}
        rotateSpeed={0.7}
        zoomSpeed={1.2}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </>
  );
};

const GlobeScene: React.FC<GlobeSceneProps> = ({ vinyls, onVinylClick, audioUnlocked }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000005' }}>
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
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
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
