# 14. Conclusiones

## 14.1 Sobre el cumplimiento de los objetivos

La Unidad 3 pedía **implementar** la solución diseñada en ES2. La entrega materializa un sistema funcional de extremo a extremo: una API NestJS con 35 rutas documentadas en OpenAPI, una base de datos PostgreSQL con 19 modelos y más de 50 000 mediciones, un dashboard React verificado en navegador y un simulador que reproduce el gateway ESP32-S3 del cliente, incluida la tolerancia a cortes de red.

**Todos los requisitos funcionales *Must* quedaron implementados y probados.** De los 33 requisitos considerados, 18 se cumplen con evidencia automatizada, 8 quedan parciales con el faltante acotado y solo los declarados *Won't* en el MoSCoW (RF15, RNF04 particionado, RNF09) no se abordaron.

## 14.2 Sobre la calidad de la implementación

- **Seguridad:** autenticación JWT con refresco rotado y revocado en cookie `HttpOnly`, RBAC de 21 permisos, contraseñas con bcrypt (coste 12), autenticación de dispositivo con clave hasheada + pepper, validación de entrada con *whitelist*, endurecimiento HTTP y auditoría de operaciones y denegaciones.
- **Calidad:** **125 pruebas en verde** (50 unitarias + 75 de integración) y **92,26 % de cobertura de líneas**, por encima del 70 % exigido, medida sobre la suite completa.
- **Rendimiento:** el panel responde en ~0,1 s y una serie de un mes sobre 52 230 filas en ~0,6 s (p50), muy por debajo de las metas de 2 s y 5 s.
- **Reproducibilidad:** entorno declarado con Docker Compose y CI en GitHub Actions; ejecución local completa verificada.

Parte de este resultado se explica por una decisión que resultó valiosa: **probar en serio**. Las pruebas de integración descubrieron defectos reales (el `500` de auditoría por `BigInt`, la mala clasificación de un `422`) que de otro modo habrían llegado al usuario.

## 14.3 Sobre la honestidad del informe

Se sustituyeron **todas** las cifras de relleno del borrador por mediciones reales y se declararon explícitamente las brechas: no hubo despliegue en nube, ni k6, ni ZAP, ni Lighthouse, ni validación con la app Android, y el almacenamiento NoSQL previsto en ES2 no se implementó. Ninguna de estas ausencias se oculta; cada una tiene su causa en la sección 11 y su recomendación en la 12. El hallazgo de rendimiento del camino de escritura por lote (16,4 s por cada 500 lecturas) se documentó y además **se resolvió en esta entrega** con la optimización R-01, bajando ese lote a ~1,4 s (§9.5).

## 14.4 Aprendizajes del equipo

- **Una sola fuente de verdad se demuestra, no se declara.** El paquete `@aquabrain/shared` solo adquirió valor cuando una prueba de contrato verificó que la API y los esquemas compartidos no divergen.
- **La idempotencia es un requisito de datos, no de red.** El reenvío del mismo lote devolviendo 8 duplicadas confirmó que la clave `id_externo` es lo que evita duplicar historia.
- **Las pruebas de integración valen por lo que encuentran.** Los dos defectos corregidos no aparecían en pruebas unitarias aisladas.
- **Declarar lo no hecho es parte de la ingeniería.** Un informe que reconoce sus límites es más útil que uno que los esconde.

## 14.5 Trabajo futuro

Las recomendaciones de la sección 12 marcan la continuidad natural: desplegar en un entorno real con HTTPS (**R-02**), integrar la app Android y el hardware (R-03), y madurar escalabilidad (Redis, particionado) y cobertura. La optimización de la ingesta por lote (**R-01**) ya se implementó y verificó en esta entrega. En conjunto, estas acciones transforman un prototipo sólido y reproducible en un servicio operable en producción.

## 14.6 Cierre

La solución AquaBrain queda **implementada, probada y documentada**, con su trazabilidad completa desde las historias de usuario hasta las pruebas, y con límites declarados con transparencia. El sistema centraliza el monitoreo de las instalaciones de AquaPlants, genera alertas automáticas y sobrevive a cortes de conectividad, que era el objetivo de negocio planteado desde ES1.
