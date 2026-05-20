'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SessionInfo } from './types';

interface UploadLockState {
  locked: boolean;
  lockedBy: string | null;
  isMe: boolean;
}

/** Intervalo de polling cuando otro usuario tiene el lock (ms). No se usa para polling continuo. */
const POLL_INTERVAL_WHEN_LOCKED_BY_OTHER = 30_000;

/** Intervalo entre recordatorios al usuario que tiene el bloqueo (ms). */
const REMINDER_INTERVAL = 10 * 60 * 1000; // 10 minutos

/** Tiempo máximo de bloqueo (ms). Debe coincidir con el backend. */
const MAX_LOCK_DURATION = 60 * 60 * 1000; // 60 minutos

export function useUploadLock(session: SessionInfo | null) {
  const [lockState, setLockState] = useState<UploadLockState>({
    locked: false,
    lockedBy: null,
    isMe: false,
  });
  const [showReminder, setShowReminder] = useState(false);
  const lockStartRef = useRef<number | null>(null);
  const reminderTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLockState = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/org/upload-lock', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLockState({
          locked: data.locked,
          lockedBy: data.lockedBy || null,
          isMe: data.isMe || false,
        });

        // Si expiró en el servidor, limpiar estado local
        if (data.expired) {
          clearReminderTimer();
          lockStartRef.current = null;
        }
      }
    } catch {
      // Error transitorio, no hacer nada
    }
  }, [session]);

  // Polling adaptativo: solo cuando otro usuario tiene el lock
  useEffect(() => {
    if (!session) return;

    fetchLockState();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLockState();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let interval: ReturnType<typeof setInterval> | null = null;
    if (lockState.locked && !lockState.isMe) {
      interval = setInterval(fetchLockState, POLL_INTERVAL_WHEN_LOCKED_BY_OTHER);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (interval) clearInterval(interval);
    };
  }, [session, fetchLockState, lockState.locked, lockState.isMe]);

  function clearReminderTimer() {
    if (reminderTimerRef.current) {
      clearInterval(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
  }

  function startReminderTimer() {
    clearReminderTimer();
    lockStartRef.current = Date.now();
    reminderTimerRef.current = setInterval(() => {
      if (!lockStartRef.current) return;
      const elapsed = Date.now() - lockStartRef.current;

      if (elapsed >= MAX_LOCK_DURATION) {
        // Expirado: desbloquear automáticamente (el servidor también lo hace)
        clearReminderTimer();
        lockStartRef.current = null;
        setShowReminder(false);
        return;
      }

      // Mostrar recordatorio cada REMINDER_INTERVAL
      setShowReminder(true);
    }, REMINDER_INTERVAL);
  }

  const toggleLock = useCallback(async () => {
    if (!session) return;
    const newLocked = !lockState.locked;

    try {
      const res = await fetch('/api/org/upload-lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ locked: newLocked }),
      });

      if (res.ok) {
        const data = await res.json();
        setLockState({
          locked: data.locked,
          lockedBy: data.locked ? session.user.email || null : null,
          isMe: data.isMe || false,
        });

        if (data.locked) {
          startReminderTimer();
        } else {
          clearReminderTimer();
          lockStartRef.current = null;
          setShowReminder(false);
        }
      } else if (res.status === 409) {
        // Bloqueado por otro: refrescar estado
        await fetchLockState();
      }
    } catch {
      // Error transitorio
    }
  }, [session, lockState.locked, fetchLockState]);

  const activateLock = useCallback(async () => {
    if (!session || lockState.locked) return;
    try {
      const res = await fetch('/api/org/upload-lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ locked: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setLockState({
          locked: data.locked,
          lockedBy: session.user.email || null,
          isMe: data.isMe || false,
        });
        if (data.locked) {
          startReminderTimer();
        }
      }
    } catch {
      // Error transitorio
    }
  }, [session, lockState.locked]);

  const dismissReminder = useCallback(() => {
    setShowReminder(false);
  }, []);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => clearReminderTimer();
  }, []);

  return {
    lockState,
    showReminder,
    toggleLock,
    activateLock,
    dismissReminder,
    refreshLock: fetchLockState,
  };
}
