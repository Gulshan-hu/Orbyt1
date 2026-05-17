import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  mass: number;
  glowMultiplier: number;
  glowVelocity: number;
}

const CONFIG = {
  particleCount: 80,
  particleSize: 2,
  particleOpacity: 0.5,
  glowIntensity: 12,
  movementSpeed: 0.2,
  mouseInfluence: 120,
  backgroundColor: 'transparent',
  particleColor: '#ffffff',
  mouseGravity: 'attract' as const,
  gravityStrength: 80,
};

export function FloatingParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < CONFIG.particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * CONFIG.movementSpeed,
          vy: (Math.random() - 0.5) * CONFIG.movementSpeed,
          size: Math.random() * CONFIG.particleSize + 1,
          opacity: CONFIG.particleOpacity,
          baseOpacity: CONFIG.particleOpacity,
          mass: Math.random() * 0.5 + 0.5,
          glowMultiplier: 1,
          glowVelocity: 0,
        });
      }
    };

    const updateParticles = () => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      particles.forEach((particle) => {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.mouseInfluence) {
          const force = (CONFIG.mouseInfluence - distance) / CONFIG.mouseInfluence;
          const normalizedDx = dx / distance;
          const normalizedDy = dy / distance;
          const gravityForce = force * (CONFIG.gravityStrength / 100);

          particle.vx += normalizedDx * gravityForce;
          particle.vy += normalizedDy * gravityForce;

          const targetGlow = 1 + force * 2;
          const easeSpeed = 0.15;
          particle.glowMultiplier += (targetGlow - particle.glowMultiplier) * easeSpeed;

          const targetOpacity = Math.min(1, particle.baseOpacity + force * 0.4);
          particle.opacity += (targetOpacity - particle.opacity) * easeSpeed;
        } else {
          const easeSpeed = 0.08;
          particle.glowMultiplier += (1 - particle.glowMultiplier) * easeSpeed;

          const targetOpacity = particle.baseOpacity * 0.3;
          particle.opacity += (targetOpacity - particle.opacity) * easeSpeed;
        }

        particle.vx += (Math.random() - 0.5) * 0.001;
        particle.vy += (Math.random() - 0.5) * 0.001;
        particle.vx *= 0.999;
        particle.vy *= 0.999;

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
      });
    };

    const drawParticles = () => {
      const particles = particlesRef.current;

      particles.forEach((particle) => {
        ctx.save();
        ctx.shadowColor = CONFIG.particleColor;
        ctx.shadowBlur = CONFIG.glowIntensity * particle.glowMultiplier * 2;
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = CONFIG.particleColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateParticles();
      drawParticles();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeCanvas();
    initParticles();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    resizeObserver.observe(canvas);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < CONFIG.particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * CONFIG.movementSpeed,
          vy: (Math.random() - 0.5) * CONFIG.movementSpeed,
          size: Math.random() * CONFIG.particleSize + 1,
          opacity: CONFIG.particleOpacity,
          baseOpacity: CONFIG.particleOpacity,
          mass: Math.random() * 0.5 + 0.5,
          glowMultiplier: 1,
          glowVelocity: 0,
        });
      }
    };

    resizeCanvas();
    initParticles();
  }, [CONFIG.particleCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
