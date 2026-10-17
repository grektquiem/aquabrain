import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Identidad autenticada adjunta por `JwtAuthGuard`. */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  permisos: string[];
}

/** Inyecta el usuario autenticado (o una de sus propiedades). */
export const UsuarioActual = createParamDecorator(
  (propiedad: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const usuario = request.user as UsuarioAutenticado | undefined;
    return propiedad && usuario ? usuario[propiedad] : usuario;
  },
);
