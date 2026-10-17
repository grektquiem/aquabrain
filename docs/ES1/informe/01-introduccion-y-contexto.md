# 01 · Introducción, contexto y alcance del diagnóstico

## 1.1. Contexto de la empresa y del desafío

**AquaPlants** es un sistema de producción de cultivos **hidropónicos y aeropónicos verticales**.
No es solo una estructura de cultivo: integra, en una misma solución, el producto físico, la
electrónica de sensado y comunicación, y una capa digital de monitoreo y gestión. El elemento
electrónico central es la placa **AquaBrain**, que actúa como **punto de encuentro entre el sistema
físico y la capa digital**: recibe señales de los sensores y puede enviar información a la nube.

El desafío entregado por la empresa pide **construir una plataforma web** que centralice la
información del cultivo, muestre el estado actual y los históricos, genere alertas automáticas ante
valores fuera de rango y controle el acceso mediante autenticación y roles. El foco es **software**:
no es obligatorio fabricar ni programar la electrónica, y el origen de los datos puede ser un
**simulador** o el propio firmware real. En palabras del documento del desafío:

> «El desafío se centra en software y no en la fabricación del hardware. […] La solución debe
> enfocarse en frontend, backend/API, base de datos y nube.»

La empresa aporta **antecedentes reales** que condicionan el diseño: un firmware sobre **ESP32-S3**
que ya sensa variables (temperatura y humedad con **AHT10**; distancia —usada como referencia de
nivel— con **HC-SR04**), un display **OLED SSD1309** con **joystick** para operación local, y una
**app Android de prueba** ya construida que se conecta al dispositivo. Estos antecedentes no son
decorativos: obligan a que la plataforma web **conviva** con clientes que ya existen.

## 1.2. Situación problemática (diagnóstico)

Del análisis del contexto se desprende que el problema no es la falta de datos, sino su
**dispersión y falta de explotación**. Los síntomas observados son:

1. **Información dispersa.** Los datos de instalaciones, cultivos, dispositivos y sensores solo son
   visibles en el display local del AquaBrain o en la app móvil; no existe un punto único de
   consulta ni una base de datos consistente.
2. **Estado actual no accesible.** El encargado debe inspeccionar físicamente el sistema para
   conocer las variables del cultivo, lo que retrasa decisiones de riego y nutrición.
3. **Ausencia de avisos automáticos.** No hay un mecanismo que avise cuando una variable sale de
   rango, con el consiguiente riesgo de pérdida de cultivo.
4. **Acceso no controlado.** La información no está protegida por autenticación ni por roles, lo que
   expone datos operativos y de usuarios.
5. **Conectividad intermitente.** En terreno puede perderse la conexión; sin almacenamiento local y
   sincronización posterior, se pierden mediciones.
6. **Sin visión de conjunto.** El supervisor no dispone de herramientas para comparar sistemas ni
   analizar tendencias.
7. **Crecimiento no previsto.** La combinación de firmware y app aislada no está pensada para
   escalar de pocos equipos a cientos o miles.

## 1.3. Objetivo general y objetivos específicos

**Objetivo general.** Comprender el problema informático de AquaPlants/AquaBrain y traducirlo en un
diagnóstico trazable —necesidades, historias de usuario, requerimientos, metodología y seguridad—
que sirva de base verificable para el diseño (ES2), la implementación (ES3) y el cierre (ES4).

**Objetivos específicos.**

1. Identificar y priorizar las necesidades TI del negocio (MoSCoW sobre valor, urgencia, riesgo y
   factibilidad).
2. Reconocer las tendencias TI aplicables y descartar las que no aportan valor al contexto.
3. Redactar un backlog inicial de historias de usuario con criterios de aceptación verificables.
4. Clasificar los requerimientos funcionales y no funcionales y relacionarlos con las necesidades.
5. Seleccionar y justificar una metodología de desarrollo comparándola con alternativas.
6. Identificar las necesidades de seguridad y analizar su impacto ético y profesional.
7. Establecer una matriz de trazabilidad que conecte cada necesidad con su evidencia final.

## 1.4. Alcance del diagnóstico

**Incluido en este diagnóstico.**

- Caracterización del ecosistema y de los actores (humanos y máquina).
- Necesidades TI priorizadas y su evidencia.
- Análisis de tendencias, metodología, historias de usuario, requerimientos y casos de uso.
- Seguridad inicial (activos, amenazas, riesgos y controles) y análisis ético.
- Matriz de trazabilidad hacia el diseño, la implementación y las pruebas.

**Excluido del diagnóstico (corresponde a etapas posteriores o queda fuera de alcance).**

- El diseño detallado (arquitectura 4+1, modelo de datos físico, wireframes): **ES2**.
- La implementación y la ejecución de pruebas: **ES3**.
- La fabricación o programación del hardware: **fuera del desafío**.
- La escalabilidad masiva real, la autonomía local del firmware y el licenciamiento: **declaradas
  como fuera de alcance por ahora** (ver cap. 03 §3.4).

## 1.5. Enfoque y fuentes del levantamiento

El levantamiento se realizó por **análisis documental** del material entregado por la empresa y del
instrumento de evaluación. Las fuentes utilizadas son:

| Fuente | Tipo | Aporte al diagnóstico |
|---|---|---|
| Documento del desafío (AquaPlants rev. 1) | Especificación de la empresa | Contexto, actores, dominio, MVP, restricciones, escala y reglas operacionales |
| Antecedentes base entregados por la empresa | Especificación de la empresa | Ecosistema, variables, reglas operacionales y estructura de datos sugerida |
| Material técnico y datasets (Robotic Systems) | Insumo técnico | Existencia de firmware (ESP32-S3), sensores (AHT10, HC-SR04) y app Android de prueba |
| Instrumento de evaluación ES1 y su rúbrica | Marco académico | Indicadores exigidos y criterio de calidad (trazabilidad) |
| Correcciones `correcion 1eval1` y `correcion 2eval1` | Retroalimentación docente | Ajustes aplicados (MoSCoW, comparación de metodologías, ética, unificación de códigos) |

> **Método.** Se identificaron los actores y el flujo dispositivo → dato → aplicación; se levantaron
> las necesidades por actor; se redactaron historias y criterios de aceptación; se clasificaron los
> requerimientos; y se priorizó con MoSCoW. Todo el material se mantiene con **identificadores
> únicos y estables** para permitir la trazabilidad.

## 1.6. Supuestos y validaciones pendientes con la contraparte

El desafío enumera explícitamente los aspectos que el equipo debe **validar con la contraparte**. Al
no haberse realizado entrevistas formales durante ES1, estos puntos se registran como **supuestos a
validar** y no como hechos:

| # | Aspecto a validar | Tratamiento provisional |
|---|---|---|
| 1 | Qué variables y sensores priorizar en el prototipo | Se priorizan las reales (temperatura, humedad, nivel); pH y caudal como simulados |
| 2 | Frecuencia deseada de envío de mediciones | Se asume un intervalo configurable por dispositivo |
| 3 | Rangos/umbrales que originan una alerta | Configurables por el administrador (reglas), no fijados en código |
| 4 | Qué información debe mostrar primero el dashboard | Estado actual por sensor y sistema, luego alertas recientes |
| 5 | Relación operativa sistema ↔ cultivo ↔ planta ↔ dispositivo ↔ sensor | Modelada como jerarquía; su forma exacta es un supuesto |
| 6 | Tiempo de conservación de los históricos | Se documenta como parámetro de política de datos |
| 7 | Comportamiento cuando un dispositivo deja de reportar | Se marca "sin comunicación" tras superar un múltiplo de su intervalo |
| 8 | Qué datos son reales controlados y qué debe permanecer simulado | Real: AHT10/HC-SR04. Simulado: variables sin sensor físico |

Estos supuestos heredan a ES2 (`docs/ES2/09-feedback-prototipo.md`, `SUP-01…SUP-10`) y deben cerrarse
con la contraparte.

## 1.7. Estructura del informe

El capítulo **02** caracteriza el ecosistema y los actores; el **03** presenta la matriz de
necesidades y su priorización; el **04** analiza las tendencias TI; el **05** justifica la
metodología; los capítulos **06** y **07** contienen las historias de usuario y el catálogo de
requerimientos; el **08** establece la trazabilidad; y los capítulos **09** y **10** abordan la
seguridad y su impacto ético y profesional. Cierran el **11** (conclusiones), **12** (bibliografía) y
**13** (anexos).
