import { describe, it, expect } from 'vitest';
import { claseDeclarada, claseParaCobrar, CLASE_POR_DEFECTO } from './clase-de-coste';

/**
 * ⚠️ LO QUE ESTA BATERÍA FIJA ES QUE SON DOS PREGUNTAS DISTINTAS: «¿qué declaró?»
 * y «¿qué se cobra?». Hasta el 15/09/2026 el `?? 'heavy'` las contestaba juntas,
 * y por eso el registro no podía distinguir un exhaustivo pesado de uno que nunca
 * se clasificó.
 */

describe('lo que se DECLARÓ', () => {
  it('las tres clases se reconocen', () => {
    expect(claseDeclarada('light')).toBe('light');
    expect(claseDeclarada('medium')).toBe('medium');
    expect(claseDeclarada('heavy')).toBe('heavy');
  });

  it('⚠️ ausente es null, que es el caso entero de esta pieza', () => {
    expect(claseDeclarada(undefined)).toBeNull();
    expect(claseDeclarada(null)).toBeNull();
  });

  it('⚠️ una cadena inventada TAMBIÉN es null, no una clase', () => {
    // Si pasara por clase, acabaría en REFUND_BY_COST devolviendo undefined y
    // de ahí a cero por otro camino — sin que nadie contara nada.
    expect(claseDeclarada('enorme')).toBeNull();
    expect(claseDeclarada('')).toBeNull();
    expect(claseDeclarada(3)).toBeNull();
  });
});

describe('lo que se COBRA — y hoy no cambia', () => {
  it('lo declarado se respeta', () => {
    expect(claseParaCobrar('light')).toBe('light');
  });

  it('⚠️ lo no declarado sigue cobrando el máximo: el precio NO cambia hoy', () => {
    expect(claseParaCobrar(undefined)).toBe('heavy');
    expect(CLASE_POR_DEFECTO).toBe('heavy');
  });

  it('CONTROL: las dos preguntas dan cosas distintas sobre la MISMA entrada', () => {
    // El par que demuestra que la distinción existe. Sin él, una función que
    // devolviera 'heavy' siempre pasaría la mitad de esta batería.
    expect(claseDeclarada(undefined)).toBeNull();
    expect(claseParaCobrar(undefined)).toBe('heavy');
  });
});
