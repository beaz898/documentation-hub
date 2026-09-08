import { describe, it, expect } from 'vitest';
import { queHacerConLaEstructura } from './estructura-al-guardar';
import type { SituacionAlGuardar } from './estructura-al-guardar';
import { produceTablas } from '@/lib/chunking';

/**
 * LA DECISIÓN DE B.201, con sus tres salidas.
 *
 * Es lo único de este arreglo que tiene ramas, y por eso es lo único con
 * batería: el diálogo se ve al abrirlo; esta decisión no.
 */

const caso = (s: Partial<SituacionAlGuardar>): SituacionAlGuardar => ({
  produceTablas: false,
  hayEstructuraRecuperable: false,
  textoIntacto: false,
  aplanarConfirmado: false,
  ...s,
});

describe('queHacerConLaEstructura', () => {
  it('texto intacto y estructura a mano: se conserva, sin preguntar', () => {
    expect(queHacerConLaEstructura(caso({
      produceTablas: true, hayEstructuraRecuperable: true, textoIntacto: true,
    }))).toBe('conservar');
  });

  /** ⚠️ MITAD CONTRARIA: conservar gana AUNQUE se pudiera preguntar. Preguntar
   *  en el caso bueno es fricción sobre quien no tiene nada que decidir. */
  it('conservar manda sobre preguntar', () => {
    expect(queHacerConLaEstructura(caso({
      produceTablas: true, hayEstructuraRecuperable: true, textoIntacto: true,
      aplanarConfirmado: false,
    }))).not.toBe('preguntar');
  });

  it('texto editado sobre una hoja: se pregunta', () => {
    expect(queHacerConLaEstructura(caso({
      produceTablas: true, hayEstructuraRecuperable: true, textoIntacto: false,
    }))).toBe('preguntar');
  });

  /** Sin estructura a mano tampoco se puede conservar, aunque no se tocara. */
  it('hoja sin estructura recuperable: se pregunta igual', () => {
    expect(queHacerConLaEstructura(caso({
      produceTablas: true, hayEstructuraRecuperable: false, textoIntacto: true,
    }))).toBe('preguntar');
  });

  it('con el aviso ya aceptado, se aplana', () => {
    expect(queHacerConLaEstructura(caso({
      produceTablas: true, textoIntacto: false, aplanarConfirmado: true,
    }))).toBe('aplanar');
  });

  /**
   * ⚠️ MITAD CONTRARIA Y CASO MAYORITARIO: un documento de PROSA no tiene celdas
   * que perder. Un segmento de texto ES la respuesta correcta para él, y
   * preguntarle al usuario sería un aviso sobre algo que no va a pasar.
   */
  it('un documento de prosa se aplana sin preguntar nada', () => {
    expect(queHacerConLaEstructura(caso({
      produceTablas: false, textoIntacto: false,
    }))).toBe('aplanar');
  });

  it('prosa con el texto intacto y estructura: conserva', () => {
    expect(queHacerConLaEstructura(caso({
      produceTablas: false, hayEstructuraRecuperable: true, textoIntacto: true,
    }))).toBe('conservar');
  });

  /**
   * ⚠️ EL CASO QUE VIGILA QUE EL ARREGLO NO SEA DECORATIVO — B.201.
   *
   * `useIndexing` compone `"<nombre> (corregido dd/mm/aaaa)"`, así que la
   * extensión deja de ser la última y `produceTablas` sobre ESE nombre devuelve
   * `false`. Si la ruta decidiera con el nombre final, la guarda no se
   * dispararía NUNCA: verde, sin efecto, y una hoja aplanada en silencio igual
   * que antes del arreglo.
   *
   * No prueba la ruta —no hay batería de rutas aquí— pero fija el hecho del que
   * depende, y con el mensaje que hace falta leer el día que alguien lo cambie.
   */
  it('el nombre CORREGIDO ya no parece una hoja: por eso se decide con el original', () => {
    const original = 'OPE-11_tarifario-tratamientos-seguros.xlsx';
    const final = `${original} (corregido 09/09/2026)`;

    expect(produceTablas(original)).toBe(true);
    expect(
      produceTablas(final),
      'Si esto fuera `true`, decidir con el nombre final sería inofensivo y este ' +
      'caso sobraría. Es `false`: quien decida con el nombre final tendrá una ' +
      'guarda que no se dispara jamás.',
    ).toBe(false);
  });
});
