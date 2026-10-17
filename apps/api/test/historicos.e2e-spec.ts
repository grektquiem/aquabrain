import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { auth, crearApp, crearTenant, instante, prismaDe, url } from './utils/app';

/**
 * Históricos: agregación horaria, exportación CSV y comparación multi-sistema.
 * Cubre TS-28, TS-38 y TS-39.
 */
describe('Históricos y exportación (e2e)', () => {
  let app: INestApplication;
  const prisma = () => prismaDe(app);
  let token: string;

  beforeAll(async () => {
    app = await crearApp();
    const r = await request(app.getHttpServer())
      .post(url('/auth/login'))
      .send({ email: 'admin@aqua.cl', password: 'AquaPlants2026!' })
      .expect(200);
    token = r.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const rango = (desdeMs: number, hastaMs: number) => {
    const q = (ms: number) => encodeURIComponent(new Date(ms).toISOString());
    return `desde=${q(desdeMs)}&hasta=${encodeURIComponent(new Date(hastaMs).toISOString())}`;
  };

  // ── TS-38 · agregación horaria y exportación CSV ─────────────────────────

  it('TS-38: la serie agrega por hora con promedio, mínimo, máximo y muestras', async () => {
    const t = await crearTenant(app, 'ts38', ['TEMP-01']);
    try {
      const sensorId = t.sensorIds['TEMP-01'];
      // Tres lecturas dentro de la misma hora en curso y una en la hora previa.
      const ahora = Date.now();
      const inicio = new Date(ahora).setMinutes(0, 0, 0);
      const valores = [
        { t: new Date(inicio + 60_000), v: 20 },
        { t: new Date(inicio + 120_000), v: 30 },
        { t: new Date(inicio + 180_000), v: 25 },
        { t: new Date(inicio - 30 * 60_000), v: 10 },
      ];
      for (const { t: instanteFila, v } of valores) {
        await prisma().medicion.create({
          data: { sensorId, dispositivoId: t.dispositivoId, valor: v, unidad: 'C', timestamp: instanteFila },
        });
      }

      const desde = new Date(inicio - 2 * 60 * 60_000).toISOString();
      const hasta = new Date(ahora + 60_000).toISOString();
      const res = await request(app.getHttpServer())
        .get(url(`/mediciones/serie?sensores=${sensorId}&${rango(Date.parse(desde), Date.parse(hasta))}&bucket=1h`))
        .set(auth(token))
        .expect(200);

      expect(res.body.bucket).toBe('1h');
      expect(res.body.series).toHaveLength(1);
      const puntos = res.body.series[0].puntos;
      expect(puntos.length).toBeGreaterThanOrEqual(2);
      const agregado = puntos.find((p: { muestras: number }) => p.muestras === 3);
      expect(agregado).toBeTruthy();
      expect(agregado.promedio).toBeCloseTo(25, 5);
      expect(agregado.minimo).toBeCloseTo(20, 5);
      expect(agregado.maximo).toBeCloseTo(30, 5);
      expect(new Date(agregado.t).getMinutes()).toBe(0);
    } finally {
      await t.limpiar();
    }
  });

  it('TS-38: la exportación CSV entrega los datos filtrados con cabecera', async () => {
    const t = await crearTenant(app, 'ts38csv', ['TEMP-01']);
    try {
      const sensorId = t.sensorIds['TEMP-01'];
      await prisma().medicion.create({
        data: {
          sensorId,
          dispositivoId: t.dispositivoId,
          valor: 21.5,
          unidad: 'C',
          timestamp: new Date(Date.now() - 3600_000),
          origen: 'OFFLINE',
        },
      });

      const desde = new Date(Date.now() - 6 * 3600_000).toISOString();
      const hasta = new Date(Date.now() + 60_000).toISOString();
      const res = await request(app.getHttpServer())
        .get(url(`/mediciones/exportar.csv?sensores=${sensorId}&${rango(Date.parse(desde), Date.parse(hasta))}`))
        .set(auth(token))
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/mediciones\.csv/);
      // BOM UTF-8 para que Excel respete los acentos.
      expect(res.text.startsWith('\uFEFF')).toBe(true);
      const lineas = res.text.replace(/^\uFEFF/, '').split('\r\n').filter(Boolean);
      expect(lineas[0]).toBe('sensor;timestamp;valor;unidad;origen;calidad');
      expect(lineas).toHaveLength(2);
      expect(lineas[1]).toContain('TEMP-01;');
      expect(lineas[1]).toContain('21.5');
      expect(lineas[1]).toContain('OFFLINE');
    } finally {
      await t.limpiar();
    }
  });

  it('TS-38: un rango superior a 90 días se rechaza con 422', async () => {
    const t = await crearTenant(app, 'ts38rango', ['TEMP-01']);
    try {
      const res = await request(app.getHttpServer())
        .get(url(`/mediciones/serie?sensores=${t.sensorIds['TEMP-01']}&${rango(Date.parse('2026-01-01T00:00:00Z'), Date.parse('2026-06-01T00:00:00Z'))}&bucket=1d`))
        .set(auth(token))
        .expect(422);
      expect(res.body.mensaje).toMatch(/90 d/);

      await request(app.getHttpServer())
        .get(url(`/mediciones/exportar.csv?sensores=${t.sensorIds['TEMP-01']}&${rango(Date.parse('2026-01-01T00:00:00Z'), Date.parse('2026-06-01T00:00:00Z'))}`))
        .set(auth(token))
        .expect(422);
    } finally {
      await t.limpiar();
    }
  });

  it('TS-38: un rango invertido se rechaza con 400', async () => {
    const t = await crearTenant(app, 'ts38inv', ['TEMP-01']);
    try {
      await request(app.getHttpServer())
        .get(url(`/mediciones/serie?sensores=${t.sensorIds['TEMP-01']}&${rango(Date.parse('2026-05-01T00:00:00Z'), Date.parse('2026-04-01T00:00:00Z'))}`))
        .set(auth(token))
        .expect(400);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-39 · comparación multi-sistema ────────────────────────────────────

  it('TS-39: dos sistemas con la misma variable devuelven series comparables', async () => {
    const a = await crearTenant(app, 'ts39a', ['TEMP-01']);
    const b = await crearTenant(app, 'ts39b', ['TEMP-01']);
    try {
      const base = Date.now() - 3 * 3600_000;
      await prisma().medicion.create({
        data: { sensorId: a.sensorIds['TEMP-01'], dispositivoId: a.dispositivoId, valor: 22, unidad: 'C', timestamp: new Date(base) },
      });
      await prisma().medicion.create({
        data: { sensorId: b.sensorIds['TEMP-01'], dispositivoId: b.dispositivoId, valor: 28, unidad: 'C', timestamp: new Date(base) },
      });

      const desde = new Date(base - 3600_000).toISOString();
      const hasta = new Date(base + 3600_000).toISOString();
      const res = await request(app.getHttpServer())
        .get(url(`/mediciones/serie?sensores=${a.sensorIds['TEMP-01']},${b.sensorIds['TEMP-01']}&${rango(Date.parse(desde), Date.parse(hasta))}`))
        .set(auth(token))
        .expect(200);

      expect(res.body.series).toHaveLength(2);
      const codigos = res.body.series.map((s: { sensor: { codigo: string } }) => s.sensor.codigo);
      expect(codigos).toEqual(['TEMP-01', 'TEMP-01']);
      const promedios = res.body.series.map((s: { puntos: Array<{ promedio: number }> }) => s.puntos[0].promedio).sort((x: number, y: number) => x - y);
      expect(promedios).toEqual([22, 28]);
      // Cada serie declara su sensor y su unidad para la leyenda del gráfico.
      for (const s of res.body.series) {
        expect(s.sensor.id).toBeTruthy();
        expect(s.sensor.unidad).toBeTruthy();
      }
    } finally {
      await a.limpiar();
      await b.limpiar();
    }
  });

  // ── TS-28 · rotación de la API key ───────────────────────────────────────

  it('TS-28: al rotar la clave, la anterior deja de funcionar de inmediato', async () => {
    const t = await crearTenant(app, 'ts28', ['TEMP-01']);
    try {
      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorCodigo: 'TEMP-01', valor: 24, timestamp: instante() })
        .expect(201);

      const rotacion = await request(app.getHttpServer())
        .post(url(`/dispositivos/${t.dispositivoId}/rotar-clave`))
        .set(auth(token))
        .expect(201);
      const nueva: string = rotacion.body.apiKey;
      expect(nueva).toMatch(/^ak_live_/);
      expect(nueva).not.toBe(t.apiKey);
      expect(rotacion.body.apiKeyHash).toBeUndefined();

      // La clave vieja ya no sirve…
      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorCodigo: 'TEMP-01', valor: 25, timestamp: instante() })
        .expect(401);

      // …y la nueva sí.
      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set({ 'X-Device-Key': nueva, 'X-Device-Code': t.deviceHeaders['X-Device-Code'] })
        .send({ sensorCodigo: 'TEMP-01', valor: 26, timestamp: instante() })
        .expect(201);
    } finally {
      await t.limpiar();
    }
  });
});
