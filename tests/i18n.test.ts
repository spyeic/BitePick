import { describe, expect, it } from 'vitest';
import messages from '../src/lib/messages.json';
import { createLocale, localizedFoodName, translate, type MessageKey } from '../src/lib/i18n';
import { defaultData } from '../src/lib/defaults';
import { exportData, parseData } from '../src/lib/storage';

describe('language compatibility and translation', () => {
  it('defaults new and older version-2 exports to Chinese without changing user data', () => {
    const data = defaultData();
    expect(data.settings.language).toBe('zh');
    const old = JSON.parse(exportData(data)); delete old.settings.language;
    const parsed = parseData(JSON.stringify(old));
    expect(parsed.settings.language).toBe('zh'); expect(parsed.foods).toEqual(data.foods);
    expect(parsed.history).toEqual(data.history); expect(parsed.categories).toEqual(data.categories);
  });
  it('round-trips both languages and rejects unsupported preference values', () => {
    for (const language of ['zh', 'en'] as const) {
      const data = defaultData(); data.settings.language = language;
      expect(parseData(exportData(data)).settings.language).toBe(language);
    }
    const data = defaultData();
    expect(() => parseData(JSON.stringify({ ...data, settings: { ...data.settings, language: 'fr' } }))).toThrow();
  });
  it('has complete, matching interpolation placeholders in both languages', () => {
    const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    for (const [key, value] of Object.entries(messages)) {
      expect(value.trim()).not.toBe(''); expect(placeholders(value)).toEqual(placeholders(key));
      expect(translate('en', key as MessageKey)).toBe(key);
    }
    expect(translate('zh', '{count} foods', { count: 3 })).toBe('3 道美食');
  });
  it('localizes seed food snapshots but leaves edited and custom names intact', () => {
    const food = defaultData().foods[0];
    expect(localizedFoodName('zh', food)).toBe('湘菜');
    expect(localizedFoodName('en', food)).toBe('Hunan Cuisine');
    expect(localizedFoodName('zh', { ...food, name: 'My sushi bar' })).toBe('My sushi bar');
    expect(localizedFoodName('zh', { ...food, id: 'custom-id' })).toBe('Hunan Cuisine');
    expect(localizedFoodName('zh', { foodId: food.id, name: food.name })).toBe('湘菜');
    expect(localizedFoodName('zh', { id: 'default-1', name: 'Sushi' })).toBe('寿司');
    expect(localizedFoodName('zh', { foodId: 'default-12', name: 'Poke Bowl' })).toBe('波奇碗');
    expect(localizedFoodName('zh', { id: 'custom-id', name: 'Sushi' })).toBe('Sushi');
    expect(createLocale('zh').categoryName('Asian')).toBe('亚洲美食');
    expect(createLocale('zh').categoryName('约会菜单')).toBe('约会菜单');
  });
});
