import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';

class FiltrarAuditoriaDto extends PaginacionDto {
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}

@ApiTags('Auditoría')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequierePermiso('auditoria:leer')
  @ApiOperation({ summary: 'Bitácora de acciones mutables (solo Administrador)' })
  @ApiQuery({ name: 'usuarioId', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  async listar(@Query() filtros: FiltrarAuditoriaDto) {
    const where = {
      ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
      ...(filtros.desde || filtros.hasta
        ? {
            ocurridoEn: {
              ...(filtros.desde ? { gte: new Date(filtros.desde) } : {}),
              ...(filtros.hasta ? { lte: new Date(filtros.hasta) } : {}),
            },
          }
        : {}),
    };

    const [datos, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        select: {
          id: true,
          accion: true,
          entidad: true,
          entidadId: true,
          ip: true,
          ocurridoEn: true,
          usuario: { select: { id: true, nombre: true, email: true } },
        },
        orderBy: { ocurridoEn: 'desc' },
        skip: filtros.skip,
        take: filtros.take,
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return {
      // `id` es BigInt en la base: se serializa como cadena para no romper JSON.
      datos: datos.map((fila) => ({ ...fila, id: fila.id.toString() })),
      paginacion: { pagina: filtros.pagina, porPagina: filtros.porPagina, total, paginas: Math.ceil(total / filtros.porPagina) },
    };
  }
}
