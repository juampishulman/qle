/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Skin } from '../types';

export const SKINS: Record<string, Skin> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Tubos y luces de neón vibrantes. Rejilla láser retro y partículas eléctricas que saltan al comer.',
    glowColor: 'rgba(6, 182, 212, 0.8)', // Cyan-500 glow
    headColor: '#06b6d4', // Cyan
    bodyColor1: '#ec4899', // Pink-500
    bodyColor2: '#a855f7', // Purple-500
    foodColor: '#eab308', // Yellow-500
    goldFoodColor: '#22c55e', // Green-500 (Star food)
    gridColor: 'rgba(168, 85, 247, 0.15)', // Light purple grid lines
    backgroundColor: '#0f0720', // Very dark purple
    accentColor: '#ec4899',
    particleColors: ['#06b6d4', '#ec4899', '#eab308']
  },
  liquid_golden: {
    id: 'liquid_golden',
    name: 'Oro Líquido & Obsidiana',
    description: 'Estética de lujo con oro pulido fundido y esferas de brillo nacarado deslizándose sobre mármol negro.',
    glowColor: 'rgba(234, 179, 8, 0.9)', // gold glow
    headColor: '#fef08a', // Light gold
    bodyColor1: '#eab308', // Gold yellow
    bodyColor2: '#ca8a04', // Darker gold
    foodColor: '#ffffff', // Diamond white
    goldFoodColor: '#f97316', // Orange gold
    gridColor: 'rgba(234, 179, 8, 0.08)',
    backgroundColor: '#0a0a0d', // obsidian black
    accentColor: '#eab308',
    particleColors: ['#fef08a', '#eab308', '#ca8a04', '#ffffff']
  },
  zen_hologram: {
    id: 'zen_hologram',
    name: 'Holograma Zen',
    description: 'Estética retro-futurista de terminal analógica. Líneas de escaneo estables, tipografía fósforo y calma mecánica.',
    glowColor: 'rgba(34, 197, 94, 0.7)', // neon green-500 glow
    headColor: '#4ade80', // light neon green
    bodyColor1: '#22c55e', // green-500
    bodyColor2: '#15803d', // green-700
    foodColor: '#86efac', // ultra light green
    goldFoodColor: '#facc15', // warning amber yellow
    gridColor: 'rgba(34, 197, 94, 0.08)',
    backgroundColor: '#020d04', // hacker dark green
    accentColor: '#22c55e',
    particleColors: ['#22c55e', '#4ade80', '#166534']
  },
  bioluminescent: {
    id: 'bioluminescent',
    name: 'Bosque Bioluminiscente',
    description: 'Segmentos orgánicos tipo medusa que se contraen y expanden de forma fluida. Polvo de hadas flotante.',
    glowColor: 'rgba(139, 92, 246, 0.8)', // violet glow
    headColor: '#a78bfa', // pastel purple
    bodyColor1: '#6366f1', // Indigo
    bodyColor2: '#3b82f6', // Blue
    foodColor: '#f43f5e', // pink flower
    goldFoodColor: '#a855f7', // purple blossom
    gridColor: 'rgba(99, 102, 241, 0.08)',
    backgroundColor: '#030712', // deep abyssal blue
    accentColor: '#6366f1',
    particleColors: ['#a78bfa', '#6366f1', '#f43f5e', '#3b82f6']
  }
};
