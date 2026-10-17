# 10 · Cobertura del plan de pruebas

> Indicador cubierto: **10** (cobertura del plan de pruebas: casos trazados a casos de uso, incluyendo borde y
> errores).

## 10.1 Estrategia ejecutada (y su ajuste respecto del plan de ES2)

El plan de ES2 definía varios niveles; la implementación ejecutó **dos de forma automatizada** (unitarias e
integración), **una con un script propio** (rendimiento) y **una de forma puntual** (interfaz), con un **cambio
de herramientas** que se declara con transparencia:

| Nivel | Plan ES2 | Ejecutado en ES3 | Estado |
|---|---|---|---|
| **Unitarias** | Jest (~60 % del total) | **Jest — 8 suites / 50 casos** | ✅ Ejecutado |
| **Integración** | Jest + Supertest + BD real (~30 %) | **Jest + Supertest + PostgreSQL — 9 suites / 75 casos** | ✅ Ejecutado |
| **Rendimiento** | **k6** (3 escenarios) | **Script HTTP propio** (25 repeticiones por endpoint) | 🟡 Ejecutado con otra herramienta |
| **Interfaz / E2E** | **Playwright** (5 flujos) | **Navegador automatizado** (recorrido puntual, sin suite versionada) | 🟡 Parcial |
| **Seguridad dinámica** | **OWASP ZAP** | **Pruebas propias** de seguridad (RBAC, validación, cabeceras) | 🟡 Ejecutado con otra herramienta |
| **Secretos** | **gitleaks** | **Revisión manual** de `.gitignore` y del primer commit | 🟡 Parcial |

> **Por qué cambió la herramienta.** El plan de ES2 cifró k6, Playwright, ZAP y gitleaks; la entrega los
> sustituyó por un **script HTTP propio** (para medir exactamente los endpoints de RNF03), por el **recorrido en
> navegador** ya descrito y por **pruebas de integración** de seguridad en lugar de un escáner. Es una
> **desviación de herramientas** (no de alcance funcional): las pruebas que verifican los requisitos **existen y
> se ejecutan**, solo que con herramientas distintas y, en el caso de la interfaz y los secretos, con menor
> automatización (recomendaciones R-09 y R-18 del capítulo 13).

La **pirámide de pruebas** quedó así: **50 unitarias** (lógica de dominio aislada) y **75 de integración** (API
+ base de datos + autenticación reales), más **3 mediciones de rendimiento** y **una verificación de interfaz**.

## 10.2 Trazabilidad de los casos: del catálogo al código

El catálogo ES2 define **TS-01…TS-44**. La implementación mantiene la trazabilidad **dentro del propio código**:
los archivos de prueba citan el identificador del caso (etiqueta `TS-xx`) en el nombre del test o en un
comentario. Esto hace la cobertura **verificable por inspección**: no hay que creer una tabla, se puede buscar
`TS-01` y encontrar la prueba.

| Suite | Casos | Casos `TS-xx` rastreados |
|---|---:|---|
| `reglas.engine.spec.ts` (U) | 11 | TS-01, TS-02, TS-04 |
| `all-exceptions.filter.spec.ts` (U) | 10 | TS-30, TS-31 |
| `permisos.guard.spec.ts` (U) | 7 | TS-16, TS-18 |
| `frescura.spec.ts` (U) | 6 | TS-07, TS-08, TS-09 |
| `validation.pipe.spec.ts` (U) | 5 | TS-21, TS-22 |
| `env.validation.spec.ts` (U) | 5 | (robustez de configuración) |
| `auditoria.interceptor.spec.ts` (U) | 3 | (auditoría transversal) |
| `tiempo.spec.ts` (U) | 3 | (validación temporal, RN-09/RN-10) |
| `gestion.e2e-spec.ts` (I) | 16 | TS-06, TS-12, TS-19, TS-21, TS-22 |
| `mediciones.e2e-spec.ts` (I) | 12 | TS-10, TS-11, TS-20, TS-22, TS-25, TS-30, TS-36, TS-41 |
| `rbac.e2e-spec.ts` (I) | 11 | TS-16, TS-17, TS-18, TS-19, TS-26 |
| `alertas.e2e-spec.ts` (I) | 9 | TS-03, TS-04, TS-05, TS-27, TS-33, TS-35, TS-37, TS-40 |
| `auth.e2e-spec.ts` (I) | 8 | TS-12, TS-13, TS-14, TS-15 |
| `historicos.e2e-spec.ts` (I) | 6 | TS-28, TS-38, TS-39 |
| `contrato.e2e-spec.ts` (I) | 5 | TS-42 |
| `limites.e2e-spec.ts` (I) | 1 | TS-13 |

La **cobertura de casos** (38 de 44 aprobados, 1 con hallazgo, 3 parciales y 2 no aplica) se detalla, caso por
caso, en el **capítulo 11**.

## 10.3 Cobertura de requisitos

La cobertura se evalúa también **sobre el catálogo de requisitos**, no solo sobre los casos:

| Conjunto | Cobertura |
|---|---|
| Requisitos **Must** con al menos una prueba | **100 %** |
| Requisitos **Should** con al menos una prueba | **100 %** (algunos con matiz declarado) |
| Requisitos *Could* (RF09) | Parcial (API sí, UI no) |
| Requisitos *Won't* (RF15, RNF04, RNF09) | No aplica (declarados) |

La correspondencia **historia de usuario → requerimiento → caso de prueba** está cerrada en el **capítulo 14**
(matriz de trazabilidad).

## 10.4 Casos de borde y de error cubiertos

El plan exige explícitamente cubrir **bordes** y **errores**, no solo el camino feliz. La evidencia por
temática:

| Temática | Casos |
|---|---|
| **Valores en el límite** | Valor **igual** al umbral no dispara (TS-03, `alertas`); valor **fuera de rango** se guarda como `SOSPECHOSA` (TS-07); rango `[6,3; 7,5]` con `6,1` (TS-02) |
| **Errores de datos** | Campo desconocido → `422` (TS-21); tipo incorrecto → `400/422` (TS-22); valor **no numérico** (TS-22); lote de **501** → `422`/`413` (TS-30) |
| **Errores de tiempo** | `timestamp` **futuro** → rechazado (TS-10); `timestamp` **pasado** → aceptado con su hora (TS-11); duplicados (TS-36, TS-41) |
| **Errores de autenticación** | Sin token → `401`; token expirado → `401` + refresco (TS-14); refresco reutilizado → revocación (TS-15); 5 intentos → bloqueo (TS-13) |
| **Errores de autorización** | Sin permiso → `403` (TS-16); IDOR → `403/404` (TS-17); autoeliminación → `403` (TS-19) |
| **Errores de protocolo** | Lote mixto con `207` y desglose (TS-36); cuerpo sobredimensionado → `413` (TS-30) |
| **Errores internos** | Excepción forzada → `500` genérico **sin** *stack trace* (TS-31) |

Cubrir estos casos fue decisivo: **varias pruebas de integración descubrieron defectos reales** (capítulo 13),
entre ellos el error de serialización de `BigInt` en la auditoría y el mal manejo de un `422` con cuerpo de
texto.

## 10.5 Cobertura de código medida (TS-44)

La cobertura se calcula sobre el **conjunto de pruebas completo** (unitarias + integración) fusionando los
mapas de Istanbul con `scripts/coverage-combinado.js`, y se compara contra un **umbral que bloquea**. Datos
reales (`coverage-summary.json`):

| Métrica | Valor medido | Umbral |
|---|---:|---:|
| **Líneas** | **92,26 %** (883/957) | 70 % |
| Sentencias | **91,09 %** | 70 % |
| Funciones | **89,49 %** | 60 % |
| Ramas | **69,01 %** | 60 % |

Módulos representativos (líneas / ramas):

| Módulo | Líneas | Ramas |
|---|---:|---:|
| `reglas.engine.ts` (motor de reglas) | **95,74 %** | 84,72 % |
| `mediciones.service.ts` (ingesta) | **93,98 %** | 72,54 % |
| `auth.service.ts` (autenticación) | **93,44 %** | 72,41 % |
| `dashboard/frescura.ts` (estado de conexión) | **100 %** | 100 % |
| `common/pipes/validation.pipe.ts` | **100 %** | 80 % |
| `common/guards/permisos.guard.ts` | **100 %** | 65,21 % |
| `common/filters/all-exceptions.filter.ts` | 89,06 % | 80 % |
| `alertas.service.ts` | 66,66 % | 46,15 % |
| `dispositivos.service.ts` | 65,45 % | 14,28 % |

La lectura es honesta: **los caminos críticos** (motor de reglas, ingesta, autenticación, validación, guardas)
están **por encima del 93 % de líneas**; los módulos con menor cobertura son de **gestión administrativa
secundaria** (`alertas.service`, `dispositivos.service`), cuyos caminos principales sí están cubiertos por las
suites de integración `gestion`, `alertas` y `rbac`.

## 10.6 Qué quedó fuera de la cobertura (declarado)

- **E2E con Playwright** (suite versionada): no existe; la interfaz se verificó de forma puntual (R-09).
- **k6**: sustituido por el script HTTP propio; los **escenarios mixtos** (20 % ingesta / 80 % lectura) y la
  **tasa de error bajo carga nominal** no se midieron (R-12).
- **TS-32 y TS-34** (caída de MongoDB/Redis): **no aplican** porque esos almacenes no se implementaron (D-04,
  D-07).
- **Análisis de dependencias (TS-24)** y **escaneo de secretos (TS-29)**: ejecutados de forma manual (no
  automatizada); su resultado se documenta en el capítulo 11.
- **Uptime ≥ 99 % en 8:00–20:00 (segunda parte de TS-44)**: no se midió un *uptime* sostenido (RNF02); la
  cobertura de pruebas **sí** se midió.

## 10.7 Síntesis del capítulo

El plan de pruebas está **cubierto y trazado**: **38 casos aprobados**, **1 con hallazgo**, **3 parciales** y
**2 no aplica** sobre los 44 del catálogo. La cobertura incluye explícitamente **bordes y errores** (límites de
umbral, timestamp futuro/pasado, campos inválidos, 401/403/413/422/500), y la **cobertura de código** supera el
umbral en las cuatro métricas, con foco en los caminos críticos. Las desviaciones de **herramienta** (k6,
Playwright, ZAP, gitleaks) y los casos no aplicables quedan **declarados**, no ocultos.
