-- ════════════════════════════════════════════════════════════════════════
-- SQL_B235_cobro_CLI20.sql — ¿QUÉ SE COBRÓ POR LAS TRES PASADAS DE CLI-20 DEL 17/09?
--
-- ESTADO: PENDIENTE DE EJECUTAR.
--
-- SOLO LEE. Sustituir <ORG_ID> en las cuatro consultas.
--
-- ⚠️ LO QUE ESTO NO PUEDE LEER, dicho primero: LOS REEMBOLSOS NO DEJAN RASTRO.
-- `refundCredits` (lib/credits.ts) sólo cambia el saldo de `organizations`; no hay
-- tabla de movimientos. Lo cobrado se DEDUCE de lo que sí queda: el cobro del job,
-- el tipo de salida, la clase de coste, el plan. Si el director apuntó el saldo
-- antes y después, esa cifra manda sobre la deducción.
--
-- PREDICCIÓN, escrita antes, leyendo el código del 17/09:
--   · RÁPIDO cortado por duplicado: **5**. El rápido no tiene reembolso para un
--     corte por hash (no es etapa caída ni excepción).
--   · EXHAUSTIVO desde el chat cortado por duplicado: **30, sin devolver nada**.
--     El corte sale sin `estimatedCost` → sin clasificar → `heavy` por defecto →
--     reembolso 0 (B.235: «el precio NO cambia»). Y si el plan no es business o
--     business_plus, ni siquiera se entra al precio variable. La regla por etapa
--     de `df3dacc1` NO lo alcanza: sólo actúa en fallos, y esto no es un fallo.
--   · «REANALIZAR CORPUS» desde el modal: depende de si CLI-20 tiene original en la
--     nube. Si lo tiene —lo sugiere que se pudiera borrar de Drive—, el modal NO lo
--     excluye (`homonimoParaReemplazar` ignora los de la nube), el hash vuelve a
--     chocar y son **otros 30 sin devolver**. Si no lo tiene, se excluye, analiza
--     de verdad contra el resto del corpus, cobra 30 y el precio variable devuelve
--     según clase y plan.
--   · Total esperado si CLI-20 es de la nube: **5 + 30 + 30 = 65**.
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · EL PLAN — decide si existe siquiera el precio variable ─────────
select plan from organizations where id = '<ORG_ID>';


-- ── 2 · LOS JOBS EXHAUSTIVOS de CLI-20 hoy ─────────────────────────────
-- `duracion` en milisegundos: un corte por hash dura décimas de segundo.
-- `exclude_fingerprints = '[]'` → no cuenta como reanálisis para el precio.
select j.id, j.created_at, j.status, j.credits_consumed,
       j.exclude_fingerprints,
       j.exclude_document_id,
       round(extract(epoch from (j.completed_at - j.started_at)) * 1000) as duracion_ms,
       j.result ->> 'isDuplicate'  as es_duplicado,
       j.result ->> 'duplicateOf'  as duplicado_de,
       j.error_message
from analysis_jobs j
where j.org_id = '<ORG_ID>'
  and j.document_name like 'CLI-20%'
  and j.created_at >= '2026-09-17'
order by j.created_at;


-- ── 3 · LAS FILAS DE ANÁLISIS: tipo, duplicado y CLASE DE COSTE ────────
-- `sin_clasificar = true` → se cobró el máximo POR DEFECTO, no por medida.
select ar.created_at, ar.analysis_type, ar.recommendation,
       ar.analysis ->> 'isDuplicate'   as es_duplicado,
       ar.analysis ->> 'estimatedCost' as clase_declarada,
       ar.pipeline_counters ? 'averia.exhaustivo_sin_clasificar' as sin_clasificar,
       jsonb_array_length(coalesce(ar.analysis -> 'stageFailures', '[]'::jsonb)) as etapas_caidas,
       ar.style_problems_found
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.document_name like 'CLI-20%'
  and ar.created_at >= '2026-09-17'
order by ar.created_at;


-- ── 4 · EL COBRO REGISTRADO por la ruta ────────────────────────────────
-- Es lo que la ruta ANOTÓ como consumido al cobrar. No incluye reembolsos
-- posteriores del worker.
select created_at, credits_consumed, success, user_query, error_message
from usage_logs
where org_id = '<ORG_ID>'
  and endpoint = '/api/analyze-v2'
  and created_at >= '2026-09-17'
order by created_at;


-- ── CÓMO SE DEDUCE LO COBRADO, fila a fila ─────────────────────────────
-- rápido                                   → 5
-- exhaustivo, es_duplicado, sin_clasificar → 30 (sin reembolso en ningún plan)
-- exhaustivo, analizó, clase declarada:
--   plan business/business_plus → 30 − {light 10 · medium 5 · heavy 0}
--   otro plan                    → 30
--   y si exclude_fingerprints ≠ '[]' con < 2 contradicciones → 30 − 20 (todos los planes)
-- etapas_caidas > 0 → 0 (F-71, devolución íntegra)
