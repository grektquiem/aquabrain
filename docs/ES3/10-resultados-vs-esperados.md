# 10. Resultados Obtenidos vs. Esperados

## 10.1 Cómo leer esta sección

Cada requisito del catálogo canónico (ES1) se contrasta con lo que **realmente** quedó implementado y probado:

- ✅ **Cumplido** — implementado y con evidencia de ejecución.
- 🟡 **Parcial** — existe una parte, pero algo del enunciado quedó fuera.
- ⬜ **No aplica** — requisito *Won't* del MoSCoW o dependiente de hardware fuera del alcance del software.

## 10.2 Requisitos funcionales (RF)

| RF | Prio | Enunciado (resumen) | Estado | Evidencia / observación |
|---|:--:|---|:--:|---|
| RF01 | M | Autenticación y autorización con JWT y roles | ✅ | Suite `auth` (8) + `rbac` (11); 21 permisos |
| RF02 | M | CRUD de usuarios solo administradores | ✅ | `gestion` (16); un encargado recibe 403 |
| RF03 | M | CRUD de sistemas/instalaciones | ✅ | Suite `gestion` |
| RF04 | M | Gestión de dispositivos por sistema | ✅ | Suite `gestion`; 2 dispositivos sembrados |
| RF05 | M | Gestión de sensores con tipo y unidad | ✅ | 10 sensores, 5 tipos de variable |
| RF06 | M | Registro de mediciones vía API (firmware o simulador) | ✅ | `mediciones` (10) + simulador; > 50 000 filas |
| RF07 | M | Dashboard con última medición por sensor | ✅ | Panel verificado en navegador (10 tarjetas) |
| RF08 | S | Históricos con filtros, tabla y gráfico | ✅ | Suite `historicos` (6) + gráfico Recharts + CSV |
| RF09 | C | Comparativa gráfica multi-sistema | 🟡 | La API acepta varios sensores por consulta; **la UI no** superpone sistemas |
| RF10 | M | CRUD de reglas de alerta | ✅ | `gestion`; 4 reglas sembradas |
| RF11 | M | Motor de evaluación de alertas | ✅ | `reglas.engine.spec` (11) + `alertas` (9) |
| RF12 | M | Lista de alertas y marcar como resuelta | ✅ | `alertas` (9) + resolución verificada en UI (3→2) |
| RF13 | S | Documentación OpenAPI versionada | ✅ | 35 rutas en `/api/docs`; contrato verificado (TS-42) |
| RF14 | S | Estado de conexión / última comunicación | ✅ | Frescura derivada; `frescura.spec` (6); panel muestra «Sin comunicación» |
| RF15 | W | Suscripción y licenciamiento | ⬜ | Fuera de alcance (*Won't*) |

## 10.3 Requisitos no funcionales (RNF)

| RNF | Prio | Enunciado (resumen) | Estado | Evidencia / observación |
|---|:--:|---|:--:|---|
| RNF01 | M | Seguridad: bcrypt, JWT, validación, SQLi/XSS | ✅ | bcrypt coste 12; JWT; pipe whitelist; ORM parametrizado; helmet (ver §7) |
| RNF02 | S | Disponibilidad 99 % en horario de operación | 🟡 | Existe sonda `/health`; **no** se monitoreó uptime en una ventana |
| RNF03 | S | Dashboard < 2 s; históricos 1 mes < 5 s / 50.000 | ✅ | Medido: p50 104,1 ms y 573,7 ms sobre 52 230 filas (TS-43) |
| RNF04 | W | Escalabilidad: índices, normalización, particionado | ⬜ | Índices y normalización sí; particionado **no** (*Won't*, ver §11) |
| RNF05 | M | Usabilidad: responsive, mensajes claros | 🟡 | CSS responsive y errores claros; **sin** pruebas con usuarios; **sin** verificar consistencia con el display OLED |
| RNF06 | M | Mantenibilidad: buenas prácticas, Git, documentación | ✅ | Monorepo, TS estricto, git, README y docs ES1–ES3 |
| RNF07 | S | Portabilidad: Docker/PaaS con variables de entorno | 🟡 | Compose + Dockerfiles validados; ejecución **local**; **sin** segundo entorno nube |
| RNF08 | S | Interoperabilidad (firmware, app Android, dashboard) | 🟡 | Contrato OpenAPI + `@aquabrain/shared`; **no** validado con la app Android real |
| RNF09 | W | Autonomía local (OLED + joystick) | ⬜ | Depende del firmware (*Won't*) |
| RNF10 | S | Cobertura ≥ 70 % + integración + carga básica | ✅ | 92,26 % líneas (umbral 70 %); 125 pruebas de integración/unitarias |
| RNF11 | M | Privacidad y cumplimiento ético | 🟡 | Auditoría y no versionado de secretos; **sin** política de retención/anonimización automatizada |

## 10.4 Casos del plan de pruebas (TS-01…TS-44)

Casos **cubiertos por las suites automatizadas** (rastreados por etiqueta en el código): TS-03, TS-04, TS-05, TS-06, TS-10, TS-11, TS-12, TS-13, TS-14, TS-15, TS-16, TS-17, TS-18, TS-19, TS-20, TS-21, TS-22, TS-23, TS-25, TS-26, TS-27, TS-28, TS-30, TS-33, TS-35, TS-36, TS-37, TS-38, TS-39, TS-40, TS-41, TS-42.

Casos **cubiertos por ejecución manual/medición**: TS-43 (rendimiento, script propio), TS-44 (cobertura, `test:cov`), TS-07 (calidad SOSPECHOSA, verificado en el simulador y en la BD).

Casos **no ejecutados / no aplicables**:

| Caso | Motivo |
|---|---|
| TS-32, TS-34 | Dependían de un almacenamiento NoSQL que **no** se implementó (§11) |
| TS-08, TS-09 | Verificación contra el **display OLED** físico (hardware) |
| TS-24, TS-29, TS-31 | Casos puntuales no versionados; su temática queda cubierta por pruebas del filtro/pipe |

## 10.5 Síntesis

De **33 requisitos** (15 RF + 11 RNF + 7 supuestos transversales), la implementación deja:

- **Cumplidos con evidencia automatizada:** todos los **Must** funcionales y la mayoría de los **Should** (RF01–RF08, RF10–RF14; RNF01, RNF03, RNF06, RNF10).
- **Parciales:** RF09, RNF02, RNF05, RNF07, RNF08, RNF11 — con el faltante explícitamente acotado.
- **No aplica (*Won't*):** RF15, RNF04 (particionado), RNF09.

El detalle de cada brecha y su causa está en la sección 11, y su priorización en la sección 12.
