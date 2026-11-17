import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface NervSyncBarProps {
  isWorking: boolean;
  interactionCount?: number;
}

export const NervSyncBar: React.FC<NervSyncBarProps> = ({
  isWorking,
  interactionCount = 0,
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Restart timer & animation on new interaction or when isWorking changes
  useEffect(() => {
    if (isWorking) {
      setHasRun(true);
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      setActiveStep(0);

      const interval = window.setInterval(() => {
        const diff = Date.now() - startTimeRef.current;
        setElapsedMs(diff);
        setActiveStep(Math.floor((diff / 120) % 8));
      }, 25);

      timerRef.current = interval;

      return () => {
        window.clearInterval(interval);
      };
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isWorking, interactionCount]);

  // Format mm:ss.cc (Centiseconds like Evangelion HUD)
  const formatEvangelionChrono = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number, z = 2) => n.toString().padStart(z, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  // Number of sync nodes (7 nodes fit cleanly with zero clipping)
  const syncBoxes = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="w-full flex items-center justify-center gap-2 select-none font-mono">
      {/* 1. CAMADA DE SINCRONIZAÇÃO NERV */}
      <div className="flex-1 min-w-[200px] max-w-[420px] bg-[#0d0905] border border-[#ff7a00]/60 px-2 sm:px-3 py-1 flex items-center justify-between gap-1.5 sm:gap-2 text-xs relative overflow-hidden shadow-[0_0_10px_rgba(255,122,0,0.18)] h-[38px]">
        {/* Subtle Background Glow when Working */}
        {isWorking && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,122,0,0.12)_0%,_transparent_70%)] pointer-events-none animate-pulse" />
        )}

        {/* Left HUD: Evangelion Sync Status Indicator */}
        <div className="flex items-center gap-1.5 shrink-0 z-10">
          <Activity
            className={`w-3.5 h-3.5 ${
              isWorking
                ? 'text-[#ff2233] animate-ping'
                : hasRun
                ? 'text-[#4dff9a]'
                : 'text-[#ff7a00]'
            }`}
          />
          <span
            className={`text-[8px] sm:text-[9px] px-1 py-0.2 font-bold uppercase tracking-wider border ${
              isWorking
                ? 'border-[#ff2233] bg-[#22070a] text-[#ff4455] animate-pulse shadow-[0_0_6px_rgba(255,34,51,0.5)]'
                : hasRun
                ? 'border-[#4dff9a] bg-[#071d10] text-[#4dff9a]'
                : 'border-[#4a301a] bg-[#120c07] text-[#8a6845]'
            }`}
          >
            {isWorking ? 'SYNCING' : hasRun ? '100% SYNC' : 'STANDBY'}
          </span>
        </div>

        {/* Center Wave: Diagonalized "Sync" Boxes Connected by Circuit Line */}
        <div className="flex-1 relative flex items-center justify-center py-1 z-10 min-w-0 mx-1">
          {/* Continuous Connecting Circuit Line Behind Boxes */}
          <div className="absolute left-1 right-1 h-[2px] bg-[#3a2212] z-0">
            {isWorking && (
              <div
                className="h-full bg-gradient-to-r from-[#ff2233] via-[#ff7a00] to-[#00f0ff] animate-pulse"
                style={{
                  boxShadow: '0 0 10px #ff7a00, 0 0 5px #00f0ff',
                }}
              />
            )}
            {!isWorking && hasRun && (
              <div className="h-full bg-[#4dff9a]/60 shadow-[0_0_6px_#4dff9a]" />
            )}
          </div>

          {/* Diagonalized Skewed Boxes with controlled spacing */}
          <div className="relative z-10 flex items-center justify-between w-full px-1">
            {syncBoxes.map((idx) => {
              const isWaveActive = isWorking && activeStep === idx;
              const isAdjacent = isWorking && (activeStep === (idx + 6) % 7 || activeStep === (idx + 1) % 7);

              return (
                <div
                  key={idx}
                  className={`relative transform -skew-x-[20deg] px-1 sm:px-1.5 py-0.5 border text-[8px] sm:text-[9px] font-black tracking-wider transition-all duration-100 ${
                    isWorking
                      ? isWaveActive
                        ? 'border-[#00f0ff] bg-[#00f0ff] text-black shadow-[0_0_12px_#00f0ff] scale-105 z-20'
                        : isAdjacent
                        ? 'border-[#ff7a00] bg-[#ff7a00] text-black shadow-[0_0_8px_#ff7a00]'
                        : 'border-[#ff7a00]/70 bg-[#1f1006] text-[#ff7a00] opacity-80'
                      : hasRun
                      ? 'border-[#4dff9a]/80 bg-[#091a0e] text-[#4dff9a] shadow-[0_0_5px_rgba(77,255,154,0.3)]'
                      : 'border-[#3a2212] bg-[#0d0905] text-[#6d4d31] opacity-60'
                  }`}
                  title={`Nó Neural de Sincronização Evangelion 0${idx + 1}`}
                >
                  <span className="inline-block transform skew-x-[20deg] select-none leading-none">
                    SYNC
                  </span>

                  {/* Micro Neon Pip */}
                  <span
                    className={`absolute -top-1 -right-0.5 w-1 h-1 rounded-full ${
                      isWorking
                        ? isWaveActive
                          ? 'bg-[#ffffff] animate-ping'
                          : 'bg-[#ff7a00]'
                        : hasRun
                        ? 'bg-[#4dff9a]'
                        : 'bg-transparent'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. TIMER DE ALTA PRECISÃO EVANGELION (COLOCADO AO LADO) */}
      <div className="shrink-0 bg-[#0e0804] border border-[#ff7a00]/90 px-2 sm:px-2.5 py-0.5 flex items-center gap-1.5 h-[38px] shadow-[0_0_10px_rgba(255,122,0,0.25)]">
        <Zap
          className={`w-3.5 h-3.5 shrink-0 ${
            isWorking ? 'text-[#00f0ff] animate-bounce' : 'text-[#ff7a00]'
          }`}
        />
        <div className="flex flex-col items-end leading-none">
          <span className="text-[7px] text-[#8a6845] font-bold tracking-widest uppercase">
            NERV TIMER
          </span>
          <span
            className={`text-xs sm:text-sm font-black font-mono tracking-widest ${
              isWorking
                ? 'text-[#00f0ff] drop-shadow-[0_0_8px_#00f0ff]'
                : hasRun
                ? 'text-[#4dff9a] drop-shadow-[0_0_6px_#4dff9a]'
                : 'text-[#ffca8a]'
            }`}
          >
            [ {formatEvangelionChrono(elapsedMs)} ]
          </span>
        </div>
      </div>
    </div>
  );
};
