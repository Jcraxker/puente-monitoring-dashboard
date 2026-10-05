# Puente · Dashboard de Monitoreo / Monitoring Dashboard

Fundación Puente Guatemala — área de Monitoreo y Evaluación.

## ES

Dashboard web que reemplaza el reporte manual en Excel: sincroniza actividades desde
KoBoToolbox, muestra tabla con filtros, KPIs, viáticos por corte 16-15 y constancias en PDF.

### Requisitos / Requirements

- Docker + Docker Compose
- Token de KoBoToolbox (área de monitoreo)

### Puesta en marcha / Quickstart

```bash
cp backend/.env.example .env
# completar POSTGRES_PASSWORD, JWT_SECRET, KOBO_TOKEN, HASH_* en .env
docker compose up -d --build
# seed usuarios demo:
docker compose exec app node db/seed.js
```

Abrir / Open: http://localhost:3001 — API + frontend en el mismo puerto.

### Comandos

| Comando | Qué hace |
|---|---|
| `docker compose up -d` | levanta DB + app |
| `docker compose exec app node db/seed.js` | crea usuarios demo |
| `./scripts/backup.sh` | respaldo `pg_dump` con fecha |

### Seguridad

Secretos solo en `.env` (ignorado en git). Postgres sin puertos públicos.
El token KoBo nunca sale del backend (fotos por proxy autenticado).

### Checklist pre-producción
- [ ] Cambiar claves demo (`HASH_*` nuevos, borrar 1234)
- [ ] `JWT_EXPIRES_DAYS=7` (demo usa 30 por comodidad)
- [ ] Rotar `KOBO_TOKEN` (el actual se expuso en un share público)
- [ ] Ante token robado: cambiar `JWT_SECRET` y reiniciar (invalida todo)

## EN

Web dashboard replacing the manual Excel report: syncs field activities from
KoBoToolbox, with filterable tables, KPIs, 16–15 payroll-cut per-diems and PDF statements.

Same quickstart as above. Secrets live only in `.env` (git-ignored).
PostgreSQL has no public ports. The KoBo token never leaves the backend.
