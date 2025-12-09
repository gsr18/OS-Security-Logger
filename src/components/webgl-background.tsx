"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 500 }) {
  const mesh = useRef<THREE.Points>(null);
  const light = useRef<THREE.PointLight>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        colors[i * 3] = 0.2;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.4;
      } else if (colorChoice < 0.6) {
        colors[i * 3] = 0.2;
        colors[i * 3 + 1] = 0.5;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 0.8;
      }

      sizes[i] = Math.random() * 2 + 0.5;
    }

    return { positions, colors, sizes };
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.02;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
    if (light.current) {
      light.current.position.x = Math.sin(state.clock.elapsedTime) * 3;
      light.current.position.y = Math.cos(state.clock.elapsedTime) * 3;
    }
  });

  return (
    <>
      <pointLight ref={light} intensity={2} color="#00ff88" />
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={particles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[30, 30, "#00ff88", "#003322"]}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function NetworkLines({ count = 50 }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const lines = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const colors = new Float32Array(count * 6);
    
    for (let i = 0; i < count; i++) {
      const x1 = (Math.random() - 0.5) * 15;
      const y1 = (Math.random() - 0.5) * 15;
      const z1 = (Math.random() - 0.5) * 15;
      
      const x2 = x1 + (Math.random() - 0.5) * 3;
      const y2 = y1 + (Math.random() - 0.5) * 3;
      const z2 = z1 + (Math.random() - 0.5) * 3;
      
      positions[i * 6] = x1;
      positions[i * 6 + 1] = y1;
      positions[i * 6 + 2] = z1;
      positions[i * 6 + 3] = x2;
      positions[i * 6 + 4] = y2;
      positions[i * 6 + 5] = z2;
      
      colors[i * 6] = 0.0;
      colors[i * 6 + 1] = 0.8;
      colors[i * 6 + 2] = 0.5;
      colors[i * 6 + 3] = 0.0;
      colors[i * 6 + 4] = 0.4;
      colors[i * 6 + 5] = 0.3;
    }
    
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count * 2}
          array={lines.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count * 2}
          array={lines.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.3} />
    </lineSegments>
  );
}

function DataStream() {
  const groupRef = useRef<THREE.Group>(null);
  
  const streams = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      x: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 10,
      speed: 0.5 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const stream = streams[i];
        child.position.y = ((state.clock.elapsedTime * stream.speed + stream.offset) % 10) - 5;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {streams.map((stream, i) => (
        <mesh key={i} position={[stream.x, 0, stream.z]}>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function WebGLBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0a] via-[#0d1a12] to-[#0a0f0a]" />
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <fog attach="fog" args={["#0a0f0a", 5, 25]} />
        <ambientLight intensity={0.1} />
        <Particles count={400} />
        <NetworkLines count={60} />
        <GridFloor />
        <DataStream />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent pointer-events-none" />
    </div>
  );
}
