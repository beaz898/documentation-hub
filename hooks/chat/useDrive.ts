'use client';

import { useState, useCallback } from 'react';
import type { SessionInfo, DriveStatus, Message } from './types';

export function useDrive(
  session: SessionInfo | null,
  addMessage: (msg: Message) => void,
  loadDocuments: () => Promise<void>,
) {
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({ connected: false });
  const [syncing, setSyncing] = useState(false);

  const loadDriveStatus = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/drive/sync', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDriveStatus(data);
      }
    } catch (err) { console.error('Error loading drive status:', err); }
  }, [session]);

  const PROVIDER_NAMES: Record<string, string> = {
    google_drive: 'Google Drive',
    onedrive: 'OneDrive',
  };

  function handleConnectDrive(provider: string) {
    if (!session) return;
    window.location.href = `/api/drive?token=${session.access_token}&provider=${provider}`;
  }

  async function handleSyncDrive() {
    if (!session || syncing) return;
    const providerLabel = PROVIDER_NAMES[driveStatus.provider ?? ''] ?? 'Drive';
    setSyncing(true);
    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `Sincronizando con ${providerLabel}...` });

    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        const stats = data.stats;
        const parts = [
          `**${stats.new}** nuevo${stats.new !== 1 ? 's' : ''}`,
          `**${stats.updated}** actualizado${stats.updated !== 1 ? 's' : ''}`,
          `**${stats.deleted ?? 0}** eliminado${(stats.deleted ?? 0) !== 1 ? 's' : ''}`,
          `**${stats.skipped}** sin cambios`,
        ];
        addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `Sincronización completada: ${parts.join(', ')}.` });
        await loadDocuments();
        await loadDriveStatus();
      } else {
        const data = await res.json();
        addMessage({ id: crypto.randomUUID(), role: 'error', content: data.error || 'Error sincronizando' });
      }
    } catch {
      addMessage({ id: crypto.randomUUID(), role: 'error', content: 'Error de conexión al sincronizar' });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnectDrive() {
    const providerLabel = PROVIDER_NAMES[driveStatus.provider ?? ''] ?? 'Drive';
    if (!session || !window.confirm(`¿Desconectar ${providerLabel}? Se eliminarán todos los documentos sincronizados.`)) return;

    try {
      await fetch('/api/drive/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      setDriveStatus({ connected: false });
      addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `${providerLabel} desconectado.` });
      await loadDocuments();
    } catch {
      addMessage({ id: crypto.randomUUID(), role: 'error', content: 'Error desconectando Drive' });
    }
  }

  return {
    driveStatus, syncing,
    loadDriveStatus,
    handleConnectDrive, handleSyncDrive, handleDisconnectDrive,
  };
}
