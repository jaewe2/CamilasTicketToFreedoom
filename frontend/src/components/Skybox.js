// src/components/Skybox.js
import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, BackSide } from "three";

export default function Skybox() {
  const [
    px, nx,
    py, ny,
    pz, nz
  ] = useLoader(TextureLoader, [
    "/sky/px.jpg",
    "/sky/nx.jpg",
    "/sky/py.jpg",
    "/sky/ny.jpg",
    "/sky/pz.jpg",
    "/sky/nz.jpg"
  ]);

  const materials = [
    px, nx,
    py, ny,
    pz, nz
  ].map((map) => (
    <meshBasicMaterial attach="material" map={map} side={BackSide} key={map.image.currentSrc} />
  ));

  return (
    <mesh scale={[100, 100, 100]}>
      <boxGeometry args={[1, 1, 1]} />
      {materials}
    </mesh>
  );
}
