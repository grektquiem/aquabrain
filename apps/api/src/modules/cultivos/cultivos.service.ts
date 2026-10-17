import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActualizarCultivoDto, CrearCultivoDto } from './dto/cultivo.dto';

const PROYECCION = {
  id: true,
  nombre: true,
  especie: true,
  variedad: true,
  fechaInicio: true,
  fechaFinEstimada: true,
  estado: true,
  fotoperiodoHoras: true,
  creadoEn: true,
  sistema: { select: { id: true, codigo: true, nombre: true } },
} satisfies Prisma.CultivoSelect;

@Injectable()
export class CultivosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(sistemaId?: string, estado?: string) {
    return this.prisma.cultivo.findMany({
      where: { ...(sistemaId ? { sistemaId } : {}), ...(estado ? { estado: estado as never } : {}) },
      select: { ...PROYECCION, _count: { select: { plantas: true } } },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async obtener(id: string) {
    const cultivo = await this.prisma.cultivo.findUnique({
      where: { id },
      select: {
        ...PROYECCION,
        plantas: { select: { id: true, codigo: true, posicion: true, estado: true } },
        cultivoSensores: { select: { sensor: { select: { id: true, codigo: true, nombre: true, unidad: true } } } },
      },
    });
    if (!cultivo) throw new NotFoundException('Cultivo no encontrado');
    return cultivo;
  }

  crear(dto: CrearCultivoDto) {
    const { fechaInicio, fechaFinEstimada, fotoperiodoHoras, ...resto } = dto;
    if (fechaFinEstimada && new Date(fechaFinEstimada) < new Date(fechaInicio)) {
      throw new BadRequestException('La fecha de término no puede ser anterior al inicio');
    }
    return this.prisma.cultivo.create({
      data: {
        ...resto,
        fechaInicio: new Date(fechaInicio),
        fechaFinEstimada: fechaFinEstimada ? new Date(fechaFinEstimada) : null,
        fotoperiodoHoras: fotoperiodoHoras ?? null,
      },
      select: PROYECCION,
    });
  }

  async actualizar(id: string, dto: ActualizarCultivoDto) {
    await this.obtener(id);
    const { fechaInicio, fechaFinEstimada, fotoperiodoHoras, ...resto } = dto;
    return this.prisma.cultivo.update({
      where: { id },
      data: {
        ...resto,
        ...(fechaInicio ? { fechaInicio: new Date(fechaInicio) } : {}),
        ...(fechaFinEstimada ? { fechaFinEstimada: new Date(fechaFinEstimada) } : {}),
        ...(fotoperiodoHoras !== undefined ? { fotoperiodoHoras } : {}),
      },
      select: PROYECCION,
    });
  }

  async cerrar(id: string) {
    await this.obtener(id);
    return this.prisma.cultivo.update({ where: { id }, data: { estado: 'CERRADO' }, select: PROYECCION });
  }
}
