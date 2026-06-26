import { useState, useEffect } from 'react';

/**
 * Devuelve la altura (px) del área realmente visible del viewport.
 * Cuando aparece el teclado en móvil, visualViewport.height se reduce.
 * Devuelve null hasta montar / si no hay soporte (entonces se usa el fallback CSS dvh).
 */
export function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return; // sin soporte → null → el CSS dvh actúa de fallback

    const update = () => setHeight(vv.height);
    update(); // valor inicial

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update); // iOS Safari: el teclado dispara scroll del vv
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return height;
}
