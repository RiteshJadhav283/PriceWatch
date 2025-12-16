import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Animated particle field
function ParticleField({ count = 3000 }) {
    const ref = useRef();
    const mouseRef = useRef({ x: 0, y: 0 });

    // Generate random particle positions
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Spread particles in a sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 3 + Math.random() * 5;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Orange to amber gradient colors
            const t = Math.random();
            colors[i * 3] = 1; // R
            colors[i * 3 + 1] = 0.4 + t * 0.3; // G (0.4-0.7)
            colors[i * 3 + 2] = 0.2 + t * 0.1; // B (0.2-0.3)
        }

        return { positions, colors };
    }, [count]);

    // Handle mouse movement
    const handlePointerMove = (e) => {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    // Animate particles
    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.getElapsedTime();

            // Slow rotation
            ref.current.rotation.x = time * 0.03;
            ref.current.rotation.y = time * 0.05;

            // React to mouse
            ref.current.rotation.x += mouseRef.current.y * 0.1;
            ref.current.rotation.y += mouseRef.current.x * 0.1;
        }
    });

    return (
        <group onPointerMove={handlePointerMove}>
            <Points ref={ref} positions={particles.positions} colors={particles.colors} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    vertexColors
                    size={0.02}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

// Floating geometric shapes
function FloatingShape({ position, rotationSpeed, scale, color }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.getElapsedTime();
            ref.current.rotation.x = time * rotationSpeed.x;
            ref.current.rotation.y = time * rotationSpeed.y;
            ref.current.rotation.z = time * rotationSpeed.z;

            // Gentle floating motion
            ref.current.position.y = position[1] + Math.sin(time * 0.5) * 0.3;
        }
    });

    return (
        <mesh ref={ref} position={position} scale={scale}>
            <icosahedronGeometry args={[1, 0]} />
            <meshBasicMaterial
                color={color}
                wireframe
                transparent
                opacity={0.3}
            />
        </mesh>
    );
}

// Glowing ring
function GlowRing({ radius = 4, color = '#FF6B35' }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            const time = state.clock.getElapsedTime();
            ref.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.3) * 0.1;
            ref.current.rotation.z = time * 0.1;
        }
    });

    return (
        <mesh ref={ref}>
            <torusGeometry args={[radius, 0.02, 16, 100]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
    );
}

// Main Three.js background component
function ThreeBackground() {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none'
        }}>
            <Canvas
                camera={{ position: [0, 0, 6], fov: 60 }}
                style={{ background: 'transparent' }}
                gl={{ alpha: true, antialias: true }}
            >
                <ambientLight intensity={0.5} />

                {/* Main particle field */}
                <ParticleField count={2500} />

                {/* Floating geometric shapes */}
                <FloatingShape
                    position={[-3, 2, -2]}
                    rotationSpeed={{ x: 0.3, y: 0.5, z: 0.2 }}
                    scale={0.8}
                    color="#FF6B35"
                />
                <FloatingShape
                    position={[3.5, -1.5, -3]}
                    rotationSpeed={{ x: 0.2, y: 0.3, z: 0.4 }}
                    scale={0.6}
                    color="#FFB347"
                />
                <FloatingShape
                    position={[-2.5, -2, -1]}
                    rotationSpeed={{ x: 0.4, y: 0.2, z: 0.3 }}
                    scale={0.5}
                    color="#FF8C5A"
                />
                <FloatingShape
                    position={[2, 2.5, -2.5]}
                    rotationSpeed={{ x: 0.25, y: 0.35, z: 0.15 }}
                    scale={0.7}
                    color="#FF6B6B"
                />

                {/* Glowing rings */}
                <GlowRing radius={3.5} color="#FF6B35" />
                <GlowRing radius={4.5} color="#FFB347" />
            </Canvas>
        </div>
    );
}

export default ThreeBackground;
