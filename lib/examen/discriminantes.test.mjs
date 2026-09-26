import { describe, expect, it } from 'vitest';

import {
  MEDIBLE,
  NO_MEDIBLE,
  SIN_FRAGMENTOS,
  verificarDiscriminantesEnFragmentos,
} from './discriminantes.mjs';

/**
 * LA BATERÍA DEL VERIFICADOR DE DISCRIMINANTES.
 *
 * ⚠️ POR QUÉ ESTA BATERÍA ES LA QUE IMPORTA MÁS DE TODO EL EXAMEN: el
 * verificador es lo que decide si un caso se puede medir. Si él se equivoca, el
 * marcador entero mide otra cosa y **nadie se enteraría**, porque un
 * `NO_MEDIBLE` que no salta se lee como un caso sano.
 *
 * Y por eso cada comprobación va con su CONTROL POSITIVO: no basta con que cace
 * el caso malo, hay que demostrar que no lo cazaría siempre. Es la lección de
 * B.126, un test que no podía fallar por la razón que vigilaba.
 *
 * Los fixtures son cortos y a mano, no del corpus, y es deliberado: lo que se
 * prueba aquí es la ARITMÉTICA de las costuras. El corpus se prueba en una
 * tanda.
 */

const frag = (chunkIndex, text) => ({ chunkIndex, text });

/** Un caso mínimo con un solo discriminante por lado. */
function casoCon(dA, dB) {
  return {
    id: 'T', nivel: 'juez-prosa',
    analizado: 'A.docx', corpusExacto: ['B.docx'],
    debenSalir: [{
      id: 'T-1',
      citaEnElAnalizado: { discriminante: dA },
      citaEnElCorpus: { discriminante: dB },
    }],
  };
}

describe('integridad: la frase tiene que caber en UN fragmento', () => {
  it('MEDIBLE cuando cada frase está entera en su documento y no en el otro', () => {
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico responde', 'el Coordinador de Calidad decide'),
      {
        'A.docx': [frag(0, 'blah el Director Clínico responde de todo'), frag(1, 'otra cosa')],
        'B.docx': [frag(0, 'aquí el Coordinador de Calidad decide y punto')],
      },
    );
    expect(r.estado).toBe(MEDIBLE);
    expect(r.fallos).toEqual([]);
    expect(r.comprobados).toBe(2);
  });

  it('⚠️ NO_MEDIBLE y nombra LA COSTURA cuando la frase está partida', () => {
    // Es el caso exacto que Fable señaló: la frase existe en el documento pero
    // ningún fragmento la contiene entera.
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico responde', 'irrelevante'),
      {
        'A.docx': [
          frag(7, 'texto previo y el Director Clínico'),
          frag(8, ' responde de todo lo demás'),
        ],
        'B.docx': [frag(0, 'irrelevante')],
      },
    );
    expect(r.estado).toBe(NO_MEDIBLE);
    const partido = r.fallos.find(f => f.tipo === 'PARTIDO_POR_UNA_COSTURA');
    expect(partido).toBeDefined();
    // Las tres cosas que el director pidió en el mensaje: qué frase, qué
    // documento, entre qué dos fragmentos.
    expect(partido.frase).toContain('el Director Clínico responde');
    expect(partido.documento).toBe('A.docx');
    expect(partido.entre).toEqual([7, 8]);
    expect(partido.mensaje).toContain('PARTIDA');
    expect(partido.mensaje).toContain('entre los fragmentos 7 y 8');
    // ⚠️ Y dice que NO es culpa del sistema, que es lo que evita que alguien
    // vaya a «arreglar» el pipeline por esto.
    expect(partido.mensaje).toContain('NO es un fallo del sistema');
  });

  it('⚠️ CONTROL POSITIVO de la costura — con los MISMOS fragmentos unidos, es MEDIBLE', () => {
    // Sin esta mitad, el buscador de costuras podría estar marcando siempre.
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico responde', 'irrelevante'),
      {
        'A.docx': [frag(7, 'texto previo y el Director Clínico responde de todo lo demás')],
        'B.docx': [frag(0, 'irrelevante')],
      },
    );
    expect(r.estado).toBe(MEDIBLE);
  });

  it('distingue PARTIDO de AUSENTE, y son dos arreglos distintos', () => {
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('una frase que no está en ninguna parte', 'irrelevante'),
      { 'A.docx': [frag(0, 'nada que ver'), frag(1, 'tampoco')], 'B.docx': [frag(0, 'irrelevante')] },
    );
    expect(r.estado).toBe(NO_MEDIBLE);
    const f = r.fallos.find(x => x.id === 'T-1' && x.lado === 'analizado');
    expect(f.tipo).toBe('AUSENTE');
    // ⚠️ Y el mensaje dice lo que de verdad importa: esto invalida la LÍNEA DE
    // BASE, no sólo el caso. Si el documento cambió, todo lo medido sobre él
    // deja de ser comparable.
    expect(f.mensaje).toContain('invalidan la línea de base');
  });

  it('⚠️ aparecer en DOS fragmentos NO es fallo: son los 200 caracteres de solape', () => {
    // La intuición dice que «dos veces» es malo. Con solape es lo normal, y el
    // juez puede citarla desde cualquiera de los dos. Este caso convierte esa
    // tolerancia en una decisión escrita.
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('frase en la zona de solape', 'irrelevante'),
      {
        'A.docx': [
          frag(0, 'cola del primero con frase en la zona de solape'),
          frag(1, 'frase en la zona de solape y sigue el segundo'),
        ],
        'B.docx': [frag(0, 'irrelevante')],
      },
    );
    expect(r.estado).toBe(MEDIBLE);
  });
});

describe('el mismo criterio que el marcador: normalize, no includes exacto', () => {
  it('⚠️ CASO DECISIVO — una frase partida por un SALTO DE LÍNEA de la maquetación es MEDIBLE', () => {
    // Es el falso 1/5 del 25/09: con `includes` exacto salía AUSENTE estando
    // en el documento. El marcador la emparejaría, así que abortarla era
    // declarar no medible un caso que sí lo es.
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico responde', 'el Coordinador decide'),
      {
        'A.docx': [frag(0, 'y aquí el Director\n  Clínico responde de todo')],
        'B.docx': [frag(0, 'EL COORDINADOR DECIDE.')],
      },
    );
    expect(r.estado).toBe(MEDIBLE);
  });

  it('⚠️ CONTROL POSITIVO — normalizar no vuelve MEDIBLE lo que no está', () => {
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico responde', 'el Coordinador decide'),
      {
        'A.docx': [frag(0, 'y aquí el Director Médico responde de todo')],
        'B.docx': [frag(0, 'el coordinador decide')],
      },
    );
    expect(r.estado).toBe(NO_MEDIBLE);
    expect(r.fallos[0].tipo).toBe('AUSENTE');
  });

  it('el aislamiento también normaliza: la frase en el otro con otra caja NO aísla', () => {
    // Si el aislamiento siguiera exacto, una cita del otro documento con otra
    // caja satisfaría la expectativa en el marcador sin que aquí saltara nada.
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico', 'otra cosa'),
      {
        'A.docx': [frag(0, 'aquí el Director Clínico manda')],
        'B.docx': [frag(3, 'pero EL DIRECTOR CLÍNICO no manda'), frag(4, 'otra cosa')],
      },
    );
    expect(r.estado).toBe(NO_MEDIBLE);
    expect(r.fallos.find(x => x.tipo === 'NO_AISLA')).toBeDefined();
  });
});

describe('aislamiento: la frase no puede estar en el otro documento', () => {
  it('⚠️ NO_MEDIBLE cuando la frase aparece también en el otro, y dice dónde', () => {
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico', 'otra cosa'),
      {
        'A.docx': [frag(0, 'aquí el Director Clínico manda')],
        // La misma frase en el candidato: una cita de B podría satisfacer la
        // expectativa de A y el marcador saldría verde por casualidad.
        'B.docx': [frag(3, 'pero el Director Clínico no manda'), frag(4, 'otra cosa')],
      },
    );
    expect(r.estado).toBe(NO_MEDIBLE);
    const f = r.fallos.find(x => x.tipo === 'NO_AISLA');
    expect(f.tambienEn).toEqual({ documento: 'B.docx', fragmentos: [3] });
    expect(f.mensaje).toContain('verde por casualidad');
  });

  it('⚠️ CONTROL POSITIVO del aislamiento — quitando la frase del otro, es MEDIBLE', () => {
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('el Director Clínico', 'otra cosa'),
      {
        'A.docx': [frag(0, 'aquí el Director Clínico manda')],
        'B.docx': [frag(3, 'pero aquí no manda'), frag(4, 'otra cosa')],
      },
    );
    expect(r.estado).toBe(MEDIBLE);
  });
});

describe('los NO esperados también se comprueban', () => {
  it('un discriminante de noDebenSalir partido deja el caso NO MEDIBLE', () => {
    // ⚠️ Es la mitad que se olvida: los falsos conocidos de N1 se emparejan por
    // discriminante igual que los aciertos. Si el de un falso está partido, el
    // examen no podría reconocerlo si apareciera — y contaría como «no salió»,
    // que es lo contrario de lo que pasó.
    const caso = {
      id: 'T', nivel: 'precision-y-cobertura',
      analizado: 'A.docx', corpusExacto: ['B.docx'],
      debenSalir: [],
      noDebenSalir: [{
        id: 'T-FALSO',
        citaEnElAnalizado: { discriminante: 'Fecha evaluación: 2026-06-11' },
        citaEnElCorpus: { discriminante: 'Horas semana: 8' },
      }],
    };
    const r = verificarDiscriminantesEnFragmentos(caso, {
      'A.docx': [frag(0, 'algo Fecha evaluación:'), frag(1, ' 2026-06-11 y sigue')],
      'B.docx': [frag(0, 'Horas semana: 8')],
    });
    expect(r.estado).toBe(NO_MEDIBLE);
    expect(r.fallos[0].id).toBe('T-FALSO');
    expect(r.fallos[0].entre).toEqual([0, 1]);
  });

  it('los que no llevan discriminante se saltan sin contarse', () => {
    // El falso de Nuria Ferrer entra en N1 sin citas, declarado NO COMPROBABLE.
    // No debe bloquear el caso ni inflar el recuento.
    const caso = {
      id: 'T', nivel: 'precision-y-cobertura',
      analizado: 'A.docx', corpusExacto: ['B.docx'],
      debenSalir: [],
      noDebenSalir: [{ id: 'T-SIN-CITA', citaEnElAnalizado: null, citaEnElCorpus: null }],
    };
    const r = verificarDiscriminantesEnFragmentos(caso, { 'A.docx': [frag(0, 'x')], 'B.docx': [frag(0, 'y')] });
    expect(r.estado).toBe(MEDIBLE);
    expect(r.comprobados).toBe(0);
  });
});

describe('SIN_FRAGMENTOS es un estado propio, y no se funde con NO_MEDIBLE', () => {
  it('si falta un documento entero, lo dice y no culpa a las frases', () => {
    // ⚠️ Fundir los dos mandaría a arreglar discriminantes cuando el problema
    // es que el documento no está indexado. Son dos arreglos distintos y dos
    // personas distintas: uno lo arregla Claude, el otro el director.
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('lo que sea', 'lo que sea'),
      { 'A.docx': [frag(0, 'lo que sea')] },   // falta B.docx
    );
    expect(r.estado).toBe(SIN_FRAGMENTOS);
    expect(r.fallos[0].documento).toBe('B.docx');
    expect(r.fallos[0].mensaje).toContain('indexado');
    expect(r.comprobados).toBe(0);
  });

  it('⚠️ CONTROL POSITIVO — con los dos documentos presentes NO devuelve SIN_FRAGMENTOS', () => {
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('lo que sea', 'tanto da'),
      { 'A.docx': [frag(0, 'lo que sea')], 'B.docx': [frag(0, 'tanto da')] },
    );
    expect(r.estado).toBe(MEDIBLE);
  });

  it('una lista VACÍA de fragmentos no es lo mismo que ausente', () => {
    // Un documento indexado con cero trozos existe pero no es recuperable. El
    // array está, así que no es SIN_FRAGMENTOS: es AUSENTE del discriminante, y
    // el mensaje apunta a que el documento cambió. Es la distinción de
    // «vacío no es ausente» (F-93, cuarta pieza).
    const r = verificarDiscriminantesEnFragmentos(
      casoCon('lo que sea', 'tanto da'),
      { 'A.docx': [], 'B.docx': [frag(0, 'tanto da')] },
    );
    expect(r.estado).toBe(NO_MEDIBLE);
    expect(r.fallos[0].tipo).toBe('AUSENTE');
  });
});
