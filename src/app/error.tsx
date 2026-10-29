'use client';
import { usePageLocale } from '@/hooks/use-page-locale';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = usePageLocale();
  return <main className="not-found"><span>🥄</span><h1>{t('A little kitchen hiccup.')}</h1><p>{t('Your saved menu is still in this browser. Let’s try again.')}</p><button onClick={reset} className="button button-primary">{t('Try again')}</button></main>;
}
