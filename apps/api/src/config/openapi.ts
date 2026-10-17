import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Documentación OpenAPI servida por la propia API (RF15, TS-42).
 * Compartida entre `main.ts` y las pruebas para que la verificación del
 * contrato se haga sobre el mismo documento que consume el equipo móvil.
 */
export function configurarOpenApi(app: INestApplication, prefijo: string): void {
  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('AquaBrain API')
      .setDescription('Sistema de control y monitoreo para AquaPlants / AquaBrain — ES3')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
      .addServer(`/${prefijo}`)
      .build(),
  );
  SwaggerModule.setup('api/docs', app, documento, { swaggerOptions: { persistAuthorization: true } });
}
