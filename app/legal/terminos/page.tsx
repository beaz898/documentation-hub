import Link from 'next/link';
import BackButton from '@/components/BackButton';

export const metadata = {
  title: 'Términos y Condiciones — Doclity',
};

const sections = [
  {
    number: '1',
    title: 'Objeto',
    content: (
      <p>
        Los presentes Términos y Condiciones regulan el acceso y uso de Doclity, una plataforma de gestión
        y análisis de documentación corporativa con inteligencia artificial, accesible desde{' '}
        <a href="https://documentation-hub-zeta.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>
          documentation-hub-zeta.vercel.app
        </a>.
      </p>
    ),
  },
  {
    number: '2',
    title: 'Descripción del servicio',
    content: (
      <>
        <p style={{ marginBottom: 12 }}>Doclity ofrece las siguientes funcionalidades:</p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Un chat privado que responde preguntas sobre la documentación corporativa del usuario, con citas a las fuentes.',
            'Análisis automático de documentos al subirlos, detectando duplicados, contradicciones, solapamientos e incoherencias contra el corpus existente.',
            'Un modo de mejora asistida por IA para corregir documentos conversando.',
            'Análisis de estilo (ortografía, ambigüedades, sugerencias).',
            'Integración con Google Drive para sincronizar documentación.',
          ].map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    number: '3',
    title: 'Registro y cuenta',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p>Para usar el servicio es necesario registrarse con una dirección de email válida.</p>
        <p>El usuario es responsable de mantener la confidencialidad de sus credenciales.</p>
        <p>Cada usuario pertenece a una organización (workspace) con un rol de administrador o miembro.</p>
      </div>
    ),
  },
  {
    number: '4',
    title: 'Planes y créditos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          'El servicio funciona mediante planes de suscripción mensual con un pool de créditos compartido por la organización.',
          'Cada operación consume un número determinado de créditos según su tipo.',
          'Los créditos no utilizados del plan no se acumulan entre períodos.',
          'Los créditos extra adquiridos mediante recargas no caducan.',
        ].map(item => (
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
    title: 'Pagos y facturación',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p>Los pagos se procesan a través de Stripe. Doclity no almacena ni tiene acceso a los datos de tarjeta del usuario.</p>
        <p>Las suscripciones se renuevan automáticamente cada mes.</p>
        <p>
          El administrador de la organización puede gestionar su suscripción, consultar facturas y cambiar
          el método de pago desde el portal de Stripe.
        </p>
      </div>
    ),
  },
  {
    number: '6',
    title: 'Propiedad de los datos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p>Los documentos subidos por el usuario son y siguen siendo propiedad del usuario.</p>
        <p>
          Doclity no utiliza los documentos del usuario para entrenar modelos de inteligencia artificial
          ni los comparte con terceros.
        </p>
        <p>Los documentos se almacenan cifrados y aislados por organización.</p>
      </div>
    ),
  },
  {
    number: '7',
    title: 'Uso aceptable',
    content: (
      <>
        <p style={{ marginBottom: 12 }}>El usuario se compromete a no usar el servicio para:</p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {[
            'Almacenar contenido ilegal o que infrinja derechos de terceros.',
            'Intentar acceder a datos de otras organizaciones.',
            'Realizar ingeniería inversa del servicio.',
            'Sobrecargar intencionadamente la infraestructura.',
            'Compartir sus credenciales con personas no autorizadas.',
          ].map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>Nos reservamos el derecho de suspender cuentas que incumplan estas condiciones.</p>
      </>
    ),
  },
  {
    number: '8',
    title: 'Disponibilidad y limitaciones',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p>
          Doclity se ofrece &ldquo;tal cual&rdquo;. Nos esforzamos por mantener el servicio disponible,
          pero no garantizamos disponibilidad ininterrumpida ni ausencia de errores.
        </p>
        <p>
          El análisis de documentos se basa en inteligencia artificial y puede no detectar todas las
          discrepancias existentes. Los resultados del análisis son orientativos y no sustituyen la
          revisión humana.
        </p>
        <p>
          No nos hacemos responsables de decisiones tomadas basándose exclusivamente en los resultados del servicio.
        </p>
      </div>
    ),
  },
  {
    number: '9',
    title: 'Cancelación y conservación de datos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p>Puedes cancelar tu suscripción en cualquier momento.</p>
        <p>Tras la cancelación, mantendrás acceso hasta el final del período facturado.</p>
        <p>
          Tus datos se conservarán durante <strong>90 días</strong> adicionales de gracia. Transcurrido
          ese período, se procederá al borrado según lo descrito en la{' '}
          <Link href="/legal/privacidad" style={{ color: 'var(--brand)' }}>Política de Privacidad</Link>.
        </p>
      </div>
    ),
  },
  {
    number: '10',
    title: 'Modificaciones',
    content: (
      <p>
        Podemos modificar estos términos cuando sea necesario. Te notificaremos los cambios relevantes a
        través de la aplicación con al menos <strong>15 días</strong> de antelación. El uso continuado del
        servicio tras la notificación implica la aceptación de los nuevos términos.
      </p>
    ),
  },
  {
    number: '11',
    title: 'Legislación aplicable',
    content: (
      <p>
        Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se
        someten a los juzgados y tribunales de A Coruña, España.
      </p>
    ),
  },
  {
    number: '12',
    title: 'Contacto',
    content: (
      <p>
        Para cualquier consulta sobre estos términos, puedes escribirnos a{' '}
        <a href="mailto:doclitynfo@gmail.com" style={{ color: 'var(--brand)' }}>doclitynfo@gmail.com</a>.
      </p>
    ),
  },
];

export default function TerminosPage() {
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
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>Términos y Condiciones</h1>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Intro */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Términos y Condiciones de uso de Doclity
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
          Estos términos se aplican a todos los usuarios de Doclity registrados a partir de su fecha de entrada en vigor.
        </p>
      </div>
    </div>
  );
}
