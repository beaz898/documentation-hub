/**
 * LA REGLA DEL SUJETO — la tercera pieza del 3.1.2 (estado vivo, requisito del 19/10, acotado por el arquitecto el
 * 20/10; plan aprobado el 23/10/2026): «cuando lo que se contradice es QUIÉN, la cita empieza en quién».
 *
 * El caso: en NOR-10 contra CLI-12 el juez publicaba la contradicción del cargo citando «quien autoriza cualquier
 * excepción documentada al procedimiento», sin la figura, y contra «El Coordinador de Calidad es quien autoriza…» esa
 * cita no deja ver dónde está el desacuerdo. En NOR-11 no pasa: el dato en disputa —72 horas, Chamberí, el
 * contenedor— va en el PREDICADO, y el juez cita el predicado.
 *
 * ⚠️ ENTRA COMO EXCEPCIÓN AÑADIDA, Y NO TOCA NADA DE LO QUE YA HAY: ni la frase de F-126 («Puede empezar y acabar a
 * mitad de frase: no hace falta que tenga sujeto…») ni su ejemplo de la subordinada, que son los que llevaron LUGAR
 * a 7 de 7. Las pruebas comprueban que, quitada esta línea, el prompt sale byte a byte el de antes.
 * ⚠️ EL EJEMPLO ES DEL MISMO DOMINIO NEUTRO QUE EL DE F-126 (las bicicletas del club), NO DEL CORPUS: un ejemplo
 * con el texto de un documento de prueba le enseñaría al juez la respuesta de la medida.
 */
export const EXCEPCION_DEL_SUJETO =
  '- EXCEPCIÓN, cuando el dato en conflicto es QUIÉN —una persona, un cargo o una figura que hace, decide, autoriza o responde de algo—: la cita EMPIEZA EN ESA FIGURA, aunque después siga una subordinada, porque sin ella no se ve dónde está el desacuerdo. Ejemplo: si el documento dice "El encargado del taller es quien revisa los frenos y quien autoriza la salida de las bicicletas de montaña", y lo que se contradice es quién autoriza la salida, la cita correcta es "El encargado del taller es quien revisa los frenos y quien autoriza la salida de las bicicletas de montaña", y no "quien autoriza la salida de las bicicletas de montaña". Fuera de este caso sigue valiendo lo de arriba: el tramo más corto, aunque no tenga sujeto.';
