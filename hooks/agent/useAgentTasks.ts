'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentTask, ConfirmationMode } from '@/lib/agent/types';

const TERMINAL_STATUSES = new Set<AgentTask['status']>(['completed', 'failed', 'cancelled']);
const POLLING_STATUSES = new Set<AgentTask['status']>(['pending', 'running']);
const POLL_INTERVAL_MS = 2000;

export interface UseAgentTasksResult {
  tasks: AgentTask[];
  activeTask: AgentTask | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  loadTasks: () => Promise<void>;
  createTask: (goal: string, mode: ConfirmationMode) => Promise<string | null>;
  cancelTask: (taskId: string) => Promise<void>;
  confirm: (
    taskId: string,
    response: string,
    options?: { modification?: string; userInput?: string },
  ) => Promise<void>;
  clearError: () => void;
}

export function useAgentTasks(): UseAgentTasksResult {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Stop polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  // Updates activeTask + syncs into the task list (inserting if not yet present)
  const applyTaskUpdate = useCallback((updated: AgentTask) => {
    setActiveTask(updated);
    setTasks(prev => {
      const exists = prev.some(t => t.id === updated.id);
      return exists
        ? prev.map(t => t.id === updated.id ? updated : t)
        : [updated, ...prev];
    });
  }, []);

  const pollOnce = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/agent/tasks/${taskId}`, { credentials: 'include' });
      if (!res.ok) { stopPolling(); return; }
      const data: { task: AgentTask } = await res.json();
      applyTaskUpdate(data.task);
      // Pause polling when waiting for user or task is terminal
      if (!POLLING_STATUSES.has(data.task.status)) {
        stopPolling();
      }
    } catch {
      stopPolling();
    }
  }, [stopPolling, applyTaskUpdate]);

  const startPolling = useCallback((taskId: string) => {
    stopPolling();
    intervalRef.current = setInterval(() => pollOnce(taskId), POLL_INTERVAL_MS);
  }, [stopPolling, pollOnce]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/tasks', { credentials: 'include' });
      if (!res.ok) { setError('Error cargando tareas.'); return; }
      const data: { tasks: AgentTask[] } = await res.json();
      setTasks(data.tasks);
      // Resume polling if there is an in-progress task
      const active = data.tasks.find(t => !TERMINAL_STATUSES.has(t.status)) ?? null;
      setActiveTask(active);
      if (active && POLLING_STATUSES.has(active.status)) {
        startPolling(active.id);
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, [startPolling]);

  const createTask = useCallback(async (
    goal: string,
    mode: ConfirmationMode,
  ): Promise<string | null> => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ goal, confirmation_mode: mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error creando la tarea.');
        return null;
      }
      const taskId: string = data.taskId;
      startPolling(taskId);
      return taskId;
    } catch {
      setError('Error de conexión.');
      return null;
    } finally {
      setCreating(false);
    }
  }, [startPolling]);

  const cancelTask = useCallback(async (taskId: string) => {
    setError(null);
    try {
      const res = await fetch('/api/agent/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error cancelando la tarea.'); return; }
      stopPolling();
      applyTaskUpdate(data.task as AgentTask);
    } catch {
      setError('Error de conexión.');
    }
  }, [stopPolling, applyTaskUpdate]);

  const confirm = useCallback(async (
    taskId: string,
    response: string,
    options?: { modification?: string; userInput?: string },
  ) => {
    setError(null);
    try {
      const res = await fetch('/api/agent/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          taskId,
          response,
          modification: options?.modification,
          user_input: options?.userInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error enviando respuesta.'); return; }
      const updated = data.task as AgentTask;
      applyTaskUpdate(updated);
      // Task goes back to 'pending' for all non-cancelling responses — resume polling
      if (POLLING_STATUSES.has(updated.status)) {
        startPolling(taskId);
      }
    } catch {
      setError('Error de conexión.');
    }
  }, [applyTaskUpdate, startPolling]);

  const clearError = useCallback(() => setError(null), []);

  return {
    tasks, activeTask, loading, creating, error,
    loadTasks, createTask, cancelTask, confirm, clearError,
  };
}
