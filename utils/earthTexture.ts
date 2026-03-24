/**
 * Generates a stylized Earth texture on a Canvas with recognizable continent outlines.
 * Uses simplified polygon data for major landmasses.
 */

// Simplified continent outlines as [lng, lat] polygon arrays
// These are deliberately low-poly for performance but recognizable
const CONTINENTS: number[][][] = [
  // North America
  [[-130,50],[-125,60],[-120,65],[-100,68],[-80,62],[-65,47],[-67,44],[-75,35],[-80,25],[-85,25],[-90,30],[-97,26],[-105,20],[-105,30],[-115,32],[-120,35],[-125,43],[-130,50]],
  // South America
  [[-80,10],[-75,6],[-60,8],[-35,-5],[-35,-15],[-40,-22],[-48,-28],[-55,-33],[-65,-55],[-75,-45],[-72,-18],[-75,-10],[-80,0],[-80,10]],
  // Europe
  [[-10,36],[-10,42],[0,44],[3,43],[5,46],[10,46],[14,55],[10,57],[12,56],[25,60],[30,70],[40,68],[45,55],[40,48],[30,42],[25,36],[10,36],[5,36],[0,36],[-10,36]],
  // Africa
  [[-18,15],[-15,28],[0,36],[10,36],[12,33],[25,32],[35,30],[43,12],[50,2],[42,-2],[40,-15],[35,-34],[28,-34],[20,-33],[12,-17],[8,-5],[5,5],[-5,5],[-8,10],[-18,15]],
  // Asia (simplified)
  [[25,36],[30,42],[40,48],[45,55],[40,68],[50,68],[60,72],[70,72],[100,72],[120,70],[135,60],[140,50],[145,45],[130,35],[120,24],[105,22],[100,10],[95,16],[90,22],[82,8],[78,10],[70,22],[60,25],[50,26],[42,15],[35,30],[25,36]],
  // Australia
  [[115,-35],[117,-20],[130,-12],[140,-12],[150,-15],[153,-28],[148,-38],[138,-35],[130,-32],[115,-35]],
  // Greenland
  [[-55,60],[-45,60],[-20,73],[-20,80],[-40,83],[-55,82],[-60,75],[-55,60]],
  // Indonesia/SE Asia islands (simplified)
  [[95,-6],[100,-2],[105,-6],[110,-7],[115,-8],[120,-5],[125,-2],[128,-4],[130,-8],[120,-10],[110,-8],[105,-7],[100,-5],[95,-6]],
  // Japan
  [[130,31],[131,34],[134,35],[136,36],[140,40],[141,43],[145,45],[142,40],[140,36],[137,34],[135,33],[130,31]],
  // New Zealand
  [[166,-46],[168,-44],[175,-41],[178,-37],[176,-40],[174,-42],[170,-46],[166,-46]],
  // UK/Ireland
  [[-10,51],[-5,53],[0,51],[2,54],[-1,58],[-5,57],[-5,55],[-10,51]],
  // Madagascar
  [[44,-25],[47,-16],[50,-14],[50,-22],[47,-26],[44,-25]],
  // Scandinavia peninsula
  [[5,58],[8,58],[15,65],[20,69],[28,71],[30,70],[25,60],[18,56],[12,56],[5,58]],
];

export function generateEarthTexture(width = 2048, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Ocean background - very dark navy
  ctx.fillStyle = '#040810';
  ctx.fillRect(0, 0, width, height);

  // Subtle ocean grid
  ctx.strokeStyle = 'rgba(0, 180, 255, 0.04)';
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 10) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 10) {
    const x = ((lng + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator - slightly brighter
  ctx.strokeStyle = 'rgba(0, 180, 255, 0.08)';
  ctx.lineWidth = 1;
  const eqY = height / 2;
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(width, eqY);
  ctx.stroke();

  // Draw continents
  for (const continent of CONTINENTS) {
    // Convert [lng, lat] to canvas coordinates
    const points = continent.map(([lng, lat]) => ({
      x: ((lng + 180) / 360) * width,
      y: ((90 - lat) / 180) * height,
    }));

    // Land fill - very subtle dark teal
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 200, 255, 0.06)';
    ctx.fill();

    // Land outline - glowing cyan
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    // Glow effect - draw twice with different widths
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 220, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Add some city lights as bright dots
  const cities: [number, number][] = [
    [-74, 40.7],   // NYC
    [-118, 34],    // LA
    [-87, 41.9],   // Chicago
    [-0.1, 51.5],  // London
    [2.3, 48.9],   // Paris
    [13.4, 52.5],  // Berlin
    [139.7, 35.7], // Tokyo
    [126.9, 37.5], // Seoul
    [-46.6, -23.5],// Sao Paulo
    [77.2, 28.6],  // Delhi
    [121.5, 31.2], // Shanghai
    [116.4, 39.9], // Beijing
    [55.3, 25.3],  // Dubai
    [151.2, -33.9],// Sydney
    [-99.1, 19.4], // Mexico City
    [37.6, 55.8],  // Moscow
    [100.5, 13.8], // Bangkok
    [28.9, 41],    // Istanbul
    [-43.2, -22.9],// Rio
    [31, 30],      // Cairo
    [3.4, 6.5],    // Lagos
    [18.4, -33.9], // Cape Town
    [-58.4, -34.6],// Buenos Aires
    [174.8, -41.3],// Wellington
  ];

  for (const [lng, lat] of cities) {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;

    // Outer glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
    gradient.addColorStop(0, 'rgba(255, 220, 100, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 8, y - 8, 16, 16);

    // Core dot
    ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}
