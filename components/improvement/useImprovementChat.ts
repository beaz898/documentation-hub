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

export function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function findTolerant(text: string, find: string): { start: number; end: number } | null {
  if (!find) return null;
  const exact = text.indexOf(find);
  if (exact !== -1) return { start: exact, end: exact + find.length };
  const normFind = normalizeWhitespace(find);
  if (!normFind) return null;
  const mapping: number[] = [];
  let normText = '', lastSpace = false, started = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], isSp = /\s/.test(ch);
    if (isSp) {
      if (!started) continue;
      if (!lastSpace) { normText += ' '; mapping.push(i); lastSpace = true; }
    } else { normText += ch; mapping.push(i); lastSpace = false; started = true; }
  }
  while (normText.endsWith(' ')) { normText = normText.slice(0, -1); mapping.pop(); }
  const idx = normText.indexOf(normFind);
  if (idx !== -1) {
    const start = mapping[idx];
    const end = (mapping[idx + normFind.length - 1] ?? start) + 1;
    return { start, end };
  }
  if (normFind.length >= 30) {
    const head = normFind.slice(0, 15), tail = normFind.slice(-15);
    const h = normText.indexOf(head);
    if (h !== -1) {
      const t = normText.indexOf(tail, h + head.length);
      if (t !== -1) {
        const start = mapping[h];
        const end = (mapping[t + tail.length - 1] ?? start) + 1;
        if (end - start < find.length * 2.5) return { start, end };
      }
    }
  }
  return null;
}

export function applyReplacement(text: string, find: string, replace: string): string | null {
  const range = findTolerant(text, find);
  if (!range) return null;
  return text.slice(0, range.start) + replace + text.slice(range.end);
}

export function useImprovementChat(accessToken: string) {
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
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
  }, [accessToken]);

  return { messages, sending, sendMessage, addAssistantMessage, updateMessage, setMessages };
}
