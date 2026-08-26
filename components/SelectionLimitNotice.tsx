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
 * En castellano, sin next-intl, como sus vecinos de la bandeja. En
 * AnalysisModal se envuelve con su propia traducción.
 */
export default function SelectionLimitNotice({ limits }: { limits?: SelectionLimitItem[] }) {
  if (!limits || limits.length === 0) return null;

  return (
    <div
      role="note"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        marginBottom: 10,
        background: 'var(--warning-light)',
        border: '0.5px solid var(--warning)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning-text)', margin: '0 0 3px 0' }}>
        Alcance del analisis
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {limits.map((l, i) => (
          <li
            key={`${l.documentName}-${l.tableId}-${i}`}
            style={{ fontSize: 11, color: 'var(--warning-text)', lineHeight: 1.45, wordBreak: 'break-word' }}
          >
            {l.rowsLeftOut} de {l.rowsRecovered} filas de{' '}
            {l.sheetName ? `la hoja "${l.sheetName}"` : 'una tabla'} de {l.documentName}{' '}
            no se han comparado por tamano.
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 11, color: 'var(--warning-text)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
        Volver a lanzarlo no cambiaria el resultado: el limite es del tamano del analisis, no un fallo.
      </p>
    </div>
  );
}
