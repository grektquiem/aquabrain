import { Body, Controller, Get, HttpCode, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MedicionesService } from './mediciones.service';
import { BulkMedicionesDto, ConsultarSerieDto, CrearMedicionDto } from './dto/medicion.dto';
import { Publico } from '../../common/decorators/publico.decorator';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';
import { DispositivoActual } from '../../common/decorators/dispositivo-actual.decorator';
import { DispositivoAutenticado, DispositivoGuard } from '../../common/guards/dispositivo.guard';

@ApiTags('Mediciones')
@Controller('mediciones')
export class MedicionesController {
  constructor(private readonly mediciones: MedicionesService) {}

  @Publico()
  @UseGuards(DispositivoGuard)
  @Post()
  @ApiHeader({ name: 'X-Device-Key', required: true })
  @ApiHeader({ name: 'X-Device-Code', required: true, description: 'Ej. DEV-01' })
  @ApiOperation({ summary: 'Ingesta de una medición (identidad de dispositivo)' })
  ingerir(@DispositivoActual() dispositivo: DispositivoAutenticado, @Body() dto: CrearMedicionDto) {
    return this.mediciones.ingerir(dispositivo, dto);
  }

  @Publico()
  @UseGuards(DispositivoGuard)
  @Post('bulk')
  @HttpCode(207)
  @ApiHeader({ name: 'X-Device-Key', required: true })
  @ApiHeader({ name: 'X-Device-Code', required: true })
  @ApiOperation({ summary: 'Sincronización de hasta 500 mediciones almacenadas offline (207 Multi-Status)' })
  ingerirBulk(@DispositivoActual() dispositivo: DispositivoAutenticado, @Body() dto: BulkMedicionesDto) {
    return this.mediciones.ingerirBulk(dispositivo, dto);
  }

  @Get('exportar.csv')
  @RequierePermiso('medicion:leer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exporta a CSV las mediciones del rango consultado (HU02)' })
  async exportar(@Query() consulta: ConsultarSerieDto, @Res() res: Response) {
    const csv = await this.mediciones.exportarCsv(consulta);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mediciones.csv"');
    // BOM para que Excel respete los acentos.
    res.send('\uFEFF' + csv);
  }

  @Get('serie')
  @RequierePermiso('medicion:leer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Serie temporal agregada (máx. 90 días por consulta)' })
  serie(@Query() consulta: ConsultarSerieDto) {
    return this.mediciones.serie(consulta);
  }

  @Get('ultimas')
  @RequierePermiso('medicion:leer')
  @ApiBearerAuth()
  @ApiQuery({ name: 'sistemaId', required: false })
  @ApiOperation({ summary: 'Último valor conocido por sensor' })
  ultimas(@Query('sistemaId') sistemaId?: string) {
    return this.mediciones.ultimas(sistemaId);
  }
}
