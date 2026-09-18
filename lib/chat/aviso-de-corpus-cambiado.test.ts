import { describe, it, expect } from 'vitest';
import {
  avisoDeCorpusCambiado,
  hayRespuestaEnLaConversacion,
  type CambioEnElCorpus,
} from './aviso-de-corpus-cambiado';

/**
 * B.221 — el aviso de corpus cambiado.
 *
 * ⚠️ LOS DOS CASOS QUE DE VERDAD DECIDEN, y están abajo con su nombre:
 * · que el aviso NO salga en un chat sin respuestas (un aviso que sale siempre es
 *   tan inútil como uno que no sale nunca);
 * · que NINGÚN texto afirme que la respuesta anterior CITA lo que cambió — el
 *   sistema no puede saberlo, así que dice «puede».
 */

/** Una respuesta de verdad: lleva la `question` que la originó. */
const RESPUESTA = { role: 'assistant', question: '¿qué dice el contrato?' };
/** Un aviso de documento: mismo rol, SIN pregunta. No es una respuesta. */
const AVISO_DE_DOCUMENTO = { role: 'assistant' };
const PREGUNTA = { role: 'user' };

const CONVERSACION = [PREGUNTA, RESPUESTA];

describe('cuándo hay algo que pueda estar caducado', () => {
  it('una conversación con respuesta sí lo tiene', () => {
    expect(hayRespuestaEnLaConversacion(CONVERSACION)).toBe(true);
  });

  it('⚠️ un «Documento X indexado» NO cuenta como respuesta, aunque lleve el mismo rol', () => {
    expect(hayRespuestaEnLaConversacion([AVISO_DE_DOCUMENTO])).toBe(false);
    expect(hayRespuestaEnLaConversacion([])).toBe(false);
  });
});

describe('el texto, por lo que le pasó al corpus', () => {
  it('borrado: nombra el documento y dice que puede citar lo que ya no existe', () => {
    const texto = avisoDeCorpusCambiado({ forma: 'borrado', nombre: 'CONTRATO-02' }, true);
    expect(texto).toContain('se ha borrado «CONTRATO-02»');
    expect(texto).toContain('**puede** citar contenido que ya no existe');
    expect(texto).toContain('Limpiar chat');
  });

  it('reemplazo: habla de la versión anterior, no de un borrado', () => {
    const texto = avisoDeCorpusCambiado({ forma: 'reemplazado', nombre: 'TARIFAS' }, true);
    expect(texto).toContain('se ha reemplazado «TARIFAS» por una versión nueva');
    expect(texto).toContain('con la versión anterior');
    expect(texto).not.toContain('se ha borrado');
  });

  it('añadido: no habla de contenido perdido, sino de respuestas incompletas', () => {
    const texto = avisoDeCorpusCambiado({ forma: 'anadido', nombre: 'TARIFAS-2026' }, true);
    expect(texto).toContain('se ha añadido «TARIFAS-2026»');
    expect(texto).toContain('**pueden** estar incompletas');
    expect(texto).not.toContain('ya no existe');
  });

  it('sync que quitó o cambió algo: gana el aviso de lo que ya no existe', () => {
    const texto = avisoDeCorpusCambiado(
      { forma: 'sincronizado', nuevos: 3, actualizados: 0, borrados: 1 }, true,
    );
    expect(texto).toContain('cambiado o quitado 1 documento');
    expect(texto).toContain('ya no existe');
  });

  it('sync que sólo añadió: el aviso suave', () => {
    const texto = avisoDeCorpusCambiado(
      { forma: 'sincronizado', nuevos: 2, actualizados: 0, borrados: 0 }, true,
    );
    expect(texto).toContain('ha añadido 2 documentos');
    expect(texto).toContain('**pueden** estar incompletas');
  });
});

describe('⚠️ cuándo NO se avisa', () => {
  const TODOS: CambioEnElCorpus[] = [
    { forma: 'anadido', nombre: 'X' },
    { forma: 'reemplazado', nombre: 'X' },
    { forma: 'borrado', nombre: 'X' },
    { forma: 'sincronizado', nuevos: 1, actualizados: 1, borrados: 1 },
  ];

  it('sin ninguna respuesta en la conversación, ninguna forma avisa', () => {
    for (const cambio of TODOS) {
      expect(avisoDeCorpusCambiado(cambio, false), `${cambio.forma} avisó sin conversación`).toBeNull();
    }
  });

  it('un sync sin cambios no cambió el corpus, así que no avisa', () => {
    expect(avisoDeCorpusCambiado(
      { forma: 'sincronizado', nuevos: 0, actualizados: 0, borrados: 0 }, true,
    )).toBeNull();
  });
});

describe('⚠️ NINGÚN texto afirma una causa que el sistema no conoce', () => {
  it('nunca dice que la respuesta anterior CITA lo que cambió: dice que puede', () => {
    const textos = [
      avisoDeCorpusCambiado({ forma: 'borrado', nombre: 'X' }, true),
      avisoDeCorpusCambiado({ forma: 'reemplazado', nombre: 'X' }, true),
      avisoDeCorpusCambiado({ forma: 'anadido', nombre: 'X' }, true),
      avisoDeCorpusCambiado({ forma: 'sincronizado', nuevos: 0, actualizados: 1, borrados: 0 }, true),
      avisoDeCorpusCambiado({ forma: 'sincronizado', nuevos: 1, actualizados: 0, borrados: 0 }, true),
    ];

    for (const texto of textos) {
      expect(texto).not.toBeNull();
      // La afirmación prohibida, en las formas en que se escribiría.
      expect(texto).not.toMatch(/\bcitan?\b(?!\s)/);
      expect(texto).not.toContain('está citando');
      // Y la permitida, presente en todos.
      expect(texto).toMatch(/\bpuede n?\b|\*\*puede\*\*|\*\*pueden\*\*/);
    }
  });
});
