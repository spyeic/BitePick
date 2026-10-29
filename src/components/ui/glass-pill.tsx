'use client';
import { motion } from 'motion/react';
/** Glass highlight shared by a group of buttons; springs to whichever button renders it. */
export function GlassPill({ id, radius }: { id: string; radius: number }) {
  return <motion.span layoutId={id} className="glass-pill" aria-hidden="true" style={{ borderRadius: radius }} transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.9 }} />;
}
