import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './Earth';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 sunDirection;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    // View direction
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // Fresnel rim effect
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    rim = pow(rim, 3.0);

    // Sun-side is brighter
    float sunFacing = max(0.0, dot(vNormal, normalize(sunDirection)));
    float intensity = rim * (0.3 + 0.7 * sunFacing);

    // Atmosphere color - cyan with slight blue shift
    vec3 atmosphereColor = vec3(0.0, 0.7, 1.0);

    gl_FragColor = vec4(atmosphereColor, intensity * 0.35);
  }
`;

const Atmosphere: React.FC<{ sunDirection: THREE.Vector3 }> = ({ sunDirection }) => {
  const uniforms = useMemo(() => ({
    sunDirection: { value: sunDirection },
  }), [sunDirection]);

  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[GLOBE_RADIUS * 1.08, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

export default Atmosphere;
