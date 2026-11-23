import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { auth, crearApp, crearTenant, iniciarSesion, prismaDe, url } from './utils/app';

/**
 * Informe (`GET /reportes/resumen`).
 *
 * Regresión: las alertas creadas por el motor guardan `medicionId` (BigInt).
 * Si el resumen las devolvía completas, la serialización JSON fallaba con 500
 * y el dashboard mostraba «Error al generar el informe».
 */
describe('Reportes (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await crearApp();
    token = (await iniciarSesion(app, 'admin@aqua.cl', 'AquaPlants2026!')).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('el resumen responde 200 aunque haya alertas asociadas a una medición', async () => {
    const t = await crearTenant(app, 'rep', ['TEMP-01']);
    const prisma = prismaDe(app);
    try {
      const sensorId = t.sensorIds['TEMP-01'];
      const medicion = await prisma.medicion.create({
        data: { sensorId, dispositivoId: t.dispositivoId, valor: 40, unidad: 'C', timestamp: new Date() },
      });
      await prisma.alerta.create({
        data: {
          medicionId: medicion.id,
          sensorId,
          sistemaId: t.sistemaId,
          severidad: 'ALTA',
          mensaje: 'Temperatura alta (prueba de reporte)',
        },
      });

      const res = await request(app.getHttpServer()).get(url('/reportes/resumen')).set(auth(token)).expect(200);

      expect(typeof res.body.sistemas).toBe('number');
      expect(res.body.alertas.activas).toBeGreaterThanOrEqual(1);
      const alerta = res.body.ultimasAlertas.find(
        (a: { mensaje: string }) => a.mensaje === 'Temperatura alta (prueba de reporte)',
      );
      expect(alerta).toBeTruthy();
      expect(alerta.sensor.codigo).toBe('TEMP-01');
      expect(alerta).not.toHaveProperty('medicionId');
    } finally {
      await t.limpiar();
    }
  });
});
