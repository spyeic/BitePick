import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function dateLabel(date: string, locale = 'zh-CN') { return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(date)); }
