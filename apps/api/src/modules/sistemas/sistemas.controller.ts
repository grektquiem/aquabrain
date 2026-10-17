import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SistemasService } from './sistemas.service';
import { ActualizarSistemaDto, CrearSistemaDto } from './dto/sistema.dto';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';

@ApiTags('Sistemas')
@ApiBearerAuth()
@Controller('sistemas')
export class SistemasController {
  constructor(private readonly sistemas: SistemasService) {}

  @Get()
  @RequierePermiso('sistema:leer')
  @ApiOperation({ summary: 'Lista los sistemas (instalaciones)' })
  @ApiQuery({ name: 'incluirInactivos', required: false, type: Boolean })
  listar(@Query('incluirInactivos') incluirInactivos?: string) {
    return this.sistemas.listar(incluirInactivos === 'true');
  }

  @Get(':id')
  @RequierePermiso('sistema:leer')
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.sistemas.obtener(id);
  }

  @Post()
  @RequierePermiso('sistema:escribir')
  crear(@Body() dto: CrearSistemaDto) {
    return this.sistemas.crear(dto);
  }

  @Patch(':id')
  @RequierePermiso('sistema:escribir')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarSistemaDto) {
    return this.sistemas.actualizar(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('sistema:escribir')
  @ApiOperation({ summary: 'Desactiva el sistema (borrado lógico)' })
  desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sistemas.desactivar(id);
  }
}
