'use client';
import { useLocale } from '@/components/locale-provider';
import { motion } from 'motion/react';
import { Utensils } from 'lucide-react';
import { wheelGroups } from '@/lib/random';
import type { Food } from '@/lib/types';
const colors = ['#F5DABB', '#ECDDBF', '#DEE6D2', '#E6E4CE', '#F5DCC6', '#EED1C6', '#F3D5B1', '#ECE4CA', '#DCE4D1', '#F2DEBA', '#EDD7CD', '#F6DFC7'];
function point(angle: number, radius = 190) { const radians = angle * Math.PI / 180; return [200 + radius * Math.cos(radians), 200 + radius * Math.sin(radians)]; }
function wedge(index: number, count: number) {
  const slice = 360 / count;
  const [sx, sy] = point(index * slice - 90 - slice / 2);
  const [ex, ey] = point(index * slice - 90 + slice / 2);
  return `M200,200 L${sx},${sy} A190,190 0 ${slice > 180 ? 1 : 0},1 ${ex},${ey} Z`;
}
export function Wheel({ foods, rotation, spinning, reducedMotion }: { foods: Food[]; rotation: number; spinning: boolean; reducedMotion: boolean }) {
  const { t, foodName } = useLocale();
  const groups = wheelGroups(foods);
  return <div className="wheel-stage" aria-label={t("Food wheel with {count} eligible options", { count: foods.length })} role="img">
    <div className="wheel-pointer"><span /></div>
    <div className="wheel-rim"><motion.div className="wheel-disc" animate={{ rotate: rotation }} initial={false} transition={{ duration: spinning && !reducedMotion ? 4.6 : 0, ease: [0.12, 0.75, 0.14, 1] }}>
      <svg viewBox="0 0 400 400" className="wheel-svg" aria-hidden="true">
        {groups.length === 1 ? <circle cx="200" cy="200" r="190" fill={colors[0]} /> : groups.map((group, index) => <path key={group[0].id} d={wedge(index, groups.length)} fill={colors[index % colors.length]} stroke="#fffaf0" strokeWidth="1.7" />)}
        {groups.map((group, index) => {
          const label = group.length > 1 ? t("{count} favorites", { count: group.length }) : foodName(group[0]);
          const split = label.length > 13 ? label.lastIndexOf(' ', 13) : -1;
          const lines = /[\u3400-\u9fff]/.test(label) ? (label.length > 6 ? [label.slice(0, 6), label.length > 12 ? label.slice(6, 11) + '…' : label.slice(6)] : [label]) : split > 0 ? [label.slice(0, split), label.slice(split + 1)] : [label.length > 16 ? label.slice(0, 14) + '…' : label];
          return <g key={group[0].id} transform={`translate(200 200) rotate(${index * 360 / groups.length}) translate(0 -140)`}>
            <text textAnchor="middle" y="-8" fontSize="26" className="wheel-emoji">{group[0].emoji}</text>
            <text textAnchor="middle" y="14" fill="#544534" fontSize={groups.length > 9 ? '11.2' : '13'} fontWeight="600">{lines.map((line, i) => <tspan key={i} x="0" dy={i ? '13' : '0'}>{line.length > 16 ? line.slice(0, 14) + '…' : line}</tspan>)}</text>
          </g>;
        })}
        <circle cx="200" cy="200" r="56" fill="#fff9ee" />
        <circle cx="200" cy="200" r="48" fill="#E9764D" />
        <circle cx="200" cy="200" r="42" fill="none" stroke="#F6B191" strokeWidth="1" />
      </svg>
    </motion.div><div className="wheel-hub"><Utensils size={31} strokeWidth={1.65} /></div></div>
    <span className="wheel-spark spark-one">✦</span><span className="wheel-spark spark-two">✧</span>
  </div>;
}
