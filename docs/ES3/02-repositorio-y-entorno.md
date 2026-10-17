# 2. Repositorio y Entorno de Trabajo

## 2.1 Estructura del repositorio

La solución se organiza como un **monorepo con npm workspaces**. Todo el código vive en un único repositorio, lo que facilita compartir contratos y automatizar la integración continua.

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
│  ├─ ES1/          Catálogo canónico corregido
│  ├─ ES2/          Diseño de la solución
│  └─ ES3/          Este informe
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

## 2.2 Control de versiones

El repositorio se inicializó con **git** (rama `main`) y un historial de incrementos reales. Los commits siguen *Conventional Commits* y agrupan unidades coherentes de trabajo (se listan sus mensajes):

```text
docs(es3): informe de implementacion con evidencia real
docs(es1,es2): catalogo corregido y diseno de la solucion
ci(infra): pipeline de GitHub Actions y despliegue con Docker
feat(web): dashboard React con panel, historicos y alertas
feat(simulator): simulador IoT del gateway ESP32-S3
test(api): suites unitarias y de integracion e2e
feat(api): API NestJS con Prisma, autenticacion JWT y RBAC
feat(shared): esquemas Zod como fuente unica del contrato
chore: configuracion inicial del monorepo con npm workspaces
```

> **Nota honesta.** El historial se creó al final del desarrollo (9 commits agrupando el trabajo ya realizado), no como una secuencia diaria de *commits*. No existe repositorio remoto ni *pull requests*: el control de versiones es **local**. Esta desviación respecto del flujo colaborativo descrito en ES2 se registra en la sección 11.

Se protegen deliberadamente los secretos: `.gitignore` excluye `.env`, `.env.*` (salvo `.env.example`), `infra/.env`, y todas las carpetas `node_modules/`, `dist/` y `coverage/`. La verificación previa al primer *commit* confirmó que **no se versiona ninguna clave real** (las claves de dispositivo y los secretos JWT solo existen en el entorno local).

## 2.3 Entorno de desarrollo utilizado

| Componente | Versión medida |
|---|---|
| Sistema operativo | Windows (host de desarrollo) |
| Node.js | v24.16.0 |
| npm | 11.13.0 |
| NestJS | 10.4.4 |
| Prisma / @prisma/client | 5.22.0 |
| PostgreSQL (contenedor `postgres:16`) | 16.15 |
| React / React DOM | 18.3.1 |
| Vite | 5.4.8 |
| TypeScript | 5.6.3 |
| TanStack Query | 5.59.0 |
| Recharts | 2.12.7 |
| Zod | 3.23.8 |
| bcrypt | 5.1.1 |

La base de datos de desarrollo corre en un contenedor Docker (`aquabrain-pg`, imagen `postgres:16`) publicado en el puerto **55432** del host, para no chocar con otra instalación local de PostgreSQL. En el despliegue con *compose* (sección 8) la base usa el puerto estándar 5432 dentro de la red interna.

## 2.4 Puesta en marcha reproducibles

```powershell
# 1. Dependencias de todos los workspaces
npm install

# 2. Compilar el paquete compartido (lo consumen API y simulador)
npm run build --workspace @aquabrain/shared

# 3. Variables de entorno de la API (copiar del ejemplo y ajustar)
Copy-Item apps/api/.env.example apps/api/.env

# 4. Base de datos: migrar y sembrar (30 días de datos deterministas)
cd apps/api
npx prisma migrate deploy
npx prisma db seed

# 5. API y dashboard
npm run start:prod            # desde apps/api  -> http://localhost:3000
npm run dev                   # desde apps/web  -> http://localhost:5173
```

El `README.md` de la raíz documenta los mismos pasos y el índice completo de la documentación.
