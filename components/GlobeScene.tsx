import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
  flyToTarget?: { lat: number; lng: number } | null;
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

// Smoothly animate camera to a target lat/lng on the globe
const FlyToController: React.FC<{ target: { lat: number; lng: number } | null }> = ({ target }) => {
  const { camera } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (target) {
      // Compute target camera position: on the globe surface normal, at a viewing distance
      const surfacePoint = latLngToSphere(target.lat, target.lng, GLOBE_RADIUS);
      const direction = surfacePoint.clone().normalize();
      const cameraDistance = GLOBE_RADIUS * 2.8;
      targetPos.current = direction.multiplyScalar(cameraDistance);
      isAnimating.current = true;
    }
  }, [target]);

  useFrame(() => {
    if (!isAnimating.current || !targetPos.current) return;

    const current = camera.position.clone();
    const dest = targetPos.current;

    // Lerp camera position toward target
    camera.position.lerp(dest, 0.04);
    camera.lookAt(0, 0, 0);

    // Stop animating when close enough
    if (current.distanceTo(dest) < 0.01) {
      camera.position.copy(dest);
      camera.lookAt(0, 0, 0);
      isAnimating.current = false;
      targetPos.current = null;
    }
  });

  return null;
};

const GlobeContent: React.FC<{
  vinyls: VinylRecord[];
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
  flyToTarget?: { lat: number; lng: number } | null;
}> = ({ vinyls, onVinylClick, audioUnlocked, flyToTarget }) => {
  const sunDir = useMemo(() => getSunDirection(), []);

  return (
    <>
      <SunLight />
      <FlyToController target={flyToTarget ?? null} />

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
        dampingFactor={0.2}
        minDistance={GLOBE_RADIUS * 1.5}
        maxDistance={GLOBE_RADIUS * 5}
        rotateSpeed={0.35}
        zoomSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.08}
      />
    </>
  );
};

const GlobeScene: React.FC<GlobeSceneProps> = ({ vinyls, onVinylClick, audioUnlocked, flyToTarget }) => {
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
            flyToTarget={flyToTarget}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobeScene;
