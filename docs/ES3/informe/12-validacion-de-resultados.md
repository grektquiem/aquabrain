# 12 · Validación de resultados y comparación con lo esperado

> Indicadores cubiertos: **12** (validación de resultados: análisis y conclusiones sobre la calidad de la
> solución) y **13** (precisión en la comparación obtenido vs. esperado: tabla, discrepancia, causa y
> criticidad).

## 12.1 Método de validación

La validación contrasta lo que **ES2 dijo que se debía obtener** con lo que **ES3 realmente obtuvo**, en cinco
dimensiones:

1. **Funcional** — ¿cada requisito y caso de uso quedó implementado y probado?
2. **Rendimiento** — ¿se cumplen los umbrales de RNF03 sobre el volumen real?
3. **Seguridad** — ¿los controles resisten las pruebas de abuso?
4. **Calidad** — ¿la cobertura y la estabilidad de las pruebas sostienen la afirmación de calidad?
5. **Datos** — ¿la base almacena lo que el sistema dice almacenar?

La regla es **no afirmar nada que no tenga evidencia**: cada estado va con la prueba o medición que lo respalda.

## 12.2 Validación por dimensión

| Dimensión | Pregunta guía | Resultado |
|---|---|---|
| **Funcional** | ¿El sistema hace lo que debía? | **Sí** para los *Must*; un *Could* parcial (RF09) |
| **Rendimiento** | ¿Responde dentro de los umbrales con volumen real? | **Sí**: p50 104 ms (panel) y 574 ms (histórico 1 mes) sobre 52 230 filas |
| **Seguridad** | ¿Resisten los controles a los intentos de abuso? | **Sí** en las pruebas ejecutadas; falta un escáner (ZAP) |
| **Calidad** | ¿La prueba del sistema es creíble? | **Sí**: 125/125 en verde y 92,26 % de líneas |
| **Datos** | ¿Lo que se ve está en la base? | **Sí**: verificación cruzada en PostgreSQL (origen, calidad, timestamps) |

## 12.3 Comparación — Requisitos funcionales (RF)

| RF | Prio | Enunciado (resumen) | Estado | Obtenido / evidencia |
|---|---|:--:|---|:--:|---|
| RF01 | M | Autenticación y autorización con JWT y roles | ✅ | `auth` (8) + `rbac` (11); 21 permisos |
| RF02 | M | CRUD de usuarios solo administradores | ✅ | `gestion` (16); un encargado recibe `403` |
| RF03 | M | CRUD de sistemas/instalaciones | ✅ | `gestion` |
| RF04 | M | Gestión de dispositivos por sistema | ✅ | `gestion`; 2 dispositivos sembrados |
| RF05 | M | Gestión de sensores con tipo y unidad | ✅ | 10 sensores, 5 tipos de variable |
| RF06 | M | Registro de mediciones vía API | ✅ | `mediciones` (12) + simulador; > 50 000 filas |
| RF07 | M | Dashboard con última medición por sensor | ✅ | Panel verificado en navegador (10 tarjetas) |
| RF08 | S | Históricos con filtros, tabla, gráfico y CSV | ✅ | `historicos` (6) + Recharts + CSV |
| RF09 | C | Comparativa gráfica multi-sistema | 🟡 | La API acepta varios sensores; **la UI no** superpone |
| RF10 | M | CRUD de reglas de alerta | ✅ | `gestion`; 4 reglas sembradas |
| RF11 | M | Motor de evaluación de alertas | ✅ | `reglas.engine.spec` (11) + `alertas` (9) |
| RF12 | M | Lista de alertas y marcar como resuelta | ✅ | `alertas` (9) + resolución en UI (3→2) |
| RF13 | S | Documentación OpenAPI versionada | ✅ | 35 rutas en `/api/docs`; contrato verificado (TS-42) |
| RF14 | S | Estado de conexión / última comunicación | ✅ | `frescura.spec` (6); panel muestra «Sin comunicación» |
| RF15 | W | Suscripción y licenciamiento | ⬜ | Fuera de alcance (*Won't*) |

## 12.4 Comparación — Requisitos no funcionales (RNF)

| RNF | Prio | Enunciado (resumen) | Estado | Obtenido / evidencia |
|---|---|:--:|---|:--:|---|
| RNF01 | M | Seguridad: bcrypt, JWT, validación, SQLi/XSS | ✅ | bcrypt coste 12; JWT; *whitelist*; ORM; helmet |
| RNF02 | S | Disponibilidad 99 % en horario de operación | 🟡 | Existe `/health`; **no** se monitoreó *uptime* |
| RNF03 | S | Panel < 2 s; históricos 1 mes < 5 s / 50 000 | ✅ | p50 **104,1 ms** y **573,7 ms** sobre 52 230 filas |
| RNF04 | W | Escalabilidad: índices, normalización, particionado | ⬜ | Índices y normalización sí; particionado **no** |
| RNF05 | M | Usabilidad: adaptabilidad, mensajes claros | 🟡 | Maquetación fluida y errores claros; **sin** pruebas con usuarios ni OLED |
| RNF06 | M | Mantenibilidad: buenas prácticas, Git, documentación | ✅ | Monorepo, TS estricto, Git, README y docs ES1–ES3 |
| RNF07 | S | Portabilidad: Docker/PaaS con variables de entorno | 🟡 | Compose + Dockerfiles validados; ejecución **local** |
| RNF08 | S | Interoperabilidad (firmware, app Android, dashboard) | 🟡 | Contrato OpenAPI + `@aquabrain/shared`; **sin** app Android real |
| RNF09 | W | Autonomía local (OLED + joystick) | ⬜ | Depende del firmware (*Won't*) |
| RNF10 | S | Cobertura ≥ 70 % + integración + carga básica | ✅ | **92,26 %** de líneas; 125 pruebas |
| RNF11 | M | Privacidad y cumplimiento ético | 🟡 | Auditoría y secretos no versionados; **sin** retención/anonimización automatizada |

## 12.5 Análisis: qué se cumplió y por qué

**Lo que se cumplió plenamente** (con evidencia automatizada):

- **La funcionalidad *Must*:** ingesta, motor de reglas, alertas, gestión, dashboard e históricos funcionan de
  extremo a extremo. La razón es el enfoque por **módulo vertical con pruebas**: cada capacidad se cerró solo con
  su suite en verde.
- **El rendimiento (RNF03):** los umbrales se superan con holgura porque el acceso a datos está **indexado por el
  patrón de consulta** (capítulo 06) y la ingesta se optimizó (§11.6.1).
- **La seguridad (RNF01):** los controles transversales (guardas, pipe, filtro, helmet) se aplican **una sola
  vez** y cubren todas las rutas, lo que evita olvidos por controlador.
- **La calidad (RNF10):** la cobertura se sostiene porque las pruebas de integración ejercitan los servicios
  completos contra una base real.

**Lo que quedó parcial y su causa:**

| Brecha | Causa probable | Criticidad | Atiende |
|---|---|---|---|
| RF09 — comparación sin superposición en la UI | Priorización: el *Could* se abordó en la API, no en la interfaz | **Baja** | R-11 |
| RNF02 — *uptime* no monitoreado | No se levantó un entorno con monitoreo continuo | **Media** | R-10 |
| RNF05 — sin pruebas con usuarios | No hubo sesión de usabilidad en el plazo | **Media** | R-13 |
| RNF07 — sin despliegue en nube | El entorno se validó en local con Docker | **Media** | R-02 |
| RNF08 — sin validación con la app Android real | El hardware/app del cliente no estuvo disponible en la ventana | **Media** | R-03 |
| RNF11 — sin retención/anonimización automatizada | No se implementó una política de ciclo de vida del dato | **Baja** | R-04 |

**Lo que se descartó conscientemente:** RF15, RNF04 (particionado) y RNF09 (autonomía local) fueron declarados
*Won't* en el MoSCoW de ES1; **no constituyen incumplimientos**, sino **exclusiones de alcance** ratificadas.

## 12.6 Precisión de la comparación (indicador 13)

La comparación se considera **precisa** porque cada fila indica:

1. **El valor esperado** (del catálogo ES1/ES2 o del umbral del requisito).
2. **El valor obtenido** (medición, prueba o verificación real).
3. **La discrepancia** (cuando existe), **su causa probable** y su **criticidad** (capítulo 13).
4. **La evidencia** que permite reproducir la comprobación.

No se redondean ni se omiten las desviaciones: las **6 brechas parciales** y **1 hallazgo de dependencias** se
presentan con la misma precisión que los aciertos.

## 12.7 Conclusiones sobre la calidad de la solución

- **Funcionalmente**, la solución resuelve el problema de ES1: **centraliza y visualiza** el monitoreo y **actúa
  a tiempo** con alertas, con tolerancia a cortes de red (idempotencia offline).
- **No funcionalmente**, cumple los umbrales de **rendimiento** y **seguridad** y supera con holgura el de
  **cobertura**, sobre un volumen de datos **real** (> 52 000 mediciones).
- **La calidad es verificable**: 125 pruebas en verde, umbral de cobertura que **bloquea** en CI y evidencia de
  ejecución versionada.
- **Los límites están declarados**, no escondidos: 1 hallazgo de dependencias, 3 casos parciales por alcance y
  6 requisitos con matiz. Esta transparencia es, en sí misma, un indicador de madurez del entregable.

En el capítulo 13 se **priorizan** estas brechas como recomendaciones, derivadas directamente de los resultados
de las pruebas, tal como exige la rúbrica (indicador 14).
