import { describe, it, expect } from 'vitest';
import { cortarALosMasAfines } from './corte-de-recuperacion';
import { MAX_CANDIDATOS_DE_RECUPERACION } from './retrieval';

/**
 * EL CASO DECISIVO DEL CORTE DE 25 — B.248, primer tiempo (17/09/2026).
 *
 * ⚠️ POR QUÉ SE IMPORTA LA CONSTANTE REAL y no se copia el número: el caso
 * decisivo existe para que CAMBIAR LA CONSTANTE rompa algo. Con un 25 copiado
 * aquí, alguien movería el de `retrieval.ts` y esta batería seguiría en verde. Es
 * la regla que salió de F-108.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ ESTE FICHERO TENÍA DOS BATERÍAS MÁS, Y MURIERON CON EL UMBRAL (23/09/2026):
 *
 *   · «EL CASO DECISIVO DEL UMBRAL — mover el 0,50 tiene que romper esto», con
 *     sus tres casos: 0,49 fuera / 0,51 dentro para el rápido, 0,44 / 0,46 para
 *     el exhaustivo, y el borde exacto dentro («como mínimo», no «más que»).
 *   · «el contador cuenta DOCUMENTOS perdidos, no fragmentos», con sus tres.
 *
 * **Se van porque se va lo que vigilaban, y eso es lo correcto**: un caso que
 * sobrevive a su objeto se convierte en un caso que no puede fallar, y un caso
 * que no puede fallar es peor que ninguno — ocupa sitio en el verde y no vigila
 * nada. F-113 lo dijo con nombre propio: «el test 0,49/0,51 muere junto con
 * `pasaElUmbral`».
 *
 * ⚠️ QUEDA CONSTANCIA DE LO QUE PROBABAN porque el día que alguien reinstaure un
 * corte —y F-113 dice que si vuelve, vuelve RELATIVO— esto es la forma que tenía
 * su caso decisivo, y no habrá que inventarla otra vez.
 * ═══════════════════════════════════════════════════════════════════════════
 */

describe('⚠️ EL CASO DECISIVO DEL CORTE DE 25 — mover el tope tiene que romper esto', () => {
  const candidatos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i, maxScore: 1 - i / 100 }));

  it('uno más que el tope: queda exactamente el tope, y se cuenta UN cortado', () => {
    const r = cortarALosMasAfines(candidatos(MAX_CANDIDATOS_DE_RECUPERACION + 1), MAX_CANDIDATOS_DE_RECUPERACION);
    expect(r.candidatos).toHaveLength(25);
    expect(r.cortados).toBe(1);
  });

  it('se quedan los MÁS afines, y cae el menos afín', () => {
    const lista = candidatos(26).reverse();
    const r = cortarALosMasAfines(lista, MAX_CANDIDATOS_DE_RECUPERACION);
    expect(r.candidatos.map(c => c.id)).not.toContain(25);
    expect(r.candidatos[0].id).toBe(0);
  });

  it('por debajo del tope no corta nada, y el cero se escribe igual', () => {
    const r = cortarALosMasAfines(candidatos(3), MAX_CANDIDATOS_DE_RECUPERACION);
    expect(r.candidatos).toHaveLength(3);
    expect(r.cortados).toBe(0);
  });

  /**
   * ⚠️ Y ES RELATIVO, QUE ES LO QUE LO DISTINGUE DEL UMBRAL RETIRADO: el corte no
   * compara contra ningún número absoluto. Con TODOS los candidatos a un score
   * bajísimo sigue quedándose con los mejores en vez de dejar cero — así que
   * ningún cambio de escala del modelo puede vaciarlo, que es exactamente lo que
   * un 0,50 absoluto sí podía hacer.
   */
  it('⚠️ con todos los scores por el suelo NO deja cero: el corte es relativo', () => {
    const bajos = Array.from({ length: 30 }, (_, i) => ({ id: i, maxScore: 0.01 - i / 10000 }));
    const r = cortarALosMasAfines(bajos, MAX_CANDIDATOS_DE_RECUPERACION);
    expect(r.candidatos).toHaveLength(25);
    expect(r.cortados).toBe(5);
  });
});
