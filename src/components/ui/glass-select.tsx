'use client';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
export type GlassSelectOption = { value: string; label: string };
/** Select with a glass popup list; the trigger takes the wrapper's class so existing layout styles still apply. */
export function GlassSelect({ value, onValueChange, options, label, disabled = false, icon, className = '' }: { value: string; onValueChange: (value: string) => void; options: GlassSelectOption[]; label: string; disabled?: boolean; icon?: ReactNode; className?: string }) {
  return <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectPrimitive.Trigger className={`glass-select-trigger ${className}`} aria-label={label}>{icon}<span className="glass-select-value"><SelectPrimitive.Value /></span><SelectPrimitive.Icon asChild><ChevronDown size={15} /></SelectPrimitive.Icon></SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content className="glass-select-content" position="popper" sideOffset={8} align="start" collisionPadding={12}>
      <SelectPrimitive.Viewport className="glass-select-viewport">{options.map(option => <SelectPrimitive.Item key={option.value} value={option.value} className="glass-select-item"><SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator className="glass-select-check"><Check size={14} /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
