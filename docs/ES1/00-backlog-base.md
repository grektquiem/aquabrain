# ES1 — Catálogo base consolidado (**versión corregida**)

> **Este es el catálogo canónico del proyecto.** Reemplaza la primera versión y ya incorpora
> las correcciones `correcion 1eval1` y `correcion 2eval1`. Toda la documentación de ES2 se traza contra
> estos identificadores. Si algo cambia, se actualiza **aquí** y se propaga a ES2.

Proyecto: **Sistema de Control y Monitoreo para AquaPlants / AquaBrain**
Equipo: Benjamín Alfonso Espinoza Gangas · Luis Humberto Pizarro Muñoz · Rodrigo Andrés Terraza Herrera
Docente: Armin Vladimir Brunt Ruth · Última actualización: 2026-10-16

---

## 1. Actores

| Actor | Necesidad inicial |
|---|---|
| Encargado de cultivo | Ver estado actual, históricos y alertas; operar el cultivo |
| Supervisor | Comparar sistemas, analizar tendencias e indicadores |
| Administrador | Gestionar usuarios, roles, sistemas, dispositivos, sensores y reglas |
| Dispositivo / AquaBrain (ESP32-S3) | Enviar mediciones por API y operar localmente sin conectividad |
| Simulador IoT | Generar mediciones en ausencia de hardware |
| Desarrollador de Integraciones | Consumir la API documentada (app Android existente, firmware, futuros clientes) |

### Hardware y clientes reales entregados por la empresa

| Elemento | Antecedente | Implicancia de software |
|---|---|---|
| **ESP32-S3** (firmware `main.cpp`) | Dispositivo AquaBrain real que sensa y transmite | La API debe recibir el formato del firmware real, no solo del simulador |
| **AHT10** | Temperatura y humedad | Tipos de variable `TEMPERATURA` (°C) y `HUMEDAD` (%) reales |
| **HC-SR04** | Distancia, usada como referencia de nivel (estanque/solución nutritiva) | Tipo de variable `DISTANCIA`/`NIVEL` (cm) |
| **Display OLED SSD1309 + joystick con pulsador** | Operación local autónoma | La plataforma debe tolerar cortes y ser **consistente** con lo que muestra el display |
| **App Android 14 (prueba)** | Cliente ya construido que se conecta al dispositivo | API-first versionada y documentada para no duplicar lógica ni romper clientes |

---

## 2. Matriz de necesidades TI (NEC) con MoSCoW

| ID | Problema observado | Necesidad TI | MoSCoW | Evidencia |
|---|---|---|---|---|
| NEC-01 | Datos de instalaciones, cultivos, dispositivos y sensores dispersos; solo visibles en el display local o la app | Centralizar la información en una plataforma web única con base de datos consistente | **Must** | Documento del desafío; diagrama de flujo de datos |
| NEC-02 | El encargado no conoce el estado actual sin inspeccionar físicamente el sistema | Dashboard web con el estado actual (última medición) por sensor y por sistema | **Must** | Ficha de actores |
| NEC-03 | No existe aviso automático cuando una variable sale de rango | Motor de reglas/umbrales que genere alertas al recibir una medición fuera de rango | **Should** | Sección "Información de dominio sugerida" |
| NEC-04 | El firmware del ESP32-S3 ya genera datos reales (AHT10, HC-SR04) que solo se ven en el OLED | API de ingesta que reciba y valide mediciones del firmware real, además del simulador | **Must** | Firmware `main.cpp`; especificaciones AHT10 y HC-SR04 |
| NEC-05 | Existe una app Android de prueba que puede convertirse en un silo independiente | API-first documentada y versionada que integre la app Android y futuros clientes | **Should** | App Android AquaBrain de prueba (Robotic Systems) |
| NEC-06 | El AquaBrain opera localmente con OLED y joystick; debe seguir siendo útil sin Internet | Tolerar pérdidas temporales de conectividad con reintentos y sincronización posterior | **Could** | Hardware entregado; documento de contexto |
| NEC-07 | El acceso a la información no está controlado | Autenticación robusta (JWT) y control de acceso por roles (RBAC) | **Must** | Actores del desafío |
| NEC-08 | El supervisor no puede comparar sistemas ni analizar tendencias | Módulo de históricos con gráficos y comparación entre múltiples sistemas | **Could** | Ficha de actores ("Supervisor") |
| NEC-09 | La combinación firmware + app aislada no está pensada para escalar a cientos o miles de equipos | Diseño escalable (índices, normalización, estrategia de particionamiento) documentado | **Won't (por ahora)** | Sección "Escala esperada" del desafío |

**Priorización aplicada (corrección 1eval1):** MoSCoW sobre cuatro criterios — valor para el negocio, urgencia, riesgo de no atenderla y factibilidad técnica en el prototipo académico.

---

## 3. Análisis de tendencias TI aplicables (síntesis del ES1)

| Tendencia | Aplicación en AquaPlants | Impacto en el proyecto |
|---|---|---|
| IoT | ESP32-S3 con AHT10 y HC-SR04 sensa variables reales y transmite a la nube | API capaz de recibir tráfico del firmware real y exponer estado de conexión (RF06, RF14) |
| Edge computing / interfaz local embebida | OLED SSD1309 + joystick permiten operar sin nube | Requisito de autonomía local y sincronización posterior (NEC-06, RNF09) |
| API-first / multi-cliente | App Android y dashboard web consumen la misma fuente | Contratos estables, versionados y documentados (RF13, RNF08) |
| Cloud-native / contenedores | Docker para frontend, backend y BD | Reproducibilidad del entorno y despliegue simple (RNF07) |
| Dashboards en tiempo real | Polling o WebSocket del estado | Experiencia del encargado y consistencia con el display local (RF07, RNF05) |
| Seguridad Zero Trust | Autenticación y validación en cada petición desde los tres clientes | No confiar en ningún cliente; control por rol y por dispositivo (RNF01) |
| BD relacional con series temporales | PostgreSQL con índices compuestos `(sensor_id, timestamp)` | Históricos eficientes; migración futura a TimescaleDB si el volumen crece |

---

## 4. Historias de usuario (HU01–HU11) — versión corregida

Formato: **rol — característica — razón** + criterios de aceptación verificables.

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
| **HU09** | Administrador / Comercial | Administrar suscripciones y licencias de uso por cliente o instalación | Para controlar la vigencia del servicio y los niveles de acceso | ① CRUD de vigencia de licencias por cliente o instalación. ② Restricción automática de acceso si la licencia está expirada. ③ Historial de cambios de licencia. ④ **Supuesto a validar**: no está respaldado explícitamente por el desafío. | RF15 (*Won't por ahora*) |
| **HU10** | Dispositivo / Simulador IoT | Almacenar mediciones localmente ante cortes de red y reintentar su envío al reconectar | Para evitar la pérdida de datos críticos durante conectividad intermitente | ① La API acepta marcas de tiempo **pasadas**. ② El dispositivo almacena datos offline temporalmente. ③ Ejecuta reintentos automáticos al recuperar la red. ④ Registra sincronización exitosa o fallida. | RF06, RF14 |
| **HU11** | Desarrollador de Integraciones | Acceder a documentación OpenAPI/Swagger actualizada y versionada | Para integrar la app Android existente y el firmware sin duplicar lógica de negocio | ① Documentación OpenAPI/Swagger publicada y versionada. ② Incluye endpoints, esquemas, códigos de error y ejemplos. ③ Validada contra la app Android de prueba. ④ Permite generar clientes de API automáticamente. | RF13 |

> **Corrección aplicada:** se eliminó toda referencia a una «HU11 inexistente». `HU11` ahora existe y corresponde a documentación de API para integraciones; los RF y RNF se renumeraron en consecuencia.

---

## 5. Requerimientos funcionales (RF01–RF15) con MoSCoW

| ID | Descripción | HU | MoSCoW | Necesidad | Verificabilidad |
|---|---|---|---|---|---|
| **RF01** | Autenticación y autorización con JWT y roles (encargado, supervisor, administrador) | HU05 | **Must** | NEC-07 | Probar que un usuario sin token no accede a endpoints protegidos |
| **RF02** | Gestión de usuarios (CRUD) restringida a administradores | HU05 | **Must** | NEC-07 | Probar que un encargado no puede crear ni eliminar usuarios |
| **RF03** | Gestión de sistemas/instalaciones (CRUD) con nombre, ubicación y descripción | HU06 | **Must** | NEC-01 | Probar creación, edición y eliminación de sistemas |
| **RF04** | Gestión de dispositivos asociados a sistemas | HU06 | **Must** | NEC-01 | Probar que un dispositivo se asigna correctamente a un sistema |
| **RF05** | Gestión de sensores asociados a dispositivos, incluyendo tipo de variable y unidad (°C, %, cm, pH, L/min) | HU06 | **Must** | NEC-01 | Verificar que los sensores se crean con los atributos correctos |
| **RF06** | Registro de mediciones vía API (`POST /api/mediciones`), desde firmware ESP32 real (AHT10, HC-SR04) o simulador, con validación de existencia de sistema y sensor | HU08 | **Must** | NEC-04 | Enviar datos válidos e inválidos, con origen simulado y con formato del firmware real, y comprobar respuestas HTTP |
| **RF07** | Dashboard con la última medición de cada sensor por sistema, con indicadores visuales | HU01 | **Must** | NEC-02 | Comprobar que el dashboard refleja los últimos datos insertados |
| **RF08** | Consulta de históricos con filtros (sistema, sensor, rango de fechas) y visualización en tabla y gráfico | HU02 | **Should** | NEC-08 | Realizar consultas con distintos filtros y verificar resultados |
| **RF09** | Comparativa gráfica de múltiples sistemas para una misma variable | HU04 | **Could** | NEC-08 | Seleccionar varios sistemas y verificar la superposición de líneas |
| **RF10** | CRUD de reglas de alerta (nombre, variable, condición, umbral, severidad, activa/inactiva) | HU07 | **Must** | NEC-03 | Crear una regla y verificar que se guarda correctamente |
| **RF11** | Motor de alertas que evalúa cada nueva medición contra las reglas activas y genera registros de alerta | HU03 | **Must** | NEC-03 | Insertar una medición que incumpla una regla y comprobar que se genera la alerta |
| **RF12** | Lista de alertas con filtros (activas/resueltas, por sistema) y opción de marcar como resuelta | HU03 | **Must** | NEC-03 | Marcar una alerta como resuelta y verificar que sale de la lista de activas |
| **RF13** | Documentación de API (contrato estable OpenAPI/Swagger, versionado) para que la app Android y el firmware se integren sin duplicar lógica | HU11 | **Should** | NEC-05 | Validar contra la app Android de prueba que los endpoints responden como se espera |
| **RF14** | Registro y consulta del estado de conexión y "última comunicación" de cada dispositivo | HU10 | **Should** | NEC-06 | Simular una desconexión y verificar que el dashboard y el display local reflejan "sin conexión" |
| **RF15** | Gestión de suscripción y licenciamiento por cliente/instalación | HU09 | **Won't (por ahora)** | — | Módulo fuera del alcance actual; supuesto a validar con la contraparte |

> **Nota de alineación:** RF13 puede expresarse también como RNF de interoperabilidad; se mantiene como **RF** porque es un **entregable contractual de la API**. RF15 queda como *Won't (por ahora)* y pasa a *Could* solo si la contraparte confirma el requisito.

---

## 6. Requerimientos no funcionales (RNF01–RNF11) con MoSCoW

| ID | Descripción | Propósito | MoSCoW | Verificabilidad |
|---|---|---|---|---|
| **RNF01** | Seguridad: contraseñas hasheadas (bcrypt), JWT con expiración, HTTPS en producción, validación de entrada, protección contra inyección SQL/XSS | Proteger datos de cultivo y de usuarios | **Must** | Revisión de código; pruebas básicas de penetración (SQLi, XSS) |
| **RNF02** | Disponibilidad: 99 % durante el horario de operación (8:00–20:00) en el entorno de prueba | Que los encargados accedan cuando lo necesiten | **Should** | Monitoreo de uptime durante las pruebas |
| **RNF03** | Rendimiento: dashboard < 2 s; consultas históricas de 1 mes < 5 s para 50.000 registros | Experiencia de usuario aceptable | **Should** | Pruebas de carga (JMeter, Artillery u otra) |
| **RNF04** | Escalabilidad: diseño con índices y normalización; documentación de estrategias futuras (particionamiento, réplicas) | Preparar el crecimiento hacia cientos de sistemas | **Won't** (se documenta) | Revisión del modelo de datos y su justificación |
| **RNF05** | Usabilidad: interfaz web responsive, navegación intuitiva, mensajes de error claros; **consistencia con la información del display OLED local** | Usuarios no técnicos (encargados de cultivo) | **Must** | Pruebas de usabilidad con usuarios simulados |
| **RNF06** | Mantenibilidad: buenas prácticas, control de versiones (Git), documentación actualizada | Facilitar futuras mejoras del equipo o de la empresa | **Must** | Inspección de código y README |
| **RNF07** | Portabilidad: despliegue con Docker o PaaS usando variables de entorno | Ejecución en cualquier proveedor cloud | **Should** | Despliegue en al menos dos entornos (local y nube) |
| **RNF08** | Interoperabilidad: la API debe ser consumible por el firmware ESP32, la app Android existente y el dashboard web, sin requerir cambios en los clientes ya construidos | Proteger la inversión de AquaPlants en hardware y app móvil | **Should** | Pruebas de integración con la app Android de prueba |
| **RNF09** | Autonomía local: el AquaBrain debe seguir mostrando información útil (OLED + joystick) durante una pérdida temporal de conectividad y sincronizar al reconectarse | Continuidad operativa en zonas con conectividad intermitente | **Won't** (depende del firmware) | Simular corte de red y verificar operación local y sincronización posterior |
| **RNF10** | Pruebas: cobertura unitaria ≥ **70 %** en backend; pruebas de integración para la API; pruebas de carga básicas | Asegurar calidad y detección temprana de errores | **Should** | Informe de cobertura de pruebas |
| **RNF11** | Privacidad y cumplimiento ético: minimización, retención limitada, logs de auditoría, anonimización cuando sea posible, referencia a Ley 19.628 y Ley 21.719 | Cumplir principios éticos, legales y profesionales | **Must** | Revisión de la política de datos y de los logs de auditoría |

---

## 7. Matriz MoSCoW consolidada (RF y RNF)

| ID | Tipo | Descripción breve | HU | MoSCoW | Prioridad relacionada |
|---|---|---|---|---|---|
| RF01 | RF | Autenticación JWT y roles | HU05 | M | Autenticación y roles |
| RF02 | RF | CRUD de usuarios restringido a administrador | HU05 | M | Autenticación y roles |
| RF03 | RF | CRUD de sistemas/instalaciones | HU06 | M | Centralización de datos |
| RF04 | RF | Gestión de dispositivos por sistema | HU06 | M | Centralización de datos |
| RF05 | RF | Gestión de sensores por dispositivo | HU06 | M | Centralización de datos |
| RF06 | RF | Registro de mediciones vía API (firmware real o simulador) | HU08 | M | API de ingesta |
| RF07 | RF | Dashboard con última medición por sensor/sistema | HU01 | M | Dashboard en tiempo real |
| RF08 | RF | Consulta de históricos con filtros | HU02 | S | Históricos y comparativas |
| RF09 | RF | Comparativa gráfica multi-sistema | HU04 | C | Históricos y comparativas |
| RF10 | RF | CRUD de reglas de alerta | HU07 | M | Alertas automáticas |
| RF11 | RF | Motor de evaluación de alertas | HU03 | M | Alertas automáticas |
| RF12 | RF | Lista de alertas y marcar como resuelta | HU03 | M | Alertas automáticas |
| RF13 | RF | Documentación API (OpenAPI/Swagger) versionada | HU11 | S | API-first / Integración |
| RF14 | RF | Estado de conexión / última comunicación del dispositivo | HU10 | S | Tolerancia a pérdida de conectividad |
| RF15 | RF | Gestión de suscripción y licenciamiento | HU09 | W | Suscripción y licenciamiento |
| RNF01 | RNF | Seguridad: bcrypt, JWT, HTTPS, validación, SQLi/XSS | — | M | Autenticación y roles |
| RNF02 | RNF | Disponibilidad 99 % en horario de operación (8:00–20:00) | — | S | Dashboard en tiempo real |
| RNF03 | RNF | Rendimiento: dashboard < 2 s; históricos 1 mes < 5 s / 50.000 registros | — | S | Dashboard en tiempo real |
| RNF04 | RNF | Escalabilidad: índices, normalización, particionamiento | — | W | Escalabilidad masiva |
| RNF05 | RNF | Usabilidad: responsive, navegación intuitiva, mensajes claros | — | M | Dashboard en tiempo real |
| RNF06 | RNF | Mantenibilidad: buenas prácticas, Git, documentación | — | M | Transversal |
| RNF07 | RNF | Portabilidad: Docker / PaaS con variables de entorno | — | S | Transversal |
| RNF08 | RNF | Interoperabilidad con firmware ESP32, app Android y dashboard | — | S | Integración app Android |
| RNF09 | RNF | Autonomía local del dispositivo (OLED + joystick) | — | W | Tolerancia a pérdida de conectividad |
| RNF10 | RNF | Cobertura de pruebas ≥ 70 % en backend, integración y carga básica | — | S | Transversal |
| RNF11 | RNF | Privacidad y cumplimiento ético (Ley 19.628/21.719) | — | M | Seguridad / Transversal |

---

## 8. Casos de uso (CU-01…CU-16)

| ID | Caso de uso | Actor primario | HU | RF |
|---|---|---|---|---|
| CU-01 | Iniciar / cerrar sesión | Usuario autorizado | HU05 | RF01 |
| CU-02 | Gestionar usuarios y roles | Administrador | HU05 | RF01, RF02 |
| CU-03 | Gestionar sistemas/instalaciones y cultivos | Administrador | HU06 | RF03 |
| CU-04 | Gestionar dispositivos | Administrador | HU06 | RF04 |
| CU-05 | Gestionar sensores y tipos de variable | Administrador | HU06 | RF05 |
| CU-06 | Ingresar medición (individual o lote) | Dispositivo / Simulador IoT | HU08 | RF06 |
| CU-07 | Evaluar regla y generar alerta | Sistema (evento interno) | HU03 | RF11 |
| CU-08 | Consultar estado actual (dashboard) | Encargado de cultivo | HU01 | RF07 |
| CU-09 | Consultar históricos y exportar | Encargado de Cultivo | HU02 | RF08 |
| CU-10 | Comparar sistemas en un mismo gráfico | Supervisor | HU04 | RF09 |
| CU-11 | Configurar reglas de alerta y probarlas | Administrador | HU07 | RF10 |
| CU-12 | Gestionar alertas (marcar resuelta) | Encargado de Cultivo | HU03 | RF12 |
| CU-13 | Monitorear estado de conexión y última comunicación | Encargado / Supervisor | HU10 | RF14 |
| CU-14 | Sincronizar mediciones tras corte de red | Dispositivo / Simulador IoT | HU10 | RF06, RF14 |
| CU-15 | Consultar documentación de la API | Desarrollador de Integraciones | HU11 | RF13 |
| CU-16 | Administrar licencias *(fuera de alcance)* | Administrador / Comercial | HU09 | RF15 |

---

## 9. Reglas de negocio

| ID | Regla | Origen |
|---|---|---|
| RN-01 | Toda medición pertenece a un sensor, que pertenece a un dispositivo, que pertenece a un sistema. | Modelo de dominio |
| RN-02 | Una medición nunca se modifica ni se elimina: el histórico es inmutable (solo *append*). | Trazabilidad |
| RN-03 | La corrección de un dato se registra como medición nueva y la anterior se marca como anulada. | Integridad |
| RN-04 | Una alerta se genera solo si la regla está activa y se respeta su *cooldown*. | Evitar fatiga de alertas |
| RN-05 | Un dispositivo sin comunicación por más de 3× su intervalo de reporte se marca "sin comunicación". | Operación AquaPlants |
| RN-06 | El rol determina las acciones permitidas; ningún usuario puede elevar su propio rol ni eliminar su propia cuenta. | HU05 CA4 |
| RN-07 | Los umbrales son configurables por sensor o por tipo de variable (el sensor tiene prioridad). | NEC-03 |
| RN-08 | Las marcas de tiempo se almacenan en UTC y se muestran en la zona horaria del usuario. | Trazabilidad |
| RN-09 | Se **rechaza** toda medición con marca de tiempo futura (tolerancia configurable, por defecto 5 min de desfase). | HU08 CA3 |
| RN-10 | Se **aceptan** marcas de tiempo pasadas para permitir la sincronización de datos generados offline. | HU10 CA1 |
| RN-11 | El sistema de mediciones debe conservar el formato del firmware real (ESP32-S3) además del formato del simulador. | NEC-04, RF06 |
| RN-12 | La información mostrada en el dashboard no debe contradecir lo que muestra el display OLED local del AquaBrain. | RNF05 |

---

## 10. Metodología de desarrollo (corrección aplicada)

### 10.1. Criterios de comparación (escala 1–5)

Adaptabilidad a cambios · Trazabilidad y puntos de revisión · Claridad de roles · Manejo de incertidumbre técnica (hardware, API, integración) · Entregables demostrables por iteración · Adecuación a equipo pequeño.

### 10.2. Comparación cuantitativa

| Criterio | Scrum | Scrumban | Kanban |
|---|:--:|:--:|:--:|
| Adaptabilidad a cambios | 4 | 5 | 5 |
| Trazabilidad y revisiones | 5 | 4 | 3 |
| Claridad de roles | 5 | 3 | 2 |
| Manejo de incertidumbre técnica | 4 | 5 | 4 |
| Entregables demostrables por sprint | 5 | 4 | 3 |
| Adecuación a equipo pequeño | 4 | 4 | 5 |
| **Total** | **27** | **25** | **22** |

### 10.3. Decisión

**Scrum**, con **sprints de dos semanas**. Obtiene el mayor puntaje y asegura los hitos de revisión obligatorios que un equipo reducido necesita frente a la incertidumbre técnica (integración con hardware real, API y clientes existentes). Scrumban y Kanban son más flexibles, pero no garantizan esos puntos de control.

### 10.4. Justificación vinculada al cliente y la problemática

AquaPlants necesita centralizar datos dispersos, integrar firmware real y una app Android existente, y proteger información sensible. El equipo es pequeño y el alcance acotado. Scrum permite priorizar el backlog por valor, cerrar cada sprint con funcionalidad demostrable, ajustar el alcance ante hallazgos técnicos y mantener puntos de control obligatorios.

---

## 11. Necesidades de seguridad TI, impacto ético y profesional

### 11.1. Matriz activo–amenaza–riesgo–control–importancia

| Activo | Amenaza | Riesgo | Control propuesto | Importancia |
|---|---|---|---|---|
| Datos de mediciones (temperatura, humedad, nivel/distancia) | Acceso no autorizado (externo o interno) | Pérdida de confidencialidad; posible sabotaje de cultivos | Autenticación JWT, control por roles, HTTPS | Crítica |
| Credenciales de usuarios | Filtración de contraseñas | Acceso indebido a la plataforma | Hash **bcrypt con salt**, políticas de contraseñas seguras | Alta |
| Configuración de reglas de alerta | Modificación malintencionada | Alertas falsas o ausencia de alertas reales | Autorización: solo el administrador modifica reglas | Media-Alta |
| Comunicación dispositivo ↔ plataforma (ESP32-S3) | Suplantación del dispositivo o intercepción en tránsito | Inyección de mediciones falsas; exposición de datos del cultivo | API key por dispositivo, HTTPS/TLS, validación de origen | Alta |
| App Android existente | Almacenamiento inseguro de credenciales o tokens en el móvil | Acceso indebido si el teléfono se pierde o es comprometido | Tokens de expiración corta, Keystore, cierre de sesión remoto | Media-Alta |
| Datos personales de usuarios (correo, nombre) | Exposición de datos | Incumplimiento de normativas de privacidad | Almacenamiento mínimo necesario y logs de acceso | Media |
| API de ingesta de datos | Inyección de datos falsos o maliciosos | Saturación, históricos falsos, alertas erróneas | Validación de entrada, autenticación del dispositivo (API key) | Alta |

### 11.2. Impacto ético y profesional (sección 10.1 de la corrección)

| Dimensión | Compromiso declarado |
|---|---|
| **Privacidad** | Solo los datos necesarios de usuarios y cultivos; minimización, retención limitada y anonimización cuando sea posible |
| **Responsabilidad** | Logs de auditoría y trazabilidad de cambios; todo incidente de seguridad se gestiona y documenta |
| **Acceso** | Mínimo privilegio mediante RBAC, con revisión periódica de permisos |
| **Tratamiento de datos** | Cifrado en tránsito (HTTPS/TLS) y en reposo; no se comparten datos con terceros sin autorización |
| **Cumplimiento** | Referencia a OWASP Top Ten y a la normativa chilena: **Ley 19.628** y **Ley 21.719** |
| **Impacto profesional** | Un fallo de seguridad no solo expone datos: puede afectar decisiones de cultivo, la confianza en la plataforma y la continuidad operativa de AquaPlants |

---

## 12. Correcciones recibidas (trazabilidad del feedback)

| # | Origen | Corrección solicitada | Aplicada en |
|---|---|---|---|
| C-01 | `correcion 1eval1` | Reescribir la priorización usando **MoSCoW** | §2, §5, §6, §7 |
| C-02 | `correcion 1eval1` | Comparar metodologías con **criterios y puntajes homogéneos** | §10 |
| C-03 | `correcion 1eval1` | Agregar el **impacto ético y profesional** de las medidas de seguridad | §11.2 |
| C-04 | `correcion 1eval1` | Eliminar la referencia a **HU11 inexistente**; crear HU11 (documentación API) y renumerar RF | §4, §5, §7 |
| C-05 | `correcion 1eval1` | Decidir **licenciamiento**: mover a *Won't* o dejarlo como supuesto | §5 (RF15), §6 |
| C-06 | `correcion 2eval1` | Ampliar **criterios de aceptación** de todas las HU | §4 |
| C-07 | `correcion 2eval1` | Añadir **RNF11 (privacidad y cumplimiento ético)** | §6 |
| C-08 | `correcion 2eval1` | **Unificar los códigos** RF/RNF/HU en todas las tablas | §4–§8 |

### Supuestos abiertos heredados de ES1

| ID | Supuesto | Estado |
|---|---|---|
| SUP-09 | El **licenciamiento** (HU09/RF15) no está respaldado por el desafío | ⏳ Validar con la contraparte |
| SUP-10 | Compatibilidad con la **app Android existente** "sin cambios en los clientes": no se dispone del contrato que consume hoy | ⏳ Validar con la contraparte |

> El resto de los supuestos (`SUP-01`…`SUP-08`) se administran en `docs/ES2/09-feedback-prototipo.md`.
