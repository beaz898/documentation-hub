import { useEffect } from 'react';

/**
 * Cuando aparece el teclado en móvil (visualViewport se reduce), si hay un input o
 * textarea con el foco, lo desplaza a la vista. Arregla el caso de Chrome Android
 * que no hace scroll automático cuando el scroll vive en un contenedor anidado.
 * SSR-safe. No-op si el elemento ya está visible (chat/agente no se ven afectados).
 */
export function useScrollFocusedInputIntoView(): void {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
      ) {
        // pequeño delay para que el teclado/viewport terminen de ajustarse
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      }
    };

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);
}
