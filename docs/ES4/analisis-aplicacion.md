# Análisis de la aplicación AquaBrain

## 1. Resumen ejecutivo

AquaBrain es una plataforma web para **monitoreo y gestión de cultivos aeropónicos** (AquaPlants). Centraliza mediciones de sensores (temperatura, humedad, pH, distancia/nivel, caudal), evalúa reglas de alerta, controla acceso por roles y permite consultar estado actual e histórico.

**Resultado:** La aplicación **está funcional, coherente con el diseño y probada**. Cumple la mayoría del producto mínimo (7 de 8 ítems). La única brecha declarada relevante es el **despliegue cloud**.

## 2. Fortalezas

| Fortaleza | Evidencia | Comentario |
|---|---|---|
| **Arquitectura clara y modular** | `apps/api/src/modules/*`, monorepo Turborepo | Separación por dominio (auth, usuarios, sistemas, cultivos, dispositivos, sensores, mediciones, reglas, alertas, dashboard, auditoría). Alta mantenibilidad. |
| **Fuente única de verdad** | `packages/shared` (Zod) | Contratos compartidos entre API, web y simulador. Reduce deriva entre capas. |
| **Ingesta robusta (offline + bulk + idempotencia)** | `mediciones.controller.ts`, `mediciones.service.ts`, simulador modo `offline` | Soporta cortes de conectividad: buffer local + `POST /mediciones/bulk` con `idExterno` e índice único para evitar duplicados. |
| **Motor de reglas correcto** | `apps/api/src/modules/reglas/reglas.engine.ts` | Evalúa reglas activas al recibir medición. Prioriza reglas del **sensor** sobre reglas del **tipo de variable**. Genera alertas con severidad. |
| **Detección de silencio** | `apps/api/src/modules/dashboard/frescura.ts` | Cálculo en vivo: `SIN_COMUNICACION` si `segundosSinReportar > ALERT_SILENCE_FACTOR × intervalo`. No crea alerta innecesaria, solo marca estado. |
| **Seguridad bien aplicada** | JWT (access+refresh), RBAC (21 permisos/3 roles), bcrypt, validación Zod, CORS, guards | Implementación sólida para el alcance académico. |
| **Calidad y trazabilidad** | 125 pruebas verdes, cobertura líneas 92,26%, OpenAPI en `/api/docs` | Buen nivel de automatización. Auditoría y trazabilidad presentes. |
| **Datos realistas y verificados** | `docs/ES4/evidencia/*`, verificación e2e | Flujo completo verificado: simulador online (15 aceptadas) → anomalía (2 alertas). Capturas muestran pie corregido (Unidad 4/ES4). |

## 3. Debilidades

| Debilidad | Impacto | Recomendación |
|---|---|---|
| **Despliegue cloud ausente** | Medio (cumplimiento del ítem 7) | Desplegar API+BD+web en Render/Railway/Vercel+Neon (documentado). |
| **Entidad `Evento` modelada pero no implementada** | Bajo | Registrar eventos de conectividad (`SIN_COMUNICACION`/`RECONEXION`) para mayor trazabilidad operativa (ya declarado como brecha D-15). |
| **Reintentos automáticos con backoff** | Bajo | Añadir reintentos con retroceso exponencial en cliente del simulador/API consumers (actualmente reenvío manual del lote + `retry:1` en frontend). |
| **Cobertura de ramas 69,01%** | Bajo | Ampliar pruebas de rutas de error/edge cases para elevar ramas > 75%. |
| **Vulnerabilidades de dependencias (npm audit)** | Bajo (mayoritario transitivo) | Planificar actualización de NestJS y dependencias con alertas high/critical. |
| **Sin suite E2E/UI automatizada** | Bajo | Añadir Playwright para cubrir flujos críticos (login, panel, históricos, alertas). |
| **Algunos ítems "propuestos" no ejecutados** | Bajo | Respaldos (`pg_dump`), uptime, Lighthouse, ZAP ya declarados como propuestas/futuras. |

## 4. Análisis técnico por capa

### Backend (NestJS/TypeScript)
- **Arquitectura modular** correcta (feature modules). Usa Guards/Interceptors/Exception filters.
- **Validación** centralizada con Zod vía `@aquabrain/shared`.
- **Prisma** bien usado: transacciones donde corresponde, índices, `select` controlados.
- **Motor de reglas** simple y eficaz (evaluación en línea). Adecuado al volumen del prototipo.
- **Idempotencia** bien resuelta con `MedicionIdempotencia` + `idExterno`.

### Frontend (Vite/TS)
- **UI clara** (Panel/Históricos/Alertas/Admin). Muestra frescura, severidad de alertas, export CSV.
- **TanStack Query** para fetching/cache. Manejo básico de auth con refresh.
- **Accesibilidad mínima** (role/aria en algunos elementos). Lighthouse no ejecutado.
- **Sin tests automatizados** (solo verificación manual/navegador). Área de mejora.

### Base de datos (PostgreSQL)
- **Esquema coherente** con dominio: 19 modelos/20 tablas. Incluye `Planta`, `EstadoSensorActual`, `MedicionIdempotencia`, `Auditoria`.
- **Índices** presentes (p. ej. `idx_medicion_sensor_ts`, `idx_alerta_estado`).
- **Append-only** para `medicion` (buena práctica para trazabilidad).
- **Diferencia con DDL entregado** justificada: usa UUIDs, enums nativos, entidades adicionales (`Evento` modelado), `RefreshToken`, idempotencia. (Ver análisis comparativo.)

### Simulador IoT
- **3 modos** útiles para demos/tests: online/offline/anomalia.
- **Valida contrato** antes de enviar (Zod). Acumula con `timestamp` original en offline.
- **Demuestra idempotencia** reenviando mismo lote.
- **No implementa backoff** (mejora menor).

## 5. Seguridad

| Aspecto | Estado | Comentario |
|---|---|---|
| **Autenticación** | ✅ | JWT access+refresh con rotación básica. |
| **Autorización RBAC** | ✅ | Guards por permisos/roles. |
| **Hashing** | ✅ | `bcrypt` para passwords; pepper/hash para device keys. |
| **Validación** | ✅ | Zod en todos los endpoints relevantes. |
| **CORS** | ✅ | Configurado por `CORS_ORIGINS`. |
| **SQL Injection** | ✅ | Prisma parametrizado. |
| **Secretos** | ✅ | No versionados (.env ignorado). |
| **Rate limiting** | ⚠️ | `@nestjs/throttler` en memoria (no distribuido). Suficiente para prototipo. |

## 6. Rendimiento (medido)

| Endpoint/operación | p50 | p95 | Meta | Estado |
|---|---|---|---|---|
| `GET /dashboard/estado` | 104,1 ms | 225,9 ms | < 2000 ms | ✅ |
| `GET /mediciones/serie` (1 mes) | 573,7 ms | 633,8 ms | < 5000 ms | ✅ |
| `GET /alertas` | 64,8 ms | 86,2 ms | — | ✅ |
| `POST /mediciones/bulk` (500) | 1403 ms | — | — | ✅ (12× mejora tras optimización R-01) |
| Consulta BD serie | ~2,2 ms | — | — | ✅ |

## 7. Pruebas y calidad

- **125 pruebas** (50 unit + 75 integración), 17 suites. Todas verdes.
- **Cobertura**: líneas 92,26%, sentencias 91,09%, funciones 89,49%, ramas 69,01%.
- **Umbrales** aplicados vía script combinado (`coverage-combinado.js`).
- **E2E manual** documentado y verificado (evidencia en `docs/ES4/evidencia/`).

## 8. Matriz MoSCoW (cumplimiento)

| Categoría | Cantidad | Estado |
|---|---|---|
| **Must** | 14 RF + 5 RNF (aprox) | ✅ Implementados con evidencia |
| **Should** | varios (RF08/RF09 parciales, RF13/RF14, RNF02/RNF03/RNF07/RNF08/RNF10) | 🟡 Parciales (algunos sin ejecutar: ZAP/Lighthouse/uptime/k6/app Android) |
| **Could** | RF09 (comparativa UI) | 🟡 Parcial |
| **Won't** | RF15, RNF04 (particionado), RNF09 | ✅ Declarados |

**Global catálogo (26):** 17 cumplidos con evidencia + 6 parciales + 3 fuera de alcance. Coherente con `docs/ES4/07-resultados-cuantificables.md`.

## 9. Recomendaciones priorizadas

| # | Recomendación | Prioridad | Esfuerzo | Beneficio |
|---|---|---|---|---|
| **1** | Despliegue cloud (Render/Railway + Neon) con HTTPS | **P1** | Medio | Cierra ítem 7 del producto mínimo y permite evaluación remota. |
| **2** | Implementar registro de `Evento` (conectividad) o declarar uso de Auditoría | **P1** | Bajo–Medio | Cierra brecha D-15 (ya declarada). |
| **3** | Añadir reintentos con backoff en simulador/cliente HTTP | **P2** | Bajo | Mayor robustez ante caídas transitorias. |
| **4** | Subir cobertura de ramas (tests de error paths) | **P2** | Bajo–Medio | Calidad + confianza. |
| **5** | Añadir E2E UI con Playwright | **P2** | Medio | Previene regresiones visuales/funcionales. |
| **6** | `npm audit fix` / actualización selectiva de dependencias transitivas | **P3** | Medio | Reduce alertas (principalmente transitivas). |

## 10. Veredicto final

**La aplicación AquaBrain está en buen estado y cumple con lo esencial.**

- **Funcionalidad:** Completa para el alcance (ingesta, reglas, alertas, dashboard, auth/RBAC).
- **Arquitectura:** Sólida, modular, con buena separación de responsabilidades.
- **Calidad:** Bien probada (125 tests, alta cobertura). Evidencia real verificada.
- **Consistencia:** Coherente entre docs, código, esquema Prisma y contrato OpenAPI.
- **Honestidad:** Brechas declaradas explícitamente (cloud, Evento, evidencias no ejecutadas).

**Puntuación global (subjetiva): 9/10**. El único punto real a cubrir para "producto mínimo completo" es **el despliegue cloud**. Con eso, la solución queda muy sólida para presentación y defensa.
