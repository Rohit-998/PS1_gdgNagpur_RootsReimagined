'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function BottleModel({ capRef }) {
  const { scene } = useGLTF('/pill_bottle.glb');
  
  // Keep track of the original cap position/rotation to animate relative to it
  const [capInit, setCapInit] = useState(null);

  useEffect(() => {
    // 1. Hide the built-in pills (the ones named Sphere...)
    // 2. Find the cap and store its initial transform
    let foundCap = null;

    scene.traverse(child => {
      if (child.name.startsWith('Sphere')) {
        child.visible = false;
      }
      if (child.name === 'cap' || child.name === 'cap_pillbottlecap_0') {
        foundCap = child;
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 1.5;
          child.material.needsUpdate = true;
        }
      }
    });

    if (foundCap) {
      capRef.current = foundCap;
      setCapInit({
        y: foundCap.position.y,
        x: foundCap.position.x,
        ry: foundCap.rotation.y,
        rz: foundCap.rotation.z
      });
    }

    // 3. Normalise the scale of the ENTIRE scene so it is always 2 units tall
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const ctr = box.getCenter(new THREE.Vector3());
    
    // Sub center to align to origin
    scene.position.sub(ctr);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.0 / maxDim;
    scene.scale.setScalar(scale);

  }, [scene, capRef]);

  // We expose the initial state on the ref so useFrame can read it
  if (capRef.current && capInit) {
    capRef.current.userData.init = capInit;
  }

  return <primitive object={scene} />;
}

const PILL_COLORS = ['#D2F803', '#5B48FF', '#FF6B6B'];

function Scene({ scrollProgress }) {
  const bottleRef = useRef();
  const capRef = useRef();

  const pill0 = useRef();
  const pill1 = useRef();
  const pill2 = useRef();
  const pillRefs = [pill0, pill1, pill2];

  const physics = useRef([
    { phase: 'hidden', vy: 0 },
    { phase: 'hidden', vy: 0 },
    { phase: 'hidden', vy: 0 },
  ]);

  const EXIT = [
    { x: -0.9, y: 1.5, rz: -0.5, rx: 2.1, zRot: 1.3 },
    { x:  0.0, y: 2.0, rz:  0.1, rx: 1.4, zRot: 2.2 },
    { x:  0.9, y: 1.4, rz:  0.4, rx: 1.8, zRot: 0.9 },
  ];

  useFrame((_, delta) => {
    const p = scrollProgress.current; 
    const bottle = bottleRef.current;
    if (!bottle) return;

    // ── Phase 1 · 0–20% · Bottle rests ──────────────────────
    if (p <= 0.20) {
      const t = p / 0.20;
      bottle.rotation.set(0.08, -0.25, 0);
      bottle.position.y = t * 0.08;
      
      if (capRef.current && capRef.current.userData.init) {
        const init = capRef.current.userData.init;
        capRef.current.position.y = init.y;
        capRef.current.position.x = init.x;
        capRef.current.rotation.y = init.ry;
        capRef.current.rotation.z = init.rz;
      }
    }

    // ── Phase 2 · 20–40% · Cap unscrews ──────────────────────
    if (p > 0.20 && p <= 0.40) {
      const t = (p - 0.20) / 0.20;
      
      // Keep bottle still
      bottle.rotation.set(0.08, -0.25, 0);
      bottle.position.y = 0.08;

      if (capRef.current && capRef.current.userData.init) {
        const init = capRef.current.userData.init;
        // Cap rotates and lifts slightly
        capRef.current.rotation.y = init.ry + t * Math.PI * 3; // unscrew 1.5 times
        capRef.current.position.y = init.y + t * 0.6; // lift up in local space (since scene is scaled)
        capRef.current.position.x = init.x;
        capRef.current.rotation.z = init.rz;
      }
    }

    // ── Phase 3 · 40–60% · Cap fully detaches, pills become visible ───
    if (p > 0.40 && p <= 0.60) {
      const t = (p - 0.40) / 0.20;

      if (capRef.current && capRef.current.userData.init) {
        const init = capRef.current.userData.init;
        // Cap flies off completely
        capRef.current.rotation.y = init.ry + Math.PI * 3 + t * Math.PI;
        capRef.current.rotation.z = init.rz - t * 0.5; // tumble
        capRef.current.position.y = init.y + 0.6 + t * 2.0; 
        capRef.current.position.x = init.x - t * 2.0;
      }

      pillRefs.forEach((ref, i) => {
        if (!ref.current) return;
        ref.current.visible = true;
        // Pills rise up inside the bottle
        ref.current.position.set(
          (i - 1) * 0.18,          
          0.1 + t * 0.45,  // emerge         
          (i === 1 ? 0.12 : 0.05),
        );
        ref.current.rotation.set(t * 0.3, 0, (i - 1) * 0.15);
        physics.current[i].phase = 'visible';
      });
    } else if (p <= 0.40) {
      // Hide pills before phase 3
      pillRefs.forEach(ref => { if(ref.current) ref.current.visible = false; });
    }

    // ── Phase 4 · 60–80% · Pills exit on trajectories ─────────────────
    if (p > 0.60 && p <= 0.80) {
      const t = (p - 0.60) / 0.20;
      pillRefs.forEach((ref, i) => {
        if (!ref.current) return;
        ref.current.visible = true;
        const e = EXIT[i];
        const tAdj = Math.max(0, t - i * 0.06); 
        ref.current.position.set(
          THREE.MathUtils.lerp((i - 1) * 0.18, e.x, tAdj),
          THREE.MathUtils.lerp(0.55, e.y, tAdj),
          THREE.MathUtils.lerp(0.05, 0.25, tAdj),
        );
        ref.current.rotation.set(tAdj * 1.8, 0, e.rz * tAdj);
        physics.current[i].phase = 'exiting';
      });
    }

    // ── Phase 5 · 80–100% · Freefall ──────────────────────────────────
    if (p > 0.80) {
      pillRefs.forEach((ref, i) => {
        if (!ref.current) return;
        const ps = physics.current[i];

        if (ps.phase === 'exiting' || ps.phase === 'visible') {
          ps.phase = 'freefall';
          ps.vy    = 0.2; 
        }

        if (ps.phase === 'freefall') {
          ps.vy -= 9.8 * delta * 0.55;
          ref.current.position.y += ps.vy * delta;
          ref.current.rotation.x += EXIT[i].rx * delta;
          ref.current.rotation.z += EXIT[i].zRot * delta;

          if (ref.current.position.y < -2.8) {
            ref.current.position.y = -2.8;
            ps.vy = -ps.vy * 0.40; 
            if (Math.abs(ps.vy) < 0.04) {
              ps.vy   = 0;
              ps.phase = 'settled';
            }
          }
        }

        if (ps.phase === 'settled') {
          ref.current.rotation.x *= 0.92;
          ref.current.rotation.z *= 0.92;
        }
      });
    }
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[4, 7, 3]}
        intensity={2.4}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-far={15}
      />
      <directionalLight position={[-5, 2, -2]} intensity={0.55} color="#c8e0ff" />
      <pointLight position={[0, 5, -4]} intensity={1.0} color="#ffffff" />

      <group ref={bottleRef}>
        <Suspense fallback={
          <mesh castShadow position={[0,0,0]}>
            <boxGeometry args={[0.6, 1.4, 0.6]} />
            <meshStandardMaterial color="#5B48FF" roughness={0.3} />
          </mesh>
        }>
          <BottleModel capRef={capRef} />
        </Suspense>

        {/* Custom Pills */}
        {[pill0, pill1, pill2].map((ref, i) => (
          <mesh
            key={i}
            ref={ref}
            position={[(i - 1) * 0.18, 0.1, 0.05]}
            visible={false}
            castShadow
          >
            <capsuleGeometry args={[0.09, 0.22, 8, 16]} />
            <meshStandardMaterial
              color={PILL_COLORS[i]}
              roughness={0.12}
              metalness={0.06}
            />
          </mesh>
        ))}
      </group>

      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.30}
        scale={5}
        blur={2.8}
        far={3}
        color="#111827"
      />
    </>
  );
}

export default function HeroBottle({ scrollProgress }) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 4.5], fov: 40 }}
      dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      gl={{ antialias: true, alpha: true }}
      shadows="soft"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Scene scrollProgress={scrollProgress} />
    </Canvas>
  );
}

useGLTF.preload('/pill_bottle.glb');
