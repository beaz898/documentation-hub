'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Texto final ya emitido en ESTA sesión de dictado. Sirve para emitir solo
  // la parte nueva y no duplicar cuando el navegador móvil reentrega un final.
  const emittedRef = useRef('');
  // true = el usuario pulsó parar (no relanzar). false = lo cortó el navegador.
  const manualStopRef = useRef(false);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition ?? window.webkitSpeechRecognition));
  }, []);

  // Crea, configura y arranca una instancia de reconocimiento.
  // restart=true cuando relanzamos tras un corte del navegador (no resetea lo emitido).
  const launch = useCallback((restart: boolean) => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    // Aborta cualquier instancia previa y quita sus listeners (anti doble-tap / relanzado).
    const prev = recognitionRef.current;
    if (prev) {
      prev.onresult = null;
      prev.onerror = null;
      prev.onend = null;
      try { prev.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    }

    if (!restart) emittedRef.current = '';

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[VOICE] resultIndex=', event.resultIndex,
        'len=', event.results.length,
        'items=', Array.from(event.results).map((r, i) => ({
          i,
          final: r.isFinal,
          text: r[0].transcript,
        })));
      // Reconstruye TODO el texto final visible en esta tanda de resultados.
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      // Emite SOLO lo nuevo respecto a lo ya emitido en esta sesión.
      // Si el navegador reentrega lo mismo, delta queda vacío → no duplica.
      if (finalText.length > emittedRef.current.length
          && finalText.startsWith(emittedRef.current)) {
        const delta = finalText.slice(emittedRef.current.length).trim();
        if (delta) onTranscriptRef.current(delta);
        emittedRef.current = finalText;
      } else if (finalText && finalText !== emittedRef.current
                 && !finalText.startsWith(emittedRef.current)) {
        // Caso raro: el navegador reescribió el final entero (no es una extensión).
        // Emitimos el final completo y reseteamos la referencia para esta tanda.
        const delta = finalText.trim();
        if (delta) onTranscriptRef.current(delta);
        emittedRef.current = finalText;
      }

      setInterim(interimText);
    };

    recognition.onerror = () => {
      setInterim('');
    };

    recognition.onend = () => {
      setInterim('');
      // Si el usuario no paró a propósito, relanzamos: escucha continua en móvil.
      if (!manualStopRef.current) {
        // Nueva tanda: el navegador empezará un results nuevo desde cero,
        // así que reseteamos lo emitido de la tanda anterior.
        emittedRef.current = '';
        launch(true);
      } else {
        setRecording(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setRecording(true);
    } catch {
      // start() puede lanzar si la instancia ya está activa; lo ignoramos.
    }
  }, []);

  const startRecording = useCallback(() => {
    manualStopRef.current = false;
    launch(false);
  }, [launch]);

  const stopRecording = useCallback(() => {
    manualStopRef.current = true;
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try { rec.stop(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
    setRecording(false);
    setInterim('');
  }, []);

  const handleToggle = useCallback(() => {
    if (recording) stopRecording(); else startRecording();
  }, [recording, startRecording, stopRecording]);

  // Cleanup al desmontar: aborta cualquier reconocimiento vivo.
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      const rec = recognitionRef.current;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try { rec.abort(); } catch { /* noop */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {interim && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          borderRadius: 6, padding: '4px 8px', zIndex: 20,
          fontSize: 11, color: 'var(--text-secondary)',
          whiteSpace: 'nowrap', maxWidth: 220,
          overflow: 'hidden', textOverflow: 'ellipsis',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {interim}
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={recording ? 'Detener grabación de voz' : 'Iniciar grabación de voz'}
        style={{
          width: 34, height: 34, borderRadius: 8, border: 'none',
          background: recording ? 'rgba(220,38,38,0.12)' : 'var(--bg-tertiary)',
          color: recording ? '#dc2626' : 'var(--text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, color 0.15s',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {recording ? (
          <span className="animate-pulse">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
            </svg>
          </span>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 10v2a7 7 0 0 0 14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </button>
    </div>
  );
}
