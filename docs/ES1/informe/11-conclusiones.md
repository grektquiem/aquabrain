# 11 · Conclusiones

## 11.1. Qué se logró

El equipo completó el **diagnóstico del problema informático** de AquaPlants/AquaBrain y lo tradujo
en decisiones de ingeniería verificables y trazables:

- **9 necesidades TI** identificadas y priorizadas con **MoSCoW** sobre cuatro criterios (valor,
  urgencia, riesgo y factibilidad).
- **11 historias de usuario** en formato rol–característica–razón, con criterios de aceptación
  numerados y verificables.
- **15 requerimientos funcionales** y **11 no funcionales**, clasificados, priorizados y con forma de
  verificación.
- **16 casos de uso** y **12 reglas de negocio** que completan el dominio.
- Una **metodología seleccionada y justificada** (Scrum, 27 puntos frente a Scrumban 25 y Kanban 22)
  mediante criterios y puntajes homogéneos.
- Un **análisis de seguridad** con activos, amenazas, riesgos y controles, y su **impacto ético y
  profesional**.
- Una **matriz de trazabilidad** que conecta cada necesidad con su evidencia final.

## 11.2. Decisiones clave y su fundamento

| Decisión | Fundamento |
|---|---|
| Priorizar con MoSCoW | Permite distinguir el núcleo del MVP de lo que puede esperar, con evidencia de negocio |
| Modelar el dominio de forma relacional | Los datos son inherentemente relacionales (sistema → dispositivo → sensor → medición) |
| Incluir la máquina como actor | El firmware real y el simulador tienen necesidades propias que se traducen en requisitos |
| Distinguir variables reales de simuladas | Evita atribuir al sistema datos que el hardware no produce |
| Elegir Scrum | Mayor puntaje y mejor ajuste a un equipo pequeño con incertidumbre técnica y hitos fijos |
| Declarar lo "Won't" explícitamente | Convierte las exclusiones en decisiones de alcance, no en olvidos |

## 11.3. Cumplimiento de la rúbrica

Los quince indicadores de la evaluación ES1 quedan cubiertos por capítulos concretos (ver Anexo C).
El criterio de calidad transversal —**trazabilidad y coherencia**— se satisface porque la cadena
necesidad → historia → requisito → caso de uso → diseño → implementación → prueba **cierra de extremo
a extremo** para todos los requisitos vigentes (Must y Should), y lo que no se implementó (*Won't*)
se declara como tal.

## 11.4. Límites y supuestos abiertos

El diagnóstico es honesto respecto de lo que **no** pudo confirmarse:

- El levantamiento fue **documental**; no hubo entrevistas formales, por lo que aspectos operativos
  (frecuencia de envío, umbrales, retención, relación cultivo–sensor) quedan como **supuestos a
  validar** con la contraparte.
- Variables como **pH y caudal** se declaran **simuladas** por ausencia de sensor físico.
- La **escalabilidad masiva**, la **autonomía local del firmware** y el **licenciamiento** quedan
  fuera del alcance por ahora.

## 11.5. Trabajo futuro inmediato

1. **Cerrar los supuestos** con la contraparte (ocho aspectos listados en el capítulo 01 §1.6).
2. Trasladar este diagnóstico al **diseño (ES2)**: arquitectura 4+1, modelo de datos, wireframes y
   plan de pruebas, manteniendo los identificadores estables.
3. Sostener la **matriz de trazabilidad viva** durante todo el semestre.

## 11.6. Cierre

El diagnóstico demuestra que el equipo **comprende el problema antes de diseñar o programar**: no
parte de la tecnología, sino de las necesidades del negocio; no inventa datos, sino que declara lo
real y lo simulado; y no acumula requisitos, sino que los prioriza y los traza. Este es el fundamento
sobre el que se construirán el diseño, la implementación y el cierre del proyecto.
