# 01 · Introducción, alcance y decisiones de implementación

## 1.1 Propósito del informe

Este documento corresponde a la **tercera entrega (ES3)** del Proyecto Integrado y da cuenta de la
**implementación real** del Sistema de Control y Monitoreo para **AquaPlants / AquaBrain**. A diferencia de
ES2 —donde se *diseñó*—, aquí se documenta el **software construido y ejecutado**: el backend, el dashboard, el
simulador del gateway y la base de datos, junto con la evidencia de su funcionamiento (resultados de prueba,
planes de consulta, métricas de rendimiento y capturas).

La rúbrica de la Unidad 3 exige demostrar que el diseño fue convertido en **software funcional, seguro,
desplegable y probado**. Este informe responde a esa exigencia en dos planos: **presenta** la solución
construida y **demuestra** con evidencia que funciona.

## 1.2 Alcance de la Unidad 3

El alcance funcional se rige por el **MoSCoW** de ES1. La implementación cubre los requisitos **Must** y
**Should**, deja el único *Could* (RF09) parcial y documenta los *Won't* como pendientes:

| Prioridad | Requisitos | Estado en ES3 |
|---|---|---|
| **Must** | RF01–RF07, RF10–RF12 · RNF01, RNF05, RNF06, RNF11 | Implementados y probados |
| **Should** | RF08, RF13, RF14 · RNF02, RNF03, RNF07, RNF08, RNF10 | Implementados; RNF02/RNF07/RNF08 con matices declarados |
| **Could** | RF09 (comparativa multi-sistema) | **Parcial**: la API lo soporta; la UI no superpone series |
| **Won't** | RF15 · RNF04 · RNF09 | No abordados; declarados en el capítulo 13 |

| Dimensión | ES2 (diseño) | ES3 (implementación) |
|---|---|---|
| Backend | Especificado (el borrador proponía FastAPI) | **Implementado** en NestJS 10 + Prisma 5 + PostgreSQL 16 |
| Base de datos | DDL y DER diseñados | **Esquema migrado** con Prisma Migrate y sembrado con 30 días de datos |
| Frontend | Wireframes y guía visual | **Dashboard React funcional** (panel, históricos, alertas) |
| Gateway | Supuesto (ESP32-S3 real del cliente) | **Simulador** que reproduce su protocolo de ingesta |
| Pruebas | Plan TS-01…TS-44 | **125 pruebas ejecutadas** (50 unitarias + 75 de integración) |
| Despliegue | Propuesto | **Docker Compose** (API + PostgreSQL + dashboard) y CI en GitHub Actions |

## 1.3 Contexto de negocio que la implementación resuelve

El problema de ES1 —hoy las mediciones del AquaBrain solo se ven en el **display OLED** local— se resuelve con
una **plataforma web API-first** que centraliza la información y permite actuar a tiempo. La implementación
traduce ese objetivo en capacidades concretas:

- **Ver el estado actual** de cada sistema y dispositivo, con la última lectura por sensor y su antigüedad.
- **Consultar el histórico** con agregación y exportación, para decisiones de cultivo.
- **Recibir alertas oportunas** cuando una variable sale de rango, y resolverlas dejando registro.
- **Sobrevivir a cortes de red**: el gateway acumula lecturas y las sincroniza sin duplicar historia.
- **Gobernar el acceso** por roles, con trazabilidad de las operaciones.

## 1.4 Metodología de trabajo

Se mantuvo el enfoque **iterativo-incremental** acordado en ES2 (sprints de dos semanas, tablero Kanban y una
*Definition of Done* que exige pruebas). En la práctica, el trabajo se organizó por **módulo vertical completo
—esquema → servicio → controlador → pruebas—** y cada incremento se cerró solo cuando su **suite de pruebas
quedaba en verde**. La evidencia de seguimiento es el propio **historial de control de versiones** del
repositorio (capítulo 02).

Esta forma de trabajo tuvo un efecto medible: las **pruebas de integración descubrieron defectos reales** que no
aparecían en pruebas unitarias aisladas (capítulo 13), lo que se traduce en un sistema más confiable que el que
se habría entregado sin ejecutar un protocolo de pruebas serio.

## 1.5 Decisiones de implementación y desviaciones respecto de ES2

Toda desviación respecto del diseño se declara con su causa y su impacto (el detalle está en el capítulo 13).
Las principales son:

| # | Esperado (ES2 / borrador) | Implementado | Causa | Impacto |
|---|---|---|---|---|
| D-01 | Backend en **FastAPI (Python)** | **NestJS (TypeScript)** | Unificar el lenguaje del stack y compartir esquemas con el simulador | Nulo en diseño: se conservan capas y contrato REST |
| D-02 | Simulador en Python | **TypeScript** en el monorepo | Reutilizar `@aquabrain/shared` como fuente de verdad | Nulo |
| D-03 | Frontend con **Tailwind + Zustand + Axios** | **CSS propio + estado local/TanStack Query + fetch** | Reducir dependencias sin alterar la interfaz | Nulo funcional |
| D-04 | Almacenamiento **PostgreSQL + MongoDB** | **Solo PostgreSQL** | El modelo relacional cubre todos los casos | TS-32 y TS-34 no aplican |
| D-05 | Tabla `medicion` **particionada** | Tabla **normal** con índices | RNF04 quedó *Won't* en el MoSCoW | Ninguno con el volumen actual |
| D-06 | Motor de reglas **asíncrono** (cola) | Evaluación **en línea** | Simplicidad para el volumen del prototipo | La ingesta carga la evaluación |
| D-07 | Redis para caché y *throttling* distribuido | **No se usa**: el *throttler* es en memoria | No era necesario para una sola instancia | El límite no se comparte entre réplicas |

> **Criterio de las desviaciones.** Ninguna afecta el contrato funcional diseñado en ES2: son decisiones de
> **tecnología y de operación** que mantienen las capas, los endpoints y las reglas de negocio intactos. Cada
> una se justifica por su beneficio (simplicidad, una sola fuente de verdad, menor superficie de dependencias).

## 1.6 Estructura del documento

El informe sigue el orden de la rúbrica: contexto y decisiones (cap. 01), repositorio y entorno (cap. 02),
arquitectura y backend (cap. 03), interfaz y su coherencia con el negocio (cap. 04), simulador (cap. 05), base
de datos y su optimización (cap. 06), seguridad (cap. 07), estándares de la industria (cap. 08), despliegue y
documentación (cap. 09), cobertura del plan de pruebas (cap. 10), ejecución del protocolo (cap. 11), validación
de resultados (cap. 12), discrepancias y recomendaciones (cap. 13), trazabilidad (cap. 14), conclusiones
(cap. 15), bibliografía (cap. 16) y anexos (cap. 17).

> **Convención sobre rutas.** Todos los archivos se citan relativos a la raíz del proyecto. En Windows la
> carpeta del proyecto contiene espacios, por lo que toda ruta se cita entre comillas al ejecutarse en la
> terminal.
