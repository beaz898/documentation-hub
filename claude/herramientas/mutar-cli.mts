// LA CLI DEL GENERADOR DE MUTANTES. El núcleo, con su explicación, está en mutar.ts.
//
//   node claude/herramientas/mutar-cli.mts claude/arneses/<carpeta>/mutantes-<nombre>.ts
//
// Se lanza desde la raíz del repositorio. Sale con código 1 si algún mutante queda VIVO, si la huella cambia o si el
// fichero mutado no vuelve a estar como en git; con 2 si la definición no se puede aplicar.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mutar, type Definicion } from './mutar.ts';

const ruta = process.argv[2];
if (!ruta) { console.error('falta la definición: node claude/herramientas/mutar-cli.mts <mutantes-x.ts>'); process.exit(2); }
const def: Definicion = (await import(pathToFileURL(resolve(ruta)).href)).definicion;

const correr = (d: Definicion): string => {
  try {
    return execSync('npx vitest run --project ' + d.proyecto + ' ' + d.arnes, { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    const x = e as { stdout?: string; stderr?: string };
    return (x.stdout ?? '') + (x.stderr ?? '');
  }
};

// El estado de git del fichero ANTES y DESPUÉS tiene que ser el mismo (no «igual que HEAD»: el fichero puede tener
// cambios sin commit, y lo que se vigila es que la pasada de mutantes no deje ninguno suyo).
const estadoEnGit = (): string => execSync('git status --porcelain -- ' + def.fichero, { encoding: 'utf8' })
  + execSync('git diff -- ' + def.fichero, { encoding: 'utf8' });
const gitAntes = estadoEnGit();

let informe;
try {
  informe = mutar(def, {
    leer: f => readFileSync(f, 'utf8'),
    escribir: (f, t) => writeFileSync(f, t),
    correr,
  });
} catch (e) {
  console.error((e as Error).message);
  process.exit(2);
}

for (const r of informe.resultados) console.log((r.rojo ? 'ROJO  ' : 'VIVO  ') + r.nombre + ' · ' + r.linea);
const igual = informe.huellaAntes === informe.huellaDespues;
console.log('huella antes ' + informe.huellaAntes + ' · después ' + informe.huellaDespues + (igual ? ' · IGUAL' : ' · DISTINTA'));
const gitIgual = estadoEnGit() === gitAntes;
console.log('estado en git del fichero mutado: ' + (gitIgual ? 'el mismo que antes' : 'DISTINTO DEL DE ANTES'));
const rojos = informe.resultados.filter(r => r.rojo).length;
console.log('rojos: ' + rojos + ' de ' + informe.resultados.length);
process.exit(rojos === informe.resultados.length && igual && gitIgual ? 0 : 1);
