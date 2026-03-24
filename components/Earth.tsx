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
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // Sample the earth texture
    vec4 texColor = texture2D(earthMap, vUv);

    // Day/night factor based on sun direction
    float daylight = dot(normalize(vNormal), normalize(sunDirection));
    daylight = smoothstep(-0.15, 0.35, daylight);

    // Day side: show texture brighter + slight blue tint
    vec3 dayTint = vec3(0.7, 0.85, 1.0);
    vec3 dayColor = texColor.rgb * dayTint * 2.5;

    // Night side: show texture dimmer + warm city lights pop more
    float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 nightColor = texColor.rgb * 0.6 + vec3(luminance * 0.3, luminance * 0.2, luminance * 0.05);

    vec3 baseColor = mix(nightColor, dayColor, daylight);

    // Terminator line glow (orange band at day/night border)
    float terminator = 1.0 - smoothstep(0.0, 0.1, abs(daylight - 0.5));
    vec3 terminatorColor = vec3(1.0, 0.4, 0.1) * terminator * 0.2;

    // Subtle atmosphere scatter on edges
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    rim = pow(rim, 4.0);
    vec3 rimColor = vec3(0.0, 0.5, 1.0) * rim * 0.3 * (0.5 + 0.5 * daylight);

    vec3 finalColor = baseColor + terminatorColor + rimColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface EarthProps {
  radius?: number;
}

const Earth: React.FC<EarthProps> = ({ radius = GLOBE_RADIUS }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { texture, uniforms } = useMemo(() => {
    const canvas = generateEarthTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    return {
      texture: tex,
      uniforms: {
        earthMap: { value: tex },
        sunDirection: { value: getSunDirection() },
        time: { value: 0 },
      },
    };
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta;
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
