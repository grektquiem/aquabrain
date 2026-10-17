# 4. Funcionalidad y Características

Este capítulo responde al aspecto 2: **qué hace el sistema y cómo cada componente resuelve la problemática** del cliente. La evidencia es la matriz de funcionalidades (cada una trazada a su historia de usuario, su requisito y la prueba que la respalda) y el flujo de extremo a extremo que se demuestra en vivo (capítulo 5).

## 4.1 Matriz de funcionalidades

Cada funcionalidad construida se traza a su **historia de usuario (HU)**, su **requisito funcional (RF)** y la **prueba o evidencia** que la respalda. Estado: ✅ cumplido con evidencia, 🟡 parcial, ⬜ fuera de alcance.

| # | Funcionalidad | HU | RF | Estado | Evidencia |
|---|---|---|---|:--:|---|
| 1 | Autenticación con JWT + refresh token (cookie `HttpOnly`) | HU05 | RF01 | ✅ | Suites `auth` (8) y `rbac` (11) |
| 2 | CRUD de usuarios con roles, restringido a administradores | HU05 | RF02 | ✅ | Suite `gestion` (16); un encargado recibe `403` |
| 3 | CRUD de sistemas / instalaciones | HU06 | RF03 | ✅ | Suite `gestion` |
| 4 | Gestión de dispositivos por sistema | HU06 | RF04 | ✅ | Suite `gestion`; 2 dispositivos sembrados |
| 5 | Gestión de sensores con tipo de variable y unidad | HU06 | RF05 | ✅ | 10 sensores; 5 tipos de variable |
| 6 | Ingesta de mediciones vía API (individual y por lote) | HU08 | RF06 | ✅ | Suite `mediciones` (12); simulador (§5.3) |
| 7 | Dashboard con la última medición por sensor | HU01 | RF07 | ✅ | Panel verificado en navegador (10 variables) |
| 8 | Históricos con filtros, gráfico y exportación CSV | HU02 | RF08 | ✅ | Suite `historicos` (6); CSV con BOM UTF-8 |
| 9 | Comparativa multi-sistema | HU04 | RF09 | 🟡 | La **API** acepta varios sensores; la **UI no** superpone sistemas |
| 10 | CRUD de reglas de alerta (variable, operador, umbral, severidad) | HU07 | RF10 | ✅ | Suite `gestion`; 4 reglas sembradas |
| 11 | Motor de evaluación de alertas | HU03 | RF11 | ✅ | `reglas.engine.spec` (11) + `alertas` (9) |
| 12 | Lista de alertas con filtros y resolución | HU03 | RF12 | ✅ | Suite `alertas` (9); resolución verificada en UI (3 → 2) |
| 13 | Documentación OpenAPI versionada | HU11 | RF13 | ✅ | 35 rutas en `/api/docs`; contrato verificado (TS-42) |
| 14 | Estado de conexión / última comunicación del dispositivo | HU10 | RF14 | ✅ | Frescura derivada (`frescura.spec`, 6); panel «Sin comunicación» |
| — | Suscripción y licenciamiento | HU09 | RF15 | ⬜ | *Won't* (supuesto no respaldado por el desafío) |

**Resultado:** **13 funcionalidades cumplidas** con evidencia automatizada o verificada, **1 parcial** (comparativa en UI) y **1 fuera de alcance**. **Todos los RF *Must* están implementados y probados.**

> **Nota de honestidad.** El borrador de ES4 afirmaba **9 pantallas**. La implementación tiene **4 pantallas** que cubren los mismos casos de uso (acceso, estado, históricos y alertas), más los CRUD accesibles por API. No se inventan pantallas que no existen: la administración de usuarios, sistemas y reglas se ejerce hoy por API y está en el *roadmap* de interfaz (§2.5).

## 4.2 Flujo completo demostrable

El flujo de extremo a extremo —desde la lectura del sensor hasta la alerta y el panel— es el que se muestra en la demo en vivo:

```mermaid
flowchart LR
    SIM["Simulador ESP32-S3<br/>modos online / offline / anomalia"]
    SIM -->|"POST /mediciones(/bulk)<br/>X-Device-Key + X-Device-Code"| API[API NestJS]
    API --> V{"Validacion<br/>DTO whitelist<br/>timestamp no futuro<br/>sensor del dispositivo"}
    V -->|invalido| E["400 / 422 · error normalizado"]
    V -->|valido| ID{"IdExterno ya visto?"}
    ID -->|si| DUP["Duplicada · no se inserta"]
    ID -->|no| PG[("PostgreSQL: INSERT medicion")]
    PG --> CAL{"Valor fuera de rango?"}
    CAL -->|si| SOSP["calidad = SOSPECHOSA<br/>(no se descarta)"]
    CAL -->|no| OK["calidad = OK"]
    SOSP --> MOT["Motor de reglas (en linea)"]
    OK --> MOT
    MOT -->|regla cumplida| AL[("INSERT alerta")]
    PG --> DASH["Dashboard: ultima medicion + frescura"]
    AL --> DASH
```

Puntos clave del flujo que se destacan en la demo:

- **Autenticación de dispositivo** por dos cabeceras (`X-Device-Key`, `X-Device-Code`), no por usuario.
- **Idempotencia:** un reenvío del mismo lote no duplica historia (tabla `medicion_idempotencia`, **2 030** filas).
- **Calidad, no descarte:** un valor fuera de rango se guarda como `SOSPECHOSA` y **dispara** la alerta; descartarlo ocultaría justamente el dato a investigar.
- **Evaluación en línea:** el motor de reglas corre dentro de la ingesta (la alternativa asíncrona está documentada como camino de escalabilidad, §7.8).

## 4.3 Módulos del backend

La API expone **35 rutas** agrupadas en **12 módulos**:

| Módulo | Responsabilidad | Rutas representativas |
|---|---|---|
| `auth` | Login, refresco, cierre de sesión y perfil | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| `usuarios` | CRUD de usuarios, roles y permisos | `/usuarios`, `/roles`, `/permisos` |
| `sistemas` | CRUD de instalaciones (invernaderos) | `/sistemas` |
| `cultivos` | CRUD de cultivos y su ciclo de vida | `/cultivos` |
| `dispositivos` | CRUD de gateways, rotación de clave y sensores | `/dispositivos`, `/dispositivos/{id}/rotar-clave` |
| `sensores` | CRUD de sensores y catálogo de tipos de variable | `/sensores`, `/tipos-variable` |
| `reglas` | CRUD de reglas y simulación sin persistir | `/reglas`, `POST /reglas/probar/simulacion` |
| `mediciones` | Ingesta, series, últimas lecturas y CSV | `/mediciones`, `/mediciones/bulk`, `/mediciones/serie`, `/mediciones/exportar.csv` |
| `alertas` | Listado, detalle, resumen y resolución | `/alertas`, `/alertas/resumen`, `/alertas/{id}/resolver` |
| `dashboard` | Estado agregado de dispositivos, sensores y alertas | `/dashboard/estado` |
| `auditoria` | Bitácora de operaciones | `/auditoria` |
| `salud` | Sonda de salud | `/health` (sin prefijo) |

El inventario completo de las 35 rutas está en el anexo (capítulo 14).

## 4.4 Pantallas del dashboard

Cuatro pantallas funcionales, verificadas en navegador con capturas (capítulo 14):

| # | Pantalla | HU | RF | Qué muestra |
|---|---|---|---|---|
| 1 | **Acceso** | HU05 | RF01 | Formulario de correo y contraseña con manejo de error |
| 2 | **Panel** | HU01 | RF07 | Indicadores, dispositivos con estado de frescura y **10 tarjetas** de última lectura (refresco cada 15 s) |
| 3 | **Históricos** | HU02 | RF08 | Selector de sensor y agrupación, rango de fechas, gráfico con banda mín/máx y exportación CSV |
| 4 | **Alertas** | HU03 | RF12 | Bandeja con filtros por estado y severidad, paginación y resolución con comentario |

## 4.5 Cómo cada componente resuelve la problemática

| Problemática del diagnóstico (ES1) | Componente que la resuelve | Cómo |
|---|---|---|
| Lecturas aisladas entre display, app y firmware | **Base PostgreSQL + API de ingesta** | Toda lectura entra por `POST /mediciones(/bulk)` y queda en una sola tabla `medicion` (52 230 filas) |
| No saber el estado sin inspección física | **Dashboard (Panel)** | Última lectura por sensor + semáforo de frescura por dispositivo |
| Detección tardía de condiciones fuera de rango | **Motor de reglas + Alertas** | 4 reglas evalúan cada medición y generan alertas con severidad |
| Pérdida de datos durante cortes de red | **Simulador / firmware offline + idempotencia** | Búfer local y reenvío; la clave `(dispositivo, idExterno)` evita duplicar |
| Dificultad para integrar la app Android y otros clientes | **API-first (OpenAPI 3 + Zod compartido)** | 35 rutas documentadas y contrato verificado (TS-42) |
| Análisis manual de tendencias | **Históricos (gráfico + CSV)** | Serie con agrupación configurable y exportación |

La conjunción de estos componentes cubre el **flujo completo exigido por el desafío**: *medición simulada → API → almacenamiento → dashboard / alerta*.
