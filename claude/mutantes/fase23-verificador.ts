import type { Definicion } from '../herramientas/mutar';

// 3.4, fases 2+3: los mutantes del verificador. node claude/herramientas/mutar-cli.mts claude/mutantes/fase23-verificador.ts
export const definicion: Definicion = {
  fichero: 'lib/analysis/verify-findings.ts',
  arnes: 'lib/analysis/rama-de-las-reglas.test.ts',
  proyecto: 'suite',
  tests: 7,
  mutantes: [
    { nombre: 'la rama va siempre, también sin marcas', ancla: 'const rama = batch.some(f => f.conflictoNormativo) ? ', cambio: 'const rama = true ? ' },
    { nombre: 'la rama no va nunca', ancla: 'const rama = batch.some(f => f.conflictoNormativo) ? ', cambio: 'const rama = false ? ' },
    { nombre: 'la marca va en todos los hallazgos', ancla: 'const marca = finding.conflictoNormativo ? ', cambio: "const marca = true ? '' + " },
    { nombre: 'el confirmado marcado se queda con la severidad del modelo', ancla: "finding.conflictoNormativo || raw.severity === 'contradiction'", cambio: "raw.severity === 'contradiction'" },
    { nombre: 'cumplibles_a_la_vez no es un veredicto válido', ancla: "'sin_relacion', 'cumplibles_a_la_vez'];", cambio: "'sin_relacion'];" },
    { nombre: 'sin el desglose por especie', ancla: 'if (outcome.discardKey && especie) bump(', cambio: 'if (false) bump(' },
  ],
};
