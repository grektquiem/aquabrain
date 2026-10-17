# Resumen ejecutivo

Esta es la **entrega de cierre (ES4)** del Proyecto Integrado. Mientras ES1 **diagnosticó** el problema, ES2 **diseñó** la solución y ES3 la **implementó y probó**, esta unidad **consolida y comunica** el resultado: reúne las funcionalidades construidas, las **mide**, las compara con el diagnóstico inicial, propone el **plan de mantención**, proyecta la **viabilidad** y prepara la **presentación y la defensa** del equipo.

No describe un sistema hipotético: describe el **sistema que ya está en el repositorio y que se ejecutó y probó**. Cada afirmación se respalda con evidencia de ejecución (pruebas, mediciones, consultas a la base de datos y capturas). Cuando algo **no** se midió o **no** se implementó, se declara explícitamente.

## Cifras de cierre

| Indicador | Valor real | Fuente |
|---|---:|---|
| Pruebas automatizadas en verde | **125** (50 unitarias + 75 de integración, 17 suites) | `npm test` / `npm run test:e2e` |
| Cobertura de líneas / sentencias / funciones | **92,26 % / 91,09 % / 89,49 %** | `npm run test:cov` (TS-44) |
| Rutas REST documentadas (OpenAPI 3) | **35** | `/api/docs` + prueba de contrato (TS-42) |
| Mediciones persistidas | **52 230** | `SELECT count(*) FROM medicion` |
| Latencia p50 del panel | **104,1 ms** | TS-43 (25 repeticiones) |
| Escritura por lote (500 lecturas) | **1 403 ms** de mediana (≈12× tras R-01) | `evidencia/perf-bulk.txt` |
| Permisos RBAC / roles | **21 / 3** | RBAC + suite `rbac` |
| Modelos de datos | **19** (20 tablas) | `schema.prisma` |

## Cobertura de los ocho aspectos evaluados en ES4

| # | Aspecto de la evaluación | Capítulo(s) | Evidencia principal |
|---|---|---|---|
| 1 | **Documentación final del proyecto** (valor, necesidades, alcance, arquitectura, tecnologías, funcionalidades, viabilidad) | 2 y 3 | Repositorio, informes ES1–ES3, `docs/ES4/` |
| 2 | **Funcionalidad y características** (demostración de los procesos principales) | 4 y 5 | Matriz de funcionalidades, flujo extremo a extremo, demo |
| 3 | **Normativas, estándares y claridad** | 6 | Estándares aplicados y no aplicados |
| 4 | **Plan de mantención** (actualizaciones, correcciones, respaldos, escalabilidad, responsables, frecuencias, herramientas) | 7 | ISO/IEC 14764; M-01…M-10 |
| 5 | **Presentación final** (diagnóstico → propuesta → diseño → implementación → resultados) | 8 | Narrativa y recursos visuales |
| 6 | **Presentación de resultados cuantificables** | 9 | Tablas y gráficos de métricas reales |
| 7 | **Exposición oral** | 10 | Guion por bloques y reparto |
| 8 | **Defensa y preguntas** (justificación de decisiones) | 11 | Banco de preguntas/respuestas y reparto por integrante |

## Regla de honestidad

Todo número de este informe proviene de una **ejecución real** y se declara su origen. Se distinguen con claridad tres categorías:

- **Medido:** resultados de pruebas, cobertura, latencias, volumetría y tamaños de artefactos.
- **Estimado:** costos y proyecciones económicas (se etiquetan como estimaciones de mercado, no como resultados del proyecto).
- **No ejecutado:** acciones previstas pero no realizadas en esta etapa (por ejemplo, escaneo externo con OWASP ZAP, pruebas de carga con k6, auditoría de accesibilidad con Lighthouse).

Lo que no se midió no se inventa: se declara como brecha y se acompaña de su mitigación en el plan de mantención (capítulo 7) y en las recomendaciones heredadas de ES3 (R-01…R-18).
