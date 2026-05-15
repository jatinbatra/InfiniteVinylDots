import React, { useMemo } from 'react';
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
  uniform vec3 atmosphereColor;
  varying vec3 vNormal;
  varying vec3 vEyeVector;
  void main() {
    float rim = 1.0 - max(0.0, dot(vNormal, -vEyeVector));
    rim = pow(rim, 6.0);
    gl_FragColor = vec4(atmosphereColor, rim * 0.4);
  }
`;

const Atmosphere: React.FC<{ sunDirection: THREE.Vector3 }> = () => {
  const uniforms = useMemo(() => ({
    atmosphereColor: { value: new THREE.Color('#00D9FF') }
  }), []);

  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[GLOBE_RADIUS * 1.05, 64, 64]} />
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
