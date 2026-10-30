'use client';
import { useState } from 'react';

/**
 * LA PÁGINA DE LAS MEDIDAS TEMPORALES DE F-130 (28/10/2026). Los botones y el JSON de vuelta, para copiarlo y
 * pegarlo. Temporal como toda la carpeta (cabecera de `medida-f130.ts`): se borra con ella.
 */
export default function MedidaF130() {
  const [salida, setSalida] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function medir(ruta: 'vecindad' | 'pregunta' | 'limpia?ensayo=1' | 'limpia') {
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
        <button disabled={ocupado} onClick={() => medir('limpia?ensayo=1')}>Variante limpia · ver las dos frases (sin modelo, no gasta)</button>{' '}
      </p>
      <p>Medición de veinte por condición (30/10), para la consulta. No reabre la decisión de construir. Un botón y luego el otro:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('pregunta')}>Condición 1 · la pareja entera, con A, 20 veces (gasta en la API)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('limpia')}>Condición 2 · las dos frases de D, sin A, 20 veces (gasta en la API)</button>
      </p>
      <p>Copia todo lo que salga abajo y pégaselo a Claude Code.</p>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '1rem', minHeight: '10rem' }}>{salida}</pre>
    </main>
  );
}
