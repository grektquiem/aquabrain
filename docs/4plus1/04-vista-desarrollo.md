# 4+1 · Vista de Desarrollo

**Pregunta que responde:** ¿Cómo se organiza el código y el trabajo?
**Audiencia:** Equipo.
**Fuente:** `docs/ES2/02-arquitectura-4mas1.md` §5.

---

## 1. Organización del código (monorepo)

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

---

## 2. Diagrama de componentes (UML)

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

Los tres clientes consumen una **API REST única**: así el contrato `/api/v1` se mantiene estable para web, Android y
firmware (RA-02, D-13). Los módulos `MedicionesModule → ReglasModule → AlertasModule` muestran la cadena de la
decisión RA-05 (la evaluación de alertas no bloquea la respuesta de ingesta).

---

## 3. Convenciones de trabajo

| Aspecto | Definición |
|---|---|
| Estrategia de ramas | `main` (protegida, entregable) ← `develop` ← `feature/<id-hu>-<descripcion>` |
| Commits | Conventional Commits (`feat(mediciones): ingesta por lote`) referenciando `HU08` / `RF06` |
| Pull Request | Obligatorio, 1 aprobador distinto del autor, plantilla con checklist de seguridad y pruebas |
| Versionado | SemVer para la API (`/api/v1`) |
| Estilo | ESLint + Prettier + TypeScript `strict`; reglas compartidas en `packages/shared` |
| Documentación | ADR por decisión arquitectónica + README por app |

---

## 4. Cómo esta vista habilita el trabajo en equipo

- **Dos frentes paralelos** gracias a `packages/shared`: backend y frontend pueden avanzar contra tipos ya acordados (con mocks) sin bloquearse.
- **CI única** que valida todo el monorepo en cada PR (lint, tests, build), evitando "funciona en mi máquina".
- **Módulos de dominio** permiten que cada integrante sea *owner* de un módulo con frontera clara.
- **Contrato OpenAPI primero**: el firmware y la app Android se integran contra un contrato estable (RA-02, RNF08).
