'use client';

// components/learning/RuleRow.tsx
//
// Una fila de la lista de reglas: el texto, un interruptor activa/en pausa,
// y editar / quitar. Sin lógica de red: todo llega por props y notifica hacia arriba.

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { LearnedRule } from '@/lib/learning/types';

interface RuleRowProps {
  rule: LearnedRule;
  busy: boolean;                                   // true mientras hay una op en curso sobre esta fila
  onToggle: (rule: LearnedRule) => void;           // activar <-> pausar
  onEdit: (rule: LearnedRule, newText: string) => void;
  onRemove: (rule: LearnedRule) => void;
}

export default function RuleRow({ rule, busy, onToggle, onEdit, onRemove }: RuleRowProps) {
  const t = useTranslations('learning');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule.ruleText);

  const isActive = rule.status === 'activa';

  function startEdit() {
    setDraft(rule.ruleText);
    setEditing(true);
  }
  function cancelEdit() {
    setDraft(rule.ruleText);
    setEditing(false);
  }
  function saveEdit() {
    const text = draft.trim();
    if (!text) return;              // vacío: no guarda (el server también lo rechaza)
    onEdit(rule, text);
    setEditing(false);
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px',
        borderRadius: 8, background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        opacity: busy ? 0.6 : 1,
      }}
    >
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          style={{
            width: '100%', resize: 'vertical', padding: '8px 10px', borderRadius: 6,
            border: '0.5px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
          }}
        />
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
          {rule.ruleText}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
            background: isActive ? 'var(--brand)' : 'var(--bg-tertiary)',
            color: isActive ? '#fff' : 'var(--text-muted)',
          }}
        >
          {isActive ? t('statusActive') : t('statusPaused')}
        </span>

        <div style={{ flex: 1 }} />

        {editing ? (
          <>
            <button onClick={saveEdit} disabled={busy || !draft.trim()}
              style={{
                padding: '4px 12px', borderRadius: 6, border: 'none',
                background: !draft.trim() ? 'var(--bg-tertiary)' : 'var(--brand)',
                color: !draft.trim() ? 'var(--text-muted)' : '#fff',
                fontSize: 11, fontWeight: 600, cursor: !draft.trim() ? 'not-allowed' : 'pointer',
              }}>
              {t('save')}
            </button>
            <button onClick={cancelEdit} disabled={busy}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 11, cursor: 'pointer',
              }}>
              {t('cancel')}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onToggle(rule)} disabled={busy}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '0.5px solid var(--border)',
                background: 'transparent', color: 'var(--text)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>
              {isActive ? t('toggleToPause') : t('toggleToActive')}
            </button>
            <button onClick={startEdit} disabled={busy}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 11, cursor: 'pointer',
              }}>
              {t('edit')}
            </button>
            <button onClick={() => onRemove(rule)} disabled={busy}
              style={{
                padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)',
                background: 'transparent', color: 'var(--danger)',
                fontSize: 11, cursor: 'pointer',
              }}>
              {t('remove')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
