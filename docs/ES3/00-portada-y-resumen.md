# AquaBrain — Implementación de la Solución de Software (ES3)

**Sistema de Control y Monitoreo para AquaPlants / AquaBrain**

| | |
|---|---|
| **Asignatura** | Proyecto Integrado (4.º semestre) |
| **Entrega** | Unidad 3 — Implementación de la solución de software (ES3) |
| **Equipo** | Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera |
| **Docente** | Armin Vladimir Brunt Ruth |
| **Hardware real del cliente** | ESP32-S3 + AHT10 + HC-SR04 + display OLED SSD1309 + joystick; app Android 14 de prueba |
| **Stack implementado** | NestJS 10 · Prisma 5 · PostgreSQL 16 · React 18 · Vite 5 · Docker · GitHub Actions |

---

## Resumen ejecutivo

Esta entrega corresponde a la **Unidad 3 (implementación)**. A diferencia de ES2 —donde se *diseñó* la solución—, aquí se documenta el **software construido y ejecutado**, con evidencia de ejecuciones reales.

**Lo implementado:**

- **Backend NestJS** con 35 rutas publicadas en OpenAPI, autenticación JWT + refresh, RBAC de 21 permisos, auditoría y endurecimiento HTTP.
- **Base de datos PostgreSQL 16** con 19 modelos, migrada con Prisma y sembrada con 30 días de datos; **más de 50 000 mediciones** e índices que sostienen consultas en milisegundos.
- **Dashboard React** con panel en vivo, históricos con gráficos y exportación CSV, y bandeja de alertas con resolución; verificado en navegador real.
- **Simulador del gateway** con modos *online*, *offline* (idempotencia) y *anomalía*.
- **Docker Compose + CI**; imagen de la API construida y verificada.

**Resultados medidos:**

| Métrica | Resultado | Meta |
|---|---|---|
| Pruebas automatizadas | **123 en verde** (50 unitarias + 73 integración) | — |
| Cobertura de líneas | **91,96 %** | ≥ 70 % |
| Panel (p50) | **200,7 ms** | < 2 000 ms |
| Históricos 1 mes sobre 50 730 filas (p50) | **397,4 ms** | < 5 000 ms |
| Imagen Docker de la API | construida (162 MB, 82,2 s) | reproducible |

**Regla de honestidad del informe:** toda cifra proviene de una ejecución real. Lo diseñado en ES2 que no se implementó se declara de forma explícita en la sección 11 (*Análisis de discrepancias*) —por ejemplo, el despliegue en nube, las pruebas con k6/ZAP/Lighthouse, el almacenamiento NoSQL y el particionado— en lugar de ocultarse.

---

## Índice

1. [Introducción](#1-introducción)
2. [Repositorio y Entorno de Trabajo](#2-repositorio-y-entorno-de-trabajo)
3. [Implementación del Backend (API)](#3-implementación-del-backend-api)
4. [Implementación del Frontend (Dashboard)](#4-implementación-del-frontend-dashboard)
5. [Implementación del Simulador IoT](#5-implementación-del-simulador-iot)
6. [Evidencia de la Base de Datos](#6-evidencia-de-la-base-de-datos)
7. [Evidencia de Seguridad](#7-evidencia-de-seguridad)
8. [Despliegue y Reproducibilidad](#8-despliegue-y-reproducibilidad)
9. [Ejecución del Plan de Pruebas](#9-ejecución-del-plan-de-pruebas)
10. [Resultados Obtenidos vs. Esperados](#10-resultados-obtenidos-vs-esperados)
11. [Análisis de Discrepancias](#11-análisis-de-discrepancias)
12. [Recomendaciones Priorizadas](#12-recomendaciones-priorizadas)
13. [Trazabilidad HU → RF → Implementación → Prueba](#13-trazabilidad-hu--rf--implementación--prueba)
14. [Conclusiones](#14-conclusiones)
15. [Bibliografía](#15-bibliografía)
16. [Anexos](#16-anexos)
