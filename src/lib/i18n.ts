import messages from './messages.json';
import { defaultFoods } from './defaults';
import type { Food, HistoryEntry, Language } from './types';
export type MessageKey = keyof typeof messages;
export type MessageParams = Record<string, string | number>;
const foodTranslations = ['湘菜', '粤菜', '川菜', '日料', '火锅', '韩式烤肉', '日式烤肉', '泰餐', '韩餐', '西餐', '汉堡'];
/** Earlier seed menus, so foods saved before a menu change still translate. */
const legacySeeds: [string, string][][] = [[['Sushi', '寿司'], ['Ramen', '拉面'], ['Hot Pot', '火锅'], ['Korean BBQ', '韩式烤肉'], ['Pizza', '披萨'], ['Burgers', '汉堡'], ['Pasta', '意大利面'], ['Tacos', '墨西哥卷饼'], ['Chinese Food', '中餐'], ['Thai Food', '泰餐'], ['Fried Chicken', '炸鸡'], ['Poke Bowl', '波奇碗']]];
const categoryTranslations: Record<string, string> = { Asian: '亚洲美食', Western: '西式美食', 'Fast Food': '快餐小吃', Healthy: '健康轻食', Dessert: '甜品', Custom: '自定义', Uncategorized: '未分类' };
const seeds = defaultFoods();
export function translate(language: Language, key: MessageKey, params: MessageParams = {}): string {
  const template = language === 'zh' ? messages[key] : key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => params[name] === undefined ? match : String(params[name]));
}
/** Translate only untouched seed names. Custom names and stored records stay intact. */
export function localizedFoodName(language: Language, food: Pick<Food, 'id' | 'name'> | Pick<HistoryEntry, 'foodId' | 'name'>): string {
  if (language === 'en') return food.name;
  const id = 'foodId' in food ? food.foodId : food.id;
  const index = seeds.findIndex(seed => seed.id === id && seed.name === food.name);
  if (index >= 0) return foodTranslations[index];
  for (const legacy of legacySeeds) {
    const match = legacy.find(([name], i) => id === `default-${i + 1}` && name === food.name);
    if (match) return match[1];
  }
  return food.name;
}
export function localizedCategoryName(language: Language, category: string): string {
  return language === 'zh' ? categoryTranslations[category] ?? category : category;
}
export function localizeError(language: Language, message: string): string {
  return Object.hasOwn(messages, message) ? translate(language, message as MessageKey) : translate(language, 'This file could not be read. Try a BitePick JSON export.');
}
export function createLocale(language: Language) {
  return {
    language,
    locale: language === 'zh' ? 'zh-CN' : 'en-US',
    t: (key: MessageKey, params?: MessageParams) => translate(language, key, params),
    foodName: (food: Pick<Food, 'id' | 'name'> | Pick<HistoryEntry, 'foodId' | 'name'>) => localizedFoodName(language, food),
    categoryName: (category: string) => localizedCategoryName(language, category),
  };
}
