// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { AppShell } from '../src/components/app-shell';
import { defaultData } from '../src/lib/defaults';
import { STORAGE_KEY } from '../src/lib/storage';
import type { AppData } from '../src/lib/types';

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function seed(modify?: (data: AppData) => void) {
  const data = defaultData(); data.settings.reducedMotion = true; data.settings.language = 'en'; modify?.(data);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return data;
}
function saved(): AppData { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)!); }
async function openView(name: string, user: ReturnType<typeof userEvent.setup>) {
  if (name === 'Settings') await user.click(screen.getAllByRole('button', { name: 'Settings' })[0]);
  else await user.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name }));
}

describe('complete food management', () => {
  it('quick-adds, edits, disables, and persists a custom craving across a remount', async () => {
    seed(); const user = userEvent.setup(); const app = render(<AppShell />);
    await openView('My food list', user);
    await user.type(screen.getByLabelText('Quick add food name'), 'Dumpling night');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(saved().foods).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: 'Edit Dumpling night' }));
    const dialog = screen.getByRole('dialog');
    await user.clear(within(dialog).getByLabelText('Food name'));
    await user.type(within(dialog).getByLabelText('Food name'), 'Dumplings with friends');
    await user.click(within(dialog).getByRole('button', { name: 'Use 🥟' }));
    await user.selectOptions(within(dialog).getByLabelText('Category'), 'Asian');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    await user.click(screen.getByRole('switch', { name: 'Enable Dumplings with friends' }));
    expect(saved().foods.at(-1)).toMatchObject({ name: 'Dumplings with friends', emoji: '🥟', category: 'Asian', enabled: false });
    app.unmount(); render(<AppShell />);
    expect(screen.getByRole('switch', { name: 'Include Dumplings with friends' })).toHaveAttribute('data-state', 'unchecked');
  });
  it('requires confirmation for batch deletion and can restore the defaults', async () => {
    seed(); const user = userEvent.setup(); render(<AppShell />); await openView('My food list', user);
    await user.click(screen.getByLabelText('Select Hunan Cuisine')); await user.click(screen.getByLabelText('Select Cantonese Cuisine'));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(saved().foods).toHaveLength(11);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(saved().foods).toHaveLength(9);
    await user.click(screen.getByRole('button', { name: 'Restore defaults' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restore defaults' }));
    expect(saved().foods).toHaveLength(11);
  });
  it('renames and deletes a category without deleting its foods', async () => {
    seed(); const user = userEvent.setup(); render(<AppShell />); await openView('My food list', user);
    await user.click(screen.getByRole('button', { name: 'Categories' }));
    await user.click(screen.getByRole('button', { name: 'Rename Asian' }));
    await user.clear(screen.getByLabelText('Rename category')); await user.type(screen.getByLabelText('Rename category'), 'Comfort food');
    await user.click(screen.getByRole('button', { name: 'Save category name' }));
    expect(saved().foods.filter(f => f.category === 'Comfort food')).toHaveLength(9);
    await user.click(screen.getByRole('button', { name: 'Delete Comfort food' }));
    const dialogs = screen.getAllByRole('dialog');
    await user.click(within(dialogs[dialogs.length - 1]).getByRole('button', { name: 'Delete' }));
    expect(saved().foods).toHaveLength(11); expect(saved().categories).not.toContain('Comfort food');
    expect(saved().foods.some(f => f.category === 'Comfort food')).toBe(false);
  });
});

describe('picking and history', () => {
  it.each(['wheel', 'quick'])('%s reveals a result, records only confirmed picks, and respects recent exclusions', async mode => {
    seed(d => { d.foods = d.foods.slice(0, 1); d.settings.avoidRecent = 1; });
    const user = userEvent.setup(); render(<AppShell />);
    if (mode === 'quick') await user.click(screen.getByRole('button', { name: 'Quick Pick' }));
    await user.click(screen.getByRole('button', { name: 'Pick for Me!' }));
    expect(screen.getByRole('button', { name: 'A delicious decision in the making…' })).toBeDisabled();
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Hunan Cuisine!' })).toBeInTheDocument();
    expect(saved().history).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Let’s Eat!' }));
    expect(saved().history).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'A little too picky?' })).toBeInTheDocument();
    await openView('Pick history', user);
    expect(screen.getByRole('heading', { name: 'Hunan Cuisine' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Hunan Cuisine from history' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove pick' }));
    expect(saved().history).toHaveLength(0);
  });
  it('temporarily skips a result without disabling or deleting the food', async () => {
    seed(d => { d.foods = d.foods.slice(0, 1); }); const user = userEvent.setup(); render(<AppShell />);
    await user.click(screen.getByRole('button', { name: 'Pick for Me!' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Remove for Now' }));
    expect(screen.getByRole('heading', { name: 'A little too picky?' })).toBeInTheDocument();
    expect(saved().foods[0].enabled).toBe(true); expect(saved().history).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Restore skipped' }));
    expect(screen.getByRole('button', { name: 'Pick for Me!' })).toBeEnabled();
  });
});

describe('settings and recovery', () => {
  it('persists the theme and safely rejects an invalid import', async () => {
    seed(); const user = userEvent.setup(); render(<AppShell />); await openView('Settings', user);
    await user.click(screen.getByRole('button', { name: 'After hours' }));
    expect(saved().settings.theme).toBe('dark'); expect(document.documentElement.dataset.theme).toBe('dark');
    const file = new File(['not json'], 'broken.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => 'not json' });
    fireEvent.change(screen.getByLabelText('Import BitePick JSON'), { target: { files: [file] } });
    await screen.findByText('Your current data is unchanged.'); expect(saved().foods).toHaveLength(11);
  });
  it('validates and previews a valid import before replacing existing data', async () => {
    seed(); const user = userEvent.setup(); render(<AppShell />); await openView('Settings', user);
    const replacement = defaultData(); replacement.foods = [];
    const text = JSON.stringify(replacement); const file = new File([text], 'menu.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => text });
    fireEvent.change(screen.getByLabelText('Import BitePick JSON'), { target: { files: [file] } });
    const dialog = await screen.findByRole('dialog'); expect(saved().foods).toHaveLength(11);
    await user.click(within(dialog).getByRole('button', { name: 'Import & replace' }));
    expect(saved().foods).toHaveLength(0);
  });
  it('does not overwrite damaged storage on initialization in StrictMode', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken'); render(<StrictMode><AppShell /></StrictMode>);
    await waitFor(() => expect(screen.getByRole('button', { name: '帮我选！' })).toBeInTheDocument());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('{broken');
  });
});


describe('Chinese-first localization', () => {
  it('defaults to Chinese, toggles immediately, and restores the preference after remount', async () => {
    const user = userEvent.setup(); const app = render(<AppShell />);
    expect(screen.getByRole('button', { name: '帮我选！' })).toBeEnabled();
    expect(screen.getByRole('switch', { name: '将 湘菜 加入候选' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('zh-CN');
    await user.click(screen.getByRole('button', { name: '切换到英文' }));
    expect(screen.getByRole('button', { name: 'Pick for Me!' })).toBeInTheDocument();
    expect(saved().settings.language).toBe('en'); expect(document.documentElement.lang).toBe('en-US');
    expect(document.title).toBe('BitePick — What should we eat?');
    app.unmount(); render(<AppShell />);
    expect(screen.getByRole('button', { name: 'Pick for Me!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Switch to Chinese' }));
    expect(screen.getByRole('button', { name: '帮我选！' })).toBeInTheDocument();
    expect(saved().settings.language).toBe('zh');
  });
  it('searches localized names and preserves canonical data when an unchanged translated food is saved', async () => {
    seed(d => { d.settings.language = 'zh'; }); const user = userEvent.setup(); render(<AppShell />);
    await user.click(screen.getByRole('combobox', { name: '按分类筛选转盘候选项' }));
    await user.click(await screen.findByRole('option', { name: '亚洲美食' }));
    expect(screen.getByRole('img', { name: '美食转盘，共 9 个候选项' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('navigation', { name: '主导航' })).getByRole('button', { name: '我的美食清单' }));
    await user.type(screen.getByLabelText('搜索美食'), '湘菜');
    expect(screen.getByRole('heading', { name: '湘菜' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '粤菜' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '编辑 湘菜' }));
    const dialog = screen.getByRole('dialog'); expect(within(dialog).getByLabelText('美食名称')).toHaveValue('湘菜');
    expect(within(dialog).getByLabelText('分类')).toHaveValue('Asian');
    await user.click(within(dialog).getByRole('button', { name: '保存修改' }));
    expect(saved().foods[0].name).toBe('Hunan Cuisine'); expect(saved().foods[0].category).toBe('Asian');
    await user.click(screen.getByRole('button', { name: '切换到英文' }));
    await user.clear(screen.getByLabelText('Search foods'));
    expect(screen.getByRole('heading', { name: 'Hunan Cuisine' })).toBeInTheDocument();
  });
  it.each(['美食转盘', '快速选择'])('localizes the %s result, history, and custom names', async mode => {
    const original = seed(d => {
      d.settings.language = 'zh'; d.foods = d.foods.slice(0, 1);
      d.foods[0] = { ...d.foods[0], id: 'my-food', name: '奶奶的饺子', category: '周末聚餐' }; d.categories.push('周末聚餐');
    });
    const user = userEvent.setup(); render(<AppShell />);
    await user.click(screen.getByRole('button', { name: mode }));
    await user.click(screen.getByRole('button', { name: '帮我选！' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: '奶奶的饺子!' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '就吃这个！' }));
    await user.click(within(screen.getByRole('navigation', { name: '主导航' })).getByRole('button', { name: '选择记录' }));
    const heading = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(saved().history[0].pickedAt));
    expect(screen.getByRole('heading', { name: heading + '1 次选择' })).toBeInTheDocument();
    const history = saved().history;
    await user.click(screen.getByRole('button', { name: '切换到英文' }));
    expect(screen.getByRole('heading', { name: '奶奶的饺子' })).toBeInTheDocument();
    expect(saved().foods).toEqual(original.foods); expect(saved().history).toEqual(history);
  });
  it('localizes import errors and supports language selection in Settings', async () => {
    const user = userEvent.setup(); render(<AppShell />);
    await user.click(screen.getAllByRole('button', { name: '设置' })[0]);
    expect(screen.getByLabelText('选择界面语言')).toHaveValue('zh');
    const file = new File(['bad'], 'bad.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => 'bad' });
    fireEvent.change(screen.getByLabelText('导入 BitePick JSON 文件'), { target: { files: [file] } });
    await screen.findByText('文件不是有效的 JSON，请选择 BitePick 导出的文件。');
    await user.selectOptions(screen.getByLabelText('选择界面语言'), 'en');
    expect(screen.getByText('This file is not valid JSON. Please choose a BitePick export.')).toBeInTheDocument();
    expect(saved().settings.language).toBe('en');
  });
});
