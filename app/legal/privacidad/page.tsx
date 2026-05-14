import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad — Doclity',
};

const sections = [
  {
    number: '1',
    title: 'Responsable del tratamiento',
    content: (
      <>
        <p>
          El responsable del tratamiento de tus datos es el titular de Doclity, con domicilio en A Coruña, España.
          Para cualquier consulta relacionada con la protección de tus datos personales, puedes contactarnos en:{' '}
          <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>doclitynfo@gmail.com</a>.
        </p>
      </>
    ),
  },
  {
    number: '2',
    title: 'Qué datos recogemos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Datos de registro</p>
          <p>Dirección de email y contraseña, gestionados por Supabase Auth. No recogemos nombre, teléfono ni dirección postal.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Documentos que subes</p>
          <p>Los documentos que indexas en la plataforma se almacenan en Supabase (texto completo y metadatos) y en Pinecone (fragmentos vectorizados para búsqueda semántica). Solo son accesibles por los miembros de tu organización.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Consultas al chat</p>
          <p>Las preguntas que haces al asistente se registran para generar estadísticas de uso internas de tu organización. No las usamos para entrenar modelos ni las compartimos con terceros.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Resultados de análisis</p>
          <p>Los resultados de los análisis de documentos (contradicciones, duplicidades, inconsistencias) se almacenan para que puedas consultarlos en tu panel de inteligencia documental.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Datos de facturación</p>
          <p>Los datos de pago (tarjeta de crédito) son gestionados íntegramente por Stripe. Nosotros no almacenamos ni tenemos acceso a los datos de tu tarjeta.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Datos técnicos</p>
          <p>Registramos información de uso (endpoint utilizado, modelo de IA, tokens consumidos, latencia) para monitorización y facturación. No registramos datos personales en estos logs.</p>
        </div>
      </div>
    ),
  },
  {
    number: '3',
    title: 'Para qué usamos tus datos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Prestarte el servicio</p>
          <p>Responder tus preguntas sobre documentación, analizar documentos, detectar contradicciones y duplicidades, y gestionar tu cuenta.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Facturación</p>
          <p>Gestionar tu suscripción, controlar el consumo de créditos y procesar pagos.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Estadísticas internas de tu organización</p>
          <p>Mostrarte el panel de inteligencia documental con datos de uso, calidad y cobertura de tus documentos. Estas estadísticas solo son visibles para los administradores de tu organización.</p>
        </div>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Mejora del servicio</p>
          <p>Usamos datos agregados y anonimizados para mejorar la calidad del análisis. Nunca usamos tus documentos ni consultas para entrenar modelos de IA.</p>
        </div>
      </div>
    ),
  },
  {
    number: '4',
    title: 'Subprocesadores',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { name: 'Supabase (Supabase Inc.)', desc: 'Almacenamiento de base de datos, autenticación y archivos.' },
          { name: 'Pinecone (Pinecone Systems, Inc.)', desc: 'Base de datos vectorial para búsqueda semántica.' },
          { name: 'Anthropic (Anthropic, PBC)', desc: 'Procesamiento de lenguaje natural. Anthropic no usa los datos enviados por API para entrenar sus modelos.' },
          { name: 'Stripe (Stripe, Inc.)', desc: 'Procesamiento de pagos.' },
          { name: 'Vercel (Vercel, Inc.)', desc: 'Hosting de la aplicación web.' },
          { name: 'Railway (Railway Corp.)', desc: 'Ejecución de análisis exhaustivos en segundo plano.' },
        ].map(({ name, desc }) => (
          <div key={name} style={{
            padding: '12px 14px', borderRadius: 8,
            background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          }}>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{name}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          </div>
        ))}
        <p style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
          Todos estos proveedores están ubicados en EE.UU. o la UE y ofrecen garantías adecuadas de protección de datos.
        </p>
      </div>
    ),
  },
  {
    number: '5',
    title: 'Cuánto tiempo conservamos tus datos',
    content: (
      <p>
        Mientras tu cuenta esté activa, conservamos todos tus datos para prestarte el servicio. Si cancelas tu suscripción,
        mantenemos tus datos durante un período de gracia de <strong>90 días</strong>. Transcurrido ese período, procederemos
        al borrado. Los datos de facturación se conservan el tiempo que exija la legislación fiscal española (4 años).
      </p>
    ),
  },
  {
    number: '6',
    title: 'Borrado de datos',
    content: (
      <>
        <p style={{ marginBottom: 12 }}>
          Tras el período de gracia de 90 días después de la cancelación, borraremos:
        </p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'Tus documentos y su texto completo',
            'Los vectores de Pinecone asociados a tu organización',
            'Tus consultas al chat',
            'Los resultados de análisis',
            'Los logs de uso',
          ].map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p style={{ marginTop: 12 }}>
          Se anonimizarán los datos agregados de uso para estadísticas internas. Puedes solicitar el borrado anticipado
          contactando a{' '}
          <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>doclitynfo@gmail.com</a>.
        </p>
      </>
    ),
  },
  {
    number: '7',
    title: 'Tus derechos',
    content: (
      <>
        <p style={{ marginBottom: 12 }}>Conforme al RGPD, tienes derecho a:</p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {[
            'Acceder a tus datos personales',
            'Rectificar datos inexactos',
            'Solicitar la supresión',
            'Oponerte al tratamiento',
            'Solicitar la limitación del tratamiento',
            'Solicitar la portabilidad',
          ].map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Para ejercer estos derechos, escríbenos a{' '}
          <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>doclitynfo@gmail.com</a>.
          Responderemos en un plazo máximo de 30 días. Si consideras que no hemos atendido adecuadamente
          tus derechos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (
          <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>www.aepd.es</a>
          ).
        </p>
      </>
    ),
  },
  {
    number: '8',
    title: 'Seguridad',
    content: (
      <>
        <p style={{ marginBottom: 12 }}>Implementamos las siguientes medidas técnicas y organizativas:</p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'Cifrado AES-256-GCM de tokens OAuth',
            'Aislamiento de datos por organización (Row Level Security y namespaces)',
            'Autenticación con JWT',
            'Verificación de firma en webhooks de pago',
            'Rate limiting en endpoints sensibles',
          ].map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    number: '9',
    title: 'Cookies',
    content: (
      <p>
        Doclity no utiliza cookies de seguimiento ni publicidad. Solo utilizamos cookies técnicas
        estrictamente necesarias para mantener tu sesión activa.
      </p>
    ),
  },
  {
    number: '10',
    title: 'Cambios en esta política',
    content: (
      <p>
        Podemos actualizar esta política cuando sea necesario. Te notificaremos cualquier cambio relevante
        a través de la aplicación.
      </p>
    ),
  },
];

export default function PrivacidadPage() {
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
        <Link
          href="/login"
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '0.5px solid var(--border)',
            background: 'var(--bg-secondary)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            textDecoration: 'none',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </Link>
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>Política de Privacidad</h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Intro */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Política de Privacidad de Doclity
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
          Esta política se aplica a todos los usuarios de Doclity registrados a partir de su fecha de entrada en vigor.
        </p>
      </div>
    </div>
  );
}
