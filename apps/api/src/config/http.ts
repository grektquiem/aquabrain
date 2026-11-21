import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/** Orígenes autorizados por CORS, leídos de `CORS_ORIGINS` (lista separada por comas). */
export function origenesPermitidos(config: ConfigService): string[] {
  return (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
}

export function aplicarEndurecimiento(app: NestExpressApplication, config: ConfigService): void {
  const logger = new Logger('Endurecimiento');
  logger.log(`CORS permitido para: ${origenesPermitidos(config).join(', ')}`);

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
