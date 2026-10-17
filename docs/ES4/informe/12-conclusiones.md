# 12. Conclusiones

## 12.1 Sobre el cumplimiento de los objetivos

El proyecto recorrió el ciclo completo: **diagnóstico (ES1) → diseño (ES2) → implementación (ES3) → cierre (ES4)**. La Unidad 4 pedía **comunicar** la solución, y esta entrega demuestra que existe un sistema funcional de extremo a extremo: una API NestJS con **35 rutas** documentadas, una base PostgreSQL con **19 modelos** y **52 230** mediciones, un dashboard React verificado en navegador y un simulador que reproduce el *gateway* ESP32-S3, incluida la tolerancia a cortes de red.

**Todos los requisitos funcionales *Must* quedaron implementados y probados.** Del catálogo de 26 requisitos (15 RF + 11 RNF): **17 cumplidos con evidencia**, **6 parciales** con el faltante acotado y **3 fuera de alcance** por decisión MoSCoW (RF15 licenciamiento, RNF04 particionado, RNF09 autonomía del firmware).

## 12.2 Sobre la calidad de la implementación

- **Seguridad:** JWT con refresco rotado, RBAC de **21 permisos**, contraseñas con bcrypt (coste 12), autenticación de dispositivo con clave *hasheada* + *pepper*, validación *whitelist* y auditoría de operaciones (capítulo 6).
- **Calidad verificable:** **125 pruebas** (50 unitarias + 75 de integración) en verde y **92,26 %** de cobertura de líneas, medida con un umbral que **rompe el *build*** si baja.
- **Rendimiento:** el panel responde en **104,1 ms** (p50) y la serie de un mes en **573,7 ms** (p50) sobre 52 230 filas; la optimización de ingesta **R-01** redujo el vaciado de un lote de 500 lecturas de **16,4 s a ~1,4 s** (≈ 12×).
- **Reproducibilidad:** Docker Compose, migraciones versionadas y una CI que migra, siembra, prueba y mide cobertura.

## 12.3 Sobre la continuidad del proyecto

El sistema está **listo para crecer**, no para archivarse. El plan de mantención (capítulo 7) fija responsables, frecuencias y **umbrales medibles** de escalabilidad; la viabilidad (capítulo 2) muestra que llevarlo a producción cuesta del orden de **15–30 USD/mes** en un escenario mínimo (estimación), con la ruta de mejora definida: despliegue con HTTPS, *upgrade* a NestJS 11, RF09 en la interfaz, validación con la app Android y auditoría de accesibilidad.

## 12.4 Cobertura de la evaluación ES4

| Aspecto evaluado | Estado | Dónde se respalda |
|---|:--:|---|
| Documentación final del proyecto | ✅ | Capítulos 2 y 3 |
| Funcionalidad y características | ✅ | Capítulos 4 y 5 |
| Normativas, estándares y claridad | ✅ | Capítulo 6 |
| Plan de mantención | ✅ | Capítulo 7 |
| Presentación final | ✅ | Capítulo 8 |
| Presentación de resultados | ✅ | Capítulo 9 |
| Exposición oral | ✅ | Capítulo 10 |
| Defensa y preguntas | ✅ | Capítulo 11 |

## 12.5 Reflexión final

El aprendizaje central del equipo no fue una tecnología, sino un **criterio**: separar lo que se **midió** de lo que se **estimó** y de lo que **no se hizo**. Ese criterio atraviesa todo el informe y es, probablemente, lo más valioso que deja el proyecto.

Un sistema que reconoce sus límites —«ZAP no se ejecutó», «la cobertura de ramas es 69,01 %», «no hay video de la demo»— es más creíble y más útil que uno que presume de cifras que nadie puede reproducir. AquaBrain queda **funcionando, documentado y con un mapa honesto de lo que sigue**.
