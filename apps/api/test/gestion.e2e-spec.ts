import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { auth, crearApp, crearTenant, iniciarSesion, prismaDe, url } from './utils/app';

/**
 * Gestión (CRUD) de sistemas, cultivos, usuarios y reglas + catálogos.
 *
 * Cubre los caminos felices y los errores esperados de los servicios de
 * administración: unicidad de códigos, borrado lógico, alcance excluyente de
 * reglas (RN-07), simulación de reglas sin persistir (TS-06) y las reglas de la
 * matriz de acceso (RN-06: un administrador no se auto-modifica).
 */
describe('Gestión de sistemas, cultivos, usuarios y reglas (e2e)', () => {
  let app: INestApplication;
  let admin: { accessToken: string };
  let adminId: string;
  let rolSupervisorId: string;
  const usuariosCreados: string[] = [];
  const sistemasCreados: string[] = [];

  beforeAll(async () => {
    app = await crearApp();
    await app.init();
    admin = await iniciarSesion(app, 'admin@aqua.cl', 'AquaPlants2026!');
    const prisma = prismaDe(app);
    adminId = (await prisma.usuario.findUniqueOrThrow({ where: { email: 'admin@aqua.cl' } })).id;
    rolSupervisorId = (await prisma.rol.findFirstOrThrow({ where: { nombre: 'Supervisor' } })).id;
  });

  afterAll(async () => {
    const prisma = prismaDe(app);
    if (usuariosCreados.length > 0) {
      await prisma.refreshToken.deleteMany({ where: { usuarioId: { in: usuariosCreados } } });
      await prisma.usuario.deleteMany({ where: { id: { in: usuariosCreados } } });
    }
    if (sistemasCreados.length > 0) {
      await prisma.cultivo.deleteMany({ where: { sistemaId: { in: sistemasCreados } } });
      await prisma.sistema.deleteMany({ where: { id: { in: sistemasCreados } } });
    }
    await app.close();
  });

  // ── Sistemas ─────────────────────────────────────────────────────────────

  describe('Sistemas (RF04)', () => {
    it('crea, consulta, actualiza y desactiva un sistema (borrado lógico)', async () => {
      const codigo = `SIS-IT-${Date.now().toString(36)}`.toUpperCase().slice(0, 30);
      const creado = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo, nombre: 'Invernadero de integración', ubicacion: 'Chile', latitud: -33.4172 })
        .expect(201);
      sistemasCreados.push(creado.body.id);
      expect(creado.body.estado).toBe('ACTIVO');

      const obtenido = await request(app.getHttpServer())
        .get(url(`/sistemas/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(obtenido.body.codigo).toBe(codigo);
      expect(obtenido.body.dispositivos).toEqual([]);

      const actualizado = await request(app.getHttpServer())
        .patch(url(`/sistemas/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Invernadero renombrado' })
        .expect(200);
      expect(actualizado.body.nombre).toBe('Invernadero renombrado');

      // Con un cultivo vinculado, la FK Restrict impide el borrado físico → lógico.
      await prismaDe(app).cultivo.create({
        data: {
          sistemaId: creado.body.id,
          nombre: 'Cultivo vinculado',
          especie: 'Lactuca sativa',
          fechaInicio: new Date(),
        },
      });

      const desactivado = await request(app.getHttpServer())
        .delete(url(`/sistemas/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(desactivado.body.estado).toBe('INACTIVO');
      expect(desactivado.body.eliminado).toBe(false);

      // El borrado es lógico: sigue existiendo y se recupera con el filtro.
      const listado = await request(app.getHttpServer())
        .get(url('/sistemas?incluirInactivos=true'))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(listado.body.some((s: { id: string }) => s.id === creado.body.id)).toBe(true);

      const soloActivos = await request(app.getHttpServer())
        .get(url('/sistemas'))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(soloActivos.body.some((s: { id: string }) => s.id === creado.body.id)).toBe(false);
    });

    it('elimina físicamente un sistema sin nada vinculado', async () => {
      const codigo = `SIS-DEL-${Date.now().toString(36)}`.toUpperCase().slice(0, 30);
      const creado = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo, nombre: 'Sistema creado por error' })
        .expect(201);

      const borrado = await request(app.getHttpServer())
        .delete(url(`/sistemas/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(borrado.body.eliminado).toBe(true);

      await request(app.getHttpServer())
        .get(url(`/sistemas/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .expect(404);
    });

    it('rechaza un código duplicado con 409 y un identificador inexistente con 404', async () => {
      const codigo = `SIS-DUP-${Date.now().toString(36)}`.toUpperCase().slice(0, 30);
      const primero = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo, nombre: 'Sistema duplicado' })
        .expect(201);
      sistemasCreados.push(primero.body.id);

      const duplicado = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo, nombre: 'Otro nombre' })
        .expect(409);
      expect(duplicado.body.codigo).toBe('DUPLICADO');

      const inexistente = await request(app.getHttpServer())
        .get(url('/sistemas/00000000-0000-4000-8000-000000000999'))
        .set(auth(admin.accessToken))
        .expect(404);
      expect(inexistente.body.codigo).toBe('NO_ENCONTRADO');
    });

    it('TS-22: valida el cuerpo (400) y exige autenticación (401)', async () => {
      await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo: 'X', nombre: 'ab' })
        .expect(400);

      await request(app.getHttpServer()).post(url('/sistemas')).send({ codigo: 'SIS-XX', nombre: 'Sin token' }).expect(401);

      // TS-21: un campo no declarado en el DTO se rechaza con 422 y no se persiste.
      const codigo = `SIS-ND-${Date.now().toString(36)}`.toUpperCase().slice(0, 30);
      const extra = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo, nombre: 'Con campo extra', inyectado: true })
        .expect(422);
      expect(extra.body.codigo).toBe('SOLICITUD_INVALIDA');
      expect(await prismaDe(app).sistema.findUnique({ where: { codigo } })).toBeNull();
    });
  });

  // ── Cultivos ─────────────────────────────────────────────────────────────

  describe('Cultivos (RF04)', () => {
    it('crea, filtra, actualiza y cierra un cultivo', async () => {
      const sistema = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo: `SIS-CUL-${Date.now().toString(36)}`.toUpperCase().slice(0, 30), nombre: 'Sistema cultivo' })
        .expect(201);
      sistemasCreados.push(sistema.body.id);

      const creado = await request(app.getHttpServer())
        .post(url('/cultivos'))
        .set(auth(admin.accessToken))
        .send({
          sistemaId: sistema.body.id,
          nombre: 'Lechuga romana',
          especie: 'Lactuca sativa',
          fechaInicio: '2026-03-01',
          fotoperiodoHoras: 16,
        })
        .expect(201);
      expect(creado.body.especie).toBe('Lactuca sativa');

      const filtrado = await request(app.getHttpServer())
        .get(url(`/cultivos?sistemaId=${sistema.body.id}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(filtrado.body).toHaveLength(1);

      const obtenido = await request(app.getHttpServer())
        .get(url(`/cultivos/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(obtenido.body.nombre).toBe('Lechuga romana');

      const actualizado = await request(app.getHttpServer())
        .patch(url(`/cultivos/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .send({ variedad: 'Romana mejorada' })
        .expect(200);
      expect(actualizado.body.variedad).toBe('Romana mejorada');

      const cerrado = await request(app.getHttpServer())
        .delete(url(`/cultivos/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(cerrado.body.estado).toBe('CERRADO');
    });

    it('un cultivo no puede colgar de un sistema inexistente', async () => {
      const res = await request(app.getHttpServer())
        .post(url('/cultivos'))
        .set(auth(admin.accessToken))
        .send({
          sistemaId: '00000000-0000-4000-8000-000000000999',
          nombre: 'Cultivo huérfano',
          especie: 'Especie X',
          fechaInicio: '2026-03-01',
        });
      // La referencia inválida se traduce en un conflicto, nunca en un 500.
      expect([400, 404, 409]).toContain(res.status);
      expect(await prismaDe(app).cultivo.findFirst({ where: { nombre: 'Cultivo huérfano' } })).toBeNull();
    });

    it('rechaza una fecha de término anterior al inicio', async () => {
      const sistema = await request(app.getHttpServer())
        .post(url('/sistemas'))
        .set(auth(admin.accessToken))
        .send({ codigo: `SIS-FECHA-${Date.now().toString(36)}`.toUpperCase().slice(0, 30), nombre: 'Sistema fechas' })
        .expect(201);
      sistemasCreados.push(sistema.body.id);

      const res = await request(app.getHttpServer())
        .post(url('/cultivos'))
        .set(auth(admin.accessToken))
        .send({
          sistemaId: sistema.body.id,
          nombre: 'Cultivo incoherente',
          especie: 'Especie Y',
          fechaInicio: '2026-06-01',
          fechaFinEstimada: '2026-01-01',
        })
        .expect(400);
      expect(res.body.mensaje).toMatch(/término|anterior/i);
    });
  });

  // ── Usuarios ─────────────────────────────────────────────────────────────

  describe('Usuarios (RF02, RN-06)', () => {
    it('TS-12: crea un usuario con contraseña válida y rechaza una corta', async () => {
      const email = `integracion-${Date.now().toString(36)}@aqua.cl`;

      await request(app.getHttpServer())
        .post(url('/usuarios'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Contraseña corta', email: `corta-${email}`, password: 'Corta123', rolId: rolSupervisorId })
        .expect(400);

      const creado = await request(app.getHttpServer())
        .post(url('/usuarios'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Usuario de integración', email, password: 'Integracion2026!', rolId: rolSupervisorId })
        .expect(201);
      usuariosCreados.push(creado.body.id);
      expect(creado.body.email).toBe(email);
      expect(creado.body).not.toHaveProperty('passwordHash');

      // El hash guardado es bcrypt y no la contraseña en claro.
      const fila = await prismaDe(app).usuario.findUniqueOrThrow({ where: { id: creado.body.id } });
      expect(fila.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(fila.passwordHash).not.toContain('Integracion2026!');

      // La nueva cuenta puede iniciar sesión.
      const sesion = await iniciarSesion(app, email, 'Integracion2026!');
      expect(sesion.accessToken).toBeTruthy();
    });

    it('rechaza correo duplicado (409) y rol inexistente (400)', async () => {
      const email = `duplicado-${Date.now().toString(36)}@aqua.cl`;
      const creado = await request(app.getHttpServer())
        .post(url('/usuarios'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Duplicado', email, password: 'Duplicado2026!', rolId: rolSupervisorId })
        .expect(201);
      usuariosCreados.push(creado.body.id);

      const repetido = await request(app.getHttpServer())
        .post(url('/usuarios'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Otro', email, password: 'Duplicado2026!', rolId: rolSupervisorId })
        .expect(409);
      expect(repetido.body.codigo).toBe('DUPLICADO');

      await request(app.getHttpServer())
        .post(url('/usuarios'))
        .set(auth(admin.accessToken))
        .send({
          nombre: 'Rol fantasma',
          email: `fantasma-${Date.now().toString(36)}@aqua.cl`,
          password: 'Fantasma2026!',
          rolId: '00000000-0000-4000-8000-000000000999',
        })
        .expect(400);
    });

    it('lista y obtiene usuarios sin exponer el hash', async () => {
      const listado = await request(app.getHttpServer())
        .get(url('/usuarios?porPagina=5'))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(listado.body.paginacion.total).toBeGreaterThanOrEqual(3);
      expect(JSON.stringify(listado.body)).not.toContain('passwordHash');

      const uno = await request(app.getHttpServer())
        .get(url(`/usuarios/${adminId}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(uno.body.rol.nombre).toBe('Administrador');
    });

    it('TS-19: un administrador no puede eliminar ni desactivar su propia cuenta', async () => {
      const borrado = await request(app.getHttpServer())
        .delete(url(`/usuarios/${adminId}`))
        .set(auth(admin.accessToken))
        .expect(403);
      expect(borrado.body.codigo).toBe('PROHIBIDO');

      const desactivado = await request(app.getHttpServer())
        .patch(url(`/usuarios/${adminId}`))
        .set(auth(admin.accessToken))
        .send({ activo: false })
        .expect(403);
      expect(desactivado.body.codigo).toBe('PROHIBIDO');

      const sigueActivo = await prismaDe(app).usuario.findUniqueOrThrow({ where: { id: adminId } });
      expect(sigueActivo.activo).toBe(true);
    });

    it('un administrador no puede cambiarse su propio rol (RN-06)', async () => {
      const res = await request(app.getHttpServer())
        .patch(url(`/usuarios/${adminId}`))
        .set(auth(admin.accessToken))
        .send({ rolId: rolSupervisorId })
        .expect(403);
      expect(res.body.codigo).toBe('PROHIBIDO');

      const sigue = await prismaDe(app).usuario.findUniqueOrThrow({ where: { id: adminId } });
      expect(sigue.rolId).not.toBe(rolSupervisorId);
    });

    it('desactiva a otro usuario (borrado lógico) y revoca sus sesiones', async () => {
      const email = `revocable-${Date.now().toString(36)}@aqua.cl`;
      const creado = await request(app.getHttpServer())
        .post(url('/usuarios'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Revocable', email, password: 'Revocable2026!', rolId: rolSupervisorId })
        .expect(201);
      usuariosCreados.push(creado.body.id);

      const sesion = await iniciarSesion(app, email, 'Revocable2026!');
      const antes = await prismaDe(app).refreshToken.count({ where: { usuarioId: creado.body.id, revocadoEn: null } });
      expect(antes).toBeGreaterThanOrEqual(1);

      const desactivado = await request(app.getHttpServer())
        .delete(url(`/usuarios/${creado.body.id}`))
        .set(auth(admin.accessToken))
        .expect(200);
      expect(desactivado.body.activo).toBe(false);

      const despues = await prismaDe(app).refreshToken.count({ where: { usuarioId: creado.body.id, revocadoEn: null } });
      expect(despues).toBe(0);

      // El token de acceso ya no sirve: la estrategia vuelve a leer al usuario.
      await request(app.getHttpServer()).get(url('/auth/me')).set(auth(sesion.accessToken)).expect(401);
    });
  });

  // ── Reglas ───────────────────────────────────────────────────────────────

  describe('Reglas de alerta (RF10, HU07)', () => {
    it('TS-06: probar una regla en borrador no persiste mediciones ni alertas', async () => {
      const antes = await prismaDe(app).medicion.count();
      const res = await request(app.getHttpServer())
        .post(url('/reglas/probar/simulacion'))
        .set(auth(admin.accessToken))
        .send({ regla: { nombre: 'Borrador', operador: 'MAYOR_QUE', umbralMax: 30, severidad: 'ALTA' }, valor: 31 })
        .expect(201);
      expect(res.body.dispara).toBe(true);
      expect(await prismaDe(app).medicion.count()).toBe(antes);
    });

    it('crea una regla por sensor, cambia su alcance a tipo y la elimina', async () => {
      const t = await crearTenant(app, 'reglas', ['PH-01']);
      try {
        const creada = await request(app.getHttpServer())
          .post(url('/reglas'))
          .set(auth(admin.accessToken))
          .send({
            nombre: 'pH fuera de rango (integración)',
            sensorId: t.sensorIds['PH-01'],
            operador: 'FUERA_DE_RANGO',
            umbralMin: 6,
            umbralMax: 7,
            severidad: 'ALTA',
          })
          .expect(201);
        expect(creada.body.sensor.id).toBe(t.sensorIds['PH-01']);

        // Cambiar de alcance a tipo de variable desplaza al sensor (RN-07).
        const cambiada = await request(app.getHttpServer())
          .patch(url(`/reglas/${creada.body.id}`))
          .set(auth(admin.accessToken))
          .send({ tipoVariableCodigo: 'PH' })
          .expect(200);
        expect(cambiada.body.sensor).toBeNull();
        expect(cambiada.body.tipoVariable.codigo).toBe('PH');

        const obtenida = await request(app.getHttpServer())
          .get(url(`/reglas/${creada.body.id}`))
          .set(auth(admin.accessToken))
          .expect(200);
        expect(obtenida.body.activa).toBe(true);

        const listado = await request(app.getHttpServer())
          .get(url('/reglas?soloActivas=true'))
          .set(auth(admin.accessToken))
          .expect(200);
        expect(listado.body.some((r: { id: string }) => r.id === creada.body.id)).toBe(true);

        const borrada = await request(app.getHttpServer())
          .delete(url(`/reglas/${creada.body.id}`))
          .set(auth(admin.accessToken))
          .expect(200);
        expect(borrada.body.id).toBe(creada.body.id);
      } finally {
        await t.limpiar();
      }
    });

    it('rechaza reglas inválidas: sin alcance, tipo inexistente y umbrales incoherentes', async () => {
      const sinAlcance = await request(app.getHttpServer())
        .post(url('/reglas'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Sin alcance', operador: 'MAYOR_QUE', umbralMax: 30, severidad: 'ALTA' })
        .expect(400);
      expect(JSON.stringify(sinAlcance.body)).toMatch(/alcance/i);

      await request(app.getHttpServer())
        .post(url('/reglas'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Tipo fantasma', tipoVariableCodigo: 'NO-EXISTE', operador: 'MAYOR_QUE', umbralMax: 30, severidad: 'ALTA' })
        .expect(400);

      await request(app.getHttpServer())
        .post(url('/reglas'))
        .set(auth(admin.accessToken))
        .send({ nombre: 'Umbrales invertidos', tipoVariableCodigo: 'PH', operador: 'FUERA_DE_RANGO', umbralMin: 7, umbralMax: 6, severidad: 'ALTA' })
        .expect(400);

      const inexistente = await request(app.getHttpServer())
        .get(url('/reglas/00000000-0000-4000-8000-000000000999'))
        .set(auth(admin.accessToken))
        .expect(404);
      expect(inexistente.body.codigo).toBe('NO_ENCONTRADO');
    });
  });

  // ── Catálogos ────────────────────────────────────────────────────────────

  describe('Catálogos (RF05)', () => {
    it('expone roles con permisos, permisos y tipos de variable', async () => {
      const roles = await request(app.getHttpServer()).get(url('/roles')).set(auth(admin.accessToken)).expect(200);
      expect(roles.body.length).toBeGreaterThanOrEqual(3);
      expect(JSON.stringify(roles.body)).toContain('usuario:escribir');

      const permisos = await request(app.getHttpServer()).get(url('/permisos')).set(auth(admin.accessToken)).expect(200);
      expect(permisos.body.some((p: { codigo: string }) => p.codigo === 'medicion:leer')).toBe(true);

      const tipos = await request(app.getHttpServer()).get(url('/tipos-variable')).set(auth(admin.accessToken)).expect(200);
      expect(tipos.body.some((t: { codigo: string }) => t.codigo === 'TEMPERATURA')).toBe(true);
    });
  });
});
