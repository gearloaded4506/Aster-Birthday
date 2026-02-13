
import React, { useState, useEffect, useCallback, useRef } from 'react';
import UnderwaterScene from './components/UnderwaterScene';
import { SceneStage, Point } from './types';

const App: React.FC = () => {
  const [stage, setStage] = useState<SceneStage>(SceneStage.INTRO);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage(SceneStage.LINE_ONE);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleDragComplete = useCallback(() => {
    setStage((prev) => {
      if (prev === SceneStage.LINE_ONE) return SceneStage.LINE_TWO;
      if (prev === SceneStage.LINE_TWO) return SceneStage.LINE_THREE;
      if (prev === SceneStage.LINE_THREE) {
        // Longer pause before the finale for cinematic tension
        setTimeout(() => {
          setStage(SceneStage.FINALE);
        }, 1800);
        return prev;
      }
      return prev;
    });
  }, []);

  const handleMorphComplete = useCallback(() => {
    // Stage logic handled via timeouts in handleDragComplete
  }, []);

  const updateFishPosition = useCallback((pos: Point) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--fish-x', `${pos.x}px`);
      containerRef.current.style.setProperty('--fish-y', `${pos.y}px`);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black"
    >
      {/* The Interactive Canvas Background */}
      <UnderwaterScene 
        stage={stage} 
        onDragComplete={handleDragComplete}
        onMorphComplete={handleMorphComplete}
        onFishMove={updateFishPosition}
      />

      {/* Narrative Lyrics - Hidden by mask, revealed by fish light */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-30 reveal-mask">
        <div className={`absolute transition-opacity duration-1500 text-center px-6 ${stage === SceneStage.LINE_ONE ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-white text-base sm:text-xl tracking-[0.6em] uppercase font-light text-glow">
            She looks like the real thing
          </h1>
        </div>

        <div className={`absolute transition-opacity duration-1500 text-center px-6 ${stage === SceneStage.LINE_TWO ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-white text-base sm:text-xl tracking-[0.6em] uppercase font-light text-glow">
            She tastes like the real thing
          </h1>
        </div>

        <div className={`absolute transition-opacity duration-1500 text-center px-6 ${stage === SceneStage.LINE_THREE ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-white text-base sm:text-xl tracking-[0.6em] uppercase font-light text-glow">
            My fake plastic love
          </h1>
        </div>
      </div>

      {/* Finale Message - Dreamy Emergence from the Depths */}
      {/* Increased Z-index to z-50 to ensure it's above the vignette (z-45) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-[60]">
        <div 
          className={`absolute text-center transition-all ease-in-out transform
            ${stage === SceneStage.FINALE 
              ? 'opacity-100 translate-y-0 tracking-[0.7em] blur-none scale-100 duration-[8000ms]' 
              : 'opacity-0 translate-y-24 tracking-[1.5em] blur-xl scale-90 duration-[3000ms]'}`}
        >
          <h2 className="text-white text-xl sm:text-4xl uppercase font-extralight text-glow-heavy leading-relaxed floating-text">
            Happy Birthday to Aster
          </h2>
          {/* Subtle slow-pulse decorative line */}
          <div className={`h-[1px] bg-white/20 mx-auto mt-12 transition-all duration-[10000ms] ease-in-out ${stage === SceneStage.FINALE ? 'w-48 opacity-40' : 'w-0 opacity-0'}`}></div>
        </div>
      </div>
      
      {/* Cinematic Environmental Overlays */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen z-10 opacity-20 bg-gradient-to-t from-[#001122] via-transparent to-transparent"></div>
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay z-10 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_70%)]"></div>
    </div>
  );
};

export default App;
