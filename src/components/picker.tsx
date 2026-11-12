'use client';
import { useLocale } from '@/components/locale-provider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check, CircleHelp, Clock3, Dices, ListFilter, Plus, RotateCcw, Shuffle, Sparkles, Utensils, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { eligibleFoods, pickFood, wheelGroups, winningRotation } from '@/lib/random';
import { dateLabel } from '@/lib/utils';
import type { AppData, Food, PickMode, Settings } from '@/lib/types';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Tooltip } from './ui/tooltip';
import { GlassPill } from './ui/glass-pill';
import { GlassSelect } from './ui/glass-select';
import { Wheel } from './wheel';
import { QuickPick } from './quick-pick';
import { ResultDialog } from './result-dialog';
interface Props { data: AppData; update: (updater: (data: AppData) => AppData) => void; onManage: () => void; onAdd: () => void; onHistory: () => void; onSettings: () => void; onBusyChange: (busy: boolean) => void }
export function Picker({ data, update, onManage, onAdd, onHistory, onSettings, onBusyChange }: Props) {
  const { t, foodName, categoryName, locale } = useLocale();
  const [mode, setMode] = useState<PickMode>('wheel');
  const [category, setCategory] = useState('all');
  const [excluded, setExcluded] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Food | null>(null);
  const [quickFood, setQuickFood] = useState<Food | null>(null);
  const busy = useRef(false);
  const confirmed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = data.settings.reducedMotion || !!prefersReducedMotion;
  const activeCategory = category === 'all' || data.categories.includes(category) ? category : 'all';
  const candidates = useMemo(() => eligibleFoods(data.foods, data.history, data.settings.avoidRecent, activeCategory, excluded), [data, activeCategory, excluded]);
  const menu = data.foods.filter(food => activeCategory === 'all' || food.category === activeCategory);
  const activeCategories = data.categories.filter(cat => data.foods.some(food => food.category === cat));
  useEffect(() => () => { timers.current.forEach(clearTimeout); onBusyChange(false); }, [onBusyChange]);
  const start = () => {
    if (busy.current || !candidates.length) return;
    const winner = pickFood(candidates);
    if (!winner) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    confirmed.current = false;
    busy.current = true; setSpinning(true); setResult(null); onBusyChange(true);
    const groups = wheelGroups(candidates);
    const winningGroup = groups.findIndex(group => group.some(food => food.id === winner.id));
    setRotation(previous => winningRotation(previous, winningGroup, groups.length));
    const duration = reducedMotion ? 100 : mode === 'wheel' ? 4750 : 2400;
    if (mode === 'quick' && !reducedMotion) {
      let elapsed = 0;
      const tick = () => {
        elapsed += 90 + elapsed * 0.07;
        if (elapsed < duration - 200) { setQuickFood(pickFood(candidates)); timers.current.push(setTimeout(tick, 90 + elapsed * 0.07)); }
      };
      tick();
    }
    timers.current.push(setTimeout(() => { setQuickFood(winner); setResult(winner); setSpinning(false); busy.current = false; onBusyChange(false); }, duration));
  };
  const confirm = () => {
    if (!result || confirmed.current) return;
    confirmed.current = true;
    update(previous => ({ ...previous, history: [{ id: crypto.randomUUID(), foodId: result.id, name: result.name, emoji: result.emoji, category: result.category, pickedAt: new Date().toISOString() }, ...previous.history].slice(0, 1000) }));
    setResult(null); toast.success(t("Enjoy your {name}! Saved to your history.", { name: foodName(result).toLocaleLowerCase(locale) }), { icon: <span>{result.emoji}</span> });
  };
  const removeForNow = () => {
    if (!result) return;
    const removed = result;
    setExcluded(previous => [...previous, removed.id]); setResult(null);
    toast(t("{name} is sitting this round out.", { name: foodName(removed) }), { action: { label: t("Undo"), onClick: () => setExcluded(previous => previous.filter(id => id !== removed.id)) } });
  };
  return <>
    <section className="hero">
      <h1>{t("What should we")}<br className="mobile-break" /> <em>{t("eat today?")}</em></h1>
      <p>{t("Too many choices? Let BitePick decide.")}</p>
    </section>
    <div className="picker-toolbar"><div className="mode-switch" aria-label={t("Selection mode")}>
      <button className={mode === 'wheel' ? 'active' : ''} aria-pressed={mode === 'wheel'} disabled={spinning} onClick={() => setMode('wheel')}>{mode === 'wheel' && <GlassPill id="mode-pill" radius={11} />}<Dices size={17} /> {t("Spin the Wheel")}</button>
      <button className={mode === 'quick' ? 'active' : ''} aria-pressed={mode === 'quick'} disabled={spinning} onClick={() => setMode('quick')}>{mode === 'quick' && <GlassPill id="mode-pill" radius={11} />}<Zap size={17} /> {t("Quick Pick")}</button>
    </div></div>
    <section className="decision-card">
      <div className="wheel-panel"><div className="wheel-panel-top"><span className="live-label"><i /> {t("{count} delicious possibilities", { count: candidates.length })}</span><Tooltip label={t("Every eligible food has an equal chance of being picked.")}><button className="icon-button help-button" aria-label={t("How random selection works")}><CircleHelp size={17} /></button></Tooltip></div>
        {candidates.length ? <>
          {mode === 'wheel' ? <Wheel foods={candidates} rotation={rotation} spinning={spinning} reducedMotion={reducedMotion} /> : <QuickPick food={quickFood} spinning={spinning} />}
          <div className="pick-action"><Button onClick={start} disabled={spinning} className="pick-button"><Shuffle size={20} className={spinning && !reducedMotion ? 'spinning-icon' : ''} /> {spinning ? t("A delicious decision in the making…") : t("Pick for Me!")}{!spinning && <ArrowRight size={19} />}</Button>
            <p aria-live="polite">{spinning ? t("A little suspense makes it taste better.") : candidates.length > 12 ? t("{count} foods in grouped slices. Same fair odds for every food.", { count: candidates.length }) : t("No wrong answers. Just good food.")}</p>
          </div>
        </> : <div className="picker-empty"><div className="empty-emoji">{data.foods.length ? '🥄' : '🍽️'}</div><h2>{data.foods.length ? t("A little too picky?") : t("Start with a craving.")}</h2><p>{data.foods.length ? t("No foods match right now. Adjust your filters, enable a few favorites, or bring back skipped picks.") : t("Add something you love. We’ll take care of the deciding.")}</p><Button onClick={() => { if (!data.foods.length) onAdd(); else { setCategory('all'); setExcluded([]); update(p => ({ ...p, settings: { ...p.settings, avoidRecent: 0 } })); if (!data.foods.some(f => f.enabled)) onManage(); } }}>{data.foods.length ? t("Adjust my menu") : t("Add my first food")}<ArrowRight size={16} /></Button></div>}
        <div className="wheel-bottom"><label className="avoid-control"><Clock3 size={15} /><span>{t("Avoid recent picks")}</span><GlassSelect className="glass-field glass-field-compact" label={t("Avoid recent picks")} value={String(data.settings.avoidRecent)} disabled={spinning} onValueChange={value => update(p => ({ ...p, settings: { ...p.settings, avoidRecent: Number(value) as Settings['avoidRecent'] } }))} options={[{ value: '0', label: t("Off") }, { value: '1', label: t("Last 1") }, { value: '3', label: t("Last 3") }, { value: '5', label: t("Last 5") }]} /></label>
          <Tooltip label={reducedMotion ? t("Reduced motion is on. Change it in Settings.") : t("You can turn off animations in Settings.")}><button className="icon-button" aria-label={t("Animation preferences")} onClick={onSettings} disabled={spinning}><Sparkles size={15} /></button></Tooltip>
        </div>
      </div>
      <aside className="menu-panel"><div className="menu-heading"><div><span className="section-kicker">{t("YOUR FAVORITES, YOUR RULES")}</span><h2>{t("On the menu")} <span>{data.foods.length}</span></h2></div><Tooltip label={t("Manage your food list")}><button className="icon-button" aria-label={t("Manage food list")} onClick={onManage} disabled={spinning}><ArrowUpRight size={20} /></button></Tooltip></div>
        <GlassSelect className="category-filter" icon={<ListFilter size={15} />} label={t("Filter wheel by category")} value={activeCategory} disabled={spinning} onValueChange={setCategory} options={[{ value: 'all', label: t("All cravings") }, ...activeCategories.map(cat => ({ value: cat, label: categoryName(cat) }))]} />
        <div className="menu-scroll">{menu.length ? menu.map((food, index) => {
          const available = candidates.some(f => f.id === food.id);
          const reason = excluded.includes(food.id) ? t("Skipped this round") : food.enabled && !available ? t("Recently picked") : categoryName(food.category);
          return <div className={`menu-food ${!food.enabled ? 'food-disabled' : ''}`} key={food.id}><span className={`food-emoji emoji-bg-${index % 5}`}>{food.emoji}</span><div className="food-info"><strong>{foodName(food)}</strong><span>{reason}</span></div><Switch checked={food.enabled} disabled={spinning} label={t("Include {name}", { name: foodName(food) })} onCheckedChange={enabled => update(p => ({ ...p, foods: p.foods.map(f => f.id === food.id ? { ...f, enabled } : f) }))} /></div>;
        }) : <div className="menu-empty"><Utensils size={26} /><p>{t("Your next favorite belongs here.")}</p></div>}</div>
        <button className="add-menu-button" onClick={onAdd} disabled={spinning}><Plus size={17} /> {t("Add a craving")}</button>
        <div className="menu-footer"><span><Check size={13} /> {t("{count} ready to pick", { count: candidates.length })}</span>{excluded.length > 0 ? <button disabled={spinning} onClick={() => setExcluded([])}><RotateCcw size={12} /> {t("Restore skipped")}</button> : <button disabled={spinning} onClick={onManage}>{t("Edit list")} <ArrowRight size={12} /></button>}</div>
      </aside>
    </section>
    <section className="recent-section"><div className="recent-header"><h2><Clock3 size={17} /> {t("Recently on your plate")}</h2><button className="text-button" onClick={onHistory} disabled={spinning}>{t("View history")} <ArrowRight size={14} /></button></div>
      {data.history.length ? <div className="recent-grid">{data.history.slice(0, 3).map(entry => <div className="recent-card" key={entry.id}><span>{entry.emoji}</span><div><strong>{foodName(entry)}</strong><p>{categoryName(entry.category)} <i>·</i> {dateLabel(entry.pickedAt, locale)}</p></div></div>)}</div> : <div className="recent-empty"><span>🍴</span><p>{t("Your food story starts with the first pick.")}<br /><span>{t("Confirm a choice, and we’ll save the memory here.")}</span></p></div>}
    </section>

    <ResultDialog food={result} onClose={() => setResult(null)} onConfirm={confirm} onRetry={start} onExclude={removeForNow} reducedMotion={reducedMotion} />
  </>;
}
