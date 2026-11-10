"use client";

/**
 * Model – laster en .glb/.gltf (Draco støttes via drei sin standard-dekoder).
 * Uten `src` vises en demo-geometri i merkevarefarger, slik at blokken alltid
 * fungerer i template og i Puck.
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import type { Group } from "three";

export function Model({ src }: { src?: string }) {
  if (src) return <GltfModel src={src} />;
  return <DemoGeometry />;
}

function GltfModel({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} />;
}

function DemoGeometry() {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });
  const brand = cssVar("--brand", "#0f4c5c");
  const accent = cssVar("--accent", "#c2460a");
  return (
    <group ref={ref}>
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <torusKnotGeometry args={[0.7, 0.22, 180, 24]} />
          <meshStandardMaterial color={brand} metalness={0.3} roughness={0.35} />
        </mesh>
      </Float>
      <mesh position={[1.4, -0.3, -0.4]} castShadow>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[-1.5, -0.4, 0.2]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
    </group>
  );
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  );
}
