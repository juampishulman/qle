/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import SnakeGame from './components/SnakeGame';
import { Target, Monitor, Info, Heart, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-900 font-sans antialiased">
      
      {/* HEADER SECTION - Beautiful, minimalist, professional */}
      <header className="w-full bg-slate-950/70 border-b border-slate-900/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <span className="font-sans font-black text-white text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="font-sans font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SERPIENTE ALGORÍTMICA IA
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider uppercase">Patrones de Movimiento Perpetuo e Hipnótico</p>
          </div>
        </div>

        {/* Quick actions line */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-show-guide"
            onClick={() => setShowGuide(!showGuide)}
            className="px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 active:scale-95 text-slate-300"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            {showGuide ? 'Ocultar Guía de Transmisión' : 'Guía de Transmisión (OBS)'}
            {showGuide ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* MAIN GAME APP AREA */}
      <main className="flex-1 flex flex-col items-center justify-center py-8 px-4 w-full">
        
        {/* Stream Host Live broadcast tips */}
        {showGuide && (
          <div className="w-full max-w-4xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-xs font-sans">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
              <h4 className="font-bold text-xs text-cyan-400 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                <Target className="w-4 h-4" /> 1. Retención de Audiencia Activa
              </h4>
              <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                Este juego aprovecha el efecto hipnótico del "barrido perimetral" (wall-hugging) y el empaquetado de espacio continuo. El algoritmo de Dijkstra pondera positivamente las paredes, asegurando movimientos coordinados y hermosos que canalizan la atención del público.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
              <h4 className="font-bold text-xs text-purple-400 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                <Monitor className="w-4 h-4" /> 2. Captura de OBS u Otro Software
              </h4>
              <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                En OBS Studio o TikTok Live Studio, añade una **Captura de Ventana** seleccionando esta pestaña. Puedes usar el botón **"Ocultar Ajustes"** para ocultar controles laterales, y usar el recorte (manteniendo pulsado Alt en OBS) para emitir estrictamente la zona del juego.
              </p>
            </div>
          </div>
        )}

        <SnakeGame />
      </main>

      {/* FOOTER - Refined and sophisticated */}
      <footer className="w-full bg-slate-950/40 border-t border-slate-900/40 py-4 text-center text-[10px] text-slate-500 font-mono flex flex-col md:flex-row items-center justify-between px-6 gap-2">
        <span>Servicios de Inteligencia Algorítmica & Pathfinding en Tiempo Real</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400">
            Listo para Transmisiones y Grabación Live
          </span>
          <span className="text-slate-600">v2.0.0-Optimizado</span>
        </div>
      </footer>

    </div>
  );
}