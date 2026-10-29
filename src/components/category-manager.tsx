'use client';
import { useLocale } from '@/components/locale-provider';
import { useState } from 'react';
import { Check, FolderOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { AppData } from '@/lib/types';
import { Dialog, ConfirmDialog } from './ui/dialog';
import { Button } from './ui/button';
export function CategoryManager({ data, update, onClose }: { data: AppData; update: (fn: (p: AppData) => AppData) => void; onClose: () => void }) {
  const { t, categoryName } = useLocale();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const validate = (value: string, original?: string) => {
    if (!value.trim()) return t("Give this category a name.");
    if (value.trim().toLowerCase() === 'all') return t("“All” is reserved for the full menu. Choose another name.");
    if (data.categories.some(cat => cat !== original && (cat.toLowerCase() === value.trim().toLowerCase() || categoryName(cat).toLowerCase() === value.trim().toLowerCase()))) return t("You already have a category with that name.");
    return '';
  };
  const add = (event: React.FormEvent) => {
    event.preventDefault(); const message = validate(name);
    if (message || data.categories.length >= 50) { setError(message || t("You can have up to 50 categories.")); return; }
    update(p => ({ ...p, categories: [...p.categories, name.trim()] })); setName(''); setError(''); toast.success(t("A new home for your cravings."));
  };
  const rename = (original: string) => {
    const nextName = editName.trim() === categoryName(original) ? original : editName.trim();
    const message = validate(nextName, original); if (message) { setError(message); return; }
    update(p => ({ ...p, categories: p.categories.map(cat => cat === original ? nextName : cat), foods: p.foods.map(food => food.category === original ? { ...food, category: nextName } : food) })); setEditing(null); setError(''); toast.success(t("Category renamed."));
  };
  const fallback = data.categories.find(c => c !== deleting) ?? (deleting === 'Custom' ? 'Uncategorized' : 'Custom');
  return <>
    <Dialog open onOpenChange={open => { if (!open) onClose(); }} title={t("Organize your cravings.")} description={t("A little order makes room for more possibilities.")}>
      <form className="inline-add" onSubmit={add}><input placeholder={t("A new category…")} aria-label={t("New category name")} maxLength={32} value={name} onChange={e => { setName(e.target.value); setError(''); }} /><Button type="submit" size="icon" aria-label={t("Add category")}><Plus size={18} /></Button></form>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="category-manager-list">{data.categories.map(category => <div className="category-row" key={category}>
        <FolderOpen size={18} />{editing === category ? <form onSubmit={e => { e.preventDefault(); rename(category); }} className="category-edit"><input aria-label={t("Rename category")} autoFocus maxLength={32} value={editName} onChange={e => setEditName(e.target.value)} /><button className="icon-button" type="submit" aria-label={t("Save category name")}><Check size={17} /></button><button type="button" className="icon-button" onClick={() => { setEditing(null); setError(''); }} aria-label={t("Cancel rename")}><X size={17} /></button></form> : <><strong>{categoryName(category)}<small>{t("{count} foods", { count: data.foods.filter(f => f.category === category).length })}</small></strong><button className="icon-button" aria-label={t("Rename {name}", { name: categoryName(category) })} onClick={() => { setEditing(category); setEditName(categoryName(category)); setError(''); }}><Pencil size={15} /></button><button className="icon-button danger-text" aria-label={t("Delete {name}", { name: categoryName(category) })} onClick={() => setDeleting(category)}><Trash2 size={15} /></button></>}
      </div>)}</div>
      <p className="fine-print category-footnote">{t("Renaming keeps your foods together. History keeps the original category.")}</p>
    </Dialog>
    <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }} title={t("Delete “{name}”?", { name: categoryName(deleting ?? "") })} description={t("Foods in this category will move to “{name}”. Your foods and history will be kept.", { name: categoryName(fallback) })} onConfirm={() => { update(p => ({ ...p, categories: [...p.categories.filter(c => c !== deleting), ...(!p.categories.includes(fallback) ? [fallback] : [])], foods: p.foods.map(f => f.category === deleting ? { ...f, category: fallback } : f) })); setEditing(null); toast.success(t("Category deleted. Your cravings are safe.")); }} />
  </>;
}
