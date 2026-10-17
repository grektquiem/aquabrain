# ES2 · 10 — Checklist de calidad y cobertura de la rúbrica

Se usa como control antes de entregar. Marca `✅` solo cuando la evidencia exista en el repositorio.

---

## 1. Cobertura de los indicadores de la rúbrica ES2

| # | Indicador de la rúbrica | Evidencia en este repositorio | Nivel |
|---|---|---|---|
| 2.1.1.1 | Actividades y fases del proyecto con la metodología seleccionada | `01-metodologia-cronograma.md` §1–§3 (roles, ceremonias y artefactos §1.4, DoD, **calendario con fechas exactas** §3) | Destacado |
| 2.1.1.2 | Dependencias y prioridades entre tareas del cronograma | `01-…` §4–§5 (diagrama + **matriz predecesor→sucesor**, ruta crítica, **priorización por valor/riesgo**) | Destacado |
| 2.1.2.3 | Puntos de vista del paradigma 4+1 (escenarios, lógica, procesos, desarrollo, física) | `02-arquitectura-4mas1.md` §2–§6 (casos de uso §2.2, clases §3.3, secuencia §4, **componentes §5.4**, despliegue §6) | Destacado |
| 2.1.2.4 | Tecnologías y herramientas de la infraestructura | `03-stack-e-infraestructura.md` §1–§5 (alternativas descartadas + **columna "necesidad futura"**) | Destacado |
| 2.1.3.5 | Prototipos interactivos funcionales | `04-wireframes-y-guia-visual.md` §1.1 (**inventario de 11 pantallas + flujos**), §2 (W-01…W-06), §4 (**enlace al prototipo navegable**) | Destacado |
| 2.1.3.6 | Consistencia visual y adaptabilidad | `04-…` §3 (tokens, componentes, estados, responsive, accesibilidad WCAG 2.1 AA) | Destacado |
| 2.1.3.7 | Retroalimentación de usuarios para mejorar el diseño | `09-feedback-prototipo.md` §2–§3 (**metodología, iteraciones v1–v3 y cambios antes/después**), FB-01…FB-16 | Destacado |
| 2.1.4.8 | Entidades y relaciones de manera óptima (claves, cardinalidades, integridad) | `05-modelo-de-datos.md` §2–§4 (DER con tipos, diccionario, integridad, MC-01…MC-09) y **§11 DDL ejecutable** (`docs/ES2/aquaplants_schema.sql`) | Destacado |
| 2.1.4.9 | Bases estructuradas y no estructuradas, con justificación | `05-…` §7 (**ejemplos SQL/NoSQL**) y §8 (optimización) | Destacado |
| 2.1.5.10 | Políticas de autenticación y autorización (roles, permisos, matriz) | `06-seguridad.md` §2–§3 (MFA, historial/expiración de contraseña, tokens, **rotación de credencial 90 días**, **matriz CRUD**) | Destacado |
| 2.1.5.11 | Identifica amenazas comunes y medidas de mitigación | `06-…` §5 (OWASP Top 10, STRIDE, riesgos RSK-01…RSK-12 priorizados) | Destacado |
| 2.1.5.12 | Establece estándares de codificación segura | `06-…` §6 (reglas EC-01…EC-14, checklist de PR y **§6.3 lint/pre-commit/CI**) | Destacado |
| 2.1.6.13 | Pruebas unitarias, integrales y de rendimiento vinculadas a requisitos | `07-plan-de-pruebas.md` §5 (catálogo TS-01…TS-44 + **§5.5 pasos y resultado esperado/obtenido/evidencia**) | Destacado |
| 2.1.6.14 | Contempla herramientas automatizadas y manuales en las pruebas | `07-…` §7 (balance ~70/30 y matriz herramienta–tipo de prueba) | Destacado |
| 2.1.6.15 | Responde preguntas sobre el diseño | `11-defensa-preguntas.md` (**banco de preguntas y respuestas de defensa**) | Destacado |

> **Cierre de brechas hacia "Destacado" (según el "Ajuste del borrador ES2"):** se incorporaron ceremonias y
> artefactos con fechas exactas; matriz predecesor→sucesor y priorización por valor/riesgo; diagramas de casos de uso
> y componentes; columna de necesidades futuras del stack; inventario de pantallas, flujos y enlace al prototipo;
> ejemplos SQL/NoSQL y criterio de migración; MFA, historial/expiración de contraseña, rotación de credencial de
> dispositivo (90 días) y matriz CRUD; lint/pre-commit/CI; formato extendido del catálogo de pruebas; metodología e
> iteraciones del feedback; y el banco de preguntas de defensa.

---

## 2. Checklist de calidad del desafío

Del apartado "Checklist antes de cada entrega":

- [ ] **¿Cada decisión está sustentada en el problema y no solo en una preferencia tecnológica?**
      → Cada decisión `D-01…D-15` (`00-resumen-y-contexto.md` §4) y cada tecnología (`03-…` §2–§4) declara problema, alternativa descartada y requisito.
- [ ] **¿Las historias, requisitos, casos de uso, diseño, código y pruebas se pueden relacionar entre sí?**
      → `08-trazabilidad.md` §1–§6; la columna "Implementación" queda lista para completarse con rutas reales en ES3.
- [ ] **¿Las evidencias muestran lo que efectivamente funciona y no solo lo que se planeó construir?**
      → ES2 es diseño: aquí se declara explícitamente que la implementación y su evidencia corresponden a ES3. No se afirman funcionalidades no construidas.
- [ ] **¿El equipo puede explicar por qué eligió su arquitectura, tecnologías, modelo de datos y controles de seguridad?**
      → `02-…` §2.3 y §7; `03-…` §2–§4; `05-…` §7–§8; `06-…` §1, §5, §6.
- [ ] **¿Los resultados están medidos y comparados con lo esperado?**
      → Umbrales y métricas definidos en `07-…` §6.2 y §9 (dashboard < 2 s; históricos 1 mes < 5 s / 50.000; cobertura ≥ 70 %; disponibilidad 99 %); la comparación esperado vs. obtenido se ejecuta en ES3.
- [ ] **¿La documentación permite que otra persona comprenda, ejecute y mantenga la solución?**
      → `README.md` (índice y lectura), `03-…` §5.3 (procedimiento de entorno), guía visual reutilizable.

---

## 3. Checklist interno de consistencia

### 3.1. Coherencia entre documentos

- [ ] Los identificadores usados en `08-trazabilidad.md` existen en `ES1/00-backlog-base.md`.
- [ ] Los casos de prueba citados en `06-seguridad.md` y `09-feedback-prototipo.md` existen en el catálogo de `07-plan-de-pruebas.md`.
- [ ] Todas las entidades descritas en la arquitectura (`02-…` §3.3) existen en el modelo de datos (`05-…` §3) con el nombre `sistema` (no `instalacion`).
- [ ] El DDL de `05-…` §11 coincide con el diccionario (`05-…` §3) y con la copia ejecutable `docs/ES2/aquaplants_schema.sql`.
- [ ] Los endpoints citados en `06-seguridad.md` §3.4 coinciden con los módulos de `02-…` §3.2.
- [ ] Las pantallas descritas en `04-…` §2 cubren todos los CU de la tabla `08-…` §3 (excepto CU-16, fuera de alcance).
- [ ] Las decisiones `D-01…D-15` no contradicen las tablas de comparación de tecnologías.
- [ ] No se usa el hash Argon2id como decisión vigente (se usa **bcrypt**; Argon2id solo aparece como alternativa evaluada).

### 3.2. Completitud

- [ ] Todos los supuestos `SUP-01…SUP-10` tienen estado y responsable.
- [ ] Todos los riesgos (`RC-…`, `RT-…`, `RSK-…`, `RP-…`) tienen mitigación.
- [ ] Todos los RNF tienen métrica verificable (RNF01…RNF11).
- [ ] Todo requisito `Must` y `Should` tiene al menos una prueba asignada.
- [ ] El registro de retroalimentación tiene fechas reales.
- [ ] Los requisitos `Won't` (RF15, RNF04, RNF09) están marcados como documentados/no implementados.
- [ ] El catálogo de pruebas declara `resultado obtenido / estado / evidencia` como **pendiente de ES3** (no se afirman resultados no ejecutados).

### 3.3. Presentación

- [ ] Los diagramas Mermaid se renderizan sin errores en GitHub.
- [ ] No quedan marcadores `‹…›` sin reemplazar (excepto los que el equipo decida mantener como plantilla).
- [ ] Las tablas no tienen columnas vacías ni filas de ejemplo del template original.
- [ ] Ortografía y nombres de archivo consistentes (`snake_case` en base de datos, `camelCase` en código).
- [ ] Los identificadores no llevan guion entre letras y número (`HU01`, `RF01`, `RNF01`, `CU-01`, `TS-01`).
- [ ] El banco de defensa (`11-defensa-preguntas.md`) cita únicamente identificadores que existen en el resto de la documentación.

---

## 4. Preparación para ES3 (puente a la implementación)

- [ ] Backlog priorizado en GitHub Projects con **HU01…HU11**.
- [ ] Monorepo creado con `main`/`develop` protegidas y plantilla de PR con checklist de seguridad.
- [ ] `docker-compose.yml` y `.env.example` listos (incluye `BCRYPT_COST` y `MAX_TIMESTAMP_SKEW`).
- [ ] Esquema Prisma inicial equivalente al modelo lógico (`05-…` §3) con la tabla `sistema`.
- [ ] Pipeline de CI con lint, pruebas, cobertura (≥ 70 %) y build obligatorios.
- [ ] Guía visual traducida a tokens en Tailwind.
- [ ] Simulador capaz de generar lotes, simular caída de conexión y emitir payload en formato del firmware ESP32-S3.
- [ ] Endpoint `POST /api/v1/reglas/probar` implementado (HU07 CA③).
- [ ] Umbrales y variables de la semilla confirmados con la contraparte (cierre de `SUP-01…SUP-03`).
- [ ] Ejecutar el catálogo **TS-01…TS-44** y completar `resultado obtenido / estado / evidencia` (§5.5 de `07`).

---

## 5. Resumen de entrega

| Concepto | Estado |
|---|---|
| Documentos ES2 | 12 archivos (`00`…`11`) en `docs/ES2/` + catálogo canónico en `docs/ES1/` |
| Banco de preguntas de defensa | 1 (`11-defensa-preguntas.md`, indicador 2.1.6.15) |
| Necesidades cubiertas (NEC-01…NEC-09) | 9 / 9 (NEC-09 como transversal documentado) |
| Historias de usuario cubiertas (HU01…HU11) | 11 / 11 (HU09 postergada como *Won't*) |
| Requisitos funcionales cubiertos (RF01…RF15) | 15 / 15 (RF15 *Won't por ahora*) |
| Requisitos no funcionales cubiertos (RNF01…RNF11) | 11 / 11 (RNF04 y RNF09 documentados, no implementados) |
| Casos de uso cubiertos (CU-01…CU-16) | 16 / 16 (CU-16 fuera de alcance) |
| Casos de prueba definidos (TS-01…TS-44) | 44 |
| Riesgos identificados con mitigación | 5 (cronograma) + 6 (tecnológicos) + 12 (seguridad) + 6 (pruebas) |
| Supuestos abiertos a validar (SUP-01…SUP-10) | 10 |
| Observaciones de feedback registradas | 16 |
| Correcciones de ES1 aplicadas | 8 (C-01…C-08) |

**Declaración de honestidad del equipo:** este documento describe un **diseño**, no software implementado.
Las funcionalidades, métricas y resultados se materializan y se demuestran en ES3 y ES4, con evidencia de ejecución.
Toda la documentación de ES2 se traza contra el **catálogo canónico corregido** `docs/ES1/00-backlog-base.md`.
