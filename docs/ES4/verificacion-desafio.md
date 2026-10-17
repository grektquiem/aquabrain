# Verificación de cumplimiento — Desafío API2 (AquaPlants / AquaBrain)

> **Naturaleza de este documento.** Es una **verificación de cumplimiento** del proyecto contra el
> documento del desafío *«Plataforma Web de Monitoreo y Gestión de Cultivos Aeropónico»*
> (`Desafio_API2_AquaPlants_rev1.docx`). No es un capítulo del informe ES4 ni reemplaza a ninguno:
> es un **control cruzado** entre lo que pide la contraparte y lo que el repositorio **realmente**
> contiene.
>
> **Regla de honestidad.** Toda afirmación de estado proviene de inspeccionar **código, migraciones
> y base de datos**, no de lo que los informes dicen de sí mismos. Cuando lo pedido no está
> implementado, se declara. Cuando los informes describen algo distinto de lo que el código hace,
> se señala como hallazgo.

- **Fecha de verificación:** 2026-10-17
- **Alcance:** las cuatro evaluaciones (ES1–ES4) y las secciones de antecedentes del desafío.
- **Resultado global:** **cumple 7 de los 8 productos mínimos**; el único no cumplido es el
  **despliegue cloud**, ya declarado como limitación. Se detectó **una brecha no declarada**
  (entidad `Evento`) y una descripción de prueba que la sobreestima.

---

## 1. Producto mínimo esperado (desafío §6) — 7 de 8

| # | Ítem exigido | Estado | Evidencia real |
|---|---|:--:|---|
| 1 | Autenticación y perfiles | ✅ | JWT (acceso + refresh), RBAC con **3 roles / 21 permisos**; login verificado en navegador |
| 2 | Gestión de instalaciones, cultivos y sensores | ✅ | CRUD de sistemas, cultivos, plantas, dispositivos, sensores, tipos de variable y reglas (**19 modelos / 20 tablas**) |
| 3 | API para recepción de mediciones simuladas | ✅ | `POST /mediciones` y `POST /mediciones/bulk`; simulador con **3 modos** (`online`, `offline`, `anomalia`); e2e: 15 aceptadas, 2 alertas |
| 4 | Persistencia en base de datos | ✅ | PostgreSQL 16; **52 230** mediciones, esquema *append-only* |
| 5 | Dashboard con estado actual e históricos | ✅ | **4 pantallas** (Panel, Históricos, Alertas, Administración) verificadas; exportación CSV |
| 6 | Alertas simples por reglas | ✅ | Motor de reglas en línea, **4 reglas** activas, generación y resolución de alertas |
| 7 | **Despliegue cloud** | 🟡 **NO** | Docker/Compose reproducible + imagen construida (`aquabrain-api:dev`, 162 MB); **no** desplegado en proveedor cloud |
| 8 | Documentación y pruebas | ✅ | Docs ES1–ES4 + README; OpenAPI/Swagger en `/api/docs`; **125 pruebas** (50 unitarias + 75 integración); cobertura de líneas **92,26 %** |

> **El ítem 7 es el único incumplimiento del producto mínimo.** Está **declarado** explícitamente en
> `docs/ES3/08-despliegue-y-reproducibilidad.md` §8.6 y en `docs/ES3/11-analisis-de-discrepancias.md`
> (D-09): *«No se desplegó en un proveedor de nube… el despliegue verificado es local + Compose»*.
> No se oculta.

---

## 2. Criterios de aceptación del prototipo académico (desafío, Antecedentes §6) — 6 de 7

| Criterio del desafío | Estado |
|---|:--:|
| El sistema permite registrar/administrar los elementos principales del dominio | ✅ |
| Una API o simulador envía mediciones y estas quedan persistidas con timestamp | ✅ |
| El dashboard muestra estado actual, históricos y alertas de forma comprensible | ✅ |
| El sistema controla acceso mediante autenticación y roles | ✅ |
| Maneja errores de datos y contempla la pérdida temporal de conectividad | ✅ (buffer `offline` + lote idempotente) |
| **La aplicación y su base de datos están desplegadas en un entorno accesible para evaluación** | 🟡 **NO** (solo ejecución local) |
| El resultado puede ser probado, reutilizado o servir para decidir tecnología | ✅ |

---

## 3. Rúbricas de las evaluaciones ES1–ES4

| Evaluación | Estado | Cobertura verificada |
|---|:--:|---|
| **ES1** — Diagnóstico del problema | ✅ | Matriz de necesidades (NEC) con MoSCoW, análisis de tendencias, priorización justificada, **11 historias de usuario** con criterios de aceptación, catálogo **RF01–RF15 / RNF01–RNF11**, comparación Scrum/Scrumban/Kanban, amenazas + controles, impacto ético y profesional |
| **ES2** — Diseño de la solución | ✅ | Cronograma con dependencias, **arquitectura 4+1**, stack e infraestructura, wireframes + guía visual, DER con claves/cardinalidades/integridad, políticas de autenticación/autorización, amenazas y mitigación, estándares de codificación segura, **plan de pruebas** |
| **ES3** — Implementación | ✅ | Frontend, backend/API, base de datos y simulador; normalización e índices justificados; patrones de seguridad; entorno reproducible; README/guía; **ejecución del plan de pruebas**; resultados esperado vs obtenido; análisis de discrepancias y recomendaciones |
| **ES4** — Cierre, demostración y defensa | ✅ | Documentación final con propuesta de valor, funcionalidad demostrada, estándares aplicados, **plan de mantención (ISO/IEC 14764)**, presentación final, **resultados cuantificables** y material de exposición/defensa |

---

## 4. Matriz de trazabilidad mínima y checklist

- **Matriz de trazabilidad de 7 eslabones** — *Necesidad → HU → RF/RNF → Caso de uso → Diseño →
  Implementación → Prueba*: **existe y está cerrada por requisito**.
  - `docs/ES1/informe/08-trazabilidad.md` (modelo y eslabones NEC→HU→RF).
  - `docs/ES2/informe/09-trazabilidad.md` (completa la columna **Diseño**).
  - `docs/ES3/13-trazabilidad.md` (cierra **Implementación** y **Prueba**, con ruta de código y caso de prueba).
- **Checklist antes de cada entrega (6 preguntas):** las seis se responden con evidencia:
  decisiones sustentadas en el problema, cadena trazable, evidencia de lo que funciona (no de lo
  planeado), justificación de arquitectura/tecnologías/modelo/seguridad, resultados medidos y
  comparados, y documentación reproducible por terceros.

---

## 5. Reglas operacionales e información de dominio (desafío, Antecedentes §2 y §3)

| Aspecto | Estado | Nota |
|---|:--:|---|
| Mediciones con referencia temporal; almacenamiento en UTC | ✅ | RN-08 |
| Pérdida de conectividad + almacenamiento local + sincronización posterior | ✅ | Modo `offline` del simulador + `POST /mediciones/bulk` + idempotencia por `idExterno` |
| **Reintentos de comunicación** | 🟡 | Hay **reenvío** del lote al reconectar (con idempotencia verificada) y `retry:1` en el frontend, pero **no** un mecanismo de reintentos automáticos con *backoff* en la ingesta |
| Control del estado del dispositivo/enlace y «última comunicación» | ✅ | Cálculo de *frescura*: `ALERT_SILENCE_FACTOR × intervalo` → `SIN_COMUNICACION` |
| Autenticación, roles, permisos, respaldos y protección | 🟡 | Auth/roles/permisos ✅; **respaldos** figuran solo como **propuesta** en el plan de mantención (no ejecutados) |
| Alertas sobre datos confiables | ✅ | Validación de entrada, *cooldown* de reglas, no se alerta por dato desactualizado |
| Evolución desde pocos sistemas a cientos/miles | 🟡 | Diseño documentado (índices, normalización); **particionado `Won't`** (RNF04) |
| Información de dominio: usuario/rol, sistema, cultivo/planta, dispositivo, sensor/tipo, medición, umbral/regla, estado del dispositivo | ✅ | Cubiertos en el modelo de datos (incluye `Planta` y `EstadoSensorActual`) |
| Información de dominio: **Evento** | 🟡 | **Modelado pero no implementado** (ver §6, hallazgo 1) |
| Variables de cultivo (nutrientes, caudal, consumo hídrico, fotoperiodo) | 🟡 | Priorizadas **5** (`TEMPERATURA`, `HUMEDAD`, `DISTANCIA`, `PH`, `CAUDAL`); nutrientes/consumo hídrico/fotoperiodo quedan para validar con la contraparte |

> El desafío indica que *qué variables priorizar* debe **validarse con la contraparte** durante
> ES1/ES2, de modo que la selección de 5 tipos de variable es una decisión de alcance, no una omisión.

---

## 6. Hallazgos (inconsistencias detectadas)

### Hallazgo 1 — Entidad `Evento` modelada pero no implementada (*brecha no declarada*)

- La tabla `evento` **existe** en la migración `20261016225855_init` y en `schema.prisma`
  (con `enum TipoEvento`: `SIN_COMUNICACION`, `RECONEXION`, `REINTENTO_SINCRONIZACION`, `ERROR_SENSOR`,
  `CAMBIO_CONFIGURACION`, `DESPLIEGUE`), y está descrita en ES2 y ES3.
- **Ningún servicio la escribe ni la expone:** no hay módulo, controlador ni endpoint de eventos, y
  `prisma.evento` no aparece en el código de aplicación (solo en el esquema).
- El diseño indica que al detectar silencio «se genera evento/alerta» (FB-02, plan de pruebas TS-40),
  pero la implementación **no crea evento ni alerta** en ese caso.
- `docs/ES3/11-analisis-de-discrepancias.md` **no declara** esta brecha.

### Hallazgo 2 — La descripción de TS-40 sobreestima lo probado

- El plan de pruebas y el informe describen TS-40 como *«dispositivo pasa a `SIN_COMUNICACION` +
  evento/alerta»* y lo marcan ✅.
- La prueba real (`apps/api/test/alertas.e2e-spec.ts`, líneas 302–327) **solo** verifica que la
  *frescura* calculada sea `SIN_COMUNICACION` y que `segundosSinReportar > umbralSilencioSeg`.
  **No** comprueba creación de evento ni de alerta.

### Hallazgo 3 — Despliegue cloud ausente (declarado)

- Único ítem del producto mínimo no cumplido (**desafío §6.7** y criterio de aceptación 6).
- Declarado en ES3 §8.6 y D-09. La solución es reproducible en local (Compose + imagen construida),
  pero **no** está publicada en un entorno accesible para evaluación.

### Hallazgo 4 — Evidencias de proceso no ejecutadas (declaradas)

- **ZAP**, **Lighthouse**, **k6** (carga concurrente) y validación con la **app Android** no se
  ejecutaron; **respaldos** y **uptime** figuran como propuesta, no como ejecución.
- Todo ello está declarado en `docs/ES3/11-analisis-de-discrepancias.md` (D-08…D-14) y en
  `docs/ES4/07-resultados-cuantificables.md` §7.2/§7.5. **No hay cifras maquilladas.**

### Hallazgo 5 — Reintentos sin *backoff* automático

- La tolerancia a cortes se resuelve con buffer local + sincronización en lote idempotente
  (HU10/RF14), no con una política de reintentos automáticos con retroceso exponencial.

---

## 7. Conclusión

El proyecto **cumple la gran mayoría de lo pedido**: **7 de 8** productos mínimos y **6 de 7**
criterios de aceptación del prototipo, con las rúbricas ES1–ES4, la matriz de trazabilidad de
7 eslabones y el checklist cubiertos.

El único incumplimiento del producto mínimo es el **despliegue cloud**, que está **declarado** como
limitación. La **única brecha no declarada** encontrada es que la entidad **`Evento`** se modeló
pero no se implementó (y la descripción de TS-40 la sobreestima).

**Acciones recomendadas (por prioridad):**

1. ✅ **Aplicada** — Brecha de `Evento` **declarada** en `docs/ES3/11-analisis-de-discrepancias.md`
   (§11.6, D-15) y en `docs/ES3/informe/13-discrepancias-y-recomendaciones.md` (§13.2, D-15).
   *Alternativa de mayor alcance (pendiente):* implementar el registro real de eventos
   (`SIN_COMUNICACION`/`RECONEXION`) y su consulta.
2. ✅ **Aplicada** — Enunciado de TS-40 corregido en `docs/ES2/07-plan-de-pruebas.md`,
   `docs/ES2/informe/08-plan-de-pruebas.md` y `docs/ES3/informe/11-ejecucion-del-protocolo-de-pruebas.md`,
   con nota en el feedback (`docs/ES2/09-feedback-prototipo.md`).
3. Si el alcance lo permite, publicar la solución en un PaaS gratuito (Render/Railway/Neon) para
   cerrar el ítem 7 del producto mínimo.

---

## Anexo A — Fuentes inspeccionadas

**Desafío:** `Desafio_API2_AquaPlants_rev1.docx` (texto completo).
**Documentación:** `docs/ES1/00-backlog-base.md`, `docs/ES1/informe/08-trazabilidad.md`,
`docs/ES2/informe/09-trazabilidad.md`, `docs/ES2/03-stack-e-infraestructura.md`,
`docs/ES3/{08-despliegue-y-reproducibilidad,09-ejecucion-plan-de-pruebas,10-resultados-vs-esperados,11-analisis-de-discrepancias,13-trazabilidad}.md`,
`docs/ES4/{07-resultados-cuantificables,09-plan-mantencion}.md`.
**Código y datos:** `apps/api/prisma/schema.prisma`,
`apps/api/prisma/migrations/20261016225855_init/migration.sql`, `apps/api/src/modules/**`,
`apps/api/test/alertas.e2e-spec.ts`, `apps/simulator/src/**`, `apps/web/src/**`.
**Verificación funcional (2026-10-17):** ejecución e2e del simulador (online y anomalía), barrido de
endpoints de lectura y verificación de UI en navegador; evidencia en `docs/ES4/evidencia/`.
