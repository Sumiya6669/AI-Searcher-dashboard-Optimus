'use client';

export default function GlobalError() {
  return (
    <html lang="ru">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 18 }}>Приложение не смогло запуститься</h1>
        <p style={{ color: '#4a5060', fontSize: 14 }}>
          Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </body>
    </html>
  );
}
