'use client';
import { useEffect, useState } from 'react';
import { createLocale } from '@/lib/i18n';
import { loadData } from '@/lib/storage';
import type { Language } from '@/lib/types';
/** Error and not-found routes sit outside the application locale provider. */
export function usePageLocale() {
  const [language, setLanguage] = useState<Language>('zh');
  useEffect(() => {
    try { setLanguage(loadData(window.localStorage).data.settings.language); } catch { /* Chinese fallback when storage is unavailable. */ }
  }, []);
  return createLocale(language);
}
