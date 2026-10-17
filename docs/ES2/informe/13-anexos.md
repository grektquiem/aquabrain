# 13 · Anexos

## Anexo A · Glosario

| Término | Definición |
|---|---|
| **API-first** | Enfoque en que la funcionalidad se expone mediante un contrato de API estable, versionado y documentado |
| **API key (de dispositivo)** | Credencial única y revocable que autentica a un dispositivo IoT; se almacena solo como *hash* |
| **AquaBrain** | Placa electrónica (ESP32-S3) que sensa variables del cultivo y las transmite a la capa digital |
| **AquaPlants** | Producto de cultivo hidropónico/aeropónico vertical que integra física, electrónica y software |
| **AHT10** | Sensor real de temperatura y humedad |
| **ADR** | *Architecture Decision Record*: registro de una decisión de diseño con su contexto y consecuencias |
| **bcrypt** | Función de *hash* de contraseñas con *salt* y factor de costo, deliberadamente lenta |
| **Cooldown** | Ventana de tiempo durante la cual no se genera una nueva alerta para la misma regla y sensor |
| **DER** | Diagrama Entidad-Relación (modelo conceptual de datos) |
| **HC-SR04** | Sensor real de distancia ultrasónica, usado como referencia de nivel |
| **Idempotencia** | Propiedad por la cual repetir una operación no produce un efecto adicional (evita mediciones duplicadas) |
| **JWT** | *JSON Web Token*: token firmado de vida corta usado como *access token* |
| **MoSCoW** | Técnica de priorización: Must / Should / Could / Won't |
| **Monolito modular** | Arquitectura de una sola unidad desplegable organizada en módulos de dominio cohesivos |
| **MVP** | Producto mínimo viable: conjunto de funcionalidades esenciales para que la solución sea útil |
| **RBAC** | *Role-Based Access Control*: control de acceso basado en roles y permisos |
| **Refresh token** | Token opaco de mayor duración que permite renovar el *access token*; se rota en cada uso |
| **RF / RNF** | Requerimiento funcional / no funcional |
| **Scrum** | Marco ágil de iteraciones (*sprints*) de duración fija con revisiones e incremento demostrable |
| **Store-and-forward** | Estrategia de almacenar datos localmente y reenviarlos al recuperar la conexión |
| **STRIDE** | Modelo de categorización de amenazas: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege |
| **Timestamp** | Marca temporal de una medición (hora de origen y hora de recepción) |
| **TS** | Caso de prueba (*test case*) |
| **WCAG 2.1 AA** | Nivel de conformidad de accesibilidad web del W3C |

## Anexo B · Convenciones de identificadores

| Prefijo | Significado | Formato | Cantidad |
|---|---|---|---|
| `NEC-xx` | Necesidad TI | `NEC-01` … `NEC-09` | 9 |
| `HUxx` | Historia de usuario | `HU01` … `HU11` | 11 |
| `RFxx` | Requerimiento funcional | `RF01` … `RF15` | 15 |
| `RNFxx` | Requerimiento no funcional | `RNF01` … `RNF11` | 11 |
| `CU-xx` | Caso de uso | `CU-01` … `CU-16` | 16 |
| `RN-xx` | Regla de negocio | `RN-01` … `RN-12` | 12 |
| `TS-xx` | Caso de prueba | `TS-01` … `TS-44` | 44 |
| `D-xx` | Decisión de diseño (ADR) | `D-01` … `D-15` | 15 |
| `RA-xx` | Restricción arquitectónica | `RA-01` … `RA-08` | 8 |
| `MC-xx` | Criterio de modelado | `MC-01` … `MC-09` | 9 |
| `EC-xx` | Estándar de codificación segura | `EC-01` … `EC-14` | 14 |
| `E-x` | Escenario arquitectónicamente significativo | `E-1` … `E-7` | 7 |
| `W-xx` | Wireframe | `W-01` … `W-06` | 6 |
| `DN-xx` | Desnormalización deliberada | `DN-01` … `DN-05` | 5 |
| `I-xx` | Índice de base de datos | `I-01` … `I-12` | 12 |
| `SUP-xx` | Supuesto abierto a validar | `SUP-01` … `SUP-10` | 10 |
| `FB-xx` | Observación de retroalimentación | `FB-01` … `FB-16` | 16 |
| `RSK-xx` | Riesgo de seguridad | `RSK-01` … `RSK-12` | 12 |
| `RT-xx` | Riesgo tecnológico | `RT-01` … `RT-06` | 6 |
| `RC-xx` | Riesgo de cronograma | `RC-01` … `RC-05` | 5 |
| `RP-xx` | Riesgo del plan de pruebas | `RP-01` … `RP-06` | 6 |

> Los identificadores **no llevan guion** entre las letras y el número (`HU01`, `RF07`, `RNF11`), salvo
> `NEC`, `CU`, `RN` y `TS`, que sí lo llevan. Esta convención única (corrección C-08 de ES1) se mantiene
> en todos los documentos del proyecto. El catálogo canónico es `docs/ES1/00-backlog-base.md`.

## Anexo C · Cobertura detallada de la rúbrica ES2

| Indicador | Evidencia concreta | Ubicación |
|---|---|---|
| 2.1.1.1 Actividades y fases con la metodología | Roles, ceremonias, artefactos, DoD y calendario con fechas exactas | Cap. 02 §2.1, §2.3 |
| 2.1.1.2 Dependencias y prioridades entre tareas | Matriz predecesor → sucesor, ruta crítica y priorización por valor/riesgo | Cap. 02 §2.4, §2.6 |
| 2.1.2.3 Puntos de vista 4+1 | Vistas de escenarios, lógica, procesos, desarrollo y física + componentes | Cap. 03 §3.3–§3.7 |
| 2.1.2.4 Tecnologías e infraestructura | Stack justificado, alternativas descartadas, topología y CI/CD | Cap. 04 §4.2–§4.5 |
| 2.1.3.5 Prototipos interactivos funcionales | Inventario de 11 pantallas, W-01…W-06 y flujo de extremo a extremo | Cap. 05 §5.1–§5.3 |
| 2.1.3.6 Consistencia visual y adaptabilidad | Tokens, componentes con estados, responsive 360–1920 y WCAG 2.1 AA | Cap. 05 §5.5–§5.7 |
| 2.1.3.7 Retroalimentación de usuarios | Metodología, iteraciones v1–v3 y cambios antes/después (FB-01…FB-16) | Cap. 10 §10.2–§10.4 |
| 2.1.4.8 Entidades y relaciones óptimas | DER, diccionario, claves, cardinalidades, integridad y DDL ejecutable | Cap. 06 §6.2–§6.4 |
| 2.1.4.9 Bases estructuradas y no estructuradas | Decisión SQL vs. NoSQL con ejemplos de consulta y criterio de migración | Cap. 06 §6.7 |
| 2.1.5.10 Autenticación y autorización | Políticas, matriz rol ↔ permiso y matriz CRUD | Cap. 07 §7.2–§7.3 |
| 2.1.5.11 Amenazas y mitigaciones | OWASP Top 10, STRIDE y riesgos RSK-01…RSK-12 priorizados | Cap. 07 §7.5 |
| 2.1.5.12 Estándares de codificación segura | Reglas EC-01…EC-14, checklist de PR y verificación en CI | Cap. 07 §7.6 |
| 2.1.6.13 Pruebas vinculadas a requisitos | Pirámide, catálogo TS-01…TS-44 y umbrales de rendimiento | Cap. 08 §8.3, §8.5, §8.6 |
| 2.1.6.14 Herramientas automatizadas y manuales | Balance ~70/30 y matriz herramienta–tipo de prueba | Cap. 08 §8.7 |
| 2.1.6.15 Responde preguntas del diseño | Matriz de trazabilidad, conclusiones, banco de defensa y este anexo | Cap. 09, 11, Anexo G |

## Anexo D · Registro de decisiones de diseño (ADR D-01…D-15)

Cada decisión declara **contexto → decisión → alternativas descartadas → consecuencias → requisitos**.

| # | Decisión | Alternativas descartadas | Consecuencia principal | Requisitos |
|---|---|---|---|---|
| D-01 | Scrum con sprints de 2 semanas | Scrumban / Kanban | Revisión e incremento obligatorios por sprint | ES1 cap. 05 |
| D-02 | Monolito modular en capas | Microservicios | Desarrollo rápido; `MedicionesModule` extraíble a futuro | RNF06 |
| D-03 | Monorepo (`api`, `web`, `simulator`, `shared`) | Repositorios separados | Tipos/DTO compartidos y CI única | RNF06 |
| D-04 | Backend NestJS + TypeScript + Prisma | Express / Django / Spring Boot | Guardias declarativas y Swagger integrado | RF01, RF13, RNF01 |
| D-05 | Frontend React + Vite + TypeScript + Tailwind | Angular / Vue | Curva de aprendizaje y gráficos de series | RF07, RF08, RNF05 |
| D-06 | Hash de contraseñas con bcrypt (*cost* 12) | Argon2id | Algoritmo comprometido en ES1; Argon2id queda como evolución | RNF01, HU05 CA③ |
| D-07 | Persistencia híbrida PostgreSQL + MongoDB | Solo SQL / solo NoSQL | Dominio relacional + *payload* crudo flexible | RF03–RF11, RNF04 |
| D-08 | Mediciones particionadas por rango de fecha | Tabla plana | Consulta dominante optimizada; crece monotónicamente | RF08, RNF03 |
| D-09 | JWT corto + refresh rotativo en cookie HttpOnly con RBAC | Sesión en servidor | API *stateless* y control fino por rol | RF01, RNF01 |
| D-10 | API key por dispositivo (hash en BD) | OAuth para dispositivos | El ESP32-S3 no ejecuta flujos interactivos | RF06, RNF01 |
| D-11 | Validación de tiempo explícita (rechazo de futuro, aceptación de pasado) | Solo validar tipos | Cumple criterios de HU08 y HU10 | RN-09, RN-10 |
| D-12 | Alertas evaluadas en la transacción de ingesta, con cooldown y notificación asíncrona | Barrido periódico | Detección oportuna sin recorrer toda la tabla | RF11, RNF03 |
| D-13 | Contrato API OpenAPI 3 versionado como entregable | Documentar «cuando se pueda» | HU11 con cuatro criterios; protege la inversión del cliente | RF13, RNF08 |
| D-14 | Idempotencia por `id_externo` + *store-and-forward* | Descarte de datos sin red | Reintentos al reconectar sin duplicar | RF06, RF14, RN-10 |
| D-15 | Estado actual de «última medición» + caché de 30 s | Consultar la tabla completa | Dashboard dentro del umbral de RNF03 | RF07, RNF03 |

## Anexo E · Supuestos abiertos (SUP-01…SUP-10)

| ID | Supuesto | Decisión provisoria | Estado |
|---|---|---|---|
| SUP-01 | Variables y sensores priorizados | Real: temperatura, humedad, distancia/nivel. Simuladas: pH y caudal | ⏳ Validar |
| SUP-02 | Frecuencia de envío de mediciones | 5 minutos por sensor | ⏳ Validar |
| SUP-03 | Rangos y umbrales que originan alerta | Valores de referencia precargados y editables | ⏳ Validar |
| SUP-04 | Qué se muestra primero en el dashboard | Última medición por sensor + frescura + alertas activas | ⏳ Validar |
| SUP-05 | Relación sistema ↔ cultivo ↔ planta ↔ dispositivo ↔ sensor | Un dispositivo a un sistema; un sensor a un dispositivo; un cultivo con N sensores | ⏳ Validar |
| SUP-06 | Retención de históricos | 24 meses en PostgreSQL; agregados indefinidos | ⏳ Validar |
| SUP-07 | Comportamiento ante dispositivo que deja de reportar | A 3× el intervalo: `SIN_COMUNICACION` + alerta de severidad alta | ⏳ Validar |
| SUP-08 | Qué es dato real y qué permanece simulado | Real: AHT10/HC-SR04. Simulado y rotulado: pH y caudal | ⏳ Validar |
| SUP-09 | Licenciamiento (HU09/RF15/CU-16) | Fuera de alcance (*Won't por ahora*); se documenta su forma | ⏳ Validar |
| SUP-10 | Compatibilidad con la app Android existente | Se asume `/api/v1` JSON plano; se valida con la app de prueba | ⏳ Validar |

El detalle y el procedimiento de cierre se encuentran en el capítulo 10 §10.1.

## Anexo F · Riesgos consolidados

| Familia | Cantidad | Dónde se detalla |
|---|---|---|
| Riesgos de **cronograma** (`RC-01…RC-05`) | 5 | Cap. 02 §2.4.2 |
| Riesgos **tecnológicos** (`RT-01…RT-06`) | 6 | Cap. 04 §4.6 |
| Riesgos de **seguridad** (`RSK-01…RSK-12`) | 12 | Cap. 07 §7.5.3 |
| Riesgos del **plan de pruebas** (`RP-01…RP-06`) | 6 | Cap. 08 §8.10 |

## Anexo G · Banco de preguntas para la defensa

El *feedback* de la corrección docente recomendó preparar un **banco de preguntas y respuestas** que
cubra el indicador **2.1.6.15** («responde preguntas»). El banco completo está en
`docs/ES2/11-defensa-preguntas.md` y se resume así:

| Bloque | Preguntas que cubre |
|---|---|
| Metodología y planificación | Por qué Scrum; cómo se asignan responsables y entregables; cómo se prioriza; cuál es la ruta crítica |
| Arquitectura y decisiones | Por qué monolito modular; por qué una sola API; cómo se justifica el 4+1; cómo cubre los tres clientes |
| Datos | Por qué PostgreSQL y no NoSQL para todo; por qué MongoDB; cómo se resuelve el rendimiento; cómo se evita duplicar |
| Seguridad | Cómo se evita una medición falsa; cómo se protegen contraseñas y sesiones; OWASP y STRIDE; robo de API key |
| Pruebas y calidad | Cómo se prueba el rendimiento; cómo se alcanza el 70 % de cobertura; qué se automatiza; cómo se trazabiliza |
| Operación y continuidad | Cómo se garantiza el 99 %; qué pasa si cae la red; cómo escala; por qué *polling* y no WebSocket |
| Preguntas difíciles y de alcance | Qué quedó fuera y por qué; por qué pH/caudal simulados; el sistema no reemplaza la app Android; qué harían distinto |

**Recomendaciones para la defensa:** (1) acompañar cada respuesta con una **evidencia visual** (DER,
casos de uso, secuencia, componentes o despliegue); (2) mencionar el **identificador** (RF/RNF/RN/D/TS)
para mostrar trazabilidad viva; (3) distinguir con naturalidad lo que es **diseño** (ES2) de lo que se
**implementa** (ES3), sin afirmar resultados no ejecutados; y (4) cerrar con la **matriz de trazabilidad**
y la priorización por valor/riesgo.

## Anexo H · Sobre este informe

- **Naturaleza:** presentación **académica** del diseño ES2. No redefine identificadores; el catálogo
  canónico es `docs/ES1/00-backlog-base.md`.
- **Cómo se generó:** a partir de los documentos técnicos de diseño (`docs/ES2/00-…` a `11-…`) y del
  esquema físico (`docs/ES2/aquaplants_schema.sql`), respetando la regla de **no inventar cifras ni
  contenido**.
- **Qué no cubre:** la implementación y las pruebas ejecutadas (ES3) y el cierre (ES4). Las referencias
  a esos artefactos en la matriz de trazabilidad son *forward references* que demuestran la coherencia de
  la cadena.
- **Declaración de honestidad:** este documento describe un **diseño**, no software ya construido. Las
  funcionalidades, métricas y resultados se materializan y se demuestran en ES3 y ES4, con evidencia de
  ejecución. Toda la documentación se traza contra el **catálogo canónico corregido** de ES1.
- **Mantenimiento:** si cambia un identificador o una prioridad, se actualiza primero el catálogo
  canónico y luego se propaga a los demás documentos, incluida la matriz de trazabilidad (cap. 09).
