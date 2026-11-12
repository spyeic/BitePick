'use client';
import { createContext } from 'react';
import type { useBitePick } from '@/hooks/use-bitepick';
import type { Food, View } from '@/lib/types';

export type AppContextValue = ReturnType<typeof useBitePick> & {
  navigate: (view: View) => void;
  setEditor: (food: Food | 'new' | null) => void;
  setBusy: (busy: boolean) => void;
};
export const AppContext = createContext<AppContextValue | null>(null);
