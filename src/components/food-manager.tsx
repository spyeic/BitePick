'use client';
import { useLocale } from '@/components/locale-provider';
import { useState } from 'react';
import { ArrowUpRight, Check, FolderOpen, Pencil, Plus, RotateCcw, Search, SlidersHorizontal, Trash2, Utensils, X } from 'lucide-react';
import { toast } from 'sonner';
import { defaultFoods, DEFAULT_CATEGORIES, EMOJIS } from '@/lib/defaults';
import type { AppData, Food } from '@/lib/types';
import { Button } from './ui/button';
import { GlassPill } from './ui/glass-pill';
import { Switch } from './ui/switch';
import { ConfirmDialog } from './ui/dialog';
import { CategoryManager } from './category-manager';
import { Tooltip } from './ui/tooltip';
export function FoodManager({ data, update, onAdd, onEdit }: { data: AppData; update: (fn: (p: AppData) => AppData) => void; onAdd: () => void; onEdit: (food: Food) => void }) {
  const { t, foodName, categoryName } = useLocale();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [restore, setRestore] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickEmoji, setQuickEmoji] = useState('🍽️');
  const activeCategory = category === 'all' || data.categories.includes(category) ? category : 'all';
  const filtered = data.foods.filter(f => (!query || `${f.name} ${foodName(f)}`.toLowerCase().includes(query.toLowerCase())) && (activeCategory === 'all' || f.category === activeCategory));
  const validSelected = selected.filter(id => data.foods.some(f => f.id === id));
  const allSelected = !!filtered.length && filtered.every(f => validSelected.includes(f.id));
  const toggle = (id: string) => setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  const quickAdd = (event: React.FormEvent) => {
    event.preventDefault(); if (!quickName.trim()) return;
    if (data.foods.length >= 500) { toast.error(t("Your menu is full (500 foods).")); return; }
    if (data.foods.some(f => (f.name.toLowerCase() === quickName.trim().toLowerCase() || foodName(f).toLowerCase() === quickName.trim().toLowerCase()))) { toast.error(t("That craving is already on the menu.")); return; }
    const cat = activeCategory !== 'all' ? activeCategory : data.categories.includes('Custom') ? 'Custom' : data.categories[0] ?? 'Custom';
    update(p => ({ ...p, categories: p.categories.includes(cat) ? p.categories : [...p.categories, cat], foods: [...p.foods, { id: crypto.randomUUID(), name: quickName.trim(), emoji: quickEmoji, category: cat, enabled: true, createdAt: new Date().toISOString() }] }));
    setQuickName(''); toast.success(t("One more delicious possibility."));
  };
  return <section className="subpage"><div className="page-heading"><div><span className="eyebrow"><span /> {t("A MENU THAT FEELS LIKE YOU")}</span><h1>{t("My food")} <em>{t("list.")}</em></h1><p>{t("All your favorites. A few future favorites. No wrong choices.")}</p></div><Button onClick={onAdd}><Plus size={18} /> {t("Add food")}</Button></div>
    <div className="food-stats"><span><span className="stat-dot" />{t("{count} enabled", { count: data.foods.filter(f => f.enabled).length })}</span><span>{t("{count} total cravings", { count: data.foods.length })}</span><button onClick={() => setCategoriesOpen(true)}><FolderOpen size={15} />{t("{count} categories", { count: data.categories.length })} <ArrowUpRight size={13} /></button></div>
    <form className="quick-add-bar" onSubmit={quickAdd}><select aria-label={t("Quick add emoji")} value={quickEmoji} onChange={e => setQuickEmoji(e.target.value)}>{EMOJIS.map(emoji => <option key={emoji}>{emoji}</option>)}</select><input aria-label={t("Quick add food name")} maxLength={60} placeholder={t("A new craving? Add it here…")} value={quickName} onChange={e => setQuickName(e.target.value)} required /><Button size="small" type="submit"><Plus size={16} /> {t("Add")}</Button></form>
    <div className="food-toolbar"><div className="search-input"><Search size={17} /><input aria-label={t("Search foods")} placeholder={t("Find a favorite…")} value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="icon-button" aria-label={t("Clear search")} onClick={() => setQuery('')}><X size={14} /></button>}</div><Button variant="secondary" onClick={() => setCategoriesOpen(true)}><SlidersHorizontal size={16} /><span>{t("Categories")}</span></Button></div>
    <div className="category-tabs" aria-label={t("Filter foods by category")}><button className={activeCategory === 'all' ? 'active' : ''} aria-pressed={activeCategory === 'all'} onClick={() => setCategory('all')}>{activeCategory === 'all' && <GlassPill id="category-pill" radius={10} />}{t("All cravings")} <span>{data.foods.length}</span></button>{data.categories.map(cat => <button key={cat} className={activeCategory === cat ? 'active' : ''} aria-pressed={activeCategory === cat} onClick={() => setCategory(cat)}>{activeCategory === cat && <GlassPill id="category-pill" radius={10} />}{categoryName(cat)}<span>{data.foods.filter(f => f.category === cat).length}</span></button>)}</div>
    <div className="selection-bar"><label><input type="checkbox" checked={allSelected} disabled={!filtered.length} onChange={() => setSelected(previous => allSelected ? previous.filter(id => !filtered.some(f => f.id === id)) : [...new Set([...previous, ...filtered.map(f => f.id)])])} />{validSelected.length ? t("{count} selected", { count: validSelected.length }) : t("Select all")}</label>{validSelected.length > 0 ? <div><button onClick={() => { update(p => ({ ...p, foods: p.foods.map(f => validSelected.includes(f.id) ? { ...f, enabled: true } : f) })); setSelected([]); toast.success(t("Selected cravings enabled.")); }}><Check size={14} />{t("Enable")}</button><button className="danger-text" onClick={() => setDeleteIds(validSelected)}><Trash2 size={14} />{t("Delete")}</button><button onClick={() => setSelected([])}>{t("Cancel")}</button></div> : <span>{t(filtered.length === 1 ? "{count} craving" : "{count} cravings", { count: filtered.length })}</span>}</div>
    {filtered.length ? <div className="food-grid">{filtered.map((food, index) => <article className={`food-card ${!food.enabled ? 'is-disabled' : ''} ${validSelected.includes(food.id) ? 'is-selected' : ''}`} key={food.id}>
      <div className="food-card-top"><label className="card-check"><input type="checkbox" aria-label={t("Select {name}", { name: foodName(food) })} checked={validSelected.includes(food.id)} onChange={() => toggle(food.id)} /></label><div><Tooltip label={t("Edit {name}", { name: foodName(food) })}><button className="icon-button" aria-label={t("Edit {name}", { name: foodName(food) })} onClick={() => onEdit(food)}><Pencil size={15} /></button></Tooltip><Tooltip label={t("Delete {name}", { name: foodName(food) })}><button className="icon-button" aria-label={t("Delete {name}", { name: foodName(food) })} onClick={() => setDeleteIds([food.id])}><Trash2 size={15} /></button></Tooltip></div></div>
      <span className={`food-card-emoji emoji-bg-${index % 5}`}>{food.emoji}</span><h2>{foodName(food)}</h2><span className="category-badge">{categoryName(food.category)}</span>
      <div className="food-card-bottom"><span>{food.enabled ? t("On the menu") : t("Taking a break")}</span><Switch label={t("Enable {name}", { name: foodName(food) })} checked={food.enabled} onCheckedChange={enabled => update(p => ({ ...p, foods: p.foods.map(f => f.id === food.id ? { ...f, enabled } : f) }))} /></div>
    </article>)}</div> : <div className="empty-state"><div className="empty-icon"><Utensils size={30} /></div><h2>{data.foods.length ? t("No cravings found.") : t("An empty plate, a fresh start.")}</h2><p>{data.foods.length ? t("Try another search or category.") : t("Add your favorites and let the good decisions begin.")}</p><Button onClick={data.foods.length ? () => { setQuery(''); setCategory('all'); } : onAdd}>{data.foods.length ? t("Clear filters") : t("Add a craving")}<Plus size={16} /></Button></div>}
    <div className="manage-footer"><p>{t("Your menu, your rules. Everything saves automatically.")}</p><button className="text-button" onClick={() => setRestore(true)}><RotateCcw size={14} /> {t("Restore defaults")}</button></div>
    {categoriesOpen && <CategoryManager data={data} update={update} onClose={() => setCategoriesOpen(false)} />}
    <ConfirmDialog open={deleteIds.length > 0} onOpenChange={open => { if (!open) setDeleteIds([]); }} title={t(deleteIds.length === 1 ? "Remove this craving?" : "Remove {count} cravings?", { count: deleteIds.length })} description={t("This removes the food from your menu. Your past picks will stay in your history.")} onConfirm={() => { update(p => ({ ...p, foods: p.foods.filter(f => !deleteIds.includes(f.id)) })); setSelected(p => p.filter(id => !deleteIds.includes(id))); toast.success(t("Menu updated. Room for something new.")); }} />
    <ConfirmDialog open={restore} onOpenChange={setRestore} title={t("Back to the original menu?")} description={t("Your current foods and categories will be replaced with the 11 original favorites and default categories. Your history and settings will be kept.")} actionLabel={t("Restore defaults")} onConfirm={() => { update(p => ({ ...p, foods: defaultFoods(), categories: [...DEFAULT_CATEGORIES] })); setSelected([]); setCategory('all'); setQuery(''); toast.success(t("The original favorites are back.")); }} />
  </section>;
}
