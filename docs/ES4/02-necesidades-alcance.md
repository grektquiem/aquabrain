# 2. Necesidades Abordadas y Alcance

## 2.1 Necesidades TI cubiertas (ES1 → ES4)

El diagnóstico de ES1 definió **nueve necesidades** (NEC-01…NEC-09) con su prioridad MoSCoW. El estado que se declara es el que quedó **verificado** en la implementación (ES3), no el previsto:

| # | Necesidad TI (ES1) | MoSCoW | Estado real | Evidencia |
|---|---|:--:|---|---|
| NEC-01 | Centralizar la información en una plataforma web única con BD consistente | **Must** | ✅ Implementado | 19 modelos; CRUD de sistemas, cultivos, dispositivos y sensores (RF03–RF05) |
| NEC-02 | Dashboard web con el estado actual (última medición) por sensor y sistema | **Must** | ✅ Implementado | `GET /dashboard/estado`; panel verificado en navegador (RF07) |
| NEC-03 | Motor de reglas/umbrales que genere alertas al salir de rango | **Should** | ✅ Implementado | 4 reglas activas; motor en línea y bandeja de alertas (RF10–RF12) |
| NEC-04 | API de ingesta que reciba el formato del firmware real, además del simulador | **Must** | ✅ Implementado | `POST /mediciones` + `/mediciones/bulk`; autenticación por dispositivo (RF06) |
| NEC-05 | API-first documentada y versionada para integrar la app Android y futuros clientes | **Should** | ✅ Implementado | OpenAPI 3 con 35 rutas; contrato verificado contra `@aquabrain/shared` (RF13) |
| NEC-06 | Tolerar pérdidas temporales de conectividad con reintentos y sincronización | **Could** | ✅ Implementado | Modo `offline` del simulador; idempotencia (`medicion_idempotencia`) (RF06, RF14) |
| NEC-07 | Autenticación robusta (JWT) y control de acceso por roles (RBAC) | **Must** | ✅ Implementado | JWT + refresh rotado; 3 roles, 21 permisos; auditoría (RF01, RF02) |
| NEC-08 | Históricos con gráficos y comparación entre múltiples sistemas | **Could** | 🟡 Parcial | Históricos ✅ (gráfico + CSV); la **UI no superpone** varios sistemas (RF08 ✅ / RF09 🟡) |
| NEC-09 | Diseño escalable (índices, normalización, estrategia de particionamiento) | **Won't** | ⬜ Documentado | Índices y normalización sí; particionado **no** (RNF04 *Won't*, ver §9.5) |

**Lectura del resultado.** Las necesidades **Must** y **Should** quedan cubiertas; la única brecha funcional (*Could*) es la **superposición multi-sistema** en la interfaz (RF09), cuya API ya soporta la consulta. La necesidad **Won't** (escalabilidad masiva) se documenta con una estrategia por umbrales (§9.5), que es exactamente lo que el desafío pedía para esa escala.

## 2.2 Alcance del MVP

**Incluido y verificado:**

- **15 Requerimientos Funcionales** (RF01–RF15): 13 cumplidos con evidencia, **RF09 parcial** (API sí, UI de superposición no) y **RF15** fuera de alcance (*Won't*).
- **11 Requerimientos No Funcionales** (RNF01–RNF11): 4 cumplidos (RNF01, RNF03, RNF06, RNF10), 5 parciales con el faltante acotado (RNF02, RNF05, RNF07, RNF08, RNF11) y 2 *Won't* (RNF04 particionado, RNF09 autonomía del firmware).
- **11 Historias de Usuario** trazadas (HU01–HU11); **HU09 fuera de alcance**.
- **3 roles** operativos: Encargado, Supervisor, Administrador (con 21 permisos).
- **2 dispositivos** (`DEV-01`, `DEV-02`), **10 sensores** y **5 tipos de variable** (TEMPERATURA, HUMEDAD, PH, DISTANCIA, CAUDAL).
- **4 reglas de alerta** activas: «Temperatura alta», «Humedad baja», «pH fuera de rango», «Nivel bajo del depósito».
- **4 pantallas** funcionales: Acceso, Panel, Históricos y Alertas.

**Excluido (declarado, no oculto):**

| Excluido | Motivo |
|---|---|
| Licenciamiento y suscripciones (HU09 / RF15) | Supuesto no respaldado por el desafío; *Won't* en el MoSCoW |
| Particionado de la tabla `medicion` (RNF04) | Volumen del prototipo no lo exige; estrategia documentada |
| Autonomía local del firmware (RNF09) | Depende del hardware (OLED + joystick), no del software de plataforma |
| Despliegue en la nube / HTTPS de producción | No se gestionó cuenta de proveedor; ver §6 y §12 |
| App Android real integrada | No se dispone del contrato que consume hoy; ver §12 |

## 2.3 Actores del desafío y su cobertura

| Actor (ES1) | Necesidad | Cobertura real |
|---|---|---|
| **Encargado de cultivo** | Ver estado, históricos y alertas | HU01, HU02, HU03 → Panel, Históricos y Alertas ✅ |
| **Supervisor** | Comparar sistemas y analizar tendencias | HU04 → históricos multi-sensor ✅; superposición en UI 🟡 |
| **Administrador** | Gestionar usuarios, sistemas, dispositivos y reglas | HU05, HU06, HU07 → CRUD y reglas ✅ |
| **Dispositivo / AquaBrain (ESP32-S3)** | Enviar mediciones y operar sin conectividad | HU08, HU10 → API de ingesta + simulador ✅ |
| **Simulador IoT** | Generar mediciones sin hardware | Modos `online`, `offline`, `anomalia` ✅ |
| **Desarrollador de Integraciones** | Consumir la API documentada | HU11 → OpenAPI 3 con 35 rutas ✅ |

> **Cierre de un vacío del borrador.** El análisis del desafío sugería que faltaba un sensor de **caudal/nutrientes**. La implementación **sí incluye** el tipo de variable `CAUDAL` (L/min) entre los cinco tipos sembrados y modelados, por lo que esa brecha queda cubierta a nivel de modelo y de dashboard.
