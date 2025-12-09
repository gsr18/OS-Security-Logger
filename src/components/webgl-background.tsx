"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ count = 500, isDark = true }) {
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
      if (isDark) {
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
      } else {
        if (colorChoice < 0.3) {
          colors[i * 3] = 0.02;
          colors[i * 3 + 1] = 0.59;
          colors[i * 3 + 2] = 0.41;
        } else if (colorChoice < 0.6) {
          colors[i * 3] = 0.1;
          colors[i * 3 + 1] = 0.4;
          colors[i * 3 + 2] = 0.6;
        } else {
          colors[i * 3] = 0.02;
          colors[i * 3 + 1] = 0.65;
          colors[i * 3 + 2] = 0.5;
        }
      }

      sizes[i] = Math.random() * 2 + 0.5;
    }

    return { positions, colors, sizes };
  }, [count, isDark]);

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
      <pointLight ref={light} intensity={2} color={isDark ? "#00ff88" : "#059669"} />
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
          opacity={isDark ? 0.8 : 0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

function GridFloor({ isDark = true }) {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[30, 30, isDark ? "#00ff88" : "#059669", isDark ? "#003322" : "#e0f5ec"]}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function NetworkLines({ count = 50, isDark = true }) {
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
      
      if (isDark) {
        colors[i * 6] = 0.0;
        colors[i * 6 + 1] = 0.8;
        colors[i * 6 + 2] = 0.5;
        colors[i * 6 + 3] = 0.0;
        colors[i * 6 + 4] = 0.4;
        colors[i * 6 + 5] = 0.3;
      } else {
        colors[i * 6] = 0.02;
        colors[i * 6 + 1] = 0.59;
        colors[i * 6 + 2] = 0.41;
        colors[i * 6 + 3] = 0.02;
        colors[i * 6 + 4] = 0.4;
        colors[i * 6 + 5] = 0.3;
      }
    }
    
    return { positions, colors };
  }, [count, isDark]);

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
      <lineBasicMaterial vertexColors transparent opacity={isDark ? 0.3 : 0.2} />
    </lineSegments>
  );
}

function DataStream({ isDark = true }) {
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
          <meshBasicMaterial color={isDark ? "#00ff88" : "#059669"} transparent opacity={isDark ? 0.6 : 0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function WebGLBackground() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    checkTheme();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <div 
        className="absolute inset-0 transition-colors duration-300"
        style={{
          background: isDark 
            ? "linear-gradient(to bottom, #0a0f0a, #0d1a12, #0a0f0a)" 
            : "linear-gradient(to bottom, #f0f7f4, #e8f5ee, #f0f7f4)"
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <fog attach="fog" args={[isDark ? "#0a0f0a" : "#f0f7f4", 5, 25]} />
        <ambientLight intensity={isDark ? 0.1 : 0.3} />
        <Particles count={400} isDark={isDark} />
        <NetworkLines count={60} isDark={isDark} />
        <GridFloor isDark={isDark} />
        <DataStream isDark={isDark} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent pointer-events-none" />
    </div>
  );
}