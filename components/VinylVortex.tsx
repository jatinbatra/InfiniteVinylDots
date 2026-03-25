import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface VinylVortexProps {
  onClose: () => void;
}

const PARTICLE_COUNT = 12000;
const NUM_RINGS = 60;
const FFT_SIZE = 256;
const FREQ_BINS = FFT_SIZE / 2;

// ═══════════════════════════════════════════════════════════
//  SHADERS
// ═══════════════════════════════════════════════════════════

const particleVert = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aRingNorm;
  attribute float aRadius;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uSpinSpeed;
  uniform float uBass;
  uniform float uGlitch;
  uniform float uPixelRatio;
  uniform sampler2D uFreqData;

  varying vec3 vColor;
  varying float vAlpha;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    float freq = texture2D(uFreqData, vec2(aRingNorm, 0.5)).r;

    float speed = uSpinSpeed / (0.3 + aRingNorm * 0.7);
    float angle = aPhase + uTime * speed;

    float r = aRadius + freq * 0.15 + uBass * 0.08 * (1.0 - aRingNorm);
    r *= 1.0 + sin(uTime * 0.4) * 0.02;

    vec3 pos;
    pos.x = cos(angle) * r;
    pos.y = sin(angle) * r;
    pos.z = sin(aPhase * 3.0 + uTime * 0.2) * 0.02 + freq * 0.05;

    if (uGlitch > 0.5) {
      pos += vec3(
        (hash(aPhase + uTime) - 0.5) * 0.4,
        (hash(aPhase * 2.0 + uTime) - 0.5) * 0.4,
        (hash(aPhase * 3.0 + uTime) - 0.5) * 0.2
      );
    }

    vColor = aColor + freq * vec3(0.2, 0.05, 0.3);
    vColor = clamp(vColor, 0.0, 1.5);
    vAlpha = 0.5 + freq * 0.5;

    if (uGlitch > 0.5) vColor = mix(vColor, vec3(1.0), 0.6);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (1.0 + freq * 2.0 + uBass * 0.5) * uPixelRatio * (200.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const particleFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = pow(1.0 - smoothstep(0.0, 0.5, d), 1.5);
    gl_FragColor = vec4(vColor * glow, vAlpha * glow);
  }
`;

const fadeVert = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const fadeFrag = /* glsl */ `
  uniform float uFade;
  void main() { gl_FragColor = vec4(0.0, 0.0, 0.003, uFade); }
`;

const postVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const postFrag = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uAberration;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 dir = uv - vec2(0.5);
    float dist = length(dir);

    float aberr = uAberration * dist * 0.02;
    float r = texture2D(tDiffuse, uv + dir * aberr).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - dir * aberr * 1.2).b;
    vec3 color = vec3(r, g, b);

    vec3 bloom = vec3(0.0);
    for (int i = 1; i <= 4; i++) {
      float s = float(i) * 0.004;
      bloom += texture2D(tDiffuse, uv + vec2(s, 0.0)).rgb
             + texture2D(tDiffuse, uv - vec2(s, 0.0)).rgb
             + texture2D(tDiffuse, uv + vec2(0.0, s)).rgb
             + texture2D(tDiffuse, uv - vec2(0.0, s)).rgb;
    }
    color += bloom / 16.0 * 0.35;
    color *= smoothstep(0.0, 1.0, 1.0 - dist * 0.9);
    color -= sin(uv.y * uResolution.y * 0.8) * 0.012;
    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════

const VinylVortex: React.FC<VinylVortexProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [showUI, setShowUI] = useState(true);
  const [audioMode, setAudioMode] = useState<'demo' | 'file' | 'mic'>('demo');
  const uiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mouse/touch state — refs for animation loop access
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const targetSpin = useRef(1.0);

  // ── Three.js setup ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000005);
    renderer.autoClear = false;

    // Render target
    let rt = new THREE.WebGLRenderTarget(w * dpr, h * dpr);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 2;

    const quadCamera = new THREE.Camera(); // identity — shaders output clip coords

    // ── Scenes ──
    const particleScene = new THREE.Scene();
    const fadeScene = new THREE.Scene();
    const postScene = new THREE.Scene();

    const quadGeo = new THREE.PlaneGeometry(2, 2);

    // ── Fade quad (trail effect) ──
    const fadeMat = new THREE.ShaderMaterial({
      vertexShader: fadeVert, fragmentShader: fadeFrag,
      uniforms: { uFade: { value: 0.04 } },
      transparent: true, depthTest: false, depthWrite: false,
    });
    fadeScene.add(new THREE.Mesh(quadGeo, fadeMat));

    // ── Post-processing quad ──
    const postMat = new THREE.ShaderMaterial({
      vertexShader: postVert, fragmentShader: postFrag,
      uniforms: {
        tDiffuse: { value: null },
        uAberration: { value: 0 },
        uResolution: { value: new THREE.Vector2(w * dpr, h * dpr) },
      },
      depthTest: false, depthWrite: false,
    });
    postScene.add(new THREE.Mesh(quadGeo, postMat));

    // ── Frequency data texture ──
    const freqData = new Uint8Array(FREQ_BINS);
    const freqTexData = new Uint8Array(FREQ_BINS * 4);
    for (let i = 0; i < FREQ_BINS * 4; i++) freqTexData[i] = 0;
    const freqTex = new THREE.DataTexture(freqTexData, FREQ_BINS, 1, THREE.RGBAFormat);
    freqTex.minFilter = THREE.LinearFilter;
    freqTex.magFilter = THREE.LinearFilter;
    freqTex.needsUpdate = true;

    // ── Particles ──
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const ringNorms = new Float32Array(PARTICLE_COUNT);
    const radii = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    let idx = 0;
    for (let ring = 0; ring < NUM_RINGS && idx < PARTICLE_COUNT; ring++) {
      const rn = ring / (NUM_RINGS - 1);
      const radius = 0.15 + rn * 0.85;
      const count = Math.floor(200 * (0.5 + rn));
      for (let i = 0; i < count && idx < PARTICLE_COUNT; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.04;
        const r = radius + (Math.random() - 0.5) * 0.008;
        positions[idx * 3] = Math.cos(angle) * r;
        positions[idx * 3 + 1] = Math.sin(angle) * r;
        positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.01;
        sizes[idx] = 1.2 + Math.random() * 1.5;
        phases[idx] = angle;
        ringNorms[idx] = rn;
        radii[idx] = r;
        // Cyan → magenta gradient
        const t = rn * rn;
        colors[idx * 3] = t * 1.0;
        colors[idx * 3 + 1] = (1.0 - t) * 0.85;
        colors[idx * 3 + 2] = 1.0 - t * 0.2;
        idx++;
      }
    }
    // Fill remaining as scattered "cosmic horror" particles
    while (idx < PARTICLE_COUNT) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.1 + Math.random() * 1.3;
      positions[idx * 3] = Math.cos(angle) * r;
      positions[idx * 3 + 1] = Math.sin(angle) * r;
      positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.15;
      sizes[idx] = 0.5 + Math.random() * 0.8;
      phases[idx] = angle;
      ringNorms[idx] = Math.random();
      radii[idx] = r;
      colors[idx * 3] = 0.7 + Math.random() * 0.3;
      colors[idx * 3 + 1] = 0.0;
      colors[idx * 3 + 2] = 0.2 + Math.random() * 0.3;
      idx++;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute('aRingNorm', new THREE.Float32BufferAttribute(ringNorms, 1));
    geo.setAttribute('aRadius', new THREE.Float32BufferAttribute(radii, 1));
    geo.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));

    const particleMat = new THREE.ShaderMaterial({
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      uniforms: {
        uTime: { value: 0 },
        uSpinSpeed: { value: 1.0 },
        uBass: { value: 0 },
        uGlitch: { value: 0 },
        uPixelRatio: { value: dpr },
        uFreqData: { value: freqTex },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    particleScene.add(new THREE.Points(geo, particleMat));

    // ── Central void ──
    const voidMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 64),
      new THREE.MeshBasicMaterial({ color: 0x000005, depthTest: false, depthWrite: false }),
    );
    particleScene.add(voidMesh);

    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff, transparent: true, opacity: 0.25,
      depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const glowRing = new THREE.Mesh(new THREE.RingGeometry(0.135, 0.155, 64), glowRingMat);
    particleScene.add(glowRing);

    // ── Animation state ──
    const clock = new THREE.Clock();
    let animId = 0;
    let spinSpeed = 1.0;
    let prevSpinDir = 1;
    let glitchTimer = 0;
    let randomGlitchCooldown = 8 + Math.random() * 7;

    function animate() {
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();

      // ── Spin speed lerp ──
      spinSpeed += (targetSpin.current - spinSpeed) * 0.05;
      const spinDir = Math.sign(spinSpeed);
      if (spinDir !== 0 && spinDir !== prevSpinDir) {
        glitchTimer = 0.12; // scratch glitch on direction change
      }
      prevSpinDir = spinDir || prevSpinDir;

      // ── Random ambient glitch ──
      randomGlitchCooldown -= delta;
      if (randomGlitchCooldown <= 0) {
        glitchTimer = 0.08;
        randomGlitchCooldown = 8 + Math.random() * 7;
      }
      glitchTimer = Math.max(0, glitchTimer - delta);

      // ── Audio analysis ──
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(freqData);
      } else {
        // Demo mode — synthetic pulsing
        for (let i = 0; i < FREQ_BINS; i++) {
          const bass = i < 8 ? (Math.sin(time * 2.5 + i * 0.4) * 0.5 + 0.5) * 220 : 0;
          const mid = i >= 8 && i < 40 ? (Math.sin(time * 1.8 + i * 0.2) * 0.4 + 0.3) * 180 : 0;
          const hi = i >= 40 ? (Math.sin(time * 4 + i * 0.15) * 0.2 + 0.15) * 120 : 0;
          freqData[i] = Math.min(255, Math.floor(bass + mid + hi));
        }
      }

      // Copy to texture
      for (let i = 0; i < FREQ_BINS; i++) {
        freqTexData[i * 4] = freqData[i];
        freqTexData[i * 4 + 1] = freqData[i];
        freqTexData[i * 4 + 2] = freqData[i];
        freqTexData[i * 4 + 3] = 255;
      }
      freqTex.needsUpdate = true;

      // Bass/mid/high averages
      let bass = 0;
      for (let i = 0; i < 8; i++) bass += freqData[i];
      bass = bass / 8 / 255;

      // ── Update uniforms ──
      particleMat.uniforms.uTime.value = time;
      particleMat.uniforms.uSpinSpeed.value = spinSpeed;
      particleMat.uniforms.uBass.value = bass;
      particleMat.uniforms.uGlitch.value = glitchTimer > 0 ? 1.0 : 0.0;

      // Trail fade — more trails when spinning fast
      fadeMat.uniforms.uFade.value = 0.04 + Math.abs(spinSpeed - 1) * 0.06;

      // Post-processing — chromatic aberration scales with spin deviation
      const aberration = Math.abs(spinSpeed - 1) * 3.0 + bass * 1.5;
      postMat.uniforms.uAberration.value = aberration;
      postMat.uniforms.tDiffuse.value = rt.texture;

      // Glow ring pulse
      glowRingMat.opacity = 0.15 + bass * 0.6;
      glowRing.scale.setScalar(1.0 + bass * 0.3);

      // Camera subtle movement
      camera.position.y = Math.sin(time * 0.3) * 0.03;
      camera.position.z = 2.0 - bass * 0.2;
      camera.lookAt(0, 0, 0);

      // ── Render ──
      renderer.setRenderTarget(rt);
      renderer.render(fadeScene, quadCamera);
      renderer.render(particleScene, camera);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(postScene, quadCamera);
    }

    animate();

    // ── Resize handler ──
    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rt.setSize(w * dpr, h * dpr);
      postMat.uniforms.uResolution.value.set(w * dpr, h * dpr);
    };
    window.addEventListener('resize', onResize);

    // ── Keyboard ──
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      renderer.dispose();
      rt.dispose();
      geo.dispose();
      particleMat.dispose();
      fadeMat.dispose();
      postMat.dispose();
      quadGeo.dispose();
      freqTex.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
      if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
      analyserRef.current = null;
    };
  }, []);

  // ── Audio handlers ──
  const ensureAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const stopCurrentAudio = () => {
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    analyserRef.current = null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCurrentAudio();
    const ctx = ensureAudioCtx();
    const audio = new Audio(URL.createObjectURL(file));
    audio.loop = true;
    audio.crossOrigin = 'anonymous';

    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audio.play().catch(() => {});
    audioElRef.current = audio;
    analyserRef.current = analyser;
    setAudioMode('file');
  };

  const handleMicClick = async () => {
    stopCurrentAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = ensureAudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      micStreamRef.current = stream;
      analyserRef.current = analyser;
      setAudioMode('mic');
    } catch {
      console.warn('Mic access denied');
    }
  };

  const handleDemoClick = () => {
    stopCurrentAudio();
    setAudioMode('demo');
  };

  // ── Mouse / Touch for turntable ──
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Auto-show UI
    setShowUI(true);
    if (uiTimer.current) clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setShowUI(false), 3000);

    if (!isDragging.current) return;
    const dx = (e.clientX - dragStartX.current) / (window.innerWidth * 0.25);
    targetSpin.current = Math.max(-3, Math.min(5, 1.0 + dx * 3.0));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    targetSpin.current = 1.0;
  };

  return (
    <div
      className="fixed inset-0 z-[300] cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* UI overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          showUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top left label */}
        <div className="absolute top-5 left-5">
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: '#00D9FF80' }}>
            Turntable God Mode
          </div>
          <div className="text-white/20 text-[10px] mt-1">Drag horizontally to spin</div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="pointer-events-auto absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Audio controls */}
        <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {(['demo', 'file', 'mic'] as const).map(mode => (
            <button
              key={mode}
              onClick={
                mode === 'demo' ? handleDemoClick :
                mode === 'file' ? () => fileInputRef.current?.click() :
                handleMicClick
              }
              className={`px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all border ${
                audioMode === mode
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
              }`}
            >
              {mode === 'demo' ? 'Demo' : mode === 'file' ? 'Upload Track' : 'Use Mic'}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
};

export default VinylVortex;
