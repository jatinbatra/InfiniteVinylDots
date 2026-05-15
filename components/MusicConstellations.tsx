import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './Earth';

const CONNECTION_COUNT = 30; // Limit for performance

const MusicConstellations: React.FC = () => {
  const lineRef = useRef<THREE.LineSegments>(null);

  const { points, colors } = useMemo(() => {
    const pts: number[] = [];
    const cls: number[] = [];

    for (let i = 0; i < CONNECTION_COUNT; i++) {
      // Pick two random points on sphere
      const phi1 = Math.acos(2 * Math.random() - 1);
      const theta1 = Math.random() * Math.PI * 2;
      const p1 = new THREE.Vector3().setFromSphericalCoords(GLOBE_RADIUS * 1.01, phi1, theta1);

      const phi2 = Math.acos(2 * Math.random() - 1);
      const theta2 = Math.random() * Math.PI * 2;
      const p2 = new THREE.Vector3().setFromSphericalCoords(GLOBE_RADIUS * 1.01, phi2, theta2);

      // Simple arc creation - we just use 2 points for LineSegments
      // In a more complex version, we could use CatmullRomCurve3
      pts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      
      const c = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
      cls.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }

    return { 
        points: new Float32Array(pts), 
        colors: new Float32Array(cls) 
    };
  }, []);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.material.opacity = 0.1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.2} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
};

export default MusicConstellations;
