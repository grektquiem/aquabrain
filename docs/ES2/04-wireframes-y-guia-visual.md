# ES2 · 04 — Prototipos, wireframes y guía visual

Objetivo de esta sección: dejar definido **qué ve el usuario y cómo se comporta** antes de programar, asegurando
consistencia visual, adaptabilidad (responsive), accesibilidad básica y **coherencia con el display OLED local**
del AquaBrain (RNF05, RN-12).

Las variables del prototipo reflejan el hardware real (**AHT10** → temperatura/humedad; **HC-SR04** → distancia/nivel)
más las variables simuladas declaradas (pH, caudal).

---

## 1. Mapa de navegación

```mermaid
flowchart TD
    LOGIN["/login — Iniciar sesión"] --> DASH["/dashboard — Estado actual"]
    DASH --> SIS["/sistemas — Sistemas y cultivos"]
    SIS --> CULT["/cultivos/:id — Detalle de cultivo"]
    DASH --> HIST["/historicos — Históricos, exportación y comparación"]
    DASH --> ALERTS["/alertas — Bandeja de alertas"]
    DASH --> DEVS["/dispositivos — Estado y última comunicación"]
    DEVS --> SENS["/dispositivos/:id — Sensores y credencial"]
    DASH --> RULES["/reglas — Umbrales y reglas de alerta"]
    DASH --> USERS["/usuarios — Usuarios, roles y permisos"]
    DASH --> API["/api/docs — Documentación OpenAPI (OpenAPI/Swagger)"]
    DASH --> PROFILE["/perfil — Mi cuenta"]
    style LOGIN fill:#e8f4f1,stroke:#1f7a63
    style DASH fill:#1f7a63,color:#ffffff
```

Accesos visibles según rol:

| Menú | Encargado | Supervisor | Administrador | Desarrollador de integraciones |
|---|:--:|:--:|:--:|:--:|
| Dashboard / Estado actual | ✅ | ✅ | ✅ | ➖ |
| Históricos, exportación y comparación | ✅ | ✅ | ✅ | ➖ |
| Alertas (marcar resuelta) | ✅ | ✅ | ✅ | ➖ |
| Dispositivos (ver / conexión) | ✅ | ✅ | ✅ | ➖ |
| Sistemas y cultivos (editar) | ➖ | ➖ | ✅ | ➖ |
| Reglas de alerta (editar y probar) | ➖ | ➖ | ✅ | ➖ |
| Usuarios y permisos | ➖ | ➖ | ✅ | ➖ |
| Documentación API (OpenAPI) | ➖ | ➖ | ✅ | ✅ |

### 1.1. Inventario de pantallas, interacciones y estados

| # | Pantalla (ruta) | CU | Interacciones clave | Estados que debe resolver |
|---|---|---|---|---|
| 1 | Login (`/login`) | CU-01 | Ingresar credenciales, validar, redirigir según rol | Normal · error · cargando |
| 2 | Dashboard / estado actual (`/dashboard`) | CU-08 | Ver tarjetas por variable, refrescar, abrir detalle de sensor, cambiar de sistema | Normal · alerta · sin datos · dispositivo en silencio |
| 3 | Sistemas y cultivos (`/sistemas`) | CU-03 | CRUD de sistemas, abrir detalle de cultivo | Lista · vacío · crear/editar/eliminar |
| 4 | Detalle de cultivo (`/cultivos/:id`) | CU-03 | Ver cultivo, plantas y umbrales asociados | Con datos · vacío |
| 5 | Históricos (`/historicos`) | CU-09, CU-10 | Filtrar por sistema/sensor/fecha, paginar, exportar CSV, comparar | Vacío · cargando · con datos · 1 vs N sistemas |
| 6 | Alertas (`/alertas`) | CU-12 | Filtrar activas/resueltas, marcar resuelta, ver la medición que la originó | Activa · resuelta · sin alertas |
| 7 | Dispositivos (`/dispositivos`) | CU-04, CU-13 | CRUD, ver última comunicación y estado de conexión | Online · offline · nunca conectado |
| 8 | Detalle de dispositivo (`/dispositivos/:id`) | CU-05 | Ver sensores, tipo de variable y unidad; rotar credencial | Normal · credencial rotada |
| 9 | Reglas de alerta (`/reglas`) | CU-11 | CRUD, activar/desactivar, severidad, probar con valor de ejemplo | Activa · inactiva · prueba OK/error |
| 10 | Usuarios y permisos (`/usuarios`) | CU-02 | CRUD, asignar rol, activar/desactivar | Normal · sin permiso (403) |
| 11 | Mi cuenta (`/perfil`) | CU-01 | Cambiar contraseña, cerrar sesiones activas | Normal · error de validación |

> La documentación OpenAPI (`/api/docs`, CU-15) es una pantalla generada por Swagger, no un CRUD de negocio, y por eso
> no se numera como pantalla de usuario.

**Flujo de interacción principal (extremo a extremo):**

1. El usuario abre `/login` e ingresa credenciales; si es **Encargado** entra al **Dashboard**; si es **Administrador** puede ir además a **Usuarios**.
2. En el **Dashboard** ve tarjetas por variable; una en rojo indica una alerta → al hacer clic va a **Alertas**.
3. En **Alertas** marca "Resolver" → la alerta pasa a *resuelta*.
4. En **Históricos** filtra por sensor y rango de fechas → ve gráfico y tabla; exporta CSV y, opcionalmente, **compara** dos sistemas.
5. Un **Administrador** entra a **Reglas**, crea un umbral con severidad → el sistema lo aplica a las **nuevas** mediciones.

---

## 2. Wireframes de los procesos principales

> Notación: `[ ]` botón · `( )` radio/check · `▾` selector · `▭` campo de texto · `≡` menú.

### 2.1. W-01 · Iniciar sesión (`/login`, CU-01)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│            ┌──────────────────────────────────────┐                  │
│            │   🌱  AquaBrain Monitor              │                  │
│            │   Monitoreo de cultivos AquaPlants   │                  │
│            │                                      │                  │
│            │   Correo                             │                  │
│            │   ▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭       │                  │
│            │   Contraseña                    👁    │                  │
│            │   ▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭       │                  │
│            │                                      │                  │
│            │   [      Ingresar      ]             │                  │
│            │                                      │                  │
│            │   ⚠ Mensaje de error genérico:       │                  │
│            │     "Credenciales incorrectas"       │                  │
│            └──────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────────┘
```

Reglas de comportamiento:
- Botón deshabilitado hasta que ambos campos tengan contenido; `Enter` envía.
- Mensaje de error genérico (no revela si el correo existe) — RF01 · HU05.
- Tras 5 fallos en 15 min: bloqueo temporal con aviso "Cuenta bloqueada temporalmente, reintente en X minutos".
- Si la cuenta está desactivada: "El acceso está deshabilitado, contacte al administrador".
- Al autenticarse, redirección a `/dashboard` o a la ruta solicitada previamente.

### 2.2. W-02 · Dashboard de estado actual (`/dashboard`, CU-08)

Cumple **HU01**: última medición por sensor y por sistema (CA①), refresco automático y por botón (CA②),
distinción visual de valores fuera de rango (CA③) e **indicación de fecha y hora de la última medición (CA④)**.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ≡ AquaPlants  │ Dashboard  Históricos  Alertas  Dispositivos   [Sistema ▾]  👤    │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Encargado de cultivo · Sistema: Invernadero Norte   🔔 3 alertas · ⟳ Refrescar     │
├───────────────────────────────────────────────────────────────────────────────────┤
│ ┌── Sensores (última medición) ────────────────────────────────────────────────┐  │
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │  │
│ │ │ Temperatura  │ │ Humedad      │ │ Nivel (dist.)│ │ pH           │          │  │
│ │ │ 22,7 °C      │ │ 68 %         │ │ 14 cm        │ │ 6,1 ⚠        │          │  │
│ │ │ 15/09 14:03  │ │ 15/09 14:03  │ │ 15/09 14:02  │ │ 15/09 14:02  │          │  │
│ │ │ ● en línea   │ │ ● en línea   │ │ ● en línea   │ │ ● ALERTA     │          │  │
│ │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘          │  │
│ │ ┌──────────────┐ ┌──────────────┐                                            │  │
│ │ │ Caudal       │ │ (nuevo)      │                                            │  │
│ │ │ 12,4 L/min   │ │  + Añadir    │                                            │  │
│ │ │ 15/09 14:01  │ │              │                                            │  │
│ │ │ ● en línea   │ │              │                                            │  │
│ │ └──────────────┘ └──────────────┘                                            │  │
│ └──────────────────────────────────────────────────────────────────────────────┘  │
│ ┌── Cultivos activos ────────────────┐ ┌── Alertas activas (3) ──────────────────┐│
│ │ Lechuga romana · desde 12/08 · 42 d │ │ ⛔ pH bajo   Sensor pH-01   hace 3 min  ││
│ │ Albahaca · desde 03/09 · 21 d       │ │ ⚠ Sin comunicación Dev-02 hace 12 min   ││
│ │ Rúcula · desde 22/09 · 8 d          │ │ ⚠ Nivel alto   Sensor DIST-01 hace 6 min ││
│ └────────────────────────────────────┘ └────────────────────────────────────────┘ │
│ Última actualización: 15/09/2026 14:04:12 · Datos simulados con fines académicos  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

Semántica visual (clave para que el dato sea *útil*, no solo correcto):

| Estado de tarjeta | Color | Borde/ícono | Significado |
|---|---|---|---|
| Normal | Verde | ● verde | Última medición dentro de rango y fresca |
| Advertencia | Ámbar | ⚠/● ámbar | Regla de severidad media violada |
| Crítico | Rojo | ⛔ | Regla de severidad alta violada |
| Desactualizado | Gris | ⏱ | Última medición más antigua que 3× el intervalo de reporte (RN-05) |
| Dispositivo caído | Gris oscuro | 📴 | Dispositivo marcado sin comunicación (RF14) |

- Cada tarjeta es un enlace a `/historicos?sensor=<id>` (drill-down).
- El encabezado muestra el conteo de alertas activas y es un enlace a `/alertas`.
- **Cada tarjeta muestra fecha y hora de la última medición** (HU01 CA④), no solo "hace X min".
- Actualización automática cada 30 s (*polling*) + botón **⟳ Refrescar** (HU01 CA②).
- **Consistencia con el OLED (RN-12):** las variables y unidades se nombran igual que en el display local del AquaBrain; el mismo valor con la misma unidad no puede verse distinto en la web y en el OLED.

### 2.3. W-03 · Históricos, exportación y comparación (`/historicos`, CU-09 y CU-10)

Cumple **HU02**: filtros por sistema, sensor y rango (CA①), gráfico de líneas y tabla paginada (CA②) y
**exportación de los datos consultados (CA③)**. Cumple **HU04**: selección múltiple de sistemas (CA①),
líneas superpuestas con leyenda (CA②) y filtro por rango de fechas (CA③).

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ≡ AquaPlants  │ Dashboard  [Históricos]  Alertas  Dispositivos            👤      │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Filtros                                                                           │
│ Sistemas ▾ [x] Invernadero Norte  [x] Invernadero Sur   Cultivo ▾ Lechuga romana  │
│ Desde ▭ 01/09/2026   Hasta ▭ 15/09/2026   Agrupar ▾ 1 hora                         │
│ Variables:  (x) pH   (x) Temperatura   ( ) Humedad   ( ) Nivel   [+ Añadir]        │
│                                      [ Aplicar ]  [ Limpiar ]  [ ⭳ Exportar CSV ]  │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Serie comparada (09/09/2026 – 15/09/2026) — 2 sistemas, variable pH               │
│   pH        Invernadero Norte (──)   Invernadero Sur (─ ─)                         │
│  8 ┤                                        ╭──╮          ┆                        │
│    │        ╭────╮                    ╭────╯  ╰╮         ┆  ▓ rango normal        │
│  7 ┤───╮╭───╯    ╰──╮────────────╭───╯         ╰───       ┆  ── Norte              │
│    │   ╰╯           ╰────────────╯  ╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈      ┆  ┈┈ Sur                │
│  6 ┤                                                      ┆                        │
│    └────┬────┬────┬────┬────┬────┬────┬────┬────┬────>    ┆                        │
│        09   10   11   12   13   14   15   (fecha)         ┆                        │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Tabla de datos (paginada)                                     ▾ 25 · 50 · 100     │
│ Fecha/hora        Sensor        Valor     Unidad   Origen                          │
│ 15/09 14:00       pH-01         6,1       pH       online                          │
│ 15/09 13:00       pH-01         6,0       pH       online                          │
│ 15/09 12:00       pH-01         6,2       pH       offline (sincronizado 14:20)    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

Reglas de comportamiento:
- Rango máximo por consulta: 90 días (evita consultas destructivas, RNF03).
- La agregación (`1 min / 1 h / 1 día`) se resuelve **en la base de datos**, no en el cliente.
- Si un punto proviene de sincronización offline se marca con un indicador (RF06 · HU10).
- **Exportar CSV** descarga exactamente los datos filtrados (HU02 CA③), con fecha/hora, sensor, valor, unidad y origen.
- Comparación multi-sistema solo para una **variable común** (HU04 CA①).
- Estados vacíos explícitos: "No hay mediciones para los filtros seleccionados" + botón "Limpiar filtros".
- Error de red: tarjeta de reintento, sin perder los filtros aplicados.

### 2.4. W-04 · Bandeja de alertas (`/alertas`, CU-12)

Cumple **HU03**: alerta generada al recibir una medición fuera de norma (CA①), mostrada con **severidad y
timestamp** (CA②), **marcable como resuelta** (CA③) y con registro histórico de la alerta (CA④).

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ≡ AquaPlants  │ Dashboard  Históricos  [Alertas]  Dispositivos           👤       │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Estado: [ Activas 6 ][ Resueltas 62 ]        Severidad ▾ Todas                     │
│ Sistema ▾ Todas     Sensor ▾ Todos     Desde ▭ / Hasta ▭                           │
├───────────────────────────────────────────────────────────────────────────────────┤
│ ⛔ ALTA    pH bajo · pH-01 · valor 6,1 · umbral < 6,3 · Invernadero Norte          │
│            15/09/2026 14:02 (hace 3 min)      [ Marcar resuelta ]  [ Ver histórico ]│
│ ───────────────────────────────────────────────────────────────────────────────── │
│ ⚠ MEDIA    Sin comunicación · Dev-02 AquaBrain · última 15/09 13:50                │
│            15/09/2026 14:02                    [ Marcar resuelta ]  [ Ver dispositivo]│
│ ───────────────────────────────────────────────────────────────────────────────── │
│ ℹ BAJA     Nivel alto · DIST-01 · valor 14 cm · umbral > 12 cm                      │
│            15/09/2026 13:40                    [ Marcar resuelta ]  [ Detalle ]      │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Marcar resuelta:  comentario (opcional)  [ Confirmar ]   ← registra usuario y hora  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

Reglas de comportamiento:
- Cada alerta muestra **severidad, valor detectado, umbral aplicado y timestamp** (HU03 CA②).
- "Marcar resuelta" la retira de la lista de activas (HU03 CA③, RF12) y registra usuario y hora.
- Queda **registro histórico** de la alerta aunque se resuelva (HU03 CA④).
- Contadores por pestaña siempre visibles (activas / resueltas).

### 2.5. W-05 · Dispositivos: estado y última comunicación (`/dispositivos`, CU-13)

Cumple **RF14**: registro y consulta del estado de conexión y "última comunicación" de cada dispositivo.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ≡ AquaPlants  │ Dashboard  Históricos  Alertas  [Dispositivos]          👤       │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Sistema ▾ Invernadero Norte            Estado ▾ Todos            [ + Nuevo ]      │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Código      Modelo      Estado              Última comunicación   Sensores  Acción│
│ DEV-01      AquaBrain   ● En línea          15/09 14:03 (1 min)   3         Ver    │
│ DEV-02      AquaBrain   📴 Sin comunicación 15/09 13:50 (13 min)  4         Ver    │
│ DEV-03      AquaBrain   ● En línea          15/09 14:02 (2 min)   2         Ver    │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Detalle DEV-02                                                                    │
│   Intervalo de reporte: 5 min   ·  Umbral de silencio: 15 min (3×)                │
│   Último evento: "sin comunicación detectada" 14:02 · severidad ALTA              │
│   Sensores: TEMP-02, HUM-02, DIST-02, PH-02                                       │
│   Credencial de dispositivo: [ Regenerar API key ]  ⚠ se muestra una sola vez      │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 2.6. W-06 · Gestión (patrón CRUD) y reglas de alerta (`/reglas`, CU-11)

Cumple **HU07**: interfaz de configuración (variable, condición, valor, severidad) (CA①), activar/desactivar
reglas (CA②) y **probar la regla con una medición simulada antes de guardar (CA③)**.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ≡ AquaPlants  │ Dashboard  Históricos  Alertas  Dispositivos  [Reglas]     👤     │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Reglas de alerta                                        [ + Nueva regla ]         │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Ámbito             Variable       Condición           Severidad  Cooldown  Activa │
│ Sensor pH-01       pH             < 6,3  ó  > 7,5     Alta       15 min    (x)   │
│ Tipo: Temperatura  Temperatura    > 30 °C             Alta       10 min    (x)   │
│ Sensor DIST-01     Nivel (dist.)  > 12 cm             Media      30 min    ( )   │
├───────────────────────────────────────────────────────────────────────────────────┤
│ Nueva regla                                                                       │
│  Ámbito      ( ) Sensor  (•) Tipo de variable      Variable ▾ Temperatura          │
│  Sensor      ▾ (habilitado solo si Ámbito = Sensor)                               │
│  Condición   Operador ▾ mayor que       Umbral  ▭ 30   Unidad °C (auto)            │
│  Severidad   ▾ Alta         Cooldown  ▭ 10  minutos      (x) Activa                │
│  Vista previa: "Alertar cuando Temperatura > 30 °C (Alta), máx. 1 alerta cada 10 min"│
│  ── Probar regla (CA③) ──────────────────────────────────────────────────────────  │
│  Medición simulada: valor ▭ 31  [ Probar ]   ✔ Dispararía alerta (31 > 30)         │
│                                     [ Cancelar ]  [ Guardar regla ]               │
└───────────────────────────────────────────────────────────────────────────────────┘
```

Patrón reutilizable para **sistemas, cultivos, dispositivos, sensores y usuarios**:
**tabla + filtros + botón Nuevo + panel lateral de formulario + confirmación de eliminación/desactivación.**
Los formularios marcan en línea los campos inválidos y muestran el error del backend junto al campo (RNF01).

### 2.7. Flujo de extremo a extremo (demo ES3/ES4)

```mermaid
flowchart LR
    A["Dispositivo ESP32-S3 o simulador<br/>POST /api/v1/mediciones"] --> B["API valida (incluye timestamp) y persiste"]
    B --> C{"¿Violó una regla activa?"}
    C -->|Sí| D["Se crea alerta y se encola notificación"]
    C -->|No| E["Solo se registra la medición"]
    D --> F["Dashboard muestra tarjeta/alertas con severidad y hora"]
    E --> F
    F --> G["Encargado marca la alerta como resuelta"]
    G --> H["Histórico conserva la traza completa (alerta + medición)"]
```

---

## 3. Guía visual (design system)

### 3.1. Paleta y tokens

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#1F7A63` (verde AquaPlants) | Acciones principales, encabezado, foco |
| `--color-primary-dark` | `#155C4A` | Hover/active |
| `--color-accent` | `#3FA9C9` (agua) | Series de datos, enlaces secundarios |
| `--color-ok` | `#2E9E6B` | Estado normal |
| `--color-warn` | `#D98A17` | Advertencia (severidad media) |
| `--color-danger` | `#C0392B` | Crítico (severidad alta) |
| `--color-neutral-50…900` | escala de grises | Fondos, texto, bordes |
| `--color-surface` | `#FFFFFF` | Tarjetas |
| `--color-bg` | `#F5F8F7` | Fondo de aplicación |
| `--text-muted` | `#5B6B66` | Texto secundario (contraste ≥ 4.5:1 sobre superficie) |

Regla: **el color nunca es el único portador de significado** — siempre acompañado de ícono o texto (accesibilidad, daltonismo).

### 3.2. Tipografía y espaciado

| Elemento | Especificación |
|---|---|
| Tipografía | Inter (o system UI) con fallback; una sola familia |
| Escala | 12 / 14 / 16 (base) / 20 / 24 / 32 px; interlineado 1,5 en cuerpo |
| Pesos | 400 cuerpo · 500 etiquetas · 600 encabezados · 700 cifras KPI |
| Cifras de datos | `font-variant-numeric: tabular-nums` para alinear valores |
| Espaciado | Escala 4/8/12/16/24/32 px; padding de tarjeta 16 px |
| Radios | 8 px tarjetas, 6 px controles, 999 px *badges* |
| Sombras | Sutil: `0 1px 2px rgba(0,0,0,.06)` |

### 3.3. Componentes base y sus estados

| Componente | Estados obligatorios |
|---|---|
| Botón | normal · hover · focus visible · activo · deshabilitado · cargando (con *spinner* y texto "Guardando…") |
| Campo | vacío · con foco · válido · inválido (borde + mensaje) · deshabilitado |
| Tabla | cargando (*skeleton*) · vacía (mensaje + acción) · con datos · error (reintentar) · paginación |
| Tarjeta de sensor | normal · advertencia · crítico · desactualizado · dispositivo caído |
| Badge de severidad | Alta (rojo) · Media (ámbar) · Baja (azul) · Informativa (gris) |
| Notificación (*toast*) | éxito · error · advertencia; descartable y anunciada a lectores de pantalla |

### 3.4. Responsive y adaptabilidad (RNF05)

| Breakpoint | Ancho | Comportamiento |
|---|---|---|
| `xs` | 360–639 px | Una columna; menú en cajón lateral; tarjetas en *scroll* horizontal; tabla → lista de tarjetas |
| `sm` | 640–1023 px | Dos columnas; filtros colapsables |
| `md` | 1024–1439 px | Grid de 3 columnas; barra lateral fija |
| `lg` | ≥ 1440 px | Grid de 4 columnas; gráficos a ancho completo |

La gráfica histórica mantiene la misma información en móvil (con *tooltip* táctil y leyenda plegable); la tabla de datos se transforma en tarjetas etiquetadas.

### 3.5. Accesibilidad básica (WCAG 2.1 AA)

- [ ] Contraste de texto ≥ 4.5:1 y de componentes ≥ 3:1 (verificado sobre la paleta).
- [ ] Navegación completa por teclado con orden lógico y **foco visible** en todos los controles.
- [ ] Formularios con `<label>` asociado, mensajes de error vinculados (`aria-describedby`) y `aria-invalid`.
- [ ] Modales y paneles: foco atrapado, cierre con `Esc`, retorno de foco al disparador.
- [ ] Gráficos con alternativa textual (tabla de datos subyacente) y no solo color.
- [ ] Estados del sistema (cargando/error/en línea) anunciados con `aria-live="polite"`.
- [ ] Textos alternativos en íconos con significado; `aria-hidden` en decorativos.
- [ ] Idiomas y unidades explícitos ("°C", "%", "cm", "L/min") junto al valor.

---

## 4. Prototipo interactivo

| Entregable | Herramienta | Alcance |
|---|---|---|
| Wireframes de baja fidelidad | Este documento (Markdown/ASCII) | Estructura de todas las pantallas |
| Prototipo navegable de alta fidelidad | Figma | Flujo **clicable**: Login → Dashboard → Alertas → Históricos → Administración |
| Mapa de navegación | Mermaid (§1) | Rutas y restricciones por rol |

**Enlace al prototipo navegable:** `‹URL-FIGMA›` (compartido como "cualquiera con el enlace puede ver", solo lectura).
*Reemplazar por la URL real antes de entregar.*

Estado del prototipo y cambios derivados de la retroalimentación: ver `09-feedback-prototipo.md`.

---

## 5. Trazabilidad de la interfaz con las HU

| Pantalla | HU | Criterios de aceptación cubiertos |
|---|---|---|
| W-01 Login | HU05 | RF01; base para el resto |
| W-02 Dashboard | HU01 | CA① último valor por sensor/sistema · CA② refresco · CA③ fuera de rango · CA④ fecha/hora |
| W-03 Históricos | HU02 | CA① filtros · CA② gráfico + tabla · CA③ exportar |
| W-03 Comparación | HU04 | CA① multi-sistema · CA② líneas con leyenda · CA③ rango de fechas |
| W-04 Alertas | HU03 | CA① generada al recibir · CA② severidad + timestamp · CA③ marcar resuelta · CA④ registro histórico |
| W-05 Dispositivos | RF14 / HU10 | Estado de conexión y última comunicación |
| W-06 Reglas | HU07 | CA① config · CA② activar/desactivar · CA③ **probar regla** |
| W-06 CRUD | HU06 | Crear/editar/eliminar sistemas, dispositivos y sensores |
