'use client';
import { createLocale } from '@/lib/i18n';
import { LocaleProvider } from './locale-provider';
import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Check, ChevronRight, CircleAlert, Clock3, Dices, Heart, Leaf, LoaderCircle, Moon, Settings2, ShieldCheck, Sun, Utensils, UtensilsCrossed } from 'lucide-react';
import { Toaster } from 'sonner';
import { useBitePick } from '@/hooks/use-bitepick';
import type { Food, View } from '@/lib/types';
import { Picker } from './picker';
import { FoodManager } from './food-manager';
import { FoodEditor } from './food-editor';
import { History } from './history';
import { Settings } from './settings';
import { Tooltip, TooltipProvider } from './ui/tooltip';
import { GlassPill } from './ui/glass-pill';
export function AppShell() {
  const { data, update, ready, saveState } = useBitePick();
  const { t } = createLocale(data.settings.language);
  const navigation = [{ id: 'pick', label: t("Let’s decide"), icon: Dices }, { id: 'foods', label: t("My food list"), icon: Utensils }, { id: 'history', label: t("Pick history"), icon: Clock3 }] as const;
  const [view, setView] = useState<View>('pick');
  const [editor, setEditor] = useState<Food | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = (next: View) => { if (!busy) { setView(next); window.scrollTo({ top: 0, behavior: 'instant' }); } };
  const title = view === 'pick' ? t("A good meal starts here") : view === 'foods' ? t("Your personal menu") : view === 'history' ? t("A taste of the past") : t("The little details");
  return <LocaleProvider language={data.settings.language}><MotionConfig reducedMotion={data.settings.reducedMotion ? 'always' : 'user'}><TooltipProvider><Toaster containerAriaLabel={t("Notifications")} position="bottom-center" richColors toastOptions={{ className: 'bite-toast' }} />
    <a href="#main-content" className="skip-link">{t("Skip to content")}</a>
    <div className="app-layout"><aside className="sidebar"><button className="brand" onClick={() => navigate('pick')} disabled={busy} aria-label={t("BitePick home")}><span className="brand-mark"><UtensilsCrossed size={25} strokeWidth={1.8} /></span><span>BitePick<span className="brand-period">.</span></span></button>
      <p className="brand-tagline">{t("Good food. Easy decisions.")}</p><div className="nav-label">{t("AT YOUR TABLE")}</div>
      <nav aria-label={t("Main navigation")} className="main-nav">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} disabled={busy} onClick={() => navigate(id)}>{view === id && <GlassPill id="nav-pill" radius={14} />}<Icon size={19} /><span>{label}</span>{id === 'foods' && <small aria-hidden="true">{ready ? data.foods.length : '–'}</small>}{id === 'pick' && view === id && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><div className="note-illustration"><span>🍅</span><Leaf size={25} /></div><p>{t("Life’s too short for")}<br /><em>{t("“I don’t know, you pick.”")}</em></p><span>{t("LET’S MAKE IT DELICIOUS.")}</span></div><button className={`settings-nav ${view === 'settings' ? 'active' : ''}`} disabled={busy} aria-current={view === 'settings' ? 'page' : undefined} onClick={() => navigate('settings')}><Settings2 size={18} /><span>{t("Settings")}</span><ChevronRight size={15} /></button><div className="sidebar-footer"><span className="tiny-logo"><Heart size={12} /> {t("Made for good company")}</span><span>v1.0</span></div></div>
    </aside>
    <div className="app-main"><header className="topbar"><span className="topbar-title"><span className="mini-sun">✳</span>{title}</span><div className="topbar-actions"><span className={`save-status ${saveState === 'error' ? 'save-error' : ''}`} aria-live="polite">{saveState === 'saving' ? <LoaderCircle size={13} className="spinning-icon" /> : saveState === 'error' ? <CircleAlert size={13} /> : <ShieldCheck size={14} />}<span>{saveState === 'saving' ? t("Saving changes…") : saveState === 'error' ? t("Storage needs attention") : t("Saved on this device")}</span></span><button className="language-toggle" aria-label={t(data.settings.language === 'zh' ? 'Switch to English' : 'Switch to Chinese')} title={t("Choose your language")} disabled={!ready || busy} onClick={() => update(p => ({ ...p, settings: { ...p.settings, language: p.settings.language === 'zh' ? 'en' : 'zh' } }))}><span lang="zh-CN" className={data.settings.language === 'zh' ? 'selected' : ''}>中</span><span aria-hidden="true">/</span><span lang="en" className={data.settings.language === 'en' ? 'selected' : ''}>EN</span></button><span className="topbar-divider" /><Tooltip label={t("Switch light / dark theme")}><button className="theme-toggle icon-button" aria-label={t("Toggle color theme")} disabled={busy} onClick={() => update(p => ({ ...p, settings: { ...p.settings, theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' } }))}><Sun className="sun-icon" size={18} /><Moon className="moon-icon" size={18} /></button></Tooltip></div></header>
      <main id="main-content" tabIndex={-1} className={`content content-${view}`}>
        {!ready ? <div className="loading-skeleton" aria-label={t("Loading your menu")} role="status"><div /><div /><div /><span className="sr-only">{t("Setting the table…")}</span></div> : <>
          {view === 'pick' && <Picker data={data} update={update} onManage={() => navigate('foods')} onAdd={() => setEditor('new')} onHistory={() => navigate('history')} onBusyChange={setBusy} />}
          {view === 'foods' && <FoodManager data={data} update={update} onAdd={() => setEditor('new')} onEdit={setEditor} />}
          {view === 'history' && <History data={data} update={update} onPick={() => navigate('pick')} />}
          {view === 'settings' && <Settings data={data} update={update} />}
        </>}
      </main>
      <nav className="mobile-nav" aria-label={t("Mobile navigation")}>{[...navigation, { id: 'settings' as const, label: t("Settings"), icon: Settings2 }].map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => navigate(id)} disabled={busy}>{view === id && <GlassPill id="mobile-nav-pill" radius={12} />}<Icon size={20} /><span>{id === 'pick' ? t("Decide") : id === 'foods' ? t("My foods") : label === t("Pick history") ? t("History") : label}</span></button>)}</nav>
    </div></div>
    {editor && <FoodEditor key={editor === 'new' ? 'new' : editor.id} food={editor} data={data} onClose={() => setEditor(null)} onSave={food => update(p => ({ ...p, categories: p.categories.includes(food.category) ? p.categories : [...p.categories, food.category], foods: p.foods.some(f => f.id === food.id) ? p.foods.map(f => f.id === food.id ? food : f) : [...p.foods, food] }))} />}
    <div className="sr-only" aria-live="polite">{saveState === 'saved' && <><Check />{t("Changes saved.")}</>}</div>
  </TooltipProvider></MotionConfig></LocaleProvider>;
}
