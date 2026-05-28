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

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition ?? window.webkitSpeechRecognition));
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
    setInterim('');
  }, []);

  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          onTranscriptRef.current(result[0].transcript);
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = () => { setRecording(false); setInterim(''); };
    recognition.onend  = () => { setRecording(false); setInterim(''); };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, []);

  const handleToggle = useCallback(() => {
    if (recording) stopRecording(); else startRecording();
  }, [recording, startRecording, stopRecording]);

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
