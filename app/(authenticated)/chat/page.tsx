'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatMessage from '@/components/ChatMessage';
import DocumentsSidebar from '@/components/DocumentsSidebar';
import AnalysisModal from '@/components/AnalysisModal';
import ImprovementModal from '@/components/ImprovementModal';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import SubscriptionBanners from '@/components/chat/SubscriptionBanners';
import EmptyState from '@/components/chat/EmptyState';
import { useAuth } from '@/hooks/chat/useAuth';
import { useCredits } from '@/hooks/chat/useCredits';
import { useChat } from '@/hooks/chat/useChat';
import { useDocuments } from '@/hooks/chat/useDocuments';
import { useDrive } from '@/hooks/chat/useDrive';
import { useUploadLock } from '@/hooks/chat/useUploadLock';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [analysisMinimized, setAnalysisMinimized] = useState(false);
  const [improvementMinimized, setImprovementMinimized] = useState(false);
  const [improvementRunning, setImprovementRunning] = useState(false);
  const [improvementRunPhase, setImprovementRunPhase] = useState('');
  const searchParams = useSearchParams();

  // Core hooks
  const { session, handleLogout, orgSetupError } = useAuth();
  const { credits, loadCredits } = useCredits(session);
  const {
    messages, setMessages, input, sending,
    messagesEndRef, inputRef,
    handleSend, handleKeyDown, handleInputChange,
    appendToInput, addMessage, clearMessages,
  } = useChat(session, loadCredits);

  const {
    documents, docsLoading, loadDocuments,
    pendingAnalysis, improvementTarget, improvementLoading,
    analysisProgress, analysisPhase,
    handleUpload, handleDelete,
    handleAnalysisConfirm, handleAnalysisCancel, handleAnalysisImprove, handleExhaustiveAnalysis,
    handleImprovementClose, handleImprovementIndexed,
  } = useDocuments(session, addMessage, loadCredits);

  const {
    driveStatus, syncing,
    loadDriveStatus,
    handleConnectDrive, handleSyncDrive, handleDisconnectDrive,
  } = useDrive(session, addMessage, loadDocuments);

  const { lockState, showReminder, toggleLock, activateLock, dismissReminder } = useUploadLock(session);

  // Detect mobile
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load data on session ready
  useEffect(() => {
    if (session) { loadDocuments(); loadDriveStatus(); loadCredits(); }
  }, [session, loadDocuments, loadDriveStatus, loadCredits]);

  // Resetear estado minimizado cuando el modal correspondiente desaparece
  useEffect(() => { if (!pendingAnalysis) setAnalysisMinimized(false); }, [pendingAnalysis]);
  useEffect(() => { if (!improvementTarget) setImprovementMinimized(false); }, [improvementTarget]);

  // Handle Drive OAuth callback
  const driveAutoSyncTriggeredRef = useRef(false);
  useEffect(() => {
    if (searchParams.get('drive_connected') === 'true' && !driveAutoSyncTriggeredRef.current && session) {
      driveAutoSyncTriggeredRef.current = true;
      const driveProviderLabel = searchParams.get('drive_provider') === 'onedrive' ? 'OneDrive' : 'Google Drive';
      addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `${driveProviderLabel} conectado correctamente. Trayendo tus archivos...` });
      loadDriveStatus();
      window.history.replaceState({}, '', '/chat');
      setTimeout(() => { handleSyncDrive(); }, 400);
    }
    if (searchParams.get('drive_error')) {
      addMessage({ id: crypto.randomUUID(), role: 'error', content: `Error conectando Google Drive: ${searchParams.get('drive_error')}` });
      window.history.replaceState({}, '', '/chat');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, session]);

  // Estado del indicador del sidebar para modales minimizados o análisis en curso
  const activeModalForSidebar = improvementTarget && improvementMinimized && improvementRunning
    ? { status: 'running' as const, label: improvementRunPhase || 'Reanalizando...' }
    : improvementTarget && improvementMinimized
      ? { status: 'ready' as const, label: 'Chat de mejora activo' }
      : pendingAnalysis && analysisMinimized
        ? { status: 'ready' as const, label: 'Resultados listos' }
        : analysisProgress > 0
          ? { status: 'running' as const, label: analysisPhase || 'Analizando...' }
          : undefined;

  function handleRestoreModal() {
    if (improvementMinimized) setImprovementMinimized(false);
    else if (analysisMinimized) setAnalysisMinimized(false);
  }

  // Loading state (covers org/setup retries — setSession is called after setup completes)
  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  // Org setup failed after all retries
  if (orgSetupError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div style={{
          maxWidth: 400, width: '100%', padding: '28px 24px', borderRadius: 12,
          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Error al configurar tu cuenta</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{orgSetupError}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: 'var(--brand)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Recargar página
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '7px 18px', borderRadius: 8,
              border: '0.5px solid var(--border)', background: 'transparent',
              fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {isMobile && sidebarOpen && <div className="sidebar-mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Strip colapsado (desktop, sidebar cerrado) */}
      {!isMobile && !sidebarOpen && (
        <div style={{
          width: 36, flexShrink: 0, height: '100%',
          background: 'var(--bg-secondary)', borderRight: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            title="Expandir panel"
            aria-label="Expandir panel"
            style={{
              width: 26, height: 26, borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <polyline points="12 9 15 12 12 15" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div style={{
        flexShrink: 0, transition: 'width 0.25s ease, transform 0.25s ease',
        width: isMobile ? 270 : (sidebarOpen ? 260 : 0), overflow: 'hidden',
        ...(isMobile ? { position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 41, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', boxShadow: sidebarOpen ? 'var(--shadow-md)' : 'none' } : {}),
      }}>
        <div style={{ width: 260, height: '100%' }}>
          <DocumentsSidebar
            documents={documents} loading={docsLoading}
            driveStatus={driveStatus} syncing={syncing}
            onUpload={async (file: File) => { await activateLock(); await handleUpload(file); }} onDelete={handleDelete}
            onConnectDrive={handleConnectDrive} onSyncDrive={handleSyncDrive} onDisconnectDrive={handleDisconnectDrive}
            onClose={isMobile ? () => setSidebarOpen(false) : undefined}
            onCollapseSidebar={!isMobile ? () => setSidebarOpen(false) : undefined}
            analysisProgress={analysisProgress}
            analysisPhase={analysisPhase}
            credits={credits}
            uploadLock={lockState}
            onToggleUploadLock={toggleLock}
            showLockReminder={showReminder}
            onDismissLockReminder={dismissReminder}
            activeModal={activeModalForSidebar}
            onRestoreModal={handleRestoreModal}
            modalActive={!!pendingAnalysis || !!improvementTarget}
          />
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatHeader
          sidebarOpen={sidebarOpen} isMobile={isMobile}
          credits={credits}
          accessToken={session.access_token}
          hasMessages={messages.length > 0}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onClearChat={clearMessages}
        />

        <SubscriptionBanners credits={credits} />

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 ? (
            <EmptyState hasDocuments={documents.length > 0} />
          ) : (
            messages.map(msg => <ChatMessage key={msg.id} role={msg.role} content={msg.content} sources={msg.sources} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          input={input} sending={sending}
          hasDocuments={documents.length > 0}
          inputRef={inputRef}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onAppendText={appendToInput}
          onSend={() => {
            if (documents.length === 0) {
              addMessage({ id: crypto.randomUUID(), role: 'error', content: 'Sube o sincroniza documentos primero.' });
              return;
            }
            handleSend();
          }}
        />
      </div>

      {/* Modals — se mantienen montados al minimizar para preservar el estado */}
      {pendingAnalysis && (
        <div style={{ display: analysisMinimized ? 'none' : undefined }}>
          <AnalysisModal
            fileName={pendingAnalysis.fileName}
            analysis={pendingAnalysis.analysis}
            onConfirm={handleAnalysisConfirm}
            onCancel={handleAnalysisCancel}
            onImprove={handleAnalysisImprove}
            onExhaustive={handleExhaustiveAnalysis}
            onMinimize={() => setAnalysisMinimized(true)}
          />
        </div>
      )}

      {improvementLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '20px 28px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, border: '0.5px solid var(--border)' }}>
            <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Preparando el modo mejora...</span>
          </div>
        </div>
      )}

      {improvementTarget && session && (
        <div style={{ display: improvementMinimized ? 'none' : undefined }}>
          <ImprovementModal
            fileName={improvementTarget.fileName}
            initialText={improvementTarget.initialText}
            analysis={improvementTarget.analysis}
            documentSources={improvementTarget.documentSources}
            storagePath={improvementTarget.storagePath}
            existingDocWithSameName={improvementTarget.existingDocWithSameName}
            accessToken={session.access_token}
            onClose={handleImprovementClose}
            onIndexed={handleImprovementIndexed}
            onMinimize={() => setImprovementMinimized(true)}
            onReanalysisChange={(running, phase) => { setImprovementRunning(running); setImprovementRunPhase(phase); }}
          />
        </div>
      )}
    </div>
  );
}
