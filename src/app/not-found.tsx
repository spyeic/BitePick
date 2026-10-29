'use client';
import Link from 'next/link';
import { usePageLocale } from '@/hooks/use-page-locale';
export default function NotFound() {
  const { t } = usePageLocale();
  return <main className="not-found"><span>🍽️</span><h1>{t('This plate is empty.')}</h1><p>{t('Let’s find you something delicious instead.')}</p><Link href="/" className="button button-primary">{t('Back to BitePick')}</Link></main>;
}
