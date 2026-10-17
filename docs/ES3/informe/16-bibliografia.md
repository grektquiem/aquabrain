# 16 · Bibliografía

## 16.1 Documentación del proyecto

- **ES1 — Catálogo canónico corregido.** `docs/ES1/00-backlog-base.md` y `docs/ES1/01-correcciones-aplicadas.md`
  (necesidades, HU01–HU11, RF01–RF15, RNF01–RNF11, CU-01…CU-16, RN-01…RN-12).
- **ES2 — Diseño de la solución de software.** `docs/ES2/` (arquitectura 4+1, modelo de datos
  `aquaplants_schema.sql`, seguridad, plan de pruebas TS-01…TS-44 y trazabilidad).
- **ES3 — Implementación de la solución de software.** `docs/ES3/` (informe técnico 00–16 con la evidencia de
  ejecución) y este informe académico (`docs/ES3/informe/`).
- **Código fuente.** Repositorio local del proyecto (rama `main`): `apps/api`, `apps/web`, `apps/simulator`,
  `packages/shared`, `infra`, `.github`.
- **Evidencia de ejecución.** `docs/ES3/evidencia/` (rendimiento y simulador) y `docs/ES3/img/` (capturas del
  dashboard).

## 16.2 Documentación técnica de las tecnologías usadas

- NestJS. *Documentation*. https://docs.nestjs.com
- Prisma. *Prisma ORM Documentation* (v5). https://www.prisma.io/docs
- PostgreSQL Global Development Group. *PostgreSQL 16 Documentation*. https://www.postgresql.org/docs/16/
- React. *React Documentation*. https://react.dev
- Vite. *Vite Documentation*. https://vite.dev
- TanStack. *TanStack Query Documentation*. https://tanstack.com/query
- Recharts. *Recharts Documentation*. https://recharts.org
- Zod. *Zod Documentation*. https://zod.dev
- TypeScript. *TypeScript Handbook*. https://www.typescriptlang.org/docs/
- Node.js. *Node.js Documentation* (v20 LTS). https://nodejs.org/docs/latest-v20.x/
- OpenAPI Initiative. *OpenAPI Specification 3.0*. https://spec.openapis.org/oas/v3.0.3
- nginx. *nginx Documentation*. https://nginx.org/en/docs/
- Docker. *Docker Compose Documentation*. https://docs.docker.com/compose/
- GitHub. *GitHub Actions Documentation*. https://docs.github.com/actions
- Jest. *Jest Documentation*. https://jestjs.io
- Supertest. *Supertest Documentation*. https://github.com/ladjs/supertest

## 16.3 Seguridad y buenas prácticas

- OWASP Foundation. *OWASP Top 10 (2021)*. https://owasp.org/Top10/
- OWASP Foundation. *Application Security Verification Standard (ASVS)*. https://owasp.org/www-project-asvs/
- OWASP Foundation. *Password Storage Cheat Sheet* (bcrypt, factor de coste).
  https://cheatsheetseries.owasp.org
- OWASP Foundation. *REST Security Cheat Sheet*. https://cheatsheetseries.owasp.org
- IETF. *RFC 7519 — JSON Web Token (JWT)*. https://datatracker.ietf.org/doc/html/rfc7519
- Nielsen, J. *Usability Engineering*. Morgan Kaufmann (referencia de usabilidad, RNF05).

## 16.4 Normativa y estándares citados

- **Ley N.º 19.628** sobre protección de la vida privada (Chile).
- **Ley N.º 21.719** que moderniza la legislación de protección de datos personales (Chile).
- **ISO/IEC 25010** — modelo de calidad del producto de software (adecuación funcional, eficiencia de desempeño,
  seguridad, mantenibilidad, portabilidad).
- **Conventional Commits 1.0.0.** https://www.conventionalcommits.org
- **Semantic Versioning 2.0.0.** https://semver.org

## 16.5 Metodología

- Pressman, R. *Ingeniería del Software: un enfoque práctico*. McGraw-Hill.
- Sommerville, I. *Ingeniería de Software*. Pearson.
- Schwaber, K. y Sutherland, J. *La Guía de Scrum*. https://scrumguides.org
- Beck, K. et al. *Manifesto for Agile Software Development*. https://agilemanifesto.org

> Las referencias de software remiten a la documentación oficial vigente al momento de la implementación (2026).
> Los estándares (ISO/IEC 25010, Conventional Commits, SemVer) se citan como marco de referencia de las
> decisiones de calidad y de control de versiones descritas en el capítulo 08.
