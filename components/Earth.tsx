import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSunDirection } from '../utils/geoUtils';

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
  uniform vec3 sunDirection;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // Day/night factor based on sun direction
    float daylight = dot(normalize(vNormal), normalize(sunDirection));
    daylight = smoothstep(-0.15, 0.35, daylight);

    // Base colors
    vec3 dayColor = vec3(0.04, 0.06, 0.14);    // dark blue
    vec3 nightColor = vec3(0.008, 0.008, 0.025); // very dark navy
    vec3 baseColor = mix(nightColor, dayColor, daylight);

    // Grid lines (lat/lng)
    float latFreq = 18.0; // 10-degree intervals
    float lngFreq = 36.0; // 10-degree intervals
    float latLine = 1.0 - smoothstep(0.0, 0.02, abs(sin(vUv.y * 3.14159 * latFreq)));
    float lngLine = 1.0 - smoothstep(0.0, 0.02, abs(sin(vUv.x * 3.14159 * lngFreq)));
    float grid = max(latLine, lngLine);

    // Equator and prime meridian (thicker)
    float equator = 1.0 - smoothstep(0.0, 0.004, abs(vUv.y - 0.5));
    float primeMeridian = 1.0 - smoothstep(0.0, 0.004, abs(vUv.x - 0.5));
    float majorLines = max(equator, primeMeridian);

    // Grid color with day/night modulation
    vec3 gridColor = vec3(0.0, 0.85, 1.0); // cyan
    float gridIntensity = grid * 0.08 * (0.3 + 0.7 * daylight);
    float majorIntensity = majorLines * 0.15 * (0.4 + 0.6 * daylight);

    // City lights on night side (subtle sparkle)
    float nightLights = (1.0 - daylight);
    float sparkle = fract(sin(dot(vUv * 500.0, vec2(12.9898, 78.233))) * 43758.5453);
    sparkle = step(0.997, sparkle) * nightLights * 0.4;
    vec3 lightColor = vec3(1.0, 0.9, 0.6); // warm yellow

    // Terminator line glow
    float terminator = 1.0 - smoothstep(0.0, 0.08, abs(daylight - 0.5));
    vec3 terminatorColor = vec3(1.0, 0.4, 0.1) * terminator * 0.15;

    // Compose
    vec3 finalColor = baseColor
      + gridColor * gridIntensity
      + gridColor * majorIntensity
      + lightColor * sparkle
      + terminatorColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface EarthProps {
  radius?: number;
}

const Earth: React.FC<EarthProps> = ({ radius = GLOBE_RADIUS }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    sunDirection: { value: getSunDirection() },
    time: { value: 0 },
  }), []);

  // Update sun direction every frame (smooth movement)
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta;
      // Update sun position every few seconds (no need for every frame)
      if (Math.floor(materialRef.current.uniforms.time.value) % 5 === 0) {
        materialRef.current.uniforms.sunDirection.value.copy(getSunDirection());
      }
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={0}>
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
