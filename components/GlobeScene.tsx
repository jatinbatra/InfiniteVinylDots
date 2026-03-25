import React, { useRef, useMemo, useEffect, Suspense, useState } from 'react';
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
  flyToTarget?: { lat: number; lng: number } | null;
  introActive?: boolean;
}

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

// Camera fly-in on intro exit
const IntroFlyIn: React.FC<{ active: boolean }> = ({ active }) => {
  const { camera } = useThree();
  const started = useRef(false);
  const progress = useRef(0);
  const startPos = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!active && !started.current) {
      started.current = true;
      progress.current = 0;
      startPos.current.copy(camera.position);
      // Start from further away
      camera.position.setLength(GLOBE_RADIUS * 8);
      startPos.current.copy(camera.position);
    }
  }, [active, camera]);

  useFrame(() => {
    if (!started.current || progress.current >= 1) return;

    progress.current = Math.min(1, progress.current + 0.012);
    // Ease out cubic
    const t = 1 - Math.pow(1 - progress.current, 3);
    const targetDist = GLOBE_RADIUS * 3.5;
    const currentDist = THREE.MathUtils.lerp(GLOBE_RADIUS * 8, targetDist, t);
    camera.position.setLength(currentDist);
    camera.lookAt(0, 0, 0);

    if (progress.current >= 1) {
      started.current = false;
    }
  });

  return null;
};

// Smoothly animate camera to a target lat/lng on the globe
const FlyToController: React.FC<{ target: { lat: number; lng: number } | null }> = ({ target }) => {
  const { camera } = useThree();
  const targetPos = useRef<THREE.Vector3 | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (target) {
      const surfacePoint = latLngToSphere(target.lat, target.lng, GLOBE_RADIUS);
      const direction = surfacePoint.clone().normalize();
      targetPos.current = direction.multiplyScalar(GLOBE_RADIUS * 2.8);
      isAnimating.current = true;
    }
  }, [target]);

  useFrame(() => {
    if (!isAnimating.current || !targetPos.current) return;
    const current = camera.position.clone();
    const dest = targetPos.current;
    camera.position.lerp(dest, 0.04);
    camera.lookAt(0, 0, 0);
    if (current.distanceTo(dest) < 0.01) {
      camera.position.copy(dest);
      camera.lookAt(0, 0, 0);
      isAnimating.current = false;
      targetPos.current = null;
    }
  });

  return null;
};

// Floating city labels on the globe — only show top cities for performance
const LABEL_CITIES = REGIONS.filter((_, i) => i < 30); // First 30 major cities

const CityLabels: React.FC = () => {
  const { camera } = useThree();
  const [visibleLabels, setVisibleLabels] = useState<typeof LABEL_CITIES>([]);

  useFrame(() => {
    // Only show labels when zoomed in enough
    const dist = camera.position.length();
    if (dist > GLOBE_RADIUS * 4) {
      if (visibleLabels.length > 0) setVisibleLabels([]);
      return;
    }

    // Show labels facing the camera
    const camDir = camera.position.clone().normalize();
    const visible = LABEL_CITIES.filter(city => {
      const pos = latLngToSphere(city.lat, city.lng, GLOBE_RADIUS);
      const dot = pos.clone().normalize().dot(camDir);
      return dot > 0.3; // Only front-facing
    });

    // Update only when count changes significantly
    if (Math.abs(visible.length - visibleLabels.length) > 2) {
      setVisibleLabels(visible);
    }
  });

  return (
    <>
      {visibleLabels.map(city => {
        const pos = latLngToSphere(city.lat, city.lng, GLOBE_RADIUS * 1.03);
        return (
          <Html
            key={city.name}
            position={[pos.x, pos.y, pos.z]}
            center
            style={{ pointerEvents: 'none' }}
            distanceFactor={4}
          >
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.15em] whitespace-nowrap select-none">
              {city.name}
            </div>
          </Html>
        );
      })}
    </>
  );
};

// Ambient floating particles around the globe
const AmbientParticles: React.FC = () => {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0, 0.85, 1],    // cyan
      [1, 0.84, 0],    // gold
      [1, 0.24, 0.67],  // pink
      [0.52, 0.37, 0.76], // purple
    ];

    for (let i = 0; i < count; i++) {
      // Random positions in a shell around the globe
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = GLOBE_RADIUS * (1.3 + Math.random() * 2);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const GlobeContent: React.FC<{
  vinyls: VinylRecord[];
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
  flyToTarget?: { lat: number; lng: number } | null;
  introActive?: boolean;
}> = ({ vinyls, onVinylClick, audioUnlocked, flyToTarget, introActive }) => {
  const sunDir = useMemo(() => getSunDirection(), []);

  return (
    <>
      <SunLight />
      <IntroFlyIn active={!!introActive} />
      <FlyToController target={flyToTarget ?? null} />

      <Stars
        radius={100}
        depth={60}
        count={4000}
        factor={3}
        saturation={0.15}
        fade
        speed={0.3}
      />

      <AmbientParticles />

      <Earth />
      <Atmosphere sunDirection={sunDir} />

      {vinyls.map(vinyl => (
        <VinylMarker3D
          key={vinyl.id}
          vinyl={vinyl}
          onClick={onVinylClick}
          audioUnlocked={audioUnlocked}
        />
      ))}

      <CityLabels />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.15}
        minDistance={GLOBE_RADIUS * 1.5}
        maxDistance={GLOBE_RADIUS * 5}
        rotateSpeed={0.4}
        zoomSpeed={0.6}
        autoRotate
        autoRotateSpeed={0.06}
      />
    </>
  );
};

const GlobeScene: React.FC<GlobeSceneProps> = ({ vinyls, onVinylClick, audioUnlocked, flyToTarget, introActive }) => {
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
            introActive={introActive}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobeScene;
