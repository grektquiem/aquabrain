# 05 · Metodología de desarrollo

## 5.1. Criterios de comparación

Para seleccionar la metodología no se comparó "por gusto": se definieron **seis criterios comunes**,
aplicables a todas las alternativas y evaluados en una **escala homogénea de 1 a 5**, según su
relevancia para este proyecto:

1. **Adaptabilidad a cambios** — el alcance tiene incógnitas (umbrales, variables prioritarias,
   integración con hardware).
2. **Trazabilidad y puntos de revisión** — las evaluaciones ES1–ES4 exigen hitos verificables.
3. **Claridad de roles** — un equipo pequeño debe saber quién hace qué.
4. **Manejo de incertidumbre técnica** — integración con firmware real, API y app existentes.
5. **Entregables demostrables por iteración** — cada avance debe poder mostrarse.
6. **Adecuación a un equipo pequeño** — recursos y tiempo limitados.

## 5.2. Alternativas consideradas

| Metodología | Idea central | Por qué podría servir |
|---|---|---|
| **Scrum** | Iteraciones de duración fija (*sprints*) con roles, eventos y artefactos | Estructura y puntos de control claros; entregas incrementales |
| **Scrumban** | Híbrido entre Scrum y Kanban; flujo continuo con algunas ceremonias | Alta flexibilidad para tareas inciertas (integración) |
| **Kanban** | Visualización del flujo y límite de trabajo en curso, sin iteraciones fijas | Simplicidad y mínima carga de reuniones |

## 5.3. Comparación cuantitativa

| Criterio | Scrum | Scrumban | Kanban |
|---|:--:|:--:|:--:|
| Adaptabilidad a cambios | 4 | 5 | 5 |
| Trazabilidad y revisiones | 5 | 4 | 3 |
| Claridad de roles | 5 | 3 | 2 |
| Manejo de incertidumbre técnica | 4 | 5 | 4 |
| Entregables demostrables por iteración | 5 | 4 | 3 |
| Adecuación a equipo pequeño | 4 | 4 | 5 |
| **Total** | **27** | **25** | **22** |

El uso de **los mismos criterios y la misma escala** para las tres alternativas es lo que hace la
comparación auditable: el resultado no depende de una tabla distinta para cada metodología.

## 5.4. Comparación cualitativa

| Metodología | Ventajas | Desventajas | Decisión |
|---|---|---|---|
| **Scrum** | Estructura clara, roles definidos, revisiones constantes, avances demostrables | Requiere reuniones frecuentes y mayor disciplina | **Seleccionada**: mayor puntaje y mejor ajuste |
| **Scrumban** | Alta flexibilidad; útil para tareas inciertas como la integración con hardware | Depende más de la autodisciplina al no tener reuniones fijas | Descartada: el equipo prioriza puntos de revisión obligatorios |
| **Kanban** | Proceso simple, mínima carga | Sin hitos de revisión; difícil detectar desviaciones tempranas en un equipo pequeño | Descartada: menor trazabilidad para este contexto |

## 5.5. Decisión y justificación

**Metodología seleccionada: Scrum, con iteraciones (*sprints*) de dos semanas.**

La justificación se vincula explícitamente a las características del proyecto y a las solicitudes del
cliente, tal como exige la rúbrica:

| Característica del proyecto / solicitud | Por qué Scrum es adecuado |
|---|---|
| **Tamaño del equipo** (equipo pequeño y autoorganizado) | Scrum está diseñado para equipos pequeños con responsabilidades claras |
| **Alcance definido pero con incógnitas** (umbrales, variables prioritarias) | El backlog se **reprioriza** al inicio de cada sprint según hallazgos y feedback |
| **Incertidumbre técnica** (firmware real, API, app existente) | Las iteraciones cortas permiten **detectar temprano** los problemas de integración |
| **Cliente / contraparte** (profesor y empresa pueden revisar avances) | La revisión de sprint valida el avance con la contraparte |
| **Entregables académicos** (ES1–ES4) | Cada evaluación puede ser un **hito de sprint** con entregable tangible |
| **Necesidad de trazabilidad** | Los artefactos de Scrum (backlog, incremento, revisión) dejan registro del avance |

> **Coherencia con el resto del proyecto.** La decisión de Scrum de dos semanas es la misma que se
> usó para construir el cronograma por iteraciones de ES2 (`docs/ES2/01-metodologia-cronograma.md`),
> de modo que la metodología no quedó como una declaración aislada: se aplicó.

## 5.6. Implicancias de la elección

Adoptar Scrum implica, para las etapas siguientes:

- Mantener un **backlog priorizado** con identificadores estables (`HU`, `RF`, `RNF`).
- Cerrar cada sprint con **funcionalidad demostrable** y no solo con documentación.
- Realizar **revisión** con la contraparte para validar supuestos (umbrales, variables, frecuencia).
- Sostener la **matriz de trazabilidad viva** (capítulo 08), que es el criterio de calidad del desafío.

El descarte de Kanban y Scrumban no responde a que sean "peores", sino a que **no garantizan los
puntos de control** que este proyecto, con su incertidumbre técnica y sus hitos académicos, necesita.
