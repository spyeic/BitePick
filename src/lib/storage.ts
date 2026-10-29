import { z } from 'zod';
import { defaultData, DEFAULT_SETTINGS } from './defaults';
import type { AppData } from './types';
export const STORAGE_KEY = 'bitepick.v2';
export const LEGACY_KEY = 'bitepick.v1';
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const text = (max: number) => z.string().trim().min(1).max(max);
const foodSchema = z.object({ id: text(100), name: text(60), emoji: text(20), category: text(32), enabled: z.boolean(), createdAt: z.iso.datetime() });
const historySchema = z.object({ id: text(100), foodId: text(100), name: text(60), emoji: text(20), category: text(32), pickedAt: z.iso.datetime() });
const schema = z.object({
  version: z.literal(2),
  foods: z.array(foodSchema).max(500),
  categories: z.array(text(32)).max(50),
  history: z.array(historySchema).max(1000),
  settings: z.object({ language: z.enum(['zh', 'en']).default('zh'), theme: z.enum(['light', 'dark', 'system']), reducedMotion: z.boolean(), avoidRecent: z.union([z.literal(0), z.literal(1), z.literal(3), z.literal(5)]) }),
}).superRefine((data, ctx) => {
  const add = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (new Set(data.foods.map(f => f.id)).size !== data.foods.length) add('Food IDs must be unique.');
  if (new Set(data.history.map(h => h.id)).size !== data.history.length) add('History IDs must be unique.');
  if (new Set(data.categories.map(c => c.toLowerCase())).size !== data.categories.length) add('Category names must be unique.');
  if (data.categories.some(c => c.toLowerCase() === 'all')) add('“All” is a reserved category name.');
  if (data.foods.some(f => !data.categories.includes(f.category))) add('Every food must belong to an existing category.');
});
export function parseData(raw: string): AppData {
  if (new TextEncoder().encode(raw).byteLength > MAX_IMPORT_BYTES) throw new Error('Choose a JSON file smaller than 2 MB.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Please choose a BitePick export.'); }
  if (value && typeof value === 'object' && 'version' in value && value.version === 1) {
    const previous = value as Record<string, unknown>;
    value = { ...previous, version: 2, history: previous.history ?? [], settings: { ...DEFAULT_SETTINGS, ...(previous.settings && typeof previous.settings === 'object' ? previous.settings : {}) } };
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error('This is not a supported BitePick export. Check food fields, categories, settings, and file version.');
  return { ...parsed.data, history: parsed.data.history.sort((a, b) => Date.parse(b.pickedAt) - Date.parse(a.pickedAt)) };
}
export function loadData(storage: Pick<Storage, 'getItem'>): { data: AppData; warning?: string } {
  try {
    const raw = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_KEY);
    return { data: raw ? parseData(raw) : defaultData() };
  } catch {
    return { data: defaultData(), warning: 'Saved data could not be loaded. A fresh menu is ready; your original data has not been overwritten.' };
  }
}
export function saveData(storage: Pick<Storage, 'setItem'>, data: AppData): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
export function exportData(data: AppData): string { return JSON.stringify(data, null, 2); }
