'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase';

interface Member {
  userId: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  isYou: boolean;
  isOwner: boolean;
  elevationActive: boolean;
}

interface Invitation {
  id: string;
  email: string;
  token: string;
  status: string;
  created_at: string;
  expires_at: string;
  isExpired: boolean;
}

function RoleBadge({ member }: { member: Member }) {
  const t = useTranslations('team');
  if (member.isOwner) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
        padding: '1px 5px', borderRadius: 3,
        background: 'rgba(217,119,6,0.12)', color: 'rgb(217,119,6)',
      }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 19h20l-2-10-5 5-3-8-3 8-5-5z" />
        </svg>
        {t('roleOwner')}
      </span>
    );
  }
  if (member.elevationActive) {
    return (
      <span style={{
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
        padding: '1px 5px', borderRadius: 3,
        background: 'rgba(124,58,237,0.12)', color: 'rgb(124,58,237)',
      }}>
        {t('roleTemporary')}
      </span>
    );
  }
  if (member.role === 'admin') {
    return (
      <span style={{
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
        padding: '1px 5px', borderRadius: 3,
        background: 'rgba(37,99,235,0.12)', color: 'rgb(37,99,235)',
      }}>
        {t('roleAdmin')}
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3,
      padding: '1px 5px', borderRadius: 3,
      background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
    }}>
      {t('roleMember')}
    </span>
  );
}

export default function TeamPage() {
  const t = useTranslations('team');
  const tc = useTranslations('common');
  const [session, setSession] = useState<{ access_token: string; user: { email?: string; id: string } } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.replace('/login'); return; }
      setSession({ access_token: s.access_token, user: { email: s.user.email, id: s.user.id } });
    });
  }, [router, supabase.auth]);

  const loadTeam = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/team/members', { credentials: 'include' }),
        fetch('/api/team/invitations', { credentials: 'include' }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
        const me = (data.members || []).find((m: Member) => m.isYou);
        setIsAdmin(me?.role === 'admin');
      }

      if (invitationsRes.ok) {
        const data = await invitationsRes.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error('Error loading team:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { if (session) loadTeam(); }, [session, loadTeam]);

  async function handleInvite() {
    if (!session || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteResult(null);

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        const inviteLink = `${window.location.origin}/invite?token=${data.invitation.token}`;
        setInviteResult({
          type: 'success',
          message: t('inviteSent', { email: inviteEmail.trim() }),
          link: inviteLink,
        });
        setInviteEmail('');
        await loadTeam();
      } else {
        setInviteResult({ type: 'error', message: data.error || 'Error enviando invitación.' });
      }
    } catch {
      setInviteResult({ type: 'error', message: 'Error de conexión.' });
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(userId: string, email: string) {
    if (!session || !window.confirm(t('confirmExpel', { email }))) return;
    setRemoving(userId);
    try {
      const res = await fetch(`/api/team/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) await loadTeam();
      else {
        const data = await res.json();
        alert(data.error || 'Error eliminando miembro.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setRemoving(null);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!session || !window.confirm(t('confirmCancelInvite'))) return;
    setCancellingInvite(inviteId);
    try {
      const res = await fetch(`/api/team/invitations/${inviteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) await loadTeam();
      else {
        const data = await res.json();
        alert(data.error || 'Error cancelando invitación.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      setCancellingInvite(null);
    }
  }

  function handleCopyLink(token: string) {
    const link = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{
        padding: '14px 20px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.push('/chat')}
          style={{
            padding: '6px 12px', borderRadius: 8, border: '0.5px solid var(--border)',
            background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12,
            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('backToChat')}
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 600 }}>{t('title')}</h1>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                {t('membersCount', { count: members.length })}
              </h2>
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('rolesExplainOwner')}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('rolesExplainAdmin')}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('rolesExplainTemporary')}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {members.map(member => (
                  <div
                    key={member.userId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, background: 'var(--bg-secondary)',
                      border: '0.5px solid var(--border)',
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--bg-tertiary)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                    }}>
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.email}
                        </span>
                        {member.isYou && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--brand-light)', color: 'var(--brand)', fontWeight: 600 }}>
                            {t('youBadge')}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <RoleBadge member={member} />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {t('since', { date: formatDate(member.joinedAt) })}
                        </span>
                      </div>
                    </div>
                    {isAdmin && !member.isYou && (
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.email)}
                        disabled={removing === member.userId}
                        style={{
                          padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)',
                          background: 'transparent', fontSize: 10, cursor: 'pointer',
                          color: 'var(--danger)', flexShrink: 0,
                        }}
                      >
                        {removing === member.userId ? t('removing') : t('expel')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
                  {t('inviteTitle')}
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                    placeholder="email@ejemplo.com"
                    disabled={inviting}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 8,
                      border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    style={{
                      padding: '9px 16px', borderRadius: 8, border: 'none',
                      background: inviting || !inviteEmail.trim() ? 'var(--bg-tertiary)' : 'var(--brand)',
                      color: inviting || !inviteEmail.trim() ? 'var(--text-muted)' : '#fff',
                      fontSize: 12, fontWeight: 600, cursor: inviting || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {inviting ? t('sending') : t('invite')}
                  </button>
                </div>

                {inviteResult && (
                  <div style={{
                    marginTop: 10, padding: '10px 12px', borderRadius: 8,
                    background: inviteResult.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `0.5px solid ${inviteResult.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    fontSize: 11, color: inviteResult.type === 'success' ? 'rgb(34,197,94)' : 'rgb(239,68,68)',
                  }}>
                    <p>{inviteResult.message}</p>
                    {inviteResult.link && (
                      <div style={{ marginTop: 8 }}>
                        <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {t('shareLink')}
                        </p>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 10px', borderRadius: 6,
                          background: 'var(--bg-secondary)', border: '0.5px solid var(--border)',
                        }}>
                          <code style={{
                            flex: 1, fontSize: 10, color: 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {inviteResult.link}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(inviteResult.link!);
                              setInviteResult({ ...inviteResult, message: t('linkCopied') });
                            }}
                            style={{
                              padding: '3px 8px', borderRadius: 4, border: '0.5px solid var(--border)',
                              background: 'var(--bg-tertiary)', fontSize: 10, cursor: 'pointer',
                              color: 'var(--text-secondary)', flexShrink: 0,
                            }}
                          >
                            {t('copy')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAdmin && invitations.length > 0 && (
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
                  {t('pendingCount', { count: invitations.length })}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {invitations.map(inv => (
                    <div
                      key={inv.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 8, background: 'var(--bg-secondary)',
                        border: '0.5px solid var(--border)',
                        opacity: inv.isExpired ? 0.5 : 1,
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--bg-tertiary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <polyline points="3 7 12 13 21 7" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.email}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {inv.isExpired ? t('expired') : t('expiresOn', { date: formatDate(inv.expires_at) })}
                          {' · '}{t('sentOn', { date: formatDate(inv.created_at) })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {!inv.isExpired && (
                          <button
                            onClick={() => handleCopyLink(inv.token)}
                            style={{
                              padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)',
                              background: 'var(--bg-tertiary)', fontSize: 10, cursor: 'pointer',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {copiedToken === inv.token ? t('copied') : t('copyLink')}
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelInvite(inv.id)}
                          disabled={cancellingInvite === inv.id}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)',
                            background: 'transparent', fontSize: 10, cursor: 'pointer',
                            color: 'var(--danger)',
                          }}
                        >
                          {cancellingInvite === inv.id ? '...' : tc('cancel')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isAdmin && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                {t('adminOnlyMsg')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
