import { describe, it, expect } from 'vitest';
import { comprobarPertenencia } from './pertenencia';

/**
 * ⚠️ LOS DOS CASOS QUE PIDIÓ EL ENCARGO SON EL PRIMERO Y EL SEGUNDO —ruta propia
 * y ruta ajena—, y el resto está porque una guarda que solo se prueba por su
 * camino feliz no se ha probado. El control positivo de esta guarda es que sepa
 * decir que NO: si nunca ha dicho que no, es una pantalla apagada.
 */

const YO = '11111111-2222-3333-4444-555555555555';
const OTRO = '99999999-8888-7777-6666-555555555555';

describe('comprobarPertenencia — de quién es la ruta que manda el cliente', () => {
  it('la ruta propia pasa, y devuelve la ruta para que la use quien preguntó', () => {
    const r = comprobarPertenencia(`${YO}/1757000000000-informe.pdf`, YO);
    expect(r).toEqual({ ok: true, ruta: `${YO}/1757000000000-informe.pdf` });
  });

  it('la ruta AJENA se rechaza: es el caso que da nombre a B.204', () => {
    const r = comprobarPertenencia(`${OTRO}/1757000000000-tarifas.xlsx`, YO);
    expect(r).toEqual({ ok: false, motivo: 'ruta_ajena' });
  });

  it('un id que es PREFIJO de otro no basta: se compara el segmento entero', () => {
    // Con `startsWith` esto pasaría, y siendo UUID nadie lo vería a ojo.
    const r = comprobarPertenencia('abcd/fichero.pdf', 'abc');
    expect(r).toEqual({ ok: false, motivo: 'ruta_ajena' });
  });

  it('la travesía de directorios no es una ruta que este sistema produzca', () => {
    expect(comprobarPertenencia(`${YO}/../${OTRO}/x.pdf`, YO))
      .toEqual({ ok: false, motivo: 'ruta_malformada' });
  });

  it('una ruta absoluta tampoco', () => {
    expect(comprobarPertenencia(`/${YO}/x.pdf`, YO))
      .toEqual({ ok: false, motivo: 'ruta_malformada' });
  });

  it('el separador de Windows tampoco', () => {
    expect(comprobarPertenencia(`${YO}\\x.pdf`, YO))
      .toEqual({ ok: false, motivo: 'ruta_malformada' });
  });

  it('el id a secas es una CARPETA, y descargar una carpeta no existe aquí', () => {
    expect(comprobarPertenencia(YO, YO))
      .toEqual({ ok: false, motivo: 'ruta_malformada' });
  });

  it('lo que no es cadena no es ruta', () => {
    expect(comprobarPertenencia(undefined, YO)).toEqual({ ok: false, motivo: 'ruta_ausente' });
    expect(comprobarPertenencia({ ruta: 'x' }, YO)).toEqual({ ok: false, motivo: 'ruta_ausente' });
  });

  it('la cadena vacía o en blanco tampoco', () => {
    expect(comprobarPertenencia('   ', YO)).toEqual({ ok: false, motivo: 'ruta_ausente' });
  });

  it('sin dueño con quien comparar NO concede: falla cerrada', () => {
    // Si el id del que llama llegara vacío por un fallo aguas arriba, la guarda
    // no debe abrirse. Es la mitad permisiva de la regla de F-95 P3.
    expect(comprobarPertenencia(`${YO}/x.pdf`, '')).toEqual({ ok: false, motivo: 'ruta_ajena' });
  });
});
