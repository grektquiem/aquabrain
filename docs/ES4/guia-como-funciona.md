# Guía: Cómo funciona AquaBrain

AquaBrain es una plataforma web para **monitoreo y gestión de cultivos aeropónicos**. Centraliza mediciones de sensores, evalúa reglas de alerta automáticamente y presenta el estado en tiempo real en un dashboard.

## 1. Arquitectura general

```text
Navegador (Dashboard Vite)
  ↓ HTTP/REST
API NestJS (:3000)  ←  Simulador IoT (:envía mediciones)
  ↓ Prisma ORM
PostgreSQL (:55432)
```

**Componentes principales:**

| Componente | Tecnología | Ubicación | Función |
|---|---|---|---|
| **Web (Frontend)** | Vite + TypeScript + TanStack Query | `apps/web` | Dashboard (Panel, Históricos, Alertas, Administración). |
| **API (Backend)** | NestJS + TypeScript + Prisma | `apps/api` | REST API, autenticación JWT/RBAC, motor de reglas, ingesta de mediciones. |
| **Base de datos** | PostgreSQL 16 | `localhost:55432` (dev) / contenedor `aquabrain-pg` | Persistencia (append-only de mediciones). |
| **Simulador IoT** | TypeScript + Node | `apps/simulator` | Emula gateway/ESP32-S3 (3 modos: `online`, `offline`, `anomalia`). |
| **Paquete compartido** | TypeScript (Zod) | `packages/shared` | **Fuente única de verdad** (contratos, validaciones, tipos). |

## 2. Flujo de datos

```mermaid
flowchart LR
  S[Simulador/Dispositivo] -->|POST /mediciones o /mediciones/bulk| API
  API -->|Valida (Zod/shared)| API
  API -->|Guarda medición (append-only)| DB[(PostgreSQL)]
  API -->|Evalúa reglas activas| Motor[Motor de Reglas]
  Motor -->|Genera alertas| DB
  API -->|Actualiza estado conexión| DB
  Web[Dashboard] -->|GET /dashboard/estado, /mediciones/serie, /alertas| API
  API -->|Respuesta JSON| Web
```

1. **Ingesta**: el simulador/envía mediciones con cabeceras `X-Device-Key` y `X-Device-Code`.
2. **Validación**: esquemas Zod (`@aquabrain/shared`) validan el payload antes de persistir.
3. **Persistencia**: `medicion` es **append-only** (nunca se modifica/elimina). Se registra `origen` (ONLINE/OFFLINE/MANUAL).
4. **Idempotencia**: `idExterno` evita duplicados (útil en sincronización `offline`).
5. **Motor de reglas**: al recibir cada medición, evalúa reglas activas por sensor/tipo de variable. Genera alertas con severidad (BAJA/MEDIA/ALTA/CRÍTICA).
6. **Frescura de conexión**: si pasan `ALERT_SILENCE_FACTOR × intervalo` segundos sin reportes, el dispositivo aparece como **SIN_COMUNICACION** (calculado en vivo).
7. **Visualización**: el Dashboard consulta `/dashboard/estado` (panel), `/mediciones/serie` (históricos) y `/alertas` (alertas activas/resueltas).

## 3. Módulos principales (API)

| Módulo | Endpoints clave | Descripción |
|---|---|---|
| **Auth** | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | JWT (access 15m, refresh 7d), RBAC por roles/permisos. |
| **Dashboard** | `GET /dashboard/estado` | Estado agregado (dispositivos en línea, variables, alertas, última actualización). |
| **Mediciones** | `POST /mediciones`, `POST /mediciones/bulk`, `GET /mediciones/serie`, `GET /mediciones/exportar.csv` | Ingesta individual/lote, series temporales, export CSV. |
| **Alertas** | `GET /alertas`, `POST /alertas/:id/resolver` | Listado por estado/severidad, marcar como resuelta. |
| **Reglas** | CRUD `/reglas-alerta` | Umbrales, condiciones, severidad, activo/inactivo. |
| **Sistemas/Cultivos/Dispositivos/Sensores** | CRUDs | Catálogo del dominio (instalaciones, cultivos, dispositivos, sensores). |
| **Usuarios/Roles** | CRUDs | Gestión de usuarios y permisos (21 permisos / 3 roles). |
| **Auditoría/Salud** | `GET /health`, `GET /auditoria` | Health (`estado: ok`, `baseDatos: ok`), trazabilidad de acciones. |

> **Nota:** `GET /health` está **fuera del prefijo** `/api/v1` (respuesta directa en `http://localhost:3000/health`).

## 4. Puertos, URLs y credenciales

| Servicio | URL | Puerto | Notas |
|---|---|---|---|
| **API** | `http://localhost:3000` | 3000 | Prefix `/api/v1`. OpenAPI: `/api/docs` (Swagger), JSON: `/api/docs-json`. Health: `/health`. |
| **Dashboard (dev)** | `http://localhost:5173` | 5173 | Vite dev server. |
| **PostgreSQL** | `postgresql://aquabrain:aquabrain@localhost:55432/aquabrain` | 55432 | Contenedor `aquabrain-pg`. |

**Credenciales de demostración (sembradas):**

| Usuario | Rol | Contraseña |
|---|---|---|
| `admin@aqua.cl` | Administrador | `AquaPlants2026!` |
| `supervisor@aqua.cl` | Supervisor | `AquaPlants2026!` |
| `encargado@aqua.cl` | Encargado de cultivo | `AquaPlants2026!` |

## 5. Cómo levantar la aplicación

### Opción A: Desarrollo local (rápida)

Requiere Node.js 20+, npm, PostgreSQL disponible (o Docker para BD).

```powershell
# 1) Instalar dependencias (raíz del monorepo)
npm ci

# 2) Compilar paquete compartido
npm run build --workspace @aquabrain/shared

# 3) API (terminal 1) — desde apps/api
cd apps/api
$env:DATABASE_URL="postgresql://aquabrain:aquabrain@localhost:55432/aquabrain"
$env:PORT="3000"
$env:API_PREFIX="api/v1"
$env:JWT_ACCESS_SECRET="dev-access-secret-cambiar"
$env:JWT_REFRESH_SECRET="dev-refresh-secret-cambiar"
$env:DEVICE_KEY_PEPPER="dev-pepper-cambiar"
$env:CORS_ORIGINS="http://localhost:5173,http://localhost:4173"
npm run start:dev

# 4) Dashboard (terminal 2) — desde raíz
npm run dev --workspace @aquabrain/web
# Abre http://localhost:5173
```

### Opción B: Docker Compose (reproducible)

```powershell
# Copiar variables de ejemplo y editar secretos
Copy-Item infra/.env.example infra/.env

# Levantar api + db + web (nginx en :8080)
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build

# Dashboard: http://localhost:8080
# API:       http://localhost:3000/api/docs
```

La API ejecuta `prisma migrate deploy` al arrancar (idempotente). Los secretos **no** se versionan.

## 6. Simulador IoT

El simulador emite lecturas realistas y valida contra el contrato compartido.

```powershell
cd apps/simulator
$env:API_URL="http://localhost:3000/api/v1"
$env:DEVICE_KEY="ak_live_<CLAVE_DEV01>"
$env:DEVICE_CODE="DEV-01"
$env:SENSORES="TEMP-01,HUM-01,PH-01,DIST-01,CAUDAL-01"
$env:MODO="online"        # online | offline | anomalia
$env:INTERVALO_SEG="2"
$env:TICKS="6"
node dist/simulador.js
```

**Modos:**

| Modo | Comportamiento |
|---|---|
| `online` | Envía lecturas individuales (`POST /mediciones`). Genera alertas al superar umbrales. |
| `offline` | Acumula en búfer local (con `timestamp` original, `origen=OFFLINE`, `idExterno`). Al finalizar **sincroniza en lote** (`POST /mediciones/bulk`) y demuestra **idempotencia** (reenvío). |
| `anomalia` | Inyecta valores fuera de rango cada `CADA_ANOMALIA` ticks para provocar alertas (prueba del motor). |

## 7. ¿Qué se ve en el Dashboard?

| Pantalla | Qué muestra |
|---|---|
| **Panel** (`/`) | Dispositivos en línea, variables monitoreadas, alertas activas (por severidad), última actualización, tarjetas por sensor con última medición y frescura. |
| **Históricos** (`/historicos`) | Serie temporal por sistema/sensor/rango de fechas, gráfico + tabla paginada. Permite **exportar CSV** (`GET /mediciones/exportar.csv`). |
| **Alertas** (`/alertas`) | Alertas activas/resueltas, filtros por severidad/estado. Botón para **marcar como resuelta**. |
| **Administración** (`/admin/*`) | Gestión de usuarios/roles, sistemas, cultivos, dispositivos, sensores, reglas de alerta (solo Admin). |

## 8. Conceptos clave

| Concepto | Explicación |
|---|---|
| **Append-only** | Las mediciones nunca se editan ni borran. Esto asegura trazabilidad histórica. |
| **Idempotencia** | `idExterno` + índice único evita duplicados al reenviar lotes (modo `offline` / reintentos). |
| **Motor de reglas** | Evalúa al recibir cada medición. Prioriza reglas del **sensor** sobre reglas del **tipo de variable**. |
| **Frescura** | `SIN_COMUNICACION` si `segundosSinReportar > ALERT_SILENCE_FACTOR × intervaloReporte`. Calculado **en vivo** (no crea alerta obligatoria, marca estado). |
| **RBAC** | Autorización granular por permisos (21). Roles: `Administrador`, `Supervisor`, `Encargado de cultivo`. |
| **Fuente única de verdad** | `@aquabrain/shared` (Zod) comparte contratos entre API, web y simulador → evita deriva entre capas. |

## 9. Datos reales de la verificación (foto del sistema)

| Métrica | Valor (medido) | Notas |
|---|---|---|
| Usuarios / Roles / Permisos | 3 / 3 / 21 | Sembrados |
| Sistemas / Cultivos / Dispositivos | 2 / 3 / 2 | (`DEV-01`, `DEV-02`) |
| Sensores / Tipos de variable | 10 / 5 | (TEMP, HUM, PH, DIST, CAUDAL) |
| Mediciones persistidas | **52 230** | Tras verificaciones |
| Alertas (activas históricas) | 5 | Tras flujo de anomalía |
| Reglas de alerta | 4 | Activas |
| Rutas OpenAPI | 35 rutas (51 operaciones) | `/api/docs` |
| Pruebas | **125** (verde) | Cobertura líneas 92,26 % |

## 10. Dónde seguir

- **API Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health**: [http://localhost:3000/health](http://localhost:3000/health)
- **Evidencia de verificación**: `docs/ES4/evidencia/` (capturas + `verificacion-app.txt`)
- **Verificación de cumplimiento (desafío)**: `docs/ES4/verificacion-desafio.md`

> **Principio:** Toda cifra es **real** (proveniente de ejecución). Lo no implementado o no medido se **declara**, nunca se oculta.
