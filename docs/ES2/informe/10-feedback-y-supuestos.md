# 10 · Retroalimentación de usuarios y supuestos abiertos

La rúbrica exige **integrar retroalimentación de usuarios para mejorar el diseño** y dejar registro de
los cambios aplicados. Este capítulo cumple dos funciones: (1) administrar los **supuestos abiertos**
que deben validarse con la contraparte, y (2) registrar la **retroalimentación** recibida y su efecto
concreto sobre el prototipo y la especificación.

## 10.1. Supuestos abiertos a validar con la contraparte

`SUP-01…SUP-08` se administran aquí; `SUP-09` y `SUP-10` provienen de las correcciones de ES1
(`docs/ES1/00-backlog-base.md` §12). Mientras no se confirmen, el diseño adopta la decisión indicada, de
modo que **no se bloquea el avance**.

| ID | Aspecto a validar | Decisión provisoria adoptada | Impacto si cambia | Estado |
|---|---|---|---|---|
| SUP-01 | Qué variables y sensores se priorizan en el prototipo | Real: temperatura (°C), humedad (%), distancia/nivel (cm). Simulado: pH y caudal (L/min) | Cambia el catálogo `tipo_variable` y las tarjetas del dashboard | ⏳ Por validar |
| SUP-02 | Frecuencia real o deseada de envío de mediciones | 5 minutos por sensor (`intervalo_reporte_seg = 300`) | Afecta volumen, prueba de carga y umbral de silencio | ⏳ Por validar |
| SUP-03 | Rangos y umbrales que deben originar una alerta | Valores de referencia agrónomos precargados y **editables por el administrador** | Solo cambia la semilla, no el modelo | ⏳ Por validar |
| SUP-04 | Qué información debe mostrarse primero en el dashboard | Última medición por sensor con fecha/hora y semáforo de frescura + alertas activas | Reordena los bloques del dashboard | ⏳ Por validar |
| SUP-05 | Relación real sistema ↔ cultivo ↔ planta ↔ dispositivo ↔ sensor | Un dispositivo pertenece a un sistema; un sensor a un dispositivo; un cultivo se monitorea con N sensores | Cambia cardinalidades del modelo (incluye si el acceso se restringe por sistema) | ⏳ Por validar |
| SUP-06 | Tiempo de conservación de los históricos | 24 meses en PostgreSQL y agregados indefinidos | Cambia la política de particiones y respaldo | ⏳ Por validar |
| SUP-07 | Comportamiento esperado cuando un dispositivo deja de reportar | A 3× el intervalo se marca `SIN_COMUNICACION` y se genera evento/alerta de severidad alta | Cambia el factor y la severidad (RN-05) | ⏳ Por validar |
| SUP-08 | Qué puede tratarse como dato real controlado y qué debe permanecer simulado | Real: AHT10/HC-SR04 (temperatura, humedad, distancia). Simulado y rotulado: pH y caudal | Cambia el rotulado y la carga inicial | ⏳ Por validar |
| SUP-09 | El **licenciamiento** (HU09/RF15/CU-16) no está respaldado por el desafío | Fuera de alcance (*Won't por ahora*); se documenta su forma en el cap. 06 §6.10 | Si se confirma, se agrega entidad, permiso y pantalla | ⏳ Por validar |
| SUP-10 | Compatibilidad con la **app Android existente** «sin cambios en los clientes»: no se dispone del contrato que consume hoy | Se asume `/api/v1` JSON plano; se valida con la app de prueba (HU11 CA③) | Puede exigir una capa de compatibilidad o un endpoint adicional | ⏳ Por validar |

**Cómo se cierran los supuestos:** cada uno se resuelve en la reunión de validación con la contraparte
(«CONTRAPARTE»), se registra el acta con fecha y se actualiza el estado a `✅ Validado` o
`🔄 Modificado`, indicando la sección del diseño afectada.

## 10.2. Registro de retroalimentación

Formato: **quién observó → qué observó → decisión tomada → qué cambió concretamente → estado.**

| # | Fecha | Fuente | Observación recibida | Decisión | Cambio aplicado | Estado |
|---|---|---|---|---|---|---|
| FB-01 | 2026-04-14 | Contraparte / docente | «El dashboard debe permitir saber de inmediato si un dato es confiable o está viejo» | Adoptada | Se incorpora **semáforo de frescura** (normal / advertencia / crítico / desactualizado) en cada tarjeta de sensor (W-02) y la regla de 3× el intervalo (RN-05) | ✅ Aplicado |
| FB-02 | 2026-04-14 | Contraparte / docente | «Un dato viejo no debe confundirse con una alerta de umbral» | Adoptada | Se separan dos conceptos: **alerta por umbral** (RF11) y **marca de dato desactualizado**; la segunda no crea alerta, solo cambia el estilo de la tarjeta (la generación de evento quedó como brecha declarada: ES3 D-15) | ✅ Aplicado |
| FB-03 | 2026-04-15 | Docente de la asignatura | «Los umbrales no pueden estar fijos en el código» | Adoptada | Se crea el módulo de reglas con CRUD y auditoría (`regla_alerta`), con ámbito por sensor o por tipo de variable (RN-07) y cooldown (RN-04) | ✅ Aplicado |
| FB-04 | 2026-04-15 | Docente de la asignatura | «Hay que distinguir el dato que llegó tarde por falta de Internet» | Adoptada | Se agrega `origen` (`ONLINE`/`OFFLINE`/`MANUAL`), `id_externo` para idempotencia y un indicador visual en la tabla del histórico (W-03) | ✅ Aplicado |
| FB-05 | 2026-04-16 | Compañeros de equipo (revisión cruzada) | «El filtro de históricos podía pedir años de datos y colgar la consulta» | Adoptada | Se limita a **90 días por consulta**, con agregación obligatoria y paginación por cursor (RNF03) | ✅ Aplicado |
| FB-06 | 2026-04-16 | Compañeros de equipo | «Marcar una alerta como resuelta sin explicación no sirve para nada» | Adoptada | El comentario de resolución queda registrado con usuario y hora y la alerta conserva su histórico (RF12, HU03 CA④) | ✅ Aplicado |
| FB-07 | 2026-04-14 | Contraparte | «¿Qué pasa si se cae Internet del invernadero?» | Adoptada | Se documenta la estrategia *store-and-forward*, reintentos con retroceso exponencial y reenvío idempotente (CU-14, E-5, RN-10) | ✅ Aplicado |
| FB-08 | 2026-04-15 | Docente | «La plataforma debe dejar claro que los datos son simulados» | Adoptada | Se agrega un aviso permanente **«Datos simulados con fines académicos»** y el rotulado `origen_dato` (REAL/SIMULADO) en las variables (cap. 07 §7.7.3) | ✅ Aplicado |
| FB-09 | 2026-04-14 | Contraparte | «Sería útil comparar dos sistemas en el mismo gráfico» | Adoptada | Se incorpora la **comparación multi-sistema** con eje temporal común y leyenda en la pantalla de históricos (W-03, RF09, HU04) | ✅ Aplicado |
| FB-10 | 2026-04-22 | Revisión de accesibilidad | «No se puede distinguir el estado solo por color» | Adoptada | Cada estado agrega **ícono y texto** además del color (WCAG 1.4.1); se documenta en la guía visual §5.5.1 y §5.5.3 | ✅ Aplicado |
| FB-11 | 2026-04-14 | Contraparte | «¿Se puede ver el histórico en el teléfono?» | Adoptada | Se define el comportamiento responsive de la tabla (se transforma en tarjetas) y el gráfico con *tooltip* táctil (cap. 05 §5.6) | ✅ Aplicado |
| FB-12 | 2026-04-16 | Equipo | «Falta una forma de saber quién cambió un umbral» | Adoptada | Se agrega la tabla y el módulo de **auditoría** con interceptor global (RNF11, RF10) | ✅ Aplicado |
| FB-13 | 2026-04-14 | Contraparte | «El administrador solo debe ver lo que necesita» | Adoptada | Se define la **matriz rol ↔ permiso** con mínimo privilegio y se descarta el rol «superusuario» genérico | ✅ Aplicado |
| FB-14 | 2026-04-15 | Docente | «No se debe prometer una escala que el prototipo no sostiene» | Adoptada | Se declara explícitamente que la escala masiva no se reproduce (RNF04 *Won't*); se documenta la estrategia y se fija la prueba de RNF03 con 50.000 registros | ✅ Aplicado |
| FB-15 | 2026-04-15 | Docente (corrección ES1) | «La interfaz debe ser consistente con el display OLED local» | Adoptada | Se nombran las variables y unidades igual que en el OLED y se declara la regla de consistencia (RN-12, RNF05) | ✅ Aplicado |
| FB-16 | 2026-04-15 | Docente (corrección ES1) | «El administrador no puede eliminar su propia cuenta» | Adoptada | Se agrega la restricción de negocio RN-06 y su prueba negativa (TS-19) en usuarios | ✅ Aplicado |

> Las fechas del registro están alineadas al cronograma (Sprint 1: sesión con la contraparte 14-abr,
> docente 15-abr, revisión cruzada 16-abr-2026; Sprint 2: checklist de accesibilidad 22-abr-2026). Si la
> sesión real se movió, se ajusta la fecha. Una observación **no adoptada** también se registra,
> indicando el motivo (costo, fuera de alcance, requisito no confirmado).

## 10.3. Metodología de levantamiento de la retroalimentación

| Actividad | Cuándo | Quién participa | Salida |
|---|---|---|---|
| Entrevista inicial de requisitos | Sprint 0 | Contraparte (encargado / supervisor) | Requisitos base (heredados de ES1) |
| Revisión del prototipo con la contraparte (*walkthrough*) | Sprint 1 (T-14) | «CONTRAPARTE», Product Owner, integrante de diseño | Registro FB-xx + cierre de supuestos SUP-xx |
| Revisión cruzada interna del equipo | Cada Pull Request y Sprint Review | Todo el equipo | Observaciones de usabilidad y consistencia |
| Prueba de usabilidad con usuario externo | Antes del cierre de ES2 (Sprint 2) | Una persona ajena al equipo, con perfil «encargado» | Registro de dificultades de uso (prueba de tareas) |
| Evaluación heurística (10 heurísticas de Nielsen) | Sprint 2 | Equipo | Lista de problemas de usabilidad |
| Checklist de accesibilidad, responsive y **consistencia con el OLED** | Antes de cada entrega | Integrante de frontend | Lista verificada (WCAG 2.1 AA) |
| Validación del contrato con la app Android de prueba | Sprint 2 | Integrante de backend + contraparte | Cierre parcial de `SUP-10` (HU11 CA③) |

### 10.3.1. Guion de la prueba con usuario (5 tareas, sin ayuda)

1. Ingresar con las credenciales entregadas.
2. Determinar el valor actual de la temperatura y si el dato está vigente (fecha y hora).
3. Revisar si hay alertas activas y marcar la más antigua como resuelta.
4. Consultar el histórico de pH de los últimos 7 días, compararlo entre dos sistemas y **exportar el CSV**.
5. Explicar qué haría si un dispositivo deja de reportar.

Se registra: tarea completada (sí/no), tiempo, dudas expresadas y comentario textual del usuario.

### 10.3.2. Técnicas de recolección

| Técnica | Aplicación |
|---|---|
| Entrevista semiestructurada | Requisitos iniciales (Sprint 0) |
| Recorrido guiado (*walkthrough*) + observación | Revisión del prototipo con la contraparte (Sprint 1) |
| Revisión por pares con checklist | Cada PR y Sprint Review |
| Prueba de tareas sin ayuda | Usabilidad con usuario externo (Sprint 2) |
| Evaluación heurística | 10 heurísticas de Nielsen (Sprint 2) |
| Checklist de accesibilidad y responsive | WCAG 2.1 AA antes de cada entrega |

## 10.4. Iteraciones del prototipo y cambios aplicados

### 10.4.1. Iteraciones

| Iteración | Qué se hizo | Retroalimentación clave | Resultado |
|---|---|---|---|
| **v1 — wireframe** | Bocetos de baja fidelidad de las pantallas principales | «Falta saber si el dato es viejo» (FB-01) | Semáforo de frescura |
| **v2 — visual** | Alta fidelidad con *design tokens* y estados | «No distingo el estado solo por color» (FB-10); «no se ve en el celular» (FB-11) | Ícono + texto; responsive de tablas |
| **v3 — navegable** | Flujo clicable con el *feedback* aplicado | «Quiero comparar sistemas» (FB-09) | Comparación multi-sistema (RF09) |

### 10.4.2. Cambios antes / después

| Pantalla | Antes | Retroalimentación | Después |
|---|---|---|---|
| Dashboard | Solo números | «No sé si el dato es confiable» | Tarjetas con semáforo de frescura (color + ícono + texto) |
| Históricos | Sin filtros | «No puedo acotar el rango» | Filtros por sistema, sensor y rango; exportación CSV |
| Alertas | Lista plana | «No sé cuáles siguen activas» | Pestañas Activas/Resueltas + severidad con ícono |
| Reglas | Formulario largo | «Es confuso» | Formulario por pasos con vista previa y prueba de la regla |
| Móvil | No responsive | «No se ve en el celular» | Layout colapsable y tablas que se vuelven tarjetas |

### 10.4.3. Trazabilidad del feedback (dónde se aplicó cada cambio)

| Cambio aplicado | Documento modificado | Sección |
|---|---|---|
| Semáforo de frescura | Cap. 05 (prototipos) | §5.2.2, §5.5.3 |
| Separación alerta por umbral / dato desactualizado | Cap. 05 · catálogo ES1 | §5.2.2 · RN-05 |
| Reglas configurables con cooldown y prueba | Cap. 06 · Cap. 07 · Cap. 05 | §6.3.4 · §7.3 · §5.2.6 |
| Origen y sincronización offline | Cap. 06 · Cap. 03 | §6.3.4 · §3.5.5 |
| Límite de 90 días y agregación | Cap. 08 · Cap. 03 | §8.5.3 · §3.5.3 |
| Registro histórico al marcar resuelta | Cap. 06 · Cap. 05 | §6.3.4 · §5.2.4 |
| Aviso de datos simulados y `origen_dato` | Cap. 07 · Cap. 06 · Cap. 05 | §7.7.3 · §6.3.3 · §5.2.2 |
| Comparación multi-sistema | Cap. 05 · Cap. 09 | §5.2.3 · §9.1 (HU04) |
| Estado no solo por color | Cap. 05 | §5.5.1, §5.5.3 |
| Auditoría | Cap. 06 · Cap. 07 | §6.3.1 · §7.4 |
| Matriz de permisos con mínimo privilegio | Cap. 07 | §7.3.3 |
| Consistencia con el OLED | Cap. 05 · catálogo ES1 | §5.2.2 · RN-12 |
| No auto-eliminación del administrador | Cap. 06 · Cap. 07 · Cap. 08 | §6.3.1 · §7.3.5 · TS-19 |
| Declaración de escala y volumen simulado | Cap. 01 · Cap. 08 | §1.3 · §8.6 |

## 10.5. Cómo se cierra el ciclo

1. **Cada observación** se registra con fecha, fuente y efecto concreto (FB-xx), sin importar si se
   adopta o se rechaza; una observación rechazada indica el motivo.
2. **Cada cambio** queda reflejado en un capítulo concreto del informe y, cuando aplica, en el catálogo
   canónico (`docs/ES1/00-backlog-base.md`).
3. **Cada supuesto** (SUP-xx) se cierra en la reunión de validación con un acta y se propaga a las
   secciones afectadas.
4. La **matriz de trazabilidad** (cap. 09) se actualiza en cada cambio, de modo que la mejora de diseño
   quede ligada a un requisito y a una prueba.
