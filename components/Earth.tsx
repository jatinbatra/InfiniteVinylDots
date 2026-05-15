import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSunDirection } from '../utils/geoUtils';
import { generateEarthTexture } from '../utils/earthTexture';

const GLOBE_RADIUS = 2;

const vertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D earthMap;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(earthMap, vUv);
    
    // Minimal dark base for "Infinite Dots" to pop
    vec3 landColor = vec3(0.04, 0.08, 0.15) * texColor.r;
    vec3 oceanColor = vec3(0.01, 0.02, 0.05) * (1.0 - texColor.r);
    
    // Ambient highlights on land
    float highlight = texColor.g * 0.1;

    gl_FragColor = vec4(landColor + oceanColor + highlight, 1.0);
  }
`;

const Earth: React.FC = () => {
  const uniforms = useMemo(() => ({
    earthMap: { value: new THREE.CanvasTexture(generateEarthTexture(1024, 512)) }
  }), []);

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default Earth;
export { GLOBE_RADIUS };
