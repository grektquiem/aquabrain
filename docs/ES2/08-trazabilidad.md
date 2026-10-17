# ES2 · 08 — Matriz de trazabilidad

La trazabilidad es el criterio de calidad transversal del desafío: **cada necesidad debe poder seguirse hasta la
evidencia de prueba, y ninguna prueba debe quedar huérfana de una necesidad**. Este documento se mantiene vivo
durante todo el semestre y usa exclusivamente el idset corregido de ES1
(`NEC-01…NEC-09`, `HU01…HU11`, `RF01…RF15`, `RNF01…RNF11`, `CU-01…CU-16`, `RN-01…RN-12`, `TS-01…TS-44`).

---

## 1. Trazabilidad principal: necesidad → historia → requisito → caso de uso → diseño → implementación → prueba

| NEC | HU | RF/RNF | CU | Diseño (arquitectura / modelo / interfaz) | Implementación (plan ES3) | Prueba |
|---|---|---|---|---|---|---|
| NEC-07 | HU05 | RF01, RF02, RNF01 | CU-01, CU-02 | Arquitectura §4.4 · Modelo §3.1 (`usuario`, `rol`, `refresh_token`) · Seguridad §2.1 y §3 · Wireframe W-01 | `apps/api/src/modules/auth`, `usuarios`, `rbac` · `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/usuarios` · `apps/web/src/pages/Login`, `/usuarios` | TS-12, TS-13, TS-14, TS-15, TS-16, TS-18, TS-19, TS-35 |
| NEC-01 | HU06 | RF03, RF04, RF05 | CU-03, CU-04, CU-05 | Modelo §3.2 (`sistema`, `cultivo`, `planta`) y §3.3 (`dispositivo`, `sensor`, `tipo_variable`) · Wireframe W-06 | `modules/sistemas`, `modules/dispositivos` · `/api/v1/sistemas`, `/dispositivos`, `/sensores` · páginas `/sistemas`, `/dispositivos/:id` | TS-07, TS-21, TS-26, TS-28, TS-35 |
| NEC-02 | HU01 | RF07 | CU-08 | Arquitectura §4.2 (secuencia de dashboard) · Modelo §5 (I-12, `mv_ultima_medicion`) · Wireframe W-02 | `modules/consultas` · `GET /api/v1/dashboard/estado` · página `/dashboard` | TS-08, TS-37, TS-43 |
| NEC-03 | HU03 | RF11, RF12 | CU-07, CU-12 | Arquitectura §3.2 (motor de reglas) y §4.1 · Modelo §3.4 (`regla_alerta`, `alerta`) · Wireframe W-04 | `modules/alertas` (evaluador invocado en la ingesta) · `/alertas`, `/alertas/{id}/resolver` · página `/alertas` | TS-01, TS-02, TS-03, TS-27, TS-35 |
| NEC-03 | HU07 | RF10 | CU-11 | Modelo §3.4 (`regla_alerta`, XOR y precedencia, `Regla.probar()`) · Seguridad §3.4 · Wireframe W-06 | `modules/alertas` (reglas) · `POST/PATCH/DELETE /api/v1/reglas`, `/reglas/probar` · página `/reglas` | TS-04, TS-05, TS-06, TS-27 |
| NEC-04 | HU08 | RF06, RN-11 | CU-06 | Arquitectura §4.1 (secuencia de ingesta) · Modelo §3.4 (`medicion`) y §7 (payload crudo) · Seguridad §2.2 | `modules/mediciones` · `POST /api/v1/mediciones`, `/mediciones/bulk` · `apps/simulator` | TS-07, TS-10, TS-22, TS-25, TS-26, TS-30, TS-34, TS-36 |
| NEC-05 | HU11 | RF13, RNF08 | CU-15 | Stack §1 (OpenAPI) · Arquitectura §4.7 (publicación del contrato) | `@nestjs/swagger` en `/api/docs` · validación contra la app Android de prueba | TS-42 |
| NEC-06 | HU10 | RF06, RF14 | CU-13, CU-14 | Arquitectura §4.5 y §4.6 (sincronización y silencio) · Modelo §3.4 (índice único parcial, `id_externo`) · Wireframe W-05 | `modules/mediciones` (idempotencia) + `modules/dispositivos` (estado) + job programado · `apps/simulator` (buffer) | TS-09, TS-11, TS-36, TS-40, TS-41 |
| NEC-08 | HU02 | RF08, RNF03 | CU-09 | Arquitectura §4.3 (histórico y exportación) · Modelo §8.3 (agregación) · Wireframe W-03 | `modules/consultas` · `GET /api/v1/mediciones/serie` y `?formato=csv` · página `/historicos` | TS-38, TS-43 |
| NEC-08 | HU04 | RF09 | CU-10 | Arquitectura §4.3 · Wireframe W-03 (comparación) | `modules/consultas` · `GET /api/v1/mediciones/serie?sistemas[]` · página `/historicos` (modo comparación) | TS-39 |
| NEC-09 | — (transversal) | RNF04, RNF06 | — | Modelo §6 (particionado) y §8 (normalización) · Arquitectura §3 y §6.3 | Índices, particionado mensual, monorepo y documentación | Revisión del modelo + TS-24, TS-43, TS-44 |
| — (contrato) | — (transversal) | RNF01, RNF11 | — | Seguridad §2–§6 · Modelo §3.1 (`auditoria`) | Guards, interceptor de auditoría, validación compartida | TS-12…TS-21, TS-27, TS-29, TS-31, TS-33 |
| — (Won't) | HU09 | RF15 | CU-16 | Modelo §10 (forma de licencia, fuera de alcance) · supuesto `SUP-09` | **No implementado** (decisión *Won't por ahora*) | — (postergado) |

### 1.1. Historias sin requisito funcional nuevo (cobertura de criterios)

| HU | Cubierta por | Pruebas de sus criterios de aceptación |
|---|---|---|
| HU01 | RF07 | TS-37 (CA①, CA②, CA④), TS-08 (CA③) |
| HU02 | RF08 | TS-38 (CA①, CA②, CA③) |
| HU03 | RF11, RF12 | TS-01/TS-02 (CA①), TS-35 (CA②, CA③, CA④) |
| HU04 | RF09 | TS-39 (CA①, CA②, CA③) |
| HU05 | RF01, RF02 | TS-12 (CA③), TS-19 (CA④), TS-35 (CA①, CA②) |
| HU06 | RF03, RF04, RF05 | TS-07, TS-21, TS-35 (CA①, CA②, CA③) |
| HU07 | RF10 | TS-06 (CA③), TS-04 (CA②) |
| HU08 | RF06 | TS-10 (CA③), TS-22 (CA④), TS-07 (CA②) |
| HU09 | RF15 (Won't) | — (postergado, `SUP-09`) |
| HU10 | RF06, RF14 | TS-11 (CA①), TS-41 (CA②, CA③, CA④) |
| HU11 | RF13 | TS-42 (CA①, CA②, CA③, CA④) |

---

## 2. Trazabilidad de necesidades no funcionales (RNF)

| RNF | Decisión de diseño que lo sostiene | Verificación |
|---|---|---|
| RNF01 (seguridad) | bcrypt, JWT corto + refresh rotativo, RBAC, API key de dispositivo, TLS, helmet, límites de tasa, validación de entrada (`06-seguridad.md` §2–§4) | TS-12…TS-16, TS-20, TS-21, TS-23, TS-25, TS-26, TS-29, TS-31, TS-33 |
| RNF02 (disponibilidad 99 % · 8:00–20:00) | PostgreSQL como fuente de verdad + Mongo *best-effort*, *health check*, respaldos, degradación controlada (§6.3 de arquitectura) | TS-32, TS-34, TS-44 |
| RNF03 (rendimiento: dashboard < 2 s; históricos 1 mes < 5 s / 50.000 registros) | Caché Redis TTL 30 s, agregación en BD, paginación por cursor, índices I-01/I-12, vista de última medición | TS-43 |
| RNF04 (escalabilidad — Won't, se documenta) | Particionado mensual, índices, normalización, contenedor sin estado; estrategias futuras documentadas | Revisión del modelo (§6, §8) |
| RNF05 (usabilidad + consistencia con el OLED) | Guía visual y tokens, componentes con estados, responsive 360–1920, WCAG 2.1 AA, semántica alineada con el display local (`04-wireframes…` §3) | Checklist manual + TS-37 + revisión en Sprint Review |
| RNF06 (mantenibilidad) | Monorepo, TypeScript estricto, lint, Jest, CI con builds obligatorios, documentación | Pipeline + cobertura ≥ 70 % (TS-44) |
| RNF07 (portabilidad) | Docker Compose + variables de entorno + migraciones + seed + README | Prueba de levantamiento desde cero (< 30 min) |
| RNF08 (interoperabilidad con firmware, app Android y dashboard) | API REST versionada `/api/v1` con OpenAPI 3 publicado; contrato validado contra la app de prueba | TS-42 |
| RNF09 (autonomía local — Won't, depende del firmware) | Se documenta la estrategia *store-and-forward*; la web tolera datos tardíos (origen OFFLINE) | TS-41 (parte web) |
| RNF10 (cobertura ≥ 70 % + integración y carga) | Jest + Supertest + k6 en CI; umbral de cobertura como criterio de salida | TS-44 |
| RNF11 (privacidad y cumplimiento ético) | Tabla `auditoria`, minimización, retención, logs sin datos sensibles, referencias a Ley 19.628/21.719 (`06-seguridad.md` §7) | TS-27, TS-29 + revisión de política de datos |

---

## 3. Trazabilidad de casos de uso

| CU | Nombre | Escenario 4+1 relacionado | Pruebas |
|---|---|---|---|
| CU-01 | Iniciar / cerrar sesión | E-4 · Proceso 4 | TS-12, TS-13, TS-14, TS-35 |
| CU-02 | Gestionar usuarios y roles | — | TS-16, TS-18, TS-19 |
| CU-03 | Gestionar sistemas/instalaciones y cultivos | — | TS-21, TS-35 |
| CU-04 | Gestionar dispositivos | — | TS-26, TS-28, TS-35 |
| CU-05 | Gestionar sensores y tipos de variable | — | TS-07, TS-26 |
| CU-06 | Ingresar medición (individual o lote) | E-1 · Proceso 1 | TS-10, TS-11, TS-22, TS-30, TS-34, TS-36 |
| CU-07 | Evaluar regla y generar alerta | E-1 · Proceso 1 | TS-01, TS-02, TS-03 |
| CU-08 | Consultar estado actual (dashboard) | E-2 · Proceso 2 | TS-08, TS-37 |
| CU-09 | Consultar históricos y exportar | E-3 · Proceso 3 | TS-38 |
| CU-10 | Comparar sistemas en un mismo gráfico | E-3 · Proceso 3 | TS-39 |
| CU-11 | Configurar reglas de alerta y probarlas | — | TS-04, TS-05, TS-06 |
| CU-12 | Gestionar alertas (marcar resuelta) | — | TS-27, TS-35 |
| CU-13 | Monitorear estado de conexión y última comunicación | E-6 · Proceso 6 | TS-09, TS-40 |
| CU-14 | Sincronizar mediciones tras corte de red | E-5 · Proceso 5 | TS-11, TS-41 |
| CU-15 | Consultar documentación de la API | E-7 · Proceso 7 | TS-42 |
| CU-16 | Administrar licencias *(fuera de alcance)* | — | — (Won't) |

---

## 4. Matriz RF → prueba y RNF → prueba

### 4.1. Requisitos funcionales

| RF | Descripción breve | HU | MoSCoW | Pruebas |
|---|---|---|---|---|
| RF01 | Autenticación JWT y roles | HU05 | M | TS-13, TS-14, TS-15, TS-16, TS-35 |
| RF02 | CRUD de usuarios restringido a administrador | HU05 | M | TS-12, TS-18, TS-19 |
| RF03 | CRUD de sistemas/instalaciones | HU06 | M | TS-21, TS-35 |
| RF04 | Gestión de dispositivos por sistema | HU06 | M | TS-26, TS-28, TS-35 |
| RF05 | Gestión de sensores por dispositivo | HU06 | M | TS-07, TS-26 |
| RF06 | Registro de mediciones vía API (firmware real o simulador) | HU08 | M | TS-07, TS-10, TS-11, TS-22, TS-25, TS-26, TS-30, TS-34, TS-36 |
| RF07 | Dashboard con última medición por sensor/sistema | HU01 | M | TS-08, TS-37 |
| RF08 | Consulta de históricos con filtros y exportación | HU02 | S | TS-38 |
| RF09 | Comparativa gráfica multi-sistema | HU04 | C | TS-39 |
| RF10 | CRUD de reglas de alerta | HU07 | M | TS-04, TS-05, TS-06, TS-27 |
| RF11 | Motor de evaluación de alertas | HU03 | M | TS-01, TS-02, TS-03 |
| RF12 | Lista de alertas y marcar como resuelta | HU03 | M | TS-27, TS-35 |
| RF13 | Documentación API (OpenAPI/Swagger) versionada | HU11 | S | TS-42 |
| RF14 | Estado de conexión / última comunicación del dispositivo | HU10 | S | TS-09, TS-28, TS-40, TS-41 |
| RF15 | Gestión de suscripción y licenciamiento | HU09 | W | — (Won't, `SUP-09`) |

### 4.2. Requisitos no funcionales

| RNF | Descripción breve | MoSCoW | Pruebas |
|---|---|---|---|
| RNF01 | Seguridad (bcrypt, JWT, HTTPS, validación) | M | TS-12…TS-16, TS-20, TS-21, TS-23, TS-25, TS-26, TS-29, TS-31, TS-33 |
| RNF02 | Disponibilidad 99 % (8:00–20:00) | S | TS-32, TS-34, TS-44 |
| RNF03 | Rendimiento (dashboard < 2 s; históricos 1 mes < 5 s / 50.000) | S | TS-43 |
| RNF04 | Escalabilidad (Won't, se documenta) | W | Revisión de modelo (§6, §8) |
| RNF05 | Usabilidad y consistencia con el OLED | M | Checklist manual + TS-37 |
| RNF06 | Mantenibilidad | M | TS-24 + pipeline |
| RNF07 | Portabilidad | S | Prueba de entorno desde cero |
| RNF08 | Interoperabilidad (firmware, app Android, dashboard) | S | TS-42 |
| RNF09 | Autonomía local (Won't, depende del firmware) | W | TS-41 (parte web) |
| RNF10 | Cobertura ≥ 70 % + integración y carga | S | TS-44 |
| RNF11 | Privacidad y cumplimiento ético | M | TS-27, TS-29 |

---

## 5. Cobertura y análisis de huecos

### 5.1. Verificación de cobertura

| Comprobación | Resultado |
|---|---|
| ¿Toda necesidad (`NEC-01…NEC-09`) tiene al menos una historia de usuario? | ✅ (ver §1; NEC-09 se cubre como transversal con RNF04/RNF06) |
| ¿Toda HU tiene al menos un RF y un criterio de aceptación? | ✅ (`ES1/00-backlog-base.md` §4; HU09 → RF15, postergado) |
| ¿Todo RF tiene al menos una prueba asignada (salvo el Won't)? | ✅ (ver §4.1) |
| ¿Todo RNF tiene una decisión de diseño y una forma de verificación? | ✅ (§2) |
| ¿Todo CU tiene al menos una prueba (salvo CU-16 Won't)? | ✅ (§3) |
| ¿Existe alguna prueba sin necesidad asociada? | ✅ Ninguna: TS-17, TS-23, TS-24, TS-29, TS-31, TS-32, TS-33 se derivan de RNF01/RNF02/RNF06 y de `06-seguridad.md` |
| ¿Los idset viejos (`HU-01`, `RF-01`, `RNF-01`…) fueron eliminados? | ✅ Único idset vigente en todos los documentos |

### 5.2. Trazabilidad inversa: prueba → origen (ninguna prueba huérfana)

| TS | Origen (RF/RNF/CU/HU) |
|---|---|
| TS-01, TS-02, TS-03 | RF11 · CU-07 · NEC-03 |
| TS-04, TS-05, TS-06 | RF10 · CU-11 · HU07 · NEC-03 |
| TS-07 | RF05, RF06 · CU-05 · RNF01 |
| TS-08 | RF07 · RN-05 · CU-08 · HU01 |
| TS-09 | RF14 · RN-05 · CU-13 |
| TS-10 | RN-09 · HU08 CA③ · RF06 |
| TS-11 | RN-10 · HU10 CA① · RF06 |
| TS-12 | RNF01 · HU05 CA③ |
| TS-13, TS-14, TS-15, TS-16 | RF01 · RNF01 · CU-01 |
| TS-17 | RNF01 · seguridad §5.3 |
| TS-18, TS-19 | RN-06 · RF02 · HU05 CA④ |
| TS-20, TS-21, TS-23 | RNF01 |
| TS-22 | HU08 CA④ · RF06 |
| TS-24 | RNF06 |
| TS-25 | RN-02 · RF06 |
| TS-26, TS-28 | RF04, RF06, RF14 · RNF01 |
| TS-27 | RNF11 · RF10, RF12 |
| TS-29 | RNF01 · RSK-05 |
| TS-30, TS-31, TS-33 | RNF01 |
| TS-32, TS-34 | RNF02 · RA-05 |
| TS-35 | RF01…RF12 · flujo E-1/E-4 |
| TS-36 | RF06 · HU10 |
| TS-37 | RF07 · HU01 |
| TS-38 | RF08 · HU02 CA③ · RNF03 |
| TS-39 | RF09 · HU04 |
| TS-40 | RF14 · RN-05 · CU-13 |
| TS-41 | RF06, RF14 · RN-10 · CU-14 |
| TS-42 | RF13 · RNF08 · HU11 · CU-15 |
| TS-43 | RNF03 |
| TS-44 | RNF02, RNF10 |

### 5.3. Huecos detectados y su tratamiento

| # | Hueco | Tratamiento |
|---|---|---|
| H-01 | El desafío menciona variables sin unidad definida; el hardware real solo cubre temperatura, humedad y distancia | Real = AHT10/HC-SR04; pH y caudal se declaran `SIMULADO`. Supuesto `SUP-01` |
| H-02 | No se conoce el **tiempo de retención real** de los históricos | Se fija en 24 meses como supuesto `SUP-06`, parametrizable por política de particiones |
| H-03 | No se ha confirmado si el acceso debe restringirse **por sistema** | Simplificación documentada (`06-seguridad.md` §3.5) y supuesto `SUP-05`; extensión acotada |
| H-04 | La **notificación externa** (correo/SMS) no está exigida por el desafío | Se diseña la cola y se implementa como notificación en la interfaz; la extensión externa queda como `Could` |
| H-05 | No está claro si un sensor puede asociarse a **varios cultivos** | Se permite N:M (`cultivo_sensor`), lo más flexible; supuesto `SUP-04` |
| H-06 | El contrato que consume hoy la app Android no está disponible | Se asume `/api/v1` JSON validado con la app de prueba; supuesto `SUP-10` |
| H-07 | El licenciamiento no está respaldado por el desafío | HU09/RF15/CU-16 quedan *Won't por ahora*; supuesto `SUP-09` |

---

## 6. Uso de esta matriz

- **Antes de entregar:** verificar que no queden celdas vacías en §1 para los requisitos vigentes (Must/Should).
- **En cada PR:** actualizar la columna "Implementación (plan ES3)" con las rutas reales de código.
- **En cada cambio de alcance:** modificar primero `docs/ES1/00-backlog-base.md` y luego propagar aquí.
- **Regla de oro:** ninguna prueba se crea sin requisito origen (§5.2) y ningún requisito Must/Should queda sin prueba (§4).
