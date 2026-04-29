'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/* ============================================================
   Landing Page — Documentation Hub
   
   Estructura:
   1. Hero — propuesta de valor en < 8 palabras
   2. Problema — puntos de dolor del cliente
   3. Solución — las 3 funciones principales
   4. Diferenciador — lo que nadie más hace
   5. Cómo funciona — 3 pasos
   6. Planes — precios claros
   7. FAQ — objeciones comunes
   8. CTA final — cierre
   9. Footer — enlaces legales
   ============================================================ */

const PLANS = [
  { name: 'Free', price: '0', credits: '100', users: '1', desc: 'Para probar', cta: 'Empezar gratis' },
  { name: 'Starter', price: '39', credits: '800', users: '5', desc: 'Profesional independiente', cta: 'Empezar' },
  { name: 'Pro', price: '99', credits: '3.000', users: '15', desc: 'PYME pequeña', cta: 'Empezar', popular: true },
  { name: 'Business', price: '249', credits: '8.000', users: '40', desc: 'PYME mediana', cta: 'Empezar' },
  { name: 'Business+', price: '499', credits: '18.000', users: '80', desc: 'PYME grande', cta: 'Contactar' },
];

const FAQS = [
  {
    q: '¿Mis documentos están seguros?',
    a: 'Sí. Cada organización tiene su espacio aislado. Usamos cifrado AES-256, Row Level Security en la base de datos, y validación JWT en cada petición. Tus documentos nunca se comparten con otras empresas ni se usan para entrenar modelos de IA.',
  },
  {
    q: '¿Qué formatos de documento aceptáis?',
    a: 'PDF, Word (.docx), texto plano (.txt), Markdown (.md), CSV, JSON y HTML. También puedes importar directamente desde Google Drive.',
  },
  {
    q: '¿Qué pasa si la IA se equivoca?',
    a: 'Documentation Hub siempre muestra las fuentes de sus respuestas para que puedas verificarlas. El análisis de documentos indica el nivel de confianza de cada hallazgo. Nunca prometemos detección al 100% — somos una herramienta de apoyo, no un sustituto del criterio humano.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí, sin permanencia. Al cancelar mantienes el acceso hasta el final del período facturado, más 90 días de gracia para exportar tus datos.',
  },
  {
    q: '¿Necesito conocimientos técnicos?',
    a: 'No. Subes tus documentos y empiezas a preguntar. No hay configuración técnica, no hay APIs que conectar, no hay que instalar nada.',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsLoggedIn(true);
    });
  }, [supabase.auth]);

  function handleCTA() {
     router.push(isLoggedIn ? '/chat' : '/login');
   }
   
   function handlePlanCTA() {
     router.push(isLoggedIn ? '/settings/billing' : '/login');
   }

  return (
    <div style={{ background: '#fafaf9', color: '#1a1a1a', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Serif+Display&display=swap');
        
        .landing * { box-sizing: border-box; margin: 0; padding: 0; }
        .landing { font-family: 'DM Sans', -apple-system, sans-serif; }
        .landing h1, .landing h2, .landing h3 { font-family: 'DM Serif Display', Georgia, serif; }
        
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 16px 24px;
          background: rgba(250, 250, 249, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        
        .landing-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px;
        }
        
        .hero-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 10px; border: none;
          background: #1a1a1a; color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
        
        .hero-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 10px;
          border: 1.5px solid rgba(0,0,0,0.12);
          background: transparent; color: #1a1a1a;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .hero-btn-secondary:hover { border-color: rgba(0,0,0,0.25); background: rgba(0,0,0,0.02); }
        
        .feature-card {
          padding: 36px 32px; border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.06); }
        
        .plan-card {
          padding: 32px 28px; border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column;
          transition: transform 0.2s;
        }
        .plan-card:hover { transform: translateY(-2px); }
        .plan-popular {
          border: 2px solid #1a1a1a;
          position: relative;
        }
        
        .faq-item {
          border-bottom: 1px solid rgba(0,0,0,0.06);
          cursor: pointer;
        }
        .faq-q {
          padding: 20px 0;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 15px; font-weight: 500;
        }
        .faq-a {
          padding-bottom: 20px;
          font-size: 14px; line-height: 1.7; color: #666;
        }
        
        .step-number {
          width: 40px; height: 40px; border-radius: 50%;
          background: #1a1a1a; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 16px;
          flex-shrink: 0;
        }
        
        .diff-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px;
          background: #e8f5e9; color: #2e7d32;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.3px;
        }
        
        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .hero-buttons { flex-direction: column !important; }
          .hero-buttons button { width: 100% !important; justify-content: center; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .diff-grid { grid-template-columns: 1fr !important; }
          .nav-inner { justify-content: center !important; }
          .nav-cta { display: none !important; }
        }
      `}</style>

      <div className="landing">

        {/* ============ NAV ============ */}
        <nav className="landing-nav">
          <div className="landing-section">
            <div className="nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>Documentation Hub</span>
              </div>
              <div className="nav-cta" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => router.push('/login')}
                  style={{
                    padding: '8px 20px', borderRadius: 8, 
                    background: 'transparent', color: '#1a1a1a',
                    border: '1.5px solid rgba(0,0,0,0.15)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {isLoggedIn ? 'Ir al chat' : 'Iniciar sesión'}
                </button>
                {!isLoggedIn && (
                  <button
                    onClick={() => router.push('/login')}
                    style={{
                      padding: '8px 20px', borderRadius: 8, 
                      background: '#1a1a1a', color: '#fff',
                       border: '1.5px solid rgba(0,0,0,0.15)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Empezar gratis
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* ============ HERO ============ */}
        <section style={{ paddingTop: 140, paddingBottom: 80 }}>
          <div className="landing-section" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 24 }}>
              <span className="diff-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Para PYMES hispanohablantes
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(36px, 5.5vw, 62px)',
              lineHeight: 1.1,
              letterSpacing: -1.5,
              marginBottom: 20,
              color: '#1a1a1a',
            }}>
              Tu documentación,<br />
              <span style={{ color: '#888' }}>siempre bajo control</span>
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.6,
              color: '#666',
              maxWidth: 560,
              margin: '0 auto 36px',
            }}>
              Un chat privado con IA que responde solo con tus documentos.
              Detecta contradicciones, duplicados y problemas antes de que lleguen a tu equipo.
            </p>
            <div className="hero-buttons" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="hero-btn" onClick={handleCTA}>
                Empezar gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <button className="hero-btn-secondary" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver cómo funciona
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
              Sin tarjeta de crédito · 100 consultas gratis · Empieza en 30 segundos
            </p>
          </div>
        </section>

        {/* ============ PROBLEMA ============ */}
        <section style={{ paddingTop: 60, paddingBottom: 80 }}>
          <div className="landing-section">
            <p style={{
              fontSize: 13, fontWeight: 600, color: '#999',
              textTransform: 'uppercase', letterSpacing: 1.5,
              textAlign: 'center', marginBottom: 16,
            }}>
              El problema
            </p>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 38px)', textAlign: 'center',
              lineHeight: 1.2, letterSpacing: -0.5,
              marginBottom: 48, maxWidth: 700, margin: '0 auto 48px',
            }}>
              Tu equipo pierde tiempo buscando información que ya existe
            </h2>
            <div className="features-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}>
              {[
                {
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  ),
                  title: 'Información perdida',
                  text: 'Documentos repartidos en carpetas, drives y emails. Nadie sabe dónde está la versión correcta.',
                },
                {
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ),
                  title: 'Documentos que se contradicen',
                  text: 'Un manual dice una cosa, un protocolo dice otra. Y nadie lo detecta hasta que genera un problema.',
                },
                {
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  title: 'Horas perdidas cada semana',
                  text: 'Buscar, releer, preguntar a compañeros. Tu equipo dedica horas a encontrar lo que debería estar accesible.',
                },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '32px 28px', borderRadius: 16,
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{ marginBottom: 16 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666' }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SOLUCIÓN: 3 FUNCIONES ============ */}
        <section style={{ paddingTop: 60, paddingBottom: 80 }}>
          <div className="landing-section">
            <p style={{
              fontSize: 13, fontWeight: 600, color: '#999',
              textTransform: 'uppercase', letterSpacing: 1.5,
              textAlign: 'center', marginBottom: 16,
            }}>
              La solución
            </p>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 38px)', textAlign: 'center',
              lineHeight: 1.2, letterSpacing: -0.5,
              marginBottom: 48, maxWidth: 700, margin: '0 auto 48px',
            }}>
              Tres funciones, un solo lugar
            </h2>
            <div className="features-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}>
              {[
                {
                  emoji: '💬',
                  title: 'Pregunta a tus documentos',
                  text: 'Haz preguntas en lenguaje natural y obtén respuestas precisas basadas solo en tu documentación. Con citas a las fuentes reales.',
                  detail: 'Chat RAG privado',
                },
                {
                  emoji: '🔍',
                  title: 'Detecta problemas al subir',
                  text: 'Cada documento nuevo se analiza contra los existentes. Duplicados, contradicciones, solapamientos — detectados antes de publicar.',
                  detail: 'Análisis automático',
                },
                {
                  emoji: '✏️',
                  title: 'Mejora con ayuda de la IA',
                  text: 'Corrige los problemas detectados en un editor integrado con sugerencias automáticas. Mejora estilo, ortografía y coherencia.',
                  detail: 'Mejora guiada',
                },
              ].map((item, i) => (
                <div key={i} className="feature-card">
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.detail}</span>
                  <div style={{ fontSize: 36, margin: '16px 0' }}>{item.emoji}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666' }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ DIFERENCIADOR ============ */}
        <section style={{ paddingTop: 40, paddingBottom: 80 }}>
          <div className="landing-section">
            <div style={{
              padding: 'clamp(40px, 5vw, 64px)',
              borderRadius: 20,
              background: '#1a1a1a',
              color: '#fff',
            }}>
              <div className="diff-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '5px 12px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.1)',
                    fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                    marginBottom: 20, textTransform: 'uppercase',
                  }}>
                    Lo que nos diferencia
                  </span>
                  <h2 style={{
                    fontSize: 'clamp(24px, 3.5vw, 34px)',
                    lineHeight: 1.2, letterSpacing: -0.5,
                    marginBottom: 16, color: '#fff',
                  }}>
                    No solo buscamos.<br />Analizamos la calidad.
                  </h2>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
                    Otros productos te dejan buscar en tus documentos.
                    Nosotros además analizamos cada documento nuevo contra el corpus existente
                    y te dicen exactamente qué problemas tiene antes de que lo publiques.
                  </p>
                  <button className="hero-btn" onClick={handleCTA} style={{ background: '#fff', color: '#1a1a1a' }}>
                    Pruébalo gratis
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Glean, Guru, Notion AI', has: 'Búsqueda con IA', missing: 'No analizan calidad documental' },
                    { label: 'Documentation Hub', has: 'Búsqueda con IA', extra: 'Análisis de calidad al subir' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '20px 24px', borderRadius: 12,
                      background: i === 1 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                      border: i === 1 ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: i === 1 ? '#fff' : 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {item.has}
                        </div>
                        {item.missing && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            {item.missing}
                          </div>
                        )}
                        {item.extra && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4caf50', fontWeight: 500 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            {item.extra}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CÓMO FUNCIONA ============ */}
        <section id="como-funciona" style={{ paddingTop: 60, paddingBottom: 80 }}>
          <div className="landing-section">
            <p style={{
              fontSize: 13, fontWeight: 600, color: '#999',
              textTransform: 'uppercase', letterSpacing: 1.5,
              textAlign: 'center', marginBottom: 16,
            }}>
              Cómo funciona
            </p>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 38px)', textAlign: 'center',
              lineHeight: 1.2, letterSpacing: -0.5,
              marginBottom: 48, maxWidth: 600, margin: '0 auto 48px',
            }}>
              Empieza en tres pasos
            </h2>
            <div className="steps-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}>
              {[
                {
                  num: '1',
                  title: 'Sube tus documentos',
                  text: 'Arrastra PDFs, Word o conecta Google Drive. La indexación es automática.',
                },
                {
                  num: '2',
                  title: 'Revisa el análisis',
                  text: 'El sistema detecta problemas contra tu corpus existente. Corrígelos antes de publicar.',
                },
                {
                  num: '3',
                  title: 'Pregunta lo que necesites',
                  text: 'Haz preguntas al chat y obtén respuestas con citas. Tu equipo deja de buscar.',
                },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', alignItems: 'center' }}>
                  <div className="step-number">{step.num}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{step.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#666', maxWidth: 280 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PLANES ============ */}
        <section style={{ paddingTop: 60, paddingBottom: 80 }}>
          <div className="landing-section">
            <p style={{
              fontSize: 13, fontWeight: 600, color: '#999',
              textTransform: 'uppercase', letterSpacing: 1.5,
              textAlign: 'center', marginBottom: 16,
            }}>
              Precios
            </p>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 38px)', textAlign: 'center',
              lineHeight: 1.2, letterSpacing: -0.5,
              marginBottom: 12,
            }}>
              Planes claros, sin sorpresas
            </h2>
            <p style={{
              fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 48,
            }}>
              Precios en euros, sin IVA. Cancela cuando quieras.
            </p>
            <div className="plans-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              maxWidth: 960,
              margin: '0 auto',
            }}>
              {PLANS.map((plan, i) => (
                <div key={i} className={`plan-card ${plan.popular ? 'plan-popular' : ''}`}>
                  {plan.popular && (
                    <span style={{
                      position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                      padding: '3px 14px', borderRadius: 12,
                      background: '#1a1a1a', color: '#fff',
                      fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Más popular
                    </span>
                  )}
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{plan.name}</h3>
                  <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>{plan.desc}</p>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>{plan.price}€</span>
                    {plan.price !== '0' && <span style={{ fontSize: 13, color: '#999' }}>/mes</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 20, flex: 1 }}>
                    <p style={{ marginBottom: 6 }}>{plan.credits} créditos/mes</p>
                    <p>Hasta {plan.users} usuario{plan.users !== '1' ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={handlePlanCTA}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                      background: plan.popular ? '#1a1a1a' : '#f0f0ee',
                      color: plan.popular ? '#fff' : '#1a1a1a',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SEGURIDAD ============ */}
        <section style={{ paddingTop: 40, paddingBottom: 80 }}>
          <div className="landing-section" style={{ maxWidth: 700, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#e8f5e9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <h2 style={{
              fontSize: 'clamp(22px, 3vw, 30px)',
              lineHeight: 1.3, letterSpacing: -0.3, marginBottom: 16,
            }}>
              Tus documentos son tuyos. Siempre.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#666', marginBottom: 24 }}>
              Cifrado AES-256, aislamiento por organización, y nunca usamos tus documentos para entrenar modelos de IA. Cada workspace es privado y seguro.
            </p>
            <div style={{
              display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap',
              fontSize: 13, color: '#888',
            }}>
              {['Cifrado AES-256', 'Aislamiento por workspace', 'RGPD compliant', 'Sin entrenamiento con tus datos'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section style={{ paddingTop: 40, paddingBottom: 80 }}>
          <div className="landing-section" style={{ maxWidth: 640 }}>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 34px)', textAlign: 'center',
              lineHeight: 1.2, letterSpacing: -0.5,
              marginBottom: 40,
            }}>
              Preguntas frecuentes
            </h2>
            <div>
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="faq-q">
                    <span>{faq.q}</span>
                    <svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="#999" strokeWidth="2"
                      style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {openFaq === i && <div className="faq-a">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section style={{ paddingTop: 40, paddingBottom: 100 }}>
          <div className="landing-section" style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4.5vw, 42px)',
              lineHeight: 1.2, letterSpacing: -0.5,
              marginBottom: 16,
            }}>
              Pon tu documentación<br />
              <span style={{ color: '#888' }}>a trabajar para ti</span>
            </h2>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Empieza gratis con 100 consultas. Sin tarjeta. Sin compromiso.
            </p>
            <button className="hero-btn" onClick={handleCTA}>
              Empezar ahora
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '32px 24px',
        }}>
          <div className="landing-section" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 16,
          }}>
            <span style={{ fontSize: 13, color: '#999' }}>
              © {new Date().getFullYear()} Documentation Hub
            </span>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="/privacy" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>Política de privacidad</a>
              <a href="/terms" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>Términos de uso</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
