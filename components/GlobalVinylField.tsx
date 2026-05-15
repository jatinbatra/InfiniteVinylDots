import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './Earth';
import { getCircadianMood } from '../services/circadianService';

const DOT_COUNT = 6000; // Slightly reduced count for clarity

const GlobalVinylField: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const { positions, colors, ids } = useMemo(() => {
    const pos = new Float32Array(DOT_COUNT * 3);
    const col = new Float32Array(DOT_COUNT * 3);
    const ids = new Float32Array(DOT_COUNT);

    for (let i = 0; i < DOT_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      
      const r = GLOBE_RADIUS * 1.002; // Closer to surface
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const lng = (theta * 180) / Math.PI - 180;
      const mood = getCircadianMood(lng);
      const color = new THREE.Color(mood.color);
      
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
      
      ids[i] = Math.random();
    }
    return { positions: pos, colors: col, ids };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < DOT_COUNT; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.lookAt(0, 0, 0);
      
      // Much smaller twinkly dots
      const s = 0.003 + Math.sin(time * 1.5 + ids[i] * 20) * 0.001;
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DOT_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial vertexColors transparent opacity={0.3} />
    </instancedMesh>
  );
};

export default GlobalVinylField;
