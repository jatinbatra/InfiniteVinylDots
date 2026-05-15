import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
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

const textureCache = new Map<string, THREE.CanvasTexture>();

function createMarkerTexture(color: string, coverUrl?: string): THREE.CanvasTexture {
  const cacheKey = `${coverUrl || color}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const r = cx - 4;

  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, tex);

  if (coverUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, 0, 0, size, size); ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cx, r, 0, Math.PI * 2); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.stroke();
      tex.needsUpdate = true;
    };
    img.src = coverUrl.replace('600x600', '100x100');
  }
  return tex;
}

const VinylMarker3D: React.FC<VinylMarker3DProps> = ({ vinyl, onClick, audioUnlocked }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const position = useMemo(() => latLngToSphere(vinyl.lat ?? 0, vinyl.lng ?? 0, GLOBE_RADIUS * 1.01), [vinyl.lat, vinyl.lng]);
  const normal = useMemo(() => position.clone().normalize(), [position]);
  const color = vinyl.circadianColor || '#00D9FF';
  const texture = useMemo(() => createMarkerTexture(color, vinyl.coverUrl), [color, vinyl.coverUrl]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal), [normal]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = hovered ? 2.5 : 1.0;
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1));
    if (vinyl.isPlaying || hovered) groupRef.current.rotateZ(delta * (hovered ? 4 : 1));
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation(); setHovered(true);
    document.body.style.cursor = 'pointer';
    hoverTimeout.current = setTimeout(() => { if (vinyl.previewUrl && audioUnlocked) audioManager.play(vinyl.previewUrl); }, 300);
  };

  const handlePointerOut = () => {
    setHovered(false); document.body.style.cursor = 'auto';
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    audioManager.stop();
  };

  return (
    <group position={position} quaternion={quaternion} ref={groupRef}>
      <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={(e) => { e.stopPropagation(); onClick(vinyl); }}>
        <circleGeometry args={[0.08, 32]} />
        <meshBasicMaterial map={texture} transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Visual ring */}
      <mesh position={[0, 0, -0.001]}>
        <ringGeometry args={[0.09, 0.12, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {hovered && (
        <Html position={[0, 0.4, 0]} center>
          <div className="bg-black/90 px-4 py-2 rounded-xl border border-white/20 whitespace-nowrap text-center shadow-2xl pointer-events-none">
            <div className="text-white font-bold text-sm">{vinyl.title}</div>
            <div className="text-zinc-400 text-[10px] uppercase tracking-widest">{vinyl.artist}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default React.memo(VinylMarker3D);
