/**
 * LOCALIZAR UNA CITA DENTRO DE UN TEXTO — extraído a `lib/` el 16/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ ESTO YA EXISTÍA, Y BIEN, DENTRO DE UN COMPONENTE. Vivía en
 * `components/improvement/useImprovementChat.ts`, un fichero `'use client'` con
 * React dentro, así que **el servidor no podía usarlo** — y el día que el
 * análisis de estilo necesitó lo mismo, se escribió otra vez peor.
 *
 * **EL CENSO DEL 16/09: CUATRO SITIOS NORMALIZABAN ESPACIOS PARA COMPARAR
 * TEXTO.**
 *
 *   1. este `findTolerant` — el bueno;
 *   2. `components/improvement/problems.ts`, con su propio `normalizeWhitespace`;
 *   3. `scripts/verificar-cli20.mjs`, arreglado el 15/09 porque falló;
 *   4. `lib/analysis/style-check.ts`, escrito el 16/09 **con un `indexOf` crudo**
 *      y por tanto ciego al 40 % de las citas, medido.
 *
 * ⚠️ Y LO QUE ESO ENSEÑA: el 15/09 se arregló este mismo fallo en el verificador
 * —con su comentario y todo— y al día siguiente se escribió otra vez en
 * producción. **La lección no es «acuérdate»: es que la corrección vivía en un
 * script suelto.** Lo aprendido en una herramienta no protege a la otra si no
 * comparten el código.
 *
 * ⚠️ LÍMITE DECLARADO: `verificar-cli20.mjs` es un `.mjs` suelto y **no puede
 * importar TypeScript**, así que conserva su propia normalización. Son dos, no
 * una — y queda escrito aquí para que nadie crea que el censo quedó en cero.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y LO QUE HACE ESTA FUNCIÓN MEJOR QUE CUALQUIER `indexOf` NORMALIZADO:
 * mantiene un MAPEO de vuelta a los índices del texto ORIGINAL. Colapsar
 * espacios para encontrar la cita es fácil; devolver dónde está **en el
 * documento de verdad** es lo que permite que el editor la señale. Un
 * desplazamiento sobre el texto normalizado no sirve para nada en pantalla.
 */
export function normalizeTypography(s: string): string {
  return s
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // comillas dobles curvas → "
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // comillas simples curvas / apóstrofes → '
    .replace(/[\u2013\u2014\u2212]/g, '-')                   // guiones largos / menos → -
    .replace(/\u00A0/g, ' ');                                // espacio no separable → espacio normal
}

export function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function findTolerant(text: string, find: string): { start: number; end: number } | null {
  if (!find) return null;

  // Normalizamos tipografía en ambos lados antes de cualquier comparación.
  // Mantenemos la longitud carácter a carácter (solo sustituimos 1↔1), así que
  // los índices que encontremos son válidos también sobre el texto original.
  const textNorm = normalizeTypography(text);
  const findNorm = normalizeTypography(find);

  const exact = textNorm.indexOf(findNorm);
  if (exact !== -1) return { start: exact, end: exact + findNorm.length };

  const normFind = normalizeWhitespace(findNorm);
  if (!normFind) return null;
  const mapping: number[] = [];
  let normText = '', lastSpace = false, started = false;
  for (let i = 0; i < textNorm.length; i++) {
    const ch = textNorm[i], isSp = /\s/.test(ch);
    if (isSp) {
      if (!started) continue;
      if (!lastSpace) { normText += ' '; mapping.push(i); lastSpace = true; }
    } else { normText += ch; mapping.push(i); lastSpace = false; started = true; }
  }
  while (normText.endsWith(' ')) { normText = normText.slice(0, -1); mapping.pop(); }
  const idx = normText.indexOf(normFind);
  if (idx !== -1) {
    const start = mapping[idx];
    const end = (mapping[idx + normFind.length - 1] ?? start) + 1;
    return { start, end };
  }
  if (normFind.length >= 30) {
    const head = normFind.slice(0, 15), tail = normFind.slice(-15);
    const h = normText.indexOf(head);
    if (h !== -1) {
      const t = normText.indexOf(tail, h + head.length);
      if (t !== -1) {
        const start = mapping[h];
        const end = (mapping[t + tail.length - 1] ?? start) + 1;
        if (end - start < find.length * 2.5) return { start, end };
      }
    }
  }
  return null;
}
