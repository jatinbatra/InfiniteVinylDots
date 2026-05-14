import React, { useRef, useMemo, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Earth, { GLOBE_RADIUS } from './Earth';
import Atmosphere from './Atmosphere';
import VinylMarker3D from './VinylMarker3D';
import WeatherSystem from './WeatherSystem';
import { VinylRecord, Chunk } from '../types';
import { getSunDirection, latLngToSphere } from '../utils/geoUtils';
import { REGIONS } from '../constants';
import { getCircadianMood } from '../services/circadianService';
import { audioManager } from '../services/musicService';

interface GlobeSceneProps {
  vinyls: VinylRecord[];
  regions?: Record<string, Chunk>;
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
  flyToTarget?: { lat: number; lng: number } | null;
  introActive?: boolean;
  onVisibleRegionsChange?: (regionNames: string[]) => void;
  quality?: 'low' | 'high';
}

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
      <directionalLight ref={lightRef} intensity={0.6} color="#FFF5E1" />
    </>
  );
};

const IntroFlyIn: React.FC<{ introActive: boolean }> = ({ introActive }) => {
  const { camera } = useThree();
  const wasIntroActive = useRef(true);
  const progress = useRef(-1);
  useEffect(() => {
    if (wasIntroActive.current && !introActive) {
      camera.position.setLength(GLOBE_RADIUS * 8);
      progress.current = 0;
    }
    wasIntroActive.current = introActive;
  }, [introActive, camera]);
  useFrame(() => {
    if (progress.current < 0 || progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + 0.015);
    const t = 1 - Math.pow(1 - progress.current, 3);
    const dist = THREE.MathUtils.lerp(GLOBE_RADIUS * 8, GLOBE_RADIUS * 3.5, t);
    camera.position.setLength(dist);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

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
    camera.position.lerp(targetPos.current, 0.04);
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(targetPos.current) < 0.01) {
      isAnimating.current = false;
      targetPos.current = null;
    }
  });
  return null;
};

const CityLabel: React.FC<{ city: typeof REGIONS[0] }> = ({ city }) => {
  const ref = useRef<THREE.Group>(null);
  const pos = useMemo(() => latLngToSphere(city.lat, city.lng, GLOBE_RADIUS * 1.03), [city.lat, city.lng]);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    const dist = camera.position.length();
    const dot = pos.clone().normalize().dot(camera.position.clone().normalize());
    ref.current.visible = dist < GLOBE_RADIUS * 4 && dot > 0.3;
  });
  return (
    <group ref={ref} position={[pos.x, pos.y, pos.z]} visible={false}>
      <Html center style={{ pointerEvents: 'none' }} distanceFactor={4}>
        <div className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.15em] whitespace-nowrap select-none">{city.name}</div>
      </Html>
    </group>
  );
};

const CityHeatmap: React.FC<{ regions: Record<string, Chunk>, uMid: number }> = ({ regions, uMid }) => {
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
          <spriteMaterial color={color} transparent opacity={intensity * (0.8 + uMid * 1.2)} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
};

const AmbientParticles: React.FC<{ uBass: number, quality: 'low' | 'high' }> = ({ uBass, quality }) => {
  const ref = useRef<THREE.Points>(null);
  const count = quality === 'high' ? 400 : 100;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [[0, 0.85, 1], [1, 0.84, 0], [1, 0.24, 0.67], [0.52, 0.37, 0.76]];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = GLOBE_RADIUS * (1.3 + Math.random() * 2);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    return { positions: pos, colors: col };
  }, [count]);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * (0.01 + uBass * 0.1); });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} vertexColors transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
};

const VisibleRegionDetector: React.FC<{ onChange: (names: string[]) => void }> = ({ onChange }) => {
  useFrame(({ camera, clock }) => {
    const now = clock.getElapsedTime();
    if (now % 0.5 < 0.02) {
      const camDir = camera.position.clone().normalize();
      const visible = REGIONS.filter(r => {
        const pos = latLngToSphere(r.lat, r.lng, GLOBE_RADIUS);
        return pos.normalize().dot(camDir) > (camera.position.length() > GLOBE_RADIUS * 3 ? 0.1 : 0.3);
      }).map(r => r.name);
      onChange(visible);
    }
  });
  return null;
};

const GlobeContent: React.FC<{
  vinyls: VinylRecord[];
  regions?: Record<string, Chunk>;
  onVinylClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
  flyToTarget?: { lat: number; lng: number } | null;
  introActive?: boolean;
  onVisibleRegionsChange?: (regionNames: string[]) => void;
  quality: 'low' | 'high';
}> = ({ vinyls, regions, onVinylClick, audioUnlocked, flyToTarget, introActive, onVisibleRegionsChange, quality }) => {
  const sunDir = useMemo(() => getSunDirection(), []);
  const [audioLevels, setAudioLevels] = useState({ bass: 0, mid: 0 });
  
  useFrame(() => {
    const levels = audioManager.getAudioLevels();
    setAudioLevels(prev => ({
        bass: prev.bass + (levels.bass - prev.bass) * 0.2,
        mid: prev.mid + (levels.mid - prev.mid) * 0.2
    }));
  });

  return (
    <>
      <SunLight />
      <IntroFlyIn introActive={!!introActive} />
      <FlyToController target={flyToTarget ?? null} />
      <Stars radius={100} depth={60} count={quality === 'high' ? 5000 : 1000} factor={4} saturation={0.15} fade speed={0.3} />
      <AmbientParticles uBass={audioLevels.bass} quality={quality} />
      <Earth uBass={audioLevels.bass} uMid={audioLevels.mid} />
      <Atmosphere sunDirection={sunDir} uBass={audioLevels.bass} />
      {quality === 'high' && <WeatherSystem />}
      {regions && <CityHeatmap regions={regions} uMid={audioLevels.mid} />}
      {vinyls.map(vinyl => (
        <VinylMarker3D key={vinyl.id} vinyl={vinyl} onClick={onVinylClick} audioUnlocked={audioUnlocked} uBass={audioLevels.bass} />
      ))}
      {REGIONS.filter((_, i) => i < 30).map(city => <CityLabel key={city.name} city={city} />)}
      {onVisibleRegionsChange && <VisibleRegionDetector onChange={onVisibleRegionsChange} />}
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.15} minDistance={GLOBE_RADIUS * 1.5} maxDistance={GLOBE_RADIUS * 5} rotateSpeed={0.4} zoomSpeed={0.6} autoRotate autoRotateSpeed={0.06} />
      {quality === 'high' && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.5} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
};

const GlobeScene: React.FC<GlobeSceneProps> = ({ vinyls, regions, onVinylClick, audioUnlocked, flyToTarget, introActive, onVisibleRegionsChange, quality = 'high' }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000005' }}>
      <Canvas
        camera={{ position: [0, 0, GLOBE_RADIUS * 3.5], fov: 45, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ReinhardToneMapping }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <GlobeContent
            vinyls={vinyls} regions={regions} onVinylClick={onVinylClick} audioUnlocked={audioUnlocked}
            flyToTarget={flyToTarget} introActive={introActive} onVisibleRegionsChange={onVisibleRegionsChange}
            quality={quality}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
export default GlobeScene;
