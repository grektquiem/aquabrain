# 13. Trazabilidad HU → RF → Implementación → Prueba

Esta matriz conecta cada **historia de usuario (HU)** con sus **requisitos funcionales (RF)**, el **código que los implementa** y la **prueba que los verifica**. Es la cadena que permite afirmar que un requisito está cubierto y localizar rápidamente dónde.

## 13.1 Matriz principal

| HU | RF | Implementación (ruta principal de código) | Prueba que lo verifica | Estado |
|---|---|---|---|---|
| **HU01** — Dashboard con estado actual | RF07 | `apps/api/src/modules/dashboard/` · `GET /dashboard/estado` · `apps/web/src/paginas/Panel.tsx` | Verificación en navegador (§4.5); suite `salud` (dominio) | ✅ |
| **HU02** — Histórico por rango de fechas | RF08 | `mediciones.service.ts` (`serie`) · `GET /mediciones/serie` · `GET /mediciones/exportar.csv` · `Historicos.tsx` | Suite `historicos` (6), TS-38/39; UI verificada | ✅ |
| **HU03** — Alertas automáticas y resolución | RF11, RF12 | `reglas/reglas.engine.ts` · `alertas/` · `POST /alertas/{id}/resolver` · `Alertas.tsx` | Suites `alertas` (9) y `reglas.engine.spec` (11); resolución en UI (3→2) | ✅ |
| **HU04** — Comparar varios sistemas | RF09 | `GET /mediciones/serie` (acepta varios `sensores`) | Suite `historicos` (consulta múltiple) | 🟡 UI sin superposición |
| **HU05** — Gestionar usuarios y roles | RF01, RF02 | `auth/`, `usuarios/`, `PermisosGuard`, `@RequierePermiso` | Suites `auth` (8), `rbac` (11), `gestion` (16) | ✅ |
| **HU06** — Registrar sistemas, dispositivos y sensores | RF03, RF04, RF05 | `sistemas/`, `dispositivos/`, `sensores/`, `catalogos/` | Suite `gestion` (16), TS-19/TS-20 | ✅ |
| **HU07** — Reglas y umbrales configurables | RF10 | `reglas/` · `POST /reglas/probar/simulacion` | Suite `gestion`; `reglas.engine.spec`; TS-06 | ✅ |
| **HU08** — Enviar mediciones por API | RF06 | `mediciones/` · `POST /mediciones` · `POST /mediciones/bulk` · `apps/simulator/` | Suite `mediciones` (12); simulador (§5) | ✅ |
| **HU09** — Suscripciones y licencias | RF15 | — | — | ⬜ *Won't* |
| **HU10** — Almacenar offline y reintentar | RF06, RF14 | `apps/simulator` (búfer e idempotencia) · `medicion_idempotencia` · frescura derivada | Simulador modo `offline` (8 duplicadas); TS-41; suite `mediciones` | ✅ |
| **HU11** — Documentación OpenAPI versionada | RF13 | `src/config/openapi.ts` · `/api/docs`, `/api/docs-json` | Suite `contrato` (5), TS-42 | ✅ |

## 13.2 Trazabilidad de requisitos no funcionales

| RNF | Implementación | Prueba / evidencia | Estado |
|---|---|---|---|
| RNF01 Seguridad | `auth/`, `PermisosGuard`, `validation.pipe`, `config/http.ts`, Prisma | Suites `auth`, `rbac`, `limites`; §7 | ✅ |
| RNF02 Disponibilidad | `health/` · `GET /health` | Sonda funcional; **sin** monitoreo de ventana | 🟡 |
| RNF03 Rendimiento | `date_bin` + índices; panel con `refetchInterval` | Script TS-43 (p50 104,1 / 573,7 ms) | ✅ |
| RNF04 Escalabilidad | Índices `idx_medicion_*`; normalización | `EXPLAIN ANALYZE` (§6.4); **sin** particionado | ⬜ *Won't* |
| RNF05 Usabilidad | `estilos.css`, mensajes de error del filtro | Revisión visual; **sin** pruebas con usuarios | 🟡 |
| RNF06 Mantenibilidad | Monorepo, TS estricto, git, README y docs | Inspección; historial de commits | ✅ |
| RNF07 Portabilidad | `infra/docker-compose.yml`, Dockerfiles, `.env` | `docker compose config` (exit 0); ejecución local | 🟡 |
| RNF08 Interoperabilidad | OpenAPI + `@aquabrain/shared` | Suite `contrato` (TS-42); **sin** app Android real | 🟡 |
| RNF09 Autonomía local | — (firmware) | — | ⬜ *Won't* |
| RNF10 Cobertura ≥ 70 % | Suite completa del proyecto | `test:cov` → 92,26 % líneas (TS-44) | ✅ |
| RNF11 Privacidad/ética | `auditoria/`; secretos fuera del repo | §7.6–7.7; **sin** retención automatizada | 🟡 |

## 13.3 Trazabilidad de casos de prueba a módulos

| Suite | Módulo(s) ejercitado(s) | Casos |
|---|---|---:|
| `gestion` | sistemas, cultivos, usuarios, reglas, catálogos | 16 |
| `rbac` | auth, permisos (transversal) | 11 |
| `mediciones` | mediciones (ingesta, idempotencia, calidad) | 12 |
| `alertas` | alertas, reglas | 9 |
| `auth` | auth | 8 |
| `salud` | salud, arranque | 7 |
| `historicos` | mediciones (serie, CSV) | 6 |
| `contrato` | openapi ↔ shared | 5 |
| `limites` | control de tasa (transversal) | 1 |

## 13.4 Cobertura del catálogo

- **HU cubiertas (10/11):** HU01–HU08, HU10, HU11. Falta HU09 (RF15, *Won't*).
- **RF cubiertos (14/15):** RF01–RF14. Falta RF15 (*Won't*); RF09 parcial.
- **RNF cubiertos con evidencia (5/11 completos):** RNF01, RNF03, RNF06, RNF10; los demás parciales o *Won't*.
- **Casos TS:** 32 cubiertos por suites automatizadas, 3 por medición manual, el resto no aplicable o puntual (§10.4).

La cadena **HU → RF → código → prueba** queda cerrada para todos los requisitos *Must*; las brechas restantes coinciden exactamente con lo declarado en las secciones 10 y 11.
