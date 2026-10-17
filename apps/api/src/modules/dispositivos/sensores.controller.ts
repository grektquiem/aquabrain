import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';
import { ListarDispositivosDto } from './dto/dispositivo.dto';

/** Catálogo de sensores (RF05). Permite filtrar por sistema para el dashboard. */
@ApiTags('Sensores')
@ApiBearerAuth()
@Controller('sensores')
export class SensoresController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequierePermiso('sensor:leer')
  @ApiOperation({ summary: 'Lista los sensores con su último valor conocido' })
  listar(@Query() filtro: ListarDispositivosDto) {
    const sistemaId = filtro.sistemaId;
    return this.prisma.sensor.findMany({
      where: sistemaId ? { dispositivo: { sistemaId } } : {},
      select: {
        id: true,
        codigo: true,
        nombre: true,
        unidad: true,
        rangoMin: true,
        rangoMax: true,
        activo: true,
        tipoVariable: { select: { codigo: true, nombre: true, origenDato: true } },
        dispositivo: { select: { id: true, codigo: true, estadoConexion: true } },
        estadoActual: { select: { valor: true, valorTexto: true, unidad: true, timestamp: true } },
      },
      orderBy: [{ dispositivo: { codigo: 'asc' } }, { codigo: 'asc' }],
    });
  }

  @Get(':id')
  @RequierePermiso('sensor:leer')
  @ApiOperation({ summary: 'Detalle de un sensor' })
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.sensor.findUnique({
      where: { id },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        unidad: true,
        rangoMin: true,
        rangoMax: true,
        ubicacionFisica: true,
        activo: true,
        dispositivo: { select: { id: true, codigo: true, estadoConexion: true } },
        tipoVariable: { select: { codigo: true, nombre: true, origenDato: true } },
        estadoActual: true,
      },
    });
  }
}
