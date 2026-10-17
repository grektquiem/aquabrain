import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { crearValidationPipe } from '../../src/common/pipes/validation.pipe';
import { aplicarEndurecimiento } from '../../src/config/http';
import { configurarOpenApi } from '../../src/config/openapi';

export const PREFIJO = 'api/v1';

/** Levanta la aplicación con la misma configuración que `main.ts`. */
export async function crearApp(): Promise<INestApplication> {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = modulo.createNestApplication<NestExpressApplication>();
  aplicarEndurecimiento(app, app.get(ConfigService));
  app.setGlobalPrefix(PREFIJO, { exclude: ['health'] });
  app.useGlobalPipes(crearValidationPipe());
  configurarOpenApi(app, PREFIJO);
  await app.init();
  return app;
}

export const prismaDe = (app: INestApplication): PrismaService => app.get(PrismaService);

export const url = (ruta: string): string => `/${PREFIJO}${ruta}`;

/** Inicia sesión y devuelve el par de tokens. */
export async function iniciarSesion(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; rol: string; permisos: string[] }> {
  const res = await request(app.getHttpServer())
    .post(url('/auth/login'))
    .send({ email, password })
    .expect(200);
  return res.body;
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Clave de API con el formato del firmware (`ak_live_<base64url>`). */
export function generarApiKey(): string {
  return `ak_live_${randomBytes(32).toString('base64url')}`;
}

export function hashDeClave(apiKey: string, pepper = process.env.DEVICE_KEY_PEPPER ?? ''): string {
  return bcrypt.hashSync(apiKey + pepper, 10);
}

export interface Tenant {
  sufijo: string;
  sistemaId: string;
  dispositivoId: string;
  apiKey: string;
  deviceHeaders: Record<string, string>;
  sensorIds: Record<string, string>;
  limpiar: () => Promise<void>;
}

/**
 * Crea un sistema + dispositivo + sensores **propios de la prueba**, para que
 * ninguna suite dependa del estado dejado por otra (RP-03).
 */
export async function crearTenant(
  app: INestApplication,
  etiqueta: string,
  codigosSensor: string[] = ['TEMP-01', 'PH-01'],
): Promise<Tenant> {
  const prisma = prismaDe(app);
  const sufijo = `${etiqueta}-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;

  const sistema = await prisma.sistema.create({
    data: { codigo: `SIS-${sufijo}`.slice(0, 30), nombre: `Sistema ${sufijo}` },
  });
  const apiKey = generarApiKey();
  const dispositivo = await prisma.dispositivo.create({
    data: {
      sistemaId: sistema.id,
      codigo: `DEV-${sufijo}`.slice(0, 40),
      modelo: 'ESP32-S3',
      firmware: '1.4.2',
      intervaloReporteSeg: 300,
      apiKeyHash: hashDeClave(apiKey),
      apiKeyUltimos4: apiKey.slice(-4),
    },
  });

  const sensorIds: Record<string, string> = {};
  for (const codigo of codigosSensor) {
    const tipoCodigo = codigo.startsWith('TEMP') ? 'TEMPERATURA' : codigo.startsWith('PH') ? 'PH' : 'HUMEDAD';
    const tipo = await prisma.tipoVariable.findUniqueOrThrow({ where: { codigo: tipoCodigo } });
    const rangoMin = tipoCodigo === 'TEMPERATURA' ? 10 : tipoCodigo === 'PH' ? 5.5 : 30;
    const rangoMax = tipoCodigo === 'TEMPERATURA' ? 35 : tipoCodigo === 'PH' ? 7.5 : 90;
    const sensor = await prisma.sensor.create({
      data: {
        dispositivoId: dispositivo.id,
        tipoVariableId: tipo.id,
        codigo,
        nombre: `${codigo} de prueba`,
        unidad: tipo.unidadDefecto,
        rangoMin,
        rangoMax,
      },
    });
    sensorIds[codigo] = sensor.id;
  }

  return {
    sufijo,
    sistemaId: sistema.id,
    dispositivoId: dispositivo.id,
    apiKey,
    deviceHeaders: { 'X-Device-Key': apiKey, 'X-Device-Code': dispositivo.codigo },
    sensorIds,
    limpiar: async () => {
      await prisma.alerta.deleteMany({ where: { sistemaId: sistema.id } });
      await prisma.medicionIdempotencia.deleteMany({ where: { dispositivoId: dispositivo.id } });
      await prisma.medicion.deleteMany({ where: { dispositivoId: dispositivo.id } });
      await prisma.estadoSensorActual.deleteMany({ where: { dispositivoId: dispositivo.id } });
      await prisma.reglaAlerta.deleteMany({ where: { sensor: { dispositivoId: dispositivo.id } } });
      await prisma.sensor.deleteMany({ where: { dispositivoId: dispositivo.id } });
      await prisma.dispositivo.delete({ where: { id: dispositivo.id } });
      await prisma.sistema.delete({ where: { id: sistema.id } });
    },
  };
}

/** Sello de tiempo ISO desplazado respecto de ahora (positivo = futuro). */
export const instante = (deltaSegundos = 0): string =>
  new Date(Date.now() + deltaSegundos * 1000).toISOString();
