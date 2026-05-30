import { getTranslations } from 'next-intl/server';
import BackButton from '@/components/BackButton';

export async function generateMetadata() {
  const t = await getTranslations('legal.cookies');
  return { title: `${t('pageTitle')} — Doclity` };
}

const COOKIES = [
  {
    name: 'sb-access-token',
    purpose: 'Mantener tu sesión activa tras iniciar sesión',
    duration: '1 hora',
    type: 'Técnica / Sesión',
  },
  {
    name: 'sb-refresh-token',
    purpose: 'Renovar tu sesión sin que tengas que volver a iniciar sesión',
    duration: '7 días',
    type: 'Técnica / Sesión',
  },
];

export default async function CookiesPage() {
  const t  = await getTranslations('legal.cookies');
  const tl = await getTranslations('legal');

  const sections = [
    {
      number: '1',
      title: t('s1'),
      content: (
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu navegador.
          Se utilizan para que el sitio funcione correctamente, recordar tu sesión o recopilar
          información sobre tu navegación.
        </p>
      ),
    },
    {
      number: '2',
      title: t('s2'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p>
            Doclity utiliza únicamente cookies técnicas estrictamente necesarias para el funcionamiento
            del servicio. No utilizamos cookies de seguimiento, analítica, publicidad ni de terceros.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {[t('tableCol1'), t('tableCol2'), t('tableCol3'), t('tableCol4')].map(col => (
                    <th key={col} style={{
                      textAlign: 'left',
                      padding: '9px 12px',
                      background: 'var(--bg-secondary)',
                      border: '0.5px solid var(--border)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COOKIES.map(cookie => (
                  <tr key={cookie.name}>
                    <td style={{ padding: '9px 12px', border: '0.5px solid var(--border)', fontFamily: 'monospace', whiteSpace: 'nowrap', color: 'var(--brand)' }}>{cookie.name}</td>
                    <td style={{ padding: '9px 12px', border: '0.5px solid var(--border)' }}>{cookie.purpose}</td>
                    <td style={{ padding: '9px 12px', border: '0.5px solid var(--border)', whiteSpace: 'nowrap' }}>{cookie.duration}</td>
                    <td style={{ padding: '9px 12px', border: '0.5px solid var(--border)', whiteSpace: 'nowrap' }}>{cookie.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Estas cookies son establecidas por Supabase Auth, nuestro proveedor de autenticación, y son
            imprescindibles para que puedas usar el servicio. Sin ellas, no podrías mantener tu sesión iniciada.
          </p>
        </div>
      ),
    },
    {
      number: '3',
      title: t('s3'),
      content: (
        <p>
          No. De acuerdo con el artículo 22.2 de la LSSI-CE, las cookies técnicas o estrictamente necesarias
          están exentas de la obligación de obtener consentimiento previo del usuario, ya que son imprescindibles
          para el funcionamiento del servicio.
        </p>
      ),
    },
    {
      number: '4',
      title: t('s4'),
      content: (
        <p>
          Puedes configurar tu navegador para bloquear o eliminar cookies. Sin embargo, si bloqueas las cookies
          de sesión de Doclity, no podrás utilizar el servicio.
        </p>
      ),
    },
    {
      number: '5',
      title: t('s5'),
      content: (
        <p>
          Si tienes dudas sobre nuestra política de cookies, puedes escribirnos a{' '}
          <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>doclitynfo@gmail.com</a>.
        </p>
      ),
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
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t('h2')}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tl('lastUpdated')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sections.map(section => (
            <section key={section.number}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <span style={{
                  flexShrink: 0,
                  width: 24, height: 24,
                  borderRadius: 6,
                  background: 'var(--brand-light)',
                  color: 'var(--brand)',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
