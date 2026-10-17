# 09 · Necesidades de seguridad de la información

## 9.1. Importancia para el negocio

En AquaPlants los datos no son solo "información": describen el **estado de un cultivo**. Un acceso
indebido, una medición falsificada o una alerta suprimida pueden llevar a decisiones equivocadas de
riego o nutrición y, en el peor caso, a la **pérdida del cultivo**. Además, la plataforma convive con
**tres clientes** (navegador, app móvil y dispositivo) y con datos de usuarios, lo que amplía la
superficie de ataque. Por eso la seguridad es un **requisito transversal** (RNF01, RNF11) y no una
funcionalidad opcional.

## 9.2. Activos a proteger

| Activo | Naturaleza | Por qué importa |
|---|---|---|
| Datos de mediciones (temperatura, humedad, nivel/distancia, y variables simuladas) | Operativo | Reflejan el estado del cultivo; alterarlos induce malas decisiones |
| Credenciales de usuarios | Confidencial | Su filtración da acceso a la plataforma |
| Configuración de reglas de alerta | Integridad | Su manipulación produce alertas falsas o silencia alertas reales |
| Comunicación dispositivo ↔ plataforma | Integridad/Confidencial | Una suplantación inyecta mediciones falsas |
| App Android existente | Confidencial | Puede almacenar credenciales o tokens en el móvil |
| Datos personales de usuarios (correo, nombre) | Privacidad | Su exposición incumple normativas de protección de datos |
| Disponibilidad del servicio | Operativo | Sin servicio, no hay monitoreo |

## 9.3. Amenazas y riesgos

| Amenaza | Riesgo asociado |
|---|---|
| Acceso no autorizado (externo o interno) | Pérdida de confidencialidad; posible sabotaje del cultivo |
| Filtración de contraseñas | Acceso indebido a la plataforma |
| Modificación malintencionada de reglas | Alertas falsas o ausencia de alertas reales |
| Suplantación del dispositivo o intercepción en tránsito | Inyección de mediciones falsas; exposición de datos del cultivo |
| Almacenamiento inseguro de tokens en el móvil | Acceso indebido si el teléfono se pierde o es comprometido |
| Exposición de datos personales | Incumplimiento de normativas de privacidad |
| Inyección de datos falsos o maliciosos por la API | Saturación del sistema, históricos falsos, alertas erróneas |

## 9.4. Controles iniciales propuestos

La siguiente matriz relaciona cada activo con su amenaza, el riesgo, el control propuesto y su
importancia relativa. Es la base de las decisiones de seguridad de ES2:

| Activo | Amenaza | Riesgo | Control propuesto | Importancia |
|---|---|---|---|---|
| Datos de mediciones | Acceso no autorizado | Pérdida de confidencialidad; sabotaje | Autenticación JWT, control por roles, HTTPS | **Crítica** |
| Credenciales de usuarios | Filtración de contraseñas | Acceso indebido | Hash **bcrypt con salt** y políticas de contraseñas seguras | **Alta** |
| Configuración de reglas de alerta | Modificación malintencionada | Alertas falsas o ausentes | Autorización: solo el administrador modifica reglas | **Media-Alta** |
| Comunicación dispositivo ↔ plataforma | Suplantación / intercepción | Mediciones falsas; exposición | API key por dispositivo, HTTPS/TLS, validación de origen | **Alta** |
| App Android existente | Almacenamiento inseguro de credenciales | Acceso indebido si se pierde el móvil | Tokens de expiración corta, almacén seguro, cierre de sesión remoto | **Media-Alta** |
| Datos personales de usuarios | Exposición de datos | Incumplimiento normativo | Almacenamiento mínimo necesario y logs de acceso | **Media** |
| API de ingesta | Inyección de datos falsos | Saturación, históricos falsos | Validación de entrada, autenticación del dispositivo (API key) | **Alta** |

Los controles se pueden agrupar por tipo:

- **Preventivos:** autenticación (JWT), autorización por roles (RBAC), hash de contraseñas, API key de
  dispositivo, validación y sanitización de entrada, HTTPS/TLS.
- **Detectivos:** logs de auditoría, monitoreo del estado de conexión del dispositivo, registro de
  accesos y cambios.
- **De gestión:** principio de **mínimo privilegio**, revisión periódica de permisos y política de
  tratamiento de datos.

## 9.5. Estándares y buenas prácticas de referencia

El diagnóstico adopta como referencia marcos reconocidos por la industria, sin declarar certificaciones
que no se poseen:

- **OWASP Top Ten** — para orientar la protección frente a las amenazas más comunes (inyección,
  autenticación deficiente, exposición de datos sensibles, control de acceso quebrado).
- **Principio de mínimo privilegio** (RBAC) — cada usuario y cada cliente accede solo a lo necesario.
- **Seguridad desde el diseño (Zero Trust)** — ninguna petición se considera confiable por defecto;
  toda llamada se autentica y valida, venga del navegador, del móvil o del dispositivo.
- **Normativa chilena de protección de datos** — Ley **19.628** y Ley **21.719** como marco de
  privacidad y tratamiento de datos personales (ver capítulo 10).

## 9.6. Relación con los requerimientos

Estas necesidades se concretan en **RNF01** (seguridad) y **RNF11** (privacidad y cumplimiento), y se
verifican mediante pruebas de acceso con distintos roles, pruebas básicas de penetración (SQLi, XSS) y
revisión de los logs de auditoría. Su tratamiento ético y profesional se desarrolla en el capítulo
siguiente.
