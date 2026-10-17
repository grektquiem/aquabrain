# 6. Estándares, Normativas y Buenas Prácticas

Esta sección declara **qué estándares se aplicaron de verdad** y **cuáles no**, con la misma regla de honestidad del resto del informe. Una buena práctica *declarada en el borrador* pero no ejecutada se marca como tal.

## 6.1 Estándares aplicados

| Área | Estándar / norma | Aplicación real en el proyecto | Estado |
|---|---|---|:--:|
| Seguridad web | **OWASP Top 10 (2021)** | Mitigaciones de A01 (control de acceso), A02 (criptografía), A03 (inyección), A07 (auth) implementadas: RBAC, bcrypt, validación *whitelist*, ORM parametrizado | ✅ *(sin escaneo externo)* |
| Seguridad API | **OWASP ASVS** | Validación de entrada, autenticación de usuario y de dispositivo, autorización por permiso, auditoría | ✅ *(subconjunto)* |
| Autenticación | **RFC 7519 (JWT)** | Access token (15 min) + refresh token (7 días) con rotación y revocación | ✅ |
| Contraseñas | **bcrypt (OWASP Password Storage)** | Factor de coste **12**; comparación de tiempo constante ante usuario inexistente | ✅ |
| Contrato API | **OpenAPI 3.0** | 35 rutas en `/api/docs`; **prueba de contrato** OpenAPI ↔ `@aquabrain/shared` (TS-42) | ✅ |
| Lenguaje | **TypeScript (modo `strict`)** | Tipado del contrato en API, dashboard y simulador | ✅ |
| Validación de datos | **Zod** | Esquemas compartidos como fuente única del contrato | ✅ |
| Commits | **Conventional Commits** | Mensajes `feat(api):`, `docs(es3):`, `perf(api):`… | ✅ |
| Control de versiones | **Git** | Rama `main`; historial local de 12 incrementos | ✅ *(local)* |
| Contenedores | **OCI / Docker** | `infra/docker-compose.yml`, `api.Dockerfile`, `web.Dockerfile` | ✅ |
| Integración continua | **GitHub Actions** | `.github/workflows/ci.yml` (jobs `calidad` y `web`) | ✅ |
| Protección de datos | **Ley 19.628 y Ley 21.719 (Chile)** | Minimización (correo y nombre), hashing, auditoría de operaciones | 🟡 *(sin retención automatizada)* |
| Accesibilidad | **WCAG 2.1 nivel AA** | CSS responsive, foco visible y etiquetas en controles | 🟡 *(no auditado)* |
| Referencias | **APA 7.ª edición** | Bibliografía de este informe | ✅ |

> **Accesibilidad y protección de datos, con precisión.** El borrador citaba «Lighthouse 94/100» y «WCAG verificado». **No se ejecutó Lighthouse** ni una auditoría WCAG: se aplicaron criterios básicos (contraste de la paleta, foco visible, textos alternativos) y se declara como pendiente la auditoría formal. En privacidad ocurre igual: la minimización y el *hash* existen, pero **no** hay una política de retención/anonimización automatizada.

## 6.2 Buenas prácticas de ingeniería

| Práctica | Implementación real | Evidencia |
|---|---|---|
| Tipado estricto y verificación de tipos | `tsc --noEmit` en la CI | `.github/workflows/ci.yml` |
| Validación de entrada en el borde | *pipe* global `whitelist` + `forbidNonWhitelisted` | Suites `mediciones` y `gestion` (TS-21, TS-22) |
| Integración continua | GitHub Actions en cada *push* y *pull request* | Job `calidad` (migrar + sembrar + `test:cov` + umbral) |
| Pruebas automatizadas | **125** pruebas (50 unitarias + 75 de integración) | `npm run test:cov` |
| Umbral de cobertura que rompe el build | `scripts/coverage-combinado.js` | Falla si no se alcanza el umbral (TS-44) |
| Documentación viva | README raíz + OpenAPI + informes ES1–ES4 | Repositorio |
| Secretos fuera del código | `.env` en `.gitignore`; `.env.example` versionado | Verificación previa al primer *commit* |
| Migraciones versionadas | **Prisma Migrate** (`20261016225855_init`) | `_prisma_migrations` |
| Despliegue reproducible | Docker Compose + variables de entorno | `docker compose config` → *exit 0* |
| Auditoría de dependencias | `npm audit` ejecutado manualmente | 66 vulnerabilidades transitivas (§6.4) |

### Prácticas declaradas en el borrador que **no** se ejecutaron

| Práctica del borrador | Realidad | Motivo |
|---|---|---|
| **Revisión de código con PR obligatorio** | **No hubo PR**; historial local de 13 *commits* (12 de entrega + 1 de cierre) | Sin repositorio remoto (§12) |
| **Lint automático con Ruff + Bandit** | **No aplica**: son herramientas de Python; el proyecto es TypeScript. ESLint/Prettier están **declarados como dependencia** pero **sin archivo de configuración** ni ejecución en CI | El análisis estático efectivo es `tsc --noEmit` |
| **`pip-audit` / `npm audit` en cada CI** | `npm audit` se ejecuta **manualmente**, no en el pipeline | Se documenta el resultado (§6.4) |

> Estas tres brechas se retoman en el capítulo 10 (viabilidad) y en el capítulo 12 (defensa), y se proponen como trabajo futuro.

## 6.3 Claridad en la comunicación

Para la presentación y la defensa se aplican estas pautas:

- **Mensaje estructurado:** diagnóstico → propuesta → diseño → implementación → resultados.
- **Lenguaje adaptado:** los términos técnicos se explican brevemente para una audiencia mixta (técnica y de negocio).
- **Recursos visuales:** diagramas de arquitectura y flujo, capturas del dashboard y gráficos de resultados.
- **Demo en vivo:** el flujo completo, desde una medición simulada hasta la alerta y el panel (§5).
- **Métricas concretas:** tiempos medidos, cobertura y pruebas en verde (§7), evitando cifras de relleno.

## 6.4 Auditoría de dependencias (real)

```text
$ npm audit
66 vulnerabilidades (4 low, 16 moderate, 45 high, 1 critical)
```

Las 66 alertas corresponden a **dependencias transitivas** del ecosistema NestJS 10 (no a código propio). Se documentan por transparencia; la acción recomendada es planificar la actualización mayor a NestJS 11, que arrastra versiones parcheadas de esas transitivas.
