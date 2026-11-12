'use client';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useLocale } from '@/components/locale-provider';
import type { Settings } from '@/lib/types';

export function ThemeSwitch({ value, onChange, disabled, compact = false }: {
  value: Settings['theme'];
  onChange: (theme: Settings['theme']) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { t } = useLocale();
  return <div className={`theme-switch ${compact ? 'theme-switch-compact' : ''}`} role="group" aria-label={t('Appearance')}>
    {([{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'system', label: 'System', icon: Monitor }] as const).map(({ value: theme, label, icon: Icon }) =>
      <button type="button" key={theme} aria-pressed={value === theme} aria-label={t(label)} title={t(label)} disabled={disabled} onClick={() => onChange(theme)}>
        <Icon size={15} aria-hidden="true" /><span>{t(label)}</span>
      </button>)}
  </div>;
}
