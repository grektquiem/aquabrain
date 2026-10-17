import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { auth, crearApp, crearTenant, instante, prismaDe, url } from './utils/app';

/**
 * Autorización por rol y aislamiento entre recursos.
 * Cubre TS-16, TS-17, TS-18, TS-19 y TS-26.
 */
describe('Autorización y aislamiento (e2e)', () => {
  let app: INestApplication;
  const prisma = () => prismaDe(app);
  let admin: { accessToken: string };
  let encargado: { accessToken: string };
  let supervisor: { accessToken: string };

  const esperar = (): Promise<void> => new Promise((r) => setTimeout(r, 250));

  beforeAll(async () => {
    app = await crearApp();
    const entrar = async (email: string) => {
      const r = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send({ email, password: 'AquaPlants2026!' })
        .expect(200);
      return { accessToken: r.body.accessToken as string };
    };
    admin = await entrar('admin@aqua.cl');
    encargado = await entrar('encargado@aqua.cl');
    supervisor = await entrar('supervisor@aqua.cl');
  });

  afterAll(async () => {
    await app.close();
  });

  // ── TS-16 · endpoint sin permiso ──────────────────────────────────────────

  it('TS-16: el encargado no puede crear un sistema (403)', async () => {
    const res = await request(app.getHttpServer())
      .post(url('/sistemas'))
      .set(auth(encargado.accessToken))
      .send({ codigo: `SIS-${Date.now()}`, nombre: 'Sistema no autorizado' })
      .expect(403);
    expect(res.body.codigo).toBe('PROHIBIDO');
    expect(JSON.stringify(res.body)).not.toMatch(/stack/i);
  });

  it('TS-16: el supervisor no puede crear reglas (403)', async () => {
    await request(app.getHttpServer())
      .post(url('/reglas'))
      .set(auth(supervisor.accessToken))
      .send({ nombre: 'Regla no autorizada', operador: 'MAYOR_QUE', umbralMax: 30, severidad: 'BAJA', tipoVariableCodigo: 'TEMPERATURA' })
      .expect(403);
  });

  it('TS-16: sin token la respuesta es 401, no 403', async () => {
    await request(app.getHttpServer()).get(url('/sistemas')).expect(401);
    await request(app.getHttpServer()).get(url('/dashboard/estado')).expect(401);
  });

  it('TS-16: el encargado sí puede leer (rol de solo lectura)', async () => {
    await request(app.getHttpServer()).get(url('/sistemas')).set(auth(encargado.accessToken)).expect(200);
    await request(app.getHttpServer()).get(url('/alertas')).set(auth(encargado.accessToken)).expect(200);
  });

  // ── TS-17 · IDOR ─────────────────────────────────────────────────────────

  it('TS-17: solicitar una regla inexistente devuelve 404', async () => {
    const res = await request(app.getHttpServer())
      .get(url('/reglas/00000000-0000-4000-8000-000000000999'))
      .set(auth(encargado.accessToken))
      .expect(404);
    expect(res.body.codigo).toBe('NO_ENCONTRADO');
  });

  it('TS-17: el encargado no puede modificar una regla existente (403) y nada cambia', async () => {
    const regla = await prisma().reglaAlerta.findFirstOrThrow({ where: { activa: true } });
    await request(app.getHttpServer())
      .patch(url(`/reglas/${regla.id}`))
      .set(auth(encargado.accessToken))
      .send({ umbralMax: 9999 })
      .expect(403);

    const sinCambios = await prisma().reglaAlerta.findUniqueOrThrow({ where: { id: regla.id } });
    expect(String(sinCambios.umbralMax)).toBe(String(regla.umbralMax));
  });

  it('TS-17: el encargado no puede borrar un dispositivo (403)', async () => {
    const dispositivo = await prisma().dispositivo.findFirstOrThrow();
    await request(app.getHttpServer())
      .delete(url(`/dispositivos/${dispositivo.id}`))
      .set(auth(encargado.accessToken))
      .expect(403);
    expect(await prisma().dispositivo.count({ where: { id: dispositivo.id } })).toBe(1);
  });

  // ── TS-18 · elevación de privilegios ──────────────────────────────────────

  it('TS-18: el encargado no puede asignarse el rol Administrador y queda auditoría', async () => {
    const rolAdmin = await prisma().rol.findFirstOrThrow({ where: { nombre: 'Administrador' } });
    const enc = await prisma().usuario.findUniqueOrThrow({ where: { email: 'encargado@aqua.cl' } });
    const rolAntes = enc.rolId;
    const denegacionesAntes = await prisma().auditoria.count({
      where: { entidadId: 'encargado@aqua.cl', accion: { startsWith: 'DENEGADO' } },
    });

    const res = await request(app.getHttpServer())
      .patch(url(`/usuarios/${enc.id}`))
      .set(auth(encargado.accessToken))
      .send({ rolId: rolAdmin.id })
      .expect(403);
    expect(res.body.codigo).toBe('PROHIBIDO');

    const despues = await prisma().usuario.findUniqueOrThrow({ where: { id: enc.id } });
    expect(despues.rolId).toBe(rolAntes);

    // La denegación concreta queda auditada (TS-18/RF13): exactamente una más.
    await esperar();
    const denegaciones = await prisma().auditoria.count({
      where: { entidadId: 'encargado@aqua.cl', accion: { startsWith: 'DENEGADO' } },
    });
    expect(denegaciones).toBe(denegacionesAntes + 1);
    const ultima = await prisma().auditoria.findFirstOrThrow({
      where: { entidadId: 'encargado@aqua.cl', accion: { startsWith: 'DENEGADO' } },
      orderBy: { ocurridoEn: 'desc' },
    });
    expect(ultima.accion).toContain('usuarios');
    expect((ultima.datosDespues as { requeridos?: string[] }).requeridos).toEqual(['usuario:escribir']);
  });

  // ── TS-19 · no eliminar la propia cuenta ──────────────────────────────────

  it('TS-19: un administrador no puede eliminar su propia cuenta', async () => {
    const propio = await prisma().usuario.findUniqueOrThrow({ where: { email: 'admin@aqua.cl' } });
    const res = await request(app.getHttpServer())
      .delete(url(`/usuarios/${propio.id}`))
      .set(auth(admin.accessToken))
      .expect(403);
    expect(res.body.codigo).toBe('PROHIBIDO');

    const sigue = await prisma().usuario.findUniqueOrThrow({ where: { id: propio.id } });
    expect(sigue.activo).toBe(true);
  });

  // ── TS-26 · sensor de otro dispositivo ────────────────────────────────────

  it('TS-26: un dispositivo no puede reportar con el sensor de otro (403) y nada se persiste', async () => {
    const uno = await crearTenant(app, 'ts26-a');
    const otro = await crearTenant(app, 'ts26-b', ['PH-01']);
    try {
      const ajeno = otro.sensorIds['PH-01'];
      const antes = await prisma().medicion.count({ where: { sensorId: ajeno } });
      const res = await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(uno.deviceHeaders)
        .send({ sensorId: ajeno, valor: 6.4, timestamp: instante() })
        .expect(403);
      expect(res.body.mensaje).toMatch(/no pertenece/i);
      expect(await prisma().medicion.count({ where: { sensorId: ajeno } })).toBe(antes);
    } finally {
      await uno.limpiar();
      await otro.limpiar();
    }
  });

  it('TS-26: un sensor inexistente devuelve 404', async () => {
    const t = await crearTenant(app, 'ts26-c');
    try {
      await request(app.getHttpServer())
        .post(url('/mediciones'))
        .set(t.deviceHeaders)
        .send({ sensorId: '00000000-0000-4000-8000-000000000888', valor: 1, timestamp: instante() })
        .expect(404);
    } finally {
      await t.limpiar();
    }
  });
});
