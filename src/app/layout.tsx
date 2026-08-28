import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI MultiSystem',
    template: '%s · AI MultiSystem',
  },
  description: 'Мониторинг отрасли, конкурентов и государственных закупок — Optimus-kz',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value ?? 'system';
  const forcedDark = theme === 'dark';

  return (
    <html lang="ru" className={forcedDark ? 'dark' : undefined} suppressHydrationWarning>
      <head>
        {/*
          Тема применяется до первой отрисовки. Иначе при выборе «как в системе»
          страница успевает мигнуть светлой на тёмном экране.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]+)/);var p=m?decodeURIComponent(m[1]):'system';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
