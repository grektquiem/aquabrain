# 08 · Estándares de la industria y calidad del código

> Indicador cubierto: **6** (cumplimiento de estándares de la industria: convenciones de código, estructura
> mantenible, control de versiones y revisión).

## 8.1 Lenguaje y tipado

Todo el backend y el frontend están escritos en **TypeScript 5.6** con **modo estricto** activado y verificado
en la práctica:

```jsonc
// apps/api/tsconfig.json
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true,
"alwaysStrict": true
```

La verificación de tipos (`tsc --noEmit`) es una **puerta de la integración continua** y también existe como
script (`npm run typecheck`) para la API y el dashboard. El tipado estricto convierte muchos errores de tiempo
de ejecución en errores de compilación, que es la primera línea de defensa de la calidad.

## 8.2 Convenciones de código y estilo

| Convención | Aplicación en el proyecto |
|---|---|
| **Nombres descriptivos y consistentes** | Módulos y archivos en `camelCase` (`mediciones.service.ts`, `reglas.engine.ts`), clases en `PascalCase`, constantes en `MAYÚSCULAS`. |
| **Comentarios con trazabilidad** | El código referencia el requisito/regla que implementa, p. ej. `TS-05 / RN-07: las reglas del sensor prevalecen…`, lo que enlaza **código ↔ diseño ↔ prueba**. |
| **Mensajes de commit normalizados** | **Conventional Commits** (`feat`, `test`, `perf`, `ci`, `docs`, `chore`), con *scope* por área. |
| **Idioma** | Código de dominio en **español** (coherente con el negocio y el resto de la documentación). |
| **Sin valores mágicos en el código** | Los umbrales y parámetros operativos provienen de **variables de entorno** validadas al arranque. |

> **Deuda declarada (honestidad).** El `package.json` **declara** el script `lint` (`eslint … --max-warnings 0`)
> y las dependencias de **ESLint + Prettier**, pero **no hay archivo de configuración versionado**
> (`.eslintrc*`/`eslint.config.*`/`.prettierrc`), por lo que el *linter* **no forma parte del flujo real** y la
> CI **no** lo ejecuta. La calidad se sostiene hoy en **TypeScript estricto + la suite de pruebas + la
> cobertura**. Formalizar esa configuración es la recomendación **R-17**.

## 8.3 Estructura mantenible

La estructura es la de un **monolito modular por capas** dentro de un **monorepo**:

- **`common/`** — infraestructura transversal reutilizable: `guards`, `interceptors`, `pipes`, `filters`,
  `decorators`, `prisma`, `utils`. Los controles de seguridad viven **una sola vez** aquí y se aplican a todas
  las rutas.
- **`config/`** — `env.validation`, `http` (endurecimiento), `openapi`. La configuración se centraliza.
- **`modules/`** — un módulo por **dominio** (auth, usuarios, sistemas, cultivos, dispositivos, sensores,
  reglas, mediciones, alertas, dashboard, auditoria, salud), cada uno con controlador, servicio y DTO.
- **`packages/shared`** — contratos Zod compartidos entre API y simulador.

Esta separación hace que **un cambio de requisito se localice en un módulo**, y que los controles transversales
no se dupliquen. Es el patrón de **separación de responsabilidades** aplicado de forma consistente.

## 8.4 Control de versiones

- **Herramienta:** Git, rama `main`, **15 commits** con mensajes de **Conventional Commits**.
- **Atomicidad:** cada commit agrupa un incremento coherente (paquete compartido → API → pruebas → simulador →
  dashboard → infraestructura), respetando el orden de dependencias.
- **Versionado semántico:** los paquetes declaran `version: 1.0.0` (SemVer).

La **revisión de código** en el sentido formal (Pull Requests) **no se ejecutó**: el repositorio es local, sin
remoto (capítulo 02). Es la brecha de proceso más importante de este indicador y se declara en el capítulo 13
con su recomendación (**R-14**).

## 8.5 Puertas de calidad automatizadas (CI)

Aunque no hay revisión por pares, sí existen **puertas automáticas** que impiden que un cambio roto avance,
todas en `.github/workflows/ci.yml`:

| Puerta | Comando | Efecto si falla |
|---|---|---|
| Verificación de tipos (API) | `npx tsc --noEmit -p tsconfig.json` | Falla el job `calidad` |
| Verificación de tipos + build (web) | `tsc --noEmit && vite build` | Falla el job `web` |
| Migraciones + semilla | `prisma migrate deploy && prisma db seed` | Falla la preparación de la BD |
| Pruebas + **umbral de cobertura** | `npm run test:cov` | Falla si no se alcanza el umbral (TS-44) |
| Cobertura publicable | artefacto `apps/api/coverage/combinado` | Se sube siempre (`if: always()`) |

El **umbral de cobertura** (`scripts/coverage-combinado.js`) es `{ lines: 70, statements: 70, functions: 60,
branches: 60 }`; si la suite no lo alcanza, el proceso **termina con error** y la CI se detiene. Esto convierte
«medir la cobertura» en un **control real**, no en un reporte decorativo.

## 8.6 Estándares de la industria aplicados

| Estándar | Aplicación |
|---|---|
| **REST + semántica HTTP** | Verbos por recurso, `201` creación, `207` multistatus para lotes, `400/401/403/404/409/413/422/429/5xx` con significado preciso |
| **OpenAPI 3** | Contrato publicado en `/api/docs` y `/api/docs-json` (RF13/HU11) |
| **Configuración por entorno (12-factor)** | Toda la configuración por variables de entorno, validadas al arranque |
| **Migraciones versionadas** | Prisma Migrate (`20261016225855_init`) |
| **Esquemas de validación declarativos** | Zod en `@aquabrain/shared`; `class-validator` + pipe *whitelist* en la API |
| **OWASP** | Patrones de seguridad mapeados a OWASP Top 10 (capítulo 07) |
| **Contenerización multi-etapa** | `infra/api.Dockerfile` y `web.Dockerfile` (capítulo 09) |
| **Integración continua** | GitHub Actions con servicio PostgreSQL efímero |
| **Semantic Versioning** | `version: 1.0.0` en los paquetes del workspace |

## 8.7 Calidad medida (no declarada)

| Métrica de calidad | Valor real | Cómo se verifica |
|---|---|---|
| Verificación de tipos | **Pasa** en API y web | `tsc --noEmit` (CI) |
| Cobertura de líneas | **92,26 %** (umbral 70 %) | `coverage-summary.json` / CI |
| Cobertura de sentencias | **91,09 %** (umbral 70 %) | idem |
| Cobertura de funciones | **89,49 %** (umbral 60 %) | idem |
| Cobertura de ramas | **69,01 %** (umbral 60 %) | idem |
| Pruebas en verde | **125** | Jest + Supertest |

## 8.8 Síntesis del capítulo

Los estándares de la industria se aplican en los planos que **importan para la calidad**: **tipado estricto
verificado en CI**, **estructura modular mantenible** con controles transversales únicos, **control de versiones
convencional** y **puertas de calidad automáticas** (tipos + pruebas + umbral de cobertura). Las brechas
—**linter no configurado** y **revisión por pares ausente**— se declaran con transparencia y se priorizan como
trabajo futuro (R-17 y R-14).
