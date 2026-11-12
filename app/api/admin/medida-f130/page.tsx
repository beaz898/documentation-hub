'use client';
import { useState } from 'react';

/**
 * LA PÁGINA DE LAS MEDIDAS TEMPORALES DE F-130 (28/10/2026). Los botones y el JSON de vuelta, para copiarlo y
 * pegarlo. Temporal como toda la carpeta (cabecera de `medida-f130.ts`): se borra con ella.
 */
export default function MedidaF130() {
  const [salida, setSalida] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function medir(ruta: 'vecindad' | 'pregunta' | 'limpia?ensayo=1' | 'limpia' | 'quinto?ensayo=1' | 'quinto' | 'd?ensayo=1' | 'd' | 'd2?ensayo=1' | 'd2' | 'd3?ensayo=1' | 'd3?sondeo=1' | 'd3' | 'd4?ensayo=1' | 'd4?sondeo=1' | 'd4' | 'd4b?ensayo=1' | 'd4b?sondeo=1' | 'd4b' | 'd4c?ensayo=1' | 'd4c?sondeo=1' | 'd4c' | 'm1?ensayo=1' | 'm1?sondeo=1' | 'm1'
    | 'claridad?brazo=n&ensayo=1' | 'claridad?brazo=n&sondeo=1' | 'claridad?brazo=n' | 'claridad?brazo=r&ensayo=1' | 'claridad?brazo=r&sondeo=1' | 'claridad?brazo=r') {
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
      <p>Paso 3 (03/11): la pareja del quinto. PRIMERO el ensayo, y la tanda sólo cuando el arquitecto haya confirmado la pareja:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('quinto?ensayo=1')}>Paso 3 · ensayo: los dos trozos como están guardados (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('quinto')}>Paso 3 · la tanda: la pareja del quinto, 21 veces (gasta en la API)</button>
      </p>
      <p>La D de verdad (04/11): NOR-10 §2.4 ↔ CLI-12 §3.5. PRIMERO el ensayo, y la tanda sólo cuando el arquitecto la haya liberado:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('d?ensayo=1')}>D · ensayo: los dos trozos como están guardados (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d')}>D · la tanda: NOR-10 §2.4 ↔ CLI-12 §3.5, 21 veces (gasta en la API)</button>
      </p>
      <p>La D con las dos líneas de hallazgo (09/11): la misma pareja y el mismo prompt, con dos líneas al final. Sólo cuando el arquitecto la haya liberado:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('d2?ensayo=1')}>D2 · ensayo: el prompt con las dos líneas (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d2')}>D2 · la tanda: la misma pareja con las dos líneas de hallazgo, 21 veces (gasta en la API)</button>
      </p>
      <p>La D con la PAREJA ENTERA (10/11): los dos documentos enteros, como el rápido del producto, y las dos líneas. Uno a uno y sólo cuando el arquitecto lo diga: primero el ensayo, luego el sondeo, y la tanda la última:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('d3?ensayo=1')}>D3 · ensayo: los dos documentos enteros y el prompt (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d3?sondeo=1')}>D3 · sondeo: UNA sola llamada, para medir la latencia (gasta unos 0,006 $)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d3')}>D3 · una pulsación: la pareja entera, 14 veces (gasta en la API, unos 0,10 $; son tres pulsaciones)</button>
      </p>
      <p>El JUEZ DEL PRODUCTO, con el PROMPT DEL PRODUCTO (11/11). Uno a uno y sólo cuando el arquitecto lo diga: primero el ensayo, luego el sondeo, y las pulsaciones las últimas:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('d4?ensayo=1')}>D4 · ensayo: el prompt del producto (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d4?sondeo=1')}>D4 · sondeo: UNA sola llamada, para medir la latencia (gasta menos de 0,01 $)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d4')}>D4 · una pulsación: el juez del producto, 14 veces (gasta en la API, unos 0,10 $)</button>
      </p>
      <p>Los otros dos brazos (11/11), los dos del mismo tamaño mediano. Las pulsaciones, en el orden D4, D4B, D4C y sólo cuando el arquitecto lo diga:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('d4b?ensayo=1')}>D4B · ensayo: el trozo de D y los de A, B y C (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d4b?sondeo=1')}>D4B · sondeo: UNA sola llamada (gasta menos de 0,01 $)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d4b')}>D4B · una pulsación: con competencia, 14 veces (gasta en la API, unos 0,03 $)</button>
      </p>
      <p>
        <button disabled={ocupado} onClick={() => medir('d4c?ensayo=1')}>D4C · ensayo: el trozo de D y trozos neutros (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d4c?sondeo=1')}>D4C · sondeo: UNA sola llamada (gasta menos de 0,01 $)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('d4c')}>D4C · una pulsación: sin competencia, 14 veces (gasta en la API, unos 0,03 $)</button>
      </p>
      <p>El CAMBIO CANDIDATO M1 (11/11): prosa y luego la casilla, sobre los documentos enteros, dos llamadas por vez. Sólo cuando el arquitecto lo diga, y después de D4:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('m1?ensayo=1')}>M1 · ensayo: los dos prompts y las supresiones (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('m1?sondeo=1')}>M1 · sondeo: UNA vez, dos llamadas (gasta unos 0,02 $)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('m1')}>M1 · una pulsación: 14 veces, dos llamadas cada una (gasta en la API, unos 0,20 $)</button>
      </p>
      <p>LA TANDA DE CLARIDAD (12/11, paso 1 de Fable): ¿es D clara con las dos frases delante? Dos brazos de 42, el mismo día. Sólo cuando el arquitecto lo diga:</p>
      <p>
        <button disabled={ocupado} onClick={() => medir('claridad?brazo=n&ensayo=1')}>Claridad N · ensayo (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('claridad?brazo=n&sondeo=1')}>Claridad N · sondeo: UNA tirada</button>{' '}
        <button disabled={ocupado} onClick={() => medir('claridad?brazo=n')}>Claridad N · las 42 tiradas (unos 0,03 $)</button>
      </p>
      <p>
        <button disabled={ocupado} onClick={() => medir('claridad?brazo=r&ensayo=1')}>Claridad R · ensayo (sin modelo, no gasta)</button>{' '}
        <button disabled={ocupado} onClick={() => medir('claridad?brazo=r&sondeo=1')}>Claridad R · sondeo: UNA tirada</button>{' '}
        <button disabled={ocupado} onClick={() => medir('claridad?brazo=r')}>Claridad R · las 42 tiradas (unos 0,03 $)</button>
      </p>
      <p>Copia todo lo que salga abajo y pégaselo a Claude Code.</p>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '1rem', minHeight: '10rem' }}>{salida}</pre>
    </main>
  );
}
