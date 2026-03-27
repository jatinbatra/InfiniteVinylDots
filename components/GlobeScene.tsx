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
const IntroFlyIn: React.FC<{ introActive: boolean }> = ({ introActive }) => {
  const { camera } = useThree();
  const wasIntroActive = useRef(true);
  const progress = useRef(-1); // -1 = not animating

  useEffect(() => {
    // Trigger fly-in when intro goes from active to inactive
    if (wasIntroActive.current && !introActive) {
      camera.position.setLength(GLOBE_RADIUS * 8);
      progress.current = 0;
    }
    wasIntroActive.current = introActive;
  }, [introActive, camera]);

  useFrame(() => {
    if (progress.current < 0 || progress.current >= 1) return;

    progress.current = Math.min(1, progress.current + 0.015);
    const t = 1 - Math.pow(1 - progress.current, 3); // ease-out cubic
    const dist = THREE.MathUtils.lerp(GLOBE_RADIUS * 8, GLOBE_RADIUS * 3.5, t);
    camera.position.setLength(dist);
    camera.lookAt(0, 0, 0);
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

// Floating city labels — uses refs to avoid setState in useFrame
const LABEL_CITIES = REGIONS.filter((_, i) => i < 30);

const CityLabel: React.FC<{ city: typeof REGIONS[0] }> = ({ city }) => {
  const ref = useRef<THREE.Group>(null);
  const pos = useMemo(() => latLngToSphere(city.lat, city.lng, GLOBE_RADIUS * 1.03), [city.lat, city.lng]);

  useFrame(({ camera }) => {
    if (!ref.current) return;
    const dist = camera.position.length();
    const camDir = camera.position.clone().normalize();
    const labelDir = pos.clone().normalize();
    const dot = labelDir.dot(camDir);

    // Only visible when zoomed in and facing camera
    ref.current.visible = dist < GLOBE_RADIUS * 4 && dot > 0.3;
  });

  return (
    <group ref={ref} position={[pos.x, pos.y, pos.z]} visible={false}>
      <Html
        center
        style={{ pointerEvents: 'none' }}
        distanceFactor={4}
      >
        <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.15em] whitespace-nowrap select-none">
          {city.name}
        </div>
      </Html>
    </group>
  );
};

const CityLabels: React.FC = () => (
  <>
    {LABEL_CITIES.map(city => (
      <CityLabel key={city.name} city={city} />
    ))}
  </>
);

// Detect which regions are visible to the camera and report back
const VisibleRegionDetector: React.FC<{ onChange: (names: string[]) => void }> = ({ onChange }) => {
  const lastReportRef = useRef<string>('');
  const throttleRef = useRef(0);

  useFrame(({ camera, clock }) => {
    // Throttle to every 500ms
    const now = clock.getElapsedTime();
    if (now - throttleRef.current < 0.5) return;
    throttleRef.current = now;

    const camDir = camera.position.clone().normalize();
    const camDist = camera.position.length();
    // Wider FOV when zoomed out, tighter when zoomed in
    const dotThreshold = camDist > GLOBE_RADIUS * 3 ? 0.1 : 0.3;

    const visible: string[] = [];
    for (const region of REGIONS) {
      const pos = latLngToSphere(region.lat, region.lng, GLOBE_RADIUS);
      const regionDir = pos.clone().normalize();
      if (regionDir.dot(camDir) > dotThreshold) {
        visible.push(region.name);
      }
    }

    const key = visible.sort().join(',');
    if (key !== lastReportRef.current) {
      lastReportRef.current = key;
      onChange(visible);
    }
  });

  return null;
};

// City heatmap glow — loaded cities glow based on track count
const CityHeatmap: React.FC<{ regions: Record<string, Chunk> }> = ({ regions }) => {
  const glowData = useMemo(() => {
    return REGIONS.map(region => {
      const chunk = regions[region.name];
      const count = chunk?.status === 'loaded' ? chunk.data.length : 0;
      const intensity = Math.min(1, count / 20);
      const pos = latLngToSphere(region.lat, region.lng, GLOBE_RADIUS * 1.005);
      const mood = getCircadianMood(region.lng);
      return { name: region.name, pos, intensity, color: mood.color };
    }).filter(d => d.intensity > 0);
  }, [regions]);

  return (
    <>
      {glowData.map(({ name, pos, intensity, color }) => (
        <sprite key={name} position={[pos.x, pos.y, pos.z]} scale={[0.15 * intensity + 0.05, 0.15 * intensity + 0.05, 1]}>
          <spriteMaterial
            color={color}
            transparent
            opacity={intensity * 0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
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
      [0, 0.85, 1],
      [1, 0.84, 0],
      [1, 0.24, 0.67],
      [0.52, 0.37, 0.76],
    ];

    for (let i = 0; i < count; i++) {
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
  regions?: Record<string, Chunk>;
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
  flyToTarget?: { lat: number; lng: number } | null;
  introActive?: boolean;
  onVisibleRegionsChange?: (regionNames: string[]) => void;
}> = ({ vinyls, regions, onVinylClick, audioUnlocked, flyToTarget, introActive, onVisibleRegionsChange }) => {
  const sunDir = useMemo(() => getSunDirection(), []);

  return (
    <>
      <SunLight />
      <IntroFlyIn introActive={!!introActive} />
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

      {regions && <CityHeatmap regions={regions} />}

      {vinyls.map(vinyl => (
        <VinylMarker3D
          key={vinyl.id}
          vinyl={vinyl}
          onClick={onVinylClick}
          audioUnlocked={audioUnlocked}
        />
      ))}

      <CityLabels />

      {onVisibleRegionsChange && (
        <VisibleRegionDetector onChange={onVisibleRegionsChange} />
      )}

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

const GlobeScene: React.FC<GlobeSceneProps> = ({ vinyls, regions, onVinylClick, audioUnlocked, flyToTarget, introActive, onVisibleRegionsChange }) => {
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
            regions={regions}
            onVinylClick={onVinylClick}
            audioUnlocked={audioUnlocked}
            flyToTarget={flyToTarget}
            introActive={introActive}
            onVisibleRegionsChange={onVisibleRegionsChange}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobeScene;
