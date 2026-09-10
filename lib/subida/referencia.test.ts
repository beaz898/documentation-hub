import { describe, it, expect } from 'vitest';
import {
  emitirRefDeSubida,
  resolverRefDeSubida,
  resolverOrigenDelFichero,
  VIDA_DE_LA_REF_MS,
} from './referencia';

/**
 * ⚠️ EL NEGATIVO DE LA PUERTA, QUE ES LO QUE EL ENCARGO PIDE Y NO UN EXTRA.
 *
 * Una puerta nueva necesita su propio control negativo: que el camino feliz
 * funcione demuestra que el DESTINO responde, no que la puerta sepa distinguir.
 * Es la lección de F-106 P3 —el fallo de F-103 era de puerta, y una medición
 * gemela por la otra entrada no lo habría cazado jamás—, aplicada esta vez
 * sobre una guarda que existe de verdad.
 *
 * Los tres negativos que el encargo nombra son AJENA, CADUCADA y MANIPULADA, y
 * están abajo uno a uno. Cuestan cero créditos y milisegundos.
 */

const SECRETO = 'un-secreto-de-pruebas-suficientemente-largo';
const OTRO_SECRETO = 'otro-secreto-de-pruebas-igual-de-largo-que-el';
const YO = { userId: 'u-111', orgId: 'o-999' };
const OTRO = { userId: 'u-222', orgId: 'o-999' };
const T0 = 1_757_000_000_000;

describe('la referencia de subida — camino feliz y contrato de la ruta', () => {
  it('lo que se emite se resuelve, con su ruta y su nombre', () => {
    const { ref, ruta } = emitirRefDeSubida(YO, 'informe.pdf', SECRETO, T0, 'abc');
    expect(resolverRefDeSubida(ref, YO, SECRETO, T0))
      .toEqual({ ok: true, ruta, fileName: 'informe.pdf' });
  });

  it('⚠️ la ruta EMPIEZA POR EL userId, que es de lo que depende la política del bucket', () => {
    const { ruta } = emitirRefDeSubida(YO, 'informe.pdf', SECRETO, T0, 'abc');
    expect(ruta.split('/')[0]).toBe(YO.userId);
    expect(ruta.split('/')).toHaveLength(2);
  });

  it('la ruta ya NO lleva el nombre del fichero: el nombre viaja firmado', () => {
    const { ref, ruta } = emitirRefDeSubida(YO, 'tarifas-2026.xlsx', SECRETO, T0, 'abc');
    expect(ruta).not.toContain('tarifas');
    const r = resolverRefDeSubida(ref, YO, SECRETO, T0);
    expect(r.ok && r.fileName).toBe('tarifas-2026.xlsx');
  });

  it('dos emisiones no comparten ruta', () => {
    const a = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0);
    const b = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0);
    expect(a.ruta).not.toBe(b.ruta);
  });

  it('la vida son DOS HORAS exactas, y el número es contrato', () => {
    expect(VIDA_DE_LA_REF_MS).toBe(2 * 60 * 60 * 1000);
  });
});

describe('la referencia de subida — LOS TRES NEGATIVOS DE LA PUERTA', () => {
  it('AJENA · una ref emitida para otro usuario no vale', () => {
    const { ref } = emitirRefDeSubida(OTRO, 'ajeno.pdf', SECRETO, T0, 'abc');
    expect(resolverRefDeSubida(ref, YO, SECRETO, T0))
      .toEqual({ ok: false, motivo: 'ajena' });
  });

  it('AJENA · el mismo usuario en OTRA organización tampoco', () => {
    // Un usuario puede cambiar de organización sin cambiar de id: una ref
    // emitida en la anterior no debe valer en la nueva.
    const { ref } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    expect(resolverRefDeSubida(ref, { userId: YO.userId, orgId: 'o-otra' }, SECRETO, T0))
      .toEqual({ ok: false, motivo: 'ajena' });
  });

  it('CADUCADA · un milisegundo después del plazo, no vale', () => {
    const { ref } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    expect(resolverRefDeSubida(ref, YO, SECRETO, T0 + VIDA_DE_LA_REF_MS + 1))
      .toEqual({ ok: false, motivo: 'caducada' });
  });

  it('CADUCADA · su control positivo: un milisegundo ANTES del plazo, sí vale', () => {
    // Sin este caso, una guarda que devolviera siempre `caducada` pasaría el de
    // arriba. El negativo sin su positivo es una pantalla apagada.
    const { ref } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    const r = resolverRefDeSubida(ref, YO, SECRETO, T0 + VIDA_DE_LA_REF_MS - 1);
    expect(r.ok).toBe(true);
  });

  it('MANIPULADA · tocar el contenido rompe la firma', () => {
    const { ref } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    const corte = ref.indexOf('.');
    const cargaTocada = 'A' + ref.slice(1, corte);
    expect(resolverRefDeSubida(`${cargaTocada}${ref.slice(corte)}`, YO, SECRETO, T0))
      .toEqual({ ok: false, motivo: 'firma' });
  });

  it('MANIPULADA · tocar la firma tampoco cuela', () => {
    const { ref } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    const corte = ref.indexOf('.');
    const firma = ref.slice(corte + 1);
    const otraFirma = (firma[0] === 'A' ? 'B' : 'A') + firma.slice(1);
    expect(resolverRefDeSubida(`${ref.slice(0, corte)}.${otraFirma}`, YO, SECRETO, T0))
      .toEqual({ ok: false, motivo: 'firma' });
  });

  it('MANIPULADA · una ref firmada con otro secreto es de otro, no nuestra', () => {
    const { ref } = emitirRefDeSubida(YO, 'x.pdf', OTRO_SECRETO, T0, 'abc');
    expect(resolverRefDeSubida(ref, YO, SECRETO, T0))
      .toEqual({ ok: false, motivo: 'firma' });
  });

  it('MALFORMADA · lo que no es cadena con contenido no es referencia', () => {
    for (const basura of [undefined, null, '', '   ', 42, { ref: 'x' }]) {
      expect(resolverRefDeSubida(basura, YO, SECRETO, T0).ok).toBe(false);
    }
  });
});

describe('resolverOrigenDelFichero — la lectura dual, con su reloj', () => {
  const dar = (s: string) => () => s;

  /**
   * ⚠️ EL CASO QUE HABRÍA CAZADO EL DEFECTO DE `228239d2`, y por eso va primero.
   *
   * Allí el secreto se pasaba YA RESUELTO, así que `secretoDeFirma()` —que LANZA
   * con un despliegue mal configurado— se evaluaba en toda petición, viniera ref
   * o no: un secreto malo habría tumbado el camino VIEJO, que no lo usa.
   * Aquí el proveedor EXPLOTA si alguien lo llama, así que este caso está en
   * verde si y solo si el camino viejo no toca el secreto.
   */
  it('⚠️ el camino VIEJO no pide el secreto: ni siquiera lo roza', () => {
    const explota = () => { throw new Error('no se debe pedir el secreto por el camino viejo'); };
    const r = resolverOrigenDelFichero(
      { storagePath: `${YO.userId}/1757-informe.pdf` }, YO, 'test', explota, T0,
    );
    expect(r.ok).toBe(true);
  });

  it('con ref válida entra por la ref', () => {
    const { ref, ruta } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    expect(resolverOrigenDelFichero({ ref }, YO, 'test', dar(SECRETO), T0))
      .toEqual({ ok: true, ruta, fileName: 'x.pdf', via: 'ref' });
  });

  it('sin ref, el camino VIEJO sigue vivo si la ruta es propia', () => {
    const r = resolverOrigenDelFichero(
      { storagePath: `${YO.userId}/1757-informe.pdf` }, YO, 'test', dar(SECRETO), T0,
    );
    expect(r).toEqual({
      ok: true, ruta: `${YO.userId}/1757-informe.pdf`, fileName: '', via: 'ruta',
    });
  });

  it('⚠️ sin ref y con ruta AJENA sigue rechazando: la guarda del commit 1 no se relaja', () => {
    const r = resolverOrigenDelFichero(
      { storagePath: `${OTRO.userId}/1757-ajeno.pdf` }, YO, 'test', dar(SECRETO), T0,
    );
    expect(r.ok).toBe(false);
  });

  it('si vienen las dos, gana la ref: durante la ventana el camino nuevo es el preferente', () => {
    const { ref, ruta } = emitirRefDeSubida(YO, 'firmado.pdf', SECRETO, T0, 'abc');
    const r = resolverOrigenDelFichero(
      { ref, storagePath: `${YO.userId}/otra-cosa.pdf` }, YO, 'test', dar(SECRETO), T0,
    );
    expect(r).toEqual({ ok: true, ruta, fileName: 'firmado.pdf', via: 'ref' });
  });

  it('una ref MALA no cae al camino viejo: se rechaza y punto', () => {
    // Si cayera, cualquiera con una ruta propia podría saltarse la ref mandando
    // una basura al lado — la ventana se convertiría en la puerta de atrás.
    const r = resolverOrigenDelFichero(
      { ref: 'basura.basura', storagePath: `${YO.userId}/x.pdf` }, YO, 'test', dar(SECRETO), T0,
    );
    expect(r.ok).toBe(false);
  });
});
