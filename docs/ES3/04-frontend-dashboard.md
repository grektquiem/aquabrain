# 4. Implementación del Frontend (Dashboard)

## 4.1 Tecnología

| Aspecto | Elección | Motivo |
|---|---|---|
| Librería | **React 18** | Ecosistema maduro y componentes reutilizables (coincide con ES2) |
| Empaquetador | **Vite 5** | Arranque y recarga en caliente muy rápidos |
| Lenguaje | **TypeScript 5.6** (modo estricto) | Tipado del contrato de la API |
| Estado del servidor | **TanStack Query 5** | Caché, reintentos y refresco periódico del panel |
| Gráficos | **Recharts 2.12** | Series con bandas de mínimo/máximo |
| Rutas | **react-router-dom 6** | Navegación entre panel, históricos y alertas |
| Cliente HTTP | **fetch nativo** | Sin dependencias extra; control fino del refresco de token |

> **Desviación respecto de ES2.** El borrador mencionaba Tailwind CSS, Zustand y Axios. La implementación usa **CSS propio**, el **estado local de React + TanStack Query** y **fetch**, para reducir dependencias sin alterar la interfaz diseñada. Se registra en la sección 11.

## 4.2 Identidad y sesión

El token de acceso vive **solo en memoria** de la aplicación (nunca en `localStorage`, que es legible por cualquier XSS). El token de refresco viaja en la cookie `HttpOnly` que el navegador adjunta automáticamente. Ante un `401`, el cliente intenta **un único refresco** y reintenta la petición original, de modo que la sesión se recupera de forma transparente tras recargar la página.

En desarrollo, el servidor de Vite **proxea `/api` hacia la API** (`vite.config.ts`), con lo que el navegador percibe un **único origen**: sin *preflight* de CORS y con la cookie tratada como *same-origin*.

## 4.3 Estructura del código

```text
apps/web/src/
├─ api/
│  ├─ cliente.ts        Cliente fetch + refresco de token + tipos de error
│  └─ tipos.ts          Tipos de las respuestas de la API
├─ sesion/ContextoSesion.tsx   Sesión en memoria y helper puede(permiso)
├─ paginas/
│  ├─ Login.tsx         Acceso
│  ├─ Panel.tsx         Estado en vivo (refresco cada 15 s)
│  ├─ Historicos.tsx    Series + gráfico + exportación CSV
│  └─ Alertas.tsx       Bandeja con filtros, paginación y resolución
├─ componentes/
│  ├─ InsigniaFrescura.tsx   Estado de conexión y formateo de fechas
│  └─ TarjetaSensor.tsx      Tarjeta de última lectura por variable
├─ App.tsx              Armazón, cabecera y rutas
├─ main.tsx             Punto de entrada (QueryClient + Router)
└─ estilos.css          Hoja de estilos
```

## 4.4 Pantallas implementadas

### 4.4.1 Acceso
Formulario de correo y contraseña con manejo de error. Las cuentas de demostración están sembradas por `prisma/seed.ts` y la contraseña se escribe siempre (nunca se precarga).

### 4.4.2 Panel (RF07)
Refresco automático cada 15 s. Muestra indicadores agregados, una tabla de dispositivos con su **estado de frescura** (`EN_LINEA`, `SIN_COMUNICACION`, `INACTIVO`) y una rejilla con la última lectura de cada variable.

### 4.4.3 Históricos (RF08, HU09)
Selector de sensor, de agrupación (`5m`, `15m`, `1h`, `6h`, `1d`), rango de fechas con atajos (24 h, 7 d, 30 d) y un gráfico de líneas con banda de mínimo/máximo. Incluye **exportación a CSV** del rango consultado.

### 4.4.4 Alertas (RF12/RF13, HU08)
Filtros por estado y severidad, paginación y **resolución con comentario** en línea. La acción de resolver solo se muestra a quien posee el permiso `alerta:resolver`.

## 4.5 Verificación en navegador real

El dashboard se ejecutó contra la API en vivo y se recorrió con un navegador automatizado. Evidencia obtenida (capturas en el anexo):

| Verificación | Resultado observado |
|---|---|
| Acceso como administrador | Sesión iniciada; cabecera «Administrador Aqua / Administrador» |
| Panel: indicadores | Dispositivos en línea **1/2**, variables **10**, alertas activas **3** (1 alta) |
| Panel: dispositivos | `DEV-01` · En línea · hace 5 min · Invernadero Norte; `DEV-02` · Sin comunicación · hace 2 h |
| Panel: variables | 10 tarjetas con valores reales (p. ej. Caudal de riego `0,07 L/min`, Humedad `46 %`) |
| Históricos | Gráfico con 24 puntos; 1 línea (promedio) + 2 áreas (mín/máx) |
| Exportación CSV | `aquabrain-CAUDAL-01-1h.csv`, **BOM UTF-8**, separador `;`, cabecera `sensor;timestamp;valor;unidad;origen;calidad`, 136 filas de datos |
| Alertas: resolución | «pH fuera de rango…» resuelta con comentario; el contador pasó de **3 → 2** activas; la alerta aparece como resuelta por «Administrador Aqua» |

Los únicos mensajes en consola del navegador son dos `401` de `/auth/refresh` en la **primera** carga (no hay cookie de sesión todavía), que es el comportamiento esperado, no un defecto.

> **Capturas.** `web-panel.png`, `web-historicos.png` y `web-alertas.png` se adjuntan en la sección 16 (Anexos).
