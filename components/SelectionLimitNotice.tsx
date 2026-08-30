'use client';

export interface SelectionLimitItem {
  documentName: string;
  sheetName: string | null;
  tableId: string;
  rowsLeftOut: number;
  rowsRecovered: number;
}

/**
 * Aviso de ALCANCE del análisis (F-74 P2).
 *
 * Se pinta cuando el reparto por unidades dejó filas de una tabla fuera del
 * prompt por tamaño. No es un hallazgo sobre el documento del cliente: es una
 * nota sobre qué NO se llegó a comparar — el mismo error que F-71 corrigió al
 * retirar el overlap sintético «No se pudo emitir juicio», que presentaba un
 * estado del sistema como si fuera un problema del documento. Por eso no pasa
 * por problemsFromAnalysis ni se convierte en Problem.
 *
 * SEPARADO de IncompleteAnalysisNotice a propósito, aunque los dos sean avisos
 * arriba del todo. Dicen cosas distintas y piden cosas distintas:
 *
 *   Incompleto → el análisis FALLÓ, no costó créditos, «vuelve a lanzarlo».
 *   Alcance    → el análisis se hizo ENTERO, se cobró, y volver a lanzarlo NO
 *                cambiaría nada: el recorte es nuestro, no del proveedor.
 *
 * Fundirlos en uno obligaría a decirle «vuelve a lanzarlo» a quien topó con el
 * presupuesto, o sea a mandarle a pagar otra vez por el mismo recorte.
 *
 * NO dice que las filas fueran interesantes, porque no se sabe: distinguir una
 * fila discrepante de una ajena exige el predicado de F-65, que aún no está
 * implementado (ver B.104). Afirmarlo sería prometer de más; callarlo del todo
 * sería el fallo invisible que este aviso existe para convertir en límite
 * declarado.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * DESDE B.122 (30/08) DECLARA MENOS, Y POR ESO VUELVE A SER VERDAD.
 *
 * El diff de tablas NO pasa por el presupuesto del prompt —lee los chunks
 * enteros— así que las tablas que compara quedan miradas celda a celda, que es
 * MÁS de lo que hace el juez. Esas tablas se RESTAN del alcance antes de
 * llegar aquí (`restarTablasCubiertas`, lib/analysis/alcance.ts), y la resta
 * es POR TABLA: las filas de otras tablas del mismo documento siguen sin mirar
 * y este aviso las sigue cubriendo.
 *
 * Lo que queda, por tanto, es lo que NADIE miró — y decirlo ya no es una
 * promesa de más sobre nuestra propia incompetencia. El arreglo fue la resta,
 * no la redacción; la redacción solo se comprimió a una línea porque ocupaba
 * demasiado en una pantalla donde el chat es la otra mitad útil.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * En castellano, sin next-intl, como sus vecinos de la bandeja. En
 * AnalysisModal se envuelve con su propia traducción.
 */
export default function SelectionLimitNotice({ limits }: { limits?: SelectionLimitItem[] }) {
  if (!limits || limits.length === 0) return null;

  return (
    <div
      role="note"
      style={{
        padding: '6px 10px',
        borderRadius: 6,
        marginBottom: 8,
        background: 'var(--warning-light)',
        border: '0.5px solid var(--warning)',
      }}
    >
      {limits.map((l, i) => (
        <p
          key={`${l.documentName}-${l.tableId}-${i}`}
          style={{ fontSize: 11, color: 'var(--warning-text)', margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}
        >
          <strong>Alcance:</strong> {l.rowsLeftOut} de {l.rowsRecovered} filas de{' '}
          {l.sheetName ? `la hoja "${l.sheetName}"` : 'una tabla'} de {l.documentName}{' '}
          quedaron fuera por tamano y no se han revisado. Relanzarlo no lo cambia.
        </p>
      ))}
    </div>
  );
}
