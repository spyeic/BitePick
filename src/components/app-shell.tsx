'use client';
import { createLocale } from '@/lib/i18n';
import { LocaleProvider } from './locale-provider';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MotionConfig } from 'motion/react';
import { Check, ChevronRight, CircleAlert, Clock3, Dices, LoaderCircle, Settings2, ShieldCheck, Utensils, UtensilsCrossed } from 'lucide-react';
import { Toaster } from 'sonner';
import { useBitePick } from '@/hooks/use-bitepick';
import type { Food, View } from '@/lib/types';
import { FoodEditor } from './food-editor';
import { TooltipProvider } from './ui/tooltip';
import { GlassPill } from './ui/glass-pill';
import { AppContext } from './app-context';
import { AppView } from './app-view';
import { ThemeSwitch } from './ui/theme-switch';
export const viewPaths: Record<View, string> = { pick: '/', foods: '/foods', history: '/history', settings: '/settings' };
export function AppShell({ children }: { children?: ReactNode }) {
  const { data, update, ready, saveState } = useBitePick();
  const { t } = createLocale(data.settings.language);
  const navigation = [{ id: 'pick', label: t("Let’s decide"), icon: Dices }, { id: 'foods', label: t("My food list"), icon: Utensils }, { id: 'history', label: t("Pick history"), icon: Clock3 }] as const;
  const pathname = usePathname();
  const router = useRouter();
  const view = (Object.keys(viewPaths) as View[]).find(key => viewPaths[key] === pathname) ?? 'pick';
  const [editor, setEditor] = useState<Food | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = (next: View) => { if (!busy) router.push(viewPaths[next]); };
  const title = view === 'pick' ? t("A good meal starts here") : view === 'foods' ? t("Your personal menu") : view === 'history' ? t("A taste of the past") : t("The little details");
  return <AppContext.Provider value={{ data, update, ready, saveState, navigate, setEditor, setBusy }}><LocaleProvider language={data.settings.language}><MotionConfig reducedMotion={data.settings.reducedMotion ? 'always' : 'user'}><TooltipProvider><Toaster containerAriaLabel={t("Notifications")} position="bottom-center" richColors toastOptions={{ className: 'bite-toast' }} />
    <a href="#main-content" className="skip-link">{t("Skip to content")}</a>
    <div className="app-layout"><aside className="sidebar"><Link href="/" className="brand" onNavigate={e => { if (busy) e.preventDefault(); }} aria-disabled={busy} aria-label={t("BitePick home")}><span className="brand-mark"><UtensilsCrossed size={25} strokeWidth={1.8} /></span><span>BitePick<span className="brand-period">.</span></span></Link>
      <p className="brand-tagline">{t("Good food. Easy decisions.")}</p><div className="nav-label">{t("AT YOUR TABLE")}</div>
      <nav aria-label={t("Main navigation")} className="main-nav">{navigation.map(({ id, label, icon: Icon }) => <Link href={viewPaths[id]} key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} aria-disabled={busy} onNavigate={e => { if (busy) e.preventDefault(); }}>{view === id && <GlassPill id="nav-pill" radius={14} />}<Icon size={19} /><span>{label}</span>{id === 'foods' && <small aria-hidden="true">{ready ? data.foods.length : '–'}</small>}{id === 'pick' && view === id && <span className="nav-active-dot" />}</Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/settings" className={`settings-nav ${view === 'settings' ? 'active' : ''}`} aria-disabled={busy} aria-current={view === 'settings' ? 'page' : undefined} onNavigate={e => { if (busy) e.preventDefault(); }}><Settings2 size={18} /><span>{t("Settings")}</span><ChevronRight size={15} /></Link><div className="sidebar-footer"><span className="tiny-logo">{t("Made for good company")}</span><span>v1.0</span></div></div>
    </aside>
    <div className="app-main"><header className="topbar"><span className="topbar-title">{title}</span><div className="topbar-actions"><span className={`save-status ${saveState === 'error' ? 'save-error' : ''}`} aria-live="polite">{saveState === 'saving' ? <LoaderCircle size={13} className="spinning-icon" /> : saveState === 'error' ? <CircleAlert size={13} /> : <ShieldCheck size={14} />}<span>{saveState === 'saving' ? t("Saving changes…") : saveState === 'error' ? t("Storage needs attention") : t("Saved on this device")}</span></span><button className="language-toggle" aria-label={t(data.settings.language === 'zh' ? 'Switch to English' : 'Switch to Chinese')} title={t("Choose your language")} disabled={!ready || busy} onClick={() => update(p => ({ ...p, settings: { ...p.settings, language: p.settings.language === 'zh' ? 'en' : 'zh' } }))}><span lang="zh-CN" className={data.settings.language === 'zh' ? 'selected' : ''}>中</span><span aria-hidden="true">/</span><span lang="en" className={data.settings.language === 'en' ? 'selected' : ''}>EN</span></button><span className="topbar-divider" /><ThemeSwitch compact value={data.settings.theme} disabled={!ready || busy} onChange={theme => update(p => ({ ...p, settings: { ...p.settings, theme } }))} /></div></header>
      <main id="main-content" tabIndex={-1} className={`content content-${view}`}>
        {!ready ? <div className="loading-skeleton" aria-label={t("Loading your menu")} role="status"><div /><div /><div /><span className="sr-only">{t("Setting the table…")}</span></div> : (children ?? <AppView view={view} />)}
      </main>
      <div className="mobile-nav-dock"><nav className="mobile-nav" aria-label={t("Mobile navigation")}>{[...navigation, { id: 'settings' as const, label: t("Settings"), icon: Settings2 }].map(({ id, label, icon: Icon }) => <Link href={viewPaths[id]} key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} aria-disabled={busy} onNavigate={e => { if (busy) e.preventDefault(); }}>{view === id && <GlassPill id="mobile-nav-pill" radius={20} />}<Icon size={20} /><span>{id === 'pick' ? t("Decide") : id === 'foods' ? t("My foods") : label === t("Pick history") ? t("History") : label}</span></Link>)}</nav></div>
    </div></div>
    {editor && <FoodEditor key={editor === 'new' ? 'new' : editor.id} food={editor} data={data} onClose={() => setEditor(null)} onSave={food => update(p => ({ ...p, categories: p.categories.includes(food.category) ? p.categories : [...p.categories, food.category], foods: p.foods.some(f => f.id === food.id) ? p.foods.map(f => f.id === food.id ? food : f) : [...p.foods, food] }))} />}
    <div className="sr-only" aria-live="polite">{saveState === 'saved' && <><Check />{t("Changes saved.")}</>}</div>
  </TooltipProvider></MotionConfig></LocaleProvider></AppContext.Provider>;
}
