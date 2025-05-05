// src/components/Walker.js
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

export default function Walker({
  initialX = 0,
  amplitude = 2,
  speed = 1,
  scale = 0.5,
  role = "student", // "student" | "faculty" | "connectee"
}) {
  const group = useRef();
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime() * speed;
    group.current.position.x = initialX + Math.sin(t) * amplitude;
    const swing = Math.sin(t) * 0.6;
    leftLeg.current.rotation.x = swing;
    rightLeg.current.rotation.x = -swing;
    leftArm.current.rotation.x = -swing;
    rightArm.current.rotation.x = swing;
    // always face the camera
    group.current.lookAt(camera.position);
  });

  const roleColor = {
    student: "#FFC72C",
    faculty: "#00A680",
    connectee: "#4B0082",
  }[role] || "#FFF";

  return (
    <group ref={group} scale={scale}>
      {/* Head */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffeecc" />
      </mesh>

      {/* Label above head */}
      <Text
        position={[0, 1.8, 0]}
        fontSize={0.15}
        color={roleColor}
        anchorX="center"
        anchorY="bottom"
        billboard
        material-depthTest={false}
        material-toneMapped={false}
      >
        {role.toUpperCase()}
      </Text>

      {/* Mortarboard */}
      <group position={[0, 1.55, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.2, 4]} />
          <meshStandardMaterial color="#860038" />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color="#860038" />
        </mesh>
      </group>

      {/* Gown */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.2, 0.4, 1.0, 16]} />
        <meshStandardMaterial color="#860038" emissive="#4a0025" />
      </mesh>

      {/* Arms */}
      <group ref={leftArm} position={[0.35, 1.0, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#860038" />
        </mesh>
      </group>
      <group ref={rightArm} position={[-0.35, 1.0, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#860038" />
        </mesh>
      </group>

      {/* Legs */}
      <group ref={leftLeg} position={[0.15, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.15, 0.7, 0.15]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
      <group ref={rightLeg} position={[-0.15, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.15, 0.7, 0.15]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
}
