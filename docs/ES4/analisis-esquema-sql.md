# Análisis del esquema SQL

Se analiza el DDL entregado (PostgreSQL 15+). El esquema es funcional para un MVP, pero presenta **desviaciones importantes** respecto al esquema implementado en Prisma (`apps/api/prisma/schema.prisma`) y respecto a las buenas prácticas de diseño aplicadas en el proyecto.

## 1. Comparación con el esquema implementado (Prisma)

| Aspecto | Esquema entregado | Esquema implementado (AquaBrain/Prisma) | Observación |
|---|---|---|---|
| **Claves primarias** | `SERIAL`/`BIGSERIAL` | `UUID` con `gen_random_uuid()` | El proyecto usa UUIDs (más seguros, fáciles de distribuir). El DDL usa IDs numéricos. |
| **Enumeraciones** | `CHECK` (`estado_conexion`, `condicion`, `severidad`, `estado`) | `enum` nativos de PostgreSQL (`EstadoConexion`, `TipoEvento`, `Severidad`, `EstadoAlerta`, etc.) | Prisma mapea enums a tipos nativos; el DDL usa CHECK (menos expresivo). |
| **Modelo de dominio** | Más simple (roles/permisos, licencia, sistema, cultivo, dispositivo, sensor, medición, regla, alerta, auditoría) | Más completo: incluye `Planta`, `TipoVariable`, `CultivoSensor`, `EstadoSensorActual`, `MedicionIdempotencia`, **`Evento`** | El esquema entregado omite entidades relevantes (planta, relación cultivo-sensor, estado actual, idempotencia de lote, eventos). |
| **Ingesta y sincronización offline** | No contempla idempotencia de lotes | `MedicionIdempotencia` (`idExterno`, índice único parcial) | Crucial para modo `offline` + `bulk` y evitar duplicados. Ausente en el DDL entregado. |
| **Estado de conexión/frescura** | `dispositivo.estado_conexion` (`conectado/sin_conexion/error`) + `ultima_conexion` | `dispositivo.estadoConexion` (enum: `EN_LINEA`, `SIN_COMUNICACION`, `INACTIVO`, `DESCONOCIDO`) + cálculo de **frescura en vivo** (3× intervalo) | El enfoque implementado separa el estado persistido del cálculo de «sin comunicación» (más robusto ante silencio temporal). |
| **Trazabilidad de eventos** | Solo `log_auditoria` | `Auditoria` + **`Evento`** (con `TipoEvento`, severidad, datos JSONB) | El modelo implementado distingue auditoría operativa de eventos de conectividad/operación del gateway. |
| **Tokens/refresh** | Ausente | `RefreshToken` (rotación, revocación) | Seguridad JWT reforzada (refresh con rotación). No presente en el DDL. |
| **Cultivo-sensor** | Ausente | `CultivoSensor` (muchos-a-muchos con metadata) | Permite relacionar sensores con cultivos activos y llevar contexto operacional. |
| **Índices** | Básicos (`idx_medicion_sensor_ts`, `idx_alerta_estado`, `idx_log_usuario_ts`) | Índices compuestos específicos (`idx_medicion_sensor_ts`, `idx_alerta_estado`, `idx_estado_sensor_actual`, etc.) | El esquema Prisma tiene índices más orientados a patrones de consulta del dashboard. |
| **Relaciones y borrado** | `ON DELETE CASCADE/SET NULL` coherentes | Restricciones similares; algunas `Restrict` para evitar pérdida accidental | Ambos razonables; Prisma prioriza integridad referencial. |

## 2. Fortalezas del DDL entregado

- **Claro y didáctico**: bloques bien organizados, nombres legibles, comentarios útiles.
- **Cobertura mínima**: cubre seguridad (roles/permisos), dominio, alertas y auditoría.
- **Restricciones CHECK**: validan dominios aunque no use enums.
- **Índices básicos**: cubren consultas más frecuentes.

## 3. Debilidades / Brechas

| Brecha | Impacto | Recomendación |
|---|---|---|
| **Falta idempotencia (`idExterno`)** | Riesgo de duplicados en sincronización offline/lotes | Añadir tabla de idempotencia o campo `id_externo` único en mediciones/bulk (como en Prisma). |
| **Sin soporte para bulk + offline** | No refleja el flujo real del simulador (modo `offline` → sincroniza lote) | Incorporar `origen` (ONLINE/OFFLINE/MANUAL) y estrategia de idempotencia. |
| **Estados de conexión simplificados** | Difícil expresar «SIN_COMUNICACION» vs «EN_LINEA» con precisión | Usar enum + cálculo de frescura; o añadir campos `ultima_lectura`, `intervalo_reporte_seg`. |
| **Falta `Evento`** | Pierde trazabilidad de eventos de conectividad (silencio/reconexión) | Añadir tabla `evento` (tipo, severidad, datos JSONB, `ocurrido_en`). |
| **Sin RefreshToken** | Menor robustez en rotación de tokens JWT | Añadir tabla `refresh_token` con `revocado`, `expira_en`, `token_hash`. |
| **Auditoría menos rica** | `log_auditoria.detalle` JSONB existe, pero sin separación Evento/Auditoria | Mantener separación conceptual (operacional vs. seguridad/auditoría). |
| **UUID vs SERIAL** | IDs secuenciales más predecibles | Considerar UUIDs si se prevé distribución/múltiples instancias. |

## 4. Conclusión

El DDL entregado es **adecuado como base MVP** y fácil de entender. Sin embargo, **no alcanza a cubrir los requisitos operativos reales** del flujo dispositivo→API (modo `offline`, idempotencia, frescura, eventos). El esquema **Prisma implementado** es más maduro y coherente con el contrato REST, el simulador y el dashboard.

**Veredicto:** El esquema SQL está **correcto y funcional**, pero **incompleto frente al diseño implementado**. Las diferencias son **deliberadas** (pragmatismo vs. completitud operacional) y están justificadas por el alcance del prototipo.