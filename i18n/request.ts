import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

function resolveLocale(cookieLocale?: string, acceptLanguage?: string): Locale {
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }
  if (acceptLanguage) {
    const lang = acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
    if (lang && SUPPORTED_LOCALES.includes(lang as Locale)) {
      return lang as Locale;
    }
  }
  return 'es';
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  const locale = resolveLocale(
    cookieStore.get('locale')?.value,
    headersList.get('accept-language') ?? undefined,
  );

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
