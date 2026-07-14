"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sza-power-startup-v1";
const DURATION = 1200;

type Particle = { x: number; y: number; radius: number; angle: number; distance: number; speed: number; alpha: number; green: boolean };

export function StartupSplash() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing may block storage; the animation can still run once.
    }

    const showTimer = window.setTimeout(() => setVisible(true), 0);
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      const fallback = window.setTimeout(() => setVisible(false), DURATION);
      return () => window.clearTimeout(fallback);
    }

    let frame = 0;
    const startedAt = performance.now();
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = width < 640 ? 260 : 520;
      particles = Array.from({ length: count }, (_, index) => ({
        x: width / 2,
        y: height / 2,
        radius: 0.7 + Math.random() * (width < 640 ? 1.2 : 1.8),
        angle: (index / count) * Math.PI * 2 + Math.random() * 0.7,
        distance: 14 + Math.random() * Math.min(width, height) * 0.38,
        speed: 0.35 + Math.random() * 0.7,
        alpha: 0.35 + Math.random() * 0.65,
        green: Math.random() > 0.72
      }));
    };
    const draw = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / DURATION);
      const ease = 1 - Math.pow(1 - progress, 3);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#030609";
      context.fillRect(0, 0, width, height);
      const glow = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.62);
      glow.addColorStop(0, "rgba(25, 95, 74, 0.24)");
      glow.addColorStop(0.55, "rgba(5, 20, 22, 0.2)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      const scale = 0.45 + ease * 0.9;
      for (const particle of particles) {
        particle.angle += particle.speed * 0.012;
        const radius = particle.distance * scale;
        const x = width / 2 + Math.cos(particle.angle) * radius;
        const y = height / 2 + Math.sin(particle.angle) * radius * 0.6;
        const alpha = particle.alpha * (1 - progress * 0.32);
        context.beginPath();
        context.fillStyle = particle.green ? `rgba(56,214,122,${alpha})` : `rgba(244,249,247,${alpha})`;
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `600 ${Math.max(22, Math.min(42, width * 0.075))}px Arial, sans-serif`;
      context.fillStyle = `rgba(255,255,255,${Math.min(1, progress * 3)})`;
      context.fillText("SZA POWER", width / 2, height / 2);
      context.font = `400 ${Math.max(10, Math.min(14, width * 0.026))}px Arial, sans-serif`;
      context.fillStyle = `rgba(180,226,205,${Math.min(0.88, progress * 1.4)})`;
      context.fillText("COMPACT MOBILE POWER", width / 2, height / 2 + 34);
      if (progress < 1) frame = window.requestAnimationFrame(draw);
      else setVisible(false);
    };
    resize();
    window.addEventListener("resize", resize);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.clearTimeout(showTimer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [pathname]);

  return <div className={`fixed inset-0 z-[100] overflow-hidden bg-[#030609] transition-opacity duration-200 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`} role="status" aria-label="SZA POWER 正在加载"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" /><div className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-[10px] tracking-[0.28em] text-white/40">POWER IN MOTION</div></div>;
}