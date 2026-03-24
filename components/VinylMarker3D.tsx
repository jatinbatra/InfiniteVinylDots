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

// Texture cache — avoids recreating identical textures
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a bright, visible circular texture.
 * Draws album art as a circle when loaded, falls back to a glowing colored dot.
 */
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

  // Draw bright colored circle as default
  ctx.beginPath();
  ctx.arc(cx, cx, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, r);
  grad.addColorStop(0, lighten(color, 40));
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, darken(color, 40));
  ctx.fillStyle = grad;
  ctx.fill();

  // Outer glow ring
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Center dot (vinyl spindle look)
  ctx.beginPath();
  ctx.arc(cx, cx, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  textureCache.set(cacheKey, tex);

  // Load album art asynchronously and repaint
  if (coverUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);

      // Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.clip();

      // Draw album art
      ctx.drawImage(img, 0, 0, size, size);
      ctx.restore();

      // Colored ring border
      ctx.beginPath();
      ctx.arc(cx, cx, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Center hole
      ctx.beginPath();
      ctx.arc(cx, cx, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      tex.needsUpdate = true;
    };
    // Use smaller image for texture (60x60 is plenty for a dot)
    img.src = coverUrl.replace('600x600', '60x60');
  }

  return tex;
}

function lighten(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
}

const VinylMarker3D: React.FC<VinylMarker3DProps> = ({ vinyl, onClick, audioUnlocked }) => {
  const groupRef = useRef<THREE.Group>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinAngle = useRef(Math.random() * Math.PI * 2);

  const position = useMemo(() => {
    return latLngToSphere(vinyl.lat ?? 0, vinyl.lng ?? 0, GLOBE_RADIUS * 1.008);
  }, [vinyl.lat, vinyl.lng]);

  const normal = useMemo(() => position.clone().normalize(), [position]);
  const vinylColor = vinyl.circadianColor || '#00D9FF';
  const texture = useMemo(() => createMarkerTexture(vinylColor, vinyl.coverUrl), [vinylColor, vinyl.coverUrl]);

  // Orient disc to face outward from globe
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return q;
  }, [normal]);

  const markerSize = vinyl.isOwner ? 0.09 : 0.07;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Scale
    const targetScale = hovered ? 1.8 : 1;
    const s = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(s, targetScale, 0.12));

    // Spin
    if (discRef.current) {
      const speed = hovered ? 4 : (vinyl.isPlaying ? 1.5 : 0.2);
      spinAngle.current += delta * speed;
      discRef.current.rotation.z = spinAngle.current;
    }

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = hovered ? 0.35 : 0.12 + Math.sin(Date.now() * 0.002 + position.x * 5) * 0.06;
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
      {/* Album art disc */}
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
          opacity={hovered ? 1 : 0.95}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Soft glow behind */}
      <mesh ref={glowRef} position={[0, 0, -0.001]}>
        <circleGeometry args={[markerSize * 1.8, 24]} />
        <meshBasicMaterial
          color={vinylColor}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Owner ring */}
      {vinyl.isOwner && (
        <mesh position={[0, 0, -0.0005]}>
          <ringGeometry args={[markerSize * 1.1, markerSize * 1.4, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Tooltip */}
      {hovered && (
        <Html
          position={[0, markerSize * 3.5, 0]}
          center
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}
          distanceFactor={2.5}
        >
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 px-3 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 whitespace-nowrap">
            {vinyl.coverUrl && (
              <img
                src={vinyl.coverUrl.replace('600x600', '100x100')}
                alt=""
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-lg"
              />
            )}
            <div className="min-w-0 pr-1">
              <div className="text-white font-semibold text-[13px] leading-tight truncate max-w-[180px]">
                {vinyl.title}
              </div>
              <div className="text-zinc-400 text-[11px] truncate max-w-[180px] mt-0.5">
                {vinyl.artist}
              </div>
              <div className="text-zinc-600 text-[10px] mt-0.5 flex items-center gap-1.5">
                {vinyl.genre?.[0] && <span>{vinyl.genre[0]}</span>}
                {vinyl.previewUrl && audioUnlocked && (
                  <span className="flex items-center gap-[2px]">
                    <span className="inline-block w-[3px] h-[6px] rounded-full animate-pulse" style={{ backgroundColor: vinylColor }} />
                    <span className="inline-block w-[3px] h-[9px] rounded-full animate-pulse" style={{ backgroundColor: vinylColor, animationDelay: '0.15s' }} />
                    <span className="inline-block w-[3px] h-[7px] rounded-full animate-pulse" style={{ backgroundColor: vinylColor, animationDelay: '0.3s' }} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default React.memo(VinylMarker3D);
