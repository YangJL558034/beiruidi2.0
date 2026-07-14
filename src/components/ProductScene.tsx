"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type ProductSceneProps = {
  className?: string;
  compact?: boolean;
};

export function ProductScene({ className = "", compact = false }: ProductSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, compact ? 0.18 : 0.28, compact ? 6.3 : 7.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    host.appendChild(renderer.domElement);

    const product = new THREE.Group();
    scene.add(product);

    const body = new THREE.Mesh(
      new RoundedBoxGeometry(2.48, 3.68, 0.58, 10, 0.12),
      new THREE.MeshPhysicalMaterial({
        color: "#f9fbfb",
        metalness: 0.28,
        roughness: 0.34,
        clearcoat: 0.58,
        clearcoatRoughness: 0.18
      })
    );
    body.castShadow = true;
    product.add(body);

    const glass = new THREE.Mesh(
      new RoundedBoxGeometry(2.1, 2.22, 0.05, 8, 0.08),
      new THREE.MeshPhysicalMaterial({
        color: "#0b1115",
        metalness: 0.12,
        roughness: 0.08,
        transmission: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.06
      })
    );
    glass.position.set(0, 0.46, 0.315);
    product.add(glass);

    const panelLineMaterial = new THREE.MeshStandardMaterial({
      color: "#35c7ff",
      emissive: "#1476a0",
      emissiveIntensity: 0.46,
      roughness: 0.2
    });

    for (let i = 0; i < 5; i += 1) {
      const line = new THREE.Mesh(new RoundedBoxGeometry(1.56, 0.035, 0.035, 4, 0.014), panelLineMaterial);
      line.position.set(0, 1.08 - i * 0.28, 0.36);
      product.add(line);
    }

    const core = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.035, 20, 96),
      new THREE.MeshStandardMaterial({
        color: "#38d67a",
        emissive: "#1b8b4f",
        emissiveIntensity: 0.62,
        metalness: 0.35,
        roughness: 0.24
      })
    );
    core.position.set(0, 0.33, 0.39);
    product.add(core);

    const innerCore = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 72),
      new THREE.MeshBasicMaterial({
        color: "#c9ffe4",
        transparent: true,
        opacity: 0.72
      })
    );
    innerCore.position.set(0, 0.33, 0.395);
    product.add(innerCore);

    const sideMaterial = new THREE.MeshPhysicalMaterial({
      color: "#d9dfdf",
      metalness: 0.54,
      roughness: 0.28,
      clearcoat: 0.48
    });

    [-1, 1].forEach((side) => {
      const rail = new THREE.Mesh(new RoundedBoxGeometry(0.12, 3.26, 0.7, 6, 0.05), sideMaterial);
      rail.position.set(side * 1.32, -0.02, 0);
      product.add(rail);
    });

    const base = new THREE.Mesh(
      new RoundedBoxGeometry(1.78, 0.18, 0.68, 6, 0.05),
      new THREE.MeshPhysicalMaterial({
        color: "#12171a",
        metalness: 0.58,
        roughness: 0.22,
        clearcoat: 0.5
      })
    );
    base.position.set(0, -1.96, 0);
    product.add(base);

    const cellMaterial = new THREE.MeshStandardMaterial({
      color: "#f1f5f4",
      metalness: 0.26,
      roughness: 0.36
    });

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const cell = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.42, 0.06, 4, 0.025), cellMaterial);
        cell.position.set(-0.54 + col * 0.36, -0.76 - row * 0.46, 0.36);
        product.add(cell);
      }
    }

    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: "#151c20",
      metalness: 0.52,
      roughness: 0.2,
      transparent: true,
      opacity: 0.18
    });

    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8 + i * 0.42, 0.006, 8, 160), ringMaterial);
      ring.rotation.x = Math.PI / 2.25;
      ring.rotation.z = i * 0.34;
      ringGroup.add(ring);
    }

    const dots = new THREE.Group();
    scene.add(dots);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: "#31c4ff" });

    for (let i = 0; i < 42; i += 1) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), dotMaterial);
      const angle = (i / 42) * Math.PI * 2;
      const radius = 1.8 + (i % 3) * 0.42;
      dot.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.7) * 0.32, Math.sin(angle) * radius);
      dots.add(dot);
    }

    const ambient = new THREE.HemisphereLight("#ffffff", "#b7c2bd", 2.2);
    scene.add(ambient);

    const key = new THREE.DirectionalLight("#ffffff", 3.4);
    key.position.set(4, 5, 5);
    scene.add(key);

    const rim = new THREE.PointLight("#31c4ff", 34, 8);
    rim.position.set(-2.8, 1.2, 2.1);
    scene.add(rim);

    const warm = new THREE.PointLight("#ffba3a", 14, 7);
    warm.position.set(2.2, -1.4, 2.4);
    scene.add(warm);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    host.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", resize);
    resize();

    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const targetY = pointer.current.x * 0.28;
      const targetX = pointer.current.y * 0.12;
      product.rotation.y += (targetY + Math.sin(elapsed * 0.35) * 0.16 - product.rotation.y) * 0.04;
      product.rotation.x += (-targetX + Math.sin(elapsed * 0.28) * 0.05 - product.rotation.x) * 0.04;
      product.position.y = Math.sin(elapsed * 0.72) * 0.08;
      ringGroup.rotation.y = elapsed * 0.08;
      ringGroup.rotation.z = Math.sin(elapsed * 0.2) * 0.12;
      dots.rotation.y = -elapsed * 0.12;
      core.rotation.z = elapsed * 0.85;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      host.removeEventListener("pointermove", onPointerMove);
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [compact]);

  return (
    <div
      ref={hostRef}
      data-product-scene
      className={`relative h-full min-h-[360px] w-full overflow-hidden ${className}`}
      aria-label="SZA POWER intelligent energy module in 3D"
    />
  );
}
