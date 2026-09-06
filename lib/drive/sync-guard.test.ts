import { describe, expect, it } from 'vitest';

import { decidirSincronizacion, type ResultadoDelListado } from './sync-guard';
import type { DriveFile } from './types';

/**
 * LA GUARDA QUE IMPIDE BORRAR EL CORPUS POR UN 500 (01/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTA BATERÍA EXISTE PORQUE EL DAÑO ERA IRREVERSIBLE. Hasta hoy, un error
 * transitorio del proveedor —un 429, un 500 de un segundo— hacía que
 * `listFiles` devolviera `[]`, y doce líneas más abajo TODO documento que no
 * estuviera en el listado se borraba con `reason: 'remote_deleted'`: vectores,
 * fila y análisis, y sin lápida. El corpus de Drive entero de la organización.
 *
 * NO HABÍA EXPLOTADO POR UNA RAZÓN QUE NO ES UN ARREGLO: el endpoint no tiene
 * llamador en el repositorio —ni UI, ni agente, ni cron— y solo se alcanza por
 * HTTP directo. La bomba estaba armada y nadie tenía el botón a mano.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y LO QUE LO HACE ENSEÑABLE: el mismo razonamiento estaba resuelto BIEN a
 * doce líneas de distancia. La lectura equivalente contra Supabase aborta, con
 * su porqué escrito —«sin la lista de documentos existentes el sync trataria
 * todo el corpus como nuevo […] Abortar es la unica opcion segura»—. Mismo
 * razonamiento, misma consecuencia, y en el proveedor externo se hacía lo
 * contrario. No fue ignorancia: fue que nadie llevó el caso de una lectura a la
 * otra.
 *
 * LA CAUSA RAÍZ ERA EL TIPO: `listFiles(): Promise<DriveFile[]>` no tenía sitio
 * para «falló», y `[]` era la única forma que las implementaciones tenían de
 * volver. Por eso el arreglo empieza en el tipo.
 *
 * NO SE PRUEBA AQUÍ, y se declara: que un 429 real produzca `ok: false`. Es
 * red, y el alcance de la suite la prohíbe (la guarda de B.126 la bloquearía).
 * Lo que se prueba es que QUIEN RECIBE un `ok: false` no borra, que es donde
 * estaba el daño.
 */

function archivo(id: string): DriveFile {
  return {
    id,
    name: `${id}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    modifiedTime: '2026-09-01T10:00:00Z',
    isFolder: false,
    folderPath: '/',
  };
}

const doc = (provider_file_id: string) => ({ provider_file_id, name: `${provider_file_id}.docx` });

const TRES = [doc('a'), doc('b'), doc('c')];

describe('decidirSincronizacion — un listado que falló no es un listado vacío', () => {
  /**
   * ⚠️⚠️ EL CASO. Listado fallido con tres documentos en el corpus: CERO
   * borrados. Y no «una lista de borrado vacía»: la forma devuelta NO TIENE
   * lista de borrado, para que no se pueda seguir por descuido.
   */
  it('listado FALLIDO: aborta y no expone ninguna lista de borrado', () => {
    const fallo: ResultadoDelListado = { ok: false, motivo: 'Google Drive listado 500: upstream' };

    const r = decidirSincronizacion(fallo, TRES, 'misma_carpeta');

    expect(r.aborta).toBe(true);
    expect('borrar' in r).toBe(false);
    if (r.aborta) expect(r.motivo).toContain('500');
  });

  /**
   * ⚠️ LA MITAD CONTRARIA, y es la que evita pasarse de frenada: una guarda que
   * abortara siempre dejaría la sincronización inútil sin que ningún caso se
   * quejara. Una sincronización NORMAL sigue borrando lo que de verdad
   * desapareció de Drive — y solo eso.
   */
  it('listado BUENO: borra lo que ya no está, y ni uno más', () => {
    const bueno: ResultadoDelListado = { ok: true, archivos: [archivo('a'), archivo('b')] };

    const r = decidirSincronizacion(bueno, TRES, 'misma_carpeta');

    expect(r.aborta).toBe(false);
    if (r.aborta) return;
    expect(r.borrar).toEqual([doc('c')]);
    expect(r.archivos).toHaveLength(2);
  });

  /**
   * LA CARPETA VACÍA DE VERDAD SIGUE BORRANDO, y es DELIBERADO: vaciar la
   * carpeta es la forma que tiene el usuario de quitar documentos del corpus, y
   * es lo que la sincronización hace desde siempre. Arreglar el fallo cambiando
   * esto habría sido inventar otro.
   * Lo que se gana es que a este caso YA NO SE LLEGA por un 500 del proveedor.
   */
  it('listado LEGÍTIMAMENTE vacío: borra todo, y es la decisión, no el fallo', () => {
    const vacio: ResultadoDelListado = { ok: true, archivos: [] };

    const r = decidirSincronizacion(vacio, TRES, 'misma_carpeta');

    expect(r.aborta).toBe(false);
    if (r.aborta) return;
    expect(r.borrar).toEqual(TRES);
  });

  /**
   * EL LISTADO PARCIAL ES EL PELIGRO DE VERDAD, y por eso el fallo se convierte
   * en `ok: false` en los proveedores en vez de devolver lo acumulado: en
   * Google el fallo de una SUBCARPETA devolvía `[]` en ese nivel y el padre
   * seguía; en OneDrive, que pagina, un fallo en la página 3 de 5 devolvía las
   * dos primeras. La lista llega CON contenido y le faltan ficheros.
   * Aquí se comprueba la consecuencia: una lista a la que le falta «b» lo borra.
   * Ese es exactamente el daño que `ok: false` evita aguas arriba.
   */
  it('un listado incompleto borraría lo que falta — por eso el fallo no devuelve lista', () => {
    const parcial: ResultadoDelListado = { ok: true, archivos: [archivo('a'), archivo('c')] };

    const r = decidirSincronizacion(parcial, TRES, 'misma_carpeta');

    expect(r.aborta).toBe(false);
    if (r.aborta) return;
    expect(r.borrar).toEqual([doc('b')]);
  });

  /**
   * COMPORTAMIENTO EN VACÍO, declarado (la cuarta pieza, F-93). Sin documentos
   * previos no hay nada que borrar por ninguno de los dos caminos — y el fallido
   * sigue abortando aunque no hubiera daño posible: la guarda no depende de que
   * haya algo que perder.
   */
  it('sin documentos previos: nada que borrar, y el fallo sigue abortando', () => {
    const bueno = decidirSincronizacion({ ok: true, archivos: [archivo('a')] }, [], 'misma_carpeta');
    expect(bueno.aborta).toBe(false);
    if (!bueno.aborta) expect(bueno.borrar).toEqual([]);

    expect(decidirSincronizacion({ ok: false, motivo: 'x' }, [], 'misma_carpeta').aborta).toBe(true);
  });

  /** Ni se pierde ni se inventa: los que siguen estando no se tocan. */
  it('con todo en su sitio no borra nada', () => {
    const r = decidirSincronizacion(
      { ok: true, archivos: [archivo('a'), archivo('b'), archivo('c')] },
      TRES,
      'misma_carpeta',
    );

    expect(r.aborta).toBe(false);
    if (r.aborta) return;
    expect(r.borrar).toEqual([]);
  });

  /**
   * ⚠️⚠️ B.187 — EL CASO. La carpeta cambió: el listado nuevo NO contiene los
   * documentos de la anterior, y aun así **no se borra ninguno**.
   *
   * Es el par exacto del caso de la carpeta vacía de más arriba: el MISMO
   * listado —uno que no trae lo que había— significa cosas opuestas según de
   * dónde venga. Con la carpeta de siempre, «no está» quiere decir que lo
   * borraron en Drive. Con la carpeta cambiada, quiere decir que hemos dejado
   * de mirar donde estaba.
   */
  it('CARPETA CAMBIADA: el listado no trae lo de antes y NO se borra nada', () => {
    const otraCarpeta: ResultadoDelListado = { ok: true, archivos: [archivo('z')] };

    const r = decidirSincronizacion(otraCarpeta, TRES, 'carpeta_cambiada');

    expect(r.aborta).toBe(false);
    if (r.aborta) return;
    expect(r.borrar).toEqual([]);
    // Y sigue indexando lo de la carpeta nueva: no borrar no es no hacer nada.
    expect(r.archivos).toEqual([archivo('z')]);
  });

  /**
   * LA MITAD CONTRARIA, y es la que impide que el arreglo se pase de frenada:
   * con la carpeta de siempre se SIGUE borrando lo que desapareció de verdad.
   * Si este caso muriera, el arreglo habría apagado la sincronización.
   */
  it('MISMA CARPETA: lo que desapareció de verdad se sigue borrando', () => {
    const bueno: ResultadoDelListado = { ok: true, archivos: [archivo('a'), archivo('b')] };

    const r = decidirSincronizacion(bueno, TRES, 'misma_carpeta');

    expect(r.aborta).toBe(false);
    if (r.aborta) return;
    expect(r.borrar).toEqual([doc('c')]);
  });

  /**
   * ⚠️ EL FALLO GANA A LA PROCEDENCIA. Un listado que no llegó no autoriza nada,
   * venga de donde venga — y en particular la carpeta cambiada NO puede
   * convertir una guarda en un permiso: sigue abortando, y sigue sin exponer
   * lista de borrado.
   */
  it('listado FALLIDO con carpeta cambiada: aborta igual', () => {
    const r = decidirSincronizacion({ ok: false, motivo: 'timeout' }, TRES, 'carpeta_cambiada');

    expect(r.aborta).toBe(true);
    expect('borrar' in r).toBe(false);
  });

  /**
   * Y el vacío con carpeta cambiada, que es el que separa las dos semánticas sin
   * ambigüedad: el MISMO listado vacío borra todo con la carpeta de siempre y
   * nada con la carpeta cambiada.
   */
  it('vacío + carpeta cambiada: no borra; vacío + misma carpeta: borra todo', () => {
    const vacio: ResultadoDelListado = { ok: true, archivos: [] };

    const cambiada = decidirSincronizacion(vacio, TRES, 'carpeta_cambiada');
    expect(cambiada.aborta).toBe(false);
    if (!cambiada.aborta) expect(cambiada.borrar).toEqual([]);

    const misma = decidirSincronizacion(vacio, TRES, 'misma_carpeta');
    expect(misma.aborta).toBe(false);
    if (!misma.aborta) expect(misma.borrar).toEqual(TRES);
  });
});
