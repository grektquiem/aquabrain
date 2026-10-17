# 04 · Tendencias de TI aplicables

## 4.1. Criterio de selección: pertinencia, no moda

El desafío pide reconocer las tendencias aplicables **sin seleccionar por moda**. Por eso cada
tendencia se evalúa con una pregunta de pertinencia: *¿resuelve un problema real de este proyecto y
es alcanzable en el prototipo académico?* Las tendencias que no responden a una necesidad concreta
se descartan explícitamente (§4.3), lo que demuestra criterio y no acumulación de tecnología.

## 4.2. Tendencias aplicables y su impacto

| Tendencia | Aplicación en AquaPlants | Impacto en el proyecto |
|---|---|---|
| **IoT** | El ESP32-S3 con AHT10 y HC-SR04 sensa variables reales y transmite a la nube | La plataforma debe exponer una **API** capaz de recibir el tráfico del firmware y mostrar el **estado de conexión** del dispositivo |
| **Edge computing / interfaz local embebida** | El OLED SSD1309 y el joystick permiten operar sin nube | Requisito de **autonomía local** y sincronización posterior; la web debe tolerar datos tardíos |
| **API-first / multi-cliente** | La app Android y el dashboard web consumen la misma fuente | **Contratos estables, versionados y documentados** para no romper clientes ya construidos |
| **Cloud-native / contenedores** | Empaquetar frontend, backend y base de datos | **Reproducibilidad** del entorno y despliegue simple en cualquier nube |
| **Dashboards en tiempo real** | Actualización por *polling* o WebSocket del estado | Mejora la **experiencia del encargado** y la consistencia con el display local |
| **Seguridad Zero Trust** | Autenticación y validación en cada petición, desde los tres clientes | No se confía en ningún cliente: **control por rol y por dispositivo** en cada llamada |
| **Bases de datos relacionales con soporte de series temporales** | PostgreSQL con índices compuestos `(sensor_id, timestamp)` | **Históricos eficientes**; migración futura a una extensión de series temporales si el volumen crece |

## 4.3. Tendencias evaluadas y no adoptadas

Tan importante como elegir es **justificar el descarte**. Estas tendencias se analizaron y se
dejaron fuera del alcance del prototipo:

| Tendencia | Por qué se considera | Por qué no se adopta ahora |
|---|---|---|
| **Machine Learning / analítica predictiva** | La estructura de mediciones históricas permitiría predicciones de rendimiento | El desafío **no exige** IA ni predicción avanzada; incorporarla desviaría el esfuerzo del flujo esencial |
| **Arquitectura de microservicios** | Escalabilidad independiente por servicio | Sobredimensionada para un **equipo pequeño** y un alcance acotado; agrega complejidad operativa sin valor inmediato |
| **Almacenamiento NoSQL como fuente principal** | Manejo de grandes volúmenes y esquemas flexibles | Los datos del dominio son **altamente relacionales** (sistema → dispositivo → sensor → medición); se prioriza integridad referencial |
| **Escalabilidad masiva (particionamiento real, réplicas, *sharding*)** | La empresa proyecta cientos o miles de equipos | El prototipo **no requiere esa escala**; se documenta la estrategia, no se implementa (NEC-09 / RNF04) |
| **Blockchain / trazabilidad distribuida** | Narrativa de "trazabilidad" | No hay requisito de confianza distribuida entre terceros; un **histórico inmutable en base de datos** cubre la necesidad real |

## 4.4. Síntesis del impacto en el proyecto

El análisis de tendencias converge en cuatro decisiones de arquitectura conceptual que se
arrastrarán al diseño (ES2):

1. **La API es el centro del sistema** (*API-first*): tanto el firmware, como la app Android y el
   dashboard dependen de un contrato único, versionado y documentado.
2. **El dato es de tipo serie temporal**: la tabla de mediciones crecerá más que cualquier otra y
   exige índices y una estrategia de crecimiento.
3. **La resiliencia se diseña desde el dispositivo**: como el dispositivo opera sin conexión, la
   plataforma debe aceptar datos tardíos y no perder información.
4. **La seguridad es transversal**: se aplica a los tres clientes (navegador, móvil, dispositivo),
   no solo a la interfaz web.

> Estas tendencias no se adoptan "porque están de moda": cada una responde a una necesidad
> identificada en el capítulo 03 y a una restricción concreta del material entregado (hardware real,
> app existente, conectividad intermitente y crecimiento proyectado).
