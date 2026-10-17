# 7. Evidencia de Seguridad

Esta sección documenta los controles **efectivamente implementados y probados**, no solo los diseñados. Cada control va acompañado de la prueba que lo respalda.

## 7.1 Autenticación de usuarios

| Control | Implementación | Prueba |
|---|---|---|
| Contraseñas con hash | **bcrypt con coste 12**; nunca en claro | `gestion` verifica que el usuario creado no expone la contraseña y que el hash es bcrypt |
| Token de acceso | **JWT** firmado, `iss=aquabrain`, `aud=aquabrain-web`, TTL 15 min | `auth` (token válido, expirado y manipulado) |
| Token de refresco | TTL 7 días, en **cookie `HttpOnly`**; se **rota** y se **revoca** en el cierre de sesión | `auth` (refresco válido, revocado y reutilizado) |
| Bloqueo por intentos | Cinco intentos fallidos bloquean la cuenta; se registra el evento | `auth` |
| Coste constante en credenciales inexistentes | Se compara contra un hash ficticio para no filtrar por tiempo | Revisión de código en `auth.service.ts` |

Los tokens de refresco se persisten en la tabla `refresh_token` (con estado de revocación), lo que permite invalidar sesiones y auditar su ciclo de vida.

## 7.2 Autorización por roles (RBAC)

La API define **21 permisos** agrupados por recurso (`medicion:leer`, `medicion:escribir`, `alerta:resolver`, `dispositivo:rotar_clave`, `rol:asignar`, `auditoria:leer`, etc.) y tres roles sembrados: **Administrador** (21 permisos), **Supervisor** y **Encargado** (subconjuntos).

- Cada ruta declara su permiso con `@RequierePermiso(...)`.
- Una petición sin sesión recibe **401**; una sesión sin el permiso recibe **403**.
- La denegación, además de responder `403`, **se registra en la auditoría**.

**Pruebas ejecutadas** (suite `rbac`, 11 casos): cada rol accede solo a lo que le corresponde, y los intentos fuera de alcance devuelven `403`. Casos destacados de la suite `gestion`:

- Un usuario no puede **desactivar su propia cuenta** (evita el auto-bloqueo, `403`).
- Un usuario no puede **asignarse un rol a sí mismo** infringiendo la regla de negocio RN-06 (`403`).
- Desactivar un usuario y revocar sus tokens deja sus peticiones posteriores en `401` (`/auth/me`).

## 7.3 Autenticación de dispositivos

La ingesta se autentica con **dos cabeceras**: `X-Device-Key` (clave `ak_live_<base64url>`) y `X-Device-Code` (código del dispositivo).

- La clave se almacena **hasheada con bcrypt + pepper** (`DEVICE_KEY_PEPPER`); no es recuperable.
- Como el hash no permite localizar el dispositivo, el **código es obligatorio** junto con la clave.
- Existe **rotación de clave** (`POST /dispositivos/{id}/rotar-clave`), protegida por el permiso `dispositivo:rotar_clave`.
- Un dispositivo inactivo o una clave/clave-código mal emparejada recibe **401**.

Las claves reales solo existen en el entorno local (`.env`); la semilla las **imprime una única vez** y no se versionan. Se conservan los últimos cuatro caracteres (`apiKeyUltimos4`) para poder identificarlas sin exponerlas.

## 7.4 Validación de entrada

El pipe global de validación usa `whitelist` y `forbidNonWhitelisted`:

- **422** si el cuerpo trae **campos no declarados** (TS-21).
- **400** si un campo declarado tiene un **valor inválido** (TS-22).

Esto bloquea de raíz ataques de *mass assignment* (por ejemplo, enviar `rol` o `activo` donde no corresponde) y se verificó en las suites `mediciones` y `gestion`.

## 7.5 Endurecimiento HTTP

| Control | Configuración |
|---|---|
| Cabeceras de seguridad | **helmet** (`aplicarEndurecimiento`) |
| CORS | Lista explícita de orígenes (`CORS_ORIGINS`), sin comodines |
| Límite de cuerpo | `BODY_LIMIT` = 1 MB → `413 CARGA_EXCESIVA` |
| Control de tasa | `@nestjs/throttler` sobre el login; al superarlo responde **429 `DEMASIADAS_SOLICITUDES`** |
| Validación de parámetros | `ParseUUIDPipe` y DTO con transformación y rango (`ArrayMinSize`, `ArrayMaxSize`, `Min`, `Max`) |

La configuración de endurecimiento se aplica tanto en `main.ts` como en las pruebas, de modo que lo probado es lo desplegado.

**Prueba de tasa (suite `limites`, TS-13):** tras superar el límite de intentos de login desde una misma IP, la API responde **429** con `codigo = DEMASIADAS_SOLICITUDES`.

## 7.6 Auditoría

Toda operación de escritura y toda denegación de permiso pasa por el `AuditoriaInterceptor`, que registra en la tabla `auditoria` el usuario (o dispositivo), la acción, la entidad afectada, la ruta y el resultado. La bitácora se consulta por `GET /auditoria` (permiso `auditoria:leer`). En la base de desarrollo hay **centenares de registros** generados por las pruebas.

> **Corrección real detectada durante las pruebas.** La consulta `GET /auditoria` fallaba con `500` por un error de serialización de `BigInt`; se corrigió serializando el identificador a cadena en el controlador. Es un ejemplo de defecto encontrado y resuelto gracias a las pruebas de integración.

## 7.7 Gestión de secretos

Todos los secretos (JWT, pepper de dispositivo, credenciales de base de datos) se leen de variables de entorno. `.gitignore` excluye `.env`, `.env.*` (salvo `.env.example`) e `infra/.env`. Antes del primer commit se verificó que **no se versiona ninguna clave real**.

## 7.8 Alcance no cubierto (declarado)

- **No** se ejecutó un análisis con **OWASP ZAP** ni una prueba de penetración.
- **No** se implementó el control de tasa **distribuido** (Redis); el *throttler* es en memoria por instancia (sección 11).
- **No** se configuró HTTPS/TLS de extremo a extremo en el entorno local (queda a cargo del proxy en el despliegue).
- El endurecimiento se verificó con **pruebas automatizadas propias**, no con una auditoría externa.
