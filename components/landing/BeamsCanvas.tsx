"use client";

import { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── GLSL ───────────────────────────────────────────────────────── */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uAlpha;
  uniform float uSpeed;
  uniform float uNoiseScale;
  varying vec2  vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1,0)), f.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
      f.y
    );
  }

  void main() {
    float beam = smoothstep(0.0, 0.45, vUv.x) * smoothstep(1.0, 0.55, vUv.x);
    beam = pow(beam, 1.6);
    float t = uTime * uSpeed * 0.3;
    float n = mix(
      noise(vec2(vUv.y * uNoiseScale * 3.0 - t, t * 0.4)),
      noise(vec2(vUv.y * uNoiseScale * 1.5 + t * 0.5, t * 0.2 + 17.3)),
      0.4
    ) * 0.6 + 0.4;
    float edge = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
    gl_FragColor = vec4(uColor, beam * n * edge * uAlpha);
  }
`;

/* ─── Single beam ───────────────────────────────────────────────── */

interface BeamProps {
  rotZ: number;
  posZ: number;
  alpha: number;
  speed: number;
}

function Beam({ rotZ, posZ, alpha, speed }: BeamProps) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:       { value: 0 },
      uColor:      { value: new THREE.Color("#C9A86A") },
      uAlpha:      { value: alpha },
      uSpeed:      { value: speed },
      uNoiseScale: { value: 1.4 },
    },
    vertexShader:   VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    side:        THREE.DoubleSide,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.getElapsedTime();
  });

  const geo = useMemo(() => new THREE.PlaneGeometry(1.2, 14, 1, 64), []);

  return (
    <mesh
      rotation={[0, 0, rotZ]}
      position={[0, 0, posZ]}
      geometry={geo}
      material={mat}
    />
  );
}

/* ─── Fan of beams ───────────────────────────────────────────────── */

function BeamField() {
  const beams = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      const rotZ = ((t - 0.5) * 44 * Math.PI) / 180;
      const alpha = 0.06 + 0.11 * Math.sin(t * Math.PI);
      const speed = 0.5 + (i % 3) * 0.35;
      return { rotZ, alpha, speed, posZ: -i * 0.008 };
    }), []);

  return (
    <group rotation={[0, 0, (43 * Math.PI) / 180]}>
      {beams.map((b, i) => (
        <Beam key={i} rotZ={b.rotZ} posZ={b.posZ} alpha={b.alpha} speed={b.speed} />
      ))}
    </group>
  );
}

/* ─── Canvas export ─────────────────────────────────────────────── */

export default function BeamsCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0D0B07"]} />
      <BeamField />
    </Canvas>
  );
}
