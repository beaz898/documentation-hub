import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import CookieBanner from '@/components/CookieBanner';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Doclity',
  description: 'Asistente inteligente para tu documentación empresarial',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: { icon: '/favicon.svg' },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            {children}
            <CookieBanner />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
