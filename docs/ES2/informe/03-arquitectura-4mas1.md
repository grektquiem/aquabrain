# 03 · Arquitectura 4+1

El modelo **4+1** describe la arquitectura desde cinco puntos de vista complementarios: **escenarios**
(el que amarra todo), **lógica**, **procesos**, **desarrollo** y **física**. Cada vista responde una
pregunta distinta y se referencia con el catálogo corregido de ES1 (NEC-01…NEC-09, HU01…HU11,
RF01…RF15, RNF01…RNF11, CU-01…CU-16, RN-01…RN-12).

| Vista | Pregunta que responde | Audiencia | Sección |
|---|---|---|---|
| Escenarios | ¿Para qué sirve y qué flujos soporta? | Cliente y todo el equipo | §3.3 |
| Lógica | ¿Qué componentes y responsabilidades existen? | Desarrolladores | §3.4 |
| Procesos | ¿Cómo colaboran y qué pasa en tiempo de ejecución? | Desarrolladores y QA | §3.5 |
| Desarrollo | ¿Cómo se organiza el código y el trabajo? | Equipo | §3.6 |
| Física | ¿Dónde se ejecuta todo? | DevOps / infraestructura | §3.7 |

## 3.1. Restricciones arquitectónicas de entrada

Las restricciones **RA-01…RA-08** (cap. 01 §1.4), aquí con su justificación de arquitectura:

| ID | Restricción | Origen | Implicancia de arquitectura |
|---|---|---|---|
| RA-01 | Aceptar el formato del **firmware real ESP32-S3** | NEC-04, RF06, RN-11 | El contrato de ingesta se define desde el payload real (AHT10/HC-SR04) |
| RA-02 | API **versionada y documentada** | NEC-05, RF13, RNF08 | `/api/v1` + OpenAPI; la app Android es cliente de primera clase |
| RA-03 | **Aceptar timestamps pasados** y **rechazar futuros** | RN-09, RN-10, HU08, HU10 | Validación de tiempo explícita antes de persistir |
| RA-04 | No contradecir el **display OLED local** | RNF05, RN-12 | Una sola fuente de verdad para el estado |
| RA-05 | La ingesta no se bloquea por alertas ni por el crudo | RF06, RF11 | Ingesta síncrona mínima; evaluación y crudo fuera de la ruta crítica |
| RA-06 | Histórico **inmutable** y creciente | RN-02, NEC-09 | Tabla *append-only* particionada |
| RA-07 | Despliegue **reproducible** en Docker/PaaS | RNF07 | Contenedor sin estado + configuración por entorno |
| RA-08 | **Degradación controlada** y aviso de conexión | RNF02, RF14 | PostgreSQL es la fuente de verdad; externos *best-effort* |

## 3.2. Principio rector: monolito modular en capas

La decisión **D-02** fija una arquitectura **cliente-servidor en capas** con **módulos de dominio
cohesivos** (estilo *modular monolith*). El objetivo es doble: (1) mantener el dominio pequeño y
cohesionado, propio de un equipo de tres personas; y (2) dejar preparada la extracción futura de
servicios (p. ej. el módulo de ingesta) si la escala lo exige (NEC-09). **Regla de dependencia:** las
capas externas dependen de las internas, nunca al revés; el dominio no conoce HTTP, SQL ni MongoDB, por
lo que puede probarse de forma unitaria y pura (RNF06).

## 3.3. Vista de escenarios (casos de uso)

Los escenarios son los casos de uso de ES1 (**CU-01…CU-16**). Se destacan los que **atraviesan toda la
arquitectura**.

### 3.3.1. Escenarios arquitectónicamente significativos

| Escenario | Descripción | Componentes que atraviesa | Requisitos |
|---|---|---|---|
| **E-1 · Ingesta y alerta** | Un dispositivo reporta una medición; el sistema la valida, persiste, evalúa reglas y genera alerta | Gateway IoT → Servicio de mediciones → Motor de reglas → Repositorios → Cola de notificación | RF06, RF11, RF12, CU-06, CU-07, HU08 |
| **E-2 · Estado actual** | El encargado abre el dashboard y ve la última medición por sensor con frescura del dato | SPA → API de lectura → Servicio de consultas → Vista de última medición | RF07, CU-08, HU01 |
| **E-3 · Histórico y comparación** | El encargado filtra un rango y exporta; el supervisor compara varios sistemas | SPA → API de históricos → Agregación SQL y caché | RF08, RF09, CU-09, CU-10, HU02, HU04, RNF03 |
| **E-4 · Autenticación y autorización** | Un usuario inicia sesión y cada petición se autoriza por permiso | SPA → Servicio de identidad → Guardia de autorización → Repositorio de usuarios | RF01, RF02, CU-01, CU-02, HU05, RNF01 |
| **E-5 · Sincronización offline** | Tras una caída, el dispositivo reenvía un lote con timestamps originales | Buffer local → Gateway IoT → Servicio de mediciones (idempotente) → Motor de reglas | RF06, RF14, CU-14, HU10, RN-10 |
| **E-6 · Estado de conexión** | Se detecta un dispositivo que dejó de reportar y se refleja en dashboard y listado | Job programado → Servicio de dispositivos → Servicio de alertas | RF14, CU-13, RN-05 |
| **E-7 · Integración documentada** | El desarrollador de integraciones consume la API versionada desde la app Android | Cliente externo → OpenAPI `/api/docs` → Endpoints `/api/v1` | RF13, CU-15, HU11, RNF08 |

### 3.3.2. Diagrama de escenarios (actores y casos de uso)

```mermaid
flowchart LR
    EC(["Encargado de cultivo"])
    SUP(["Supervisor"])
    ADM(["Administrador"])
    DIS(["Dispositivo / simulador IoT"])
    DEV(["Desarrollador de integraciones"])

    subgraph SIS["AquaBrain Monitor"]
        CU01["CU-01 Iniciar / cerrar sesión"]
        CU02["CU-02 Usuarios y roles"]
        CU03["CU-03 Sistemas y cultivos"]
        CU04["CU-04 Dispositivos"]
        CU05["CU-05 Sensores y tipos de variable"]
        CU06["CU-06 Ingresar medición (individual/lote)"]
        CU07["CU-07 Evaluar regla y alertar"]
        CU08["CU-08 Estado actual"]
        CU09["CU-09 Históricos y exportar"]
        CU10["CU-10 Comparar sistemas"]
        CU11["CU-11 Reglas y probarlas"]
        CU12["CU-12 Gestionar alertas (resuelta)"]
        CU13["CU-13 Estado de conexión"]
        CU14["CU-14 Sincronizar tras corte"]
        CU15["CU-15 Documentación API"]
        CU16["CU-16 Licencias (fuera de alcance)"]
    end

    EC --> CU01 & CU08 & CU09 & CU12 & CU13
    SUP --> CU01 & CU09 & CU10 & CU13
    ADM --> CU01 & CU02 & CU03 & CU04 & CU05 & CU11
    DIS --> CU06 & CU14
    DEV --> CU15
    CU06 --> CU07
    CU14 --> CU07
    CU07 --> CU12
    CU16 -.->|"Won't por ahora"| ADM
```

> **Nota (UML):** todos los casos protegidos **`<<include>>` autenticarse** (CU-01); **CU-07** es un
> **`<<extend>>` de CU-06**, que a su vez puede derivar en CU-12 (resolver alerta). CU-16 se incluye
> solo para mostrar que el licenciamiento quedó **fuera de alcance** (*Won't por ahora*).

### 3.3.3. Cómo los escenarios justifican las decisiones

- **E-1** exige separar la **persistencia** de la **evaluación de reglas** y del **guardado crudo**
  (RA-05): el endpoint de ingesta responde `201` apenas el dato está validado y persistido.
- **E-2 y E-3** exigen una **vista de lectura optimizada** para "última medición" y **agregación en
  base de datos** (RA-06, RNF03), en lugar de traer miles de filas al backend.
- **E-4** exige que la autorización sea **declarativa por permiso** (`@RequirePermission`), no dispersa
  en controladores.
- **E-5** exige **idempotencia** con `(dispositivo_id, id_externo)` único (RA-06) y validación de tiempo
  (RA-03).
- **E-7** exige tratar el **contrato OpenAPI como parte del diseño** (D-13), no como documentación
  tardía.

## 3.4. Vista lógica

### 3.4.1. Capas

```mermaid
flowchart TB
    subgraph P["1 · Presentación"]
        WEB["SPA React<br/>dashboard, históricos, alertas, gestión"]
        SW["OpenAPI / Swagger UI"]
    end

    subgraph A["2 · Aplicación (casos de uso)"]
        AC1["Autenticación y sesión"]
        AC2["Gestión de dominio"]
        AC3["Ingesta de mediciones"]
        AC4["Consulta de estado e históricos"]
        AC5["Alertas y notificaciones"]
    end

    subgraph D["3 · Dominio"]
        EN["Entidades y reglas<br/>Medición · Alerta · Regla · Sensor · Dispositivo · Sistema"]
        SV["Servicios de dominio<br/>evaluarRegla() · calcularFrescura() · derivarEstadoConexion()"]
    end

    subgraph I["4 · Infraestructura"]
        REPO["Repositorios (Prisma)"]
        PG[("PostgreSQL")]
        MG[("MongoDB<br/>payload crudo")]
        MQ["Cola de trabajos<br/>BullMQ / Redis"]
        SEC["Hash bcrypt · JWT"]
        LOG["Logs y auditoría"]
    end

    WEB --> AC1 & AC2 & AC3 & AC4 & AC5
    SW --> AC1 & AC2 & AC3 & AC4 & AC5
    AC1 --> SV
    AC2 --> EN
    AC3 --> EN
    AC4 --> SV
    AC5 --> SV
    EN --> REPO
    SV --> REPO
    AC3 --> MG
    AC5 --> MQ
    REPO --> PG
    AC1 --> SEC
    AC2 & AC3 & AC5 --> LOG
```

### 3.4.2. Módulos y responsabilidades

| Módulo | Capa | Responsabilidad | Requisitos | Depende de |
|---|---|---|---|---|
| `auth` | Aplicación | Login, refresco, logout, hash **bcrypt**, emisión de JWT | RF01, RNF01 | `usuarios`, `seguridad` |
| `rbac` | Aplicación | Guardias por rol/permiso y matriz de autorización | RF01, RF02, RNF01 | `auth` |
| `usuarios` | Dominio/Infra | CRUD de usuarios y roles, bloqueo por intentos fallidos | RF01, RF02, HU05 | — |
| `sistemas` | Dominio/Infra | CRUD de sistemas/instalaciones y cultivos/plantas | RF03, NEC-01 | — |
| `dispositivos` | Dominio/Infra | CRUD de dispositivos y sensores, API keys, estado y última comunicación | RF04, RF05, RF14 | `sistemas` |
| `mediciones` | Aplicación | Ingesta individual y por lote, validación de tiempo/formato, idempotencia, *landing zone* y tablas relacionales | RF06 | `dispositivos`, `alertas` |
| `alertas` | Aplicación/Dominio | Motor de reglas, CRUD de reglas, generación y gestión de alertas, *cooldown* | RF10, RF11, RF12 | `mediciones`, `notificaciones` |
| `consultas` | Aplicación | Estado actual, históricos agregados, comparación multi-sistema, exportación CSV | RF07, RF08, RF09 | `mediciones` |
| `notificaciones` | Infra | Cola de trabajos, aviso en interfaz (extensión a correo/webhook opcional) | RF11 | `alertas` |
| `auditoria` | Infra | Registro de accesos y cambios críticos | RNF11, RF10, RF12 | — |
| `api-docs` | Presentación | Publicación del contrato OpenAPI versionado | RF13, RNF08 | — |

> `licencias` (RF15/HU09/CU-16) **no se implementa**: queda como *Won't por ahora* y supuesto `SUP-09`.

### 3.4.3. Modelo de dominio (clases conceptuales)

```mermaid
classDiagram
    class Sistema {
        +UUID id
        +string codigo
        +string nombre
        +estadoSistema estado
    }
    class Cultivo {
        +UUID id
        +string nombre
        +string especie
        +Date fechaInicio
        +estadoCultivo estado
    }
    class Dispositivo {
        +UUID id
        +string codigo
        +string firmware
        +int intervaloReporteSeg
        +Date ultimaComunicacion
        +estadoConexion estadoConexion
        +estaSinComunicacion(ahora) bool
    }
    class Sensor {
        +UUID id
        +string codigo
        +string unidad
        +float rangoMin
        +float rangoMax
        +bool activo
    }
    class TipoVariable {
        +UUID id
        +string codigo
        +string unidadDefecto
    }
    class Medicion {
        +UUID id
        +float valor
        +DateTime timestamp
        +DateTime recibidoEn
        +origen origen
        +string idExterno
        +validarRango() bool
        +esFresca(ahora, intervalo) bool
    }
    class Regla {
        +UUID id
        +operador operador
        +float umbralMin
        +float umbralMax
        +severidad severidad
        +int cooldownSeg
        +bool activa
        +probar(medicionSimulada) bool
        +evaluar(medicion) bool
    }
    class Alerta {
        +UUID id
        +severidad severidad
        +estadoAlerta estado
        +string mensaje
        +DateTime creadaEn
        +DateTime resueltaEn
        +marcarResuelta(usuario, comentario)
    }
    class Evento {
        +UUID id
        +tipoEvento tipo
        +severidad severidad
        +DateTime ocurridoEn
    }
    class Usuario {
        +UUID id
        +string email
        +string passwordHash
        +bool activo
    }
    class Rol {
        +UUID id
        +string nombre
    }

    Sistema "1" --> "0..*" Cultivo : alberga
    Sistema "1" --> "0..*" Dispositivo : instala
    Dispositivo "1" --> "0..*" Sensor : posee
    TipoVariable "1" --> "0..*" Sensor : clasifica
    Sensor "1" --> "0..*" Medicion : registra
    Regla "0..*" --> "0..1" Sensor : vigila
    Regla "0..*" --> "0..1" TipoVariable : vigila
    Regla "1" --> "0..*" Alerta : origina
    Medicion "0..1" --> "0..*" Alerta : dispara
    Dispositivo "1" --> "0..*" Evento : genera
    Usuario "0..*" --> "1" Rol : tiene
    Usuario "0..*" --> "0..*" Alerta : marca_resuelta
```

> **Nota de alcance (`SUP-05`):** ES1 define explícitamente `sistema → dispositivo → sensor`
> (RF03–RF05). Las entidades `Cultivo` y `Planta` **extienden NEC-01** para dar contexto agronómico,
> pero su cardinalidad real aún no está confirmada; se modelan de la forma más flexible.

## 3.5. Vista de procesos

### 3.5.1. Proceso 1 — Ingesta de medición y evaluación de alerta (E-1)

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

### 3.5.2. Proceso 2 — Dashboard de estado actual (E-2)

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

### 3.5.3. Proceso 3 — Histórico, exportación y comparación (E-3)

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

### 3.5.4. Proceso 4 — Autenticación y autorización (E-4)

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

### 3.5.5. Proceso 5 — Sincronización tras pérdida de conectividad (E-5)

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

> La sincronización acepta **timestamps pasados** (RN-10) y conserva `origen = OFFLINE`, de modo que el
> histórico sigue siendo fiel a cuándo se midió, no a cuándo llegó.

### 3.5.6. Proceso 6 — Detección de dispositivo sin comunicación (E-6)

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

### 3.5.7. Proceso 7 — Publicación del contrato de API (E-7)

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

## 3.6. Vista de desarrollo

### 3.6.1. Organización del código (monorepo — D-03)

```mermaid
flowchart TB
    subgraph ROOT["repositorio aquabrain-monitor"]
        subgraph APPS["apps/"]
            W["web/ — SPA React (Vite)"]
            A["api/ — NestJS (REST + Swagger)"]
            SIM["simulator/ — generador de mediciones"]
        end
        subgraph PKGS["packages/"]
            SH["shared/ — DTOs, tipos, enums, esquemas Zod"]
        end
        subgraph INFRA["infra/"]
            DC["docker-compose.yml"]
            IAC["render.yaml / vercel.json"]
            GH[".github/workflows/ci.yml"]
            MI["prisma/migrations + seed"]
        end
        subgraph DOCS["docs/"]
            E1["ES1/"]
            E2["ES2/"]
        end
    end
    A --> SH
    W --> SH
    SIM --> SH
    A --> MI
```

### 3.6.2. Convenciones de trabajo

| Aspecto | Definición |
|---|---|
| Estrategia de ramas | `main` (protegida, entregable) ← `develop` ← `feature/<id-hu>-<descripcion>` |
| Commits | Conventional Commits (`feat(mediciones): ingesta por lote`) referenciando `HU08` / `RF06` |
| Pull Request | Obligatorio, 1 aprobador distinto del autor, plantilla con checklist de seguridad y pruebas |
| Versionado | SemVer para la API (`/api/v1`) |
| Estilo | ESLint + Prettier + TypeScript `strict`; reglas compartidas en `packages/shared` |
| Documentación | ADR por decisión arquitectónica + README por app |

### 3.6.3. Cómo esta vista habilita el trabajo en equipo

- **Dos frentes paralelos** gracias a `packages/shared`: backend (API, motor de reglas, ingesta) y
  frontend (SPA contra tipos y DTOs acordados, con mocks) sin bloquearse.
- **CI única** que valida todo el monorepo en cada PR (lint, tests, build).
- **Módulos de dominio** con frontera clara permiten que cada integrante sea *owner* de un módulo.
- **Contrato OpenAPI primero**: el firmware y la app Android se integran contra un contrato estable.

### 3.6.4. Diagrama de componentes (vista de desarrollo — UML)

```mermaid
flowchart LR
    FW["Firmware ESP32-S3<br/>cliente IoT"] --> API
    APP["App Android<br/>cliente existente"] --> API
    WEB["Dashboard web<br/>React + Vite"] --> API
    subgraph API["API REST — NestJS (monolito modular)"]
        AUTH["AuthModule"]
        USR["UsuariosModule"]
        SYS["SistemasModule"]
        DEV["DispositivosModule"]
        MED["MedicionesModule"]
        RULE["ReglasModule"]
        ALERT["AlertasModule"]
    end
    MED --> RULE
    RULE --> ALERT
    API --> PG[("PostgreSQL<br/>datos de negocio")]
    API --> REDIS[("Redis<br/>caché y colas")]
    MED --> MONGO[("MongoDB<br/>zona de aterrizaje / logs")]
```

Los tres clientes consumen una **API REST única**: así el contrato `/api/v1` se mantiene estable para
web, Android y firmware (RA-02, D-13). Los módulos `MedicionesModule → ReglasModule → AlertasModule`
muestran la cadena de la decisión RA-05 (la evaluación de alertas no bloquea la respuesta de ingesta).

## 3.7. Vista física

### 3.7.1. Nodos y despliegue

```mermaid
flowchart TB
    subgraph USR["Dispositivos de usuario"]
        BR["Navegador (desktop / móvil)"]
        AND["App Android de prueba<br/>(cliente existente)"]
    end

    subgraph IOT["Campo"]
        ESP["AquaBrain ESP32-S3<br/>AHT10 · HC-SR04 · OLED SSD1309"]
        SIMN["Simulador de sensores<br/>envía lotes HTTPS"]
    end

    subgraph CLOUD["Nube (PaaS)"]
        subgraph FE["Nodo 1 · Frontend estático"]
            CDN["CDN + SPA (Vercel/Netlify)"]
        end
        subgraph BE["Nodo 2 · Contenedor API"]
            APIC["NestJS en Docker<br/>1..N réplicas"]
            WRK["Worker de notificaciones"]
        end
        subgraph DATA["Nodo 3 · Datos gestionados"]
            PGS["PostgreSQL gestionado<br/>+ pool de conexiones"]
            MGS["MongoDB Atlas<br/>payload crudo"]
            RDS["Redis gestionado<br/>caché y colas"]
        end
        subgraph OBS["Nodo 4 · Observabilidad"]
            LOGS["Logs estructurados + uptime"]
        end
    end

    BR -->|HTTPS| CDN
    AND -->|HTTPS /api/v1| APIC
    CDN -->|HTTPS /api/v1| APIC
    ESP -->|HTTPS + X-Device-Key| APIC
    SIMN -->|HTTPS + X-Device-Key| APIC
    APIC --> PGS
    APIC -.->|best-effort| MGS
    APIC --> RDS
    WRK --> RDS
    APIC --> LOGS
    WRK --> LOGS
```

### 3.7.2. Entornos

| Entorno | Propósito | Infraestructura | Datos |
|---|---|---|---|
| **Local** | Desarrollo diario | `docker-compose` (API + PostgreSQL + Redis + MongoDB) | Semilla (`seed`) + simulador |
| **Desarrollo/Staging** | Demo interna, pruebas de integración y de carga | PaaS gratuito, una réplica | Semilla ampliada (100 dispositivos) |
| **Producción académica** | Evaluación ES3/ES4 | PaaS, HTTPS, BD gestionada | Datos simulados cargados y respaldados |

### 3.7.3. Atributos de calidad por nodo

| Nodo | Atributo | Cómo se consigue |
|---|---|---|
| Frontend | Disponibilidad y rapidez de carga | CDN, *build* estático, *code splitting* |
| API | Rendimiento (RNF03) | Contenedor sin estado, escalado horizontal, caché Redis, paginación y agregación en BD |
| PostgreSQL | Integridad y capacidad de histórico | Particionado por fecha, índice `(sensor_id, timestamp)`, respaldos (RNF02) |
| MongoDB | Flexibilidad de payload y desacople (RA-05) | Escritura *best-effort*: si falla, la medición ya está en PostgreSQL |
| Redis | Latencia de consultas repetidas y asincronía | TTL corto en dashboard; cola BullMQ fuera de la ruta crítica (RA-05) |
| Observabilidad | Auditabilidad | Logs estructurados con `correlation-id`, alertas de uptime |
| App Android | Interoperabilidad sin cambios (RNF08) | Contrato `/api/v1` estable y versionado (SUP-10) |

## 3.8. Trazabilidad de la arquitectura con los requisitos

| Vista | Requisitos que satisface |
|---|---|
| Escenarios | RF01, RF02, RF03, RF06, RF07, RF08, RF09, RF11, RF12, RF13, RF14 |
| Lógica | RF01…RF14, RNF06, RNF08 |
| Procesos | RNF01, RNF02, RNF03, RNF05, RN-04, RN-05, RN-09, RN-10, RN-12 |
| Desarrollo | RNF06, RNF07, RNF08 |
| Física | RNF02, RNF03, RNF07, RNF08 |

> La verificación cruzada completa (NEC → HU → RF/RNF → CU → diseño → implementación → prueba) está en
> el capítulo 09.
