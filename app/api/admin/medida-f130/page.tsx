'use client';
import { useState } from 'react';

/**
 * LA PÁGINA DE LAS DOS MEDIDAS TEMPORALES DE F-130 (29/10/2026). Dos botones y el JSON de vuelta, para copiarlo y
 * pegarlo. Temporal como toda la carpeta (cabecera de `medida-f130.ts`): se borra con ella.
 */
export default function MedidaF130() {
  const [salida, setSalida] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function medir(ruta: 'vecindad' | 'pregunta') {
    setOcupado(true);
    setSalida(`Midiendo ${ruta}…`);
    try {
      const res = await fetch(`/api/admin/medida-f130/${ruta}`, { method: 'POST', credentials: 'include' });
      const cuerpo = await res.json().catch(() => ({ error: 'la respuesta no es JSON' }));
      setSalida(JSON.stringify({ estadoHttp: res.status, ...cuerpo }, null, 2));
    } catch (err) {
      setSalida(`Error de red: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      <h1>Medidas temporales de F-130</h1>
      <p>Herramienta de medida, no producto. Se borra al acabar la semana 0. No cobra créditos.</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('vecindad')}>P-F130-9 · Vecindad (sólo lee, sin modelo)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('pregunta')}>E3 · Pregunta cerrada, 7 veces (gasta en la API)</button>
      </p>
      <p>Copia todo lo que salga abajo y pégaselo a Claude Code.</p>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '1rem', minHeight: '10rem' }}>{salida}</pre>
    </main>
  );
}
