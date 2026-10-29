'use client';
import * as SwitchPrimitive from '@radix-ui/react-switch';
export function Switch({ checked, onCheckedChange, label, disabled = false }: { checked: boolean; onCheckedChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return <SwitchPrimitive.Root className="switch" checked={checked} onCheckedChange={onCheckedChange} aria-label={label} disabled={disabled}><SwitchPrimitive.Thumb className="switch-thumb" /></SwitchPrimitive.Root>;
}
