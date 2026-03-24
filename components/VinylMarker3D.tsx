import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { VinylRecord } from '../types';
import { latLngToSphere } from '../utils/geoUtils';
import { audioManager } from '../services/musicService';
import { GLOBE_RADIUS } from './Earth';

interface VinylMarker3DProps {
  vinyl: VinylRecord;
  onClick: (vinyl: VinylRecord) => void;
  audioUnlocked: boolean;
}

const VinylMarker3D: React.FC<VinylMarker3DProps> = ({ vinyl, onClick, audioUnlocked }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Position on globe surface
  const position = useMemo(() => {
    const lat = vinyl.lat ?? 0;
    const lng = vinyl.lng ?? 0;
    return latLngToSphere(lat, lng, GLOBE_RADIUS * 1.005);
  }, [vinyl.lat, vinyl.lng]);

  // Normal pointing outward (for billboard orientation)
  const normal = useMemo(() => position.clone().normalize(), [position]);

  // Marker color based on circadian mood or default
  const color = useMemo(() => {
    return new THREE.Color(vinyl.circadianColor || '#00D9FF');
  }, [vinyl.circadianColor]);

  // Pulse animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      if (hovered) {
        meshRef.current.scale.lerp(new THREE.Vector3(2.5, 2.5, 2.5), 0.15);
      } else {
        const pulse = 1 + Math.sin(Date.now() * 0.003 + position.x * 10) * 0.1;
        meshRef.current.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.1);
      }
    }
  });

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';

    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (vinyl.previewUrl && audioUnlocked) {
        audioManager.play(vinyl.previewUrl);
      }
    }, 300);
  }, [vinyl.previewUrl, audioUnlocked]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    audioManager.stop();
  }, []);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    audioManager.stop();
    onClick(vinyl);
  }, [vinyl, onClick]);

  const markerSize = vinyl.isOwner ? 0.025 : 0.015;

  return (
    <group position={position}>
      {/* The glowing dot */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[markerSize, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 1 : 0.8}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[markerSize * 2.5, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.2 : 0.06}
        />
      </mesh>

      {/* Owner marker - gold ring */}
      {vinyl.isOwner && (
        <mesh>
          <ringGeometry args={[markerSize * 2, markerSize * 2.5, 16]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, 0.06, 0]}
          center
          style={{
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)',
          }}
          distanceFactor={3}
        >
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl flex flex-col items-center gap-0.5 min-w-[180px] whitespace-nowrap">
            <span className="text-white font-bold text-sm leading-tight text-center">
              {vinyl.title}
            </span>
            <span className="text-xs font-medium" style={{ color: vinyl.circadianColor || '#00D9FF' }}>
              {vinyl.artist}
            </span>
            <div className="flex items-center gap-2 mt-1">
              {vinyl.genre?.[0] && (
                <span className="text-zinc-500 text-[10px]">
                  {vinyl.genre[0]}
                </span>
              )}
              {vinyl.circadianMood && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10"
                  style={{ color: vinyl.circadianColor }}>
                  {vinyl.circadianMood}
                </span>
              )}
            </div>
            {vinyl.previewUrl && audioUnlocked && (
              <div className="text-[9px] text-zinc-500 flex items-center gap-1 mt-1">
                <div className="flex gap-[2px] items-end h-3">
                  <div className="w-[2px] h-1 rounded-full animate-pulse" style={{ backgroundColor: vinyl.circadianColor || '#00D9FF' }} />
                  <div className="w-[2px] h-2 rounded-full animate-pulse" style={{ backgroundColor: vinyl.circadianColor || '#00D9FF', animationDelay: '0.1s' }} />
                  <div className="w-[2px] h-1.5 rounded-full animate-pulse" style={{ backgroundColor: vinyl.circadianColor || '#00D9FF', animationDelay: '0.2s' }} />
                </div>
                Previewing
              </div>
            )}
          </div>
          {vinyl.listenerCount > 0 && (
            <div className="flex justify-center -mt-1">
              <span className="text-black text-[9px] font-bold bg-yellow-400 px-2 py-0.5 rounded-full shadow-lg">
                {vinyl.listenerCount > 999 ? `${(vinyl.listenerCount / 1000).toFixed(1)}k` : vinyl.listenerCount} listening
              </span>
            </div>
          )}
        </Html>
      )}
    </group>
  );
};

export default React.memo(VinylMarker3D);
