import { NextResponse } from 'next/server';
import type { ResultadoDeReparacion } from './reparar';

/**
 * LA TRADUCCIÓN A HTTP DE UNA REPARACIÓN — y vive en `lib/` por obligación, no
 * por gusto.
 *
 * ⚠️ ESTABA EN LA RUTA Y **ROMPÍA EL BUILD DE VERCEL** (B.197): un fichero
 * `route.ts` solo puede exportar los verbos HTTP y la configuración de segmento
 * (`maxDuration`, `dynamic`, `runtime`…). Cualquier otro `export` es un error
 * de tipos de Next: «is not a valid Route export field».
 *
 * ⚠️ Y NO ES QUE `tsc` NO SEPA VERLO — es que MIRA POR UN ARTEFACTO QUE NADIE
 * REGENERA. La comprobación vive en `.next/types/app/…/route.ts`, que
 * `tsconfig.json` incluye; ahí Next escribe un `checkFields` por ruta contra
 * `typeof import(la ruta)`. Medido el 07/09 con el export intruso puesto a
 * propósito: con ese fichero PRESENTE, `tsc --noEmit` da rojo en el acto; con
 * ese fichero AUSENTE, da **verde con el fallo dentro**.
 *
 * Lo genera `next build`, y `npm run typecheck` ni lo genera ni comprueba que
 * esté. Así que el gate cubre las rutas VIEJAS y **tiene un agujero con la forma
 * exacta de una ruta NUEVA** — que es lo que era ésta. `next typegen` tampoco lo
 * tapa: en 15.1 produce un validador más flojo que no mira los exports de un
 * route handler (comprobado el mismo día, mismo intruso, verde).
 *
 * Por eso el gate de esta clase es `lib/rutas-solo-exportan-lo-permitido.test.ts`,
 * que lee la fuente y no depende de ningún artefacto de build.
 *
 * Aquí abajo se puede exportar, y sigue estando en UN SOLO SITIO: la ruta de un
 * documento y la del lote no pueden discrepar sobre qué significa cada final.
 */
export function respuestaDeReparacion(resultado: ResultadoDeReparacion): NextResponse {
  if (resultado.ok) {
    return NextResponse.json({
      reindexado: true,
      via: 'retrocear',
      generacion: resultado.generacion,
      trozos: resultado.trozos,
      // ⚠️ SE DICE QUE ES MEDIA REPARACIÓN, y no se vende como completa:
      // re-trocear arregla el troceado, NO la extracción.
      reparacion_completa: resultado.reparacionCompleta,
      aviso: resultado.reparacionCompleta
        ? undefined
        : 'Se ha reparado el TROCEADO desde el texto guardado. Si lo que cambió fue cómo se LEE el documento, este documento sigue necesitando una resubida.',
    });
  }

  if (resultado.clase === 'no_encontrado') {
    return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
  }

  if (resultado.clase === 'rechazado') {
    return NextResponse.json({
      reindexado: false,
      via: 'rechazado',
      // El motivo se devuelve tal cual para que quien lo enseñe no tenga que
      // traducirlo aquí: `sin_original_con_tablas` es lo que le dice al usuario
      // que ese documento se repara RESUBIÉNDOLO, no con un botón.
      motivo: resultado.motivo,
    }, { status: 409 });
  }

  if (resultado.clase === 'no_implementado') {
    return NextResponse.json({
      reindexado: false,
      via: 'reprocesar',
      motivo: 'reprocesar_no_implementado',
      detalle: 'Este documento tiene su original en un proveedor externo y su reparación completa necesita volver a descargarlo. Esa vía todavía no está construida.',
    }, { status: 501 });
  }

  if (resultado.motivo === 'fallo_lectura') {
    return NextResponse.json({ error: 'No se pudo leer el documento.' }, { status: 500 });
  }

  return NextResponse.json({
    reindexado: false,
    via: 'retrocear',
    motivo: resultado.motivo,
    detalle: resultado.detalle,
  }, { status: 500 });
}
