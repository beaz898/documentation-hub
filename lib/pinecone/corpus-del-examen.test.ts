import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildCorpusExacto } from './corpus-del-examen';
import { buildCorpusFilter, CORPUS_ACTIVO } from './vectors';

/**
 * EL CASO DECISIVO DEL CORPUS EXACTO (25/09/2026).
 *
 * La condición del director para que la función entre: «un test que pruebe que
 * con un corpus activo de N documentos y una lista de 8, sólo salen esos 8».
 * Está abajo, en el primer bloque, y con su MUTANTE al lado — el mismo universo
 * pasado por el filtro del producto, que deja salir los N.
 *
 * ⚠️ LO QUE ESTA BATERÍA **NO** PUEDE PROBAR, Y HAY QUE DECIRLO ANTES DE LEER UN
 * VERDE: que Pinecone honre `$in` como restricción. Eso es el contrato del
 * proveedor, necesita red, y el alcance de la suite la prohíbe. Lo que se prueba
 * aquí es lo que ESTA CASA controla: qué filtro construimos, y que no contiene
 * la puerta que lo abriría. Que el proveedor lo cumpla se verifica en la primera
 * pasada real del examen, que es una tanda.
 *
 * ⚠️ Y UNA TENSIÓN DECLARADA: el evaluador de abajo es una segunda
 * implementación del subconjunto del lenguaje de filtros que usamos, y dos
 * implementaciones del mismo criterio se separan sin avisar (`CLAUDE.md`). Se
 * acepta porque (1) vive sólo en este fichero y nadie de `lib/` lo importa,
 * (2) su único trabajo es hacer COMPARABLES los dos filtros sobre el mismo
 * universo, no imitar a Pinecone, y (3) si derivara, los casos estructurales del
 * segundo bloque siguen sujetando la línea por su cuenta.
 */

// ---------------------------------------------------------------------------
// El universo y el evaluador
// ---------------------------------------------------------------------------

interface DocumentoDelUniverso {
  documentId: string;
  analysisStatus: string;
}

/** Los cuatro operadores que aparecen en nuestros dos filtros, y ninguno más. */
function pasaElFiltro(doc: DocumentoDelUniverso, filtro: unknown): boolean {
  const f = filtro as Record<string, unknown>;

  if (Array.isArray(f.$or)) return f.$or.some(sub => pasaElFiltro(doc, sub));
  if (Array.isArray(f.$and)) return f.$and.every(sub => pasaElFiltro(doc, sub));

  return Object.entries(f).every(([campo, cond]) => {
    const valor = doc[campo as keyof DocumentoDelUniverso];
    const c = cond as Record<string, unknown>;
    if ('$eq' in c) return valor === c.$eq;
    if ('$in' in c) return (c.$in as unknown[]).includes(valor);
    if ('$ne' in c) return valor !== c.$ne;
    throw new Error(`operador no soportado por el evaluador: ${JSON.stringify(cond)}`);
  });
}

/** 44 documentos `analizado` —el corpus del piloto medido el 24/09— más los 8
 *  del examen, que están en `pendiente` porque el examen NO los promociona. */
const LOS_OCHO = [
  'NOR-10', 'CLI-12',   // P1 · prosa, cuatro contradicciones
  'NOR-11', 'CLI-13',   // P2 · prosa, tres superficies
  'OPE-10', 'OPE-11',   // P3 · tablas, tres montones
  'RRHH-08', 'OPE-13',  // P4 · sin clave, dos ramas
];

const UNIVERSO: DocumentoDelUniverso[] = [
  ...Array.from({ length: 44 }, (_, i) => ({
    documentId: `piloto-${i}`,
    analysisStatus: 'analizado',
  })),
  ...LOS_OCHO.map(id => ({ documentId: id, analysisStatus: 'pendiente' })),
];

function seleccionados(filtro: unknown): string[] {
  return UNIVERSO.filter(d => pasaElFiltro(d, filtro)).map(d => d.documentId);
}

// ---------------------------------------------------------------------------

describe('el caso decisivo: 44 activos y una lista de 8', () => {
  it('con buildCorpusExacto salen EXACTAMENTE los 8, y ni uno del corpus activo', () => {
    const salen = seleccionados(buildCorpusExacto(LOS_OCHO));

    expect(salen).toHaveLength(8);
    expect([...salen].sort()).toEqual([...LOS_OCHO].sort());
    expect(salen.filter(id => id.startsWith('piloto-'))).toEqual([]);
  });

  it('⚠️ EL MUTANTE — el filtro del PRODUCTO, mismo universo, deja salir los 52', () => {
    // Es la razón de existir de la función nueva. Si algún día este caso y el de
    // arriba dieran lo mismo, uno de los dos filtros habría dejado de hacer su
    // trabajo, y el examen estaría midiendo contra el piloto entero sin decirlo.
    const salen = seleccionados(buildCorpusFilter(LOS_OCHO));

    expect(salen).toHaveLength(52);          // 44 analizados + los 8 declarados
    expect(salen).toContain('piloto-0');
    expect(salen).toContain('NOR-10');
  });

  it('un documento del piloto NO entra por estar analizado: el examen no lo nombra', () => {
    const activo = { documentId: 'piloto-7', analysisStatus: 'analizado' };
    expect(pasaElFiltro(activo, buildCorpusExacto(LOS_OCHO))).toBe(false);
    expect(pasaElFiltro(activo, buildCorpusFilter(LOS_OCHO))).toBe(true);
  });

  it('el estado del documento es IRRELEVANTE para el corpus exacto', () => {
    // Los ocho no se promocionan para el examen, así que llegan en 'pendiente'.
    // Y si alguno estuviera 'analizado' o 'desactualizado', debe entrar igual:
    // lo que decide es que el caso lo declare, no su estado.
    for (const estado of ['pendiente', 'analizado', 'en_analisis', 'desactualizado']) {
      expect(pasaElFiltro({ documentId: 'NOR-10', analysisStatus: estado },
        buildCorpusExacto(LOS_OCHO))).toBe(true);
    }
  });
});

describe('la forma del filtro: la ausencia es la función', () => {
  const FILTRO = JSON.stringify(buildCorpusExacto(LOS_OCHO));

  it('no menciona analysisStatus por ninguna parte', () => {
    // Si alguien añade CORPUS_ACTIVO «por simetría» con buildCorpusFilter, el
    // examen vuelve a medir contra los 44 y el número de hallazgos seguiría
    // pareciendo plausible. Este caso convierte la ausencia en una decisión.
    expect(FILTRO).not.toContain('analysisStatus');
    expect(FILTRO).not.toContain(Object.keys(CORPUS_ACTIVO)[0]);
  });

  it('no tiene ninguna puerta: sin $or y sin $and', () => {
    expect(FILTRO).not.toContain('$or');
    expect(FILTRO).not.toContain('$and');
  });

  it('es exactamente un documentId con $in, y nada más', () => {
    const f = buildCorpusExacto(LOS_OCHO) as Record<string, Record<string, unknown>>;
    expect(Object.keys(f)).toEqual(['documentId']);
    expect(Object.keys(f.documentId)).toEqual(['$in']);
  });

  it('la lista es una COPIA: mutar el array del llamador no mueve el corpus', () => {
    const ids = ['a', 'b'];
    const filtro = buildCorpusExacto(ids) as { documentId: { $in: string[] } };
    ids.push('c');
    expect(filtro.documentId.$in).toEqual(['a', 'b']);
  });
});

describe('la lista vacía se rompe, y no devuelve un corpus vacío', () => {
  it('lanza en vez de construir un filtro que no puede casar con nada', () => {
    // Un `$in: []` daría cero candidatos, y el informe escribiría «no detectó
    // nada»: un cero de montaje disfrazado de cero de detección.
    expect(() => buildCorpusExacto([])).toThrow(/lista de ids vacía/);
  });

  it('⚠️ CONTROL POSITIVO — con un solo id NO lanza', () => {
    // Sin esta mitad, la guarda podría estar lanzando siempre y el caso de
    // arriba pasaría igual.
    expect(() => buildCorpusExacto(['NOR-10'])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// El censo de importadores — la cláusula (a) del director, con mecanismo
// ---------------------------------------------------------------------------

/** Todos los `.ts`/`.tsx` de los cuatro árboles donde vive código. */
function ficherosDeCodigo(): string[] {
  const raices = ['app', 'lib', 'components', 'worker'];
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    for (const entrada of readdirSync(dir)) {
      if (entrada === 'node_modules' || entrada.startsWith('.')) continue;
      const ruta = join(dir, entrada);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.tsx?$/.test(entrada)) salida.push(ruta.replace(/\\/g, '/'));
    }
  };
  for (const r of raices) recorrer(r);
  return salida;
}

/** Quién importa un símbolo, por CAPACIDAD (la línea de import), no por nombre
 *  de fichero. Excluye los `.test.ts`, que no son caminos de producto. */
function importadoresDe(simbolo: string): string[] {
  return ficherosDeCodigo()
    .filter(f => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
    .filter(f => new RegExp(`import[^;]*\\b${simbolo}\\b[^;]*from`, 's').test(readFileSync(f, 'utf8')));
}

describe('quién puede usar el corpus exacto', () => {
  /** Los únicos caminos autorizados. El endpoint del examen todavía no existe:
   *  figura aquí para que el día que se escriba, este caso no haya que tocarlo. */
  const AUTORIZADOS = ['app/api/admin/examen/route.ts'];

  it('⚠️ CONTROL POSITIVO — el censo SÍ ve imports cuando los hay', () => {
    // Sin esta mitad, el caso de abajo daría verde con un censo ciego: es
    // exactamente B.126, un test que no puede fallar por la razón que vigila.
    const delProducto = importadoresDe('buildCorpusFilter');
    expect(delProducto).toContain('lib/analysis/retrieval.ts');
    expect(delProducto).toContain('app/api/admin/vecindario/route.ts');
  });

  it('ningún camino de usuario importa buildCorpusExacto', () => {
    const intrusos = importadoresDe('buildCorpusExacto').filter(f => !AUTORIZADOS.includes(f));
    expect(intrusos, `importadores no autorizados: ${intrusos.join(', ')}`).toEqual([]);
  });

  it('tampoco por la ruta del módulo, que es la otra forma de llegar', () => {
    const porRuta = ficherosDeCodigo()
      .filter(f => !f.endsWith('.test.ts') && f !== 'lib/pinecone/corpus-del-examen.ts')
      .filter(f => readFileSync(f, 'utf8').includes('corpus-del-examen'))
      .filter(f => !AUTORIZADOS.includes(f));
    expect(porRuta, `tocan el módulo sin autorización: ${porRuta.join(', ')}`).toEqual([]);
  });
});
