import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: 'Doclity',
  description: 'Asistente inteligente para tu documentación empresarial',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
