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
  uniform vec3 sunDirection;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(earthMap, vUv);
    float daylight = dot(normalize(vNormal), normalize(sunDirection));
    daylight = smoothstep(-0.1, 0.2, daylight);

    // Clean, high-contrast look
    vec3 nightColor = texColor.rgb * 0.2;
    vec3 dayColor = texColor.rgb;
    
    // Add warm city lights pop on night side
    float lights = texColor.g;
    vec3 lightGlow = vec3(1.0, 0.8, 0.5) * lights * (1.0 - daylight) * 2.0;

    gl_FragColor = vec4(mix(nightColor, dayColor, daylight) + lightGlow, 1.0);
  }
`;

const Earth: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    earthMap: { value: new THREE.CanvasTexture(generateEarthTexture(1024, 512)) },
    sunDirection: { value: getSunDirection() }
  }), []);

  useFrame(() => {
    if (materialRef.current) {
        materialRef.current.uniforms.sunDirection.value.copy(getSunDirection());
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default Earth;
export { GLOBE_RADIUS };
