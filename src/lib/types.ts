export interface Food {
  id: string;
  name: string;
  emoji: string;
  category: string;
  enabled: boolean;
  createdAt: string;
}
export interface HistoryEntry {
  id: string;
  foodId: string;
  name: string;
  emoji: string;
  category: string;
  pickedAt: string;
}
export type Language = 'zh' | 'en';
export interface Settings {
  language: Language;
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  avoidRecent: 0 | 1 | 3 | 5;
}
export interface AppData {
  version: 2;
  foods: Food[];
  categories: string[];
  history: HistoryEntry[];
  settings: Settings;
}
export type View = 'pick' | 'foods' | 'history' | 'settings';
export type PickMode = 'wheel' | 'quick';
