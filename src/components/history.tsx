'use client';
import { useLocale } from '@/components/locale-provider';
import { useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, Heart, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AppData } from '@/lib/types';
import { Button } from './ui/button';
import { ConfirmDialog } from './ui/dialog';
export function History({ data, update, onPick }: { data: AppData; update: (fn: (p: AppData) => AppData) => void; onPick: () => void }) {
  const { t, foodName, categoryName, locale } = useLocale();
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<string | 'all' | null>(null);
  const filtered = data.history.filter(entry => `${entry.name} ${entry.category} ${foodName(entry)} ${categoryName(entry.category)}`.toLowerCase().includes(query.toLowerCase()));
  const groups = new Map<string, typeof filtered>();
  filtered.forEach(entry => { const key = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(entry.pickedAt)); groups.set(key, [...(groups.get(key) ?? []), entry]); });
  return <section className="subpage"><div className="page-heading"><div><span className="eyebrow"><span /> {t("LITTLE DECISIONS, GOOD MEMORIES")}</span><h1>{t("Your food")} <em>{t("story.")}</em></h1><p>{t("A delicious little record of the choices you said yes to.")}</p></div><Button variant="secondary" disabled={!data.history.length} onClick={() => setDeleting('all')}><Trash2 size={16} /> {t("Clear history")}</Button></div>
    <div className="history-stats"><div><Clock3 size={21} /><strong>{data.history.length}</strong><span>{t("happy decisions")}</span></div><div><Heart size={21} /><strong>{new Set(data.history.map(h => h.foodId)).size}</strong><span>{t("different cravings")}</span></div><div><CalendarDays size={21} /><strong>{new Set(data.history.map(h => new Date(h.pickedAt).toLocaleDateString(locale))).size}</strong><span>{t("delicious days")}</span></div></div>
    {!!data.history.length && <div className="search-input history-search"><Search size={17} /><input aria-label={t("Search history")} placeholder={t("Remember that great pick?")} value={query} onChange={e => setQuery(e.target.value)} /></div>}
    {filtered.length ? <div className="history-groups">{[...groups.entries()].map(([date, entries]) => <section key={date}><h2>{date}<span>{t(entries.length === 1 ? "{count} pick" : "{count} picks", { count: entries.length })}</span></h2><div className="history-list">{entries.map((entry, index) => <article className="history-row" key={entry.id}><span className={`food-emoji emoji-bg-${index % 5}`}>{entry.emoji}</span><div><h3>{foodName(entry)}</h3><p>{categoryName(entry.category)}</p></div><time dateTime={entry.pickedAt}>{new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(entry.pickedAt))}</time><button className="icon-button" aria-label={t("Delete {name} from history", { name: foodName(entry) })} onClick={() => setDeleting(entry.id)}><Trash2 size={16} /></button></article>)}</div></section>)}</div> : <div className="empty-state history-empty"><span className="empty-emoji">🍴</span><h2>{query ? t("No matching memories.") : t("Good memories start with a bite.")}</h2><p>{query ? t("Try searching for a different food or category.") : t("Pick something delicious and tap “Let’s Eat!” to start your food story.")}</p><Button onClick={query ? () => setQuery('') : onPick}>{query ? t("Clear search") : t("Make my first pick")}<ArrowRight size={17} /></Button></div>}
    <p className="history-note">{t("Only “Let’s Eat!” moments live here. Your latest 1,000 picks are kept.")}</p>
    <ConfirmDialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }} title={deleting === 'all' ? t("Clear your food story?") : t("Remove this memory?")} description={deleting === 'all' ? t("All saved picks will be deleted. This also resets which foods are excluded by Avoid recent picks.") : t("This pick will be removed from history and from the recent-pick exclusion count.")} actionLabel={deleting === 'all' ? t("Clear history") : t("Remove pick")} onConfirm={() => { update(p => ({ ...p, history: deleting === 'all' ? [] : p.history.filter(h => h.id !== deleting) })); toast.success(t("History updated.")); }} />
  </section>;
}
