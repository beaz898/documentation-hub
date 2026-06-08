'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentConversation, AgentMessage, ConfirmationMode } from '@/lib/agent/types';

// ── Constantes ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS        = 2000;
const MAX_CONSECUTIVE_FAILURES = 5;  // fallos seguidos antes de mostrar error recuperable

// ── Tipos exportados ──────────────────────────────────────────────────────────

// Body exacto que acepta POST /api/agent/conversations/[id]/message según el status
export type SendMessageBody =
  | { content: string }
  | { response: 'approve' | 'reject' }
  | { response: 'modify'; modification: string }
  | { response: 'stop' | 'ask_more' | 'improvise' | 'expert_judgment' | 'mark_gap' | 'search_again' };

export interface UseConversationResult {
  // Estado
  conversations:  AgentConversation[];
  conversation:   AgentConversation | null;
  messages:       AgentMessage[];
  loading:        boolean;        // cargando lista de conversaciones
  loadingDetail:  boolean;        // cargando detalle de conversación activa
  sending:        boolean;        // enviando mensaje / respuesta
  creating:       boolean;        // creando conversación nueva
  error:          string | null;  // error de operación (crear, enviar, cancelar, etc.)
  pollingError:   boolean;        // MAX_CONSECUTIVE_FAILURES alcanzado; polling detenido

  // Acciones
  loadConversations:   () => Promise<void>;
  selectConversation:  (id: string) => Promise<void>;
  createConversation:  (mode: ConfirmationMode) => Promise<string | null>;
  sendMessage:         (convId: string, body: SendMessageBody) => Promise<boolean>;
  cancelConversation:  (convId: string) => Promise<void>;
  updateMode:          (convId: string, mode: ConfirmationMode) => Promise<void>;
  renameConversation:  (id: string, title: string) => Promise<boolean>;
  deleteConversation:  (id: string) => Promise<boolean>;
  retryPolling:        () => void;   // reintentar polling tras pollingError
  clearError:          () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useConversation(): UseConversationResult {
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [conversation,  setConversation]  = useState<AgentConversation | null>(null);
  const [messages,      setMessages]      = useState<AgentMessage[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending,       setSending]       = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [pollingError,  setPollingError]  = useState(false);

  // ID de la conversación activa. Ref (no estado) para que los closures de polling
  // siempre lean el valor actual sin necesidad de recrear callbacks.
  const activeConvIdRef  = useRef<string | null>(null);
  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const failureCountRef  = useRef(0);

  // ── Helpers de polling ──────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    failureCountRef.current = 0;
  }, []);

  // Limpieza garantizada al desmontar (sin fuga de intervalos)
  useEffect(() => () => stopPolling(), [stopPolling]);

  // Sincroniza una conversación actualizada al estado local (lista + detalle)
  const applyDetail = useCallback((conv: AgentConversation, msgs: AgentMessage[]) => {
    setConversation(conv);
    setMessages(msgs);
    setConversations(prev => {
      const exists = prev.some(c => c.id === conv.id);
      return exists
        ? prev.map(c => c.id === conv.id ? conv : c)
        : [conv, ...prev];
    });
  }, []);

  // Un tick de polling: GET /api/agent/conversations/[id]
  // Gestiona fallos con contador. Descarta respuestas en vuelo si el usuario
  // cambió de conversación mientras la petición estaba en tránsito.
  const pollOnce = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/agent/conversations/${convId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { conversation: AgentConversation; messages: AgentMessage[] };

      // Descartar si el usuario cambió de conversación durante la petición
      if (activeConvIdRef.current !== convId) return;

      failureCountRef.current = 0;
      setPollingError(false);
      applyDetail(data.conversation, data.messages);

      // El polling solo es necesario mientras el agente trabaja activamente
      if (data.conversation.status !== 'running') {
        stopPolling();
      }
    } catch {
      if (activeConvIdRef.current !== convId) return;

      failureCountRef.current++;
      if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) {
        stopPolling();
        setPollingError(true);
      }
      // Fallos por debajo del límite: silencioso — el siguiente tick lo reintentará
    }
  }, [applyDetail, stopPolling]);

  const startPolling = useCallback((convId: string) => {
    stopPolling();
    failureCountRef.current = 0;
    setPollingError(false);
    intervalRef.current = setInterval(() => pollOnce(convId), POLL_INTERVAL_MS);
  }, [stopPolling, pollOnce]);

  // ── Acciones públicas ───────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/conversations', { credentials: 'include' });
      if (!res.ok) { setError('Error cargando conversaciones.'); return; }
      const data = await res.json() as { conversations: AgentConversation[] };
      setConversations(data.conversations);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    stopPolling();
    activeConvIdRef.current = id;
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${id}`, { credentials: 'include' });
      if (!res.ok) { setError('Error cargando la conversación.'); return; }
      const data = await res.json() as { conversation: AgentConversation; messages: AgentMessage[] };
      applyDetail(data.conversation, data.messages);
      if (data.conversation.status === 'running') {
        startPolling(id);
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoadingDetail(false);
    }
  }, [stopPolling, applyDetail, startPolling]);

  const createConversation = useCallback(async (mode: ConfirmationMode): Promise<string | null> => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/conversations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmation_mode: mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error creando la conversación.');
        return null;
      }
      return data.conversationId as string;
    } catch {
      setError('Error de conexión.');
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    convId: string,
    body:   SendMessageBody,
  ): Promise<boolean> => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${convId}/message`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setError(`Créditos insuficientes (necesitas ${(data as { required?: number }).required ?? '?'}, tienes ${(data as { available?: number }).available ?? '0'}).`);
        } else {
          setError((data as { error?: string }).error || 'Error enviando el mensaje.');
        }
        return false;
      }
      // Actualización optimista: la conversación pasa a 'running' inmediatamente.
      // El polling real confirmará el estado y traerá los mensajes nuevos.
      setConversation(prev => prev ? { ...prev, status: 'running', pending_request: null } : prev);
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, status: 'running', pending_request: null } : c
      ));
      startPolling(convId);
      return true;
    } catch {
      setError('Error de conexión.');
      return false;
    } finally {
      setSending(false);
    }
  }, [startPolling]);

  const cancelConversation = useCallback(async (convId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${convId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setError((data as { error?: string }).error || 'Error cancelando.'); return; }
      stopPolling();
      // Una sola lectura post-cancel para reflejar el mensaje marcado como failed
      void pollOnce(convId);
    } catch {
      setError('Error de conexión.');
    }
  }, [stopPolling, pollOnce]);

  const updateMode = useCallback(async (convId: string, mode: ConfirmationMode) => {
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${convId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmation_mode: mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError((data as { error?: string }).error || 'Error actualizando el modo.'); return; }
      // Actualización optimista
      setConversation(prev => prev ? { ...prev, confirmation_mode: mode } : prev);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, confirmation_mode: mode } : c));
    } catch {
      setError('Error de conexión.');
    }
  }, []);

  const renameConversation = useCallback(async (id: string, title: string): Promise<boolean> => {
    setError(null);
    const new_title = title.trim().slice(0, 80) || null;
    // Captura el título anterior para rollback si falla
    const prev_title = conversations.find(c => c.id === id)?.title ?? null;
    // Actualización optimista
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: new_title } : c));
    setConversation(prev => prev?.id === id ? { ...prev, title: new_title } : prev);
    try {
      const res = await fetch(`/api/agent/conversations/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: new_title }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Rollback si falla
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: prev_title } : c));
        setConversation(prev => prev?.id === id ? { ...prev, title: prev_title } : prev);
        setError((data as { error?: string }).error || 'Error renombrando la conversación.');
        return false;
      }
      return true;
    } catch {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: prev_title } : c));
      setConversation(prev => prev?.id === id ? { ...prev, title: prev_title } : prev);
      setError('Error de conexión.');
      return false;
    }
  }, [conversations]);

  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`/api/agent/conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error || 'Error borrando la conversación.');
        return false;
      }
      setConversations(prev => prev.filter(c => c.id !== id));
      // Si era la conversación activa, limpiar detalle y parar polling
      if (activeConvIdRef.current === id) {
        stopPolling();
        activeConvIdRef.current = null;
        setConversation(null);
        setMessages([]);
      }
      return true;
    } catch {
      setError('Error de conexión.');
      return false;
    }
  }, [stopPolling]);

  const retryPolling = useCallback(() => {
    const convId = activeConvIdRef.current;
    if (!convId || !pollingError) return;
    setPollingError(false);
    failureCountRef.current = 0;
    startPolling(convId);
  }, [pollingError, startPolling]);

  const clearError = useCallback(() => setError(null), []);

  return {
    conversations, conversation, messages,
    loading, loadingDetail, sending, creating, error, pollingError,
    loadConversations, selectConversation, createConversation,
    sendMessage, cancelConversation, updateMode, renameConversation, deleteConversation,
    retryPolling, clearError,
  };
}
