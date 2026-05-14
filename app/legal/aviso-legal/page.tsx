import BackButton from '@/components/BackButton';

export const metadata = {
  title: 'Aviso Legal — Doclity',
};

const sections = [
  {
    number: '1',
    title: 'Datos identificativos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información
          y de Comercio Electrónico (LSSI-CE), se informa al usuario de los datos del titular de este sitio web:
        </p>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Titular', value: '[PENDIENTE — se completará con el alta como autónomo]' },
            { label: 'NIF', value: '[PENDIENTE]' },
            { label: 'Domicilio', value: 'A Coruña, España' },
            { label: 'Actividad', value: 'Prestación de servicios de gestión y análisis de documentación corporativa mediante inteligencia artificial.' },
          ].map(({ label, value }) => (
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
            <span style={{ fontWeight: 600, fontSize: 13, flexShrink: 0, minWidth: 120 }}>Email de contacto</span>
            <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>doclitynfo@gmail.com</a>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '2',
    title: 'Objeto',
    content: (
      <p>
        Este sitio web ofrece el servicio Doclity, una plataforma de gestión y análisis de documentación corporativa.
        El acceso al servicio requiere registro y está sujeto a los Términos y Condiciones de uso.
      </p>
    ),
  },
  {
    number: '3',
    title: 'Propiedad intelectual e industrial',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p>
          Todos los contenidos del sitio web (textos, diseño, código fuente, logotipos, gráficos) son propiedad del titular
          o de sus licenciantes, y están protegidos por la legislación de propiedad intelectual e industrial.
          Queda prohibida su reproducción, distribución o transformación sin autorización expresa.
        </p>
        <p>
          El usuario conserva todos los derechos sobre los documentos que sube a la plataforma.
          Doclity no adquiere ningún derecho de propiedad sobre los contenidos del usuario.
        </p>
      </div>
    ),
  },
  {
    number: '4',
    title: 'Responsabilidad',
    content: (
      <>
        <p style={{ marginBottom: 12 }}>El titular no se hace responsable de:</p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Interrupciones en el servicio por causas técnicas, mantenimiento o fuerza mayor.',
            'Decisiones tomadas por el usuario basándose exclusivamente en los resultados del análisis automático (los resultados son orientativos y no sustituyen la revisión humana).',
            'Contenidos alojados por los usuarios que pudieran infringir derechos de terceros.',
          ].map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    number: '5',
    title: 'Legislación aplicable y jurisdicción',
    content: (
      <p>
        Este aviso legal se rige por la legislación española. Para cualquier controversia derivada del uso de este sitio web,
        las partes se someten a los juzgados y tribunales de A Coruña, España.
      </p>
    ),
  },
];

export default function AvisoLegalPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <BackButton />
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>Aviso Legal</h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Intro */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Aviso Legal de Doclity
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Última actualización: mayo 2026</p>
        </div>

        {/* Sections */}
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
              <div style={{
                paddingLeft: 34,
                fontSize: 13,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
              }}>
                {section.content}
              </div>
              <div style={{
                marginTop: 32,
                height: '0.5px',
                background: 'var(--border)',
              }} />
            </section>
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: 40,
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          Este aviso legal se aplica a todos los usuarios de Doclity registrados a partir de su fecha de entrada en vigor.
        </p>
      </div>
    </div>
  );
}
