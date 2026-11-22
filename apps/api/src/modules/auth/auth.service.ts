import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { parseDuracion } from '../../common/utils/tiempo';

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;
/** Topes del login: coinciden con los límites del alta de usuarios. */
const MAX_EMAIL = 180;
const MAX_PASSWORD = 128;

export interface SesionEmitida {
  accessToken: string;
  refreshToken: string;
  expiraEnSegundos: number;
  refreshTtlSegundos: number;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    permisos: string[];
  };
}

/**
 * Autenticación (doc 06 §2.1/§2.2).
 * - Contraseñas con bcrypt (coste configurable).
 * - Bloqueo temporal de 15 minutos tras 5 intentos fallidos consecutivos (TH-02).
 * - Mensaje genérico: no revela si el correo existe (A07).
 * - Refresh **rotativo**: el token usado se revoca; reutilizar uno revocado
 *   invalida toda la cadena de sesión del usuario.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, ip?: string, userAgent?: string, rememberMe = false,): Promise<SesionEmitida> {
    const generico = new UnauthorizedException('Credenciales inválidas');

    // Valores fuera de rango: mismo 401 genérico (y mismo coste) que un correo inexistente.
    const fueraDeRango = email.length > MAX_EMAIL || password.length > MAX_PASSWORD;
    const usuario = fueraDeRango
      ? null
      : await this.prisma.usuario.findUnique({
          where: { email: email.toLowerCase() },
          include: { rol: { include: { rolPermisos: { include: { permiso: true } } } } },
        });

    if (!usuario || !usuario.activo) {
      // Coste constante: se compara contra un hash ficticio para no filtrar por tiempo.
      await bcrypt.compare(password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
      await this.registrarIntentoFallido(email, 'usuario inexistente o inactivo', ip);
      throw generico;
    }
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      throw new UnauthorizedException('Cuenta bloqueada temporalmente por intentos fallidos');
    }
    if (usuario.bloqueadoHasta) {
      // El bloqueo ya venció: se parte de cero antes de evaluar la contraseña.
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null },
      });
    }

    const correcta = await bcrypt.compare(password, usuario.passwordHash);
    if (!correcta) {
      // Incremento atómico: evita perder intentos con peticiones concurrentes.
      const { intentosFallidos: intentos } = await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: { increment: 1 } },
        select: { intentosFallidos: true },
      });
      const bloquear = intentos >= MAX_INTENTOS;
      if (bloquear) {
        await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: { bloqueadoHasta: new Date(Date.now() + BLOQUEO_MINUTOS * 60_000) },
        });
      }
      await this.registrarIntentoFallido(email, `credenciales inválidas (intento ${intentos})`, ip, usuario.id);
      if (bloquear) this.logger.warn(`Cuenta ${email} bloqueada ${BLOQUEO_MINUTOS} min tras ${MAX_INTENTOS} intentos (TS-13)`);
      throw generico;
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
    });

    return this.emitirSesion(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol.nombre,
        permisos: usuario.rol.rolPermisos.map((rp) => rp.permiso.codigo),
      },
      ip,
      userAgent,
      rememberMe,
    );
  }

  /** Rotación de refresh (doc 06 §2.2). */
  async refresh(tokenPlano: string, ip?: string, userAgent?: string): Promise<SesionEmitida> {
    const tokenHash = this.hash(tokenPlano);
    const registro = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!registro) {
      throw new UnauthorizedException('Refresh token inválido');
    }
    if (registro.revocadoEn) {
      // Reutilización de un token revocado → posible robo: se revoca la cadena completa.
      this.logger.warn(`Reutilización de refresh revocado para usuario ${registro.usuarioId}`);
      await this.prisma.refreshToken.updateMany({
        where: { usuarioId: registro.usuarioId, revocadoEn: null },
        data: { revocadoEn: new Date() },
      });
      throw new UnauthorizedException('Refresh token revocado');
    }
    if (registro.expiraEn <= new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: registro.usuarioId },
      include: { rol: { include: { rolPermisos: { include: { permiso: true } } } } },
    });
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Sesión no válida');
    }

    await this.prisma.refreshToken.update({ where: { id: registro.id }, data: { revocadoEn: new Date() } });

    return this.emitirSesion(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol.nombre,
        permisos: usuario.rol.rolPermisos.map((rp) => rp.permiso.codigo),
      },
      ip,
      userAgent,
    );
  }

  async logout(tokenPlano?: string): Promise<void> {
    if (!tokenPlano) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(tokenPlano), revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
  }

  /**
   * Auditoría de intentos fallidos (TS-13, RF13). Se registra sin bloquear el
   * flujo: si la escritura falla, el login igualmente devuelve 401 genérico.
   */
  private async registrarIntentoFallido(
    email: string,
    motivo: string,
    ip?: string,
    usuarioId?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditoria.create({
        data: {
          usuarioId: usuarioId ?? null,
          accion: 'LOGIN_FALLIDO',
          entidad: 'usuario',
          entidadId: email.toLowerCase().slice(0, 64),
          ip: ip ? ip.replace(/^::ffff:/, '').slice(0, 45) : null,
          datosDespues: { motivo } as never,
        },
      });
    } catch (e) {
      this.logger.warn(`No se pudo auditar el intento fallido: ${e instanceof Error ? e.message : e}`);
    }
  }

    private async emitirSesion(
    usuario: SesionEmitida['usuario'],
    ip?: string,
    userAgent?: string,
    rememberMe = false,
  ): Promise<SesionEmitida> {
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    // Si "Recuérdame" está marcado, la sesión se extiende a 30 días.
    const refreshTtl = rememberMe
      ? '30d'
      : this.config.get<string>('JWT_REFRESH_TTL', '7d');

    const accessToken = await this.jwt.signAsync(
      { sub: usuario.id, email: usuario.email, rol: usuario.rol },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTtl,
        issuer: 'aquabrain',
        audience: 'aquabrain-web',
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: this.hash(refreshToken),
        expiraEn: new Date(Date.now() + parseDuracion(refreshTtl)),
        userAgent: userAgent?.slice(0, 255) ?? null,
        ip: ip && ip.length <= 45 ? ip : null,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiraEnSegundos: Math.floor(parseDuracion(accessTtl) / 1000),
      refreshTtlSegundos: Math.floor(parseDuracion(refreshTtl) / 1000),
      usuario,
    };
  }

  private hash(valor: string): string {
    return createHash('sha256').update(valor).digest('hex');
  }
}
