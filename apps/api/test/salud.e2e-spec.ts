import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { crearApp, prismaDe } from './utils/app';

/**
 * Salud, endurecimiento HTTP y contrato OpenAPI.
 * Cubre TS-23 (cabeceras de seguridad y CORS) y TS-42 (documento OpenAPI).
 */
describe('Salud y contrato de la API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200 y confirma la base de datos', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.estado).toBe('ok');
    expect(res.body.baseDatos).toBe('ok');
    expect(typeof res.body.uptimeSeg).toBe('number');
    expect(typeof res.body.latenciaMs).toBe('number');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  // TS-23 · cabeceras de seguridad
  it('TS-23: helmet emite las cabeceras de endurecimiento', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('TS-23: la API no expone el servidor ni la versión', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(JSON.stringify(res.headers)).not.toMatch(/express/i);
  });

  // TS-23 · CORS: solo el origen del dashboard
  it('TS-23: un origen autorizado recibe la cabecera CORS', async () => {
    const res = await request(app.getHttpServer())
      .options('/api/v1/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('TS-23: un origen ajeno no recibe la cabecera CORS', async () => {
    const res = await request(app.getHttpServer())
      .options('/api/v1/auth/login')
      .set('Origin', 'https://sitio-malicioso.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  // TS-42 · contrato OpenAPI
  it('TS-42: el documento OpenAPI describe los módulos principales', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    // Swagger documenta las rutas ya montadas bajo el prefijo global.
    const rutas = Object.keys(res.body.paths);
    expect(rutas.length).toBeGreaterThanOrEqual(30);
    for (const esperada of [
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/mediciones',
      '/api/v1/mediciones/bulk',
      '/api/v1/mediciones/serie',
      '/api/v1/mediciones/exportar.csv',
      '/api/v1/alertas',
      '/api/v1/reglas',
      '/api/v1/dispositivos',
      '/api/v1/dashboard/estado',
      '/api/v1/auditoria',
    ]) {
      expect(rutas).toContain(esperada);
    }
    expect(res.body.components.securitySchemes).toBeDefined();
    expect(res.body.info.title).toContain('AquaBrain');
  });

  it('la base de datos responde a una consulta trivial', async () => {
    const filas = await prismaDe(app).$queryRaw<Array<{ n: bigint }>>`SELECT 1::bigint AS n`;
    expect(Number(filas[0].n)).toBe(1);
  });
});
