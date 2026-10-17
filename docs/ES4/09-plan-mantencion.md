# 9. Plan de Mantención

> **Naturaleza de esta sección.** El proyecto se entregó en **entorno de desarrollo**; el plan que sigue es una **propuesta** de mantención para su puesta en producción, no una descripción de algo ya ejecutado. Se apoya en las cifras medidas en el capítulo 7 y en las brechas declaradas en el capítulo 6.

## 9.1 Objetivo y enfoque

El plan busca que el sistema **siga funcionando y aportando valor** después de la entrega. Se organiza según las cuatro categorías de la norma **ISO/IEC 14764** (mantención **correctiva, adaptativa, perfectiva y preventiva**), con responsables, frecuencia y herramientas concretas.

## 9.2 Categorías de mantención

| Categoría | Definición | Ejemplo en AquaBrain |
|---|---|---|
| **Correctiva** | Corregir defectos | Un error de cálculo en la agrupación de series |
| **Adaptativa** | Ajustar a cambios del entorno | Actualizar NestJS 10 → 11; nuevo formato del firmware |
| **Perfectiva** | Mejorar sin corregir ni adaptar | Añadir superposición multi-sistema (RF09) en la UI |
| **Preventiva** | Reducir riesgo futuro | Respaldos, monitoreo, revisión de dependencias |

## 9.3 Actividades, frecuencia y responsable

| # | Actividad | Categoría | Frecuencia | Responsable | Herramienta |
|---|---|---|---|---|---|
| M-01 | Revisión de errores en bitácora de auditoría y logs | Correctiva | Semanal | Backend | `GET /auditoria`, logs |
| M-02 | Resolución de incidencias reportadas | Correctiva | Según evento | Equipo | GitHub Issues (a crear) |
| M-03 | Revisión de dependencias y parches de seguridad | Preventiva | Mensual | DevOps | `npm audit`, Dependabot |
| M-04 | Actualización de versión mayor (NestJS 11) | Adaptativa | Trimestral | Backend | `npm outdated` |
| M-05 | Actualización de PostgreSQL (parches 16.x) | Adaptativa | Según release | DevOps | Docker |
| M-06 | Verificación de respaldos y prueba de restauración | Preventiva | Mensual | DevOps | `pg_dump`, script de *restore* |
| M-07 | Revisión de cobertura y pruebas | Perfectiva | Por *release* | QA | `npm run test:cov` |
| M-08 | Revisión de rendimiento de endpoints clave | Preventiva | Mensual | Backend | script de medición (§7.3) |
| M-09 | Ampliación de funcionalidades del roadmap | Perfectiva | Por hito | Equipo | — |
| M-10 | Auditoría de accesibilidad y de privacidad | Preventiva | Semestral | Frontend | axe / Lighthouse / revisión |

## 9.4 Actualizaciones

- **Dependencias:** política de **actualización mensual de parches** y **trimestral de versiones mayores**. La prioridad inmediata es migrar a **NestJS 11**, que arrastra versiones parcheadas de las 66 dependencias transitivas con alerta de `npm audit` (§6.4).
- **Base de datos:** seguir las versiones **menores** de PostgreSQL 16.x; planificar 17.x con prueba de compatibilidad de Prisma.
- **Node.js:** mantener una versión **LTS** (hoy se verificó con Node v24.16.0).
- **Contrato API:** todo cambio incompatible exige **nueva versión** del prefijo (`api/v1` → `api/v2`) y actualización de `@aquabrain/shared` con su prueba de contrato.

## 9.5 Corrección de errores y gestión de incidentes

| Severidad | Descripción | Tiempo de respuesta objetivo | Tiempo de solución objetivo |
|---|---|---:|---:|
| **S1 — Crítica** | Ingesta caída o pérdida de datos | 1 hora | 8 horas |
| **S2 — Alta** | Alertas no generadas o panel sin datos | 4 horas | 24 horas |
| **S3 — Media** | Error funcional con solución alternativa | 1 día hábil | 5 días hábiles |
| **S4 — Baja** | Detalle estético o mejora menor | 5 días hábiles | Próximo *release* |

Cada incidencia se registra con: pasos de reproducción, resultado esperado, resultado obtenido, severidad y evidencia. El flujo es **reporte → triaje → corrección → prueba de regresión → cierre**.

## 9.6 Respaldos

| Aspecto | Propuesta |
|---|---|
| Frecuencia | **Diaria** (copia completa) + registro continuo de *log* (WAL) para recuperación al minuto |
| Herramienta | `pg_dump` (completo) y `pg_basebackup` / WAL (continuo) |
| Retención | 7 copias diarias, 4 semanales, 12 mensuales |
| Verificación | Restauración de prueba **mensual** (M-06) |
| Ubicación | Fuera del host de la base (almacenamiento de objetos) |
| Datos sensibles | Copias cifradas en reposo; el `.env` con secretos **no** se versiona |

## 9.7 Escalabilidad (criterios por umbral)

En lugar de particionar sin necesidad (RNF04 se declaró *Won't*), se fijan **umbrales medibles** que disparan cada acción:

| Señal observada | Umbral propuesto | Acción |
|---|---|---|
| Filas en `medicion` | > 50 000 000 | Evaluar **particionado mensual** por rango de `timestamp` |
| `GET /mediciones/serie` (p95) | > 2 000 ms sostenido | Revisar índices / vistas materializadas |
| Ráfagas de ingesta | > 100 lotes/s sostenido | Introducir **cola + workers** (motor de reglas asíncrono) |
| Sesiones concurrentes | > 500 | Escalar horizontalmente la API + **Redis** para estado compartido |
| Almacenamiento | > 80 % del volumen | Ampliar volumen / archivar históricos antiguos |

Hoy, con **52 230** filas, el p95 de la serie de un mes es **633,8 ms**: **no** se justifica particionar. Los umbrales evitan sobre-ingeniería mientras dan una ruta clara de crecimiento.

## 9.8 Monitoreo y observabilidad

- **Sonda de salud:** `/health` (ya implementada) para *liveness*/*readiness*.
- **Bitácora de auditoría:** ya registra operaciones sensibles; se consulta en `GET /auditoria`.
- **Añadir en producción:** recolección de métricas (Prometheus/Grafana o equivalente) y alertas sobre p95, tasa de error y uso de disco.
- **Alertas operativas:** notificar al equipo si S1/S2 ocurre fuera de horario.

## 9.9 Responsables (matriz RACI simplificada)

| Rol | Responsabilidad principal | A |
|---|---|---|
| **Backend** | API, motor de reglas, rendimiento de consultas | M-01, M-04, M-08 |
| **Frontend** | Dashboard, historias de interfaz, accesibilidad | M-10, RF09 |
| **DevOps / BD** | Contenedores, CI, respaldos, actualización de PostgreSQL | M-05, M-06 |
| **QA** | Pruebas, cobertura, regresión | M-07 |
| **Líder de proyecto** | Priorización del roadmap e incidentes | Todas |

*(A = accountable / aprueba. En un equipo de tres integrantes, los roles se combinan.)*

## 9.10 Herramientas y documentación

| Necesidad | Herramienta |
|---|---|
| Gestión de incidencias y roadmap | GitHub Issues / Projects (a habilitar con el remoto) |
| Integración continua | GitHub Actions (`.github/workflows/ci.yml`) |
| Pruebas y cobertura | Jest + Supertest + `coverage-combinado.js` |
| Calidad de dependencias | `npm audit`, Dependabot |
| Respaldos | `pg_dump`, `pg_basebackup` |
| Monitoreo | Prometheus + Grafana (a incorporar) |
| Documentación | Informes ES1–ES4 + README + OpenAPI |

## 9.11 Cronograma sugerido (primer trimestre)

```mermaid
flowchart LR
    S1["Semana 1<br/>Alta en producción<br/>+ respaldos"] --> S2["Semana 2-3<br/>Monitoreo<br/>+ npm audit"]
    S2 --> S3["Semana 4-6<br/>Upgrade NestJS 11<br/>+ regresión"]
    S3 --> S4["Semana 7-9<br/>RF09 UI<br/>+ accesibilidad"]
    S4 --> S5["Semana 10-12<br/>App Android<br/>+ carga real"]
```
