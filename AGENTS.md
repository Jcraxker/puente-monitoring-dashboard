# Puente Dashboard — reglas del proyecto

Stack: React 18 + Vite + Tailwind 4 + Zustand · Express + PostgreSQL · Cloudflare Tunnel.
Roles hardcodeados (monitor/gestor/tecnico). Sync KoBo manual. Commits en INGLÉS en
repo público + docs bilingües (decisión 2026-09-03, ver `memoria/02_decisiones.md`).

## Memoria (obligatorio)
- Memoria global vive SIEMPRE en `~/memory-ai` (home, repo privado `Jcraxker/memory-ai`).
  Nunca moverla ni duplicarla: este archivo solo la referencia.
- Al iniciar: leer `~/memory-ai/MEMORY.md` + `~/memory-ai/project_puente.md`.
- Memoria del proyecto: `memoria/` (índice en `memoria/00_indice.md`).
- Al cerrar trabajo significativo: actualizar `memoria/03_cambios.md`,
  `memoria/04_pendientes.md` y `~/memory-ai/project_puente.md`.

## Puertos y servicios
- Frontend dev 5173 · estático 5137 (`node serve.cjs`) · DB postgres 5432 · Backend 3001 (`npm start` en backend/).
