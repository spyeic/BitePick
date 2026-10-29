'use client';
import { useLocale } from '@/components/locale-provider';
import { Zap } from 'lucide-react';
import type { Food } from '@/lib/types';
export function QuickPick({ food, spinning }: { food: Food | null; spinning: boolean }) {
  const { t, foodName } = useLocale();
  return <div className={`quick-stage ${spinning ? 'is-shuffling' : ''}`}>
    <div className="quick-back back-one" /><div className="quick-back back-two" />
    <div className="quick-card"><div className="quick-card-label"><Zap size={14} /> {t("A LITTLE SPONTANEITY")}</div>
      <div className="quick-emoji" aria-hidden="true">{food?.emoji ?? '🍽️'}</div>
      <h2>{(food ? foodName(food) : null) ?? t("Something delicious.")}</h2><p>{spinning ? t("Finding your next craving…") : t("Your next favorite is a tap away.")}</p>
      <div className="quick-card-dots"><i /><i /><i /></div>
    </div>
  </div>;
}
