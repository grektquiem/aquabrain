# 12. Recomendaciones Priorizadas

Las recomendaciones se ordenan por **prioridad** (P1 alta → P3 baja) y se derivan directamente de las discrepancias (§11) y los hallazgos (§11.4). Cada una indica el esfuerzo estimado y el beneficio esperado.

> **R-01 quedó implementada en esta entrega.** Durante el cierre se optimizó la ingesta por lote (§9.5): un lote de 500 lecturas pasó de **16,4 s a ~1,4 s** (≈12×). El resto de las recomendaciones permanecen como trabajo futuro.

## 12.1 Prioridad alta (P1)

| # | Recomendación | Atiende | Esfuerzo | Beneficio |
|---|---|---|---|---|
| R-01 | ✅ **Implementada** — **Optimizar la ingesta por lote**: inserción masiva (`createManyAndReturn`) y evaluación de reglas en un paso por lote | H-04 (16,4 s → 1,4 s / 500) | Medio | **≈12×** menos tiempo en el vaciado de búferes offline |
| R-02 | **Desplegar en un entorno real** (contenedor gestionado o PaaS) con HTTPS y variables de entorno | D-09, RNF07 | Medio | Cumple RNF07 y habilita la integración con hardware |
| R-03 | **Validar el contrato con la app Android** del cliente | D-14, RNF08 | Medio | Cierra el riesgo de interoperabilidad real |
| R-04 | **Política de retención y anonimización** de datos (Ley 19.628 / 21.719) | RNF11 | Bajo–Medio | Cumplimiento ético-legal |

## 12.2 Prioridad media (P2)

| # | Recomendación | Atiende | Esfuerzo | Beneficio |
|---|---|---|---|---|
| R-05 | **Control de tasa y caché distribuidos** con Redis | D-07 | Medio | Escala horizontal sin bypass del límite |
| R-06 | **Motor de reglas asíncrono** (cola/broker) | D-06 | Medio–Alto | Desacopla la ingesta de la evaluación |
| R-07 | **Particionado de `medicion`** por rango de fecha | D-05, RNF04 | Medio | Mantiene el rendimiento a escala de cientos de sistemas |
| R-08 | **Ampliar la cobertura de ramas** (rutas de error) hacia ≥ 80 % | H-05 | Bajo | Más confianza en el comportamiento ante fallos |
| R-09 | **Pruebas de interfaz automatizadas** (componentes/e2e de UI) | §9.8 | Medio | Evita regresiones visuales y de flujo |
| R-10 | **Monitoreo de disponibilidad** con sonda `/health` y registro de uptime | RNF02 | Bajo | Verifica el 99 % del horario de operación |

## 12.3 Prioridad baja (P3)

| # | Recomendación | Atiende | Esfuerzo | Beneficio |
|---|---|---|---|---|
| R-11 | **Comparativa multi-sistema** en la interfaz (superposición de líneas) | RF09 | Bajo–Medio | Completa un requisito *Could* |
| R-12 | **Pruebas de carga formales** (k6/Artillery) y **escaneo ZAP** | D-10, D-11 | Medio | Evidencia de rendimiento y seguridad de terceros |
| R-13 | **Auditoría de usabilidad y accesibilidad** (WCAG) con usuarios | RNF05 | Medio | Mejora la adopción por encargados no técnicos |
| R-14 | **Repositorio remoto con PR y CI** para el flujo colaborativo | D-08, RNF06 | Bajo | Trazabilidad del trabajo y revisión por pares |
| R-15 | **Consistencia de la interfaz con el display OLED** | RNF05 | Bajo | Alinea el dashboard con la lectura local del gateway |

## 12.4 Hoja de ruta sugerida

```mermaid
flowchart LR
    subgraph Corto plazo
      R01[R-01 Ingesta hecha] --- R02[R-02 Despliegue] --- R04[R-04 Retención]
    end
    subgraph Mediano plazo
      R05[R-05 Redis] --- R06[R-06 Reglas async] --- R07[R-07 Particionado]
    end
    subgraph Largo plazo
      R11[R-11 Comparativa] --- R13[R-13 Usabilidad]
    end
    Corto plazo --> Mediano plazo --> Largo plazo
```

**R-01 ya está implementada** (resolvió el único hallazgo de rendimiento). Entre las pendientes, **R-02** es la de mayor retorno: habilita el uso real del sistema con el hardware del cliente.
