# 03 · Matriz de necesidades TI y priorización

## 3.1. Método de identificación

Cada necesidad TI se formuló a partir de un **problema observado** en el material entregado, se
asoció a una **necesidad tecnológica concreta** y se respaldó con una **evidencia** verificable
(documento del desafío, antecedentes de la empresa, firmware o app existentes). Se usó un
identificador estable `NEC-01…NEC-09`.

La priorización se hizo con la técnica **MoSCoW** (Must / Should / Could / Won't), evaluando cuatro
criterios de forma conjunta:

- **Valor para el negocio** — cuánto aporta al resultado del cultivo y a la operación.
- **Urgencia** — cuán pronto se necesita para que el sistema sea útil.
- **Riesgo de no atenderla** — qué ocurre si no se resuelve (operativo, de datos o de seguridad).
- **Factibilidad técnica** — si es alcanzable en el prototipo académico con los recursos actuales.

## 3.2. Matriz de necesidades TI (NEC-01…NEC-09)

| ID | Problema observado | Necesidad TI | MoSCoW | Evidencia |
|---|---|---|---|---|
| **NEC-01** | Datos de instalaciones, cultivos, dispositivos y sensores dispersos; visibles solo en el display local o la app | Centralizar la información en una plataforma web única con base de datos consistente | **Must** | Documento del desafío; diagrama de flujo de datos |
| **NEC-02** | El encargado no conoce el estado actual sin inspeccionar físicamente el sistema | Dashboard web con el estado actual (última medición) por sensor y por sistema | **Must** | Antecedentes de actores |
| **NEC-03** | No existe aviso automático cuando una variable sale de rango | Motor de reglas/umbrales que genere alertas al recibir una medición fuera de rango | **Should** | Sección "Información de dominio sugerida" |
| **NEC-04** | El firmware del ESP32-S3 ya genera datos reales (AHT10, HC-SR04) que solo se ven en el OLED | API de ingesta que reciba y valide mediciones del firmware real, además del simulador | **Must** | Firmware; especificaciones AHT10 y HC-SR04 |
| **NEC-05** | Existe una app Android de prueba que puede convertirse en un silo independiente | API-first documentada y versionada que integre la app Android y futuros clientes | **Should** | App Android AquaBrain de prueba |
| **NEC-06** | El AquaBrain opera localmente con OLED y joystick; debe seguir siendo útil sin Internet | Tolerar pérdidas temporales de conectividad con reintentos y sincronización posterior | **Could** | Hardware entregado; documento de contexto |
| **NEC-07** | El acceso a la información no está controlado | Autenticación robusta (JWT) y control de acceso por roles (RBAC) | **Must** | Actores del desafío |
| **NEC-08** | El supervisor no puede comparar sistemas ni analizar tendencias | Módulo de históricos con gráficos y comparación entre múltiples sistemas | **Could** | Antecedentes de actores ("Supervisor") |
| **NEC-09** | La combinación firmware + app aislada no está pensada para escalar a cientos o miles de equipos | Diseño escalable (índices, normalización, estrategia de particionamiento) documentado | **Won't (por ahora)** | Sección "Escala esperada" del desafío |

**Distribución MoSCoW de las necesidades:** 4 Must (NEC-01, NEC-02, NEC-04, NEC-07), 2 Should
(NEC-03, NEC-05), 2 Could (NEC-06, NEC-08) y 1 Won't (NEC-09).

## 3.3. Priorización justificada

La siguiente tabla explicita la justificación por los cuatro criterios y el resultado MoSCoW. La
prioridad **no** responde a la preferencia tecnológica del equipo, sino al impacto en el negocio.

| Necesidad | Valor | Urgencia | Riesgo de no atenderla | Factibilidad | MoSCoW |
|---|---|---|---|---|---|
| Centralizar datos (NEC-01) | Alto: sin fuente única, nada más funciona | Inmediata | Alto: sistema inoperante | Alta (modelo relacional estándar) | **Must** |
| API de ingesta real (NEC-04) | Alto: conecta el hardware que ya existe | Alta | Alto: el prototipo se alejaría del producto real | Alta (REST + validación) | **Must** |
| Dashboard de estado (NEC-02) | Alto: es la vista principal del encargado | Alta | Alto: no habría monitoreo | Alta (consulta de última medición) | **Must** |
| Autenticación y RBAC (NEC-07) | Alto: protege datos y segrega funciones | Alta | Alto: acceso indebido, incumplimiento | Alta (JWT + hash) | **Must** |
| Motor de reglas y alertas (NEC-03) | Medio-alto: previene pérdidas de cultivo | Media | Medio: supervisión manual | Media (depende de mediciones y reglas) | **Should** |
| API-first documentada (NEC-05) | Medio: protege la inversión en la app móvil | Media | Medio: silos y retrabajo | Media (OpenAPI/Swagger) | **Should** |
| Tolerancia a conectividad (NEC-06) | Medio: evita pérdida de datos en campo | Media | Medio: datos faltantes | Media (buffer + reintentos) | **Could** |
| Históricos y comparativas (NEC-08) | Medio: valor estratégico para el supervisor | Baja | Bajo: no bloquea el MVP | Media (agregaciones) | **Could** |
| Escalabilidad masiva (NEC-09) | Bajo para el prototipo, alto a futuro | Baja | Bajo en el alcance académico | Baja como implementación real | **Won't** |

**Lectura de la priorización.** Las cuatro primeras necesidades son **Must** porque forman el núcleo
sin el cual el sistema no cumple su propósito: sin datos centralizados no hay plataforma; sin API no
hay datos; sin dashboard no hay monitoreo; sin autenticación no hay control de acceso. Las
necesidades **Should** y **Could** agregan valor (alertas, integración, resiliencia, análisis) pero
pueden planificarse en iteraciones posteriores. La escalabilidad masiva se **documenta** pero no se
implementa en el alcance académico.

## 3.4. Necesidades no atendidas por ahora (Won't)

Se declaran explícitamente para evitar expectativas falsas; no se consideran fracasos, sino
**decisiones de alcance** documentadas como trabajo futuro:

| Necesidad / requisito | Motivo de la exclusión |
|---|---|
| Escalabilidad masiva real (NEC-09 / RNF04) | El desafío no exige reproducir la escala de cientos o miles de equipos; se documenta la estrategia |
| Autonomía local del dispositivo (RNF09) | Depende del firmware del ESP32-S3, fuera del alcance de software de la plataforma |
| Licenciamiento y suscripciones (HU09 / RF15) | No está respaldado explícitamente por el desafío; queda como supuesto a validar |
| Notificaciones externas (correo/SMS) | No exigidas por el desafío; se implementan como avisos en la interfaz |

---

> **Trazabilidad.** Cada `NEC-xx` se relaciona con una o más historias de usuario y con
> requerimientos concretos; la cadena completa se presenta en el capítulo 08.
