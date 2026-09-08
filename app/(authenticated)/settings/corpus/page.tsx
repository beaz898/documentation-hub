'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, RefreshCw, Wrench } from 'lucide-react';
import { recorrerElLote } from '@/lib/documents/bucle-del-lote';
import type { ResultadoDelBucle } from '@/lib/documents/bucle-del-lote';

/**
 * ESTADO DEL CORPUS Y REPARACIÓN — B.199.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ POR QUÉ EXISTE. Hasta el 09/09/2026 `reindexar`, `reindexar-lote` y
 * `estado-del-corpus` NO los llamaba ninguna `.tsx`: la reparación solo podía
 * dispararla quien supiera abrir una consola. **Eso no es un producto** — y el
 * día que cambie el procesamiento, un cliente sin consola se queda con un
 * corpus desactualizado y sin forma de arreglarlo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ ESTA PANTALLA SE ENTREGA SIN EJERCER, y se dice aquí para que no haga falta
 * deducirlo. El corpus está a CERO reparables, así que no hay nada que pulsar.
 * Lo que sí está probado es el BUCLE (`lib/documents/bucle-del-lote.ts`), que es
 * donde vive el único fallo silencioso: `LIMITE_POR_LLAMADA` vale 8, y una
 * versión que pulse una sola vez repara ocho documentos y PARECE terminada.
 * La pantalla se verifica a ojo; el bucle tiene su batería.
 *
 * NO se fabricó un corpus reparable subiendo el catálogo para poder probarla:
 * eso sería inventar la avería para enseñar el arreglo.
 *
 * ⚠️ TODA CIFRA QUE SE PINTA VIENE DEL SERVIDOR, incluida la frase del veredicto.
 * Aquí no se recalcula ningún estado: quien decide si un documento está al día
 * es `estadoDeReparacion`, y esta pantalla no va a ser el segundo sitio que lo
 * sepa.
 */

interface DocumentoAReparar {
  id: string;
  nombre: string;
  estado: string;
  anomalia?: string;
}

interface Censo {
  version_vigente: number;
  examinados: number;
  total_en_la_organizacion: number;
  truncado: boolean;
  recuento: Record<string, number>;
  a_reparar: DocumentoAReparar[];
  veredicto: string;
}

const ESTADOS: Record<string, string> = {
  al_dia: 'Al día',
  reparable_automaticamente: 'Reparable con el botón',
  reparable_resubiendo: 'Hay que volver a subirlo',
};

export default function CorpusPage() {
  const [censo, setCenso] = useState<Censo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);

  const [enCurso, setEnCurso] = useState(false);
  const [avance, setAvance] = useState<ResultadoDelBucle | null>(null);
  const [cancelar, setCancelar] = useState(false);
  const cancelarRef = useRef(false);
  const [porFila, setPorFila] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    setCargando(true); setError(null); setSinPermiso(false);
    try {
      const res = await fetch('/api/admin/estado-del-corpus', { credentials: 'include' });
      if (res.status === 401 || res.status === 403) { setSinPermiso(true); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo leer el estado del corpus.');
      setCenso(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  /** Reparar TODO lo reparable: el bucle, con su contador entre rondas. */
  const repararTodo = useCallback(async () => {
    // ⚠️ EL PARAR VA POR `ref` Y NO POR ESTADO, y esto ES el arreglo de un fallo
    // real: la primera versión cerraba sobre una variable local del propio
    // `useCallback`, así que el botón cambiaba el estado de React y el bucle
    // seguía leyendo `false` para siempre. **El botón no hacía nada y el
    // typecheck pasaba.** Una `ref` es lo único que el bucle puede leer ya
    // arrancado, porque no se re-crea con cada render.
    cancelarRef.current = false;
    setEnCurso(true); setCancelar(false); setAvance(null);
    const resultado = await recorrerElLote(
      async () => {
        const res = await fetch('/api/admin/reindexar-lote', {
          method: 'POST', credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
      },
      { alAvanzar: setAvance, cancelado: () => cancelarRef.current },
    );
    setAvance(resultado);
    setEnCurso(false);
    void cargar();
  }, [cargar]);

  /** Reparar UNO. El aviso de media reparación lo manda el servidor. */
  const repararUno = useCallback(async (id: string) => {
    setPorFila(p => ({ ...p, [id]: 'Reparando…' }));
    try {
      const res = await fetch('/api/admin/reindexar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ documentId: id }),
      });
      const data = await res.json();
      // ⚠️ CADA FINAL POR SU NOMBRE, no todos como «error». Un 409 no es una
      // avería: es la guarda de B.191 diciendo que ese documento se repara
      // RESUBIÉNDOLO, y el usuario tiene que poder distinguirlo de un fallo.
      if (res.status === 409) {
        setPorFila(p => ({ ...p, [id]: data.motivo === 'sin_original_con_tablas'
          ? 'Tiene tablas y no guarda su estructura: hay que volver a subirlo.'
          : `No se puede reparar: ${data.motivo}` }));
      } else if (res.status === 501) {
        setPorFila(p => ({ ...p, [id]: 'Necesita volver a descargarse del proveedor, y esa vía no está construida.' }));
      } else if (res.status === 423) {
        setPorFila(p => ({ ...p, [id]: data.error || 'Hay una subida en curso; espera a que termine.' }));
      } else if (!res.ok) {
        setPorFila(p => ({ ...p, [id]: data.error || `Error ${res.status}` }));
      } else {
        setPorFila(p => ({ ...p, [id]: `Reparado · ${data.trozos?.antes}→${data.trozos?.ahora} trozos. ${data.aviso ?? ''}` }));
        void cargar();
      }
    } catch (e) {
      setPorFila(p => ({ ...p, [id]: e instanceof Error ? e.message : 'Error' }));
    }
  }, [cargar]);

  if (sinPermiso) {
    return <p className="p-6 text-sm text-gray-600 dark:text-gray-300">
      Solo los administradores pueden ver el estado del corpus.
    </p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Estado del corpus</h1>
        <button
          onClick={() => void cargar()}
          disabled={cargando}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
        >
          <RefreshCw className="inline w-4 h-4 mr-1" />Actualizar
        </button>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {cargando && !censo && <p className="text-sm text-gray-500">Leyendo el corpus…</p>}

      {censo && (
        <>
          {/* ⚠️ ARRIBA Y SIN ESCONDER: si el censo es una MUESTRA, la cifra de
              abajo no describe el corpus. El endpoint lo devuelve como campo
              justamente para que no haya que leer su código para saberlo. */}
          {censo.truncado && (
            <div className="flex gap-2 p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Recuento parcial:</strong> se han mirado {censo.examinados} de{' '}
                {censo.total_en_la_organizacion} documentos. <strong>No concluyas nada del resto.</strong>
              </span>
            </div>
          )}

          <p className="text-sm">{censo.veredicto}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(censo.recuento).map(([estado, n]) => (
              <div key={estado} className="p-3 rounded border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-semibold">{n}</div>
                <div className="text-xs text-gray-500">{ESTADOS[estado] ?? estado}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500">
            Versión del procesamiento: {censo.version_vigente}
          </p>

          {/* ⚠️ LOS DOS AVISOS, y son cosas distintas: uno dice que la reparación
              es PARCIAL, el otro que lo que ya se analizó puede estar viejo. */}
          <div className="space-y-2 text-sm">
            <div className="flex gap-2 p-3 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <Wrench className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
              <span>
                Reparar arregla <strong>cómo se trocea</strong> un documento, no cómo se lee.
                Si lo que cambió fue la lectura, esos documentos siguen necesitando una resubida.
              </span>
            </div>
            <div className="flex gap-2 p-3 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-gray-500" />
              <span>
                Reparar <strong>no vuelve a analizar nada</strong>. Los análisis anteriores de un
                documento reparado —y los de cualquier otro que se comparase con él— se hicieron
                sobre el troceado viejo y pueden haber quedado incompletos.
              </span>
            </div>
          </div>

          {censo.a_reparar.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">A reparar ({censo.a_reparar.length})</h2>
                <div className="flex gap-2">
                  {enCurso && (
                    <button
                      onClick={() => { cancelarRef.current = true; setCancelar(true); }}
                      className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600"
                    >Detener</button>
                  )}
                  <button
                    onClick={() => void repararTodo()}
                    disabled={enCurso}
                    className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50"
                  >
                    {enCurso ? 'Reparando…' : 'Reparar todo lo reparable'}
                  </button>
                </div>
              </div>

              {avance && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Reparados {avance.reparados} en {avance.rondas} ronda(s).
                  {avance.quedan > 0 && ` Quedan ${avance.quedan}.`}
                  {avance.bloqueados > 0 && ` Bloqueados: ${avance.bloqueados}.`}
                  {avance.fallidos > 0 && ` Fallidos: ${avance.fallidos}.`}
                  {avance.motivo === 'tope' && ' Se alcanzó el máximo de rondas; vuelve a pulsar.'}
                  {avance.motivo === 'sin_progreso' && ' No se avanzó en la última ronda: lo que queda no se puede reparar así.'}
                  {avance.motivo === 'error' && ` Se cortó: ${avance.error}`}
                </p>
              )}
              {cancelar && enCurso && <p className="text-xs text-gray-500">Se detendrá al terminar la ronda en curso.</p>}

              <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded">
                {censo.a_reparar.map(d => (
                  <li key={d.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{d.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {ESTADOS[d.estado] ?? d.estado}{d.anomalia ? ` · ${d.anomalia}` : ''}
                      </div>
                      {porFila[d.id] && <div className="text-xs mt-1">{porFila[d.id]}</div>}
                    </div>
                    <button
                      onClick={() => void repararUno(d.id)}
                      disabled={d.estado !== 'reparable_automaticamente' || enCurso}
                      className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 shrink-0"
                    >Reparar</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
