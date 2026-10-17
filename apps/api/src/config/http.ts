import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/**
 * Endurecimiento HTTP de la API (RNF01, TS-23).
 *
 * Se aísla aquí para que la configuración que corre en pruebas sea
 * **exactamente** la de producción: si la prueba de CORS/cabeceras pasara,
 * es porque el binario real también las emite.
 */

/** Orígenes autorizados por CORS, leídos de `CORS_ORIGINS` (lista separada por comas). */
export function origenesPermitidos(config: ConfigService): string[] {
  return (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function aplicarEndurecimiento(app: NestExpressApplication, config: ConfigService): void {
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cookieParser());
  app.useBodyParser('json', { limit: config.get<string>('BODY_LIMIT') ?? '1mb' });
  app.enableCors({
    origin: origenesPermitidos(config),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Key', 'X-Device-Code'],
  });
}
