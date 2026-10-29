'use client';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createLocale } from '@/lib/i18n';
import type { Language } from '@/lib/types';
const LocaleContext = createContext(createLocale('zh'));
export function LocaleProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo(() => createLocale(language), [language]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
