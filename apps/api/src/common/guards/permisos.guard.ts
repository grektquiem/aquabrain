import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/publico.decorator';
import { PERMISOS_KEY } from '../decorators/requiere-permiso.decorator';
import { UsuarioAutenticado } from '../decorators/usuario-actual.decorator';

/**
 * Guarda global de autorización por permiso (doc 06 §3.2/§3.3, EC-01).
 *
 * - Ruta pública → no evalúa permisos.
 * - Ruta autenticada sin `@RequierePermiso` → solo exige sesión válida
 *   (caso de `/auth/me` y `/auth/logout`, documentado).
 * - Ruta con permisos → el usuario debe tenerlos **todos**.
 *
 * Toda denegación se **audita** (TS-18): un intento de elevación de privilegios
 * debe quedar registrado aunque la operación no llegue a ejecutarse.
 *
 * El rol nunca se toma del cuerpo de la petición: proviene del token y se
 * recarga contra la base de datos en la estrategia JWT.
 */
@Injectable()
export class PermisosGuard implements CanActivate {
  private readonly logger = new Logger(PermisosGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico || context.getType() !== 'http') {
      return true;
    }

    const requeridos = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requeridos || requeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user as UsuarioAutenticado | undefined;
    const permisos = usuario?.permisos ?? [];

    if (!requeridos.every((p) => permisos.includes(p))) {
      void this.auditarDenegacion(request, usuario, requeridos);
      throw new ForbiddenException('No tiene permisos para esta operación');
    }
    return true;
  }

  /** Registro asíncrono: la denegación no espera a la base de datos. */
  private async auditarDenegacion(
    request: { method?: string; url?: string; ip?: string; headers?: Record<string, unknown> },
    usuario: UsuarioAutenticado | undefined,
    requeridos: string[],
  ): Promise<void> {
    try {
      await this.prisma.auditoria.create({
        data: {
          usuarioId: usuario?.id ?? null,
          accion: `DENEGADO ${request.method ?? ''} ${request.url ?? ''}`.slice(0, 40),
          entidad: 'autorizacion',
          entidadId: (usuario?.email ?? 'anonimo').slice(0, 64),
          ip: typeof request.ip === 'string' ? request.ip.slice(0, 45) : null,
          datosDespues: { requeridos, rol: usuario?.rol ?? null } as never,
        },
      });
    } catch (e) {
      this.logger.warn(`No se pudo auditar la denegación: ${e instanceof Error ? e.message : e}`);
    }
  }
}
