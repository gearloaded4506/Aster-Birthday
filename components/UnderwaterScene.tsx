
import React, { useRef, useEffect } from 'react';
import { SceneStage, Point } from '../types';
import { COLORS, PHYSICS } from '../constants';

interface Jellyfish {
  x: number;
  y: number;
  size: number;
  speed: number;
  offset: number;
  opacity: number;
}

interface UnderwaterSceneProps {
  stage: SceneStage;
  onDragComplete: () => void;
  onMorphComplete: () => void;
  onFishMove: (pos: Point) => void;
}

const UnderwaterScene: React.FC<UnderwaterSceneProps> = ({ stage, onDragComplete, onMorphComplete, onFishMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finaleStartTimeRef = useRef<number>(0);
  
  const fishRef = useRef({
    x: 0, y: 0, 
    vx: 1.0, vy: 0, 
    angle: 0,
    targetAngle: 0,
    isDragging: false,
    morphProgress: 0,
    pulse: 0
  });

  const jellyfishRef = useRef<Jellyfish[]>([]);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      jellyfishRef.current = Array.from({ length: 4 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 120 + Math.random() * 160,
        speed: 0.08 + Math.random() * 0.1,
        offset: Math.random() * Math.PI * 2,
        opacity: 0.03 + Math.random() * 0.06
      }));

      fishRef.current.x = canvas.width * 0.3;
      fishRef.current.y = canvas.height * 0.5;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrame: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      const fish = fishRef.current;
      fish.pulse = Math.sin(time * 1.8) * 0.5 + 0.5;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Deep Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Distant Jellyfish
      drawJellyfish(ctx, canvas, time);

      // 3. Update Fish Position and Reveal Mask
      if (stage < SceneStage.FINALE) {
        updateFish(canvas, time);
        onFishMove({ x: fish.x, y: fish.y });
        drawFish(ctx);
      } else {
        // Finale stage logic
        if (finaleStartTimeRef.current === 0) {
          finaleStartTimeRef.current = Date.now();
        }

        const elapsed = Date.now() - finaleStartTimeRef.current;
        const fishDelay = 4500; // Start showing fish after 4.5 seconds of finale
        const fishFadeDuration = 3000;
        
        // Finale state: fish stabilizes in the center
        const centerX = canvas.width / 2;
        const targetY = canvas.height / 2 - 100;
        
        fish.x += (centerX - fish.x) * 0.03;
        fish.y += (targetY - fish.y) * 0.03;
        fish.angle *= 0.94;
        
        onFishMove({ x: fish.x, y: fish.y });
        
        if (elapsed > fishDelay) {
          const fishAlpha = Math.min(1, (elapsed - fishDelay) / fishFadeDuration);
          ctx.save();
          ctx.globalAlpha = fishAlpha;
          const iconScale = 1.0 + Math.sin(time * 1.5) * 0.03;
          drawFish(ctx, iconScale);
          ctx.restore();
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, [stage, onDragComplete, onMorphComplete, onFishMove]);

  const drawJellyfish = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    jellyfishRef.current.forEach(j => {
      const pulse = Math.sin(time * 1.1 + j.offset) * 0.05 + 1;
      j.y -= j.speed;
      if (j.y < -j.size * 2) j.y = canvas.height + j.size * 2;

      ctx.save();
      ctx.translate(j.x, j.y);
      ctx.globalAlpha = j.opacity;
      
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, j.size * pulse);
      g.addColorStop(0, 'rgba(0, 70, 200, 0.3)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.scale(1, 0.6);
      ctx.arc(0, 0, j.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const updateFish = (canvas: HTMLCanvasElement, time: number) => {
    const fish = fishRef.current;
    if (!fish.isDragging) {
      fish.vx = Math.cos(fish.angle) * PHYSICS.FISH_SPEED * 0.9;
      fish.vy = Math.sin(fish.angle) * PHYSICS.FISH_SPEED * 0.4 + Math.sin(time * 2) * 0.15;
      fish.x += fish.vx;
      fish.y += fish.vy;
      fish.targetAngle += (Math.random() - 0.5) * 0.04;
      fish.angle += (fish.targetAngle - fish.angle) * 0.02;

      const margin = 120;
      if (fish.x < -margin) fish.x = canvas.width + margin;
      if (fish.x > canvas.width + margin) fish.x = -margin;
      if (fish.y < margin || fish.y > canvas.height - margin) fish.targetAngle *= -1;
    } else {
      fish.x += (mouseRef.current.x - fish.x) * 0.12;
      fish.y += (mouseRef.current.y - fish.y) * 0.12;
    }
  };

  const drawFish = (ctx: CanvasRenderingContext2D, sizeScale = 1) => {
    const fish = fishRef.current;
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.scale(sizeScale, sizeScale);
    
    // Core light (The Reveal Light)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
    g.addColorStop(0, `rgba(0, 240, 255, ${0.2 + fish.pulse * 0.1})`);
    g.addColorStop(0.5, `rgba(0, 240, 255, ${0.05 + fish.pulse * 0.05})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(fish.angle + (fish.vx < 0 ? Math.PI : 0));
    if (fish.vx < 0) ctx.scale(1, -1);

    // Body
    ctx.fillStyle = COLORS.FISH_SILVER;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(15, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-38, -14);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-38, 14);
    ctx.fill();

    ctx.restore();
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (stage === SceneStage.FINALE) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    if (Math.sqrt((x - fishRef.current.x)**2 + (y - fishRef.current.y)**2) < 140) {
      fishRef.current.isDragging = true;
      dragStartRef.current = { x, y };
      mouseRef.current = { x, y };
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    mouseRef.current = { x, y };
  };

  const handleEnd = () => {
    const fish = fishRef.current;
    if (fish.isDragging) {
      fish.isDragging = false;
      const dist = Math.sqrt((mouseRef.current.x - dragStartRef.current.x)**2 + (mouseRef.current.y - dragStartRef.current.y)**2);
      if (dist > PHYSICS.DRAG_THRESHOLD) {
        onDragComplete();
      }
    }
  };

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
};

export default UnderwaterScene;
