/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Position {
  x: number;
  y: number;
}

export type SkinId = 'cyberpunk' | 'liquid_golden' | 'zen_hologram' | 'bioluminescent';

export interface Skin {
  id: SkinId;
  name: string;
  description: string;
  glowColor: string;
  headColor: string;
  bodyColor1: string;
  bodyColor2: string;
  foodColor: string;
  goldFoodColor: string;
  gridColor: string;
  backgroundColor: string;
  accentColor: string;
  particleColors: string[];
}

export interface TikTokActivity {
  id: string;
  username: string;
  avatar: string;
  type: 'comment' | 'gift' | 'like' | 'follow';
  content: string;
  giftName?: string;
  giftIcon?: string;
  timestamp: string;
  count?: number;
}

export interface TikTokViewer {
  id: string;
  username: string;
  avatar: string;
  likes: number;
}
