<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Serpiente Hipnótica - AI Studio App

Juego de serpiente ultra-optimizado para streaming en TikTok Live, con algoritmos de pathfinding perfectos, simulación de interacción de público, y skins visuales hipnóticos.

## Características

- 🤖 **IA de 99% de winrate** - Algoritmo heurístico supremo en 3 fases
- 🎨 **4 Skins visuales** - Cyberpunk Neon, Oro Líquido, Holograma Zen, Bioluminiscente
- 📊 **Pathfinding perfecto** - Ciclo Hamiltoniano con atajos inteligentes
- ⚡ **Optimizado para streaming** - 60 FPS sin lag
- 🎵 **Sintetizador retro** - Efectos de sonido generados con WebAudio
- 👁️ **Controles avanzados** - Ajusta velocidad, opacidad de grid, umbrales de cautela

## Requisitos previos

- Node.js (versión 16+)

## Instalación local

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Configura tu `GEMINI_API_KEY` en `.env.local`:
   ```bash
   GEMINI_API_KEY="tu_clave_aqui"
   ```

3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre `http://localhost:3000` en tu navegador

## Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila el proyecto para producción
- `npm run preview` - Vista previa de la build de producción
- `npm run lint` - Verifica errores de TypeScript
- `npm run clean` - Limpia los directorios de build

## Estructura del proyecto

```
qle/
├── src/
│   ├── App.tsx              # Componente principal
│   ├── main.tsx             # Punto de entrada React
│   ├── index.css            # Estilos globales
│   ├── types.ts             # Definiciones de tipos
│   ├── components/
│   │   └── SnakeGame.tsx    # Lógica principal del juego
│   ├── data/
│   │   ├── skins.ts         # Definiciones de skins
│   │   └── comments.ts      # Comentarios simulados
│   └── utils/
│       └── snakeAI.ts       # Algoritmos de IA y pathfinding
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Modos de IA

### FASE 1: Caza Libre (< 320 bloques)
- Persigue comida activamente
- Mantiene ruta de escape a la cola
- Evita dividir espacios libres

### MODO DISTRIBUCIÓN (320 - 399 bloques)
- Barrer perimetral
- Unificación de islas libres
- Alineación con ciclo Hamiltoniano

### MODO COIL (400 bloques - Victoria)
- Espiral concéntrica perfecta
- Atajos Hamiltonianos seguros
- Movimiento hipnótico y satisfactorio

## Licencia

Apache-2.0

## Créditos

Desarrollado con React, TypeScript, Tailwind CSS y Vite.
