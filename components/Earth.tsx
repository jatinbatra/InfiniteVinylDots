import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSunDirection } from '../utils/geoUtils';
import { generateEarthTexture } from '../utils/earthTexture';

const GLOBE_RADIUS = 2;

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform sampler2D earthMap;
  uniform vec3 sunDirection;
  uniform float uBass;
  uniform float uMid;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(earthMap, vUv);
    float daylight = dot(normalize(vNormal), normalize(sunDirection));
    daylight = smoothstep(-0.2, 0.3, daylight);

    // Cyber-Stylized Colors
    vec3 landColor = vec3(0.02, 0.05, 0.1);
    vec3 glowColor = vec3(0.0, 0.8, 1.0);
    
    // Mix programmatic colors based on texture mask
    vec3 baseColor = mix(vec3(0.005, 0.008, 0.02), landColor, texColor.r);
    
    // Dynamic Rim
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 4.0);
    vec3 rimColor = glowColor * rim * (0.5 + uBass * 0.5);

    // City lights pulse with music
    float lights = texColor.g * (1.0 + uMid * 3.0);
    vec3 lightColor = vec3(1.0, 0.8, 0.4) * lights * (1.0 - daylight);

    gl_FragColor = vec4(baseColor + rimColor + lightColor, 1.0);
  }
`;

interface EarthProps {
  radius?: number;
  uBass?: number;
  uMid?: number;
}

const Earth: React.FC<EarthProps> = ({ radius = GLOBE_RADIUS, uBass = 0, uMid = 0 }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { texture, uniforms } = useMemo(() => {
    // Revert to generated texture for instant load and stylized look
    const canvas = generateEarthTexture(1024, 512);
    const tex = new THREE.CanvasTexture(canvas);
    return {
      texture: tex,
      uniforms: {
        earthMap: { value: tex },
        sunDirection: { value: getSunDirection() },
        uBass: { value: 0 },
        uMid: { value: 0 }
      },
    };
  }, []);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uBass.value = uBass;
      materialRef.current.uniforms.uMid.value = uMid;
      materialRef.current.uniforms.sunDirection.value.copy(getSunDirection());
    }
  });

  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[radius, 64, 64]} />
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
