# 4+1 · Vista de Procesos

**Pregunta que responde:** ¿Cómo colaboran y qué pasa en tiempo de ejecución?
**Audiencia:** Desarrolladores y QA.
**Fuente:** `docs/ES2/02-arquitectura-4mas1.md` §4.

Muestra el comportamiento en tiempo de ejecución: concurrencia, asincronía y tolerancia a fallos.

---

## Proceso 1 — Ingesta de medición y evaluación de alerta (E-1)

```mermaid
sequenceDiagram
    autonumber
    participant SIM as Dispositivo / simulador
    participant GW as Gateway IoT (API)
    participant VAL as Validador de esquema
    participant MED as Servicio de mediciones
    participant PG as PostgreSQL
    participant MG as MongoDB (crudo)
    participant MOT as Motor de reglas
    participant Q as Cola de notificación

    SIM->>GW: POST /api/v1/mediciones (X-Device-Key, JSON)
    GW->>GW: Autenticar dispositivo y resolver sensor
    GW->>VAL: Validar DTO (sensor, valor, unidad, timestamp)
    alt Timestamp futuro (> 5 min, RN-09) o datos inválidos
        VAL-->>SIM: 400/422 con detalle del campo
    else Datos válidos
        VAL->>MED: persistir(medicion)
        MED->>PG: INSERT en medicion (PARTICIÓN por fecha)
        MED->>MG: INSERT payload crudo (best-effort)
        MED->>MOT: evaluar(sensor, valor)
        MOT->>PG: SELECT reglas activas del sensor o tipo de variable
        alt Se viola umbral y no hay cooldown vigente
            MOT->>PG: INSERT alerta (abierta)
            MOT->>Q: encolar notificación (asíncrona)
            MOT-->>MED: alerta generada
        end
        MED-->>GW: 201 Created (id, alerta?)
        GW-->>SIM: 201 Created
    end
    Note over Q: El worker de notificación se ejecuta fuera de la ruta crítica (RA-05)
```

---

## Proceso 2 — Dashboard de estado actual (E-2)

```mermaid
sequenceDiagram
    autonumber
    participant U as Encargado
    participant WEB as SPA
    participant API as API de consultas
    participant CACHE as Caché (TTL 30 s)
    participant VW as Vista de última medición
    participant PG as PostgreSQL

    U->>WEB: Abre dashboard (sistema)
    WEB->>API: GET /api/v1/dashboard/estado?sistema_id=...
    API->>API: Autorizar (permiso estado:leer)
    API->>CACHE: get(clave)
    alt Caché vigente
        CACHE-->>API: datos
    else Sin caché
        API->>VW: consultar última medición por sensor
        VW->>PG: lectura indexada
        PG-->>VW: filas
        VW-->>API: filas
        API->>API: calcular frescura y semáforo por sensor
        API->>CACHE: set(clave, TTL 30 s)
    end
    API-->>WEB: { sensores[], alertasActivas, generadoEn }
    WEB-->>U: Tarjetas con valor, unidad, fecha/hora y alertas
```

---

## Proceso 3 — Histórico, exportación y comparación (E-3)

```mermaid
sequenceDiagram
    autonumber
    participant U as Encargado / Supervisor
    participant WEB as SPA
    participant API as API de históricos
    participant PG as PostgreSQL

    U->>WEB: Filtra rango, sistema(s), variables
    WEB->>API: GET /api/v1/mediciones/serie?desde&hasta&sensores[]&bucket=1h
    API->>API: Validar rango (máx. 90 días por consulta)
    API->>PG: SELECT date_trunc('hour', timestamp), avg, min, max GROUP BY
    PG-->>API: serie agregada
    API-->>WEB: series múltiples normalizadas (1 o varios sistemas)
    WEB-->>U: Gráfico comparativo + tabla paginada + exportar CSV
```

---

## Proceso 4 — Autenticación y autorización (E-4)

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuario
    participant WEB as SPA
    participant API as API de identidad
    participant PG as PostgreSQL

    U->>WEB: correo + contraseña
    WEB->>API: POST /api/v1/auth/login
    API->>PG: SELECT usuario + rol + permisos
    API->>API: Verificar bcrypt y estado activo
    alt Credenciales válidas
        API->>PG: Registrar intento exitoso (auditoría)
        API-->>WEB: access_token (15 min) + refresh en cookie HttpOnly
        WEB->>API: GET /api/v1/... (Authorization: Bearer)
        API->>API: Verificar firma, expiración y permiso requerido
        API-->>WEB: 200
    else Inválidas o cuenta bloqueada
        API->>PG: Incrementar contador de intentos
        API-->>WEB: 401 genérico
    end
```

---

## Proceso 5 — Sincronización tras pérdida de conectividad (E-5)

```mermaid
sequenceDiagram
    autonumber
    participant BUF as Buffer local / firmware
    participant GW as Gateway IoT
    participant MED as Servicio de mediciones
    participant PG as PostgreSQL
    participant AUD as Auditoría

    BUF->>BUF: Sin enlace: almacena mediciones con id_externo y timestamp de origen
    Note over BUF: Reintentos con backoff exponencial (NEC-06, HU10)
    BUF->>GW: POST /api/v1/mediciones/bulk (lote de hasta 500)
    GW->>MED: procesarLote()
    loop Por cada medición
        MED->>PG: INSERT ... ON CONFLICT (dispositivo_id, id_externo) DO NOTHING
    end
    MED->>AUD: registrar lote recibido (cantidad, aceptadas, duplicadas)
    MED-->>GW: 207 { aceptadas, duplicadas, rechazadas[] }
    GW-->>BUF: Confirmación parcial
    BUF->>BUF: Elimina del buffer solo lo confirmado
```

> La sincronización acepta **timestamps pasados** (RN-10) y conserva `origen = OFFLINE`, de modo que el histórico
> sigue siendo fiel a cuándo se midió, no a cuándo llegó.

---

## Proceso 6 — Detección de dispositivo sin comunicación (E-6)

```mermaid
sequenceDiagram
    autonumber
    participant CRON as Job programado (cada 5 min)
    participant DSV as Servicio de dispositivos
    participant PG as PostgreSQL
    participant AL as Servicio de alertas

    CRON->>DSV: evaluarSilencio()
    DSV->>PG: SELECT dispositivos con ultima_comunicacion > 3× intervalo
    PG-->>DSV: listado
    DSV->>PG: UPDATE estado_conexion = SIN_COMUNICACION
    DSV->>AL: registrar evento severidad ALTA
    AL->>PG: INSERT alerta (si no existe una abierta del mismo tipo)
```

---

## Proceso 7 — Publicación del contrato de API (E-7)

```mermaid
sequenceDiagram
    autonumber
    participant DEV as Desarrollador / app Android
    participant DOC as OpenAPI / Swagger UI

    DOC->>DOC: El pipeline genera el contrato desde los DTO y guardias
    DEV->>DOC: GET /api/docs (contrato versionado /api/v1)
    DOC-->>DEV: Endpoints, esquemas, códigos de error y ejemplos
    Note over DEV,DOC: El contrato se valida contra la app Android de prueba (HU11 CA3)
```
