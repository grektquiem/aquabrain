# Diagramas 4+1 · AquaPlants / AquaBrain

Cinco vistas complementarias del modelo **4+1 (Kruchten)**. Cada archivo contiene los diagramas Mermaid listos para
ver, exportar o convertir a PNG/SVG.

| # | Vista | Pregunta que responde | Archivo |
|---|---|---|---|
| +1 | **Escenarios** (casos de uso) | ¿Para qué sirve y qué flujos soporta? | [`01-vista-escenarios.md`](01-vista-escenarios.md) |
| 1 | **Lógica** | ¿Qué componentes y responsabilidades existen? | [`02-vista-logica.md`](02-vista-logica.md) |
| 2 | **Procesos** | ¿Cómo colaboran en tiempo de ejecución? | [`03-vista-procesos.md`](03-vista-procesos.md) |
| 3 | **Desarrollo** | ¿Cómo se organiza el código y el trabajo? | [`04-vista-desarrollo.md`](04-vista-desarrollo.md) |
| 4 | **Física** (despliegue) | ¿Dónde se ejecuta todo? | [`05-vista-fisica.md`](05-vista-fisica.md) |

**Fuente única de verdad:** `docs/ES2/02-arquitectura-4mas1.md` (§2 escenarios, §3 lógica, §4 procesos,
§5 desarrollo, §6 física). Estos archivos son la extracción por vista para visualización y exportación.

---

## Cómo verlos

- **En VS Code / OpenCode:** instala la extensión *Markdown Preview Mermaid Support* → abre el archivo → `Ctrl+Shift+V`.
- **En GitHub:** los `.md` con bloques ` ```mermaid ` se renderizan automáticamente al subirlos.
- **Para exportar a PNG/SVG:** usa [mermaid.live](https://mermaid.live) pegando el bloque, o `mmdc` de la CLI de Mermaid.

## Trazabilidad

| Vista | Requisitos que satisface |
|---|---|
| Escenarios | RF01, RF02, RF03, RF06, RF07, RF08, RF09, RF11, RF12, RF13, RF14 |
| Lógica | RF01…RF14, RNF06, RNF08 |
| Procesos | RNF01, RNF02, RNF03, RNF05, RN-04, RN-05, RN-09, RN-10, RN-12 |
| Desarrollo | RNF06, RNF07, RNF08 |
| Física | RNF02, RNF03, RNF07, RNF08 |
