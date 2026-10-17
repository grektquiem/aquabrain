# ES2 · 11 — Banco de preguntas y respuestas para la defensa

Este banco cubre el indicador **2.1.6.15** ("responde preguntas"). Las respuestas son breves, citan la **evidencia**
del documento y usan los identificadores canónicos (HU/RF/RNF/RN/CU/TS/D/RA) para que cualquier afirmación se pueda
verificar. Recomendación: ensayar en 30–60 segundos por respuesta.

---

## 1. Metodología y planificación

**¿Por qué Scrum y no Kanban o Scrumban?**
Porque Scrum impone **revisiones y un incremento demostrable por sprint**: un equipo de tres personas que debe
integrarse con hardware real, una API y dos clientes ya existentes necesita hitos de control obligatorios. La
ponderación de criterios (§1.1 de `01-metodologia-cronograma.md`) dio Scrum 27, Scrumban 25 y Kanban 22.
*(Decisión D-01.)*

**¿Cómo demuestran que cada fase tiene un responsable y un entregable?**
Cada ceremonia produce un artefacto (§1.4) y cada sprint tiene objetivo, Review y entregable (§3, con fechas exactas).
Los roles son Product Owner (Rodrigo Terraza), Scrum Master (Benjamín Espinoza) y desarrollo (los tres).

**¿Cómo priorizan si todo parece "Must"?**
MoSCoW se complementa con **priorización por valor/riesgo** (§5 de `01`): centralización de datos (NEC-01) = 1,
ingesta del firmware real (RF06) = 2, dashboard (RF07) = 3, autenticación (RF01–RF05) = 4. El licenciamiento (RF15)
es *Won't* por ahora.

**¿Cuál es la ruta crítica?**
`T-01 → T-05 → T-10 → T-15 → T-19 → T-20 → T-23 → T-24` (alcance → modelo conceptual → modelo lógico →
seguridad → pruebas → trazabilidad → cierre) y, en paralelo, la rama de prototipos
`T-01 → T-12 → T-13 → T-14 → T-22`. Ver matriz de dependencias en §4 de `01`.

---

## 2. Arquitectura y decisiones

**¿Por qué un monolito modular y no microservicios desde el inicio?**
El equipo es de tres personas y el dominio es pequeño; un monolito modular NestJS (decisión D-02) permite desarrollar
rápido y **extraer después** `MedicionesModule` como servicio de ingesta (necesidad futura) sin reescribir el contrato
`/api/v1`. Los microservicios añadirían costo operativo sin beneficio en un prototipo.

**¿Por qué una sola API REST para web, Android y firmware?**
Para mantener **un contrato único y estable** (RA-02, D-13): OpenAPI 3 documenta `/api/v1` y los tres clientes lo
consumen. Así se evita duplicar lógica y se valida el diseño contra el cliente Android existente.

**¿Cómo se justifica la arquitectura 4+1?**
Con las cinco vistas (escenarios, lógica, procesos, desarrollo, física) en `02-arquitectura-4mas1.md`; cada decisión
se rastrea a un escenario arquitectónicamente significativo (E-1…E-6) y a un requisito.

**¿Cómo cubre el diseño los tres clientes actuales (firmware, Android, web)?**
La **vista de despliegue y componentes** (`02` §5.4) muestra los tres clientes consumiendo la misma API; la **vista
de procesos** detalla la ingesta (E-1) y la sincronización tras pérdida de conectividad (E-5).

---

## 3. Datos

**¿Por qué PostgreSQL y no una base NoSQL para todo?**
Porque los datos de negocio (usuarios, sistemas, dispositivos, reglas, alertas) requieren **integridad referencial,
unicidad y transacciones**. NoSQL se reserva como *landing zone* de payload crudo y para caché/logs (decisión D-07).

**¿Por qué MongoDB si ya tienen PostgreSQL?**
Porque el **payload del dispositivo varía** según modelo/versión de firmware (AHT10 vs. HC-SR04 vs. simulador) y es
alto volumen *append*; guardarlo en un esquema flexible evita migraciones por cada cambio de firmware (rol: zona de
aterrizaje + auditoría, `05-modelo-de-datos.md` §7).

**¿Cómo resuelven el rendimiento de los históricos?**
Con **particionado** de `medicion` por rango de fecha e **índice `(sensor_id, timestamp DESC)`** (D-08), más
`date_trunc` para series agregadas. Ejemplos SQL concretos en `05` §7.1. Umbral: 1 mes / 50.000 registros < 5 s (RNF03).

**¿Qué pasa si crecen a millones de mediciones?**
`medicion` se convierte en *hypertable* de **TimescaleDB** (compatible con PostgreSQL) y/o se mueve a un servicio de
series temporales; el criterio de migración (≈10 M de filas o > 5 s) está documentado en `05` §7.

**¿Cómo evitan duplicar una medición reenviada?**
Con **idempotencia** por `id_externo` y una estrategia *store-and-forward* en el dispositivo (decisión D-14, RF14,
RN correspondiente): el mismo `id_externo` no genera una segunda fila.

---

## 4. Seguridad

**¿Cómo se evita una medición falsa o de un dispositivo no autorizado?**
Cada dispositivo tiene una **API key única** guardada solo como **hash** (`api_key_hash`), se transmite por HTTPS en
`X-Device-Key` y su alcance es **escribir solo su propio sensor** (D-10). Se suma validación de tiempo, control de
tasa por dispositivo y auditoría (`06-seguridad.md` §2.2).

**¿Cómo protegen las contraseñas y las sesiones?**
bcrypt con *cost* 12, mínimo 10 caracteres, verificación contra listas filtradas, historial de las últimas 5 y
expiración (90 días Administrador, 180 el resto). Sesión con **access token JWT (15 min)** + **refresh opaco (7 días)
en cookie HttpOnly/Secure/SameSite=Strict con rotación** (D-09). MFA obligatorio para Administrador.

**¿Ya evaluaron OWASP y STRIDE?**
Sí: mapeo **OWASP Top 10 (2021)** y análisis **STRIDE** por componente en `06` §5, con riesgos priorizados
(RSK-01…RSK-12) y su mitigación.

**¿Cómo se protege la app Android?**
Tokens de vida corta + refresh, almacenamiento en **Keystore**, TLS, y revocación de sesiones; el contrato se valida
contra el cliente existente. *(Ver también la limitación documentada sobre el contrato del cliente Android, ES1.)*

**¿Qué pasa si roban una API key de un dispositivo?**
Solo sirve para **escribir** mediciones de su propio sensor (no puede leer). Se **rota** la clave de inmediato
(endpoint administrativo, con auditoría) y la cadencia programada de rotación es de **90 días**.

---

## 5. Pruebas y calidad

**¿Cómo prueban el rendimiento?**
Con **k6** sobre el dashboard y los históricos: dashboard < 2 s (p95) y 1 mes / 50.000 registros < 5 s, umbrales de
ES1 (RNF02/RNF03). Escenarios en `07` §6.

**¿Cómo alcanzan el 70 % de cobertura?**
La pirámide de pruebas concentra el volumen en **unitarias (Jest)** sobre las reglas de alerta y las validaciones
(donde está la lógica), integración (Supertest) para los endpoints y E2E (Playwright) solo para flujos críticos
(RNF10, `07` §2.2).

**¿Qué automatizan y qué dejan manual?**
~70 % automatizado (unitarias, integración, E2E críticos, k6, ZAP) y ~30 % manual (usabilidad, accesibilidad,
aceptación con *stakeholders*, prueba del modo offline). Matriz herramienta–tipo en `07` §7 y en `10` §… .

**¿Cómo trazabilizan HU → RF → prueba?**
Con la matriz de trazabilidad (`08-trazabilidad.md`) y su actualización en cada *pull request*; ningún requisito
queda sin prueba y ninguna prueba sin requisito (0 huérfanos).

**¿Qué evidencia entregan de las pruebas?**
Reportes de **Jest/Supertest, k6 y ZAP**, capturas y logs con `correlation-id`, más el registro de ejecución de §8.
El catálogo de ES2 define **pasos y resultado esperado**; los campos "obtenido/evidencia" se completan al ejecutar
(ES3), porque ES2 es la fase de diseño.

---

## 6. Operación, escalabilidad y continuidad

**¿Cómo garantizan el 99 % de disponibilidad (08:00–20:00)?**
Contenedores (**Docker**) sobre un PaaS con SLA, **health checks**, reinicio automático, monitoreo y alertas
operativas; complementado con operación local del dispositivo cuando cae la red (RNF02, RNF09 en parte).

**¿Qué pasa si se cae la red en el lugar del cultivo?**
El dispositivo sigue operando localmente (lectura y control en pantalla) y aplica **store-and-forward**: almacena las
mediciones y las reenvía con su *timestamp* original cuando vuelve la conexión (RF14, E-5).

**¿Cómo escala el sistema a muchos dispositivos?**
Índices + particionado, **colas (BullMQ/Redis)** para desacoplar la evaluación de alertas de la ingesta, caché de la
"última medición" (30 s) y la ruta a un microservicio de ingesta (necesidad futura, `02` §5.4).

**¿Por qué *polling* con caché y no WebSocket?**
Porque RNF03 pide dashboard < 2 s y no exige empuje; el *polling* con caché de 30 s (D-15) es más simple y suficiente.
**WebSocket** queda como necesidad futura para notificar alertas en vivo (`03-stack-e-infraestructura.md` §1).

---

## 7. Preguntas difíciles y de alcance

**¿Qué quedó fuera de alcance y por qué?**
El **licenciamiento** (HU09/RF15/CU-16) quedó *Won't* "por ahora" (no hay respaldo del requisito, supuesto SUP-09);
la **escalabilidad masiva** (NEC-09/RNF04) y la **autonomía local total** (RNF09) también se difieren. Se documenta
explícitamente para no afirmar capacidades no comprometidas.

**¿Por qué el prototipo usa pH y caudal simulados?**
Porque el hardware disponible (ESP32-S3 + AHT10 + HC-SR04) **no incluye** sensores de pH ni de caudal; se simulan
(supuesto SUP-01) y el diseño es agnóstico para incorporarlos después.

**¿El sistema reemplaza a la app Android existente?**
No. La app Android es un **cliente**; el alcance de construcción es la plataforma web, la API y el modelo de datos
que la soportan (el firmware y la app no se construyen en esta asignatura).

**¿Cómo validaron el diseño con el usuario?**
Con entrevistas, revisión del prototipo (*walkthrough*) y prueba de tareas; el registro FB-01…FB-16 documenta qué se
observó y qué cambió (método, iteraciones y cambios antes/después en `09-feedback-prototipo.md` §3).

**¿Qué harían distinto si tuvieran más tiempo?**
Implementar *push* en tiempo real (WebSocket), incorporar pH/caudal reales y reforzar la observabilidad (trazas
distribuidas). Son justamente las "necesidades futuras" del stack.

---

## 8. Recomendaciones para la defensa

1. Cada respuesta se acompaña de **una evidencia visual**: DER, casos de uso, secuencia, componentes o despliegue.
2. Mencionar siempre el **identificador** (RF/RNF/RN/D/TS) para mostrar trazabilidad viva.
3. Reconocer con naturalidad lo que es **diseño** (ES2) frente a lo que se **implementa** (ES3): no afirmar resultados
   que no se hayan ejecutado.
4. Cerrar con la **matriz de trazabilidad** y la priorización por valor/riesgo, que son el "hilo" que evalúa la rúbrica.
