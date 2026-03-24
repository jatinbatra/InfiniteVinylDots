import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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

// Create a vinyl disc texture (black disc with grooves + colored center)
function createVinylTexture(color: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  // Black vinyl disc
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx, cy, cx, 0, Math.PI * 2);
  ctx.fill();

  // Grooves (concentric rings)
  for (let r = 14; r < cx - 2; r += 3) {
    ctx.strokeStyle = r % 6 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Colored center label
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Center hole
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // Shine highlight
  const shine = ctx.createRadialGradient(cx - 15, cy - 15, 0, cx, cy, cx);
  shine.addColorStop(0, 'rgba(255,255,255,0.15)');
  shine.addColorStop(0.4, 'rgba(255,255,255,0)');
  shine.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(cx, cy, cx, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const VinylMarker3D: React.FC<VinylMarker3DProps> = ({ vinyl, onClick, audioUnlocked }) => {
  const groupRef = useRef<THREE.Group>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinAngle = useRef(0);

  const position = useMemo(() => {
    const lat = vinyl.lat ?? 0;
    const lng = vinyl.lng ?? 0;
    return latLngToSphere(lat, lng, GLOBE_RADIUS * 1.005);
  }, [vinyl.lat, vinyl.lng]);

  const normal = useMemo(() => position.clone().normalize(), [position]);

  const vinylColor = vinyl.circadianColor || '#00D9FF';

  const texture = useMemo(() => createVinylTexture(vinylColor), [vinylColor]);

  // Quaternion to orient disc to face outward from globe
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    q.setFromUnitVectors(up, normal);
    return q;
  }, [normal]);

  const markerSize = vinyl.isOwner ? 0.06 : 0.04;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Scale animation
    const targetScale = hovered ? 2.8 : 1;
    const s = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(s, targetScale, 0.12);
    groupRef.current.scale.setScalar(newScale);

    // Spin the disc when hovered or playing
    if (discRef.current) {
      if (hovered || vinyl.isPlaying) {
        spinAngle.current += delta * (hovered ? 4 : 1.5);
      }
      discRef.current.rotation.z = spinAngle.current;
    }

    // Pulse glow
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.08 + Math.sin(Date.now() * 0.004 + position.x * 10) * 0.04;
      mat.opacity = hovered ? 0.3 : pulse;
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

  return (
    <group position={position} quaternion={quaternion} ref={groupRef}>
      {/* Vinyl disc */}
      <mesh
        ref={discRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <circleGeometry args={[markerSize, 32]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={hovered ? 1 : 0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef}>
        <ringGeometry args={[markerSize * 0.9, markerSize * 2.5, 32]} />
        <meshBasicMaterial
          color={vinylColor}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Owner marker - gold outer ring */}
      {vinyl.isOwner && (
        <mesh>
          <ringGeometry args={[markerSize * 2.2, markerSize * 2.8, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, markerSize * 4, 0]}
          center
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}
          distanceFactor={3}
        >
          <div
            className="bg-black/95 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-xl shadow-2xl flex flex-col items-center gap-1 min-w-[200px] whitespace-nowrap"
            style={{ animation: 'tooltipIn 0.2s ease-out' }}
          >
            {vinyl.coverUrl && (
              <img
                src={vinyl.coverUrl}
                alt=""
                className="w-12 h-12 rounded-lg object-cover mb-1 shadow-lg"
              />
            )}
            <span className="text-white font-bold text-sm leading-tight text-center max-w-[200px] truncate">
              {vinyl.title}
            </span>
            <span className="text-xs font-medium" style={{ color: vinylColor }}>
              {vinyl.artist}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {vinyl.genre?.[0] && (
                <span className="text-zinc-500 text-[10px]">{vinyl.genre[0]}</span>
              )}
              {vinyl.circadianMood && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10"
                  style={{ color: vinylColor }}>
                  {vinyl.circadianMood}
                </span>
              )}
            </div>
            {vinyl.previewUrl && audioUnlocked && (
              <div className="text-[9px] text-zinc-500 flex items-center gap-1 mt-1">
                <div className="flex gap-[2px] items-end h-3">
                  <div className="w-[2px] h-1 rounded-full animate-pulse" style={{ backgroundColor: vinylColor }} />
                  <div className="w-[2px] h-2 rounded-full animate-pulse" style={{ backgroundColor: vinylColor, animationDelay: '0.1s' }} />
                  <div className="w-[2px] h-1.5 rounded-full animate-pulse" style={{ backgroundColor: vinylColor, animationDelay: '0.2s' }} />
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
          <style>{`
            @keyframes tooltipIn {
              from { opacity: 0; transform: translate(-50%, -90%) scale(0.9); }
              to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
};

export default React.memo(VinylMarker3D);
