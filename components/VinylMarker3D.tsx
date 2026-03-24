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
    const targetScale = hovered ? 2.0 : 1;
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

      {/* Hover tooltip — clean and minimal */}
      {hovered && (
        <Html
          position={[0, markerSize * 4, 0]}
          center
          style={{ pointerEvents: 'none', transform: 'translate(-50%, -100%)' }}
          distanceFactor={3}
        >
          <div className="bg-zinc-950/95 backdrop-blur-xl border border-white/[0.08] px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 whitespace-nowrap">
            {vinyl.coverUrl && (
              <img
                src={vinyl.coverUrl}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="text-white font-semibold text-xs leading-tight truncate max-w-[160px]">
                {vinyl.title}
              </div>
              <div className="text-zinc-500 text-[11px] truncate max-w-[160px]">
                {vinyl.artist}
              </div>
              {vinyl.genre?.[0] && (
                <div className="text-zinc-600 text-[10px] mt-0.5">{vinyl.genre[0]}</div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default React.memo(VinylMarker3D);
