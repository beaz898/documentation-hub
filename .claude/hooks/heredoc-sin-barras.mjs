// HOOK DE CLAUDE CODE (PreToolUse, herramienta Bash), 05/11/2026, aprobado por el director. SE PUEDE BORRAR (este fichero y su
// entrada en .claude/settings.json) sin que nada más del proyecto cambie: no toca el producto, sólo cómo trabaja Claude Code aquí.
//
// PARA QUÉ: un heredoc del shell de este equipo se ha comido barras invertidas (`\\` → `\`, `\\n` → salto de línea) y comillas
// invertidas, y ha dejado ficheros con el texto cambiado en silencio (01/10, 05/10, 04/11 y 05/11). La regla «texto con barras o
// backticks va con Write o Edit, no con heredoc» estaba en la memoria y se incumplió dos veces: este hook la hace mecánica.
// BLOQUEA SÓLO dos cosas: una orden de Bash con un heredoc («<<FIN … FIN») cuyo CUERPO lleve una barra invertida o una comilla
// invertida; y (desde el 10/11/2026) un «node -e/-p "…"» cuyo código entre comillas DOBLES las lleve. Fuera de eso no se mira: un
// «tr '\n' ' '» en la misma orden no es el peligro. Todo lo demás pasa. Al bloquear sale con código 2, que Claude Code muestra a
// Claude con el motivo. Su prueba, con las dos mitades (bloquea lo peligroso, deja pasar lo inocente): probar_hook.mjs, scratchpad.
let entrada = '';
process.stdin.on('data', d => { entrada += d; });
process.stdin.on('end', () => {
  let orden = '';
  try { orden = JSON.parse(entrada)?.tool_input?.command ?? ''; } catch { process.exit(0); }
  // los cuerpos de los heredocs: desde la línea siguiente a «<<FIN» hasta la línea que sea sólo FIN (o hasta el final)
  const cuerpos = [];
  for (const m of orden.matchAll(/<<-?\s*['"]?([A-Za-z_]\w*)['"]?/g)) {
    const desde = orden.indexOf('\n', m.index);
    if (desde === -1) continue;
    const resto = orden.slice(desde + 1).split('\n'), fin = resto.findIndex(l => l.trim() === m[1]);
    cuerpos.push((fin === -1 ? resto : resto.slice(0, fin)).join('\n'));
  }
  const cuerpo = cuerpos.join('\n');
  const peligro = cuerpo.includes('\\') ? 'una barra invertida' : cuerpo.includes('`') ? 'una comilla invertida' : null;
  if (peligro) {
    process.stderr.write(`BLOQUEADO por .claude/hooks/heredoc-sin-barras.mjs: esta orden lleva un heredoc y ${peligro}, y el shell de este equipo las cambia en silencio. Escribe el texto con Write (o Edit) a un fichero y ejecútalo, sin heredoc.\n`);
    process.exit(2);
  }
  // LA OTRA PUERTA (10/11/2026, aprobada por el arquitecto): un «node -e "…"» o «node -p "…"» (o --eval/--print) con el código entre
  // comillas DOBLES. Dentro de comillas dobles el shell interpreta la barra invertida y la comilla invertida, y ha cambiado el código en
  // silencio igual que en el heredoc. Se mira sólo el argumento entre comillas dobles; uno entre comillas simples no lo toca el shell.
  for (const m of orden.matchAll(/\bnode(?:\.exe)?\s+(?:-{1,2}[\w-]+(?:=\S+)?\s+)*?(?:-e|-p|--eval|--print)\s+"/g)) {
    let i = m.index + m[0].length, arg = '';
    while (i < orden.length && orden[i] !== '"') { if (orden[i] === '\\') { arg += orden.slice(i, i + 2); i += 2; } else arg += orden[i++]; }
    const p = arg.includes('\\') ? 'una barra invertida' : arg.includes('`') ? 'una comilla invertida' : null;
    if (p) {
      process.stderr.write(`BLOQUEADO por .claude/hooks/heredoc-sin-barras.mjs: esta orden lleva un «node -e/-p» con el código entre comillas dobles y ${p}, y el shell de este equipo las cambia en silencio. Escribe el código con Write a un fichero .mjs y ejecútalo con node.\n`);
      process.exit(2);
    }
  }
  process.exit(0);
});
