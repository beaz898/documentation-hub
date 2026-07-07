'use client';

// components/learning/RulesManager.tsx
//
// Cerebro de la pantalla de reglas: carga, alta, y las dos secciones
// "Activas" / "En pausa". El interruptor por fila alterna activa<->archivada;
// "quitar" es borrado suave (PATCH status:'archivada'), no borra la fila.
// El tope de activas se vigila en cliente (para desactivar el botón) además
// de en el servidor.

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { LearnedRule } from '@/lib/learning/types';
import { MAX_ACTIVE_RULES_PER_ORG } from '@/lib/learning/types';
import RuleRow from './RuleRow';

export default function RulesManager() {
  const t = useTranslations('learning');

  const [rules, setRules] = useState<LearnedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);   // 403: no es admin
  const [loadError, setLoadError] = useState(false);   // otro error de carga
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);  // fila con op en curso
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setForbidden(false);
    try {
      const res = await fetch('/api/learning/rules', { credentials: 'include' });
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) { setLoadError(true); return; }
      const data = await res.json();
      setRules((data.rules ?? []) as LearnedRule[]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Solo 'activa' y 'archivada' se muestran; 'pendiente' se ignora (reservado A.2).
  const active = rules.filter((r) => r.status === 'activa');
  const paused = rules.filter((r) => r.status === 'archivada');
  const atLimit = active.length >= MAX_ACTIVE_RULES_PER_ORG;

  async function addRule() {
    const text = newText.trim();
    if (!text) { setSaveError(t('emptyTextError')); return; }
    setAdding(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/learning/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ruleText: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveError(data.error || t('saveError')); return; }
      setNewText('');
      await load();
    } catch {
      setSaveError(t('saveError'));
    } finally {
      setAdding(false);
    }
  }

  async function patchRule(rule: LearnedRule, patch: { ruleText?: string; status?: string }) {
    setBusyId(rule.id);
    setSaveError(null);
    try {
      const res = await fetch(`/api/learning/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveError(data.error || t('saveError')); return; }
      await load();
    } catch {
      setSaveError(t('saveError'));
    } finally {
      setBusyId(null);
    }
  }

  function onToggle(rule: LearnedRule) {
    if (rule.status === 'activa') {
      patchRule(rule, { status: 'archivada' });     // pausar
    } else {
      if (atLimit) { setSaveError(t('limitReached', { max: MAX_ACTIVE_RULES_PER_ORG })); return; }
      patchRule(rule, { status: 'activa' });         // activar
    }
  }
  function onEdit(rule: LearnedRule, newTextValue: string) {
    patchRule(rule, { ruleText: newTextValue });
  }
  function onRemove(rule: LearnedRule) {
    if (!window.confirm(t('confirmRemove'))) return;
    patchRule(rule, { status: 'archivada' });        // borrado suave
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  if (forbidden) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
        {t('adminOnlyMsg')}
      </p>
    );
  }

  if (loadError) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{t('loadError')}</p>
        <button onClick={load}
          style={{ padding: '6px 14px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
          {t('cancel')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {t('subtitle')}
      </p>

      {/* Alta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t('addTitle')}</label>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={t('addPlaceholder')}
          rows={3}
          style={{ width: '100%', resize: 'vertical', padding: '8px 10px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={addRule} disabled={adding || !newText.trim()}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: adding || !newText.trim() ? 'var(--bg-tertiary)' : 'var(--brand)', color: adding || !newText.trim() ? 'var(--text-muted)' : '#fff', fontSize: 12, fontWeight: 600, cursor: adding || !newText.trim() ? 'not-allowed' : 'pointer' }}>
            {adding ? t('saving') : t('addButton')}
          </button>
          {saveError && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{saveError}</span>}
        </div>
      </div>

      {/* Activas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {t('activeSection', { count: active.length })}
        </h2>
        {active.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{t('empty')}</p>
        ) : (
          active.map((rule) => (
            <RuleRow key={rule.id} rule={rule} busy={busyId === rule.id} onToggle={onToggle} onEdit={onEdit} onRemove={onRemove} />
          ))
        )}
      </div>

      {/* En pausa */}
      {paused.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t('pausedSection')}
          </h2>
          {paused.map((rule) => (
            <RuleRow key={rule.id} rule={rule} busy={busyId === rule.id} onToggle={onToggle} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
