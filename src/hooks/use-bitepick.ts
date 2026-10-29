'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createLocale, localizeError } from '@/lib/i18n';
import { defaultData } from '@/lib/defaults';
import { loadData, saveData } from '@/lib/storage';
import type { AppData } from '@/lib/types';
export function useBitePick() {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const initial = useRef(true);
  const errorShown = useRef(false);
  useEffect(() => {
    let result: ReturnType<typeof loadData>;
    try { result = loadData(window.localStorage); } catch { result = { data: defaultData(), warning: 'Browser storage is unavailable. You can still use BitePick and export your menu.' }; }
    setData(result.data);
    setReady(true);
    if (result.warning) { setSaveState('error'); toast.warning(localizeError(result.data.settings.language, result.warning), { id: 'storage-load-error', duration: 8000 }); }
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (initial.current) { initial.current = false; return; }
    setSaveState('saving');
    // Commit immediately so a refresh never loses the last edit.
    let saved = false;
    try { saved = saveData(window.localStorage, data); } catch { /* private browser / denied storage */ }
    if (!saved && !errorShown.current) {
      toast.error(localizeError(data.settings.language, 'Your browser could not save these changes. Export your data from Settings to keep a copy.'), { duration: 7000 });
      errorShown.current = true;
    }
    const timeout = window.setTimeout(() => {
      setSaveState(saved ? 'saved' : 'error');
    }, 150);
    return () => window.clearTimeout(timeout);
  }, [data, ready]);
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = data.settings.theme === 'dark' || (data.settings.theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.dataset.motion = data.settings.reducedMotion ? 'reduced' : 'full';
    };
    apply(); media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [data.settings.theme, data.settings.reducedMotion, ready]);
  useEffect(() => {
    if (!ready) return;
    const { locale, t } = createLocale(data.settings.language);
    document.documentElement.lang = locale;
    document.title = t('BitePick — What should we eat?');
  }, [data.settings.language, ready]);
  const update = useCallback((updater: (previous: AppData) => AppData) => setData(updater), []);
  return { data, update, ready, saveState };
}
