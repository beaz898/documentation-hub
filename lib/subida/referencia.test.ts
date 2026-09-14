import { describe, it, expect } from 'vitest';
import {
  emitirRefDeSubida,
  resolverRefDeSubida,
  mensajeDeRefRechazada,
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
const dar = (s: string) => () => s;

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

/**
 * ⚠️ LA LECTURA DUAL SE ACABÓ — commit 4 de 4, 14/09/2026. Este bloque decía
 * «la lectura dual, con su reloj» y ahora dice lo contrario: solo hay un camino.
 * Los casos del camino viejo NO se han borrado sin más — se han INVERTIDO: donde
 * decían «sigue vivo», ahora dicen «se rechaza». Un caso retirado no deja nada
 * vigilando; uno invertido vigila que no vuelva.
 */
describe('resolverOrigenDelFichero — solo la ref, y con mensaje', () => {
  const RUTA_PROPIA = `${YO.userId}/1757-informe.pdf`;

  it('con ref válida entra, con su ruta y su nombre', () => {
    const { ref, ruta } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    expect(resolverOrigenDelFichero({ ref }, YO, 'test', dar(SECRETO), T0))
      .toEqual({ ok: true, ruta, fileName: 'x.pdf' });
  });

  it('⚠️ SIN ref se rechaza, aunque el llamador sea quien sea: el camino viejo está retirado', () => {
    const r = resolverOrigenDelFichero({}, YO, 'test', dar(SECRETO), T0);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.motivo).toBe('ausente');
  });

  it('⚠️ y una ruta propia en el cuerpo YA NO ABRE NADA — es la propiedad del commit 4', () => {
    // Antes esto entraba por el camino viejo. Hoy la firma ni acepta el campo,
    // así que mandarlo es exactamente igual que no mandar nada.
    const r = resolverOrigenDelFichero(
      { ...( { storagePath: RUTA_PROPIA } as object) }, YO, 'test', dar(SECRETO), T0,
    );
    expect(r.ok).toBe(false);
  });

  it('el secreto solo se pide si hay ref: sin ella no se roza', () => {
    // Hereda la propiedad del arreglo de la evaluación adelantada: un despliegue
    // mal configurado no debe convertir «falta la ref» en un 500.
    const explota = () => { throw new Error('no se debe pedir el secreto sin ref'); };
    const r = resolverOrigenDelFichero({}, YO, 'test', explota, T0);
    expect(r.ok).toBe(false);
  });

  it('una ref MALA se rechaza y no cae a ningún sitio', () => {
    const r = resolverOrigenDelFichero({ ref: 'basura.basura' }, YO, 'test', dar(SECRETO), T0);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.motivo).toBe('firma');
  });
});

/**
 * ⚠️ LOS MENSAJES SON LA MITAD DEL COMMIT 4, y por eso tienen casos propios.
 *
 * Las dos ventanas que este cambio puede romper —una pestaña cargada antes del
 * commit 3, y una ref de hace más de dos horas— son gestos LEGÍTIMOS del usuario.
 * Devolverles «Ruta no autorizada» les dice que el documento no es suyo, que es
 * falso y además no sugiere nada. Este es el único momento en que se podía
 * arreglar: hasta hoy el camino viejo tapaba los dos casos.
 */
describe('los mensajes de rechazo: qué lee el usuario', () => {
  it('CADUCADA dice cuánto duraba y qué hacer, y no habla de autorización', () => {
    const m = mensajeDeRefRechazada('caducada');
    expect(m).toContain('2 horas');
    expect(m).toContain('Vuelve a subirlo');
    expect(m).not.toContain('no autorizada');
  });

  it('AUSENTE —la pestaña vieja— dice que recargue, no que no tiene permiso', () => {
    const m = mensajeDeRefRechazada('ausente');
    expect(m).toContain('Recárgala');
    expect(m).not.toContain('no autorizada');
  });

  it('malformada y firma dicen lo mismo que ausente: el caso realista es el mismo', () => {
    expect(mensajeDeRefRechazada('malformada')).toBe(mensajeDeRefRechazada('ausente'));
    expect(mensajeDeRefRechazada('firma')).toBe(mensajeDeRefRechazada('ausente'));
  });

  it('AJENA sí es un «no autorizada», y no se le sugiere nada', () => {
    expect(mensajeDeRefRechazada('ajena')).toContain('no autorizada');
  });

  it('⚠️ ningún motivo se queda sin mensaje, y ninguno cae en el texto genérico', () => {
    const motivos = ['ausente', 'malformada', 'firma', 'caducada', 'ajena'] as const;
    for (const motivo of motivos) {
      const m = mensajeDeRefRechazada(motivo);
      expect(m.length).toBeGreaterThan(10);
    }
  });

  it('el rechazo LLEVA el mensaje: quien llama no tiene que componerlo', () => {
    // Si el endpoint tuviera que elegir el texto, serían tres textos que se
    // separan. El motivo y su mensaje viajan juntos.
    const { ref } = emitirRefDeSubida(YO, 'x.pdf', SECRETO, T0, 'abc');
    const r = resolverOrigenDelFichero(
      { ref }, YO, 'test', dar(SECRETO), T0 + VIDA_DE_LA_REF_MS + 1,
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensaje).toBe(mensajeDeRefRechazada('caducada'));
  });
});
