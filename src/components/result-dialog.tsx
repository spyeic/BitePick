'use client';
import { useLocale } from '@/components/locale-provider';
import { motion } from 'motion/react';
import { ArrowRight, RotateCcw, Ban } from 'lucide-react';
import type { Food } from '@/lib/types';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
export function ResultDialog({ food, onClose, onConfirm, onRetry, onExclude, reducedMotion }: { food: Food | null; onClose: () => void; onConfirm: () => void; onRetry: () => void; onExclude: () => void; reducedMotion: boolean }) {
  const { t, foodName, categoryName } = useLocale();
  return <Dialog open={!!food} onOpenChange={open => { if (!open) onClose(); }} title={t("Your next delicious decision")} description={t("A little less deciding. A little more enjoying.")} className="result-dialog">
    {food && <div className="result-inner">
      <motion.div className="result-emoji" initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22 }}><span>{food.emoji}</span></motion.div>
      <p className="result-caption">{t("Today’s pick is…")}</p><h2>{foodName(food)}!</h2><span className="category-badge">{categoryName(food.category)}</span>
      <p className="result-note">{t("Decision made. Now for the good part.")}</p>
      <Button className="eat-button" onClick={onConfirm}>{t("Let’s Eat!")} <ArrowRight size={18} /></Button>
      <div className="result-secondary"><Button variant="ghost" onClick={onRetry}><RotateCcw size={15} /> {t("Try Again")}</Button><Button variant="ghost" onClick={onExclude}><Ban size={15} /> {t("Remove for Now")}</Button></div>
      <p className="fine-print">{t("Only confirmed picks are saved to your history.")}</p>
    </div>}
  </Dialog>;
}
