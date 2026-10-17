# ES3 — Implementación de la solución de software

## Sistema de Control y Monitoreo para AquaPlants / AquaBrain

**Informe académico de implementación, pruebas y validación**

| | |
|---|---|
| **Institución** | INACAP |
| **Asignatura** | Proyecto Integrado — 4.º semestre |
| **Evaluación** | ES3 — Implementación de la solución de software (Unidad 3) |
| **Proyecto** | Sistema de Control y Monitoreo para AquaPlants / AquaBrain |
| **Equipo** | Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera |
| **Docente** | Armin Vladimir Brunt Ruth |
| **Contraparte** | AquaPlants / AquaBrain (Robotic Systems) |
| **Stack implementado** | Node.js 20 + NestJS 10 + Prisma 5 + PostgreSQL 16 · React 18 + Vite 5 + TypeScript 5.6 · Docker Compose · GitHub Actions |
| **Hardware de referencia** | ESP32-S3 + AHT10 + HC-SR04 + display OLED SSD1309 + joystick; app Android 14 de prueba |
| **Fecha** | 2026-10-17 |
| **Versión** | 1.0 — presentación académica de la implementación ES3 |

---

## Resumen ejecutivo

ES1 diagnosticó **qué** había que resolver; ES2 **diseñó** la solución; **ES3 la construye y la mide**. Este
informe presenta, como pieza académica autocontenida, la **implementación real** del Sistema de Control y
Monitoreo de AquaPlants / AquaBrain y la **evidencia de su ejecución**: el backend, el dashboard, el simulador
del gateway y la base de datos, junto con las pruebas corridas y sus resultados.

La solución implementada es un **monorepo con npm workspaces** que contiene tres aplicaciones y un paquete
compartido:

- **API NestJS** sobre Prisma 5 y PostgreSQL 16 — **35 rutas** publicadas en OpenAPI, autenticación JWT con
  refresco rotado, **RBAC de 21 permisos**, ingesta idempotente de mediciones, motor de reglas en línea,
  auditoría y endurecimiento HTTP.
- **Dashboard React** con Vite — **panel en vivo** con frescura de dispositivos, **históricos** con agregación,
  gráfico y exportación CSV, y **bandeja de alertas** con resolución; verificado en un navegador real.
- **Simulador del gateway** ESP32-S3 — reproduce el protocolo de ingesta en modos `online`, `offline`
  (con idempotencia) y `anomalía`.
- **Base de datos PostgreSQL 16** — **19 modelos**, migrada con Prisma Migrate y poblada con **52 230 mediciones**,
  con índices que sostienen las consultas en milisegundos.

**Resultados medidos (todos provenientes de ejecuciones reales):**

| Métrica | Resultado | Meta / umbral | Fuente |
|---|---|---|---|
| Pruebas automatizadas en verde | **125** (50 unitarias + 75 integración) | — | Jest / Supertest (§11) |
| Cobertura de líneas | **92,26 %** | ≥ 70 % (RNF10) | `coverage-summary.json` |
| Cobertura de sentencias | **91,09 %** | ≥ 70 % | `coverage-summary.json` |
| Panel — `GET /dashboard/estado` (p50) | **104,1 ms** | < 2 000 ms (RNF03) | Script TS-43 |
| Históricos 1 mes sobre 52 230 filas (p50) | **573,7 ms** | < 5 000 ms (RNF03) | Script TS-43 |
| Ingesta por lote de 500 lecturas (mediana) | **1 403 ms** | — (antes 16 410 ms) | TS-43 / R-01 |
| Imagen Docker de la API | construida · **162 MB** · 82,2 s | reproducible | `docker build` |
| Cumplimiento del catálogo de pruebas | **38 / 44** aprobados; 1 con hallazgo; 3 parciales; 2 no aplica | — | §11 |

> **Declaración de honestidad intelectual.** Cada cifra de este informe proviene de una ejecución real
> registrada (reportes de prueba, `coverage-summary.json`, planes de consulta, salidas de consola, capturas y
> salidas de `docker build`/`npm audit`). Lo que se diseñó en ES2 y **no** llegó a implementarse se declara de
> forma explícita —despliegue en nube, pruebas con k6/ZAP/Lighthouse, almacenamiento NoSQL y particionado de
> tablas— en el capítulo 13 (*Discrepancias*), en lugar de ocultarse o maquillarse. No se inventan cifras ni
> resultados.

---

## Cómo este informe cubre la rúbrica (15 indicadores)

Cada indicador de la evaluación ES3 se aborda en un capítulo específico y con evidencia verificable:

| # | Indicador de la rúbrica (Unidad 3) | Qué se evidencia | Dónde |
|---|---|---|---|
| 1 | Coherencia entre la funcionalidad de la interfaz y las necesidades del negocio | Interfaces implementadas y trazadas a procesos e historias de usuario | Cap. 04 y 14 |
| 2 | Cumplimiento de lineamientos estéticos y funcionales | Consistencia visual, estados, mensajes y comportamiento responsive | Cap. 04 |
| 3 | Estructura adecuada de la base de datos | BD operativa con relaciones, claves, índices y datos de prueba | Cap. 06 |
| 4 | Optimización y normalización | Evidencia de normalización/optimización y justificación de índices | Cap. 06 |
| 5 | Implementación de patrones de seguridad | Autenticación/autorización, validación, protección de credenciales y controles | Cap. 07 |
| 6 | Cumplimiento de estándares de la industria | Convenciones de código, estructura mantenible, control de versiones y revisión | Cap. 08 |
| 7 | Colaboración en equipo | Repositorio, commits, ramas/PR, tareas y documentación del equipo | Cap. 02 |
| 8 | Configuración del entorno de trabajo | Despliegue reproducible: variables de entorno, servicios, BD y procedimiento | Cap. 02 y 09 |
| 9 | Documentación de la implementación | README/guía de instalación, arquitectura y operación | Cap. 09 |
| 10 | Cobertura del plan de pruebas | Casos trazados a casos de uso, incluyendo borde y errores | Cap. 10 |
| 11 | Ejecución del protocolo de pruebas | Registro: esperado, obtenido, estado, evidencia y observación | Cap. 11 |
| 12 | Validación de resultados | Análisis de resultados y conclusiones sobre la calidad de la solución | Cap. 12 |
| 13 | Precisión en la comparación obtenido vs. esperado | Tabla esperada vs. obtenida, discrepancias, causa probable y criticidad | Cap. 12 y 13 |
| 14 | Generación de recomendaciones basadas en la comparación | Mejoras priorizadas derivadas de los resultados de pruebas | Cap. 13 |
| 15 | Responde preguntas | Justificación de decisiones técnicas y funcionales por todo el equipo | Cap. 17 (defensa) y todo el informe |

El **criterio de calidad transversal** —*la evidencia debe ser trazable y coherente*— se satisface en el
capítulo 14: la cadena **historia de usuario → requerimiento → caso de uso/diseño → implementación → prueba**
queda cerrada para todos los requisitos *Must* y *Should*, con el código y la prueba que la respaldan.

---

## Índice

- **00** Portada y resumen ejecutivo
- **01** Introducción, alcance y decisiones de implementación
- **02** Repositorio, colaboración en equipo y entorno de trabajo
- **03** Arquitectura e implementación del backend
- **04** Interfaz, coherencia con el negocio y lineamientos estéticos
- **05** Simulador del gateway (ESP32-S3)
- **06** Base de datos: estructura, normalización y optimización
- **07** Seguridad implementada
- **08** Estándares de la industria y calidad del código
- **09** Despliegue reproducible y documentación
- **10** Cobertura del plan de pruebas
- **11** Ejecución del protocolo de pruebas (registro esperado/obtenido)
- **12** Validación de resultados y comparación con lo esperado
- **13** Discrepancias, causa probable y recomendaciones priorizadas
- **14** Matriz de trazabilidad
- **15** Conclusiones
- **16** Bibliografía
- **17** Anexos técnicos y banco de preguntas de defensa

---

## Nota metodológica y de honestidad intelectual

1. **Base de la implementación.** ES3 materializa el diseño de ES2 y respeta el catálogo canónico corregido de
   ES1 (`docs/ES1/00-backlog-base.md`): **NEC-01…NEC-09, HU01…HU11, RF01…RF15, RNF01…RNF11, CU-01…CU-16,
   RN-01…RN-12**, además del catálogo de diseño de ES2 (**D-01…D-15, TS-01…TS-44, SUP-01…SUP-10**).
2. **Sin datos inventados.** Los valores de rendimiento, cobertura, volumetría y estado de pruebas se citan
   desde artefactos de ejecución. Cuando una cifra esperada por el borrador no se alcanzó (por ejemplo, el
   análisis de dependencias), se reporta el valor **real** y su causa.
3. **Implementación, no diseño.** Este informe **no** describe lo que se planea: describe lo que **corre**. Las
   referencias al código apuntan a rutas reales del monorepo (`apps/api`, `apps/web`, `apps/simulator`,
   `packages/shared`, `infra`, `.github`).
4. **Artefactos canónicos.** El detalle técnico se conserva en `docs/ES3/00-…-16-…` y su compilado
   `docs/ES3/ES3-AquaBrain-entrega.*`. Este documento es la **presentación académica** de esa implementación y
   no redefine identificadores ni cifras.
