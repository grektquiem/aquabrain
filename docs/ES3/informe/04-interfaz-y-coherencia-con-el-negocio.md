# 04 · Interfaz, coherencia con el negocio y lineamientos estéticos

> Indicadores cubiertos: **1** (coherencia entre la funcionalidad de la interfaz y las necesidades del
> negocio) y **2** (cumplimiento de lineamientos estéticos y funcionales).

## 4.1 Tecnología del frontend

| Aspecto | Elección | Motivo |
|---|---|---|
| Librería | **React 18** | Ecosistema maduro y componentes reutilizables (coincide con ES2) |
| Empaquetador | **Vite 5** | Arranque y recarga en caliente muy rápidos |
| Lenguaje | **TypeScript 5.6** (modo estricto) | Tipado del contrato de la API |
| Estado del servidor | **TanStack Query 5** | Caché, reintentos y refresco periódico del panel |
| Gráficos | **Recharts 2.12** | Series con bandas de mínimo/máximo |
| Rutas | **react-router-dom 6** | Navegación entre panel, históricos y alertas |
| Cliente HTTP | **fetch nativo** | Sin dependencias extra; control fino del refresco de token |

> **Desviación respecto de ES2 (D-03).** El borrador mencionaba **Tailwind CSS, Zustand y Axios**. La
> implementación usa **CSS propio** (con variables de diseño), el **estado local de React + TanStack Query** y
> **fetch**, para reducir dependencias sin alterar la interfaz diseñada.

## 4.2 Identidad y sesión

El **token de acceso vive solo en memoria** de la aplicación (nunca en `localStorage`, que es legible por
cualquier XSS). El **token de refresco** viaja en la cookie **`HttpOnly`** que el navegador adjunta
automáticamente. Ante un `401`, el cliente intenta **un único refresco** y reintenta la petición original, de
modo que la sesión se recupera de forma transparente tras recargar la página.

En desarrollo, el servidor de Vite **proxea `/api` hacia la API** (`vite.config.ts`), con lo que el navegador
percibe un **único origen**: sin *preflight* de CORS y con la cookie tratada como *same-origin*. En el
despliegue con contenedores, esa misma función la cumple **nginx** (capítulo 09).

## 4.3 Estructura del código (real)

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
└─ estilos.css          Hoja de estilos (tokens y componentes)
```

## 4.4 Pantallas implementadas y su coherencia con el negocio

Cada pantalla materializa una necesidad del negocio expresada como historia de usuario (HU) de ES1 y consume
las rutas reales de la API:

| Pantalla | Necesidad de negocio (HU de ES1) | Requisito | Rutas de la API que consume |
|---|---|---|---|
| **Acceso** | HU05 · gobernar el acceso por roles | RF01 | `POST /auth/login`, `POST /auth/refresh` |
| **Panel** | HU01 · ver el estado actual del cultivo | RF07, RF14 | `GET /dashboard/estado` |
| **Históricos** | HU02 · consultar el histórico y exportarlo | RF08 | `GET /mediciones/serie`, `GET /mediciones/exportar.csv` |
| **Alertas** | HU03 · recibir y resolver alertas oportunas | RF12 | `GET /alertas`, `GET /alertas/resumen`, `POST /alertas/{id}/resolver` |

### 4.4.1 Acceso

Formulario de correo y contraseña con manejo de error. Las cuentas de demostración están sembradas por
`prisma/seed.ts` y la contraseña **se escribe siempre** (nunca se precarga). El error se anuncia con
`role="alert"` para lectores de pantalla.

### 4.4.2 Panel (RF07 · HU01)

Refresco automático cada **15 s** (TanStack Query). Muestra indicadores agregados, una tabla de dispositivos con
su **estado de frescura** y una rejilla con la **última lectura de cada variable**. La frescura llega
**derivada por la API** (`insignia--en_linea`, `--sin_comunicacion`, `--inactivo`, `--desconocido`), de modo
que **dos pestañas abiertas nunca discrepan** (RN-05).

### 4.4.3 Históricos (RF08 · HU02)

Selector de sensor, de agrupación (`5m`, `15m`, `1h`, `6h`, `1d`), rango de fechas con atajos (24 h, 7 d, 30 d)
y un **gráfico de líneas con banda de mínimo/máximo** (Recharts). Incluye **exportación a CSV** del rango
consultado.

### 4.4.4 Alertas (RF12 · HU03)

Filtros por estado y severidad, paginación y **resolución con comentario en línea**. La acción de resolver
**solo se muestra a quien posee el permiso `alerta:resolver`**; a quien no lo tiene se le informa el motivo
(`Su rol no tiene el permiso alerta:leer.`), lo que conecta la interfaz con el modelo de autorización (§7.2).

## 4.5 Lineamientos estéticos y funcionales

### 4.5.1 Sistema visual consistente (tokens)

La hoja `estilos.css` (538 líneas) define los colores y medidas como **variables de diseño** en `:root`, lo que
da consistencia a toda la aplicación y permite cambiar el tema sin tocar los componentes:

```css
:root {
  --agua-900:#083344; --agua-700:#0e7490; --agua-500:#06b6d4; --agua-100:#cffafe;
  --verde:#15803d; --ambar:#b45309; --rojo:#b91c1c;
  --gris-900:#0f172a; --gris-600:#475569; --gris-300:#cbd5e1; --gris-100:#f1f5f9;
  --blanco:#ffffff; --sombra: 0 1px 3px rgb(15 23 42 / 12%), 0 1px 2px rgb(15 23 42 / 8%); --radio:10px;
}
```

La paleta **agua/verde** es coherente con el dominio (cultivo aeropónico) y las **señales semánticas** usan
**verde / ámbar / rojo** para los estados, lo que transmite el significado sin depender solo del color del
texto.

### 4.5.2 Estados, mensajes y retroalimentación

La interfaz implementa explícitamente los **cuatro estados** que un dashboard de monitoreo requiere:

| Estado | Ejemplo real en el código |
|---|---|
| **Carga** | `Panel.tsx`: «Cargando el estado del sistema.» · `Alertas.tsx`: «Cargando alertas.» |
| **Error** | `Panel.tsx`: «No fue posible obtener el estado: {mensaje}» · `Alertas.tsx`: «Error: {mensaje}» |
| **Vacío** | `Historicos.tsx`: «Sin datos en el rango seleccionado.» · `Alertas.tsx`: «No hay alertas con estos filtros.» · `Panel.tsx`: «Sin alertas activas.» |
| **Éxito/ocupado** | Botones con `disabled` mientras la operación está en curso (`resolver.isPending`, `enviando`) |

Este tratamiento evita el peor defecto de un panel de monitoreo: **no saber si el dato falta porque no hay
mediciones o porque la consulta falló**. Los mensajes distinguen ambos casos.

### 4.5.3 Comportamiento adaptable

La adaptabilidad se logra con **maquetación fluida**, no con *breakpoints*: la interfaz declara
`<meta name="viewport">` y usa `flex-wrap` y rejillas auto-ajustables
(`grid-template-columns: repeat(auto-fit, minmax(...))` y `repeat(auto-fill, minmax(190px, 1fr))`). Esto hace
que la rejilla de tarjetas de sensores y las tablas **refluyan** al reducir el ancho de la ventana sin una hoja
de estilos separada por dispositivo.

### 4.5.4 Accesibilidad básica

Se aplican prácticas de bajo costo y alto valor: `role="alert"` en el mensaje de error de login, `aria-hidden`
en el punto decorativo de la insignia de frescura, `lang="es"` en el documento y textos alternativos en las
figuras de los informes.

## 4.6 Verificación en la interfaz real

El dashboard se ejecutó contra la API en vivo y se recorrió con un navegador automatizado. Evidencia observada:

| Verificación | Resultado observado |
|---|---|
| Acceso como administrador | Sesión iniciada; cabecera «Administrador Aqua / Administrador» |
| Panel: indicadores | Dispositivos en línea **1/2**, variables **10**, alertas activas **3** (1 alta) |
| Panel: dispositivos | `DEV-01` · En línea · hace 5 min · Invernadero Norte; `DEV-02` · Sin comunicación · hace 2 h |
| Panel: variables | 10 tarjetas con valores reales (p. ej. Caudal de riego `0,07 L/min`, Humedad `46 %`) |
| Históricos | Gráfico con 24 puntos; 1 línea (promedio) + 2 áreas (mín/máx) |
| Exportación CSV | `aquabrain-CAUDAL-01-1h.csv`, **BOM UTF-8**, separador `;`, cabecera `sensor;timestamp;valor;unidad;origen;calidad`, 136 filas de datos |
| Alertas: resolución | «pH fuera de rango…» resuelta con comentario; el contador pasó de **3 → 2** activas; la alerta figura como resuelta por «Administrador Aqua» |

Los únicos mensajes en la consola del navegador fueron **dos `401` de `/auth/refresh` en la primera carga** (no
había cookie de sesión todavía), que es el comportamiento **esperado**, no un defecto. Las capturas
(`web-panel.png`, `web-historicos.png`, `web-alertas.png`) se adjuntan en el capítulo 17.

## 4.7 Alcance no cubierto (declarado)

- **No** se ejecutaron pruebas de interfaz automatizadas en el repositorio (el recorrido en navegador fue una
  verificación puntual, no una suite versionada) → recomendación R-09.
- **No** se realizaron pruebas con usuarios reales (RNF05) ni una certificación de accesibilidad WCAG → R-13.
- **No** se verificó la **consistencia con el display OLED** del gateway → R-15.
- La adaptabilidad es **fluida** por maquetación; no se validó en un catálogo de dispositivos físicos.

## 4.8 Síntesis del capítulo

La interfaz no es un adorno: **cada pantalla implementa una historia de usuario** y consume rutas reales de la
API (indicador 1). Los **lineamientos estéticos y funcionales** se evidencian en un **sistema de tokens** de
diseño, el tratamiento explícito de los **estados de carga/error/vacío** con mensajes claros, una **maquetación
fluida** y prácticas básicas de accesibilidad (indicador 2). Los límites —sin pruebas de UI automatizadas ni
con usuarios— quedan declarados y priorizados.
