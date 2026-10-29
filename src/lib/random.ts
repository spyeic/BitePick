import type { Food, HistoryEntry, Settings } from './types';

export function eligibleFoods(foods: Food[], history: HistoryEntry[], avoidRecent: Settings['avoidRecent'], category = 'all', excluded: readonly string[] = []): Food[] {
  const recent = new Set([...history].sort((a, b) => Date.parse(b.pickedAt) - Date.parse(a.pickedAt)).slice(0, avoidRecent).map(entry => entry.foodId));
  const skipped = new Set(excluded);
  return foods.filter(food => food.enabled && (category === 'all' || food.category === category) && !recent.has(food.id) && !skipped.has(food.id));
}

/** Rejection sampling avoids modulo bias. Every eligible food has equal odds. */
export function randomIndex(length: number, uint32: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0]): number {
  if (!Number.isSafeInteger(length) || length < 1 || length > 0x100000000) throw new RangeError('A nonempty candidate pool is required.');
  const limit = 0x100000000 - (0x100000000 % length);
  let value: number;
  do { value = uint32(); } while (value >= limit);
  return value % length;
}
export function pickFood(foods: Food[], uint32?: () => number): Food | null {
  return foods.length ? foods[randomIndex(foods.length, uint32)] : null;
}

/** Many foods share visual wedges only; the draw still samples individual foods. */
export function wheelGroups(foods: Food[]): Food[][] {
  const count = Math.min(foods.length, 12);
  return Array.from({ length: count }, (_, index) => foods.slice(Math.floor(index * foods.length / count), Math.floor((index + 1) * foods.length / count)));
}
export function winningRotation(current: number, index: number, count: number): number {
  if (count < 1 || index < 0 || index >= count) throw new RangeError('Invalid wheel segment.');
  const target = (360 - index * 360 / count) % 360;
  const offset = (target - current % 360 + 360) % 360;
  return current + 360 * 6 + offset;
}
