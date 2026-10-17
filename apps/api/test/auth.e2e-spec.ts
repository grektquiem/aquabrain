import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { crearApp, prismaDe, url } from './utils/app';

/**
 * Autenticación y gestión de sesión (doc 06 §2).
 * Cubre TS-12, TS-13, TS-14 y TS-15.
 */
describe('Autenticación (e2e)', () => {
  let app: INestApplication;
  const prisma = () => prismaDe(app);
  const CLAVE = 'AquaPlants2026!';
  /** Usuarios desechables creados por la suite, para no bloquear los de la semilla. */
  const desechables: Array<{ id: string; email: string }> = [];

  beforeAll(async () => {
    app = await crearApp();
  });

  afterAll(async () => {
    for (const u of desechables) {
      await prisma().refreshToken.deleteMany({ where: { usuarioId: u.id } });
      await prisma().auditoria.deleteMany({ where: { usuarioId: u.id } });
      await prisma().usuario.delete({ where: { id: u.id } }).catch(() => undefined);
    }
    await app.close();
  });

  async function usuarioDesechable(rol: string, password = CLAVE): Promise<{ id: string; email: string }> {
    const r = await prisma().rol.findFirstOrThrow({ where: { nombre: rol } });
    const email = `e2e-auth-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@aqua.cl`;
    const creado = await prisma().usuario.create({
      data: { nombre: 'Prueba Auth', email, passwordHash: bcrypt.hashSync(password, 10), rolId: r.id },
    });
    const par = { id: creado.id, email: creado.email };
    desechables.push(par);
    return par;
  }

  const entrar = (email: string, password: string) =>
    request(app.getHttpServer()).post(url('/auth/login')).send({ email, password });

  // ── TS-12 · política de contraseña y bcrypt ────────────────────────────────

  it('TS-12: una contraseña de menos de 10 caracteres se rechaza con 400', async () => {
    const sesion = await entrar('admin@aqua.cl', CLAVE).expect(200);
    const res = await request(app.getHttpServer())
      .post(url('/usuarios'))
      .set('Authorization', `Bearer ${sesion.body.accessToken}`)
      .send({
        nombre: 'Clave Corta',
        email: `corta-${Date.now()}@aqua.cl`,
        password: '123456789',
        rolId: '00000000-0000-4000-8000-000000000000',
      })
      .expect(400);
    expect(res.body.mensaje).toBeDefined();
  });

  it('TS-12: la contraseña se almacena como hash bcrypt verificable, nunca en claro', async () => {
    const { id } = await usuarioDesechable('Supervisor');
    const fila = await prisma().usuario.findUniqueOrThrow({ where: { id } });
    expect(fila.passwordHash).not.toContain(CLAVE);
    expect(fila.passwordHash.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare(CLAVE, fila.passwordHash)).toBe(true);
    expect(await bcrypt.compare('otra-clave-distinta', fila.passwordHash)).toBe(false);
  });

  // ── TS-13 · bloqueo tras 5 intentos fallidos ───────────────────────────────

  it('TS-13: cinco intentos fallidos bloquean la cuenta (15 min) y se auditan', async () => {
    const { id, email } = await usuarioDesechable('Encargado');

    for (let i = 1; i <= 5; i += 1) {
      const res = await entrar(email, 'ClaveIncorrecta2026!').expect(401);
      expect(res.body.mensaje).toBe('Credenciales inválidas');
    }

    const bloqueado = await prisma().usuario.findUniqueOrThrow({ where: { id } });
    expect(bloqueado.intentosFallidos).toBe(5);
    expect(bloqueado.bloqueadoHasta).not.toBeNull();
    expect(bloqueado.bloqueadoHasta!.getTime()).toBeGreaterThan(Date.now());

    // Ni siquiera con la contraseña correcta se entra mientras dure el bloqueo.
    const conClaveBuena = await entrar(email, CLAVE).expect(401);
    expect(conClaveBuena.body.mensaje).toMatch(/bloqueada/i);

    const auditoria = await prisma().auditoria.count({ where: { usuarioId: id, accion: 'LOGIN_FALLIDO' } });
    expect(auditoria).toBeGreaterThanOrEqual(5);
  });

  it('TS-13: la respuesta no revela si el correo existe', async () => {
    const inexistente = await entrar(`nadie-${Date.now()}@aqua.cl`, 'ClaveInventada2026!').expect(401);
    const existente = await entrar('supervisor@aqua.cl', 'ClaveInventada2026!').expect(401);
    expect(inexistente.body.mensaje).toBe(existente.body.mensaje);
  });

  // ── TS-14 · token expirado ────────────────────────────────────────────────

  it('TS-14: un access token expirado devuelve 401 y el refresh permite renovar', async () => {
    const admin = await prisma().usuario.findUniqueOrThrow({ where: { email: 'admin@aqua.cl' } });
    const expirado = await new JwtService().signAsync(
      { sub: admin.id, email: admin.email, rol: 'Administrador' },
      {
        secret: process.env.JWT_ACCESS_SECRET!,
        expiresIn: '-10s',
        issuer: 'aquabrain',
        audience: 'aquabrain-web',
      },
    );

    await request(app.getHttpServer())
      .get(url('/auth/me'))
      .set('Authorization', `Bearer ${expirado}`)
      .expect(401);

    const sesion = await entrar('admin@aqua.cl', CLAVE).expect(200);
    const renovada = await request(app.getHttpServer())
      .post(url('/auth/refresh'))
      .send({ refreshToken: sesion.body.refreshToken })
      .expect(200);
    expect(renovada.body.accessToken).toBeTruthy();
    expect(renovada.body.refreshToken).not.toBe(sesion.body.refreshToken);
  });

  it('TS-14: un token firmado con otro secreto devuelve 401', async () => {
    const falsificado = await new JwtService().signAsync(
      { sub: '00000000-0000-4000-8000-000000000000', email: 'falso@aqua.cl', rol: 'Administrador' },
      { secret: 'secreto-ajeno-de-32-caracteres-o-mas-000', expiresIn: '15m', issuer: 'aquabrain', audience: 'aquabrain-web' },
    );
    await request(app.getHttpServer())
      .get(url('/auth/me'))
      .set('Authorization', `Bearer ${falsificado}`)
      .expect(401);
  });

  // ── TS-15 · reutilización de un refresh rotado ─────────────────────────────

  it('TS-15: reutilizar un refresh ya rotado revoca toda la cadena de sesión', async () => {
    const { email } = await usuarioDesechable('Supervisor');
    const sesion = await entrar(email, CLAVE).expect(200);

    const rotado = await request(app.getHttpServer())
      .post(url('/auth/refresh'))
      .send({ refreshToken: sesion.body.refreshToken })
      .expect(200);
    expect(rotado.body.refreshToken).not.toBe(sesion.body.refreshToken);

    // Reutilizar el token consumido falla…
    await request(app.getHttpServer())
      .post(url('/auth/refresh'))
      .send({ refreshToken: sesion.body.refreshToken })
      .expect(401);

    // …y además deja inservible el token recién emitido.
    await request(app.getHttpServer())
      .post(url('/auth/refresh'))
      .send({ refreshToken: rotado.body.refreshToken })
      .expect(401);
  });

  it('el logout revoca el refresh vigente', async () => {
    const { email } = await usuarioDesechable('Supervisor');
    const sesion = await entrar(email, CLAVE).expect(200);
    await request(app.getHttpServer())
      .post(url('/auth/logout'))
      .set('Authorization', `Bearer ${sesion.body.accessToken}`)
      .send({ refreshToken: sesion.body.refreshToken })
      .expect(204);
    await request(app.getHttpServer())
      .post(url('/auth/refresh'))
      .send({ refreshToken: sesion.body.refreshToken })
      .expect(401);
  });
});
