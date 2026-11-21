import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { aplicarEndurecimiento } from './config/http';
import { configurarOpenApi } from './config/openapi';
import { crearValidationPipe } from './common/pipes/validation.pipe';

/**
 * Arranque de la API AquaBrain (RF13, RNF01).
 *
 * Orden de endurecimiento: helmet → CORS explícito → cookies → validación y
 * prefijo global → documentación OpenAPI.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Arranque');

  // Endurecimiento HTTP compartido con las pruebas de integración (TS-23).
  aplicarEndurecimiento(app, config);

  const prefijo = config.get<string>('API_PREFIX') ?? 'api/v1';
  app.setGlobalPrefix(prefijo, { exclude: ['health'] });
  app.useGlobalPipes(crearValidationPipe());
  app.enableShutdownHooks();

  configurarOpenApi(app, prefijo);

  const puerto = Number(config.get('PORT') ?? 3000);
  await app.listen(puerto);
  logger.log(`API AquaBrain escuchando en http://localhost:${puerto}/${prefijo}`);
  logger.log(`OpenAPI disponible en http://localhost:${puerto}/api/docs`);