'use client';
import { useLocale } from '@/components/locale-provider';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
export function Dialog({ open, onOpenChange, title, description, children, className }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; className?: string }) {
  const { t } = useLocale();
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={cn('dialog-content', className)} {...(!description ? { 'aria-describedby': undefined } : {})}>
        <div className="dialog-heading"><DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          {description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}
        </div>
        {children}
        <DialogPrimitive.Close className="dialog-close icon-button" aria-label={t("Close dialog")}><X size={19} /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
export function ConfirmDialog({ open, onOpenChange, title, description, actionLabel, onConfirm, destructive = true }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; actionLabel?: string; onConfirm: () => void; destructive?: boolean }) {
  const { t } = useLocale();
  return <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} className="confirm-dialog">
    <div className="dialog-actions"><Button variant="secondary" autoFocus onClick={() => onOpenChange(false)}>{t("Cancel")}</Button><Button variant={destructive ? 'danger' : 'primary'} onClick={() => { onConfirm(); onOpenChange(false); }}>{actionLabel ?? t('Delete')}</Button></div>
  </Dialog>;
}
