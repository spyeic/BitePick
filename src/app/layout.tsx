import type { Metadata, Viewport } from 'next';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './globals.css';
import './glass.css';
export const metadata: Metadata = {
  title: 'BitePick — 今天吃什么？',
  description: '今天吃什么？让 BitePick 帮你决定。自定义美食菜单，转动转盘，轻松选出下一餐。无需登录，支持中英文。',
  applicationName: 'BitePick',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};
// `cover` lets the page run under the status bar and browser toolbar; safe-area insets keep controls clear of them.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
const themeScript = `(function(){try{var d=JSON.parse(localStorage.getItem('bitepick.v2')||localStorage.getItem('bitepick.v1')||'null');document.documentElement.lang=d?.settings?.language==='en'?'en-US':'zh-CN';var t=d?.settings?.theme||'system';document.documentElement.dataset.theme=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light';if(d?.settings?.reducedMotion)document.documentElement.dataset.motion='reduced'}catch(e){}})()`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
