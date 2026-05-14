import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './Earth';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vEyeVector;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vEyeVector = normalize(worldPos.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 sunDirection;
  uniform vec3 atmosphereColor;
  uniform float uBass;
  varying vec3 vNormal;
  varying vec3 vEyeVector;

  void main() {
    // Fresnel rim effect - stronger at the edges
    float dotProduct = dot(vNormal, -vEyeVector);
    float rim = 1.0 - max(0.0, dotProduct);
    rim = pow(rim, 4.0); // Sharper falloff

    // Sun-side interaction
    float sunFacing = max(0.0, dot(vNormal, normalize(sunDirection)));
    
    // Combine for a beautiful glowing edge, boosted by bass
    float alpha = rim * (0.4 + 0.6 * sunFacing) * (1.0 + uBass * 0.5);
    
    // Add a slight core glow
    float core = pow(1.0 - max(0.0, dotProduct), 2.0) * 0.1 * (1.0 + uBass);
    
    gl_FragColor = vec4(atmosphereColor, (alpha + core) * 0.8);
  }
`;

const Atmosphere: React.FC<{ sunDirection: THREE.Vector3, uBass?: number }> = ({ sunDirection, uBass = 0 }) => {
  const uniforms = useMemo(() => ({
    sunDirection: { value: sunDirection },
    atmosphereColor: { value: new THREE.Color('#00D9FF') },
    uBass: { value: 0 }
  }), [sunDirection]);

  useFrame(() => {
    uniforms.uBass.value = uBass;
    uniforms.sunDirection.value.copy(sunDirection);
  });

  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[GLOBE_RADIUS * 1.12, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export default Atmosphere;
