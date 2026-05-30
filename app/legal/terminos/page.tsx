import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import BackButton from '@/components/BackButton';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import LanguageSelector from '@/components/LanguageSelector';

export async function generateMetadata() {
  const t = await getTranslations('legal.terminos');
  return { title: `${t('pageTitle')} — Doclity` };
}

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || '/';
const APP_DISPLAY = APP_URL.replace(/^https?:\/\//, '');

const emailLink = (chunks: React.ReactNode) => (
  <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>{chunks}</a>
);

export default async function TerminosPage() {
  const t      = await getTranslations('legal.terminos');
  const tl     = await getTranslations('legal');
  const locale = await getLocale();

  const sections = [
    {
      number: '1',
      title: t('s1'),
      content: (
        <p>
          {t('s1BodyBefore')}
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>
            {APP_DISPLAY}
          </a>.
        </p>
      ),
    },
    {
      number: '2',
      title: t('s2'),
      content: (
        <>
          <p style={{ marginBottom: 12 }}>{t('s2Intro')}</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[t('s2Item1'), t('s2Item2'), t('s2Item3'), t('s2Item4'), t('s2Item5')].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ),
    },
    {
      number: '3',
      title: t('s3'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>{t('s3Body1')}</p>
          <p>{t('s3Body2')}</p>
          <p>{t('s3Body3')}</p>
        </div>
      ),
    },
    {
      number: '4',
      title: t('s4'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[t('s4Item1'), t('s4Item2'), t('s4Item3'), t('s4Item4')].map(item => (
            <div key={item} style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
            }}>
              <p>{item}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      number: '5',
      title: t('s5'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>{t('s5Body1')}</p>
          <p>{t('s5Body2')}</p>
          <p>{t('s5Body3')}</p>
        </div>
      ),
    },
    {
      number: '6',
      title: t('s6'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>{t('s6Body1')}</p>
          <p>{t('s6Body2')}</p>
          <p>{t('s6Body3')}</p>
        </div>
      ),
    },
    {
      number: '7',
      title: t('s7'),
      content: (
        <>
          <p style={{ marginBottom: 12 }}>{t('s7Intro')}</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {[t('s7Item1'), t('s7Item2'), t('s7Item3'), t('s7Item4'), t('s7Item5')].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{t('s7Outro')}</p>
        </>
      ),
    },
    {
      number: '8',
      title: t('s8'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>{t('s8Body1')}</p>
          <p>{t('s8Body2')}</p>
          <p>{t('s8Body3')}</p>
        </div>
      ),
    },
    {
      number: '9',
      title: t('s9'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p>{t('s9Body1')}</p>
          <p>{t('s9Body2')}</p>
          <p>{t.rich('s9Body3', {
            b: (c) => <strong>{c}</strong>,
            privLink: (c) => <Link href="/legal/privacidad" style={{ color: 'var(--brand)' }}>{c}</Link>,
          })}</p>
        </div>
      ),
    },
    {
      number: '10',
      title: t('s10'),
      content: <p>{t.rich('s10Body', { b: (c) => <strong>{c}</strong> })}</p>,
    },
    {
      number: '11',
      title: t('s11'),
      content: <p>{t('s11Body')}</p>,
    },
    {
      number: '12',
      title: t('s12'),
      content: <p>{t.rich('s12Body', { email: emailLink })}</p>,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <BackButton />
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>{t('pageTitle')}</h1>
        <div style={{ marginLeft: 'auto' }}><LanguageSelector /></div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t('h2')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tl('lastUpdated')}</p>
        </div>

        {locale !== 'es' && <LegalDisclaimer />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sections.map(section => (
            <section key={section.number}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <span style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: 6,
                  background: 'var(--brand-light)', color: 'var(--brand)',
                  fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {section.number}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{section.title}</h3>
              </div>
              <div style={{ paddingLeft: 34, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                {section.content}
              </div>
              <div style={{ marginTop: 32, height: '0.5px', background: 'var(--border)' }} />
            </section>
          ))}
        </div>

        <p style={{ marginTop: 40, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          {t('footer')}
        </p>
      </div>
    </div>
  );
}
