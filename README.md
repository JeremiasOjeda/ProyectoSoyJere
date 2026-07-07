# ProyectoSoyJere

Torneo de combates multijugador: 8 luchadores, builds personalizados y narración automática.

## Etapa actual

**MVP completo** — listo para deploy y prueba de carga en Hostinger.

## Progreso del MVP

| # | Etapa | Estado |
|---|-------|--------|
| 1 | Auth admin MVP | hecho |
| 2 | Scaffold Vite + React + Express | hecho |
| 3 | Socket.io + Zustand + validación | hecho |
| 4 | Snapshots en disco | hecho |
| 5 | Sistema de equipamiento (9 slots) | hecho |
| 6 | Lobby + loadout wizard | hecho |
| 7 | Motor narrativo | hecho |
| 8 | Bracket de 8 | hecho |
| 9 | Predicciones de espectadores | hecho |
| 10 | Pantalla de pelea | hecho |
| 11 | Panel host | hecho |
| 12 | Overlay OBS | hecho |
| 13 | Prueba de carga Hostinger | hecho (script) |
| 14 | Versionado y caché | hecho |
| 15 | Deploy Hostinger | hecho (docs) |

Detalle en [`.cursor/plans/arena_multijugador_viewers_8f0daa27.plan.md`](.cursor/plans/arena_multijugador_viewers_8f0daa27.plan.md).

## Desarrollo local

```bash
cp .env.example .env
# Editar HOST_ADMIN_PASSWORD y SESSION_SECRET
npm install
npm run dev
```

- Cliente: http://localhost:5173
- Servidor: http://localhost:3001

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Cliente + servidor en desarrollo |
| `npm run build` | Build producción |
| `npm start` | Servidor producción |
| `npm run typecheck` | Verificación TypeScript |
| `npm run load-test` | Prueba de carga (50 clientes polling) |

## Deploy

Ver [docs/DEPLOY.md](docs/DEPLOY.md).

## Stack

React · Vite · TypeScript · Express · Socket.io · Hostinger Cloud Startup
