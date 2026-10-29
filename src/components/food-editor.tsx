'use client';
import { useLocale } from '@/components/locale-provider';
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EMOJIS } from '@/lib/defaults';
import type { AppData, Food } from '@/lib/types';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { GlassSelect } from './ui/glass-select';
export function FoodEditor({ food, data, onClose, onSave }: { food: Food | 'new'; data: AppData; onClose: () => void; onSave: (food: Food) => void }) {
  const { t, foodName, categoryName } = useLocale();
  const editing = food !== 'new';
  const [name, setName] = useState(editing ? foodName(food) : '');
  const [emoji, setEmoji] = useState(editing ? food.emoji : '🍽️');
  const [category, setCategory] = useState(editing ? food.category : data.categories.includes('Custom') ? 'Custom' : data.categories[0] ?? 'Custom');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !emoji.trim()) { setError(t("Give your craving a name and an emoji.")); return; }
    if (!editing && data.foods.length >= 500) { setError(t("Your menu is full (500 foods). Remove a food to make room.")); return; }
    if (data.foods.some(f => (f.name.toLowerCase() === name.trim().toLowerCase() || foodName(f).toLowerCase() === name.trim().toLowerCase()) && (!editing || f.id !== food.id))) { setError(t("That craving is already on your menu. Try a different name.")); return; }
    onSave({ id: editing ? food.id : crypto.randomUUID(), name: editing && name.trim() === foodName(food) ? food.name : name.trim(), emoji: emoji.trim(), category, enabled: editing ? food.enabled : true, createdAt: editing ? food.createdAt : new Date().toISOString() });
    toast.success(editing ? t("Craving updated. Looking delicious!") : t("{name} is on the menu.", { name: name.trim() })); onClose();
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }} title={editing ? t("A little menu makeover.") : t("What are you craving?")} description={editing ? t("Make this favorite feel like yours.") : t("Your favorite restaurant, a comfort food, anything delicious.")}>
    <form onSubmit={submit} className="food-form"><div className="food-preview"><span>{emoji || '🍽️'}</span><div><strong>{name || t("Your next favorite")}</strong><p>{categoryName(category)}</p></div></div>
      <label className="field-label">{t("Food name")}<input autoFocus required maxLength={60} value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder={t("e.g. Friday-night dumplings")} /></label>
      <div className="form-two-columns"><label className="field-label">{t("Emoji")}<input aria-label={t("Food emoji")} required maxLength={20} value={emoji} onChange={e => setEmoji(e.target.value)} /></label><label className="field-label">{t("Category")}<GlassSelect label={t("Category")} value={category} onValueChange={setCategory} options={(data.categories.length ? data.categories : ['Custom']).map(cat => ({ value: cat, label: categoryName(cat) }))} /></label></div>
      <div><p className="field-label emoji-label">{t("Pick a little personality")}</p><div className="emoji-grid">{EMOJIS.map(item => <button type="button" key={item} className={emoji === item ? 'selected' : ''} aria-label={t("Use {emoji}", { emoji: item })} aria-pressed={emoji === item} onClick={() => setEmoji(item)}>{item}</button>)}</div></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions"><Button type="button" variant="secondary" onClick={onClose}>{t("Cancel")}</Button><Button type="submit">{editing ? <Check size={17} /> : <Plus size={17} />}{editing ? t("Save changes") : t("Add to my menu")}</Button></div>
    </form>
  </Dialog>;
}
