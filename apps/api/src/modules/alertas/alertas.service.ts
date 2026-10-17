import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FiltrarAlertasDto, ResolverAlertaDto } from './dto/alerta.dto';

const PROYECCION = {
  id: true,
  tipo: true,
  severidad: true,
  estado: true,
  mensaje: true,
  valorDetectado: true,
  umbralAplicado: true,
  creadaEn: true,
  resueltaEn: true,
  comentarioResolucion: true,
  sensor: { select: { id: true, codigo: true, nombre: true, unidad: true } },
  sistema: { select: { id: true, codigo: true, nombre: true } },
  regla: { select: { id: true, nombre: true } },
  usuarioResuelve: { select: { id: true, nombre: true } },
} as const;

@Injectable()
export class AlertasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrarAlertasDto) {
    const where: Prisma.AlertaWhereInput = {
      ...(filtros.estado ? { estado: filtros.estado } : {}),
      ...(filtros.severidad ? { severidad: filtros.severidad } : {}),
      ...(filtros.sistemaId ? { sistemaId: filtros.sistemaId } : {}),
    };

    const [datos, total] = await Promise.all([
      this.prisma.alerta.findMany({
        where,
        select: PROYECCION,
        orderBy: [{ estado: 'asc' }, { creadaEn: 'desc' }],
        skip: filtros.skip,
        take: filtros.take,
      }),
      this.prisma.alerta.count({ where }),
    ]);

    return {
      datos,
      paginacion: { pagina: filtros.pagina, porPagina: filtros.porPagina, total, paginas: Math.ceil(total / filtros.porPagina) },
    };
  }

  async obtener(id: string) {
    const alerta = await this.prisma.alerta.findUnique({ where: { id }, select: PROYECCION });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    return alerta;
  }

  /** `POST /alertas/{id}/resolver` registra usuario y hora (doc 06 §3.4). */
  async resolver(id: string, usuarioId: string, dto: ResolverAlertaDto) {
    const alerta = await this.prisma.alerta.findUnique({ where: { id } });
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    if (alerta.estado === 'RESUELTA') {
      return this.obtener(id);
    }
    return this.prisma.alerta.update({
      where: { id },
      data: {
        estado: 'RESUELTA',
        resueltaPor: usuarioId,
        resueltaEn: new Date(),
        comentarioResolucion: dto.comentario?.slice(0, 500) ?? null,
      },
      select: PROYECCION,
    });
  }

  /** Conteo por severidad para el panel (RF07). */
  async resumen(sistemaId?: string) {
    const grupo = await this.prisma.alerta.groupBy({
      by: ['severidad', 'estado'],
      where: sistemaId ? { sistemaId } : {},
      _count: { _all: true },
    });
    return grupo.map((g) => ({ severidad: g.severidad, estado: g.estado, total: g._count._all }));
  }
}
