# 1. Introducción

## 1.1 Propósito del informe

Este documento corresponde a la **tercera entrega (ES3)** del Proyecto Integrado y da cuenta de la **implementación real** del Sistema de Control y Monitoreo para **AquaPlants / AquaBrain**. A diferencia de ES2 —donde se *diseñó* la solución—, aquí se documenta el **software construido y ejecutado**: el backend, el dashboard web, el simulador del gateway y la base de datos, junto con la evidencia de su funcionamiento (salidas de consola, capturas, planes de consulta y métricas).

Regla que rige todo el informe: **cada cifra proviene de una ejecución real**. Cuando algo se diseñó en ES2 pero no llegó a implementarse, se declara explícitamente como **no implementado** en la sección 11 (*Análisis de discrepancias*), en lugar de maquillarse. Esa honestidad es, además, uno de los criterios de evaluación del proyecto.

## 1.2 Alcance de la Unidad 3

| Dimensión | ES2 (diseño) | ES3 (implementación) |
|---|---|---|
| Backend | Especificado (FastAPI en el borrador) | **Implementado** en NestJS 10 + Prisma 5 + PostgreSQL 16 |
| Base de datos | DDL y DER diseñados | **Esquema migrado** con Prisma Migrate y sembrado con 30 días de datos |
| Frontend | Wireframes y guía visual | **Dashboard React funcional** (panel, históricos, alertas) |
| Gateway | Supuesto (ESP32-S3 real del cliente) | **Simulador** que reproduce su protocolo de ingesta |
| Pruebas | Plan TS-01…TS-44 | **123 pruebas ejecutadas** (50 unitarias + 73 de integración) |
| Despliegue | Propuesto | **docker-compose** con API, PostgreSQL y dashboard; CI en GitHub Actions |

El alcance funcional se rige por el MoSCoW de ES1: los requisitos **Must** y **Should** están implementados; lo **Won't** (RF15, RNF04, RNF09) se documenta como pendiente.

## 1.3 Metodología

Se mantuvo el enfoque iterativo-incremental acordado en ES2 (sprints de dos semanas, tablero Kanban, *Definition of Done* con pruebas). En la práctica, el trabajo de implementación se organizó por **módulo vertical completo** (esquema → servicio → controlador → pruebas) y cada incremento se cerró solo cuando su suite de pruebas quedaba en verde.

La evidencia de seguimiento es el propio **historial de control de versiones** del repositorio (sección 2), que registra los incrementos reales del equipo.

## 1.4 Resumen de resultados

- **Backend:** API NestJS con 35 rutas publicadas en OpenAPI, 21 permisos, autenticación JWT + refresh, control de acceso por roles y auditoría de operaciones.
- **Base de datos:** 19 modelos relacionales en PostgreSQL 16; 20 tablas; la tabla de mediciones supera las **50 000 filas** con índices que mantienen las consultas en el orden de los milisegundos.
- **Frontend:** dashboard con panel en vivo, series históricas con gráficos y exportación CSV, y bandeja de alertas con resolución; verificado en un navegador real contra la API en ejecución.
- **Simulador:** reproduce los modos *online*, *offline* (con sincronización diferida e idempotencia) y *anomalía* (valores fuera de rango).
- **Pruebas:** **123 pruebas en verde**; cobertura combinada por encima del umbral del 70 % en líneas y sentencias.
- **Rendimiento (TS-43):** panel < 0,4 s y serie de un mes sobre 50 730 filas < 0,7 s (p95), muy por debajo de las metas de 2 s y 5 s.

## 1.5 Estructura del documento

El informe sigue las 16 secciones del borrador de la Unidad 3: introducción; repositorio y entorno; backend; frontend; simulador; base de datos; seguridad; despliegue; ejecución del plan de pruebas; resultados frente a lo esperado; análisis de discrepancias; recomendaciones; trazabilidad; conclusiones; bibliografía y anexos.

> **Convención sobre rutas del repositorio.** Todos los archivos se citan relativos a la raíz del proyecto. En Windows, la carpeta del proyecto contiene espacios, por lo que toda ruta se cita entre comillas al ejecutarse en la terminal.
