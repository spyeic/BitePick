import { describe, expect, it } from 'vitest';
import { defaultData, DEFAULT_SETTINGS } from '../src/lib/defaults';
import { exportData, LEGACY_KEY, loadData, MAX_IMPORT_BYTES, parseData, saveData, STORAGE_KEY } from '../src/lib/storage';
describe('data persistence', () => {
  it('initializes first visits with 11 editable default foods', () => {
    const { data, warning } = loadData({ getItem: () => null });
    expect(warning).toBeUndefined(); expect(data.foods).toHaveLength(11); expect(data.categories).toContain('Asian');
  });
  it('round-trips all data including settings, custom foods, disabled state and history', () => {
    const data = defaultData(); data.foods[0].enabled = false; data.settings.avoidRecent = 3; data.settings.reducedMotion = true;
    data.categories.push('Date night'); data.foods.push({ ...data.foods[1], id: 'custom', name: 'Dumplings', category: 'Date night' });
    data.history.push({ id: 'h1', foodId: 'custom', name: 'Dumplings', emoji: '🥟', category: 'Date night', pickedAt: '2026-10-28T10:00:00.000Z' });
    expect(parseData(exportData(data))).toEqual(data);
  });
  it.each(['light', 'dark'])('preserves a saved %s appearance without changing the menu', theme => {
    const data = defaultData();
    const parsed = parseData(JSON.stringify({ ...data, settings: { ...data.settings, theme } }));
    expect(parsed.settings.theme).toBe(theme); expect(parsed.foods).toEqual(data.foods);
  });
  it('allows an intentionally empty menu and categories', () => {
    expect(parseData(JSON.stringify({ ...defaultData(), foods: [], categories: [] })).foods).toEqual([]);
  });
  it('migrates version 1 and defaults missing settings and history', () => {
    const old = { version: 1, foods: defaultData().foods, categories: defaultData().categories };
    const migrated = parseData(JSON.stringify(old));
    expect(migrated.version).toBe(2); expect(migrated.settings).toEqual(DEFAULT_SETTINGS); expect(migrated.history).toEqual([]);
    expect(loadData({ getItem: key => key === LEGACY_KEY ? JSON.stringify(old) : null }).data.version).toBe(2);
  });
  it('preserves historical categories even after the original category is deleted', () => {
    const data = defaultData(); data.history = [{ id: 'h1', foodId: 'deleted', name: 'Old favorite', emoji: '🥟', category: 'Deleted category', pickedAt: '2026-10-28T10:00:00.000Z' }];
    expect(parseData(exportData(data)).history[0].category).toBe('Deleted category');
  });
  it('handles malformed stored data and unavailable browser storage', () => {
    expect(loadData({ getItem: () => '{nope' }).warning).toBeTruthy();
    expect(loadData({ getItem: () => { throw new Error('denied'); } }).data.foods).toHaveLength(11);
  });
  it('reports write failure without crashing', () => {
    expect(saveData({ setItem: () => { throw new Error('quota'); } }, defaultData())).toBe(false);
    const map = new Map<string, string>();
    expect(saveData({ setItem: (key, value) => { map.set(key, value); } }, defaultData())).toBe(true);
    expect(parseData(map.get(STORAGE_KEY)!).foods).toHaveLength(11);
  });
});
describe('untrusted JSON validation', () => {
  it.each(['null', '[]', '{}', '{', '"hello"', '{"version":99}'])('rejects %s', raw => expect(() => parseData(raw)).toThrow());
  it('rejects oversized files before parsing', () => expect(() => parseData(' '.repeat(MAX_IMPORT_BYTES + 1))).toThrow('smaller than 2 MB'));
  it.each(['enabled', 'name', 'emoji', 'createdAt', 'id', 'category'])('rejects a food without %s', field => {
    const data = JSON.parse(exportData(defaultData())); delete data.foods[0][field]; expect(() => parseData(JSON.stringify(data))).toThrow();
  });
  it('rejects invalid settings, IDs, category references, timestamps and excess counts', () => {
    const mutations = [
      (d: ReturnType<typeof defaultData>) => { d.foods[1].id = d.foods[0].id; },
      (d: ReturnType<typeof defaultData>) => { d.categories.push('ASIAN'); },
      (d: ReturnType<typeof defaultData>) => { d.foods[0].category = 'Missing'; },
      (d: ReturnType<typeof defaultData>) => { d.foods[0].createdAt = 'yesterday'; },
      (d: ReturnType<typeof defaultData>) => { d.categories.push('all'); },
      (d: ReturnType<typeof defaultData>) => { d.foods[0].name = ' '; },
      (d: ReturnType<typeof defaultData>) => { d.foods[0].name = 'x'.repeat(61); },
      (d: ReturnType<typeof defaultData>) => { d.foods = Array.from({ length: 501 }, (_, i) => ({ ...d.foods[0], id: String(i) })); },
    ];
    mutations.forEach(mutate => { const data = defaultData(); mutate(data); expect(() => parseData(exportData(data))).toThrow(); });
    expect(() => parseData(JSON.stringify({ ...defaultData(), settings: { ...DEFAULT_SETTINGS, avoidRecent: 2 } }))).toThrow();
  });
});
