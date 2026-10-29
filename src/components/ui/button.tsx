import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'default' | 'small' | 'icon' }>(function Button({ className, variant = 'primary', size = 'default', ...props }, ref) {
  return <button ref={ref} className={cn('button', `button-${variant}`, `button-${size}`, className)} {...props} />;
});
