import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActualizarSistemaDto, CrearSistemaDto } from './dto/sistema.dto';

/** Proyección pública: nunca se devuelve la entidad completa por accidente (EC-07). */
const PROYECCION = {
  id: true,
  codigo: true,
  nombre: true,
  descripcion: true,
  ubicacion: true,
  latitud: true,
  longitud: true,
  estado: true,
  creadoEn: true,
  actualizadoEn: true,
} satisfies Prisma.SistemaSelect;

@Injectable()
export class SistemasService {
  constructor(private readonly prisma: PrismaService) {}

  listar(incluirInactivos = false) {
    return this.prisma.sistema.findMany({
      where: incluirInactivos ? {} : { estado: { not: 'INACTIVO' } },
      select: {
        ...PROYECCION,
        _count: { select: { dispositivos: true, cultivos: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async obtener(id: string) {
    const sistema = await this.prisma.sistema.findUnique({
      where: { id },
      select: {
        ...PROYECCION,
        dispositivos: {
          select: { id: true, codigo: true, estadoConexion: true, firmware: true },
          orderBy: { codigo: 'asc' },
        },
        cultivos: { select: { id: true, nombre: true, especie: true, estado: true } },
      },
    });
    if (!sistema) throw new NotFoundException('Sistema no encontrado');
    return sistema;
  }

  crear(dto: CrearSistemaDto) {
    return this.prisma.sistema.create({ data: dto, select: PROYECCION });
  }

  async actualizar(id: string, dto: ActualizarSistemaDto) {
    await this.obtener(id);
    return this.prisma.sistema.update({ where: { id }, data: dto, select: PROYECCION });
  }

  /** Borrado lógico (RF04·RN-04): un sistema con histórico no se elimina físicamente. */
  async desactivar(id: string) {
    await this.obtener(id);
    return this.prisma.sistema.update({
      where: { id },
      data: { estado: 'INACTIVO' },
      select: PROYECCION,
    });
  }
}

