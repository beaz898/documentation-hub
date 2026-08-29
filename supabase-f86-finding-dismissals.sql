-- ============================================================
-- F-86 paso 3 — finding_dismissals: los descartes del usuario
-- («No es error»), POR ORGANIZACIÓN y permanentes.
-- Absorbe el pendiente C.6/D9.
--
-- QUÉ ARREGLA: hasta hoy el «No es error» vivía en un
-- useRef<Set<string>> del cliente y moría al recargar. F-67 dice
-- que la legitimidad de una divergencia la decide el usuario y su
-- decisión VALE; sin esta tabla valía hasta que cerrara la pestaña.
--
-- EJECUTADO EN EL SQL EDITOR DE SUPABASE EL 29/08/2026, ANTES DEL
-- PUSH. Este archivo es el registro en el repo: es el mismo DDL,
-- literal, que se ejecutó.
-- ============================================================

CREATE TABLE public.finding_dismissals (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id        text NOT NULL,                     -- TEXT, igual que documents/analysis_results/learned_rules

  -- La huella, YA HASHEADA (sha256 hex, 64 caracteres). La calcula SIEMPRE el
  -- servidor (lib/analysis/huella-hallazgo.ts). No se guarda NADA del texto del
  -- hallazgo: esta tabla no necesita saber QUÉ se descartó, solo que se descartó.
  fingerprint   text NOT NULL,

  -- Las dos especies del contrato común de huella-hallazgo.ts.
  -- 'tabular' NO SE ESCRIBE TODAVÍA: huellaDeHallazgo exige tabla y clave de
  -- fila por lado, y la discrepancia aún no las lleva. Llegan con la emisión
  -- del diff. La columna se crea ahora para no repetir migración.
  kind          text NOT NULL
                CHECK (kind IN ('tabular', 'prosa')),

  dismissed_by  uuid,
  created_at    timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT finding_dismissals_pkey PRIMARY KEY (id),
  CONSTRAINT finding_dismissals_dismissed_by_fkey
    FOREIGN KEY (dismissed_by) REFERENCES auth.users(id)
);

-- IDENTIDAD, NO HISTORIAL. Descartar dos veces el mismo hallazgo es UNA
-- decisión, no dos filas: la entrada por indexación puede reenviar lo mismo si
-- el usuario indexa dos veces. El endpoint hace upsert contra esta restricción.
CREATE UNIQUE INDEX finding_dismissals_org_fingerprint_key
  ON public.finding_dismissals (org_id, fingerprint);

ALTER TABLE public.finding_dismissals ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────
-- NO FALTAN POLÍTICAS DE ESCRITURA. Léelo antes de «arreglarlo».
--
-- TODO lo que escribe en esta tabla lo hace con SERVICE ROLE, que se salta RLS
-- por completo, así que una política de INSERT/DELETE no otorgaría nada:
--
--   INSERT  · POST /api/findings/dismiss   (la bandeja: descarte inmediato)
--           · POST /api/index-text         (el chat: descartes al indexar)
--   DELETE  · POST /api/findings/dismiss con { dismissed: false }
--             — el usuario puede DES-marcar un «No es error», y si eso no
--               borrase la fila el sistema le ocultaría el hallazgo para
--               siempre. Ese DELETE va por el mismo endpoint y el mismo
--               cliente de service role.
--
-- NINGUNA escritura sale del navegador, y es a propósito: la huella la calcula
-- el servidor (F-86). Un cliente que pudiera escribir aquí directamente podría
-- inventarse identidades y descartar hallazgos que nunca ha visto.
--
-- Mismo patrón que learned_rules. Las tablas de supabase-setup.sql SÍ llevan
-- políticas de escritura porque a ésas las toca el navegador; a ésta no.
--
-- SE DESCARTÓ imitar a llm_usage, que declara un `FOR INSERT TO service_role`:
-- esa política es redundante —si se borra, no cambia nada, porque la service
-- role ya se salta RLS— y una política que no otorga nada es un comentario
-- disfrazado. El comentario de arriba hace ese trabajo sin fingir un permiso.
-- ────────────────────────────────────────────────────────────────────────

-- PRECAUTORIA: hoy las tres lecturas (analyze-v2, worker y la ruta de la
-- bandeja) también son de servidor, así que esta política no sostiene nada
-- todavía. Existe para el día que la bandeja lea la tabla desde el navegador,
-- y para que el aislamiento entre organizaciones no dependa de acordarse.
CREATE POLICY "finding_dismissals_select_own_org"
  ON public.finding_dismissals
  FOR SELECT
  USING (
    org_id IN (
      SELECT m.org_id::text
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
    )
  );
