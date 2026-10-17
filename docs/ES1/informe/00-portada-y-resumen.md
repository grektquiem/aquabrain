# ES1 — Diagnóstico del problema informático

## Plataforma web de monitoreo y gestión de cultivos aeropónico · AquaPlants / AquaBrain

**Informe académico de diagnóstico**

| | |
|---|---|
| **Institución** | INACAP |
| **Asignatura** | Proyecto Integrado — 4.º semestre |
| **Evaluación** | ES1 — Diagnóstico del problema informático (Unidad 1) |
| **Proyecto** | Sistema de Control y Monitoreo para AquaPlants / AquaBrain |
| **Equipo** | Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera |
| **Docente** | Armin Vladimir Brunt Ruth |
| **Contraparte** | AquaPlants / AquaBrain (Robotic Systems) |
| **Fecha** | 2026-10-16 |
| **Versión** | 2.0 — incorpora las correcciones `correcion 1eval1` y `correcion 2eval1` |

---

## Resumen ejecutivo

AquaPlants produce cultivos hidropónicos/aeropónicos verticales e integra sensores, electrónica
(la placa **AquaBrain**), conectividad, software y datos. Hoy la información del cultivo queda
**dispersa**: solo es visible en el display local del dispositivo o en una aplicación móvil, sin un
punto único de consulta, sin histórico centralizado y sin avisos automáticos cuando una variable
sale de rango. Este diagnóstico traduce ese contexto —entregado por la empresa y descrito en el
documento del desafío— en decisiones de ingeniería verificables.

El equipo analizó el ecosistema y a sus actores, identificó **9 necesidades TI (NEC-01…NEC-09)** y
las priorizó con la técnica **MoSCoW** sobre cuatro criterios (valor para el negocio, urgencia,
riesgo de no atenderlas y factibilidad técnica). A partir de ellas redactó **11 historias de usuario
(HU01…HU11)** en formato rol–característica–razón, cada una con criterios de aceptación numerados y
verificables; derivó **15 requerimientos funcionales (RF01…RF15)** y **11 no funcionales
(RNF01…RNF11)**; y documentó **16 casos de uso (CU-01…CU-16)** y **12 reglas de negocio (RN-01…RN-12)**.

Para el proceso de desarrollo se compararon tres metodologías con criterios y puntajes homogéneos
(escala 1–5): **Scrum 27**, Scrumban 25 y Kanban 22. Se seleccionó **Scrum con iteraciones de dos
semanas**, por su equilibrio entre trazabilidad, entregables demostrables por iteración y adecuación
a un equipo pequeño que enfrenta incertidumbre técnica (integración con firmware y una app móvil
existentes). El informe cierra con el análisis de seguridad (activos, amenazas, riesgos y controles
iniciales) y su impacto ético y profesional, con referencia a la normativa chilena de protección de
datos y a buenas prácticas de la industria.

**Fuera de alcance por ahora (declarado):** la escalabilidad masiva (cientos o miles de equipos), la
autonomía local del dispositivo —que depende del firmware— y el licenciamiento por cliente. No se
inventan cifras ni resultados: lo que no se ejecutó se declara como tal.

> **Trazabilidad.** Este informe es el artefacto de diagnóstico (ES1). La cadena
> necesidad → historia → requisito → caso de uso → diseño → implementación → prueba se mantiene
> **viva** durante todo el semestre, tal como lo pide el desafío; la versión consolidada de esa
> matriz se presenta en el capítulo 08, con referencias al diseño (ES2) y a la implementación y
> pruebas (ES3).

---

## Cómo este informe cubre la rúbrica

Cada indicador de la evaluación ES1 se aborda en un capítulo específico de este informe:

| Indicador de la rúbrica | Dónde se evidencia |
|---|---|
| 1.1.1.1 · Identifica necesidades TI con buenas prácticas | Cap. 03 (§3.2, §3.3) |
| 1.1.1.2 · Reconoce tendencias TI aplicables y su impacto | Cap. 04 |
| 1.1.1.3 · Prioriza las necesidades justificadamente | Cap. 03 (§3.3) |
| 1.1.2.4 · Redacta historias de usuario claras y detalladas | Cap. 06 (§6.2) |
| 1.1.2.5 · Incluye roles, objetivos y criterios de aceptación | Cap. 06 (§6.2) |
| 1.1.2.6 · Adapta las historias al negocio y a los usuarios finales | Cap. 06 (§6.3) |
| 1.1.3.7 · Clasifica RF y RNF con precisión | Cap. 07 (§7.2, §7.3) |
| 1.1.3.8 · Ejemplos claros de cada tipo de requerimiento | Cap. 07 (§7.4) |
| 1.1.3.9 · Relaciona requerimientos y necesidades del negocio | Cap. 08 (§8.2) |
| 1.1.4.10 · Selecciona y explica la metodología | Cap. 05 (§5.5) |
| 1.1.4.11 · Justifica la metodología según cliente y problemática | Cap. 05 (§5.5) |
| 1.1.4.12 · Compara metodologías alternativas y descarta | Cap. 05 (§5.2–§5.4) |
| 1.1.5.13 · Necesidades de seguridad TI e importancia | Cap. 09 |
| 1.1.5.14 · Impacto ético y profesional de la seguridad | Cap. 10 |
| 1.1.5.15 · Responde preguntas y justifica decisiones | Cap. 08, 11 y Anexo C |

---

## Índice

- **00** Portada y resumen ejecutivo
- **01** Introducción, contexto y alcance del diagnóstico
- **02** Caracterización del ecosistema y de los actores
- **03** Matriz de necesidades TI y priorización
- **04** Tendencias de TI aplicables
- **05** Metodología de desarrollo
- **06** Historias de usuario (backlog inicial)
- **07** Catálogo de requerimientos funcionales y no funcionales
- **08** Trazabilidad y relaciones entre artefactos
- **09** Necesidades de seguridad de la información
- **10** Impacto ético y profesional
- **11** Conclusiones
- **12** Bibliografía
- **13** Anexos

---

## Nota metodológica y de honestidad intelectual

1. **Fuente del levantamiento.** El diagnóstico se construyó a partir del **análisis documental** del
   documento del desafío, de los **antecedentes base entregados por la empresa** y del **material
   técnico** (firmware del ESP32-S3, sensores y app Android de prueba). No se realizaron entrevistas
   formales con la contraparte durante ES1; por eso los aspectos operativos que no pudieron
   confirmarse quedaron registrados explícitamente como **supuestos a validar** (cap. 01 §1.6).
2. **Sin datos inventados.** Las variables que el hardware real no mide (por ejemplo pH o caudal) se
   declaran como **simuladas**; no se atribuyen lecturas reales a sensores que no existen.
3. **Correcciones del docente aplicadas.** Este informe corresponde a la **versión corregida** del
   catálogo ES1; las observaciones de la Evaluación 1 y su tratamiento se documentan en el cap. 13
   (Anexo D) y en `docs/ES1/01-correcciones-aplicadas.md`.
4. **Artefactos canónicos.** El catálogo de identificadores (NEC, HU, RF, RNF, CU, RN) y su fuente de
   verdad están en `docs/ES1/00-backlog-base.md`. Este informe es su presentación académica y no
   redefine identificadores.
