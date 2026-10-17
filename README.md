# Sistema de Control y Monitoreo para AquaPlants / AquaBrain

Proyecto académico de **Proyecto Integrado** (4.º semestre) para el desafío **AquaPlants / AquaBrain**.

| | |
|---|---|
| **Equipo** | Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera |
| **Docente** | Armin Vladimir Brunt Ruth |
| **Hardware real del cliente** | ESP32-S3 + AHT10 + HC-SR04 + display OLED SSD1309 + joystick; app Android 14 de prueba |
| **Estado actual** | ES1 corregido y **ES2 — Diseño de la solución de software** |

---

## 1. Índice de la documentación

| Documento | Contenido | Evaluación |
|---|---|---|
| [`docs/ES1/00-backlog-base.md`](docs/ES1/00-backlog-base.md) | **Catálogo canónico corregido**: necesidades con MoSCoW, HU01–HU11, RF01–RF15, RNF01–RNF11, casos de uso, reglas de negocio, metodología con puntajes y seguridad/ética | ES1 |
| [`docs/ES1/01-correcciones-aplicadas.md`](docs/ES1/01-correcciones-aplicadas.md) | Registro de las correcciones del docente (C-01…C-08) y su efecto sobre el catálogo y sobre ES2 | ES1 |
| [`docs/ES2/00-resumen-y-contexto.md`](docs/ES2/00-resumen-y-contexto.md) | Resumen ejecutivo, decisiones de diseño y trazabilidad con la rúbrica ES2 | ES2 |
| [`docs/ES2/01-metodologia-cronograma.md`](docs/ES2/01-metodologia-cronograma.md) | Metodología (Scrum, sprints de 2 semanas), cronograma por iteraciones, dependencias y prioridades | ES2 |
| [`docs/ES2/02-arquitectura-4mas1.md`](docs/ES2/02-arquitectura-4mas1.md) | Arquitectura 4+1 completa (escenarios, lógica, procesos, desarrollo, física) | ES2 |
| [`docs/ES2/03-stack-e-infraestructura.md`](docs/ES2/03-stack-e-infraestructura.md) | Stack justificado, infraestructura, CI/CD y despliegue | ES2 |
| [`docs/ES2/04-wireframes-y-guia-visual.md`](docs/ES2/04-wireframes-y-guia-visual.md) | Wireframes de los procesos principales, guía visual, responsive y accesibilidad | ES2 |
| [`docs/ES2/05-modelo-de-datos.md`](docs/ES2/05-modelo-de-datos.md) | DER, diccionario de datos, integridad, índices, normalización y decisión SQL/NoSQL | ES2 |
| [`docs/ES2/aquaplants_schema.sql`](docs/ES2/aquaplants_schema.sql) | **DDL ejecutable** (PostgreSQL 15+) del esquema físico; anexo §11 de `05-modelo-de-datos.md` | ES2 |
| [`docs/ES2/06-seguridad.md`](docs/ES2/06-seguridad.md) | Autenticación, autorización y matriz de permisos, amenazas, controles, código seguro y ética | ES2 |
| [`docs/ES2/07-plan-de-pruebas.md`](docs/ES2/07-plan-de-pruebas.md) | Plan de pruebas unitarias, de integración, de rendimiento y manuales | ES2 |
| [`docs/ES2/08-trazabilidad.md`](docs/ES2/08-trazabilidad.md) | NEC → HU → RF/RNF → CU → diseño → implementación → prueba | ES2 |
| [`docs/ES2/09-feedback-prototipo.md`](docs/ES2/09-feedback-prototipo.md) | Supuestos abiertos y registro de retroalimentación con cambios aplicados | ES2 |
| [`docs/ES2/10-checklist-entrega.md`](docs/ES2/10-checklist-entrega.md) | Checklist de cobertura de la rúbrica (indicadores 2.1.1.1…2.1.6.15) y control de calidad | ES2 |
| [`docs/ES2/11-defensa-preguntas.md`](docs/ES2/11-defensa-preguntas.md) | Banco de preguntas y respuestas para la defensa (indicador 2.1.6.15) | ES2 |

---

## 2. Propuesta de valor

> Centralizar en una **plataforma web única con API-first** las mediciones que hoy solo se ven en el display OLED
> del AquaBrain, para que el encargado de cultivo actúe a tiempo, el supervisor compare sistemas y el administrador
> gobierne usuarios, dispositivos, sensores y reglas, con datos trazables en el tiempo y trato seguro de la
> aplicación Android ya construida por la empresa.

---

## 3. Alcance comprometido (MoSCoW de ES1)

| Prioridad | Requisitos |
|---|---|
| **Must** | RF01–RF07, RF10–RF12 · RNF01, RNF05, RNF06, RNF11 |
| **Should** | RF08, RF13, RF14 · RNF02, RNF03, RNF07, RNF08, RNF10 |
| **Could** | RF09 |
| **Won't (por ahora)** | RF15 (licenciamiento) · RNF04 (escalabilidad masiva, se documenta) · RNF09 (autonomía local, depende del firmware) |

---

## 4. Cómo leer esta documentación

- Los diagramas usan **Mermaid** y se renderizan en GitHub, VS Code y la mayoría de los visores Markdown.
- Los identificadores son globales y estables: `NEC-*`, `HU*`, `RF*`, `RNF*`, `CU-*`, `RN-*`, `TS-*`, `SUP-*`, `RSK-*`, `D-*`, `RA-*`, `MC-*`, `EC-*`, `FB-*`, `W-*`.
- `docs/ES1/00-backlog-base.md` es la **fuente de verdad**: cualquier cambio de alcance se hace allí y luego se propaga a ES2.
- Los campos `‹…›` que aún queden deben completarse antes de la entrega (enlace del prototipo navegable y nombre de la contraparte).

---

## 5. Entregables compilados (ES2)

El documento de **ES2** se compila en un único HTML autocontenido (portada, índice, las 12 secciones `00`–`11` y los anexos de ES1) y en su PDF, ambos disponibles en la carpeta de la Unidad 2:

- `C:\Users\prome\OneDrive\Desktop\Inacap 4 semestre\Proyecto Integrado\Unidad 2 Diseño de la solución de software\ES2-AquaBrain-entrega.html`
- `C:\Users\prome\OneDrive\Desktop\Inacap 4 semestre\Proyecto Integrado\Unidad 2 Diseño de la solución de software\ES2-AquaBrain-entrega.pdf`

El PDF incluye los **23 diagramas Mermaid vectorizados** y el HTML trae un botón **Imprimir / PDF**.

> **Marcadores aún pendientes:** `‹URL-FIGMA›` (enlace al prototipo navegable) y `‹CONTRAPARTE›` (nombre/función de quien valida). Las fechas (`‹fecha›` del registro de feedback y `‹FECHA›` del control de versiones) ya fueron completadas.
