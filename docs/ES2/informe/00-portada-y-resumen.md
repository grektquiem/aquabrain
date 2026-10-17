# ES2 — Diseño de la solución de software

## Plataforma web de monitoreo y gestión de cultivos aeropónico · AquaPlants / AquaBrain

**Informe académico de diseño**

| | |
|---|---|
| **Institución** | INACAP |
| **Asignatura** | Proyecto Integrado — 4.º semestre |
| **Evaluación** | ES2 — Diseño de la solución de software (Unidad 2) |
| **Proyecto** | Sistema de Control y Monitoreo para AquaPlants / AquaBrain |
| **Equipo** | Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera |
| **Docente** | Armin Vladimir Brunt Ruth |
| **Contraparte** | AquaPlants / AquaBrain (Robotic Systems) |
| **Stack** | React 18 + Vite 5 + TypeScript · Node.js 20 + NestJS 10 + Prisma 5 · PostgreSQL 16 + MongoDB + Redis |
| **Fecha** | 2026-10-16 |
| **Versión** | 1.0 — presentación académica del diseño ES2 |

---

## Resumen ejecutivo

El diagnóstico de ES1 estableció **qué** debe resolver la plataforma: centralizar la información del
cultivo, mostrar el estado actual, generar alertas oportunas y controlar el acceso por roles. Este
informe presenta el **diseño implementable** que responde a ese diagnóstico y que la rúbrica de la
Unidad 2 exige: planificación, arquitectura 4+1, prototipos, modelo de datos, seguridad y plan de
pruebas.

La solución diseñada es una plataforma web **API-first**: una base de datos relacional centraliza
sistemas (instalaciones), cultivos, dispositivos, sensores, mediciones y alertas; una **API REST
versionada** (`/api/v1`) y documentada con **OpenAPI 3** sirve a tres tipos de cliente —el **firmware
real ESP32-S3**, la **app Android existente** y el **dashboard web**—; y un **monolito modular** en
NestJS concentra la lógica de negocio con módulos de dominio cohesivos.

El diseño se organiza en **seis artefactos verificables** que cubren los quince indicadores de la
rúbrica: (1) metodología **Scrum con sprints de dos semanas** y un cronograma con responsables,
entregables, fechas exactas y dependencias con ruta crítica; (2) **arquitectura 4+1** con las cinco
vistas —escenarios, lógica, procesos, desarrollo y física— y siete escenarios arquitectónicamente
significativos; (3) **stack e infraestructura** justificados por problema → necesidad → requisito, con
alternativas descartadas y despliegue reproducible en contenedores; (4) **prototipos** de las pantallas
principales con guía visual, tokens, adaptabilidad 360–1920 px y accesibilidad WCAG 2.1 AA; (5) **modelo
de datos** con entidades, claves, cardinalidades, integridad, particionado y una decisión explícita de
qué datos viven en **SQL** y cuáles en almacenamiento **no relacional**; y (6) **seguridad** y **plan de
pruebas** con políticas de autenticación y autorización, matriz de roles, amenazas (OWASP Top 10 y
STRIDE), estándares de codificación segura y un catálogo de **44 casos de prueba (TS-01…TS-44)**.

> **Trazabilidad.** La cadena
> necesidad → historia → requisito → caso de uso → **diseño** → implementación → prueba se mantiene
> viva durante todo el semestre. La versión consolidada de la matriz se presenta en el capítulo 09,
> con la columna de diseño (ES2) completa y las columnas de implementación y prueba que se
> materializan en ES3.

**Declaración de honestidad intelectual.** ES2 es una fase de **diseño**: describe lo que **se
construirá**, no software ya construido. El catálogo de pruebas define pasos y resultados **esperados**;
las columnas "resultado obtenido / evidencia" se completan en ES3. Las variables **temperatura, humedad
y distancia** provienen del hardware real (AHT10/HC-SR04); **pH y caudal** se declaran **simulados**. No
se inventan cifras ni resultados: lo que no se ejecutó o no se confirmó con la contraparte se declara
como **supuesto** (SUP-01…SUP-10) o como **fuera de alcance** (*Won't*).

---

## Cómo este informe cubre la rúbrica

Cada indicador de la evaluación ES2 se aborda en un capítulo específico de este informe:

| Indicador de la rúbrica (Unidad 2) | Dónde se evidencia |
|---|---|
| 2.1.1.1 · Actividades y fases según la metodología seleccionada | Cap. 02 (§2.1–§2.4) |
| 2.1.1.2 · Dependencias y prioridades entre tareas | Cap. 02 (§2.5–§2.7) |
| 2.1.2.3 · Puntos de vista 4+1 (lógica, desarrollo, procesos, físico, escenarios) | Cap. 03 (§3.3–§3.7) |
| 2.1.2.4 · Tecnologías y herramientas de la infraestructura | Cap. 04 (§4.2–§4.5) |
| 2.1.3.5 · Prototipos interactivos funcionales | Cap. 05 (§5.2–§5.4) |
| 2.1.3.6 · Consistencia visual y adaptabilidad | Cap. 05 (§5.5–§5.7) |
| 2.1.3.7 · Retroalimentación de usuarios y cambios aplicados | Cap. 10 (§10.2–§10.4) |
| 2.1.4.8 · Entidades y relaciones óptimas (claves, cardinalidades, integridad) | Cap. 06 (§6.2–§6.4) |
| 2.1.4.9 · Bases estructuradas y no estructuradas, con justificación | Cap. 06 (§6.7) |
| 2.1.5.10 · Políticas de autenticación y autorización + matriz | Cap. 07 (§7.2–§7.3) |
| 2.1.5.11 · Amenazas comunes y medidas de mitigación | Cap. 07 (§7.5) |
| 2.1.5.12 · Estándares de codificación segura | Cap. 07 (§7.6) |
| 2.1.6.13 · Pruebas unitarias, integrales y de rendimiento vinculadas a requisitos | Cap. 08 (§8.3, §8.5, §8.6) |
| 2.1.6.14 · Herramientas automatizadas y manuales en las pruebas | Cap. 08 (§8.7) |
| 2.1.6.15 · Responde preguntas y justifica decisiones técnicas y funcionales | Cap. 09, 11 y Anexo E |

El criterio de calidad transversal de la evaluación —**evidencia trazable y coherente**— se satisface
en el capítulo 09: cada historia de usuario se relaciona con uno o más requerimientos, estos con casos
de uso y diseño, y finalmente con implementación y pruebas, sin celdas vacías para los requisitos
vigentes (Must y Should).

---

## Índice

- **00** Portada y resumen ejecutivo
- **01** Introducción, alcance y decisiones de diseño
- **02** Metodología, cronograma y dependencias
- **03** Arquitectura 4+1
- **04** Stack tecnológico e infraestructura
- **05** Prototipos, wireframes y guía visual
- **06** Modelo de datos
- **07** Seguridad de la solución
- **08** Plan de pruebas
- **09** Matriz de trazabilidad
- **10** Retroalimentación de usuarios y supuestos abiertos
- **11** Conclusiones
- **12** Bibliografía
- **13** Anexos

---

## Nota metodológica y de honestidad intelectual

1. **Base del diseño.** ES2 transforma el diagnóstico **corregido** de ES1 en un diseño implementable.
   Los identificadores usados en todo el informe son los del catálogo canónico
   `docs/ES1/00-backlog-base.md` (**NEC-01…NEC-09, HU01…HU11, RF01…RF15, RNF01…RNF11, CU-01…CU-16,
   RN-01…RN-12**) más los propios del diseño (**D-01…D-15, RA-01…RA-08, MC-01…MC-09, EC-01…EC-14,
   TS-01…TS-44, SUP-01…SUP-10, FB-01…FB-16**).
2. **Sin datos inventados.** Los umbrales de rendimiento (dashboard < 2 s; históricos de 1 mes < 5 s con
   50.000 registros) y de disponibilidad (≥ 99 % en 8:00–20:00) provienen del diagnóstico ES1; las
   variables sin sensor físico se declaran **simuladas**.
3. **Diseño, no implementación.** Ninguna funcionalidad se presenta como terminada. Las referencias al
   código (`apps/api`, `apps/web`, `apps/simulator`) son **planes de implementación** que se ejecutan en
   ES3 y cuya evidencia se levanta entonces.
4. **Artefactos canónicos.** Este informe es la **presentación académica** del diseño ES2. El detalle
   técnico completo permanece en `docs/ES2/00-…-11-…`, y el esquema físico ejecutable en
   `docs/ES2/aquaplants_schema.sql`. El informe no redefine identificadores.
