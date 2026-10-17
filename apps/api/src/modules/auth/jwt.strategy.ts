import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsuarioAutenticado } from '../../common/decorators/usuario-actual.decorator';

export interface AccessPayload {
  sub: string;
  email: string;
  rol: string;
}

/**
 * Estrategia de acceso (doc 06 §2.2).
 * El rol y los permisos **no** viajan en el token: se recargan desde la base
 * de datos en cada petición, de modo que un cambio de rol surte efecto de
 * inmediato y un token robado no puede elevar privilegios.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: 'aquabrain',
      audience: 'aquabrain-web',
    });
  }

  async validate(payload: AccessPayload): Promise<UsuarioAutenticado> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: { rol: { include: { rolPermisos: { include: { permiso: true } } } } },
    });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Sesión no válida');
    }
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol.nombre,
      permisos: usuario.rol.rolPermisos.map((rp) => rp.permiso.codigo),
    };
  }
}
