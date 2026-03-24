/**
 * Generates a detailed stylized Earth texture with continent outlines,
 * country borders, labels, and city lights.
 */

// Continent outlines as [lng, lat] polygon arrays - higher detail
const CONTINENTS: number[][][] = [
  // North America (detailed)
  [[-168,65],[-162,63],[-153,60],[-140,60],[-137,59],[-135,55],[-130,55],[-126,50],[-124,46],[-124,42],[-117,33],[-112,31],[-108,32],[-105,30],[-100,28],[-97,26],[-95,28],[-90,29],[-85,30],[-83,29],[-81,25],[-80,25],[-82,27],[-84,30],[-87,30],[-89,29],[-90,30],[-94,30],[-97,26],[-97,25],[-93,19],[-92,15],[-87,14],[-83,10],[-80,8],[-77,8],[-75,11],[-72,12],[-67,18],[-66,18],[-64,18],[-67,45],[-70,42],[-71,41],[-74,40],[-75,39],[-76,37],[-76,34],[-81,31],[-80,25],[-83,25],[-85,29],[-89,30],[-90,29],[-94,29],[-97,26],[-97,28],[-100,29],[-104,29],[-106,31],[-108,31],[-112,31],[-115,32],[-117,33],[-120,34],[-122,37],[-124,40],[-124,45],[-123,48],[-128,51],[-130,54],[-136,58],[-140,60],[-147,61],[-152,58],[-157,56],[-162,55],[-166,54],[-168,60],[-168,65]],
  // South America (detailed)
  [[-80,10],[-77,8],[-75,6],[-72,4],[-70,4],[-65,2],[-60,5],[-52,4],[-50,0],[-48,-2],[-44,-3],[-42,-3],[-38,-4],[-35,-6],[-35,-10],[-37,-12],[-38,-15],[-40,-18],[-41,-20],[-44,-23],[-46,-24],[-48,-26],[-50,-28],[-52,-33],[-54,-34],[-58,-38],[-63,-42],[-65,-46],[-66,-50],[-68,-53],[-70,-55],[-72,-52],[-75,-47],[-73,-40],[-72,-35],[-71,-30],[-70,-25],[-70,-18],[-76,-14],[-77,-12],[-80,-3],[-80,0],[-78,2],[-77,4],[-80,8],[-80,10]],
  // Europe (detailed)
  [[-10,36],[-9,38],[-9,41],[-8,43],[-2,43],[0,43],[3,43],[5,44],[7,44],[6,46],[6,48],[2,49],[2,51],[4,52],[7,54],[8,55],[10,55],[12,54],[14,54],[18,55],[20,54],[22,55],[24,58],[22,60],[18,60],[16,57],[12,56],[10,58],[5,58],[5,62],[7,63],[10,64],[14,65],[18,68],[22,68],[25,66],[28,65],[30,62],[28,60],[24,58],[26,55],[28,51],[26,45],[28,42],[26,40],[25,38],[24,36],[22,36],[20,36],[18,38],[15,38],[13,38],[12,38],[10,44],[8,44],[6,44],[5,44],[3,43],[0,43],[-2,43],[-5,36],[-10,36]],
  // Africa (detailed)
  [[-17,15],[-17,21],[-16,24],[-13,28],[-9,32],[-6,35],[-2,35],[0,36],[5,36],[10,37],[11,34],[15,32],[20,32],[25,32],[30,31],[33,30],[35,28],[37,24],[40,20],[43,12],[45,8],[48,5],[50,2],[48,0],[43,-2],[42,-6],[40,-10],[38,-15],[36,-20],[35,-25],[33,-28],[30,-32],[28,-34],[25,-34],[22,-33],[19,-30],[17,-28],[15,-22],[12,-17],[10,-10],[9,-5],[7,0],[5,4],[2,5],[-2,5],[-5,5],[-8,8],[-12,10],[-15,11],[-17,15]],
  // Asia (detailed)
  [[25,36],[26,40],[28,42],[30,42],[33,42],[36,42],[40,43],[42,42],[45,40],[50,40],[52,42],[54,45],[55,50],[55,55],[58,58],[60,60],[65,62],[70,68],[75,72],[85,73],[95,73],[105,72],[115,70],[120,68],[130,63],[135,60],[138,55],[140,52],[142,46],[140,43],[135,40],[130,35],[125,30],[122,25],[120,22],[115,20],[110,18],[108,16],[105,15],[105,10],[100,8],[100,2],[102,2],[105,0],[110,-5],[115,-8],[120,-8],[125,-5],[130,0],[128,3],[125,5],[120,8],[118,10],[118,15],[120,22],[122,25],[125,30],[128,33],[130,35],[135,40],[140,43],[142,46],[140,50],[138,55],[135,60],[130,63],[125,60],[120,55],[115,50],[110,45],[105,42],[100,40],[95,42],[90,40],[85,35],[82,25],[80,20],[78,15],[78,8],[75,10],[72,15],[70,20],[68,24],[65,25],[60,25],[55,25],[50,27],[48,30],[44,37],[42,37],[40,37],[38,36],[35,35],[30,36],[25,36]],
  // Australia (detailed)
  [[114,-22],[115,-25],[115,-30],[115,-34],[117,-35],[120,-35],[125,-35],[130,-33],[132,-32],[135,-33],[137,-35],[140,-38],[145,-38],[148,-37],[150,-35],[152,-32],[153,-28],[153,-25],[150,-22],[148,-20],[146,-18],[144,-15],[142,-12],[140,-12],[138,-12],[136,-14],[135,-15],[132,-14],[130,-12],[128,-15],[126,-18],[122,-18],[118,-20],[115,-20],[114,-22]],
  // Greenland
  [[-55,60],[-50,60],[-45,60],[-35,65],[-25,70],[-20,73],[-18,76],[-20,80],[-30,82],[-40,83],[-50,82],[-55,80],[-58,76],[-60,72],[-58,66],[-55,60]],
  // Japan
  [[129,31],[130,33],[131,34],[133,34],[135,35],[136,36],[137,37],[139,38],[140,40],[141,42],[142,43],[145,44],[145,45],[143,43],[141,41],[140,39],[138,36],[136,35],[134,34],[132,33],[130,31],[129,31]],
  // UK/Ireland
  [[-10,51],[-7,52],[-5,53],[-5,54],[0,51],[1,52],[2,54],[0,55],[-1,56],[-2,58],[-5,58],[-6,56],[-5,55],[-7,55],[-8,54],[-10,51]],
  // New Zealand
  [[166,-46],[168,-44],[172,-42],[174,-40],[176,-38],[178,-37],[177,-39],[175,-41],[172,-44],[170,-46],[168,-46],[166,-46]],
  // Madagascar
  [[44,-25],[46,-20],[47,-16],[49,-14],[50,-13],[50,-16],[50,-20],[48,-24],[46,-26],[44,-25]],
  // Scandinavia
  [[5,58],[8,58],[10,59],[12,58],[14,58],[15,60],[15,63],[16,65],[18,67],[20,69],[25,71],[28,71],[30,70],[30,68],[28,65],[25,62],[22,60],[20,58],[18,56],[15,56],[12,56],[10,57],[8,58],[5,58]],
  // Sri Lanka
  [[80,6],[80,8],[81,10],[82,10],[82,8],[81,6],[80,6]],
  // Taiwan
  [[120,22],[121,23],[122,25],[121,25],[120,24],[120,22]],
  // Philippines
  [[118,10],[120,12],[122,14],[124,16],[126,18],[126,14],[125,10],[123,8],[121,8],[119,9],[118,10]],
];

// Country borders as line segments [lng1, lat1, lng2, lat2]
const BORDERS: number[][] = [
  // US-Canada border (49th parallel + Great Lakes area)
  [-125,49,-120,49], [-120,49,-115,49], [-115,49,-110,49], [-110,49,-105,49],
  [-105,49,-100,49], [-100,49,-95,49], [-95,49,-85,46], [-85,46,-82,45],
  [-82,45,-80,43], [-80,43,-75,45], [-75,45,-72,45], [-72,45,-67,47],
  // US-Mexico border
  [-117,33,-112,31], [-112,31,-108,31], [-108,31,-105,30], [-105,30,-100,28],
  [-100,28,-97,26],
  // Brazil borders
  [-58,-34,-55,-23], [-55,-23,-48,-5], [-48,-5,-35,-5],
  // India borders
  [68,24,77,35], [77,35,88,28], [88,28,92,22], [78,8,80,12],
  // China borders (south)
  [105,22,110,18], [98,22,105,22], [88,28,98,22],
  // Russia-Europe border (Urals approximation)
  [60,50,60,55], [60,55,60,60], [60,60,60,65], [60,65,60,70],
  // Middle East
  [35,30,40,20], [40,20,45,30], [45,30,50,25],
  // Central Africa
  [10,5,10,0], [10,0,15,-5], [15,-5,25,-5], [25,-5,30,0], [30,0,30,5],
];

// Country labels [lng, lat, label, fontSize]
const COUNTRY_LABELS: [number, number, string, number][] = [
  [-97, 40, 'USA', 28],
  [-106, 58, 'CANADA', 22],
  [-100, 22, 'MEX', 14],
  [-52, -10, 'BRAZIL', 22],
  [-65, -35, 'ARG', 14],
  [-76, -10, 'PERU', 12],
  [-72, 5, 'COL', 12],
  [-2, 52, 'UK', 12],
  [2, 47, 'FR', 14],
  [10, 51, 'DE', 14],
  [12, 42, 'IT', 12],
  [-4, 40, 'ES', 14],
  [20, 52, 'PL', 12],
  [25, 48, 'UA', 14],
  [38, 56, 'RUSSIA', 28],
  [90, 60, 'SIBERIA', 18],
  [35, 39, 'TR', 14],
  [53, 25, 'UAE', 10],
  [45, 33, 'IRQ', 10],
  [53, 32, 'IRAN', 14],
  [78, 22, 'INDIA', 20],
  [105, 35, 'CHINA', 22],
  [138, 37, 'JP', 16],
  [127, 36, 'KR', 10],
  [20, 0, 'CONGO', 12],
  [3, 8, 'NGA', 14],
  [38, 0, 'KENYA', 12],
  [30, -2, 'TZA', 10],
  [25, -30, 'RSA', 14],
  [25, 65, 'FIN', 10],
  [15, 63, 'SWE', 10],
  [10, 62, 'NOR', 10],
  [135, -25, 'AUSTRALIA', 22],
  [115, -2, 'IDN', 14],
  [102, 15, 'THAI', 10],
  [106, 18, 'VNM', 10],
  [31, 30, 'EGY', 14],
  [47, -20, 'MDG', 10],
  [175, -40, 'NZ', 12],
  [121, 15, 'PHL', 10],
];

// Ocean labels [lng, lat, label]
const OCEAN_LABELS: [number, number, string][] = [
  [-150, 10, 'PACIFIC OCEAN'],
  [-30, 10, 'ATLANTIC OCEAN'],
  [75, -20, 'INDIAN OCEAN'],
  [-160, -40, 'SOUTH PACIFIC'],
  [0, -60, 'SOUTHERN OCEAN'],
  [0, 78, 'ARCTIC OCEAN'],
];

// Cities [lng, lat, name]
const CITIES: [number, number, string][] = [
  [-74, 40.7, 'New York'], [-118, 34, 'Los Angeles'], [-87, 41.9, 'Chicago'],
  [-122, 37.8, 'San Francisco'], [-80, 25.8, 'Miami'], [-95.4, 29.8, 'Houston'],
  [-0.1, 51.5, 'London'], [2.3, 48.9, 'Paris'], [13.4, 52.5, 'Berlin'],
  [-3.7, 40.4, 'Madrid'], [12.5, 41.9, 'Rome'], [23.7, 37.9, 'Athens'],
  [139.7, 35.7, 'Tokyo'], [126.9, 37.5, 'Seoul'], [121.5, 31.2, 'Shanghai'],
  [116.4, 39.9, 'Beijing'], [114.2, 22.3, 'Hong Kong'], [103.8, 1.3, 'Singapore'],
  [100.5, 13.8, 'Bangkok'], [106.8, -6.2, 'Jakarta'],
  [-46.6, -23.5, 'São Paulo'], [-43.2, -22.9, 'Rio'], [-58.4, -34.6, 'Buenos Aires'],
  [-70.7, -33.4, 'Santiago'], [-77, -12, 'Lima'], [-74, 4.6, 'Bogotá'],
  [-99.1, 19.4, 'Mexico City'],
  [77.2, 28.6, 'Delhi'], [72.9, 19.1, 'Mumbai'], [88.4, 22.6, 'Kolkata'],
  [55.3, 25.3, 'Dubai'], [44.4, 33.3, 'Baghdad'], [51.4, 35.7, 'Tehran'],
  [37.6, 55.8, 'Moscow'], [30.3, 59.9, 'St Petersburg'],
  [28.9, 41, 'Istanbul'], [31, 30, 'Cairo'], [36.8, -1.3, 'Nairobi'],
  [3.4, 6.5, 'Lagos'], [18.4, -33.9, 'Cape Town'], [28, -26.2, 'Johannesburg'],
  [151.2, -33.9, 'Sydney'], [144.9, -37.8, 'Melbourne'], [174.8, -41.3, 'Wellington'],
];

export function generateEarthTexture(width = 2048, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Ocean background
  ctx.fillStyle = '#030810';
  ctx.fillRect(0, 0, width, height);

  // Subtle ocean grid
  ctx.strokeStyle = 'rgba(0, 160, 255, 0.03)';
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 10) {
    ctx.beginPath(); ctx.moveTo(0, toY(lat)); ctx.lineTo(width, toY(lat)); ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 10) {
    ctx.beginPath(); ctx.moveTo(toX(lng), 0); ctx.lineTo(toX(lng), height); ctx.stroke();
  }

  // Equator
  ctx.strokeStyle = 'rgba(0, 180, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, toY(0)); ctx.lineTo(width, toY(0)); ctx.stroke();

  // Tropics
  ctx.strokeStyle = 'rgba(0, 180, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(0, toY(23.44)); ctx.lineTo(width, toY(23.44)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, toY(-23.44)); ctx.lineTo(width, toY(-23.44)); ctx.stroke();
  ctx.setLineDash([]);

  // Draw continents - fill
  for (const continent of CONTINENTS) {
    const points = continent.map(([lng, lat]) => ({ x: toX(lng), y: toY(lat) }));

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 200, 255, 0.10)';
    ctx.fill();
  }

  // Draw continents - glow outline (outer)
  for (const continent of CONTINENTS) {
    const points = continent.map(([lng, lat]) => ({ x: toX(lng), y: toY(lat) }));
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.12)';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  // Draw continents - bright outline (inner)
  for (const continent of CONTINENTS) {
    const points = continent.map(([lng, lat]) => ({ x: toX(lng), y: toY(lat) }));
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 230, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Country borders
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const [lng1, lat1, lng2, lat2] of BORDERS) {
    ctx.beginPath();
    ctx.moveTo(toX(lng1), toY(lat1));
    ctx.lineTo(toX(lng2), toY(lat2));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Ocean labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [lng, lat, label] of OCEAN_LABELS) {
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'rgba(0, 120, 180, 0.12)';
    ctx.letterSpacing = '8px';
    ctx.fillText(label, toX(lng), toY(lat));
    ctx.letterSpacing = '0px';
  }

  // Country labels
  for (const [lng, lat, label, fontSize] of COUNTRY_LABELS) {
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(0, 210, 255, 0.22)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, toX(lng), toY(lat));
  }

  // City lights
  for (const [lng, lat, name] of CITIES) {
    const x = toX(lng);
    const y = toY(lat);

    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
    gradient.addColorStop(0, 'rgba(255, 220, 100, 0.7)');
    gradient.addColorStop(0.4, 'rgba(255, 180, 50, 0.25)');
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 10, y - 10, 20, 20);

    // Core
    ctx.fillStyle = 'rgba(255, 235, 160, 0.95)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();

    // City name label
    ctx.font = '9px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + 5, y);
  }

  return canvas;
}
