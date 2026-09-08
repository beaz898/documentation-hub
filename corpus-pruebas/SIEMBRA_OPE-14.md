# SIEMBRA — OPE-14, fichero de control del harness

**Origen**: copia de `OPE-11_tarifario-tratamientos-seguros.xlsx`
**Hecho a mano** el 08/09/2026 · subido por OneDrive y sincronizado
**Se compara contra**: `OPE-11`
**Estrenado en**: tanda **A3** (BANDEJA · analizar, modo rápido), 22:50

---

## 1 · LA SIEMBRA

Copia íntegra de OPE-11 —60 filas, misma hoja, mismas 9 columnas— con **tres
celdas cambiadas**, todas en **una sola columna de precio**:

| Código | valor sembrado |
|---|---|
| `DIA-01` | 45 |
| `END-01` | 200 |
| `PRO-01` | 700 |

⚠️ **LA COLUMNA EXACTA LA PINTA EL VERIFICADOR, NO ESTE DOCUMENTO.** OPE-11
tiene `Precio base` y `Precio con seguro`, y los tres cambios son reales en
cualquiera de las dos. Este registro **no la afirma**: la lee del fichero.

```
node scripts/verificar-ope14.mjs corpus-pruebas/OPE-14_<nombre real>.xlsx
```

El verificador comprueba que sigue siendo OPE-11 con exactamente 3 diferencias
en 1 columna y **dice cuál**. Se corre cada vez que OPE-14 vuelva a usarse: un
fichero de control que ha cambiado sin que nadie lo note deja de ser un control.

⚠️ **NO SE TOCA `Código`** — es la clave con la que emparejan las filas.
Y tampoco `Tratamiento`: en estas tablas también es 100 % único, así que
`discoverTableKey` lo devuelve como segundo candidato y `table-diff.ts:202`
mete **todas** las columnas candidatas en `keyColumns`. Una mutación ahí no
sería una discrepancia: sería material de clave, y desaparecería.

---

## 2 · LA CIFRA, PREDICHA ANTES DE GASTAR Y CONFIRMADA DESPUÉS

Sonda determinista sobre una reconstrucción del fichero, **sin una sola llamada
a un modelo** (el diff de tablas no la necesita), y las dos lecturas posibles de
«precio» dieron lo mismo:

```
tablas_analizado 1 · filas_analizado 60 · pares_ciegos 0
discrepantes 3 · identicas 57 · solo_en_a 0 · solo_en_b 0
clave = Código
```

**La tanda A3 devolvió exactamente eso**: `found 3, confirmed 3`, y las tres son
`DIA-01`, `END-01` y `PRO-01`. Ni una más. `3 + 57 = 60`.

---

## 3 · ⚠️ QUÉ NO SIRVE PARA MEDIR

**No tiene control negativo.** `solo_en_a = 0` y `solo_en_b = 0`: al ser copia
íntegra, todas las filas emparejan. El caso 6 lleva 25 filas sin pareja por lado
justamente para comprobar que el sistema **no fuerza** emparejamientos, y eso
con OPE-14 no se ejerce. Sirve para medir DETECCIÓN, no resistencia al falso
positivo.

Para lo otro está `OPE-15_tarifario-mutua-2026.xlsx` (ver `SIEMBRA_OPE-15.md`):
30 filas, 20 compartidas con 8 mutadas y **10 propias que no deben emparejar**.
Generado, verificado por sonda y **todavía sin estrenar**.

**Es un near-duplicate al 95 %**, y eso tiñe la RECOMENDACIÓN —`REVISAR` o
`NO_INDEXAR` son lo esperable— sin tocar las cifras del diff. El único mecanismo
que habría cortocircuitado el análisis entero es `buildExactDuplicateResponse`
(`pipeline.ts:1082`), que exige igualdad de huella, y la huella difiere.
