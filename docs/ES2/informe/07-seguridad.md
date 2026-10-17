# 07 · Seguridad de la solución

La seguridad se diseña **antes** de programar porque las decisiones de autenticación, autorización y
validación condicionan el modelo de datos y la arquitectura (cap. 03 §3.5 y cap. 06 §6.3). Los
requisitos corresponden al catálogo corregido de ES1 (RNF01, RNF11, RF01…RF14, RN-01…RN-12).

## 7.1. Principios y activos

### 7.1.1. Principios rectores

| Principio | Aplicación concreta |
|---|---|
| **Denegar por defecto** | Todo endpoint exige autenticación y un permiso explícito; el acceso se concede, nunca se asume |
| **Mínimo privilegio** | Cada rol recibe solo los permisos que su función requiere; la identidad de dispositivo solo puede escribir mediciones |
| **Defensa en profundidad** | Autenticación + autorización + validación + límites de tasa + auditoría en capas independientes |
| **Fallo seguro** | Si algo falla, se deniega el acceso o se pierde la copia cruda, pero **nunca** se expone información ni se corrompe el histórico |
| **Superficie mínima** | El frontend no contiene secretos; la API solo expone lo necesario; los campos sensibles se omiten en las respuestas |
| **No confiar en el cliente** | Validación replicada en el servidor; el rol y los permisos se leen de la base. **Los tres clientes (firmware, app Android, dashboard) se tratan como no confiables** |
| **Trazabilidad** | Toda acción crítica queda registrada con usuario, acción, entidad y fecha |

### 7.1.2. Activos a proteger

| Activo | Sensibilidad | Impacto si se compromete |
|---|---|---|
| Credenciales de usuario (`password_hash`) | Alta | Suplantación de identidad y acceso a la operación |
| API keys de dispositivos | Alta | Inyección de mediciones falsas; decisiones agronómicas erróneas |
| Datos de acceso y roles | Media | Elevación de privilegios |
| Mediciones y alertas | Media | Pérdida de confianza; decisiones mal fundadas |
| Configuración de umbrales | Media | Se silencian o disparan alertas de forma indebida |
| Disponibilidad del servicio | Media | El encargado no ve el estado del cultivo |
| Registros de auditoría | Media | Imposibilidad de investigar un incidente |
| Secretos de infraestructura (JWT, cadenas de conexión) | Alta | Compromiso total del sistema |
| Credenciales/tokens en la **app Android** | Alta | Acceso indebido si el teléfono se pierde (ES1 §11.1) |

## 7.2. Políticas de autenticación

### 7.2.1. Usuarios humanos

| Aspecto | Política |
|---|---|
| Identificador | Correo electrónico único (comparación sin distinguir mayúsculas) |
| Almacenamiento de contraseña | **bcrypt** con *cost* 12 y salt por contraseña; nunca reversible (RNF01, HU05 CA③). Argon2id queda documentado como evolución futura |
| Requisitos de contraseña | Mínimo 10 caracteres, verificación contra listas de contraseñas filtradas comunes |
| Historial y expiración | No reutilizar las últimas **5** contraseñas; expiración a **90 días** para Administrador y **180 días** para el resto |
| Segundo factor (MFA) | Obligatorio para **Administrador**, opcional para **Supervisor** (TOTP) |
| Vía de acceso | `POST /api/v1/auth/login` sobre HTTPS obligatorio |
| Emisión | **Access token JWT** (HS256, 15 min) + **refresh token** opaco (7 días) en cookie `HttpOnly; Secure; SameSite=Strict` |
| Renovación | `POST /api/v1/auth/refresh` con **rotación**: el refresh usado se revoca; reutilizar uno revocado invalida toda la cadena |
| Cierre de sesión | `POST /api/v1/auth/logout` revoca el refresh vigente y elimina la cookie |
| Control de fuerza bruta | 5 intentos fallidos en 15 min → bloqueo temporal; respuesta siempre genérica |
| Enumeración de usuarios | Mensaje idéntico ante correo inexistente o contraseña incorrecta; tiempo de respuesta comparable |
| Cuentas desactivadas | `activo = false` impide el login y revoca los refresh vigentes |
| Sesiones concurrentes | Permitidas, pero registradas (dispositivo/IP) para poder revocarlas |
| Cambio de contraseña | Exige la contraseña actual y revoca todas las sesiones previas |
| Protección de la propia cuenta | Un administrador **no puede eliminar su propia cuenta** (HU05 CA④, RN-06) |
| Recuperación | Enlace de un solo uso con vencimiento de 30 min; respuesta neutra siempre |

**Contenido del access token:** `sub`, `rol`, `permisos[]`, `iat`, `exp`, `jti`. Se firma con un secreto
de ≥ 32 bytes. Las decisiones de autorización **vuelven a consultarse** en la base cuando el permiso es
sensible (evita que un token antiguo conserve privilegios retirados).

### 7.2.2. Identidad de dispositivos IoT (ESP32-S3)

| Aspecto | Política |
|---|---|
| Credencial | **API key por dispositivo** (`ak_live_<32 bytes base64url>`), en la cabecera `X-Device-Key` |
| Almacenamiento | Solo el **hash bcrypt** (`dispositivo.api_key_hash`) + últimos 4 caracteres |
| Entrega | Se muestra **una única vez** al crearla o regenerarla |
| Alcance | Solo puede **escribir mediciones del sensor de su propio dispositivo**; no puede leer |
| Rotación | `POST /api/v1/dispositivos/{id}/rotar-clave` (permiso `dispositivo:rotar_clave`), auditado |
| Cadencia de rotación | Programada cada **90 días**, más rotación manual ante sospecha |
| Revocación | Desactivar el dispositivo invalida de inmediato la clave |
| Protección del canal | HTTPS obligatorio; validación de `Content-Type` y límite de tamaño de cuerpo |

> **Por qué no OAuth/OIDC para dispositivos:** el ESP32-S3 no ejecuta un flujo interactivo ni almacena
> un *refresh token* de forma segura. La API key por dispositivo, revocable e individual, es una
> decisión de alcance explícita (D-10).

### 7.2.3. Cliente Android existente

| Aspecto | Política |
|---|---|
| Modelo | Consume la **misma API versionada** (`/api/v1`); no tiene privilegios distintos |
| Almacenamiento de tokens | Debe usar el **Android Keystore**; el backend no puede imponerlo → requisito de integración declarado |
| Expiración corta | El access token de 15 min limita la ventana de exposición |
| Cierre remoto | Al desactivar la cuenta o revocar los refresh, la próxima renovación falla y exige login |
| Contrato | La compatibilidad \"sin cambios en los clientes\": supuesto `SUP-10`, validado con la app de prueba (HU11 CA③) |

### 7.2.4. Controles transversales de sesión

- CORS restringido a la lista de orígenes permitida (`CORS_ORIGINS`), sin comodines.
- Límite de tasa: login 10 req/min por IP; ingesta 600 req/min por dispositivo; lectura 300 req/min por usuario.
- CSRF mitigado por cookie `SameSite=Strict` + `Authorization` explícito (la API no acepta autenticación implícita por cookie para escrituras).
- Cierre por inactividad en el cliente (aviso 30 min, cierre 35 min) sin afectar la validez del token.

## 7.3. Políticas de autorización

### 7.3.1. Modelo

**RBAC** (Role-Based Access Control) con **permisos** atómicos: `usuario → rol → permisos`. Las rutas
declaran el permiso requerido de forma explícita (`@RequirePermission('alerta:resolver')`), de manera
que el control es **declarativo, centralizado y auditable**.

### 7.3.2. Catálogo de permisos

| Recurso | Permisos |
|---|---|
| Usuarios | `usuario:leer`, `usuario:escribir` |
| Roles | `rol:leer`, `rol:asignar` |
| Sistemas | `sistema:leer`, `sistema:escribir` |
| Cultivos y plantas | `cultivo:leer`, `cultivo:escribir` |
| Dispositivos | `dispositivo:leer`, `dispositivo:escribir`, `dispositivo:rotar_clave` |
| Sensores | `sensor:leer`, `sensor:escribir` |
| Mediciones | `medicion:leer`, `medicion:escribir` (esta última solo la identidad de dispositivo o carga manual autorizada) |
| Alertas | `alerta:leer`, `alerta:resolver` |
| Reglas | `regla:leer`, `regla:escribir` |
| Estado/conexión | `estado:leer` |
| Auditoría | `auditoria:leer` |

### 7.3.3. Matriz rol ↔ permiso

| Permiso | Administrador | Supervisor | Encargado | Dispositivo (máquina) |
|---|:--:|:--:|:--:|:--:|
| `usuario:leer` / `usuario:escribir` | ✅ / ✅ | ✖ / ✖ | ✖ / ✖ | ✖ |
| `rol:leer` / `rol:asignar` | ✅ / ✅ | ✖ / ✖ | ✖ / ✖ | ✖ |
| `sistema:leer` / `:escribir` | ✅ / ✅ | ✅ / ✖ | ✅ / ✖ | ✖ |
| `cultivo:leer` / `:escribir` | ✅ / ✅ | ✅ / ✖ | ✅ / ✖ | ✖ |
| `dispositivo:leer` / `:escribir` / `:rotar_clave` | ✅ / ✅ / ✅ | ✅ / ✖ / ✖ | ✅ / ✖ / ✖ | ✖ |
| `sensor:leer` / `:escribir` | ✅ / ✅ | ✅ / ✖ | ✅ / ✖ | ✖ |
| `medicion:leer` | ✅ | ✅ | ✅ | ✖ |
| `medicion:escribir` | ✅ | ✖ | ✖ | ✅ |
| `alerta:leer` | ✅ | ✅ | ✅ | ✖ |
| `alerta:resolver` | ✅ | ✅ | ✅ | ✖ |
| `regla:leer` / `:escribir` | ✅ / ✅ | ✅ / ✖ | ✅ / ✖ | ✖ |
| `estado:leer` | ✅ | ✅ | ✅ | ✖ |
| `auditoria:leer` | ✅ | ✖ | ✖ | ✖ |

### 7.3.4. Matriz CRUD por recurso y rol

`C` = crear · `R` = leer · `U` = actualizar · `D` = eliminar · `—` = sin acceso.

| Recurso | Administrador | Supervisor | Encargado | Dispositivo (máquina) |
|---|---|---|---|---|
| Usuarios | CRUD | — | — | — |
| Roles | CRUD | — | — | — |
| Sistemas y cultivos | CRUD | R | R | — |
| Dispositivos | CRUD | R | R | R (solo el propio) |
| Sensores | CRUD | R | R | R (solo los propios) |
| Mediciones | R | R | R | **C** |
| Reglas de alerta | CRUD | R | R | — |
| Alertas | RU | RU | RU | — |
| Estado de conexión | R | R | R | — |
| Auditoría | R | — | — | — |

> El **licenciamiento** (que implicaría un rol *Comercial*) quedó fuera de alcance (*Won't por ahora*);
> por eso no aparece en la matriz.

### 7.3.5. Matriz de autorización por endpoint (extracto)

| Endpoint | Método | Rol/identidad | Permiso | Nota |
|---|---|---|---|---|
| `/api/v1/auth/login` | POST | Público | — | Límite de tasa y bloqueo por intentos |
| `/api/v1/auth/refresh` | POST | Cookie válida | — | Rotación de refresh |
| `/api/v1/usuarios` | GET / POST | Administrador | `usuario:leer` / `usuario:escribir` | No permite auto-elevación de rol |
| `/api/v1/usuarios/{id}` | PATCH / DELETE | Administrador | `usuario:escribir` | Borrado lógico; **no puede auto-eliminarse** |
| `/api/v1/sistemas` | GET | Autenticado | `sistema:leer` | |
| `/api/v1/sistemas` | POST / PATCH | Administrador | `sistema:escribir` | |
| `/api/v1/dispositivos/{id}/rotar-clave` | POST | Administrador | `dispositivo:rotar_clave` | Clave se muestra una sola vez |
| `/api/v1/mediciones` | POST | **Dispositivo** | `medicion:escribir` | `X-Device-Key`; sensor debe pertenecer al dispositivo; rechaza timestamp futuro |
| `/api/v1/mediciones/bulk` | POST | **Dispositivo** | `medicion:escribir` | Máx. 500 ítems; idempotente; acepta timestamps pasados |
| `/api/v1/mediciones/serie` | GET | Encargado, Supervisor, Admin | `medicion:leer` | Máx. 90 días por consulta |
| `/api/v1/dashboard/estado` | GET | Encargado, Supervisor, Admin | `estado:leer` | |
| `/api/v1/alertas/{id}/resolver` | POST | Encargado, Supervisor, Admin | `alerta:resolver` | Registra usuario y hora |
| `/api/v1/reglas` | POST / PATCH / DELETE | Administrador | `regla:escribir` | Cambio auditado |
| `/api/v1/reglas/probar` | POST | Administrador | `regla:escribir` | Evalúa medición simulada sin persistir (HU07 CA③) |
| `/api/v1/auditoria` | GET | Administrador | `auditoria:leer` | |
| `/api/docs` | GET | Autenticado / Desarrollador | — | Contrato OpenAPI versionado (RF13, HU11) |

### 7.3.6. Alcance territorial (limitación documentada)

En el prototipo, **el rol determina el acceso y no el sistema específico**: cualquier encargado ve
cualquier sistema. Se documenta como simplificación consciente y supuesto `SUP-05`. Si se confirma la
necesidad, la extensión es una tabla `usuario_sistema` y un filtro obligatorio en las consultas
(impacto acotado: solo el módulo de consultas).

## 7.4. Controles técnicos de protección de datos

| Control | Implementación | Requisito |
|---|---|---|
| Cifrado en tránsito | TLS 1.2+ obligatorio; HSTS | RNF01 |
| Cifrado en reposo | Cifrado del proveedor gestionado; respaldos cifrados | RNF01 |
| Gestión de secretos | Variables de entorno del PaaS; nunca en el repositorio (`gitleaks` en CI); rotación documentada | RNF01 |
| Cabeceras de seguridad | `helmet`: CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS | RNF01 |
| Validación de entrada | DTO con Zod/class-validator, `whitelist: true, forbidNonWhitelisted: true`, límite de tamaño | RNF01 |
| Consultas seguras | Prisma parametriza por construcción; los `$queryRaw` usan marcadores, nunca concatenación | RNF01 |
| Manejo de errores | Respuestas genéricas al cliente; *stack traces* solo en el log con `correlation-id` | RNF01 |
| Registro de seguridad | Logs estructurados sin contraseñas, tokens ni datos personales; auditoría de acciones críticas | RNF11 |
| Dependencias | `package-lock.json` versionado, `npm audit` en CI, Dependabot activo | RNF06 |
| Respaldo | Automático diario + prueba de restauración documentada | RNF02 |
| Cifrado de cookie | `HttpOnly`, `Secure`, `SameSite=Strict` | RNF01 |
| Menor privilegio en BD | Usuario de la API sin `UPDATE`/`DELETE` sobre `medicion`; usuario de migración separado | RN-02, RNF01 |

## 7.5. Amenazas comunes y medidas de mitigación

### 7.5.1. Mapeo OWASP Top 10 (2021)

| Riesgo | Cómo se manifestaría aquí | Mitigación en el diseño | Prueba |
|---|---|---|---|
| **A01 Control de acceso quebrado** | Un encargado modifica umbrales; acceso a datos de otro sistema | Autorización declarativa por permiso; pruebas negativas por rol (401/403); el rol nunca se toma del cuerpo | TS-16, TS-17, TS-18 |
| **A02 Fallas criptográficas** | Contraseñas con MD5/SHA1, tokens sin expiración, HTTP | bcrypt (cost 12), JWT de 15 min con rotación de refresh, TLS, secretos ≥ 32 bytes | TS-12, TS-14 |
| **A03 Inyección** | `sensor_id` malicioso o filtros concatenados | ORM parametrizado, validación estricta de tipos, límites de longitud, sin `eval` | TS-20, TS-21 |
| **A04 Diseño inseguro** | Sin límite de intentos, sin *cooldown*, sin validación de rango/tiempo | Bloqueo por intentos, cooldown en base, validación de rango, **rechazo de timestamp futuro (RN-09)** | TS-10, TS-13, TS-06 |
| **A05 Configuración incorrecta** | CORS `*`, cabeceras ausentes, *stack traces*, bases expuestas | Lista blanca de CORS, helmet, errores genéricos, bases gestionadas | TS-23 |
| **A06 Componentes vulnerables** | Dependencia con CVE conocida | `npm audit` + Dependabot en CI, versiones fijadas | TS-24 |
| **A07 Fallas de identificación/autenticación** | Enumeración de usuarios, sesiones sin expirar, API key trivial | Mensajes genéricos, expiración corta, rotación, API key de 256 bits | TS-12, TS-15 |
| **A08 Fallas de integridad de datos** | Dato de dispositivo alterado en tránsito o reposo | TLS, validación de pertenencia sensor↔dispositivo, histórico inmutable, auditoría | TS-25, TS-26 |
| **A09 Fallas de registro y monitoreo** | No saber quién cambió un umbral | Auditoría + `correlation-id` + alerta de uptime | TS-27 |
| **A10 SSRF** | Peticiones a URLs arbitrarias del usuario | **No aplica** en el diseño actual: no se consumen URLs del usuario (si se agrega webhook, se validará con lista blanca) | — |

### 7.5.2. Análisis STRIDE

| Categoría | Amenaza concreta | Control |
|---|---|---|
| **S**poofing | Cliente malicioso se hace pasar por un dispositivo | API key por dispositivo con hash bcrypt, HTTPS, pertenencia sensor↔dispositivo |
| **T**ampering | Alteración de mediciones históricas o de umbrales | Histórico inmutable, permisos de BD restringidos, auditoría de cambios de reglas |
| **R**epudio | Un usuario niega haber resuelto o silenciado una alerta | Auditoría con usuario, acción, entidad, hora e IP |
| **I**nformation disclosure | Fuga de datos de acceso o de configuración | Mínimo dato expuesto, campos sensibles omitidos, control por permiso, errores genéricos |
| **D**enial of service | Inundación de ingesta con lotes enormes o login masivo | Límite de tasa, tamaño máximo, lote ≤ 500, colas y límites en BD |
| **E**levation of privilege | Un encargado se asigna permisos de administrador | El rol solo lo cambia un administrador; prohibición de auto-elevación y auto-eliminación; pruebas negativas |

### 7.5.3. Riesgos de seguridad priorizados

Escala: probabilidad (P) e impacto (I) = Bajo/Medio/Alto.

| ID | Riesgo | P | I | Riesgo | Control principal | Verificación |
|---|---|---|---|---|---|---|
| RSK-01 | Robo de API key de un dispositivo | Media | Alto | **Alto** | Hash en BD, rotación, revocación, no lectura | TS-28 |
| RSK-02 | Fuerza bruta sobre el login | Alta | Medio | **Alto** | Bloqueo temporal, límite de tasa, mensajes neutros | TS-13 |
| RSK-03 | Elevación de privilegios vía IDOR | Media | Alto | **Alto** | Autorización por permiso en el recurso, no solo en la ruta | TS-17 |
| RSK-04 | Inyección de mediciones falsas | Media | Alto | **Alto** | Pertenencia sensor↔dispositivo, validación de rango y tiempo, auditoría | TS-26, TS-10 |
| RSK-05 | Fuga de secretos en el repositorio | Media | Alto | **Alto** | `.env` ignorado, `gitleaks` en CI, rotación | TS-29 |
| RSK-06 | Manipulación de umbrales sin rastro | Baja | Medio | **Medio** | Permiso exclusivo de administrador + auditoría | TS-27 |
| RSK-07 | DoS por lotes gigantes | Media | Medio | **Medio** | Límite de tamaño y de lote, límite de tasa | TS-30 |
| RSK-08 | Exposición de datos en errores | Media | Bajo | **Medio** | Errores genéricos, logs internos | TS-31 |
| RSK-09 | Pérdida de disponibilidad del PaaS gratuito | Alta | Medio | **Alto** | *Health check*, plan de contingencia local, respaldos | TS-32 |
| RSK-10 | Dependencia con vulnerabilidad conocida | Media | Medio | **Medio** | `npm audit` + Dependabot | TS-24 |
| RSK-11 | Token de acceso filtrado (XSS) | Baja | Alto | **Medio** | CSP estricta, sin `dangerouslySetInnerHTML`, refresh en cookie `HttpOnly` | TS-33 |
| RSK-12 | Repudio de acciones administrativas | Baja | Medio | **Bajo** | Auditoría inmutable y de solo lectura | TS-27 |

## 7.6. Estándares de codificación segura

### 7.6.1. Reglas obligatorias del equipo

| # | Estándar | Cómo se verifica |
|---|---|---|
| EC-01 | **Toda entrada se valida** con el esquema compartido; el backend no confía en el frontend ni en el firmware | Revisión de PR + TS-21 |
| EC-02 | **Toda ruta declara su permiso**; solo login, refresh y *health check* quedan sin guarda | Prueba automatizada que lista rutas sin guarda (falla el build) |
| EC-03 | **Ninguna consulta se construye por concatenación**; Prisma o `$queryRaw` con parámetros | Revisión de PR + análisis estático |
| EC-04 | **Ningún secreto en el repositorio**; solo `.env.example` con valores ficticios | `gitleaks` en CI |
| EC-05 | **Ningún dato sensible en logs** (contraseñas, tokens, API keys) | Revisión de PR + muestreo |
| EC-06 | **Errores al cliente genéricos**; el detalle vive en el log con `correlation-id` | Revisión de PR + TS-31 |
| EC-07 | **Respuestas con proyección explícita**: nunca se devuelve la entidad completa | Revisión de PR + prueba de contrato |
| EC-08 | **Dependencias fijadas** con *lockfile* y auditadas en CI | Pipeline |
| EC-09 | **Configuración por entorno**, jamás valores de producción en el código | Revisión de PR |
| EC-10 | **Errores asíncronos controlados**: los fallos de MongoDB o de notificación no revierten la medición | TS-34 |
| EC-11 | **Tipado estricto** (`strict: true`), sin `any` implícito en el dominio | `tsc --noEmit` en CI |
| EC-12 | **Idempotencia explícita** en escrituras expuestas a reintentos | TS-36 |
| EC-13 | **Revisión cruzada obligatoria**: nadie aprueba su propio PR; checklist de seguridad | GitHub |
| EC-14 | **Zona horaria UTC en el servidor**; la conversión a hora local ocurre solo en presentación | TS-10, TS-11 |

### 7.6.2. Checklist de revisión de código (plantilla de PR)

- [ ] ¿La ruta nueva declara su permiso? ¿Existe prueba negativa (sin permiso → 403)?
- [ ] ¿La entrada está validada con el esquema compartido? ¿Se probaron valores vacíos, nulos, fuera de rango y **timestamps futuros**?
- [ ] ¿Hay algún campo sensible expuesto en la respuesta o en el log?
- [ ] ¿Se manejan los errores sin filtrar detalles internos?
- [ ] ¿La operación es idempotente si puede reintentarse?
- [ ] ¿Se actualizó la matriz de trazabilidad y la documentación de la API?
- [ ] ¿La prueba automatizada correspondiente está verde y cubre el caso de borde?

### 7.6.3. Verificación automática: lint, pre-commit y CI

| Área | Estándar | Herramienta | Dónde se verifica |
|---|---|---|---|
| Validación de entrada | Esquemas Zod/class-validator | `packages/shared` | CI |
| Consultas | ORM parametrizado; prohibido SQL concatenado | Prisma / `$queryRaw` | Revisión de PR |
| Secretos | `.env`, nunca en el repositorio | `.gitignore` + `gitleaks` | pre-commit + CI |
| Errores | Mensaje genérico; detalle en el log | Interceptor NestJS | Revisión de PR |
| Dependencias | Auditoría semanal y SCA | `npm audit` + Snyk | CI |
| Estilo y formato | ESLint + Prettier | Hooks de pre-commit | pre-commit |
| Tipado | TypeScript `strict` | `tsc --noEmit` | pre-commit + CI |
| Logs | Sin tokens, contraseñas ni PII | Revisión + muestreo | Revisión de PR |
| Cabeceras | Helmet (CSP, HSTS, X-Frame-Options) | Middleware NestJS | CI + runtime |
| Límite de tasa | Por IP y por dispositivo | `@nestjs/throttler` | Runtime |
| HTTPS | Obligatorio en producción | Nginx / PaaS | Despliegue |
| Revisión | PR obligatorio con checklist | GitHub | Manual |

El **pipeline de CI** (GitHub Actions) ejecuta `lint → typecheck → test → build → npm audit`; cualquier
fallo bloquea el *merge* (cap. 04 §4.5).

## 7.7. Ética, privacidad y uso responsable

### 7.7.1. Cumplimiento normativo

| Marco | Implicancia para el proyecto |
|---|---|
| **Ley 19.628** sobre protección de la vida privada (Chile) y su modernización por la **Ley 21.719** | La plataforma trata datos personales de trabajadores (nombre, correo, rol, registros de acceso). Aplican los principios de finalidad, proporcionalidad, calidad, responsabilidad y seguridad; se debe informar el tratamiento y permitir derechos de acceso y rectificación (**RNF11**) |
| **Deber de cuidado (seguridad de la información)** | El proveedor debe adoptar medidas técnicas y organizativas razonables; este documento las declara |
| **Buenas prácticas internacionales** | OWASP ASVS/Top 10 como referencia técnica; WCAG 2.1 AA para accesibilidad |

### 7.7.2. Privacidad desde el diseño

| Medida | Aplicación |
|---|---|
| **Minimización** | Solo lo necesario: nombre, correo, rol. **No** se recopilan datos sensibles (salud, biometría, geolocalización del usuario) |
| **Limitación de finalidad** | Datos personales para autenticación y auditoría, no para perfilamiento |
| **Retención definida** | Auditoría 12 meses; sesiones/tokens hasta su expiración; mediciones según política de retención |
| **Transparencia** | La interfaz explica para qué se registran accesos y quién puede verlos |
| **Derechos del titular** | Procedimiento documentado: un administrador puede exportar o rectificar datos; la desactivación reemplaza al borrado cuando existe historial |
| **Segregación de responsabilidades** | Quien administra usuarios no necesariamente interpreta los datos agronómicos, y viceversa |

### 7.7.3. Impacto ético y profesional

| Dimensión | Compromiso declarado | Cómo se refleja en ES2 |
|---|---|---|
| **Privacidad** | Solo los datos necesarios; minimización, retención limitada y anonimización cuando sea posible | §7.7.2 · RNF11 |
| **Responsabilidad** | Logs de auditoría y trazabilidad; todo incidente se gestiona y documenta | §7.5.3 · tabla `auditoria` |
| **Acceso** | Mínimo privilegio mediante RBAC, con revisión periódica de permisos | §7.3 |
| **Tratamiento de datos** | Cifrado en tránsito y en reposo; no se comparten datos con terceros sin autorización | §7.4 |
| **Cumplimiento** | Referencia a OWASP Top Ten y a la normativa chilena (Ley 19.628, Ley 21.719) | §7.7 |
| **Datos simulados identificados** | No se presentan datos ficticios como mediciones reales de AquaPlants | §7.7.3 |
| **Impacto profesional** | Un fallo de seguridad puede afectar decisiones de cultivo, la confianza y la continuidad operativa | Todo el capítulo |

**Uso responsable de los datos y de las alertas:**

- **Datos simulados identificados:** pH y caudal provienen del simulador y se rotulan con `origen_dato
  = SIMULADO` y un aviso visible **\"Datos simulados con fines académicos\"**; temperatura, humedad y
  distancia provienen del hardware real (AHT10/HC-SR04).
- **Las alertas son apoyo, no decisión automática:** el sistema **no** activa ni detiene procesos
  físicos. La alerta informa y el humano decide.
- **Umbrales visibles y auditables:** el usuario siempre puede ver qué regla, umbral y valor provocaron
  una alerta (`valor_detectado`, `umbral_aplicado`).
- **Responsabilidad profesional:** documentar supuestos, no sobrevender la solución y reportar
  incidentes son obligaciones del equipo.

### 7.7.4. Gestión de incidentes y continuidad

| Situación | Respuesta prevista |
|---|---|
| Sospecha de API key comprometida | Rotar la clave, revisar auditoría de ingesta, marcar mediciones sospechosas como `calidad = SOSPECHOSA` |
| Cuenta comprometida | Desactivar usuario, revocar refresh tokens, revisar auditoría |
| Falla del almacén no relacional | La ingesta continúa (PostgreSQL primero); se reprocesa la copia cruda después |
| Falla del servicio | Restaurar desde respaldo (RTO ≤ 4 h), comunicar al usuario, registrar el incidente |
| Vulnerabilidad en dependencia | Aplicar actualización, revalidar pipeline, documentar en ADR |

## 7.8. Trazabilidad de la seguridad con los requisitos

| Sección | Requisitos cubiertos |
|---|---|
| §7.2 (autenticación) | RNF01, RF01, NEC-07 |
| §7.2.2 (dispositivos) | RF06, RNF01, NEC-04 |
| §7.3 (autorización) | RF01, RF02, RNF01, RN-06 |
| §7.4 (controles) | RNF01, RNF11, RNF02, RN-02 |
| §7.5 (amenazas) | RNF01, RNF02, RNF11 |
| §7.6 (codificación segura) | RNF01, RNF06, RNF11 |
| §7.7 (ética y privacidad) | RNF11 y exigencia ética/profesional de ES1 §11.2 |
