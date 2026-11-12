'use client';
import { useContext } from 'react';
import { AppContext } from './app-context';
import type { View } from '@/lib/types';
import { Picker } from './picker';
import { FoodManager } from './food-manager';
import { History } from './history';
import { Settings } from './settings';

export function AppView({ view }: { view: View }) {
  const app = useContext(AppContext);
  if (!app) throw new Error('AppView requires AppShell.');
  const { data, update, ready, navigate, setEditor, setBusy } = app;
  if (!ready) return null;
  switch (view) {
    case 'pick': return <Picker data={data} update={update} onManage={() => navigate('foods')} onAdd={() => setEditor('new')} onHistory={() => navigate('history')} onSettings={() => navigate('settings')} onBusyChange={setBusy} />;
    case 'foods': return <FoodManager data={data} update={update} onAdd={() => setEditor('new')} onEdit={setEditor} />;
    case 'history': return <History data={data} update={update} onPick={() => navigate('pick')} />;
    case 'settings': return <Settings data={data} update={update} />;
  }
}
