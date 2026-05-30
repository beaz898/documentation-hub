import { getLocale, getTranslations } from 'next-intl/server';
import BackButton from '@/components/BackButton';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import LanguageSelector from '@/components/LanguageSelector';

export async function generateMetadata() {
  const t = await getTranslations('legal.privacidad');
  return { title: `${t('pageTitle')} — Doclity` };
}

const emailLink = (chunks: React.ReactNode) => (
  <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>{chunks}</a>
);

export default async function PrivacidadPage() {
  const t      = await getTranslations('legal.privacidad');
  const tl     = await getTranslations('legal');
  const locale = await getLocale();

  const providers = [
    { name: t('s4Provider1Name'), desc: t('s4Provider1Desc') },
    { name: t('s4Provider2Name'), desc: t('s4Provider2Desc') },
    { name: t('s4Provider3Name'), desc: t('s4Provider3Desc') },
    { name: t('s4Provider4Name'), desc: t('s4Provider4Desc') },
    { name: t('s4Provider5Name'), desc: t('s4Provider5Desc') },
    { name: t('s4Provider6Name'), desc: t('s4Provider6Desc') },
  ];

  const s2Subs = [
    { title: t('s2Sub1Title'), body: t('s2Sub1Body') },
    { title: t('s2Sub2Title'), body: t('s2Sub2Body') },
    { title: t('s2Sub3Title'), body: t('s2Sub3Body') },
    { title: t('s2Sub4Title'), body: t('s2Sub4Body') },
    { title: t('s2Sub5Title'), body: t('s2Sub5Body') },
    { title: t('s2Sub6Title'), body: t('s2Sub6Body') },
  ];

  const s3Subs = [
    { title: t('s3Sub1Title'), body: t('s3Sub1Body') },
    { title: t('s3Sub2Title'), body: t('s3Sub2Body') },
    { title: t('s3Sub3Title'), body: t('s3Sub3Body') },
    { title: t('s3Sub4Title'), body: t('s3Sub4Body') },
  ];

  const sections = [
    {
      number: '1',
      title: t('s1'),
      content: <p>{t.rich('s1Body', { email: emailLink })}</p>,
    },
    {
      number: '2',
      title: t('s2'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {s2Subs.map(({ title, body }) => (
            <div key={title}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{title}</p>
              <p>{body}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      number: '3',
      title: t('s3'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {s3Subs.map(({ title, body }) => (
            <div key={title}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{title}</p>
              <p>{body}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      number: '4',
      title: t('s4'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {providers.map(({ name, desc }) => (
            <div key={name} style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
            }}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{name}</p>
              <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
          <p style={{ marginTop: 4, color: 'var(--text-secondary)' }}>{t('s4Footer')}</p>
        </div>
      ),
    },
    {
      number: '5',
      title: t('s5'),
      content: <p>{t.rich('s5Body', { b: (c) => <strong>{c}</strong> })}</p>,
    },
    {
      number: '6',
      title: t('s6'),
      content: (
        <>
          <p style={{ marginBottom: 12 }}>{t('s6Intro')}</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[t('s6Item1'), t('s6Item2'), t('s6Item3'), t('s6Item4'), t('s6Item5')].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ marginTop: 12 }}>{t.rich('s6Body2', { email: emailLink })}</p>
        </>
      ),
    },
    {
      number: '7',
      title: t('s7'),
      content: (
        <>
          <p style={{ marginBottom: 12 }}>{t('s7Intro')}</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {[t('s7Item1'), t('s7Item2'), t('s7Item3'), t('s7Item4'), t('s7Item5'), t('s7Item6')].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{t.rich('s7Body2', {
            email: emailLink,
            aepd: (c) => <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>{c}</a>,
          })}</p>
        </>
      ),
    },
    {
      number: '8',
      title: t('s8'),
      content: (
        <>
          <p style={{ marginBottom: 12 }}>{t('s8Intro')}</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[t('s8Item1'), t('s8Item2'), t('s8Item3'), t('s8Item4'), t('s8Item5')].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ),
    },
    {
      number: '9',
      title: t('s9'),
      content: <p>{t('s9Body')}</p>,
    },
    {
      number: '10',
      title: t('s10'),
      content: <p>{t('s10Body')}</p>,
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
