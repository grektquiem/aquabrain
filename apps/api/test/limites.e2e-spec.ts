import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { crearApp, url } from './utils/app';

/**
 * TS-13/TH-02 · límite de tasa en el inicio de sesión.
 *
 * Además del bloqueo por intentos fallidos (que es la defensa principal contra
 * fuerza bruta sobre **una** cuenta), `/auth/login` tiene un límite estricto por
 * IP para frenar el *credential stuffing* repartido entre muchas cuentas.
 * Esta suite corre en su propio proceso para no compartir el contador con las
 * demás pruebas de autenticación.
 */
describe('Límite de tasa del inicio de sesión (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('TS-13: superar el límite de intentos de login responde 429', async () => {
    const credenciales = { email: 'nadie@aqua.cl', password: 'NoExiste2026!' };
    let ultimo = 0;
    let cuerpo: Record<string, unknown> = {};

    // El límite configurado para `/auth/login` es 30 por minuto y por IP.
    for (let i = 0; i < 32; i++) {
      const res = await request(app.getHttpServer()).post(url('/auth/login')).send(credenciales);
      ultimo = res.status;
      cuerpo = res.body as Record<string, unknown>;
      if (ultimo === 429) break;
    }

    expect(ultimo).toBe(429);
    expect(cuerpo.codigo).toBe('DEMASIADAS_SOLICITUDES');
  });
});
