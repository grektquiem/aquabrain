# 11. Análisis de Discrepancias

Esta sección confronta el **diseño de ES2** y el **borrador del informe** con lo que efectivamente se construyó. La regla es declarar la brecha y su causa, nunca ocultarla.

## 11.1 Discrepancias de tecnología

| # | Esperado (ES2 / borrador) | Implementado | Causa | Impacto |
|---|---|---|---|---|
| D-01 | Backend en **FastAPI (Python)** | **NestJS (TypeScript)** | Unificar lenguaje en todo el stack y compartir esquemas con el simulador | Nulo en diseño: se conservan capas y contrato REST |
| D-02 | Simulador en Python | **TypeScript** en el monorepo | Reutilizar `@aquabrain/shared` como fuente de verdad | Nulo |
| D-03 | Frontend con **Tailwind + Zustand + Axios** | **CSS propio + estado local/TanStack Query + fetch** | Reducir dependencias sin alterar la interfaz | Nulo funcional |
| D-04 | Almacenamiento **PostgreSQL + MongoDB** (best-effort) | **Solo PostgreSQL** | El modelo relacional cubre todos los casos; un NoSQL añadía operación sin beneficio | **TS-32 y TS-34 no aplican** |

## 11.2 Discrepancias de arquitectura

| # | Esperado (ES2) | Implementado | Causa | Impacto |
|---|---|---|---|---|
| D-05 | Tabla `medicion` **particionada** por rango de fecha | Tabla **normal** con índices | RNF04 quedó **Won't** en el MoSCoW | Ninguno con el volumen actual; sí a gran escala |
| D-06 | Motor de reglas **asíncrono** (cola) | Evaluación **en línea** | Simplicidad para el volumen del prototipo | La ingesta carga la evaluación; ver D-11 |
| D-07 | Redis para caché y control de tasa distribudo | **No se usa** (el `throttler` es en memoria) | No era necesario para una sola instancia | El límite no es compartido entre réplicas; `REDIS_URL` queda como reservado |

## 11.3 Discrepancias de proceso y evidencias

| # | Esperado (borrador) | Realidad | Causa |
|---|---|---|---|
| D-08 | 187 *commits* y 34 *pull requests* | **9 commits agrupados**, sin remoto ni PR | El historial se creó al final; el trabajo no pasó por revisión en remoto |
| D-09 | Despliegue en **Render** | **Local + docker-compose** validado; imagen de la API **construida** (`aquabrain-api:dev`, 82,2 s) | No se gestionó cuenta de nube |
| D-10 | Pruebas de carga con **k6** | Script HTTP propio (25 repeticiones por endpoint) | k6 no estaba disponible en el entorno |
| D-11 | Análisis de seguridad con **OWASP ZAP** | Pruebas automatizadas propias | Sin herramienta ni alcance para un escaneo formal |
| D-12 | **Lighthouse = 94** | **No ejecutado** | Se priorizó la verificación funcional en navegador |
| D-13 | 52.340 registros | **50 730** mediciones reales | Es el conteo efectivo tras las pruebas |
| D-14 | Validación contra la **app Android** real | Contrato verificado por prueba automatizada (TS-42) | La app de prueba no estaba disponible para integrarla |

> **Sobre las cifras del borrador.** Valores como «187 commits», «34 PR», «Lighthouse 94», «52.340 registros» o las corridas de ZAP/k6 eran **placeholders**. En este informe se reemplazaron por mediciones reales o se marcaron como **no ejecutados** (D-08…D-14).

## 11.4 Hallazgos técnicos durante la implementación

Son defectos o comportamientos **descubiertos al probar**, no supuestos:

| # | Hallazgo | Resolución |
|---|---|---|
| H-01 | `GET /auditoria` devolvía **500** por serializar `BigInt` | Se serializa el `id` a cadena en el controlador |
| H-02 | Un `422` con cuerpo de texto se etiquetaba como `ERROR_INTERNO` | El código de error ahora **se deriva del estado HTTP** |
| H-03 | Precedencia de reglas ambigua (sensor vs. tipo de variable) | Se fija: si hay reglas del sensor, se ignoran las de tipo (RN-07) |
| H-04 | **Ingesta por lote lenta:** 500 mediciones en **16,4 s** (~30/s) | **No resuelto**: se documenta y se recomienda inserción masiva (sección 12) |
| H-05 | Cobertura de **ramas** baja (68,95 %) frente a líneas (91,96 %) | Cumple el umbral (60 %), pero revela rutas de error poco ejercitadas |

## 11.5 Estado del sistema tras las pruebas

Las pruebas **modifican el estado**: la prueba de resolución en la interfaz dejó una alerta resuelta, por lo que la bandeja pasó de **3 a 2 alertas activas**. La tabla `medicion` incluye **7 000 filas sintéticas** añadidas específicamente para la prueba de volumen TS-43 (declarado en §6.3). Ambas cosas se documentan para que cualquier cifra del informe sea reproducible.

## 11.6 Balance

Las discrepancias se concentran en **tecnología** (justificadas) y en **evidencias de proceso no ejecutadas** (nube, k6, ZAP, Lighthouse, app Android). **No hay requisitos *Must* funcionales sin implementar**: todas las brechas funcionales son *Should/Could* o *Won't*. El único hallazgo de rendimiento relevante (H-04) afecta al camino de escritura por lote, no a la experiencia de usuario medida.
