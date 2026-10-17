# ES2 · 03 — Stack tecnológico e infraestructura

Cada tecnología se justifica por **problema → necesidad → requisito**, no por preferencia ni moda.
La columna "Alternativas evaluadas" deja explícito qué se descartó y por qué. Los requisitos citados pertenecen al
catálogo corregido de ES1 (`RF01…RF15`, `RNF01…RNF11`).

---

## 1. Resumen del stack

| Capa | Tecnología elegida | Versión objetivo | Alternativas evaluadas | Requisito que atiende | Necesidad futura cubierta |
|---|---|---|---|---|---|
| Frontend | React + TypeScript + Vite | React 18 / Vite 5 | Angular, Vue 3, Svelte | RNF05, RF07, RF08 | Componentes reutilizables y SSR futuro |
| Estilos y UI | Tailwind CSS + Radix/shadcn | Tailwind 3.x | Bootstrap, MUI | RNF05 | Sistema de diseño y temas claro/oscuro |
| Estado y datos | TanStack Query + React Router | v5 / v6 | Redux Toolkit, Zustand | RF07, RF08 | Caché optimista y sincronización en vivo |
| Gráficos | Recharts | 2.x | Chart.js, ECharts, Highcharts | RF08, RF09, HU02, HU04 | Series largas y exportación de imágenes |
| Backend | Node.js 20 + NestJS + TypeScript | NestJS 10 | Express, Fastify, Django, Spring Boot | RNF06, RF01…RF14 | Módulos independientes → microservicios |
| Contratos/validación | Zod + class-validator + `packages/shared` | — | Joi, Yup | RNF01, RNF08 | Contrato único compartido por los tres clientes |
| ORM / acceso a datos | Prisma | 5.x | TypeORM, Sequelize, Knex | RNF06, RF03…RF05 | Migraciones declarativas y tipado fuerte |
| Base relacional | PostgreSQL | 16 | MySQL, SQL Server, SQLite | RF03…RF14, RNF03, RNF04 | Particionado y ruta a TimescaleDB |
| Almacén no relacional | MongoDB Atlas (M0) | 7.x | DynamoDB, Cassandra, InfluxDB | RF06, RNF02, RA-05 | Zona de aterrizaje de datos crudos y logs |
| Caché y colas | Redis (Upstash) + BullMQ | 7 / 5 | RabbitMQ, SQS | RNF03, RA-05 | Desacoplar el motor de alertas de la ingesta |
| Tiempo real | Sondeo (*polling*) con caché de 30 s | — | WebSocket (Socket.io), SSE | RNF03, RF07 | Empuje de alertas en vivo por WebSocket |
| Autenticación | Passport JWT + **bcrypt** + refresh rotativo | — | Argon2id, sesiones con cookies, Auth0, Firebase Auth | RNF01, RF01 | MFA y federación de identidad |
| Documentación API | Swagger / OpenAPI 3 | — | Postman Collections, Redoc | RF13, RNF08 | Generación automática de SDK para clientes |
| Pruebas | Jest, Supertest, Playwright, k6 | — | Vitest, Mocha, Cypress, JMeter | RNF10, plan de pruebas ES2 | Cobertura ≥ 70 % y pruebas de carga periódicas |
| Simulador IoT | Script Node.js + `packages/shared` | — | Postman Runner, JMeter, Python | RF06, HU08, HU10 | Gemelo digital de dispositivos |
| Empaquetado | Docker + Docker Compose | — | Sin contenedores | RNF07 | Despliegue multi-nube |
| CI/CD | GitHub Actions | — | GitLab CI, Jenkins | RNF06, RNF07 | Despliegue continuo a producción |
| Hosting | Vercel (frontend) + Render/Railway (API) + Neon/Supabase (PG) + Atlas (Mongo) | — | AWS, GCP, VPS propio | RNF07, RNF02 | Migración a IaaS al escalar |
| Monitoreo | Logs estructurados (pino) + uptime (UptimeRobot) | — | Datadog, Sentry, New Relic | RNF11, RNF02 | Errores proactivos (Sentry) y trazas distribuidas |

> **Tiempo real:** el diseño resuelve el dashboard con *polling* + caché de 30 s (decisión D-15) porque **RNF03** pide
> "< 2 s" y no exige empuje continuo; WebSocket queda como **necesidad futura** para notificar alertas al instante sin
> recargar y como ruta de escalamiento (ver alternativas descartadas en §2).

---

## 2. Backend — justificación

**Problema:** hay que exponer una API con reglas de negocio, control de acceso por rol y validación estricta de datos provenientes tanto del **firmware ESP32-S3 real** como del simulador.

| Criterio | NestJS | Express puro | Django | Spring Boot |
|---|---|---|---|---|
| Estructura impuesta (módulos, DI, guardias) | ✅ Alta | ❌ Cada equipo define la suya | ✅ Alta | ✅ Alta |
| Encaje con autorización declarativa por permiso | ✅ `Guards` + decoradores | ⚠️ Manual | ✅ `permissions` | ✅ |
| Compartir tipos con el frontend (un solo lenguaje) | ✅ TypeScript | ✅ | ❌ Python | ❌ Java |
| Curva de aprendizaje para 4.º semestre | Media | Baja | Media | Alta |
| Documentación OpenAPI integrada (RF13) | ✅ `@nestjs/swagger` | ⚠️ `swagger-jsdoc` | ✅ DRF | ✅ springdoc |
| **Decisión** | ✅ **Elegido** | ❌ Riesgo de arquitectura inconsistente | ❌ Rompe el tipado compartido | ❌ Sobrecoste de aprender el framework y su ecosistema |

**Complementos justificados**

- **Prisma** en lugar de SQL a mano: genera tipos desde el esquema, versiona migraciones y evita inyección SQL por construcción. Necesario para cumplir RNF06 con un equipo pequeño.
- **Zod en `packages/shared`**: el mismo esquema valida en el frontend (formularios) y en el backend (DTO), eliminando divergencias (RNF01).
- **BullMQ + Redis**: saca la notificación de alertas de la ruta crítica de ingesta (RA-05) y permite reintentos con backoff.
- **Passport + bcrypt**: NestJS trae estrategias JWT listas; bcrypt es el algoritmo comprometido en ES1 (RNF01, HU05 CA3).

---

## 3. Frontend — justificación

**Problema:** el usuario necesita ver estado actual, series históricas, comparación multi-sistema y alertas en distintos dispositivos, con poca fricción de aprendizaje, y de forma **consistente con el display OLED local** (RNF05, RN-12).

| Criterio | React + Vite | Angular | Vue 3 |
|---|---|---|---|
| Familiaridad previa del equipo | ✅ Alta | Media/baja | Media |
| Librerías de gráficos para series temporales | ✅ Amplia (Recharts, visx) | ✅ | ✅ |
| Curva para prototipar rápido | ✅ Muy baja | Alta (módulos, RxJS) | Baja |
| Ecosistema para dashboards y tablas | ✅ | ✅ | ✅ |
| **Decisión** | ✅ **Elegido** | ❌ Mayor tiempo de arranque | ❌ Menor disponibilidad de ejemplos en el equipo |

**Complementos justificados**

- **TanStack Query**: caché, reintentos y estados `loading/error` consistentes para RNF03 y RNF05. Evita reinventar el manejo de datos remotos.
- **Recharts**: componentes declarativos suficientes para series múltiples y *tooltips*; cubre la comparación multi-sistema (HU04, RF09) y los históricos (HU02, RF08).
- **Tailwind + Radix**: utilidades con *design tokens* (guía visual) y componentes accesibles por teclado (RNF05).

---

## 4. Datos — justificación resumida

> El detalle de entidades, integridad e índices está en `05-modelo-de-datos.md`.

- **PostgreSQL** para el dominio: sistemas, cultivos, dispositivos, sensores, reglas, alertas y usuarios requieren **integridad referencial**, transacciones y restricciones (`UNIQUE`, `CHECK`, FK). Además permite particionado declarativo de la tabla de mediciones (RNF04) y agregación con `date_trunc`/`GROUP BY` en la base (RNF03).
- **MongoDB Atlas** como *landing zone* del payload crudo: el *payload* del firmware puede evolucionar (nuevos campos, versión distinta) sin migraciones, y su escritura es *best-effort*, de modo que una caída del almacén no relacional **no pierde datos** (RA-05) porque la medición ya está en PostgreSQL.
- **Redis** para caché de dashboard (TTL 30 s) y cola de trabajos.

---

## 5. Infraestructura, despliegue y CI/CD

### 5.1. Topología de despliegue

| Componente | Servicio propuesto | Plan | Por qué |
|---|---|---|---|
| Frontend | Vercel / Netlify | Gratuito | CDN global, HTTPS automático, despliegue por *push* |
| API (contenedor) | Render / Railway | Gratuito / bajo costo | Despliegue desde Dockerfile, variables de entorno y *health check* |
| PostgreSQL | Neon / Supabase | Gratuito | PostgreSQL gestionado, respaldos, *connection string* por entorno |
| MongoDB | Atlas M0 | Gratuito | *Landing zone* sin administración |
| Redis | Upstash | Gratuito | Caché y colas con latencia baja |
| Repositorio | GitHub (privado) | Gratuito | Actions, Projects, protección de ramas |
| Monitoreo | UptimeRobot + logs del PaaS | Gratuito | Verificación de disponibilidad (RNF02) |

### 5.2. Pipeline CI/CD (GitHub Actions)

```mermaid
flowchart LR
    PR["Pull Request a develop"] --> L["1 · Lint + formato"]
    L --> T["2 · Tests unitarios (Jest)"]
    T --> I["3 · Tests de integración (Supertest + servicios efímeros)"]
    I --> B["4 · Build de api y web + cobertura (≥ 70 %)"]
    B --> S["5 · Escaneo de dependencias (npm audit) y secretos"]
    S --> M{"¿Merge a main?"}
    M -->|Sí| D1["Deploy frontend (Vercel)"]
    M -->|Sí| D2["Deploy API (Render) + migraciones Prisma"]
    D1 --> SM["Smoke test contra staging"]
    D2 --> SM
    M -->|No| R["Comentario en el PR con resultados"]
```

### 5.3. Configuración reproducible (RNF07)

- **Variables de entorno** (`.env.example` versionado, `.env` ignorado):

| Variable | Uso | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://user:pass@host:5432/aquabrain` |
| `MONGO_URL` | Landing zone de payload crudo | `mongodb+srv://…` |
| `REDIS_URL` | Caché y colas | `rediss://…` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Firma de tokens | cadena aleatoria ≥ 32 bytes |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Vigencias | `15m` / `7d` |
| `BCRYPT_COST` | Costo del hash de contraseñas | `12` |
| `DEVICE_KEY_PEPPER` | Sal para hash de API keys de dispositivos | cadena aleatoria |
| `CORS_ORIGINS` | Orígenes permitidos | `https://aquabrain.vercel.app` |
| `ALERT_SILENCE_FACTOR` | Multiplicador del intervalo para marcar "sin comunicación" | `3` |
| `MAX_TIMESTAMP_SKEW` | Tolerancia de desfase para rechazar timestamps futuros (RN-09) | `5m` |
| `LOG_LEVEL` | Nivel de log | `info` |

- **`docker-compose.yml`** para el entorno local: `api`, `postgres`, `mongo`, `redis` y `simulator`.
- **Migraciones y semilla**: `prisma migrate deploy` + `prisma db seed` en el arranque del contenedor; la semilla crea roles, permisos, 1 administrador, 1 supervisor, 1 encargado, 2 sistemas, 2 dispositivos, sensores de temperatura/humedad/distancia/pH/caudal y 30 días de mediciones sintéticas (necesario para las pruebas de ES3).
- **Procedimiento documentado** en el README raíz: `git clone → cp .env.example .env → docker compose up → npm run seed → abrir http://localhost:5173`.

### 5.4. Respaldos y recuperación (RNF02)

| Activo | Respaldo | Frecuencia | RPO | RTO |
|---|---|---|---|---|
| PostgreSQL | *snapshot* automático del proveedor + `pg_dump` semanal a almacenamiento externo | Diario | ≤ 24 h | ≤ 4 h |
| MongoDB (crudo) | No crítico: es una *landing zone* recreable | Semanal | 7 días | — |
| Código y configuración | GitHub (todo en repositorio, secretos fuera del código) | Continuo | 0 | minutos |
| Documentación | `docs/` en el repositorio | Continuo | 0 | minutos |

---

## 6. Riesgos tecnológicos y mitigación

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| RT-01 | Límites de los planes gratuitos (hibernación, cuota de conexiones) | La demo puede fallar | *Health check* programado; alternativa `docker-compose` local para la presentación |
| RT-02 | Sobrecarga de Prisma en consultas de agregación masiva | RNF03 no se cumple | Las series temporales se resuelven con vistas y `$queryRaw` controlado, no con ORM |
| RT-03 | Crecimiento no controlado de la colección cruda | Costos y lentitud | Índice TTL en MongoDB (p. ej. 90 días) + política de retención documentada |
| RT-04 | Deriva entre el contrato del frontend, del firmware y del backend | Retrabajo e incompatible con la app Android (RNF08) | `packages/shared` como única fuente de verdad + contrato OpenAPI + test de contrato en CI |
| RT-05 | Dependencia de un proveedor único (*vendor lock-in*) | Dificultad de migración | Todo contenedorizado, PostgreSQL estándar y Mongo solo como *landing zone*; migrar es cambiar variables de entorno |
| RT-06 | El formato del firmware real difiere del simulador | La ingesta rechaza datos reales | Se modela el contrato desde el `main.cpp` del ESP32-S3 y se prueba con payload real (RN-11) |

---

## 7. Herramientas de trabajo del equipo

| Área | Herramienta | Uso |
|---|---|---|
| Gestión | GitHub Projects (tablero Kanban) | Backlog, sprints, seguimiento |
| Repositorio y revisión | GitHub (`main`/`develop`/`feature/*`, PR obligatorio) | Colaboración y control de versiones |
| Documentación | Markdown en `docs/` + Mermaid | Documentación viva |
| Diseño | Figma (o wireframes en Markdown + prototipo HTML) | Prototipos y guía visual |
| API | Swagger UI + OpenAPI 3 | Contrato y prueba manual |
| Comunicación | Canal del equipo + actas de reunión | Daily y Sprint Review |
