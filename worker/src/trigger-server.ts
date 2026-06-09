import { createServer } from 'node:http';

const TRIGGER_SECRET = process.env.RAILWAY_TRIGGER_SECRET;
const PORT           = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 8080;

// Inicia un servidor HTTP mínimo que expone un único endpoint seguro:
//   POST /trigger/agent — dispara el poll de conv turns inmediatamente.
//
// Seguridad:
//   · Método + ruta verificados antes del secreto (falla rápido en URLs desconocidas).
//   · Authorization: Bearer <RAILWAY_TRIGGER_SECRET> validado antes de ejecutar nada.
//   · No lee el body ni acepta parámetros: el comportamiento es fijo y no configurable
//     desde fuera. El qué procesar lo decide siempre el claim interno por locked_at.
//   · Si RAILWAY_TRIGGER_SECRET no está definido, el servidor no arranca (degradación
//     segura: el polling sigue funcionando solo).
export function startTriggerServer(onTrigger: () => void): void {
  if (!TRIGGER_SECRET) {
    console.warn('[trigger] RAILWAY_TRIGGER_SECRET no configurado — endpoint deshabilitado (polling activo)');
    return;
  }

  const server = createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/trigger/agent') {
      res.writeHead(404);
      res.end();
      return;
    }

    const auth = req.headers['authorization'] ?? '';
    if (auth !== `Bearer ${TRIGGER_SECRET}`) {
      res.writeHead(401);
      res.end();
      return;
    }

    onTrigger();
    res.writeHead(200);
    res.end();
  });

  server.listen(PORT, () => {
    console.log(`[trigger] Servidor HTTP en puerto ${PORT} — POST /trigger/agent activo`);
  });

  server.on('error', (err: Error) => {
    console.error('[trigger] Error del servidor HTTP:', err.message);
  });
}
