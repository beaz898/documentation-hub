'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/* ============================================================
   Landing Page — Documentation Hub
   
   Estructura:
   1. Nav — logo + botones con presencia
   2. Hero — propuesta de valor + mockup animado de la app
   3. Problema — puntos de dolor
   4. Solución — 3 funciones principales
   5. Diferenciador — comparación visual impactante
   6. Cómo funciona — 3 pasos
   7. Planes — precios
   8. Seguridad — confianza
   9. FAQ
   10. CTA final
   11. Footer — enlaces legales
   ============================================================ */

const BRAND = '#2563eb';
const BRAND_LIGHT = '#dbeafe';
const BRAND_DARK = '#1d4ed8';

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
    <div className="landing" style={{ background: '#fafaf9', color: '#1a1a1a', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        .landing * { box-sizing: border-box; margin: 0; padding: 0; }
        .landing { font-family: 'DM Sans', -apple-system, sans-serif; }
        .landing h1, .landing h2 { font-family: 'Playfair Display', Georgia, serif; }
        
        /* NAV */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 14px 24px;
          background: rgba(250, 250, 249, 0.8);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        
        .landing-section { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
        
        /* BUTTONS */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 10px; border: none;
          background: ${BRAND}; color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(37,99,235,0.3);
        }
        .btn-primary:hover { background: ${BRAND_DARK}; transform: translateY(-2px); box-shadow: 0 6px 24px rgba(37,99,235,0.25); }
        
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 10px;
          border: 1.5px solid rgba(0,0,0,0.12);
          background: #fff; color: #1a1a1a;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: ${BRAND}; color: ${BRAND}; background: ${BRAND_LIGHT}; }
        
        .btn-nav {
          padding: 9px 20px; border-radius: 8px;
          border: 1.5px solid rgba(0,0,0,0.1);
          background: #fff; color: #1a1a1a;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .btn-nav:hover { border-color: ${BRAND}; color: ${BRAND}; }
        
        .btn-nav-primary {
          padding: 9px 20px; border-radius: 8px;
          border: 1.5px solid ${BRAND};
          background: ${BRAND}; color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .btn-nav-primary:hover { background: ${BRAND_DARK}; border-color: ${BRAND_DARK}; }
        
        /* FEATURE CARDS */
        .feature-card {
          padding: 36px 32px; border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          transition: all 0.25s;
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: ${BRAND}; transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s;
        }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.06); }
        .feature-card:hover::before { transform: scaleX(1); }
        
        /* PLAN CARDS */
        .plan-card {
          padding: 32px 28px; border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column;
          transition: all 0.2s;
        }
        .plan-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.06); }
        .plan-popular {
          border: 2px solid ${BRAND};
          position: relative;
          box-shadow: 0 8px 32px rgba(37,99,235,0.1);
        }
        
        /* FAQ */
        .faq-item { border-bottom: 1px solid rgba(0,0,0,0.06); cursor: pointer; }
        .faq-q {
          padding: 20px 0;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 15px; font-weight: 500;
        }
        .faq-q:hover { color: ${BRAND}; }
        .faq-a { padding-bottom: 20px; font-size: 14px; line-height: 1.7; color: #666; }
        
        /* MOCKUP ANIMATION */
        @keyframes typeText { from { width: 0; } to { width: 100%; } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes progressBar { from { width: 0; } to { width: 100%; } }
        @keyframes heroFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .mockup-container {
          animation: scaleIn 0.8s ease-out 0.3s both;
        }
        .mockup-float { animation: heroFloat 6s ease-in-out infinite; }
        
        .mock-msg-user {
          animation: fadeSlideUp 0.4s ease-out 1.2s both;
        }
        .mock-msg-ai {
          animation: fadeSlideUp 0.4s ease-out 2.0s both;
        }
        .mock-typing {
          animation: fadeSlideUp 0.3s ease-out 1.6s both;
        }
        .mock-source {
          animation: slideInRight 0.3s ease-out 2.6s both;
        }
        .mock-sidebar-doc {
          opacity: 0;
          animation: fadeSlideUp 0.3s ease-out both;
        }
        .mock-sidebar-doc:nth-child(1) { animation-delay: 0.5s; }
        .mock-sidebar-doc:nth-child(2) { animation-delay: 0.7s; }
        .mock-sidebar-doc:nth-child(3) { animation-delay: 0.9s; }
        
        .mock-badge {
          animation: fadeSlideUp 0.3s ease-out 3.0s both;
        }
        
        /* PROBLEM ICONS */
        .problem-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
        }
        
        /* STEP NUMBER */
        .step-number {
          width: 44px; height: 44px; border-radius: 50%;
          background: ${BRAND}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 17px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }
        
        /* SECTION LABEL */
        .section-label {
          font-size: 13px; font-weight: 600; color: ${BRAND};
          text-transform: uppercase; letter-spacing: 2px;
          text-align: center; margin-bottom: 16px;
          font-family: 'DM Sans', sans-serif;
        }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; max-width: 340px !important; margin: 0 auto !important; }
          .hero-buttons { flex-direction: column !important; }
          .hero-buttons button, .hero-buttons .btn-primary, .hero-buttons .btn-secondary { width: 100% !important; justify-content: center; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .diff-grid { grid-template-columns: 1fr !important; }
          .hero-layout { flex-direction: column !important; text-align: center !important; }
          .hero-text { align-items: center !important; }
          .nav-inner { justify-content: center !important; }
          .nav-cta { display: none !important; }
          .mockup-wrapper { margin-top: 32px !important; }
          .security-badges { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>

      {/* ============ NAV ============ */}
      <nav className="landing-nav">
        <div className="landing-section">
          <div className="nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: BRAND,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>Documentation Hub</span>
            </div>
            <div className="nav-cta" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isLoggedIn ? (
                <button className="btn-nav-primary" onClick={() => router.push('/chat')}>
                  Ir al chat
                </button>
              ) : (
                <>
                  <button className="btn-nav" onClick={() => router.push('/login')}>
                    Iniciar sesión
                  </button>
                  <button className="btn-nav-primary" onClick={() => router.push('/login')}>
                    Empezar gratis
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section style={{ paddingTop: 120, paddingBottom: 60 }}>
        <div className="landing-section">
          <div className="hero-layout" style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
            
            {/* Hero text */}
            <div className="hero-text" style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  background: BRAND_LIGHT, color: BRAND,
                  fontSize: 12, fontWeight: 600,
                  letterSpacing: 0.3,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Para PYMES hispanohablantes
                </span>
              </div>
              <h1 style={{
                fontSize: 'clamp(34px, 4.5vw, 54px)',
                lineHeight: 1.12,
                letterSpacing: -1,
                marginBottom: 18,
                color: '#1a1a1a',
              }}>
                Tu documentación,<br />
                <span style={{ color: BRAND }}>siempre bajo control</span>
              </h1>
              <p style={{
                fontSize: 'clamp(15px, 1.8vw, 18px)',
                lineHeight: 1.65,
                color: '#555',
                marginBottom: 32,
                maxWidth: 440,
              }}>
                Un chat privado con IA que responde solo con tus documentos.
                Detecta contradicciones, duplicados y problemas antes de que lleguen a tu equipo.
              </p>
              <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={handleCTA}>
                  Empezar gratis
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <button className="btn-secondary" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
                  Ver cómo funciona
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#999', marginTop: 14 }}>
                Sin tarjeta de crédito · 100 consultas gratis
              </p>
            </div>

            {/* Hero mockup */}
            <div className="mockup-wrapper" style={{ flex: 1, minWidth: 0 }}>
              <div className="mockup-container mockup-float">
                <div style={{
                  borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                  background: '#fff',
                }}>
                  {/* Browser chrome */}
                  <div style={{
                    padding: '10px 14px', background: '#f5f5f4',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a3e635' }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
                    </div>
                    <div style={{
                      flex: 1, background: '#fff', borderRadius: 6, padding: '4px 12px',
                      fontSize: 11, color: '#999', border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      documentation-hub.app/chat
                    </div>
                  </div>
                  
                  {/* App content */}
                  <div style={{ display: 'flex', height: 280 }}>
                    {/* Sidebar */}
                    <div style={{
                      width: 160, borderRight: '1px solid rgba(0,0,0,0.06)',
                      padding: '12px 10px', background: '#fafaf9',
                      display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#999', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Documentos</div>
                      {['Manual_Calidad.pdf', 'Protocolo_RRHH.docx', 'Guia_Onboarding.pdf'].map((name, i) => (
                        <div key={i} className="mock-sidebar-doc" style={{
                          padding: '7px 8px', borderRadius: 6,
                          background: i === 0 ? BRAND_LIGHT : 'transparent',
                          border: i === 0 ? `1px solid ${BRAND}22` : '1px solid transparent',
                          fontSize: 10, color: i === 0 ? BRAND : '#666',
                          fontWeight: i === 0 ? 600 : 400,
                          display: 'flex', alignItems: 'center', gap: 5,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {name}
                        </div>
                      ))}
                      <div style={{ marginTop: 'auto', padding: '8px 6px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <div className="mock-badge" style={{
                          fontSize: 9, padding: '4px 8px', borderRadius: 6,
                          background: '#dcfce7', color: '#16a34a', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a' }} />
                          Pro · 2.847 cr
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 16px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                        {/* User message */}
                        <div className="mock-msg-user" style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
                          <div style={{
                            padding: '8px 12px', borderRadius: '12px 12px 4px 12px',
                            background: BRAND, color: '#fff',
                            fontSize: 11, lineHeight: 1.5,
                          }}>
                            ¿Cuál es el proceso de onboarding para nuevos empleados?
                          </div>
                        </div>
                        
                        {/* Typing indicator */}
                        <div className="mock-typing" style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: 6, height: 6, borderRadius: '50%', background: '#ccc',
                              animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                            }} />
                          ))}
                        </div>
                        
                        {/* AI response */}
                        <div className="mock-msg-ai" style={{ maxWidth: '85%' }}>
                          <div style={{
                            padding: '10px 12px', borderRadius: '12px 12px 12px 4px',
                            background: '#f5f5f4',
                            fontSize: 11, lineHeight: 1.6, color: '#333',
                          }}>
                            Según la <span style={{ color: BRAND, fontWeight: 600 }}>Guía de Onboarding</span>, el proceso consta de 3 fases: documentación inicial (día 1), formación con el equipo (semana 1) y evaluación de adaptación (mes 1)...
                          </div>
                          <div className="mock-source" style={{
                            marginTop: 6, display: 'flex', gap: 6,
                          }}>
                            <span style={{
                              fontSize: 9, padding: '3px 8px', borderRadius: 4,
                              background: BRAND_LIGHT, color: BRAND, fontWeight: 500,
                            }}>
                              📄 Guia_Onboarding.pdf
                            </span>
                            <span style={{
                              fontSize: 9, padding: '3px 8px', borderRadius: 4,
                              background: '#f5f5f4', color: '#888', fontWeight: 500,
                            }}>
                              📄 Protocolo_RRHH.docx
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Input */}
                      <div style={{
                        marginTop: 8, padding: '7px 10px', borderRadius: 8,
                        background: '#f5f5f4', border: '1px solid rgba(0,0,0,0.06)',
                        fontSize: 10, color: '#aaa',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        Escribe tu pregunta...
                        <div style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: BRAND, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LOGOS / TRUST (simple) ============ */}
      <section style={{ paddingBottom: 60 }}>
        <div className="landing-section" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#bbb', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 500 }}>
            Construido con tecnología de
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 14, flexWrap: 'wrap', opacity: 0.4 }}>
            {['Anthropic Claude', 'Supabase', 'Pinecone', 'Vercel', 'Stripe'].map(name => (
              <span key={name} style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', letterSpacing: -0.2 }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROBLEMA ============ */}
      <section style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="landing-section">
          <p className="section-label">El problema</p>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)', textAlign: 'center',
            lineHeight: 1.2, letterSpacing: -0.5,
            marginBottom: 48, maxWidth: 700, margin: '0 auto 48px',
          }}>
            Tu equipo pierde tiempo buscando información que ya existe
          </h2>
          <div className="features-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          }}>
            {[
              {
                color: '#fef2f2', iconColor: '#dc2626',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
                title: 'Información perdida',
                text: 'Documentos repartidos en carpetas, drives y emails. Nadie sabe dónde está la versión correcta.',
              },
              {
                color: '#fefce8', iconColor: '#ca8a04',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
                title: 'Documentos que se contradicen',
                text: 'Un manual dice una cosa, un protocolo dice otra. Y nadie lo detecta hasta que genera un problema.',
              },
              {
                color: '#fdf2f8', iconColor: '#db2777',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                title: 'Horas perdidas cada semana',
                text: 'Buscar, releer, preguntar a compañeros. Tu equipo dedica horas a encontrar lo que debería estar accesible.',
              },
            ].map((item, i) => (
              <div key={i} className="feature-card">
                <div className="problem-icon" style={{ background: item.color }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#666' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOLUCIÓN ============ */}
      <section style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="landing-section">
          <p className="section-label">La solución</p>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)', textAlign: 'center',
            lineHeight: 1.2, letterSpacing: -0.5,
            marginBottom: 48, maxWidth: 700, margin: '0 auto 48px',
          }}>
            Tres funciones, un solo lugar
          </h2>
          <div className="features-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          }}>
            {[
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="9" y1="10" x2="15" y2="10" /></svg>,
                title: 'Pregunta a tus documentos',
                text: 'Haz preguntas en lenguaje natural y obtén respuestas precisas basadas solo en tu documentación. Con citas a las fuentes reales.',
                detail: 'Chat RAG privado',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
                title: 'Detecta problemas al subir',
                text: 'Cada documento nuevo se analiza contra los existentes. Duplicados, contradicciones, solapamientos — detectados antes de publicar.',
                detail: 'Análisis automático',
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
                title: 'Mejora con ayuda de la IA',
                text: 'Corrige los problemas detectados en un editor integrado con sugerencias automáticas. Mejora estilo, ortografía y coherencia.',
                detail: 'Mejora guiada',
              },
            ].map((item, i) => (
              <div key={i} className="feature-card" style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: BRAND, textTransform: 'uppercase', letterSpacing: 1 }}>{item.detail}</span>
                <div style={{ margin: '18px 0', display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: BRAND_LIGHT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.icon}
                  </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{item.title}</h3>
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
            borderRadius: 24,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute', top: -100, right: -100,
              width: 300, height: 300, borderRadius: '50%',
              background: `radial-gradient(circle, ${BRAND}33 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            
            <div className="diff-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', position: 'relative' }}>
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 20,
                  background: `${BRAND}33`, color: '#93c5fd',
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                  marginBottom: 22, textTransform: 'uppercase',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Lo que nos diferencia
                </span>
                <h2 style={{
                  fontSize: 'clamp(24px, 3.5vw, 36px)',
                  lineHeight: 1.2, letterSpacing: -0.5,
                  marginBottom: 16, color: '#fff',
                }}>
                  No solo buscamos.<br />Analizamos la calidad.
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>
                  Otros productos te dejan buscar en tus documentos.
                  Nosotros además analizamos cada documento nuevo contra el corpus existente
                  y te dicen exactamente qué problemas tiene antes de que lo publiques.
                </p>
                <button className="btn-primary" onClick={handleCTA} style={{
                  background: '#fff', color: '#1a1a1a',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}>
                  Pruébalo gratis
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Competitors */}
                <div style={{
                  padding: '22px 24px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Glean, Guru, Notion AI</span>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      Búsqueda con IA
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </div>
                      No analizan calidad documental
                    </div>
                  </div>
                </div>
                
                {/* Documentation Hub */}
                <div style={{
                  padding: '22px 24px', borderRadius: 14,
                  background: `${BRAND}22`,
                  border: `1px solid ${BRAND}44`,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Documentation Hub</span>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      Búsqueda con IA
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      Análisis de calidad al subir
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      Mejora guiada con IA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section id="como-funciona" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="landing-section">
          <p className="section-label">Cómo funciona</p>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)', textAlign: 'center',
            lineHeight: 1.2, letterSpacing: -0.5,
            marginBottom: 48, maxWidth: 600, margin: '0 auto 48px',
          }}>
            Empieza en tres pasos
          </h2>
          <div className="steps-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
          }}>
            {[
              { num: '1', title: 'Sube tus documentos', text: 'Arrastra PDFs, Word o conecta Google Drive. La indexación es automática.' },
              { num: '2', title: 'Revisa el análisis', text: 'El sistema detecta problemas contra tu corpus existente. Corrígelos antes de publicar.' },
              { num: '3', title: 'Pregunta lo que necesites', text: 'Haz preguntas al chat y obtén respuestas con citas. Tu equipo deja de buscar.' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', alignItems: 'center' }}>
                <div className="step-number">{step.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>{step.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#666', maxWidth: 280 }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PLANES ============ */}
      <section style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="landing-section">
          <p className="section-label">Precios</p>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)', textAlign: 'center',
            lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 12,
          }}>
            Planes claros, sin sorpresas
          </h2>
          <p style={{ fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 48 }}>
            Precios en euros, sin IVA. Cancela cuando quieras.
          </p>
          <div className="plans-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14, maxWidth: 960, margin: '0 auto',
          }}>
            {PLANS.map((plan, i) => (
              <div key={i} className={`plan-card ${plan.popular ? 'plan-popular' : ''}`}>
                {plan.popular && (
                  <span style={{
                    position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 16px', borderRadius: 12,
                    background: BRAND, color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                    boxShadow: `0 2px 8px ${BRAND}44`,
                  }}>
                    Más popular
                  </span>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>{plan.desc}</p>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5 }}>{plan.price}€</span>
                  {plan.price !== '0' && <span style={{ fontSize: 13, color: '#999' }}>/mes</span>}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 20, flex: 1 }}>
                  <p style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {plan.credits} créditos/mes
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Hasta {plan.users} usuario{plan.users !== '1' ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handlePlanCTA}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                    background: plan.popular ? BRAND : '#f0f0ee',
                    color: plan.popular ? '#fff' : '#1a1a1a',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: plan.popular ? `0 2px 8px ${BRAND}33` : 'none',
                  }}
                  onMouseEnter={e => { if (!plan.popular) { e.currentTarget.style.background = BRAND_LIGHT; e.currentTarget.style.color = BRAND; } }}
                  onMouseLeave={e => { if (!plan.popular) { e.currentTarget.style.background = '#f0f0ee'; e.currentTarget.style.color = '#1a1a1a'; } }}
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
              width: 52, height: 52, borderRadius: 14,
              background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
          <h2 style={{
            fontSize: 'clamp(22px, 3vw, 32px)',
            lineHeight: 1.3, letterSpacing: -0.3, marginBottom: 16,
          }}>
            Tus documentos son tuyos. Siempre.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#666', marginBottom: 28 }}>
            Cifrado AES-256, aislamiento por organización, y nunca usamos tus documentos para entrenar modelos de IA. Cada workspace es privado y seguro.
          </p>
          <div className="security-badges" style={{
            display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[
              { icon: '🔒', text: 'Cifrado AES-256' },
              { icon: '🏢', text: 'Aislamiento por workspace' },
              { icon: '🇪🇺', text: 'RGPD compliant' },
              { icon: '🚫', text: 'Sin entrenamiento con tus datos' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 10,
                background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
                fontSize: 13, color: '#555', fontWeight: 500,
              }}>
                <span>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="landing-section" style={{ maxWidth: 640 }}>
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 36px)', textAlign: 'center',
            lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 40,
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
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}
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
          <div style={{
            padding: 'clamp(40px, 5vw, 64px)',
            borderRadius: 24,
            background: `linear-gradient(135deg, ${BRAND_LIGHT} 0%, #eff6ff 100%)`,
            border: `1px solid ${BRAND}15`,
          }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4.5vw, 44px)',
              lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16,
            }}>
              Pon tu documentación<br />
              <span style={{ color: BRAND }}>a trabajar para ti</span>
            </h2>
            <p style={{ fontSize: 16, color: '#555', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Empieza gratis con 100 consultas. Sin tarjeta. Sin compromiso.
            </p>
            <button className="btn-primary" onClick={handleCTA} style={{ fontSize: 16, padding: '15px 36px' }}>
              Empezar ahora
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
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
  );
}
