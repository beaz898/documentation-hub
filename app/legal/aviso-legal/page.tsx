import { getLocale, getTranslations } from 'next-intl/server';
import BackButton from '@/components/BackButton';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import LanguageSelector from '@/components/LanguageSelector';

export async function generateMetadata() {
  const t = await getTranslations('legal.aviso');
  return { title: `${t('pageTitle')} — Doclity` };
}

const email = (chunks: React.ReactNode) => (
  <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>{chunks}</a>
);

export default async function AvisoLegalPage() {
  const t      = await getTranslations('legal.aviso');
  const tl     = await getTranslations('legal');
  const locale = await getLocale();

  const tableRows = [
    { label: t('s1LabelOwner'),    value: t('s1ValueOwner') },
    { label: t('s1LabelNif'),      value: t('s1ValueNif') },
    { label: t('s1LabelDomicilio'),value: t('s1ValueDomicilio') },
    { label: t('s1LabelActividad'),value: t('s1ValueActividad') },
  ];

  const sections = [
    {
      number: '1',
      title: t('s1'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p>{t('s1Intro')}</p>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tableRows.map(({ label, value }) => (
              <div key={label} style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
                display: 'flex', gap: 12, flexWrap: 'wrap',
              }}>
                <span style={{ fontWeight: 600, fontSize: 13, flexShrink: 0, minWidth: 120 }}>{label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
              </div>
            ))}
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
              display: 'flex', gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontWeight: 600, fontSize: 13, flexShrink: 0, minWidth: 120 }}>{t('s1LabelEmail')}</span>
              <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>doclitynfo@gmail.com</a>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '2',
      title: t('s2'),
      content: <p>{t('s2Body')}</p>,
    },
    {
      number: '3',
      title: t('s3'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p>{t('s3Body1')}</p>
          <p>{t('s3Body2')}</p>
        </div>
      ),
    },
    {
      number: '4',
      title: t('s4'),
      content: (
        <>
          <p style={{ marginBottom: 12 }}>{t('s4Intro')}</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[t('s4Item1'), t('s4Item2'), t('s4Item3')].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ),
    },
    {
      number: '5',
      title: t('s5'),
      content: <p>{t('s5Body')}</p>,
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
