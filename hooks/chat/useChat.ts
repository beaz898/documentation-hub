'use client';

import { useState, useRef, useEffect } from 'react';
import type { SessionInfo, Message, Document } from './types';

export function useChat(session: SessionInfo | null, documents: Document[], onCreditsChange: () => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || sending || !session) return;
    if (documents.length === 0) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'error', content: 'Sube o sincroniza documentos primero.' }]);
      return;
    }
    setInput(''); setSending(true);
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: question };
    const loadingMsg: Message = { id: crypto.randomUUID(), role: 'loading', content: '' };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    try {
      const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat({ id: crypto.randomUUID(), role: 'error', content: data.error || `Error ${res.status}` }));
        onCreditsChange();
        return;
      }
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat({ id: crypto.randomUUID(), role: 'assistant', content: data.answer, sources: data.sources }));
      onCreditsChange();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id).concat({ id: crypto.randomUUID(), role: 'error', content: 'Error de conexión.' }));
    } finally { setSending(false); setTimeout(() => inputRef.current?.focus(), 50); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const t = e.target; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px';
  }

  function addMessage(msg: Message) {
    setMessages(prev => [...prev, msg]);
  }

  function clearMessages() {
    setMessages([]);
  }

  return {
    messages, setMessages, input, sending,
    messagesEndRef, inputRef,
    handleSend, handleKeyDown, handleInputChange,
    addMessage, clearMessages,
  };
}
