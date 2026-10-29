'use client';
import { useLocale } from '@/components/locale-provider';
import { useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, Database, FileJson, Heart, Laptop, Moon, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { toast } from 'sonner';
import type { AppData, Settings as UserSettings } from '@/lib/types';
import { localizeError } from '@/lib/i18n';
import { exportData, MAX_IMPORT_BYTES, parseData } from '@/lib/storage';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { GlassSelect } from './ui/glass-select';
import { ConfirmDialog } from './ui/dialog';
export function Settings({ data, update }: { data: AppData; update: (fn: (p: AppData) => AppData) => void }) {
  const { t, language } = useLocale();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const setting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => update(p => ({ ...p, settings: { ...p.settings, [key]: value } }));
  const download = () => {
    const blob = new Blob([exportData(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `bitepick-menu-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t("Your menu, packed to go."));
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    setImporting(true); setImportError('');
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("Please choose a JSON file smaller than 2 MB.");
      setPendingImport(parseData(await file.text()));
    } catch (error) { const message = error instanceof Error ? error.message : "This file could not be read. Try a BitePick JSON export."; setImportError(message); toast.error(t("This menu could not be imported.")); }
    finally { setImporting(false); if (fileInput.current) fileInput.current.value = ''; }
  };
  return <section className="subpage settings-page"><div className="page-heading"><div><span className="eyebrow"><span /> {t("MAKE YOURSELF AT HOME")}</span><h1>{t("A little more")} <em>{t("you.")}</em></h1><p>{t("Small preferences. A better seat at the table.")}</p></div></div>
    <section className="settings-card"><div className="setting-row language-setting"><div><h3>{t("Language")}</h3><p>{t("Your language preference is saved on this device.")}</p></div><GlassSelect className="glass-field glass-field-inline" label={t("Choose your language")} value={language} onValueChange={value => setting("language", value as UserSettings["language"])} options={[{ value: 'zh', label: '简体中文', lang: 'zh-CN' }, { value: 'en', label: 'English', lang: 'en' }]} /></div></section>
    <section className="settings-card"><div className="settings-card-title"><Sun size={19} /><div><h2>{t("Set the mood")}</h2><p>{t("A comfortable glow for every kind of craving.")}</p></div></div><div className="theme-options">{([{ value: 'light', label: t("Daylight"), icon: Sun }, { value: 'dark', label: t("After hours"), icon: Moon }, { value: 'system', label: t("With my device"), icon: Laptop }] as const).map(({ value, label, icon: Icon }) => <button key={value} className={`theme-choice ${data.settings.theme === value ? 'selected' : ''}`} aria-pressed={data.settings.theme === value} onClick={() => setting('theme', value)}><div className={`theme-preview preview-${value}`}><div /><span /><span /><i /></div><span><Icon size={15} />{label}{data.settings.theme === value && <Check size={15} />}</span></button>)}</div></section>
    <section className="settings-card"><div className="settings-card-title"><Sparkles size={19} /><div><h2>{t("Your picking preferences")}</h2><p>{t("Keep the fun. Find your own pace.")}</p></div></div><div className="setting-row"><div><h3>{t("Reduce motion")}</h3><p>{t("Reveal your pick instantly, with no spinning or shuffling.")}<br />{t("Your device’s reduced-motion preference is always respected.")}</p></div><Switch checked={data.settings.reducedMotion} onCheckedChange={value => setting('reducedMotion', value)} label={t("Reduce motion")} /></div><div className="setting-row"><div><h3>{t("Avoid recent picks")}</h3><p>{t("Give something new a turn at the table.")}</p></div><GlassSelect className="glass-field glass-field-inline" label={t("Avoid recent picks setting")} value={String(data.settings.avoidRecent)} onValueChange={value => setting('avoidRecent', Number(value) as UserSettings['avoidRecent'])} options={[{ value: '0', label: t("Off") }, { value: '1', label: t("Last 1 pick") }, { value: '3', label: t("Last 3 picks") }, { value: '5', label: t("Last 5 picks") }]} /></div></section>
    <section className="settings-card"><div className="settings-card-title"><Database size={19} /><div><h2>{t("Your menu, to go")}</h2><p>{t("Keep a backup or bring your favorites to another device.")}</p></div></div><div className="data-summary"><FileJson size={27} /><div><strong>{t("Everything in one little file.")}</strong><p>{t("{foods} foods · {categories} categories · {history} memories", { foods: data.foods.length, categories: data.categories.length, history: data.history.length })}</p></div></div><div className="data-actions"><Button variant="secondary" onClick={download}><ArrowDownToLine size={17} /> {t("Export JSON")}</Button><Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={importing}><ArrowUpFromLine size={17} />{importing ? t("Reading file…") : t("Import JSON")}</Button><input type="file" accept=".json,application/json" ref={fileInput} className="sr-only" aria-label={t("Import BitePick JSON")} onChange={e => void importFile(e.target.files?.[0])} /></div>{importError && <div className="import-error" role="alert"><strong>{t("We couldn’t read that menu.")}</strong><p>{localizeError(language, importError)}</p><span>{t("Your current data is unchanged.")}</span></div>}</section>
    <div className="privacy-note"><ShieldCheck size={23} /><div><h3>{t("Just yours. Just here.")}</h3><p>{t("No accounts, no tracking, no server. Your menu lives in this browser. Export a copy before clearing browser data or changing devices.")}</p></div><Heart size={18} /></div>
    <ConfirmDialog open={!!pendingImport} onOpenChange={open => { if (!open) setPendingImport(null); }} title={t("Bring this menu to the table?")} description={t("This file contains {foods} foods, {categories} categories, and {history} history entries. Importing replaces your current menu, history, and settings. Export your current data first if you want a backup.", { foods: pendingImport?.foods.length ?? 0, categories: pendingImport?.categories.length ?? 0, history: pendingImport?.history.length ?? 0 })} actionLabel={t("Import & replace")} destructive={false} onConfirm={() => { if (pendingImport) { update(() => pendingImport); setImportError(''); toast.success(t("Your menu is unpacked and ready.")); } }} />
  </section>;
}
