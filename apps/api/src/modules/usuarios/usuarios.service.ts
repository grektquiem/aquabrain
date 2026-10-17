import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './dto/usuario.dto';
import { PaginacionDto } from '../../common/dto/paginacion.dto';

/** Proyección: nunca sale `password_hash` ni el rol interno (EC-07). */
const PROYECCION = {
  id: true,
  nombre: true,
  email: true,
  activo: true,
  intentosFallidos: true,
  bloqueadoHasta: true,
  ultimoAcceso: true,
  creadoEn: true,
  rol: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async listar(paginacion: PaginacionDto) {
    const [datos, total] = await Promise.all([
      this.prisma.usuario.findMany({
        select: PROYECCION,
        orderBy: { creadoEn: 'desc' },
        skip: paginacion.skip,
        take: paginacion.take,
      }),
      this.prisma.usuario.count(),
    ]);
    return { datos, paginacion: { ...paginacion, total, paginas: Math.ceil(total / paginacion.porPagina) } };
  }

  async obtener(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: PROYECCION });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async crear(dto: CrearUsuarioDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.usuario.findUnique({ where: { email } })) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
    const rol = await this.prisma.rol.findUnique({ where: { id: dto.rolId } });
    if (!rol) throw new BadRequestException('El rol indicado no existe');

    return this.prisma.usuario.create({
      data: { nombre: dto.nombre, email, rolId: dto.rolId, passwordHash: await this.hash(dto.password) },
      select: PROYECCION,
    });
  }

  /**
   * Actualiza un usuario. Reglas de la matriz (doc 06 §3.4):
   * un administrador **no** puede cambiar su propio rol (evita auto-elevación)
   * ni desactivarse a sí mismo.
   */
  async actualizar(id: string, dto: ActualizarUsuarioDto, solicitanteId: string) {
    await this.obtener(id);

    if (id === solicitanteId) {
      if (dto.rolId) throw new ForbiddenException('No puede modificar su propio rol');
      if (dto.activo === false) throw new ForbiddenException('No puede desactivar su propio usuario');
    }
    if (dto.rolId && !(await this.prisma.rol.findUnique({ where: { id: dto.rolId } }))) {
      throw new BadRequestException('El rol indicado no existe');
    }
    if (dto.email) {
      const email = dto.email.toLowerCase();
      const existente = await this.prisma.usuario.findUnique({ where: { email } });
      if (existente && existente.id !== id) throw new ConflictException('El correo ya está en uso');
      dto = { ...dto, email };
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        email: dto.email,
        rolId: dto.rolId,
        activo: dto.activo,
        passwordHash: dto.password ? await this.hash(dto.password) : undefined,
      },
      select: PROYECCION,
    });
  }

  /** Borrado lógico (RF15/RF04) y revocación de sesiones. */
  async desactivar(id: string, solicitanteId: string) {
    if (id === solicitanteId) throw new ForbiddenException('No puede eliminar su propio usuario');
    await this.obtener(id);
    const [usuario] = await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id }, data: { activo: false }, select: PROYECCION }),
      this.prisma.refreshToken.updateMany({ where: { usuarioId: id, revocadoEn: null }, data: { revocadoEn: new Date() } }),
    ]);
    return usuario;
  }

  private hash(password: string): Promise<string> {
    return bcrypt.hash(password, Number(this.config.get<string>('BCRYPT_COST') ?? 12));
  }
}
