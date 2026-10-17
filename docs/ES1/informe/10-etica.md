# 10 · Impacto ético y profesional

## 10.1. Marco de referencia

Las medidas de seguridad de un sistema que captura datos operativos y de usuarios no son solo una
decisión técnica: tienen una **dimensión ética y profesional**. El equipo adopta como marco de
referencia la **normativa chilena de protección de datos personales** —Ley **19.628** sobre vida
privada y Ley **21.719** que moderniza su tratamiento— y las buenas prácticas de la industria
(OWASP, principio de mínimo privilegio). El objetivo es que la plataforma **trate los datos de forma
justa, transparente y responsable**.

## 10.2. Privacidad y minimización de datos

- Se almacenan **solo los datos necesarios** de usuarios (nombre, correo, rol) y de cultivos
  (mediciones asociadas a sensores).
- Se aplica **retención limitada** y **anonimización cuando sea posible**; no se conservan datos más
  tiempo del necesario para la operación y el análisis.
- Los datos de cultivo (rendimiento, nutrientes) pueden tener **valor comercial**; su tratamiento se
  limita a los fines acordados con la empresa y **no se comparten con terceros sin autorización**.

## 10.3. Acceso y mínimo privilegio

- El acceso se controla por **roles** (Encargado, Supervisor, Administrador): cada usuario ve y hace
  solo lo que le corresponde.
- Se aplica el **principio de mínimo privilegio** mediante RBAC, con **revisión periódica** de los
  permisos.
- Ningún usuario puede **elevar su propio rol** ni eliminar su propia cuenta (RN-06), lo que evita
  escaladas de privilegio.

## 10.4. Responsabilidad y trazabilidad

- Se mantienen **logs de auditoría** y trazabilidad de cambios: quién hizo qué y cuándo.
- Todo **incidente de seguridad** se gestiona y documenta; la transparencia frente a la contraparte
  es parte del compromiso profesional.
- El histórico de mediciones es **inmutable** (RN-02): no se reescribe el pasado, se agrega un dato
  nuevo para corregir (RN-03), lo que protege la integridad de la evidencia.

## 10.5. Tratamiento y uso correcto de los datos

- **Cifrado en tránsito** (HTTPS/TLS) y, cuando corresponde, **en reposo**.
- **No reutilización indebida:** los datos del cultivo se usan para mejorar la producción, no para
  fines ajenos a la relación con AquaPlants.
- **Calidad del dato:** como las alertas dependen de datos confiables, se valida la entrada y se
  rechazan mediciones inconsistentes (por ejemplo, marcas de tiempo futuras).

## 10.6. Impacto ético y profesional de cada medida

| Medida de seguridad | Impacto ético | Impacto profesional |
|---|---|---|
| **Autenticación y roles (RBAC)** | Garantiza que cada usuario acceda solo a lo que le compete, respetando la privacidad del cultivo y del personal | Alinea con el principio de mínimo privilegio, estándar de la industria |
| **HTTPS y cifrado** | Evita que terceros intercepten información sensible (por ejemplo, niveles de nutrientes con valor comercial) | Demuestra responsabilidad en el manejo de datos y cumple buenas prácticas |
| **Validación de entrada y sanitización** | Previene que el sistema se use para ataques que podrían alterar valores de riego y dañar el cultivo | Refleja un enfoque proactivo y evita la negligencia en el desarrollo |
| **Hash de contraseñas (bcrypt)** | Protege la identidad de los usuarios ante una eventual brecha | Cumple con estándares de seguridad reconocidos (OWASP, NIST) |
| **Logs de auditoría** | Permite identificar acciones indebidas y responsabilizar, promoviendo la transparencia | Facilita el cumplimiento normativo y la confianza de la contraparte |
| **API key por dispositivo** | Evita que un tercero se haga pasar por un AquaBrain e inyecte datos falsos | Protege la integridad del ecosistema hardware–software de la empresa |

## 10.7. Impacto en las personas y en el negocio

Un fallo de seguridad **no solo expone datos**: puede afectar **decisiones de cultivo**, la **confianza
en la plataforma** y la **continuidad operativa** de AquaPlants. Además, la plataforma está pensada
para **usuarios no técnicos** (encargados de cultivo): la seguridad debe ser **invisible y no estorbar**
la operación diaria, y los mensajes de error deben ser claros sin revelar información sensible. Este
equilibrio entre protección y usabilidad es, en sí mismo, una decisión ética y profesional.

> **Compromiso del equipo.** Tratar los datos de AquaPlants con el mismo cuidado con que se tratan
> datos personales, documentar las decisiones de seguridad, no ocultar brechas y diseñar pensando en
> el usuario final, no solo en el requisito técnico.
