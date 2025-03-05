import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles: Particle[] = [];
  const particleCount = 200; // Increased particle count
  const connectionDistance = 180; // Increased connection distance
  const colors = ['#4f46e5', '#818cf8', '#6366f1', '#a855f7', '#2563eb', '#3b82f6']; // Added more blues and purples
  const waveAmplitude = 50; // Wave amplitude for flowing effect
  const waveFrequency = 0.02; // Wave frequency

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Set canvas to full width/height
    const resizeCanvas = () => {
      canvas.width = window.innerWidth; // Full width
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    // Initialize particles
    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.8, // Slower movement
          speedY: (Math.random() - 0.5) * 0.3, // Slower vertical movement
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.5 + 0.3 // Varying opacity
        });
      }
    };

    // Animation loop
    const animate = () => {
      time += 0.01;
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(10, 10, 40, 1)');
      gradient.addColorStop(1, 'rgba(30, 20, 60, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw wave patterns
      drawWaves(ctx, time, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Apply wave motion
        p.y += Math.sin(time + p.x * waveFrequency) * 0.3;
        
        // Move particles
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Wrap around edges instead of bouncing
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0;
        if (p.y < 0) p.y = canvas.height;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.5;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(150, 150, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    };
    
    // Draw flowing wave patterns
    const drawWaves = (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => {
      // First wave
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      for (let x = 0; x < width; x += 10) {
        const y = Math.sin(x * 0.01 + time) * waveAmplitude + height / 2;
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Second wave
      ctx.beginPath();
      ctx.moveTo(0, height / 2 + 50);
      
      for (let x = 0; x < width; x += 10) {
        const y = Math.sin(x * 0.008 + time * 1.5) * waveAmplitude + height / 2 + 50;
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticleBackground;