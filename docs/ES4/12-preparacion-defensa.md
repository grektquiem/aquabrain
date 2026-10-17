# 12. Preparación para la Defensa y Preguntas

## 12.1 Principios para responder

1. **Responder lo que se pregunta**, con una frase directa y luego el detalle.
2. **Cifra o silencio:** si no se midió, se dice «no lo medimos» y se explica por qué. Nunca improvisar un número.
3. **Reconocer la brecha y ofrecer el camino:** cada límite va acompañado de su mitigación.
4. **Distinguir diseño, implementación y producción:** muchas preguntas se responden «está diseñado e implementado; aún no desplegado».

## 12.2 Reparto de preguntas por dominio

| Dominio | Responde | Tipo de preguntas |
|---|---|---|
| **Frontend / UX** | Perfil frontend | Pantallas, usabilidad, históricos, accesibilidad |
| **Backend / API** | Perfil backend | Contrato, seguridad, rendimiento, base de datos |
| **Transversal** | Todo el equipo | Alcance, planificación, ética, proyección |

## 12.3 Banco de preguntas y respuestas

| # | Pregunta probable | Respuesta honesta |
|---|---|---|
| 1 | **¿Por qué NestJS y no FastAPI?** | En el borrador de ES2 estaba FastAPI; el equipo unificó **todo el stack en TypeScript** para compartir los esquemas `@aquabrain/shared` entre API, dashboard y simulador. Se conservan capas y contrato REST; es la discrepancia D-01 del informe ES3. |
| 2 | **¿Por qué no usaron Redis?** | Con **una sola instancia** no aportaba valor y añadía operación. La variable `REDIS_URL` está declarada como **reservada**; entra cuando se escale a varias instancias (§9.7). |
| 3 | **¿Cómo evitan mediciones duplicadas?** | **Idempotencia** por la clave `(dispositivoId, idExterno)` en `medicion_idempotencia`. Hay pruebas específicas para duplicados **dentro de un mismo lote** y entre lotes. |
| 4 | **¿Qué pasa si un valor está fuera de rango?** | **No se descarta**: se guarda con `calidad = SOSPECHOSA` y **dispara la alerta**. Descartarlo ocultaría justamente el dato que hay que investigar. |
| 5 | **¿Y si el gateway pierde la conexión?** | El simulador (igual que el firmware) **almacena en búfer** y reintenta en modo `offline`, enviando marcas de tiempo pasadas; la idempotencia impide duplicar al reconectar. Evidencia en `sim-offline.txt`. |
| 6 | **¿Cómo escalaría a millones de registros?** | Con **umbrales medibles** (§9.7): particionar `medicion` sobre 50 M filas, cola + workers si la ingesta supera 100 lotes/s, y Redis al pasar de una instancia. Hoy, con 52 230 filas, no se justifica. |
| 7 | **¿Verificaron la seguridad con OWASP ZAP?** | **No.** Se aplicaron mitigaciones OWASP Top 10 a nivel de código (RBAC, bcrypt, validación *whitelist*, ORM parametrizado), pero **no** se ejecutó un escaneo externo. Está en el roadmap. |
| 8 | **¿Cómo protegen los datos personales?** | Minimización (correo, nombre), contraseñas con **bcrypt coste 12** y **auditoría** de operaciones. Falta una **política de retención/anonimización** (Ley 21.719); se declara como pendiente. |
| 9 | **¿Por qué la cobertura de ramas es la más baja?** | 69,01 % de ramas frente a 92,26 % de líneas: las ramas sin cubrir son **caminos de error** (excepciones, códigos poco frecuentes). El umbral se cumple; subirlo es trabajo futuro. |
| 10 | **¿Cómo probaron la interfaz?** | **Verificación manual en navegador** con capturas; **no** hay suite automatizada de UI. Es una brecha reconocida, no un logro. |
| 11 | **¿Por qué el motor de reglas corre en línea y no asíncrono?** | Al volumen actual es simple y suficiente (la alerta aparece dentro de la ingesta). La alternativa **cola + workers** está prevista para cuando el volumen lo exija. |
| 12 | **¿Integraron la app Android del cliente?** | El **contrato está listo** (OpenAPI + Zod), pero **no** se validó contra la app Android real: no se disponía del cliente que consume hoy. Es RNF08, declarado parcial. |
| 13 | **¿Cuál es el mayor riesgo del proyecto?** | Que el **firmware real** difiera del contrato simulado (R-1). Mitigación: probar un lote real contra el contrato antes de integrar. |
| 14 | **¿Qué harían diferente?** | Desplegar en un entorno real **desde el inicio** (no al final) y escribir la suite de UI junto con las pantallas. |
| 15 | **¿Qué garantiza que el sistema se puede mantener?** | Documentación (ES1–ES4), **125 pruebas** que describen el comportamiento, contrato OpenAPI y mensajes de *commit* convencionales. |

## 12.4 Preguntas «difíciles» y cómo encuadrarlas

- **«¿Por qué no está en producción?»** → Porque el alcance académico se centró en construir y probar; llevar a producción es de operación (§9) y no requiere rediseño. Se entrega el camino, no la excusa.
- **«¿Entonces el proyecto está incompleto?»** → Está **completo en su alcance** y con **brechas declaradas**. La cobertura, las pruebas y el rendimiento son reales; lo que falta está explícito y planificado.
- **«¿Confían en sus números?»** → Sí, y por eso se distinguen **medidos** (rendimiento, cobertura, pruebas) de **estimados** (costos, §10.2) y de **no ejecutados** (ZAP, Lighthouse, k6).

## 12.5 Consejos finales

- Tener **abierta** la carpeta `docs/ES4/` durante la defensa para citar la fuente de cualquier cifra.
- Si una pregunta es de un compañero, **dejar que responda** y complementar; no atropellar.
- Si nadie sabe la respuesta, decir «no lo medimos; lo agregamos como trabajo futuro»: es una respuesta válida y honesta.
- Practicar las **cinco cifras estrella** hasta decirlas sin leer: **125 pruebas**, **92,26 %**, **52 230 mediciones**, **35 rutas**, **104,1 ms**.
