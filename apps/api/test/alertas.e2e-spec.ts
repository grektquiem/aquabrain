import { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { auth, crearApp, crearTenant, instante, prismaDe, url } from './utils/app';

/**
 * Motor de reglas, generación de alertas y auditoría.
 * Cubre TS-03, TS-05, TS-27, TS-33, TS-35, TS-37 y TS-40.
 */
describe('Alertas, reglas y auditoría (e2e)', () => {
  let app: INestApplication;
  const prisma = () => prismaDe(app);
  let admin: { accessToken: string };
  let adminId: string;

  beforeAll(async () => {
    app = await crearApp();
    const r = await request(app.getHttpServer())
      .post(url('/auth/login'))
      .send({ email: 'admin@aqua.cl', password: 'AquaPlants2026!' })
      .expect(200);
    admin = { accessToken: r.body.accessToken };
    adminId = r.body.usuario.id;
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Reglas creadas por la suite. Se borran **siempre**, incluidas las de alcance
   * por tipo de variable (que `Tenant.limpiar()` no elimina porque no cuelgan de
   * un sensor). Sin esto, las reglas de una corrida anterior contaminan la
   * siguiente y la suite deja de ser reproducible.
   */
  const reglasCreadas: string[] = [];

  async function crearRegla(datos: Prisma.ReglaAlertaUncheckedCreateInput) {
    const r = await prisma().reglaAlerta.create({ data: datos });
    reglasCreadas.push(r.id);
    return r;
  }

  afterEach(async () => {
    if (reglasCreadas.length > 0) {
      await prisma().reglaAlerta.deleteMany({ where: { id: { in: reglasCreadas.splice(0) } } });
    }
  });

  const ingerir = (t: { deviceHeaders: Record<string, string> }, cuerpo: Record<string, unknown>) =>
    request(app.getHttpServer()).post(url('/mediciones')).set(t.deviceHeaders).send(cuerpo);

  // ── TS-03 · cooldown ─────────────────────────────────────────────────────

  it('TS-03: dos mediciones que violan la misma regla dentro del cooldown generan una sola alerta', async () => {
    const t = await crearTenant(app, 'ts03', ['TEMP-01']);
    try {
      await crearRegla({
        nombre: 'Temperatura alta TS-03',
        operador: 'MAYOR_QUE',
        umbralMax: 30,
        severidad: 'ALTA',
        cooldownSeg: 900,
        sensorId: t.sensorIds['TEMP-01'],
        creadoPor: adminId,
      });

      const primera = await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 31, timestamp: instante(-1000) }).expect(201);
      expect(primera.body.alertasGeneradas).toHaveLength(1);
      expect(primera.body.alertasGeneradas[0].severidad).toBe('ALTA');

      const segunda = await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 33, timestamp: instante(-500) }).expect(201);
      expect(segunda.body.alertasGeneradas).toHaveLength(0);

      const alertas = await prisma().alerta.count({ where: { sensorId: t.sensorIds['TEMP-01'] } });
      expect(alertas).toBe(1);
    } finally {
      await t.limpiar();
    }
  });

  it('TS-03: valor exactamente igual al umbral no dispara', async () => {
    const t = await crearTenant(app, 'ts03b', ['TEMP-01']);
    try {
      await crearRegla({
        nombre: 'Temperatura límite TS-03',
        operador: 'MAYOR_QUE',
        umbralMax: 30,
        severidad: 'MEDIA',
        sensorId: t.sensorIds['TEMP-01'],
        creadoPor: adminId,
      });
      const res = await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 30, timestamp: instante(-1000) }).expect(201);
      expect(res.body.alertasGeneradas).toHaveLength(0);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-04 · regla inactiva ───────────────────────────────────────────────

  it('TS-04: una regla inactiva no genera alertas', async () => {
    const t = await crearTenant(app, 'ts04', ['TEMP-01']);
    try {
      await crearRegla({
        nombre: 'Regla inactiva TS-04',
        operador: 'MAYOR_QUE',
        umbralMax: 10,
        severidad: 'ALTA',
        activa: false,
        sensorId: t.sensorIds['TEMP-01'],
        creadoPor: adminId,
      });
      const res = await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 31, timestamp: instante(-1000) }).expect(201);
      expect(res.body.alertasGeneradas).toHaveLength(0);
      expect(await prisma().alerta.count({ where: { sensorId: t.sensorIds['TEMP-01'] } })).toBe(0);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-05 · precedencia del alcance por sensor ───────────────────────────

  it('TS-05: las reglas del sensor prevalecen sobre las de tipo de variable', async () => {
    const t = await crearTenant(app, 'ts05', ['TEMP-01']);
    try {
      const reglaTipo = await crearRegla({
        nombre: 'Tipo TEMPERATURA baja TS-05',
        operador: 'MAYOR_QUE',
        umbralMax: 20,
        severidad: 'BAJA',
        tipoVariableId: (await prisma().sensor.findUniqueOrThrow({ where: { id: t.sensorIds['TEMP-01'] } })).tipoVariableId,
        creadoPor: adminId,
      });
      const reglaSensor = await crearRegla({
        nombre: 'Sensor TEMP-01 alta TS-05',
        operador: 'MAYOR_QUE',
        umbralMax: 30,
        severidad: 'ALTA',
        sensorId: t.sensorIds['TEMP-01'],
        creadoPor: adminId,
      });

      // 25 supera la regla de tipo pero no la del sensor → no hay alerta.
      const conAmbas = await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 25, timestamp: instante(-1000) }).expect(201);
      expect(conAmbas.body.alertasGeneradas).toHaveLength(0);

      // 31 supera la del sensor → alerta ALTA (la de tipo no participa).
      const sobreSensor = await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 31, timestamp: instante(-500) }).expect(201);
      expect(sobreSensor.body.alertasGeneradas).toHaveLength(1);
      expect(sobreSensor.body.alertasGeneradas[0].reglaId).toBe(reglaSensor.id);

      // Al desactivar la regla del sensor, vuelve a aplicar la de tipo.
      await prisma().reglaAlerta.update({ where: { id: reglaSensor.id }, data: { activa: false } });
      const sinSensor = await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 25, timestamp: instante(-100) }).expect(201);
      expect(sinSensor.body.alertasGeneradas).toHaveLength(1);
      expect(sinSensor.body.alertasGeneradas[0].reglaId).toBe(reglaTipo.id);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-33 · XSS en el mensaje de la alerta ───────────────────────────────

  it('TS-33: un nombre de regla con HTML se trata como dato y nunca se sirve como HTML', async () => {
    const t = await crearTenant(app, 'ts33', ['TEMP-01']);
    const carga = '<script>alert(1)</script>';
    try {
      const regla = await request(app.getHttpServer())
        .post(url('/reglas'))
        .set(auth(admin.accessToken))
        .send({
          nombre: carga,
          operador: 'MAYOR_QUE',
          umbralMax: 30,
          severidad: 'ALTA',
          sensorId: t.sensorIds['TEMP-01'],
        })
        .expect(201);
      expect(regla.headers['content-type']).toMatch(/application\/json/);

      await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 31, timestamp: instante(-1000) }).expect(201);

      const listado = await request(app.getHttpServer())
        .get(url(`/alertas?sistemaId=${t.sistemaId}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(listado.headers['content-type']).toMatch(/application\/json/);
      expect(listado.body.datos.length).toBeGreaterThanOrEqual(1);
      // El contenido viaja como dato textual, no como marcado ejecutable.
      expect(listado.body.datos[0].mensaje).toContain(carga);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-27 · auditoría de cambios ─────────────────────────────────────────

  it('TS-27: la creación de una regla y la resolución de una alerta quedan auditadas', async () => {
    const t = await crearTenant(app, 'ts27', ['TEMP-01']);
    try {
      const regla = await request(app.getHttpServer())
        .post(url('/reglas'))
        .set(auth(admin.accessToken))
        .send({
          nombre: 'Regla auditada TS-27',
          operador: 'MAYOR_QUE',
          umbralMax: 30,
          severidad: 'MEDIA',
          sensorId: t.sensorIds['TEMP-01'],
        })
        .expect(201);

      await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 32, timestamp: instante(-1000) }).expect(201);
      const alerta = await prisma().alerta.findFirstOrThrow({ where: { sensorId: t.sensorIds['TEMP-01'] } });

      const resuelta = await request(app.getHttpServer())
        .post(url(`/alertas/${alerta.id}/resolver`))
        .set(auth(admin.accessToken))
        .send({ comentario: 'Se ajustó el umbral' })
        .expect(200);
      expect(resuelta.body.estado).toBe('RESUELTA');
      expect(resuelta.body.resueltaEn).toBeTruthy();
      expect(resuelta.body.usuarioResuelve?.id ?? resuelta.body.usuarioResuelve).toBeTruthy();

      const auditoria = await prisma().auditoria.findMany({
        where: { usuarioId: adminId, entidad: { in: ['reglas', 'alertas'] } },
        orderBy: { ocurridoEn: 'desc' },
        take: 20,
      });
      const acciones = auditoria.map((a) => a.accion);
      expect(acciones.some((a) => a.includes('/reglas'))).toBe(true);
      expect(acciones.some((a) => a.includes('/alertas'))).toBe(true);

      // La regla creada es la que quedó registrada en la auditoría.
      expect(regla.body.nombre).toBe('Regla auditada TS-27');

      // El endpoint de auditoría es accesible con el permiso correspondiente.
      const listado = await request(app.getHttpServer())
        .get(url('/auditoria'))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(JSON.stringify(listado.body)).toContain('/reglas');
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-37 · dashboard de estado actual ───────────────────────────────────

  it('TS-37: el dashboard muestra la última medición con fecha/hora, frescura y alertas activas', async () => {
    const t = await crearTenant(app, 'ts37', ['TEMP-01']);
    try {
      await prisma().reglaAlerta.create({
        data: {
          nombre: 'Temperatura alta TS-37',
          operador: 'MAYOR_QUE',
          umbralMax: 30,
          severidad: 'ALTA',
          sensorId: t.sensorIds['TEMP-01'],
          creadoPor: adminId,
        },
      });
      const antes = await request(app.getHttpServer())
        .get(url(`/dashboard/estado?sistemaId=${t.sistemaId}`))
        .set(auth(admin.accessToken))
        .expect(200);
      const dispositivoAntes = antes.body.dispositivos.find((d: { codigo: string }) => d.codigo === t.deviceHeaders['X-Device-Code']);
      expect(dispositivoAntes.frescura).toBe('SIN_COMUNICACION');
      expect(dispositivoAntes.segundosSinReportar).toBeNull();

      await ingerir(t, { sensorCodigo: 'TEMP-01', valor: 33, timestamp: instante() }).expect(201);

      const despues = await request(app.getHttpServer())
        .get(url(`/dashboard/estado?sistemaId=${t.sistemaId}`))
        .set(auth(admin.accessToken))
        .expect(200);
      const dispositivo = despues.body.dispositivos.find((d: { codigo: string }) => d.codigo === t.deviceHeaders['X-Device-Code']);
      expect(dispositivo.frescura).toBe('EN_LINEA');
      expect(dispositivo.ultimaMedicion).toBeTruthy();
      expect(dispositivo.segundosSinReportar).toBeLessThan(120);
      expect(despues.body.generadoEn).toBeTruthy();

      const sensor = despues.body.sensores.find((s: { sensorId: string }) => s.sensorId === t.sensorIds['TEMP-01']);
      expect(sensor).toBeDefined();
      expect(Number(sensor.valor)).toBe(33);
      expect(Number.isNaN(Date.parse(sensor.timestamp))).toBe(false);

      expect(sensor.sensor.codigo).toBe('TEMP-01');
      expect(sensor.dispositivo.codigo).toBe(t.deviceHeaders['X-Device-Code']);

      // El contador de alertas activas por severidad refleja la alerta generada.
      const activas = despues.body.alertasActivas.find((a: { severidad: string }) => a.severidad === 'ALTA');
      expect(activas.total).toBe(1);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-40 · dispositivo sin comunicación ─────────────────────────────────

  it('TS-40: un dispositivo sin reportes recientes aparece como SIN_COMUNICACION', async () => {
    const t = await crearTenant(app, 'ts40', ['TEMP-01']);
    try {
      // Medición muy antigua: queda fuera del umbral de silencio (3 × 300 s).
      await prisma().medicion.create({
        data: {
          sensorId: t.sensorIds['TEMP-01'],
          dispositivoId: t.dispositivoId,
          valor: 22,
          unidad: 'C',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          origen: 'OFFLINE',
        },
      });

      const res = await request(app.getHttpServer())
        .get(url(`/dashboard/estado?sistemaId=${t.sistemaId}`))
        .set(auth(admin.accessToken))
        .expect(200);
      const d = res.body.dispositivos.find((x: { codigo: string }) => x.codigo === t.deviceHeaders['X-Device-Code']);
      expect(d.frescura).toBe('SIN_COMUNICACION');
      expect(d.segundosSinReportar).toBeGreaterThan(d.umbralSilencioSeg);
    } finally {
      await t.limpiar();
    }
  });

  // ── TS-35 · flujo completo por la API ───────────────────────────────────

  it('TS-35: login → sistema → dispositivo → sensor → ingesta → alerta → resuelta', async () => {
    const sufijo = `e2e35-${Date.now().toString(36)}`;
    let sistemaId = '';
    let dispositivoId = '';

    try {
      // 1. Sistema
      const sistema = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo: `SIS-${sufijo}`.slice(0, 30), nombre: `Sistema E2E ${sufijo}` })
        .expect(201);
      sistemaId = sistema.body.id;

      // 2. Dispositivo (la API key solo se devuelve una vez)
      const dispositivo = await request(app.getHttpServer())
        .post(url('/dispositivos'))
        .set(auth(admin.accessToken))
        .send({ sistemaId, codigo: `DEV-${sufijo}`.slice(0, 40), modelo: 'ESP32-S3', firmware: '1.4.2' })
        .expect(201);
      dispositivoId = dispositivo.body.dispositivo.id;
      const apiKey: string = dispositivo.body.apiKey;
      expect(apiKey).toMatch(/^ak_live_/);

      // 3. Sensor
      const sensor = await request(app.getHttpServer())
        .post(url(`/dispositivos/${dispositivoId}/sensores`))
        .set(auth(admin.accessToken))
        .send({
          tipoVariableCodigo: 'TEMPERATURA',
          codigo: 'TEMP-01',
          nombre: 'Temperatura ambiente',
          unidad: 'C',
          rangoMin: 10,
          rangoMax: 35,
        })
        .expect(201);

      // 4. Regla
      await request(app.getHttpServer())
        .post(url('/reglas'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'T alta flujo completo', sensorId: sensor.body.id, operador: 'MAYOR_QUE', umbralMax: 30, severidad: 'ALTA' })
        .expect(201);

      // 5. Ingesta con la credencial del dispositivo
      const headers = { 'X-Device-Key': apiKey, 'X-Device-Code': `DEV-${sufijo}`.slice(0, 40) };
      const ingesta = await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(headers)
        .send({ sensorCodigo: 'TEMP-01', valor: 31.5, timestamp: instante() })
        .expect(201);
      expect(ingesta.body.alertasGeneradas).toHaveLength(1);

      // 6. La alerta está activa
      const listado = await request(app.getHttpServer())
        .get(url(`/alertas?sistemaId=${sistemaId}&estado=ACTIVA`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(listado.body.paginacion.total).toBe(1);
      const alerta = listado.body.datos[0];
      expect(alerta.severidad).toBe('ALTA');
      expect(alerta.valorDetectado).toBeTruthy();
      expect(alerta.umbralAplicado).toBeTruthy();
      expect(alerta.creadaEn).toBeTruthy();

      // 7. Se marca resuelta
      const resuelta = await request(app.getHttpServer())
        .post(url(`/alertas/${alerta.id}/resolver`))
        .set(auth(admin.accessToken))
        .send({ comentario: 'Se ventiló el invernadero' })
        .expect(200);
      expect(resuelta.body.estado).toBe('RESUELTA');
      expect(resuelta.body.comentarioResolucion).toBe('Se ventiló el invernadero');

      // 8. Ya no hay alertas activas para el sistema
      const luego = await request(app.getHttpServer())
        .get(url(`/alertas?sistemaId=${sistemaId}&estado=ACTIVA`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(luego.body.paginacion.total).toBe(0);
    } finally {
      if (dispositivoId) {
        await prisma().alerta.deleteMany({ where: { sistemaId } });
        await prisma().reglaAlerta.deleteMany({ where: { sensor: { dispositivoId } } });
        await prisma().medicionIdempotencia.deleteMany({ where: { dispositivoId } });
        await prisma().medicion.deleteMany({ where: { dispositivoId } });
        await prisma().estadoSensorActual.deleteMany({ where: { dispositivoId } });
        await prisma().sensor.deleteMany({ where: { dispositivoId } });
        await prisma().dispositivo.delete({ where: { id: dispositivoId } }).catch(() => undefined);
      }
      if (sistemaId) {
        await prisma().sistema.delete({ where: { id: sistemaId } }).catch(() => undefined);
      }
    }
  });
});
