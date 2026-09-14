import { describe, expect, it } from 'vitest';

import {
  homonimoParaReemplazar,
  nombreDeLaCopiaCorregida,
  type DocumentoHomonimo,
} from './nombre-corregido';

/**
 * B.218 — EL NOMBRE SE COMPONE EN UN SITIO, Y EL HOMÓNIMO SE BUSCA CON ÉL.
 *
 * ⚠️ EL CASO QUE HOY FALLA VA EL PRIMERO Y CON NOMBRE PROPIO: el segundo guardado
 * del mismo día. Es la población entera del fallo —no un caso raro, sino
 * corregir, guardar, ver algo más y volver a guardar— y queda sujeto por abajo
 * antes de tocar el diálogo.
 */

// ⚠️ Fechas construidas con componentes LOCALES, no con cadenas UTC: el nombre
// se compone con `toLocaleDateString`, o sea en la zona de QUIEN GUARDA. Un
// `23:00Z` ya es el dia siguiente en Madrid, y el caso de «el mismo dia» se
// habria escrito sobre dos dias distintos sin que nadie lo notara.
const EL_14 = new Date(2026, 8, 14, 10, 0);
const EL_14_MAS_TARDE = new Date(2026, 8, 14, 22, 0);
const EL_15 = new Date(2026, 8, 15, 10, 0);

const doc = (id: string, name: string): DocumentoHomonimo => ({ id, name });
const todoReemplazable = () => true;

describe('nombreDeLaCopiaCorregida', () => {
  it('⚠️ DOS GUARDADOS EL MISMO DÍA DAN EL MISMO NOMBRE — el caso que falla', () => {
    // La fecha va sin hora a propósito, y esto lo deja escrito: el segundo
    // guardado del día choca SIEMPRE. No se arregla aquí; se sujeta.
    expect(nombreDeLaCopiaCorregida('informe.txt', EL_14))
      .toBe(nombreDeLaCopiaCorregida('informe.txt', EL_14_MAS_TARDE));
  });

  it('dos días distintos dan nombres distintos', () => {
    expect(nombreDeLaCopiaCorregida('informe.txt', EL_14))
      .not.toBe(nombreDeLaCopiaCorregida('informe.txt', EL_15));
  });

  it('compone con el sufijo y la fecha en dd/mm/aaaa', () => {
    expect(nombreDeLaCopiaCorregida('informe.txt', EL_14))
      .toBe('informe.txt (corregido 14/09/2026)');
  });

  it('⚠️ el nombre original entra ENTERO, extensión incluida', () => {
    // La extensión deja de ser la última, y eso es lo que obliga al servidor a
    // decidir con el nombre original y no con éste.
    const n = nombreDeLaCopiaCorregida('CLI-05_radiologia.xlsx', EL_14);
    expect(n).toContain('CLI-05_radiologia.xlsx');
    expect(n.endsWith('.xlsx')).toBe(false);
  });

  it('un nombre ya corregido se vuelve a corregir, y no se detecta solo', () => {
    // Declarado, no defendido: si alguien mejora una copia corregida y la guarda
    // sin reemplazar, el sufijo se apila. Hoy no ocurre porque el diálogo ofrece
    // reemplazar esa copia; si algún día deja de ofrecerlo, esto es lo que pasa.
    const una = nombreDeLaCopiaCorregida('informe.txt', EL_14);
    expect(nombreDeLaCopiaCorregida(una, EL_15))
      .toBe('informe.txt (corregido 14/09/2026) (corregido 15/09/2026)');
  });
});

describe('homonimoParaReemplazar — la decisión (c)', () => {
  const ORIGINAL = doc('id-original', 'informe.txt');
  const CORREGIDO = doc('id-corregido', 'informe.txt (corregido 14/09/2026)');

  it('⚠️ con la copia corregida de hoy en el corpus, se ofrece ÉSA', () => {
    // Es el caso que hoy no sale: el diálogo preguntaba por el nombre de entrada
    // y la colisión era contra el de salida.
    expect(homonimoParaReemplazar([CORREGIDO], 'informe.txt', EL_14, todoReemplazable))
      .toBe(CORREGIDO);
  });

  it('sin copia corregida pero con el original, se ofrece el ORIGINAL', () => {
    // Lo que ya funcionaba sigue funcionando: la (a) lo habría retirado.
    expect(homonimoParaReemplazar([ORIGINAL], 'informe.txt', EL_14, todoReemplazable))
      .toBe(ORIGINAL);
  });

  it('⚠️ con los DOS, gana la corregida — y eso decide por el usuario, a sabiendas', () => {
    expect(homonimoParaReemplazar([ORIGINAL, CORREGIDO], 'informe.txt', EL_14, todoReemplazable))
      .toBe(CORREGIDO);
    // En los dos órdenes: el resultado no puede depender de cómo venga la lista.
    expect(homonimoParaReemplazar([CORREGIDO, ORIGINAL], 'informe.txt', EL_14, todoReemplazable))
      .toBe(CORREGIDO);
  });

  it('la copia corregida de AYER no cuenta: el nombre lleva la fecha de hoy', () => {
    const deAyer = doc('id-ayer', 'informe.txt (corregido 13/09/2026)');
    expect(homonimoParaReemplazar([deAyer], 'informe.txt', EL_14, todoReemplazable))
      .toBeNull();
  });

  it('⚠️ lo que NO es reemplazable no se ofrece, ni siendo la corregida', () => {
    // El filtro entra como parámetro para que el criterio lo incluya: un
    // documento con original en la nube no se puede reemplazar aquí, y dejarlo
    // fuera del criterio sería ofrecerlo y que el servidor lo rechazara después.
    const noReemplazable = (d: DocumentoHomonimo) => d.id !== 'id-corregido';
    expect(homonimoParaReemplazar([ORIGINAL, CORREGIDO], 'informe.txt', EL_14, noReemplazable))
      .toBe(ORIGINAL);
  });

  it('sin ninguno de los dos, no hay nada que ofrecer', () => {
    expect(homonimoParaReemplazar([doc('x', 'otro.txt')], 'informe.txt', EL_14, todoReemplazable))
      .toBeNull();
  });
});

describe('B.218 · la zona horaria de quien guarda — declarado, no defendido', () => {
  it('⚠️ el nombre lleva la fecha LOCAL, así que el corte del día es la medianoche de quien guarda', () => {
    // `toLocaleDateString` formatea en la zona del entorno, y el nombre se
    // compone en el NAVEGADOR. Consecuencias, las dos reales y ninguna
    // arreglada aquí:
    //   · dos personas en husos distintos componen nombres distintos para el
    //     mismo instante;
    //   · guardar a las 23:50 y otra vez a las 00:10 da dos nombres, no uno.
    // Se descubrió porque este caso se escribió con `23:00Z` y falló: en
    // Madrid ya era el día siguiente.
    const finDelDia = new Date(2026, 8, 14, 23, 59);
    const inicioDelSiguiente = new Date(2026, 8, 15, 0, 1);
    expect(nombreDeLaCopiaCorregida('x.txt', finDelDia))
      .not.toBe(nombreDeLaCopiaCorregida('x.txt', inicioDelSiguiente));
  });
});
