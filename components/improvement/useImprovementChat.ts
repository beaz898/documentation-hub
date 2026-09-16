'use client';
import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  replacements?: Array<{ find: string; replace: string; applied?: boolean; failed?: boolean }>;
}

interface LoadedDocInfo {
  name: string;
  source: string;
  loaded: boolean;
}

import {
  normalizeTypography,
  normalizeWhitespace,
  findTolerant,
} from '@/lib/texto/localizar-cita';

// ⚠️ SE REEXPORTAN PARA NO TOCAR A SUS CONSUMIDORES, y son los MISMOS objetos:
// no hay dos definiciones, hay una en `lib/` y una puerta aquí. El día que esta
// puerta sobre, se quita y ya.
export { normalizeTypography, normalizeWhitespace, findTolerant };

export function applyReplacement(text: string, find: string, replace: string): string | null {
  const range = findTolerant(text, find);
  if (!range) return null;
  return text.slice(0, range.start) + replace + text.slice(range.end);
}

export function useImprovementChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const addAssistantMessage = useCallback((text: string) => {
    setMessages(m => [...m, { id: `a-${Date.now()}-${Math.random()}`, role: 'assistant', content: text }]);
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages(m => m.map(msg => msg.id === id ? { ...msg, ...patch } : msg));
  }, []);

  const sendMessage = useCallback(async (
    userText: string,
    currentEditorText: string,
    fileName: string = '',
    problemsSummary: string = ''
  ) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: userText };

    // Capturamos el historial ANTES de añadir el mensaje del usuario actual,
    // porque ese mensaje ya va aparte como `userMessage` en el body.
    let historyToSend: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    setMessages(m => {
      historyToSend = m.map(msg => ({ role: msg.role, content: msg.content }));
      return [...m, userMsg];
    });

    setSending(true);
    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userMessage: userText,
          currentText: currentEditorText,
          fileName,
          problemsSummary,
          history: historyToSend,
        }),
      });
      const data = await res.json();
      const { reply, replacements, loadedDoc } = data as {
        reply: string;
        replacements?: Array<{ find: string; replace: string }>;
        loadedDoc?: LoadedDocInfo | null;
      };
      const content = loadedDoc && loadedDoc.loaded
        ? `${reply}\n\n_Documento cargado: ${loadedDoc.name}_`
        : reply;
      setMessages(m => [...m, {
        id: `a-${Date.now()}`, role: 'assistant', content,
        replacements: replacements?.map(r => ({ ...r, applied: false, failed: false })),
      }]);
    } catch {
      setMessages(m => [...m, { id: `a-${Date.now()}`, role: 'assistant', content: 'Error al enviar el mensaje.' }]);
    } finally {
      setSending(false);
    }
  }, []);

  return { messages, sending, sendMessage, addAssistantMessage, updateMessage, setMessages };
}
