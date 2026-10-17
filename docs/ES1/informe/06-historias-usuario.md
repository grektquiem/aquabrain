# 06 · Historias de usuario (backlog inicial)

## 6.1. Formato adoptado

Cada historia se redacta con la estructura **rol — característica — razón** (equivalente a
*«Como [rol], quiero [característica] para [razón/beneficio]»*) y se acompaña de **criterios de
aceptación numerados (CA①, CA②, …)**, verificables y medibles. Este formato cumple tres exigencias
de la rúbrica a la vez: incluye el **actor**, su **objetivo** y las **condiciones de aceptación**.

Además, cada historia declara los **requerimientos funcionales (RF)** que la satisfacen, lo que
permite trazar historia → requerimiento (capítulo 08).

## 6.2. Backlog HU01…HU11

| ID | Rol | Característica | Razón | Criterios de aceptación | RF |
|---|---|---|---|---|---|
| **HU01** | Encargado de Cultivo | Visualizar un dashboard con el estado actual de todas las variables (temperatura, humedad, pH, caudal, nivel) | Para tomar decisiones rápidas y oportunas sobre riego y nutrientes | ① Muestra la última medición de cada sensor por sistema. ② Se actualiza automáticamente o mediante botón de refresco. ③ Los valores fuera de rango se distinguen visualmente. ④ Indica fecha y hora de la última medición. | RF07 |
| **HU02** | Encargado de Cultivo | Consultar el histórico de una variable en un rango de fechas | Para detectar tendencias estacionales o anomalías en el cultivo | ① Filtra por sistema, sensor, fecha de inicio y fin. ② Muestra gráfico de líneas y tabla paginada. ③ Permite exportar los datos consultados. | RF08 |
| **HU03** | Encargado de Cultivo | Recibir alertas automáticas cuando un valor supere un umbral predefinido | Para actuar de inmediato antes de que el cultivo sufra daños críticos | ① La alerta se genera al recibir una medición fuera de norma. ② Aparece en el dashboard con severidad y timestamp. ③ Puede marcarse como resuelta. ④ Queda registro histórico de la alerta. | RF11, RF12 |
| **HU04** | Supervisor | Comparar el desempeño de varios sistemas AquaBrain en un mismo gráfico | Para identificar instalaciones con bajo rendimiento operativo | ① Selección múltiple de sistemas para una variable común. ② Líneas superpuestas con colores y leyenda. ③ Permite filtrar por rango de fechas. | RF09 |
| **HU05** | Administrador | Gestionar usuarios y sus roles de acceso | Para cumplir el principio de privilegio mínimo y proteger la plataforma | ① CRUD completo de usuarios. ② Asignación de roles: Encargado, Supervisor, Administrador. ③ Contraseñas protegidas con bcrypt. ④ Un administrador no puede eliminar su propia cuenta. | RF01, RF02 |
| **HU06** | Administrador | Registrar instalaciones, dispositivos físicos y sensores | Para mantener actualizado el inventario operativo de la plataforma | ① Formulario para agregar sistemas y asociar dispositivos/sensores. ② Validación estricta de campos obligatorios y unicidad. ③ Permite listar, editar y eliminar registros. | RF03, RF04, RF05 |
| **HU07** | Administrador | Definir umbrales y reglas de alerta personalizadas | Para adaptar el comportamiento de aviso según los parámetros del cultivo | ① Interfaz de configuración: variable, condición, valor y severidad. ② Opción de activar o desactivar reglas. ③ Permite **probar la regla con una medición simulada**. | RF10 |
| **HU08** | Dispositivo / Simulador IoT | Enviar mediciones a través de una API REST protegida | Para que la plataforma centralice y persista la información generada en terreno | ① `POST /api/mediciones` acepta JSON estructurado. ② Valida existencia de sistema y sensor. ③ **Rechaza marcas de tiempo futuras.** ④ Responde **201** en éxito, **400** en error de validación y **401** sin autenticación. | RF06 |
| **HU09** | Administrador / Comercial | Administrar suscripciones y licencias de uso por cliente o instalación | Para controlar la vigencia del servicio y los niveles de acceso | ① CRUD de vigencia de licencias por cliente o instalación. ② Restricción automática de acceso si la licencia está expirada. ③ Historial de cambios de licencia. ④ **Supuesto a validar**: no está respaldado explícitamente por el desafío. | RF15 (*Won't*) |
| **HU10** | Dispositivo / Simulador IoT | Almacenar mediciones localmente ante cortes de red y reintentar su envío al reconectar | Para evitar la pérdida de datos críticos durante conectividad intermitente | ① La API acepta marcas de tiempo **pasadas**. ② El dispositivo almacena datos offline temporalmente. ③ Ejecuta reintentos automáticos al recuperar la red. ④ Registra sincronización exitosa o fallida. | RF06, RF14 |
| **HU11** | Desarrollador de Integraciones | Acceder a documentación OpenAPI/Swagger actualizada y versionada | Para integrar la app Android existente y el firmware sin duplicar lógica de negocio | ① Documentación OpenAPI/Swagger publicada y versionada. ② Incluye endpoints, esquemas, códigos de error y ejemplos. ③ Validada contra la app Android de prueba. ④ Permite generar clientes de API automáticamente. | RF13 |

> **Cobertura de roles.** El backlog cubre los cuatro actores del desafío: los tres roles humanos
> (Encargado, Supervisor, Administrador) y los actores máquina (Dispositivo/Simulador), además del
> rol técnico de integración (HU11). Los criterios de aceptación se ampliaron como parte de las
> correcciones del docente (ver Anexo D, C-06).

## 6.3. Adaptación de las historias al negocio y a los usuarios finales

Las historias no son genéricas: cada una recoge una particularidad del negocio de AquaPlants.

| Aspecto específico del negocio | Historia adaptada | En qué se nota que es propia de AquaPlants |
|---|---|---|
| Cultivo hidropónico/aeropónico | HU01, HU02 | El dashboard y los históricos muestran variables de cultivo (temperatura, humedad, nivel, pH, caudal), no métricas genéricas |
| Múltiples sistemas AquaBrain | HU04 | El supervisor compara **varios sistemas** en un mismo gráfico, algo propio de una operación con varias instalaciones |
| Conectividad intermitente en terreno | HU10 | El dispositivo puede reenviar mediciones tras una caída, reflejando la realidad operacional |
| Roles organizacionales diferenciados | HU05, HU06, HU07 | El administrador gestiona usuarios, inventario y reglas; el encargado opera; el supervisor analiza |
| Dispositivo como actor | HU08, HU10 | La máquina tiene historias propias (enviar y reintentar), coherente con el firmware real |
| App móvil ya existente | HU11 | Se exige documentación de API para no romper ni duplicar la app Android de la empresa |
| Consistencia con el display local | HU01 (CA①/③) y RNF05 | La información del dashboard no debe contradecir lo que muestra el OLED del AquaBrain |

## 6.4. Priorización y plan de entregas

La priorización MoSCoW de las historias se alinea con la de los requisitos y define el orden de
construcción:

| Historia | MoSCoW | Iteración prevista | Justificación |
|---|---|---|---|
| HU06, HU08 | **Must** | Sprint 1 | Datos maestros e ingesta: sin ellos no hay nada que mostrar |
| HU01, HU03 | **Must** | Sprint 2 | Dashboard y alertas: el valor central para el encargado |
| HU05, HU07 | **Should** | Sprint 3 | Gestión de usuarios y reglas: completan la administración |
| HU02 | **Should** | Sprint 3 | Históricos: valor analítico |
| HU10, HU11 | **Should** | Sprint 3–4 | Resiliencia e integración con clientes existentes |
| HU04 | **Could** | Sprint 4 | Comparativas: valor estratégico opcional |
| HU09 | **Won't** | — | Licenciamiento fuera de alcance por ahora (supuesto a validar) |

## 6.5. Historia fuera de alcance

**HU09 (licenciamiento)** se mantiene en el backlog pero clasificada como *Won't (por ahora)*: el
desafío no la respalda explícitamente, por lo que se documenta su forma sin implementarla y queda como
supuesto a validar con la contraparte. Su inclusión explícita —en lugar de omitirla— demuestra que la
exclusión fue una **decisión consciente** y no un olvido.
