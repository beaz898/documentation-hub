import { describe, it, expect } from 'vitest';
import {
  decidirSiSePuedeConectar,
  mensajeDeConexionExistente,
} from './permiso-para-conectar';

/**
 * ⚠️ EL CASO QUE DECIDE NO ES EL OBVIO. Que «con conexión no se puede» y «sin
 * conexión sí» es la mitad fácil. La que importa es la TERCERA: cuando la
 * consulta falla, esto NO puede contestar «no hay conexión» — y no es una
 * hipótesis, es el mismo fallo que abre la puerta que esta guarda cierra: la
 * barra lateral lee «no lo sé» como «no conectado» y pinta el botón. Si la
 * guarda hiciera lo mismo, el agujero seguiría abierto justo en el momento en
 * que aparece.
 */

describe('la mitad fácil', () => {
  it('sin fila, se puede conectar', () => {
    expect(decidirSiSePuedeConectar({ data: null, error: null })).toEqual({ puede: true });
  });

  it('con fila, NO se puede — y se dice cuál', () => {
    const r = decidirSiSePuedeConectar({
      data: { provider: 'onedrive', email: 'alguien@ejemplo.com' }, error: null,
    });
    expect(r.puede).toBe(false);
    if (!r.puede && r.motivo === 'ya_conectado') {
      expect(r.provider).toBe('onedrive');
      expect(r.email).toBe('alguien@ejemplo.com');
    }
  });
});

describe('⚠️ la que decide: un fallo NO es una ausencia', () => {
  it('si la consulta falla, NO se puede conectar', () => {
    const r = decidirSiSePuedeConectar({ data: null, error: { message: 'timeout' } });
    expect(r.puede).toBe(false);
    if (!r.puede) expect(r.motivo).toBe('no_se_pudo_comprobar');
  });

  it('CONTROL POSITIVO: la MISMA forma sin error sí deja pasar', () => {
    // El par: lo único que cambia entre los dos casos es el error. Sin este
    // control, una función que devolviera «no se pudo comprobar» SIEMPRE
    // pasaría el test de arriba.
    expect(decidirSiSePuedeConectar({ data: null, error: null }).puede).toBe(true);
  });

  it('un error CON fila tampoco deja pasar: el error manda', () => {
    const r = decidirSiSePuedeConectar({
      data: { provider: 'onedrive' }, error: { message: 'timeout' },
    });
    expect(r.puede).toBe(false);
    if (!r.puede) expect(r.motivo).toBe('no_se_pudo_comprobar');
  });
});

describe('la fila incompleta no revienta ni miente', () => {
  it('sin email, se sigue bloqueando y el email queda nulo', () => {
    const r = decidirSiSePuedeConectar({ data: { provider: 'google_drive' }, error: null });
    expect(r.puede).toBe(false);
    if (!r.puede && r.motivo === 'ya_conectado') expect(r.email).toBeNull();
  });

  it('con email vacío se trata como ausente, no como cadena vacía', () => {
    const r = decidirSiSePuedeConectar({ data: { provider: 'onedrive', email: '' }, error: null });
    if (!r.puede && r.motivo === 'ya_conectado') expect(r.email).toBeNull();
  });

  it('con un provider que no conocemos, sigue bloqueando', () => {
    const r = decidirSiSePuedeConectar({ data: { provider: 'dropbox' }, error: null });
    expect(r.puede).toBe(false);
  });
});

describe('el mensaje', () => {
  it('nombra la cuenta y manda a desconectar', () => {
    const m = mensajeDeConexionExistente('alguien@ejemplo.com', 'onedrive');
    expect(m).toContain('OneDrive');
    expect(m).toContain('alguien@ejemplo.com');
    expect(m).toContain('desconecta');
  });

  it('sin email sigue siendo legible y no dice «(null)»', () => {
    const m = mensajeDeConexionExistente(null, 'google_drive');
    expect(m).toContain('Google Drive');
    expect(m).not.toContain('null');
    expect(m).not.toContain('()');
  });

  it('⚠️ avisa de lo que se PERDERÍA, no sólo de que no se puede', () => {
    // Un «no puedes» sin consecuencia invita a buscar otra puerta. El caso que
    // esto viene a evitar es un borrado, y el mensaje lo nombra.
    expect(mensajeDeConexionExistente(null, 'onedrive')).toContain('borraría');
  });
});
