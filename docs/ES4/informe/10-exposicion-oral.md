# 10. Exposición Oral

Este capítulo responde al aspecto 7: un **mensaje técnico, preciso, estructurado y adecuado a la audiencia**. Incluye el objetivo, la estructura por bloques, los mensajes clave con cifras verificadas, el reparto por integrante y las recomendaciones de puesta en escena.

## 10.1 Objetivo y formato

- **Duración:** 20 minutos de exposición + 10 de preguntas.
- **Audiencia:** docente y una audiencia mixta (técnica y de negocio).
- **Mensaje central:** *un sistema de monitoreo centralizado, probado y honesto sobre sus límites*.
- **Regla de oro:** toda cifra que se diga en voz alta existe en este informe y proviene de una ejecución real.

## 10.2 Estructura por bloques

| # | Bloque | Min | Diapositiva | Mensaje clave |
|---|---|---|---|---|
| 1 | Portada | 0:00–0:30 | Título, equipo, ES1→ES4 | «Cerramos el proyecto con la solución funcionando» |
| 2 | El problema | 0:30–2:00 | Diagnóstico ES1 | Datos aislados y sin aviso automático |
| 3 | La propuesta | 2:00–3:30 | Tres pilares de valor | Centralizar, decidir a tiempo, crecer |
| 4 | Arquitectura y *stack* | 3:30–8:00 | Diagrama 4+1 + tabla de *stack* | *API-first* en NestJS + Prisma + PostgreSQL |
| 5 | **Demostración** | 8:00–15:00 | En vivo (capítulo 5) | Del sensor al panel y a la alerta |
| 6 | Resultados | 15:00–18:00 | Métricas (capítulo 9) | 125 pruebas, 92,26 % de cobertura, p50 104,1 ms |
| 7 | Mantención y proyección | 18:00–19:30 | *Roadmap* (capítulo 7) | Qué falta y cómo se resuelve |
| 8 | Cierre | 19:30–20:00 | Conclusión (capítulo 12) | Honestidad sobre las brechas |

## 10.3 Mensajes clave (con cifras verificadas)

- **«Un solo dato, una sola fuente de verdad»** — 52 230 mediciones en una base PostgreSQL de 19 modelos.
- **«El sistema avisa, no solo muestra»** — 4 reglas de alerta que evalúan **en la ingesta**.
- **«La calidad se puede medir»** — 125 pruebas en verde y 92,26 % de cobertura de líneas.
- **«Es rápido para lo que necesita»** — panel p50 **104,1 ms**; serie de un mes p50 **573,7 ms**.
- **«Reconocemos lo que falta»** — sin despliegue productivo, sin app Android validada y sin auditoría de accesibilidad; están en el plan de mantención.

## 10.4 Recursos visuales

| Recurso | Origen |
|---|---|
| Diagrama de arquitectura 4+1 | §3.1 |
| Flujo de ingesta → alerta → panel | §4.2 |
| Diagrama de secuencia de la demo | §5.1 |
| Capturas del dashboard | `img/` (panel, históricos, alertas) |
| Gráfico de cumplimiento del catálogo | §9.4 |
| Tabla de rendimiento | §9.3 |
| *Roadmap* | §2.5 |

> **No** se proyectan capturas de herramientas que no se ejecutaron (Lighthouse, ZAP, k6): si se mencionan, se dice explícitamente que **no se corrieron**.

## 10.5 Reparto de roles

| Bloque | Quién expone | Apoyo |
|---|---|---|
| 1–3 (problema y propuesta) | Todo el equipo (1 voz) | Diapositivas |
| 4 (arquitectura) | Perfil backend | Diagrama |
| 5 (demostración) | Perfil frontend + backend | Dos terminales preparadas |
| 6 (resultados) | Perfil QA / backend | Gráficos |
| 7–8 (proyección y cierre) | Todo el equipo | *Roadmap* |

## 10.6 Ensayo y control del tiempo

- **Dos ensayos completos** con cronómetro; cada bloque tiene un límite y una señal de «pasar».
- La **demostración** es el bloque de mayor riesgo: se ensaya con la API ya caliente y, si algo falla, se usa el plan B (capítulo 5).
- Se dejan **frases de transición** escritas para no perder tiempo pensando el enlace entre bloques.

## 10.7 Recomendaciones de oratoria y adecuación a la audiencia

| Recomendación | Por qué |
|---|---|
| **Empezar por el problema, no por la tecnología** | La audiencia de negocio necesita entender el valor antes del *stack*. |
| **Una idea por diapositiva** | Evita saturar y mantiene el ritmo. |
| **Traducir cada término técnico** | «Idempotencia» se explica como «reenviar el mismo dato no lo duplica»; «p50» como «la mitad de las veces responde en 104 ms o menos». |
| **Cifras redondeadas al hablar, exactas en la diapositiva** | «Unos 104 milisegundos» en voz, «104,1 ms» en pantalla. |
| **Mirar a la audiencia en los cierres de bloque** | Refuerza el mensaje central. |
| **No improvisar cifras** | Si no se sabe, se dice «no lo medimos» (capítulo 11). |
| **Cerrar reconociendo brechas** | La honestidad es parte del mensaje y prepara la defensa. |

El guion de la demostración que se ejecuta dentro del bloque 5 está en el capítulo 5; la preparación de las preguntas y respuestas, en el capítulo 11.
