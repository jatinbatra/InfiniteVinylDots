import * as THREE from 'three';

const DEG2RAD = Math.PI / 180;

/**
 * Convert lat/lng to a 3D position on a sphere surface.
 * lat: -90 to 90, lng: -180 to 180
 */
export function latLngToSphere(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lng + 180) * DEG2RAD;

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Get the normal vector pointing outward from the globe at a lat/lng.
 */
export function latLngToNormal(lat: number, lng: number): THREE.Vector3 {
  return latLngToSphere(lat, lng, 1).normalize();
}

/**
 * Calculate the sun direction vector based on current UTC time.
 * Returns a normalized vector pointing from Earth center toward the sun.
 */
export function getSunDirection(): THREE.Vector3 {
  const now = new Date();
  const hours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

  // Sun longitude: at 12:00 UTC, sun is roughly over 0° longitude
  const sunLng = ((12 - hours) / 24) * 360;

  // Sun latitude: varies ±23.44° through the year (axial tilt)
  const dayOfYear = getDayOfYear(now);
  const sunLat = 23.44 * Math.sin(((dayOfYear - 81) / 365) * 2 * Math.PI);

  return latLngToSphere(sunLat, sunLng, 1).normalize();
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get the local hour (0-24) at a given longitude.
 */
export function getLocalHour(lng: number): number {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const localHour = (utcHours + lng / 15 + 24) % 24;
  return localHour;
}
