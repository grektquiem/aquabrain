import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlertasService } from './alertas.service';
import { FiltrarAlertasDto, ResolverAlertaDto } from './dto/alerta.dto';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';

@ApiTags('Alertas')
@ApiBearerAuth()
@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertas: AlertasService) {}

  @Get()
  @RequierePermiso('alerta:leer')
  @ApiOperation({ summary: 'Lista paginada de alertas (filtros: estado, severidad, sistema)' })
  listar(@Query() filtros: FiltrarAlertasDto) {
    return this.alertas.listar(filtros);
  }

  @Get('resumen')
  @RequierePermiso('alerta:leer')
  resumen(@Query('sistemaId') sistemaId?: string) {
    return this.alertas.resumen(sistemaId);
  }

  @Get(':id')
  @RequierePermiso('alerta:leer')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertas.obtener(id);
  }

  @Post(':id/resolver')
  @HttpCode(200)
  @RequierePermiso('alerta:resolver')
  @ApiOperation({ summary: 'Registra la resolución con usuario y hora' })
  resolver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolverAlertaDto,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.alertas.resolver(id, usuarioId, dto);
  }
}
