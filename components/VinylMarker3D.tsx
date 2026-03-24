import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
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

// Create a high-quality vinyl record texture with album art center
function createVinylTexture(accentColor: string, coverUrl?: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - 2;

  // Transparent background (so it looks like a disc floating)
  ctx.clearRect(0, 0, size, size);

  // Main vinyl disc - dark gradient
  const discGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  discGrad.addColorStop(0, '#1a1a1a');
  discGrad.addColorStop(0.2, '#111');
  discGrad.addColorStop(0.5, '#0d0d0d');
  discGrad.addColorStop(0.8, '#111');
  discGrad.addColorStop(1, '#080808');
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Vinyl grooves - realistic concentric rings with varying opacity
  for (let radius = 35; radius < r - 4; radius += 2) {
    const opacity = 0.03 + Math.sin(radius * 0.3) * 0.02;
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Rainbow light reflection (the iridescent streak you see on real vinyl)
  ctx.save();
  const reflectGrad = ctx.createLinearGradient(cx - r, cy - r * 0.3, cx + r, cy + r * 0.3);
  reflectGrad.addColorStop(0, 'rgba(255, 0, 100, 0)');
  reflectGrad.addColorStop(0.2, 'rgba(255, 0, 100, 0.04)');
  reflectGrad.addColorStop(0.35, 'rgba(100, 0, 255, 0.06)');
  reflectGrad.addColorStop(0.5, 'rgba(0, 200, 255, 0.06)');
  reflectGrad.addColorStop(0.65, 'rgba(0, 255, 100, 0.04)');
  reflectGrad.addColorStop(0.8, 'rgba(255, 255, 0, 0.03)');
  reflectGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
  ctx.fillStyle = reflectGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Lead-in groove (outer edge, slightly wider gap)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.stroke();

  // Run-out groove (near label)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.stroke();

  // Center label - colored circle
  const labelGrad = ctx.createRadialGradient(cx - 8, cy - 8, 0, cx, cy, 32);
  labelGrad.addColorStop(0, lightenColor(accentColor, 30));
  labelGrad.addColorStop(1, accentColor);
  ctx.fillStyle = labelGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();

  // Label border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.stroke();

  // Label text (tiny "VV" logo)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VV', cx, cy - 6);

  // Tiny ring patterns on label
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.stroke();

  // Center spindle hole
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Spindle hole highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Edge highlight (outer rim)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
  const b = Math.min(255, (num & 0x0000FF) + percent);
  return `rgb(${r}, ${g}, ${b})`;
}

const VinylMarker3D: React.FC<VinylMarker3DProps> = ({ vinyl, onClick, audioUnlocked }) => {
  const groupRef = useRef<THREE.Group>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinAngle = useRef(Math.random() * Math.PI * 2); // Random start angle

  const position = useMemo(() => {
    const lat = vinyl.lat ?? 0;
    const lng = vinyl.lng ?? 0;
    return latLngToSphere(lat, lng, GLOBE_RADIUS * 1.005);
  }, [vinyl.lat, vinyl.lng]);

  const normal = useMemo(() => position.clone().normalize(), [position]);

  const vinylColor = vinyl.circadianColor || '#00D9FF';

  const texture = useMemo(() => createVinylTexture(vinylColor, vinyl.coverUrl), [vinylColor, vinyl.coverUrl]);

  // Orient disc to face outward from globe, tilted slightly
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    q.setFromUnitVectors(up, normal);

    // Add slight tilt for visual interest
    const tiltQ = new THREE.Quaternion();
    tiltQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.15);
    q.multiply(tiltQ);

    return q;
  }, [normal]);

  const markerSize = vinyl.isOwner ? 0.08 : 0.06;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth scale animation
    const targetScale = hovered ? 3.0 : 1;
    const s = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(s, targetScale, 0.1));

    // Spin the disc
    if (discRef.current) {
      const speed = hovered ? 6 : (vinyl.isPlaying ? 2 : 0.3);
      spinAngle.current += delta * speed;
      discRef.current.rotation.z = spinAngle.current;
    }

    // Pulse glow ring
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.06 + Math.sin(Date.now() * 0.003 + position.x * 10) * 0.04;
      mat.opacity = hovered ? 0.25 : pulse;
    }

    // Expanding pulse ring on hover
    if (pulseRef.current) {
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      if (hovered) {
        const t = (Date.now() % 1500) / 1500;
        const scale = 1 + t * 2;
        pulseRef.current.scale.setScalar(scale);
        mat.opacity = 0.15 * (1 - t);
      } else {
        mat.opacity = 0;
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

  return (
    <group position={position} quaternion={quaternion} ref={groupRef}>
      {/* Vinyl record disc */}
      <mesh
        ref={discRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <circleGeometry args={[markerSize, 48]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={hovered ? 1 : 0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ambient glow behind disc */}
      <mesh ref={glowRef} position={[0, 0, -0.001]}>
        <circleGeometry args={[markerSize * 2, 32]} />
        <meshBasicMaterial
          color={vinylColor}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Expanding pulse ring (hover effect) */}
      <mesh ref={pulseRef} position={[0, 0, -0.002]}>
        <ringGeometry args={[markerSize * 0.8, markerSize * 1.2, 32]} />
        <meshBasicMaterial
          color={vinylColor}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Owner marker - gold outer ring */}
      {vinyl.isOwner && (
        <mesh>
          <ringGeometry args={[markerSize * 2.2, markerSize * 2.6, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, markerSize * 5, 0]}
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
                className="w-14 h-14 rounded-lg object-cover mb-1 shadow-lg border border-white/5"
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
