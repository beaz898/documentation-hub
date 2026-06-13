import { useState, useEffect } from 'react';

/**
 * Devuelve true si la media query indicada se cumple actualmente.
 * Maneja SSR de forma segura: en servidor devuelve `false` y se
 * actualiza al montar en cliente. Se re-evalúa al cambiar el tamaño.
 *
 * Ejemplo de uso:
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mql = window.matchMedia(query);

    // Sincroniza el estado inicial al montar (en SSR salió `false`).
    setMatches(mql.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // addEventListener es el API moderno; addListener es el fallback
    // para navegadores antiguos que no lo soportan.
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      mql.addListener(handler);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}
