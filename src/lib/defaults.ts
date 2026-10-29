import type { AppData, Food, Settings } from './types';
export const DEFAULT_SETTINGS: Settings = { language: 'zh', theme: 'system', reducedMotion: false, avoidRecent: 0 };
export const DEFAULT_CATEGORIES = ['Asian', 'Western', 'Fast Food', 'Healthy', 'Dessert', 'Custom'];
const seed = [
  ['Hunan Cuisine', '🌶️', 'Asian'], ['Cantonese Cuisine', '🥟', 'Asian'], ['Sichuan Cuisine', '🫕', 'Asian'],
  ['Japanese Food', '🍣', 'Asian'], ['Hot Pot', '🍲', 'Asian'], ['Korean BBQ', '🥩', 'Asian'],
  ['Yakiniku', '🍖', 'Asian'], ['Thai Food', '🍛', 'Asian'], ['Korean Food', '🍚', 'Asian'],
  ['Western Food', '🍝', 'Western'], ['Burgers', '🍔', 'Fast Food'],
];
export function defaultFoods(): Food[] {
  return seed.map(([name, emoji, category], index) => ({ id: `default-${index + 1}`, name, emoji, category, enabled: true, createdAt: '2026-01-01T00:00:00.000Z' }));
}
export function defaultData(): AppData {
  return { version: 2, foods: defaultFoods(), categories: [...DEFAULT_CATEGORIES], history: [], settings: { ...DEFAULT_SETTINGS } };
}
export const EMOJIS = ['🌶️', '🫕', '🍖', '🍚', '🍣', '🍜', '🍲', '🥩', '🍕', '🍔', '🍝', '🌮', '🥡', '🍛', '🍗', '🥗', '🥟', '🥪', '🍱', '🍳', '🥞', '🍰', '🍦', '🧁', '🥐', '🧇', '🍩', '🧋', '🥑', '🍓', '🦐', '🍽️'];
