import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, Float } from '@react-three/drei';
import * as THREE from 'three';
import { REGIONS } from '../constants';
import { latLngToSphere } from '../utils/geoUtils';
import { GLOBE_RADIUS } from './Earth';

interface WeatherPoint {
  lat: number;
  lng: number;
  type: 'rain' | 'snow' | 'clouds';
  intensity: number;
  position: THREE.Vector3;
}

const WeatherSystem: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherPoint[]>([]);

  // Fetch weather for visible regions periodically
  useEffect(() => {
    async function fetchWeather() {
      // For demo purposes, we randomly assign weather to 10% of regions
      // In a real app, this would call Open-Meteo API
      const points: WeatherPoint[] = REGIONS.filter(() => Math.random() > 0.9).map(r => ({
        lat: r.lat,
        lng: r.lng,
        type: Math.random() > 0.5 ? 'rain' : 'snow',
        intensity: Math.random(),
        position: latLngToSphere(r.lat, r.lng, GLOBE_RADIUS * 1.02)
      }));
      setWeatherData(points);
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <group>
      {weatherData.map((p, i) => (
        <WeatherEmitter key={i} point={p} />
      ))}
    </group>
  );
};

const WeatherEmitter: React.FC<{ point: WeatherPoint }> = ({ point }) => {
  const count = Math.floor(point.intensity * 40) + 10;
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ),
      speed: 0.5 + Math.random() * 1.5
    }));
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);
  
  // Orient toward normal
  const normal = useMemo(() => point.position.clone().normalize(), [point.position]);
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    return q;
  }, [normal]);

  return (
    <group position={point.position} quaternion={quaternion} ref={groupRef}>
      <Instances range={count}>
        <planeGeometry args={[0.005, 0.02]} />
        <meshBasicMaterial 
            color={point.type === 'rain' ? '#00D9FF' : '#FFFFFF'} 
            transparent 
            opacity={0.4} 
            side={THREE.DoubleSide}
        />
        {particles.map((p, i) => (
          <RainDrop key={i} offset={p.offset} speed={p.speed} />
        ))}
      </Instances>
    </group>
  );
};

const RainDrop: React.FC<{ offset: THREE.Vector3, speed: number }> = ({ offset, speed }) => {
  const ref = useRef<THREE.Group>(null);
  const initialY = offset.y;

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    const y = ((initialY - time * 0.05 * speed) % 0.1) + 0.05;
    ref.current.position.y = y;
  });

  return (
    <Instance ref={ref} position={offset} />
  );
};

export default WeatherSystem;
