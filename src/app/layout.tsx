import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Optimus Eye',
    template: '%s · Optimus Eye',
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
  // Тёмная тема — основная: интерфейс дежурного открыт весь рабочий день, и
  // светлое полотно во весь экран утомляет быстрее. Выбор пользователя её
  // перекрывает и хранится в cookie.
  const theme = cookieStore.get('theme')?.value ?? 'dark';
  const forcedLight = theme === 'light';

  return (
    <html lang="ru" className={forcedLight ? undefined : 'dark'} suppressHydrationWarning>
      <head>
        {/*
          Inter — шрифт фирменного стиля Optimus. Подключён ссылкой, а не
          через next/font: next/font забирает файлы шрифта в момент сборки,
          и сборка начинает зависеть от доступности Google Fonts. Один
          недоступный хост — и выкладка не собирается вовсе.
        */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        {/*
          Тема применяется до первой отрисовки. Иначе при выборе «как в системе»
          страница успевает мигнуть светлой на тёмном экране.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]+)/);var p=m?decodeURIComponent(m[1]):'dark';var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
