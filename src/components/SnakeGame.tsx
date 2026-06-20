/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Position, SkinId } from '../types';
import { SKINS } from '../data/skins';
import { computeNextAIMove, computeSupremeHeuristicAIMove, inBounds, containsPos, equalPos } from '../utils/snakeAI';

const TOTAL_TILES = 20 * 20;
import { 
  Play, Pause, RefreshCw, Sparkles, Sliders, Cpu, 
  Settings, Eye, EyeOff, Layout, Volume2, VolumeX, Square
} from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export default function SnakeGame() {
  const GRID_SIZE = 20;

  // --- Core Game State ---
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]);
  const [previousSnake, setPreviousSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]);
  const lastTickTimeRef = useRef<number>(performance.now());
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [food, setFood] = useState<Position>({ x: 10, y: 5 });
  const [goldFood, setGoldFood] = useState<Position | null>(null);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [score, setScore] = useState(3);
  const [isAIMode, setIsAIMode] = useState(true);
  const [aiAlgorithm, setAiAlgorithm] = useState<'hamiltonian' | 'supreme'>('supreme');
  const [supremePhase, setSupremePhase] = useState<string>('FASE 1');
  const [supremeReason, setSupremeReason] = useState<string>('Esperando inicio');
  const [supremeComponents, setSupremeComponents] = useState<number>(1);

  // --- Configuration ---
  const [activeSkinId, setActiveSkinId] = useState<SkinId>('cyberpunk');
  const [survivalThreshold, setSurvivalThreshold] = useState<number>(200);
  const [tickSpeed, setTickSpeed] = useState<number>(70);
  const [gridGlow, setGridGlow] = useState<number>(40);
  const [showSafetyPath, setShowSafetyPath] = useState<boolean>(true);
  const [showPathToFood, setShowPathToFood] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);

  // --- Performance Stats ---
  const [fps, setFps] = useState<number>(60);
  const [renderLatency, setRenderLatency] = useState<number>(0.1);

  // --- Audio / Sound Effects Synth ---
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastFpsTimeRef = useRef<number>(0);
  const fpsFrameCountRef = useRef<number>(0);

  // AI paths stored for line drawing
  const [computedSafetyPath, setComputedSafetyPath] = useState<Position[] | null>(null);
  const [computedPathToFood, setComputedPathToFood] = useState<Position[] | null>(null);
  const [aiModeLabel, setAiModeLabel] = useState<'aggressive' | 'survival' | 'tail_chase'>('aggressive');

  const selectedSkin = SKINS[activeSkinId];

  // --- Sound Synth Function ---
  const playSound = (type: 'eat' | 'gold_eat' | 'click' | 'explosion' | 'obstacle') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'eat') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1045, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'gold_eat') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(750, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.42);
        osc.start();
        osc.stop(ctx.currentTime + 0.43);
      } else if (type === 'obstacle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (e) {
      // Audio block fallback
    }
  };

  // --- Generate random food position ---
  const getRandomFreePosition = (currentSnake: Position[], currentObstacles: Position[]): Position => {
    const freeSlots: Position[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const temp = { x, y };
        if (!containsPos(currentSnake, temp) && !containsPos(currentObstacles, temp)) {
          freeSlots.push(temp);
        }
      }
    }
    if (freeSlots.length === 0) {
      return { x: -1, y: -1 }; // Victory!
    }
    return freeSlots[Math.floor(Math.random() * freeSlots.length)];
  };

  // Reset Game
  const handleResetGame = () => {
    playSound('click');
    const newSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ];
    setSnake(newSnake);
    setPreviousSnake(newSnake);
    lastTickTimeRef.current = performance.now();
    setDirection('UP');
    setObstacles([]);
    setGoldFood(null);
    setIsGameOver(false);
    setIsVictory(false);
    setScore(3);
    
    const initialFood = getRandomFreePosition(newSnake, []);
    setFood(initialFood);
    particlesRef.current = [];
  };

  // Fast aesthetic particles
  const triggerParticles = (pos: Position, count = 12, isGold = false) => {
    const colors = isGold ? ['#fef08a', '#eab308'] : selectedSkin.particleColors;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = canvas.width / GRID_SIZE;
    const originX = pos.x * cellSize + cellSize / 2;
    const originY = pos.y * cellSize + cellSize / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.5;
      particlesRef.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1.0 + Math.random() * 2.0,
        alpha: 1.0
      });
    }
  };

  // --- Manual Keyboard controller ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAIMode) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isAIMode]);

  // --- Game Tick Handler ---
  useEffect(() => {
    if (isPaused || isGameOver || isVictory) return;

    const gameTick = () => {
      let snakeBodyCopy = [...snake];
      let head = snakeBodyCopy[0];
      let nextPos: Position;

      if (isAIMode) {
        const currentTarget = goldFood ? goldFood : food;
        if (aiAlgorithm === 'supreme') {
          const aiResult = computeSupremeHeuristicAIMove(
            snakeBodyCopy,
            currentTarget,
            obstacles,
            direction
          );
          nextPos = aiResult.nextPos;
          setComputedSafetyPath(aiResult.safetyPath);
          setComputedPathToFood(aiResult.pathToFood);
          setAiModeLabel(aiResult.mode);
          setSupremePhase(aiResult.phase);
          setSupremeReason(aiResult.reason);
          setSupremeComponents(aiResult.components);
        } else {
          const aiResult = computeNextAIMove(
            snakeBodyCopy,
            currentTarget,
            obstacles,
            false,
            survivalThreshold
          );
          nextPos = aiResult.nextPos;
          setComputedSafetyPath(aiResult.safetyPath);
          setComputedPathToFood(aiResult.pathToFood);
          setAiModeLabel(aiResult.mode);
        }

        if (nextPos.x > head.x) setDirection('RIGHT');
        else if (nextPos.x < head.x) setDirection('LEFT');
        else if (nextPos.y > head.y) setDirection('DOWN');
        else if (nextPos.y < head.y) setDirection('UP');

      } else {
        let dx = 0, dy = 0;
        if (direction === 'UP') dy = -1;
        else if (direction === 'DOWN') dy = 1;
        else if (direction === 'LEFT') dx = -1;
        else if (direction === 'RIGHT') dx = 1;

        nextPos = { x: head.x + dx, y: head.y + dy };
        setComputedSafetyPath(null);
        setComputedPathToFood(null);
      }

      // Border collision
      if (!inBounds(nextPos)) {
        setIsGameOver(true);
        playSound('explosion');
        triggerParticles(head, 25);
        return;
      }

      // Self collision
      const willGrow = equalPos(nextPos, food) || (goldFood !== null && equalPos(nextPos, goldFood));
      const bodySegmentsToCollide = willGrow ? snakeBodyCopy : snakeBodyCopy.slice(0, -1);
      if (containsPos(bodySegmentsToCollide, nextPos)) {
        setIsGameOver(true);
        playSound('explosion');
        triggerParticles(nextPos, 25);
        return;
      }

      let newLength = score;
      let isEatenNormal = equalPos(nextPos, food);
      let isEatenGold = goldFood !== null && equalPos(nextPos, goldFood);

      if (isEatenNormal) {
        newLength++;
        setScore(newLength);
        playSound('eat');
        triggerParticles(nextPos, 15, false);
        
        const nextFood = getRandomFreePosition([nextPos, ...snakeBodyCopy], obstacles);
        if (nextFood.x === -1) {
          setIsVictory(true);
          return;
        }
        setFood(nextFood);

        // 12% chance for temporary gold star food
        if (Math.random() < 0.12 && !goldFood) {
          const nextGold = getRandomFreePosition([nextPos, ...snakeBodyCopy, nextFood], obstacles);
          if (nextGold.x !== -1) {
            setGoldFood(nextGold);
            setTimeout(() => {
              setGoldFood(prev => prev && equalPos(prev, nextGold) ? null : prev);
            }, 6500);
          }
        }
      } else if (isEatenGold) {
        newLength += 2;
        setScore(newLength);
        playSound('gold_eat');
        triggerParticles(nextPos, 22, true);
        setGoldFood(null);
      }

      let updatedSnake: Position[];
      if (isEatenNormal) {
        updatedSnake = [nextPos, ...snakeBodyCopy];
      } else if (isEatenGold) {
        updatedSnake = [nextPos, nextPos, ...snakeBodyCopy];
      } else {
        updatedSnake = [nextPos, ...snakeBodyCopy.slice(0, -1)];
      }

      if (newLength >= TOTAL_TILES) {
        setIsVictory(true);
        playSound('explosion');
      }

      setPreviousSnake(snake);
      setSnake(updatedSnake);
      lastTickTimeRef.current = performance.now();
    };

    const interval = setInterval(gameTick, tickSpeed);
    return () => clearInterval(interval);
  }, [snake, direction, food, goldFood, obstacles, isPaused, isGameOver, isVictory, isAIMode, tickSpeed, score]);

  // Render loop
  useEffect(() => {
    let animationId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const startTime = performance.now();

      // Clear Canvas
      ctx.fillStyle = selectedSkin.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cellSize = canvas.width / GRID_SIZE;

      // Calculate interpolation progress
      const now = performance.now();
      const elapsed = now - lastTickTimeRef.current;
      let progress = elapsed / tickSpeed;
      if (isPaused || isGameOver || isVictory) {
        progress = 1.0;
      }
      progress = Math.max(0, Math.min(1.0, progress));

      const interpolatedSnakePos: Position[] = [];
      for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        const prev = previousSnake[i] || previousSnake[previousSnake.length - 1] || curr;
        const x = prev.x + (curr.x - prev.x) * progress;
        const y = prev.y + (curr.y - prev.y) * progress;
        interpolatedSnakePos.push({ x, y });
      }

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Draw Grid Lines
      if (gridGlow > 0) {
        ctx.strokeStyle = '#334155';
        ctx.globalAlpha = gridGlow / 100;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        for (let i = 1; i < GRID_SIZE; i++) {
          const pos = i * cellSize;
          ctx.moveTo(pos, 0);
          ctx.lineTo(pos, canvas.height);
          ctx.moveTo(0, pos);
          ctx.lineTo(canvas.width, pos);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Draw Food
      const fx = food.x * cellSize + cellSize / 2;
      const fy = food.y * cellSize + cellSize / 2;
      const frVal = (cellSize / 2) * 0.72;
      
      ctx.save();
      ctx.fillStyle = selectedSkin.foodColor;
      ctx.beginPath();
      ctx.arc(fx, fy, frVal, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.vx *= 0.96;
        p.alpha -= 0.025;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // Victory screen
      if (isVictory) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = 'bold 24px var(--font-sans)';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.fillText('¡BUCLE PERFECTO COMPLETADO!', canvas.width / 2, canvas.height / 2 - 15);
        
        ctx.font = '500 15px var(--font-mono)';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Nivel 400 / 400 Completado con Éxito', canvas.width / 2, canvas.height / 2 + 15);
        ctx.restore();
      }

      const endTime = performance.now();
      const processMs = endTime - startTime;
      
      fpsFrameCountRef.current++;
      if (endTime > lastFpsTimeRef.current + 1000) {
        setFps(Math.round((fpsFrameCountRef.current * 1000) / (endTime - lastFpsTimeRef.current)));
        fpsFrameCountRef.current = 0;
        lastFpsTimeRef.current = endTime;
        setRenderLatency(parseFloat(processMs.toFixed(2)));
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [snake, previousSnake, tickSpeed, direction, food, goldFood, activeSkinId, gridGlow, isVictory, isPaused, isGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 460;
    canvas.height = 460;
  }, []);

  return (
    <div id="game-main-layout" className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto px-4 py-2 bg-slate-950 text-slate-100 relative select-none">
      
      {/* Visual Canvas Game Container */}
      <div className="flex-1 flex flex-col items-center gap-4">
        
        {/* Canvas Screen */}
        <div 
          className="relative rounded-2xl overflow-hidden border transition-all duration-300 shadow-xl"
          style={{ 
            borderColor: selectedSkin.accentColor, 
            backgroundColor: selectedSkin.backgroundColor,
            boxShadow: `0 8px 30px rgba(0,0,0,0.5)`
          }}
        >
          <canvas
            id="snake-canvas-view"
            ref={canvasRef}
            className="block max-w-full"
            style={{ 
              width: 460, 
              height: 460
            }}
          />

          {/* Pause / Over / Victory Screen Cover */}
          {(isGameOver || isPaused || isVictory) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 animate-fade-in z-20">
              {isVictory ? (
                <>
                  <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center animate-bounce mb-3 border border-yellow-300">
                    <Sparkles className="w-7 h-7 text-black" />
                  </div>
                  <h3 className="text-xl font-black text-yellow-300 uppercase">
                    🏆 ¡BUCLE 400 COMPLETADO!
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 max-w-xs font-mono">
                    La IA ha alcanzado la perfección geométrica.
                  </p>
                </>
              ) : isGameOver ? (
                <>
                  <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-3 border border-slate-700">
                    <Square className="w-6 h-6 text-rose-500 fill-rose-500" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-400 uppercase">PARTIDA FINALIZADA</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs font-mono">
                    Colisión detectada.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mb-3 border border-slate-700 animate-pulse">
                    <Play className="w-6 h-6 text-cyan-400 fill-cyan-400 ml-1" />
                  </div>
                  <h3 className="text-lg font-bold text-cyan-400 uppercase">JUEGO EN PAUSA</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Presiona reanudar para continuar el flujo.
                  </p>
                </>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  id="btn-respawn"
                  onClick={handleResetGame}
                  className="px-5 py-2 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-xl text-xs uppercase font-sans tracking-wider flex items-center gap-2 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Volver a Empezar
                </button>
                {isPaused && (
                  <button
                    onClick={() => { playSound('click'); setIsPaused(false); }}
                    className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase font-sans tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5" /> Reanudar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Playback Controls */}
        <div className="w-full max-w-[460px] grid grid-cols-3 gap-2.5">
          <button
            id="btn-play-pause"
            onClick={() => { playSound('click'); setIsPaused(!isPaused); }}
            className={`py-2 px-3 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
              isPaused 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Reanudar' : 'Pausar'}
          </button>

          <button
            id="btn-toggle-ai"
            onClick={() => { playSound('click'); setIsAIMode(!isAIMode); }}
            className={`py-2 px-3 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
              isAIMode 
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20' 
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            {isAIMode ? 'Piloto IA' : 'Manual'}
          </button>

          <button
            id="btn-restart-action"
            onClick={handleResetGame}
            className="py-2 px-3 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
          </button>
        </div>

        {/* Minimal organic HUD info */}
        <div className="w-full max-w-[460px] grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-slate-900/40 px-2 py-2 rounded-xl border border-slate-900">
            <span className="text-[9px] text-slate-500 block uppercase font-mono">Largo</span>
            <span className="font-mono font-bold text-xs text-slate-200">
              {score} 
              <span className="text-slate-500 text-[8px] block">{((score / 400) * 100).toFixed(1)}%</span>
            </span>
          </div>
          <div className="bg-slate-900/40 px-2 py-2 rounded-xl border border-slate-900">
            <span className="text-[9px] text-rose-400 block uppercase font-mono font-medium">Hambre</span>
            <span className="font-mono font-bold text-xs text-rose-500 block mt-0.5">
              {Math.max(0, Math.min(100, Math.round(((400 - score) / 400) * 100)))}%
            </span>
          </div>
          <div className="bg-slate-900/40 px-2 py-2 rounded-xl border border-slate-900">
            <span className="text-[9px] text-cyan-400 block uppercase font-mono font-medium">Cautela</span>
            <span className="font-mono font-bold text-xs text-cyan-500 block mt-0.5">
              {Math.max(0, Math.min(100, Math.round((score / 400) * 100)))}%
            </span>
          </div>
          <div className="bg-slate-900/40 px-2 py-2 rounded-xl border border-slate-900">
            <span className="text-[9px] text-slate-500 block uppercase font-mono">Piloto IA</span>
            <span className={`font-mono font-bold text-[9px] uppercase block mt-1 ${
              aiModeLabel === 'aggressive' ? 'text-cyan-400' : 'text-amber-500'
            }`}>
              {aiModeLabel === 'aggressive' ? 'Directo 🎯' : 'Coiling 🛡️'}
            </span>
          </div>
        </div>

        {/* Toggle to Hide/Show Settings Menu */}
        <button
          onClick={() => { playSound('click'); setShowControls(!showControls); }}
          className="mt-1 px-4 py-1.5 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 text-[10px] font-mono rounded-lg border border-slate-900 flex items-center gap-1.5 transition-all text-slate-300"
        >
          {showControls ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showControls ? 'Ocultar Ajustes (Vista de Captura)' : 'Mostrar Ajustes y Variantes'}
        </button>

      </div>

      {/* STREAM CONTROL PANEL & CALIBRATION TOOLS */}
      {showControls && (
        <div className="w-full lg:w-80 flex flex-col gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 animate-fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
              <Settings className="w-3.5 h-3.5 text-cyan-400" /> Configuración Interna
            </h3>
            <span className="text-[9px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-md font-mono font-bold">Host Ops</span>
          </div>

          {/* AI Mode Selector */}
          <div>
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 font-mono flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" /> Motor de IA Activo
            </h4>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-850">
              <button
                onClick={() => { playSound('click'); setAiAlgorithm('supreme'); }}
                className={`py-1.5 rounded text-[10px] uppercase font-bold font-mono transition-all text-center ${
                  aiAlgorithm === 'supreme'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                99% Heurística
              </button>
              <button
                onClick={() => { playSound('click'); setAiAlgorithm('hamiltonian'); }}
                className={`py-1.5 rounded text-[10px] uppercase font-bold font-mono transition-all text-center ${
                  aiAlgorithm === 'hamiltonian'
                    ? 'bg-purple-650 text-slate-50 shadow-md border border-purple-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hamiltoniano
              </button>
            </div>
          </div>

          {/* Skins */}
          <div>
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 font-mono flex items-center gap-1">
              <Layout className="w-3 h-3 text-purple-400" /> Temas Visuales
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(SKINS).map((s) => {
                const isActive = activeSkinId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { playSound('click'); setActiveSkinId(s.id as SkinId); }}
                    className={`px-3 py-2.5 rounded-lg border text-left transition-all relative overflow-hidden flex items-center justify-between ${
                      isActive 
                        ? 'bg-slate-800 border-cyan-500/80 text-cyan-300' 
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-955'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{s.name}</span>
                      <span className="text-[9px] text-slate-500 leading-none">{s.id.toUpperCase()}</span>
                    </div>
                    
                    <div className="flex gap-1 items-center">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.headColor }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.bodyColor1 }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.foodColor }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed & grid display controls */}
          <div className="space-y-4 pt-2 border-t border-slate-800/50">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-1">
              <Sliders className="w-3 h-3 text-yellow-400" /> Calibrador de Velocidad
            </h4>
            
            <div>
              <div className="flex justify-between text-slate-400 font-mono text-[10px] mb-1">
                <span>Frecuencia (Tick Speed)</span>
                <span className="text-yellow-400 font-bold">{tickSpeed} ms</span>
              </div>
              <input
                type="range"
                min="2"
                max="200"
                step="2"
                value={tickSpeed}
                onChange={(e) => setTickSpeed(parseInt(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Grid opacity */}
            <div>
              <div className="flex justify-between text-slate-400 font-mono text-[10px] mb-1">
                <span>Opacidad de la Rejilla</span>
                <span className="text-purple-400 font-bold">{gridGlow}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={gridGlow}
                onChange={(e) => setGridGlow(parseInt(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* AI Search Path Overlays */}
          <div className="pt-3 border-t border-slate-800/50 space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" /> Superposiciones de IA
            </h4>
            
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900 justify-between text-xs">
              <span className="text-slate-400 font-mono text-[10px]">Mostrar Línea de Escape (Rosa)</span>
              <input
                type="checkbox"
                checked={showSafetyPath}
                onChange={(e) => setShowSafetyPath(e.target.checked)}
                className="accent-pink-600 rounded cursor-pointer h-3.5 w-3.5"
              />
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900 justify-between text-xs">
              <span className="text-slate-400 font-mono text-[10px]">Mostrar Camino Comida (Cian)</span>
              <input
                type="checkbox"
                checked={showPathToFood}
                onChange={(e) => setShowPathToFood(e.target.checked)}
                className="accent-cyan-500 rounded cursor-pointer h-3.5 w-3.5"
              />
            </label>
          </div>

          {/* Sound switch */}
          <button
            onClick={() => { playSound('click'); setSoundEnabled(!soundEnabled); }}
            className={`w-full py-2 px-3 mt-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-all ${
              soundEnabled 
                ? 'bg-slate-900 border-slate-800 text-cyan-400' 
                : 'bg-rose-950/10 border-rose-900/30 text-rose-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Sintetizador Retro: ACTIVO' : 'Sintetizador Retro: SILENCIADO'}
          </button>
        </div>
      )}

    </div>
  );
}