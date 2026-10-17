# 3. Arquitectura y Tecnologías Consolidadas

## 3.1 Arquitectura 4+1 (resumen ejecutivo)

El diseño de ES2 se materializó respetando las cinco vistas del modelo 4+1. La tabla resume cada vista con la evidencia real de su implementación:

| Vista | Descripción | Evidencia en el proyecto |
|---|---|---|
| **Lógica** | Cuatro capas: presentación, aplicación (controladores), dominio (servicios) y datos (Prisma/PostgreSQL) | Módulos por dominio en `apps/api/src/modules/`; capas separadas |
| **Desarrollo** | Monorepo con npm workspaces: `apps/api`, `apps/web`, `apps/simulator`, `packages/shared` | Estructura del repositorio (§3.3) |
| **Procesos** | Flujo ingesta → validación → persistencia → motor de alertas → dashboard | `mediciones.service.ts`, `motor-alertas.service.ts`; diagrama en §4.2 |
| **Física** | Nube/contenedores (Docker), gateways ESP32-S3, clientes web y móvil | `infra/docker-compose.yml`; imagen de API construida (162 MB) |
| **Escenarios** | Seis escenarios clave: dashboard, alerta, comparativa, offline, administración y reglas | Suites de prueba y guion de demo (§5) |

Cada petición atraviesa la API en este orden: **guardas** (¿quién eres y qué puedes hacer?), **interceptor de auditoría**, **pipe de validación** (rechaza campos no declarados), **servicio de dominio** y, ante cualquier error, un **filtro global** que normaliza la respuesta.

```mermaid
flowchart TB
    subgraph Clientes
      A[Dashboard React]
      B[Simulador / Gateway ESP32-S3]
      C[App Android del cliente]
    end
    A -->|JWT Bearer| G
    C -->|JWT Bearer| G
    B -->|X-Device-Key + X-Device-Code| G
    subgraph API[NestJS 10]
      G[Guards: JwtAuth / Dispositivo / Permisos]
      I[Interceptors: Auditoría]
      P[Pipes: validación whitelist]
      S[Servicios de dominio]
      F[Filtro global de excepciones]
    end
    G --> I --> P --> S
    S --> DB[(PostgreSQL 16 vía Prisma 5)]
    S --> R[(Motor de reglas en línea)]
```

> **Desviación respecto de ES2/borrador.** El borrador planteaba **FastAPI (Python)** y **Redis**. La implementación usa **NestJS (TypeScript)** para mantener un solo lenguaje en todo el stack (lo que habilita la fuente de verdad compartida `@aquabrain/shared`) y **no usa Redis**: con una sola instancia no aportaba valor; `REDIS_URL` queda como variable **reservada**. Son las discrepancias D-01 y D-07 del informe ES3.

## 3.2 Stack tecnológico consolidado

Versiones **medidas** en el entorno de desarrollo:

| Capa | Tecnología | Versión | Rol y justificación |
|---|---|---|---|
| Frontend | **React** | 18.3.1 | Componentes reutilizables; coincide con ES2 |
| Bundler | **Vite** | 5.4.8 | Arranque y recarga en caliente |
| Lenguaje | **TypeScript** | 5.6.3 | Tipado estricto del contrato (modo `strict`) |
| Estado del servidor | **TanStack Query** | 5.59.0 | Caché, reintentos y refresco periódico del panel |
| Gráficos | **Recharts** | 2.12.7 | Series con bandas de mínimo/máximo |
| Backend | **NestJS** | 10.4.4 | Guards, interceptors, pipes y decoradores nativos |
| ORM | **Prisma** | 5.22.0 | Migraciones versionadas y tipado del esquema |
| Base de datos | **PostgreSQL** | 16.15 (contenedor `postgres:16`) | Integridad, índices compuestos y series temporales |
| Validación | **Zod** | 3.23.8 | Esquemas compartidos (`@aquabrain/shared`) |
| Autenticación | **JWT + bcrypt** | bcrypt 5.1.1 | Estándar multi-cliente; contraseñas con coste 12 |
| Contenedores | **Docker + Compose** | Docker 29.8.2 · Compose v5.6.0 | Portabilidad y reproducibilidad |
| CI/CD | **GitHub Actions** | — | Verificación de tipos, migraciones, pruebas y cobertura |
| Pruebas | **Jest + Supertest** | — | 125 pruebas unitarias y de integración |
| Documentación | **OpenAPI 3 + Swagger UI** | — | Contrato estable versionado (35 rutas) |

> **Desviación respecto de ES2/borrador (D-03).** El borrador proponía **Tailwind CSS + Zustand + Axios**. La implementación usa **CSS propio**, el **estado local de React + TanStack Query** y **fetch nativo**, para reducir dependencias sin alterar la interfaz diseñada.

## 3.3 Estructura del repositorio

```text
Proyecto AquaPlants  AquaBrain/
├─ apps/
│  ├─ api/          API NestJS + Prisma (backend)
│  ├─ web/          Dashboard React + Vite (frontend)
│  └─ simulator/    Simulador del gateway ESP32-S3
├─ packages/
│  └─ shared/       Esquemas Zod compartidos (fuente de verdad del contrato)
├─ infra/           docker-compose, Dockerfiles, configuración de nginx
├─ docs/
│  ├─ ES1/          Catálogo canónico (necesidades, HU, RF/RNF)
│  ├─ ES2/          Diseño de la solución
│  ├─ ES3/          Informe de implementación
│  └─ ES4/          Este informe de cierre
├─ .github/workflows/ci.yml   Integración continua
├─ package.json     Workspaces y scripts raíz
└─ README.md
```

| Workspace | Paquete | Rol |
|---|---|---|
| `apps/api` | `@aquabrain/api` | Backend, ingesta de datos y lógica de negocio |
| `apps/web` | `@aquabrain/web` | Dashboard de monitoreo |
| `apps/simulator` | `@aquabrain/simulator` | Cliente del protocolo de ingesta (gateway simulado) |
| `packages/shared` | `@aquabrain/shared` | Esquemas de validación compartidos |

## 3.4 Vista de despliegue

```mermaid
flowchart LR
    U[Navegador] -->|:8080| W[web · nginx]
    W -->|/api| A[api · NestJS :3000]
    A -->|5432| D[(db · PostgreSQL 16)]
    A -. migrate deploy al arrancar .-> D
```

La solución se empaqueta con **Docker Compose** en tres servicios (`db`, `api`, `web`). La API ejecuta `prisma migrate deploy` antes de arrancar, y el frontend se sirve como estático en nginx, que además **proxea `/api` hacia la API**: el navegador ve un único origen, sin CORS. El detalle está en el capítulo 7 y en ES3 §8.
