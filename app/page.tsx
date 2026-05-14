'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import DoclityLogo from '@/components/DoclityLogo';

const BRAND = '#2563eb';
const BRAND_LIGHT = '#dbeafe';
const BRAND_DARK = '#1d4ed8';

const PLANS: Array<{ name: string; price: string; credits: string; users: number | null; desc: string; cta: string; popular?: boolean }> = [
  { name: 'Free', price: '0', credits: '50', users: 1, desc: 'Para probar', cta: 'Empezar gratis' },
  { name: 'Starter', price: '59', credits: '400', users: 3, desc: 'Profesional independiente', cta: 'Empezar' },
  { name: 'Pro', price: '149', credits: '1.500', users: 5, desc: 'PYME pequeña', cta: 'Empezar', popular: true },
  { name: 'Business', price: '349', credits: '4.000', users: 15, desc: 'PYME mediana', cta: 'Empezar' },
  { name: 'Business+', price: '599', credits: '10.000', users: null, desc: 'PYME grande', cta: 'Contactar' },
];

const FAQS = [
  { q: '¿Mis documentos están seguros?', a: 'Sí. Cada organización tiene su espacio aislado. Usamos cifrado AES-256, Row Level Security en la base de datos, y validación JWT en cada petición. Tus documentos nunca se comparten con otras empresas ni se usan para entrenar modelos de IA.' },
  { q: '¿Qué formatos de documento aceptáis?', a: 'PDF, Word (.docx), texto plano (.txt), Markdown (.md), CSV, JSON y HTML. También puedes importar directamente desde Google Drive.' },
  { q: '¿Qué pasa si la IA se equivoca?', a: 'Doclity siempre muestra las fuentes de sus respuestas para que puedas verificarlas. El análisis de documentos indica el nivel de confianza de cada hallazgo. Nunca prometemos detección al 100% — somos una herramienta de apoyo, no un sustituto del criterio humano.' },
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, sin permanencia. Al cancelar mantienes el acceso hasta el final del período facturado, más 90 días de gracia para exportar tus datos.' },
  { q: '¿Necesito conocimientos técnicos?', a: 'No. Subes tus documentos y empiezas a preguntar. No hay configuración técnica, no hay APIs que conectar, no hay que instalar nada.' },
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

  function handleCTA() { router.push(isLoggedIn ? '/chat' : '/login'); }
  function handlePlanCTA() { router.push(isLoggedIn ? '/settings/billing' : '/login'); }
  
  // Trigger animations when elements scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing" style={{ background: '#fafaf9', color: '#1a1a1a', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        .landing *{box-sizing:border-box;margin:0;padding:0}
        .landing{font-family:'DM Sans',-apple-system,sans-serif}
        .landing h1,.landing h2{font-family:'Playfair Display',Georgia,serif}
        .landing-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 24px;background:rgba(250,250,249,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.04)}
        .landing-section{max-width:1080px;margin:0 auto;padding:0 24px}

        .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border-radius:10px;border:none;background:${BRAND};color:#fff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;box-shadow:0 1px 3px rgba(37,99,235,.3)}
        .btn-primary:hover{background:${BRAND_DARK};transform:translateY(-2px);box-shadow:0 6px 24px rgba(37,99,235,.25)}
        .btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;border-radius:10px;border:1.5px solid rgba(0,0,0,.12);background:#fff;color:#1a1a1a;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all .2s}
        .btn-secondary:hover{border-color:${BRAND};color:${BRAND};background:${BRAND_LIGHT}}
        .btn-nav{padding:9px 20px;border-radius:8px;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#1a1a1a;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s}
        .btn-nav:hover{border-color:${BRAND};color:${BRAND}}
        .btn-nav-primary{padding:9px 20px;border-radius:8px;border:1.5px solid ${BRAND};background:${BRAND};color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
        .btn-nav-primary:hover{background:${BRAND_DARK};border-color:${BRAND_DARK}}

        .feature-card{padding:36px 32px;border-radius:16px;background:#fff;border:1px solid rgba(0,0,0,.06);transition:all .25s;position:relative;overflow:hidden}
        .feature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:${BRAND};transform:scaleX(0);transform-origin:left;transition:transform .3s}
        .feature-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.06)}
        .feature-card:hover::before{transform:scaleX(1)}

        .plan-card{padding:32px 28px;border-radius:16px;background:#fff;border:1px solid rgba(0,0,0,.06);display:flex;flex-direction:column;transition:all .2s}
        .plan-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.06)}
        .plan-popular{border:2px solid ${BRAND};position:relative;box-shadow:0 8px 32px rgba(37,99,235,.1)}

        .faq-item{border-bottom:1px solid rgba(0,0,0,.06);cursor:pointer}
        .faq-q{padding:20px 0;display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:500}
        .faq-q:hover{color:${BRAND}}
        .faq-a{padding-bottom:20px;font-size:14px;line-height:1.7;color:#666}

        .section-label{font-size:13px;font-weight:600;color:${BRAND};text-transform:uppercase;letter-spacing:2px;text-align:center;margin-bottom:16px;font-family:'DM Sans',sans-serif}
        .step-number{width:44px;height:44px;border-radius:50%;background:${BRAND};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;flex-shrink:0;box-shadow:0 4px 12px rgba(37,99,235,.25)}
        .problem-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:18px}

        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes heroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes progressFill{from{width:0}to{width:100%}}
        @keyframes blinkCaret{0%,100%{opacity:1}50%{opacity:0}}

        .mockup-container{animation:scaleIn .8s ease-out .3s both}
        .mockup-float{animation:heroFloat 6s ease-in-out infinite}

        .m1-msg-user{animation:fadeSlideUp .4s ease-out 1.2s both}
        .m1-typing{animation:fadeSlideUp .3s ease-out 1.6s both}
        .m1-msg-ai{animation:fadeSlideUp .4s ease-out 2s both}
        .m1-source{animation:slideInRight .3s ease-out 2.6s both}

        .m2-upload,.m2-progress,.m2-progress-bar,.m2-result,.m2-issue1,.m2-issue2,
        .m3-problem,.m3-suggestion,.m3-apply,.m3-resolved{opacity:0}
        
        .animate-on-scroll.in-view .m2-upload{animation:fadeSlideUp .4s ease-out .3s both}
        .animate-on-scroll.in-view .m2-progress{animation:fadeSlideUp .3s ease-out .7s both}
        .animate-on-scroll.in-view .m2-progress-bar{animation:progressFill 1.5s ease-out 1s both}
        .animate-on-scroll.in-view .m2-result{animation:fadeSlideUp .4s ease-out 2.5s both}
        .animate-on-scroll.in-view .m2-issue1{animation:slideInRight .3s ease-out 2.9s both}
        .animate-on-scroll.in-view .m2-issue2{animation:slideInRight .3s ease-out 3.2s both}
        
        .animate-on-scroll.in-view .m3-problem{animation:fadeSlideUp .3s ease-out .3s both}
        .animate-on-scroll.in-view .m3-suggestion{animation:fadeSlideUp .4s ease-out .9s both}
        .animate-on-scroll.in-view .m3-apply{animation:fadeSlideUp .3s ease-out 1.5s both}
        .animate-on-scroll.in-view .m3-resolved{animation:fadeSlideUp .3s ease-out 2.1s both}

        .s1-msg-user,.s1-msg-ai,.s1-source{opacity:0}
        .animate-on-scroll.in-view .s1-msg-user{animation:fadeSlideUp .4s ease-out .3s both}
        .animate-on-scroll.in-view .s1-msg-ai{animation:fadeSlideUp .4s ease-out 1s both}
        .animate-on-scroll.in-view .s1-source{animation:slideInRight .3s ease-out 1.6s both}

        .showcase-item{opacity:0;animation:fadeSlideUp .6s ease-out both}

        .mockup-sidebar-doc{opacity:0;animation:fadeSlideUp .3s ease-out both}
        .mockup-sidebar-doc:nth-child(1){animation-delay:.5s}
        .mockup-sidebar-doc:nth-child(2){animation-delay:.7s}
        .mockup-sidebar-doc:nth-child(3){animation-delay:.9s}
        .mockup-sidebar-doc:nth-child(4){animation-delay:1.1s}

        @media(max-width:768px){
          .features-grid{grid-template-columns:1fr!important}
          .plans-grid{grid-template-columns:1fr!important;max-width:340px!important;margin:0 auto!important}
          .hero-buttons{flex-direction:column!important}
          .hero-buttons button,.hero-buttons .btn-primary,.hero-buttons .btn-secondary{width:100%!important;justify-content:center}
          .steps-grid{grid-template-columns:1fr!important}
          .diff-grid{grid-template-columns:1fr!important}
          .hero-layout{flex-direction:column!important;text-align:center!important}
          .hero-text{align-items:center!important}
          .nav-inner{justify-content:center!important}
          .nav-cta{display:none!important}
          .mockup-wrapper{margin-top:32px!important}
          .security-badges{flex-direction:column!important;align-items:center!important}
          .showcase-row{flex-direction:column!important}
          .showcase-row-reverse{flex-direction:column!important}
          .showcase-text{text-align:center!important;align-items:center!important}
          .teams-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ============ NAV ============ */}
      <nav className="landing-nav">
        <div className="landing-section">
          <div className="nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <DoclityLogo size="sm" />
            <div className="nav-cta" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isLoggedIn ? (
                <button className="btn-nav-primary" onClick={() => router.push('/chat')}>Ir al chat</button>
              ) : (
                <>
                  <button className="btn-nav" onClick={() => router.push('/login')}>Iniciar sesión</button>
                  <button className="btn-nav-primary" onClick={() => router.push('/login')}>Empezar gratis</button>
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
            <div className="hero-text" style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ marginBottom: 20 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: BRAND_LIGHT, color: BRAND, fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Para PYMES hispanohablantes
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: 1.12, letterSpacing: -1, marginBottom: 18 }}>
                Tu documentación,<br /><span style={{ color: BRAND }}>siempre bajo control</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.65, color: '#555', marginBottom: 32, maxWidth: 440 }}>
                Un chat privado con IA que responde solo con tus documentos. Detecta contradicciones, duplicados y problemas antes de que lleguen a tu equipo.
              </p>
              <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={handleCTA}>
                  Empezar gratis
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
                <button className="btn-secondary" onClick={() => document.getElementById('producto')?.scrollIntoView({ behavior: 'smooth' })}>
                  Ver cómo funciona
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#999', marginTop: 14 }}>Sin tarjeta de crédito · 50 créditos gratis</p>
            </div>

            {/* Hero mockup — Chat */}
            <div className="mockup-wrapper" style={{ flex: 1, minWidth: 0 }}>
              <div className="mockup-container mockup-float">
                <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)', background: '#fff' }}>
                  <div style={{ padding: '10px 14px', background: '#f5f5f4', borderBottom: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} /><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a3e635' }} /><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} /></div>
                    <div style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#999', border: '1px solid rgba(0,0,0,.06)' }}>doclity.app/chat</div>
                  </div>
                  <div style={{ display: 'flex', height: 280 }}>
                    <div style={{ width: 160, borderRight: '1px solid rgba(0,0,0,.06)', padding: '12px 10px', background: '#fafaf9', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#999', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Documentos</div>
                      {['Politica_Vacaciones.pdf', 'Manual_RRHH.docx', 'Convenio_2026.pdf', 'FAQ_Empleados.pdf'].map((name, i) => (
                        <div key={i} className="mockup-sidebar-doc" style={{ padding: '7px 8px', borderRadius: 6, background: i === 0 ? BRAND_LIGHT : 'transparent', border: i === 0 ? `1px solid ${BRAND}22` : '1px solid transparent', fontSize: 10, color: i === 0 ? BRAND : '#666', fontWeight: i === 0 ? 600 : 400, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                          {name}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 16px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                        <div className="m1-msg-user" style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
                          <div style={{ padding: '8px 12px', borderRadius: '12px 12px 4px 12px', background: BRAND, color: '#fff', fontSize: 11, lineHeight: 1.5 }}>
                            ¿Cuántos días de vacaciones me corresponden este año?
                          </div>
                        </div>
                        <div className="m1-typing" style={{ display: 'flex', gap: 4, padding: '6px 0' }}>
                          {[0, 1, 2].map(i => (<div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#ccc', animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />))}
                        </div>
                        <div className="m1-msg-ai" style={{ maxWidth: '90%' }}>
                          <div style={{ padding: '10px 12px', borderRadius: '12px 12px 12px 4px', background: '#f5f5f4', fontSize: 11, lineHeight: 1.6, color: '#333' }}>
                            Según la <span style={{ color: BRAND, fontWeight: 600 }}>Política de Vacaciones</span>, te corresponden 23 días laborables. Si llevas más de 5 años en la empresa, se añaden 2 días adicionales según el <span style={{ color: BRAND, fontWeight: 600 }}>Convenio 2026</span>.
                          </div>
                          <div className="m1-source" style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                            <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: BRAND_LIGHT, color: BRAND, fontWeight: 500 }}>📄 Politica_Vacaciones.pdf</span>
                            <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: '#f5f5f4', color: '#888', fontWeight: 500 }}>📄 Convenio_2026.pdf</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: '#f5f5f4', border: '1px solid rgba(0,0,0,.06)', fontSize: 10, color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Escribe tu pregunta...
                        <div style={{ width: 22, height: 22, borderRadius: 5, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
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

      {/* ============ TRUST BAR ============ */}
      <section style={{ paddingBottom: 60 }}>
        <div className="landing-section" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#bbb', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 500 }}>Construido con tecnología de</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 14, flexWrap: 'wrap', opacity: 0.4 }}>
            {['Anthropic Claude', 'Supabase', 'Pinecone', 'Vercel', 'Stripe'].map(n => (<span key={n} style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', letterSpacing: -0.2 }}>{n}</span>))}
          </div>
        </div>
      </section>

      {/* ============ PROBLEMA ============ */}
      <section style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="landing-section">
          <p className="section-label">El problema</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', textAlign: 'center', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 48, maxWidth: 700, margin: '0 auto 48px' }}>
            Tu equipo pierde tiempo buscando información que ya existe
          </h2>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { color: '#fef2f2', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>, title: 'Información perdida', text: 'Documentos repartidos en carpetas, drives y emails. Nadie sabe dónde está la versión correcta.' },
              { color: '#fefce8', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, title: 'Documentos que se contradicen', text: 'Un manual dice una cosa, un protocolo dice otra. Y nadie lo detecta hasta que genera un problema.' },
              { color: '#fdf2f8', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, title: 'Horas perdidas cada semana', text: 'Buscar, releer, preguntar a compañeros. Tu equipo dedica horas a encontrar lo que debería estar accesible.' },
            ].map((item, i) => (
              <div key={i} className="feature-card">
                <div className="problem-icon" style={{ background: item.color }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>{item.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#666' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRODUCTO: 3 MOCKUPS ============ */}
      <section id="producto" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="landing-section">
          <p className="section-label">El producto</p>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', textAlign: 'center', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16, maxWidth: 700, margin: '0 auto 16px' }}>
            Tres herramientas, un solo lugar
          </h2>
          <p style={{ fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 64, maxWidth: 520, margin: '0 auto 64px' }}>
            Pregunta, analiza y mejora tu documentación sin salir de la plataforma.
          </p>

          {/* ---- MOCKUP 1: Chat RAG ---- */}
          <div className="showcase-row" style={{ display: 'flex', gap: 48, alignItems: 'center', marginBottom: 80 }}>
            <div className="showcase-text" style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: BRAND, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Chat RAG privado</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>Pregunta y obtén respuestas con fuentes</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666', marginBottom: 16 }}>
                Tu equipo deja de buscar en carpetas. Pregunta en lenguaje natural y la IA responde citando exactamente de dónde sale cada dato. Solo usa tu documentación — nunca inventa.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Respuestas con citas a documentos reales', 'Historial de conversación', 'Resultados en segundos'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{t}
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-on-scroll" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.1), 0 0 0 1px rgba(0,0,0,.06)', background: '#fff' }}>
                <div style={{ padding: '8px 12px', background: '#f5f5f4', borderBottom: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a3e635' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} /></div>
                  <div style={{ flex: 1, fontSize: 10, color: '#aaa', textAlign: 'center' }}>Chat — Doclity</div>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="s1-msg-user" style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
                    <div style={{ padding: '9px 14px', borderRadius: '14px 14px 4px 14px', background: BRAND, color: '#fff', fontSize: 12, lineHeight: 1.5 }}>
                      ¿Dónde encuentro el formulario de solicitud de anticipo?
                    </div>
                  </div>
                  <div className="s1-msg-ai" style={{ maxWidth: '85%' }}>
                    <div style={{ padding: '11px 14px', borderRadius: '14px 14px 14px 4px', background: '#f5f5f4', fontSize: 12, lineHeight: 1.65, color: '#333' }}>
                      El formulario de solicitud de anticipo está en el <span style={{ color: BRAND, fontWeight: 600 }}>Anexo 3 del Manual RRHH</span>. Debe entregarse firmado al departamento de nóminas con al menos 5 días de antelación.
                    </div>
                    <div className="s1-source" style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: BRAND_LIGHT, color: BRAND, fontWeight: 500 }}>📄 Manual_RRHH.docx — pág. 34</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- MOCKUP 2: Análisis (dark) ---- */}
          <div className="showcase-row showcase-row-reverse" style={{ display: 'flex', flexDirection: 'row-reverse', gap: 48, alignItems: 'center', marginBottom: 80 }}>
            <div className="showcase-text" style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Análisis automático</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>Detecta problemas antes de publicar</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666', marginBottom: 16 }}>
                Cada documento que subes se analiza contra tu corpus existente. Contradicciones, duplicados, información obsoleta — todo detectado automáticamente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Detección de contradicciones entre docs', 'Identificación de duplicados y solapamientos', 'Nivel de confianza por hallazgo'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{t}
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-on-scroll" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.2), 0 0 0 1px rgba(0,0,0,.15)', background: '#1e1e1e' }}>      
                <div style={{ padding: '8px 12px', background: '#2d2d2d', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a3e635' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} /></div>
                  <div style={{ flex: 1, fontSize: 10, color: '#666', textAlign: 'center' }}>Análisis — Protocolo_Seguridad_v2.pdf</div>
                </div>
                <div style={{ padding: 20 }}>
                  {/* Upload complete bar */}
                  <div className="m2-upload" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: '#2d2d2d' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                    <span style={{ fontSize: 11, color: '#ccc', flex: 1 }}>Protocolo_Seguridad_v2.pdf subido — Analizando...</span>
                  </div>
                  {/* Progress */}
                  <div className="m2-progress" style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: '#888' }}>Comparando contra 12 documentos</span>
                      <span style={{ fontSize: 10, color: '#f59e0b' }}>Completado</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#333', overflow: 'hidden' }}>
                      <div className="m2-progress-bar" style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                    </div>
                  </div>
                  {/* Result badge */}
                  <div className="m2-result" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 6, background: '#f59e0b22', color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>⚠ REVISAR</span>
                    <span style={{ fontSize: 11, color: '#999' }}>2 problemas encontrados</span>
                  </div>
                  {/* Issues */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="m2-issue1" style={{ padding: '10px 14px', borderRadius: 10, background: '#2d2d2d', border: '1px solid #ef444433' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#ef444422', color: '#ef4444', fontWeight: 600 }}>CONTRADICCIÓN</span>
                        <span style={{ fontSize: 9, color: '#ef4444' }}>Alta confianza</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#ccc', lineHeight: 1.5 }}>
                        El plazo de revisión dice &quot;30 días&quot; pero en <span style={{ color: '#60a5fa' }}>Manual_Calidad.pdf</span> dice &quot;15 días&quot;.
                      </p>
                    </div>
                    <div className="m2-issue2" style={{ padding: '10px 14px', borderRadius: 10, background: '#2d2d2d', border: '1px solid #f59e0b33' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#f59e0b22', color: '#f59e0b', fontWeight: 600 }}>SOLAPAMIENTO</span>
                        <span style={{ fontSize: 9, color: '#f59e0b' }}>Media confianza</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#ccc', lineHeight: 1.5 }}>
                        La sección 4.2 repite información ya presente en <span style={{ color: '#60a5fa' }}>Protocolo_Seguridad_v1.pdf</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- MOCKUP 3: Mejora con IA ---- */}
          <div className="showcase-row" style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
            <div className="showcase-text" style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Mejora guiada</span>
              <h3 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>Corrige los problemas con ayuda de la IA</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666', marginBottom: 16 }}>
                No te dejamos solo con una lista de errores. El editor integrado te muestra cada problema, propone la corrección y la aplica con un clic.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Editor con sugerencias automáticas', 'Aplica correcciones con un clic', 'Análisis de estilo y ortografía'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{t}
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-on-scroll" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.1), 0 0 0 1px rgba(0,0,0,.06)', background: '#fff' }}>
                <div style={{ padding: '8px 12px', background: '#f5f5f4', borderBottom: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a3e635' }} /><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} /></div>
                  <div style={{ flex: 1, fontSize: 10, color: '#aaa', textAlign: 'center' }}>Mejora — Protocolo_Seguridad_v2.pdf</div>
                </div>
                <div style={{ display: 'flex', height: 260 }}>
                  {/* Editor side */}
                  <div style={{ flex: 1, padding: 16, borderRight: '1px solid rgba(0,0,0,.06)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#999', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Editor</div>
                    <div style={{ fontSize: 11, lineHeight: 1.8, color: '#444' }}>
                      <p>4.1. Las revisiones de seguridad se realizarán cada <span style={{ background: '#fef2f2', textDecoration: 'line-through', color: '#dc2626', padding: '1px 3px', borderRadius: 3 }}>30 días</span> <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 3px', borderRadius: 3, fontWeight: 600 }}>15 días</span> naturales.</p>
                      <p style={{ marginTop: 8 }}>4.2. El responsable de seguridad verificará el cumplimiento de los protocolos establecidos en...</p>
                    </div>
                  </div>
                  {/* Chat side */}
                  <div style={{ width: 200, padding: 12, background: '#fafaf9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>Asistente</div>
                    <div className="m3-problem" style={{ padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 10, lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 3 }}>Contradicción encontrada</div>
                      <div style={{ color: '#666' }}>El Manual de Calidad establece revisiones cada 15 días.</div>
                    </div>
                    <div className="m3-suggestion" style={{ padding: '8px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 10, lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 600, color: '#16a34a', marginBottom: 3 }}>Sugerencia</div>
                      <div style={{ color: '#666' }}>Cambiar &quot;30 días&quot; por &quot;15 días&quot; para alinear ambos documentos.</div>
                    </div>
                    <div className="m3-apply">
                      <div style={{ padding: '6px 10px', borderRadius: 6, background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
                        ✓ Aplicar corrección
                      </div>
                    </div>
                    <div className="m3-resolved" style={{ padding: '6px 10px', borderRadius: 6, background: '#dcfce7', border: '1px solid #bbf7d0', fontSize: 10, color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>
                      ✓ Problema resuelto
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ EQUIPOS ============ */}
      <section style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="landing-section">
          <div style={{ padding: 'clamp(36px,4vw,56px)', borderRadius: 20, background: 'linear-gradient(135deg, #f0f9ff 0%, #eff6ff 50%, #f5f3ff 100%)', border: '1px solid rgba(37,99,235,.08)' }}>
            <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: BRAND, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, display: 'block' }}>Para equipos</span>
                <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 14 }}>
                  Un workspace para todo tu equipo
                </h2>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666', marginBottom: 20 }}>
                  Sube documentos una vez y todo tu equipo puede consultarlos. El admin gestiona miembros, planes y consumo. Cada persona pregunta, la IA responde con la misma base documental compartida.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: '👥', text: 'Invita a tu equipo con un enlace' },
                    { icon: '📊', text: 'Panel de consumo por usuario y operación' },
                    { icon: '🔒', text: 'Roles admin/miembro con permisos diferenciados' },
                    { icon: '💳', text: 'Pool de créditos compartido por workspace' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#444' }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>{item.text}
                    </div>
                  ))}
                </div>
              </div>
              {/* Visual: team cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
                {[
                  { name: 'Ana García', role: 'Admin', queries: 142, color: BRAND },
                  { name: 'Carlos López', role: 'Miembro', queries: 87, color: '#10b981' },
                  { name: 'María Torres', role: 'Miembro', queries: 63, color: '#f59e0b' },
                ].map((member, i) => (
                  <div key={i} style={{ padding: '14px 18px', borderRadius: 12, background: '#fff', border: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,.03)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${member.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: member.color }}>
                      {member.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{member.role}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{member.queries}</div>
                      <div style={{ fontSize: 10, color: '#bbb' }}>consultas</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DIFERENCIADOR ============ */}
      <section style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="landing-section">
          <div style={{ padding: 'clamp(40px,5vw,64px)', borderRadius: 24, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${BRAND}33 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div className="diff-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', position: 'relative' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: `${BRAND}33`, color: '#93c5fd', fontSize: 11, fontWeight: 600, letterSpacing: 0.5, marginBottom: 22, textTransform: 'uppercase' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  Lo que nos diferencia
                </span>
                <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16, color: '#fff' }}>
                  No solo buscamos.<br />Analizamos la calidad.
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.6)', marginBottom: 28 }}>
                  Otros productos te dejan buscar en tus documentos. Nosotros además analizamos cada documento nuevo contra el corpus existente y te dicen exactamente qué problemas tiene.
                </p>
                <button className="btn-primary" onClick={handleCTA} style={{ background: '#fff', color: '#1a1a1a', boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
                  Pruébalo gratis
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '22px 24px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>Glean, Guru, Notion AI</span>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(74,222,128,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                      Búsqueda con IA
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.3)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(248,113,113,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></div>
                      No analizan calidad documental
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.3)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(248,113,113,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></div>
                      No corrigen errores por ti
                    </div>
                  </div>
                </div>
                <div style={{ padding: '22px 24px', borderRadius: 14, background: `${BRAND}22`, border: `1px solid ${BRAND}44` }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Doclity</span>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Búsqueda con IA', 'Análisis de calidad al subir', 'Mejora guiada con IA'].map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: i === 0 ? 'rgba(255,255,255,.7)' : '#4ade80', fontWeight: i === 0 ? 400 : 600 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(74,222,128,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>
                        {t}
                      </div>
                    ))}
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
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', textAlign: 'center', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
            Empieza en tres pasos
          </h2>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { num: '1', title: 'Sube tus documentos', text: 'Arrastra PDFs, Word o conecta Google Drive. La indexación es automática.' },
              { num: '2', title: 'Revisa el análisis', text: 'El sistema detecta problemas contra tu corpus existente. Corrígelos antes de publicar.' },
              { num: '3', title: 'Pregunta lo que necesites', text: 'Haz preguntas al chat y obtén respuestas con citas. Tu equipo deja de buscar.' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', alignItems: 'center' }}>
                <div className="step-number">{step.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>{step.title}</h3>
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
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', textAlign: 'center', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 12 }}>Planes claros, sin sorpresas</h2>
          <p style={{ fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 48 }}>Precios en euros, sin IVA. Cancela cuando quieras.</p>
          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, maxWidth: 960, margin: '0 auto' }}>
            {PLANS.map((plan, i) => (
              <div key={i} className={`plan-card ${plan.popular ? 'plan-popular' : ''}`}>
                {plan.popular && (<span style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 12, background: BRAND, color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, boxShadow: `0 2px 8px ${BRAND}44` }}>Más popular</span>)}
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>{plan.desc}</p>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5 }}>{plan.price}€</span>
                  {plan.price !== '0' && <span style={{ fontSize: 13, color: '#999' }}>/mes</span>}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 20, flex: 1 }}>
                  <p style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{plan.credits} créditos/mes</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>{plan.users !== null ? `Hasta ${plan.users} usuario${plan.users !== 1 ? 's' : ''}` : 'Usuarios ilimitados'}</p>
                </div>
                <button onClick={handlePlanCTA} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: plan.popular ? BRAND : '#f0f0ee', color: plan.popular ? '#fff' : '#1a1a1a', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', boxShadow: plan.popular ? `0 2px 8px ${BRAND}33` : 'none' }}
                  onMouseEnter={e => { if (!plan.popular) { e.currentTarget.style.background = BRAND_LIGHT; e.currentTarget.style.color = BRAND; } }}
                  onMouseLeave={e => { if (!plan.popular) { e.currentTarget.style.background = '#f0f0ee'; e.currentTarget.style.color = '#1a1a1a'; } }}
                >{plan.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEGURIDAD ============ */}
      <section style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="landing-section" style={{ maxWidth: 700, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
          </div>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', lineHeight: 1.3, letterSpacing: -0.3, marginBottom: 16 }}>Tus documentos son tuyos. Siempre.</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#666', marginBottom: 28 }}>Cifrado AES-256, aislamiento por organización, y nunca usamos tus documentos para entrenar modelos de IA. Cada workspace es privado y seguro.</p>
          <div className="security-badges" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[{ icon: '🔒', text: 'Cifrado AES-256' }, { icon: '🏢', text: 'Aislamiento por workspace' }, { icon: '🇪🇺', text: 'RGPD compliant' }, { icon: '🚫', text: 'Sin entrenamiento con tus datos' }].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: '#fff', border: '1px solid rgba(0,0,0,.06)', fontSize: 13, color: '#555', fontWeight: 500 }}>
                <span>{item.icon}</span>{item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="landing-section" style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', textAlign: 'center', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 40 }}>Preguntas frecuentes</h2>
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-q"><span>{faq.q}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform .25s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg></div>
                {openFaq === i && <div className="faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section style={{ paddingTop: 40, paddingBottom: 100 }}>
        <div className="landing-section" style={{ textAlign: 'center' }}>
          <div style={{ padding: 'clamp(40px,5vw,64px)', borderRadius: 24, background: `linear-gradient(135deg, ${BRAND_LIGHT} 0%, #eff6ff 100%)`, border: `1px solid ${BRAND}15` }}>
            <h2 style={{ fontSize: 'clamp(28px,4.5vw,44px)', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16 }}>
              Pon tu documentación<br /><span style={{ color: BRAND }}>a trabajar para ti</span>
            </h2>
            <p style={{ fontSize: 16, color: '#555', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>Empieza gratis con 50 créditos. Sin tarjeta. Sin compromiso.</p>
            <button className="btn-primary" onClick={handleCTA} style={{ fontSize: 16, padding: '15px 36px' }}>
              Empezar ahora
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,.06)', padding: '32px 24px' }}>
        <div className="landing-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#999' }}>© {new Date().getFullYear()} Doclity</span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <a href="/legal/privacidad" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>Política de privacidad</a>
            <a href="/legal/terminos" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>Términos de uso</a>
            <a href="/legal/aviso-legal" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>Aviso legal</a>
            <a href="/legal/cookies" style={{ fontSize: 13, color: '#999', textDecoration: 'none' }}>Política de cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
