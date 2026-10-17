# 12 · Bibliografía

Las referencias se presentan en formato **APA 7.ª edición**. Se distinguen las **fuentes del proyecto**
(documentos entregados por la empresa o el docente), los **documentos internos** del equipo, las
**referencias de arquitectura y buenas prácticas** y las **fuentes técnicas de las tecnologías**
utilizadas. Cuando un dato no pudo confirmarse con la contraparte, se declaró como **supuesto** en lugar
de presentarse como un hecho.

## 12.1. Fuentes del proyecto

AquaPlants / AquaBrain — Robotic Systems. (2026). *Desafío para estudiantes de 4.º semestre: Plataforma
web de monitoreo y gestión de cultivos aeropónico (AquaPlants / AquaBrain)*, rev. 1 [Documento del
desafío]. Incluye contexto, actores, dominio, MVP, restricciones, escala esperada y antecedentes base.

Brun Ruth, A. V. (2026). *Material técnico y datasets – Proyectos AZA y AQUAPLANTS* [Comunicación
institucional]. Antecedentes de firmware (ESP32-S3), sensores (AHT10, HC-SR04) y app Android de prueba.

INACAP. (2026). *Evaluación 2 — Unidad 2 (Sumativa): Diseño de la solución de software (ES2)*
[Instrumento de evaluación y rúbrica]. Indicadores 2.1.1.1 a 2.1.6.15.

INACAP. (2026). *Corrección 1ª evaluación (correcion 1eval1)* [Retroalimentación docente]. Ajustes de
priorización MoSCoW, comparación de metodologías, impacto ético, unificación de códigos y decisión de
licenciamiento.

INACAP. (2026). *Corrección 2ª evaluación (correcion 2eval1)* [Retroalimentación docente]. Ampliación
de criterios de aceptación, matriz MoSCoW de requisitos y RNF11.

INACAP. (2026). *Ajuste del borrador ES2* [Retroalimentación docente]. Cierre de brechas hacia el nivel
«Destacado» (ceremonias con fechas, matriz de dependencias, diagramas de componentes, ejemplos
SQL/NoSQL, MFA/rotación de credenciales, catálogo extendido de pruebas y banco de preguntas).

## 12.2. Documentos internos del proyecto

Equipo de proyecto. (2026). *ES1 — Catálogo base consolidado (versión corregida)*
(`docs/ES1/00-backlog-base.md`) [Documento interno]. Fuente de verdad de identificadores NEC, HU, RF,
RNF, CU y RN.

Equipo de proyecto. (2026). *ES1 — Correcciones aplicadas* (`docs/ES1/01-correcciones-aplicadas.md`)
[Documento interno]. Trazabilidad del feedback C-01…C-08.

Equipo de proyecto. (2026). *ES1 — Informe académico: Diagnóstico del problema informático*
(`docs/ES1/informe/`) [Documento interno]. Insumo directo del presente diseño.

Equipo de proyecto. (2026). *ES2 — Documentos técnicos de diseño* (`docs/ES2/00-…` a `docs/ES2/11-…`)
[Documentos internos]. Metodología y cronograma, arquitectura 4+1, stack, wireframes, modelo de datos,
seguridad, plan de pruebas, trazabilidad, feedback y banco de defensa.

Equipo de proyecto. (2026). *ES2 — Esquema físico de referencia*
(`docs/ES2/aquaplants_schema.sql`) [Documento interno]. DDL ejecutable (PostgreSQL 15+).

## 12.3. Arquitectura, ingeniería de software y buenas prácticas

Kruchten, P. (1995). The 4+1 view model of architecture. *IEEE Software, 12*(6), 42–50.
https://doi.org/10.1109/52.469759

Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.).
Addison-Wesley.

Pressman, R. S., & Maxim, B. R. (2020). *Ingeniería del software: Un enfoque práctico* (9.ª ed.).
McGraw-Hill.

Sommerville, I. (2016). *Software engineering* (10.ª ed.). Pearson.

Cohn, M. (2004). *User stories applied: For agile software development*. Addison-Wesley.

Schwaber, K., & Sutherland, J. (2020). *La Guía de Scrum: La guía definitiva de Scrum*.
https://scrumguides.org/

Anderson, D. J. (2010). *Kanban: Successful evolutionary change for your technology business*. Blue
Hole Press.

International Organization for Standardization. (2011). *ISO/IEC 25010:2011 — Systems and software
engineering: Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software
quality models*. ISO.

Fowler, M. (2002). *Patterns of enterprise application architecture*. Addison-Wesley.

Nielsen, J. (1994). *Usability engineering*. Morgan Kaufmann.

## 12.4. Seguridad, privacidad y accesibilidad

OWASP Foundation. (2021). *OWASP Top 10:2021 — The ten most critical web application security risks*.
https://owasp.org/Top10/

OWASP Foundation. (2021). *Application Security Verification Standard (ASVS) 4.0*.
https://owasp.org/www-project-application-security-verification-standard/

Shostack, A. (2014). *Threat modeling: Designing for security*. Wiley. (Origen del modelo STRIDE.)

W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. World Wide Web Consortium.
https://www.w3.org/TR/WCAG21/

Ministerio Secretaría General de la Presidencia. (1999). *Ley N.º 19.628 sobre protección de la vida
privada* [Chile]. Biblioteca del Congreso Nacional de Chile. https://www.bcn.cl/leychile

Ministerio de Economía, Fomento y Turismo. (2024). *Ley N.º 21.719 que regula la protección y el
tratamiento de los datos personales* [Chile]. Biblioteca del Congreso Nacional de Chile.
https://www.bcn.cl/leychile

## 12.5. Fuentes técnicas de las tecnologías empleadas

OpenAPI Initiative. (2021). *OpenAPI Specification v3.0.3*. https://spec.openapis.org/oas/v3.0.3

NestJS. (2024). *NestJS documentation*. https://docs.nestjs.com/

Prisma. (2024). *Prisma ORM documentation*. https://www.prisma.io/docs/

The PostgreSQL Global Development Group. (2024). *PostgreSQL 16 documentation: Table partitioning*.
https://www.postgresql.org/docs/16/ddl-partitioning.html

MongoDB. (2024). *MongoDB manual: Time series and TTL collections*. https://www.mongodb.com/docs/

Redis. (2024). *Redis documentation*. https://redis.io/docs/

Meta Open Source. (2024). *React documentation*. https://react.dev/

Vite. (2024). *Vite guide*. https://vite.dev/guide/

Grafana Labs. (2024). *k6 documentation*. https://grafana.com/docs/k6/

Microsoft. (2024). *Playwright documentation*. https://playwright.dev/

---

> **Nota sobre fuentes.** Las cifras y decisiones de este informe provienen de los documentos del
> proyecto, de los documentos internos del equipo y de las fuentes externas aquí listadas. Cuando un
> dato no pudo confirmarse con la contraparte, se declaró como **supuesto** (cap. 01 §1.6 y cap. 10
> §10.1) en lugar de presentarse como un hecho, y lo no ejecutado se declaró explícitamente como
> **diseño pendiente de implementación (ES3)**.
