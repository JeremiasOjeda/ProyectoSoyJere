# Deploy en Hostinger Cloud Startup

## Requisitos

- Node.js 20+ en el servidor
- Repositorio conectado vía GitHub o Hostinger Git Deploy
- Variables de entorno configuradas en hPanel

## Variables de entorno

```env
NODE_ENV=production
PORT=3001
HOST_ADMIN_PASSWORD=tu_clave_secreta
SESSION_SECRET=string_largo_aleatorio
PUBLIC_ORIGIN=https://tudominio.com
```

## Build y arranque

```bash
npm ci
npm run build
npm start
```

El servidor Express sirve el cliente Vite desde `dist/` y Socket.io en el mismo puerto.

## Proxy / dominio

Configurá el dominio para apuntar al proceso Node en el puerto `PORT`. Si usás Apache/Nginx delante, asegurate de permitir long-polling en `/socket.io/`.

## Prueba de carga post-deploy

```bash
npx tsx scripts/load-test.ts https://tudominio.com 50
```

Criterio: p95 < 2s, 0 errores durante 10 min.

## Snapshots

Los torneos en curso se guardan en `data/snapshots/`. Creá el directorio con permisos de escritura:

```bash
mkdir -p data/snapshots
```

## Checklist post-deploy

1. `GET /api/health` → `{ ok: true }`
2. `GET /api/version` → versión actual
3. Login admin → crear sala → unirse con 8 clientes
4. Verificar que `index.html` no se cachea (Network → no-cache)
5. Pestaña con versión vieja muestra actualización (VersionGuard)
