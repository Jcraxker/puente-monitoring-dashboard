# Puente Monitoring Dashboard (WIP)

Dashboard web de monitoreo de actividades para **Fundación Puente Guatemala** (ONG, est. 2009), pensado para automatizar el reporte de actividades de campo recopiladas en KoBoToolbox, reemplazando el proceso manual en Excel.

Web dashboard to monitor field activities at **Fundación Puente Guatemala** (NGO, est. 2009). It aims to automate the reporting of field activities collected in KoBoToolbox, replacing the manual Excel workflow.

> **⚠️ Estado / Status: EN DESARROLLO — fase inicial (Semana 3 de prácticas).** Este repositorio abre como práctica profesional. Actualmente solo contiene documentación base (README, licencia, gitignore). **El código del dashboard y del backend aún no existe.** No hay funcionalidades implementadas todavía.
>
> **⏱️ Planificación / Planning (17 ago – 03 sep):** investigación, análisis de requerimientos y maquetas de acuerdo a lo solicitado por los usuarios de la ONG, propuesta técnica y acuerdo de licencia. El desarrollo del código inicia esta semana.
>
> **⚠️ Under development — initial phase (internship week 3).** This repository opens as a professional internship project. It currently only contains base documentation (README, license, gitignore). **The dashboard and backend code do not exist yet.** No features are implemented so far.
>
> **⏱️ Planning (Aug 17 – Sep 03):** research, requirements analysis and mockups according to NGO users' requests, technical proposal and license agreement. Code development starts this week.

## Contexto / Context

El problema que busca resolver: el reporte mensual de actividades se hace manualmente (descargar de KoBoToolbox → copiar a plantilla Excel con macros VBA → verificar fórmulas → generar reportes). Proceso propenso a errores y lento (17-45 min por reporte).

The problem it aims to solve: the monthly activity report is done manually (download from KoBoToolbox → copy into an Excel template with VBA macros → verify formulas → generate reports). Error-prone and slow (17-45 min per report).

## Plan técnico previsto / Planned tech stack

| Capa / Layer | Tecnología / Technology |
|------|------------|
| Frontend | React + Vite + Tailwind CSS 4 |
| Backend | Node.js + Express |
| Base de datos / Database | PostgreSQL |
| Autenticación / Auth | JWT + bcrypt |
| Deploy | Cloudflare Tunnel (reverse tunnel, $0) |

*Stack previsto según documentación del proyecto. Su implementación está pendiente.*

*Planned per project documentation. Implementation is pending.*

## Roadmap previsto / Planned roadmap

- **Semana 1:** Configuración + maqueta / Setup + mockup
- **Semana 2:** Backend + API conectada a KoBoToolbox / Backend + API connected to KoBoToolbox
- **Semana 3:** Dashboard con tabla de datos / Dashboard with data table
- **Semana 4:** Filtros, KPIs, viáticos / Filters, KPIs, expenses
- **Semana 5:** Login + exportación / Login + export
- **Semana 6:** Pruebas + documentación / Testing + documentation

## Alcance / Scope

Proyecto de prácticas profesionales de [Jack Fallas](https://github.com/JCraxker) (estudiante de informática). Desarrollado con metodología Scrum y entregas semanales.

Professional internship project by [Jack Fallas](https://github.com/JCraxker) (computer science student). Built with Scrum methodology and weekly deliveries.

## Licencia / License

Todos los derechos reservados bajo la [licencia](./LICENSE) de Jack Fallas. Publicado con fines de portafolio profesional. No se permite redistribución ni trabajos derivados sin autorización del autor.

All rights reserved under [license](./LICENSE) by Jack Fallas. Published for professional portfolio purposes. Redistribution and derivative works are not permitted without the author's authorization.

---

**Autor / Author:** [Jack Fallas](https://github.com/JCraxker)
