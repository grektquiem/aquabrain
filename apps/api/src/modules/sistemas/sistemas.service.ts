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

  /**
   * Eliminación híbrida (RF04·RN-04):
   *  - Sin nada vinculado (dispositivos, cultivos, alertas, eventos) → borrado físico.
   *  - Con vínculos → borrado lógico (estado INACTIVO), preservando el histórico.
   *
   * Todas las FK hacia `sistema` son `onDelete: Restrict`, así que la propia base
   * decide de forma atómica: si el DELETE viola una FK (P2003) se desactiva.
   * Evita la carrera de "contar dependencias y luego borrar".
   */
  async eliminar(id: string) {
    await this.obtener(id);
    try {
      const borrado = await this.prisma.sistema.delete({ where: { id }, select: PROYECCION });
      return { ...borrado, eliminado: true as const };
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003')) throw e;
      const desactivado = await this.prisma.sistema.update({
        where: { id },
        data: { estado: 'INACTIVO' },
        select: PROYECCION,
      });
      return { ...desactivado, eliminado: false as const };
    }
  }
}

