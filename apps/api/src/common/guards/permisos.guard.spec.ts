import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/publico.decorator';
import { PERMISOS_KEY } from '../decorators/requiere-permiso.decorator';
import { PermisosGuard } from './permisos.guard';

const esperarMicrotareas = (): Promise<void> => new Promise((r) => setImmediate(r));

function contexto(usuario: unknown): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => function handler() {},
    getClass: () => class Controlador {},
    switchToHttp: () => ({
      getRequest: () => ({ user: usuario, method: 'POST', url: '/api/v1/usuarios', ip: '127.0.0.1', headers: {} }),
    }),
  } as unknown as ExecutionContext;
}

function reflectorCon(meta: { publico?: boolean; permisos?: string[] }): Reflector {
  return {
    getAllAndOverride: (clave: string) =>
      clave === IS_PUBLIC_KEY ? meta.publico : clave === PERMISOS_KEY ? meta.permisos : undefined,
  } as unknown as Reflector;
}

/** Guarda con un doble de PrismaService que registra las auditorías. */
function guardaCon(
  meta: { publico?: boolean; permisos?: string[] },
  crear: jest.Mock = jest.fn().mockResolvedValue({}),
): { guarda: PermisosGuard; crear: jest.Mock } {
  const guarda = new PermisosGuard(reflectorCon(meta), { auditoria: { create: crear } } as unknown as PrismaService);
  return { guarda, crear };
}

const usuarioCon = (permisos: string[]) => ({
  id: 'u1',
  nombre: 'Prueba',
  email: 'prueba@aqua.cl',
  rol: 'Encargado',
  permisos,
});

describe('PermisosGuard (doc 06 §3.2/§3.3, EC-01)', () => {
  // TS-16 · llamada a un endpoint sin el permiso requerido
  it('TS-16: deniega con 403 cuando falta el permiso exigido', () => {
    const { guarda } = guardaCon({ permisos: ['usuario:escribir'] });
    expect(() => guarda.canActivate(contexto(usuarioCon(['alerta:leer'])))).toThrow(ForbiddenException);
  });

  // TS-18 · la elevación de privilegios queda auditada
  it('TS-18: la denegación se audita con los permisos exigidos', async () => {
    const { guarda, crear } = guardaCon({ permisos: ['usuario:escribir'] });
    expect(() => guarda.canActivate(contexto(usuarioCon(['usuario:leer'])))).toThrow(ForbiddenException);
    await esperarMicrotareas();
    expect(crear).toHaveBeenCalledTimes(1);
    const datos = crear.mock.calls[0][0].data;
    expect(datos.accion).toContain('DENEGADO');
    expect(datos.datosDespues.requeridos).toEqual(['usuario:escribir']);
  });

  // TS-16 (caso positivo)
  it('autoriza cuando el usuario tiene todos los permisos exigidos', () => {
    const { guarda } = guardaCon({ permisos: ['a', 'b'] });
    expect(guarda.canActivate(contexto(usuarioCon(['a', 'b', 'c'])))).toBe(true);
  });

  it('deniega si falta al menos uno de los permisos exigidos', () => {
    const { guarda } = guardaCon({ permisos: ['a', 'b'] });
    expect(() => guarda.canActivate(contexto(usuarioCon(['a'])))).toThrow(ForbiddenException);
  });

  it('una ruta pública no evalúa permisos', () => {
    const { guarda, crear } = guardaCon({ publico: true, permisos: ['usuario:escribir'] });
    expect(guarda.canActivate(contexto(undefined))).toBe(true);
    expect(crear).not.toHaveBeenCalled();
  });

  it('una ruta autenticada sin permisos declarados solo exige sesión', () => {
    const { guarda } = guardaCon({ permisos: [] });
    expect(guarda.canActivate(contexto(usuarioCon([])))).toBe(true);
  });

  it('una caída al escribir la auditoría no altera la denegación', async () => {
    const { guarda, crear } = guardaCon({ permisos: ['x'] }, jest.fn().mockRejectedValue(new Error('sin conexión')));
    expect(() => guarda.canActivate(contexto(usuarioCon([])))).toThrow(ForbiddenException);
    await esperarMicrotareas();
    expect(crear).toHaveBeenCalledTimes(1);
  });
});
