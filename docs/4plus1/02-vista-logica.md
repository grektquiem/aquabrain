# 4+1 · Vista Lógica

**Pregunta que responde:** ¿Qué componentes y responsabilidades existen?
**Audiencia:** Desarrolladores.
**Fuente:** `docs/ES2/02-arquitectura-4mas1.md` §3.

Arquitectura **en capas** con módulos de dominio cohesivos (estilo *modular monolith*), de modo que una futura
extracción a servicios sea mecánica si la escala lo exige (NEC-09).

---

## 1. Capas

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

> **Regla de dependencia:** las capas externas dependen de las internas, nunca al revés. El dominio no conoce HTTP,
> SQL ni MongoDB: por eso puede probarse de forma unitaria y pura (RNF06).

---

## 2. Módulos y responsabilidades

| Módulo | Capa | Responsabilidad | Requisitos | Depende de |
|---|---|---|---|---|
| `auth` | Aplicación | Login, refresco, logout, hash **bcrypt**, emisión de JWT | RF01, RNF01 | `usuarios`, `seguridad` |
| `rbac` | Aplicación | Guardias por rol/permiso y matriz de autorización | RF01, RF02, RNF01 | `auth` |
| `usuarios` | Dominio/Infra | CRUD de usuarios y roles, bloqueo por intentos fallidos | RF01, RF02, HU05 | — |
| `sistemas` | Dominio/Infra | CRUD de sistemas/instalaciones y cultivos/plantas | RF03, NEC-01 | — |
| `dispositivos` | Dominio/Infra | CRUD de dispositivos y sensores, API keys, estado y última comunicación | RF04, RF05, RF14 | `sistemas` |
| `mediciones` | Aplicación | Ingesta individual y por lote, validación de tiempo/formato, idempotencia, escritura en *landing zone* y tablas relacionales | RF06 | `dispositivos`, `alertas` |
| `alertas` | Aplicación/Dominio | Motor de reglas, CRUD de reglas, generación y gestión de alertas, *cooldown* | RF10, RF11, RF12 | `mediciones`, `notificaciones` |
| `consultas` | Aplicación | Estado actual, históricos agregados, comparación multi-sistema, exportación CSV | RF07, RF08, RF09 | `mediciones` |
| `notificaciones` | Infra | Cola de trabajos, aviso en interfaz (extensión a correo/webhook opcional) | RF11 | `alertas` |
| `auditoria` | Infra | Registro de accesos y cambios críticos | RNF11, RF10, RF12 | — |
| `api-docs` | Presentación | Publicación del contrato OpenAPI versionado | RF13, RNF08 | — |

> `licencias` (RF15/HU09/CU-16) **no se implementa**: queda como *Won't por ahora* (supuesto `SUP-09`).

---

## 3. Modelo de dominio (clases conceptuales)

```mermaid
classDiagram
    class Sistema {
        +UUID id
        +string codigo
        +string nombre
        +string ubicacion
        +EstadoSistema estado
    }
    class Cultivo {
        +UUID id
        +string nombre
        +string especie
        +Date fechaInicio
        +Date fechaFinEstimada
        +EstadoCultivo estado
        +int fotoperiodoHoras
    }
    class Planta {
        +UUID id
        +string codigo
        +string posicion
        +EstadoPlanta estado
    }
    class Dispositivo {
        +UUID id
        +string codigo
        +string modelo
        +string firmware
        +int intervaloReporteSeg
        +Date ultimaComunicacion
        +EstadoConexion estadoConexion
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
        +string nombre
        +string unidadDefecto
    }
    class Medicion {
        +UUID id
        +float valor
        +string unidad
        +DateTime timestamp
        +DateTime recibidoEn
        +Origen origen
        +string idExterno
        +validarRango() bool
        +esFresca(ahora, intervalo) bool
    }
    class Regla {
        +UUID id
        +Operador operador
        +float umbralMin
        +float umbralMax
        +Severidad severidad
        +int cooldownSeg
        +bool activa
        +probar(medicionSimulada) bool
        +evaluar(medicion) bool
    }
    class Alerta {
        +UUID id
        +Severidad severidad
        +EstadoAlerta estado
        +string mensaje
        +DateTime creadaEn
        +DateTime resueltaEn
        +marcarResuelta(usuario, comentario)
    }
    class Evento {
        +UUID id
        +TipoEvento tipo
        +Severidad severidad
        +string descripcion
        +DateTime ocurridoEn
    }
    class Usuario {
        +UUID id
        +string nombre
        +string email
        +string passwordHash
        +bool activo
    }
    class Rol {
        +UUID id
        +string nombre
        +string descripcion
    }

    Sistema "1" --> "0..*" Cultivo : alberga
    Cultivo "1" --> "0..*" Planta : contiene
    Sistema "1" --> "0..*" Dispositivo : instala
    Dispositivo "1" --> "0..*" Sensor : posee
    TipoVariable "1" --> "0..*" Sensor : clasifica
    Sensor "1" --> "0..*" Medicion : registra
    Regla "0..*" --> "0..1" Sensor : vigila
    Regla "0..*" --> "0..1" TipoVariable : vigila
    Regla "1" --> "0..*" Alerta : origina
    Medicion "0..1" --> "0..*" Alerta : dispara
    Dispositivo "1" --> "0..*" Evento : genera
    Cultivo "0..*" --> "0..*" Sensor : se monitorea con
    Usuario "0..*" --> "1" Rol : tiene
    Usuario "0..*" --> "0..*" Alerta : marca_resuelta
```

> **Nota de alcance (`SUP-05`):** ES1 define `sistema → dispositivo → sensor` (RF03–RF05). Las entidades `Cultivo` y
> `Planta` **extienden NEC-01** para dar contexto agronómico, pero su cardinalidad real aún no está confirmada.
