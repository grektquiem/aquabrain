import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { auth, crearApp, crearTenant, instante, prismaDe, url } from './utils/app';

/**
 * Ingesta de mediciones: validación temporal, idempotencia y sincronización
 * offline. Cubre TS-10, TS-11, TS-20, TS-22, TS-25, TS-30, TS-36 y TS-41.
 */
describe('Ingesta de mediciones (e2e)', () => {
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

  // ── TS-22 · códigos de respuesta ─────────────────────────────────────────

  it('TS-22: 201 en éxito, 400 en error de validación y 401 sin credencial', async () => {
    const t = await crearTenant(app, 'ts22');
    try {
      const ok = await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorCodigo: 'TEMP-01', valor: 24.5, timestamp: instante() })
        .expect(201);
      expect(ok.body.id).toBeTruthy();
      expect(ok.body.duplicada).toBe(false);

      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorCodigo: 'TEMP-01', valor: 'no-es-un-numero', timestamp: instante() })
        .expect(400);

      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .send({ sensorCodigo: 'TEMP-01', valor: 24.5, timestamp: instante() })
        .expect(401);

      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set({ 'X-Device-Key': 'ak_live_clave-invalida', 'X-Device-Code': t.deviceHeaders['X-Device-Code'] })
        .send({ sensorCodigo: 'TEMP-01', valor: 24.5, timestamp: instante() })
        .expect(401);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-10 · timestamp futuro ─────────────────────────────────────────────

  it('TS-10: un timestamp a más de 5 minutos en el futuro se rechaza y no se persiste', async () => {
    const t = await crearTenant(app, 'ts10');
    try {
      const antes = await prisma().medicion.count({ where: { dispositivoId: t.dispositivoId } });
      const res = await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorCodigo: 'TEMP-01', valor: 25, timestamp: instante(600) })
        .expect(400);
      expect(res.body.mensaje).toMatch(/futuro/i);
      expect(await prisma().medicion.count({ where: { dispositivoId: t.dispositivoId } })).toBe(antes);

      // Un desfase pequeño (dentro de la tolerancia) sí se acepta.
      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorCodigo: 'TEMP-01', valor: 24.9, timestamp: instante(60) })
        .expect(201);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-11 · timestamp pasado (offline) ───────────────────────────────────

  it('TS-11: una medición con timestamp pasado se acepta con su hora de origen y origen OFFLINE', async () => {
    const t = await crearTenant(app, 'ts11');
    try {
      const haceDosHoras = instante(-7200);
      const res = await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorCodigo: 'TEMP-01', valor: 23.1, timestamp: haceDosHoras, idExterno: `off-${t.sufijo}` })
        .expect(201);

      const fila = await prisma().medicion.findFirstOrThrow({ where: { id: BigInt(res.body.id) } });
      expect(fila.timestamp.toISOString()).toBe(new Date(haceDosHoras).toISOString());
      expect(fila.origen).toBe('OFFLINE');
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-41 · sincronización offline (lote con horas originales) ────────────

  it('TS-41: el lote offline conserva el timestamp de origen y marca OFFLINE', async () => {
    const t = await crearTenant(app, 'ts41', ['TEMP-01']);
    try {
      const base = Date.now() - 6 * 60 * 60 * 1000; // 6 horas atrás
      const items = Array.from({ length: 12 }, (_, i) => ({
        sensorCodigo: 'TEMP-01',
        valor: 20 + i * 0.5,
        timestamp: new Date(base + i * 60_000).toISOString(),
        idExterno: `off-${i}`,
      }));

      const res = await request(app.getHttpServer())
        .post(url('/mediciones/bulk'))
        .set(t.deviceHeaders)
        .send({ items })
        .expect(207);

      expect(res.body.aceptadas).toBe(12);
      expect(res.body.rechazadas).toBe(0);

      const filas = await prisma().medicion.findMany({
        where: { sensorId: t.sensorIds['TEMP-01'] },
        orderBy: { timestamp: 'asc' },
      });
      expect(filas).toHaveLength(12);
      expect(filas.every((f) => f.origen === 'OFFLINE')).toBe(true);
      expect(filas[0].timestamp.getTime()).toBe(base);
      // El instante de origen se conserva, no se sustituye por el de recepción.
      expect(filas[0].timestamp.getTime()).toBeLessThan(Date.now() - 60 * 60 * 1000);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-36 · lote de 500 con 10 duplicados ────────────────────────────────

  it('TS-36: un lote de 500 con 10 duplicados responde 207 con 490/10/0', async () => {
    const t = await crearTenant(app, 'ts36', ['TEMP-01']);
    try {
      const base = Date.now() - 60 * 60 * 1000;
      const previos = Array.from({ length: 10 }, (_, i) => ({
        sensorCodigo: 'TEMP-01',
        valor: 24,
        timestamp: new Date(base + i * 1000).toISOString(),
        idExterno: `dup-${i}`,
      }));
      await request(app.getHttpServer())
        .post(url('/mediciones/bulk'))
        .set(t.deviceHeaders)
        .send({ items: previos })
        .expect(207);

      const nuevos = Array.from({ length: 490 }, (_, i) => ({
        sensorCodigo: 'TEMP-01',
        valor: 22 + (i % 5),
        timestamp: new Date(base + 60_000 + i * 1000).toISOString(),
        idExterno: `nuevo-${i}`,
      }));
      const lote = [...previos, ...nuevos];
      expect(lote).toHaveLength(500);

      const res = await request(app.getHttpServer())
        .post(url('/mediciones/bulk'))
        .set(t.deviceHeaders)
        .send({ items: lote })
        .expect(207);

      expect(res.body).toMatchObject({ recibidas: 500, aceptadas: 490, duplicadas: 10, rechazadas: 0 });
      expect(await prisma().medicion.count({ where: { sensorId: t.sensorIds['TEMP-01'] } })).toBe(500);
    } finally {
      await t.limpiar();
    }
  });

  // ── R-01 · idempotencia dentro del mismo lote ────────────────────────────

  it('un idExterno repetido dentro del mismo lote cuenta una sola vez', async () => {
    const t = await crearTenant(app, 'loteidem', ['TEMP-01']);
    try {
      const base = Date.now() - 60_000;
      const items = [
        { sensorCodigo: 'TEMP-01', valor: 24, timestamp: new Date(base).toISOString(), idExterno: 'repetido' },
        { sensorCodigo: 'TEMP-01', valor: 25, timestamp: new Date(base + 1_000).toISOString(), idExterno: 'repetido' },
        { sensorCodigo: 'TEMP-01', valor: 26, timestamp: new Date(base + 2_000).toISOString(), idExterno: 'unico' },
      ];

      const res = await request(app.getHttpServer())
        .post(url('/mediciones/bulk'))
        .set(t.deviceHeaders)
        .send({ items })
        .expect(207);

      expect(res.body).toMatchObject({ recibidas: 3, aceptadas: 2, duplicadas: 1, rechazadas: 0 });
      expect(await prisma().medicion.count({ where: { sensorId: t.sensorIds['TEMP-01'] } })).toBe(2);
      // El marcador de idempotencia se registra una sola vez por idExterno.
      expect(await prisma().medicionIdempotencia.count({ where: { dispositivoId: t.dispositivoId } })).toBe(2);
    } finally {
      await t.limpiar();
    }
  });

  // ── R-01 · alertas del lote apuntan a la medición que las disparó ────────

  it('el lote genera la alerta y la asocia a la medición que la disparó', async () => {
    const t = await crearTenant(app, 'lotealerta', ['TEMP-01']);
    try {
      await request(app.getHttpServer())
        .post(url('/reglas'))
        .set(auth(token))
        .send({
          nombre: 'Temperatura alta (lote)',
          operador: 'MAYOR_QUE',
          umbralMax: 30,
          severidad: 'ALTA',
          sensorId: t.sensorIds['TEMP-01'],
        })
        .expect(201);

      const base = Date.now() - 60_000;
      const items = [
        { sensorCodigo: 'TEMP-01', valor: 24, timestamp: new Date(base).toISOString() },
        { sensorCodigo: 'TEMP-01', valor: 31.5, timestamp: new Date(base + 1_000).toISOString() },
        { sensorCodigo: 'TEMP-01', valor: 22, timestamp: new Date(base + 2_000).toISOString() },
      ];

      const res = await request(app.getHttpServer())
        .post(url('/mediciones/bulk'))
        .set(t.deviceHeaders)
        .send({ items })
        .expect(207);

      expect(res.body).toMatchObject({ aceptadas: 3, rechazadas: 0, alertasGeneradas: 1 });

      const alerta = await prisma().alerta.findFirstOrThrow({ where: { sensorId: t.sensorIds['TEMP-01'] } });
      const disparadora = await prisma().medicion.findFirstOrThrow({
        where: { sensorId: t.sensorIds['TEMP-01'], valor: 31.5 },
      });
      // La correlación de `createManyAndReturn` asocia la alerta a la lectura correcta.
      expect(alerta.medicionId?.toString()).toBe(disparadora.id.toString());
      expect(Number(alerta.valorDetectado)).toBe(31.5);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-30 · lote sobredimensionado ───────────────────────────────────────
  it('TS-30: un lote de 501 mediciones se rechaza con 400 y nada se persiste', async () => {
    const t = await crearTenant(app, 'ts30', ['TEMP-01']);
    try {
      const items = Array.from({ length: 501 }, (_, i) => ({
        sensorCodigo: 'TEMP-01',
        valor: 24,
        timestamp: instante(),
        idExterno: `x-${i}`,
      }));
      const res = await request(app.getHttpServer())
        .post(url('/mediciones/bulk'))
        .set(t.deviceHeaders)
        .send({ items })
        .expect(400);
      expect(res.body.codigo).toBe('SOLICITUD_INVALIDA');
      expect(await prisma().medicion.count({ where: { sensorId: t.sensorIds['TEMP-01'] } })).toBe(0);
    } finally {
      await t.limpiar();
    }
  });

  it('TS-30: un cuerpo sobredimensionado se rechaza con 413', async () => {
    const t = await crearTenant(app, 'ts30b', ['TEMP-01']);
    try {
      const enorme = `{"items":[{"sensorCodigo":"TEMP-01","valor":1,"timestamp":"${instante()}","valorTexto":"${'A'.repeat(1_400_000)}"}]}`;
      const res = await request(app.getHttpServer())
        .post(url('/mediciones/bulk'))
        .set(t.deviceHeaders)
        .set('Content-Type', 'application/json')
        .send(enorme);
      expect([413, 400]).toContain(res.status);
      expect(await prisma().medicion.count({ where: { sensorId: t.sensorIds['TEMP-01'] } })).toBe(0);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-11 (idempotencia) · reenvío del mismo idExterno ───────────────────

  it('reenviar el mismo idExterno no duplica la medición', async () => {
    const t = await crearTenant(app, 'idem', ['TEMP-01']);
    try {
      const cuerpo = { sensorCodigo: 'TEMP-01', valor: 25.1, timestamp: instante(-1000), idExterno: 'unico-1' };
      const primera = await request(app.getHttpServer()).post(url('/mediciones')).set(t.deviceHeaders).send(cuerpo).expect(201);
      expect(primera.body.duplicada).toBe(false);

      const segunda = await request(app.getHttpServer()).post(url('/mediciones')).set(t.deviceHeaders).send(cuerpo).expect(201);
      expect(segunda.body.duplicada).toBe(true);

      expect(await prisma().medicion.count({ where: { sensorId: t.sensorIds['TEMP-01'] } })).toBe(1);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-20 · inyección en filtros ─────────────────────────────────────────

  it('TS-20: una inyección en un filtro no ejecuta SQL ni altera la respuesta', async () => {
    const inyeccion = "' OR 1=1--";

    const serie = await request(app.getHttpServer())
      .get(url(`/mediciones/serie?sensores=${encodeURIComponent(inyeccion)}&desde=2026-01-01T00:00:00.000Z&hasta=2026-01-02T00:00:00.000Z`))
      .set(auth(token));
    expect(serie.status).toBe(400);

    const alertas = await request(app.getHttpServer())
      .get(url(`/alertas?estado=${encodeURIComponent(inyeccion)}`))
      .set(auth(token));
    expect(alertas.status).toBe(400);

    const sensores = await request(app.getHttpServer())
      .get(url(`/sensores?sistemaId=${encodeURIComponent(inyeccion)}`))
      .set(auth(token))
      .expect(400);
    expect(sensores.body.codigo).toBe('SOLICITUD_INVALIDA');

    const dispositivos = await request(app.getHttpServer())
      .get(url(`/dispositivos?sistemaId=${encodeURIComponent('1 OR 1=1')}`))
      .set(auth(token))
      .expect(400);
    expect(dispositivos.body.codigo).toBe('SOLICITUD_INVALIDA');
  });

  // ── TS-25 · no existe endpoint para modificar mediciones ─────────────────

  it('TS-25: la API no expone modificación ni borrado de mediciones', async () => {
    const id = (await prisma().medicion.findFirstOrThrow()).id.toString();
    for (const metodo of ['patch', 'put', 'delete'] as const) {
      const res = await request(app.getHttpServer())
        [metodo](url(`/mediciones/${id}`))
        .set(auth(token))
        .send({ valor: 0 });
      expect([404, 405]).toContain(res.status);
    }
    const documento = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const rutas = Object.keys(documento.body.paths).filter((p) => p.startsWith('/mediciones'));
    for (const ruta of rutas) {
      const metodos = Object.keys(documento.body.paths[ruta]);
      expect(metodos).not.toContain('patch');
      expect(metodos).not.toContain('put');
      expect(metodos).not.toContain('delete');
    }
  });
});
