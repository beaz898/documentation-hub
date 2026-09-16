import { describe, it, expect } from 'vitest';
import { repartirCandidatos, elRepartoCuadra } from './reparto-del-rerank';

const repartir = (
  idsRecuperados: string[],
  idsDevueltosPorElModelo: string[],
  maxSelected = 6,
) => repartirCandidatos({ idsRecuperados, idsDevueltosPorElModelo, maxSelected });

describe('⚠️ LA PASADA REAL DEL DIRECTOR: tres candidatos, dos comparados, tope 6', () => {
  it('el tope NO fue: el tercero cayó por criterio', () => {
    const r = repartir(['a', 'b', 'c'], ['a', 'b']);
    expect(r.cortadosPorTope).toBe(0);
    expect(r.descartadosPorCriterio).toBe(1);
    expect(r.idsNoReconocidos).toBe(0);
  });

  it('⚠️ Y ES EXACTAMENTE LO QUE EL AVISO NO PODÍA SABER: la resta vale 1 en los dos casos', () => {
    const porCriterio = repartir(['a', 'b', 'c'], ['a', 'b']);
    const porTope     = repartir(['a', 'b', 'c'], ['a', 'b', 'c'], 2);
    // La cifra con la que se construyó el aviso —recuperados menos finales— es
    // la misma en los dos. Por eso el mensaje podía decir la causa equivocada.
    expect(porCriterio.recuperados - (porCriterio.elegidosPorElModelo - porCriterio.cortadosPorTope)).toBe(1);
    expect(porTope.recuperados - (porTope.elegidosPorElModelo - porTope.cortadosPorTope)).toBe(1);
    // Y ahora se distinguen.
    expect(porCriterio.descartadosPorCriterio).toBe(1);
    expect(porCriterio.cortadosPorTope).toBe(0);
    expect(porTope.descartadosPorCriterio).toBe(0);
    expect(porTope.cortadosPorTope).toBe(1);
  });
});

describe('⚠️ LA VÍA MUDA: ids que no casan con ningún candidato', () => {
  it('se cuenta, y ya no es silencio', () => {
    const r = repartir(['a', 'b', 'c'], ['a', 'inventado']);
    expect(r.idsNoReconocidos).toBe(1);
  });

  it('⚠️ Y CONTAMINA «POR CRITERIO», que es lo que hay que poder leer', () => {
    // El modelo quiso DOS, pero uno vino con un id que no sabemos resolver.
    // `b` y `c` figuran como descartados por criterio, y uno de los dos no lo
    // fue: lo quisimos y no supimos encontrarlo.
    const r = repartir(['a', 'b', 'c'], ['a', 'id-que-no-existe']);
    expect(r.descartadosPorCriterio).toBe(2);
    expect(r.idsNoReconocidos).toBe(1);
    // La lectura: «2 por criterio» sólo es de fiar si esto vale 0.
    expect(r.idsNoReconocidos).toBeGreaterThan(0);
  });

  it('su CERO es la noticia buena y se escribe igual', () => {
    const r = repartir(['a', 'b'], ['a', 'b']);
    expect(r.idsNoReconocidos).toBe(0);
    expect(r).toHaveProperty('idsNoReconocidos');
  });

  it('varios ids inventados se cuentan todos', () => {
    const r = repartir(['a'], ['x', 'y', 'z']);
    expect(r.idsNoReconocidos).toBe(3);
    expect(r.elegidosPorElModelo).toBe(0);
    expect(r.descartadosPorCriterio).toBe(1);
  });
});

describe('el tope, sobre lo que el modelo eligió de verdad', () => {
  it('siete elegidos y tope seis: uno cortado', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const r = repartir(ids, ids, 6);
    expect(r.elegidosPorElModelo).toBe(7);
    expect(r.cortadosPorTope).toBe(1);
    expect(r.descartadosPorCriterio).toBe(0);
  });

  it('no se corta lo que el modelo no eligió — el tope opera DESPUÉS del criterio', () => {
    // Diez candidatos, el modelo elige tres, tope seis: el tope no corta nada
    // aunque haya diez recuperados.
    const diez = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const r = repartir(diez, ['a', 'b', 'c'], 6);
    expect(r.cortadosPorTope).toBe(0);
    expect(r.descartadosPorCriterio).toBe(7);
  });

  it('nunca negativo con tope mayor que los elegidos', () => {
    expect(repartir(['a'], ['a'], 25).cortadosPorTope).toBe(0);
  });
});

describe('repeticiones del modelo — un documento nombrado dos veces no vale por dos', () => {
  it('no infla los elegidos ni se lleva una plaza ajena', () => {
    const r = repartir(['a', 'b', 'c'], ['a', 'a', 'b']);
    expect(r.elegidosPorElModelo).toBe(2);
    expect(r.descartadosPorCriterio).toBe(1);
    expect(r.idsNoReconocidos).toBe(0);
  });

  it('⚠️ y sin contar por conjunto, tres repeticiones habrían llenado el tope de uno', () => {
    const r = repartir(['a', 'b', 'c'], ['a', 'a', 'a'], 2);
    expect(r.elegidosPorElModelo).toBe(1);
    expect(r.cortadosPorTope).toBe(0);
  });

  it('un candidato repetido en la entrada tampoco cuenta dos veces', () => {
    const r = repartir(['a', 'a', 'b'], ['a']);
    expect(r.recuperados).toBe(2);
    expect(r.descartadosPorCriterio).toBe(1);
  });
});

describe('⚠️ LA INVARIANTE: no hay un tercer sitio por donde caerse', () => {
  it('recuperados === criterio + elegidos, en todos los casos de arriba', () => {
    const casos = [
      repartir(['a', 'b', 'c'], ['a', 'b']),
      repartir(['a', 'b', 'c'], ['a', 'id-falso']),
      repartir(['a'], ['x', 'y', 'z']),
      repartir(['a', 'b', 'c'], ['a', 'a', 'b']),
      repartir([], []),
      repartir(['a', 'b', 'c', 'd', 'e', 'f', 'g'], ['a', 'b', 'c', 'd', 'e', 'f', 'g'], 6),
    ];
    for (const c of casos) expect(elRepartoCuadra(c)).toBe(true);
  });

  it('sin candidatos todo vale cero y nada revienta', () => {
    const r = repartir([], []);
    expect(r).toEqual({
      recuperados: 0,
      elegidosPorElModelo: 0,
      descartadosPorCriterio: 0,
      cortadosPorTope: 0,
      idsNoReconocidos: 0,
    });
  });
});
