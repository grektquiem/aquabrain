# 1. Introducción, alcance y método

## 1.1 De ES1 a ES4: el ciclo completo

El Proyecto Integrado se desarrolló en cuatro entregas que recorren el ciclo de vida de una solución de software:

| Entrega | Pregunta que responde | Producto |
|---|---|---|
| **ES1 — Diagnóstico** | ¿Cuál es el problema y qué necesita el cliente? | Catálogo NEC/HU/RF/RNF/CU/RN |
| **ES2 — Diseño** | ¿Cómo se resolverá? | Arquitectura 4+1, modelo de datos, plan de pruebas TS-01…TS-44 |
| **ES3 — Implementación** | ¿Qué se construyó y qué se probó? | Backend NestJS, dashboard React, simulador, base PostgreSQL y evidencia |
| **ES4 — Cierre** | ¿Qué valor entrega y cómo se sostiene? | Este informe: comunicación, resultados, mantención y defensa |

El hilo conductor es el mismo en las cuatro unidades: **un sistema de control y monitoreo para cultivos hidropónicos y aeropónicos**, que integra el *hardware* IoT del cliente (un gateway **ESP32-S3** con sensores AHT10 y HC-SR04, display OLED y joystick) con una **plataforma web centralizada**.

## 1.2 Alcance de esta entrega

ES4 **no** agrega funcionalidad nueva al producto. Su alcance es **comunicar y sostener** lo ya construido:

1. **Documentar** el proyecto de forma consolidada y comprensible para una audiencia mixta (técnica y de negocio).
2. **Demostrar** el funcionamiento con un flujo de extremo a extremo: **medición simulada → API → almacenamiento → dashboard / alerta**.
3. **Medir y presentar** resultados cuantificables (pruebas, cobertura, rendimiento, volumetría).
4. **Proponer un plan de mantención** para la puesta en producción.
5. **Preparar la exposición oral y la defensa** técnica de las decisiones.

La frontera con ES3 es explícita: ES3 **construye y prueba**; ES4 **comunica y sostiene**. Por eso este informe reutiliza las cifras medidas en ES3 (y las actualiza cuando la base de datos o las dependencias cambiaron) en lugar de generar nueva evidencia de implementación.

## 1.3 Método y regla de evidencia

El equipo aplicó una **regla de honestidad** en las cuatro entregas: *toda afirmación cuantitativa debe poder rastrearse hasta una ejecución o una fuente verificable*. De ella se derivan tres compromisos de método:

- **Trazabilidad.** Cada métrica indica de dónde proviene (comando, consulta SQL, archivo de evidencia o prueba con su identificador `TS-xx`).
- **Distinción entre lo medido, lo estimado y lo no ejecutado.** No se presentan estimaciones como mediciones.
- **Declaración de brechas.** Lo que no quedó implementado o probado se declara con el mismo énfasis que los logros, y se acompaña de una mitigación o de una recomendación.

Esta regla se aplicó también a la **corrección de los borradores**: cuando un borrador anterior (por ejemplo, el de ES4) afirmaba algo que la implementación no respaldaba —por ejemplo, «9 pantallas» o «FastAPI»—, se corrigió en lugar de mantener la afirmación.

## 1.4 Estructura del informe y correspondencia con la rúbrica

| Capítulo | Contenido | Aspecto ES4 |
|---|---|:--:|
| 2 | Documentación final: propuesta de valor, necesidades, alcance, viabilidad | 1 |
| 3 | Arquitectura, tecnologías y entorno reproducible | 1 |
| 4 | Funcionalidad y características | 2 |
| 5 | Guion de la demostración en vivo | 2 |
| 6 | Normativas, estándares y claridad | 3 |
| 7 | Plan de mantención | 4 |
| 8 | Presentación final: narrativa y recursos visuales | 5 |
| 9 | Presentación de resultados cuantificables | 6 |
| 10 | Exposición oral | 7 |
| 11 | Defensa y preguntas | 8 |
| 12 | Conclusiones | — |
| 13 | Bibliografía | — |
| 14 | Anexos | — |

El documento es **autocontenido**: las capturas viajan incrustadas y los diagramas se renderizan con Mermaid. Todas las cifras provienen de los archivos de evidencia de `docs/ES3/evidencia/` y `docs/ES4/evidencia/` y de consultas de solo lectura a PostgreSQL.
