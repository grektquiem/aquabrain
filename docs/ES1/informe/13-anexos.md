# 13 · Anexos

## Anexo A · Glosario

| Término | Definición |
|---|---|
| **AquaBrain** | Placa electrónica (ESP32-S3) que sensa variables del cultivo y las transmite a la capa digital |
| **AquaPlants** | Producto de cultivo hidropónico/aeropónico vertical que integra física, electrónica y software |
| **AHT10** | Sensor real de temperatura y humedad |
| **HC-SR04** | Sensor real de distancia ultrasónica, usado como referencia de nivel |
| **API-first** | Enfoque en que la funcionalidad se expone mediante un contrato de API estable y documentado |
| **MoSCoW** | Técnica de priorización: Must / Should / Could / Won't |
| **MVP** | Producto mínimo viable: conjunto de funcionalidades esencial para que la solución sea útil |
| **Mocking** | Técnica de prueba que reemplaza dependencias reales |
| **RBAC** | Control de acceso basado en roles |
| **RF / RNF** | Requerimiento funcional / no funcional |
| **Slice / Sprint** | Iteración de duración fija en Scrum |
| **TS** | Caso de prueba (test case) |
| **Timestamp** | Marca temporal de una medición |
| **Store-and-forward** | Estrategia de almacenar datos localmente y reenviarlos al recuperar conexión |

## Anexo B · Convenciones de identificadores

| Prefijo | Significado | Formato | Cantidad |
|---|---|---|---|
| `NEC-xx` | Necesidad TI | `NEC-01` … `NEC-09` | 9 |
| `HUxx` | Historia de usuario | `HU01` … `HU11` | 11 |
| `RFxx` | Requerimiento funcional | `RF01` … `RF15` | 15 |
| `RNFxx` | Requerimiento no funcional | `RNF01` … `RNF11` | 11 |
| `CU-xx` | Caso de uso | `CU-01` … `CU-16` | 16 |
| `RN-xx` | Regla de negocio | `RN-01` … `RN-12` | 12 |
| `TS-xx` | Caso de prueba (referencia ES2/ES3) | `TS-01` … `TS-44` | 44 |

> Los identificadores **no llevan guion** entre las letras y el número (`HU01`, `RF07`), salvo `NEC`,
> `CU`, `RN` y `TS`, que sí lo llevan. Esta convención única fue aplicada como parte de la corrección
> C-08 y se mantiene en todos los documentos del proyecto.

## Anexo C · Cobertura detallada de la rúbrica

| Indicador | Evidencia concreta | Ubicación |
|---|---|---|
| 1.1.1.1 Necesidades TI con buenas prácticas | Matriz NEC-01…NEC-09 con problema, necesidad, prioridad y evidencia; alineada con patrones de series temporales y RBAC | Cap. 03 §3.2 · Cap. 04 |
| 1.1.1.2 Tendencias TI aplicables | 7 tendencias adoptadas y 5 descartadas, con impacto explícito | Cap. 04 §4.2, §4.3 |
| 1.1.1.3 Priorización justificada | Priorización MoSCoW por valor, urgencia, riesgo y factibilidad | Cap. 03 §3.3 |
| 1.1.2.4 Historias claras y detalladas | Backlog HU01…HU11 en formato rol–característica–razón | Cap. 06 §6.2 |
| 1.1.2.5 Roles, objetivos y criterios | Cada HU declara rol, característica, razón y CA numerados | Cap. 06 §6.2 |
| 1.1.2.6 Adaptación al negocio | Tabla de aspectos específicos de AquaPlants y la HU que los recoge | Cap. 06 §6.3 |
| 1.1.3.7 Clasificación RF/RNF | Catálogos RF01…RF15 y RNF01…RNF11 con criterio de clasificación | Cap. 07 §7.1–§7.3 |
| 1.1.3.8 Ejemplos de cada tipo | 2 RF y 2 RNF explicados con su relevancia | Cap. 07 §7.4 |
| 1.1.3.9 Trazabilidad | Matriz necesidad → historia → requisito → CU → diseño → implementación → prueba | Cap. 08 §8.2 |
| 1.1.4.10 Selección de metodología | Scrum seleccionada con justificación de idoneidad | Cap. 05 §5.5 |
| 1.1.4.11 Justificación según cliente | Justificación vinculada a equipo, alcance, incertidumbre y contraparte | Cap. 05 §5.5 |
| 1.1.4.12 Comparación de alternativas | Comparación cuantitativa (27/25/22) y cualitativa con descartes | Cap. 05 §5.3, §5.4 |
| 1.1.5.13 Seguridad TI | Activos, amenazas, riesgos y controles iniciales | Cap. 09 |
| 1.1.5.14 Impacto ético y profesional | Privacidad, acceso, responsabilidad, tratamiento y cumplimiento | Cap. 10 |
| 1.1.5.15 Preguntas y justificación | Trazabilidad, conclusiones y defensa de decisiones | Cap. 08, 11 y este anexo |

## Anexo D · Correcciones docentes aplicadas (C-01…C-08)

| # | Origen | Corrección solicitada | Cómo se aplicó |
|---|---|---|---|
| **C-01** | `correcion 1eval1` | Priorizar con **MoSCoW** | NEC y RF/RNF priorizados con justificación por valor, urgencia, riesgo y factibilidad |
| **C-02** | `correcion 1eval1` | Comparar metodologías con **criterios y puntajes homogéneos** | 6 criterios en escala 1–5 → Scrum 27 · Scrumban 25 · Kanban 22 |
| **C-03** | `correcion 1eval1` | Agregar **impacto ético y profesional** | Cap. 10 con privacidad, responsabilidad, acceso, tratamiento, cumplimiento e impacto profesional |
| **C-04** | `correcion 1eval1` | Eliminar **HU11 inexistente**; crearla si se requiere | HU11 (documentación de API) creada; RF renumerados |
| **C-05** | `correcion 1eval1` | Decidir el **licenciamiento** | HU09 / RF15 movidos a *Won't (por ahora)*; supuesto `SUP-09` |
| **C-06** | `correcion 2eval1` | Ampliar **criterios de aceptación** | Cada HU con CA numerados y verificables (fecha/hora, exportación, severidad, códigos HTTP, etc.) |
| **C-07** | `correcion 2eval1` | Añadir **RNF11 (privacidad y cumplimiento)** | RNF11 (*Must*) con minimización, retención, logs y referencia a Ley 19.628/21.719 |
| **C-08** | `correcion 2eval1` | **Unificar los códigos** RF/RNF/HU | Único conjunto de identificadores en todas las tablas |

Estado: **C-01 … C-08 aplicadas**. Detalle completo en `docs/ES1/01-correcciones-aplicadas.md`.

## Anexo E · Supuestos y validaciones pendientes

| ID | Supuesto | Estado |
|---|---|---|
| SUP-01 | Variables sin sensor físico (pH, caudal) se tratan como **simuladas** | ⏳ Validar |
| SUP-04 | Un sensor puede asociarse a más de un cultivo (relación N:M) | ⏳ Validar |
| SUP-05 | El acceso no se restringe por sistema en el MVP (simplificación) | ⏳ Validar |
| SUP-06 | Retención de históricos fijada en 24 meses, parametrizable | ⏳ Validar |
| SUP-09 | El licenciamiento (HU09/RF15) no está respaldado por el desafío | ⏳ Validar |
| SUP-10 | Compatibilidad con la app Android "sin cambios": no se dispone del contrato actual | ⏳ Validar |

Los ocho aspectos a validar con la contraparte se listan en el capítulo 01 §1.6. El resto de los
supuestos (`SUP-01…SUP-10`) se administra en `docs/ES2/09-feedback-prototipo.md`.

## Anexo F · Sobre este informe

- **Naturaleza:** presentación académica del diagnóstico ES1. No redefine identificadores; el catálogo
  canónico es `docs/ES1/00-backlog-base.md`.
- **Cómo se generó:** a partir del análisis documental de las fuentes del proyecto (capítulo 12),
  respetando la regla de **no inventar cifras ni contenido**.
- **Qué no cubre:** el diseño detallado (ES2), la implementación y las pruebas ejecutadas (ES3) y el
  cierre (ES4); las referencias a esos artefactos en la matriz de trazabilidad son **forward
  references** que demuestran la coherencia de la cadena.
- **Mantenimiento:** si cambia un identificador o una prioridad, se actualiza primero el catálogo
  canónico y luego se propaga a los demás documentos.
