# 11 · Conclusiones

## 11.1. Qué se logró

El equipo transformó el diagnóstico de ES1 en un **diseño implementable, coherente y trazable**, y lo
organizó en seis artefactos que cubren los quince indicadores de la rúbrica de la Unidad 2:

- **Planificación (cap. 02).** Metodología **Scrum con sprints de dos semanas** seleccionada con el
  mismo criterio ponderado de ES1 (Scrum 27 · Scrumban 25 · Kanban 22), con roles, ceremonias,
  artefactos y una **definición de terminado**; un **cronograma por iteraciones** con responsables,
  entregables y fechas exactas; y una **matriz de dependencias** predecesor → sucesor con **ruta
  crítica** y **priorización por valor y riesgo**.
- **Arquitectura 4+1 (cap. 03).** Las cinco vistas —escenarios, lógica, procesos, desarrollo y
  física— con **siete escenarios arquitectónicamente significativos** (E-1…E-7), el modelo de dominio,
  los siete diagramas de proceso y la vista de despliegue con sus atributos de calidad.
- **Stack e infraestructura (cap. 04).** Tecnologías justificadas por **problema → necesidad →
  requisito**, con **alternativas descartadas**, una columna de **necesidad futura** y una topología de
  despliegue reproducible (Docker/CI-CD), más una tabla de riesgos tecnológicos RT-01…RT-06.
- **Prototipos y guía visual (cap. 05).** Inventario de **11 pantallas** con interacciones y estados,
  **seis wireframes** (W-01…W-06) de los procesos principales, flujo de extremo a extremo, *design
  system* con tokens, componentes y sus estados, guía responsive 360–1920 px y accesibilidad WCAG 2.1 AA.
- **Modelo de datos (cap. 06).** DER, modelo lógico con claves y cardinalidades, diccionario de datos,
  integridad, **12 índices justificados**, **particionado** de mediciones, análisis de normalización
  (1FN–BCNF) con **cinco desnormalizaciones deliberadas**, la decisión **SQL vs. NoSQL** y un DDL de
  referencia ejecutable (`docs/ES2/aquaplants_schema.sql`).
- **Seguridad (cap. 07) y pruebas (cap. 08).** Políticas de autenticación y autorización con **matriz
  rol ↔ permiso** y **matriz CRUD**, mapeo **OWASP Top 10 (2021)** y **STRIDE**, **12 riesgos
  priorizados** (RSK-01…RSK-12), **14 estándares de codificación segura** (EC-01…EC-14) y un **plan de
  pruebas** con la pirámide de pruebas, criterios de entrada/salida y un catálogo de **44 casos
  (TS-01…TS-44)** vinculados a los requisitos.

## 11.2. Decisiones clave y su fundamento

| Decisión | Fundamento |
|---|---|
| **Scrum** con sprints de 2 semanas (D-01) | Mayor puntaje y mejor ajuste a un equipo de tres personas con incertidumbre técnica e hitos de revisión |
| **Monolito modular** en NestJS (D-02) | Dominio cohesivo; extraíble a futuro sin reescribir el contrato `/api/v1` |
| **Monorepo** (D-03) | Un solo equipo, tipos/DTO compartidos y una única CI |
| **Persistencia híbrida** PostgreSQL + MongoDB (D-07) | El dominio exige integridad referencial; el *payload* del firmware varía con su versión |
| **Mediciones particionadas** (D-08) | La consulta de históricos es la dominante y crece de forma monotónica |
| **JWT corto + refresh rotativo** con RBAC (D-09) | API *stateless* para los tres clientes y control fino por rol |
| **API key por dispositivo** (D-10) | El ESP32-S3 no ejecuta flujos interactivos; la credencial es revocable e individual |
| **Validación de tiempo explícita** (D-11) | Es criterio de aceptación literal de HU08 (rechazo de futuro) y HU10 (aceptación de pasado) |
| **Contrato API como entregable** de primer nivel (D-13) | HU11 lo exige con cuatro criterios y protege la inversión del cliente |
| **Idempotencia** por `id_externo` + *store-and-forward* (D-14) | HU10 exige reintentos al reconectar sin duplicar |
| Declarar lo **Won't** explícitamente | Convierte las exclusiones en decisiones de alcance, no en olvidos |

## 11.3. Cumplimiento de la rúbrica

Los quince indicadores de la evaluación ES2 quedan cubiertos por capítulos concretos (ver el Anexo C).
El criterio de calidad transversal —**evidencia trazable y coherente**— se satisface porque la cadena
**necesidad → historia → requisito → caso de uso → diseño → implementación → prueba** cierra de extremo
a extremo para todos los requisitos vigentes (Must y Should) y **ninguna prueba queda huérfana** de una
necesidad (cap. 09 §9.5). Lo que no se implementó (*Won't*) se declara como tal.

## 11.4. Límites y supuestos abiertos

El diseño es honesto respecto de lo que **no** pudo confirmarse y de lo que **no** se construye en esta
fase:

- **Fase de diseño, no de implementación.** Ninguna funcionalidad se presenta como terminada; las
  columnas «resultado obtenido / evidencia» del catálogo de pruebas se completan en ES3.
- **Diez supuestos abiertos** (SUP-01…SUP-10) que dependen de la contraparte; el diseño adoptó una
  decisión provisoria para cada uno y **no se bloqueó**.
- **Variables simuladas.** El hardware disponible (ESP32-S3 + AHT10 + HC-SR04) no incluye sensores de
  **pH ni de caudal**, por lo que se declaran **simuladas y rotuladas**.
- **Escala masiva, autonomía local del firmware y licenciamiento** quedan fuera del alcance por ahora
  (RNF04, RNF09 y HU09/RF15/CU-16), documentados como estrategia futura.
- **Contrato de la app Android.** No se dispone del contrato que consume hoy; se asume `/api/v1` JSON
  plano y se valida con una app de prueba (SUP-10).

## 11.5. Trabajo futuro inmediato (puente a ES3)

1. **Cerrar los supuestos** SUP-01…SUP-10 en la reunión de validación con la contraparte.
2. **Implementar el diseño** en el monorepo (`apps/api`, `apps/web`, `apps/simulator`,
   `packages/shared`), con el esquema Prisma equivalente al modelo lógico y la guía visual traducida a
   tokens.
3. **Ejecutar el catálogo TS-01…TS-44** y completar, para cada caso, el resultado obtenido, el estado y
   la evidencia, manteniendo la **matriz de trazabilidad viva**.
4. **Verificar los umbrales** de RNF03 (dashboard < 2 s; históricos de 1 mes < 5 s con 50.000 registros) y de
   RNF02 (disponibilidad ≥ 99 % en 8:00–20:00).
5. **Sostener la coherencia** con el display OLED local (RNF05, RN-12) y la declaración de datos simulados.

## 11.6. Cierre

El diseño demuestra que el equipo **comprende cómo construir** la solución antes de programarla: no
parte de la tecnología, sino del problema de ES1; no acumula diagramas, sino que cada decisión se
justifica por un requisito y se puede verificar; no inventa resultados, sino que declara lo que es
diseño y lo que se ejecutará en ES3. La matriz de trazabilidad —con la columna de diseño completa y las
de implementación y prueba listas para llenarse— es el hilo que garantiza que la solución diseñada
responda, sin huecos, a las necesidades del cliente.
