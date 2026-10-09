/**
 * LOS TEXTOS DE LA SONDA DE PROFUNDIDAD (scripts/sonda-profundidad.mjs).
 *
 * · LAS TRAMPAS: literales del registro de siembra (las tres de NOR-11 ↔ CLI-13),
 *   pasadas por el arquitecto el 10/10/2026. El lado A va en el documento largo
 *   (como NOR-11) y el B en el corto (como CLI-13).
 * · EL RELLENO: INVENTADO, no copiado de ningún documento del corpus. Funcionamiento
 *   de una clínica dental ficticia. Es CONSISTENTE entre los dos documentos —el
 *   corto repite datos del largo con los mismos valores—, de modo que lo único
 *   contradictorio entre ellos son las trampas. Y no usa ninguna de las palabras
 *   con las que se reconoce cada trampa («72 horas», «7 días», «Chamberí»,
 *   «Retiro», «negro», «amarillo»).
 */

export const TRAMPAS = {
  PLAZO: {
    A: 'Los contenedores de residuos del grupo III no pueden permanecer en el área de almacenamiento intermedio más de 72 horas desde el momento en que se cierran, transcurridas las cuales debe solicitarse su retirada al gestor autorizado aunque el contenedor no esté completamente lleno.',
    B: 'Ningún contenedor de residuos del grupo III debe permanecer en el almacén intermedio más de 7 días naturales desde que se cierra, aunque esté lleno antes de ese plazo.',
    senal: /72 horas|7 días/,
    bloque(lado) { return `## Residuos sanitarios: tiempo de permanencia\n\n${this[lado]}`; },
  },
  LUGAR: {
    A: 'El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, ubicado en la clínica de Chamberí, desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro hasta su destino final de tratamiento.',
    B: 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro, que es el centro de referencia logística de residuos sanitarios de Dentavia.',
    senal: /Chamberí|Retiro/,
    bloque(lado) { return `## Residuos sanitarios: recogida\n\n${this[lado]}`; },
  },
  NEGACIÓN: {
    A: 'Los residuos del grupo III se depositan siempre en el contenedor o bolsa de color amarillo descrito en el apartado 3.3. En ningún caso se depositan en el contenedor negro de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del grupo I. Introducir material biosanitario especial en el contenedor negro constituye una infracción del protocolo.',
    B: 'Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado en contacto con sangre o fluidos de un paciente) se depositan en el contenedor negro habilitado en cada gabinete.',
    senal: /negro|amarillo/i,
    bloque(lado) { return `## Residuos sanitarios: dónde se depositan\n\n${this[lado]}`; },
  },
};

/** El documento LARGO (lado A), como NOR-11: un protocolo general. Bloques de sección. */
export const rellenoA = [
  `# Protocolo general de funcionamiento de las clínicas

Este protocolo recoge las normas de funcionamiento diario que se aplican por igual en las tres clínicas de la red. Su objetivo es que cualquier profesional, con independencia del centro en el que trabaje, encuentre las mismas pautas de organización, higiene y atención al paciente. El protocolo lo aprueba la Dirección de Operaciones y lo revisa una vez al año el Coordinador de Calidad, que recoge las propuestas de mejora del personal y las presenta en la reunión de revisión anual.`,
  `## Horario de apertura y turnos

Las clínicas abren de lunes a viernes de 8:30 a 20:30 y los sábados de 9:00 a 14:00. El turno de mañana cubre de 8:30 a 15:00 y el de tarde de 14:00 a 20:30, con una hora de solape para el traspaso de información entre equipos. Durante el solape, el personal saliente informa al entrante de las citas pendientes, de los pacientes que requieren seguimiento y de cualquier incidencia ocurrida en el turno. Los sábados trabaja un único equipo reducido, que atiende sobre todo revisiones y urgencias leves.`,
  `## Recepción y confirmación de citas

El personal de recepción confirma por teléfono todas las citas del día siguiente durante la tarde anterior. Si el paciente no responde, se le envía un mensaje escrito con la fecha, la hora y el nombre del profesional que le atenderá. Las cancelaciones se registran en la agenda en el momento en que se reciben, y el hueco se ofrece a los pacientes que están en lista de espera para ese mismo tipo de tratamiento. A la llegada, el paciente se identifica en recepción y se comprueba que sus datos de contacto siguen siendo correctos.`,
  `## Atención telefónica

Las llamadas se contestan antes del cuarto tono, identificando la clínica y el nombre de la persona que atiende. Si la consulta no puede resolverse en el momento, se anota el teléfono del paciente y se le devuelve la llamada en el mismo turno. Las llamadas de pacientes con dolor agudo se derivan siempre al odontólogo de guardia del turno, que decide si la cita debe adelantarse. Nunca se dan por teléfono resultados de pruebas ni diagnósticos: esa información se comunica en consulta.`,
  `## Higiene de manos

El personal clínico se lava las manos o aplica solución hidroalcohólica antes y después de atender a cada paciente, antes de ponerse los guantes y después de quitárselos. La fricción con solución hidroalcohólica dura entre 20 y 30 segundos y cubre palmas, dorsos, dedos y muñecas. Las uñas se llevan cortas y sin esmalte, y no se usan anillos ni pulseras durante la actividad clínica. Cada gabinete dispone de un dispensador de solución junto a la puerta y otro junto al sillón.`,
  `## Limpieza de superficies del gabinete

Entre un paciente y el siguiente se limpian todas las superficies que han estado en contacto con el paciente o con el instrumental: el sillón, la lámpara, la bandeja y el mando del equipo. Se usa el desinfectante de base alcohólica de uso clínico, aplicado con un paño desechable, y se respeta un tiempo de contacto de un minuto antes de secar. Al final de cada turno, el personal auxiliar hace además una limpieza completa del gabinete, incluido el suelo y los muebles de almacenaje.`,
  `## Uniformidad

El personal clínico viste pijama de color azul marino y calzado cerrado de suela antideslizante, de uso exclusivo en la clínica. El pijama se cambia al menos una vez por turno y siempre que se manche. El personal de recepción viste el uniforme corporativo de color gris claro. Las tarjetas de identificación se llevan en lugar visible, con el nombre y la categoría profesional. No se sale de la clínica con el uniforme clínico puesto.`,
  `## Formación del personal

Todo el personal de nueva incorporación recibe una formación inicial de 4 horas antes de su primer turno, que cubre este protocolo, la protección de datos y el manejo de la agenda. Además, cada profesional asiste a una sesión anual de reciclaje de 2 horas, que organiza el Coordinador de Calidad en el primer trimestre del año. La asistencia queda registrada en el expediente formativo de cada persona, y la Dirección de Operaciones revisa cada año que nadie tenga sesiones pendientes.`,
  `## Comunicación de incidencias

Cualquier incidencia —un fallo de equipo, una queja de un paciente, un error en la agenda o un accidente leve— se comunica al Coordinador de Calidad dentro del mismo turno en que ocurre. Además se anota en el parte de incidencias de la clínica, con la fecha, la hora, una descripción breve y las medidas que se tomaron en el momento. El Coordinador de Calidad revisa los partes cada semana y presenta un resumen mensual a la Dirección de Operaciones.`,
  `## Climatización y condiciones del gabinete

La temperatura de los gabinetes se mantiene entre 21 y 24 °C durante todo el horario de apertura. Los equipos de climatización se revisan dos veces al año, antes del verano y antes del invierno, por la empresa de mantenimiento contratada. Si un gabinete no alcanza la temperatura adecuada, se comunica como incidencia y, mientras se resuelve, se reorganizan las citas para usar otro gabinete del mismo centro.`,
  `## Protección de datos de los pacientes

Las historias clínicas no se dejan nunca a la vista en el mostrador ni en el gabinete. Las pantallas de los ordenadores se bloquean cada vez que el profesional se ausenta del puesto, aunque sea por poco tiempo. Los consentimientos firmados en papel se escanean y se incorporan a la historia clínica dentro de las 48 horas siguientes a la firma, y el original se archiva en el armario cerrado de recepción. Solo el personal autorizado tiene acceso a ese armario.`,
  `## Inventario y pedidos de material

El inventario del material fungible se revisa cada lunes por la mañana, comprobando las existencias de guantes, mascarillas, baberos, vasos y material de impresión. Los pedidos al proveedor se hacen los martes, para recibir el material antes del fin de semana. Si un artículo baja del mínimo establecido antes del lunes, el personal auxiliar lo comunica al responsable del centro, que puede hacer un pedido extraordinario. Cada pedido queda registrado con su fecha y su importe.`,
  `## Mantenimiento de equipos

El compresor, el sillón dental y la lámpara se revisan cada tres meses por el servicio técnico del fabricante. Las revisiones quedan anotadas en la ficha de cada equipo, con la fecha, el técnico que la hizo y las piezas sustituidas. Si un equipo falla entre dos revisiones, se deja fuera de uso con un cartel visible y se avisa al servicio técnico el mismo día. Ningún equipo se vuelve a usar hasta que el técnico deja constancia de que está reparado.`,
  `## Accesibilidad y atención preferente

Las tres clínicas cuentan con acceso adaptado sin escalones y con un gabinete preparado para pacientes con movilidad reducida. Al dar la cita, recepción pregunta si el paciente necesita alguna adaptación y lo anota en la agenda. Las personas mayores, las embarazadas y los pacientes con movilidad reducida tienen preferencia para elegir horario. Si un paciente llega acompañado de un cuidador, el cuidador puede permanecer en el gabinete durante la atención.`,
  `## Botiquín y emergencias

Cada clínica dispone de un botiquín de emergencias y de un desfibrilador situado en recepción. El botiquín se revisa una vez al mes, comprobando las fechas de caducidad y reponiendo lo que falte. Todo el personal clínico conoce la ubicación del desfibrilador y ha recibido formación en su uso. Ante una emergencia, se llama primero al servicio de emergencias y después se avisa al responsable del centro.`,
  `## Reunión de equipo

Cada viernes a las 14:30, durante el solape de turnos, el equipo de cada clínica se reúne durante media hora. En la reunión se repasan las incidencias de la semana, los cambios de agenda previstos y las novedades del protocolo. El responsable del centro levanta un acta breve y la envía al Coordinador de Calidad. Si alguien no puede asistir, lee el acta antes de su siguiente turno.`,
  `## Tratamientos de varias sesiones

Cuando un tratamiento necesita varias sesiones, el odontólogo deja programadas todas las citas antes de que el paciente salga de la clínica, para que no queden huecos entre una sesión y la siguiente. En la agenda, cada cita de la serie lleva una nota con el número de sesión y el total previsto. Si el paciente cancela una de ellas, recepción le ofrece la primera fecha libre con el mismo profesional y avisa al odontólogo, que valora si el retraso afecta al plan de tratamiento.`,
  `## Radiología

Las radiografías intraorales solo las realiza el personal autorizado y siempre con la prescripción del odontólogo. El paciente lleva durante la exposición un delantal de protección con collarín tiroideo, que se guarda colgado y sin doblar para que no se agriete. Las imágenes se incorporan a la historia clínica en el momento. La sala de radiología se revisa una vez al año por la empresa especializada, que entrega un informe que se archiva en la dirección del centro.`,
  `## Relación con los laboratorios de prótesis

Los trabajos que se envían al laboratorio de prótesis salen con una hoja de pedido firmada por el odontólogo, en la que constan el tipo de trabajo, el color elegido y la fecha en la que el paciente tiene la siguiente cita. Cuando el trabajo vuelve, el personal auxiliar comprueba que corresponde al pedido y lo deja en la caja del paciente, identificada con su nombre y su número de historia. Si el trabajo no llega a tiempo, se avisa al paciente para cambiar la cita.`,
  `## Presupuestos y facturación

Antes de empezar cualquier tratamiento con coste, el paciente recibe un presupuesto por escrito, que firma si lo acepta. El presupuesto tiene una validez de tres meses. Las facturas se emiten al terminar cada sesión o al finalizar el tratamiento, según lo acordado con el paciente, y se entregan en papel o por correo electrónico. Cualquier duda sobre importes la resuelve el responsable del centro, no el personal clínico.`,
  `## Reclamaciones de los pacientes

Si un paciente quiere presentar una reclamación, recepción le facilita la hoja oficial y le explica cómo rellenarla. La reclamación se registra el mismo día y se comunica al Coordinador de Calidad, que la estudia con los profesionales implicados. El paciente recibe una respuesta por escrito en el plazo que marca la normativa. Las reclamaciones se analizan en conjunto cada trimestre para detectar problemas que se repitan.`,
  `## Apertura y cierre del centro

La primera persona que llega abre el centro, desconecta la alarma y enciende la iluminación y la climatización. Al cierre, la última persona comprueba que no queda nadie en los gabinetes, apaga los equipos que no deben quedar encendidos, cierra las ventanas y conecta la alarma. Cada centro tiene una lista de comprobación de apertura y cierre colgada junto a la puerta del personal, y quien abre y quien cierra la firma con la hora.`,
  `## Sala de espera

La sala de espera se mantiene ordenada y ventilada, con revistas actualizadas y agua disponible para los pacientes. El personal de recepción revisa la sala cada hora y retira lo que se haya quedado olvidado. Si un paciente lleva más de veinte minutos esperando sobre la hora de su cita, recepción le informa del retraso y le ofrece la posibilidad de cambiar la cita sin coste. Los acompañantes esperan en la sala salvo que el paciente pida que entren con él al gabinete.`,
  `## Atención a menores

Los pacientes menores de edad acuden siempre acompañados de su padre, su madre o su tutor legal, que firma los consentimientos en su nombre. El acompañante puede estar presente durante toda la atención. Antes de empezar, el odontólogo explica al menor lo que va a hacer con palabras adaptadas a su edad. Las citas de menores se procuran dar por la tarde, fuera del horario escolar, siempre que la agenda lo permita.`,
  `## Revisión de este protocolo

Este protocolo se revisa una vez al año y siempre que cambie la normativa aplicable o la organización de las clínicas. Las propuestas de cambio se envían al Coordinador de Calidad, que las estudia con la Dirección de Operaciones. Cada versión nueva se comunica a todo el personal en la reunión de equipo siguiente a su aprobación, y la versión anterior se retira de los puestos de trabajo.`,
];

/** El documento CORTO (lado B), como CLI-13: instrucciones prácticas para el gabinete. */
export const rellenoB = [
  `# Instrucciones prácticas para el personal de gabinete

Esta guía traduce a instrucciones del día a día las normas de funcionamiento de las tres clínicas de la red. Está pensada para tenerla a mano en el gabinete y consultarla en caso de duda. Si algo de lo que aquí se dice no te queda claro, pregunta al responsable de tu centro o al Coordinador de Calidad antes de actuar.`,
  `## Antes de empezar el turno

Llega con tiempo para cambiarte: el pijama azul marino y el calzado cerrado se usan solo dentro de la clínica. Comprueba tu tarjeta de identificación. Si entras en el turno de tarde, aprovecha la hora de solape para que el compañero de mañana te cuente las citas pendientes y lo que haya pasado. Recuerda que la clínica abre de 8:30 a 20:30 entre semana y de 9:00 a 14:00 los sábados.`,
  `## Manos y guantes

Lávate las manos o usa la solución hidroalcohólica antes y después de cada paciente, y también al ponerte y al quitarte los guantes. Frota entre 20 y 30 segundos, sin olvidar los dedos ni las muñecas. Lleva las uñas cortas y sin esmalte, y quítate anillos y pulseras al empezar. Tienes un dispensador junto a la puerta y otro junto al sillón.`,
  `## Entre un paciente y otro

Limpia el sillón, la lámpara, la bandeja y el mando con el desinfectante de base alcohólica y un paño desechable. Deja actuar el producto un minuto antes de secar. No empieces con el siguiente paciente hasta haber terminado. Al acabar el turno, el personal auxiliar hace la limpieza completa del gabinete, suelo y muebles incluidos.`,
  `## Si algo falla

Si un equipo deja de funcionar, ponle el cartel de fuera de uso y avisa al responsable del centro para que llame al servicio técnico el mismo día. No lo vuelvas a usar hasta que el técnico deje constancia de que está reparado. Cualquier incidencia, por pequeña que parezca, se comunica al Coordinador de Calidad en el mismo turno y se anota en el parte de incidencias con la fecha, la hora y lo que hiciste.`,
  `## Datos de los pacientes

No dejes historias clínicas a la vista, ni en el mostrador ni en el gabinete. Bloquea la pantalla siempre que te levantes del puesto. Los consentimientos firmados se escanean en las 48 horas siguientes y el original va al armario cerrado de recepción. No des resultados ni diagnósticos por teléfono: eso se explica en la consulta.`,
  `## El gabinete, a punto

La temperatura del gabinete debe estar entre 21 y 24 °C. Si no lo está, comunícalo como incidencia para que se pueda cambiar al paciente de gabinete. Revisa al empezar que tienes guantes, mascarillas, baberos y vasos suficientes: el inventario se hace los lunes y los pedidos salen los martes, así que avisa en cuanto veas que algo se acaba.`,
  `## Pacientes con necesidades especiales

Mira en la agenda si el paciente necesita alguna adaptación. El gabinete adaptado es el preparado para pacientes con movilidad reducida. Si el paciente viene con un cuidador, el cuidador puede quedarse con él durante la atención. Las personas mayores, las embarazadas y los pacientes con movilidad reducida tienen preferencia para elegir horario.`,
  `## Emergencias

Debes saber dónde está el desfibrilador: en recepción. El botiquín de emergencias se revisa una vez al mes. Si un paciente se pone mal, llama primero al servicio de emergencias y después avisa al responsable del centro. No te quedes solo con el paciente si puedes pedir ayuda a un compañero.`,
  `## Al dar o cambiar una cita

Confirma el día anterior por teléfono todas las citas del día siguiente; si el paciente no contesta, mándale un mensaje con la fecha, la hora y el profesional. Si alguien cancela, apúntalo en la agenda en el momento y ofrece el hueco a quien esté en lista de espera para ese tratamiento. En los tratamientos de varias sesiones, deja todas las citas programadas antes de que el paciente se vaya, y anota en cada una el número de sesión.`,
  `## Al teléfono

Contesta antes del cuarto tono, di el nombre de la clínica y el tuyo. Si no puedes resolver la consulta, apunta el teléfono y devuelve la llamada en el mismo turno. Si quien llama tiene dolor fuerte, pásale la llamada al odontólogo de guardia del turno. Recuerda que por teléfono no se dan resultados ni diagnósticos.`,
  `## Radiografías

Solo puedes hacer una radiografía si estás autorizado y el odontólogo la ha prescrito. Pon al paciente el delantal de protección con collarín antes de disparar, y al terminar cuélgalo sin doblarlo para que no se agriete. Incorpora la imagen a la historia clínica en el momento, no al final del día.`,
  `## Trabajos de laboratorio

Cuando llegue un trabajo del laboratorio de prótesis, comprueba que coincide con la hoja de pedido firmada por el odontólogo: tipo de trabajo, color y fecha de la próxima cita. Déjalo en la caja del paciente, con su nombre y su número de historia. Si ves que no va a llegar a tiempo, avisa a recepción para que llame al paciente y le cambie la cita.`,
  `## Presupuestos, facturas y reclamaciones

No empieces un tratamiento con coste sin que el paciente haya firmado el presupuesto; recuerda que vale tres meses. Las dudas sobre importes las resuelve el responsable del centro. Si un paciente quiere reclamar, recepción le da la hoja oficial y le explica cómo rellenarla; la reclamación se registra ese mismo día y se pasa al Coordinador de Calidad.`,
  `## Al abrir y al cerrar

Si eres el primero en llegar, abre, desconecta la alarma y enciende la luz y la climatización. Si eres el último, comprueba que no queda nadie en los gabinetes, apaga los equipos, cierra las ventanas y conecta la alarma. Firma con la hora la lista de comprobación que está junto a la puerta del personal.`,
  `## La sala de espera

Pasa por la sala de espera cada hora: que esté ordenada y ventilada, con agua y revistas al día, y recoge lo que se haya olvidado algún paciente. Si alguien lleva más de veinte minutos esperando sobre la hora de su cita, avísale del retraso y ofrécele cambiar la cita sin coste. Los acompañantes esperan fuera salvo que el paciente pida que entren con él al gabinete.`,
  `## Si el paciente es menor

Un menor viene siempre con su padre, su madre o su tutor legal, que es quien firma los consentimientos. El acompañante puede quedarse durante toda la atención. Antes de empezar, explícale al menor lo que vas a hacer con palabras que entienda. Cuando puedas, dale cita por la tarde para que no pierda horas de colegio.`,
  `## Tu puesto, al terminar

Antes de irte, deja el gabinete como te gustaría encontrarlo: bandeja vacía, superficies limpias, pantalla bloqueada y material repuesto para quien entre después. Si algo se ha acabado durante el turno, anótalo para el inventario del lunes. Cuéntale al compañero del turno siguiente lo que haya quedado pendiente: citas, pacientes que esperan una llamada o equipos que hayan dado problemas.`,
  `## Pacientes nerviosos

Hay pacientes que llegan con miedo al dentista. Salúdalos por su nombre, explícales con calma lo que se va a hacer y pregúntales si quieren que paréis un momento levantando la mano. No tengas prisa en el sillón: unos minutos de más al principio suelen ahorrar una sesión complicada. Si el paciente lo pide, puede venir acompañado, como cualquier otro, y el acompañante puede quedarse durante la atención si el paciente quiere.`,
  `## Dudas sobre esta guía

Esta guía se revisa a la vez que el protocolo general de funcionamiento, una vez al año. Si ves algo que ya no se hace así, o que se podría hacer mejor, díselo al Coordinador de Calidad: las propuestas del personal se estudian en la revisión anual. Mientras tanto, ante cualquier duda, manda lo que diga el protocolo general y lo que te indique el responsable de tu centro.`,
  `## Formación y reuniones

Antes de tu primer turno habrás recibido una formación inicial de 4 horas, y cada año asistirás a una sesión de reciclaje de 2 horas en el primer trimestre. Los viernes a las 14:30 hay reunión de equipo de media hora: si no puedes ir, lee el acta antes de tu siguiente turno.`,
];
