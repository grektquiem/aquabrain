# 6. Evidencia de la Base de Datos

## 6.1 Motor y migraciones

La base de datos es **PostgreSQL 16** (contenedor `postgres:16`, versión 16.15) y se gestiona con **Prisma Migrate**. El esquema se aplicó mediante migraciones versionadas; actualmente hay una migración inicial registrada:

```text
migration_name          finished_at
20261016225855_init     2026-10-16 22:58:56 UTC
```

El esquema físico (modelos Prisma) consta de **19 modelos**:

```text
Rol · Permiso · RolPermiso · Usuario · RefreshToken · Auditoria ·
Sistema · Cultivo · Planta · Dispositivo · TipoVariable · Sensor ·
CultivoSensor · Medicion · MedicionIdempotencia · EstadoSensorActual ·
ReglaAlerta · Alerta · Evento
```

En la base hay **20 tablas** (`pg_tables`): los 19 modelos más la tabla de control `_prisma_migrations`.

## 6.2 Volumetría real

Conteos tomados directamente de PostgreSQL tras ejecutar todas las pruebas y corridas del simulador:

| Tabla | Filas | Nota |
|---|---:|---|
| `medicion` | **52 230** | Ver composición abajo |
| `auditoria` | 877 | Generadas por las pruebas y el uso |
| `medicion_idempotencia` | 2 030 | Claves de idempotencia registradas |
| `refresh_token` | 110 | Sesiones emitidas/revocadas |
| `rol_permiso` | 39 | Asignaciones permiso↔rol |
| `permiso` | 21 | Catálogo de permisos |
| `sensor` | 10 | 5 por dispositivo |
| `dispositivo` | 2 | `DEV-01`, `DEV-02` |
| `tipo_variable` | 5 | TEMPERATURA, HUMEDAD, PH, DISTANCIA, CAUDAL |
| `regla_alerta` | 4 | Reglas sembradas |
| `usuario` | 3 | Administrador, Supervisor, Encargado |
| `sistema` | 2 | Invernadero Norte y Sur |
| `cultivo` | 3 | Cultivos sembrados |
| `alerta` | 3 | 2 activas y 1 resuelta (tras la prueba de resolución) |

> Las filas de `sistema`, `dispositivo` y `sensor` corresponden a la **semilla**; los *tenants* temporales que crean las pruebas de integración se eliminan al terminar cada suite (RP-03, aislamiento entre pruebas), por lo que no quedan residuos.

## 6.3 Composición de la tabla de mediciones

El total de **52 230** mediciones se descompone así:

| Origen de las filas | Cantidad |
|---|---:|
| Semilla determinista (30 días × 10 min × 10 sensores) | 43 200 |
| Carga sintética para la prueba de volumen TS-43 | 7 000 |
| Lotes de rendimiento de escritura (4 × 500 lecturas por la API) | 2 000 |
| Ingesta del simulador (modos online/offline/anomalía) | 30 |
| **Total** | **52 230** |

Se verificó que la **calidad** y el **origen** se registran correctamente:

| `origen` | `calidad` | Filas |
|---|---|---:|
| ONLINE | OK | 50 220 |
| ONLINE | SOSPECHOSA | 2 |
| OFFLINE | OK | 2 008 |

Las **2** mediciones `SOSPECHOSA` son exactamente los valores fuera de rango inyectados por el simulador en el modo anomalía, lo que confirma que **no se descartan** (TS-07). Las 2 008 `OFFLINE` provienen del lote sincronizado del simulador (8) y de los lotes de rendimiento de escritura (2 000), enviados con `origen = OFFLINE`.

## 6.4 Índices y rendimiento

La tabla `medicion` tiene clave primaria compuesta `(id, timestamp)` y tres índices secundarios:

```text
medicion_pkey               UNIQUE btree (id, timestamp)
idx_medicion_sensor_ts      btree (sensor_id, "timestamp" DESC)
idx_medicion_dispositivo_ts btree (dispositivo_id, "timestamp" DESC)
idx_medicion_timestamp      btree ("timestamp")
```

El índice `idx_medicion_sensor_ts` es el que sostiene la consulta de series (HU04). Su efecto se midió con `EXPLAIN (ANALYZE, BUFFERS)` sobre la consulta real de agregación por *bucket* (`date_bin`):

```text
GroupAggregate  (actual time=1.523..1.945 rows=49 loops=1)
  ->  Sort  (actual time=1.479..1.513 rows=295 loops=1)
        ->  Bitmap Heap Scan on medicion  (actual time=1.214..1.342 rows=295)
              Recheck Cond: (sensor_id = ... AND "timestamp" >= ... AND "timestamp" <= ...)
              ->  Bitmap Index Scan on idx_medicion_sensor_ts  (actual time=1.175..1.176)
Planning Time: 1.624 ms
Execution Time: 2.217 ms
```

La consulta de dos días agregada por hora se resuelve en **≈2,2 ms** usando el índice, sobre una tabla de más de 50 000 filas. El detalle de rendimiento de la capa HTTP está en la sección 9 (TS-43).

## 6.5 Integridad y decisiones de diseño

- **Claves foráneas** con `ON DELETE RESTRICT` en `medicion → sensor` y `medicion → dispositivo`, para no perder historia.
- **Idempotencia** modelada en `medicion_idempotencia` (clave única por dispositivo + `id_externo`).
- **Estado actual por sensor** materializado en `estado_sensor_actual`, actualizado con la última lectura, mientras que la **frescura del dispositivo** se deriva en lectura (RN-05).
- **Sin particionado** de `medicion`: el DDL de ES2 proponía particiones por rango de fecha, pero RNF04 (escalabilidad masiva) quedó como *Won't* en el MoSCoW; con el volumen del prototipo los índices bastan. Se documenta la desviación en la sección 11 y la recomendación en la 12.

> **Nota de trazabilidad.** El esquema físico deriva del DDL de ES2 (`docs/ES2/aquaplants_schema.sql`), adaptado a Prisma. La correspondencia de nombres es directa (`medicion`, `sensor`, `dispositivo`, `regla_alerta`…).
