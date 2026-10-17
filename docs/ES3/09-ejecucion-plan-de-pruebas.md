# 9. Ejecución del Plan de Pruebas

## 9.1 Resumen de la ejecución

| Tipo | Suites | Casos | Resultado | Herramienta |
|---|---:|---:|---|---|
| Unitarias | 8 | **50** | ✅ 50 en verde | Jest |
| Integración (e2e) | 9 | **75** | ✅ 75 en verde | Jest + Supertest |
| **Total automatizado** | **17** | **125** | **✅ 125 en verde** | — |
| Rendimiento | — | 3 endpoints + 1 escritura | ✅ metas cumplidas | Script HTTP propio |
| Interfaz | — | 4 pantallas + 2 acciones | ✅ verificado en navegador | Navegador automatizado |

La cobertura se mide sobre la **suite completa** (unitarias + integración), que es la que ejercita el código de producción de extremo a extremo.

## 9.2 Pruebas unitarias (8 suites / 50 casos)

| Suite | Casos | Qué verifica |
|---|---:|---|
| `all-exceptions.filter.spec.ts` | 10 | Normalización de errores y derivación de códigos por estado (401/403/404/409/413/422/429/5xx) |
| `reglas.engine.spec.ts` | 11 | Operadores del motor de reglas y evaluación por alcance |
| `permisos.guard.spec.ts` | 7 | Autorización y auditoría de la denegación |
| `frescura.spec.ts` | 6 | Derivación del estado de dispositivo (RN-05) |
| `env.validation.spec.ts` | 5 | Validación de variables de entorno al arranque |
| `validation.pipe.spec.ts` | 5 | Pipe de validación (whitelist) |
| `auditoria.interceptor.spec.ts` | 3 | Registro de operaciones |
| `tiempo.spec.ts` | 3 | Utilidades de tiempo (tolerancia de `timestamp`) |

## 9.3 Pruebas de integración (9 suites / 75 casos)

Todas las suites de integración levantan la aplicación con la **misma configuración que `main.ts`** (endurecimiento HTTP, prefijo, pipe y OpenAPI) y utilizan un **tenant propio por suite** (sistema + dispositivo + sensores) que se elimina al terminar, de modo que ninguna prueba depende del estado dejado por otra.

| Suite | Casos | Cobertura funcional |
|---|---:|---|
| `gestion.e2e-spec.ts` | 16 | CRUD de sistemas, cultivos, usuarios, reglas y catálogos; reglas de negocio (409/404/400/422, hash bcrypt, autocuenta 403, autorrol 403) |
| `rbac.e2e-spec.ts` | 11 | Matriz de permisos por rol (401/403) |
| `mediciones.e2e-spec.ts` | 12 | Ingesta individual y por lote (207), idempotencia (entre lotes y dentro de un lote), calidad SOSPECHOSA, validaciones y alertas del lote |
| `alertas.e2e-spec.ts` | 9 | Listado, filtros, resumen y resolución |
| `auth.e2e-spec.ts` | 8 | Login, refresco, revocación, bloqueo por intentos, token inválido |
| `salud.e2e-spec.ts` | 7 | Sonda de salud y arranque |
| `historicos.e2e-spec.ts` | 6 | Series, exportación CSV (BOM, `;`), límites de rango (TS-28/38/39) |
| `contrato.e2e-spec.ts` | 5 | **Contrato OpenAPI ↔ `@aquabrain/shared` (TS-42)** |
| `limites.e2e-spec.ts` | 1 | Control de tasa: 429 `DEMASIADAS_SOLICITUDES` (TS-13) |

## 9.4 Cobertura de código (TS-44)

Combinando unitarias e integración sobre 41 archivos de producción:

| Métrica | Cobertura | Umbral | ¿Cumple? |
|---|---:|---:|---|
| Líneas | **92,26 %** | 70 % | ✅ |
| Sentencias | **91,09 %** | 70 % | ✅ |
| Funciones | **89,49 %** | 60 % | ✅ |
| Ramas | **69,01 %** | 60 % | ✅ |

El informe se genera con `npm run test:cov`, que ejecuta ambas suites, fusiona los resultados y **falla si no se alcanza el umbral** (`scripts/coverage-combinado.js`). El artefacto combinado (texto, `lcov`, HTML y `json-summary`) queda en `apps/api/coverage/combinado`.

## 9.5 Pruebas de rendimiento (TS-43)

**Meta:** panel < 2 s; históricos de un mes < 5 s con 50 000 registros. **Volumen real de la tabla:** 52 230 filas.

Medición sobre 25 repeticiones por endpoint (milisegundos):

| Endpoint | mín | p50 | p95 | máx | Cumple |
|---|---:|---:|---:|---:|---|
| `GET /dashboard/estado` | 88,4 | **104,1** | 225,9 | 328,8 | ✅ (< 2000 ms) |
| `GET /mediciones/serie` (1 mes, 723 puntos, 77 KB) | 231,5 | **573,7** | 633,8 | 730,4 | ✅ (< 5000 ms) |
| `GET /alertas?porPagina=20` | 59,2 | **64,8** | 86,2 | 91,8 | ✅ |

La consulta de series agregada por hora a nivel de base de datos toma **≈2,2 ms** (`EXPLAIN ANALYZE`, sección 6). En el camino de escritura, un lote completo de **500 mediciones** por `POST /mediciones/bulk` (500 aceptadas, 0 rechazadas) tardó inicialmente **16,4 s**; tras implementar la recomendación **R-01** (inserción masiva `createManyAndReturn` y evaluación de reglas en un paso por lote) el mismo lote baja a **1 403 ms** de mediana (tres corridas: 1 697 / 1 403 / 1 275 ms), es decir **≈12× más rápido**. El hallazgo H-04 queda resuelto (secciones 11 y 12).

## 9.6 Pruebas funcionales del simulador

Ejecutadas contra la API en vivo (detalle en la sección 5): modo `online` (10 aceptadas, 1 alerta MEDIA), modo `offline` (8 almacenadas, sincronizadas y **reenvío con 8 duplicadas** que demuestra la idempotencia) y modo `anomalia` (2 valores fuera de rango marcados como SOSPECHOSA y 1 alerta ALTA).

## 9.7 Pruebas de interfaz

El dashboard se recorrió en un navegador real contra la API (detalle en la sección 4): acceso, panel en vivo, históricos con gráfico, bandeja de alertas, **resolución de una alerta** (3 → 2 activas) y **descarga del CSV** (BOM UTF-8, separador `;`, 136 filas).

## 9.8 Deuda de pruebas declarada

- **No** se ejecutaron pruebas de carga con **k6** ni análisis de seguridad con **OWASP ZAP** (previstos en el borrador); el rendimiento se midió con un script HTTP propio y la seguridad con las pruebas automatizadas descritas.
- **No** hay pruebas de interfaz automatizadas en el repositorio (el recorrido del navegador fue una verificación puntual, no una suite versionada).
- La cobertura de **ramas** (69,01 %) es la métrica más baja: cumple el umbral del 60 %, pero revela rutas de error poco ejercitadas (sección 12).
