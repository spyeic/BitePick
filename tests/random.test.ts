import { describe, expect, it } from 'vitest';
import { defaultFoods } from '../src/lib/defaults';
import { eligibleFoods, pickFood, randomIndex, wheelGroups, winningRotation } from '../src/lib/random';
import type { HistoryEntry } from '../src/lib/types';
const foods = defaultFoods();
const history: HistoryEntry[] = foods.slice(0, 5).map((food, i) => ({ id: `history-${i}`, foodId: food.id, name: food.name, emoji: food.emoji, category: food.category, pickedAt: new Date(Date.UTC(2026, 9, 28 - i)).toISOString() }));
describe('candidate pool', () => {
  it('includes all enabled foods by default', () => expect(eligibleFoods(foods, [], 0)).toEqual(foods));
  it('excludes disabled foods without mutating the source', () => {
    const input = foods.map((f, i) => ({ ...f, enabled: i !== 0 }));
    expect(eligibleFoods(input, [], 0)).toHaveLength(10); expect(input[0].enabled).toBe(false);
  });
  it('applies category and temporary exclusions together', () => {
    const result = eligibleFoods(foods, [], 0, 'Asian', [foods[0].id]);
    expect(result.every(f => f.category === 'Asian')).toBe(true);
    expect(result.some(f => f.id === foods[0].id)).toBe(false); expect(result).toHaveLength(8);
  });
  it.each([0, 1, 3, 5] as const)('excludes the last %i confirmed picks', count => {
    const result = eligibleFoods(foods, history, count);
    expect(result).toHaveLength(11 - count);
    expect(result.some(f => history.slice(0, count).some(h => h.foodId === f.id))).toBe(false);
  });
  it('orders imported history by timestamp instead of relying on array order', () => {
    expect(eligibleFoods(foods, [...history].reverse(), 1)).not.toContainEqual(foods[0]);
  });
  it('counts history entries, including repeated picks, rather than unique foods', () => {
    const repeated = [history[0], { ...history[0], id: 'repeat', pickedAt: history[1].pickedAt }, history[2]];
    expect(eligibleFoods(foods, repeated, 3)).toHaveLength(9);
  });
  it('handles an empty pool, unknown category, all disabled, and full exclusion', () => {
    expect(eligibleFoods([], [], 0)).toEqual([]);
    expect(eligibleFoods(foods, [], 0, 'Missing')).toEqual([]);
    expect(eligibleFoods(foods.map(f => ({ ...f, enabled: false })), [], 0)).toEqual([]);
    expect(eligibleFoods(foods.slice(0, 3), history, 3)).toEqual([]);
  });
  it('uses stable IDs when a food is renamed and ignores deleted history foods', () => {
    const renamed = foods.map(f => ({ ...f, name: 'Renamed' }));
    expect(eligibleFoods(renamed, history, 1).some(f => f.id === foods[0].id)).toBe(false);
    expect(eligibleFoods(foods, [{ ...history[0], foodId: 'deleted' }], 1)).toHaveLength(11);
  });
});
describe('fair selection', () => {
  it('returns null for no choices and the only food for one choice', () => {
    expect(pickFood([])).toBeNull(); expect(pickFood([foods[0]], () => 0)).toEqual(foods[0]);
  });
  it('gives each candidate the same number of slots in an accepted random range', () => {
    const counts = Array(12).fill(0);
    for (let i = 0; i < 12000; i++) counts[randomIndex(12, () => i)]++;
    expect(counts).toEqual(Array(12).fill(1000));
  });
  it('rejects the biased tail of the 32-bit range before taking the modulo', () => {
    const values = [0xffffffff, 0xfffffffe, 0xfffffffd, 0xfffffffc, 17];
    let calls = 0;
    expect(randomIndex(12, () => values[calls++])).toBe(5); expect(calls).toBe(5);
  });
  it('rejects invalid pool sizes', () => {
    for (const size of [0, -1, 1.5, Infinity, 0x100000001]) expect(() => randomIndex(size)).toThrow(RangeError);
  });
  it('selects all foods even when they share a visual wedge', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ ...foods[0], id: `food-${i}` }));
    const groups = wheelGroups(many);
    expect(groups.length).toBe(12); expect(groups.flat()).toEqual(many);
    expect(new Set(Array.from({ length: 500 }, (_, i) => pickFood(many, () => i)?.id)).size).toBe(500);
  });
});
describe('wheel geometry', () => {
  it.each([1, 2, 3, 7, 12])('places the chosen wedge under the top pointer for %i segments', count => {
    for (let index = 0; index < count; index++) {
      const current = 1327.6;
      const rotation = winningRotation(current, index, count);
      const angle = ((rotation + index * 360 / count) % 360 + 360) % 360;
      expect(Math.min(angle, 360 - angle)).toBeLessThan(0.00001);
      expect(rotation - current).toBeGreaterThanOrEqual(2160);
    }
  });
  it('keeps all foods in balanced groups with no omissions or duplicates', () => {
    for (const size of [0, 1, 2, 12, 13, 25, 49, 500]) {
      const many = Array.from({ length: size }, (_, i) => ({ ...foods[0], id: String(i) }));
      const groups = wheelGroups(many);
      expect(groups.flat()).toEqual(many);
      if (size) expect(Math.max(...groups.map(g => g.length)) - Math.min(...groups.map(g => g.length))).toBeLessThanOrEqual(1);
    }
  });
});
