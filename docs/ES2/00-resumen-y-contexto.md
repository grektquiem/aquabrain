# ES2 · 00 — Resumen ejecutivo, decisiones de diseño y alcance

> **Base:** `docs/ES1/00-backlog-base.md` (versión **corregida** con las observaciones `correcion 1eval1` y `correcion 2eval1`).
> Toda referencia de este documento usa el idset corregido: **NEC-01…NEC-09, HU01…HU11, RF01…RF15, RNF01…RNF11, CU-01…CU-16, RN-01…RN-12**.

---

## 1. El problema y la solución

**Problema (ES1):** los datos que ya genera el AquaBrain real (ESP32-S3 con AHT10 y HC-SR04) solo se ven en el display OLED local o en una app Android aislada. No hay fuente única de verdad, no hay estado actual accesible, no hay alertas oportunas y el acceso no está controlado.

**Solución diseñada:** plataforma web **API-first** con base de datos relacional que centraliza sistemas, dispositivos, sensores, mediciones y alertas, expone una API versionada y documentada para tres tipos de cliente —**firmware ESP32**, **app Android existente** y **dashboard web**— y entrega estado actual, históricos y alertas por reglas.

---

## 2. Alcance de esta entrega (ES2)

Transformar el diagnóstico corregido de ES1 en un **diseño implementable**: metodología y cronograma, arquitectura 4+1, stack e infraestructura, prototipos con guía visual, modelo de datos, seguridad y plan de pruebas, todo trazable hacia ES1.

**Fuera de alcance de ES2:** fabricación o reprogramación del firmware, cambios en la app Android, IA/predicción, licenciamiento (RF15) y reproducción de la escala masiva (RNF04). Estos se **documentan como estrategia**, no se construyen.

---

## 3. Restricciones arquitectónicas de entrada

| ID | Restricción | Origen |
|---|---|---|
| RA-01 | La API debe aceptar el formato del **firmware real ESP32-S3**, no solo del simulador | NEC-04, RF06, RN-11 |
| RA-02 | La API debe ser **versionada y documentada** para no duplicar lógica entre clientes | NEC-05, RF13, RNF08 |
| RA-03 | La API debe **aceptar timestamps pasados** y **rechazar timestamps futuros** | RN-09, RN-10, HU08, HU10 |
| RA-04 | El dashboard no debe contradecir lo que muestra el **display OLED local** | RNF05, RN-12 |
| RA-05 | La ingesta no debe bloquearse por la evaluación de alertas ni por el almacenamiento de la copia cruda | RF06, RF11 |
| RA-06 | El histórico de mediciones es inmutable y crece de forma monotónica | RN-02, NEC-09 |
| RA-07 | Despliegue reproducible en Docker/PaaS con variables de entorno | RNF07 |
| RA-08 | El sistema debe degradar de forma controlada y avisar del estado de conexión | RNF02, RF14 |

---

## 4. Decisiones clave de diseño

| # | Decisión | Alternativa descartada | Justificación | Requisitos |
|---|---|---|---|---|
| D-01 | Metodología **Scrum con sprints de 2 semanas** | Scrumban / Kanban | Mayor puntaje en la comparación de 6 criterios (27 vs 25 vs 22) y asegura hitos de revisión obligatorios | ES1 §10 |
| D-02 | Arquitectura **cliente-servidor en capas** con módulos de dominio (monolito modular) | Microservicios | Dominio cohesivo; microservicios agregan costo operativo sin beneficio medible en el prototipo | RNF06 |
| D-03 | **Monorepo** con `apps/api`, `apps/web`, `apps/simulator`, `packages/shared` | Repositorios separados | Equipo de 3 integrantes, tipos/DTO compartidos, CI única, revisión cruzada simple | RNF06 |
| D-04 | Backend **NestJS + TypeScript + Prisma** | Express puro / Django / Spring Boot | Módulos, guardias declarativas para RBAC, validación por DTO y Swagger integrado | RF01, RF13, RNF01 |
| D-05 | Frontend **React + Vite + TypeScript + Tailwind** con TanStack Query y Recharts | Angular / Vue | Curva de aprendizaje, gráficos de series temporales y despliegue estático simple | RF07, RF08, RNF05 |
| D-06 | **Hash de contraseñas con bcrypt (cost 12)** | Argon2id | Es el algoritmo comprometido en ES1 (HU05, RNF01); se documenta Argon2id como evolución futura | RNF01, HU05 CA3 |
| D-07 | Persistencia **híbrida**: PostgreSQL (dominio, transaccional) + MongoDB (payload crudo del dispositivo) | Solo SQL / solo NoSQL | El dominio exige integridad referencial; el payload del firmware varía con la versión y no debe perder el original | RF03–RF11, RNF04 |
| D-08 | **Mediciones en tabla particionada por rango de fecha** con índice `(sensor_id, timestamp DESC)` | Tabla plana | La consulta de históricos es la dominante y crece de forma monotónica | RF08, RNF03 |
| D-09 | Autenticación **JWT de acceso corto + refresh rotativo en cookie HttpOnly** con RBAC | Sesión en servidor | Permite API stateless para los tres clientes y control fino por rol | RF01, RNF01 |
| D-10 | Ingesta autenticada por **API key por dispositivo** (hash en BD) | OAuth para dispositivos | El ESP32-S3 no ejecuta flujos interactivos; la clave es revocable e individual | RF06, RNF01 |
| D-11 | **Validación de tiempo explícita**: rechazo de futuro (> 5 min de desfase) y aceptación de pasado | Solo validar tipos | Es criterio de aceptación literal de HU08 y HU10 | RN-09, RN-10 |
| D-12 | Alertas evaluadas **en la misma transacción de ingesta**, con *cooldown* y notificación asíncrona | Barrido periódico | Detección oportuna y sin recorrer la tabla completa | RF11, RNF03 |
| D-13 | **Contrato API como entregable de primer nivel**: OpenAPI 3 versionado en `/api/v1`, publicado en `/api/docs` y validado contra la app Android de prueba | Documentar "cuando se pueda" | HU11 lo exige con 4 criterios de aceptación; es la protección de la inversión del cliente | RF13, RNF08 |
| D-14 | **Idempotencia por `id_externo`** y buffer *store-and-forward* en el dispositivo/simulador | Descarte de datos sin red | HU10 exige reintentos al reconectar sin duplicar | RF06, RF14, RN-10 |
| D-15 | **Vista optimizada de "última medición"** + caché de 30 s para el dashboard | Consultar la tabla completa | RNF03 exige dashboard < 2 s | RF07, RNF03 |

---

## 5. Supuestos abiertos: decisiones que dependen de la contraparte

| Tema | Decisión provisoria | Supuesto |
|---|---|---|
| Licenciamiento por cliente/instalación | Fuera de alcance (*Won't*): sin modelo ni endpoints | SUP-09 |
| Contrato exacto que consume hoy la app Android | Se asume `/api/v1` con JSON plano; se valida con la app de prueba | SUP-10 |
| Variables definitivas del prototipo | Real: temperatura, humedad, distancia/nivel. Simuladas: pH y caudal | SUP-01 |

---

## 6. Trazabilidad del diseño con la rúbrica ES2

| Indicador de la rúbrica ES2 | Dónde se evidencia |
|---|---|
| Actividades y fases según metodología seleccionada | `01-metodologia-cronograma.md` §1–§3 |
| Dependencias y prioridades entre tareas | `01-…` §4–§5 |
| Puntos de vista 4+1 (lógica, desarrollo, procesos, física, escenarios) | `02-arquitectura-4mas1.md` §2–§6 |
| Tecnologías y herramientas de infraestructura | `03-stack-e-infraestructura.md` §1–§5 |
| Prototipos interactivos funcionales | `04-wireframes-y-guia-visual.md` §2 |
| Consistencia visual y adaptabilidad | `04-…` §3–§4 |
| Retroalimentación de usuarios y cambios aplicados | `09-feedback-prototipo.md` |
| Entidades, claves, cardinalidades e integridad | `05-modelo-de-datos.md` §2–§4 |
| Base estructurada y no estructurada justificada | `05-…` §7 |
| Políticas de autenticación y autorización + matriz | `06-seguridad.md` §2–§3 |
| Amenazas y medidas de mitigación | `06-…` §5 |
| Estándares de codificación segura | `06-…` §6 |
| Pruebas unitarias, de integración y de rendimiento | `07-plan-de-pruebas.md` §2, §5, §6 |
| Herramientas automatizadas y manuales | `07-…` §7 |
| Matriz de trazabilidad | `08-trazabilidad.md` |

---

## 7. Cómo se aplicaron las correcciones de ES1

| Corrección | Efecto en ES2 |
|---|---|
| C-01 Priorización con **MoSCoW** | El alcance de ES3 se ordena por MoSCoW (`01-…` §5); las pruebas se priorizan por Must/Should/Could |
| C-02 Metodología **comparada con puntajes** | ES2 adopta los mismos criterios y la misma decisión, y fija **sprints de 2 semanas** (`01-…` §1–§2) |
| C-03 **Impacto ético y profesional** | Se desarrolla en `06-seguridad.md` §7.1–§7.3 (cumplimiento, privacidad desde el diseño e impacto ético) |
| C-04 **HU11 creada** y RF renumerados | Toda la trazabilidad de ES2 usa HU01–HU11 y RF01–RF15 (`08-trazabilidad.md`) |
| C-05 **RF15 licenciamiento** a *Won't* | Se excluye del diseño de datos y de las pruebas; queda como supuesto SUP-09 |
| C-06 **Criterios de aceptación ampliados** | Cada criterio nuevo tiene un caso de prueba: exportar CSV (TS-38), timestamp futuro (TS-10), códigos 201/400/401 (TS-22), probar regla (TS-06), no eliminar la propia cuenta (TS-19) |
| C-07 **RNF11 privacidad y ética** | Política de datos, retención y cumplimiento en `06-…` §7 |
| C-08 **Códigos unificados** | Un único idset en todos los documentos, verificado en `08-…` §5 |
