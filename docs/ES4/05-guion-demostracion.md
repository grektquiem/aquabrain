# 5. Guion de Demostración en Vivo

## 5.1 Preparación previa (antes de la presentación)

El objetivo es dejar el entorno **listo y verificado** antes de comenzar. La puesta en marcha verificada en el desarrollo es la **local** (API + Vite + PostgreSQL en contenedor); como alternativa reproducible está **docker-compose** (§7.6).

```powershell
# 1. Base de datos (contenedor de desarrollo)
docker start aquabrain-pg
# esperar a que acepte conexiones
docker exec aquabrain-pg pg_isready -U aquabrain   # -> accepting connections

# 2. Dependencias y paquete compartido (desde la raíz del proyecto)
npm install
npm run build --workspace @aquabrain/shared

# 3. Esquema y datos (30 días de historia determinista)
Set-Location apps/api
npx prisma migrate deploy
npx prisma db seed

# 4. API (deja la terminal ocupada)
npm run start:prod            # -> http://localhost:3000  (OpenAPI en /api/docs)

# 5. Dashboard (otra terminal)
Set-Location ../web
npm run dev                   # -> http://localhost:5173

# 6. Simulador (otra terminal) — modo online
Set-Location ../simulator
npm run build
$env:API_URL='http://localhost:3000/api/v1'; $env:DEVICE_CODE='DEV-01'
$env:DEVICE_KEY='<clave del dispositivo>'; $env:MODO='online'
node dist/simulador.js
```

**Cuentas de demostración** (sembradas por `prisma/seed.ts`; contraseña `AquaPlants2026!`):

| Correo | Rol | Uso en la demo |
|---|---|---|
| `encargado@aqua.cl` | Encargado | Panel, históricos y alertas |
| `supervisor@aqua.cl` | Supervisor | Consulta e indicadores |
| `admin@aqua.cl` | Administrador | Usuarios, sistemas, dispositivos y reglas |

**Estado de partida esperado:** `DEV-01` en línea, `DEV-02` sin comunicación; **10 variables** con última lectura; **2 alertas activas**; **52 230** mediciones en la base.

> **Nota sobre las claves de dispositivo.** El *seed* **rota** la clave de cada dispositivo y la imprime **una sola vez**; no se versiona. Por eso el paso 6 pide copiarla del resultado del *seed*.

## 5.2 Guion de demostración (15 minutos)

| Min | Acción | Pantalla | Punto clave a destacar |
|---:|---|---|---|
| 0–1 | Abrir `http://localhost:5173` | Acceso | Interfaz limpia; el token vive solo en memoria |
| 1–2 | Entrar como `encargado@aqua.cl` | Acceso → Panel | JWT válido; rol Encargado |
| 2–4 | Observar el panel con datos del simulador | Panel | Última medición, semáforo por variable y *timestamp* |
| 4–5 | Esperar el refresco automático (15 s) | Panel | Los datos se actualizan sin recargar la página |
| 5–6 | Ir a **Históricos**: elegir sensor y rango de 30 días | Históricos | Gráfico de líneas con banda mín/máx |
| 6–7 | Exportar el CSV del rango | Históricos | BOM UTF-8 y separador `;` (abre bien en Excel en español) |
| 7–8 | Ir a **Alertas** y revisar las activas | Alertas | Severidad, *timestamp* y botón **Resolver** |
| 8–9 | Resolver una alerta con comentario | Alertas | El contador de activas baja (3 → 2); queda el registro |
| 9–10 | Cambiar de sesión a `admin@aqua.cl` | Acceso → Panel | Rol Administrador; más acciones habilitadas |
| 10–11 | Consultar el estado de dispositivos | Panel | `DEV-01` en línea (frescura) y `DEV-02` **sin comunicación** (RN-05) |
| 11–12 | Abrir Swagger UI en `http://localhost:3000/api/docs` | Swagger | Contrato OpenAPI 3 con **35 rutas** |
| 12–13 | Detener el simulador | Terminal + Panel | El dispositivo deja de refrescar; la frescura lo refleja |
| 13–14 | Reiniciar el simulador en modo `offline` y luego `online` | Terminal + Panel | Sincronización del búfer **sin duplicados** (idempotencia) |
| 14–15 | Volver al panel y cerrar | Panel | Sistema centralizado funcionando en vivo |

## 5.3 Comandos de respaldo (si algo falla)

```powershell
# Reiniciar la API
docker compose --env-file infra/.env -f infra/docker-compose.yml restart api
# o, en modo local, cortar y relanzar:  node dist/main.js

# Ver logs de la API (modo compose)
docker compose --env-file infra/.env -f infra/docker-compose.yml logs -f api

# Comprobar la base por si el panel aparece vacío
docker exec aquabrain-pg psql -U aquabrain -d aquabrain -c "select count(*) from medicion;"

# Reejecutar la semilla si faltan datos
Set-Location apps/api; npx prisma db seed
```

**Plan B si la demo en vivo no arranca:** se muestran las capturas del capítulo 15 (panel, históricos y alertas) y las transcripciones del simulador (`docs/ES4/evidencia/`), que documentan exactamente los mismos pasos.

## 5.4 Evidencia de respaldo de la demo

| Recurso | Ubicación |
|---|---|
| Captura del panel en vivo | `docs/ES4/img/web-panel.png` |
| Captura de históricos | `docs/ES4/img/web-historicos.png` |
| Captura de alertas | `docs/ES4/img/web-alertas.png` |
| Transcripción simulador `online` | `docs/ES4/evidencia/sim-online.txt` |
| Transcripción simulador `offline` | `docs/ES4/evidencia/sim-offline.txt` |
| Transcripción simulador `anomalia` | `docs/ES4/evidencia/sim-anomalia.txt` |
| Rendimiento de lectura y escritura | `docs/ES4/evidencia/perf-ts43.txt`, `perf-bulk.txt` |

> **Honestidad sobre la evidencia.** No existe un **video** pregrabado de la demo (el borrador lo suponía). El respaldo es el conjunto de capturas y transcripciones anteriores, todas generadas contra la API en ejecución.
