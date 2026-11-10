"use client";

/**
 * Scene – R3F-lerret med egne lys (ingen eksterne HDR-filer: alt selvhostet).
 * Brukes av <Model3dViewer>. Hold scener innenfor budsjettet i 3D-PIPELINE.md.
 */
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";

type Props = {
  children: React.ReactNode;
  interactive?: boolean;
  autoRotate?: boolean;
  className?: string;
};

export function Scene({
  children,
  interactive = true,
  autoRotate = true,
  className,
}: Props) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.8, 4.2], fov: 38 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      frameloop={autoRotate ? "always" : "demand"}
    >
      {/* Trepunktslys i stedet for HDR-miljø: forutsigbart, selvhostet, billig. */}
      <hemisphereLight args={["#ffffff", "#b8c0cc", 0.9]} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#dfe8ff" />
      <spotLight position={[0, 5, -6]} intensity={0.8} angle={0.5} penumbra={1} />
      <Suspense fallback={null}>{children}</Suspense>
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.35}
        scale={8}
        blur={2.4}
        far={2.5}
      />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enabled={interactive}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}
