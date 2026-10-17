# 5. Implementación del Simulador IoT

## 5.1 Propósito

El gateway físico real es un **ESP32-S3** del cliente. Para poder ejercitar el backend de extremo a extremo sin depender del hardware (y de forma reproducible), se implementó un **simulador** en `apps/simulator` que reproduce el **protocolo de ingesta** de la API: mismos endpoints, mismas cabeceras de dispositivo y mismos esquemas de validación.

> **Desviación respecto de ES2.** El borrador describía un simulador en **Python**. Se implementó en **TypeScript (Node)** dentro del mismo monorepo para reutilizar `@aquabrain/shared` como fuente de verdad de la validación, y porque el build con `tsc` produce un ejecutable autónomo (`node dist/simulador.js`). Se registra en la sección 11.

## 5.2 Estructura y componentes

| Archivo | Responsabilidad |
|---|---|
| `src/config.ts` | Lee la configuración por variables de entorno (URL de la API, dispositivo, modo, perfil, intervalo) |
| `src/generador.ts` | Modelo de valores por tipo de variable y perfiles (`normal`, `ola-de-calor`, `sequia`) |
| `src/cliente.ts` | Cliente de la API: valida con los esquemas Zod compartidos, trocea en lotes de `MAX_BULK_ITEMS` |
| `src/simulador.ts` | Orquesta los modos y resume el resultado |

**Modos de operación:**

- **`online`**: envía cada lectura con `POST /mediciones`.
- **`offline`**: acumula las lecturas en un **búfer local** y, al “reconectar”, las sincroniza con `POST /mediciones/bulk` conservando el `timestamp` y `idExterno` originales; después **reenvía el mismo lote** para demostrar la idempotencia.
- **`anomalia`**: inyecta valores fuera del rango del sensor para disparar alertas y marcar calidad.

Todos los valores se generan con un modelo físico simple por tipo de variable y, opcionalmente, con un **perfil** que sesga la temperatura o la humedad.

## 5.3 Evidencia de ejecución

Las tres corridas se realizaron contra la API en vivo, con el dispositivo **DEV-01** y sus cinco sensores (`TEMP-01`, `HUM-01`, `PH-01`, `DIST-01`, `CAUDAL-01`).

### 5.3.1 Modo `online` (perfil ola de calor)

```text
[00:27:51] lectura 1
          TEMP-01      33.30 C
          HUM-01       52.00 %
          PH-01         6.27 pH
          DIST-01      27.40 cm
          CAUDAL-01     0.00 L/min
          → alerta MEDIA: Temperatura alta (valor 33.3)
── Resumen ──
  mediciones aceptadas : 10   alertas generadas : 1   errores : 0
```

La lectura de temperatura (`33,3 °C`) superó el umbral de la regla sembrada «Temperatura alta» (> 32) y generó la alerta **MEDIA** esperada.

### 5.3.2 Modo `offline` (perfil sequía) — idempotencia

```text
[00:28:02] lectura 1 → almacenado en el búfer local (2 pendientes)
...
[00:28:05] lectura 4 → almacenado en el búfer local (8 pendientes)
[00:28:05] reconexión: sincronizando 8 lecturas en lote…
          → lote: recibidas=8 aceptadas=8 duplicadas=0 rechazadas=0 alertas=0
          → reenvío del mismo lote: duplicadas=8 (idempotencia verificada)
```

Ocho lecturas se almacenaron sin conexión y se sincronizaron en un único lote; el **reenvío** del mismo lote dio **8 duplicadas y 0 aceptadas**, lo que confirma la **idempotencia (HU10)** basada en `idExterno`. En la base de datos se verificó que las 8 filas conservan **cuatro instantes de tiempo distintos** (`timestamp` de origen preservados, RN-10/TS-41) y `origen = OFFLINE`.

### 5.3.3 Modo `anomalia` — calidad y alertas

```text
[00:28:17] lectura 4 (anomalía inyectada)
          TEMP-01      38.80 C      fuera de rango
          PH-01         7.80 pH     fuera de rango
          → alerta ALTA: pH fuera de rango (valor 7.8)
── Resumen ──
  mediciones aceptadas : 10   valores fuera de rango : 2   alertas generadas : 1   errores : 0
```

Los dos valores fuera de rango **no se descartaron**: se almacenaron con `calidad = SOSPECHOSA` y se creó la alerta **ALTA** «pH fuera de rango». Se comprobó en la base de datos que las mediciones sospechosas quedaron registradas (`SOSPECHOSA`).

## 5.4 Verificación cruzada en la base de datos

Tras las corridas se consultó directamente PostgreSQL para confirmar que lo que el simulador reportó como aceptado está efectivamente persistido:

| Comprobación | Resultado |
|---|---|
| Mediciones con `origen = OFFLINE` | Presentes (lote sincronizado del modo offline) |
| Instantes distintos en el lote de 8 | **4** instantes distintos para 8 filas (timestamps de origen conservados) |
| Mediciones con `calidad = SOSPECHOSA` | Las 2 lecturas fuera de rango del modo anomalía |
| Total de mediciones en la tabla | > 50 000 filas (ver §6 y §9) |

Las salidas de consola completas se adjuntan en la sección 16 (Anexos).
