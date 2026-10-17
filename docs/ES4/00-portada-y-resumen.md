# AquaBrain — Cierre, Demostración y Defensa del Proyecto (ES4)

**Sistema de Control y Monitoreo para AquaPlants / AquaBrain**

| | |
|---|---|
| **Asignatura** | Proyecto Integrado (4.º semestre) |
| **Entrega** | Unidad 4 — Comunicación de la solución del proyecto (ES4) |
| **Equipo** | Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera |
| **Docente** | Armin Vladimir Brunt Ruth |
| **Hardware real del cliente** | ESP32-S3 + AHT10 + HC-SR04 + display OLED SSD1309 + joystick; app Android 14 de prueba |
| **Stack implementado** | NestJS 10 · Prisma 5 · PostgreSQL 16 · React 18 · Vite 5 · Docker · GitHub Actions |
| **Documento base** | ES1 (diagnóstico) · ES2 (diseño) · ES3 (implementación) |

---

## Resumen ejecutivo

Esta entrega corresponde a la **Unidad 4 (cierre)**: consolida el proyecto ya **construido y probado** en ES3, comunica sus resultados, presenta el **plan de mantención**, proyecta su **viabilidad** y prepara la **defensa** del equipo.

A diferencia de los borradores de las unidades anteriores —que describían un stack *FastAPI + Python + Redis* y citaban cifras de relleno—, este informe describe el **software que realmente existe** en el repositorio: una **API NestJS**, un **dashboard React**, un **simulador del gateway ESP32-S3** y una **base de datos PostgreSQL 16**, todo probado con **125 pruebas automatizadas**.

**Lo que el proyecto entrega (medido, no estimado):**

| Aspecto | Resultado real | Fuente |
|---|---|---|
| Rutas de API publicadas en OpenAPI | **35** | §3, §7 |
| Modelos de datos / tablas en PostgreSQL | **19 / 20** | §7 |
| Mediciones persistidas | **52 230** | §7, §8 |
| Reglas de alerta activas | **4** | §7 |
| Permisos RBAC / roles | **21 / 3** | §6, §7 |
| Pruebas automatizadas en verde | **125** (50 unitarias + 75 de integración) | §7 |
| Cobertura de líneas (combinada) | **92,26 %** | §7 |
| Panel (p50) | **104,1 ms** | §7, §8 |
| Serie de 1 mes sobre 52 230 filas (p50) | **573,7 ms** | §7, §8 |
| Registro de 500 mediciones (mediana) | **1 403 ms** (antes 16 410 ms) | §7, §8 |

**Regla de honestidad del informe.** Toda cifra proviene de una **ejecución real**. Lo que el borrador de ES4 daba por hecho y **no se hizo** —despliegue en la nube (Render), escaneo **OWASP ZAP**, **Lighthouse**, pruebas de carga con **k6**, validación contra la app Android real, historial de *pull requests*— se declara explícitamente como **no ejecutado** y con su causa, en lugar de maquillarse. Esa transparencia es parte del mensaje del proyecto: *un informe que reconoce sus límites es más útil que uno que los esconde*.

---

## Índice

1. [Introducción y Propuesta de Valor](#1-introducción-y-propuesta-de-valor)
2. [Necesidades Abordadas y Alcance](#2-necesidades-abordadas-y-alcance)
3. [Arquitectura y Tecnologías Consolidadas](#3-arquitectura-y-tecnologías-consolidadas)
4. [Funcionalidades Implementadas](#4-funcionalidades-implementadas)
5. [Guion de Demostración en Vivo](#5-guion-de-demostración-en-vivo)
6. [Estándares, Normativas y Buenas Prácticas](#6-estándares-normativas-y-buenas-prácticas)
7. [Resultados Cuantificables del Proyecto](#7-resultados-cuantificables-del-proyecto)
8. [Comparativa Diagnóstico → Resultado](#8-comparativa-diagnóstico--resultado)
9. [Plan de Mantención](#9-plan-de-mantención)
10. [Viabilidad y Proyección](#10-viabilidad-y-proyección)
11. [Guion de la Presentación Final](#11-guion-de-la-presentación-final)
12. [Preparación para la Defensa y Preguntas](#12-preparación-para-la-defensa-y-preguntas)
13. [Conclusiones](#13-conclusiones)
14. [Bibliografía](#14-bibliografía)
15. [Anexos](#15-anexos)

> **Convención sobre rutas del repositorio.** Todos los archivos se citan relativos a la raíz del proyecto. En Windows la carpeta del proyecto contiene espacios, por lo que toda ruta se cita entre comillas al ejecutarse en la terminal.
