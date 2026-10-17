# 01 · Introducción, alcance y decisiones de diseño

## 1.1. Del diagnóstico (ES1) al diseño (ES2)

La Unidad 1 cerró con un diagnóstico trazable: **9 necesidades TI**, **11 historias de usuario**,
**15 requerimientos funcionales**, **11 no funcionales**, **16 casos de uso** y **12 reglas de negocio**,
más una metodología seleccionada y un análisis de seguridad. La Unidad 2 debe **transformar ese
diagnóstico en un diseño implementable**: planificar el trabajo, definir la arquitectura y el modelo de
datos, prototipar la interfaz, establecer los controles de seguridad y planificar las pruebas.

El problema que motiva el diseño sigue siendo el de ES1: los datos que el AquaBrain ya genera
—del **firmware real ESP32-S3** con sensores **AHT10** (temperatura y humedad) y **HC-SR04** (distancia,
usada como nivel)— solo son visibles en el **display OLED local** o en una **app Android aislada**. No
existe una fuente única de verdad, ni estado actual accesible, ni alertas oportunas, ni control de
acceso.

## 1.2. Objetivo general y objetivos específicos

**Objetivo general.** Diseñar una solución de software implementable y trazable hacia el diagnóstico de
ES1 que permita centralizar, visualizar y explotar la información del cultivo, generando alertas ante
valores fuera de rango y controlando el acceso por roles.

**Objetivos específicos.**

1. Planificar el proyecto con una metodología justificada, cronograma por iteraciones, responsables,
   entregables y dependencias.
2. Definir la arquitectura del sistema mediante el paradigma **4+1** (escenarios, lógica, procesos,
   desarrollo y física).
3. Especificar el **stack tecnológico** y la **infraestructura**, justificando cada tecnología por la
   necesidad que atiende.
4. Diseñar **prototipos** de los procesos principales con consistencia visual y adaptabilidad.
5. Definir el **modelo de datos** con entidades, claves, cardinalidades e integridad, decidiendo qué
   datos van a una base estructurada y cuáles a almacenamiento no relacional.
6. Establecer políticas de **autenticación y autorización**, identificar amenazas y fijar estándares de
   codificación segura.
7. Planificar las **pruebas** unitarias, de integración y de rendimiento, vinculadas a los requisitos.

## 1.3. Alcance de la entrega

**En alcance (ES2 — diseño):**

- Metodología, cronograma, dependencias y prioridades.
- Arquitectura 4+1 con sus cinco vistas.
- Stack e infraestructura (frontend, backend, base de datos, nube, repositorio y pruebas).
- Prototipos, guía visual y registro de retroalimentación.
- Modelo de datos (DER, modelo lógico, integridad, índices, SQL/NoSQL) y DDL de referencia.
- Seguridad (autenticación, autorización, amenazas, mitigaciones, codificación segura y ética).
- Plan de pruebas y matriz de trazabilidad.

**Fuera de alcance de ES2 (se documenta, no se construye):**

| Elemento | Tratamiento | Referencia |
|---|---|---|
| Fabricación o reprogramación del **firmware** ESP32-S3 | Fuera del desafío; se asume como cliente | RA-01 |
| Cambios en la **app Android** existente | Se asume compatible "sin cambios"; supuesto a validar | SUP-10 |
| **IA / predicción** de variables | No exigido por el desafío | ES1 |
| **Licenciamiento** por cliente (HU09/RF15/CU-16) | *Won't por ahora*; se documenta su forma | SUP-09 |
| **Escalabilidad masiva** (NEC-09/RNF04) | Se documenta la estrategia (particionado, extracción de servicios) | Cap. 06 §6.6 |
| **Autonomía local** del dispositivo (RNF09) | Depende del firmware; la web tolera datos tardíos | Cap. 09 §9.2 |

## 1.4. Restricciones arquitectónicas de entrada

El diseño no parte de cero: hereda del diagnóstico un conjunto de **restricciones arquitectónicas**
(RA) que condicionan las decisiones.

| ID | Restricción | Origen | Implicancia de arquitectura |
|---|---|---|---|
| RA-01 | La API debe aceptar el formato del **firmware real ESP32-S3**, no solo del simulador | NEC-04, RF06, RN-11 | El contrato de ingesta se define desde el payload real (AHT10/HC-SR04) |
| RA-02 | La API debe ser **versionada y documentada** para no duplicar lógica entre clientes | NEC-05, RF13, RNF08 | `/api/v1` + OpenAPI como entregable; la app Android es cliente de primera clase |
| RA-03 | La API debe **aceptar timestamps pasados** y **rechazar futuros** | RN-09, RN-10, HU08, HU10 | Validación de tiempo explícita antes de persistir |
| RA-04 | El dashboard no debe contradecir el **display OLED local** | RNF05, RN-12 | Una sola fuente de verdad; semántica visual alineada |
| RA-05 | La ingesta no debe bloquearse por la evaluación de alertas ni por el guardado del payload crudo | RF06, RF11 | Ingesta síncrona mínima + evaluación/almacenamiento crudo fuera de la ruta crítica |
| RA-06 | El histórico de mediciones es inmutable y crece de forma monotónica | RN-02, NEC-09 | Tabla *append-only* particionada |
| RA-07 | Despliegue reproducible en Docker/PaaS con variables de entorno | RNF07 | Contenedor sin estado + configuración por entorno |
| RA-08 | El sistema debe degradar de forma controlada y avisar del estado de conexión | RNF02, RF14 | Fuente de verdad en PostgreSQL; componentes externos *best-effort* |

## 1.5. Decisiones clave de diseño

Cada decisión (D) declara su **alternativa descartada**, la **justificación** y los **requisitos** que
la sustentan. Esto responde al criterio de la rúbrica de que toda decisión esté fundada en el problema
y no en una preferencia tecnológica.

| # | Decisión | Alternativa descartada | Justificación | Requisitos |
|---|---|---|---|---|
| D-01 | Metodología **Scrum con sprints de 2 semanas** | Scrumban / Kanban | Mayor puntaje (27 vs 25 vs 22) y hitos de revisión obligatorios | ES1 cap. 05 |
| D-02 | Arquitectura **cliente-servidor en capas** con módulos de dominio (**monolito modular**) | Microservicios | Dominio cohesivo; microservicios agregan costo operativo sin beneficio medible | RNF06 |
| D-03 | **Monorepo** con `apps/api`, `apps/web`, `apps/simulator`, `packages/shared` | Repositorios separados | Equipo de 3 integrantes, tipos/DTO compartidos, CI única | RNF06 |
| D-04 | Backend **NestJS + TypeScript + Prisma** | Express puro / Django / Spring Boot | Módulos, guardias declarativas para RBAC, validación por DTO y Swagger integrado | RF01, RF13, RNF01 |
| D-05 | Frontend **React + Vite + TypeScript + Tailwind** con TanStack Query y Recharts | Angular / Vue | Curva de aprendizaje y gráficos de series temporales | RF07, RF08, RNF05 |
| D-06 | **Hash de contraseñas con bcrypt (cost 12)** | Argon2id | Es el algoritmo comprometido en ES1; Argon2id queda como evolución futura | RNF01, HU05 CA3 |
| D-07 | Persistencia **híbrida**: PostgreSQL (dominio) + MongoDB (payload crudo) | Solo SQL / solo NoSQL | El dominio exige integridad referencial; el payload del firmware varía con la versión | RF03–RF11, RNF04 |
| D-08 | **Mediciones en tabla particionada** por rango de fecha con índice `(sensor_id, timestamp DESC)` | Tabla plana | La consulta de históricos es la dominante y crece de forma monotónica | RF08, RNF03 |
| D-09 | Autenticación **JWT de acceso corto + refresh rotativo en cookie HttpOnly** con RBAC | Sesión en servidor | API *stateless* para los tres clientes y control fino por rol | RF01, RNF01 |
| D-10 | Ingesta autenticada por **API key por dispositivo** (hash en BD) | OAuth para dispositivos | El ESP32-S3 no ejecuta flujos interactivos; la clave es revocable e individual | RF06, RNF01 |
| D-11 | **Validación de tiempo explícita**: rechazo de futuro (> 5 min) y aceptación de pasado | Solo validar tipos | Es criterio de aceptación literal de HU08 y HU10 | RN-09, RN-10 |
| D-12 | Alertas evaluadas **en la misma transacción de ingesta**, con *cooldown* y notificación asíncrona | Barrido periódico | Detección oportuna y sin recorrer la tabla completa | RF11, RNF03 |
| D-13 | **Contrato API como entregable de primer nivel**: OpenAPI 3 versionado en `/api/v1` | Documentar "cuando se pueda" | HU11 lo exige con 4 criterios; protege la inversión del cliente | RF13, RNF08 |
| D-14 | **Idempotencia por `id_externo`** y buffer *store-and-forward* | Descarte de datos sin red | HU10 exige reintentos al reconectar sin duplicar | RF06, RF14, RN-10 |
| D-15 | **Vista optimizada de "última medición"** + caché de 30 s para el dashboard | Consultar la tabla completa | RNF03 exige dashboard < 2 s | RF07, RNF03 |

> El registro completo de decisiones, en formato ADR (Architecture Decision Record), se presenta en el
> **Anexo D**. La decisión D-08 se apoya en el criterio de modelado **MC-07** y la D-15 en la
> desnormalización **DN-05** (cap. 06).

## 1.6. Supuestos abiertos: decisiones que dependen de la contraparte

El diseño **no se bloquea** por la falta de confirmación: adopta una decisión provisoria y la registra
como supuesto a validar. Los diez supuestos (SUP-01…SUP-10) se administran en el capítulo 10; los más
influyentes sobre la arquitectura son:

| Tema | Decisión provisoria | Supuesto |
|---|---|---|
| Licenciamiento por cliente/instalación | Fuera de alcance (*Won't*): sin modelo ni endpoints | SUP-09 |
| Contrato exacto que consume hoy la app Android | Se asume `/api/v1` con JSON plano; se valida con la app de prueba | SUP-10 |
| Variables definitivas del prototipo | Real: temperatura, humedad, distancia/nivel. Simuladas: pH y caudal | SUP-01 |
| Relación sistema ↔ cultivo ↔ planta ↔ dispositivo ↔ sensor | Un dispositivo a un sistema; un sensor a un dispositivo; un cultivo con N sensores | SUP-05 |

## 1.7. Estructura del informe

El capítulo **02** presenta la metodología y el cronograma; el **03** desarrolla la arquitectura 4+1; el
**04** justifica el stack y la infraestructura; el **05** contiene los prototipos y la guía visual; el
**06** el modelo de datos; el **07** la seguridad; el **08** el plan de pruebas; el **09** la matriz de
trazabilidad; y el **10** la retroalimentación y los supuestos. Cierran el **11** (conclusiones), **12**
(bibliografía) y **13** (anexos).
