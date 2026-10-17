# 07 · Catálogo de requerimientos funcionales y no funcionales

## 7.1. Criterio de clasificación

La clasificación distingue con claridad qué **hace** el sistema de **cómo** debe comportarse:

- **Requerimiento funcional (RF):** describe una **función** o comportamiento que el sistema debe
  ejecutar (registrar una medición, autenticar, generar una alerta). Es verificable mediante una
  acción con un resultado esperado.
- **Requerimiento no funcional (RNF):** describe una **cualidad o restricción** de calidad
  (seguridad, rendimiento, disponibilidad, usabilidad, mantenibilidad, interoperabilidad,
  escalabilidad, privacidad). Se verifica con mediciones, revisiones o pruebas de calidad.

Cada requerimiento declara además su **historia de usuario** de origen, su **prioridad MoSCoW**, su
**necesidad** asociada y su **forma de verificación**, de modo que sea **verificable y trazable** y
tenga un **propósito** explícito.

## 7.2. Requerimientos funcionales (RF01…RF15)

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
| **RF15** | Gestión de suscripción y licenciamiento por cliente/instalación | HU09 | **Won't** | — | Módulo fuera del alcance actual; supuesto a validar con la contraparte |

**Distribución MoSCoW de los RF:** 10 Must, 3 Should, 1 Could y 1 Won't.

> **Nota de alineación.** RF13 puede expresarse también como requisito de **interoperabilidad**
> (RNF08); se mantiene como **RF** porque es un **entregable contractual** de la API. RF15 pasa a
> *Could* únicamente si la contraparte confirma el requisito.

## 7.3. Requerimientos no funcionales (RNF01…RNF11)

| ID | Descripción | Propósito | MoSCoW | Verificabilidad |
|---|---|---|---|---|
| **RNF01** | Seguridad: contraseñas hasheadas (bcrypt), JWT con expiración, HTTPS en producción, validación de entrada, protección contra inyección SQL/XSS | Proteger datos de cultivo y de usuarios | **Must** | Revisión de código; pruebas básicas de penetración (SQLi, XSS) |
| **RNF02** | Disponibilidad: 99 % durante el horario de operación (8:00–20:00) en el entorno de prueba | Que los encargados accedan cuando lo necesiten | **Should** | Monitoreo de uptime durante las pruebas |
| **RNF03** | Rendimiento: dashboard < 2 s; consultas históricas de 1 mes < 5 s para 50.000 registros | Experiencia de usuario aceptable | **Should** | Pruebas de carga (JMeter, Artillery u otra) |
| **RNF04** | Escalabilidad: diseño con índices y normalización; documentación de estrategias futuras (particionamiento, réplicas) | Preparar el crecimiento hacia cientos de sistemas | **Won't** (se documenta) | Revisión del modelo de datos y su justificación |
| **RNF05** | Usabilidad: interfaz web responsive, navegación intuitiva, mensajes de error claros; consistencia con la información del display OLED local | Usuarios no técnicos (encargados de cultivo) | **Must** | Pruebas de usabilidad con usuarios simulados |
| **RNF06** | Mantenibilidad: buenas prácticas, control de versiones (Git), documentación actualizada | Facilitar futuras mejoras del equipo o de la empresa | **Must** | Inspección de código y README |
| **RNF07** | Portabilidad: despliegue con Docker o PaaS usando variables de entorno | Ejecución en cualquier proveedor cloud | **Should** | Despliegue en al menos dos entornos (local y nube) |
| **RNF08** | Interoperabilidad: la API debe ser consumible por el firmware ESP32, la app Android existente y el dashboard web, sin requerir cambios en los clientes ya construidos | Proteger la inversión de AquaPlants en hardware y app móvil | **Should** | Pruebas de integración con la app Android de prueba |
| **RNF09** | Autonomía local: el AquaBrain debe seguir mostrando información útil (OLED + joystick) durante una pérdida temporal de conectividad y sincronizar al reconectarse | Continuidad operativa en zonas con conectividad intermitente | **Won't** (depende del firmware) | Simular corte de red y verificar operación local y sincronización posterior |
| **RNF10** | Pruebas: cobertura unitaria ≥ 70 % en backend; pruebas de integración para la API; pruebas de carga básicas | Asegurar calidad y detección temprana de errores | **Should** | Informe de cobertura de pruebas |
| **RNF11** | Privacidad y cumplimiento ético: minimización, retención limitada, logs de auditoría, anonimización cuando sea posible, referencia a Ley 19.628 y Ley 21.719 | Cumplir principios éticos, legales y profesionales | **Must** | Revisión de la política de datos y de los logs de auditoría |

**Distribución MoSCoW de los RNF:** 4 Must, 5 Should y 2 Won't.

## 7.4. Ejemplos explicados de cada tipo

La rúbrica pide ejemplos claros **con su relevancia**. Se explican dos RF y dos RNF:

**Ejemplo de RF — RF06 (Registro de mediciones vía API).**
Es el **corazón del flujo de datos**: sin este endpoint, ni el firmware real ni el simulador podrían
ingresar información, y no existiría nada que mostrar en el dashboard ni que evaluar para generar
alertas. Es verificable enviando una medición válida y comprobando que responde `201`, y enviando
datos inválidos o con marca de tiempo futura y comprobando que responde `400`. Su relevancia radica en
que **conecta el hardware que la empresa ya tiene** con la capa digital.

**Ejemplo de RF — RF10 (CRUD de reglas de alerta).**
Permite al administrador **personalizar** el comportamiento de las alertas (variable, condición,
umbral, severidad) sin programar. Es verificable creando una regla y comprobando que se persiste y se
aplica. Su relevancia es que adapta un mismo sistema a **distintos cultivos y etapas**, en lugar de
fijar umbrales en el código.

**Ejemplo de RNF — RNF03 (Rendimiento).**
Establece que el dashboard debe cargar en menos de 2 segundos y que una consulta de un mes debe
responder en menos de 5 segundos para 50.000 registros. Es verificable con **pruebas de carga**. Su
relevancia: el encargado de cultivo decide con rapidez, y una interfaz lenta sería inutilizable en la
operación diaria.

**Ejemplo de RNF — RNF08 (Interoperabilidad).**
Exige que la API sea consumible por el **firmware**, la **app Android existente** y el **dashboard**,
sin obligar a modificar los clientes ya construidos. Es verificable validando el contrato contra la
app de prueba. Su relevancia es **proteger la inversión** de AquaPlants y evitar silos de información.

## 7.5. Matriz MoSCoW consolidada

| ID | Tipo | Descripción breve | HU | MoSCoW |
|---|---|---|---|---|
| RF01 | RF | Autenticación JWT y roles | HU05 | M |
| RF02 | RF | CRUD de usuarios (solo administrador) | HU05 | M |
| RF03 | RF | CRUD de sistemas/instalaciones | HU06 | M |
| RF04 | RF | Gestión de dispositivos por sistema | HU06 | M |
| RF05 | RF | Gestión de sensores por dispositivo | HU06 | M |
| RF06 | RF | Registro de mediciones vía API | HU08 | M |
| RF07 | RF | Dashboard con última medición por sensor/sistema | HU01 | M |
| RF08 | RF | Consulta de históricos con filtros | HU02 | S |
| RF09 | RF | Comparativa gráfica multi-sistema | HU04 | C |
| RF10 | RF | CRUD de reglas de alerta | HU07 | M |
| RF11 | RF | Motor de evaluación de alertas | HU03 | M |
| RF12 | RF | Lista de alertas y marcar como resuelta | HU03 | M |
| RF13 | RF | Documentación API (OpenAPI/Swagger) versionada | HU11 | S |
| RF14 | RF | Estado de conexión / última comunicación | HU10 | S |
| RF15 | RF | Gestión de suscripción y licenciamiento | HU09 | W |
| RNF01 | RNF | Seguridad (bcrypt, JWT, HTTPS, validación, SQLi/XSS) | — | M |
| RNF02 | RNF | Disponibilidad 99 % (8:00–20:00) | — | S |
| RNF03 | RNF | Rendimiento (dashboard < 2 s; históricos < 5 s / 50.000) | — | S |
| RNF04 | RNF | Escalabilidad (índices, normalización, particionamiento) | — | W |
| RNF05 | RNF | Usabilidad y consistencia con el OLED | — | M |
| RNF06 | RNF | Mantenibilidad (buenas prácticas, Git, documentación) | — | M |
| RNF07 | RNF | Portabilidad (Docker / PaaS con variables de entorno) | — | S |
| RNF08 | RNF | Interoperabilidad (firmware, app Android, dashboard) | — | S |
| RNF09 | RNF | Autonomía local (OLED + joystick) | — | W |
| RNF10 | RNF | Cobertura de pruebas ≥ 70 % + integración y carga | — | S |
| RNF11 | RNF | Privacidad y cumplimiento ético (Ley 19.628/21.719) | — | M |
