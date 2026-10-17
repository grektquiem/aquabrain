# ES1 — Correcciones aplicadas

Este documento registra **qué observó el docente** en la Evaluación 1 (Unidad 1) y **cómo se corrigió** en el
catálogo canónico `docs/ES1/00-backlog-base.md`. Sirve como evidencia de trazabilidad del feedback y como
punto de partida obligatorio para todo el diseño de ES2.

Proyecto: **Sistema de Control y Monitoreo para AquaPlants / AquaBrain**
Equipo: Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera
Docente: Armin Vladimir Brunt Ruth · Última actualización: 2026-10-16

**Fuentes de la corrección**

| Archivo | Contenido | Fecha |
|---|---|---|
| `correcion 1eval1.pdf` | Priorización MoSCoW, comparación de metodologías, impacto ético, unificación de códigos RF/RNF/HU, decisión de licenciamiento | 2026-09-20 |
| `correcion 2eval1.pdf` | Historias de usuario corregidas con criterios de aceptación ampliados, matriz MoSCoW de requisitos, RNF11 | 2026-09-20 |

---

## 1. Resumen de las observaciones

La corrección del docente pidió, en esencia:

1. **Reescribir la priorización con la técnica MoSCoW** (no con prioridad alta/media/baja).
2. **Comparar metodologías con criterios y puntajes homogéneos** (Scrum / Scrumban / Kanban en la misma escala).
3. **Agregar el impacto ético y profesional** de las medidas de seguridad.
4. **Eliminar la referencia a una HU11 inexistente** y, si se necesita documentación de API, **crear una HU11 nueva**.
5. **Decidir el licenciamiento**: moverlo a *Won't* o dejarlo como supuesto a validar.
6. **Ampliar los criterios de aceptación** de todas las historias de usuario (formato CA①, CA②…).
7. **Agregar RNF11 (privacidad y cumplimiento ético)**.
8. **Unificar los códigos** RF/RNF/HU en todas las tablas del informe.

---

## 2. Correcciones aplicadas (C-01…C-08)

| # | Origen | Corrección solicitada | Cómo se aplicó | Sección del catálogo |
|---|---|---|---|---|
| **C-01** | `correcion 1eval1` | Priorizar con **MoSCoW** | Se reemplazó la priorización por MoSCoW con justificación de negocio, urgencia, riesgo y factibilidad. Se aplicó a necesidades (NEC) y a requisitos (RF/RNF) | `00-backlog-base.md` §2, §5, §6, §7 |
| **C-02** | `correcion 1eval1` | Comparar metodologías con **criterios y puntajes homogéneos** | Se definieron 6 criterios en escala 1–5 y una tabla comparativa que da **Scrum 27 · Scrumban 25 · Kanban 22**, con decisión justificada | §10 |
| **C-03** | `correcion 1eval1` | Agregar el **impacto ético y profesional** de las medidas de seguridad | Se añadió la subsección 11.2 con privacidad, responsabilidad, acceso, tratamiento de datos, cumplimiento e impacto profesional | §11.2 |
| **C-04** | `correcion 1eval1` | Eliminar la **HU11 inexistente**; crearla si se requiere documentación API | Se creó **HU11 (Desarrollador de Integraciones · documentación OpenAPI)** y se renumeró/ajustó el mapeo de RF. RF13 quedó como documentación de API | §4, §5, §7 |
| **C-05** | `correcion 1eval1` | Decidir el **licenciamiento** | **HU09 / RF15 se movieron a *Won't (por ahora)*** por no estar respaldados explícitamente por el desafío; quedó registrado como supuesto **SUP-09** | §5 (RF15), §6, §12 |
| **C-06** | `correcion 2eval1` | Ampliar los **criterios de aceptación** de todas las HU | Cada HU (HU01…HU11) quedó con **criterios numerados (CA①, CA②…)** y verificables, incorporando fecha/hora (HU01 CA④), exportación (HU02 CA③), severidad+timestamp (HU03 CA②), prueba de regla (HU07 CA③), códigos de respuesta (HU08 CA④), etc. | §4 |
| **C-07** | `correcion 2eval1` | Añadir **RNF11 (privacidad y cumplimiento ético)** | Se agregó RNF11 (*Must*) con minimización, retención, logs de auditoría y referencia a la Ley 19.628 / Ley 21.719 | §6, §11.2 |
| **C-08** | `correcion 2eval1` | **Unificar los códigos** RF/RNF/HU en todas las tablas | Se consolidó un único idset sin guion entre letras y número: `NEC-01…NEC-09`, `HU01…HU11`, `RF01…RF15`, `RNF01…RNF11`, `CU-01…CU-16`, `RN-01…RN-12` | §4–§9 |

---

## 3. Cambios concretos: antes vs. después

### 3.1. Identificadores (C-08)

| Antes (observado) | Después (canónico) | Nota |
|---|---|---|
| `HU-01`, `RF-01`, `RNF-01` (mixto, con y sin guion) | `HU01`, `RF01`, `RNF01` | Un solo formato, sin guion entre letra y número |
| Referencia a una `HU11` que no existía | `HU11` creada: documentación API para integraciones | C-04 |
| RF sin relación explícita a HU | Cada RF declara su HU de origen (§7) | Trazabilidad RF↔HU |

### 3.2. Priorización (C-01)

| Antes | Después |
|---|---|
| Prioridad alta / media / baja | **MoSCoW**: Must / Should / Could / Won't (por ahora), con justificación por necesidad y por requisito |

Resultado en el catálogo:

- **Dentro de alcance:** centralización de datos, API de ingesta (firmware real), dashboard de estado, autenticación
  y RBAC, motor de reglas y alertas, históricos y comparación, documentación de API, tolerancia a pérdida de
  conectividad → todos en §7 de `00-backlog-base.md`.
- **Fuera de alcance (documentado):** escalabilidad masiva (RNF04), autonomía local dependiente del firmware
  (RNF09) y licenciamiento (RF15 / HU09).

### 3.3. Metodología (C-02)

| Antes | Después |
|---|---|
| Comparación narrada, sin puntaje | Tabla de 6 criterios en escala 1–5 → **Scrum 27, Scrumban 25, Kanban 22**, con decisión y justificación vinculada al cliente |

Decisión: **Scrum con sprints de dos semanas**, coherente con el cronograma de ES2 (`docs/ES2/01-metodologia-cronograma.md`).

### 3.4. Ética y privacidad (C-03, C-07)

| Antes | Después |
|---|---|
| Solo la matriz Activo–Amenaza–Riesgo–Control–Importancia | Matriz **+ impacto ético y profesional** (privacidad, responsabilidad, acceso, tratamiento de datos, cumplimiento, impacto profesional) y **RNF11** como requisito *Must* |

### 3.5. Licenciamiento (C-05)

| Antes | Después |
|---|---|
| Requisito ambiguo | **Won't (por ahora)** con supuesto `SUP-09`; se documenta su forma sin implementarla |

### 3.6. Criterios de aceptación (C-06)

| Antes | Después |
|---|---|
| Criterios escuetos o ausentes | Criterios numerados y verificables por HU, base de las pruebas TS de ES2 |

Ejemplos destacados: HU01 CA④ (fecha y hora de la última medición), HU02 CA③ (exportar los datos consultados),
HU03 CA② (severidad y timestamp), HU04 CA② (líneas superpuestas con leyenda), HU05 CA④ (un administrador no puede
eliminar su propia cuenta), HU07 CA③ (probar la regla con una medición simulada), HU08 CA③/④ (rechaza timestamps
futuros; responde 201/400/401), HU11 CA③ (contrato validado contra la app Android de prueba).

---

## 4. Efecto de las correcciones sobre ES2

| Corrección | Documento(s) de ES2 afectados | Evidencia |
|---|---|---|
| C-01 MoSCoW | `08-trazabilidad.md` §4 (columna MoSCoW), `10-checklist-entrega.md` §5 | Cada RF y RNF declara su prioridad |
| C-02 Metodología | `01-metodologia-cronograma.md` §1 | Misma comparación 27/25/22 y Scrum de 2 semanas |
| C-03 y C-07 Ética/RNF11 | `06-seguridad.md` §7 | Impacto ético, privacidad desde el diseño y RNF11 trazado |
| C-04 HU11 | `08-trazabilidad.md` §1 (NEC-05 → HU11 → RF13 → CU-15), `04-wireframes…` §1 (`/api/docs`) | HU11 con pruebas TS-42 |
| C-05 Licenciamiento | `05-modelo-de-datos.md` §10, `09-feedback-prototipo.md` (SUP-09) | Modelo propuesto pero no implementado |
| C-06 Criterios de aceptación | `07-plan-de-pruebas.md` §2.3, `04-wireframes…` §5 | Cada CA tiene prueba asignada |
| C-08 Unificación de códigos | Todos los documentos de ES2 | Único idset en las matrices de `08-trazabilidad.md` |

---

## 5. Supuestos heredados de ES1

| ID | Supuesto | Estado | Responsable de cierre |
|---|---|---|---|
| SUP-09 | El **licenciamiento** (HU09 / RF15 / CU-16) no está respaldado por el desafío | ⏳ Validar con la contraparte | Product Owner |
| SUP-10 | Compatibilidad con la **app Android existente** "sin cambios en los clientes": no se dispone del contrato que consume hoy | ⏳ Validar con la contraparte | Product Owner + backend |

El resto de los supuestos (`SUP-01…SUP-08`) se administran en `docs/ES2/09-feedback-prototipo.md`.

---

## 6. Estado de cada corrección

| # | Corrección | Estado |
|---|---|---|
| C-01 | MoSCoW | ✅ Aplicada |
| C-02 | Comparación de metodologías con puntajes | ✅ Aplicada |
| C-03 | Impacto ético y profesional | ✅ Aplicada |
| C-04 | HU11 creada; referencia inexistente eliminada | ✅ Aplicada |
| C-05 | Licenciamiento decidido (*Won't por ahora*) | ✅ Aplicada |
| C-06 | Criterios de aceptación ampliados | ✅ Aplicada |
| C-07 | RNF11 (privacidad y cumplimiento) | ✅ Aplicada |
| C-08 | Códigos RF/RNF/HU unificados | ✅ Aplicada |

> **Nota:** el catálogo `docs/ES1/00-backlog-base.md` es la **fuente de verdad**. Si una corrección futura cambia un
> identificador o una prioridad, se actualiza primero allí y luego se propaga a ES2 siguiendo `08-trazabilidad.md`.
