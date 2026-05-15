import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './Earth';
import { getCircadianMood } from '../services/circadianService';

const DOT_COUNT = 5000; // Optimized count for complex animations

const GlobalVinylField: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const { positions, colors, data } = useMemo(() => {
    const pos = new Float32Array(DOT_COUNT * 3);
    const col = new Float32Array(DOT_COUNT * 3);
    const data = new Float32Array(DOT_COUNT * 3); // [randomOffset, bpmScale, trendingHeight]

    for (let i = 0; i < DOT_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      
      const r = GLOBE_RADIUS;
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
      
      // Simulation data
      data[i * 3] = Math.random(); // Random time offset
      data[i * 3 + 1] = 0.5 + Math.random() * 2.0; // BPM Scale (0.5x to 2.5x)
      
      // Trending height (some clusters stick out more)
      const isTrending = Math.random() > 0.96;
      data[i * 3 + 2] = isTrending ? 0.3 + Math.random() * 0.5 : 0;
    }
    return { positions: pos, colors: col, data };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < DOT_COUNT; i++) {
      const offset = data[i * 3];
      const bpm = data[i * 3 + 1];
      const trend = data[i * 3 + 2];
      
      // Pulse logic
      const pulse = Math.sin(time * 3 * bpm + offset * 10) * 0.5 + 0.5;
      
      // Tower logic: Erupt off the globe surface
      const currentR = 1.01 + trend * pulse;
      
      const x = positions[i * 3] * currentR;
      const y = positions[i * 3 + 1] * currentR;
      const z = positions[i * 3 + 2] * currentR;
      
      dummy.position.set(x, y, z);
      dummy.lookAt(0, 0, 0);
      
      // Scale reacts to pulse
      const s = (0.004 + pulse * 0.003) * (trend > 0 ? 2 : 1);
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DOT_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial vertexColors transparent opacity={0.5} />
    </instancedMesh>
  );
};

export default GlobalVinylField;
